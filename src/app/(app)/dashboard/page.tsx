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
    <main className="cockpit-dashboard fade-in">
      <header className="cockpit-nav-row">
        <div className="cockpit-date-chip">
          <span>{format(new Date(), 'EEE · MMM d')}</span>
          <strong>{score}</strong>
        </div>
        <nav className="cockpit-nav-tabs" aria-label="Command modules">
          {NAV_MODULES.map((item) => (
            item.disabled ? (
              <div key={item.label} className={`command-nav-tab command-nav-${item.tone} command-nav-disabled`} aria-disabled="true">
                {item.label}
              </div>
            ) : item.href ? (
              <Link key={`${item.label}-${item.href}`} href={item.href} className={`command-nav-tab command-nav-${item.tone}`}>
                {item.label}
              </Link>
            ) : null
          ))}
        </nav>
      </header>

      <section className="cockpit-main-grid">
        <aside className="cockpit-side cockpit-left">
          <div className="cockpit-card cockpit-health-card" aria-disabled="true">
            <span className="command-card-label">Apple Watch later</span>
            <h2>Health</h2>
            <div className="cockpit-health-placeholders">
              <div>Sleep score</div>
              <div>What day of gym</div>
            </div>
          </div>
          <Link href="/system" className="cockpit-card cockpit-system-card system-reference-card">
            <section className="system-ref-section system-ref-habits">
              <h2>Habits</h2>
              <div className="system-ref-stats">
                <div>
                  <strong>{completedHabits}/{habits.length}</strong>
                  <span>Habits done</span>
                </div>
                <div>
                  <strong>{weekPct}%</strong>
                  <span>1 week avg</span>
                </div>
              </div>
            </section>
            <section className="system-ref-section system-ref-routines">
              <h2>Routines</h2>
              <div className="system-ref-routine-tiles">
                <div>Fav 1 routine</div>
                <div>Fav 2 routine</div>
              </div>
            </section>
            <section className="system-ref-section system-ref-goals">
              <h2>Goals</h2>
              <div className="system-ref-goal-tiles">
                <div>Long term goal</div>
                <div>Short term goal</div>
              </div>
            </section>
          </Link>
        </aside>

        <section className="cockpit-center">
          <div className="cockpit-assistant-panel">
            <AssistantChat mode="dashboard" />
          </div>
        </section>

        <aside className="cockpit-side cockpit-right">
          <CockpitCard href="/projects" title="Projects" label="Current push" detail={`${currentProject}. Keep shipping visible proof, not just planning.`} />
          <div className="cockpit-card cockpit-focus-card">
            <span className="command-card-label">Quick start</span>
            <h2>Focus</h2>
            <p>{focusToday} focus sessions today. Start one clean block.</p>
            <div className="command-focus-buttons">
              <Link href="/focus">Deep work 60</Link>
              <Link href="/focus">Deep work 30</Link>
              <Link href="/focus">Short break</Link>
              <Link href="/focus">Long break</Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="cockpit-bottom-grid">
        <CockpitCard href="/journal" title="Journal" label="Memory input" detail={journalDone ? 'Debrief complete. Memory has signal.' : 'Debrief not done yet. Capture the lesson tonight.'} />
        <CockpitCard href="/identity" title="Identity" label="Rank / progression" detail={`${level.title} · ${Math.round(identityProfile.totalScore ?? 0)} XP`} />
      </section>
    </main>
  );
}

function CockpitCard({ href, title, label, detail }: { href: string; title: string; label: string; detail: string }) {
  return (
    <Link href={href} className="cockpit-card">
      <span className="command-card-label">{label}</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </Link>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="command-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
