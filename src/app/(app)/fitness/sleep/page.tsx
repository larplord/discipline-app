import Link from 'next/link';
import '@/styles/pages/Fitness.css';

const sleepStages = [
  { label: 'Awake', value: '34m', pct: '7%', tone: 'orange' },
  { label: 'REM', value: '1h 32m', pct: '20%', tone: 'purple' },
  { label: 'Core', value: '4h 41m', pct: '61%', tone: 'blue' },
  { label: 'Deep', value: '55m', pct: '12%', tone: 'navy' },
];

const trendDays = [
  { day: 'Fri', duration: '7h 18m', score: 81, height: 68, tone: 'blue' },
  { day: 'Sat', duration: '7h 52m', score: 85, height: 82, tone: 'blue' },
  { day: 'Sun', duration: '8h 03m', score: 87, height: 90, tone: 'blue' },
  { day: 'Mon', duration: '6h 45m', score: 72, height: 55, tone: 'amber' },
  { day: 'Tue', duration: '7h 31m', score: 82, height: 76, tone: 'blue' },
  { day: 'Wed', duration: '7h 42m', score: 84, height: 84, tone: 'blue' },
  { day: 'Thu', duration: '7h 42m', score: 84, height: 84, tone: 'outline' },
];

const recovery = [
  { label: 'Resting Heart Rate', value: '52 bpm', delta: '▼ 3' },
  { label: 'HRV', value: '54 ms', delta: '▲ 6' },
  { label: 'Respiratory Rate', value: '13.2 brpm', delta: '▼ 0.4' },
  { label: 'Wrist Temperature', value: '+0.2 °F', delta: '▲' },
];

const checklist = [
  ['Dim lights', true],
  ['No screens 45m before bed', true],
  ['Set alarm', true],
  ['Charge phone & watch', true],
  ['Magnesium (200–400 mg)', false],
  ['Read or relax', true],
  ['In bed on time', false],
] as const;

const factors = [
  { label: 'Caffeine', value: '1 cup', detail: 'Before 12 PM', tone: 'good' },
  { label: 'Late Workout', value: 'No', detail: '', tone: 'good' },
  { label: 'Screen Time', value: '2h 15m', detail: 'Moderate', tone: 'warn' },
  { label: 'Stress', value: 'Medium', detail: '', tone: 'warn' },
  { label: 'Naps', value: '0m', detail: '', tone: 'good' },
  { label: 'Hydration', value: 'Good', detail: '2.4 L', tone: 'good' },
];

const wins = [
  "You're hitting your sleep goal 6 of 7 nights.",
  'Bedtime consistency is improving.',
  'Deep sleep is within your optimal range.',
  'Great recovery trend this week.',
];

const focus = [
  'Try to reduce screen time in the evening.',
  'Aim for lights out 15–30m earlier.',
  'Keep caffeine before 12 PM.',
  'Stay consistent on your weekend schedule.',
];

function SleepPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <article className={`sleep-panel hud-card ${className}`}>{children}</article>;
}

function SleepTitle({ icon, title, action, href }: { icon: string; title: string; action?: string; href?: string }) {
  return (
    <header className="sleep-card-title">
      <div><span>{icon}</span><h2>{title}</h2></div>
      {action && href ? <Link href={href}>{action}</Link> : action ? <small>{action}</small> : null}
    </header>
  );
}

function ScoreRing({ score, label, sub, className = '' }: { score: number; label: string; sub: string; className?: string }) {
  return (
    <div className={`sleep-score-ring ${className}`} style={{ '--score': `${score}%` } as React.CSSProperties}>
      <span>{score}</span>
      <small>{label}</small>
      <em>{sub}</em>
    </div>
  );
}

