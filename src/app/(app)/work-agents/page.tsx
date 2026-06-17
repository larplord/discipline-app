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
};

const agents: Agent[] = [
  { name: 'Marketing Agent', icon: '◌', role: 'Campaigns, hooks, and launch angles', task: 'Drafting audience hooks', status: 'Working', load: 72 },
  { name: 'Content Agent', icon: '✦', role: 'Scripts, posts, and publishing cadence', task: 'Building short-form queue', status: 'Online', load: 56 },
  { name: 'Design Agent', icon: '◇', role: 'Layouts, thumbnails, and visual systems', task: 'Refining dashboard assets', status: 'Review', load: 63 },
  { name: 'Video Creator', icon: '▣', role: 'Edits, reels, captions, and exports', task: 'Clipping content engine test', status: 'Working', load: 81 },
  { name: 'Analyst Agent', icon: '⌁', role: 'Metrics, signal checks, and insight reports', task: 'Scanning conversion gaps', status: 'Online', load: 44 },
  { name: 'Research Agent', icon: '⌕', role: 'Market, competitor, and source research', task: 'Collecting competitor references', status: 'Working', load: 68 },
  { name: 'Sales Agent', icon: '↗', role: 'Offers, CRM prompts, and follow-up plays', task: 'Sequencing warm leads', status: 'Online', load: 39 },
  { name: 'Support Agent', icon: '□', role: 'Inbox triage and response drafts', task: 'Watching response queue', status: 'Online', load: 31 },
  { name: 'Automation Agent', icon: '⚙', role: 'Systems, triggers, and routine automation', task: 'Mapping API handoff', status: 'Review', load: 77 },
  { name: 'Workflow Agent', icon: '⟲', role: 'SOPs, checklists, and operator routines', task: 'Organising agent protocol', status: 'Working', load: 59 },
  { name: 'Planning Agent', icon: '☷', role: 'Milestones, plans, and dependency tracking', task: 'Updating sprint priorities', status: 'Online', load: 47 },
  { name: 'Life Coach Agent', icon: '♡', role: 'Recovery, discipline, and daily alignment', task: 'Holding evening check-in', status: 'Online', load: 35 },
];

const projects: Project[] = [
  { name: 'Discipline OS', label: 'Active', progress: 86, detail: 'Primary operating dashboard and command centre.' },
  { name: 'Jarvis Assistant', label: 'Build', progress: 62, detail: 'Voice-first assistant surface and command memory.' },
  { name: 'Content Engine', label: 'Queue', progress: 48, detail: 'Repeatable capture, edit, and publishing routine.' },
  { name: 'Agent Workflow', label: 'Review', progress: 71, detail: 'Multi-agent work intake, approvals, and handoffs.' },
];

const approvals: Approval[] = [
  { title: 'Copy review', kind: 'Review', owner: 'Content Agent' },
  { title: 'Agent handoff approval', kind: 'Approval', owner: 'Workflow Agent' },
  { title: 'API connection review', kind: 'Review', owner: 'Automation Agent' },
  { title: 'Dashboard update approval', kind: 'Approval', owner: 'Design Agent' },
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

export default function WorkAgentsPage() {
  const [filter, setFilter] = useState<'All' | AgentStatus>('All');
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [messages, setMessages] = useState(['Hermes: Work agents online. Select an agent or send a team instruction.']);
  const [chatDraft, setChatDraft] = useState('');
  const [actions, setActions] = useState(actionSeed);
  const [thoughts, setThoughts] = useState(thoughtSeed);
  const [handledApprovals, setHandledApprovals] = useState<string[]>([]);
  const [treeFocus, setTreeFocus] = useState('Hermes');
  const [workspaceMode, setWorkspaceMode] = useState<'Map' | 'Preview'>('Map');

  const filteredAgents = useMemo(
    () => (filter === 'All' ? agents : agents.filter((agent) => agent.status === filter)),
    [filter],
  );

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
    setMessages((current) => [...current, `You: ${message}`, `${selectedAgent.name}: Instruction received. I will stage the next action for review.`].slice(-6));
    pushSystemUpdate(`${selectedAgent.name} received team instruction`);
    setChatDraft('');
  }

  function handleApproval(item: Approval) {
    setHandledApprovals((current) => Array.from(new Set([...current, item.title])));
    setMessages((current) => [...current, `Hermes: ${item.title} marked handled by ${item.owner}.`].slice(-6));
    pushSystemUpdate(`${item.title} completed`);
  }

  function launchProtocol(label: string) {
    setMessages((current) => [...current, `Hermes: ${label} protocol staged for ${selectedAgent.name}.`].slice(-6));
    pushSystemUpdate(`${label} protocol staged`);
  }

  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="work-command-grid" aria-label="Work agents command centre">
        <article className="work-panel agent-tree-panel">
          <div className="work-panel-heading">
            <span className="hud-kicker">Agent Tree</span>
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
                <small>{node === 'Hermes' ? 'Command & Orchestration' : node === 'Life Coach' ? 'Daily alignment' : 'Business routine'}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="work-panel projects-panel">
          <div className="work-panel-heading">
            <span className="hud-kicker">Projects / Status</span>
            <strong>{selectedProject.name}</strong>
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
          <div className="approval-stack" aria-label="Needs review">
            <h2>Needs review</h2>
            {approvals.map((item) => {
              const handled = handledApprovals.includes(item.title);
              return (
                <div className={`approval-row ${handled ? 'handled' : ''}`} key={item.title}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.owner}</small>
                  </span>
                  <button type="button" onClick={() => handleApproval(item)}>
                    {handled ? 'Handled' : item.kind}
                  </button>
                </div>
              );
            })}
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
                  {status}<small>{status === 'All' ? agents.length : statusCounts[status]}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="agent-card-grid">
            {filteredAgents.map((agent) => (
              <button
                type="button"
                key={agent.name}
                className={`agent-card status-${agent.status.toLowerCase()} ${selectedAgent.name === agent.name ? 'active' : ''}`}
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
          </div>
        </section>

        <article className="work-panel collaboration-panel">
          <div className="work-panel-heading">
            <span className="hud-kicker">Live Agent Collaboration</span>
            <strong>{selectedAgent.name}</strong>
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
          <span className="hud-kicker">3D Workspace Future</span>
          <h2>{workspaceMode === 'Preview' ? 'Preview mode armed' : 'Spatial command map'}</h2>
          <p>A future workspace for dragging agents, projects, approvals, and routines into one operator map.</p>
          <div className={`workspace-orbit ${workspaceMode.toLowerCase()}`} aria-hidden="true">
            <span>Hermes</span><i /><i /><i />
          </div>
          <button type="button" onClick={() => {
            setWorkspaceMode((current) => current === 'Map' ? 'Preview' : 'Map');
            pushSystemUpdate('3D workspace preview toggled');
          }}>
            {workspaceMode === 'Preview' ? 'Return to Map' : 'Preview 3D Workspace'}
          </button>
        </article>
      </section>
    </main>
  );
}
