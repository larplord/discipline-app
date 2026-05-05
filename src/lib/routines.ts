export type RoutineMarker = {
  minuteOffset: number;
  timeLabel: string;
  isMajor: boolean;
  task: string;
};

export type RoutineDisplayMarker = RoutineMarker & {
  displayIndex: number;
  majorIndex: number;
  labelPosition: 'above' | 'below';
};

export type TimeParts = {
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
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

export function timeToParts(time: string): TimeParts {
  const minutes = parseTimeToMinutes(time) ?? 0;
  const hour24 = Math.floor(minutes / 60);
  return {
    hour12: hour24 % 12 || 12,
    minute: minutes % 60,
    period: hour24 >= 12 ? 'PM' : 'AM',
  };
}

export function partsToTime(parts: TimeParts) {
  const hour24 = parts.period === 'PM'
    ? parts.hour12 === 12 ? 12 : parts.hour12 + 12
    : parts.hour12 === 12 ? 0 : parts.hour12;
  return formatMinutesAsTime(hour24 * 60 + parts.minute);
}

export function adjustTimeByMinutes(time: string, deltaMinutes: number) {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) return time;
  return formatMinutesAsTime(minutes + deltaMinutes);
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

export function generateRoutineDisplayMarkers(input: {
  startTime: string;
  endTime: string;
  majorIntervalMinutes: 5 | 15;
  steps?: Record<string, string>;
}) {
  const start = parseTimeToMinutes(input.startTime);
  const duration = getRoutineDuration(input.startTime, input.endTime);
  if (start == null || duration == null) return [];

  const majorOffsets: number[] = [];
  for (let offset = 0; offset <= duration; offset += input.majorIntervalMinutes) {
    majorOffsets.push(offset);
  }
  if (majorOffsets[majorOffsets.length - 1] !== duration) majorOffsets.push(duration);

  const markers: RoutineDisplayMarker[] = [];
  const intervalCount = Math.max(1, majorOffsets.length - 1);
  const displayBudget = duration <= 180 ? 90 : Number.POSITIVE_INFINITY;
  const minorBudgetPerInterval = Number.isFinite(displayBudget)
    ? Math.max(0, Math.floor((displayBudget - majorOffsets.length) / intervalCount))
    : 5;

  majorOffsets.forEach((majorOffset, majorIndex) => {
    const timeLabel = formatMinutesAsTime(start + majorOffset);
    markers.push({
      minuteOffset: majorOffset,
      timeLabel,
      isMajor: true,
      task: input.steps?.[timeLabel] ?? '',
      displayIndex: markers.length,
      majorIndex,
      labelPosition: majorIndex % 2 === 0 ? 'above' : 'below',
    });

    const nextMajor = majorOffsets[majorIndex + 1];
    if (nextMajor == null) return;
    const gap = nextMajor - majorOffset;
    const minorCount = Math.min(5, minorBudgetPerInterval, Math.max(0, gap - 1));
    for (let i = 1; i <= minorCount; i += 1) {
      const minorOffset = Math.round(majorOffset + (gap * i) / (minorCount + 1));
      if (minorOffset <= majorOffset || minorOffset >= nextMajor) continue;
      markers.push({
        minuteOffset: minorOffset,
        timeLabel: formatMinutesAsTime(start + minorOffset),
        isMajor: false,
        task: '',
        displayIndex: markers.length,
        majorIndex,
        labelPosition: 'above',
      });
    }
  });

  return markers.map((marker, displayIndex) => ({ ...marker, displayIndex }));
}

export function closestDisplayMarkerOffset(markers: RoutineDisplayMarker[], passedMinutes: number) {
  if (!markers.length) return 0;
  return markers.reduce((closest, marker) =>
    Math.abs(marker.minuteOffset - passedMinutes) < Math.abs(closest.minuteOffset - passedMinutes) ? marker : closest
  ).minuteOffset;
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
