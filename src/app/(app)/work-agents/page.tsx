'use client';

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import '@/styles/pages/WorkAgents.css';

type AgentStatus = 'Online' | 'Working' | 'Review';
type Agent = {
  name: string;
  icon: string;
  role: string;
  task: string;
  status: AgentStatus;
  load: number;
};

type Project = {
  name: string;
  label: string;
  progress: number;
  detail: string;
};

type Approval = {
  title: string;
  kind: 'Review' | 'Approval';
  owner: string;
  detail: string;
  nextStep: string;
  risk: string;
};

type DispatchStep = 'Intake' | 'Assign' | 'Verify' | 'Push';

type DispatchStepItem = {
  step: DispatchStep;
  detail: string;
};

const MAX_AGENT_SLOTS = 9;
const agents: Agent[] = [];

const projects: Project[] = [
  { name: 'Discipline OS', label: 'Active', progress: 86, detail: 'Primary operating dashboard and command centre.' },
  { name: 'Jarvis Assistant', label: 'Build', progress: 62, detail: 'Voice-first assistant surface and command memory.' },
  { name: 'Content Engine', label: 'Queue', progress: 48, detail: 'Repeatable capture, edit, and publishing routine.' },
  { name: 'Agent Workflow', label: 'Review', progress: 71, detail: 'Multi-agent work intake, approvals, and handoffs.' },
];

const approvals: Approval[] = [
  {
    title: 'Copy review',
    kind: 'Review',
    owner: 'Content Agent',
    detail: 'Confirm the hook, CTA, and publish order before any content is queued.',
    nextStep: 'Open draft packet and approve or rewrite the lead angle.',
    risk: 'Medium',
  },
  {
    title: 'Agent handoff approval',
    kind: 'Approval',
    owner: 'Workflow Agent',
    detail: 'A cross-agent routine needs Daniel’s sign-off before it can become the default handoff path.',
    nextStep: 'Check owner, deadline, and rollback route.',
    risk: 'High',
  },
  {
    title: 'API connection review',
    kind: 'Review',
    owner: 'Automation Agent',
    detail: 'Credential routing and hosted bridge settings must be verified before live assistant actions run.',
    nextStep: 'Verify server-side env only; no client-side secret exposure.',
    risk: 'High',
  },
  {
    title: 'Dashboard update approval',
    kind: 'Approval',
    owner: 'Design Agent',
    detail: 'Layout changes are staged visually and need a final operator pass before push.',
    nextStep: 'Confirm spacing, empty states, and mobile fit.',
    risk: 'Medium',
  },
];

const actionSeed = [
  'Marketing Agent is preparing campaign angles',
  'Video Creator is cutting the launch reel',
  'Analyst Agent is checking project signal quality',
];

const thoughtSeed = [
  'Hermes detected a bottleneck in approval flow.',
  'Research Agent recommends collecting three more reference examples.',
  'Planning Agent moved dashboard polish ahead of content batching.',
];

const dispatchSteps: DispatchStepItem[] = [
  { step: 'Intake', detail: 'Capture Daniel’s spoken or typed request from this page.' },
  { step: 'Assign', detail: 'Route the task to the correct project agent and owner.' },
  { step: 'Verify', detail: 'Run the local check before treating the work as done.' },
  { step: 'Push', detail: 'Ship the verified change through the Git routine.' },
];

