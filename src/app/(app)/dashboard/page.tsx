'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useUserData } from '@/components/UserDataProvider';
import { todayProgress, weekProgress, calcDailyScore, isJournalCompleteForDailyScore } from '@/lib/scoring';
import { getLevel } from '@/lib/levels';
import '@/styles/pages/Dashboard.css';
import '@/styles/pages/DashboardMockups.css';

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
  const nextMove = focusToday > 0
    ? 'Log what you produced, then do a short debrief so Noen has useful memory later.'
    : 'Start one focus session and produce one real asset before redesigning anything else.';

  return (
    <main className="dashboard-hud-page fade-in">
      <section className="dashboard-hud-topbar">
        <div>
          <span>{format(new Date(), 'EEEE, MMMM d')}</span>
          <h1>Daniel Command Center</h1>
        </div>
        <div className="dashboard-hud-score">
          <strong>{score}</strong>
          <span>{level.title}</span>
        </div>
      </section>

      <section className="hud-board real-hud-board">
        <div className="hud-grid-lines" aria-hidden />
        <Link href="/projects" className="hud-top-link">
          <span>Current project</span>
          <strong>{currentProject}</strong>
        </Link>

        <aside className="hud-side hud-left">
          <DashboardHudModule href="/fitness/bodybuilding" title="Health" label="Quick link" detail="Training, nutrition, recovery, and body progress." />
          <DashboardHudModule href="/projects" title="Projects" label="Growing project layer" detail="Current project, what changed, what agents will eventually handle, and the next step." tall />
          <div className="hud-module hud-focus-module">
            <div className="hud-module-inner">
              <span>Quick start</span>
              <h3>Focus</h3>
              <p>{focusToday} focus sessions today. Proof beats planning.</p>
              <div className="hud-focus-grid">
                <Link href="/focus">Deep work 60</Link>
                <Link href="/focus">Deep work 30</Link>
                <Link href="/focus">Short break</Link>
                <Link href="/focus">Long break</Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="hud-core">
          <div className="hud-ai-panel real-ai-panel">
            <div className="hud-orbit hud-orbit-one" aria-hidden />
            <div className="hud-orbit hud-orbit-two" aria-hidden />
            <div className="hud-scan" aria-hidden />
            <div className="hud-ai-content">
              <span>Noen core / Level 3 target</span>
              <h2>AI Model</h2>
              <p>{nextMove}</p>
              <div className="real-ai-actions">
                <Link href="/focus" className="btn btn-primary">Start Focus</Link>
                <Link href="/journal" className="btn btn-ghost">Debrief</Link>
              </div>
            </div>
          </div>

          <div className="hud-agents-panel">
            <span className="hud-panel-label">Future agent stack</span>
            <div className="hud-agent-grid">
              <HudAgent color="green" name="Health" />
              <HudAgent color="blue" name="Money" />
              <HudAgent color="purple" name="Memory" />
              <HudAgent color="red" name="Risk" />
              <HudAgent color="yellow" name="Habits" />
              <HudAgent color="orange" name="Projects" />
            </div>
          </div>
        </main>

        <aside className="hud-side hud-right">
          <div className="hud-module hud-module-tall hud-system-module">
            <div className="hud-module-inner">
              <span>Daily system</span>
              <h3>Habits / Goals / Routines</h3>
              <p>{habitsPct}% habits today · {weekPct}% weekly avg · {activeGoals} goals</p>
              <div className="hud-system-links">
                <Link href="/habits">Habits</Link>
                <Link href="/goals">Goals</Link>
                <Link href="/routine">Routines</Link>
              </div>
            </div>
          </div>
          <DashboardHudModule href="/journal" title="Journal" label="Fast reflection" detail={journalDone ? 'Debrief complete. Good — memory has signal.' : 'Debrief not done yet. Capture the lesson tonight.'} />
          <DashboardHudModule href="/identity" title="Identity" label="Level + score" detail={`${level.title} · ${Math.round(identityProfile.totalScore ?? 0)} XP`} />
        </aside>
      </section>
    </main>
  );
}

function DashboardHudModule({ href, title, label, detail, tall = false }: { href: string; title: string; label: string; detail: string; tall?: boolean }) {
  return (
    <Link href={href} className={`hud-module ${tall ? 'hud-module-tall' : ''}`}>
      <div className="hud-module-inner">
        <span>{label}</span>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </Link>
  );
}

function HudAgent({ color, name }: { color: string; name: string }) {
  return (
    <div className={`hud-agent hud-agent-${color}`}>
      <span>{name}</span>
    </div>
  );
}
