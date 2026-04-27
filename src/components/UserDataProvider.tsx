'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  collection,
  doc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { todayKey } from '@/lib/dates';
import type { DayLog, Goal, Habit, IdentityDoc, JournalEntry, MacroSnapshot } from '@/lib/types';

const emptyJournal: JournalEntry = {
  well: '',
  avoided: '',
  improve: '',
  freeform: '',
};

const DEFAULT_MACRO_TARGETS: MacroSnapshot = { fat: 70, protein: 180, carbs: 220 };

export type UserDataContextValue = {
  uid: string;
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: JournalEntry;
  goals: Goal[];
  logsByDate: Record<string, DayLog>;
  nutritionTargets: MacroSnapshot;
  nutritionIntake: MacroSnapshot;
  /** From `settings/privacy` — drives friend-visible summary when friendship is active. */
  shareProgressWithFriends: boolean;
  /** From `identity/profile` — for levels + shared summary rank. */
  identityProfile: IdentityDoc;
  loading: boolean;
};

const UserDataContext = createContext<UserDataContextValue | null>(null);

export function UserDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: ReactNode;
}) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayLog, setDayLog] = useState<DayLog>({});
  const [focusToday, setFocusToday] = useState(0);
  const [journal, setJournal] = useState<JournalEntry>(emptyJournal);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logsByDate, setLogsByDate] = useState<Record<string, DayLog>>({});
  const [nutritionTargets, setNutritionTargets] = useState<MacroSnapshot>(DEFAULT_MACRO_TARGETS);
  const [nutritionIntake, setNutritionIntake] = useState<MacroSnapshot>({
    fat: 0,
    protein: 0,
    carbs: 0,
  });
  const [shareProgressWithFriends, setShareProgressWithFriends] = useState(false);
  const [identityProfile, setIdentityProfile] = useState<IdentityDoc>({
    totalScore: 0,
    bestStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestoreDb();
    const unsubs: Unsubscribe[] = [];

    setLoading(false);

    const t = todayKey();
    const logErr = (label: string) => (e: unknown) =>
      console.warn('[DisciplineOS][UserData][error]', label, e);

    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'habits'),
        (snap) => {
          const list: Array<Habit & { snapshotIndex: number }> = [];
          snap.forEach((d) =>
            list.push({
              id: d.id,
              ...(d.data() as Omit<Habit, 'id'>),
              snapshotIndex: list.length,
            })
          );
          list.sort((a, b) => {
            const aOrder = Number.isFinite(a.order) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
            const bOrder = Number.isFinite(b.order) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
            return aOrder - bOrder || a.snapshotIndex - b.snapshotIndex;
          });
          setHabits(list);
        },
        logErr('habits')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'habitLogs', t),
        (snap) => {
          const entries = (snap.data()?.entries as DayLog) ?? {};
          setDayLog(entries);
        },
        logErr('habitLogs')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'habitLogs'),
        (snap) => {
          const m: Record<string, DayLog> = {};
          snap.forEach((d) => {
            m[d.id] = (d.data()?.entries as DayLog) ?? {};
          });
          setLogsByDate(m);
        },
        logErr('habitLogsCollection')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'focusLogs', t),
        (snap) => {
          const c = Number(snap.data()?.count ?? 0);
          setFocusToday(Number.isFinite(c) ? c : 0);
        },
        logErr('focusLogs')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'journal', t),
        (snap) => {
          const d = snap.data();
          setJournal({
            well: d?.well ?? '',
            avoided: d?.avoided ?? '',
            improve: d?.improve ?? '',
            freeform: d?.freeform ?? '',
          });
        },
        logErr('journal')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'goals'),
        (snap) => {
          const g: Goal[] = [];
          snap.forEach((d) => g.push({ id: d.id, ...(d.data() as Omit<Goal, 'id'>) }));
          setGoals(g);
        },
        logErr('goals')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'nutritionTargets', 'default'),
        (snap) => {
          const d = snap.data();
          setNutritionTargets({
            fat: Number(d?.fat ?? DEFAULT_MACRO_TARGETS.fat),
            protein: Number(d?.protein ?? DEFAULT_MACRO_TARGETS.protein),
            carbs: Number(d?.carbs ?? DEFAULT_MACRO_TARGETS.carbs),
          });
        },
        logErr('nutritionTargets')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'nutritionIntake', t),
        (snap) => {
          const d = snap.data();
          setNutritionIntake({
            fat: Number(d?.fat ?? 0),
            protein: Number(d?.protein ?? 0),
            carbs: Number(d?.carbs ?? 0),
          });
        },
        logErr('nutritionIntake')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'settings', 'privacy'),
        (snap) => {
          setShareProgressWithFriends(!!snap.data()?.shareProgressWithFriends);
        },
        logErr('settingsPrivacy')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'identity', 'profile'),
        (snap) => {
          const d = snap.data();
          setIdentityProfile({
            totalScore: Number(d?.totalScore ?? 0),
            bestStreak: Number(d?.bestStreak ?? 0),
            lastScoreDate: d?.lastScoreDate as string | undefined,
          });
        },
        logErr('identityProfile')
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [uid]);

  const value = useMemo(
    () => ({
      uid,
      habits,
      dayLog,
      focusToday,
      journal,
      goals,
      logsByDate,
      nutritionTargets,
      nutritionIntake,
      shareProgressWithFriends,
      identityProfile,
      loading,
    }),
    [
      uid,
      habits,
      dayLog,
      focusToday,
      journal,
      goals,
      logsByDate,
      nutritionTargets,
      nutritionIntake,
      shareProgressWithFriends,
      identityProfile,
      loading,
    ]
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}
