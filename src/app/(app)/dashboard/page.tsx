'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { AssistantChat } from '@/components/AssistantChat';
import { useUserData } from '@/components/UserDataProvider';
import { todayProgress, weekProgress, calcDailyScore, isJournalCompleteForDailyScore } from '@/lib/scoring';
import { getLevel } from '@/lib/levels';
import '@/styles/pages/Dashboard.css';
import '@/styles/pages/Assistant.css';

const NAV_MODULES = [
  { href: '/fitness/bodybuilding', label: 'Health', tone: 'health' },
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
  const currentProject = 'AI Creator Product Testing System';

  return (
    <main className="command-dashboard fade-in">
      <section className="command-top-strip">
        <div className="command-date-block">
          <span>{format(new Date(), 'EEEE, MMMM d')}</span>
          <strong>Daniel Command Center</strong>
        </div>
        <nav className="command-module-nav" aria-label="Command modules">
          {NAV_MODULES.map((item) => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className={`command-nav-tab command-nav-${item.tone}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="command-score-chip">
          <strong>{score}</strong>
          <span>{level.title}</span>
        </div>
      </section>

      <section className="command-assistant-hero">
        <div className="command-hero-glow" aria-hidden />
        <AssistantChat mode="dashboard" />
      </section>

      <section className="command-card-grid">
        <CommandCard href="/fitness/bodybuilding" title="Health" detail="Training, nutrition, recovery, and body progress." />
        <Link href="/system" className="command-card command-system-card">
          <span className="command-card-label">System tracker</span>
          <h2>Habits / Goals / Routines</h2>
          <div className="command-metric-list">
            <Metric value={`${habitsPct}%`} label="Habits today" />
            <Metric value={`${weekPct}%`} label="1 week average" />
            <Metric value={activeGoals} label="Goals" />
          </div>
        </Link>
        <CommandCard href="/journal" title="Journal" detail={journalDone ? 'Debrief complete. Memory has signal.' : 'Debrief not done yet. Capture the lesson tonight.'} />

        <CommandCard href="/projects" title="Projects" detail={`${currentProject}. Keep shipping visible proof, not just planning.`} />
        <div className="command-card command-focus-card">
          <span className="command-card-label">Quick start</span>
          <h2>Focus</h2>
          <p>{focusToday} focus sessions today. Proof beats planning.</p>
          <div className="command-focus-buttons">
            <Link href="/focus">Deep work 60</Link>
            <Link href="/focus">Deep work 30</Link>
            <Link href="/focus">Short break</Link>
            <Link href="/focus">Long break</Link>
          </div>
        </div>
        <CommandCard href="/identity" title="Identity" detail={`${level.title} · ${Math.round(identityProfile.totalScore ?? 0)} XP`} />
      </section>
    </main>
  );
}

function CommandCard({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link href={href} className="command-card">
      <span className="command-card-label">Module</span>
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
