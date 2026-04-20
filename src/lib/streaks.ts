import { format } from 'date-fns';
import type { DayLog } from './types';

export function calcStreak(habitId: string, logsByDate: Record<string, DayLog>) {
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (true) {
    const key = format(d, 'yyyy-MM-dd');
    if (logsByDate[key]?.[habitId]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  if (logsByDate[todayKey]?.[habitId]) streak++;
  return streak;
}
