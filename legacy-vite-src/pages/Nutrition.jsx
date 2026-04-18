import { useState } from 'react';
import { nutritionStore, today } from '../store.js';
import './Nutrition.css';

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function Nutrition() {
  const [targets, setTargets] = useState(nutritionStore.getTargets());
  const [intake, setIntake] = useState(nutritionStore.getDay(today()));

  function saveTargets(e) {
    e.preventDefault();
    const saved = nutritionStore.saveTargets(targets);
    setTargets(saved);
  }

  function saveIntake(e) {
    e.preventDefault();
    const saved = nutritionStore.saveDay(today(), intake);
    setIntake(saved);
  }

  const rows = [
    { key: 'fat', label: 'Fat', colorClass: 'macro-fill-fat' },
    { key: 'protein', label: 'Protein', colorClass: 'macro-fill-protein' },
    { key: 'carbs', label: 'Carbs', colorClass: 'macro-fill-carbs' },
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
            <MacroInput
              label="Fat"
              value={targets.fat}
              onChange={(value) => setTargets((prev) => ({ ...prev, fat: value }))}
            />
            <MacroInput
              label="Protein"
              value={targets.protein}
              onChange={(value) => setTargets((prev) => ({ ...prev, protein: value }))}
            />
            <MacroInput
              label="Carbs"
              value={targets.carbs}
              onChange={(value) => setTargets((prev) => ({ ...prev, carbs: value }))}
            />
            <button type="submit" className="btn btn-primary">Save Targets</button>
          </form>
        </div>

        <div className="card">
          <div className="section-label mb-2">Today&apos;s Intake (grams)</div>
          <form className="nutrition-form" onSubmit={saveIntake}>
            <MacroInput
              label="Fat"
              value={intake.fat}
              onChange={(value) => setIntake((prev) => ({ ...prev, fat: value }))}
            />
            <MacroInput
              label="Protein"
              value={intake.protein}
              onChange={(value) => setIntake((prev) => ({ ...prev, protein: value }))}
            />
            <MacroInput
              label="Carbs"
              value={intake.carbs}
              onChange={(value) => setIntake((prev) => ({ ...prev, carbs: value }))}
            />
            <button type="submit" className="btn btn-primary">Save Intake</button>
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
                    <span className="text-sm text-muted">{current}g / {target}g</span>
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

function MacroInput({ label, value, onChange }) {
  return (
    <label className="macro-input">
      <span className="text-sm">{label}</span>
      <input
        className="input"
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(toNum(e.target.value))}
      />
    </label>
  );
}
