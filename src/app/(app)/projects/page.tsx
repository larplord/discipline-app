'use client';

import { useMemo, useState } from 'react';
import '@/styles/pages/Projects.css';

type ProjectStatus = 'Active' | 'Paused' | 'Finished' | 'Needs Review';
type Priority = 'High' | 'Medium' | 'Low';
type ViewMode = 'grid' | 'list';
type Screen = 'list' | 'add' | 'overview';

type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: ProjectStatus;
  priority: Priority;
  category: string;
  nextStep: string;
  progress: number;
  lastWorked: string;
  dueLabel: string;
  dueDate: string;
  agent: string;
  blockedBy: string;
  notes: string;
};

type Draft = {
  name: string;
  description: string;
  category: string;
  priority: Priority;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  agent: string;
  tags: string;
  nextStep: string;
  notes: string;
  progress: number;
};

const emptyDraft: Draft = {
  name: '',
  description: '',
  category: 'AI',
  priority: 'High',
  status: 'Active',
  startDate: 'May 11, 2025',
  dueDate: 'May 25, 2025',
  agent: 'Jarvis Assistant',
  tags: '',
  nextStep: '',
  notes: '',
  progress: 0,
};

const initialProjects: Project[] = [];

const statusFilters = ['All Projects', 'Active', 'Paused', 'Finished', 'Needs Review'];
const categories = ['All', 'AI', 'Dashboard', 'Content', 'Automation', 'Personal'];
const agents = ['Jarvis Assistant', 'Agent Workflow', 'Content Engine', 'System Architect', 'Data Analyst', 'AI Engineer'];
const lifecycle = ['Idea', 'Planning', 'Design', 'Build', 'Testing', 'Launch'];
const starterTasks = ['Define project scope & objectives', 'Research & gather requirements', 'Create initial project plan', 'Design system architecture', 'Setup project environment'];
const updates = ['Habit widgets connected successfully', 'Dashboard layout finalized and reviewed', 'System Architect commented on analytics plan', 'Wearable API issue resolved', 'Data pipeline stability improved'];
const files = ['habit_data_schema.json', 'widget_spec_v3.fig', 'analytics_spec_v2.md', 'api_integration_guide.pdf', 'discovery_notes.docx'];

