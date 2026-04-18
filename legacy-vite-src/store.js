/**
 * store.js — Central localStorage data layer for Discipline OS
 * All data persists in browser localStorage. No backend required for MVP.
 */

import { format } from 'date-fns';

/* ── Keys ── */
const KEYS = {
  HABITS:       'dos_habits',
  HABIT_LOGS:   'dos_habit_logs',
  GOALS:        'dos_goals',
  JOURNAL:      'dos_journal',
  FOCUS_LOGS:   'dos_focus_logs',
  IDENTITY:     'dos_identity',
  NUTRITION_TARGETS: 'dos_nutrition_targets',
  NUTRITION_LOGS:    'dos_nutrition_logs',
};

/* ── Helpers ── */
const load  = (key) => { try { return JSON.parse(localStorage.getItem(key)) ?? null; } catch { return null; } };
const save  = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const today = () => format(new Date(), 'yyyy-MM-dd');
const uid   = () => Math.random().toString(36).slice(2, 10);

/* ═══════════════════════════════════════════════════
   SEED DATA — loaded once on first launch
   ═══════════════════════════════════════════════════ */
export function seedIfEmpty() {
  if (load(KEYS.HABITS)) return; // already seeded

  const habits = [
    { id: uid(), name: 'Morning workout', category: 'fitness',  emoji: '🏋️', targetDays: 7 },
    { id: uid(), name: 'Read 30 pages',   category: 'learning', emoji: '📚', targetDays: 7 },
    { id: uid(), name: 'Cold shower',     category: 'mindset',  emoji: '🧊', targetDays: 7 },
    { id: uid(), name: '8h sleep',        category: 'sleep',    emoji: '😴', targetDays: 7 },
    { id: uid(), name: 'No social media before 12pm', category: 'mindset', emoji: '📵', targetDays: 7 },
    { id: uid(), name: 'Deep work 2h',    category: 'business', emoji: '💼', targetDays: 7 },
  ];
  save(KEYS.HABITS, habits);

  const goals = [
    {
      id: uid(),
      title: 'Get in the best shape of my life',
      type: 'long',
      priority: 'high',
      deadline: '2026-12-31',
      description: 'Build a lean, strong physique through consistent training and nutrition.',
      milestones: [
        { id: uid(), text: 'Train 5x per week for 30 days', done: true },
        { id: uid(), text: 'Nail nutrition macros for 14 days straight', done: false },
        { id: uid(), text: 'Drop 10 lbs body fat', done: false },
      ],
    },
    {
      id: uid(),
      title: 'Launch first online business',
      type: 'short',
      priority: 'high',
      deadline: '2026-06-30',
      description: 'Build and launch a product that earns $1k/month.',
      milestones: [
        { id: uid(), text: 'Validate idea with 10 potential customers', done: true },
        { id: uid(), text: 'Build MVP', done: false },
        { id: uid(), text: 'Get first paying customer', done: false },
        { id: uid(), text: 'Reach $1,000 MRR', done: false },
      ],
    },
    {
      id: uid(),
      title: 'Read 24 books this year',
      type: 'long',
      priority: 'medium',
      deadline: '2026-12-31',
      description: 'Expand knowledge across business, psychology, and history.',
      milestones: [
        { id: uid(), text: 'Read 6 books (Q1)', done: true },
        { id: uid(), text: 'Read 12 books (Q2)', done: false },
        { id: uid(), text: 'Read 18 books (Q3)', done: false },
        { id: uid(), text: 'Read 24 books (Q4)', done: false },
      ],
    },
  ];
  save(KEYS.GOALS, goals);

  // Seed some past habit logs so charts have data
  const logs = {};
  const habitsSeeded = habits;
  for (let d = 6; d >= 1; d--) {
    const date = format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd');
    logs[date] = {};
    habitsSeeded.forEach(h => {
      logs[date][h.id] = Math.random() > 0.25; // ~75% completion rate
    });
  }
  save(KEYS.HABIT_LOGS, logs);

  // Seed focus logs
  const focusLogs = {};
  for (let d = 6; d >= 1; d--) {
    const date = format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd');
    focusLogs[date] = Math.floor(Math.random() * 4) + 1;
  }
  save(KEYS.FOCUS_LOGS, focusLogs);

  // Seed identity
  save(KEYS.IDENTITY, { level: 1, totalScore: 0, bestStreak: 0 });
}

