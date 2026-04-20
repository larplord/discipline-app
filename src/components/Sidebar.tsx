'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { calcDailyScoreFromSnapshot } from '@/lib/useDailyScore';
import type { DayLog, Goal, Habit, JournalEntry, MacroSnapshot } from '@/lib/types';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { href: '/habits', label: 'Habits', icon: CheckCircleIcon },
  { href: '/goals', label: 'Goals', icon: TargetIcon },
  { href: '/journal', label: 'Journal', icon: BookIcon },
  { href: '/focus', label: 'Focus', icon: TimerIcon },
  { href: '/nutrition', label: 'Nutrition', icon: NutritionIcon },
  { href: '/friends', label: 'Friends', icon: UsersIcon },
  { href: '/analytics', label: 'Analytics', icon: ChartIcon },
  { href: '/identity', label: 'Identity', icon: TrophyIcon },
];

type SidebarProps = {
  open: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
  scoreData: {
    habits: Habit[];
    dayLog: DayLog;
    focusToday: number;
    journal: JournalEntry;
    goals: Goal[];
    nutritionTargets: MacroSnapshot;
    nutritionIntake: MacroSnapshot;
    logsByDate: Record<string, DayLog>;
  };
};

export function Sidebar({ open, onCloseMobile, onSignOut, scoreData }: SidebarProps) {
  const pathname = usePathname();
  const score = calcDailyScoreFromSnapshot(scoreData);
  const scoreColor =
    score >= 80
      ? 'var(--green-light)'
      : score >= 50
        ? 'var(--accent-light)'
        : 'var(--text-secondary)';

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-text">
          Discipline<span className="logo-dot">OS</span>
        </div>
        <div className="logo-sub">Personal Command Center</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
          <Link
            key={href}
            href={href}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => onCloseMobile()}
          >
            <Icon size={17} />
            {label}
          </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-score">
          <div className="score-num" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="score-label">Today&apos;s Score</div>
          <div style={{ marginTop: '0.5rem' }}>
            <div className="progress-wrap">
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(score, 100)}%`,
                  background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`,
                }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm w-full mt-2"
          onClick={() => onSignOut()}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function GridIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TargetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function BookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
function TimerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="13" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l3 3M12 5V3m-4 2L6 3m10 2l2-2" />
    </svg>
  );
}
function NutritionIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14M7 21V10h10v11M9 10V5h6v5" />
    </svg>
  );
}
function UsersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm-6 8v-1c0-2 2-3.5 6-3.5s6 1.5 6 3.5v1M18 11a3 3 0 100-6 3 3 0 000 6z"
      />
    </svg>
  );
}
function ChartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function TrophyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8m-4-4v4M5 3H3a2 2 0 00-2 2v3a4 4 0 004 4h.5M19 3h2a2 2 0 012 2v3a4 4 0 01-4 4h-.5M5 3h14v7a7 7 0 01-14 0V3z"
      />
    </svg>
  );
}
