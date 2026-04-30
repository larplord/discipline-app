import { doc, runTransaction } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { DayLog, Goal, Habit, JournalEntry, MacroSnapshot } from './types';
import { todayKey } from './dates';
import { calcDailyScore } from './scoring';
import { calcStreak } from './streaks';

export type IdentityProgressInput = {
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: JournalEntry;
  goals: Goal[];
  nutritionTargets: MacroSnapshot;
  nutritionIntake: MacroSnapshot;
  logsByDate: Record<string, DayLog>;
};

export function identityDailyScore(input: IdentityProgressInput) {
  return calcDailyScore(input);
}

export function identityBestStreak(input: Pick<IdentityProgressInput, 'habits' | 'logsByDate'>) {
  return input.habits.length
    ? Math.max(0, ...input.habits.map((h) => calcStreak(h.id, input.logsByDate)))
    : 0;
}

export async function syncIdentityProgress(db: Firestore, uid: string, input: IdentityProgressInput) {
  const today = todayKey();
  const dailyScore = identityDailyScore(input);
  const bestStreak = identityBestStreak(input);
  const ref = doc(db, 'users', uid, 'identity', 'profile');

  await runTransaction(db, async (trx) => {
    const snap = await trx.get(ref);
    const data = snap.data();
    const prevTotal = Number(data?.totalScore ?? 0);
    const prevBest = Number(data?.bestStreak ?? 0);
    const lastScoreDate = data?.lastScoreDate as string | undefined;
    const hasLastDailyScore = typeof data?.lastDailyScore === 'number';
    const lastDailyScore = hasLastDailyScore ? Number(data?.lastDailyScore ?? 0) : 0;
    const scoreDelta =
      lastScoreDate === today
        ? hasLastDailyScore
          ? Math.max(0, dailyScore - lastDailyScore)
          : 0
        : dailyScore;

    trx.set(
      ref,
      {
        totalScore: prevTotal + scoreDelta,
        bestStreak: Math.max(prevBest, bestStreak),
        lastScoreDate: today,
        lastDailyScore: Math.max(lastScoreDate === today ? lastDailyScore : 0, dailyScore),
      },
      { merge: true }
    );
  });
}
