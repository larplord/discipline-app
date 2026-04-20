/**
 * Daily score & XP — single place to tune point values and rule thresholds.
 * Used by `calcDailyScore` in `scoring.ts`.
 */
export const DAILY_SCORE = {
  /** Points per habit checked off today */
  habitPerCompleted: 3,
  /** Points per completed focus session (Deep Work / Custom timer finished today) */
  focusPerSession: 5,
  /** One-time points if journal counts as “completed” for the day */
  journalComplete: 10,
  /** One-time points if every goal has milestones and all are done */
  goalsAllComplete: 30,
  /** One-time points if all macro targets (with target > 0) are met for the day */
  nutritionGoalHit: 7,
  /** Flat bonus for the day when streak-bonus rules all pass (never stacks) */
  streakBonusFlat: 5,

  /** Streak bonus: minimum “best habit streak” (days) to count as an active streak */
  minHabitStreakForBonus: 2,
  /** Streak bonus: minimum % of today’s habits completed */
  habitCompletionPctForStreakBonus: 70,
} as const;
