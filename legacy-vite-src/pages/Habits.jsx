import { useState, useEffect } from 'react';
import { habitStore, habitLogStore, calcStreak, weekProgress, todayProgress, today } from '../store.js';
import './Habits.css';

const CATEGORIES = ['fitness','learning','business','mindset','sleep','health','other'];
const EMOJIS = { fitness:'🏋️', learning:'📚', business:'💼', mindset:'🧠', sleep:'😴', health:'🥗', other:'⚡' };

export default function Habits({ onRefresh }) {
  const [habits,   setHabits]   = useState([]);
  const [dayLog,   setDayLog]   = useState({});
  const [filter,   setFilter]   = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEdit]   = useState(null);

  function load() {
    setHabits(habitStore.getAll());
    setDayLog(habitLogStore.getDay(today()));
  }
  useEffect(load, []);

  function toggle(id) {
    habitLogStore.toggle(id);
    setDayLog(habitLogStore.getDay(today()));
    onRefresh?.();
  }

  function onSave(data) {
    if (editTarget) {
      habitStore.update(editTarget.id, data);
    } else {
      habitStore.add(data);
    }
    setShowForm(false);
    setEdit(null);
    load();
    onRefresh?.();
  }

  function onDelete(id) {
    if (!confirm('Delete this habit?')) return;
    habitStore.delete(id);
    load();
    onRefresh?.();
  }

  const filtered = filter === 'all' ? habits : habits.filter(h => h.category === filter);
  const todayPct = todayProgress();
  const weekPct  = weekProgress();

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="page-title">Habit Tracker</h1>
            <p className="page-subtitle">Build unbreakable consistency, one day at a time.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>
            + New Habit
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div className="habits-stats">
          <div className="hstat card">
            <div className="hstat-val" style={{ color:'var(--green-light)' }}>{todayPct}%</div>
            <div className="hstat-label">Today</div>
            <div className="progress-wrap mt-2"><div className="progress-bar green" style={{ width:`${todayPct}%` }} /></div>
          </div>
          <div className="hstat card">
            <div className="hstat-val" style={{ color:'var(--accent-light)' }}>{weekPct}%</div>
            <div className="hstat-label">This Week</div>
            <div className="progress-wrap mt-2"><div className="progress-bar" style={{ width:`${weekPct}%` }} /></div>
          </div>
          <div className="hstat card">
            <div className="hstat-val" style={{ color:'var(--gold-light)' }}>{habits.length}</div>
            <div className="hstat-label">Total Habits</div>
          </div>
          <div className="hstat card">
            <div className="hstat-val" style={{ color:'var(--gold-light)' }}>
              {Math.max(...habits.map(h => calcStreak(h.id)), 0)}d
            </div>
            <div className="hstat-label">Best Streak</div>
          </div>
        </div>

        {/* Category filter */}
        <div className="habit-filter-row">
          {['all', ...CATEGORIES].map(c => (
            <button
              key={c}
              className={`filter-pill ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Habit list */}
        {filtered.length === 0 ? (
          <div className="card empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>No habits yet. Add your first one!</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Habit</button>
          </div>
        ) : (
          <div className="habit-list">
            {filtered.map(h => {
              const done   = !!dayLog[h.id];
              const streak = calcStreak(h.id);
              return (
                <div key={h.id} className={`habit-card card ${done ? 'done' : ''}`}>
                  <button className={`habit-toggle ${done ? 'checked' : ''}`} onClick={() => toggle(h.id)}>
                    {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </button>

                  <div className="habit-emoji-large">{h.emoji || EMOJIS[h.category] || '⚡'}</div>

                  <div className="habit-info">
                    <div className="habit-name-large">{h.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge cat-${h.category}`}>{h.category}</span>
                      {streak > 0 && <span className="streak-pill">🔥 {streak} day streak</span>}
                    </div>
                  </div>

                  <div className="habit-actions">
                    <button className="btn-icon" title="Edit" onClick={() => { setEdit(h); setShowForm(true); }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button className="btn-icon" title="Delete" onClick={() => onDelete(h.id)}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--red)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <HabitForm
          initial={editTarget}
          onSave={onSave}
          onClose={() => { setShowForm(false); setEdit(null); }}
        />
      )}
    </div>
  );
}

function HabitForm({ initial, onSave, onClose }) {
  const [name,     setName]     = useState(initial?.name     ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'mindset');
  const [emoji,    setEmoji]    = useState(initial?.emoji    ?? '');

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, emoji: emoji || EMOJIS[category] || '⚡' });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'Edit Habit' : 'New Habit'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="flex-col gap-4" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label className="section-label">Habit Name</label>
            <input className="input" placeholder="e.g. Morning workout" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="section-label">Category</label>
            <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="section-label">Emoji (optional)</label>
            <input className="input" placeholder={`Default: ${EMOJIS[category]}`} value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} />
          </div>
          <div className="flex gap-3" style={{ marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full">Save Habit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
