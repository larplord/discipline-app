'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import type { Goal } from '@/lib/types';
import '@/styles/pages/GoalDetail.css';

function goalProgress(goal: Goal) {
  const ms = goal.milestones ?? [];
  if (!ms.length) return 0;
  return Math.round((ms.filter((m) => m.done).length / ms.length) * 100);
}

export default function GoalDetailPage() {
  const { uid } = useUserData();
  const params = useParams<{ goalId: string }>();
  const goalId = params.goalId;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [newMilestone, setNewMilestone] = useState('');

  useEffect(() => {
    const ref = doc(getFirestoreDb(), 'users', uid, 'goals', goalId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setGoal(null);
        return;
      }
      setGoal({ id: snap.id, ...(snap.data() as Omit<Goal, 'id'>) });
    });
  }, [uid, goalId]);

  const pct = goal ? goalProgress(goal) : 0;
  const completed = useMemo(() => goal?.milestones?.filter((m) => m.done).length ?? 0, [goal]);
  const total = goal?.milestones?.length ?? 0;

  async function toggleMs(msId: string) {
    if (!goal) return;
    const milestones = (goal.milestones ?? []).map((m) => m.id === msId ? { ...m, done: !m.done } : m);
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'goals', goal.id), { milestones });
  }

  async function addMs() {
    if (!goal) return;
    const text = newMilestone.trim();
    if (!text) return;
    const milestones = [...(goal.milestones ?? []), { id: crypto.randomUUID().slice(0, 8), text, done: false }];
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'goals', goal.id), { milestones });
    setNewMilestone('');
  }

  async function deleteMs(msId: string) {
    if (!goal) return;
    const milestones = (goal.milestones ?? []).filter((m) => m.id !== msId);
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'goals', goal.id), { milestones });
  }

  if (!goal) {
    return (
      <main className="goal-detail-page">
        <Link href="/system" className="goal-detail-back">← System</Link>
        <div className="goal-detail-empty">Goal not found.</div>
      </main>
    );
  }

  return (
    <main className="goal-detail-page fade-in">
      <div className="goal-detail-grid-bg" aria-hidden />
      <div className="goal-detail-wrap">
        <div className="goal-detail-nav">
          <Link href="/system" className="goal-detail-back">← Habits / Goals / Routines</Link>
          <span>Goals / {goal.title}</span>
        </div>

        <section className="goal-detail-layout">
          <div className="goal-detail-main">
            <header className="goal-detail-hero">
              <div>
                <div className="goal-detail-title-row">
                  <h1>{goal.title}</h1>
                  <span className={`goal-detail-dot ${goal.priority}`} />
                </div>
                <p>{goal.deadline ?? 'No deadline'}</p>
              </div>
              <strong>{pct}%</strong>
            </header>

            <section className="goal-detail-card goal-milestone-card">
              <div className="goal-detail-card-head">
                <div>
                  <span>Milestones</span>
                  <h2>With sub actions to finish the milestone</h2>
                </div>
                <em>{completed}/{total} complete</em>
              </div>
              <div className="goal-detail-milestones">
                {(goal.milestones ?? []).length === 0 ? <p className="goal-detail-muted">No milestones yet. Add the first sub-action.</p> : goal.milestones.map((m) => (
                  <div key={m.id} className={`goal-detail-ms ${m.done ? 'done' : ''}`}>
                    <button type="button" onClick={() => void toggleMs(m.id)}>{m.done ? '✓' : ''}</button>
                    <span>{m.text}</span>
                    <button type="button" className="goal-detail-delete" onClick={() => void deleteMs(m.id)}>×</button>
                  </div>
                ))}
              </div>
              <div className="goal-detail-add">
                <input className="input" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} placeholder="New milestone or sub action..." />
                <button type="button" className="btn btn-primary" onClick={() => void addMs()}>Add</button>
              </div>
            </section>
          </div>

          <aside className="goal-detail-side">
            <section className="goal-detail-card objective-card">
              <span>Objective of the goal</span>
              <p>{goal.description || 'Write a clear objective later. For now, finish the next milestone.'}</p>
            </section>

            <section className="goal-detail-card goal-progress-card">
              <span>Progress + deadline</span>
              <div className="goal-detail-progress"><div style={{ width: `${pct}%` }} /></div>
              <div className="goal-detail-progress-row"><strong>{pct}% complete</strong><em>{goal.deadline ?? 'No deadline'}</em></div>
              <div className="goal-next-action">
                <span>Next action</span>
                <p>{goal.milestones?.find((m) => !m.done)?.text ?? 'All milestones complete. Decide the next upgrade.'}</p>
              </div>
              <div className="goal-activity-box">
                <span>Recent activity</span>
                <p>{completed} milestones complete out of {total || 0}. Keep this moving with one concrete action.</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
