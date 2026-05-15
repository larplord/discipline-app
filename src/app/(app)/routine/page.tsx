'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { RoutineTimePicker } from '@/components/RoutineTimePicker';
import type { Routine } from '@/lib/types';
import {
  formatTimeLabel,
  getRoutineDuration,
  getRoutineProgress,
  routineStatusLabel,
  validateRoutineTimes,
} from '@/lib/routines';
import '@/styles/pages/Routine.css';

type RoutineForm = {
  name: string;
  startTime: string;
  endTime: string;
  majorIntervalMinutes: 5 | 15;
};

type RoutineCardModel = Routine & { placeholder?: boolean; forcedStatus?: 'complete' | 'upcoming'; forcedPct?: number };

const PLACEHOLDER_ROUTINES: RoutineCardModel[] = [
  {
    id: '__placeholder-morning',
    name: 'Morning',
    startTime: '06:00',
    endTime: '08:00',
    majorIntervalMinutes: 15,
    steps: {},
    placeholder: true,
    forcedStatus: 'complete',
    forcedPct: 100,
  },
  {
    id: '__placeholder-night',
    name: 'Night',
    startTime: '20:00',
    endTime: '22:00',
    majorIntervalMinutes: 15,
    steps: {},
    placeholder: true,
    forcedStatus: 'upcoming',
    forcedPct: 0,
  },
];

export default function RoutinePage() {
  const { uid } = useUserData();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [form, setForm] = useState<RoutineForm>({
    name: '',
    startTime: '07:00',
    endTime: '08:00',
    majorIntervalMinutes: 5,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'users', uid, 'routines'), (snap) => {
      const list: Routine[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Routine, 'id'>) }));
      list.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name));
      setRoutines(list);
    });
  }, [uid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const routineCards = useMemo<RoutineCardModel[]>(() => [...PLACEHOLDER_ROUTINES, ...routines], [routines]);

  const summary = useMemo(() => {
    let running = 0;
    let complete = 1;
    for (const routine of routines) {
      const status = getRoutineProgress(routine.startTime, routine.endTime, now).status;
      if (status === 'running') running += 1;
      if (status === 'complete') complete += 1;
    }
    return { saved: routineCards.length, running, complete };
  }, [routines, routineCards.length, now]);

  function updateForm<K extends keyof RoutineForm>(key: K, value: RoutineForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createRoutine(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError('Name your routine first.');
      return;
    }
    const timingError = validateRoutineTimes(form.startTime, form.endTime);
    if (timingError) {
      setError(timingError);
      return;
    }

    setBusy(true);
    try {
      await addDoc(collection(getFirestoreDb(), 'users', uid, 'routines'), {
        name,
        startTime: form.startTime,
        endTime: form.endTime,
        majorIntervalMinutes: form.majorIntervalMinutes,
        steps: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setForm((prev) => ({ ...prev, name: '' }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create routine.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="routine-hud-page fade-in">
      <div className="routine-hud-bg" aria-hidden="true" />
      <header className="routine-hud-header">
        <div>
          <h1>Routine</h1>
          <p>Build repeatable timelines for morning, night, and future operating blocks.</p>
        </div>
        <Link href="/dashboard" className="routine-dashboard-link">← Dashboard</Link>
      </header>

      <div className="page-body routine-page routine-hud-body">
        {error && <div className="routine-alert">{error}</div>}

        <section className="routine-command-grid">
          <form className="routine-create card routine-hud-panel" onSubmit={createRoutine}>
            <div className="routine-panel-heading">
              <span className="routine-panel-icon" aria-hidden="true">▦</span>
              <div>
                <div className="routine-section-title">Create routine</div>
                <p className="routine-section-sub">Start with a name and a clear time window.</p>
              </div>
            </div>
            <label>
              <span className="section-label">Routine name</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Morning reset"
              />
            </label>
            <div className="routine-form-row">
              <RoutineTimePicker label="Start" value={form.startTime} onChange={(value) => updateForm('startTime', value)} />
              <RoutineTimePicker label="End" value={form.endTime} onChange={(value) => updateForm('endTime', value)} />
            </div>
            <label>
              <span className="section-label">Major markers</span>
              <select
                className="select"
                value={form.majorIntervalMinutes}
                onChange={(e) => updateForm('majorIntervalMinutes', Number(e.target.value) as 5 | 15)}
              >
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary routine-create-button" disabled={busy}>
              <span>+</span> Create Routine
            </button>
          </form>

          <section className="routine-summary card routine-hud-panel">
            <div className="routine-panel-heading">
              <span className="routine-panel-icon" aria-hidden="true">⌖</span>
              <div className="routine-section-title">Today&apos;s routines</div>
            </div>
            <div className="routine-card-grid">
              {routineCards.map((routine) => (
                <RoutineCard key={routine.id} routine={routine} now={now} />
              ))}
            </div>
            <div className="routine-summary-stats">
              <SummaryStat value={summary.saved} label="Saved" tone="accent" />
              <SummaryStat value={summary.running} label="Running" tone="green" />
              <SummaryStat value={summary.complete} label="Complete" tone="gold" />
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function SummaryStat({ value, label, tone }: { value: number; label: string; tone: 'accent' | 'green' | 'gold' }) {
  return (
    <div className="routine-summary-stat">
      <span className={tone}>{value}</span>
      {label}
    </div>
  );
}

function RoutineCard({ routine, now }: { routine: RoutineCardModel; now: Date }) {
  const computedProgress = getRoutineProgress(routine.startTime, routine.endTime, now);
  const progress = routine.forcedStatus
    ? { status: routine.forcedStatus === 'complete' ? 'complete' : 'upcoming', pct: routine.forcedPct ?? 0 }
    : computedProgress;
  const duration = getRoutineDuration(routine.startTime, routine.endTime) ?? 0;
  const content = (
    <>
      <div className="routine-card-top">
        <div>
          <h3>{routine.name}</h3>
          <p>{formatTimeLabel(routine.startTime)} - {formatTimeLabel(routine.endTime)}</p>
        </div>
        <span className={`routine-status ${progress.status}`}>{routineStatusLabel(progress.status)}</span>
      </div>
      <div className="routine-card-meta">
        <span>{duration} min</span>
        <span>Major every {routine.majorIntervalMinutes}m</span>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar routine-progress-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <div className="routine-card-footer">
        <span>{progress.pct}% today</span>
        <span>{routine.placeholder ? 'Placeholder' : 'Open timeline'}</span>
      </div>
    </>
  );

  if (routine.placeholder) {
    return <div className="routine-card card routine-placeholder-card">{content}</div>;
  }

  return <Link href={`/routine/${routine.id}`} className="routine-card card">{content}</Link>;
}
