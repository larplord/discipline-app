import { format } from 'date-fns';
import type { Habit } from './types';

export type DayLog = Record<string, boolean>;

export function todayProgress(habits: Habit[], dayLog: DayLog) {
  if (!habits.length) return 0;
  const done = habits.filter((h) => dayLog[h.id]).length;
  return Math.round((done / habits.length) * 100);
}

export function weekProgress(habits: Habit[], logsByDate: Record<string, DayLog>) {
  if (!habits.length) return 0;
  let total = 0;
  let done = 0;
  for (let d = 0; d < 7; d++) {
    const date = format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd');
    const day = logsByDate[date] ?? {};
    total += habits.length;
    done += habits.filter((h) => day[h.id]).length;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

export function calcDailyScore(input: {
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: { well?: string; freeform?: string };
}) {
  const doneCount = input.habits.filter((h) => input.dayLog[h.id]).length;
  const focusScore = Math.min(input.focusToday * 10, 30);
  const journalScore =
    input.journal.well || input.journal.freeform ? 20 : 0;
  return doneCount * 3 + focusScore + journalScore;
}
