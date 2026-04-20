import { calcDailyScore } from '@/lib/scoring';
import type { DayLog, Goal, Habit, JournalEntry, MacroSnapshot } from '@/lib/types';

export function calcDailyScoreFromSnapshot(input: {
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: JournalEntry;
  goals: Goal[];
  nutritionTargets: MacroSnapshot;
  nutritionIntake: MacroSnapshot;
  logsByDate: Record<string, DayLog>;
}) {
  return calcDailyScore({
    habits: input.habits,
    dayLog: input.dayLog,
    focusToday: input.focusToday,
    journal: input.journal,
    goals: input.goals,
    nutritionTargets: input.nutritionTargets,
    nutritionIntake: input.nutritionIntake,
    logsByDate: input.logsByDate,
  });
}
