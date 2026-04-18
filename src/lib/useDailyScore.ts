import { calcDailyScore } from '@/lib/scoring';
import type { DayLog } from '@/lib/scoring';
import type { Habit, JournalEntry } from '@/lib/types';

export function calcDailyScoreFromSnapshot(input: {
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: JournalEntry;
}) {
  return calcDailyScore({
    habits: input.habits,
    dayLog: input.dayLog,
    focusToday: input.focusToday,
    journal: input.journal,
  });
}
