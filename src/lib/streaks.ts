import { differenceInCalendarDays, format, subDays } from 'date-fns';
import type { DayLog } from './types';

function countBackwardsFrom(habitId: string, logsByDate: Record<string, DayLog>, start: Date) {
  let streak = 0;
  const d = new Date(start);
  while (true) {
    const key = format(d, 'yyyy-MM-dd');
    if (logsByDate[key]?.[habitId]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function calcStreak(habitId: string, logsByDate: Record<string, DayLog>) {
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  if (logsByDate[todayKey]?.[habitId]) {
    return countBackwardsFrom(habitId, logsByDate, new Date());
  }
  return 0;
}

export function getStreakSummary(habitId: string, logsByDate: Record<string, DayLog>) {
  const today = new Date();
  const active = calcStreak(habitId, logsByDate);
  if (active > 0) {
    return { active, ended: 0, endedAgoDays: 0 };
  }

  for (let daysAgo = 1; daysAgo <= 365; daysAgo++) {
    const date = subDays(today, daysAgo);
    const key = format(date, 'yyyy-MM-dd');
    if (!logsByDate[key]?.[habitId]) continue;

    return {
      active: 0,
      ended: countBackwardsFrom(habitId, logsByDate, date),
      endedAgoDays: differenceInCalendarDays(today, date),
    };
  }

  return { active: 0, ended: 0, endedAgoDays: 0 };
}
