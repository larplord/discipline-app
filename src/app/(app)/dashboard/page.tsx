'use client';

import Link from 'next/link';
import { AssistantChat } from '@/components/AssistantChat';
import { useUserData } from '@/components/UserDataProvider';
import { weekProgress, isJournalCompleteForDailyScore } from '@/lib/scoring';
import { getLevel } from '@/lib/levels';
import '@/styles/pages/Dashboard.css';
import '@/styles/pages/Assistant.css';

const NAV_MODULES: Array<{ label: string; icon: string; tone: string; href?: string; disabled?: boolean }> = [
  { label: 'Health', icon: '✚', tone: 'health', disabled: true },
  { href: '/projects', label: 'Money', icon: '◆', tone: 'money' },
  { href: '/journal', label: 'Memory', icon: '◈', tone: 'memory' },
  { href: '/focus', label: 'Risk', icon: '△', tone: 'risk' },
  { href: '/system', label: 'Habits', icon: '⬡', tone: 'habits' },
  { href: '/projects', label: 'Projects', icon: '⌁', tone: 'projects' },
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
        <nav className="polished-tabs" aria-label="Command modules">
          {NAV_MODULES.map((item) => (
            item.disabled ? (
              <div key={item.label} className={`polished-tab command-nav-${item.tone} command-nav-disabled`} aria-disabled="true">
                <span className="nav-hud-icon">{item.icon}</span>
                <span className="nav-hud-label">{item.label}</span>
              </div>
            ) : item.href ? (
              <Link key={`${item.label}-${item.href}`} href={item.href} className={`polished-tab command-nav-${item.tone}`}>
                <span className="nav-hud-icon">{item.icon}</span>
                <span className="nav-hud-label">{item.label}</span>
              </Link>
            ) : null
          ))}
        </nav>

      </header>

      <section className="polished-main-grid">
        <aside className="polished-column polished-left-column">
          <div className="polished-card health-overview-card hud-panel-tagged">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-br" />
            <div className="health-card-title">Health</div>
            <div className="health-preview-grid">
              <PreviewMetric label="Sleep score" value="—" />
              <PreviewMetric label="Gym day" value="—" />
            </div>
          </div>

          <Link href="/system" className="polished-card system-overview-card system-three-card hud-panel-tagged">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-br" />
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
          <div className="polished-ai-stage hud-panel-tagged">
            <span className="hud-radar" />
            <span className="hud-scanline" />
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-br" />
            <AssistantChat mode="dashboard" />
          </div>
          <div className="polished-under-chat-grid">
            <Link href="/journal" className="polished-card polished-journal-under-chat hud-panel-tagged">
              <span className="hud-corner hud-corner-tl" />
              <div className="polished-card-head">
                <span>Memory input</span>
                <h2>Journal</h2>
              </div>
              <p>{journalDone ? 'Debrief complete. Memory has signal.' : 'Debrief not done yet. Capture the lesson tonight.'}</p>
            </Link>
            <Link href="/identity" className="polished-card polished-identity-under-chat hud-panel-tagged">
              <span className="hud-corner hud-corner-tl" />
              <div className="polished-card-head">
                <span>Rank / progression</span>
                <h2>Identity</h2>
              </div>
              <p>{level.title} · {Math.round(identityProfile.totalScore ?? 0)} XP</p>
            </Link>
          </div>
        </section>

        <aside className="polished-column polished-right-column">
          <Link href="/projects" className="polished-card projects-overview-card hud-panel-tagged">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-br" />
            <div className="polished-card-head">
              <span>Current push</span>
              <h2>Projects</h2>
            </div>
            <p>{currentProject}</p>
            <small>Keep shipping visible proof, not just planning.</small>
          </Link>

          <div className="polished-card focus-overview-card hud-panel-tagged">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-br" />
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
