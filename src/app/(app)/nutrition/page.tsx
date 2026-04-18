'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import { todayKey } from '@/lib/dates';
import '@/styles/pages/Nutrition.css';

const DEFAULT_TARGETS = { fat: 70, protein: 180, carbs: 220 };

const toNum = (value: string | number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function NutritionPage() {
  const { uid } = useUserData();
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [intake, setIntake] = useState({ fat: 0, protein: 0, carbs: 0 });

  useEffect(() => {
    const db = getFirestoreDb();
    const t = todayKey();
    const u1 = onSnapshot(doc(db, 'users', uid, 'nutritionTargets', 'default'), (snap) => {
      const d = snap.data();
      setTargets({
        fat: Number(d?.fat ?? DEFAULT_TARGETS.fat),
        protein: Number(d?.protein ?? DEFAULT_TARGETS.protein),
        carbs: Number(d?.carbs ?? DEFAULT_TARGETS.carbs),
      });
    });
    const u2 = onSnapshot(doc(db, 'users', uid, 'nutritionIntake', t), (snap) => {
      const d = snap.data();
      setIntake({
        fat: Number(d?.fat ?? 0),
        protein: Number(d?.protein ?? 0),
        carbs: Number(d?.carbs ?? 0),
      });
    });
    return () => {
      u1();
      u2();
    };
  }, [uid]);

  async function saveTargets(e: React.FormEvent) {
    e.preventDefault();
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', uid, 'nutritionTargets', 'default'), targets, { merge: true });
  }

  async function saveIntake(e: React.FormEvent) {
    e.preventDefault();
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', uid, 'nutritionIntake', todayKey()), intake, { merge: true });
  }

  const rows = [
    { key: 'fat' as const, label: 'Fat', colorClass: 'macro-fill-fat' },
    { key: 'protein' as const, label: 'Protein', colorClass: 'macro-fill-protein' },
    { key: 'carbs' as const, label: 'Carbs', colorClass: 'macro-fill-carbs' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Nutrition</h1>
        <p className="page-subtitle">Track your daily macros and adjust targets anytime.</p>
      </div>

      <div className="page-body nutrition-grid">
        <div className="card">
          <div className="section-label mb-2">Macro Targets (grams)</div>
          <form className="nutrition-form" onSubmit={saveTargets}>
            <MacroInput label="Fat" value={targets.fat} onChange={(v) => setTargets((p) => ({ ...p, fat: v }))} />
            <MacroInput
              label="Protein"
              value={targets.protein}
              onChange={(v) => setTargets((p) => ({ ...p, protein: v }))}
            />
            <MacroInput label="Carbs" value={targets.carbs} onChange={(v) => setTargets((p) => ({ ...p, carbs: v }))} />
            <button type="submit" className="btn btn-primary">
              Save Targets
            </button>
          </form>
        </div>

        <div className="card">
          <div className="section-label mb-2">Today&apos;s Intake (grams)</div>
          <form className="nutrition-form" onSubmit={saveIntake}>
            <MacroInput label="Fat" value={intake.fat} onChange={(v) => setIntake((p) => ({ ...p, fat: v }))} />
            <MacroInput
              label="Protein"
              value={intake.protein}
              onChange={(v) => setIntake((p) => ({ ...p, protein: v }))}
            />
            <MacroInput label="Carbs" value={intake.carbs} onChange={(v) => setIntake((p) => ({ ...p, carbs: v }))} />
            <button type="submit" className="btn btn-primary">
              Save Intake
            </button>
          </form>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="section-label mb-2">Progress</div>
          <div className="nutrition-progress-list">
            {rows.map(({ key, label, colorClass }) => {
              const target = toNum(targets[key]);
              const current = toNum(intake[key]);
              const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
              return (
                <div className="macro-row" key={key}>
                  <div className="macro-header">
                    <span>{label}</span>
                    <span className="text-sm text-muted">
                      {current}g / {target}g
                    </span>
                  </div>
                  <div className="progress-wrap">
                    <div className={`progress-bar ${colorClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="macro-input">
      <span className="text-sm">{label}</span>
      <input
        className="input"
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(toNum(e.target.value))}
      />
    </label>
  );
}
