import Link from 'next/link';
import '@/styles/pages/Dashboard.css';
import '@/styles/pages/WorkAgents.css';

const BUSINESS_AGENTS = [
  {
    name: 'Strategy Agent',
    role: 'Turns rough ideas into clear project moves.',
    status: 'Planning standby',
    signal: 'Next: define active business outcomes',
  },
  {
    name: 'Operations Agent',
    role: 'Tracks routines, blockers, follow-ups, and execution status.',
    status: 'Queue placeholder',
    signal: 'Next: connect tasks and check-ins',
  },
  {
    name: 'Outreach Agent',
    role: 'Prepares messages, leads, replies, and relationship follow-up.',
    status: 'Drafting bay',
    signal: 'Next: add contact pipeline',
  },
  {
    name: 'Research Agent',
    role: 'Gathers references, market notes, and decision context.',
    status: 'Intel standby',
    signal: 'Next: connect archive and web research',
  },
];

const STATUS_REPORTS = [
  'No live business agents connected yet.',
  'Subagent activity will appear here once the routine is wired.',
  'This page is the command surface for future work automation.',
];

const NAV_ITEMS = [
  { label: 'Business', href: '/work-agents', icon: '▦', active: true },
  { label: 'Agent', href: '/dashboard', icon: '◉' },
  { label: 'Life', href: '/projects', icon: '⌬' },
];

export default function WorkAgentsPage() {
  return (
    <main className="work-agents-page fade-in">
      <section className="work-agents-grid" aria-label="Work agents command page">
        <aside className="work-agents-hero work-panel">
          <span className="work-kicker">Business</span>
          <h1>Work Agents</h1>
          <p>
            A dedicated command surface for business-focused agents: strategy, operations,
            outreach, and research. The systems are staged here first, then connected later.
          </p>

          <div className="work-hero-actions">
            <Link href="/dashboard">Return to Agent</Link>
            <Link href="/projects">Open Projects</Link>
          </div>
        </aside>

        <section className="work-agent-roster" aria-label="Business agent roster">
          {BUSINESS_AGENTS.map((agent) => (
            <article className="work-agent-card" key={agent.name}>
              <div className="work-agent-orb" aria-hidden="true" />
              <div>
                <span>{agent.status}</span>
                <h2>{agent.name}</h2>
                <p>{agent.role}</p>
                <strong>{agent.signal}</strong>
              </div>
            </article>
          ))}
        </section>

        <aside className="work-status-panel work-panel">
          <span className="work-kicker">Status reports</span>
          <h2>Agent routine</h2>
          <div className="work-status-stack">
            {STATUS_REPORTS.map((report) => (
              <article key={report}>
                <span aria-hidden="true" />
                <p>{report}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <nav className="agent-bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            href={item.href}
            key={item.label}
            className={`agent-bottom-nav-item ${item.active ? 'active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
          >
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
          </Link>
        ))}
      </nav>
    </main>
  );
}