export default function ProjectsPage() {
  const [screen, setScreen] = useState<Screen>('list');
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Projects');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Progress');
  const [groupBy, setGroupBy] = useState('None');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftSaved, setDraftSaved] = useState(false);
  const [taskCount, setTaskCount] = useState(starterTasks.length);
  const [milestoneCount, setMilestoneCount] = useState(5);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedId);
  const hasProjects = projects.length > 0;
  const averageProgress = hasProjects ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;
  const completionRate = hasProjects ? Math.round((projects.filter((p) => p.status === 'Finished').length / projects.length) * 100) : 0;

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((item) => {
      const statusOk = statusFilter === 'All Projects' || item.status === statusFilter;
      const categoryOk = categoryFilter === 'All' || item.category === categoryFilter;
      return statusOk && categoryOk;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'Due date') return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === 'Priority') return priorityWeight(b.priority) - priorityWeight(a.priority);
      return b.progress - a.progress;
    });
  }, [projects, statusFilter, categoryFilter, sortBy]);

  const stats = [
    { label: 'Total Projects', value: String(projects.length), note: groupBy === 'None' ? 'Across all categories' : `Grouped by ${groupBy}`, icon: '◎' },
    { label: 'Active Projects', value: String(projects.filter((p) => p.status === 'Active').length), note: 'Currently in progress', icon: '◔' },
    { label: 'Overall Progress', value: `${averageProgress}%`, note: hasProjects ? '+6% vs last 7 days' : 'No active data yet', icon: '◕' },
    { label: 'Completion Rate', value: `${completionRate}%`, note: 'Completed projects', icon: '↗' },
    { label: 'Due This Week', value: hasProjects ? '5' : '0', note: hasProjects ? 'Across 4 projects' : 'Nothing due yet', icon: '▣' },
  ];

  function openAdd(projectToEdit?: Project) {
    setDraftSaved(false);
    setMenuOpen(false);
    if (projectToEdit) {
      setDraft({
        name: projectToEdit.name,
        description: projectToEdit.description,
        category: projectToEdit.category,
        priority: projectToEdit.priority,
        status: projectToEdit.status,
        startDate: 'May 11, 2025',
        dueDate: projectToEdit.dueDate,
        agent: projectToEdit.agent,
        tags: projectToEdit.category,
        nextStep: projectToEdit.nextStep,
        notes: projectToEdit.notes,
        progress: projectToEdit.progress,
      });
    } else {
      setDraft(emptyDraft);
    }
    setScreen('add');
  }

  function createProject() {
    const created: Project = {
      id: slug(draft.name || `project-${projects.length + 1}`),
      name: draft.name || 'Project Name',
      description: draft.description || 'One-sentence description will appear here.',
      icon: draft.category === 'Dashboard' ? '▦' : draft.category === 'Automation' ? '⌘' : draft.category === 'Content' ? '▷' : '◉',
      status: draft.status,
      priority: draft.priority,
      category: draft.category,
      nextStep: draft.nextStep || 'Define the immediate next action.',
      progress: draft.progress,
      lastWorked: 'Today',
      dueLabel: 'Due',
      dueDate: draft.dueDate || 'May 25, 2025',
      agent: draft.agent || 'Not assigned',
      blockedBy: 'Waiting on final API permissions from provider.',
      notes: draft.notes || 'Focus on a clear goal, next step, and review cadence.',
    };
    setProjects((current) => [created, ...current.filter((p) => p.id !== created.id)]);
    setSelectedId(created.id);
    setScreen('overview');
  }

  if (screen === 'add') {
    return <AddProjectScreen draft={draft} setDraft={setDraft} draftSaved={draftSaved} onSaveDraft={() => setDraftSaved(true)} onCreate={createProject} onBack={() => setScreen('list')} taskCount={taskCount} setTaskCount={setTaskCount} milestoneCount={milestoneCount} setMilestoneCount={setMilestoneCount} />;
  }

  if (screen === 'overview' && selectedProject) {
    return <ProjectOverviewScreen project={selectedProject} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onBack={() => setScreen('list')} onEdit={() => openAdd(selectedProject)} onAddTask={() => setTaskCount((count) => count + 1)} taskCount={taskCount} milestoneCount={milestoneCount} setMilestoneCount={setMilestoneCount} />;
  }

  return (
    <main className="projects-page projects-hud-page fade-in">
      <section className="projects-hero">
        <div>
          <h1>Projects</h1>
          <p>Track progress, priorities, and next actions across all active projects.</p>
        </div>
        <button type="button" className="projects-new-button" onClick={() => openAdd()}><span>＋</span> New Project</button>
      </section>

      <section className="projects-stat-grid" aria-label="Project statistics">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <section className="project-toolbar" aria-label="Project filters">
        <div className="toolbar-row">
          <span className="toolbar-label">Status</span>
          <div className="toolbar-pills">{statusFilters.map((filter) => <button type="button" className={filter === statusFilter ? 'active' : ''} key={filter} onClick={() => setStatusFilter(filter)}>{filter}</button>)}</div>
          <span className="toolbar-label category-label">Category</span>
          <div className="toolbar-pills category-pills">{categories.map((category) => <button type="button" className={category === categoryFilter ? 'active' : ''} key={category} onClick={() => setCategoryFilter(category)}>{category}</button>)}</div>
        </div>
        <div className="toolbar-row sort-row">
          <label>Sort by <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option>Progress</option><option>Due date</option><option>Priority</option></select></label>
          <label>Group <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}><option>None</option><option>Status</option><option>Agent</option></select></label>
          <div className="view-toggle" aria-label="View toggle"><span>View</span><button className={viewMode === 'grid' ? 'active' : ''} type="button" onClick={() => setViewMode('grid')}>▦</button><button className={viewMode === 'list' ? 'active' : ''} type="button" onClick={() => setViewMode('list')}>☰</button></div>
        </div>
      </section>

      <section className={`projects-card-grid ${viewMode === 'list' ? 'list-mode' : ''}`} aria-label="Active project cards">
        {visibleProjects.length > 0 ? visibleProjects.map((item) => <ProjectCard project={item} key={item.id} onOpen={() => { setSelectedId(item.id); setScreen('overview'); }} />) : <EmptyProjectsState onCreate={() => openAdd()} />}
      </section>

      {hasProjects && <section className="project-detail-grid-v2" aria-label="Project details">
        {projects.slice(0, 2).map((item) => <ProjectDetailCard project={item} key={item.id} onOpen={() => { setSelectedId(item.id); setScreen('overview'); }} />)}
      </section>}

      {hasProjects && <section className="project-intel-grid">
        <article className="project-panel ai-summary-panel">
          <div className="panel-heading"><span className="panel-icon">☷</span><h2>AI Project Summary</h2></div>
          <p>You have {projects.filter((p) => p.status === 'Active').length} active projects. The command centre is ready for your first live project.</p>
          <button type="button" className="text-link" onClick={() => { if (projects[0]) { setSelectedId(projects[0].id); setScreen('overview'); } }}>View AI Recommendations →</button>
        </article>
        <article className="project-panel next-actions-panel">
          <div className="panel-heading"><span className="panel-icon">☑</span><h2>Next Actions</h2></div>
          <ol>{projects.slice(0, 5).map((item) => <li key={item.id}>{item.nextStep}</li>)}</ol>
          <button type="button" className="text-link" onClick={() => { if (projects[0]) { setSelectedId(projects[0].id); setScreen('overview'); } }}>View all actions →</button>
        </article>
      </section>}

      {hasProjects && <TimelinePanel projects={projects} />}
      {hasProjects && <FooterPanels />}
    </main>
  );
}


