'use client';

import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import { useUserData } from '@/components/UserDataProvider';
import type { JournalEntry } from '@/lib/types';
import '@/styles/pages/Journal.css';

const PROMPTS = [
  { key: 'well' as const, label: 'What did I do well today?', placeholder: "Wins, actions you're proud of..." },
  { key: 'avoided' as const, label: 'What did I avoid or procrastinate?', placeholder: 'Be honest.' },
  { key: 'improve' as const, label: 'What will I do better tomorrow?', placeholder: 'Concrete actions...' },
];

export default function JournalPage() {
  const { uid } = useUserData();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entry, setEntry] = useState<JournalEntry>({
    well: '',
    avoided: '',
    improve: '',
    freeform: '',
  });
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<[string, JournalEntry][]>([]);

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(doc(db, 'users', uid, 'journal', selectedDate), (snap) => {
      const d = snap.data();
      setEntry({
        well: d?.well ?? '',
        avoided: d?.avoided ?? '',
        improve: d?.improve ?? '',
        freeform: d?.freeform ?? '',
      });
    });
  }, [uid, selectedDate]);

  useEffect(() => {
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'users', uid, 'journal'), (snap) => {
      const list: [string, JournalEntry][] = [];
      snap.forEach((d) => {
        const e = d.data() as JournalEntry;
        if (e.well || e.avoided || e.improve || e.freeform) list.push([d.id, e]);
      });
      list.sort(([a], [b]) => b.localeCompare(a));
      setHistory(list.slice(0, 30));
    });
  }, [uid]);

  async function handleChange(key: keyof JournalEntry, val: string) {
    const updated = { ...entry, [key]: val };
    setEntry(updated);
    const db = getFirestoreDb();
    await setDoc(
      doc(db, 'users', uid, 'journal', selectedDate),
      { ...updated, savedAt: new Date().toISOString() },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    const hasEntry = history.some(([k]) => k === key);
    const dow = format(d, 'EEE');
    const labelMain = i === 0 ? 'Today' : format(d, 'd');
    return { key, dow, labelMain, hasEntry, isToday: i === 0 };
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Daily Journal</h1>
            <p className="page-subtitle">Reflect. Recalibrate. Rise.</p>
          </div>
          {saved && (
            <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="journal-day-picker card mb-4">
          <div className="journal-day-picker-head">
            <div>
              <div className="section-label">Jump to day</div>
              <p className="journal-day-picker-hint">Last 7 days · dot means saved entry</p>
            </div>
          </div>
          <div className="day-pills" role="tablist" aria-label="Journal day">
            {recentDays.map((d) => (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={selectedDate === d.key}
                className={`day-pill ${selectedDate === d.key ? 'active' : ''} ${d.hasEntry ? 'has-entry' : ''}`}
                onClick={() => setSelectedDate(d.key)}
              >
                <span className="day-pill-dow">{d.isToday ? 'Now' : d.dow}</span>
                <span className="day-pill-date">{d.labelMain}</span>
                {d.hasEntry && <span className="day-pill-dot" aria-hidden />}
              </button>
            ))}
          </div>
        </div>

        <div className="journal-prompts">
          <div className="card journal-free-card mb-4">
            <div className="journal-free-head">
              <div>
                <div className="section-label">Open journal</div>
                <p className="journal-free-sub">Unstructured space — thoughts, plans, or anything you need to clear your head.</p>
              </div>
            </div>
            <textarea
              className="textarea journal-free-textarea"
              rows={6}
              placeholder="Start typing…"
              value={entry.freeform}
              onChange={(e) => handleChange('freeform', e.target.value)}
            />
          </div>

          <div className="journal-guided-label section-label mb-2">Guided reflection</div>
          {PROMPTS.map((p) => (
            <div key={p.key} className="card journal-block mb-3">
              <label className="journal-prompt-label">{p.label}</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder={p.placeholder}
                value={entry[p.key]}
                onChange={(e) => handleChange(p.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
