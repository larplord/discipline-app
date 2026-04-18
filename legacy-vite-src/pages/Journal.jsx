import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { journalStore, today } from '../store.js';
import './Journal.css';

const PROMPTS = [
  { key: 'well',    label: 'What did I do well today?',         placeholder: "Wins, actions you're proud of..." },
  { key: 'avoided', label: 'What did I avoid or procrastinate?', placeholder: 'Be honest. No judgment — just clarity.' },
  { key: 'improve', label: 'What will I do better tomorrow?',   placeholder: 'Concrete actions, not vague intentions...' },
];

export default function Journal() {
  const [selectedDate, setDate] = useState(today());
  const [entry,        setEntry] = useState({ well:'', avoided:'', improve:'', freeform:'' });
  const [saved,        setSaved] = useState(false);
  const [history,      setHistory] = useState([]);

  useEffect(() => {
    setEntry(journalStore.getDay(selectedDate));
    setSaved(false);
  }, [selectedDate]);

  useEffect(() => {
    // Build history list (last 30 days with entries)
    const all = journalStore.getAll();
    const list = Object.entries(all)
      .filter(([, e]) => e.well || e.avoided || e.improve || e.freeform)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30);
    setHistory(list);
  }, [saved]);

  function handleChange(key, val) {
    const updated = { ...entry, [key]: val };
    setEntry(updated);
    journalStore.save(selectedDate, updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    const e   = journalStore.getAll()[key];
    const hasEntry = !!(e?.well || e?.avoided || e?.improve || e?.freeform);
    return { key, label: i === 0 ? 'Today' : format(d, 'MMM d'), hasEntry };
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="page-title">Daily Journal</h1>
            <p className="page-subtitle">Reflect. Recalibrate. Rise.</p>
          </div>
          {saved && <span className="badge badge-green" style={{ fontSize:'0.8rem', padding:'0.4rem 0.9rem' }}>✓ Saved</span>}
        </div>
      </div>

      <div className="page-body">
        {/* Day selector */}
        <div className="day-selector">
          {recentDays.map(d => (
            <button
              key={d.key}
              className={`day-btn ${selectedDate === d.key ? 'active' : ''} ${d.hasEntry ? 'has-entry' : ''}`}
              onClick={() => setDate(d.key)}
            >
              {d.label}
              {d.hasEntry && <span className="entry-dot" />}
            </button>
          ))}
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={e => setDate(e.target.value)}
            style={{ width:'auto', padding:'0.35rem 0.6rem', fontSize:'0.8rem' }}
          />
        </div>

        <div className="journal-layout">
          {/* Prompt sections */}
          <div className="journal-prompts">
            {PROMPTS.map(p => (
              <div key={p.key} className="card journal-prompt-card">
                <label className="journal-prompt-label">{p.label}</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder={p.placeholder}
                  value={entry[p.key] ?? ''}
                  onChange={e => handleChange(p.key, e.target.value)}
                  style={{ marginTop:'0.6rem' }}
                />
              </div>
            ))}

            {/* Free-form */}
            <div className="card journal-prompt-card">
              <label className="journal-prompt-label">Additional thoughts</label>
              <textarea
                className="textarea"
                rows={6}
                placeholder="Anything else on your mind — ideas, reflections, plans..."
                value={entry.freeform ?? ''}
                onChange={e => handleChange('freeform', e.target.value)}
                style={{ marginTop:'0.6rem' }}
              />
            </div>
          </div>

          {/* History sidebar */}
          <div className="journal-history">
            <h3 className="mb-3">Past Entries</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted">No past entries yet.</p>
            ) : history.map(([date, e]) => (
              <button
                key={date}
                className={`history-item ${selectedDate === date ? 'active' : ''}`}
                onClick={() => setDate(date)}
              >
                <div className="history-date">{format(new Date(date + 'T12:00:00'), 'MMM d, yyyy')}</div>
                <div className="history-preview">{(e.well || e.freeform || '').slice(0, 60) || 'Entry recorded'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
