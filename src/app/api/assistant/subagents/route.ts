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

async function runProjectScout(task: string, appSnapshot: unknown) {
  const hermesPath = process.env.HERMES_CLI_PATH || 'hermes';
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

  const { stdout, stderr } = await execFileAsync(hermesPath, ['chat', '-Q', '--source', 'dashboard-subagent', '-q', prompt], {
    cwd: process.cwd(),
    timeout: Number(process.env.ASSISTANT_SUBAGENT_TIMEOUT_MS ?? 120000),
    maxBuffer: 1024 * 1024,
  });

  const raw = String(stdout || '').trim();
  if (!raw) throw new Error(`Project Scout returned no output. ${String(stderr || '').slice(0, 300)}`.trim());
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
