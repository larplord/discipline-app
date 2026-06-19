'use client';

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import '@/styles/pages/WorkAgents.css';

type AgentStatus = 'Online' | 'Working' | 'Review';
type FilterStatus = 'All' | AgentStatus;
type ReviewAsset = 'Script' | 'Post' | 'Asset' | 'Video' | 'Account Setup';

type Project = {
  name: string;
  label: string;
  progress: number;
  detail: string;
};

type Approval = {
  id: string;
  title: string;
  kind: 'Review' | 'Approval';
  owner: string;
  requestedBy: string;
  risk: 'Medium' | 'High';
  detail: string;
  taskType: string;
  purpose: string;
  goal: string;
  targetOutcome: string;
  needsApproval: string;
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

const MAX_AGENT_SLOTS = 9;
const agents: Array<{ name: string; status: AgentStatus }> = [];

const projects: Project[] = [
  { name: 'Discipline OS', label: 'Active', progress: 92, detail: 'AI-powered productivity and execution system.' },
  { name: 'Noen Assistant', label: 'Build', progress: 63, detail: 'Voice-first assistant surface and command memory.' },
  { name: 'Content Engine', label: 'Queue', progress: 51, detail: 'Content generation and publishing engine.' },
  { name: 'Agent Workflow', label: 'Review', progress: 78, detail: 'Multi-agent task automation, approvals, and handoffs.' },
];

const approvals: Approval[] = [
  {
    id: 'REV-2025-05-19-0012',
    title: 'Copy Review — Discipline OS Landing Page',
    kind: 'Review',
    owner: 'Content Agent',
    requestedBy: 'Marketing Agent',
    risk: 'Medium',
    detail: 'Landing page copy and conversion messaging.',
    taskType: 'Landing Page Copy',
    purpose: 'Generate high-converting copy for the Discipline OS product landing page.',
    goal: 'Communicate value, build trust, and drive trial sign-ups from paid channels.',
    targetOutcome: 'Increase visitor-to-trial conversion rate by 20% or more.',
    needsApproval: 'Final copy for hero section, benefits, features, and CTA.',
  },
  {
    id: 'REV-2025-05-19-0019',
    title: 'Dashboard update approval',
    kind: 'Approval',
    owner: 'Design Agent',
    requestedBy: 'Design Agent',
    risk: 'High',
    detail: 'Final operator pass before pushing the command layout.',
    taskType: 'Dashboard Layout',
    purpose: 'Verify the Work Agents command centre before it becomes the active business cockpit.',
    goal: 'Match the operator reference while keeping future features clearly labelled.',
    targetOutcome: 'Cleaner Work Agents page with a dedicated review workflow.',
    needsApproval: 'Layout, review page, collaboration lanes, and interaction behaviour.',
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
      { speaker: 'Reviewer', text: 'Needs Review opens a detail panel with context, changes, comment, and actions.', time: 'standby' },
      { speaker: 'Noen', text: 'Operator comments stay local until a real backend is connected.', time: 'standby', self: true },
    ],
  },
];

const actionSeed: CurrentAction[] = Array.from({ length: 7 }).map((_, index) => ({
  agent: 'Noen',
  task: 'Assigned next standby task',
  age: index === 0 ? 'now' : `${index + 1}m`,
}));

const treeNodes = [
  { key: 'Noen', label: 'Noen', detail: 'Command & Orchestration', icon: '🤖' },
  { key: 'Business Manager', label: 'Business Manager', detail: 'Strategy & Execution', icon: '💼' },
  { key: 'Life Coach', label: 'Life Coach', detail: 'Growth & Wellbeing', icon: '♡' },
];

const reviewChecklist = [
  ['Clarity & Readability', 'Is the message clear and easy to understand?'],
  ['Brand Alignment', 'Does it reflect our brand voice and positioning?'],
  ['CTA Strength', 'Is the primary CTA compelling and direct?'],
  ['Accuracy & Compliance', 'Are claims accurate and compliant?'],
];

const executionMetrics = [
  ['Agent', 'Content Agent'],
  ['Workflow / Project', 'Discipline OS'],
  ['Tokens Used', '18,742'],
  ['Runtime', '3m 42s'],
  ['Estimated Cost', '$0.086'],
  ['Model Used', 'GPT-4.1'],
  ['Iterations', '3'],
  ['Input Sources', 'Brief, Brand Guide, Competitor Pages'],
  ['Completed', 'May 19, 2025 10:42 AM'],
];

