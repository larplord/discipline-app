import '@/styles/pages/Fitness.css';

const factors = [
  { icon: '▱', label: 'Caffeine', detail: '200 mg • 8:15 AM' },
  { icon: 'ϟ', label: 'Pre-workout', detail: '7:45 AM' },
  { icon: '☾', label: 'Sleep quality', detail: '7h 15m • Good' },
  { icon: 'ψ', label: 'Food', detail: 'Balanced' },
];

function EnergyChart() {
  const points = [
    { x: 4, y: 76 },
    { x: 20, y: 92 },
    { x: 36, y: 80 },
    { x: 52, y: 34 },
    { x: 68, y: 50 },
    { x: 84, y: 72 },
    { x: 100, y: 75 },
  ];
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="health-chart" aria-label="Energy level line chart">
      <svg viewBox="0 0 104 100" role="img" aria-hidden="true" preserveAspectRatio="none">
        {[20, 40, 60, 80].map((y) => (
          <line key={`h-${y}`} className="chart-grid" x1="2" x2="102" y1={y} y2={y} />
        ))}
        {[20, 36, 52, 68, 84, 100].map((x) => (
          <line key={`v-${x}`} className="chart-grid" x1={x} x2={x} y1="10" y2="84" />
        ))}
        <polyline className="chart-line" points={line} />
        {points.map((point) => (
          <circle key={`${point.x}-${point.y}`} className="chart-dot" cx={point.x} cy={point.y} r="1.7" />
        ))}
        <line className="chart-axis" x1="2" x2="102" y1="84" y2="84" />
        <line className="chart-axis" x1="2" x2="2" y1="10" y2="84" />
      </svg>
      <div className="energy-axis energy-axis-y">
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>
      <div className="energy-axis energy-axis-x">
        <span>12 AM</span>
        <span>4 AM</span>
        <span>8 AM</span>
        <span>12 PM</span>
        <span>4 PM</span>
        <span>8 PM</span>
        <span>12 AM</span>
      </div>
      <span className="energy-y-label">Energy</span>
    </div>
  );
}

function CustomWidget() {
  return (
    <section className="health-custom-widget hud-card">
      <div className="widget-orbit" aria-hidden="true" />
      <div className="custom-question">?</div>
      <h2>Custom widget</h2>
      <p>Add a widget to track what matters most to you.</p>
      <button type="button">+ Add widget</button>
    </section>
  );
}

export default function HealthPage() {
  return (
    <main className="health-page hud-page fade-in">
      <section className="health-grid">
        <article className="health-card water-card hud-card">
          <header className="health-card-header">
            <div className="health-icon water-icon" aria-hidden="true">◖</div>
            <div>
              <h1>Water</h1>
              <p>Track your daily water intake.</p>
            </div>
          </header>

          <div className="water-progress-block">
            <div className="water-progress-head">
              <span>Daily goal progress</span>
              <strong>60%</strong>
            </div>
            <div className="water-progress-track">
              <span style={{ width: '60%' }} />
            </div>
            <div className="water-progress-foot">
              <span>48 oz drunk</span>
              <span>80 oz goal</span>
            </div>
          </div>

          <div className="water-total">
            <div className="water-badge" aria-hidden="true">♧</div>
            <div>
              <strong><span>48</span> / 80 oz</strong>
              <p>This is where I will put how much I’ve drunken.</p>
            </div>
          </div>
        </article>

        <article className="health-card energy-card hud-card">
          <header className="health-card-header energy-head">
            <div className="health-icon" aria-hidden="true">ϟ</div>
            <div>
              <h1>Energy level</h1>
              <p>Track your energy throughout the day.</p>
            </div>
          </header>

          <EnergyChart />

          <div className="factor-panel">
            <span className="factor-title">Stimulants / factors</span>
            <div className="factor-grid">
              {factors.map((factor) => (
                <div className="factor-item" key={factor.label}>
                  <span className="factor-icon" aria-hidden="true">{factor.icon}</span>
                  <div>
                    <strong>{factor.label}</strong>
                    <small>{factor.detail}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <CustomWidget />
        <CustomWidget />
      </section>
    </main>
  );
}