function EmptyProjectsState({ onCreate }: { onCreate: () => void }) {
  return (
    <article className="project-panel empty-projects-panel">
      <span className="panel-icon">◎</span>
      <h2>Clean slate ready</h2>
      <p>No projects are loaded. Create your first project to populate the dashboard, timeline, actions, and overview systems.</p>
      <button type="button" className="projects-new-button compact" onClick={onCreate}>＋ Add First Project</button>
    </article>
  );
}

function AddProjectScreen({ draft, setDraft, draftSaved, onSaveDraft, onCreate, onBack, taskCount, setTaskCount, milestoneCount, setMilestoneCount }: { draft: Draft; setDraft: (draft: Draft) => void; draftSaved: boolean; onSaveDraft: () => void; onCreate: () => void; onBack: () => void; taskCount: number; setTaskCount: (updater: (count: number) => number) => void; milestoneCount: number; setMilestoneCount: (updater: (count: number) => number) => void }) {
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });

  return (
    <main className="projects-page projects-hud-page add-project-page fade-in">
      <div className="page-switch-row">
        <button type="button" className="back-link" onClick={onBack}>← Back to Projects</button>
        <div className="top-action-row"><button type="button" className="projects-new-button compact" onClick={onCreate}>＋ Create Project</button><button type="button" className="ghost-action" onClick={onSaveDraft}>▣ {draftSaved ? 'Draft Saved' : 'Save Draft'}</button></div>
      </div>
      <section className="projects-hero add-hero"><div><h1>Add Project</h1><p>Create a new project, set priorities, assign agents, and map the next steps.</p></div></section>

      <section className="add-project-layout">
        <div className="add-main-column">
          <FormPanel step="1" title="Project Setup" subtitle="Define the core details of your project.">
            <div className="form-grid two"><Field label="Project Name *" icon="▱"><input value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="Enter project name..." /></Field><Field label="One-sentence Description *" icon="▱"><input value={draft.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the project in one sentence..." /></Field></div>
            <div className="form-grid two slim"><ChoiceGroup label="Category" options={['AI', 'Dashboard', 'Content', 'Automation', 'Personal']} value={draft.category} onChange={(value) => update('category', value)} /><ChoiceGroup label="Priority" options={['High', 'Medium', 'Low']} value={draft.priority} onChange={(value) => update('priority', value as Priority)} variant="priority" /></div>
            <ChoiceGroup label="Status" options={['Active', 'Paused', 'Needs Review', 'Finished']} value={draft.status} onChange={(value) => update('status', value as ProjectStatus)} />
            <div className="form-grid two"><Field label="Start Date" icon="▣"><input value={draft.startDate} onChange={(e) => update('startDate', e.target.value)} /></Field><Field label="Due Date" icon="▣"><input value={draft.dueDate} onChange={(e) => update('dueDate', e.target.value)} placeholder="Select due date..." /></Field><Field label="Assigned Agent" icon="◉"><select value={draft.agent} onChange={(e) => update('agent', e.target.value)}>{agents.map((agent) => <option key={agent}>{agent}</option>)}</select></Field><Field label="Tags" icon="◇"><input value={draft.tags} onChange={(e) => update('tags', e.target.value)} placeholder="Add tags..." /></Field></div>
            <Field label="Next Step" icon="⚡"><input value={draft.nextStep} onChange={(e) => update('nextStep', e.target.value)} placeholder="What is the immediate next step for this project?" /></Field>
            <Field label="Notes / Project Summary" icon="▤"><textarea value={draft.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Provide a summary, goals, and key context for this project..." maxLength={1200} /></Field>
          </FormPanel>

          <FormPanel step="2" title="Project Structure & Progress" subtitle="Map the lifecycle, milestones, and success metrics.">
            <label className="range-field"><span>Initial Progress <b>{draft.progress}%</b></span><input type="range" min="0" max="100" value={draft.progress} onChange={(e) => update('progress', Number(e.target.value))} /></label>
            <div className="lifecycle-line">{lifecycle.map((item) => <span key={item}>◎<small>{item}</small></span>)}</div>
            <div className="milestone-metric-grid"><div className="mini-table"><h3>Milestones</h3>{Array.from({ length: milestoneCount }).map((_, index) => <div key={index} className="mini-row"><span>::</span><input value={['Project Kickoff & Research', 'Design & Architecture', 'Build & Development', 'Testing & QA', 'Launch & Handover'][index] ?? `Milestone ${index + 1}`} readOnly /><button type="button">▣</button></div>)}<button type="button" className="inline-add" onClick={() => setMilestoneCount((count) => count + 1)}>＋ Add Milestone</button></div><div className="mini-table"><h3>Success Metrics / Goal Outcomes</h3>{[1, 2, 3].map((item) => <div key={item} className="mini-row metric"><span>◈</span><input value="Define a key success metric..." readOnly /></div>)}<button type="button" className="inline-add">＋ Add Metric</button></div></div>
          </FormPanel>

          <FormPanel step="3" title="Initial Tasks" subtitle="Define the first set of actionable tasks.">
            <button type="button" className="inline-add panel-corner" onClick={() => setTaskCount((count) => count + 1)}>＋ Add Task</button>
            <div className="task-table">{Array.from({ length: taskCount }).map((_, index) => <div key={index} className="task-row"><span>::</span><b>{starterTasks[index] ?? `New project task ${index + 1}`}</b><small>{agents[index % agents.length]}</small><em>{index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}</em><button type="button">•••</button></div>)}</div>
          </FormPanel>

          <FormPanel step="4" title="Resources & Files" subtitle="Upload files, references, and links that support this project."><div className="resource-grid"><UploadBox title="Needed Files" /><UploadBox title="References" /><div className="link-box"><h3>Linked Docs</h3><div><input placeholder="Paste link to document or resource..." /><button type="button">＋ Add Link</button></div><small>No links added yet</small></div></div></FormPanel>

          <div className="bottom-create-bar"><div><span className="panel-icon tiny">◉</span><strong>Ready to create your project?</strong><small>Review all details on this page and create your project to get started.</small></div><button type="button" className="ghost-action" onClick={onSaveDraft}>Save Draft</button><button type="button" className="projects-new-button compact" onClick={onCreate}>＋ Create Project</button></div>
        </div>

        <aside className="add-side-column">
          <ProjectPreview draft={draft} />
          <SidePanel title="Suggested Agents" icon="♧"><AgentSuggestion name="Jarvis Assistant" role="AI Designer" tag="Best Match" /><AgentSuggestion name="Agent Workflow" role="Workflow Lead" tag="Strong Fit" /><AgentSuggestion name="Content Engine" role="Content Strategist" tag="Good Fit" /></SidePanel>
          <SidePanel title="Quick Tips" icon="☼"><ul className="tips-list"><li>Write a clear one-sentence description.</li><li>Set the next step to something actionable.</li><li>Add tags to make your project easy to discover.</li><li>Break the project into measurable milestones.</li></ul></SidePanel>
          <SidePanel title="Recommended Timeline" icon="◷"><div className="timeline-recommendations"><p><b>Start Date</b><span>Today</span></p><p><b>Target Midpoint</b><span>In 6 weeks</span></p><p><b>Target Completion</b><span>In 8 weeks</span></p><p><b>Buffer Time</b><span>+1 week</span></p></div></SidePanel>
        </aside>
      </section>
    </main>
  );
}

function ProjectOverviewScreen({ project, menuOpen, setMenuOpen, onBack, onEdit, onAddTask, taskCount, milestoneCount, setMilestoneCount }: { project: Project; menuOpen: boolean; setMenuOpen: (open: boolean) => void; onBack: () => void; onEdit: () => void; onAddTask: () => void; taskCount: number; milestoneCount: number; setMilestoneCount: (updater: (count: number) => number) => void }) {
  return (
    <main className="projects-page projects-hud-page overview-page fade-in">
      <div className="page-switch-row"><button type="button" className="back-link" onClick={onBack}>← Back to Projects</button><div className="top-action-row"><button type="button" className="ghost-action cyan" onClick={onEdit}>✎ Edit Project</button><button type="button" className="ghost-action cyan" onClick={() => document.getElementById('task-board')?.scrollIntoView({ behavior: 'smooth' })}>▦ Open Board</button><button type="button" className="square-action" onClick={() => setMenuOpen(!menuOpen)}>⋮</button>{menuOpen && <div className="mini-menu"><button type="button" onClick={() => setMenuOpen(false)}>Duplicate</button><button type="button" onClick={() => setMenuOpen(false)}>Archive</button></div>}</div></div>
      <section className="overview-title"><div className="project-card-icon large">{project.icon}</div><div><h1>{project.name}</h1><p>{project.description}</p></div><span className="status active">{project.status}</span><span className={`priority ${slug(project.priority)}`}>{project.priority} Priority</span></section>
      <section className="overview-metric-strip"><Metric title="Overall Progress" value={`${project.progress}%`} note="+14% vs last 7 days" progress={project.progress} /><Metric title="Last worked on" value={project.lastWorked} icon="◷" /><Metric title="Due date" value={project.dueDate} note="in 5 days" icon="▣" /><Metric title="Assigned agent" value={project.agent} icon="⌘" /><Metric title="Category" value={`${project.category} / Productivity`} icon="▱" /></section>

      <section className="overview-grid two-col">
        <article className="project-panel"><SectionTitle icon="ⓘ" title="Project Overview" /><InfoList items={[['Current Goal', project.nextStep], ['Next Step', 'Connect wearable data and improve analytics.'], ['Why It Matters', 'This system will help users build consistent habits through real-time insights and smart automation.'], ['Notes', project.notes]]} /></article>
        <article className="project-panel"><SectionTitle icon="☷" title="AI Project Summary" /><p className="panel-copy">{project.name} is tracking well with strong progress and clear momentum. Core dashboard components are taking shape and live data integration is almost complete.</p><h4>What’s going well</h4><ul className="check-list"><li>Dashboard layout and components are finalized</li><li>Habit data pipeline is stable and performing well</li><li>Agents are actively contributing and on track</li></ul><p className="priority-note">Recommended priority <span className={`priority ${slug(project.priority)}`}>{project.priority}</span></p></article>
      </section>

      <section className="overview-grid two-col">
        <article className="project-panel"><SectionTitle icon="◌" title="Milestones & Timeline" /><div className="lifecycle-line compact-line">{lifecycle.map((item) => <span className={item === 'Build' ? 'active' : ''} key={item}>◎<small>{item}</small></span>)}</div><div className="simple-table">{Array.from({ length: milestoneCount }).map((_, index) => <p key={index}><span>{['Dashboard layout finalized', 'Habit widgets connected', 'Live data integration', 'Testing & polish', 'Launch & feedback'][index] ?? `Milestone ${index + 1}`}</span><small>{['May 5, 2025', 'May 12, 2025', 'May 20, 2025', 'May 25, 2025', 'May 31, 2025'][index] ?? 'Jun 4, 2025'}</small><b>{index < 2 ? 'Completed' : index === 2 ? 'In Progress' : 'Upcoming'}</b></p>)}</div><button type="button" className="inline-add" onClick={() => setMilestoneCount((count) => count + 1)}>＋ Add Milestone</button></article>
        <article className="project-panel" id="task-board"><SectionTitle icon="▦" title="Task Board Snapshot" /><div className="kanban-grid">{['To Do', 'In Progress', 'Review', 'Done'].map((column, columnIndex) => <div key={column} className={`kanban-column col-${columnIndex}`}><h3>{column}<span>{[4, 3, 2, 6][columnIndex]}</span></h3>{Array.from({ length: columnIndex === 0 ? Math.min(taskCount, 4) : columnIndex + 1 }).map((_, index) => <p key={index}>{['Improve analytics visualizations', 'Connect wearable data API', 'Set up alert notifications', 'Dashboard layout finalized'][columnIndex] ?? `Task ${index + 1}`}</p>)}<button type="button" onClick={onAddTask}>＋ Add Task</button></div>)}</div></article>
      </section>

      <section className="overview-grid mixed">
        <article className="project-panel"><SectionTitle icon="◎" title="Current Focus" /><InfoList items={[['Current Task', project.nextStep], ['Blocked By', project.blockedBy], ['Needed Files', 'wearable_api_docs.pdf · analytics_spec_v2.md'], ['Sub-agents Involved', 'Data Analyst · System Architect · AI Engineer']]} /></article>
        <article className="project-panel"><SectionTitle icon="⌁" title="Recent Activity" /><ul className="activity-list">{updates.map((item, index) => <li key={item}><span>{index < 3 ? 'Today' : 'Yesterday'}, {['9:42 AM', '8:15 AM', '7:05 AM', '11:30 PM', '6:22 PM'][index]}</span>{item}<small>by {agents[index % agents.length]}</small></li>)}</ul></article>
        <article className="project-panel"><SectionTitle icon="▤" title="Resources & Files" /><ul className="file-stack">{files.map((file) => <li key={file}>▱ <span>{file}</span></li>)}</ul><button type="button" className="text-link">View all files →</button></article>
        <article className="project-panel"><SectionTitle icon="◇" title="Dependencies / Blockers" /><ul className="dependency-list"><li>Wearable API permissions <span className="priority high">High</span></li><li>Third-party analytics SDK <span className="priority medium">Medium</span></li><li>Data retention policy review <span className="priority low">Low</span></li></ul><button type="button" className="text-link">Manage dependencies →</button></article>
        <article className="project-panel metrics-panel"><SectionTitle icon="⌁" title="Metrics" /><div className="metric-donut">{project.progress}%</div><div className="metric-boxes"><p><span>Open Tasks</span><b>{taskCount + 4}</b></p><p><span>Days Active</span><b>23</b></p><p><span>Upcoming Deadlines</span><b>2 / 5</b></p></div></article>
      </section>

      <section className="overview-grid two-col"><article className="project-panel"><SectionTitle icon="☑" title="Project Notes" /><ul className="notes-list"><li><b>Focus on data quality</b><span>Live data accuracy is critical for habit predictions.</span></li><li><b>User feedback loop</b><span>Plan an in-app feedback widget after launch.</span></li><li><b>Performance target</b><span>Dashboard load time should be under 1.5s.</span></li></ul></article><article className="project-panel next-actions-panel"><SectionTitle icon="☑" title="Next Actions" /><ol>{[project.nextStep, 'Finalize analytics dashboard and charts', 'Set up habit prediction model', 'Write integration and performance tests', 'Review and fix outstanding issues', 'Prepare for internal QA and beta testing'].map((item) => <li key={item}>{item}</li>)}</ol></article></section>
      <article className="project-panel schedule-panel"><SectionTitle icon="▣" title="Upcoming Schedule" /><div className="schedule-cards">{['Integration Sync', 'Analytics Review', 'Milestone: Live Data Integration', 'QA Checkpoint', 'Launch & Feedback'].map((item, index) => <div key={item}><small>{['Tomorrow', 'Fri', 'Sun', 'Wed', 'Sat'][index]} · May {21 + index * 2}</small><b>{item}</b><span>{index === 2 ? 'All day' : 'Team standby & API update'}</span></div>)}</div></article>
    </main>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return <article className="project-overview-card clickable" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onOpen(); }}><div className="project-menu">⋮</div><header><div className="project-card-icon">{project.icon}</div><div className="project-title-copy"><h2>{project.name}</h2><p>{project.description}</p></div><div className="project-badges"><span className={`status ${slug(project.status)}`}>{project.status}</span><span className={`priority ${slug(project.priority)}`}>{project.priority}</span></div></header><p className="next-step"><b>Next step:</b> {project.nextStep}</p><div className="project-progress-line"><strong>{project.progress}%</strong><div><i style={{ width: `${project.progress}%` }} /></div></div><footer><div><span>Last worked on</span><strong>{project.lastWorked}</strong></div><div><span>{project.dueLabel}</span><strong>{project.dueDate}</strong></div><div><span>Agent</span><strong><em>⌘</em>{project.agent}</strong></div></footer>{project.status === 'Finished' && <div className="finished-check">✓</div>}</article>;
}

function ProjectDetailCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return <article className="project-panel detail-panel"><button type="button" aria-label={`Open ${project.name}`} className="detail-open" onClick={onOpen}>↗</button><div className="panel-heading"><span className="panel-icon">{project.icon}</span><h2>{project.name} <small>– Project Details</small></h2></div><dl><div><dt>Current Task</dt><dd>{project.nextStep}</dd></div><div><dt>Blocked By</dt><dd>{project.blockedBy}</dd></div><div><dt>Needed Files</dt><dd className="file-list"><span>▱ habit_data_schema.json</span><span>▱ widget_spec_v3.fig</span></dd></div><div><dt>Assigned Agent</dt><dd><span className="agent-chip">⌘ {project.agent}</span></dd></div><div><dt>Notes</dt><dd>{project.notes}</dd></div></dl></article>;
}

function TimelinePanel({ projects }: { projects: Project[] }) {
  return <section className="project-panel timeline-panel"><div className="timeline-head"><div className="panel-heading"><span className="panel-icon">☷</span><div><h2>Project Timeline Overview</h2><p>Track projects across the full lifecycle.</p></div></div><div className="timeline-stages">{lifecycle.map((stage) => <span key={stage} className={stage === 'Build' ? 'active' : ''}>{stage}</span>)}</div></div><div className="timeline-rows">{projects.slice(0, 4).map((item) => <div className="timeline-row" key={item.id}><span>{item.name}</span><div className="timeline-track"><i style={{ width: `${item.progress}%` }} /></div><strong>{item.progress}%</strong></div>)}</div></section>;
}