export default function WorkAgentsPage() {
  const [filter, setFilter] = useState<'All' | AgentStatus>('All');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0] ?? null);
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [messages, setMessages] = useState(['Hermes: Work agents online. Select an agent or send a team instruction.']);
  const [chatDraft, setChatDraft] = useState('');
  const [actions, setActions] = useState(actionSeed);
  const [thoughts, setThoughts] = useState(thoughtSeed);
  const [handledApprovals, setHandledApprovals] = useState<string[]>([]);
  const [treeFocus, setTreeFocus] = useState('Hermes');
  const [dispatchStep, setDispatchStep] = useState<DispatchStep>('Intake');

  const filteredAgents = useMemo(
    () => (filter === 'All' ? agents : agents.filter((agent) => agent.status === filter)).slice(0, MAX_AGENT_SLOTS),
    [filter],
  );

  const emptyAgentSlots = Math.max(MAX_AGENT_SLOTS - filteredAgents.length, 0);

  const statusCounts = useMemo(() => ({
    Online: agents.filter((agent) => agent.status === 'Online').length,
    Working: agents.filter((agent) => agent.status === 'Working').length,
    Review: agents.filter((agent) => agent.status === 'Review').length,
  }), []);

  function pushSystemUpdate(update: string) {
    setActions((current) => [update, ...current].slice(0, 4));
    setThoughts((current) => [`Hermes routed update: ${update}`, ...current].slice(0, 4));
  }

  function selectAgent(agent: Agent) {
    setSelectedAgent(agent);
    setMessages((current) => [...current, `Hermes: ${agent.name} selected — ${agent.task}.`].slice(-5));
    pushSystemUpdate(`${agent.name} brought into operator focus`);
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;
    const agentName = selectedAgent?.name ?? 'Agent roster';
    setMessages((current) => [...current, `You: ${message}`, `${agentName}: Instruction received. I will stage the next action for review.`].slice(-6));
    pushSystemUpdate(`${agentName} received team instruction`);
    setChatDraft('');
  }

  function handleApproval(item: Approval) {
    setHandledApprovals((current) => Array.from(new Set([...current, item.title])));
    setMessages((current) => [...current, `Hermes: ${item.title} marked handled by ${item.owner}.`].slice(-6));
    pushSystemUpdate(`${item.title} completed`);
  }

  function launchProtocol(label: string) {
    setMessages((current) => [...current, `Hermes: ${label} protocol staged for ${selectedAgent?.name ?? 'the roster queue'}.`].slice(-6));
    pushSystemUpdate(`${label} protocol staged`);
  }

  function advanceDispatch(step: DispatchStep) {
    setDispatchStep(step);
    setTreeFocus('Hermes');
    setMessages((current) => [
      ...current,
      `Hermes: Dispatch moved to ${step}. ${selectedAgent?.name ?? 'No agent selected'} remains attached to ${selectedProject.name}.`,
    ].slice(-6));
    pushSystemUpdate(`Operator dispatch moved to ${step}`);
  }

  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="work-command-grid" aria-label="Work agents command centre">
        <article className="work-panel dispatch-panel">
          <div>
            <span className="hud-kicker">Operator Dispatch</span>
            <h1>Task execution queue</h1>
            <p>
              Voice or typed commands from this page now resolve into a visible routine: capture the request,
              assign the right agent, verify the work, then push when the local check is clean.
            </p>
          </div>
          <div className="dispatch-track" aria-label="Dispatch routine status">
            {dispatchSteps.map((item) => (
              <button
                type="button"
                key={item.step}
                className={dispatchStep === item.step ? 'active' : ''}
                onClick={() => advanceDispatch(item.step)}
              >
                <strong>{item.step}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
          <div className="dispatch-summary" aria-label="Current dispatch packet">
            <span><b>Project</b>{selectedProject.name}</span>
            <span><b>Agent</b>{selectedAgent?.name ?? 'No agent selected'}</span>
            <span><b>Stage</b>{dispatchStep}</span>
          </div>
        </article>

        <article className="work-panel command-overview-panel">
          <div className="work-panel-heading">
            <span className="hud-kicker">Agent Tree / Projects / Review</span>
            <strong>{selectedProject.name}</strong>
          </div>
          <div className="overview-columns">
            <section className="overview-section tree-section" aria-label="Agent tree and project status">
              <div className="section-heading">
                <span>Agent tree</span>
                <strong>{treeFocus}</strong>
              </div>
              <div className="agent-tree" aria-label="Agent hierarchy">
                {['Hermes', 'Business Manager', 'Life Coach', 'Marketing Agent', 'Video Creator', 'Analyst'].map((node) => (
                  <button
                    type="button"
                    key={node}
                    className={`tree-node tree-${node.toLowerCase().replaceAll(' ', '-')} ${treeFocus === node ? 'active' : ''}`}
                    onClick={() => {
                      setTreeFocus(node);
                      pushSystemUpdate(`${node} tree node inspected`);
                    }}
                  >
                    <span>{node === 'Hermes' ? '◎' : node.includes('Agent') || node === 'Video Creator' ? '◌' : '▱'}</span>
                    <strong>{node}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="overview-section project-section" aria-label="Projects and status">
              <div className="section-heading">
                <span>Projects / Status</span>
                <strong>{selectedProject.label}</strong>
              </div>
              <div className="project-stack">
                {projects.map((project) => (
                  <button
                    type="button"
                    key={project.name}
                    className={`project-row ${selectedProject.name === project.name ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProject(project);
                      pushSystemUpdate(`${project.name} project opened`);
                    }}
                  >
                    <span>
                      <strong>{project.name}</strong>
                      <small>{project.detail}</small>
                    </span>
                    <em>{project.label}</em>
                    <i style={{ '--progress': `${project.progress}%` } as CSSProperties} />
                  </button>
                ))}
              </div>
            </section>

            <section className="overview-section review-section" aria-label="Needs review">
              <div className="section-heading">
                <span>Needs review</span>
                <strong>{approvals.length}</strong>
              </div>
              <div className="approval-stack">
                {approvals.map((item) => {
                  const handled = handledApprovals.includes(item.title);
                  return (
                    <div className={`approval-row ${handled ? 'handled' : ''}`} key={item.title}>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.owner} · Risk {item.risk}</small>
                        <em>{item.detail}</em>
                        <i>{item.nextStep}</i>
                      </span>
                      <button type="button" onClick={() => handleApproval(item)}>
                        {handled ? 'Handled' : item.kind}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </article>

        <section className="agent-roster-panel" aria-label="Agent roster">
          <div className="roster-toolbar work-panel">
            <span className="hud-kicker">Agent Roster</span>
            <div className="status-filters" aria-label="Agent status filters">
              {(['All', 'Online', 'Working', 'Review'] as const).map((status) => (
                <button
                  type="button"
                  key={status}
                  className={filter === status ? 'active' : ''}
                  onClick={() => setFilter(status)}
                >
                  {status}<small>{status === 'All' ? `${agents.length}/${MAX_AGENT_SLOTS}` : statusCounts[status]}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="agent-card-grid">
            {filteredAgents.map((agent) => (
              <button
                type="button"
                key={agent.name}
                className={`agent-card status-${agent.status.toLowerCase()} ${selectedAgent?.name === agent.name ? 'active' : ''}`}
                onClick={() => selectAgent(agent)}
              >
                <span className="agent-card-status"><i />{agent.status}</span>
                <span className="agent-card-icon" aria-hidden="true">{agent.icon}</span>
                <strong>{agent.name}</strong>
                <small>{agent.role}</small>
                <em>Working on: {agent.task}</em>
                <span className="load-line"><b style={{ width: `${agent.load}%` }} /></span>
              </button>
            ))}
            {Array.from({ length: emptyAgentSlots }).map((_, index) => (
              <div className="agent-card empty-agent-slot" key={`empty-agent-slot-${index}`} aria-hidden="true" />
            ))}
          </div>
        </section>

        <article className="work-panel collaboration-panel">
          <div className="work-panel-heading">
            <span className="hud-kicker">Live Agent Collaboration</span>
            <strong>{selectedAgent?.name ?? 'No agent selected'}</strong>
          </div>
          <div className="collab-columns">
            <div className="team-chat">
              <h2>Team Chat</h2>
              <div className="chat-log" aria-live="polite">
                {messages.map((message, index) => <p key={`${message}-${index}`}>{message}</p>)}
              </div>
              <form onSubmit={handleChatSubmit} className="chat-form">
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Send a team instruction…"
                  aria-label="Team instruction"
                />
                <button type="submit">Send</button>
              </form>
            </div>
            <div>
              <h2>Current Actions</h2>
              <div className="activity-list">
                {actions.map((action) => <span key={action}>{action}<b>Working</b></span>)}
              </div>
              <div className="quick-actions">
                <button type="button" onClick={() => launchProtocol('Review sprint')}>Review sprint</button>
                <button type="button" onClick={() => launchProtocol('Assign task')}>Assign task</button>
                <button type="button" onClick={() => launchProtocol('Export briefing')}>Export briefing</button>
              </div>
            </div>
            <div>
              <h2>Thought Stream</h2>
              <div className="thought-stream">
                {thoughts.map((thought) => <p key={thought}>{thought}</p>)}
              </div>
            </div>
          </div>
        </article>

        <article className="work-panel workspace-panel">
          <div className="work-panel-heading">
            <span className="hud-kicker">3D Workspace Future</span>
            <strong>Blank canvas</strong>
          </div>
          <div className="workspace-blank" aria-label="Blank 3D workspace placeholder" />
        </article>
      </section>
    </main>
  );
}
