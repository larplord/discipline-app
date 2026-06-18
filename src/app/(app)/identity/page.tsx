'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { calcDailyScore, weekProgress } from '@/lib/scoring';
import { calcStreak } from '@/lib/streaks';
import { getLevel } from '@/lib/levels';
import { syncIdentityProgress } from '@/lib/syncIdentityProgress';
import type { IdentityDoc } from '@/lib/types';
import '@/styles/pages/Identity.css';

const LEVELS_UI = [
  {
    min: 0,
    title: 'Manual Mode',
    rank: 1,
    desc: 'You are building the base system: habits, focus, journal, and proof of work.',
    icon: '🌱',
    assistantUpgrade: 'Noen stays mostly manual: rule-based dashboard reads and simple tracking only.',
    milestone: 'Use the app for 3 days and log your first focus sessions.',
  },
  {
    min: 100,
    title: 'Noen Seed',
    rank: 2,
    desc: 'The assistant becomes part of the command center instead of a separate idea.',
    icon: '🧭',
    assistantUpgrade: 'Unlock a private Assistant page/chat prototype with strict access for Daniel only.',
    milestone: 'Keep routines alive for a week and write clear daily debriefs.',
  },
  {
    min: 300,
    title: 'Daily Coach',
    rank: 3,
    desc: 'Your system starts pushing you toward the next useful action every day.',
    icon: '⚡',
    assistantUpgrade: 'Noen can read today’s habits, focus, journal, and goals to generate daily coaching.',
    milestone: 'Build a 7-day streak and complete at least 5 focus sessions.',
  },
  {
    min: 700,
    title: 'Memory Core',
    rank: 4,
    desc: 'The command center starts remembering patterns instead of only showing today.',
    icon: '🧠',
    assistantUpgrade: 'Add durable memory summaries, project context, and weekly review history.',
    milestone: 'Complete two weekly reviews and keep project logs updated.',
  },
  {
    min: 1500,
    title: 'Project Operator',
    rank: 5,
    desc: 'Noen becomes useful for execution: projects, money experiments, and real decisions.',
    icon: '🔥',
    assistantUpgrade: 'Unlock project-aware coaching, experiment tracking, and stronger money/business planning.',
    milestone: 'Run one serious money experiment and log the results honestly.',
  },
  {
    min: 3000,
    title: 'Agent Team',
    rank: 6,
    desc: 'Specialized agents begin handling separate categories of your life and work.',
    icon: '🤖',
    assistantUpgrade: 'Add specialist agents: Money, Health, School/Learning, Business, and Systems.',
    milestone: 'Maintain consistency long enough to trust the system with heavier planning load.',
  },
  {
    min: 6000,
    title: 'Noen Command Center',
    rank: 7,
    desc: 'The long-term vision: a private AI command center that helps run your life, projects, and execution.',
    icon: '👑',
    assistantUpgrade: 'Noen coordinates agents, memory, reviews, projects, and controlled automations with clear permissions.',
    milestone: 'Earn enough trust through discipline, data, and execution to justify real autonomy.',
  },
];

