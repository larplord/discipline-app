export type RoutineMarker = {
  minuteOffset: number;
  timeLabel: string;
  isMajor: boolean;
  task: string;
};

export function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function formatMinutesAsTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatTimeLabel(time: string) {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) return time;
  return new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getRoutineDuration(startTime: string, endTime: string) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null || start === end) return null;
  return end > start ? end - start : end + 1440 - start;
}

export function validateRoutineTimes(startTime: string, endTime: string) {
  const duration = getRoutineDuration(startTime, endTime);
  if (duration == null) return 'Start and end time must be valid and cannot match.';
  if (duration > 720) return 'Keep routines to 12 hours or less for now.';
  return null;
}

export function generateRoutineMarkers(input: {
  startTime: string;
  endTime: string;
  majorIntervalMinutes: 5 | 15;
  steps?: Record<string, string>;
}) {
  const start = parseTimeToMinutes(input.startTime);
  const duration = getRoutineDuration(input.startTime, input.endTime);
  if (start == null || duration == null) return [];

  return Array.from({ length: duration + 1 }, (_, minuteOffset): RoutineMarker => {
    const timeLabel = formatMinutesAsTime(start + minuteOffset);
    return {
      minuteOffset,
      timeLabel,
      isMajor: minuteOffset % input.majorIntervalMinutes === 0 || minuteOffset === duration,
      task: input.steps?.[timeLabel] ?? '',
    };
  });
}

export function getRoutineProgress(startTime: string, endTime: string, now = new Date()) {
  const start = parseTimeToMinutes(startTime);
  const duration = getRoutineDuration(startTime, endTime);
  if (start == null || duration == null) {
    return { passedMinutes: 0, pct: 0, status: 'invalid' as const, duration: 0 };
  }

  const crossesMidnight = parseTimeToMinutes(endTime)! <= start;
  let current = now.getHours() * 60 + now.getMinutes();
  if (crossesMidnight && current < start) current += 1440;

  const rawPassed = current - start;
  const passedMinutes = Math.min(Math.max(rawPassed, 0), duration);
  const pct = duration ? Math.round((passedMinutes / duration) * 100) : 0;
  const status = rawPassed < 0 ? 'upcoming' : rawPassed > duration ? 'complete' : 'running';

  return { passedMinutes, pct, status, duration };
}

export function routineStatusLabel(status: ReturnType<typeof getRoutineProgress>['status']) {
  if (status === 'running') return 'Running now';
  if (status === 'complete') return 'Complete today';
  if (status === 'upcoming') return 'Upcoming';
  return 'Invalid timing';
}
