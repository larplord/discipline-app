'use client';

import Link from 'next/link';
import { useUserData } from '@/components/UserDataProvider';
import { todayProgress, weekProgress } from '@/lib/scoring';
import '@/styles/pages/System.css';

export default function SystemPage() {
  const { habits, dayLog, logsByDate, goals } = useUserData();
  const habitsPct = todayProgress(habits, dayLog);
  const weekPct = weekProgress(habits, logsByDate);
  const activeGoals = goals.length;

  return (
    <div className="fade-in system-page">
      <div className="page-header system-header">
        <div>
          <div className="section-label">Command module</div>
          <h1 className="page-title">Habits / Goals / Routines</h1>
          <p className="page-subtitle">Your daily operating system: what you repeat, what you are chasing, and the routines that keep you moving.</p>
        </div>
      </div>

      <div className="page-body">
        <section className="system-hero card">
          <div className="system-hero-copy">
            <span>Daily system status</span>
            <h2>Keep the basics clean. Then unlock more AI.</h2>
            <p>Noen gets more useful when your behavior data is consistent. Habits show discipline, goals show direction, routines show structure.</p>
          </div>
          <div className="system-stat-grid">
            <SystemStat value={`${habitsPct}%`} label="Habits today" />
            <SystemStat value={`${weekPct}%`} label="1 week average" />
            <SystemStat value={activeGoals} label="Goals" />
          </div>
        </section>

        <section className="system-module-grid">
          <SystemModule
            href="/habits"
            title="Habits"
            kicker="Daily checklist"
            detail="Track the actions that prove you are becoming the person you say you want to be."
            meta={`${habits.filter((h) => dayLog[h.id]).length}/${habits.length || 0} complete today`}
          />
          <SystemModule
            href="/goals"
            title="Goals"
            kicker="Milestones"
            detail="Keep direction clear. Break bigger targets into next visible wins."
            meta={`${activeGoals} active goals`}
          />
          <SystemModule
            href="/routine"
            title="Routines"
            kicker="Repeatable flows"
            detail="Build morning, work, and night sequences so fewer decisions depend on motivation."
            meta="Clock-based execution"
          />
        </section>
      </div>
    </div>
  );
}

function SystemStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="system-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SystemModule({ href, title, kicker, detail, meta }: { href: string; title: string; kicker: string; detail: string; meta: string }) {
  return (
    <Link href={href} className="card system-module-card">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <p>{detail}</p>
      <strong>{meta}</strong>
    </Link>
  );
}
