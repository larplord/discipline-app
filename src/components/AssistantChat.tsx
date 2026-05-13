'use client';

import { useMemo, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const STARTER_PROMPTS = [
  'Based on my app data, what should I do next?',
  'What am I avoiding right now?',
  'Give me a simple plan for the next 2 hours.',
];

export function AssistantChat({ mode = 'full' }: { mode?: 'full' | 'dashboard' }) {
  const { habits, dayLog, focusToday, goals, journal, identityProfile } = useUserData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'I’m on the dashboard now. Ask me what to do next and I’ll use your Command Center data as context.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedHabits = useMemo(() => habits.filter((h) => dayLog[h.id]).length, [habits, dayLog]);
  const compact = mode === 'dashboard';

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Assistant request failed.');
      setMessages((current) => [...current, { role: 'assistant', content: String(data.reply ?? '') }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Assistant request failed.';
      setError(message);
      setMessages((current) => [...current, { role: 'assistant', content: `Setup issue: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`assistant-chat-card ${compact ? 'assistant-chat-dashboard' : ''}`}>
      <div className="assistant-chat-header">
        <div>
          <span>Private Daniel-only assistant</span>
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
