import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { habitTrendData, focusTrendData, categoryBreakdown, weekProgress, focusStore, habitStore, journalStore } from '../store.js';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor:'#1e1e30', titleColor:'#f1f5f9', bodyColor:'#94a3b8', borderColor:'rgba(255,255,255,0.08)', borderWidth:1 } },
  scales: {
    x: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { color:'#475569', font:{ size:11, family:'Inter' } } },
    y: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { color:'#475569', font:{ size:11, family:'Inter' } }, min:0 },
  },
};

const CAT_COLORS = { fitness:'#f87171', learning:'#a5b4fc', business:'#fcd34d', mindset:'#6ee7b7', sleep:'#c4b5fd', health:'#7dd3fc', other:'#94a3b8' };

export default function Analytics() {
  const habitTrend  = habitTrendData(14);
  const focusTrend  = focusTrendData(14);
  const catData     = categoryBreakdown();

  const labels     = habitTrend.map(d => d.date);
  const habitPcts  = habitTrend.map(d => d.pct);
  const focusSess  = focusTrend.map(d => d.sessions);

  const weekHabit  = weekProgress();
  const totalFocus = Object.values(focusStore.getAll()).reduce((a, b) => a + b, 0);
  const journalDays = Object.values(journalStore.getAll()).filter(e => e.well || e.freeform).length;

  // Strongest / weakest category
  const sorted  = [...catData].sort((a, b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakest   = sorted[sorted.length - 1];

  const habitBarData = {
    labels,
    datasets: [{
      data: habitPcts,
      backgroundColor: habitPcts.map(v => v >= 80 ? 'rgba(16,185,129,0.7)' : v >= 50 ? 'rgba(99,102,241,0.7)' : 'rgba(245,158,11,0.5)'),
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(99,102,241,0.9)',
    }],
  };

  const focusLineData = {
    labels,
    datasets: [{
      data: focusSess,
      borderColor: 'rgba(99,102,241,1)',
      backgroundColor: 'rgba(99,102,241,0.08)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(99,102,241,1)',
      pointRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  };

  const doughnutData = {
    labels: catData.map(c => c.cat.charAt(0).toUpperCase() + c.cat.slice(1)),
    datasets: [{
      data: catData.map(c => Math.max(c.pct, 2)),
      backgroundColor: catData.map(c => CAT_COLORS[c.cat] ?? '#94a3b8'),
      borderColor: '#13131f',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color:'#94a3b8', font:{ size:11, family:'Inter' }, padding:14 } },
      tooltip: { backgroundColor:'#1e1e30', titleColor:'#f1f5f9', bodyColor:'#94a3b8', borderColor:'rgba(255,255,255,0.08)', borderWidth:1 },
    },
    cutout: '65%',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Data-driven self-improvement. Know your patterns.</p>
      </div>

      <div className="page-body">
        {/* Overview stats */}
        <div className="analytics-overview">
          <OverviewCard label="Weekly Habits" value={`${weekHabit}%`} sub="avg completion" color="green" />
          <OverviewCard label="Focus Sessions" value={totalFocus} sub="all time" color="accent" />
          <OverviewCard label="Journal Days" value={journalDays} sub="entries recorded" color="gold" />
          <OverviewCard label="Active Habits" value={habitStore.getAll().length} sub="currently tracking" color="accent" />
        </div>

        {/* Strongest / Weakest */}
        {catData.length > 1 && (
          <div className="grid-2 mb-4">
            <div className="card highlight-card" style={{ borderColor:'rgba(16,185,129,0.3)' }}>
              <div className="section-label" style={{ color:'var(--green-light)' }}>💪 Strongest Area</div>
              <div className="highlight-val">{strongest?.cat.charAt(0).toUpperCase() + strongest?.cat.slice(1)}</div>
              <div className="text-sm text-muted">{strongest?.pct}% this week</div>
            </div>
            <div className="card highlight-card" style={{ borderColor:'rgba(239,68,68,0.25)' }}>
              <div className="section-label" style={{ color:'var(--red)' }}>⚠️ Needs Work</div>
              <div className="highlight-val">{weakest?.cat.charAt(0).toUpperCase() + weakest?.cat.slice(1)}</div>
              <div className="text-sm text-muted">{weakest?.pct}% this week</div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="charts-grid">
          <div className="card chart-card">
            <h4 className="mb-3">Habit Completion (14 days)</h4>
            <div style={{ height: 200 }}>
              <Bar data={habitBarData} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, max:100, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => v + '%' } } } }} />
            </div>
          </div>

          <div className="card chart-card">
            <h4 className="mb-3">Focus Sessions (14 days)</h4>
            <div style={{ height: 200 }}>
              <Line data={focusLineData} options={CHART_OPTS} />
            </div>
          </div>
        </div>

        {/* Category doughnut */}
        {catData.length > 0 && (
          <div className="card mt-4" style={{ padding:'1.5rem' }}>
            <h4 className="mb-1">Category Breakdown (this week)</h4>
            <p className="text-sm text-muted mb-4">Habit completion % per category</p>
            <div style={{ height: 260, maxWidth: 320, margin:'0 auto' }}>
              <Doughnut data={doughnutData} options={doughnutOpts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value, sub, color }) {
  const c = color === 'green' ? 'var(--green-light)' : color === 'gold' ? 'var(--gold-light)' : 'var(--accent-light)';
  return (
    <div className="card analytics-stat">
      <div className="analytics-val" style={{ color:c }}>{value}</div>
      <div className="analytics-label">{label}</div>
      <div className="analytics-sub">{sub}</div>
    </div>
  );
}
