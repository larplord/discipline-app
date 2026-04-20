import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { DayLog, Goal, Habit, JournalEntry, MacroSnapshot } from './types';
import { calcDailyScore, isJournalCompleteForDailyScore, todayProgress, weekProgress } from './scoring';
import { calcStreak } from './streaks';
import { getLevel } from './levels';

/** Safe aggregate for friends: average milestone %, count of goals in the average. */
export function computeGoalsShareFields(goals: Goal[]): { goalsAvgPct: number; goalsTrackedCount: number } {
  const withMs = goals.filter((g) => (g.milestones?.length ?? 0) > 0);
  if (!withMs.length) return { goalsAvgPct: 0, goalsTrackedCount: 0 };
  let sum = 0;
  for (const g of withMs) {
    const ms = g.milestones ?? [];
    const done = ms.filter((m) => m.done).length;
    sum += (done / ms.length) * 100;
  }
  return { goalsAvgPct: Math.round(sum / withMs.length), goalsTrackedCount: withMs.length };
}

export async function syncSharedSummary(
  db: Firestore,
  uid: string,
  input: {
    habits: Habit[];
    dayLog: DayLog;
    logsByDate: Record<string, DayLog>;
    focusToday: number;
    journal: JournalEntry;
    shareEnabled: boolean;
    goals: Goal[];
    nutritionTargets: MacroSnapshot;
    nutritionIntake: MacroSnapshot;
    identityTotalScore: number;
    identityBestStreak: number;
  }
) {
  const habitTodayPct = todayProgress(input.habits, input.dayLog);
  const weekHabitPct = weekProgress(input.habits, input.logsByDate);
  const journalToday = isJournalCompleteForDailyScore(input.journal);
  const scoreInput = {
    habits: input.habits,
    dayLog: input.dayLog,
    focusToday: input.focusToday,
    journal: input.journal,
    goals: input.goals,
    nutritionTargets: input.nutritionTargets,
    nutritionIntake: input.nutritionIntake,
    logsByDate: input.logsByDate,
  };
  const dailyScore = calcDailyScore(scoreInput);
  const rankTitle = getLevel(input.identityTotalScore).title;
  const maxPerHabit =
    input.habits.length > 0
      ? Math.max(0, ...input.habits.map((h) => calcStreak(h.id, input.logsByDate)))
      : 0;
  const bestStreak = Math.max(maxPerHabit, input.identityBestStreak, 0);
  const habitsCompletedToday = input.habits.filter((h) => input.dayLog[h.id]).length;
  const { goalsAvgPct, goalsTrackedCount } = computeGoalsShareFields(input.goals);

  await setDoc(
    doc(db, 'users', uid, 'shared', 'summary'),
    {
      shareEnabled: input.shareEnabled,
      habitTodayPct,
      weekHabitPct,
      focusToday: input.focusToday,
      journalToday,
      dailyScore,
      rankTitle,
      bestStreak,
      habitsCompletedToday,
      goalsAvgPct,
      goalsTrackedCount,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
