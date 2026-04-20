'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import { calcDailyScore, todayProgress, weekProgress } from '@/lib/scoring';
import { syncSharedSummary } from '@/lib/syncSharedSummary';
import { calcStreak } from '@/lib/streaks';
import { getLevel } from '@/lib/levels';
import type { DayLog, Goal } from '@/lib/types';
import '@/styles/pages/Habits.css';
import '@/styles/pages/Dashboard.css';

const EMOJIS: Record<string, string> = {
  fitness: '\u{1F3CB}\uFE0F',
  learning: '\u{1F4DA}',
  business: '\u{1F4BC}',
  mindset: '\u{1F9E0}',
  sleep: '\u{1F634}',
  health: '\u{1F957}',
  other: '\u26A1',
};

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
  const {
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
  } = useUserData();

  async function toggleHabit(habitId: string) {
    const db = getFirestoreDb();
    const t = todayKey();
    const ref = doc(db, 'users', uid, 'habitLogs', t);
    const snap = await getDoc(ref);
    const prev = (snap.data()?.entries as DayLog) ?? {};
    const next = { ...prev, [habitId]: !prev[habitId] };
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

  const score = calcDailyScore({
    habits,
    dayLog,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    logsByDate,
  });
  const todayPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);
  const level = getLevel(identityProfile.totalScore ?? 0);
  const todayStr = format(new Date(), 'EEEE, MMMM d');
  const motivation =
    (score >= 70 ? MOTIVATIONAL.high : score >= 40 ? MOTIVATIONAL.mid : MOTIVATIONAL.low)[
      new Date().getDay() % 3
    ];

  const bestStreak = Math.max(
    ...habits.map((h) => calcStreak(h.id, logsByDate)),
    identityProfile.bestStreak ?? 0,
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

        <div className="dash-section-title flex items-center justify-between flex-wrap gap-3 mt-4 mb-3">
          <div>
            <h3 className="dash-section-heading">Today&apos;s habits</h3>
            <p className="dash-section-sub">Same list as Habit Tracker — check in from here or manage details on the Habits tab.</p>
          </div>
          <Link href="/habits" className="btn btn-ghost btn-sm">
            Manage habits →
          </Link>
        </div>
        <div className="dash-habits-panel card">
          {habits.length === 0 ? (
            <div className="dash-habits-empty">
              <p className="text-muted text-sm">No habits yet. Create them in Habit Tracker to see them here.</p>
              <Link href="/habits" className="btn btn-primary btn-sm">
                Go to Habits
              </Link>
            </div>
          ) : (
            <>
              <div className="habit-list dash-habit-list">
                {habits.map((h) => {
                  const done = !!dayLog[h.id];
                  const streak = calcStreak(h.id, logsByDate);
                  return (
                    <div key={h.id} className={`habit-card dash-habit-card ${done ? 'done' : ''}`}>
                      <button
                        type="button"
                        className={`habit-toggle ${done ? 'checked' : ''}`}
                        onClick={() => void toggleHabit(h.id)}
                        aria-label={done ? `Mark ${h.name} incomplete` : `Complete ${h.name}`}
                      >
                        {done && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="habit-emoji-large">{h.emoji || EMOJIS[h.category] || '\u26A1'}</div>
                      <div className="habit-info">
                        <div className="habit-name-large">{h.name}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`badge cat-${h.category}`}>{h.category}</span>
                          {streak > 0 && (
                            <span className="streak-pill">
                              {'\u{1F525}'} {streak}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="habit-progress-footer dash-habit-footer">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Daily completion</span>
                  <span className="font-mono">
                    {habits.filter((h) => dayLog[h.id]).length}/{habits.length}
                  </span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar green" style={{ width: `${todayPct}%` }} />
                </div>
              </div>
            </>
          )}
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
