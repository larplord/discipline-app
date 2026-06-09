import { hevyWorkoutData } from '@/data/hevyWorkoutData';
import '@/styles/pages/Fitness.css';

const quickAdds = ['+8 oz', '+12 oz', '+16 oz', '+24 oz'];

const readiness = [
  { icon: '☾', label: 'Sleep', value: '7h 32m', status: 'Good' },
  { icon: '♙', label: 'Soreness', value: '3 / 10', status: 'Low' },
  { icon: '♡', label: 'Resting HR', value: '52 bpm', status: 'Optimal' },
  { icon: 'ϟ', label: 'Energy', value: '7 / 10', status: 'Good' },
];

const macros = [
  { label: 'Calories', value: '1,942 / 2,400 kcal', percent: '81%', width: '81%', tone: 'cyan' },
  { label: 'Protein', value: '168 / 180 g', percent: '93%', width: '93%', tone: 'green' },
  { label: 'Carbs', value: '210 / 260 g', percent: '81%', width: '81%', tone: 'blue' },
  { label: 'Fats', value: '62 / 70 g', percent: '89%', width: '89%', tone: 'gold' },
];

const supplements = [
  { name: 'Creatine Monohydrate', amount: '5 g', done: true },
  { name: 'Whey Protein', amount: '1 scoop', done: true },
  { name: 'Omega-3', amount: '1 softgel', done: true },
  { name: 'Vitamin D3', amount: '2,000 IU', done: true },
  { name: 'Magnesium', amount: '200 mg', done: true },
  { name: '10 min Mobility', amount: 'Today', done: true },
  { name: 'No Alcohol', amount: 'Today', done: true },
  { name: 'Early to bed', amount: '6 of 7 days', done: false },
];

const coachWins = [
  'Hevy archive imported: 100 workouts and 1,132 logged sets.',
  'Lat pulldown, Smith bench, and pec deck are carrying the most total volume.',
  'Latest week is active again with 2 sessions logged.',
  'Leg extension and squat both posted strong recent top sets on Jun 2.',
];

const coachFocus = [
  'Current week is 33% below the previous active week—add 1–2 sessions if recovery allows.',
  'Latest session was arms and shoulders; rotate back to legs or pull work next.',
  'Keep the heavy lower-body pattern warm: squat, RDL, leg extension, hamstring curl.',
  'Connect the Hevy API later for automatic sync; this view is powered by the CSV import.',
];

function CardMenu() {
  return <span className="health-menu" aria-hidden="true">⋮</span>;
}

function LinkAction({ children }: { children: React.ReactNode }) {
  return <span className="health-link-action">{children} <span aria-hidden="true">›</span></span>;
}

function MiniTrendChart() {
  const points = '4,30 12,32 20,31 28,36 36,32 44,38 52,34 60,42 68,39 76,47 84,43 92,49 100,48';
  return (
    <div className="body-trend-chart" aria-label="Bodyweight trend chart">
      <svg viewBox="0 0 104 62" preserveAspectRatio="none" aria-hidden="true">
        {[12, 28, 44, 60].map((y) => <line key={y} className="chart-grid" x1="2" x2="102" y1={y} y2={y} />)}
        <polyline className="body-line" points={points} />
        <circle className="chart-dot" cx="100" cy="48" r="2.8" />
      </svg>
      <div className="body-y-axis"><span>190</span><span>180</span><span>170</span><span>160</span></div>
      <div className="body-x-axis"><span>Apr 18</span><span>Apr 25</span><span>May 2</span><span>May 9</span><span>May 16</span></div>
    </div>
  );
}

