import Link from 'next/link';
import '@/styles/pages/Fitness.css';

const habits = [
  ['Morning routine', '7 day streak', true], ['Hydrate (2L water)', '12 day streak', true],
  ['Meditate 10 minutes', '8 day streak', true], ['Read 20 pages', '5 day streak', true],
  ['No caffeine after 2 PM', '10 day streak', true], ['Lights out by 10:30 PM', '7 day streak', false],
] as const;

const timeline = [
  ['7:00 AM', '☼', 'Morning routine', 'Done'], ['8:00 AM', '▱', 'Workout', 'Done'],
  ['9:00 AM', '▣', 'Deep Work / School', 'In Progress'], ['12:00 PM', '♨', 'Healthy lunch', 'Done'],
  ['1:00 PM', '▥', 'Study / Projects', 'In Progress'], ['3:30 PM', '☕', 'Break / Reset', 'Upcoming'],
  ['4:00 PM', '▰', 'Work / School', 'Upcoming'], ['6:00 PM', '♞', 'Workout', 'Upcoming'],
  ['7:00 PM', '▥', 'Read', 'Upcoming'], ['9:30 PM', '☾', 'Bedtime routine', 'Upcoming'], ['10:30 PM', '▬', 'In bed', 'Upcoming'],
] as const;

const checklist = ['Drink 8 glasses of water','Get 30+ minutes of sunlight','Eat 2 servings of vegetables','Move your body','Focus on a top priority','No screens 1 hour before bed','In bed on time','Journal for 5 minutes','Practice gratitude','Review tomorrow’s plan'];

function Stat({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return <article className="daily-stat hud-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{sub}</em></div></article>;
}

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="daily-card-link" href={href}>{children}<footer>Open detailed view <span>→</span></footer></Link>;
}

export default function DailyPage() {
  return (
    <main className="daily-page health-command-page hud-page fade-in">
      <header className="daily-hero">
        <div className="title-cluster"><span className="panel-icon">☼</span><div><h1>Daily</h1><p>Plan your day, stay on track, and build momentum.</p></div></div>
        <div className="daily-date"><span>▣</span><strong>May 16, 2025</strong><small>Friday</small><button>‹</button><button>›</button></div>
      </header>

      <section className="daily-stat-grid">
        <Stat icon="✓" label="Habits Completed" value="5 / 6" sub="83%" />
        <Stat icon="◷" label="Focus Time" value="2h 40m" sub="/ 4h goal" />
        <Stat icon="☷" label="Tasks Done" value="6 / 10" sub="60%" />
        <Stat icon="♨" label="Current Streak" value="7 days" sub="Best: 21 days" />
        <article className="daily-stat hud-card daily-score"><div className="daily-ring">82</div><div><small>Daily Score</small><strong>82</strong><em>Great work!</em></div></article>
      </section>

      <section className="daily-grid">
        <article className="daily-panel hud-card">
          <CardLink href="/fitness/daily/habits"><h2>Habits</h2><div className="next-habit"><span>♞</span><div><small>Next Habit</small><strong>Workout</strong><em>6:00 PM · 2h 34m left</em></div></div>{habits.map(([name, streak, done]) => <p className="daily-row" key={name}><span>{name}</span><em>{streak}</em><b>{done ? '✓' : '○'}</b></p>)}</CardLink>
        </article>

        <article className="daily-panel hud-card wide">
          <CardLink href="/fitness/daily/timeline"><h2>Today’s Timeline</h2><div className="daily-timeline-mini">{timeline.map(([time, icon, name, status]) => <p key={`${time}-${name}`}><small>{time}</small><i>{icon}</i><span>{name}</span><em className={status === 'Done' ? 'done' : status === 'In Progress' ? 'active' : ''}>{status}</em></p>)}</div></CardLink>
        </article>

        <article className="daily-panel hud-card checklist-card">
          <CardLink href="/fitness/daily/checklist"><h2>Daily Checklist</h2><div className="daily-check-body"><div className="daily-ring large">60%<small>6 / 10</small></div><div>{checklist.map((item, i) => <p key={item}><b>{i < 4 ? '✓' : '○'}</b>{item}</p>)}</div></div></CardLink>
        </article>

        <article className="daily-panel hud-card"><h2>Top Priorities</h2>{['Finish project proposal','Study for exam','Workout & mobility'].map((p, i) => <p className="priority-row" key={p}><b>{i+1}</b><span>{p}</span><em>{i < 2 ? 'High' : 'Medium'}</em><strong>{i !== 1 ? '✓' : '○'}</strong></p>)}<footer>Manage priorities <span>→</span></footer></article>
        <article className="daily-panel hud-card"><h2>Focus Sessions</h2><div className="daily-progress"><span style={{width:'67%'}} /></div>{['9:00 AM – 10:30 AM Deep Work: Project','1:00 PM – 2:30 PM Study Session','4:00 PM – 5:00 PM Work Block'].map(x => <p className="daily-row" key={x}><span>{x}</span><b>○</b></p>)}<footer>View focus history <span>→</span></footer></article>
        <article className="daily-panel hud-card small"><h2>Nutrition</h2><p className="daily-row"><span>Water</span><em>1.6 / 2 L</em><b>＋</b></p><p className="daily-row"><span>Meals</span><em>2 / 3</em><b>＋</b></p><footer>View nutrition log <span>→</span></footer></article>
        <article className="daily-panel hud-card small"><CardLink href="/fitness/daily/wins"><h2>Daily Wins</h2>{['Completed morning routine','Hit my focus goals','Read 20 pages','Stayed consistent'].map((w,i) => <p className="daily-row" key={w}><span>{w}</span><b>{i<3?'✓':'○'}</b></p>)}</CardLink></article>
        <article className="daily-panel hud-card small"><h2>Activity</h2><strong className="big-number">7,842</strong><small>Steps</small><div className="bar-spark">{Array.from({length:22}).map((_,i)=><i key={i} style={{height:`${15+((i*17)%55)}%`}} />)}</div><footer>View activity <span>→</span></footer></article>
        <article className="daily-panel hud-card full"><h2>AI Daily Insight</h2><div className="coach-grid"><section><h3>What’s going well</h3><p>Great consistency with habits.</p><p>Solid focus time — keep it up.</p><p>You’re prioritizing what matters.</p></section><section><h3>Focus on next</h3><p>Finish your top priority today.</p><p>Stay hydrated and take breaks.</p><p>Limit distractions this evening.</p></section><section><div className="daily-ring">78%</div><strong>Consistency Score</strong><p>You’re building strong momentum.</p></section></div></article>
      </section>
    </main>
  );
}