export default function SleepPage() {
  return (
    <main className="sleep-page health-command-page hud-page fade-in">
      <section className="sleep-dashboard-grid">
        <SleepPanel className="sleep-sync-panel">
          <SleepTitle icon="⌚" title="Apple Watch Sleep Sync" />
          <div className="sleep-sync-body">
            <div className="watch-face"><span>10:09</span><strong>▰</strong><em>Sleep</em></div>
            <div className="sleep-sync-copy">
              <p className="sleep-connected"><i />Connected to Apple Watch</p>
              <p>Last synced Today, 8:42 AM <b>↻</b></p>
              <div className="sleep-mini-stats">
                <div><small>Data imported</small><strong>208</strong><span>Nights</span></div>
                <div><small>Avg. Sleep</small><strong>7h 31m</strong></div>
                <div><small>Sleep Score</small><strong>83</strong><span>7-day avg</span></div>
              </div>
            </div>
          </div>
          <footer className="sleep-source-row"><span>♡ Apple Health source<br /><small>Sleep</small></span><strong>◎ All data up to date</strong></footer>
        </SleepPanel>

        <SleepPanel className="sleep-summary-panel">
          <SleepTitle icon="☾" title="Last Night Sleep Summary" />
          <div className="sleep-summary-grid">
            <ScoreRing score={84} label="Sleep Score" sub="Good" />
            <div className="sleep-total"><strong>7<small>h</small> 42<small>m</small></strong><span>Total Sleep</span><em>▲ 0h 38m vs. baseline</em></div>
          </div>
          <div className="sleep-time-grid">
            <div><strong>10:47 PM</strong><small>Bedtime</small></div>
            <div><strong>6:41 AM</strong><small>Wake Time</small></div>
            <div><strong>7h 42m</strong><small>Time Asleep</small></div>
            <div><strong>8h 21m</strong><small>Time in Bed</small></div>
          </div>
          <footer className="sleep-panel-foot"><span>☆ You met your sleep goal!</span><strong>Goal: 7h 30m ✎</strong></footer>
        </SleepPanel>

        <SleepPanel>
          <SleepTitle icon="〽" title="Sleep Stages" action="Learn more ›" href="/fitness/sleep/stages" />
          <div className="sleep-stages-body">
            <div className="sleep-donut" />
            <div className="stage-list">{sleepStages.map((stage) => <p key={stage.label}><i className={stage.tone} /><span>{stage.label}</span><strong>{stage.value}</strong><em>{stage.pct}</em></p>)}</div>
          </div>
          <footer className="sleep-typical"><i />Typical range</footer>
        </SleepPanel>

        <SleepPanel>
          <SleepTitle icon="▥" title="Sleep Trends (7 Days)" />
          <div className="sleep-trend-head"><span>Sleep Duration</span><div><small>Average</small><strong>7h 31m</strong></div><div><small>Sleep Score</small><strong>83</strong></div></div>
          <div className="sleep-bars"><div className="sleep-goal-line" />{trendDays.map((day) => <div className="sleep-day" key={day.day}><div className={`sleep-bar ${day.tone}`} style={{ height: `${day.height}%` }} /><strong>{day.day}</strong><small>{day.duration}</small><em>{day.score}</em></div>)}</div>
          <footer className="sleep-panel-foot"><span>☆ Consistency <b>Good</b></span><strong>Bed/wake time within 45m of goal ◴</strong></footer>
        </SleepPanel>

        <SleepPanel>
          <SleepTitle icon="♡" title="Recovery / Readiness" />
          <div className="sleep-recovery-grid"><ScoreRing score={78} label="Recovery Score" sub="Good" className="small" /><div className="sleep-metric-list">{recovery.map((item) => <p key={item.label}><span>{item.label}</span><strong>{item.value}</strong><em>{item.delta}</em></p>)}</div></div>
          <footer className="sleep-panel-foot"><span>☆ Your body shows good recovery for today.</span></footer>
        </SleepPanel>

        <SleepPanel>
          <SleepTitle icon="◷" title="Bedtime Consistency / Schedule" />
          <div className="sleep-schedule-grid"><div className="sleep-goals"><p><small>Bedtime Goal</small><strong>10:30 <em>PM</em></strong><Link href="/fitness/sleep/schedule">Edit</Link></p><p><small>Wake Goal</small><strong>6:30 <em>AM</em></strong><Link href="/fitness/sleep/schedule">Edit</Link></p></div><ScoreRing score={86} label="Consistency" sub="7-Day" className="small" /><div className="sleep-window"><small>Avg. Bedtime Drift</small><strong>+18m</strong><em>On target</em><hr /><small>Ideal Sleep Window</small><span>10:15 PM – 6:30 AM<br />8h 15m</span></div></div>
          <footer className="sleep-panel-foot"><span>☆ Great job being consistent! Keep it up.</span><Link href="/fitness/sleep/schedule">Open schedule</Link></footer>
        </SleepPanel>

        <SleepPanel>
          <SleepTitle icon="☾" title="Wind-down / Tonight" />
          <div className="wind-grid"><div className="wind-cards"><div><small>Next Bedtime</small><strong>10:30 <em>PM</em></strong></div><div><small>Wind-down Reminder</small><strong>9:45 <em>PM</em></strong><span>45m before bed</span></div></div><div><h3>Wind-down checklist</h3>{checklist.map(([item, done]) => <p key={item}><i className={done ? 'done' : ''}>{done ? '✓' : '○'}</i>{item}</p>)}</div></div>
          <footer className="sleep-panel-foot"><span>☆ Build a consistent wind-down routine.</span><Link href="/fitness/sleep/schedule">Tune routine</Link></footer>
        </SleepPanel>

        <SleepPanel>
          <SleepTitle icon="⊘" title="Sleep Factors / Notes" action="Today⌄" href="/fitness/sleep/notes" />
          <div className="sleep-factor-grid">{factors.map((factor) => <div className="sleep-factor" key={factor.label}><span className={factor.tone}>◉</span><small>{factor.label}</small><strong>{factor.value}</strong>{factor.detail ? <em>{factor.detail}</em> : null}</div>)}</div>
          <Link href="/fitness/sleep/notes" className="sleep-note-add">▧ Add notes about your day <strong>⊕</strong></Link>
        </SleepPanel>

        <SleepPanel className="sleep-coach-panel">
          <header className="coach-header"><div className="title-cluster"><span className="panel-icon">✣</span><h1>AI Sleep Coach Insight</h1></div><small>Updated today, 8:42 AM</small></header>
          <div className="coach-grid sleep-coach-grid"><section><h3>What’s going well</h3>{wins.map((item) => <p key={item}><span>◎</span>{item}</p>)}</section><section><h3>Focus next</h3>{focus.map((item) => <p key={item}><span>→</span>{item}</p>)}</section><section className="sleep-week-card"><h3>This week at a glance</h3><div className="sleep-glance"><div><small>Avg. Sleep</small><strong>7h 31m</strong></div><div><small>Avg. Score</small><strong>83</strong></div><div><small>Best Night</small><strong>8h 03m</strong><em>Sun</em></div></div><Link href="/fitness/sleep/analysis">View detailed analysis</Link></section></div>
        </SleepPanel>
      </section>
    </main>
  );
}
