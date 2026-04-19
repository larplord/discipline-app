'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import {
  DEFAULT_MACRO,
  DEFAULT_PROFILE,
  MUSCLE_GROUPS,
  type BodybuildingProfile,
  type DayWorkout,
  type MacroLog,
  type WorkoutExercise,
  type WorkoutSet,
} from '@/lib/fitness/bodybuildingTypes';
import '@/styles/pages/Fitness.css';

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#ec4899',
  Legs: '#3b82f6',
  Back: '#22c55e',
  Shoulders: '#a78bfa',
  Arms: '#f97316',
};

function mergeProfile(data: Record<string, unknown> | undefined): BodybuildingProfile {
  if (!data) return { ...DEFAULT_PROFILE };
  return {
    currentWeightLbs: Number(data.currentWeightLbs ?? DEFAULT_PROFILE.currentWeightLbs),
    goalWeightLbs: Number(data.goalWeightLbs ?? DEFAULT_PROFILE.goalWeightLbs),
    bodyGoal: (['cutting', 'bulking', 'maintenance'].includes(String(data.bodyGoal))
      ? (String(data.bodyGoal) as BodybuildingProfile['bodyGoal'])
      : DEFAULT_PROFILE.bodyGoal),
    progressRateLbsPerWeek: Number(data.progressRateLbsPerWeek ?? DEFAULT_PROFILE.progressRateLbsPerWeek),
    dailyCaloriesTarget: Number(data.dailyCaloriesTarget ?? DEFAULT_PROFILE.dailyCaloriesTarget),
    dailyProteinGTarget: Number(data.dailyProteinGTarget ?? DEFAULT_PROFILE.dailyProteinGTarget),
    proteinPerLb: Number(data.proteinPerLb ?? DEFAULT_PROFILE.proteinPerLb),
    lastWorkoutDate: data.lastWorkoutDate != null ? String(data.lastWorkoutDate) : null,
  };
}

function mergeMacro(data: Record<string, unknown> | undefined): MacroLog {
  if (!data) return { ...DEFAULT_MACRO };
  return {
    calories: Number(data.calories ?? DEFAULT_MACRO.calories),
    proteinG: Number(data.proteinG ?? DEFAULT_MACRO.proteinG),
  };
}

function parseWorkout(data: Record<string, unknown> | undefined): DayWorkout {
  const raw = data?.exercises;
  if (!Array.isArray(raw) || raw.length === 0) return { exercises: [] };
  const exercises: WorkoutExercise[] = raw.map((ex: Record<string, unknown>) => ({
    id: String(ex.id ?? crypto.randomUUID()),
    name: String(ex.name ?? 'Exercise'),
    muscleGroup: String(ex.muscleGroup ?? 'Chest'),
    sets: Array.isArray(ex.sets)
      ? (ex.sets as Record<string, unknown>[]).map((s) => ({
          id: String(s.id ?? crypto.randomUUID()),
          reps: Number(s.reps ?? 0),
          weightLbs: Number(s.weightLbs ?? 0),
          done: Boolean(s.done),
        }))
      : [],
  }));
  return { exercises };
}

function daysBetween(from: string | null, to: Date): number {
  if (!from) return 0;
  const a = new Date(from + 'T12:00:00');
  const b = new Date(to);
  b.setHours(12, 0, 0, 0);
  const diff = Math.floor((b.getTime() - a.getTime()) / (86400 * 1000));
  return Math.max(0, diff);
}

function weekStartKeys(): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    keys.push(
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    );
  }
  return keys;
}

function conicFromDistribution(counts: Record<string, number>): string {
  const entries = MUSCLE_GROUPS.map((g) => [g, counts[g] ?? 0] as const).filter(([, n]) => n > 0);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  if (total === 0) {
    return 'conic-gradient(var(--bg-elevated) 0deg 360deg)';
  }
  let acc = 0;
  const parts: string[] = [];
  for (const [g, n] of entries) {
    const deg = (n / total) * 360;
    const c = MUSCLE_COLORS[g] ?? '#64748b';
    parts.push(`${c} ${acc}deg ${acc + deg}deg`);
    acc += deg;
  }
  return `conic-gradient(${parts.join(', ')})`;
}