/* ═══════════════════════════════════════════════════
   HABITS
   ═══════════════════════════════════════════════════ */
export const habitStore = {
  getAll: () => load(KEYS.HABITS) ?? [],
  save:   (habits) => save(KEYS.HABITS, habits),
  add: (habit) => {
    const habits = habitStore.getAll();
    const newH = { id: uid(), targetDays: 7, ...habit };
    save(KEYS.HABITS, [...habits, newH]);
    return newH;
  },
  update: (id, changes) => {
    const habits = habitStore.getAll().map(h => h.id === id ? { ...h, ...changes } : h);
    save(KEYS.HABITS, habits);
  },
  delete: (id) => {
    save(KEYS.HABITS, habitStore.getAll().filter(h => h.id !== id));
  },
};

/* ── Habit Logs ── */
export const habitLogStore = {
  getAll: ()       => load(KEYS.HABIT_LOGS) ?? {},
  getDay: (date)   => (load(KEYS.HABIT_LOGS) ?? {})[date] ?? {},
  toggle: (habitId, date = today()) => {
    const logs = load(KEYS.HABIT_LOGS) ?? {};
    const day  = logs[date] ?? {};
    day[habitId] = !day[habitId];
    logs[date]   = day;
    save(KEYS.HABIT_LOGS, logs);
    return day[habitId];
  },
  setDay: (date, dayLog) => {
    const logs = load(KEYS.HABIT_LOGS) ?? {};
    logs[date] = dayLog;
    save(KEYS.HABIT_LOGS, logs);
  },
};

