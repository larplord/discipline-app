import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { loadAssistantContext, formatAssistantContext } from '@/lib/assistant/context';
import { normalizeAssistantActions } from '@/lib/assistant/actions';
import { ASSISTANT_MEMORY_RULES, NOEN_PERSONALITY } from '@/lib/assistant/personality';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type VerifiedUser = {
  uid: string;
  email?: string;
};

function getAllowedEmails() {
  return (process.env.ASSISTANT_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ASSISTANT_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyWithFirebaseRest(token: string): Promise<VerifiedUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Firebase API key is missing.');

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) throw new Error('Invalid Firebase auth token.');
  const data = await res.json();
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Invalid Firebase auth token.');
  return { uid: String(user.localId), email: user.email ? String(user.email) : undefined };
}

async function verifyRequest(req: Request): Promise<VerifiedUser> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (!token) throw new Error('Missing auth token.');

  let verified: VerifiedUser;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    verified = { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    console.warn('[assistant/chat] Firebase Admin auth unavailable, using REST auth fallback.', e);
    verified = await verifyWithFirebaseRest(token);
  }

  const allowedEmails = getAllowedEmails();
  const email = String(verified.email ?? '').toLowerCase();
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    throw new Error('This assistant is private.');
  }
  return verified;
}

function formatClientSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object') return 'APP SNAPSHOT\nNo app snapshot available.';
  return `APP SNAPSHOT FROM DASHBOARD\n${JSON.stringify(snapshot, null, 2).slice(0, 12000)}`;
}

const ACTION_OUTPUT_RULES = `
You may propose app updates using actions. Return ONLY valid JSON with this shape:
{
  "reply": "natural message to Daniel",
  "actions": []
}

Allowed actions:
- complete_habit: { type, label, habitId, habitName, done }
- add_goal_milestone: { type, label, goalId, goalTitle, text }
- complete_goal_milestone: { type, label, goalId, goalTitle, milestoneId, milestoneText, done }
- create_goal: { type, label, title, goalType: "short"|"long", priority: "high"|"medium"|"low", deadline?, description?, milestones? }

Rules:
- Only propose actions when Daniel clearly asks to update something or reports completed work that maps to visible app data.
- Treat phrases like 'I worked out', 'I workouted', 'I lifted', 'I went to the gym', or 'I trained' as a request to complete the matching fitness/workout habit if exactly one visible habit clearly matches.
- Use exact habitId/goalId/milestoneId from the app snapshot when updating existing items.
- Do not invent IDs for existing habits/goals/milestones.
- Keep actions small and reviewable.
- Daniel will approve actions in the UI before they are applied.
`;

async function callOpenAI(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      reply: 'Assistant backend is wired, but OPENAI_API_KEY is not set yet. Add it in the server/Vercel environment before live chat works. done',
      actions: [],
    };
  }

  const model = process.env.ASSISTANT_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const raw = String(data.choices?.[0]?.message?.content ?? '{}');
  try {
    const parsed = JSON.parse(raw) as { reply?: unknown; actions?: unknown };
    return {
      reply: String(parsed.reply ?? 'No response returned.'),
      actions: normalizeAssistantActions(parsed.actions),
    };
  } catch {
    return { reply: raw || 'No response returned.', actions: [] };
  }
}

async function maybeSaveMemory(uid: string, userMessage: string, assistantReply: string) {
  const saveSignals = ['remember', 'decision', 'goal', 'rule', 'preference', 'from now on', 'mistake'];
  const combined = `${userMessage}\n${assistantReply}`.toLowerCase();
  if (!saveSignals.some((signal) => combined.includes(signal))) return;

  await getAdminDb().collection('users').doc(uid).collection('assistantMemory').add({
    summary: `User/assistant exchange may be memory-worthy: ${userMessage.slice(0, 300)} | ${assistantReply.slice(0, 300)}`,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    source: 'assistant-chat-auto-candidate',
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    const verified = await verifyRequest(req);
    const uid = verified.uid;
    body = await req.json();
    const message = String(body.message ?? '').trim();
    const history = (Array.isArray(body.history) ? body.history : []) as ChatMessage[];

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    let contextText: string;
    let persistenceEnabled = true;
    try {
      const contextBundle = await loadAssistantContext(uid);
      contextText = formatAssistantContext(contextBundle);
    } catch (e) {
      console.warn('[assistant/chat] Firebase Admin Firestore unavailable, using client snapshot fallback.', e);
      contextText = formatClientSnapshot(body.appSnapshot);
      persistenceEnabled = false;
    }

    const recentHistory = history.slice(-12).map((m) => ({ role: m.role, content: m.content }));

    const messages = [
      { role: 'system' as const, content: NOEN_PERSONALITY },
      { role: 'system' as const, content: ASSISTANT_MEMORY_RULES },
      { role: 'system' as const, content: ACTION_OUTPUT_RULES },
      { role: 'system' as const, content: contextText },
      ...recentHistory,
      { role: 'user' as const, content: message },
    ];

    const result = await callOpenAI(messages);
    const reply = result.reply;

    if (persistenceEnabled) {
      try {
        const threadRef = getAdminDb().collection('users').doc(uid).collection('assistantThreads').doc('default');
        await threadRef.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        await threadRef.collection('messages').add({ role: 'user', content: message, createdAt: FieldValue.serverTimestamp() });
        await threadRef.collection('messages').add({ role: 'assistant', content: reply, createdAt: FieldValue.serverTimestamp() });
        await maybeSaveMemory(uid, message, reply);
      } catch (e) {
        console.warn('[assistant/chat] Persistence skipped.', e);
      }
    }

    return NextResponse.json({ reply, actions: result.actions, persistenceEnabled });
  } catch (e) {
    console.error('[assistant/chat]', e);
    const message = e instanceof Error ? e.message : 'Assistant request failed.';
    const status = message.includes('private') || message.includes('auth') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
