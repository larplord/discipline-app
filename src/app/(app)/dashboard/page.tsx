import Link from 'next/link';
import { AgentOrbInterface } from '@/components/AgentOrbInterface';
import '@/styles/pages/Dashboard.css';

const projectCards = [
  { href: '/projects', icon: '▦', title: 'Projects', copy: 'Create projects, assign agents, and review next actions.', status: 'Ready' },
  { href: '/work-agents', icon: '🤖', title: 'Work Agents', copy: 'Open the business command centre and agent activity console.', status: 'Live' },
  { href: '/fitness/infinity-stones', icon: '∞', title: 'Infinity Stones', copy: 'Track long-term Life goals, milestones, and daily actions.', status: 'New' },
];

const activityCards = [
  { href: '/fitness', label: 'Health', value: 'Hevy + recovery cockpit', tone: 'green' },
  { href: '/fitness/sleep', label: 'Sleep', value: 'Sleep score and wind-down plan', tone: 'blue' },
  { href: '/fitness/daily', label: 'Daily', value: 'Habits, checklist, timeline, wins', tone: 'cyan' },
  { href: '/system', label: 'System', value: 'Infrastructure and dashboard status', tone: 'gold' },
];

export default function DashboardPage() {
  return (
    <main className="agent-command-page fade-in">
      <section className="agent-command-grid" aria-label="Agent command dashboard">
        <aside className="agent-panel agent-project-panel">
          <Link href="/projects" className="agent-panel-link-head" aria-label="Open projects page">
            <span className="agent-kicker">Overview</span>
            <h1>Command Routes</h1>
          </Link>

          <div className="agent-project-list command-route-list" aria-label="Current project overview">
            {projectCards.map((card) => (
              <Link href={card.href} className="agent-project-card command-route-card" key={card.href}>
                <span className="command-route-icon">{card.icon}</span>
                <div>
                  <h2>{card.title}</h2>
                  <p>{card.copy}</p>
                </div>
                <em>{card.status}</em>
              </Link>
            ))}
          </div>
        </aside>

        <section className="agent-orb-stage" aria-label="Agent voice and text interface">
          <div className="agent-orb-context-strip" aria-label="Dashboard mission status">
            <span>VPS Mode</span>
            <strong>Private dashboard online</strong>
            <small>Use voice first. Text fallback remains available.</small>
          </div>
          <AgentOrbInterface />
        </section>

        <aside className="agent-panel agent-activity-panel">
          <div className="agent-panel-head-static">
            <span className="agent-kicker">Standby</span>
            <h1>Live Sections</h1>
          </div>

          <div className="agent-activity-stack command-status-stack" aria-label="Activity and subagent status">
            {activityCards.map((card) => (
              <Link href={card.href} className={`agent-activity-card command-status-card ${card.tone}`} key={card.href}>
                <span className="agent-activity-dot" />
                <div>
                  <h2>{card.label}</h2>
                  <p>{card.value}</p>
                </div>
                <b>Open</b>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
