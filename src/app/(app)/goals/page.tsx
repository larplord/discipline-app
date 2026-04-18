'use client';

import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import type { Goal } from '@/lib/types';
import '@/styles/pages/Goals.css';

const PRIORITIES = ['high', 'medium', 'low'];
const TYPES = ['short', 'long'] as const;

function goalProgress(goal: Goal) {
  const ms = goal.milestones ?? [];
  if (!ms.length) return 0;
  return Math.round((ms.filter((m) => m.done).length / ms.length) * 100);
}

export default function GoalsPage() {
  const { uid } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Goal | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newMs, setNewMs] = useState<Record<string, string>>({});

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'users', uid, 'goals'), (snap) => {
      const g: Goal[] = [];
      snap.forEach((d) => g.push({ id: d.id, ...(d.data() as Omit<Goal, 'id'>) }));
      setGoals(g);
    });
  }, [uid]);

  async function onSave(data: Omit<Goal, 'id' | 'milestones'> & { milestones?: Goal['milestones'] }) {
    const db = getFirestoreDb();
    if (editTarget) {
      await updateDoc(doc(db, 'users', uid, 'goals', editTarget.id), data);
    } else {
      await addDoc(collection(db, 'users', uid, 'goals'), { ...data, milestones: data.milestones ?? [] });
    }
    setShowForm(false);
    setEditTarget(null);
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this goal?')) return;
    await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'goals', id));
  }

  async function toggleMs(goalId: string, msId: string) {
    const db = getFirestoreDb();
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    const milestones = (g.milestones ?? []).map((m) =>
      m.id === msId ? { ...m, done: !m.done } : m
    );
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), { milestones });
  }

  async function addMs(goalId: string) {
    const text = newMs[goalId]?.trim();
    if (!text) return;
    const db = getFirestoreDb();
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    const id = crypto.randomUUID().slice(0, 8);
    const milestones = [...(g.milestones ?? []), { id, text, done: false }];
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), { milestones });
    setNewMs((n) => ({ ...n, [goalId]: '' }));
  }

  async function deleteMs(goalId: string, msId: string) {
    const db = getFirestoreDb();
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    const milestones = (g.milestones ?? []).filter((m) => m.id !== msId);
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), { milestones });
  }

  const shortGoals = goals.filter((g) => g.type === 'short');
  const longGoals = goals.filter((g) => g.type === 'long');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Goals</h1>
            <p className="page-subtitle">Define your mission. Break it down. Execute.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            + New Goal
          </button>
        </div>
      </div>

      <div className="page-body">
        {goals.length === 0 && (
          <div className="card empty-state">
            <p>No goals yet. Set your first one.</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
              + New Goal
            </button>
          </div>
        )}

        {shortGoals.length > 0 && (
          <GoalSection
            title="Short-Term Goals"
            goals={shortGoals}
            expanded={expanded}
            setExpanded={setExpanded}
            toggleMs={toggleMs}
            addMs={addMs}
            deleteMs={deleteMs}
            newMs={newMs}
            setNewMs={setNewMs}
            onEdit={(g) => { setEditTarget(g); setShowForm(true); }}
            onDelete={onDelete}
          />
        )}
        {longGoals.length > 0 && (
          <GoalSection
            title="Long-Term Goals"
            goals={longGoals}
            expanded={expanded}
            setExpanded={setExpanded}
            toggleMs={toggleMs}
            addMs={addMs}
            deleteMs={deleteMs}
            newMs={newMs}
            setNewMs={setNewMs}
            onEdit={(g) => { setEditTarget(g); setShowForm(true); }}
            onDelete={onDelete}
          />
        )}
      </div>

      {showForm && (
        <GoalForm
          initial={editTarget}
          onSave={onSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function GoalSection({
  title,
  goals,
  expanded,
  setExpanded,
  toggleMs,
  addMs,
  deleteMs,
  newMs,
  setNewMs,
  onEdit,
  onDelete,
}: {
  title: string;
  goals: Goal[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  toggleMs: (g: string, m: string) => void;
  addMs: (g: string) => void;
  deleteMs: (g: string, m: string) => void;
  newMs: Record<string, string>;
  setNewMs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <h3 className="mt-4 mb-3">{title}</h3>
      <div className="goal-list">
        {goals.map((g) => {
          const pct = goalProgress(g);
          const open = expanded === g.id;
          return (
            <div key={g.id} className="card goal-card">
              <div className="goal-header" onClick={() => setExpanded(open ? null : g.id)} role="presentation">
                <div>
                  <div className="goal-title-row">
                    <span className="goal-title">{g.title}</span>
                    <span className={`priority-dot ${g.priority}`} />
                  </div>
                  <div className="goal-meta">
                    <span className="text-xs text-muted">{g.deadline ?? 'No deadline'}</span>
                    <span className="text-xs text-accent">{pct}%</span>
                  </div>
                </div>
                <div className="goal-actions">
                  <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(g); }}>
                    ✎
                  </button>
                  <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}>
                    🗑
                  </button>
                  <span className="expand-icon">{open ? '▼' : '▶'}</span>
                </div>
              </div>
              {open && (
                <div className="goal-body">
                  {g.description && <p className="text-sm text-muted mb-3">{g.description}</p>}
                  <div className="section-label mb-2">Milestones</div>
                  <div className="milestone-list">
                    {(g.milestones ?? []).map((m) => (
                      <div key={m.id} className="milestone-row">
                        <button type="button" className={`ms-check ${m.done ? 'done' : ''}`} onClick={() => toggleMs(g.id, m.id)}>
                          {m.done ? '✓' : ''}
                        </button>
                        <span className={m.done ? 'ms-done' : ''}>{m.text}</span>
                        <button type="button" className="btn-icon ms-del" onClick={() => deleteMs(g.id, m.id)}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      className="input"
                      placeholder="New milestone..."
                      value={newMs[g.id] ?? ''}
                      onChange={(e) => setNewMs((n) => ({ ...n, [g.id]: e.target.value }))}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => addMs(g.id)}>
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function GoalForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Goal | null;
  onSave: (d: Omit<Goal, 'id' | 'milestones'> & { milestones?: Goal['milestones'] }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<(typeof TYPES)[number]>(initial?.type ?? 'short');
  const [priority, setPriority] = useState(initial?.priority ?? 'medium');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      type,
      priority,
      deadline: deadline || undefined,
      description: description.trim() || undefined,
      milestones: initial?.milestones ?? [],
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'Edit Goal' : 'New Goal'}</h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="section-label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid-2">
            <div>
              <label className="section-label">Type</label>
              <select className="select" value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'short' ? 'Short-term' : 'Long-term'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-label">Priority</label>
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="section-label">Deadline</label>
            <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="section-label">Description</label>
            <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn btn-ghost w-full" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
