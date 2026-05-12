export type Level = { min: number; title: string; rank: number };

export const LEVELS: Level[] = [
  { min: 0, title: 'Manual Mode', rank: 1 },
  { min: 100, title: 'Noen Seed', rank: 2 },
  { min: 300, title: 'Daily Coach', rank: 3 },
  { min: 700, title: 'Memory Core', rank: 4 },
  { min: 1500, title: 'Project Operator', rank: 5 },
  { min: 3000, title: 'Agent Team', rank: 6 },
  { min: 6000, title: 'JARVIS Command Center', rank: 7 },
];

export function getLevel(totalScore: number): Level {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (totalScore >= l.min) level = l;
  }
  return level;
}
