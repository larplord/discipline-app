import Link from 'next/link';
import '@/styles/pages/DashboardMockups.css';

const sample = {
  score: 72,
  rank: 'Daily Coach',
  mission: 'Finish one focused work block on the AI video/product system before touching extra features.',
  nextAction: 'Start a 50-minute focus session and produce one real asset: product shortlist, script, or landing page draft.',
  warning: 'You are most likely to lose time by redesigning instead of executing. Build only what helps the next work block.',
  focus: 2,
  habits: 68,
  journal: 'Not done yet',
  project: 'AI Creator Product Testing System',
  moneyGoal: '$1,000/month summer target',
};

export const mockups = [
  {
    href: '/mockups/dashboard-simple',
    title: 'Simple Execution',
    desc: 'Least clutter. Best if you want the dashboard to force action fast.',
  },
  {
    href: '/mockups/dashboard-ai',
    title: 'AI Coach',
    desc: 'Noen is the center. Best for Level 3 when the assistant reads your real app data.',
  },
  {
    href: '/mockups/dashboard-jarvis',
    title: 'JARVIS Command',
    desc: 'Most motivating/futuristic. Best as the long-term north star, not the first full build.',
  },
  {
    href: '/mockups/dashboard-ai-hub',
    title: 'AI Hub HUD',
    desc: 'Based on your sketch: center AI model, side shortcuts, future agents, cyan sci-fi colors.',
  },
];

export function MockupShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="fade-in mockup-page">
      <div className="page-header mockup-header">
        <div>
          <div className="section-label">Dashboard mockup / not live data</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <Link className="btn btn-ghost" href="/mockups">All Mockups</Link>
      </div>
      <div className="page-body">{children}</div>
    </div>
  );
}

