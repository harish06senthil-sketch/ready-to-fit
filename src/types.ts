export interface Exercise {
  id: string;
  name: string;
  category: 'Strength' | 'Cardio' | 'Hypertrophy' | 'Flexibility' | 'Bodyweight';
  equipment: 'Barbell' | 'Dumbbell' | 'Machine' | 'Bodyweight' | 'Cables' | 'Kettlebell';
  targetMuscle: string;
  description?: string;
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  isCompleted: boolean;
  isPR?: boolean; // Personal record
}

export interface LoggedExercise {
  id: string; // instance-specific id
  exerciseId: string; // reference to base Exercise
  name: string;
  sets: ExerciseSet[];
  category: string;
  notes?: string;
}

export interface LoggedWorkout {
  id: string;
  name: string;
  date: string; // ISO String or YYYY-MM-DD
  durationMinutes: number;
  exercises: LoggedExercise[];
  routineId?: string; // If started from routine
  notes?: string;
  rating?: number; // 1 to 5 stars
  energyLevel?: number; // 1 to 5 rating
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  exercises: {
    exerciseId: string;
    defaultSetsCount: number;
    defaultReps: number;
    defaultWeight: number;
  }[];
  notes?: string;
}

export type GoalCategory = 'exercise_weight' | 'workouts_count' | 'streak' | 'body_weight';

export interface FitnessGoal {
  id: string;
  title: string;
  category: GoalCategory;
  exerciseId?: string; // If exercise weight target
  targetValue: number;
  currentValue: number;
  unit: string;
  deadlineDate: string;
  isCompleted: boolean;
}

export interface UserStats {
  streakDays: number;
  lastWorkoutDate?: string;
  totalWorkouts: number;
  totalWeightLifted: number; // lbs/kg
}
