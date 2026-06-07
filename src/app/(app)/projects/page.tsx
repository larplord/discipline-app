import '@/styles/pages/Projects.css';

type ProjectStatus = 'Active' | 'Paused' | 'Finished' | 'Needs Review';
type Priority = 'High' | 'Medium' | 'Low';

type Project = {
  name: string;
  description: string;
  icon: string;
  status: ProjectStatus;
  priority: Priority;
  nextStep: string;
  progress: number;
  lastWorked: string;
  dueLabel: string;
  dueDate: string;
  agent: string;
};

type ProjectDetail = {
  name: string;
  icon: string;
  currentTask: string;
  blockedBy: string;
  neededFiles: string[];
  agent: string;
  notes: string;
};

const stats = [
  { label: 'Total Projects', value: '12', note: 'Across all categories', icon: '◎' },
  { label: 'Active Projects', value: '7', note: 'Currently in progress', icon: '◔' },
  { label: 'Overall Progress', value: '64%', note: '+6% vs last 7 days', icon: '◕' },
  { label: 'Completion Rate', value: '58%', note: 'Completed projects', icon: '↗' },
  { label: 'Due This Week', value: '5', note: 'Across 4 projects', icon: '▣' },
];

const statusFilters = ['All Projects', 'Active', 'Paused', 'Finished', 'Needs Review'];
const categories = ['All', 'AI', 'Dashboard', 'Content', 'Automation', 'Personal'];

const projects: Project[] = [
  {
    name: 'Discipline OS',
    description: 'Personal productivity system for habits, focus, and growth.',
    icon: '◎',
    status: 'Active',
    priority: 'High',
    nextStep: 'Finalize dashboard widgets and connect live habit data.',
    progress: 78,
    lastWorked: 'Today',
    dueLabel: 'Due',
    dueDate: 'May 25, 2025',
    agent: 'System Architect',
  },
  {
    name: 'Jarvis Assistant',
    description: 'AI assistant interface for voice, chat, and task automation.',
    icon: '◉',
    status: 'Active',
    priority: 'High',
    nextStep: 'Build orb interaction states and command routing.',
    progress: 64,
    lastWorked: 'Yesterday',
    dueLabel: 'Due',
    dueDate: 'May 28, 2025',
    agent: 'AI Designer',
  },
  {
    name: 'Agent Workflow',
    description: 'Business agent system for marketing, research, and operations.',
    icon: '⌘',
    status: 'Active',
    priority: 'Medium',
    nextStep: 'Map sub-agent roles and task handoff logic.',
    progress: 51,
    lastWorked: '2 days ago',
    dueLabel: 'Due',
    dueDate: 'May 30, 2025',
    agent: 'Workflow Lead',
  },
  {
    name: 'Content Engine',
    description: 'Pipeline for generating and reviewing short-form content.',
    icon: '▷',
    status: 'Needs Review',
    priority: 'Medium',
    nextStep: 'Set up video generation loop and approval review.',
    progress: 42,
    lastWorked: '3 days ago',
    dueLabel: 'Due',
    dueDate: 'May 31, 2025',
    agent: 'Content Strategist',
  },
  {
    name: 'Habit Tracker',
    description: 'Track habits, streaks, and consistency across routines.',
    icon: '✓',
    status: 'Active',
    priority: 'Low',
    nextStep: 'Connect wearable data and improve analytics.',
    progress: 35,
    lastWorked: 'May 14, 2025',
    dueLabel: 'Due',
    dueDate: 'Jun 10, 2025',
    agent: 'Data Analyst',
  },
  {
    name: 'Dashboard Redesign',
    description: 'Redesign the main dashboard for clarity and speed.',
    icon: '▦',
    status: 'Active',
    priority: 'Medium',
    nextStep: 'Finalize new layout and micro-interactions.',
    progress: 60,
    lastWorked: 'Today',
    dueLabel: 'Due',
    dueDate: 'Jun 5, 2025',
    agent: 'UI/UX Designer',
  },
  {
    name: 'Voice Command System',
    description: 'Advanced voice recognition and command execution.',
    icon: '⌁',
    status: 'Paused',
    priority: 'Low',
    nextStep: 'Improve intent detection accuracy.',
    progress: 24,
    lastWorked: 'May 10, 2025',
    dueLabel: 'Due',
    dueDate: 'Jun 20, 2025',
    agent: 'Voice Engineer',
  },
  {
    name: 'Marketing Automation',
    description: 'Automated outreach, follow-ups, and campaign tracking.',
    icon: '◇',
    status: 'Finished',
    priority: 'Low',
    nextStep: 'Review performance and optimize flows.',
    progress: 100,
    lastWorked: 'May 12, 2025',
    dueLabel: 'Completed on',
    dueDate: 'May 12, 2025',
    agent: 'Marketing Specialist',
  },
];

