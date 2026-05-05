'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTimeLabel, partsToTime, timeToParts } from '@/lib/routines';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

type RoutineTimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RoutineTimePicker({ label, value, onChange, disabled = false }: RoutineTimePickerProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const parts = timeToParts(value);
  const selectedMinute = Math.min(55, Math.round(parts.minute / 5) * 5);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div className="routine-time-picker" ref={pickerRef}>
      <div className="routine-time-picker-head">
        <span className="section-label">{label}</span>
      </div>
      <button
        type="button"
        className={`routine-time-button ${open ? 'open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span>{formatTimeLabel(value)}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="routine-time-popover">
          <div className="routine-time-selects">
            <select
              className="select routine-time-select"
              value={parts.hour12}
              onChange={(e) => onChange(partsToTime({ ...parts, hour12: Number(e.target.value) }))}
              disabled={disabled}
              aria-label={`${label} hour`}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <select
              className="select routine-time-select"
              value={selectedMinute}
              onChange={(e) => onChange(partsToTime({ ...parts, minute: Number(e.target.value) }))}
              disabled={disabled}
              aria-label={`${label} minute`}
            >
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
              ))}
            </select>
            <select
              className="select routine-time-select period"
              value={parts.period}
              onChange={(e) => onChange(partsToTime({ ...parts, period: e.target.value as 'AM' | 'PM' }))}
              disabled={disabled}
              aria-label={`${label} period`}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
