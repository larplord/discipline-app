import '@/styles/pages/WorkAgents.css';

export default function WorkAgentsPage() {
  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="work-agent-reference-grid" aria-label="Business agent roster">
        <article className="work-agent-card empty-data-card">
          <div className="work-agent-status"><span /> Offline</div>
          <div className="work-agent-icon" aria-hidden="true">◎</div>
          <h2>No data right now</h2>
          <p>No business agents have been connected yet.</p>
          <div className="work-agent-divider" />
          <footer>
            <span className="work-agent-bars" aria-hidden="true">▥</span>
            <span>0 tasks</span>
            <i />
            <span>0%</span>
          </footer>
        </article>
      </section>
    </main>
  );
}
