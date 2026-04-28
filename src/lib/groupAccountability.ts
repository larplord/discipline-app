import { format } from 'date-fns';
import type { SharedSummary } from './types';

export const GROUP_NUDGES = ['Still time today.', 'Get one done.', 'lockin.'] as const;

export const GROUP_CHALLENGES = [
  { id: 'checkin-5', label: '5-day check-in streak' },
  { id: 'focus-10', label: '10 total focus sessions' },
  { id: 'habit-80', label: '80% habit week' },
  { id: 'journal-3', label: 'Journal 3 times this week' },
  { id: 'hard-thing', label: 'Everyone completes one hard thing today' },
] as const;

export function weekDateKeys() {
  return Array.from({ length: 7 }, (_, i) => format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd'));
}

export function todayGroupCheckInId(uid: string) {
  return `${format(new Date(), 'yyyy-MM-dd')}_${uid}`;
}

export function groupCheckInId(date: string, uid: string) {
  return `${date}_${uid}`;
}

export function weeklyConsistencyScore(checkInsLast7: number, summary?: SharedSummary | null) {
  const checkInPoints = checkInsLast7 >= 6 ? 5 : 0;
  const habitPoints = (summary?.weekHabitPct ?? 0) >= 70 ? 5 : 0;
  return checkInPoints + habitPoints;
}

export function safeMemberName(uid: string, displayName?: string) {
  return displayName?.trim() || `${uid.slice(0, 8)}...`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function timestampMillis(value: unknown) {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const fn = (value as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') {
      try {
        return fn.call(value);
      } catch {
        return 0;
      }
    }
  }
  return 0;
}