const details: ProjectDetail[] = [
  {
    name: 'Discipline OS',
    icon: '◎',
    currentTask: 'Finalizing dashboard widgets and connecting live habit data.',
    blockedBy: 'Waiting on live data API from wearables.',
    neededFiles: ['habit_data_schema.json', 'widget_spec_v3.fig'],
    agent: 'System Architect',
    notes: 'Live data integration will unlock predictive habit insights.',
  },
  {
    name: 'Jarvis Assistant',
    icon: '◉',
    currentTask: 'Building orb interaction states and command routing.',
    blockedBy: 'Orb animation assets not finalized.',
    neededFiles: ['orb_states_lottie.zip', 'command_flow_map.json'],
    agent: 'AI Designer',
    notes: 'Voice intent system is 80% accurate in testing.',
  },
];

const updates = [
  ['Discipline OS widgets connected', 'Today 8:42 AM'],
  ['Jarvis Assistant intent tests improved', 'Yesterday 4:10 PM'],
  ['Agent Workflow role map v1.2 created', 'May 14, 8:30 PM'],
  ['Content Engine approval flow drafted', 'May 13, 6:15 PM'],
];

const nextActions = [
  'Finish dashboard widgets for Discipline OS',
  'Connect live habit data',
  'Build Jarvis orb interaction states',
  'Map sub-agent workflow',
  'Set up content approval loop',
];

const timeline = [
  ['Discipline OS', 85],
  ['Jarvis Assistant', 70],
  ['Agent Workflow', 55],
  ['Content Engine', 40],
];

const deadlines = [
  ['Discipline OS', 'May 25, 2025', '3 days'],
  ['Jarvis Assistant', 'May 28, 2025', '6 days'],
  ['Agent Workflow', 'May 30, 2025', '8 days'],
  ['Content Engine', 'May 31, 2025', '9 days'],
];

const week = [
  ['Mon', ['□', '✓', '⌘', '◉']],
  ['Tue', ['✓', '◇', '⌘', '✣']],
  ['Wed', ['✓', '⌁', '□', '◉']],
  ['Thu', ['✓', '✓', '✓', '✓']],
  ['Fri', ['◇', '○', '○', '◉']],
  ['Sat', ['○', '○', '○', '○']],
  ['Sun', ['○', '⊘', '○', '⊘']],
];

