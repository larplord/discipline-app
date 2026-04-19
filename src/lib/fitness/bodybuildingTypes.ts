export type BodyGoal = 'cutting' | 'bulking' | 'maintenance';

export type BodybuildingProfile = {
  currentWeightLbs: number;
  goalWeightLbs: number;
  bodyGoal: BodyGoal;
  progressRateLbsPerWeek: number;
  dailyCaloriesTarget: number;
  dailyProteinGTarget: number;
  proteinPerLb: number;
  lastWorkoutDate: string | null;
};

export type WorkoutSet = {
  id: string;
  reps: number;
  weightLbs: number;
  done: boolean;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
};

export type DayWorkout = {
  exercises: WorkoutExercise[];
};

export type MacroLog = {
  calories: number;
  proteinG: number;
};

export const MUSCLE_GROUPS = ['Chest', 'Legs', 'Back', 'Shoulders', 'Arms'] as const;

export const DEFAULT_PROFILE: BodybuildingProfile = {
  currentWeightLbs: 185,
  goalWeightLbs: 175,
  bodyGoal: 'cutting',
  progressRateLbsPerWeek: -1.2,
  dailyCaloriesTarget: 2000,
  dailyProteinGTarget: 180,
  proteinPerLb: 1.0,
  lastWorkoutDate: null,
};

export const DEFAULT_MACRO: MacroLog = {
  calories: 1650,
  proteinG: 145,
};