export default function WorkAgentsPage() {
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [treeFocus, setTreeFocus] = useState('Noen');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [lanes, setLanes] = useState(laneSeed);
  const [actions, setActions] = useState(actionSeed);
  const [chatDraft, setChatDraft] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [activeAsset, setActiveAsset] = useState<ReviewAsset>('Asset');
  const [notice, setNotice] = useState('No live agent telemetry connected yet.');

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

  function openReview(item: Approval) {
    setSelectedApproval(item);
    setReviewComment('');
    setNotice(`${item.title} opened for full review.`);
  }

  function closeReview() {
    setSelectedApproval(null);
    setNotice('Returned to Needs Review.');
  }

  function addAction(task: string) {
    setActions((current) => [{ agent: 'Noen', task, age: 'now' }, ...current].slice(0, 7));
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLanes((current) => current.map((lane, index) => index === 0
      ? { ...lane, lines: [...lane.lines, { speaker: 'Daniel', text: message, time: now, self: true }].slice(-4) }
      : lane));
    addAction('Operator note added to collaboration lanes');
    logSystemUpdate('Operator note added to Planning Lane.');
    setChatDraft('');
  }

  function handleReviewAction(action: string) {
    if (!selectedApproval) return;
    const suffix = reviewComment.trim() ? ` Comment: ${reviewComment.trim()}` : '';
    addAction(`${action}: ${selectedApproval.title}`);
    logSystemUpdate(`${action} staged for ${selectedApproval.title}.${suffix}`);
  }

  if (selectedApproval) {
    return (
      <main className="work-agents-page review-workspace-page fade-in">
        <section className="review-topbar">
          <button type="button" onClick={closeReview}>← Back to Needs Review</button>
          <div className="review-meta-strip">
            <span><small>Review ID</small><b>{selectedApproval.id}</b></span>
            <span><small>Created</small><b>May 19, 2025, 10:42 AM</b></span>
            <span><small>Requested By</small><b>{selectedApproval.requestedBy}</b></span>
            <button type="button" aria-label="More review actions">•••</button>
          </div>
        </section>

        <header className="review-title-block">
          <span>Review</span>
          <h1>{selectedApproval.title}</h1>
          <div>
            <em className="status-pill purple">◆ Needs Review</em>
            <em className="status-pill amber">⚠ {selectedApproval.risk} Risk</em>
          </div>
        </header>

        <section className="review-detail-grid-v2">
          <aside className="work-panel review-context-panel">
            <span className="hud-kicker">Work Context</span>
            <dl className="review-context-list">
              <div><dt>▣ Task Type</dt><dd>{selectedApproval.taskType}</dd></div>
              <div><dt>♙ Requested By</dt><dd>{selectedApproval.requestedBy}</dd></div>
              <div><dt>▱ Purpose</dt><dd>{selectedApproval.purpose}</dd></div>
              <div><dt>♙ Goal</dt><dd>{selectedApproval.goal}</dd></div>
              <div><dt>◇ Target Outcome</dt><dd>{selectedApproval.targetOutcome}</dd></div>
              <div><dt>☷ What needs approval</dt><dd>{selectedApproval.needsApproval}</dd></div>
            </dl>

            <div className="review-checklist">
              <div className="mini-heading"><span>Review Checklist</span><b>4 / 4</b></div>
              {reviewChecklist.map(([title, copy]) => <p key={title}><i>✓</i><strong>{title}</strong><small>{copy}</small></p>)}
            </div>
            <button type="button" className="review-wide-button" onClick={() => logSystemUpdate('Original brief opened locally.')}>View Original Brief ↗</button>
          </aside>

          <section className="work-panel review-asset-panel">
            <div className="review-asset-head">
              <span className="hud-kicker">Content Under Review</span>
              <div className="asset-tabs">
                {(['Script', 'Post', 'Asset', 'Video', 'Account Setup'] as ReviewAsset[]).map((asset) => (
                  <button type="button" className={activeAsset === asset ? 'active' : ''} key={asset} onClick={() => setActiveAsset(asset)}>{asset}</button>
                ))}
              </div>
            </div>
            <div className="asset-toolbar">
              <strong>Landing Page Copy Draft</strong>
              <button type="button">Version 3⌄</button>
              <button type="button">Compare</button>
              <button type="button">Open full asset ↗</button>
            </div>
            <article className="landing-preview-card">
              <span>NEW</span>
              <small>AI-powered productivity & execution system</small>
              <h2>Run <b>your goals.</b><br />Not just your to-do list.</h2>
              <p>Discipline OS connects strategy, execution, and teams in one system that keeps you focused, aligned, and delivering results.</p>
              <div className="landing-feature-grid">
                <p><i>✹</i><strong>AI Work Agents</strong><small>Specialized agents that plan, create, and execute work for you.</small></p>
                <p><i>⌁</i><strong>End-to-End Execution</strong><small>From idea to delivery—track every step in one unified platform.</small></p>
                <p><i>✣</i><strong>Built for Focus</strong><small>Eliminate noise, prioritize what matters, and stay in flow.</small></p>
                <p><i>▱</i><strong>Measure What Matters</strong><small>Real-time insights that show progress and drive better decisions.</small></p>
              </div>
              <div className="landing-actions"><button type="button">Start 14-Day Free Trial →</button><button type="button">▷ See it in Action</button></div>
            </article>
            <div className="asset-device-row"><span>▣ Desktop</span><span>▯ Tablet</span><span>▯ Mobile</span><b>⌕ 100% ⌕</b></div>
          </section>

          <aside className="work-panel review-feedback-panel">
            <div className="mini-heading"><span>Questions & Feedback</span><b>3</b></div>
            <div className="participant-row"><span>Participants</span><b>◉ ◌ You</b><button type="button">＋</button><select aria-label="Message filter"><option>All messages</option></select></div>
            <div className="feedback-thread">
              <p className="self"><strong>You</strong><small>10:45 AM</small>Love the structure. Can we make the headline more benefit-driven and less generic?</p>
              <p><strong>Content Agent</strong><small>10:47 AM</small>Got it. Here are two alternative headline options that lead with a stronger benefit.<em>Suggested Headline Options<br />1. Get More Done. With an AI System That Executes.<br />2. Turn Plans into Progress. Automatically.</em></p>
              <p className="self"><strong>You</strong><small>10:49 AM</small>Let’s go with option 1. Also, can we add a security trust badge row under the CTA?</p>
              <p><strong>Content Agent</strong><small>10:50 AM</small>Updated. Added headline option 1 and included trust badges under the CTA. Please review Version 3.</p>
            </div>
            <form className="review-feedback-form" onSubmit={(event) => { event.preventDefault(); handleReviewAction('Feedback added'); }}>
              <input value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Ask a question or give feedback…" />
              <button type="submit">➤</button>
            </form>
            <div className="review-inline-actions"><button type="button">Ask Follow-up</button><button type="button">Add Note</button></div>
            <div className="review-decision-actions"><button type="button" onClick={() => handleReviewAction('Approved')}>✓ Approve</button><button type="button" onClick={() => handleReviewAction('Changes requested')}>✎ Request Changes</button><button type="button" onClick={() => handleReviewAction('Sent back')}>↩ Send Back</button></div>
          </aside>
        </section>

        <section className="work-panel execution-metrics-panel">
          <div className="mini-heading"><span>Execution Metrics</span><small>Useful for deciding whether this workflow should continue to be automated.</small></div>
          <div className="metrics-card-row">
            {executionMetrics.map(([label, value]) => <article key={label}><small>{label}</small><strong>{value}</strong></article>)}
            <article className="score-card"><small>Confidence Score</small><strong>87</strong><em>87/100 High</em></article>
          </div>
        </section>

        <section className="review-bottom-actions">
          <button type="button" onClick={() => handleReviewAction('Review report exported')}>⇩ Export Review Report</button>
          <button type="button" onClick={() => handleReviewAction('Review link shared')}>🔗 Share Review Link</button>
          <button type="button" className="primary" onClick={() => handleReviewAction('Approve & Publish')}>✓ Approve & Publish</button>
          <button type="button" onClick={() => handleReviewAction('Revision requested')}>⟳ Request Revision</button>
          <button type="button" onClick={() => handleReviewAction('Review archived')}>▣ Archive Review</button>
        </section>
      </main>
    );
  }

  return (
    <main className="work-agents-page hud-page fade-in">
      <section className="work-command-grid" aria-label="Work agents command centre">
        <article className="work-panel agent-tree-panel">
          <div className="work-panel-heading compact-heading"><span className="hud-kicker">Agent Tree</span></div>
          <div className="agent-tree" aria-label="Agent hierarchy">
            {treeNodes.map((node) => (
              <button type="button" key={node.key} className={`tree-node tree-${node.key.toLowerCase().replaceAll(' ', '-')} ${treeFocus === node.key ? 'active' : ''}`} onClick={() => { setTreeFocus(node.key); logSystemUpdate(`${node.label} tree node inspected.`); }}>
                <span>{node.icon}</span><strong>{node.label}</strong><small>{node.detail}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="work-panel projects-panel">
          <div className="work-panel-heading compact-heading"><span className="hud-kicker">Projects / Status</span><button type="button" className="panel-menu" onClick={() => logSystemUpdate('Project status menu opened.')}>•••</button></div>
          <div className="project-stack">
            {projects.map((project) => (
              <button type="button" key={project.name} className={`project-row ${selectedProject.name === project.name ? 'active' : ''}`} onClick={() => { setSelectedProject(project); logSystemUpdate(`${project.name} opened.`); }}>
                <span><strong>{project.name}</strong><small>{project.detail}</small></span><em>{project.label}</em><i style={{ '--progress': `${project.progress}%` } as CSSProperties} />
              </button>
            ))}
          </div>
          <div className="approval-stack compact-review" aria-label="Needs review">
            <div className="mini-heading"><span>Needs Review</span><b>{approvals.length}</b></div>
            {approvals.map((item) => (
              <button type="button" className="approval-row approval-button" key={item.id} onClick={() => openReview(item)}>
                <span><strong>{item.title}</strong><small>{item.requestedBy}</small></span><i>Open</i>
              </button>
            ))}
          </div>
        </article>

        <section className="agent-roster-panel" aria-label="Agent roster">
          <div className="roster-toolbar work-panel"><span className="hud-kicker">Agent Roster</span><div className="status-filters" aria-label="Agent status filters">{(['All', 'Online', 'Working', 'Review'] as const).map((status) => <button type="button" key={status} className={filter === status ? 'active' : ''} onClick={() => { setFilter(status); logSystemUpdate(`${status} roster filter selected.`); }}>{status}<small>{status === 'All' ? MAX_AGENT_SLOTS : statusCounts[status]}</small></button>)}</div></div>
          <div className="agent-card-grid">{filteredAgents.map((agent) => <button type="button" className="agent-card" key={agent.name}>{agent.name}</button>)}{Array.from({ length: emptyAgentSlots }).map((_, index) => <div className="agent-card empty-agent-slot" key={`empty-agent-slot-${index}`} aria-label="Empty agent slot"><span /></div>)}</div>
        </section>

        <article className="work-panel activity-band-panel blank-activity-panel" aria-label="Live agent activity">
          <div className="blank-live-updates"><span className="hud-kicker">Live Updates / Auto Refresh</span><strong>No live agent telemetry connected yet.</strong><small>There is no agent event stream currently in this view.</small></div>
          <div className="activity-footer"><i /> {notice}</div>
        </article>

        <article className="work-panel collaboration-panel">
          <div className="work-panel-heading compact-heading"><span className="hud-kicker">Live Agent Collaboration</span><div className="collab-controls"><span>Local standby</span><button type="button" onClick={() => logSystemUpdate('Collaboration lanes expanded locally.')}>↗</button></div></div>
          <div className="collab-lanes">{lanes.map((lane) => <section className="collab-lane" key={lane.title}><div className="mini-heading"><span>{lane.title}</span><b>{lane.lines.length}</b></div><small className="lane-subtitle">{lane.subtitle}</small><div className="chat-log compact-chat" aria-live="polite">{lane.lines.map((message) => <p className={message.self ? 'self' : ''} key={`${lane.title}-${message.speaker}-${message.time}-${message.text}`}><strong>{message.speaker}</strong><small>{message.time}</small>{message.text}</p>)}</div></section>)}</div>
          <form onSubmit={handleChatSubmit} className="chat-form wide-chat-form"><input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Add a note to the collaboration lanes…" aria-label="Message the team" /><button type="submit">➤</button></form>
        </article>

        <article className="work-panel current-actions-panel" aria-label="Current actions">
          <div className="mini-heading"><span>Current Actions</span><b>{actions.length}</b></div>
          <div className="activity-list current-actions">{actions.map((action, index) => <span key={`${action.agent}-${action.task}-${action.age}-${index}`}><b>{action.agent}</b><em>{action.task}</em><small>{action.age}</small><i>Working</i></span>)}</div>
        </article>
      </section>
    </main>
  );
}
