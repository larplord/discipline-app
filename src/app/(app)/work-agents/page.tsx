'use client';

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import '@/styles/pages/WorkAgents.css';

type AgentStatus = 'Online' | 'Working' | 'Review';
type FilterStatus = 'All' | AgentStatus;
type DispatchStep = 'Intake' | 'Assign' | 'Verify' | 'Push';

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
  risk: 'Medium' | 'High';
  detail: string;
};

type Activity = {
  time: string;
  agent: string;
  text: string;
  action: string;
};

type ChatLine = {
  speaker: string;
  text: string;
  time: string;
  self?: boolean;
};

type CurrentAction = {
  agent: string;
  task: string;
  age: string;
};

type Thought = {
  agent: string;
  text: string;
  time: string;
};

type StandbyTask = {
  title: string;
  detail: string;
};

const MAX_AGENT_SLOTS = 9;
const agents: Array<{ name: string; status: AgentStatus }> = [];

const projects: Project[] = [
  { name: 'Discipline OS', label: 'Active', progress: 86, detail: 'AI-powered productivity and execution system.' },
  { name: 'Jarvis Assistant', label: 'Build', progress: 62, detail: 'Voice-first assistant surface and command memory.' },
  { name: 'Content Engine', label: 'Queue', progress: 48, detail: 'Content generation and publishing engine.' },
  { name: 'Agent Workflow', label: 'Review', progress: 71, detail: 'Multi-agent task automation, approvals, and handoffs.' },
];

const approvals: Approval[] = [
  { title: 'API connection review', kind: 'Review', owner: 'Hermes', risk: 'Medium', detail: 'Confirm secure bridge settings before live actions.' },
  { title: 'Dashboard update approval', kind: 'Approval', owner: 'Design Agent', risk: 'High', detail: 'Final operator pass before pushing the command layout.' },
];

const activitySeed: Activity[] = [
  { time: '10:45 AM', agent: 'Marketing Agent', text: 'completed audience segmentation for Q2 campaigns.', action: 'View Report' },
  { time: '10:43 AM', agent: 'Content Agent', text: 'drafted blog post “Focus Mode: 5 Ways to Win Your Day”.', action: 'Review Draft' },
  { time: '10:42 AM', agent: 'Analyst Agent', text: 'updated KPI dashboard with latest performance metrics.', action: 'Open Dashboard' },
  { time: '10:41 AM', agent: 'Automation Agent', text: 'synced Zapier integration — 12 workflows active.', action: 'View Integration' },
  { time: '10:40 AM', agent: 'Support Agent', text: 'resolved ticket #4821 — customer login issue.', action: 'View Ticket' },
];

const chatSeed: ChatLine[] = [
  { speaker: 'Hermes (Noen)', text: 'Morning team. Let’s align on Discipline OS launch plan and clear the open reviews.', time: '10:47 AM', self: true },
  { speaker: 'Marketing Agent', text: 'Starting audience segmentation for Q2. Insights ready in 30 minutes.', time: '10:42 AM' },
  { speaker: 'Analyst Agent', text: 'Updated the KPI dashboard. Traffic is up 18% WoW over last week.', time: '10:36 AM' },
  { speaker: 'Content Agent', text: 'Drafting the blog on Focus Mode. ETA 1 hour.', time: '10:34 AM' },
  { speaker: 'Hermes (Noen)', text: 'Create summary from yesterday’s sprint.', time: '10:31 AM', self: true },
];

const actionSeed: CurrentAction[] = [
  { agent: 'Marketing Agent', task: 'Building audience segments', age: '2m ago' },
  { agent: 'Content Agent', task: 'Drafting blog — Focus Mode', age: '3m ago' },
  { agent: 'Design Agent', task: 'Designing UI kit v2.3', age: '4m ago' },
  { agent: 'Video Creator', task: 'Editing YouTube short', age: '5m ago' },
  { agent: 'Analyst Agent', task: 'Updating KPI dashboard', age: '6m ago' },
  { agent: 'Automation Agent', task: 'Verifying Zapier integration', age: '6m ago' },
  { agent: 'Support Agent', task: 'Responding to ticket #4821', age: '7m ago' },
];

