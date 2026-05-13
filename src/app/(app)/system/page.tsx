'use client';

import Link from 'next/link';
import { useEffect, useState, type DragEvent } from 'react';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayProgress, weekProgress } from '@/lib/scoring';
import { calcStreak } from '@/lib/streaks';
import { formatTimeLabel, getRoutineDuration, getRoutineProgress, routineStatusLabel } from '@/lib/routines';
import type { Routine } from '@/lib/types';
import '@/styles/pages/System.css';

function goalProgress(goal: { milestones?: { done: boolean }[] }) {
  const ms = goal.milestones ?? [];
  if (!ms.length) return 0;
  return Math.round((ms.filter((m) => m.done).length / ms.length) * 100);
}

export default function SystemPage() {
  const { uid, habits, dayLog, logsByDate, goals } = useUserData();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const habitsPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'users', uid, 'routines'), (snap) => {
      const list: Routine[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Routine, 'id'>) }));
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setRoutines(list);
    });
  }, [uid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  async function persistHabitOrder(nextHabits: typeof habits) {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    nextHabits.forEach((habit, index) => {
      batch.update(doc(db, 'users', uid, 'habits', habit.id), { order: index });
    });
    await batch.commit();
  }

  async function reorderHabits(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const nextHabits = [...habits];
    const from = nextHabits.findIndex((habit) => habit.id === sourceId);
    const to = nextHabits.findIndex((habit) => habit.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = nextHabits.splice(from, 1);
    nextHabits.splice(to, 0, moved);
    await persistHabitOrder(nextHabits);
  }

  function startHabitDrag(e: DragEvent<HTMLDivElement>, habitId: string) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', habitId);
    setDraggingHabitId(habitId);
  }

  function dragHabitOver(e: DragEvent<HTMLDivElement>, habitId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverHabitId(habitId);
  }

  async function dropHabit(e: DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingHabitId;
    setDraggingHabitId(null);
    setDragOverHabitId(null);
    if (!sourceId) return;
    await reorderHabits(sourceId, targetId);
  }

  function endHabitDrag() {
    setDraggingHabitId(null);
    setDragOverHabitId(null);
  }

  return (
    <main className="fade-in system-page system-fullscreen">
      <div className="system-bg-grid" aria-hidden />
      <header className="system-topbar">
        <Link href="/dashboard" className="system-back-btn">← Main Dashboard</Link>
        <div>
          <span>Command module</span>
          <h1>Habits / Goals / Routines</h1>
          <p>Your daily operating system: what you repeat, what you are chasing, and the routines that keep you moving.</p>
        </div>
      </header>

      <section className="system-command-grid">
        <div className="system-column">
          <ModuleHeader kicker="Daily checklist" title="Habits" meta={`${habitsPct}% today · ${weekPct}% week`} />
          <div className="system-card-stack">
            {habits.length === 0 ? <EmptyModule text="No habits yet." href="/habits" /> : habits.map((habit) => {
              const done = !!dayLog[habit.id];
              const streak = calcStreak(habit.id, logsByDate);
              return (
                <div
                  key={habit.id}
                  className={`system-habit-row ${done ? 'complete' : ''} ${draggingHabitId === habit.id ? 'dragging' : ''} ${dragOverHabitId === habit.id && draggingHabitId !== habit.id ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => startHabitDrag(e, habit.id)}
                  onDragOver={(e) => dragHabitOver(e, habit.id)}
                  onDrop={(e) => void dropHabit(e, habit.id)}
                  onDragEnd={endHabitDrag}
                >
                  <span className="system-drag" title="Drag to reorder">⋮⋮</span>
                  <span className="system-check">{done ? '✓' : ''}</span>
                  <span className="system-emoji">{habit.emoji || '⚡'}</span>
                  <Link href="/habits" className="system-row-main">
                    <strong>{habit.name}</strong>
                    <em>{habit.category}</em>
                  </Link>
                  <span className="system-streak">🔥 {streak}d</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="system-column">
          <ModuleHeader kicker="Milestones" title="Goals" meta={`${goals.length} active`} />
          <div className="system-card-stack">
            {goals.length === 0 ? <EmptyModule text="No goals yet." href="/goals" /> : goals.slice(0, 6).map((goal) => {
              const pct = goalProgress(goal);
              return (
                <Link href={`/goals/${goal.id}`} key={goal.id} className="system-goal-row">
                  <div className="system-goal-top">
                    <strong>{goal.title}</strong>
                    <span className={`system-priority ${goal.priority}`} />
                  </div>
                  <div className="system-goal-meta">
                    <span>{goal.deadline ?? 'No deadline'}</span>
                    <em>{pct}%</em>
                  </div>
                  <div className="system-progress"><div style={{ width: `${pct}%` }} /></div>
                  <div className="system-goal-actions"><span>Open goal detail</span><b>▶</b></div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="system-column">
          <ModuleHeader kicker="Repeatable flows" title="Routines" meta={`${routines.length} saved`} />
          <div className="system-card-stack">
            {routines.length === 0 ? <EmptyModule text="No routines yet." href="/routine" /> : routines.slice(0, 5).map((routine) => {
              const progress = getRoutineProgress(routine.startTime, routine.endTime, now);
              const duration = getRoutineDuration(routine.startTime, routine.endTime) ?? 0;
              return (
                <Link href={`/routine/${routine.id}`} key={routine.id} className="system-routine-row">
                  <div className="system-routine-top">
                    <strong>{routine.name}</strong>
                    <span className={progress.status}>{routineStatusLabel(progress.status)}</span>
                  </div>
                  <p>{formatTimeLabel(routine.startTime)} - {formatTimeLabel(routine.endTime)}</p>
                  <div className="system-routine-meta"><span>{duration} min</span><span>Major every {routine.majorIntervalMinutes}m</span></div>
                  <div className="system-progress"><div style={{ width: `${progress.pct}%` }} /></div>
                  <div className="system-goal-actions"><span>{progress.pct}% today</span><b>Open timeline</b></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function ModuleHeader({ kicker, title, meta }: { kicker: string; title: string; meta: string }) {
  return (
    <div className="system-module-header">
      <span>{kicker}</span>
      <div>
        <h2>{title}</h2>
        <strong>{meta}</strong>
      </div>
    </div>
  );
}

function EmptyModule({ text, href }: { text: string; href: string }) {
  return <Link href={href} className="system-empty-module">{text} Add one →</Link>;
}
