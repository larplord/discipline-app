/** Per-day habit completion map (habit id → done today). */
export type DayLog = Record<string, boolean>;

export type Habit = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  targetDays?: number;
};

export type Goal = {
  id: string;
  title: string;
  type: 'short' | 'long';
  priority: string;
  deadline?: string;
  description?: string;
  milestones: { id: string; text: string; done: boolean }[];
};

/** Macro grams for nutrition targets / intake (scoring + nutrition page). */
export type MacroSnapshot = {
  fat: number;
  protein: number;
  carbs: number;
};

export type JournalEntry = {
  well: string;
  avoided: string;
  improve: string;
  freeform: string;
  savedAt?: string;
};

export type IdentityDoc = {
  totalScore: number;
  bestStreak: number;
  lastScoreDate?: string;
};

export type PrivacySettings = {
  shareProgressWithFriends: boolean;
};

export type SharedSummary = {
  shareEnabled: boolean;
  habitTodayPct: number;
  weekHabitPct: number;
  focusToday: number;
  journalToday: boolean;
  updatedAt?: unknown;
};

export type Friendship = {
  memberIds: [string, string];
  invitedBy: string;
  status: 'pending' | 'active' | 'declined';
  createdAt?: unknown;
  invitedByName?: string;
};