const thoughtSeed: Thought[] = [
  { agent: 'Marketing Agent', text: 'Analyzing audience segments to identify high-intent groups.', time: '10:47 AM' },
  { agent: 'Research Agent', text: 'Scanning competitor positioning opportunities.', time: '10:44 AM' },
  { agent: 'Analyst Agent', text: 'Detected traffic anomaly in referral channels.', time: '10:43 AM' },
  { agent: 'Automation Agent', text: 'Optimizing automation flow to reduce manual steps.', time: '10:41 AM' },
  { agent: 'Hermes (Noen)', text: 'Cross-linking goals, agent priorities, and dependency risks.', time: '10:40 AM' },
];

const standbySeed: StandbyTask[] = [
  { title: 'Define Q2 campaign messaging', detail: 'For audience tree.' },
  { title: 'Research Agent recommendation', detail: 'Five competitor insights.' },
  { title: 'Planning Agent moved dashboard priorities', detail: 'To this week’s sprint.' },
  { title: 'Automation Agent suggests', detail: 'Two workflow optimisations.' },
  { title: 'Support Agent escalated', detail: 'Three tickets for review.' },
];

const treeNodes = [
  { key: 'Hermes (Noen)', label: 'Hermes (Noen)', detail: 'Command & Orchestration', icon: '🤖' },
  { key: 'Business Manager', label: 'Business Manager', detail: 'Strategy & Execution', icon: '💼' },
  { key: 'Life Coach', label: 'Life Coach', detail: 'Growth & Wellbeing', icon: '♡' },
  { key: 'Marketing Agent', label: 'Marketing Agent', detail: 'Campaigns', icon: '📊' },
  { key: 'Video Creator', label: 'Video Creator', detail: 'Content & Media', icon: '▻' },
  { key: 'Analyst', label: 'Analyst', detail: 'Insights & Data', icon: '▥' },
];

const dispatchSteps: DispatchStep[] = ['Intake', 'Assign', 'Verify', 'Push'];

