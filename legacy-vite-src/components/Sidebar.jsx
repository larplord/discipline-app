import { calcDailyScore, focusStore, habitStore, journalStore } from '../store.js';

/**
 * Sidebar navigation with live daily score display
 */

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  icon: GridIcon },
  { id: 'habits',    label: 'Habits',     icon: CheckCircleIcon },
  { id: 'goals',     label: 'Goals',      icon: TargetIcon },
  { id: 'journal',   label: 'Journal',    icon: BookIcon },
  { id: 'focus',     label: 'Focus',      icon: TimerIcon },
  { id: 'nutrition', label: 'Nutrition',  icon: NutritionIcon },
  { id: 'analytics', label: 'Analytics',  icon: ChartIcon },
  { id: 'identity',  label: 'Identity',   icon: TrophyIcon },
];

export default function Sidebar({ activePage, onNav, open, tick }) {
  const score = calcDailyScore();
  const scoreColor = score >= 80 ? 'var(--green-light)' : score >= 50 ? 'var(--accent-light)' : 'var(--text-secondary)';

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
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNav(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-score">
          <div className="score-num" style={{ color: scoreColor }}>{score}</div>
          <div className="score-label">Today's Score</div>
          <div style={{ marginTop: '0.5rem' }}>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── Icon components ── */
function GridIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function CheckCircleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TargetIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function BookIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function TimerIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="13" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l3 3M12 5V3m-4 2L6 3m10 2l2-2" />
    </svg>
  );
}
function NutritionIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14M7 21V10h10v11M9 10V5h6v5" />
    </svg>
  );
}
function ChartIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function TrophyIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3H3a2 2 0 00-2 2v3a4 4 0 004 4h.5M19 3h2a2 2 0 012 2v3a4 4 0 01-4 4h-.5M5 3h14v7a7 7 0 01-14 0V3z" />
    </svg>
  );
}
