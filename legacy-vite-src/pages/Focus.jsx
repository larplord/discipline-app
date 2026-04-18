import { useState, useEffect, useRef } from 'react';
import { focusStore } from '../store.js';
import './Focus.css';

const MODES = [
  { id: 'work',       label: 'Deep Work',  minutes: 60, color: 'var(--accent-light)' },
  { id: 'short',      label: 'Short Break',minutes: 10, color: 'var(--green-light)'  },
  { id: 'long',       label: 'Long Break', minutes: 30, color: 'var(--gold-light)'   },
  { id: 'custom',     label: 'Custom',     minutes: 45, color: 'var(--text-primary)'  },
];

export default function Focus({ onRefresh }) {
  const [modeId,    setModeId]    = useState('work');
  const [customMin, setCustomMin] = useState(45);
  const [running,   setRunning]   = useState(false);
  const [seconds,   setSeconds]   = useState(60 * 60);
  const [sessions,  setSessions]  = useState(focusStore.getToday());
  const intervalRef = useRef(null);

  const mode     = MODES.find(m => m.id === modeId);
  const totalSec = modeId === 'custom' ? customMin * 60 : mode.minutes * 60;

  // Switch mode → reset
  function switchMode(id) {
    clearInterval(intervalRef.current);
    setRunning(false);
    setModeId(id);
    const m    = MODES.find(x => x.id === id);
    const mins = id === 'custom' ? customMin : m.minutes;
    setSeconds(mins * 60);
  }

  useEffect(() => {
    setSeconds(totalSec);
  }, [customMin]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            // Session complete — record if it was a work session
            if (modeId === 'work' || modeId === 'custom') {
              const n = focusStore.addSession();
              setSessions(n);
              onRefresh?.();
              // Browser notification
              if (Notification.permission === 'granted') {
                new Notification('Session complete ⚡', { body: 'Great work. Take a break.' });
              }
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, modeId]);

  function start() {
    if (Notification.permission === 'default') Notification.requestPermission();
    setRunning(true);
  }
  function pause()  { setRunning(false); }
  function reset()  { clearInterval(intervalRef.current); setRunning(false); setSeconds(totalSec); }

  const mm   = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss   = String(seconds % 60).padStart(2, '0');
  const pct  = ((totalSec - seconds) / totalSec) * 100;
  const circ = 2 * Math.PI * 90;
  const off  = circ - (pct / 100) * circ;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Focus Timer</h1>
        <p className="page-subtitle">Deep work is your competitive advantage. Protect it.</p>
      </div>

      <div className="page-body">
        {/* Mode tabs */}
        <div className="focus-modes">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-btn ${modeId === m.id ? 'active' : ''}`}
              style={modeId === m.id ? { borderColor: m.color, color: m.color } : {}}
              onClick={() => switchMode(m.id)}
            >
              {m.label}
              <span className="mode-time">{m.id === 'custom' ? `${customMin}m` : `${m.minutes}m`}</span>
            </button>
          ))}
        </div>

        {/* Custom duration */}
        {modeId === 'custom' && !running && (
          <div className="custom-range">
            <label className="section-label">Duration: {customMin} minutes</label>
            <input
              type="range" min={5} max={120} step={5}
              value={customMin}
              onChange={e => { setCustomMin(Number(e.target.value)); setSeconds(Number(e.target.value) * 60); }}
              className="range-input"
            />
          </div>
        )}

        {/* Timer ring */}
        <div className="timer-center">
          <div className="timer-ring-wrap" style={{ '--ring-color': mode.color }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="90" fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
              <circle
                cx="110" cy="110" r="90" fill="none"
                stroke={mode.color} strokeWidth="12"
                strokeDasharray={circ}
                strokeDashoffset={off}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none', filter: `drop-shadow(0 0 8px ${mode.color}60)` }}
              />
              <text x="110" y="100" textAnchor="middle" fill={mode.color} fontSize="46" fontWeight="900" fontFamily="'JetBrains Mono', monospace" letterSpacing="-2">
                {mm}:{ss}
              </text>
              <text x="110" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="14" fontFamily="Inter">
                {running ? mode.label : 'Ready'}
              </text>
            </svg>
          </div>

          {/* Controls */}
          <div className="timer-controls">
            {!running ? (
              <button className="btn btn-primary timer-btn" onClick={start} disabled={seconds === 0}>
                {seconds === 0 ? '✓ Done' : '▶ Start'}
              </button>
            ) : (
              <button className="btn btn-ghost timer-btn" onClick={pause}>⏸ Pause</button>
            )}
            <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
          </div>
        </div>

        {/* Session counter */}
        <div className="sessions-row">
          {Array.from({ length: Math.max(sessions + 1, 4) }, (_, i) => (
            <div key={i} className={`session-dot ${i < sessions ? 'done' : ''}`}>
              {i < sessions ? '⚡' : '○'}
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-muted mt-2">
          {sessions === 0 ? "No sessions yet. Let's go." : `${sessions} deep work session${sessions !== 1 ? 's' : ''} completed today`}
        </div>

        {/* Tips */}
        <div className="focus-tips card mt-4">
          <div className="section-label mb-3">Maximize Your Focus</div>
          <div className="tips-grid">
            {[
              { icon:'📵', tip:'Phone in another room. Not pocket. Not desk. Another room.' },
              { icon:'🎧', tip:'Use noise-cancelling headphones or white noise.' },
              { icon:'📋', tip:'Define ONE specific task before starting the timer.' },
              { icon:'💧', tip:'Hydrate before each session. Brain needs water.' },
            ].map((t, i) => (
              <div key={i} className="tip-item">
                <span className="tip-icon">{t.icon}</span>
                <span className="tip-text">{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
