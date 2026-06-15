import Link from 'next/link';
import '@/styles/pages/Dashboard.css';

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
            <article className="agent-project-card empty-data-card">
              <div>
                <h2>No data right now</h2>
                <p>Your current projects will appear here once you add them.</p>
              </div>
              <span>Clean slate</span>
            </article>
          </div>
        </aside>

        <section className="agent-orb-stage" aria-label="Agent voice interface">
          <div className="agent-orb-shell" aria-hidden="true">
            <div className="agent-orb-rings" />
            <div className="agent-orb-core" />
            <div className="agent-orb-sheen" />
          </div>
          <span className="sr-only">Agent voice interface</span>
        </section>

        <aside className="agent-panel agent-activity-panel">
          <div className="agent-panel-head-static">
            <span className="agent-kicker">Standby</span>
            <h1>Activity</h1>
          </div>

          <div className="agent-activity-stack" aria-label="Activity and subagent status">
            <article className="agent-activity-card empty-data-card">
              <span className="agent-activity-dot" />
              <div>
                <h2>No data right now</h2>
                <p>Live activity and check-ins will appear here after they are created.</p>
              </div>
            </article>
          </div>
        </aside>
      </section>
    </main>
  );
}
