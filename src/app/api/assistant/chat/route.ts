import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { loadAssistantContext, formatAssistantContext } from '@/lib/assistant/context';
import { normalizeAssistantActions, type AssistantAction } from '@/lib/assistant/actions';
import { normalizeMemorySensitivity, normalizeMemoryStatus, normalizeMemoryType, shouldAutoApproveMemory, type AssistantMemoryCandidate } from '@/lib/assistant/memory';
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

type AssistantModelResult = {
  reply: string;
  actions: AssistantAction[];
  memoryUpdates: AssistantMemoryCandidate[];
  conversationSummary?: string;
  vaultDrafts: Array<{ title: string; folder?: string; content: string; reason?: string }>;
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
  return `APP SNAPSHOT FROM DASHBOARD\n${JSON.stringify(snapshot, null, 2).slice(0, 12000)}\n\nPersistence note: Firebase Admin is unavailable, so long-term memory, vault index, and saved chat history are not active for this request.`;
}

const ACTION_OUTPUT_RULES = `
Return ONLY valid JSON with this shape:
{
  "reply": "natural message to Daniel",
  "actions": [],
  "memoryUpdates": [],
  "conversationSummary": "updated short summary of important ongoing context",
  "vaultDrafts": []
}

Allowed app actions:
- complete_habit: { type, label, habitId, habitName, done }
- add_goal_milestone: { type, label, goalId, goalTitle, text }
- complete_goal_milestone: { type, label, goalId, goalTitle, milestoneId, milestoneText, done }
- create_goal: { type, label, title, goalType: "short"|"long", priority: "high"|"medium"|"low", deadline?, description?, milestones? }

Allowed memory fields:
- memoryUpdates: 0-5 structured durable memory candidates. Shape: { text, type, sensitivity, tags, reason, status? }.
  - type must be one of: goal, project, school, money, fitness, business, preference, pattern, lesson, open_loop, vault, system.
  - sensitivity must be low, medium, or high.
  - status may be pending or approved. Use approved only for low-risk, clearly durable operating context. Use pending for important, sensitive, uncertain, or personal context.
- conversationSummary: an updated running summary, max 900 characters. Preserve important prior context and add the newest useful context.
- vaultDrafts: 0-3 proposed Obsidian notes when Daniel explicitly asks to add/save something to the vault. Shape: { title, folder, content, reason }. These are queued for review; do not claim they were written to Obsidian.

Rules:
- Only propose actions when Daniel clearly asks to update something or reports completed work that maps to visible app data.
- Treat phrases like 'I worked out', 'I workouted', 'I lifted', 'I went to the gym', or 'I trained' as a request to complete the matching fitness/workout habit if exactly one visible habit clearly matches.
- Use exact habitId/goalId/milestoneId from the app snapshot when updating existing items.
- Do not invent IDs for existing habits/goals/milestones.
- Clear habit completions may be auto-applied by the app. Goal edits and new goals still require Daniel's approval.
- If you say you will log/mark/update something, include the matching action in the same JSON response.
- Do not say an app action or vault write has already been applied unless the app confirms it.
- If Daniel asks you to remember something, include it in memoryUpdates.
- Do not save low-quality, duplicate, temporary, or vague memories.
- If the memory could affect future decisions, identity, money, school, health, privacy, or long-term direction, set status pending so Daniel can review it.
- If Daniel asks to add something to the vault, create a vaultDraft instead of pretending to write directly to local Obsidian.
`;

function normalizeMemoryUpdates(value: unknown, limit = 5): AssistantMemoryCandidate[] {
  if (!Array.isArray(value)) return [];
  const candidates: AssistantMemoryCandidate[] = [];

  for (const raw of value) {
    if (typeof raw === 'string') {
      const text = raw.trim();
      if (text) candidates.push({ text, type: 'system', sensitivity: 'medium', tags: [], status: 'pending' });
    } else if (raw && typeof raw === 'object') {
      const item = raw as Record<string, unknown>;
      const text = typeof item.text === 'string'
        ? item.text.trim()
        : typeof item.summary === 'string'
          ? item.summary.trim()
          : '';
      if (!text) continue;
      candidates.push({
        text,
        type: normalizeMemoryType(item.type),
        sensitivity: normalizeMemorySensitivity(item.sensitivity),
        tags: Array.isArray(item.tags)
          ? item.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 8)
          : [],
        reason: typeof item.reason === 'string' ? item.reason.trim() : undefined,
        status: normalizeMemoryStatus(item.status),
      });
    }

    if (candidates.length >= limit) break;
  }

  return candidates;
}

