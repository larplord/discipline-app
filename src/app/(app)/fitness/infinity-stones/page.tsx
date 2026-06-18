'use client';

import { useMemo, useState } from 'react';
import '@/styles/pages/Fitness.css';

type Stone = {
  id: string;
  icon: string;
  title: string;
  target: string;
  timeframe: string;
  progress: number;
  phase: string;
  block: string;
  mantra: string;
  milestones: string[];
  weekly: [string, string][];
  actions: string[];
};

const initialStones: Stone[] = [
  {
    id: 'physique', icon: '💪', title: 'Physique Goal', target: 'Dec 31, 2026', timeframe: '1 year, 6 months', progress: 68, phase: 'Build & Definition', block: 'Inconsistent nutrition on weekends', mantra: 'If you show up daily, the system tells you what to do. Follow the plan. Trust the process. Repeat.',
    milestones: ['May 2025 · Strength Base Phase', 'Jun 2025 · Hypertrophy Block 1', 'Jul 2025 · Hypertrophy Block 2', 'Aug 2025 · Strength Intensification', 'Sep 2025 · Cut / Definition Phase'],
    weekly: [['4–5 Strength Workouts', '4/5'], ['2 Cardio Sessions', '2/2'], ['10k Steps Daily Avg', '7,842'], ['Protein 180g+ Daily', '5/7'], ['Calorie Target 2,400', '5/7'], ['7+ Hours Sleep', '5/7'], ['Progress Photos', '1/1']],
    actions: ['Morning Weigh-in', 'Hydrate: 96 oz Water', 'Hit Protein Goal', 'Workout (Push / Pull / Legs)', '10k Steps', 'Mobility / Stretch 10 min', 'Log Meals & Macros', 'Read / Learn 20 min'],
  },
  { id: 'finance', icon: '$', title: 'Financial Freedom', target: 'Jun 30, 2028', timeframe: '3 years, 2 months', progress: 42, phase: 'Wealth Building', block: 'Lifestyle creep & impulse spending', mantra: 'Every dollar needs a job before it gets permission to leave.', milestones: ['May 2025 · Budget Lock', 'Jun 2025 · Debt Sweep', 'Jul 2025 · Emergency Fund', 'Aug 2025 · Investment Automation'], weekly: [['Budget review', '1/1'], ['Expense tracking', '5/7'], ['No impulse buys', '6/7'], ['Savings transfer', '1/1']], actions: ['Review budget & track expenses', 'Check subscriptions', 'Move surplus to savings', 'Log all purchases'] },
  { id: 'business', icon: '↗', title: 'Business Growth', target: 'Dec 31, 2027', timeframe: '2 years, 6 months', progress: 55, phase: 'Scale & Systems', block: 'Lead generation inconsistency', mantra: 'Systems first. Momentum second. Scale third.', milestones: ['May 2025 · Offer Clarity', 'Jun 2025 · Pipeline Build', 'Jul 2025 · Client Delivery Loop', 'Aug 2025 · Automation Layer'], weekly: [['Follow up leads', '3/5'], ['Publish content', '2/3'], ['Improve offer', '1/1'], ['Review metrics', '1/1']], actions: ['Follow up with 3 leads', 'Review pipeline', 'Ship one business asset', 'Plan tomorrow’s outreach'] },
  { id: 'faith', icon: '✚', title: 'Faith / Character', target: 'Dec 31, 2030', timeframe: '5 years', progress: 31, phase: 'Foundation Building', block: 'Spiritual dryness & distraction', mantra: 'Quiet consistency compounds into character.', milestones: ['May 2025 · Morning Anchor', 'Jun 2025 · Scripture Rhythm', 'Jul 2025 · Service Habit'], weekly: [['Morning prayer', '5/7'], ['Bible reading', '4/7'], ['Journal reflection', '3/7']], actions: ['Morning prayer & Bible reading', 'Journal one conviction', 'Reach out to one person'] },
  { id: 'discipline', icon: '🧠', title: 'Discipline OS Build', target: 'Jun 30, 2026', timeframe: '1 year', progress: 74, phase: 'System Integration', block: 'Overthinking & delayed starts', mantra: 'Start the routine before emotion gets a vote.', milestones: ['May 2025 · Dashboard Spine', 'Jun 2025 · Agent Workflows', 'Jul 2025 · Review System'], weekly: [['Daily check-in', '6/7'], ['Weekly review', '1/1'], ['System cleanup', '2/2']], actions: ['Daily reflection & habits check-in', 'Review command centre', 'Update one protocol'] },
  { id: 'skill', icon: '★', title: 'Skill Mastery', target: 'Dec 31, 2027', timeframe: '2 years, 6 months', progress: 48, phase: 'Advanced Practice', block: 'Lack of deliberate practice time', mantra: 'Practice deliberately. Measure honestly. Repeat patiently.', milestones: ['May 2025 · Skill Map', 'Jun 2025 · Practice Blocks', 'Jul 2025 · Feedback Loop'], weekly: [['Practice sessions', '5/7'], ['Feedback review', '1/1'], ['Ship proof', '1/1']], actions: ['Deliberate practice session', 'Review notes', 'Publish one proof-of-work'] },
];

