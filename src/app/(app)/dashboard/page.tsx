import Link from 'next/link';
import '@/styles/pages/Dashboard.css';

const PROJECTS = [
  {
    name: 'Dashboard rebuild',
    status: 'Active layout pass',
    signal: 'Barebones Agent interface first',
  },
  {
    name: 'Noen / assistant core',
    status: 'Backend later',
    signal: 'Voice-first interaction target',
  },
  {
    name: 'Vault bridge',
    status: 'Synced context ready',
    signal: 'Obsidian archive connected',
  },
];

const ACTIVITY = [
  'Subagent activity placeholder',
  'Review queue placeholder',
  'System checks placeholder',
];

const NAV_ITEMS = [
  { label: 'Business', href: '/work-agents', icon: '▦' },
  { label: 'Agent', href: '/dashboard', icon: '◉', active: true },
  { label: 'Life', href: '/projects', icon: '⌬' },
];

export default function DashboardPage() {
  return (
    <main className="agent-command-page fade-in">
      <section className="agent-command-grid" aria-label="Agent command dashboard">
        <aside className="agent-panel agent-project-panel">
          <Link href="/projects" className="agent-panel-link-head" aria-label="Open projects page">
            <span className="agent-kicker">Overview</span>
            <h1>Projects</h1>
          </Link>

          <div className="agent-project-list" aria-label="Current project overview">
            {PROJECTS.map((project) => (
              <article className="agent-project-card" key={project.name}>
                <div>
                  <h2>{project.name}</h2>
                  <p>{project.status}</p>
                </div>
                <span>{project.signal}</span>
              </article>
            ))}
          </div>
        </aside>

        <section className="agent-orb-stage" aria-label="Agent voice interface placeholder">
          <div className="agent-orb-shell" aria-hidden="true">
            <div className="agent-orb-rings" />
            <div className="agent-orb-core" />
            <div className="agent-orb-sheen" />
          </div>
          <span className="sr-only">Agent voice interface placeholder</span>
        </section>

        <aside className="agent-panel agent-activity-panel">
          <div className="agent-panel-head-static">
            <span className="agent-kicker">Standby</span>
            <h1>Activity</h1>
          </div>

          <div className="agent-activity-stack" aria-label="Future activity and subagent status">
            {ACTIVITY.map((item, index) => (
              <article className="agent-activity-card" key={item}>
                <span className="agent-activity-dot" />
                <div>
                  <h2>{item}</h2>
                  <p>{index === 0 ? 'Future subagent status will appear here.' : 'Future check-ins and routines will appear here.'}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <nav className="agent-bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            href={item.href}
            key={item.label}
            className={`agent-bottom-nav-item ${item.active ? 'active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
          >
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
          </Link>
        ))}
      </nav>
    </main>
  );
}
