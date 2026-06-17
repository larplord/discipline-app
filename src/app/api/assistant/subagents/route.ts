import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { assistantErrorStatus, verifyAssistantRequest } from '@/lib/assistant/auth';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

type SubagentResult = {
  title?: string;
  status?: string;
  summary?: string;
  nextActions?: string[];
  risks?: string[];
};

function parseSubagentResult(raw: string): Required<SubagentResult> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Project Scout Report',
      status: typeof parsed.status === 'string' ? parsed.status : 'completed',
      summary: typeof parsed.summary === 'string' ? parsed.summary : cleaned,
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.filter((item): item is string => typeof item === 'string').slice(0, 6) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter((item): item is string => typeof item === 'string').slice(0, 6) : [],
    };
  } catch {
    return {
      title: 'Project Scout Report',
      status: 'completed',
      summary: cleaned || 'No data right now',
      nextActions: [],
      risks: [],
    };
  }
}

const HERMES_CLI_CANDIDATES = [
  process.env.HERMES_CLI_PATH,
  '/usr/local/lib/hermes-agent/venv/bin/hermes',
  '/root/.local/bin/hermes',
  'hermes',
].filter((candidate): candidate is string => Boolean(candidate));

async function runHermesPrompt(prompt: string) {
  if (process.env.HERMES_API_BASE_URL) {
    const baseUrl = process.env.HERMES_API_BASE_URL.replace(/\/$/, '').replace(/\/v1$/, '');
    const apiKey = process.env.HERMES_API_KEY;
    if (!apiKey) throw new Error('Hermes API bridge is not configured.');

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Hermes-Session-Key': 'disciplineos-dashboard-subagent',
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
    return String(data.choices?.[0]?.message?.content ?? '').trim();
  }

  const errors: string[] = [];
  for (const hermesPath of HERMES_CLI_CANDIDATES) {
    try {
      const { stdout, stderr } = await execFileAsync(hermesPath, ['chat', '-Q', '--source', 'dashboard-subagent', '-q', prompt], {
        cwd: process.cwd(),
        timeout: Number(process.env.ASSISTANT_SUBAGENT_TIMEOUT_MS ?? 120000),
        maxBuffer: 1024 * 1024,
      });

      const raw = String(stdout || '').trim();
      if (!raw) throw new Error(`Project Scout returned no output. ${String(stderr || '').slice(0, 300)}`.trim());
      return raw;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`${hermesPath}: ${message.slice(0, 240)}`);
    }
  }

  throw new Error(`Hermes CLI unavailable. Tried: ${errors.join(' | ')}`);
}

async function runProjectScout(task: string, appSnapshot: unknown) {
  const prompt = `
You are Project Scout, a focused JARVIS dashboard subagent for Daniel's DisciplineOS dashboard.

Mission:
- Inspect the app snapshot and Daniel's requested task.
- Identify the highest-leverage next project move.
- Do not claim to modify files, Firebase, or external systems.
- If the snapshot has no real data, say "No data right now" and recommend the first setup step.

Daniel's task:
${task || 'Review current dashboard context and find the next useful project move.'}

App snapshot:
${JSON.stringify(appSnapshot ?? {}, null, 2).slice(0, 16000)}

Return ONLY compact valid JSON:
{
  "title": "Project Scout Report",
  "status": "completed",
  "summary": "short useful report for Daniel",
  "nextActions": ["action 1", "action 2"],
  "risks": ["risk or blocker"]
}
`;

  const raw = await runHermesPrompt(prompt);
  if (!raw) throw new Error('Project Scout returned no output.');
  return parseSubagentResult(raw);
}

export async function POST(req: Request) {
  try {
    await verifyAssistantRequest(req);
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const task = String(body.task ?? '').trim();
    const report = await runProjectScout(task, body.appSnapshot);

    return NextResponse.json({
      agent: {
        id: `project-scout-${Date.now()}`,
        name: 'Project Scout',
        kind: 'Hermes one-shot subagent',
        ...report,
      },
    });
  } catch (e) {
    console.error('[assistant/subagents]', e);
    const message = e instanceof Error ? e.message : 'Subagent request failed.';
    return NextResponse.json({ error: message }, { status: assistantErrorStatus(message) });
  }
}
