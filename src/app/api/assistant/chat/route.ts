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

function getAllowedEmails() {
  return (process.env.ASSISTANT_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ASSISTANT_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyRequest(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (!token) throw new Error('Missing auth token.');

  const decoded = await getAdminAuth().verifyIdToken(token);
  const allowedEmails = getAllowedEmails();
  const email = String(decoded.email ?? '').toLowerCase();
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    throw new Error('This assistant is private.');
  }
  return decoded;
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
  try {
    const decoded = await verifyRequest(req);
    const uid = decoded.uid;
    const body = await req.json();
    const message = String(body.message ?? '').trim();
    const history = (Array.isArray(body.history) ? body.history : []) as ChatMessage[];

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const contextBundle = await loadAssistantContext(uid);
    const contextText = formatAssistantContext(contextBundle);
    const recentHistory = history.slice(-12).map((m) => ({ role: m.role, content: m.content }));

    const messages = [
      { role: 'system' as const, content: NOEN_PERSONALITY },
      { role: 'system' as const, content: ASSISTANT_MEMORY_RULES },
      { role: 'system' as const, content: contextText },
      ...recentHistory,
      { role: 'user' as const, content: message },
    ];

    const reply = await callOpenAI(messages);

    const threadRef = getAdminDb().collection('users').doc(uid).collection('assistantThreads').doc('default');
    await threadRef.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await threadRef.collection('messages').add({ role: 'user', content: message, createdAt: FieldValue.serverTimestamp() });
    await threadRef.collection('messages').add({ role: 'assistant', content: reply, createdAt: FieldValue.serverTimestamp() });
    await maybeSaveMemory(uid, message, reply);

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('[assistant/chat]', e);
    const message = e instanceof Error ? e.message : 'Assistant request failed.';
    const status = message.includes('private') || message.includes('auth') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
