'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { RoutineTimePicker } from '@/components/RoutineTimePicker';
import type { Routine } from '@/lib/types';
import {
  closestDisplayMarkerOffset,
  formatTimeLabel,
  generateRoutineDisplayMarkers,
  getRoutineProgress,
  routineStatusLabel,
  validateRoutineTimes,
} from '@/lib/routines';
import '@/styles/pages/Routine.css';

export default function RoutineDetailPage() {
  const params = useParams<{ routineId: string }>();
  const routineId = params.routineId;
  const { uid } = useUserData();
  const db = getFirestoreDb();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<'timeline' | 'list' | null>(null);
  const [draftTask, setDraftTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      doc(db, 'users', uid, 'routines', routineId),
      (snap) => setRoutine(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Routine, 'id'>) }) : null),
      () => setRoutine(null)
    );
  }, [db, routineId, uid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const markers = useMemo(() => {
    if (!routine) return [];
    return generateRoutineDisplayMarkers(routine);
  }, [routine]);

  const progress = routine ? getRoutineProgress(routine.startTime, routine.endTime, now) : null;
  const currentOffset = progress ? closestDisplayMarkerOffset(markers, Math.min(progress.passedMinutes, progress.duration)) : 0;
  const majorMarkers = markers.filter((marker) => marker.isMajor);
  const fitTimeline = progress ? progress.duration <= 180 : true;

  function openTaskEditor(timeLabel: string, source: 'timeline' | 'list') {
    if (!routine) return;
    setActiveMarker(timeLabel);
    setActiveEditor(source);
    setDraftTask(routine.steps?.[timeLabel] ?? '');
  }

  async function saveTask(timeLabel: string, text = draftTask) {
    if (!routine) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', uid, 'routines', routine.id), {
        steps: {
          ...(routine.steps ?? {}),
          [timeLabel]: text.trim(),
        },
        updatedAt: serverTimestamp(),
      });
      setActiveMarker(null);
      setActiveEditor(null);
      setDraftTask('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save task.');
    } finally {
      setSaving(false);
    }
  }

  function openNextEmptyStep() {
    const next = majorMarkers.find((marker) => !marker.task) ?? majorMarkers[0];
    if (next) openTaskEditor(next.timeLabel, 'list');
  }

  async function updateRoutineSettings(changes: Partial<Pick<Routine, 'name' | 'startTime' | 'endTime' | 'majorIntervalMinutes'>>) {
    if (!routine) return;
    const next = { ...routine, ...changes };
    const timingError = validateRoutineTimes(next.startTime, next.endTime);
    if (timingError) {
      setError(timingError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', uid, 'routines', routine.id), {
        ...changes,
        updatedAt: serverTimestamp(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not update routine.');
    } finally {
      setSaving(false);
    }
  }

  if (!routine || !progress) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Routine</h1>
          <p className="page-subtitle">Loading routine timeline...</p>
        </div>
        <div className="page-body">
          <div className="card empty-state">
            <p>If this keeps loading, the routine may not exist anymore.</p>
            <Link href="/routine" className="btn btn-ghost">Back to Routine</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="routine-detail-hud fade-in">
      <div className="routine-detail-bg" aria-hidden="true" />
      <div className="page-header routine-detail-top">
        <Link href="/routine" className="routine-back-link">← Routine list</Link>
        <div className="routine-detail-header">
          <div>
            <h1 className="page-title">{routine.name}</h1>
            <p className="page-subtitle">
              {formatTimeLabel(routine.startTime)} - {formatTimeLabel(routine.endTime)} · {progress.duration} minutes
            </p>
          </div>
          <div className={`routine-status big ${progress.status}`}>{routineStatusLabel(progress.status)}</div>
        </div>
      </div>

      <div className="page-body routine-page">
        {error && <div className="routine-alert">{error}</div>}

        <section className="routine-settings card routine-control-bar">
          <label>
            <span className="section-label">Name</span>
            <input
              className="input"
              value={routine.name}
              onChange={(e) => void updateRoutineSettings({ name: e.target.value })}
              disabled={saving}
            />
          </label>
          <RoutineTimePicker
            label="Start"
            value={routine.startTime}
            onChange={(value) => void updateRoutineSettings({ startTime: value })}
            disabled={saving}
          />
          <RoutineTimePicker
            label="End"
            value={routine.endTime}
            onChange={(value) => void updateRoutineSettings({ endTime: value })}
            disabled={saving}
          />
          <label>
            <span className="section-label">Major markers</span>
            <select
              className="select"
              value={routine.majorIntervalMinutes}
              onChange={(e) => void updateRoutineSettings({ majorIntervalMinutes: Number(e.target.value) as 5 | 15 })}
              disabled={saving}
            >
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
            </select>
          </label>
        </section>

        <section className="routine-timeline-card card routine-detail-panel">
          <div className="routine-timeline-top">
            <div>
              <div className="routine-section-title">Timeline</div>
              <p className="routine-section-sub">Click a large marker to add what you want to do at that time.</p>
            </div>
            <div className="routine-progress-badge">
              {progress.pct}%
              <span>{progress.passedMinutes}/{progress.duration} min</span>
            </div>
          </div>

          <div className="routine-timeline-scroll">
            <div
              className={`routine-timeline-track ${fitTimeline ? 'fit' : 'scrolling'}`}
              style={{ ['--marker-count' as string]: markers.length }}
            >
              {markers.map((marker) => {
                const passed = marker.minuteOffset <= progress.passedMinutes;
                const current = marker.minuteOffset === currentOffset;
                const editable = marker.isMajor;
                return (
                  <div
                    key={`${marker.timeLabel}-${marker.minuteOffset}`}
                    className={`routine-marker ${marker.isMajor ? 'major' : 'minor'} ${marker.labelPosition} ${passed ? 'passed' : ''} ${current ? 'current' : ''}`}
                  >
                    {editable && <div className="routine-marker-time">{formatTimeLabel(marker.timeLabel)}</div>}
                    <button
                      type="button"
                      className="routine-dot"
                      aria-label={editable ? `Edit task for ${formatTimeLabel(marker.timeLabel)}` : formatTimeLabel(marker.timeLabel)}
                      onClick={() => editable && openTaskEditor(marker.timeLabel, 'timeline')}
                      disabled={!editable}
                    />
                    {editable && (
                      <div className="routine-marker-task">
                        {activeMarker === marker.timeLabel && activeEditor === 'timeline' ? (
                          <input
                            className="routine-task-input"
                            value={draftTask}
                            autoFocus
                            placeholder="Add task"
                            onChange={(e) => setDraftTask(e.target.value)}
                            onBlur={() => void saveTask(marker.timeLabel)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                              if (e.key === 'Escape') {
                                setActiveMarker(null);
                                setActiveEditor(null);
                                setDraftTask('');
                              }
                            }}
                          />
                        ) : (
                          <button type="button" className="routine-task-button" onClick={() => openTaskEditor(marker.timeLabel, 'timeline')}>
                            {marker.task || 'Add task'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="routine-step-list card routine-detail-panel">
          <div className="routine-timeline-top">
            <div>
              <div className="routine-section-title">Routine steps</div>
              <p className="routine-section-sub">These timestamps match the large markers on your timeline.</p>
            </div>
          </div>

          <div className="routine-step-rows">
            {majorMarkers.map((marker) => {
              const passed = marker.minuteOffset <= progress.passedMinutes;
              const current = marker.minuteOffset === currentOffset;
              const active = activeMarker === marker.timeLabel && activeEditor === 'list';
              return (
                <div key={`row-${marker.timeLabel}-${marker.minuteOffset}`} className={`routine-step-row ${passed ? 'passed' : ''} ${current ? 'current' : ''}`}>
                  <button
                    type="button"
                    className="routine-step-dot"
                    aria-label={`Edit task for ${formatTimeLabel(marker.timeLabel)}`}
                    onClick={() => openTaskEditor(marker.timeLabel, 'list')}
                  />
                  <div className="routine-step-time">{formatTimeLabel(marker.timeLabel)}</div>
                  <div className="routine-step-body">
                    {active ? (
                      <input
                        className="routine-step-input"
                        value={draftTask}
                        autoFocus
                        placeholder="Add task"
                        onChange={(e) => setDraftTask(e.target.value)}
                        onBlur={() => void saveTask(marker.timeLabel)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') {
                            setActiveMarker(null);
                            setActiveEditor(null);
                            setDraftTask('');
                          }
                        }}
                      />
                    ) : (
                      <button type="button" className="routine-step-task" onClick={() => openTaskEditor(marker.timeLabel, 'list')}>
                        {marker.task || 'Add task'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" className="routine-add-step-button" onClick={openNextEmptyStep}>
            <span>+</span> Add Step
          </button>
        </section>
      </div>
    </div>
  );
}
