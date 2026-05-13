import { getAdminDb } from '@/lib/firebase/admin';
import { todayKey } from '@/lib/dates';

type AssistantAppContext = {
  habits: Array<{ id: string; name?: string; category?: string; order?: number }>;
  todayHabitLog: Record<string, boolean>;
  focusToday: number;
  journalToday: Record<string, unknown> | null;
  goals: Array<{ id: string; title?: string; type?: string; priority?: string; deadline?: string; milestones?: Array<{ done?: boolean }> }>;
  projects: Array<{ id: string; name?: string; status?: string; nextMove?: string; currentVersion?: string }>;
  identity: Record<string, unknown> | null;
};

export type AssistantContextBundle = {
  appContext: AssistantAppContext;
  longTermMemory: string[];
  conversationSummary: string;
};

async function getCollectionDocs<T>(uid: string, collectionName: string, limit = 25): Promise<Array<T & { id: string }>> {
  const snap = await getAdminDb().collection('users').doc(uid).collection(collectionName).limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

export async function loadAssistantContext(uid: string): Promise<AssistantContextBundle> {
  const db = getAdminDb();
  const today = todayKey();

  const [habits, todayLogSnap, focusSnap, journalSnap, goals, projects, identitySnap, memorySnap] = await Promise.all([
    getCollectionDocs<AssistantAppContext['habits'][number]>(uid, 'habits', 100),
    db.collection('users').doc(uid).collection('habitLogs').doc(today).get(),
    db.collection('users').doc(uid).collection('focusLogs').doc(today).get(),
    db.collection('users').doc(uid).collection('journal').doc(today).get(),
    getCollectionDocs<AssistantAppContext['goals'][number]>(uid, 'goals', 50),
    getCollectionDocs<AssistantAppContext['projects'][number]>(uid, 'projects', 50),
    db.collection('users').doc(uid).collection('identity').doc('profile').get(),
    db.collection('users').doc(uid).collection('assistantMemory').orderBy('updatedAt', 'desc').limit(12).get().catch(() => null),
  ]);

  const longTermMemory = memorySnap
    ? memorySnap.docs.map((d) => String(d.data()?.summary ?? d.data()?.text ?? '')).filter(Boolean)
    : [];

  return {
    appContext: {
      habits: habits.sort((a, b) => Number(a.order ?? 9999) - Number(b.order ?? 9999)),
      todayHabitLog: (todayLogSnap.data()?.entries as Record<string, boolean>) ?? {},
      focusToday: Number(focusSnap.data()?.count ?? 0),
      journalToday: journalSnap.exists ? journalSnap.data() ?? null : null,
      goals,
      projects,
      identity: identitySnap.exists ? identitySnap.data() ?? null : null,
    },
    longTermMemory,
    conversationSummary: '',
  };
}

export function formatAssistantContext(bundle: AssistantContextBundle) {
  const { appContext, longTermMemory } = bundle;
  const completed = appContext.habits.filter((h) => appContext.todayHabitLog[h.id]).length;
  const habitLines = appContext.habits.map((h) => `- ${appContext.todayHabitLog[h.id] ? '[done]' : '[open]'} ${h.name ?? h.id} (${h.category ?? 'other'})`).join('\n');
  const goalLines = appContext.goals.map((g) => {
    const total = g.milestones?.length ?? 0;
    const done = g.milestones?.filter((m) => m.done).length ?? 0;
    return `- ${g.title ?? g.id}: ${done}/${total} milestones, priority ${g.priority ?? 'unknown'}, deadline ${g.deadline ?? 'none'}`;
  }).join('\n');
  const projectLines = appContext.projects.map((p) => `- ${p.name ?? p.id}: ${p.status ?? 'unknown'}; next move: ${p.nextMove ?? 'none'}`).join('\n');

  return `
APP SNAPSHOT
Today habits: ${completed}/${appContext.habits.length} complete
Focus sessions today: ${appContext.focusToday}
Identity: ${JSON.stringify(appContext.identity ?? {})}
Journal today: ${JSON.stringify(appContext.journalToday ?? {})}

Habits:
${habitLines || '- none'}

Goals:
${goalLines || '- none'}

Projects:
${projectLines || '- none'}

Long-term memory snippets:
${longTermMemory.map((m) => `- ${m}`).join('\n') || '- none yet'}
`;
}