function StepsBars() {
  const bars = [56, 72, 49, 92, 76, 52, 62];
  return (
    <div className="steps-chart" aria-label="Weekly steps bar chart">
      <div className="steps-y"><span>12K</span><span>8K</span><span>4K</span><span>0</span></div>
      <div className="steps-bars">
        {bars.map((height, index) => (
          <div className={`steps-bar ${index === 6 ? 'outline' : ''}`} key={`${height}-${index}`} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="steps-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
    </div>
  );
}

export default function HealthPage() {
  const { nextMilestone } = hevyWorkoutData;

  return (
    <main className="health-page health-command-page hud-page fade-in">
      <section className="health-dashboard-grid">
        <article className="health-panel hevy-panel hud-card">
          <header className="panel-title-row">
            <div className="title-cluster">
              <span className="panel-icon">∞</span>
              <h1>Hevy Sync</h1>
            </div>
            <div className="hevy-emblem" aria-hidden="true">⌘</div>
          </header>
          <div className="sync-state"><span /> Hevy CSV imported</div>
          <p className="sync-time">Last synced: {hevyWorkoutData.lastSynced} · {hevyWorkoutData.dateRange} <span aria-hidden="true">↻</span></p>

          <div className="hevy-split-box">
            <div className="split-current">
              <span className="mini-icon">⌁</span>
              <small>Training archive</small>
              <strong>{hevyWorkoutData.totalWorkouts} workouts · {hevyWorkoutData.totalSets.toLocaleString()} sets · {hevyWorkoutData.totalVolume.toLocaleString()} lb moved</strong>
            </div>
            <div className="workout-pair">
              <div>
                <small>Last workout</small>
                <strong>{hevyWorkoutData.latestWorkout.name}</strong>
                <span>{hevyWorkoutData.latestWorkout.display} · {hevyWorkoutData.latestWorkout.sets} sets · {hevyWorkoutData.latestWorkout.volume.toLocaleString()} lb</span>
                <em>✓</em>
              </div>
              <div>
                <small>Previous workout</small>
                <strong>{hevyWorkoutData.previousWorkout.name}</strong>
                <span>{hevyWorkoutData.previousWorkout.display} · {hevyWorkoutData.previousWorkout.sets} sets · {hevyWorkoutData.previousWorkout.volume.toLocaleString()} lb</span>
                <em>↺</em>
              </div>
            </div>
            <div className="hevy-bottom-grid">
              <div>
                <small>Weekly volume</small>
                <strong>{hevyWorkoutData.weeklyVolume.toLocaleString()} lb</strong>
                <span className="hevy-warning">{hevyWorkoutData.weeklyVolumeChange}</span>
              </div>
              <div>
                <small>Workouts this week</small>
                <strong>{hevyWorkoutData.workoutsThisWeek} / {hevyWorkoutData.weeklyGoal}</strong>
                <div className="mini-progress-dots">
                  {Array.from({ length: hevyWorkoutData.weeklyGoal }).map((_, index) => (
                    index < hevyWorkoutData.workoutsThisWeek ? <span key={index} /> : <i key={index} />
                  ))}
                </div>
              </div>
              <div>
                <small className="cyan-text">Recent PRs</small>
                <ul className="pr-list">
                  {hevyWorkoutData.prs.map((pr) => <li key={pr.lift}><span>{pr.lift}</span><strong>{pr.value}</strong><em>{pr.date}</em></li>)}
                </ul>
                <LinkAction>Imported from CSV</LinkAction>
              </div>
            </div>
            <div className="hevy-import-grid">
              <section>
                <small>Recent sessions</small>
                <div className="hevy-session-list">
                  {hevyWorkoutData.recentWorkouts.map((workout) => (
                    <p key={`${workout.name}-${workout.date}`}><span>{workout.date}</span><strong>{workout.name}</strong><em>{workout.sets} sets · {workout.volume}</em></p>
                  ))}
                </div>
              </section>
              <section>
                <small>Top volume lifts</small>
                <div className="hevy-session-list">
                  {hevyWorkoutData.topVolume.map((lift) => (
                    <p key={lift.name}><span>{lift.maxWeight}</span><strong>{lift.name}</strong><em>{lift.sets} sets · {lift.volume}</em></p>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </article>

        <article className="health-panel milestone-panel hud-card">
          <header className="panel-title-row compact">
            <div className="title-cluster"><span className="panel-icon">♕</span><h1>Next Gym Milestone</h1></div>
          </header>
          <p className="target-label">Target Lift</p>
          <h2>{nextMilestone.lift} <span>{nextMilestone.goal}</span></h2>
          <p className="record-label">{nextMilestone.recordLabel}</p>
          <div className="milestone-arc" aria-label={`${nextMilestone.progress} percent milestone progress`}><span>{nextMilestone.progress}%</span><small>of the way there</small></div>
          <div className="milestone-scale"><span><strong>{nextMilestone.current}</strong><small>Current</small></span><span><strong>{nextMilestone.goal}</strong><small>Goal</small></span></div>
          <div className="milestone-stats">
            <div><span>♙</span><strong>{nextMilestone.remaining}</strong><small>To go</small></div>
            <div><span>◷</span><strong>{nextMilestone.sessionsEstimate}</strong><small>Sessions est.</small></div>
            <div><span>⌁</span><strong>{nextMilestone.source}</strong><small>Data source</small></div>
          </div>
          <p className="panel-note">☆ {nextMilestone.note}</p>
        </article>

        <article className="health-panel hydration-panel hud-card">
          <header className="small-card-title"><div><span>♢</span><h2>Hydration</h2></div><CardMenu /></header>
          <small>Daily goal</small>
          <div className="metric-row"><strong>96 oz</strong><span>75%</span></div>
          <div className="health-bar"><span style={{ width: '75%' }} /></div>
          <div className="split-metric"><span><strong>72 oz</strong><small>Consumed</small></span><span><strong>24 oz</strong><small>Remaining</small></span></div>
          <p className="quick-add-label">Quick add</p>
          <div className="quick-add-grid">{quickAdds.map((add) => <button key={add} type="button">{add}</button>)}</div>
          <button className="log-custom" type="button">⊙ Log custom amount</button>
        </article>

        <article className="health-panel readiness-panel hud-card">
          <header className="small-card-title"><div><span>♡</span><h2>Recovery / Readiness</h2></div><CardMenu /></header>
          <div className="readiness-ring"><span>82</span></div>
          <p className="readiness-label">Recovery Score</p>
          <strong className="readiness-good">Good</strong>
          <div className="readiness-list">{readiness.map((item) => <div key={item.label}><span>{item.icon} {item.label}</span><strong>{item.value}</strong><em>{item.status}</em></div>)}</div>
          <p className="panel-note small">◎ Great recovery. You’re ready to perform.</p>
        </article>

        <article className="health-panel macros-panel hud-card">
          <header className="small-card-title"><div><span>♧</span><h2>Nutrition / Macros</h2></div><CardMenu /></header>
          <div className="macro-list">{macros.map((macro) => <div className="macro-line" key={macro.label}><div><span>{macro.label}</span><strong>{macro.value}</strong><em>{macro.percent}</em></div><div className={`macro-bar ${macro.tone}`}><span style={{ width: macro.width }} /></div></div>)}</div>
          <LinkAction>View full nutrition</LinkAction>
        </article>

        <article className="health-panel body-panel hud-card">
          <header className="small-card-title"><div><span>♙</span><h2>Body Metrics</h2></div><CardMenu /></header>
          <small>Bodyweight</small>
          <div className="body-main-metric"><strong>179.6 lb</strong><span>-1.6 lb<small>vs last week</small></span></div>
          <MiniTrendChart />
          <div className="body-stats"><div><small>Body Fat</small><strong>13.2%</strong><span>-0.6%</span></div><div><small>Lean Mass</small><strong>155.8 lb</strong><span>+0.8 lb</span></div><div><small>Waist</small><strong>32.1 in</strong><span>-0.3 in</span></div></div>
          <LinkAction>View full metrics</LinkAction>
        </article>

        <article className="health-panel steps-panel hud-card">
          <header className="small-card-title"><div><span>⌁</span><h2>Steps / Movement</h2></div><CardMenu /></header>
          <div className="metric-row"><strong>8,642 <small>/ 10,000</small></strong><span>86%</span></div>
          <div className="health-bar"><span style={{ width: '86%' }} /></div>
          <StepsBars />
          <div className="movement-stats"><div><small>Distance</small><strong>4.2 mi</strong></div><div><small>Active Cal</small><strong>412 kcal</strong></div><div><small>Flights</small><strong>12</strong></div></div>
          <p className="panel-note small">◎ Keep moving—great week so far.</p>
        </article>

        <article className="health-panel supplements-panel hud-card">
          <header className="small-card-title"><div><span>✓</span><h2>Supplements / Habits</h2></div><CardMenu /></header>
          <small>Today</small>
          <div className="supplement-list">{supplements.map((item) => <div key={item.name}><span>◷ {item.name}</span><strong>{item.amount}</strong><em className={item.done ? 'done' : ''}>{item.done ? '✓' : '○'}</em></div>)}</div>
          <LinkAction>Manage habits</LinkAction>
        </article>

        <article className="health-panel coach-panel hud-card">
          <header className="coach-header"><div className="title-cluster"><span className="panel-icon">◎</span><h1>AI Coach Insight</h1></div><small>Updated today, 8:42 AM</small></header>
          <div className="coach-grid">
            <section><h3>What’s going well</h3>{coachWins.map((item) => <p key={item}><span>✓</span>{item}</p>)}</section>
            <section><h3>Focus next</h3>{coachFocus.map((item) => <p key={item}><span>➜</span>{item}</p>)}</section>
            <section className="consistency-card"><h3>Weekly consistency score</h3><div className="consistency-ring"><span>87%</span></div><strong>Great week!</strong><button type="button">View weekly breakdown</button></section>
          </div>
        </article>
      </section>
    </main>
  );
}