function FooterPanels() {
  return <section className="project-footer-grid"><article className="project-panel updates-panel"><h3>Recent Updates</h3><ul>{updates.slice(0, 4).map((text, index) => <li key={text}><span>{text}</span><small>{index === 0 ? 'Today 8:42 AM' : 'Yesterday 4:10 PM'}</small></li>)}</ul><button type="button" className="text-link">View all updates →</button></article><article className="project-panel insights-panel"><h3>Insights</h3><div className="insight-row cyan"><b>Most Active Project</b><span>Discipline OS<br />10 this week</span></div><div className="insight-row green"><b>Top Performer</b><span>Marketing Automation<br />100% efficiency</span></div><div className="insight-row red"><b>At Risk</b><span>Voice Command System<br />Low progress</span></div><button type="button" className="text-link">View all insights →</button></article><article className="project-panel calendar-panel"><div className="calendar-heading"><h3>Calendar Overview</h3><button type="button">This Week⌄</button></div><div className="calendar-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day}><strong>{day}</strong><span>✓</span><span>⌘</span><span>○</span><span>◇</span></div>)}</div><button type="button" className="text-link">View full calendar →</button></article><article className="project-panel deadlines-panel"><h3>Upcoming Deadlines</h3><ul>{['Discipline OS', 'Jarvis Assistant', 'Agent Workflow', 'Content Engine'].map((name, index) => <li key={name}><span>{name}</span><small>May {25 + index * 2}, 2025</small><b>{3 + index * 3} days</b></li>)}</ul><button type="button" className="text-link">View all deadlines →</button></article></section>;
}

