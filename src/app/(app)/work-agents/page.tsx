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
  context: string;
  changes: string[];
  goal: string;
};

type LaneLine = {
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

type StandbyTask = {
  title: string;
  detail: string;
};

const MAX_AGENT_SLOTS = 9;
const agents: Array<{ name: string; status: AgentStatus }> = [];

const projects: Project[] = [
  { name: 'Discipline OS', label: 'Active', progress: 86, detail: 'AI-powered productivity and execution system.' },
  { name: 'Noen Assistant', label: 'Build', progress: 62, detail: 'Voice-first assistant surface and command memory.' },
  { name: 'Content Engine', label: 'Queue', progress: 48, detail: 'Content generation and publishing engine.' },
  { name: 'Agent Workflow', label: 'Review', progress: 71, detail: 'Multi-agent task automation, approvals, and handoffs.' },
];

const approvals: Approval[] = [
  {
    title: 'API connection review',
    kind: 'Review',
    owner: 'Noen',
    risk: 'Medium',
    detail: 'Confirm secure bridge settings before live actions.',
    context: 'Dashboard assistant route needs a protected backend API bridge before commands can run outside the browser.',
    goal: 'Allow voice/dashboard requests to hand off cleanly without exposing credentials or creating fake live execution.',
    changes: ['Check environment variables', 'Confirm server-only route protection', 'Keep browser transcript handoff explicit'],
  },
  {
    title: 'Dashboard update approval',
    kind: 'Approval',
    owner: 'Design Agent',
    risk: 'High',
    detail: 'Final operator pass before pushing the command layout.',
    context: 'Work Agents visual structure has changed and needs Daniel’s approval before treating it as the new command surface.',
    goal: 'Make sure the page matches the intended cockpit before deployment becomes the default.',
    changes: ['Review Work Agents layout', 'Leave comments or requested changes', 'Approve only after visual pass'],
  },
];

const laneSeed: Array<{ title: string; subtitle: string; lines: LaneLine[] }> = [
  {
    title: 'Planning Lane',
    subtitle: 'briefs / scope',
    lines: [
      { speaker: 'Noen', text: 'Keeping the current brief focused on Agent, Business, Work Agents, and Projects.', time: 'standby', self: true },
      { speaker: 'Planner', text: 'Health remains locked for this pass.', time: 'standby' },
    ],
  },
  {
    title: 'Build Lane',
    subtitle: 'implementation',
    lines: [
      { speaker: 'Builder', text: 'Waiting for an approved project/workflow before showing real execution data.', time: 'standby' },
      { speaker: 'Design', text: 'Future modules are marked clearly as future, not live.', time: 'standby' },
    ],
  },
  {
    title: 'Review Lane',
    subtitle: 'approval gate',
    lines: [
      { speaker: 'Reviewer', text: 'Needs Review opens a detail panel with context, changes, comment, and approval controls.', time: 'standby' },
      { speaker: 'Noen', text: 'Operator comments stay local until a real backend is connected.', time: 'standby', self: true },
    ],
  },
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

const standbySeed: StandbyTask[] = [
  { title: 'Define Q2 campaign messaging', detail: 'For audience tree.' },
  { title: 'Research Agent recommendation', detail: 'Five competitor insights.' },
  { title: 'Planning Agent moved dashboard priorities', detail: 'To this week’s sprint.' },
  { title: 'Automation Agent suggests', detail: 'Two workflow optimisations.' },
  { title: 'Support Agent escalated', detail: 'Three tickets for review.' },
];

const treeNodes = [
  { key: 'Noen', label: 'Noen', detail: 'Command & Orchestration', icon: '🤖' },
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
  const [treeFocus, setTreeFocus] = useState('Noen');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(approvals[0]);
  const [handledApprovals, setHandledApprovals] = useState<string[]>([]);
  const [lanes, setLanes] = useState(laneSeed);
  const [actions, setActions] = useState(actionSeed);
  const [standbyTasks, setStandbyTasks] = useState(standbySeed);
  const [chatDraft, setChatDraft] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [dispatchStep, setDispatchStep] = useState<DispatchStep>('Intake');
  const [workspacePreview, setWorkspacePreview] = useState(false);
  const [notice, setNotice] = useState('Ready. Live Updates are intentionally blank until real agent telemetry is connected.');

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
    setNotice(update);
  }

  function openApproval(item: Approval) {
    setSelectedApproval(item);
    setReviewComment('');
    logSystemUpdate(`${item.title} opened in the review gate.`);
  }

  function handleApproval(item: Approval) {
    setHandledApprovals((current) => Array.from(new Set([...current, item.title])));
    logSystemUpdate(`${item.title} approved locally by operator gate.`);
  }

  function requestChanges(item: Approval) {
    const suffix = reviewComment.trim() ? ` Comment: ${reviewComment.trim()}` : '';
    logSystemUpdate(`${item.title} marked for requested changes.${suffix}`);
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLanes((current) => current.map((lane, index) => index === 0
      ? { ...lane, lines: [...lane.lines, { speaker: 'Daniel', text: message, time: now, self: true }].slice(-4) }
      : lane));
    setActions((current) => [{ agent: 'Noen', task: message, age: 'now' }, ...current].slice(0, 7));
    logSystemUpdate('Operator note added to Planning Lane.');
    setChatDraft('');
  }

  function assignTask() {
    setStandbyTasks((current) => current.slice(1));
    setActions((current) => [{ agent: 'Noen', task: 'Assigned next standby task', age: 'now' }, ...current].slice(0, 7));
    logSystemUpdate('Next standby task assigned locally.');
  }

  function exportBriefing() {
    logSystemUpdate('Briefing export staged for operator review.');
  }

  function advanceDispatch(step: DispatchStep) {
    setDispatchStep(step);
    logSystemUpdate(`Future execution routine moved to ${step}.`);
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
                className={`tree-node tree-${node.key.toLowerCase().replaceAll(' ', '-')} ${treeFocus === node.key ? 'active' : ''}`}
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
                <button type="button" className={`approval-row approval-button ${handled ? 'handled' : ''}`} key={item.title} onClick={() => openApproval(item)}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.owner} · Risk {item.risk}</small>
                    <em>{item.detail}</em>
                  </span>
                  <i>{handled ? 'Handled' : 'Open'}</i>
                </button>
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
                  onClick={() => {
                    setFilter(status);
                    logSystemUpdate(`${status} roster filter selected.`);
                  }}
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

        <article className="work-panel activity-band-panel blank-activity-panel" aria-label="Live agent activity">
          <div className="blank-live-updates">
            <span className="hud-kicker">Live Updates / Auto Refresh</span>
            <strong>No live agent telemetry connected yet.</strong>
            <small>Blank by design until real backend activity is available.</small>
          </div>
          <div className="activity-footer"><i /> {notice}</div>
        </article>

        <article className="work-panel collaboration-panel">
          <div className="work-panel-heading compact-heading">
            <span className="hud-kicker">Live Agent Collaboration</span>
            <div className="collab-controls"><span>Local standby</span><button type="button" onClick={() => logSystemUpdate('Collaboration lanes expanded locally.')}>↗</button></div>
          </div>
          <div className="collab-lanes">
            {lanes.map((lane) => (
              <section className="collab-lane" key={lane.title}>
                <div className="mini-heading"><span>{lane.title}</span><b>{lane.lines.length}</b></div>
                <small className="lane-subtitle">{lane.subtitle}</small>
                <div className="chat-log compact-chat" aria-live="polite">
                  {lane.lines.map((message) => (
                    <p className={message.self ? 'self' : ''} key={`${lane.title}-${message.speaker}-${message.time}-${message.text}`}>
                      <strong>{message.speaker}</strong>
                      <small>{message.time}</small>
                      {message.text}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-form wide-chat-form">
            <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Add a note to the collaboration lanes…" aria-label="Message the team" />
            <button type="submit">➤</button>
          </form>
        </article>

        <aside className="right-intel-column">
          <article className="work-panel review-detail-panel">
            <div className="mini-heading"><span>Review Gate</span><b>{selectedApproval ? '1' : '0'}</b></div>
            {selectedApproval ? (
              <div className="review-detail">
                <strong>{selectedApproval.title}</strong>
                <small>{selectedApproval.owner} · {selectedApproval.kind} · Risk {selectedApproval.risk}</small>
                <p>{selectedApproval.context}</p>
                <dl>
                  <div><dt>Workflow / Project Context</dt><dd>{selectedProject.name}</dd></div>
                  <div><dt>Goal</dt><dd>{selectedApproval.goal}</dd></div>
                </dl>
                <ul>{selectedApproval.changes.map((change) => <li key={change}>{change}</li>)}</ul>
                <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Leave a comment or requested change…" />
                <div className="review-actions">
                  <button type="button" onClick={() => requestChanges(selectedApproval)}>Request Change</button>
                  <button type="button" onClick={() => handleApproval(selectedApproval)}>Approve</button>
                </div>
              </div>
            ) : <p className="empty-inline">No review selected.</p>}
          </article>

          <article className="work-panel standby-panel">
            <div className="mini-heading"><span>{treeFocus}</span><b>{standbyTasks.length}</b></div>
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

        <article className="work-panel current-actions-panel" aria-label="Current actions">
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
        </article>

        <article className="work-panel workspace-panel">
          <div className="workspace-copy">
            <span className="hud-kicker">Future Feature</span>
            <h2>3D Workspace</h2>
            <p>Future collaborative workspace preview. This is intentionally not represented as live execution yet.</p>
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
          <span className="hud-kicker">Future Execution Routine</span>
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