export function BodybuildingDashboard() {
  const { uid } = useUserData();
  const t = todayKey();
  const db = getFirestoreDb();
  const branchRef = useMemo(() => doc(db, 'users', uid, 'fitness', 'bodybuilding'), [db, uid]);

  const [profile, setProfile] = useState<BodybuildingProfile>(DEFAULT_PROFILE);
  const [profileDraft, setProfileDraft] = useState<BodybuildingProfile>(DEFAULT_PROFILE);
  const [macros, setMacros] = useState<MacroLog>(DEFAULT_MACRO);
  const [macrosDraft, setMacrosDraft] = useState<MacroLog>(DEFAULT_MACRO);
  const [workout, setWorkout] = useState<DayWorkout>({ exercises: [] });
  const [weekMuscleCounts, setWeekMuscleCounts] = useState<Record<string, number>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(branchRef, (snap) => {
      const p = mergeProfile(snap.data());
      setProfile(p);
      setProfileDraft(p);
    });
    return () => u1();
  }, [branchRef]);

  useEffect(() => {
    const ref = doc(db, 'users', uid, 'fitness', 'bodybuilding', 'macroLogs', t);
    const u = onSnapshot(ref, (snap) => {
      const m = mergeMacro(snap.data());
      setMacros(m);
      setMacrosDraft(m);
    });
    return () => u();
  }, [uid, t]);

  useEffect(() => {
    const ref = doc(db, 'users', uid, 'fitness', 'bodybuilding', 'workouts', t);
    const u = onSnapshot(ref, (snap) => {
      setWorkout(parseWorkout(snap.data() as Record<string, unknown> | undefined));
    });
    return () => u();
  }, [uid, t]);

  useEffect(() => {
    const col = collection(db, 'users', uid, 'fitness', 'bodybuilding', 'workouts');
    const u = onSnapshot(col, (snap) => {
      const keys = new Set(weekStartKeys());
      const counts: Record<string, number> = {};
      MUSCLE_GROUPS.forEach((g) => {
        counts[g] = 0;
      });
      snap.forEach((d) => {
        if (!keys.has(d.id)) return;
        const w = parseWorkout(d.data() as Record<string, unknown>);
        for (const ex of w.exercises) {
          for (const s of ex.sets) {
            if (s.done) counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
          }
        }
      });
      setWeekMuscleCounts(counts);
    });
    return () => u();
  }, [uid]);

  const saveProfile = useCallback(async () => {
    await setDoc(
      branchRef,
      {
        ...profileDraft,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }, [branchRef, profileDraft]);

  const saveMacrosSoon = useCallback(
    (next: MacroLog) => {
      setMacrosDraft(next);
      const ref = doc(db, 'users', uid, 'fitness', 'bodybuilding', 'macroLogs', t);
      void setDoc(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });
    },
    [db, uid, t]
  );

  const persistWorkout = useCallback(
    async (next: DayWorkout, options?: { bumpLastWorkout?: boolean }) => {
      const ref = doc(db, 'users', uid, 'fitness', 'bodybuilding', 'workouts', t);
      const payload: Record<string, unknown> = {
        exercises: next.exercises,
        date: t,
        updatedAt: serverTimestamp(),
      };
      if (options?.bumpLastWorkout) {
        await setDoc(branchRef, { lastWorkoutDate: t, updatedAt: serverTimestamp() }, { merge: true });
      }
      await setDoc(ref, payload, { merge: true });
    },
    [branchRef, db, uid, t]
  );

  const daysSince = daysBetween(profile.lastWorkoutDate, new Date());

  const musclePie = useMemo(() => {
    const entries = MUSCLE_GROUPS.map((g) => [g, weekMuscleCounts[g] ?? 0] as const).filter(([, n]) => n > 0);
    const total = entries.reduce((s, [, n]) => s + n, 0);
    const pct = (g: string) => (total ? Math.round(((weekMuscleCounts[g] ?? 0) / total) * 100) : 0);
    return { entries, total, pct, gradient: conicFromDistribution(weekMuscleCounts) };
  }, [weekMuscleCounts]);

  const remainingLbs = Math.abs(profileDraft.currentWeightLbs - profileDraft.goalWeightLbs);
  const weeklyCalories = profileDraft.dailyCaloriesTarget * 7;

  const calPct = Math.min(100, (macrosDraft.calories / Math.max(1, profileDraft.dailyCaloriesTarget)) * 100);
  const proPct = Math.min(100, (macrosDraft.proteinG / Math.max(1, profileDraft.dailyProteinGTarget)) * 100);

  async function addExercise() {
    const ex: WorkoutExercise = {
      id: crypto.randomUUID(),
      name: 'New exercise',
      muscleGroup: 'Chest',
      sets: [
        { id: crypto.randomUUID(), reps: 8, weightLbs: 0, done: false },
        { id: crypto.randomUUID(), reps: 8, weightLbs: 0, done: false },
      ],
    };
    const next = { exercises: [...workout.exercises, ex] };
    setWorkout(next);
    await persistWorkout(next);
  }

  async function removeExercise(id: string) {
    const next = { exercises: workout.exercises.filter((e) => e.id !== id) };
    setWorkout(next);
    await persistWorkout(next);
  }

  async function updateExercise(id: string, patch: Partial<WorkoutExercise>) {
    const next = {
      exercises: workout.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    };
    setWorkout(next);
    await persistWorkout(next);
  }

  async function addSet(exerciseId: string) {
    const next = {
      exercises: workout.exercises.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              sets: [
                ...e.sets,
                { id: crypto.randomUUID(), reps: e.sets[e.sets.length - 1]?.reps ?? 8, weightLbs: e.sets[e.sets.length - 1]?.weightLbs ?? 0, done: false },
              ],
            }
          : e
      ),
    };
    setWorkout(next);
    await persistWorkout(next);
  }

  async function updateSet(exerciseId: string, setId: string, patch: Partial<WorkoutSet>) {
    let toggledDone = false;
    const next = {
      exercises: workout.exercises.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) => {
                if (s.id !== setId) return s;
                if (patch.done === true && !s.done) toggledDone = true;
                return { ...s, ...patch };
              }),
            }
          : e
      ),
    };
    setWorkout(next);
    await persistWorkout(next, { bumpLastWorkout: toggledDone });
  }

  return (
    <div className="fitness-body-page">
      <section className="bb-nutrition-card bb-profile-form">
        <h2 className="bb-nutrition-title">Nutrition &amp; Goals</h2>
        <div className="bb-nutrition-grid">
          <div>
            <label className="section-label">Current weight</label>
            <input
              className="input"
              type="number"
              value={profileDraft.currentWeightLbs}
              onChange={(e) =>
                setProfileDraft((p) => ({ ...p, currentWeightLbs: Number(e.target.value) || 0 }))
              }
            />
            <div className="bb-stat-sub">lbs</div>
          </div>
          <div>
            <label className="section-label">Goal weight</label>
            <input
              className="input accent-blue"
              type="number"
              style={{ color: '#93c5fd' }}
              value={profileDraft.goalWeightLbs}
              onChange={(e) =>
                setProfileDraft((p) => ({ ...p, goalWeightLbs: Number(e.target.value) || 0 }))
              }
            />
            <div className="bb-stat-sub">lbs</div>
          </div>
          <div>
            <label className="section-label">Remaining</label>
            <div className="bb-stat-value">{remainingLbs.toFixed(1)} lbs</div>
            <div className="bb-stat-sub">to goal</div>
          </div>
          <div>
            <label className="section-label">Body goal</label>
            <select
              className="select"
              value={profileDraft.bodyGoal}
              onChange={(e) =>
                setProfileDraft((p) => ({
                  ...p,
                  bodyGoal: e.target.value as BodybuildingProfile['bodyGoal'],
                }))
              }
            >
              <option value="cutting">Cutting</option>
              <option value="bulking">Bulking</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className={`bb-goal-pill ${profileDraft.bodyGoal}`} style={{ marginTop: '0.5rem' }}>
              {profileDraft.bodyGoal === 'cutting' ? '↓' : profileDraft.bodyGoal === 'bulking' ? '↑' : '↔'}{' '}
              {profileDraft.bodyGoal.charAt(0).toUpperCase() + profileDraft.bodyGoal.slice(1)}
            </div>
          </div>
          <div>
            <label className="section-label">Progress rate</label>
            <input
              className="input"
              type="number"
              step={0.1}
              value={profileDraft.progressRateLbsPerWeek}
              onChange={(e) =>
                setProfileDraft((p) => ({
                  ...p,
                  progressRateLbsPerWeek: Number(e.target.value) || 0,
                }))
              }
            />
            <div className="bb-stat-sub">lbs / week</div>
          </div>
          <div>
            <label className="section-label">Daily calories</label>
            <input
              className="input"
              type="number"
              value={profileDraft.dailyCaloriesTarget}
              onChange={(e) =>
                setProfileDraft((p) => ({
                  ...p,
                  dailyCaloriesTarget: Number(e.target.value) || 0,
                }))
              }
            />
            <div className="bb-stat-sub">{weeklyCalories.toLocaleString()} / week</div>
          </div>
          <div>
            <label className="section-label">Daily protein</label>
            <input
              className="input"
              type="number"
              style={{ color: '#fb923c' }}
              value={profileDraft.dailyProteinGTarget}
              onChange={(e) =>
                setProfileDraft((p) => ({
                  ...p,
                  dailyProteinGTarget: Number(e.target.value) || 0,
                }))
              }
            />
            <div className="bb-stat-sub">g target</div>
          </div>
          <div>
            <label className="section-label">Protein / lb</label>
            <input
              className="input"
              type="number"
              step={0.05}
              value={profileDraft.proteinPerLb}
              onChange={(e) =>
                setProfileDraft((p) => ({ ...p, proteinPerLb: Number(e.target.value) || 0 }))
              }
            />
            <div className="bb-stat-sub">g per lb bodyweight</div>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveProfile()}>
            Save nutrition profile
          </button>
          {profileSaved && <span className="badge badge-green">Saved</span>}
        </div>

        <div className="bb-macros-section">
          <div className="bb-macros-title">Today&apos;s macros</div>
          <div className="bb-macro-row">
            <div className="bb-macro-row-head">
              <span className="bb-macro-label">Calories</span>
              <span className="bb-macro-nums">
                {macrosDraft.calories} / {profileDraft.dailyCaloriesTarget}
              </span>
            </div>
            <div className="bb-macro-bar">
              <div className="bb-macro-fill calories" style={{ width: `${calPct}%` }} />
            </div>
            <input
              className="input mt-2"
              type="number"
              min={0}
              value={macrosDraft.calories}
              onChange={(e) => saveMacrosSoon({ ...macrosDraft, calories: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="bb-macro-row">
            <div className="bb-macro-row-head">
              <span className="bb-macro-label">Protein</span>
              <span className="bb-macro-nums">
                {macrosDraft.proteinG}g / {profileDraft.dailyProteinGTarget}g
              </span>
            </div>
            <div className="bb-macro-bar">
              <div className="bb-macro-fill protein" style={{ width: `${proPct}%` }} />
            </div>
            <input
              className="input mt-2"
              type="number"
              min={0}
              value={macrosDraft.proteinG}
              onChange={(e) => saveMacrosSoon({ ...macrosDraft, proteinG: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </section>

      <div className="bb-training-row">
        <section className="bb-hero-card">
          <div className="bb-hero-label">Days since your last workout</div>
          <div className="bb-hero-num">{profile.lastWorkoutDate == null ? '—' : daysSince}</div>
          <p style={{ fontSize: '0.8rem', opacity: 0.85, lineHeight: 1.45 }}>
            {profile.lastWorkoutDate
              ? `Last session logged ${profile.lastWorkoutDate}.`
              : 'Log a completed set below to start your streak.'}
          </p>
          <div className="bb-hero-foot">
            <span>Muscle groups</span>
            <button type="button" className="bb-hero-switch" disabled title="Coming soon">
              Switch view
            </button>
          </div>
        </section>

        <section className="bb-analytics-card">
          <h3 className="bb-analytics-title">Muscle groups this week</h3>
          <div className="bb-pie-wrap">
            <div
              className="bb-pie"
              style={{
                background: musclePie.gradient,
              }}
            />
            <div className="bb-pie-legend">
              {musclePie.total === 0 ? (
                <p className="text-muted text-sm">Complete sets this week to see distribution.</p>
              ) : (
                MUSCLE_GROUPS.map((g) => {
                  const n = weekMuscleCounts[g] ?? 0;
                  if (n === 0) return null;
                  const p = musclePie.pct(g);
                  return (
                    <div key={g} className="bb-legend-row">
                      <div className="bb-legend-left">
                        <span className="bb-legend-dot" style={{ background: MUSCLE_COLORS[g] }} />
                        <span>
                          {g} — {n} sets ({p}%)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="bb-workout-card">
          <div className="bb-workout-head">
            <h3 className="bb-workout-title">Today&apos;s workout</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void addExercise()}>
              + Add exercise
            </button>
          </div>
          {workout.exercises.length === 0 ? (
            <p className="text-muted text-sm">No exercises yet. Add one to build your session.</p>
          ) : (
            workout.exercises.map((ex) => (
              <div key={ex.id} className="bb-exercise-card">
                <div className="bb-exercise-head">
                  <div className="w-full" style={{ minWidth: 0 }}>
                    <input
                      className="input bb-exercise-name"
                      value={ex.name}
                      onChange={(e) => void updateExercise(ex.id, { name: e.target.value })}
                    />
                    <select
                      className="select mt-1"
                      value={ex.muscleGroup}
                      onChange={(e) => void updateExercise(ex.id, { muscleGroup: e.target.value })}
                    >
                      {MUSCLE_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    title="Remove exercise"
                    onClick={() => void removeExercise(ex.id)}
                  >
                    Remove
                  </button>
                </div>
                {ex.sets.map((s, si) => (
                  <div key={s.id} className="bb-set-row">
                    <button
                      type="button"
                      className={`bb-set-check ${s.done ? 'done' : ''}`}
                      aria-label={`Set ${si + 1} done`}
                      onClick={() => void updateSet(ex.id, s.id, { done: !s.done })}
                    >
                      {s.done ? '✓' : ''}
                    </button>
                    <span className="bb-set-label">Set {si + 1}</span>
                    <input
                      className="bb-set-input"
                      type="number"
                      min={0}
                      placeholder="reps"
                      value={s.reps || ''}
                      onChange={(e) =>
                        void updateSet(ex.id, s.id, { reps: Number(e.target.value) || 0 })
                      }
                    />
                    <input
                      className="bb-set-input"
                      type="number"
                      min={0}
                      placeholder="lbs"
                      value={s.weightLbs || ''}
                      onChange={(e) =>
                        void updateSet(ex.id, s.id, { weightLbs: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                ))}
                <button type="button" className="bb-add-set" onClick={() => void addSet(ex.id)}>
                  + Add set
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
