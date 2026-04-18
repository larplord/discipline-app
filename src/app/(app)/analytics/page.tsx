'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import type { DayLog } from '@/lib/scoring';
import { weekProgress } from '@/lib/scoring';
import '@/styles/pages/Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e1e30',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 11, family: 'Inter' } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 11, family: 'Inter' } }, min: 0 },
  },
};

const CAT_COLORS: Record<string, string> = {
  fitness: '#f87171',
  learning: '#a5b4fc',
  business: '#fcd34d',
  mindset: '#6ee7b7',
  sleep: '#c4b5fd',
  health: '#7dd3fc',
  other: '#94a3b8',
};

export default function AnalyticsPage() {
  const { uid, habits } = useUserData();
  const [habitLogs, setHabitLogs] = useState<Record<string, DayLog>>({});
  const [focusLogs, setFocusLogs] = useState<Record<string, number>>({});
  const [journalCount, setJournalCount] = useState(0);

  useEffect(() => {
    const db = getFirestoreDb();
    const u1 = onSnapshot(collection(db, 'users', uid, 'habitLogs'), (snap) => {
      const m: Record<string, DayLog> = {};
      snap.forEach((d) => {
        m[d.id] = (d.data()?.entries as DayLog) ?? {};
      });
      setHabitLogs(m);
    });
    const u2 = onSnapshot(collection(db, 'users', uid, 'focusLogs'), (snap) => {
      const m: Record<string, number> = {};
      snap.forEach((d) => {
        m[d.id] = Number(d.data()?.count ?? 0);
      });
      setFocusLogs(m);
    });
    const u3 = onSnapshot(collection(db, 'users', uid, 'journal'), (snap) => {
      let n = 0;
      snap.forEach((d) => {
        const e = d.data();
        if (e?.well || e?.freeform) n++;
      });
      setJournalCount(n);
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, [uid]);

  const days = 14;
  const habitTrend = Array.from({ length: days }, (_, i) => {
    const date = format(new Date(Date.now() - (days - 1 - i) * 86400000), 'yyyy-MM-dd');
    const day = habitLogs[date] ?? {};
    const done = habits.filter((h) => day[h.id]).length;
    const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
    return { date: format(new Date(Date.now() - (days - 1 - i) * 86400000), 'MMM d'), pct };
  });
  const focusTrend = Array.from({ length: days }, (_, i) => {
    const date = format(new Date(Date.now() - (days - 1 - i) * 86400000), 'yyyy-MM-dd');
    return {
      date: format(new Date(Date.now() - (days - 1 - i) * 86400000), 'MMM d'),
      sessions: focusLogs[date] ?? 0,
    };
  });

  const cats: Record<string, { done: number; total: number }> = {};
  habits.forEach((h) => {
    cats[h.category] = cats[h.category] ?? { done: 0, total: 0 };
  });
  for (let d = 0; d < 7; d++) {
    const date = format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd');
    const day = habitLogs[date] ?? {};
    habits.forEach((h) => {
      cats[h.category]!.total++;
      if (day[h.id]) cats[h.category]!.done++;
    });
  }
  const catData = Object.entries(cats).map(([cat, v]) => ({
    cat,
    pct: v.total ? Math.round((v.done / v.total) * 100) : 0,
  }));

  const weekHabit = weekProgress(habits, habitLogs);
  const totalFocus = Object.values(focusLogs).reduce((a, b) => a + b, 0);
  const labels = habitTrend.map((d) => d.date);
  const habitPcts = habitTrend.map((d) => d.pct);
  const focusSess = focusTrend.map((d) => d.sessions);

  const habitBarData = {
    labels,
    datasets: [
      {
        data: habitPcts,
        backgroundColor: habitPcts.map((v) =>
          v >= 80 ? 'rgba(16,185,129,0.7)' : v >= 50 ? 'rgba(99,102,241,0.7)' : 'rgba(245,158,11,0.5)'
        ),
        borderRadius: 6,
      },
    ],
  };

  const focusLineData = {
    labels,
    datasets: [
      {
        data: focusSess,
        borderColor: 'rgba(99,102,241,1)',
        backgroundColor: 'rgba(99,102,241,0.08)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99,102,241,1)',
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: catData.map((c) => c.cat.charAt(0).toUpperCase() + c.cat.slice(1)),
    datasets: [
      {
        data: catData.map((c) => Math.max(c.pct, 2)),
        backgroundColor: catData.map((c) => CAT_COLORS[c.cat] ?? '#94a3b8'),
        borderColor: '#13131f',
        borderWidth: 3,
      },
    ],
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, padding: 14 } },
      tooltip: CHART_OPTS.plugins.tooltip,
    },
    cutout: '65%',
  };

  const sorted = [...catData].sort((a, b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Data-driven self-improvement. Know your patterns.</p>
      </div>

      <div className="page-body">
        <div className="analytics-overview">
          <OverviewCard label="Weekly Habits" value={`${weekHabit}%`} sub="avg completion" color="green" />
          <OverviewCard label="Focus Sessions" value={totalFocus} sub="all time" color="accent" />
          <OverviewCard label="Journal Days" value={journalCount} sub="entries recorded" color="gold" />
          <OverviewCard label="Active Habits" value={habits.length} sub="currently tracking" color="accent" />
        </div>

        <div className="analytics-grid mt-4">
          <div className="card chart-card">
            <h4 className="mb-3">Habit completion (14d)</h4>
            <div className="chart-wrap">
              <Bar data={habitBarData} options={CHART_OPTS} />
            </div>
          </div>
          <div className="card chart-card">
            <h4 className="mb-3">Focus sessions (14d)</h4>
            <div className="chart-wrap">
              <Line data={focusLineData} options={CHART_OPTS} />
            </div>
          </div>
          <div className="card chart-card span-2">
            <h4 className="mb-3">Category balance (7d)</h4>
            <div className="chart-wrap dough">
              <Doughnut data={doughnutData} options={doughnutOpts} />
            </div>
            {strongest && (
              <p className="text-sm text-muted mt-3">
                Strongest: <span className="text-green">{strongest.cat}</span> ({strongest.pct}%) · Weakest:{' '}
                <span className="text-gold">{weakest?.cat}</span> ({weakest?.pct ?? 0}%)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: 'green' | 'accent' | 'gold';
}) {
  const c = color === 'green' ? 'var(--green-light)' : color === 'gold' ? 'var(--gold-light)' : 'var(--accent-light)';
  return (
    <div className="overview-card card">
      <div className="ov-label">{label}</div>
      <div className="ov-value" style={{ color: c }}>
        {value}
      </div>
      <div className="ov-sub">{sub}</div>
    </div>
  );
}
