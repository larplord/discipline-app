import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { loadAssistantContext, formatAssistantContext } from '@/lib/assistant/context';
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

async function callOpenAI(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return 'Assistant backend is wired, but OPENAI_API_KEY is not set yet. Add it in the server/Vercel environment before live chat works. done';
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
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  return String(data.choices?.[0]?.message?.content ?? 'No response returned.');
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
      { role: 'system' as const, content: contextText },
      ...recentHistory,
      { role: 'user' as const, content: message },
    ];

    const reply = await callOpenAI(messages);

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

    return NextResponse.json({ reply, persistenceEnabled });
  } catch (e) {
    console.error('[assistant/chat]', e);
    const message = e instanceof Error ? e.message : 'Assistant request failed.';
    const status = message.includes('private') || message.includes('auth') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
