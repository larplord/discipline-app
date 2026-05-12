'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import '@/styles/pages/Projects.css';

type ProjectLog = { id: string; text: string; createdAt: string };
type Project = {
  id: string;
  name: string;
  status: 'seed' | 'active' | 'paused' | 'shipped';
  category: string;
  outcome: string;
  currentVersion: string;
  nextMove: string;
  notes: string;
  logs: ProjectLog[];
  updatedAt?: unknown;
};

type ProjectDraft = Pick<Project, 'name' | 'status' | 'category' | 'outcome' | 'currentVersion' | 'nextMove' | 'notes'>;

const EMPTY_PROJECT: ProjectDraft = {
  name: '',
  status: 'seed',
  category: 'Business',
  outcome: '',
  currentVersion: '',
  nextMove: '',
  notes: '',
};

export default function ProjectsPage() {
  const { uid } = useUserData();
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState(EMPTY_PROJECT);
  const [editId, setEditId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logDrafts, setLogDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'users', uid, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: String(data.name ?? ''),
          status: (data.status ?? 'seed') as Project['status'],
          category: String(data.category ?? 'Business'),
          outcome: String(data.outcome ?? ''),
          currentVersion: String(data.currentVersion ?? ''),
          nextMove: String(data.nextMove ?? ''),
          notes: String(data.notes ?? ''),
          logs: Array.isArray(data.logs) ? data.logs : [],
          updatedAt: data.updatedAt,
        });
      });
      list.sort((a, b) => Number(statusWeight(b.status)) - Number(statusWeight(a.status)) || a.name.localeCompare(b.name));
      setProjects(list);
    });
  }, [uid]);

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const nextMoves = projects.filter((p) => p.nextMove.trim()).slice(0, 3);
  const categories = useMemo(() => [...new Set(projects.map((p) => p.category).filter(Boolean))], [projects]);

  function resetForm() {
    setDraft(EMPTY_PROJECT);
    setEditId(null);
  }

  async function saveProject() {
    if (!draft.name.trim()) return;
    const db = getFirestoreDb();
    const payload = { ...draft, updatedAt: serverTimestamp() };
    if (editId) {
      await updateDoc(doc(db, 'users', uid, 'projects', editId), payload);
    } else {
      await addDoc(collection(db, 'users', uid, 'projects'), { ...payload, logs: [] });
    }
    resetForm();
  }

  function startEdit(project: Project) {
    setEditId(project.id);
    setDraft({
      name: project.name,
      status: project.status,
      category: project.category,
      outcome: project.outcome,
      currentVersion: project.currentVersion,
      nextMove: project.nextMove,
      notes: project.notes,
    });
    setExpanded(project.id);
  }

  async function addLog(project: Project) {
    const text = logDrafts[project.id]?.trim();
    if (!text) return;
    const logs = [
      { id: crypto.randomUUID().slice(0, 8), text, createdAt: new Date().toISOString() },
      ...(project.logs ?? []),
    ];
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'projects', project.id), { logs, updatedAt: serverTimestamp() });
    setLogDrafts((current) => ({ ...current, [project.id]: '' }));
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return;
    await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'projects', id));
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Living experiments. Start messy, improve as the outcome gets clearer.</p>
          </div>
          <span className="badge badge-accent">{activeCount} active</span>
        </div>
      </div>

      <div className="page-body">
        <div className="projects-command-grid mb-4">
          <section className="card project-form-card">
            <div className="section-label">Growing project</div>
            <h2>{editId ? 'Edit project' : 'Capture a project'}</h2>
            <p className="project-form-sub">Do not force a perfect final outcome. Define the current version and the next move.</p>
            <div className="project-form-grid">
              <input className="input" placeholder="Project name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              <select className="select" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Project['status'] }))}>
                <option value="seed">Seed idea</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="shipped">Shipped</option>
              </select>
              <input className="input" placeholder="Category: AI, Money, Health..." value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} />
              <input className="input" placeholder="Current version" value={draft.currentVersion} onChange={(e) => setDraft((d) => ({ ...d, currentVersion: e.target.value }))} />
            </div>
            <textarea className="textarea mt-3" rows={3} placeholder="Possible outcome — allowed to change later" value={draft.outcome} onChange={(e) => setDraft((d) => ({ ...d, outcome: e.target.value }))} />
            <textarea className="textarea mt-3" rows={2} placeholder="Next move" value={draft.nextMove} onChange={(e) => setDraft((d) => ({ ...d, nextMove: e.target.value }))} />
            <textarea className="textarea mt-3" rows={3} placeholder="Notes, open questions, ideas to test" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
            <div className="project-form-actions">
              <button type="button" className="btn btn-primary" onClick={() => void saveProject()}>{editId ? 'Save Changes' : '+ Add Project'}</button>
              {editId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
            </div>
          </section>

          <section className="card project-next-card">
            <div className="section-label">Noen&apos;s project rule</div>
            <h2>Every project needs one next move</h2>
            <p>If a project has no next move, it is not active — it is just a thought with a nicer outfit.</p>
            <div className="project-next-list">
              {nextMoves.length === 0 ? <span className="text-muted text-sm">No next moves yet.</span> : nextMoves.map((p) => (
                <div key={p.id} className="project-next-item">
                  <strong>{p.name}</strong>
                  <span>{p.nextMove}</span>
                </div>
              ))}
            </div>
            {categories.length > 0 && <p className="project-category-line">Categories: {categories.join(' · ')}</p>}
          </section>
        </div>

        <div className="projects-list">
          {projects.length === 0 ? (
            <div className="card empty-state"><p>No projects yet. Add your first messy project.</p></div>
          ) : projects.map((project) => {
            const open = expanded === project.id;
            return (
              <article key={project.id} className={`card project-card ${open ? 'open' : ''}`}>
                <div className="project-card-head" onClick={() => setExpanded(open ? null : project.id)} role="presentation">
                  <div>
                    <div className="project-title-row">
                      <h3>{project.name}</h3>
                      <span className={`project-status status-${project.status}`}>{project.status}</span>
                    </div>
                    <p>{project.currentVersion || project.outcome || 'No version written yet.'}</p>
                  </div>
                  <div className="project-card-actions">
                    <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); startEdit(project); }}>✎</button>
                    <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); void deleteProject(project.id); }}>🗑</button>
                    <span>{open ? '▼' : '▶'}</span>
                  </div>
                </div>
                {open && (
                  <div className="project-card-body">
                    <div className="project-detail-grid">
                      <div><span>Outcome</span><p>{project.outcome || 'Unknown yet. That is okay.'}</p></div>
                      <div><span>Next move</span><p>{project.nextMove || 'Needs one.'}</p></div>
                      <div><span>Notes</span><p>{project.notes || 'No notes yet.'}</p></div>
                    </div>
                    <div className="project-log-box">
                      <div className="section-label">Evolution log</div>
                      <div className="project-log-input">
                        <input className="input" placeholder="What changed or what did you learn?" value={logDrafts[project.id] ?? ''} onChange={(e) => setLogDrafts((d) => ({ ...d, [project.id]: e.target.value }))} />
                        <button type="button" className="btn btn-ghost" onClick={() => void addLog(project)}>Add</button>
                      </div>
                      <div className="project-log-list">
                        {(project.logs ?? []).length === 0 ? <p className="text-muted text-sm">No updates yet.</p> : project.logs.slice(0, 5).map((log) => (
                          <div key={log.id} className="project-log-item">
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                            <p>{log.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function statusWeight(status: Project['status']) {
  return { active: 4, seed: 3, paused: 2, shipped: 1 }[status] ?? 0;
}
