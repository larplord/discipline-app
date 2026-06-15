import '@/styles/pages/WorkAgents.css';

export default function BusinessPlanPage() {
  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="business-placeholder-panel hud-card">
        <span className="hud-kicker">Business</span>
        <h1>Plan</h1>
        <p>No business plan data right now.</p>
        <div className="business-placeholder-list" aria-label="Business plan empty state">
          <article><span>—</span><p>No data right now</p></article>
        </div>
      </section>
    </main>
  );
}
