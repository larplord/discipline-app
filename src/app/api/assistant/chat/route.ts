import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { assistantErrorStatus, verifyAssistantRequest } from '@/lib/assistant/auth';
import { loadAssistantContext, formatAssistantContext } from '@/lib/assistant/context';
import { loadLocalArchiveContext, formatLocalArchiveContext } from '@/lib/assistant/localArchive';
import { normalizeAssistantActions, type AssistantAction } from '@/lib/assistant/actions';
import { normalizeMemorySensitivity, normalizeMemoryStatus, normalizeMemoryType, type AssistantMemoryCandidate } from '@/lib/assistant/memory';
import { ASSISTANT_MEMORY_RULES, NOEN_PERSONALITY } from '@/lib/assistant/personality';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AssistantModelResult = {
  reply: string;
  actions: AssistantAction[];
  memoryUpdates: AssistantMemoryCandidate[];
  conversationSummary?: string;
  vaultDrafts: Array<{ title: string; folder?: string; content: string; reason?: string }>;
};

function formatClientSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object') return 'APP SNAPSHOT\nNo app snapshot available.';
  return `APP SNAPSHOT FROM DASHBOARD\n${JSON.stringify(snapshot, null, 2).slice(0, 12000)}\n\nPersistence note: Firebase Admin is unavailable, so Firestore-backed dashboard memory and saved dashboard chat history are not active for this request. Local Hermes conversation archive and Obsidian vault context may still be available separately.`;
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
  - status should be approved. Do not create pending review items; Daniel does not want a manual approval queue.
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
- Do not save low-quality, duplicate, temporary, vague, sensitive, or uncertain memories.
- If something feels too sensitive or uncertain to save automatically, do not save it; mention it naturally instead of creating a review item.
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

function parseAssistantResult(raw: string): AssistantModelResult {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned || '{}') as Record<string, unknown>;
    return {
      reply: String(parsed.reply ?? cleaned ?? 'No response returned.'),
      actions: normalizeAssistantActions(parsed.actions),
      memoryUpdates: normalizeMemoryUpdates(parsed.memoryUpdates, 5),
      conversationSummary: typeof parsed.conversationSummary === 'string' ? parsed.conversationSummary.slice(0, 1200) : undefined,
      vaultDrafts: normalizeVaultDrafts(parsed.vaultDrafts),
    };
  } catch {
    return { reply: cleaned || 'No response returned.', actions: [], memoryUpdates: [], vaultDrafts: [] };
  }
}

const HERMES_CLI_CANDIDATES = [
  process.env.HERMES_CLI_PATH,
  '/usr/local/lib/hermes-agent/venv/bin/hermes',
  '/root/.local/bin/hermes',
  'hermes',
].filter((candidate): candidate is string => Boolean(candidate));

function dashboardPrompt(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  const transcript = messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n---\n\n');
  return `${transcript}\n\nYou are replying to the DisciplineOS dashboard. Return ONLY compact valid JSON matching the requested schema. No markdown fences.`;
}

async function callHermesCli(prompt: string): Promise<AssistantModelResult> {
  const errors: string[] = [];

  for (const hermesPath of HERMES_CLI_CANDIDATES) {
    try {
      const { stdout, stderr } = await execFileAsync(hermesPath, ['chat', '-Q', '--source', 'dashboard-assistant', '-q', prompt], {
        cwd: process.cwd(),
        timeout: Number(process.env.ASSISTANT_HERMES_TIMEOUT_MS ?? 90000),
        maxBuffer: 1024 * 1024,
      });

      const raw = String(stdout || '').trim();
      if (!raw) throw new Error(`Hermes returned no output. ${String(stderr || '').slice(0, 300)}`.trim());
      return parseAssistantResult(raw);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`${hermesPath}: ${message.slice(0, 240)}`);
    }
  }

  throw new Error(`Hermes CLI unavailable. Tried: ${errors.join(' | ')}`);
}

