'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { AssistantChat } from '@/components/AssistantChat';
import { useUserData } from '@/components/UserDataProvider';
import { todayProgress, weekProgress, isJournalCompleteForDailyScore } from '@/lib/scoring';
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

  } = useUserData();

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

      </header>

      <section className="polished-main-grid">
        <aside className="polished-column polished-left-column">
          <div className="polished-card health-overview-card">
            <div className="health-card-title">Health</div>
            <div className="health-preview-grid">
              <PreviewMetric label="Sleep score" value="—" />
              <PreviewMetric label="Gym day" value="—" />
            </div>
          </div>

          <Link href="/system" className="polished-card system-overview-card system-three-card">
            <section className="system-three-section">
              <h2>Habits</h2>
              <div className="system-three-buttons">
                <PreviewMetric label="Habits done" value={`${completedHabits}/${habits.length}`} />
                <PreviewMetric label="Week avg" value={`${weekPct}%`} />
              </div>
            </section>
            <section className="system-three-section">
              <h2>Routines</h2>
              <div className="system-three-buttons two-up">
                <div>Fav 1 routine</div>
                <div>Fav 2 routine</div>
              </div>
            </section>
            <section className="system-three-section">
              <h2>Goals</h2>
              <div className="system-three-buttons two-up">
                <div>Long term goal</div>
                <div>Short term goal</div>
              </div>
            </section>
          </Link>
        </aside>

        <section className="polished-center-stack">
          <div className="polished-ai-stage">
            <AssistantChat mode="dashboard" />
          </div>
          <div className="polished-under-chat-grid">
            <Link href="/journal" className="polished-card polished-journal-under-chat">
              <div className="polished-card-head">
                <span>Memory input</span>
                <h2>Journal</h2>
              </div>
              <p>{journalDone ? 'Debrief complete. Memory has signal.' : 'Debrief not done yet. Capture the lesson tonight.'}</p>
            </Link>
            <Link href="/identity" className="polished-card polished-identity-under-chat">
              <div className="polished-card-head">
                <span>Rank / progression</span>
                <h2>Identity</h2>
              </div>
              <p>{level.title} · {Math.round(identityProfile.totalScore ?? 0)} XP</p>
            </Link>
          </div>
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
