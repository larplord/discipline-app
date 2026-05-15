'use client';

import { useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import type { AssistantAction } from '@/lib/assistant/actions';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
};

const STARTER_PROMPTS = [
  'Based on my app data, what should I do next?',
  'What am I avoiding right now?',
  'Give me a simple plan for the next 2 hours.',
];

export function AssistantChat({ mode = 'full' }: { mode?: 'full' | 'dashboard' }) {
  const { uid, habits, dayLog, focusToday, goals, journal, identityProfile } = useUserData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'I’m on the dashboard now. Ask me what to do next and I’ll use your Command Center data as context.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedActions, setAppliedActions] = useState<Record<string, string>>({});

  const completedHabits = useMemo(() => habits.filter((h) => dayLog[h.id]).length, [habits, dayLog]);
  const compact = mode === 'dashboard';

  function inferLocalHabitActions(text: string): AssistantAction[] {
    const normalized = text.toLowerCase();
    const completionWords = ['i did', 'i finished', 'i completed', 'i wrote', 'i made', 'i worked on', 'i studied', 'done', 'finished'];
    const looksLikeCompletion = completionWords.some((word) => normalized.includes(word));
    const keywordGroups = [
      { words: ['workout', 'worked out', 'workouted', 'gym', 'lift', 'lifted', 'training', 'trained'], categories: ['fitness'] },
      { words: ['notes', 'note', 'math', 'studied', 'study', 'page of notes'], categories: ['learning'] },
      { words: ['journal', 'debrief', 'reflected', 'reflection'], categories: ['mindset'] },
      { words: ['read', 'reading', 'book'], categories: ['learning'] },
      { words: ['business', 'research', 'product', 'content'], categories: ['business'] },
    ];

    const scored = habits
      .filter((habit) => !dayLog[habit.id])
      .map((habit) => {
        const name = habit.name.toLowerCase();
        const nameTokens = name.split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
        let score = nameTokens.filter((token) => normalized.includes(token)).length * 3;

        for (const group of keywordGroups) {
          const groupHit = group.words.some((word) => normalized.includes(word));
          if (!groupHit) continue;
          if (group.categories.includes(habit.category)) score += 2;
          if (group.words.some((word) => name.includes(word))) score += 4;
        }

        return { habit, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!looksLikeCompletion && scored[0]?.score < 4) return [];
    if (scored.length === 0) return [];
    if (scored.length > 1 && scored[0].score === scored[1].score) return [];

    const habit = scored[0].habit;
    return [
      {
        id: `local-complete-${habit.id}-${Date.now()}`,
        type: 'complete_habit',
        label: `Mark ${habit.name} complete`,
        habitId: habit.id,
        habitName: habit.name,
        done: true,
      },
    ];
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setError(null);
    setInput('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setBusy(true);

    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      if (!token) throw new Error('You must be signed in.');

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-12),
          appSnapshot: {
            habits: habits.map((habit) => ({
              id: habit.id,
              name: habit.name,
              category: habit.category,
              doneToday: !!dayLog[habit.id],
            })),
            focusToday,
            goals: goals.map((goal) => ({
              id: goal.id,
              title: goal.title,
              priority: goal.priority,
              deadline: goal.deadline,
              milestones: goal.milestones?.map((milestone) => ({ id: milestone.id, text: milestone.text, done: milestone.done })),
            })),
            journal,
            identityProfile,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Assistant request failed.');
      const modelActions = Array.isArray(data.actions) ? (data.actions as AssistantAction[]) : [];
      const fallbackActions = modelActions.length === 0 ? inferLocalHabitActions(text) : [];
      const actions = [...modelActions, ...fallbackActions];
      const autoActions = actions.filter((action): action is Extract<AssistantAction, { type: 'complete_habit' }> => action.type === 'complete_habit' && action.done);
      const manualActions = actions.filter((action) => !(action.type === 'complete_habit' && action.done));
      await Promise.all(autoActions.map((action) => applyAction(action)));
      const autoLabels = autoActions.map((action) => action.habitName ?? 'habit').join(', ');
      const reply = String(data.reply ?? '');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: autoActions.length > 0
            ? `Logged it: ${autoLabels} marked complete. Nice work. done`
            : fallbackActions.length > 0 && !reply.toLowerCase().includes('mark')
              ? `${reply}

I found one likely matching fitness habit. Use the button below to mark it complete.`
              : reply,
          actions: manualActions,
        },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Assistant request failed.';
      setError(message);
      setMessages((current) => [...current, { role: 'assistant', content: `Setup issue: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }


  async function applyAction(action: AssistantAction) {
    setAppliedActions((current) => ({ ...current, [action.id]: 'Applying…' }));
    try {
      const db = getFirestoreDb();

      if (action.type === 'complete_habit') {
        const t = todayKey();
        const ref = doc(db, 'users', uid, 'habitLogs', t);
        const snap = await getDoc(ref);
        const prev = (snap.data()?.entries as Record<string, boolean>) ?? {};
        await setDoc(ref, { entries: { ...prev, [action.habitId]: action.done } }, { merge: true });
      }

      if (action.type === 'add_goal_milestone') {
        const goal = goals.find((g) => g.id === action.goalId);
        if (!goal) throw new Error('Goal no longer exists.');
        const milestones = [
          ...(goal.milestones ?? []),
          { id: crypto.randomUUID().slice(0, 8), text: action.text, done: false },
        ];
        await updateDoc(doc(db, 'users', uid, 'goals', action.goalId), { milestones });
      }

      if (action.type === 'complete_goal_milestone') {
        const goal = goals.find((g) => g.id === action.goalId);
        if (!goal) throw new Error('Goal no longer exists.');
        const milestones = (goal.milestones ?? []).map((milestone) =>
          milestone.id === action.milestoneId ? { ...milestone, done: action.done } : milestone
        );
        await updateDoc(doc(db, 'users', uid, 'goals', action.goalId), { milestones });
      }

      if (action.type === 'create_goal') {
        await addDoc(collection(db, 'users', uid, 'goals'), {
          title: action.title,
          type: action.goalType,
          priority: action.priority,
          deadline: action.deadline ?? '',
          description: action.description ?? '',
          milestones: (action.milestones ?? []).map((text) => ({ id: crypto.randomUUID().slice(0, 8), text, done: false })),
        });
      }

      setAppliedActions((current) => ({ ...current, [action.id]: 'Applied' }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not apply action.';
      setAppliedActions((current) => ({ ...current, [action.id]: message }));
    }
  }

  return (
    <section className={`assistant-chat-card ${compact ? 'assistant-chat-dashboard' : ''}`}>
      <div className="assistant-chat-header">
        <div>
          <span>Noen online</span>
          <h2>{compact ? 'Noen Command Chat' : 'Ask Noen'}</h2>
        </div>
        <span className="assistant-status">Context online</span>
      </div>

      {!compact && (
        <div className="assistant-inline-context">
          <ContextStat label="Habits" value={`${completedHabits}/${habits.length}`} />
          <ContextStat label="Focus today" value={focusToday} />
          <ContextStat label="Goals" value={goals.length} />
          <ContextStat label="XP" value={Math.round(identityProfile.totalScore ?? 0)} />
        </div>
      )}

      {compact && (
        <div className="assistant-dashboard-snapshot">
          <span>{completedHabits}/{habits.length} habits</span>
          <span>{focusToday} focus</span>
          <span>{goals.length} goals</span>
          <span>{Math.round(identityProfile.totalScore ?? 0)} XP</span>
        </div>
      )}

      <div className="assistant-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
            <span>{message.role === 'assistant' ? 'Noen' : 'Daniel'}</span>
            <p>{message.content}</p>
            {message.actions && message.actions.length > 0 && (
              <div className="assistant-action-list">
                {message.actions.map((action) => (
                  <div key={action.id} className="assistant-action-card">
                    <span>{action.label}</span>
                    <button
                      type="button"
                      onClick={() => void applyAction(action)}
                      disabled={!!appliedActions[action.id]}
                    >
                      {appliedActions[action.id] ?? 'Apply'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="assistant-message assistant"><span>Noen</span><p>Thinking…</p></div>}
      </div>

      {error && <div className="assistant-error">{error}</div>}

      <div className="assistant-starters">
        {STARTER_PROMPTS.slice(0, compact ? 2 : 3).map((prompt) => (
          <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={busy}>
            {prompt}
          </button>
        ))}
      </div>

      <form className="assistant-input-row" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Noen what to do next..."
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>{busy ? 'Sending' : 'Send'}</button>
      </form>

      {!compact && (
        <div className="assistant-memory-card assistant-page-memory-note">
          <span>Today journal signal</span>
          <p>{journal?.freeform || journal?.oneMove || 'No journal context yet today.'}</p>
        </div>
      )}
    </section>
  );
}

function ContextStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="assistant-context-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
