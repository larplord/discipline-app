import { getAdminDb } from '@/lib/firebase/admin';
import { todayKey } from '@/lib/dates';

type AssistantAppContext = {
  habits: Array<{ id: string; name?: string; category?: string; order?: number; targetCheckInTime?: string; averageCompletionTime?: string }>;
  todayHabitLog: Record<string, boolean>;
  todayCompletionTimes: Record<string, string>;
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

  const [habits, todayLogSnap, recentHabitLogsSnap, focusSnap, journalSnap, goals, projects, identitySnap, memorySnap] = await Promise.all([
    getCollectionDocs<AssistantAppContext['habits'][number]>(uid, 'habits', 100),
    db.collection('users').doc(uid).collection('habitLogs').doc(today).get(),
    db.collection('users').doc(uid).collection('habitLogs').orderBy('__name__', 'desc').limit(30).get().catch(() => null),
    db.collection('users').doc(uid).collection('focusLogs').doc(today).get(),
    db.collection('users').doc(uid).collection('journal').doc(today).get(),
    getCollectionDocs<AssistantAppContext['goals'][number]>(uid, 'goals', 50),
    getCollectionDocs<AssistantAppContext['projects'][number]>(uid, 'projects', 50),
    db.collection('users').doc(uid).collection('identity').doc('profile').get(),
    db.collection('users').doc(uid).collection('assistantMemory').orderBy('updatedAt', 'desc').limit(12).get().catch(() => null),
  ]);


  const completionMinuteBuckets = new Map<string, number[]>();
  recentHabitLogsSnap?.docs.forEach((docSnap) => {
    const completionTimes = (docSnap.data()?.completionTimes as Record<string, string>) ?? {};
    Object.entries(completionTimes).forEach(([habitId, iso]) => {
      const completedAt = new Date(iso);
      if (Number.isNaN(completedAt.getTime())) return;
      const minutes = completedAt.getHours() * 60 + completedAt.getMinutes();
      completionMinuteBuckets.set(habitId, [...(completionMinuteBuckets.get(habitId) ?? []), minutes]);
    });
  });

  const habitsWithAverages = habits
    .sort((a, b) => Number(a.order ?? 9999) - Number(b.order ?? 9999))
    .map((habit) => {
      const minutes = completionMinuteBuckets.get(habit.id) ?? [];
      if (!minutes.length) return habit;
      const avg = Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length);
      const hours = Math.floor(avg / 60);
      const mins = avg % 60;
      return { ...habit, averageCompletionTime: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}` };
    });

  const longTermMemory = memorySnap
    ? memorySnap.docs.map((d) => String(d.data()?.summary ?? d.data()?.text ?? '')).filter(Boolean)
    : [];

  return {
    appContext: {
      habits: habitsWithAverages,
      todayHabitLog: (todayLogSnap.data()?.entries as Record<string, boolean>) ?? {},
      todayCompletionTimes: (todayLogSnap.data()?.completionTimes as Record<string, string>) ?? {},
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
  const habitLines = appContext.habits.map((h) => {
    const target = h.targetCheckInTime ? `; target check-in ${h.targetCheckInTime}` : '';
    const avg = h.averageCompletionTime ? `; avg completion ${h.averageCompletionTime}` : '';
    const doneAt = appContext.todayCompletionTimes[h.id] ? `; completed today ${appContext.todayCompletionTimes[h.id]}` : '';
    return `- ${appContext.todayHabitLog[h.id] ? '[done]' : '[open]'} ${h.name ?? h.id} (${h.category ?? 'other'}${target}${avg}${doneAt})`;
  }).join('\n');
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
