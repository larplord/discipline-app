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
import type { DayLog } from '@/lib/scoring';
import type { Habit, JournalEntry } from '@/lib/types';

export type UserDataContextValue = {
  uid: string;
  habits: Habit[];
  dayLog: DayLog;
  focusToday: number;
  journal: JournalEntry;
  loading: boolean;
};

const UserDataContext = createContext<UserDataContextValue | null>(null);

const emptyJournal: JournalEntry = {
  well: '',
  avoided: '',
  improve: '',
  freeform: '',
};

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[DisciplineOS][UserData] attach listeners', { uid });
    const db = getFirestoreDb();
    const unsubs: Unsubscribe[] = [];

    /* Do not gate UI on first snapshot — habitLogs can be slow; listeners still update state. */
    setLoading(false);

    const t = todayKey();
    const logErr = (label: string) => (e: unknown) =>
      console.warn('[DisciplineOS][UserData][error]', label, e);

    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'habits'),
        (snap) => {
          const list: Habit[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Habit, 'id'>) }));
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

    return () => {
      console.log('[DisciplineOS][UserData] detach listeners', { uid });
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
      loading,
    }),
    [uid, habits, dayLog, focusToday, journal, loading]
  );

  return (
    <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>
  );
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}
