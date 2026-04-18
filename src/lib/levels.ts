export type Level = { min: number; title: string; rank: number };

export const LEVELS: Level[] = [
  { min: 0, title: 'Beginner', rank: 1 },
  { min: 100, title: 'Consistent', rank: 2 },
  { min: 300, title: 'Disciplined', rank: 3 },
  { min: 700, title: 'Executor', rank: 4 },
  { min: 1500, title: 'Iron-Willed', rank: 5 },
  { min: 3000, title: 'Elite', rank: 6 },
  { min: 6000, title: 'Legend', rank: 7 },
];

export function getLevel(totalScore: number): Level {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (totalScore >= l.min) level = l;
  }
  return level;
}
