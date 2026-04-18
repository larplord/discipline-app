import { useState, useEffect } from 'react';
import { goalStore, goalProgress } from '../store.js';
import './Goals.css';

const PRIORITIES = ['high','medium','low'];
const TYPES      = ['short','long'];

export default function Goals({ onRefresh }) {
  const [goals,    setGoals]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEdit]   = useState(null);
  const [expanded,   setExpanded] = useState(null);
  const [newMs,  setNewMs]  = useState({});

  function load() { setGoals(goalStore.getAll()); }
  useEffect(load, []);

  function onSave(data) {
    if (editTarget) { goalStore.update(editTarget.id, data); }
    else            { goalStore.add(data); }
    setShowForm(false); setEdit(null);
    load(); onRefresh?.();
  }

  function onDelete(id) {
    if (!confirm('Delete this goal?')) return;
    goalStore.delete(id); load(); onRefresh?.();
  }

  function toggleMs(goalId, msId) {
    goalStore.toggleMilestone(goalId, msId); load();
  }

  function addMs(goalId) {
    const text = newMs[goalId]?.trim();
    if (!text) return;
    goalStore.addMilestone(goalId, text);
    setNewMs(n => ({ ...n, [goalId]: '' }));
    load();
  }

  function deleteMs(goalId, msId) {
    goalStore.deleteMilestone(goalId, msId); load();
  }

  const shortGoals = goals.filter(g => g.type === 'short');
  const longGoals  = goals.filter(g => g.type === 'long');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="page-title">Goals</h1>
            <p className="page-subtitle">Define your mission. Break it down. Execute.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>
            + New Goal
          </button>
        </div>
      </div>

      <div className="page-body">
        {goals.length === 0 && (
          <div className="card empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <p>No goals yet. Set your first one.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Goal</button>
          </div>
        )}

        {shortGoals.length > 0 && (
          <GoalSection
            title="Short-Term Goals" goals={shortGoals}
            expanded={expanded} setExpanded={setExpanded}
            toggleMs={toggleMs} addMs={addMs} deleteMs={deleteMs}
            newMs={newMs} setNewMs={setNewMs}
            onEdit={g => { setEdit(g); setShowForm(true); }}
            onDelete={onDelete}
          />
        )}
        {longGoals.length > 0 && (
          <GoalSection
            title="Long-Term Goals" goals={longGoals}
            expanded={expanded} setExpanded={setExpanded}
            toggleMs={toggleMs} addMs={addMs} deleteMs={deleteMs}
            newMs={newMs} setNewMs={setNewMs}
            onEdit={g => { setEdit(g); setShowForm(true); }}
            onDelete={onDelete}
          />
        )}
      </div>

      {showForm && (
        <GoalForm initial={editTarget} onSave={onSave} onClose={() => { setShowForm(false); setEdit(null); }} />
      )}
    </div>
  );
}

function GoalSection({ title, goals, expanded, setExpanded, toggleMs, addMs, deleteMs, newMs, setNewMs, onEdit, onDelete }) {
  return (
    <div className="goal-section">
      <h3 className="mb-3">{title}</h3>
      <div className="goal-list">
        {goals.map(g => {
          const pct  = goalProgress(g);
          const isEx = expanded === g.id;
          const ms   = g.milestones ?? [];
          return (
            <div key={g.id} className={`goal-card card ${isEx ? 'expanded' : ''}`}>
              <div className="goal-card-header" onClick={() => setExpanded(isEx ? null : g.id)}>
                <div className="flex items-center gap-3" style={{ flex:1, minWidth:0 }}>
                  <div className={`goal-priority-dot priority-${g.priority}`} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="goal-title">{g.title}</div>
                    {g.deadline && <div className="text-xs text-muted mt-1">📅 {g.deadline}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="goal-pct" style={{ color: pct === 100 ? 'var(--green-light)' : 'var(--accent-light)' }}>{pct}%</div>
                  <span className={`badge ${g.priority === 'high' ? 'badge-red' : g.priority === 'medium' ? 'badge-gold' : 'badge-muted'}`}>{g.priority}</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ transform: isEx ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s', flexShrink:0, color:'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              <div className="progress-wrap" style={{ margin:'0.75rem 0 0.25rem' }}>
                <div className="progress-bar" style={{ width:`${pct}%` }} />
              </div>
              <div className="text-xs text-muted">{ms.filter(m => m.done).length} / {ms.length} milestones</div>

              {isEx && (
                <div className="goal-detail fade-in">
                  <hr className="divider" />
                  {g.description && <p className="text-sm text-muted mb-4">{g.description}</p>}

                  <div className="section-label mb-2">Milestones</div>
                  <div className="milestone-list">
                    {ms.map(m => (
                      <div key={m.id} className={`milestone-item ${m.done ? 'done' : ''}`}>
                        <button className={`milestone-check ${m.done ? 'checked' : ''}`} onClick={() => toggleMs(g.id, m.id)}>
                          {m.done && '✓'}
                        </button>
                        <span className="milestone-text">{m.text}</span>
                        <button className="btn-icon" style={{ marginLeft:'auto', padding:'0.2rem' }} onClick={() => deleteMs(g.id, m.id)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        className="input"
                        placeholder="Add milestone..."
                        value={newMs[g.id] ?? ''}
                        onChange={e => setNewMs(n => ({ ...n, [g.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMs(g.id); } }}
                      />
                      <button className="btn btn-ghost" onClick={() => addMs(g.id)}>Add</button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(g)}>Edit goal</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(g.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalForm({ initial, onSave, onClose }) {
  const [title,    setTitle]    = useState(initial?.title    ?? '');
  const [type,     setType]     = useState(initial?.type     ?? 'short');
  const [priority, setPriority] = useState(initial?.priority ?? 'medium');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [desc,     setDesc]     = useState(initial?.description ?? '');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), type, priority, deadline, description: desc, milestones: initial?.milestones ?? [] });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'Edit Goal' : 'New Goal'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label className="section-label">Goal Title</label>
            <input className="input" placeholder="e.g. Launch my first business" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid-2">
            <div>
              <label className="section-label">Type</label>
              <select className="select" value={type} onChange={e => setType(e.target.value)}>
                <option value="short">Short-Term</option>
                <option value="long">Long-Term</option>
              </select>
            </div>
            <div>
              <label className="section-label">Priority</label>
              <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="section-label">Deadline</label>
            <input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="section-label">Description (optional)</label>
            <textarea className="textarea" rows={3} placeholder="What does achieving this mean to you?" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full">Save Goal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
