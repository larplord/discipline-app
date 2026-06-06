import '@/styles/pages/WorkAgents.css';

export default function BusinessActivityPage() {
  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="business-placeholder-panel hud-card">
        <span className="hud-kicker">Business</span>
        <h1>Activity</h1>
        <p>Business status reports, handoffs, and subagent updates will collect here.</p>
        <div className="business-placeholder-list">
          <article><span>01</span><p>Design system updated</p></article>
          <article><span>02</span><p>Campaign analytics report</p></article>
          <article><span>03</span><p>AI model training completed</p></article>
          <article><span>04</span><p>New user onboarded</p></article>
          <article><span>05</span><p>Team stand-up meeting</p></article>
        </div>
      </section>
    </main>
  );
}