function normalizeVaultDrafts(value: unknown): AssistantModelResult['vaultDrafts'] {
  if (!Array.isArray(value)) return [];
  const drafts: AssistantModelResult['vaultDrafts'] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const draft = raw as Record<string, unknown>;
    const title = typeof draft.title === 'string' ? draft.title.trim() : '';
    const content = typeof draft.content === 'string' ? draft.content.trim() : '';
    if (!title || !content) continue;
    drafts.push({
      title,
      folder: typeof draft.folder === 'string' ? draft.folder.trim() : undefined,
      content,
      reason: typeof draft.reason === 'string' ? draft.reason.trim() : undefined,
    });
    if (drafts.length >= 3) break;
  }

  return drafts;
}

async function callOpenAI(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<AssistantModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      reply: 'Assistant backend is wired, but OPENAI_API_KEY is not set yet. Add it in the server/Vercel environment before live chat works. done',
      actions: [],
      memoryUpdates: [],
      vaultDrafts: [],
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
      temperature: 0.32,
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
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      reply: String(parsed.reply ?? 'No response returned.'),
      actions: normalizeAssistantActions(parsed.actions),
      memoryUpdates: normalizeMemoryUpdates(parsed.memoryUpdates, 5),
      conversationSummary: typeof parsed.conversationSummary === 'string' ? parsed.conversationSummary.slice(0, 1200) : undefined,
      vaultDrafts: normalizeVaultDrafts(parsed.vaultDrafts),
    };
  } catch {
    return { reply: raw || 'No response returned.', actions: [], memoryUpdates: [], vaultDrafts: [] };
  }
}

async function saveAssistantState(uid: string, userMessage: string, result: AssistantModelResult) {
  const db = getAdminDb();
  const threadRef = db.collection('users').doc(uid).collection('assistantThreads').doc('default');
  await threadRef.set({
    updatedAt: FieldValue.serverTimestamp(),
    ...(result.conversationSummary ? { summary: result.conversationSummary } : {}),
  }, { merge: true });

  await threadRef.collection('messages').add({ role: 'user', content: userMessage, createdAt: FieldValue.serverTimestamp() });
  await threadRef.collection('messages').add({ role: 'assistant', content: result.reply, createdAt: FieldValue.serverTimestamp() });

  await Promise.all(result.memoryUpdates.map((candidate) => {
    const status = candidate.status === 'approved' || shouldAutoApproveMemory(candidate) ? 'approved' : 'pending';
    return db.collection('users').doc(uid).collection('assistantMemory').add({
      text: candidate.text,
      summary: candidate.text,
      type: candidate.type,
      status,
      sensitivity: candidate.sensitivity,
      tags: candidate.tags,
      reason: candidate.reason ?? '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      source: 'assistant-chat-memory-update',
    });
  }));

  await Promise.all(result.vaultDrafts.map((draft) =>
    db.collection('users').doc(uid).collection('assistantVaultInbox').add({
      ...draft,
      status: 'queued',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      source: 'assistant-chat-vault-draft',
    })
  ));
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

    const recentHistory = history.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const messages = [
      { role: 'system' as const, content: NOEN_PERSONALITY },
      { role: 'system' as const, content: ASSISTANT_MEMORY_RULES },
      { role: 'system' as const, content: ACTION_OUTPUT_RULES },
      { role: 'system' as const, content: contextText },
      ...recentHistory,
      { role: 'user' as const, content: message },
    ];

    const result = await callOpenAI(messages);

    if (persistenceEnabled) {
      try {
        await saveAssistantState(uid, message, result);
      } catch (e) {
        console.warn('[assistant/chat] Persistence skipped.', e);
      }
    }

    return NextResponse.json({
      reply: result.reply,
      actions: result.actions,
      persistenceEnabled,
      memoryUpdates: result.memoryUpdates.length,
      vaultDraftsQueued: persistenceEnabled ? result.vaultDrafts.length : 0,
    });
  } catch (e) {
    console.error('[assistant/chat]', e);
    const message = e instanceof Error ? e.message : 'Assistant request failed.';
    const status = message.includes('private') || message.includes('auth') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
