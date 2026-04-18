import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  habitStore, habitLogStore, calcDailyScore, todayProgress,
  weekProgress, focusStore, journalStore, calcStreak,
  getLevel, identityStore, goalStore, today,
} from '../store.js';
import './Dashboard.css';

const MOTIVATIONAL = {
  high:   ["You're on fire. Don't stop.", "Elite execution today.", "This is what discipline looks like.", "Every rep, every check — it adds up."],
  mid:    ["You're building momentum. Keep going.", "Half the battle is showing up. You did.", "Stay consistent. The compound effect is real.", "Good progress. Push a bit harder tomorrow."],
  low:    ["Every legend starts somewhere. Begin now.", "The best time to start was yesterday. Do it today.", "One habit checked is better than zero.", "Show up for yourself. No one's coming to save you."],
};

function getMotivation(score) {
  const arr = score >= 70 ? MOTIVATIONAL.high : score >= 40 ? MOTIVATIONAL.mid : MOTIVATIONAL.low;
  const day  = new Date().getDay();
  return arr[day % arr.length];
}

export default function Dashboard({ onNav, onRefresh }) {
  const [habits,    setHabits]    = useState([]);
  const [dayLog,    setDayLog]    = useState({});
  const [goals,     setGoals]     = useState([]);
  const score   = calcDailyScore();
  const todayPct = todayProgress();
  const weekPct  = weekProgress();
  const focusSess = focusStore.getToday();
  const identity  = identityStore.get();
  const level     = getLevel(identity.totalScore ?? 0);
  const todayStr  = format(new Date(), 'EEEE, MMMM d');

  useEffect(() => {
    setHabits(habitStore.getAll());
    setDayLog(habitLogStore.getDay(today()));
    setGoals(goalStore.getAll());
  }, []);

  function toggle(habitId) {
    habitLogStore.toggle(habitId);
    setDayLog(habitLogStore.getDay(today()));
    onRefresh?.();
  }

  const bestStreak = Math.max(...habits.map(h => calcStreak(h.id)), 0);
  const topGoals   = goals.slice(0, 3);
  const motivation = getMotivation(score);

  // Score ring
  const circumference = 2 * Math.PI * 44;
  const offset        = circumference - (score / 100) * circumference;
  const scoreColor    = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-label">{todayStr}</div>
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div className={`badge ${score >= 70 ? 'badge-green' : score >= 40 ? 'badge-accent' : 'badge-gold'}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
            {level.title}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* ── Top stat cards ── */}
        <div className="dash-stats">
          {/* Score ring card */}
          <div className="card score-card">
            <div className="score-ring-wrap">
              <svg width="108" height="108" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r="44" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                <circle
                  cx="54" cy="54" r="44" fill="none"
                  stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 54 54)"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                />
                <text x="54" y="50" textAnchor="middle" fill={scoreColor} fontSize="22" fontWeight="900" fontFamily="Inter">{score}</text>
                <text x="54" y="65" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="Inter">/ 100</text>
              </svg>
            </div>
            <div className="score-label-main">Daily Score</div>
            <p className="motivation-quote">"{motivation}"</p>
          </div>

          {/* Quick stats */}
          <div className="dash-quick-stats">
            <StatCard label="Habits Today" value={`${todayPct}%`} sub={`${habits.filter(h => dayLog[h.id]).length} / ${habits.length} done`} color={todayPct >= 80 ? 'green' : 'accent'} icon="✔" />
            <StatCard label="Week Avg"     value={`${weekPct}%`}  sub="habit completion" color="accent" icon="📅" />
            <StatCard label="Focus Today"  value={focusSess}      sub="deep sessions"   color="gold"   icon="⚡" />
            <StatCard label="Best Streak"  value={`${bestStreak}d`} sub="personal record" color="gold" icon="🔥" />
          </div>
        </div>

        {/* ── Habits quick-check ── */}
        <div className="dash-section-title flex items-center justify-between mt-4 mb-2">
          <h3>Today's Habits</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav?.('habits')}>View all →</button>
        </div>
        <div className="dash-habits card">
          {habits.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No habits yet. <button className="btn btn-ghost btn-sm" onClick={() => onNav?.('habits')}>Add habits →</button></p>
            </div>
          ) : (
            <div className="habit-quick-list">
              {habits.map(h => {
                const done   = !!dayLog[h.id];
                const streak = calcStreak(h.id);
                return (
                  <button
                    key={h.id}
                    className={`habit-quick-item ${done ? 'done' : ''}`}
                    onClick={() => toggle(h.id)}
                  >
                    <div className={`habit-check ${done ? 'checked' : ''}`}>
                      {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <span className="habit-emoji">{h.emoji || '●'}</span>
                    <span className="habit-name">{h.name}</span>
                    <span className={`badge badge-muted cat-${h.category}`} style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>{h.category}</span>
                    {streak > 0 && <span className="streak-pill">🔥{streak}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div className="habit-progress-footer">
            <div className="progress-wrap" style={{ marginTop: '0.75rem' }}>
              <div className="progress-bar green" style={{ width: `${todayPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>{todayPct}% complete</span>
              <span>{habits.filter(h => dayLog[h.id]).length} / {habits.length}</span>
            </div>
          </div>
        </div>

        {/* ── Goals snapshot ── */}
        <div className="dash-section-title flex items-center justify-between mt-4 mb-2">
          <h3>Active Goals</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav?.('goals')}>View all →</button>
        </div>
        <div className="dash-goals">
          {topGoals.length === 0 ? (
            <div className="card empty-state"><p>No goals set yet.</p></div>
          ) : topGoals.map(g => {
            const ms  = g.milestones ?? [];
            const pct = ms.length ? Math.round((ms.filter(m => m.done).length / ms.length) * 100) : 0;
            return (
              <div key={g.id} className="card goal-snap">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm truncate" style={{ maxWidth: '70%' }}>{g.title}</span>
                  <span className={`badge ${g.priority === 'high' ? 'badge-red' : g.priority === 'medium' ? 'badge-gold' : 'badge-muted'}`}>{g.priority}</span>
                </div>
                <div className="progress-wrap mb-1">
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{pct}% complete</span>
                  <span>{ms.filter(m => m.done).length}/{ms.length} milestones</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  const c = color === 'green' ? 'var(--green-light)' : color === 'gold' ? 'var(--gold-light)' : 'var(--accent-light)';
  return (
    <div className="stat-card card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color: c }}>{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
