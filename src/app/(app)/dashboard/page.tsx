'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { calcDailyScore, todayProgress, weekProgress } from '@/lib/scoring';
import type { DayLog } from '@/lib/scoring';
import { calcStreak } from '@/lib/streaks';
import { getLevel } from '@/lib/levels';
import type { Goal, IdentityDoc } from '@/lib/types';
import '@/styles/pages/Dashboard.css';

const MOTIVATIONAL = {
  high: [
    "You're on fire. Don't stop.",
    'Elite execution today.',
    'This is what discipline looks like.',
  ],
  mid: [
    "You're building momentum. Keep going.",
    'Half the battle is showing up. You did.',
    'Stay consistent. The compound effect is real.',
  ],
  low: [
    'Every legend starts somewhere. Begin now.',
    'The best time to start was yesterday. Do it today.',
    'Show up for yourself.',
  ],
};

export default function DashboardPage() {
  const { uid, habits, dayLog, focusToday, journal } = useUserData();
  const [logsByDate, setLogsByDate] = useState<Record<string, DayLog>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [identity, setIdentity] = useState<IdentityDoc>({
    totalScore: 0,
    bestStreak: 0,
  });
  const [shareEnabled, setShareEnabled] = useState(false);
  const [mvpHabits, setMvpHabits] = useState<
    { id: string; name: string; completed: boolean; createdAt?: { toDate?: () => Date } | null }[]
  >([]);
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    const db = getFirestoreDb();
    const unsubs = [
      onSnapshot(collection(db, 'users', uid, 'habitLogs'), (snap) => {
        const m: Record<string, DayLog> = {};
        snap.forEach((d) => {
          m[d.id] = (d.data()?.entries as DayLog) ?? {};
        });
        setLogsByDate(m);
      }),
      onSnapshot(collection(db, 'users', uid, 'goals'), (snap) => {
        const g: Goal[] = [];
        snap.forEach((d) => g.push({ id: d.id, ...(d.data() as Omit<Goal, 'id'>) }));
        setGoals(g);
      }),
      onSnapshot(doc(db, 'users', uid, 'identity', 'profile'), (snap) => {
        const d = snap.data();
        setIdentity({
          totalScore: Number(d?.totalScore ?? 0),
          bestStreak: Number(d?.bestStreak ?? 0),
          lastScoreDate: d?.lastScoreDate as string | undefined,
        });
      }),
      onSnapshot(doc(db, 'users', uid, 'settings', 'privacy'), (snap) => {
        setShareEnabled(!!snap.data()?.shareProgressWithFriends);
      }),
      onSnapshot(collection(db, 'users', uid, 'mvpHabits'), (snap) => {
        const list: { id: string; name: string; completed: boolean; createdAt?: { toDate?: () => Date } | null }[] = [];
        snap.forEach((d) => {
          const x = d.data();
          list.push({
            id: d.id,
            name: String(x?.name ?? ''),
            completed: Boolean(x?.completed),
            createdAt: x?.createdAt as { toDate?: () => Date } | null,
          });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setMvpHabits(list);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const score = calcDailyScore({ habits, dayLog, focusToday, journal });
  const todayPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);
  const level = getLevel(identity.totalScore ?? 0);
  const todayStr = format(new Date(), 'EEEE, MMMM d');
  const motivation =
    (score >= 70 ? MOTIVATIONAL.high : score >= 40 ? MOTIVATIONAL.mid : MOTIVATIONAL.low)[
      new Date().getDay() % 3
    ];

  async function addMvpHabit() {
    const name = newHabitName.trim();
    if (!name) return;
    const db = getFirestoreDb();
    await addDoc(collection(db, 'users', uid, 'mvpHabits'), {
      name,
      createdAt: serverTimestamp(),
      completed: false,
    });
    setNewHabitName('');
  }

  async function toggleMvpHabit(habitId: string, completed: boolean) {
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'users', uid, 'mvpHabits', habitId), { completed: !completed });
  }

  const bestStreak = Math.max(
    ...habits.map((h) => calcStreak(h.id, logsByDate)),
    identity.bestStreak ?? 0,
    0
  );
  const topGoals = goals.slice(0, 3);

  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-label">{todayStr}</div>
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div
            className={`badge ${score >= 70 ? 'badge-green' : score >= 40 ? 'badge-accent' : 'badge-gold'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
          >
            {level.title}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="dash-stats">
          <div className="card score-card">
            <div className="score-ring-wrap">
              <svg width="108" height="108" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r="44" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                <circle
                  cx="54"
                  cy="54"
                  r="44"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 54 54)"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                />
                <text x="54" y="50" textAnchor="middle" fill={scoreColor} fontSize="22" fontWeight="900">
                  {score}
                </text>
                <text x="54" y="65" textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                  points
                </text>
              </svg>
            </div>
            <div className="score-label-main">Daily Score</div>
            <p className="motivation-quote">&ldquo;{motivation}&rdquo;</p>
          </div>

          <div className="dash-quick-stats">
            <StatCard
              label="Habits Today"
              value={`${todayPct}%`}
              sub={`${habits.filter((h) => dayLog[h.id]).length} / ${habits.length} done`}
              color="green"
              icon="✔"
            />
            <StatCard label="Week Avg" value={`${weekPct}%`} sub="habit completion" color="accent" icon="📅" />
            <StatCard label="Focus Today" value={focusToday} sub="deep sessions" color="gold" icon="⚡" />
            <StatCard label="Best Streak" value={`${bestStreak}d`} sub="personal record" color="gold" icon="🔥" />
          </div>
        </div>

        <div className="dash-section-title flex items-center justify-between mt-4 mb-2">
          <h3>Habits</h3>
        </div>
        <div className="dash-habits card">
          <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 160 }}
              placeholder="New habit name"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addMvpHabit()}
            />
            <button type="button" className="btn btn-primary" onClick={() => void addMvpHabit()}>
              Add
            </button>
          </div>
          {mvpHabits.length === 0 ? (
            <p className="text-muted text-sm">No habits yet. Add one above.</p>
          ) : (
            <ul className="flex-col gap-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
              {mvpHabits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border)',
                    opacity: h.completed ? 0.65 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={h.completed}
                    onChange={() => void toggleMvpHabit(h.id, h.completed)}
                    aria-label={`Toggle ${h.name}`}
                  />
                  <span style={{ textDecoration: h.completed ? 'line-through' : 'none', flex: 1 }}>{h.name}</span>
                  <span className="text-xs text-muted">
                    {h.createdAt?.toDate ? h.createdAt.toDate().toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="habit-progress-footer">
            <div className="progress-wrap" style={{ marginTop: '0.75rem' }}>
              <div
                className="progress-bar green"
                style={{
                  width: `${
                    mvpHabits.length
                      ? Math.round((mvpHabits.filter((h) => h.completed).length / mvpHabits.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>
                {mvpHabits.length
                  ? `${Math.round((mvpHabits.filter((h) => h.completed).length / mvpHabits.length) * 100)}% done`
                  : '0% done'}
              </span>
              <span>
                {mvpHabits.filter((h) => h.completed).length} / {mvpHabits.length}
              </span>
            </div>
          </div>
        </div>

        <div className="dash-section-title flex items-center justify-between mt-4 mb-2">
          <h3>Active Goals</h3>
          <Link href="/goals" className="btn btn-ghost btn-sm">
            View all →
          </Link>
        </div>
        <div className="dash-goals">
          {topGoals.length === 0 ? (
            <div className="card empty-state">
              <p>No goals set yet.</p>
            </div>
          ) : (
            topGoals.map((g) => {
              const ms = g.milestones ?? [];
              const pct = ms.length ? Math.round((ms.filter((m) => m.done).length / ms.length) * 100) : 0;
              return (
                <div key={g.id} className="card goal-snap">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm truncate" style={{ maxWidth: '70%' }}>
                      {g.title}
                    </span>
                    <span
                      className={`badge ${
                        g.priority === 'high'
                          ? 'badge-red'
                          : g.priority === 'medium'
                            ? 'badge-gold'
                            : 'badge-muted'
                      }`}
                    >
                      {g.priority}
                    </span>
                  </div>
                  <div className="progress-wrap mb-1">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{pct}% complete</span>
                    <span>
                      {ms.filter((m) => m.done).length}/{ms.length} milestones
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: 'green' | 'gold' | 'accent';
  icon: string;
}) {
  const c =
    color === 'green' ? 'var(--green-light)' : color === 'gold' ? 'var(--gold-light)' : 'var(--accent-light)';
  return (
    <div className="stat-card card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color: c }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
