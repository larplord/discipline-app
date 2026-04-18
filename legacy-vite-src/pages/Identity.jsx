import { useState, useEffect } from 'react';
import { identityStore, getLevel, calcStreak, habitStore, focusStore, calcDailyScore, weekProgress } from '../store.js';
import './Identity.css';

const LEVELS = [
  { min: 0,    title: 'Beginner',    rank: 1, desc: 'You\'ve taken your first step. Keep going.', icon: '🌱' },
  { min: 100,  title: 'Consistent',  rank: 2, desc: 'You show up. Most people don\'t.', icon: '⚡' },
  { min: 300,  title: 'Disciplined', rank: 3, desc: 'You do what\'s required, when required.', icon: '🎯' },
  { min: 700,  title: 'Executor',    rank: 4, desc: 'Ideas are nothing. Execution is everything.', icon: '🔥' },
  { min: 1500, title: 'Iron-Willed', rank: 5, desc: 'Your will is your greatest weapon.', icon: '⚔️' },
  { min: 3000, title: 'Elite',       rank: 6, desc: 'You operate at a level few ever reach.', icon: '🏆' },
  { min: 6000, title: 'Legend',      rank: 7, desc: 'You\'ve built something most only dream of.', icon: '👑' },
];

export default function Identity({ onRefresh }) {
  const [identity, setIdentity] = useState(identityStore.get());
  const [habits,   setHabits]   = useState([]);
  const dailyScore = calcDailyScore();
  const weekPct    = weekProgress();

  useEffect(() => {
    setHabits(habitStore.getAll());
    // Auto-add today's score contribution
    const id = identityStore.get();
    if (!id.lastScoreDate || id.lastScoreDate !== new Date().toISOString().slice(0,10)) {
      identityStore.addScore(dailyScore);
      identityStore.get().lastScoreDate = new Date().toISOString().slice(0,10);
    }
    setIdentity(identityStore.get());
  }, []);

  const level     = getLevel(identity.totalScore ?? 0);
  const nextLevel  = LEVELS.find(l => l.min > (identity.totalScore ?? 0));
  const progress   = nextLevel
    ? ((identity.totalScore - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

  const bestStreak = Math.max(...habits.map(h => calcStreak(h.id)), identity.bestStreak ?? 0, 0);
  const totalFocus = Object.values(focusStore.getAll()).reduce((a, b) => a + b, 0);

  const currentLevelInfo = LEVELS.find(l => l.title === level.title) ?? LEVELS[0];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Identity</h1>
        <p className="page-subtitle">Who you become is a result of what you do consistently.</p>
      </div>

      <div className="page-body">
        {/* Level card */}
        <div className="card identity-hero">
          <div className="identity-icon">{currentLevelInfo.icon}</div>
          <div className="identity-title">{level.title}</div>
          <div className="identity-desc">{currentLevelInfo.desc}</div>
          <div className="identity-rank">Rank {level.rank} / {LEVELS.length}</div>

          <div className="identity-xp-wrap">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{identity.totalScore?.toFixed(0) ?? 0} XP</span>
              <span>{nextLevel ? `${nextLevel.min} XP to ${nextLevel.title}` : 'MAX LEVEL'}</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar gold" style={{ width:`${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Personal records */}
        <h3 className="mt-4 mb-3">Personal Records</h3>
        <div className="pr-grid">
          <PRCard icon="🔥" value={`${bestStreak}d`} label="Best Streak" color="gold" />
          <PRCard icon="⚡" value={totalFocus}       label="Focus Sessions" color="accent" />
          <PRCard icon="📊" value={`${weekPct}%`}    label="Weekly Average" color="green" />
          <PRCard icon="🏅" value={`${dailyScore}/100`} label="Today's Score" color={dailyScore >= 70 ? 'green' : dailyScore >= 40 ? 'accent' : 'gold'} />
        </div>

        {/* Level progression */}
        <h3 className="mt-4 mb-3">Rank Progression</h3>
        <div className="levels-list">
          {LEVELS.map(l => {
            const unlocked = (identity.totalScore ?? 0) >= l.min;
            const isCurrent = l.title === level.title;
            return (
              <div key={l.title} className={`level-item card ${isCurrent ? 'current' : ''} ${!unlocked ? 'locked' : ''}`}>
                <div className="level-icon">{unlocked ? l.icon : '🔒'}</div>
                <div className="level-info">
                  <div className="level-name">{l.title}</div>
                  <div className="level-desc text-xs text-muted">{l.desc}</div>
                </div>
                <div className="level-req">
                  <span className={`badge ${unlocked ? 'badge-green' : 'badge-muted'}`}>
                    {l.min === 0 ? 'Starter' : `${l.min} XP`}
                  </span>
                  {isCurrent && <span className="badge badge-accent" style={{ marginLeft:'0.35rem' }}>YOU</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Habit streaks */}
        {habits.length > 0 && (
          <>
            <h3 className="mt-4 mb-3">Current Streaks</h3>
            <div className="streak-grid">
              {habits.map(h => {
                const s = calcStreak(h.id);
                return (
                  <div key={h.id} className="streak-card card">
                    <div className="streak-emoji">{h.emoji || '⚡'}</div>
                    <div className="streak-name truncate">{h.name}</div>
                    <div className="streak-val" style={{ color: s > 0 ? 'var(--gold-light)' : 'var(--text-muted)' }}>
                      {s > 0 ? `🔥 ${s}d` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PRCard({ icon, value, label, color }) {
  const c = color === 'green' ? 'var(--green-light)' : color === 'gold' ? 'var(--gold-light)' : 'var(--accent-light)';
  return (
    <div className="card pr-card">
      <div className="pr-icon">{icon}</div>
      <div className="pr-val" style={{ color:c }}>{value}</div>
      <div className="pr-label">{label}</div>
    </div>
  );
}
