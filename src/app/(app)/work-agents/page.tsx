import '@/styles/pages/WorkAgents.css';

const BUSINESS_AGENTS = [
  { name: 'Marketing Agent', role: 'Campaigns, content strategy and audience growth.', tasks: 12, score: 94, icon: '📣' },
  { name: 'Design Agent', role: 'Visual design, branding and creative assets.', tasks: 8, score: 91, icon: '🖌' },
  { name: 'Research Agent', role: 'Market research, insights and competitive analysis.', tasks: 15, score: 93, icon: '⌕' },
  { name: 'Operations Agent', role: 'Process automation, workflows and operational excellence.', tasks: 10, score: 92, icon: '⚙' },
  { name: 'Sales Agent', role: 'Lead generation, outreach and deal management.', tasks: 18, score: 95, icon: '💼' },
  { name: 'Content Agent', role: 'Content creation, editing and publishing.', tasks: 14, score: 93, icon: '▤' },
  { name: 'Analytics Agent', role: 'Data analysis, reports and performance insights.', tasks: 11, score: 94, icon: '▥' },
  { name: 'Support Agent', role: 'Customer support, ticketing and issue resolution.', tasks: 9, score: 96, icon: '🎧' },
];

export default function WorkAgentsPage() {
  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="work-agent-reference-grid" aria-label="Business agent roster">
        {BUSINESS_AGENTS.map((agent) => (
          <article className="work-agent-card" key={agent.name}>
            <div className="work-agent-status"><span /> Online</div>
            <div className="work-agent-icon" aria-hidden="true">{agent.icon}</div>
            <h2>{agent.name}</h2>
            <p>{agent.role}</p>
            <div className="work-agent-divider" />
            <footer>
              <span className="work-agent-bars" aria-hidden="true">▥</span>
              <span>{agent.tasks} tasks</span>
              <i />
              <span>{agent.score}%</span>
              <span className="work-agent-ring" aria-hidden="true" />
              <button type="button" aria-label={`${agent.name} options`}>⋮</button>
            </footer>
          </article>
        ))}
      </section>
    </main>
  );
}
