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
  /** Optional enriched fields for friends (safe snapshot). */
  dailyScore?: number;
  rankTitle?: string;
  bestStreak?: number;
  habitsCompletedToday?: number;
  /** Average milestone % across goals that have milestones — no titles or task text. */
  goalsAvgPct?: number;
  /** How many goals were included in `goalsAvgPct`. */
  goalsTrackedCount?: number;
  updatedAt?: unknown;
};

export type Friendship = {
  memberIds: [string, string];
  invitedBy: string;
  status: 'pending' | 'active' | 'declined' | 'ended';
  createdAt?: unknown;
  invitedByName?: string;
};

/** Sender-only log when user “invites by email” (no server-side email lookup in MVP). */
export type FriendEmailInviteOutbox = {
  recipientEmail: string;
  createdAt?: unknown;
  invitedByName?: string;
};
