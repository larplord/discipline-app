'use client';

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import { todayProgress, weekProgress } from '@/lib/scoring';
import type { DayLog } from '@/lib/types';
import { calcStreak, getStreakSummary } from '@/lib/streaks';
import type { Habit } from '@/lib/types';
import { syncSharedSummary } from '@/lib/syncSharedSummary';
import '@/styles/pages/Habits.css';

const CATEGORIES = ['fitness', 'learning', 'business', 'mindset', 'sleep', 'health', 'other'];
const WHEEL_OUTCOMES = [
  {
    id: 'tier1',
    label: 'Tier 1',
    shortLabel: 'T1',
    weight: 40,
    color: '#10b981',
    text: 'Take your small reward.',
  },
  {
    id: 'tier2',
    label: 'Tier 2',
    shortLabel: 'T2',
    weight: 30,
    color: '#2563eb',
    text: 'Tier 2 landed. Check your paper tokens to see if it counts.',
  },
  {
    id: 'tier3',
    label: 'Tier 3',
    shortLabel: 'T3',
    weight: 20,
    color: '#f59e0b',
    text: 'Tier 3 landed. Check your paper tokens to see if it counts.',
  },
  {
    id: 'bonus',
    label: 'Bonus',
    shortLabel: 'Bonus',
    weight: 8,
    color: '#8b5cf6',
    text: 'Set a 10-minute timer and do a smaller extra action.',
  },
  {
    id: 'jackpot',
    label: 'Jackpot',
    shortLabel: 'Jackpot',
    weight: 2,
    color: '#ef4444',
    text: 'Jackpot. Take your rare larger reward.',
  },
] as const;

type WheelOutcome = (typeof WHEEL_OUTCOMES)[number];

const EMOJIS: Record<string, string> = {
  fitness: '🏋️',
  learning: '📚',
  business: '💼',
  mindset: '🧠',
  sleep: '😴',
  health: '🥗',
  other: '⚡',
};

