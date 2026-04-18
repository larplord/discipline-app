import { format } from 'date-fns';

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}