const roadmap = [
  ['6 Months', 'Nov 2025', 'Foundation', 'Build consistency\nEstablish base'],
  ['1 Year', 'Dec 2026', 'Transformation', 'Physique transformation complete'],
  ['2 Years', 'Dec 2027', 'Peak Performance', 'Sustainable elite level achieved'],
  ['5 Years', 'Dec 2030', 'Legacy Body', 'Maintain, mentor, inspire others'],
] as const;

const focusActions = [
  ['Physique Goal', 'Push Workout (Chest/Shoulders)', '60 min'],
  ['Financial Freedom', 'Review budget & track expenses', '20 min'],
  ['Business Growth', 'Follow up with 3 leads', '30 min'],
  ['Faith / Character', 'Morning prayer & Bible reading', '20 min'],
  ['Discipline OS Build', 'Daily reflection & habits check-in', '15 min'],
  ['Skill Mastery', 'Deliberate practice session', '45 min'],
] as const;

export default function InfinityStonesPage() {
  const [stones, setStones] = useState(initialStones);
  const [selectedId, setSelectedId] = useState('physique');
  const [doneActions, setDoneActions] = useState<string[]>(['Morning Weigh-in', 'Hydrate: 96 oz Water', 'Hit Protein Goal']);
  const [focusMode, setFocusMode] = useState(false);
  const [status, setStatus] = useState('System ready. Select a stone or start focus mode.');
  const [showPlan, setShowPlan] = useState<'milestone' | 'weekly' | 'daily' | null>(null);

  const selected = useMemo(() => stones.find((stone) => stone.id === selectedId) || stones[0], [stones, selectedId]);
  const completed = selected.actions.filter((action) => doneActions.includes(action)).length;

  function addStone() {
    const custom: Stone = {
      id: `stone-${stones.length + 1}`,
      icon: '∞', title: `New Infinity Stone ${stones.length - 5}`, target: 'Set target date', timeframe: 'Define timeframe', progress: 0, phase: 'Planning', block: 'Unidentified hard block', mantra: 'Name the goal. Define the system. Start today.',
      milestones: ['Define outcome', 'Choose weekly target', 'Schedule first review'], weekly: [['Create plan', '0/1'], ['Take first action', '0/1']], actions: ['Define exact target', 'Choose next physical action', 'Schedule review'],
    };
    setStones((current) => [...current, custom]);
    setSelectedId(custom.id);
    setStatus('New Infinity Stone staged. Edit the goal details next.');
  }

  function editSelected() {
    setStatus(`Edit mode queued for ${selected.title}. Next pass can connect this to saved goal data.`);
  }

  function toggleAction(action: string) {
    setDoneActions((current) => current.includes(action) ? current.filter((item) => item !== action) : [...current, action]);
    setStatus(`Daily action updated: ${action}`);
  }

  return (
    <main className="infinity-page hud-page fade-in">
      <header className="infinity-hero">
        <div className="title-cluster">
          <span className="panel-icon infinity-icon">∞</span>
          <div>
            <h1>Infinity Stones</h1>
            <p>Long-term goals and challenge planning from 6 months to 5 years.</p>
          </div>
        </div>
        <aside className="infinity-quote hud-card"><b>“</b><span>The future is built daily. Choose your stones. Start today.</span><b>”</b><small>— You, Future Architect</small></aside>
      </header>

      <section className="infinity-shell">
        <aside className="stones-rail">
          {stones.map((stone) => (
            <button key={stone.id} className={`stone-card hud-card ${stone.id === selected.id ? 'active' : ''}`} onClick={() => { setSelectedId(stone.id); setStatus(`${stone.title} selected.`); }}>
              <span className="stone-symbol">{stone.icon}</span>
              <span className="stone-main"><strong>{stone.title}</strong><small>Target: {stone.target} · {stone.timeframe}</small></span>
              <b>{stone.progress}%</b>
              <i><span style={{ width: `${stone.progress}%` }} /></i>
              <em><small>Current Phase</small>{stone.phase}</em>
              <em className="hard"><small>Hard Block</small>{stone.block}</em>
            </button>
          ))}
          <button className="add-stone-btn" onClick={addStone}>＋ Add New Infinity Stone</button>
        </aside>

        <section className="stone-command">
          <article className="selected-stone hud-card">
            <div className="selected-head"><strong>⌂ Selected Stone: <span>{selected.title}</span></strong><button onClick={editSelected}>✎ Edit Goal</button></div>
            <div className="metric-strip">
              <div><span>▣</span><small>Target Date</small><strong>{selected.target}</strong></div>
              <div><span>◷</span><small>Total Timeframe</small><strong>{selected.timeframe}</strong></div>
              <div><span>◉</span><small>Progress</small><strong>{selected.progress}%</strong></div>
              <div><span>♙</span><small>Current Phase</small><strong>{selected.phase}</strong></div>
              <div className="danger"><span>◆</span><small>Hard Block</small><strong>{selected.block}</strong></div>
            </div>
            <p className="stone-mantra">{selected.mantra}</p>
          </article>

          <div className="stone-grid-three">
            <article className="hud-card stone-panel"><h2>Monthly Milestones</h2><small>What needs to happen this month</small>{selected.milestones.map((item, index) => <p key={item}><i /> <span>{item}</span><em className={index === 0 ? 'done' : index === 1 ? 'progress' : ''}>{index === 0 ? 'Complete' : index === 1 ? 'In Progress' : 'Upcoming'}</em></p>)}<button onClick={() => setShowPlan(showPlan === 'milestone' ? null : 'milestone')}>View full milestone plan</button></article>
            <article className="hud-card stone-panel"><h2>Weekly Targets</h2><small>What to hit every week</small>{selected.weekly.map(([name, value]) => <p key={name}><i /> <span>{name}</span><em>{value}</em></p>)}<button onClick={() => setShowPlan(showPlan === 'weekly' ? null : 'weekly')}>View full weekly plan</button></article>
            <article className="hud-card stone-panel"><h2>Daily Actions</h2><small>What to do every day</small>{selected.actions.map((action) => <button className="daily-stone-action" key={action} onClick={() => toggleAction(action)}><span>{action}</span><b>{doneActions.includes(action) ? '✓' : '○'}</b></button>)}<button onClick={() => setShowPlan(showPlan === 'daily' ? null : 'daily')}>View daily action plan</button></article>
          </div>

          {showPlan && <article className="hud-card expanded-plan"><strong>{showPlan === 'milestone' ? 'Milestone plan opened' : showPlan === 'weekly' ? 'Weekly plan opened' : 'Daily action plan opened'}</strong><span>{selected.title}: next operating layer is ready for saved data wiring.</span></article>}

          <article className="hud-card roadmap-panel"><h2>Long-Term Roadmap</h2><div className="roadmap-line">{roadmap.map(([time, date, title, copy]) => <section key={time}><strong>{time}</strong><small>{date}</small><i /><b>{title}</b><p>{copy}</p></section>)}</div></article>

          <div className="stone-bottom-grid">
            <article className="hud-card today-long"><div className="panel-title-row"><h2>Today’s Actions Toward Long-Term Goals</h2><button onClick={() => setStatus('All long-term actions expanded.')}>View All</button></div><small>What moves the needle today</small>{focusActions.map(([goal, action, time]) => <p key={goal}><span>{goal}</span><b>{action}</b><em>{time}</em><button onClick={() => setStatus(`${action} marked as the next needle-mover.`)}>○</button></p>)}<footer><div><small>Total Focus Time</small><strong>3h 10m</strong></div><div><small>Completion</small><strong>{completed} / {selected.actions.length}</strong></div><button onClick={() => { setFocusMode((value) => !value); setStatus(!focusMode ? 'Focus mode started. One stone, one action.' : 'Focus mode paused.'); }}>{focusMode ? 'Pause Focus Mode' : 'Start Focus Mode'}</button></footer></article>
            <article className="hud-card checkpoint"><h2>Next Monthly Checkpoint</h2><small>Stay on track. Review. Adjust. Level up.</small><div className="checkpoint-card"><strong>▣ June 1–2, 2025</strong><em>In 6 Days</em><span>Monthly Review & Plan</span>{['Review progress & metrics', 'Assess wins & challenges', 'Update goals & strategies', 'Plan next month’s priorities'].map((item) => <button key={item} onClick={() => setStatus(`Checkpoint item selected: ${item}`)}>{item}<b>○</b></button>)}</div><footer><div><small>Estimated Time</small><strong>90 min</strong></div><button onClick={() => setStatus('Monthly checkpoint preparation queued.')}>Prepare Now</button></footer></article>
          </div>
        </section>
      </section>

      <section className="infinity-principles hud-card">
        {['Success Formula', 'Show Up Daily', 'Follow The System', 'Eliminate Hard Blocks', 'Compound Results'].map((item) => <button key={item} onClick={() => setStatus(`${item} principle selected.`)}>◎ {item}</button>)}
      </section>
      <p className="infinity-status">{status}</p>
    </main>
  );
}