function ProjectPreview({ draft }: { draft: Draft }) {
  return <SidePanel title="Project Preview" icon="◉"><div className="project-preview-card"><div className="project-card-icon tiny">▱</div><div><h3>{draft.name || 'Project Name'}</h3><p>{draft.description || 'One-sentence description will appear here...'}</p></div><span className="status active">{draft.status}</span><div className="project-progress-line"><strong>{draft.progress}%</strong><div><i style={{ width: `${draft.progress}%` }} /></div></div><footer><small>Due<br /><b>{draft.dueDate || 'May 11, 2025'}</b></small><small>Agent<br /><b>{draft.agent || 'Not assigned'}</b></small></footer></div></SidePanel>;
}

function StatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) {
  return <article className="project-stat-card"><div className="project-stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function FormPanel({ step, title, subtitle, children }: { step: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="form-panel project-panel"><div className="form-panel-title"><span>{step}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</section>;
}

function SidePanel({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <aside className="side-panel project-panel"><h2><span>{icon}</span>{title}</h2>{children}</aside>;
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return <label className="hud-field"><span>{label}</span><div><i>{icon}</i>{children}</div></label>;
}

function ChoiceGroup({ label, options, value, onChange, variant }: { label: string; options: string[]; value: string; onChange: (value: string) => void; variant?: string }) {
  return <div className="choice-group"><span>{label}</span><div>{options.map((option) => <button type="button" key={option} className={`${value === option ? 'active' : ''} ${variant === 'priority' ? slug(option) : ''}`} onClick={() => onChange(option)}>{option}</button>)}</div></div>;
}

function UploadBox({ title }: { title: string }) {
  return <div className="upload-box"><h3>▱ {title}</h3><button type="button">☁<span>Drag & drop files here<br />or click to upload</span></button><small>Supported: PDF, DOCX, XLSX, PPTX, ZIP</small></div>;
}

function AgentSuggestion({ name, role, tag }: { name: string; role: string; tag: string }) {
  return <button type="button" className="agent-suggestion"><span className="project-card-icon tiny">◉</span><b>{name}<small>{role}</small></b><em>{tag}</em></button>;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return <div className="section-title"><span>{icon}</span><h2>{title}</h2></div>;
}

function InfoList({ items }: { items: [string, string][] }) {
  return <dl className="info-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function Metric({ title, value, note, icon, progress }: { title: string; value: string; note?: string; icon?: string; progress?: number }) {
  return <div className="overview-metric"><span>{icon}</span><small>{title}</small><b>{value}</b>{typeof progress === 'number' && <div className="mini-progress"><i style={{ width: `${progress}%` }} /></div>}{note && <em>{note}</em>}</div>;
}

function project(id: string, name: string, description: string, icon: string, status: ProjectStatus, priority: Priority, category: string, nextStep: string, progress: number, lastWorked: string, dueDate: string, agent: string): Project {
  return { id, name, description, icon, status, priority, category, nextStep, progress, lastWorked, dueLabel: status === 'Finished' ? 'Completed on' : 'Due', dueDate, agent, blockedBy: 'Waiting on live data API from wearables.', notes: 'Live data integration will unlock predictive habit insights.' };
}

function priorityWeight(priority: Priority) {
  return { High: 3, Medium: 2, Low: 1 }[priority];
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-');
}
