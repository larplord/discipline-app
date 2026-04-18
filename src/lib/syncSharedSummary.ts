import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Habit } from './types';
import type { DayLog } from './scoring';
import { todayProgress, weekProgress } from './scoring';

export async function syncSharedSummary(
  db: Firestore,
  uid: string,
  input: {
    habits: Habit[];
    dayLog: DayLog;
    logsByDate: Record<string, DayLog>;
    focusToday: number;
    journalToday: boolean;
    shareEnabled: boolean;
  }
) {
  const habitTodayPct = todayProgress(input.habits, input.dayLog);
  const weekHabitPct = weekProgress(input.habits, input.logsByDate);
  await setDoc(
    doc(db, 'users', uid, 'shared', 'summary'),
    {
      shareEnabled: input.shareEnabled,
      habitTodayPct,
      weekHabitPct,
      focusToday: input.focusToday,
      journalToday: input.journalToday,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