export default function HabitsPage() {
  const {
    uid,
    habits,
    dayLog,
    logsByDate,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    shareProgressWithFriends,
    identityProfile,
  } = useUserData();
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Habit | null>(null);
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const [rewardSpins, setRewardSpins] = useState<Record<string, boolean>>({});
  const [localDayLog, setLocalDayLog] = useState<DayLog>({});
  const [activeWheelHabitId, setActiveWheelHabitId] = useState<string | null>(null);
  const [wheelResult, setWheelResult] = useState<WheelOutcome | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);

  const todayPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);
  const filtered = filter === 'all' ? habits : habits.filter((h) => h.category === filter);
  const effectiveDayLog = useMemo(() => ({ ...dayLog, ...localDayLog }), [dayLog, localDayLog]);
  const activeWheelHabit = habits.find((habit) => habit.id === activeWheelHabitId) ?? null;
  const wheelUnlocked = !!activeWheelHabitId && !!effectiveDayLog[activeWheelHabitId] && !rewardSpins[activeWheelHabitId];

  useEffect(() => {
    const db = getFirestoreDb();
    const t = todayKey();
    return onSnapshot(doc(db, 'users', uid, 'habitLogs', t), (snap) => {
      setRewardSpins((snap.data()?.rewardSpins as Record<string, boolean>) ?? {});
    });
  }, [uid]);

  useEffect(() => {
    setLocalDayLog({});
  }, [dayLog]);

  useEffect(() => {
    if (activeWheelHabitId && effectiveDayLog[activeWheelHabitId] && !rewardSpins[activeWheelHabitId]) return;
    const nextHabit = habits.find((habit) => effectiveDayLog[habit.id] && !rewardSpins[habit.id]);
    setActiveWheelHabitId(nextHabit?.id ?? null);
    if (nextHabit?.id !== activeWheelHabitId) setWheelResult(null);
  }, [activeWheelHabitId, effectiveDayLog, habits, rewardSpins]);

  async function toggle(id: string) {
    const db = getFirestoreDb();
    const t = todayKey();
    const ref = doc(db, 'users', uid, 'habitLogs', t);
    const snap = await getDoc(ref);
    const prev = (snap.data()?.entries as DayLog) ?? {};
    const wasDone = !!prev[id];
    const next = { ...prev, [id]: !wasDone };
    setLocalDayLog((current) => ({ ...current, [id]: !wasDone }));
    await setDoc(ref, { entries: next }, { merge: true });
    if (!wasDone) {
      setActiveWheelHabitId(id);
      setWheelResult(null);
    } else if (activeWheelHabitId === id) {
      setActiveWheelHabitId(null);
      setWheelResult(null);
    }
    await syncSharedSummary(db, uid, {
      habits,
      dayLog: next,
      logsByDate: { ...logsByDate, [t]: next },
      focusToday,
      journal,
      shareEnabled: shareProgressWithFriends,
      goals,
      nutritionTargets,
      nutritionIntake,
      identityTotalScore: identityProfile.totalScore,
      identityBestStreak: identityProfile.bestStreak ?? 0,
    });
  }

  async function onSave(data: Omit<Habit, 'id'>) {
    const db = getFirestoreDb();
    if (editTarget) {
      await updateDoc(doc(db, 'users', uid, 'habits', editTarget.id), data);
    } else {
      await addDoc(collection(db, 'users', uid, 'habits'), {
        ...data,
        order: habits.length,
      });
    }
    setShowForm(false);
    setEditTarget(null);
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this habit?')) return;
    await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'habits', id));
  }

  async function persistHabitOrder(nextHabits: Habit[]) {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    nextHabits.forEach((habit, index) => {
      batch.update(doc(db, 'users', uid, 'habits', habit.id), { order: index });
    });
    await batch.commit();
  }

  async function reorderHabits(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    const visibleHabits = [...filtered];
    const from = visibleHabits.findIndex((habit) => habit.id === sourceId);
    const to = visibleHabits.findIndex((habit) => habit.id === targetId);
    if (from < 0 || to < 0) return;

    const [moved] = visibleHabits.splice(from, 1);
    visibleHabits.splice(to, 0, moved);

    const visibleIds = new Set(visibleHabits.map((habit) => habit.id));
    let visibleIndex = 0;
    const nextHabits = habits.map((habit) => {
      if (!visibleIds.has(habit.id)) return habit;
      const next = visibleHabits[visibleIndex];
      visibleIndex += 1;
      return next;
    });

    await persistHabitOrder(nextHabits);
  }

  function startDrag(e: DragEvent<HTMLDivElement>, habitId: string) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', habitId);
    setDraggingHabitId(habitId);
  }

  function dragOver(e: DragEvent<HTMLDivElement>, habitId: string) {
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

  function endDrag() {
    setDraggingHabitId(null);
    setDragOverHabitId(null);
  }

  function pickWeightedOutcome() {
    const total = WHEEL_OUTCOMES.reduce((sum, outcome) => sum + outcome.weight, 0);
    let roll = Math.random() * total;
    for (const outcome of WHEEL_OUTCOMES) {
      roll -= outcome.weight;
      if (roll < 0) return outcome;
    }
    return WHEEL_OUTCOMES[0];
  }

  function outcomeCenterDegrees(outcome: WheelOutcome) {
    let start = 0;
    for (const option of WHEEL_OUTCOMES) {
      const size = option.weight * 3.6;
      if (option.id === outcome.id) return start + size / 2;
      start += size;
    }
    return 0;
  }

  async function spinWheel() {
    if (!activeWheelHabitId || !wheelUnlocked || wheelSpinning) return;
    const habitId = activeWheelHabitId;
    const result = pickWeightedOutcome();
    const center = outcomeCenterDegrees(result);
    const nextRotation = wheelRotation + 2160 + (360 - center);

    setWheelSpinning(true);
    setWheelResult(null);
    setWheelRotation(nextRotation);

    window.setTimeout(() => {
      setWheelResult(result);
      setWheelSpinning(false);
      setRewardSpins((prev) => ({ ...prev, [habitId]: true }));
      void setDoc(
        doc(getFirestoreDb(), 'users', uid, 'habitLogs', todayKey()),
        {
          rewardSpins: { ...rewardSpins, [habitId]: true },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }, 3800);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Habit Tracker</h1>
            <p className="page-subtitle">Build unbreakable consistency, one day at a time.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            + New Habit
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="habits-stats">
          <div className="hstat card">
            <div className="hstat-val" style={{ color: 'var(--green-light)' }}>
              {todayPct}%
            </div>
            <div className="hstat-label">Today</div>
            <div className="progress-wrap mt-2">
              <div className="progress-bar green" style={{ width: `${todayPct}%` }} />
            </div>
          </div>
          <div className="hstat card">
            <div className="hstat-val" style={{ color: 'var(--accent-light)' }}>
              {weekPct}%
            </div>
            <div className="hstat-label">This Week</div>
            <div className="progress-wrap mt-2">
              <div className="progress-bar" style={{ width: `${weekPct}%` }} />
            </div>
          </div>
          <div className="hstat card">
            <div className="hstat-val" style={{ color: 'var(--gold-light)' }}>{habits.length}</div>
            <div className="hstat-label">Total Habits</div>
          </div>
          <div className="hstat card">
            <div className="hstat-val" style={{ color: 'var(--gold-light)' }}>
              {Math.max(...habits.map((h) => calcStreak(h.id, logsByDate)), 0)}d
            </div>
            <div className="hstat-label">Best Streak</div>
          </div>
        </div>

        <div className="habit-filter-row">
          {['all', ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-pill ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        <section className={`habit-wheel-card card ${wheelUnlocked ? 'unlocked' : ''}`}>
          <div className="habit-wheel-copy">
            <div className="section-label">Reward Wheel</div>
            <h3>{activeWheelHabit ? activeWheelHabit.name : 'Complete a habit to unlock a spin'}</h3>
            <p>
              {wheelUnlocked
                ? 'One spin is ready for this completed habit.'
                : activeWheelHabitId && rewardSpins[activeWheelHabitId]
                  ? 'Spin used for this habit today. Complete another habit to spin again.'
                  : 'Mark a habit complete to unlock exactly one reward spin.'}
            </p>
          </div>
          <div className="habit-wheel-area">
            <div className="habit-wheel-pointer" aria-hidden="true" />
            <div className={`habit-wheel ${wheelSpinning ? 'spinning' : ''}`} style={{ transform: `rotate(${wheelRotation}deg)` }}>
              {WHEEL_OUTCOMES.map((outcome, index) => (
                <span key={outcome.id} className={`wheel-label wheel-label-${index}`}>{outcome.shortLabel}</span>
              ))}
              <div className="habit-wheel-center" aria-hidden="true">Reward</div>
            </div>
          </div>
          <div className="habit-wheel-actions">
            <div className="habit-wheel-legend" aria-label="Reward wheel outcomes">
              {WHEEL_OUTCOMES.map((outcome) => (
                <div key={outcome.id} className={`wheel-legend-row ${wheelResult?.id === outcome.id ? 'landed' : ''}`}>
                  <span className="wheel-legend-dot" style={{ background: outcome.color }} />
                  <span>{outcome.label}</span>
                  <strong>{outcome.weight}%</strong>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => void spinWheel()} disabled={!wheelUnlocked || wheelSpinning}>
              {wheelSpinning ? 'Spinning...' : wheelUnlocked ? 'Spin' : 'Locked'}
            </button>
            {wheelResult && (
              <div className={`habit-wheel-result result-${wheelResult.id}`}>
                <span>Landed on</span>
                <strong>{wheelResult.label}</strong>
                <p>{wheelResult.text}</p>
              </div>
            )}
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="card empty-state">
            <p>No habits yet. Add your first one!</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Add Habit
            </button>
          </div>
        ) : (
          <div className="habit-list">
            {filtered.map((h) => {
              const done = !!dayLog[h.id];
              const streak = getStreakSummary(h.id, logsByDate);
              return (
                <div
                  key={h.id}
                  className={`habit-card card ${done ? 'done' : ''} ${draggingHabitId === h.id ? 'dragging' : ''} ${dragOverHabitId === h.id && draggingHabitId !== h.id ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => startDrag(e, h.id)}
                  onDragOver={(e) => dragOver(e, h.id)}
                  onDrop={(e) => void dropHabit(e, h.id)}
                  onDragEnd={endDrag}
                >
                  <span className="habit-drag-handle" aria-hidden="true">⋮⋮</span>
                  <button type="button" className={`habit-toggle ${done ? 'checked' : ''}`} onClick={() => toggle(h.id)}>
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="habit-emoji-large">{h.emoji || EMOJIS[h.category] || '⚡'}</div>
                  <div className="habit-info">
                    <div className="habit-name-large">{h.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge cat-${h.category}`}>{h.category}</span>
                      {streak.active > 0 && <span className="streak-pill">🔥 {streak.active} day streak</span>}
                      {streak.active === 0 && streak.ended > 0 && (
                        <span className="streak-pill ended">🌬️ {streak.ended} day streak ended {streak.endedAgoDays}d ago</span>
                      )}
                    </div>
                  </div>
                  <div className="habit-actions">
                    {done && (
                      <button
                        type="button"
                        className={`btn btn-ghost btn-sm ${activeWheelHabitId === h.id ? 'active-wheel-btn' : ''}`}
                        onClick={() => {
                          setActiveWheelHabitId(h.id);
                          setWheelResult(null);
                        }}
                        disabled={!!rewardSpins[h.id]}
                      >
                        {rewardSpins[h.id] ? 'Spin used' : 'Reward'}
                      </button>
                    )}
                    <button type="button" className="btn-icon" title="Edit" onClick={() => { setEditTarget(h); setShowForm(true); }}>
                      ✎
                    </button>
                    <button type="button" className="btn-icon" title="Delete" onClick={() => onDelete(h.id)}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <HabitForm
          initial={editTarget}
          onSave={onSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function HabitForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Habit | null;
  onSave: (d: Omit<Habit, 'id'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'mindset');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, emoji: emoji || EMOJIS[category] || '⚡', targetDays: 7 });
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <h3>{initial ? 'Edit Habit' : 'New Habit'}</h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="section-label">Habit Name</label>
            <input className="input" placeholder="e.g. Morning workout" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="section-label">Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="section-label">Emoji (optional)</label>
            <input className="input" placeholder={`Default: ${EMOJIS[category]}`} value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
          </div>
          <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost w-full" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full">
              Save Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