/** Calculate streak for a habit */
export function calcStreak(habitId) {
  const logs = habitLogStore.getAll();
  let streak = 0;
  let d = new Date();
  // Don't penalize if today isn't done yet — start from yesterday
  d.setDate(d.getDate() - 1);
  while (true) {
    const key = format(d, 'yyyy-MM-dd');
    if (logs[key]?.[habitId]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  // Also include today if already done
  const todayKey = today();
  if (logs[todayKey]?.[habitId]) streak++;
  return streak;
}

/** Daily habit completion % */
export function todayProgress() {
  const habits = habitStore.getAll();
  if (!habits.length) return 0;
  const dayLog = habitLogStore.getDay(today());
  const done   = habits.filter(h => dayLog[h.id]).length;
  return Math.round((done / habits.length) * 100);
}

/** Weekly completion % */
export function weekProgress() {
  const habits = habitStore.getAll();
  if (!habits.length) return 0;
  const logs = habitLogStore.getAll();
  let total = 0, done = 0;
  for (let d = 0; d < 7; d++) {
    const date = format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd');
    const day  = logs[date] ?? {};
    total += habits.length;
    done  += habits.filter(h => day[h.id]).length;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

/* ═══════════════════════════════════════════════════
   GOALS
   ═══════════════════════════════════════════════════ */
export const goalStore = {
  getAll: () => load(KEYS.GOALS) ?? [],
  add: (goal) => {
    const goals = goalStore.getAll();
    const newG  = { id: uid(), milestones: [], ...goal };
    save(KEYS.GOALS, [...goals, newG]);
    return newG;
  },
  update: (id, changes) => {
    const goals = goalStore.getAll().map(g => g.id === id ? { ...g, ...changes } : g);
    save(KEYS.GOALS, goals);
  },
  delete: (id) => save(KEYS.GOALS, goalStore.getAll().filter(g => g.id !== id)),
  addMilestone: (goalId, text) => {
    const goals = goalStore.getAll().map(g => {
      if (g.id !== goalId) return g;
      return { ...g, milestones: [...(g.milestones ?? []), { id: uid(), text, done: false }] };
    });
    save(KEYS.GOALS, goals);
  },
  toggleMilestone: (goalId, milestoneId) => {
    const goals = goalStore.getAll().map(g => {
      if (g.id !== goalId) return g;
      return { ...g, milestones: g.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m) };
    });
    save(KEYS.GOALS, goals);
  },
  deleteMilestone: (goalId, milestoneId) => {
    const goals = goalStore.getAll().map(g => {
      if (g.id !== goalId) return g;
      return { ...g, milestones: g.milestones.filter(m => m.id !== milestoneId) };
    });
    save(KEYS.GOALS, goals);
  },
};

export function goalProgress(goal) {
  const ms = goal.milestones ?? [];
  if (!ms.length) return 0;
  return Math.round((ms.filter(m => m.done).length / ms.length) * 100);
}

/* ═══════════════════════════════════════════════════
   JOURNAL
   ═══════════════════════════════════════════════════ */
export const journalStore = {
  getAll: ()     => load(KEYS.JOURNAL) ?? {},
  getDay: (date = today()) => (load(KEYS.JOURNAL) ?? {})[date] ?? { well: '', avoided: '', improve: '', freeform: '' },
  save:   (date, entry) => {
    const all = load(KEYS.JOURNAL) ?? {};
    all[date] = { ...all[date], ...entry, savedAt: new Date().toISOString() };
    save(KEYS.JOURNAL, all);
  },
};

/** Days with a journal entry in past 30 days */
export function journalStreak() {
  const all = journalStore.getAll();
  let streak = 0;
  let d = new Date();
  d.setDate(d.getDate() - 1);
  while (streak < 30) {
    const key = format(d, 'yyyy-MM-dd');
    const e   = all[key];
    if (e && (e.well || e.avoided || e.improve || e.freeform)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  const todayEntry = all[today()];
  if (todayEntry && (todayEntry.well || todayEntry.avoided || todayEntry.improve || todayEntry.freeform)) streak++;
  return streak;
}

/* ═══════════════════════════════════════════════════
   FOCUS LOGS
   ═══════════════════════════════════════════════════ */
export const focusStore = {
  getAll:   ()         => load(KEYS.FOCUS_LOGS) ?? {},
  getToday: ()         => (load(KEYS.FOCUS_LOGS) ?? {})[today()] ?? 0,
  addSession: ()       => {
    const logs = load(KEYS.FOCUS_LOGS) ?? {};
    logs[today()] = (logs[today()] ?? 0) + 1;
    save(KEYS.FOCUS_LOGS, logs);
    return logs[today()];
  },
  setToday: (val) => {
    const logs = load(KEYS.FOCUS_LOGS) ?? {};
    logs[today()] = val;
    save(KEYS.FOCUS_LOGS, logs);
  },
};

/* ═══════════════════════════════════════════════════
   NUTRITION
   ═══════════════════════════════════════════════════ */
const DEFAULT_MACRO_TARGETS = { fat: 70, protein: 180, carbs: 220 };

export const nutritionStore = {
  getTargets: () => load(KEYS.NUTRITION_TARGETS) ?? DEFAULT_MACRO_TARGETS,
  saveTargets: (targets) => {
    const normalized = {
      fat: Number(targets.fat) || 0,
      protein: Number(targets.protein) || 0,
      carbs: Number(targets.carbs) || 0,
    };
    save(KEYS.NUTRITION_TARGETS, normalized);
    return normalized;
  },
  getAll: () => load(KEYS.NUTRITION_LOGS) ?? {},
  getDay: (date = today()) => {
    const all = load(KEYS.NUTRITION_LOGS) ?? {};
    return all[date] ?? { fat: 0, protein: 0, carbs: 0 };
  },
  saveDay: (date, entry) => {
    const all = load(KEYS.NUTRITION_LOGS) ?? {};
    const normalized = {
      fat: Number(entry.fat) || 0,
      protein: Number(entry.protein) || 0,
      carbs: Number(entry.carbs) || 0,
      savedAt: new Date().toISOString(),
    };
    all[date] = normalized;
    save(KEYS.NUTRITION_LOGS, all);
    return normalized;
  },
};

/* ═══════════════════════════════════════════════════
   DAILY SCORE (0-100)
   ═══════════════════════════════════════════════════ */
export function calcDailyScore() {
  const habits     = habitStore.getAll();
  const dayLog     = habitLogStore.getDay(today());
  const doneCount  = habits.filter(h => dayLog[h.id]).length;
  const focusSess  = focusStore.getToday();     // 10 pts per session (max 30)
  const journalE   = journalStore.getDay();     // 20 pts
  const hasJournal = !!(journalE.well || journalE.freeform);

  const habitScore   = doneCount * 3;           // 3 pts per completed habit
  const focusScore   = Math.min(focusSess * 10, 30);
  const journalScore = hasJournal ? 20 : 0;
  return habitScore + focusScore + journalScore;
}

/* ═══════════════════════════════════════════════════
   IDENTITY / LEVELS
   ═══════════════════════════════════════════════════ */
const LEVELS = [
  { min: 0,   title: 'Beginner',      rank: 1  },
  { min: 100, title: 'Consistent',    rank: 2  },
  { min: 300, title: 'Disciplined',   rank: 3  },
  { min: 700, title: 'Executor',      rank: 4  },
  { min: 1500,title: 'Iron-Willed',   rank: 5  },
  { min: 3000,title: 'Elite',         rank: 6  },
  { min: 6000,title: 'Legend',        rank: 7  },
];

export function getLevel(totalScore) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (totalScore >= l.min) level = l; }
  return level;
}

export const identityStore = {
  get: () => load(KEYS.IDENTITY) ?? { totalScore: 0, bestStreak: 0 },
  addScore: (pts) => {
    const id = identityStore.get();
    id.totalScore = (id.totalScore ?? 0) + pts;
    save(KEYS.IDENTITY, id);
  },
  updateBestStreak: (streak) => {
    const id = identityStore.get();
    if (streak > (id.bestStreak ?? 0)) {
      id.bestStreak = streak;
      save(KEYS.IDENTITY, id);
    }
  },
};

/* ═══════════════════════════════════════════════════
   ANALYTICS HELPERS
   ═══════════════════════════════════════════════════ */

/** Last N days of habit completion % */
export function habitTrendData(days = 14) {
  const habits = habitStore.getAll();
  const logs   = habitLogStore.getAll();
  return Array.from({ length: days }, (_, i) => {
    const date  = format(new Date(Date.now() - (days - 1 - i) * 86400000), 'yyyy-MM-dd');
    const day   = logs[date] ?? {};
    const done  = habits.filter(h => day[h.id]).length;
    const pct   = habits.length ? Math.round((done / habits.length) * 100) : 0;
    return { date: format(new Date(Date.now() - (days - 1 - i) * 86400000), 'MMM d'), pct };
  });
}

/** Last N days of focus sessions */
export function focusTrendData(days = 14) {
  const logs = focusStore.getAll();
  return Array.from({ length: days }, (_, i) => {
    const date = format(new Date(Date.now() - (days - 1 - i) * 86400000), 'yyyy-MM-dd');
    return {
      date: format(new Date(Date.now() - (days - 1 - i) * 86400000), 'MMM d'),
      sessions: logs[date] ?? 0,
    };
  });
}

/** Per-category habit completion this week */
export function categoryBreakdown() {
  const habits = habitStore.getAll();
  const logs   = habitLogStore.getAll();
  const cats   = {};
  habits.forEach(h => { cats[h.category] = cats[h.category] ?? { done: 0, total: 0 }; });
  for (let d = 0; d < 7; d++) {
    const date = format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd');
    const day  = logs[date] ?? {};
    habits.forEach(h => {
      cats[h.category].total++;
      if (day[h.id]) cats[h.category].done++;
    });
  }
  return Object.entries(cats).map(([cat, v]) => ({
    cat,
    pct: v.total ? Math.round((v.done / v.total) * 100) : 0,
  }));
}

/* ═══════════════════════════════════════════════════
   ONE-TIME DATA RESET — clears April 9-16 data
   ═══════════════════════════════════════════════════ */
export function resetApr9to16() {
  const RESET_FLAG = 'dos_reset_apr9_16';
  if (localStorage.getItem(RESET_FLAG)) return;

  const dates = [
    '2026-04-09','2026-04-10','2026-04-11','2026-04-12',
    '2026-04-13','2026-04-14','2026-04-15','2026-04-16',
  ];

  [KEYS.HABIT_LOGS, KEYS.FOCUS_LOGS, KEYS.JOURNAL, KEYS.NUTRITION_LOGS].forEach(key => {
    const data = load(key);
    if (data && typeof data === 'object') {
      dates.forEach(d => { delete data[d]; });
      save(key, data);
    }
  });

  localStorage.setItem(RESET_FLAG, '1');
}

export { today, uid };