export default function WorkAgentsPage() {
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [treeFocus, setTreeFocus] = useState('Hermes (Noen)');
  const [handledApprovals, setHandledApprovals] = useState<string[]>([]);
  const [activity, setActivity] = useState(activitySeed);
  const [chatLines, setChatLines] = useState(chatSeed);
  const [actions, setActions] = useState(actionSeed);
  const [thoughts, setThoughts] = useState(thoughtSeed);
  const [standbyTasks, setStandbyTasks] = useState(standbySeed);
  const [chatDraft, setChatDraft] = useState('');
  const [dispatchStep, setDispatchStep] = useState<DispatchStep>('Intake');
  const [listening, setListening] = useState(false);
  const [workspacePreview, setWorkspacePreview] = useState(false);

  const statusCounts = useMemo(() => ({
    Online: agents.filter((agent) => agent.status === 'Online').length,
    Working: agents.filter((agent) => agent.status === 'Working').length,
    Review: agents.filter((agent) => agent.status === 'Review').length,
  }), []);

  const filteredAgents = useMemo(
    () => (filter === 'All' ? agents : agents.filter((agent) => agent.status === filter)).slice(0, MAX_AGENT_SLOTS),
    [filter],
  );

  const emptyAgentSlots = Math.max(MAX_AGENT_SLOTS - filteredAgents.length, 0);

  function logSystemUpdate(update: string) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivity((current) => [
      { time: now, agent: 'Hermes', text: update, action: 'Open Dashboard' },
      ...current,
    ].slice(0, 5));
    setThoughts((current) => [
      { agent: 'Hermes (Noen)', text: `Operator command registered: ${update}`, time: now },
      ...current,
    ].slice(0, 5));
  }

  function handleApproval(item: Approval) {
    setHandledApprovals((current) => Array.from(new Set([...current, item.title])));
    logSystemUpdate(`${item.title} marked handled by ${item.owner}.`);
  }

  function handleActivityAction(item: Activity) {
    logSystemUpdate(`${item.action} opened for ${item.agent}.`);
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLines((current) => [
      ...current,
      { speaker: 'You', text: message, time: now, self: true },
      { speaker: 'Hermes (Noen)', text: 'Instruction captured. I’ll route it through the visible execution queue.', time: now },
    ].slice(-6));
    setActions((current) => [{ agent: 'Hermes (Noen)', task: message, age: 'now' }, ...current].slice(0, 7));
    logSystemUpdate('Team instruction staged in live collaboration.');
    setChatDraft('');
  }

  function assignTask() {
    setStandbyTasks((current) => current.slice(1));
    setActions((current) => [{ agent: 'Hermes (Noen)', task: 'Assigned next standby task', age: 'now' }, ...current].slice(0, 7));
    logSystemUpdate('Next standby task assigned.');
  }

  function exportBriefing() {
    logSystemUpdate('Briefing export staged for operator review.');
  }

  function advanceDispatch(step: DispatchStep) {
    setDispatchStep(step);
    logSystemUpdate(`Dispatch routine moved to ${step}.`);
  }

  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="work-command-grid" aria-label="Work agents command centre">
        <article className="work-panel agent-tree-panel">
          <div className="work-panel-heading compact-heading">
            <span className="hud-kicker">Agent Tree</span>
            <button type="button" className="panel-menu" onClick={() => logSystemUpdate('Agent tree menu opened.')}>•••</button>
          </div>
          <div className="agent-tree" aria-label="Agent hierarchy">
            {treeNodes.map((node) => (
              <button
                type="button"
                key={node.key}
                className={`tree-node tree-${node.key.toLowerCase().replaceAll(' ', '-').replace(/[()]/g, '')} ${treeFocus === node.key ? 'active' : ''}`}
                onClick={() => {
                  setTreeFocus(node.key);
                  logSystemUpdate(`${node.label} tree node inspected.`);
                }}
              >
                <span>{node.icon}</span>
                <strong>{node.label}</strong>
                <small>{node.detail}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="work-panel projects-panel">
          <div className="work-panel-heading compact-heading">
            <span className="hud-kicker">Projects / Status</span>
            <button type="button" className="panel-menu" onClick={() => logSystemUpdate('Project status menu opened.')}>•••</button>
          </div>
          <div className="project-stack">
            {projects.map((project) => (
              <button
                type="button"
                key={project.name}
                className={`project-row ${selectedProject.name === project.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProject(project);
                  logSystemUpdate(`${project.name} opened.`);
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
          <div className="approval-stack compact-review" aria-label="Needs review">
            <div className="mini-heading"><span>Needs Review</span><b>{approvals.length}</b></div>
            {approvals.map((item) => {
              const handled = handledApprovals.includes(item.title);
              return (
                <div className={`approval-row ${handled ? 'handled' : ''}`} key={item.title}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.owner} · Risk {item.risk}</small>
                    <em>{item.detail}</em>
                  </span>
                  <button type="button" onClick={() => handleApproval(item)}>{handled ? 'Handled' : item.kind}</button>
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
                  {status}<small>{status === 'All' ? MAX_AGENT_SLOTS : statusCounts[status]}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="agent-card-grid">
            {filteredAgents.map((agent) => <button type="button" className="agent-card" key={agent.name}>{agent.name}</button>)}
            {Array.from({ length: emptyAgentSlots }).map((_, index) => (
              <div className="agent-card empty-agent-slot" key={`empty-agent-slot-${index}`} aria-label="Empty agent slot">
                <span />
              </div>
            ))}
          </div>
        </section>

        <article className="work-panel activity-band-panel" aria-label="Live agent activity">
          <div className="activity-table">
            {activity.map((item) => (
              <div className="activity-row" key={`${item.time}-${item.agent}-${item.text}`}>
                <time>{item.time}</time>
                <span><b>{item.agent}</b> {item.text}</span>
                <button type="button" onClick={() => handleActivityAction(item)}>{item.action} <i>↗</i></button>
              </div>
            ))}
          </div>
          <div className="activity-footer"><i /> Live updates · Auto-refresh</div>
        </article>

        <article className="work-panel collaboration-panel">
          <div className="work-panel-heading compact-heading">
            <span className="hud-kicker">Live Agent Collaboration</span>
            <div className="collab-controls"><span>● Live</span><button type="button" onClick={() => logSystemUpdate('Collaboration panel expanded.')}>↗</button><button type="button" onClick={() => logSystemUpdate('Collaboration panel closed.')}>×</button></div>
          </div>
          <div className="collab-columns">
            <section className="team-chat">
              <div className="mini-heading"><span>Team Chat</span><b>AI Agents</b></div>
              <div className="chat-log" aria-live="polite">
                {chatLines.map((message) => (
                  <p className={message.self ? 'self' : ''} key={`${message.speaker}-${message.time}-${message.text}`}>
                    <strong>{message.speaker}</strong>
                    <small>{message.time}</small>
                    {message.text}
                  </p>
                ))}
              </div>
              <form onSubmit={handleChatSubmit} className="chat-form">
                <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Message the team…" aria-label="Message the team" />
                <button type="submit">➤</button>
              </form>
            </section>

            <section>
              <div className="mini-heading"><span>Current Actions</span><b>{actions.length}</b></div>
              <div className="activity-list current-actions">
                {actions.map((action) => (
                  <span key={`${action.agent}-${action.task}-${action.age}`}><b>{action.agent}</b><em>{action.task}</em><small>{action.age}</small><i>Working</i></span>
                ))}
              </div>
              <div className="quick-actions">
                <button type="button" onClick={exportBriefing}>Export briefing</button>
                <button type="button" onClick={assignTask}>Assign task</button>
              </div>
            </section>
          </div>
        </article>

        <aside className="right-intel-column">
          <article className="work-panel jarvis-voice-panel">
            <div className="work-panel-heading compact-heading">
              <span className="hud-kicker">JARVIS Voice</span>
              <button type="button" className="panel-menu" onClick={() => setListening((current) => !current)}>{listening ? 'Pause' : 'Arm'}</button>
            </div>
            <div className={`voice-core ${listening ? 'speaking' : ''}`}>
              <i />
              <strong>{listening ? 'Listening' : 'Speaking'}</strong>
            </div>
            <div className="voice-wave" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
            <p>
              Voice Agents are now linked into Work Agents. Commands can route through projects, review gates, activity logs, and the visible execution queue.
            </p>
            <small>{listening ? 'Listening for your summary…' : 'Tap Arm to keep voice command-ready.'}</small>
            <button type="button" className="voice-orb-button" onClick={() => setListening((current) => !current)} aria-label="Toggle JARVIS voice"><i /></button>
          </article>

          <article className="work-panel thought-panel">
            <div className="mini-heading"><span>Thought Stream</span><b>{thoughts.length}</b></div>
            <div className="thought-stream">
              {thoughts.map((thought) => (
                <p key={`${thought.agent}-${thought.time}-${thought.text}`}>
                  <strong>{thought.agent}</strong>
                  <small>{thought.time}</small>
                  {thought.text}
                </p>
              ))}
            </div>
          </article>

          <article className="work-panel standby-panel">
            <div className="mini-heading"><span>{treeFocus === 'Hermes (Noen)' ? 'No agent selected' : treeFocus}</span><b>{standbyTasks.length}</b></div>
            <div className="standby-list">
              {standbyTasks.map((task) => (
                <button type="button" key={`${task.title}-${task.detail}`} onClick={assignTask}>
                  <strong>{task.title}</strong>
                  <small>{task.detail}</small>
                </button>
              ))}
            </div>
          </article>
        </aside>

        <article className="work-panel workspace-panel">
          <div className="workspace-copy">
            <span className="hud-kicker">3D Workspace Future</span>
            <h2>3D Workspace Future</h2>
            <p>In the future, this will become a 3D collaborative workspace where we can meet, discuss, and build together in real time.</p>
            <button type="button" onClick={() => {
              setWorkspacePreview((current) => !current);
              logSystemUpdate('3D workspace preview toggled.');
            }}>{workspacePreview ? 'Hide 3D Workspace' : 'Preview 3D Workspace'}</button>
          </div>
          <div className={`workspace-stage ${workspacePreview ? 'active' : ''}`} aria-label="3D workspace preview">
            <span /><span /><span /><span /><span />
          </div>
        </article>

        <article className="work-panel dispatch-panel">
          <span className="hud-kicker">Execution Routine</span>
          <div className="dispatch-track">
            {dispatchSteps.map((step) => (
              <button type="button" key={step} className={dispatchStep === step ? 'active' : ''} onClick={() => advanceDispatch(step)}>
                <strong>{step}</strong>
                <small>{step === 'Intake' ? 'Capture command' : step === 'Assign' ? 'Route owner' : step === 'Verify' ? 'Check work' : 'Ship clean'}</small>
              </button>
            ))}
          </div>
          <div className="dispatch-summary">
            <span><b>Project</b>{selectedProject.name}</span>
            <span><b>Focus</b>{treeFocus}</span>
            <span><b>Stage</b>{dispatchStep}</span>
          </div>
        </article>
      </section>
    </main>
  );
}
