'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import { DAILY_SCORE } from '@/lib/scoringConfig';
import '@/styles/pages/Focus.css';

const MODES = [
  { id: 'work', label: 'Deep Work', minutes: 60, color: 'var(--accent-light)' },
  { id: 'short', label: 'Short Break', minutes: 10, color: 'var(--green-light)' },
  { id: 'long', label: 'Long Break', minutes: 30, color: 'var(--gold-light)' },
  { id: 'custom', label: 'Custom', minutes: 45, color: 'var(--text-primary)' },
] as const;

export default function FocusPage() {
  const { uid } = useUserData();
  const [modeId, setModeId] = useState<(typeof MODES)[number]['id']>('work');
  const [customMin, setCustomMin] = useState(45);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [seconds, setSeconds] = useState(60 * 60);
  const [sessions, setSessions] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSuccess, setRecordSuccess] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRecordedRef = useRef(false);

  const mode = MODES.find((m) => m.id === modeId)!;
  const totalSec = modeId === 'custom' ? customMin * 60 : mode.minutes * 60;

  useEffect(() => {
    const db = getFirestoreDb();
    const t = todayKey();
    return onSnapshot(doc(db, 'users', uid, 'focusLogs', t), (snap) => {
      setSessions(Number(snap.data()?.count ?? 0));
    });
  }, [uid]);

  function switchMode(id: (typeof MODES)[number]['id']) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionRecordedRef.current = false;
    setRunning(false);
    setCompleted(false);
    setRecording(false);
    setRecordError(null);
    setRecordSuccess(false);
    setModeId(id);
    const m = MODES.find((x) => x.id === id)!;
    const mins = id === 'custom' ? customMin : m.minutes;
    setSeconds(mins * 60);
  }

  useEffect(() => {
    setSeconds(totalSec);
    setCompleted(false);
    setRecordError(null);
    setRecordSuccess(false);
  }, [customMin, modeId, totalSec]);

  async function recordFocusSession() {
    if (!(modeId === 'work' || modeId === 'custom')) return;
    if (sessionRecordedRef.current || recording) return;

    setRecording(true);
    setRecordError(null);
    try {
      const db = getFirestoreDb();
      const t = todayKey();
      const ref = doc(db, 'users', uid, 'focusLogs', t);
      await runTransaction(db, async (trx) => {
        const snap = await trx.get(ref);
        const n = Number(snap.data()?.count ?? 0) + 1;
        trx.set(ref, { count: n, updatedAt: serverTimestamp() }, { merge: true });
      });
      sessionRecordedRef.current = true;
      setRecordSuccess(true);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Session complete', { body: 'Great work. Take a break.' });
      }
    } catch (e: unknown) {
      setRecordError(e instanceof Error ? e.message : 'Could not save session. Try again.');
    } finally {
      setRecording(false);
    }
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            void recordFocusSession();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, modeId, uid, recording]);

  function start() {
    if (completed || seconds <= 0) return;
    if (seconds === totalSec) sessionRecordedRef.current = false;
    setRecordError(null);
    setRecordSuccess(false);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionRecordedRef.current = false;
    setRunning(false);
    setCompleted(false);
    setRecording(false);
    setRecordError(null);
    setRecordSuccess(false);
    setSeconds(totalSec);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const pct = ((totalSec - seconds) / totalSec) * 100;
  const circ = 2 * Math.PI * 90;
  const off = circ - (pct / 100) * circ;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Focus Timer</h1>
        <p className="page-subtitle">Deep work is your competitive advantage. Protect it.</p>
      </div>

      <div className="page-body">
        <div className="focus-modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-btn ${modeId === m.id ? 'active' : ''}`}
              style={modeId === m.id ? { borderColor: m.color, color: m.color } : {}}
              onClick={() => switchMode(m.id)}
            >
              {m.label}
              <span className="mode-time">{m.id === 'custom' ? `${customMin}m` : `${m.minutes}m`}</span>
            </button>
          ))}
        </div>

        {modeId === 'custom' && !running && (
          <div className="custom-range">
            <label className="section-label">Duration: {customMin} minutes</label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={customMin}
              onChange={(e) => {
                setCustomMin(Number(e.target.value));
                setSeconds(Number(e.target.value) * 60);
              }}
              className="range-input"
            />
          </div>
        )}

        <div className="timer-center">
          <div className="timer-ring-wrap" style={{ ['--ring-color' as string]: mode.color }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="90" fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
              <circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke={mode.color}
                strokeWidth="12"
                strokeDasharray={circ}
                strokeDashoffset={off}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                style={{
                  transition: running ? 'stroke-dashoffset 1s linear' : 'none',
                }}
              />
              <text
                x="110"
                y="100"
                textAnchor="middle"
                fill={mode.color}
                fontSize="46"
                fontWeight="900"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="-2"
              >
                {mm}:{ss}
              </text>
              <text x="110" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="14" fontFamily="Inter">
                {running ? mode.label : completed ? 'Complete' : 'Ready'}
              </text>
            </svg>
          </div>

          <div className="timer-controls">
            {!running ? (
              <button type="button" className="btn btn-primary timer-btn" onClick={start} disabled={completed || seconds === 0}>
                {completed || seconds === 0 ? '✓ Done' : '▶ Start'}
              </button>
            ) : (
              <button type="button" className="btn btn-ghost timer-btn" onClick={pause}>
                ⏸ Pause
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={reset}>
              ↺ Reset
            </button>
          </div>
          {completed && (modeId === 'work' || modeId === 'custom') && (
            <div className={`focus-save-state card ${recordError ? 'error' : recordSuccess ? 'success' : ''}`}>
              <div>
                <strong>
                  {recording
                    ? 'Saving session...'
                    : recordError
                      ? 'Could not save session.'
                      : recordSuccess
                        ? `Session saved. +${DAILY_SCORE.focusPerSession} points added.`
                        : 'Session complete.'}
                </strong>
                {recordError && <p>{recordError}</p>}
              </div>
              {recordError && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void recordFocusSession()} disabled={recording}>
                  Retry save
                </button>
              )}
            </div>
          )}
          {completed && !(modeId === 'work' || modeId === 'custom') && (
            <div className="focus-save-state card">
              <strong>Break complete.</strong>
              <p>Break timers do not add points.</p>
            </div>
          )}
        </div>

        <div className="focus-points-card card">
          <div>
            <div className="section-label">Points</div>
            <p>
              Deep Work and Custom sessions add <strong>+{DAILY_SCORE.focusPerSession} points</strong> when the timer reaches 0.
              Break timers do not add points.
            </p>
          </div>
          <div className="focus-points-score">
            +{sessions * DAILY_SCORE.focusPerSession}
            <span>today</span>
          </div>
        </div>

        <div className="sessions-row">
          {Array.from({ length: Math.max(sessions + 1, 4) }, (_, i) => (
            <div key={i} className={`session-dot ${i < sessions ? 'done' : ''}`}>
              {i < sessions ? '⚡' : '○'}
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-muted mt-2">
          {sessions === 0
            ? "No sessions yet. Let's go."
            : `${sessions} deep work session${sessions !== 1 ? 's' : ''} completed today`}
        </div>
      </div>
    </div>
  );
}
