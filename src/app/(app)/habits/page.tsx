'use client';

import { useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import { todayProgress, weekProgress } from '@/lib/scoring';
import type { DayLog } from '@/lib/types';
import { calcStreak } from '@/lib/streaks';
import type { Habit } from '@/lib/types';
import { syncSharedSummary } from '@/lib/syncSharedSummary';
import '@/styles/pages/Habits.css';

const CATEGORIES = ['fitness', 'learning', 'business', 'mindset', 'sleep', 'health', 'other'];
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

  const todayPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);
  const filtered = filter === 'all' ? habits : habits.filter((h) => h.category === filter);

  async function toggle(id: string) {
    const db = getFirestoreDb();
    const t = todayKey();
    const ref = doc(db, 'users', uid, 'habitLogs', t);
    const snap = await getDoc(ref);
    const prev = (snap.data()?.entries as DayLog) ?? {};
    const next = { ...prev, [id]: !prev[id] };
    await setDoc(ref, { entries: next }, { merge: true });
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
      await addDoc(collection(db, 'users', uid, 'habits'), data);
    }
    setShowForm(false);
    setEditTarget(null);
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this habit?')) return;
    await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'habits', id));
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
              const streak = calcStreak(h.id, logsByDate);
              return (
                <div key={h.id} className={`habit-card card ${done ? 'done' : ''}`}>
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
                      {streak > 0 && <span className="streak-pill">🔥 {streak} day streak</span>}
                    </div>
                  </div>
                  <div className="habit-actions">
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
