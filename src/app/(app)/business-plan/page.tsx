import '@/styles/pages/WorkAgents.css';

export default function BusinessPlanPage() {
  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="business-placeholder-panel hud-card">
        <span className="hud-kicker">Business</span>
        <h1>Plan</h1>
        <p>A planning surface for business objectives, next moves, and operating routines.</p>
        <div className="business-placeholder-list">
          <article><span>01</span><p>Define weekly business target</p></article>
          <article><span>02</span><p>Map active agent responsibilities</p></article>
          <article><span>03</span><p>Review project bottlenecks</p></article>
          <article><span>04</span><p>Prepare outreach sequence</p></article>
        </div>
      </section>
    </main>
  );
}