async function callHermesApi(prompt: string): Promise<AssistantModelResult> {
  const baseUrl = process.env.HERMES_API_BASE_URL?.replace(/\/$/, '');
  const apiKey = process.env.HERMES_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('Hermes API bridge is not configured.');

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Hermes-Session-Key': 'disciplineos-dashboard-assistant',
    },
    body: JSON.stringify({
      model: process.env.HERMES_API_MODEL || 'hermes-agent',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hermes API bridge failed: ${res.status} ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const raw = String(data.choices?.[0]?.message?.content ?? '{}');
  return parseAssistantResult(raw);
}

async function callHermes(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<AssistantModelResult> {
  const prompt = dashboardPrompt(messages);
  if (process.env.HERMES_API_BASE_URL) return callHermesApi(prompt);
  return callHermesCli(prompt);
}

async function callOpenAI(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<AssistantModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      reply: 'Assistant backend is wired, but OPENAI_API_KEY is not available in this server environment.',
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
  return parseAssistantResult(raw);
}

async function callAssistantModel(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<AssistantModelResult> {
  const backend = (process.env.ASSISTANT_BACKEND || 'hermes').toLowerCase();
  if (backend === 'openai') return callOpenAI(messages);

  try {
    return await callHermes(messages);
  } catch (e) {
    console.warn('[assistant/chat] Hermes backend unavailable.', e);
    if (process.env.ASSISTANT_OPENAI_FALLBACK === 'true') return callOpenAI(messages);
    throw new Error('Hermes backend is unavailable in this server environment. OpenAI fallback is disabled so dashboard requests do not use platform.openai.com.');
  }
}

function fallbackMemoryFromUserMessage(userMessage: string): AssistantMemoryCandidate | null {
  const text = userMessage.trim();
  const normalized = text.toLowerCase();
  const explicitSave = ['remember', 'save this', 'note this', 'keep track'].some((signal) => normalized.includes(signal));
  if (!explicitSave) return null;

  const cleaned = text
    .replace(/^remember\s+(that\s+)?/i, '')
    .replace(/^save this\s*:?\s*/i, '')
    .replace(/^note this\s*:?\s*/i, '')
    .trim();

  if (!cleaned) return null;

  const type = normalized.includes('priority') || normalized.includes('project') || normalized.includes('noen')
    ? 'project'
    : normalized.includes('money') || normalized.includes('business')
      ? 'business'
      : normalized.includes('school') || normalized.includes('calc')
        ? 'school'
        : normalized.includes('fitness') || normalized.includes('workout')
          ? 'fitness'
          : 'system';

  return {
    text: cleaned,
    type,
    sensitivity: 'low',
    tags: ['explicit-memory'],
    reason: 'Daniel explicitly asked Noen to remember this.',
    status: 'approved',
  };
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

  const fallbackMemory = result.memoryUpdates.length === 0 ? fallbackMemoryFromUserMessage(userMessage) : null;
  const memoryUpdates = fallbackMemory ? [fallbackMemory] : result.memoryUpdates;

  await Promise.all(memoryUpdates.map((candidate) => {
    const status = 'approved';
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
    const verified = await verifyAssistantRequest(req);
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

    const localArchiveContext = await loadLocalArchiveContext(message);
    const localArchiveText = formatLocalArchiveContext(localArchiveContext);
    const recentHistory = history.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const messages = [
      { role: 'system' as const, content: NOEN_PERSONALITY },
      { role: 'system' as const, content: ASSISTANT_MEMORY_RULES },
      { role: 'system' as const, content: ACTION_OUTPUT_RULES },
      { role: 'system' as const, content: contextText },
      { role: 'system' as const, content: localArchiveText },
      ...recentHistory,
      { role: 'user' as const, content: message },
    ];

    const result = await callAssistantModel(messages);
    const fallbackMemory = result.memoryUpdates.length === 0 ? fallbackMemoryFromUserMessage(message) : null;
    const memoryUpdateCount = result.memoryUpdates.length + (fallbackMemory ? 1 : 0);

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
      memoryUpdates: memoryUpdateCount,
      vaultDraftsQueued: persistenceEnabled ? result.vaultDrafts.length : 0,
    });
  } catch (e) {
    console.error('[assistant/chat]', e);
    const message = e instanceof Error ? e.message : 'Assistant request failed.';
    const status = assistantErrorStatus(message);
    return NextResponse.json({ error: message }, { status });
  }
}