export default function ProjectsPage() {
  return (
    <main className="projects-page projects-hud-page fade-in">
      <section className="projects-hero">
        <div>
          <h1>Projects</h1>
          <p>Track progress, priorities, and next actions across all active projects.</p>
        </div>
        <button type="button" className="projects-new-button"><span>＋</span> New Project</button>
      </section>

      <section className="projects-stat-grid" aria-label="Project statistics">
        {stats.map((stat) => (
          <article className="project-stat-card" key={stat.label}>
            <div className="project-stat-icon">{stat.icon}</div>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="project-toolbar" aria-label="Project filters">
        <div className="toolbar-row">
          <span className="toolbar-label">Status</span>
          <div className="toolbar-pills">
            {statusFilters.map((filter, index) => <button type="button" className={index === 0 ? 'active' : ''} key={filter}>{filter}</button>)}
          </div>
          <span className="toolbar-label category-label">Category</span>
          <div className="toolbar-pills category-pills">
            {categories.map((category, index) => <button type="button" className={index === 0 ? 'active' : ''} key={category}>{category}</button>)}
          </div>
        </div>
        <div className="toolbar-row sort-row">
          <label>Sort by <select defaultValue="Progress"><option>Progress</option><option>Due date</option><option>Priority</option></select></label>
          <label>Group <select defaultValue="None"><option>None</option><option>Status</option><option>Agent</option></select></label>
          <div className="view-toggle" aria-label="View toggle"><span>View</span><button className="active" type="button">▦</button><button type="button">☰</button></div>
        </div>
      </section>

      <section className="projects-card-grid" aria-label="Active project cards">
        {projects.map((project) => <ProjectCard project={project} key={project.name} />)}
      </section>

      <section className="project-detail-grid-v2" aria-label="Project details">
        {details.map((detail) => <ProjectDetailCard detail={detail} key={detail.name} />)}
      </section>

      <section className="project-intel-grid">
        <article className="project-panel ai-summary-panel">
          <div className="panel-heading"><span className="panel-icon">☷</span><h2>AI Project Summary</h2></div>
          <p>You have 4 active projects. Jarvis Assistant and Discipline OS are the highest priorities. Content Engine is waiting on approval workflow setup. Agent Workflow needs role mapping before build continues.</p>
          <a href="#recommendations">View AI Recommendations →</a>
        </article>
        <article className="project-panel next-actions-panel">
          <div className="panel-heading"><span className="panel-icon">☑</span><h2>Next Actions</h2></div>
          <ol>{nextActions.map((action) => <li key={action}>{action}</li>)}</ol>
          <a href="#actions">View all actions →</a>
        </article>
      </section>

      <section className="project-panel timeline-panel">
        <div className="timeline-head">
          <div className="panel-heading"><span className="panel-icon">☷</span><div><h2>Project Timeline Overview</h2><p>Track projects across the full lifecycle.</p></div></div>
          <div className="timeline-stages"><span>Idea</span><span>Planning</span><span>Design</span><span className="active">Build</span><span>Testing</span><span>Launch</span></div>
        </div>
        <div className="timeline-rows">
          {timeline.map(([name, value]) => (
            <div className="timeline-row" key={name}>
              <span>{name}</span>
              <div className="timeline-track"><i style={{ width: `${value}%` }} /></div>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="project-footer-grid">
        <article className="project-panel updates-panel">
          <h3>Recent Updates</h3>
          <ul>{updates.map(([text, time]) => <li key={text}><span>{text}</span><small>{time}</small></li>)}</ul>
          <a href="#updates">View all updates →</a>
        </article>
        <article className="project-panel insights-panel">
          <h3>Insights</h3>
          <div className="insight-row cyan"><b>Most Active Project</b><span>Discipline OS<br />10 this week</span></div>
          <div className="insight-row green"><b>Top Performer</b><span>Marketing Automation<br />100% efficiency</span></div>
          <div className="insight-row red"><b>At Risk</b><span>Voice Command System<br />Low progress</span></div>
          <a href="#insights">View all insights →</a>
        </article>
        <article className="project-panel calendar-panel">
          <div className="calendar-heading"><h3>Calendar Overview</h3><button type="button">This Week⌄</button></div>
          <div className="calendar-grid">{week.map(([day, items]) => <div key={day as string}><strong>{day}</strong>{(items as string[]).map((item, index) => <span key={`${day}-${index}`}>{item}</span>)}</div>)}</div>
          <a href="#calendar">View full calendar →</a>
        </article>
        <article className="project-panel deadlines-panel">
          <h3>Upcoming Deadlines</h3>
          <ul>{deadlines.map(([name, date, days]) => <li key={name}><span>{name}</span><small>{date}</small><b>{days}</b></li>)}</ul>
          <a href="#deadlines">View all deadlines →</a>
        </article>
      </section>
    </main>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-overview-card">
      <div className="project-menu">⋮</div>
      <header>
        <div className="project-card-icon">{project.icon}</div>
        <div className="project-title-copy"><h2>{project.name}</h2><p>{project.description}</p></div>
        <div className="project-badges"><span className={`status ${slug(project.status)}`}>{project.status}</span><span className={`priority ${slug(project.priority)}`}>{project.priority}</span></div>
      </header>
      <p className="next-step"><b>Next step:</b> {project.nextStep}</p>
      <div className="project-progress-line"><strong>{project.progress}%</strong><div><i style={{ width: `${project.progress}%` }} /></div></div>
      <footer>
        <div><span>Last worked on</span><strong>{project.lastWorked}</strong></div>
        <div><span>{project.dueLabel}</span><strong>{project.dueDate}</strong></div>
        <div><span>Agent</span><strong><em>⌘</em>{project.agent}</strong></div>
      </footer>
      {project.status === 'Finished' && <div className="finished-check">✓</div>}
    </article>
  );
}

function ProjectDetailCard({ detail }: { detail: ProjectDetail }) {
  return (
    <article className="project-panel detail-panel">
      <button type="button" aria-label={`Open ${detail.name}`} className="detail-open">↗</button>
      <div className="panel-heading"><span className="panel-icon">{detail.icon}</span><h2>{detail.name} <small>– Project Details</small></h2></div>
      <dl>
        <div><dt>Current Task</dt><dd>{detail.currentTask}</dd></div>
        <div><dt>Blocked By</dt><dd>{detail.blockedBy}</dd></div>
        <div><dt>Needed Files</dt><dd className="file-list">{detail.neededFiles.map((file) => <span key={file}>▱ {file}</span>)}</dd></div>
        <div><dt>Assigned Agent</dt><dd><span className="agent-chip">⌘ {detail.agent}</span></dd></div>
        <div><dt>Notes</dt><dd>{detail.notes}</dd></div>
      </dl>
    </article>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-');
}
