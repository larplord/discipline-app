'use client';

import { adjustTimeByMinutes, formatTimeLabel, partsToTime, timeToParts } from '@/lib/routines';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const QUICK_ADJUSTMENTS = [-15, -5, 5, 15];

type RoutineTimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RoutineTimePicker({ label, value, onChange, disabled = false }: RoutineTimePickerProps) {
  const parts = timeToParts(value);
  const selectedMinute = Math.min(55, Math.round(parts.minute / 5) * 5);

  return (
    <div className="routine-time-picker">
      <div className="routine-time-picker-head">
        <span className="section-label">{label}</span>
        <strong>{formatTimeLabel(value)}</strong>
      </div>
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
      <div className="routine-time-quick">
        {QUICK_ADJUSTMENTS.map((delta) => (
          <button
            key={delta}
            type="button"
            className="routine-time-step"
            onClick={() => onChange(adjustTimeByMinutes(value, delta))}
            disabled={disabled}
          >
            {delta > 0 ? `+${delta}m` : `${delta}m`}
          </button>
        ))}
      </div>
    </div>
  );
}