export default function IdentityPage() {
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
  } = useUserData();
  const [identity, setIdentity] = useState<IdentityDoc>({ totalScore: 0, bestStreak: 0 });
  const [totalFocus, setTotalFocus] = useState(0);

  useEffect(() => {
    const db = getFirestoreDb();
    const u2 = onSnapshot(doc(db, 'users', uid, 'identity', 'profile'), (snap) => {
      const d = snap.data();
      setIdentity({
        totalScore: Number(d?.totalScore ?? 0),
        bestStreak: Number(d?.bestStreak ?? 0),
        lastScoreDate: d?.lastScoreDate as string | undefined,
        lastDailyScore: Number(d?.lastDailyScore ?? 0),
      });
    });
    const u3 = onSnapshot(collection(db, 'users', uid, 'focusLogs'), (snap) => {
      let s = 0;
      snap.forEach((d) => {
        s += Number(d.data()?.count ?? 0);
      });
      setTotalFocus(s);
    });
    return () => {
      u2();
      u3();
    };
  }, [uid]);

  const dailyScore = calcDailyScore({
    habits,
    dayLog,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    logsByDate,
  });
  const weekPct = weekProgress(habits, logsByDate);

  useEffect(() => {
    const db = getFirestoreDb();
    void syncIdentityProgress(db, uid, {
      habits,
      dayLog,
      focusToday,
      journal,
      goals,
      nutritionTargets,
      nutritionIntake,
      logsByDate,
    });
  }, [
    uid,
    habits,
    dayLog,
    focusToday,
    journal,
    goals,
    nutritionTargets,
    nutritionIntake,
    logsByDate,
  ]);

  const level = getLevel(identity.totalScore ?? 0);
  const nextLevel = [...LEVELS_UI].sort((a, b) => a.min - b.min).find((l) => l.min > (identity.totalScore ?? 0));
  const currentLevelInfo = LEVELS_UI.find((l) => l.title === level.title) ?? LEVELS_UI[0];
  const progress = nextLevel
    ? ((identity.totalScore - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

  const bestStreak = Math.max(
    ...habits.map((h) => calcStreak(h.id, logsByDate)),
    identity.bestStreak ?? 0,
    0
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Identity</h1>
        <p className="page-subtitle">Who you become is a result of what you do consistently.</p>
      </div>

      <div className="page-body">
        <div className="card identity-hero">
          <div className="identity-icon">{currentLevelInfo.icon}</div>
          <div className="identity-title">{level.title}</div>
          <div className="identity-desc">{currentLevelInfo.desc}</div>
          <div className="identity-rank">
            Rank {level.rank} / {LEVELS_UI.length}
          </div>

          <div className="identity-xp-wrap">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{identity.totalScore?.toFixed(0) ?? 0} XP</span>
              <span>{nextLevel ? `${nextLevel.min} XP to ${nextLevel.title}` : 'MAX LEVEL'}</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar gold" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        </div>

        <h3 className="mt-4 mb-3">Personal Records</h3>
        <div className="pr-grid">
          <PRCard icon="🔥" value={`${bestStreak}d`} label="Best Streak" color="gold" />
          <PRCard icon="⚡" value={totalFocus} label="Focus Sessions" color="accent" />
          <PRCard icon="📊" value={`${weekPct}%`} label="Weekly Average" color="green" />
          <PRCard
            icon="🏅"
            value={`${dailyScore}`}
            label="Today points"
            color={dailyScore >= 70 ? 'green' : dailyScore >= 40 ? 'accent' : 'gold'}
          />
        </div>

        <h3 className="mt-4 mb-3">Rank Progression</h3>
        <div className="levels-list">
          {LEVELS_UI.map((l) => {
            const unlocked = identity.totalScore >= l.min;
            const current = level.title === l.title;
            return (
              <div
                key={l.title}
                className={`level-row ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}`}
              >
                <div className="level-row-glow" aria-hidden />
                <span className="level-icon">{l.icon}</span>
                <div className="level-row-body">
                  <div className="level-name-row">
                    <span className="level-name">{l.title}</span>
                    {unlocked && <span className="level-badge-earned">Earned</span>}
                    {current && <span className="level-badge-current">Current</span>}
                  </div>
                  <p className="level-desc">{l.desc}</p>
                  <div className="level-upgrade-box">
                    <span>Assistant upgrade</span>
                    <p>{l.assistantUpgrade}</p>
                  </div>
                  <div className="level-milestone-box">
                    <span>Milestone</span>
                    <p>{l.milestone}</p>
                  </div>
                  <div className="level-req">
                    <span className="level-req-val">{l.min.toLocaleString()} XP</span>
                    <span className="level-req-label">{unlocked ? 'Reached' : 'Required'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PRCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: 'gold' | 'accent' | 'green';
}) {
  const c = color === 'green' ? 'var(--green-light)' : color === 'gold' ? 'var(--gold-light)' : 'var(--accent-light)';
  return (
    <div className="pr-card card">
      <span className="pr-icon">{icon}</span>
      <div className="pr-value" style={{ color: c }}>
        {value}
      </div>
      <div className="pr-label">{label}</div>
    </div>
  );
}
