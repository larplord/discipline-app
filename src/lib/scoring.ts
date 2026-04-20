import { format } from 'date-fns';
import type { DayLog, Goal, Habit, JournalEntry, MacroSnapshot } from './types';
import { DAILY_SCORE } from './scoringConfig';
import { calcStreak } from './streaks';

export type { DayLog } from './types';

export type DailyScoreInput = {
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: JournalEntry;
  goals: Goal[];
  nutritionTargets: MacroSnapshot;
  nutritionIntake: MacroSnapshot;
  logsByDate: Record<string, DayLog>;
};

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

/** Journal counts for daily score + streak bonus: any of the four fields has non-whitespace content. */
export function isJournalCompleteForDailyScore(j: JournalEntry): boolean {
  return [j.well, j.avoided, j.improve, j.freeform].some((s) => (s ?? '').trim().length > 0);
}

/**
 * Nutrition “goal hit”: for each macro with a target &gt; 0, today’s intake is &gt;= target (meet or exceed).
 * Macros with target 0 are ignored so unused columns do not block the bonus.
 */
export function isNutritionGoalMetForDailyScore(targets: MacroSnapshot, intake: MacroSnapshot): boolean {
  const keys: (keyof MacroSnapshot)[] = ['fat', 'protein', 'carbs'];
  const required = keys.filter((k) => targets[k] > 0);
  if (required.length === 0) return false;
  return required.every((k) => intake[k] >= targets[k]);
}

/**
 * Goals “complete” for the 30pt bucket: you have at least one goal, and every goal has
 * at least one milestone and all milestones are checked off. Goals with zero milestones do not count as done.
 */
export function areAllGoalsFullyCompleteForDailyScore(goals: Goal[]): boolean {
  if (!goals.length) return false;
  return goals.every((g) => {
    const ms = g.milestones ?? [];
    return ms.length > 0 && ms.every((m) => m.done);
  });
}

export function maxHabitStreakToday(habits: Habit[], logsByDate: Record<string, DayLog>): number {
  if (!habits.length) return 0;
  return Math.max(0, ...habits.map((h) => calcStreak(h.id, logsByDate)));
}

/** Single +5 streak bonus: all conditions must pass (see scoringConfig thresholds). */
export function qualifiesForStreakBonus(input: DailyScoreInput): boolean {
  const streak = maxHabitStreakToday(input.habits, input.logsByDate);
  if (streak < DAILY_SCORE.minHabitStreakForBonus) return false;
  if (todayProgress(input.habits, input.dayLog) < DAILY_SCORE.habitCompletionPctForStreakBonus) return false;
  if (!isJournalCompleteForDailyScore(input.journal)) return false;
  if (!isNutritionGoalMetForDailyScore(input.nutritionTargets, input.nutritionIntake)) return false;
  return true;
}

export function calcDailyScore(input: DailyScoreInput): number {
  const doneHabits = input.habits.filter((h) => input.dayLog[h.id]).length;
  const habitPts = doneHabits * DAILY_SCORE.habitPerCompleted;
  const focusPts = input.focusToday * DAILY_SCORE.focusPerSession;
  const journalPts = isJournalCompleteForDailyScore(input.journal) ? DAILY_SCORE.journalComplete : 0;
  const goalsPts = areAllGoalsFullyCompleteForDailyScore(input.goals) ? DAILY_SCORE.goalsAllComplete : 0;
  const nutritionPts = isNutritionGoalMetForDailyScore(input.nutritionTargets, input.nutritionIntake)
    ? DAILY_SCORE.nutritionGoalHit
    : 0;
  const streakPts = qualifiesForStreakBonus(input) ? DAILY_SCORE.streakBonusFlat : 0;

  return habitPts + focusPts + journalPts + goalsPts + nutritionPts + streakPts;
}
