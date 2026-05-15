import '@/styles/pages/Fitness.css';

export default function BodybuildingPage() {
  return (
    <main className="health-watch-page fade-in">
      <h1>Health</h1>
      <section className="health-watch-tiles" aria-label="Health placeholders">
        <div className="health-watch-tile" aria-disabled="true">Sleep score</div>
        <div className="health-watch-tile" aria-disabled="true">What day of gym</div>
      </section>
      <p className="health-watch-note">Apple Watch integration coming later.</p>
    </main>
  );
}