export function MockupIndex() {
  return (
    <div className="fade-in mockup-page">
      <div className="page-header mockup-header">
        <div>
          <div className="section-label">Hidden design lab</div>
          <h1 className="page-title">Dashboard Mockups</h1>
          <p className="page-subtitle">Compare layouts before touching the real dashboard.</p>
        </div>
      </div>
      <div className="page-body mockup-index-grid">
        {mockups.map((m) => (
          <Link key={m.href} href={m.href} className="card mockup-choice-card">
            <span className="mockup-choice-kicker">Open mockup</span>
            <h2>{m.title}</h2>
            <p>{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SimpleExecutionMockup() {
  return (
    <MockupShell title="Simple Execution Dashboard" subtitle="For days when the answer needs to be obvious: do the next thing.">
      <section className="mock-simple-grid">
        <div className="card mock-mission-card">
          <span className="mock-pill">Today&apos;s Mission</span>
          <h2>{sample.mission}</h2>
          <p>{sample.warning}</p>
          <div className="mock-action-box">
            <span>Next action</span>
            <strong>{sample.nextAction}</strong>
          </div>
          <div className="mock-button-row">
            <button className="btn btn-primary" type="button">Start Focus Session</button>
            <button className="btn btn-ghost" type="button">Open Project</button>
          </div>
        </div>
        <div className="card mock-score-card">
          <span className="mock-score-num">{sample.score}</span>
          <span className="mock-score-label">Daily Score</span>
          <div className="progress-wrap"><div className="progress-bar green" style={{ width: `${sample.score}%` }} /></div>
          <p>{sample.rank} unlocked this weekend if you keep stacking proof.</p>
        </div>
      </section>

      <section className="mock-three-grid mt-4">
        <MiniPanel title="Work" value={`${sample.focus} focus sessions`} detail={sample.project} tone="blue" />
        <MiniPanel title="Habits" value={`${sample.habits}% complete`} detail="Do the boring basics before adding complexity." tone="green" />
        <MiniPanel title="Review" value={sample.journal} detail="Debrief tonight so Noen has real data later." tone="gold" />
      </section>
    </MockupShell>
  );
}

export function AiCoachMockup() {
  return (
    <MockupShell title="AI Coach Dashboard" subtitle="Noen at the center: read, diagnose, then push you into action.">
      <section className="mock-ai-layout">
        <div className="card mock-ai-chat">
          <div className="mock-ai-avatar">🧭</div>
          <div>
            <span className="mock-pill">Noen&apos;s Read</span>
            <h2>You are close to momentum. Do not open five projects today.</h2>
            <p>Your highest leverage move is one focused output for the AI video/product system. Keep the website improvements small until the weekend unlock.</p>
          </div>
          <div className="mock-chat-prompts">
            <button type="button">What should I do first?</button>
            <button type="button">What am I avoiding?</button>
            <button type="button">Plan my next 2 hours</button>
          </div>
        </div>
        <div className="mock-ai-side">
          <MiniPanel title="Current Mission" value="Make money online" detail={sample.moneyGoal} tone="green" />
          <MiniPanel title="Active Project" value="AI product tests" detail="Build proof, not just plans." tone="blue" />
          <MiniPanel title="Risk" value="Overbuilding" detail="Only build dashboard changes that increase execution." tone="red" />
        </div>
      </section>

      <section className="card mock-ai-daily mt-4">
        <span className="mock-pill">Daily operating loop</span>
        <div className="mock-loop-grid">
          <LoopStep num="1" title="Check Read" text="Noen looks at habits, focus, journal, projects." />
          <LoopStep num="2" title="Pick Mission" text="One priority wins the day." />
          <LoopStep num="3" title="Prove Work" text="Focus session creates proof: output, log, lesson." />
          <LoopStep num="4" title="Debrief" text="Journal gives memory for tomorrow." />
        </div>
      </section>
    </MockupShell>
  );
}

export function AiHubHudMockup() {
  return (
    <MockupShell title="AI Hub HUD Dashboard" subtitle="Your sketch turned into a calmer futuristic command layout: AI in the center, life systems around it.">
      <section className="hud-board">
        <div className="hud-grid-lines" aria-hidden />
        <div className="hud-top-link">
          <span>Obsidian brain link</span>
          <strong>3D knowledge map / future memory view</strong>
        </div>

        <aside className="hud-side hud-left">
          <HudModule title="Health" label="Quick link" detail="Sleep score, training readiness, nutrition, recovery signals." />
          <HudModule title="Projects" label="Growing project layer" detail="Current project, agent overview, what changed, next step." tall />
          <HudFocus />
        </aside>

        <main className="hud-core">
          <div className="hud-ai-panel">
            <div className="hud-orbit hud-orbit-one" aria-hidden />
            <div className="hud-orbit hud-orbit-two" aria-hidden />
            <div className="hud-scan" aria-hidden />
            <div className="hud-ai-content">
              <span>Noen core</span>
              <h2>AI Model</h2>
              <p>Reads your habits, focus, journal, projects, and identity rank to decide the next useful action.</p>
            </div>
          </div>

          <div className="hud-agents-panel">
            <span className="hud-panel-label">Future agent stack</span>
            <div className="hud-agent-grid">
              <HudAgent color="green" name="Health" />
              <HudAgent color="blue" name="Money" />
              <HudAgent color="purple" name="Memory" />
              <HudAgent color="red" name="Risk" />
              <HudAgent color="yellow" name="Habits" />
              <HudAgent color="orange" name="Projects" />
            </div>
          </div>
        </main>

        <aside className="hud-side hud-right">
          <HudModule title="Habits / Goals / Routines" label="Daily system" detail="Time-aware habits, slipping areas, goals, and next milestone." tall />
          <HudModule title="Journal" label="Fast reflection" detail="Capture the lesson before the day disappears." />
          <HudModule title="Identity" label="Level + score" detail="Daily Coach → Memory Core → JARVIS Command Center." />
        </aside>
      </section>
    </MockupShell>
  );
}

export function JarvisMockup() {
  return (
    <MockupShell title="JARVIS Command Dashboard" subtitle="The long-term north star: systems, agents, memory, and controlled autonomy.">
      <section className="mock-jarvis-hero card">
        <div>
          <span className="mock-pill">System status</span>
          <h2>Daniel Command Center</h2>
          <p>Private AI operating system for work, health, money, projects, and self-review.</p>
        </div>
        <div className="mock-jarvis-rank">
          <strong>Level 7</strong>
          <span>JARVIS Command Center</span>
        </div>
      </section>

      <section className="mock-jarvis-grid mt-4">
        <CommandTile title="Noen Core" status="Locked until Level 3" detail="Daily coach reads your real data." />
        <CommandTile title="Memory Core" status="Future" detail="Long-term summaries, patterns, decisions." />
        <CommandTile title="Money Agent" status="Future" detail="Tracks experiments and pushes revenue actions." />
        <CommandTile title="Health Agent" status="Future" detail="Habits, sleep, training, recovery signals." />
        <CommandTile title="Project Operator" status="Future" detail="Keeps projects moving with next actions and reviews." />
        <CommandTile title="Automation Layer" status="Final" detail="Only with explicit permissions and trust earned." />
      </section>
    </MockupShell>
  );
}

function HudModule({ title, label, detail, tall = false }: { title: string; label: string; detail: string; tall?: boolean }) {
  return (
    <div className={`hud-module ${tall ? 'hud-module-tall' : ''}`}>
      <div className="hud-module-inner">
        <span>{label}</span>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function HudFocus() {
  const blocks = ['Deep work 60', 'Deep work 30', 'Short break', 'Long break'];
  return (
    <div className="hud-module hud-focus-module">
      <div className="hud-module-inner">
        <span>Quick start</span>
        <h3>Focus</h3>
        <div className="hud-focus-grid">
          {blocks.map((b) => <button key={b} type="button">{b}</button>)}
        </div>
      </div>
    </div>
  );
}

function HudAgent({ color, name }: { color: string; name: string }) {
  return (
    <div className={`hud-agent hud-agent-${color}`}>
      <span>{name}</span>
    </div>
  );
}

function MiniPanel({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: 'blue' | 'green' | 'gold' | 'red' }) {
  return (
    <div className={`card mock-mini-panel tone-${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function LoopStep({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="mock-loop-step">
      <span>{num}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function CommandTile({ title, status, detail }: { title: string; status: string; detail: string }) {
  return (
    <div className="card mock-command-tile">
      <div className="mock-command-head">
        <h3>{title}</h3>
        <span>{status}</span>
      </div>
      <p>{detail}</p>
    </div>
  );
}
