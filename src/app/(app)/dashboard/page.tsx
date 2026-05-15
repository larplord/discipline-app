'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { AssistantChat } from '@/components/AssistantChat';
import { useUserData } from '@/components/UserDataProvider';
import { todayProgress, weekProgress, calcDailyScore, isJournalCompleteForDailyScore } from '@/lib/scoring';
import { getLevel } from '@/lib/levels';
import '@/styles/pages/Dashboard.css';
import '@/styles/pages/Assistant.css';

const NAV_MODULES: Array<{ label: string; tone: string; href?: string; disabled?: boolean }> = [
  { label: 'Health', tone: 'health', disabled: true },
  { href: '/projects', label: 'Money', tone: 'money' },
  { href: '/journal', label: 'Memory', tone: 'memory' },
  { href: '/focus', label: 'Risk', tone: 'risk' },
  { href: '/system', label: 'Habits', tone: 'habits' },
  { href: '/projects', label: 'Projects', tone: 'projects' },
];

export default function DashboardPage() {
  const {
    habits,
    dayLog,
    focusToday,
    journal,
    goals,
    logsByDate,
    identityProfile,
    nutritionTargets,
    nutritionIntake,
  } = useUserData();

  const score = calcDailyScore({ habits, dayLog, focusToday, journal, goals, logsByDate, nutritionTargets, nutritionIntake });
  const habitsPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);
  const level = getLevel(identityProfile.totalScore ?? 0);
  const journalDone = isJournalCompleteForDailyScore(journal);
  const activeGoals = goals.length;
  const completedHabits = habits.filter((habit) => dayLog[habit.id]).length;
  const currentProject = 'AI Creator Product Testing System';

  return (
    <main className="polished-dashboard fade-in">
      <header className="polished-nav-row">
        <div className="polished-brand">
          <span>{format(new Date(), 'EEE · MMM d')}</span>
          <strong>Command Center</strong>
        </div>
        <nav className="polished-tabs" aria-label="Command modules">
          {NAV_MODULES.map((item) => (
            item.disabled ? (
              <div key={item.label} className={`polished-tab command-nav-${item.tone} command-nav-disabled`} aria-disabled="true">
                {item.label}
              </div>
            ) : item.href ? (
              <Link key={`${item.label}-${item.href}`} href={item.href} className={`polished-tab command-nav-${item.tone}`}>
                {item.label}
              </Link>
            ) : null
          ))}
        </nav>
        <div className="polished-score">
          <strong>{score}</strong>
          <span>{level.title}</span>
        </div>
      </header>

      <section className="polished-main-grid">
        <aside className="polished-column polished-left-column">
          <div className="polished-card health-overview-card">
            <div className="polished-card-head">
              <span>Apple Watch later</span>
              <h2>Health</h2>
            </div>
            <div className="health-preview-grid">
              <PreviewMetric label="Sleep score" value="—" />
              <PreviewMetric label="Gym day" value="—" />
            </div>
          </div>

          <Link href="/system" className="polished-card system-overview-card">
            <div className="polished-card-head">
              <span>Daily operating system</span>
              <h2>System</h2>
            </div>
            <div className="system-overview-stats">
              <PreviewMetric label="Habits done" value={`${completedHabits}/${habits.length}`} />
              <PreviewMetric label="Today" value={`${habitsPct}%`} />
              <PreviewMetric label="Week avg" value={`${weekPct}%`} />
              <PreviewMetric label="Goals" value={activeGoals} />
            </div>
            <div className="system-mini-lanes">
              <div><span>Routines</span><strong>Fav 1 · Fav 2</strong></div>
              <div><span>Goals</span><strong>Long term · Short term</strong></div>
            </div>
          </Link>
        </aside>

        <section className="polished-ai-stage">
          <AssistantChat mode="dashboard" />
        </section>

        <aside className="polished-column polished-right-column">
          <Link href="/projects" className="polished-card projects-overview-card">
            <div className="polished-card-head">
              <span>Current push</span>
              <h2>Projects</h2>
            </div>
            <p>{currentProject}</p>
            <small>Keep shipping visible proof, not just planning.</small>
          </Link>

          <div className="polished-card focus-overview-card">
            <div className="polished-card-head">
              <span>Quick start</span>
              <h2>Focus</h2>
            </div>
            <p>{focusToday} focus sessions today.</p>
            <div className="polished-focus-grid">
              <Link href="/focus">Deep work 60</Link>
              <Link href="/focus">Deep work 30</Link>
              <Link href="/focus">Short break</Link>
              <Link href="/focus">Long break</Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="polished-bottom-grid">
        <Link href="/journal" className="polished-card">
          <div className="polished-card-head">
            <span>Memory input</span>
            <h2>Journal</h2>
          </div>
          <p>{journalDone ? 'Debrief complete. Memory has signal.' : 'Debrief not done yet. Capture the lesson tonight.'}</p>
        </Link>
        <Link href="/identity" className="polished-card">
          <div className="polished-card-head">
            <span>Rank / progression</span>
            <h2>Identity</h2>
          </div>
          <p>{level.title} · {Math.round(identityProfile.totalScore ?? 0)} XP</p>
        </Link>
      </section>
    </main>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="preview-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
