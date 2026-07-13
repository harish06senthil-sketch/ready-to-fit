import { Exercise, WorkoutRoutine, LoggedWorkout, FitnessGoal } from '../types';

// Standard exercise list
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    category: 'Strength',
    equipment: 'Barbell',
    targetMuscle: 'Chest',
    description: 'The standard heavy compound movement for chest, front shoulders, and triceps.'
  },
  {
    id: 'ex-squat',
    name: 'Barbell Back Squat',
    category: 'Strength',
    equipment: 'Barbell',
    targetMuscle: 'Quads',
    description: 'The king of lower body exercises, targetting quadriceps, hamstrings, and glutes.'
  },
  {
    id: 'ex-deadlift',
    name: 'Barbell Deadlift',
    category: 'Strength',
    equipment: 'Barbell',
    targetMuscle: 'Hamstrings',
    description: 'A legendary compound exercise that works the entire posterior chain.'
  },
  {
    id: 'ex-pullup',
    name: 'Pull-up',
    category: 'Bodyweight',
    equipment: 'Bodyweight',
    targetMuscle: 'Lats',
    description: 'A fundamental bodyweight movement for back width and biceps.'
  },
  {
    id: 'ex-overhead-press',
    name: 'Barbell Overhead Press',
    category: 'Strength',
    equipment: 'Barbell',
    targetMuscle: 'Shoulders',
    description: 'A heavy vertical push for strong shoulders, core stability, and triceps.'
  },
  {
    id: 'ex-dumbbell-curl',
    name: 'Dumbbell Bicep Curl',
    category: 'Hypertrophy',
    equipment: 'Dumbbell',
    targetMuscle: 'Biceps',
    description: 'Isolated arm movement designed to build strength and size in the biceps.'
  },
  {
    id: 'ex-tricep-pushdown',
    name: 'Cable Tricep Pushdown',
    category: 'Hypertrophy',
    equipment: 'Cables',
    targetMuscle: 'Triceps',
    description: 'Isolated tricep movement targeting the lateral and medial heads.'
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Hypertrophy',
    equipment: 'Machine',
    targetMuscle: 'Lats',
    description: 'A great machine-based builder for broad, powerful lats.'
  },
  {
    id: 'ex-dumbbell-row',
    name: 'Dumbbell Row',
    category: 'Strength',
    equipment: 'Dumbbell',
    targetMuscle: 'Upper Back',
    description: 'Single-arm compound movement to build unilateral back strength.'
  },
  {
    id: 'ex-treadmill-run',
    name: 'Treadmill Speed Run',
    category: 'Cardio',
    equipment: 'Machine',
    targetMuscle: 'Cardio System',
    description: 'High-intensity interval cardiovascular training.'
  }
];

// Pre-defined workout routines
export const DEFAULT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'rt-push-day',
    name: '⚡ Push Day Power',
    description: 'Focused on heavy pressing compounds for chest, shoulders, and triceps.',
    exercises: [
      { exerciseId: 'ex-bench-press', defaultSetsCount: 4, defaultReps: 8, defaultWeight: 135 },
      { exerciseId: 'ex-overhead-press', defaultSetsCount: 3, defaultReps: 8, defaultWeight: 95 },
      { exerciseId: 'ex-tricep-pushdown', defaultSetsCount: 3, defaultReps: 12, defaultWeight: 50 }
    ],
    notes: 'Rest 90-120 seconds between sets.'
  },
  {
    id: 'rt-pull-day',
    name: '🔥 Pull Day Width & Arms',
    description: 'Heavy pulls and isolated rows for back thickness and strong biceps.',
    exercises: [
      { exerciseId: 'ex-pullup', defaultSetsCount: 4, defaultReps: 8, defaultWeight: 0 },
      { exerciseId: 'ex-dumbbell-row', defaultSetsCount: 3, defaultReps: 10, defaultWeight: 45 },
      { exerciseId: 'ex-dumbbell-curl', defaultSetsCount: 3, defaultReps: 12, defaultWeight: 25 }
    ],
    notes: 'Squeeze the muscles at the peak contraction of every rep!'
  },
  {
    id: 'rt-leg-day',
    name: '👑 Leg Day Dominance',
    description: 'High-energy squat progression and hamstring loading.',
    exercises: [
      { exerciseId: 'ex-squat', defaultSetsCount: 4, defaultReps: 6, defaultWeight: 185 },
      { exerciseId: 'ex-deadlift', defaultSetsCount: 3, defaultReps: 5, defaultWeight: 225 }
    ],
    notes: 'Maintain perfect neutral spine, engage core before lifting.'
  }
];

// Get helper dates for dynamic history
const getDateOffset = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Realistic workout history showing progression
export const getInitialWorkoutHistory = (): LoggedWorkout[] => [
  {
    id: 'hist-1',
    name: '👑 Leg Day Dominance',
    date: getDateOffset(12),
    durationMinutes: 52,
    rating: 4,
    energyLevel: 4,
    notes: 'Squats felt solid, increased weight on the final set.',
    exercises: [
      {
        id: 'le-squat-1',
        exerciseId: 'ex-squat',
        name: 'Barbell Back Squat',
        category: 'Strength',
        sets: [
          { id: 'set-s1', reps: 6, weight: 165, isCompleted: true },
          { id: 'set-s2', reps: 6, weight: 175, isCompleted: true },
          { id: 'set-s3', reps: 6, weight: 185, isCompleted: true },
          { id: 'set-s4', reps: 5, weight: 195, isCompleted: true }
        ]
      },
      {
        id: 'le-deadlift-1',
        exerciseId: 'ex-deadlift',
        name: 'Barbell Deadlift',
        category: 'Strength',
        sets: [
          { id: 'set-d1', reps: 5, weight: 205, isCompleted: true },
          { id: 'set-d2', reps: 5, weight: 215, isCompleted: true },
          { id: 'set-d3', reps: 5, weight: 225, isCompleted: true }
        ]
      }
    ]
  },
  {
    id: 'hist-2',
    name: '⚡ Push Day Power',
    date: getDateOffset(9),
    durationMinutes: 45,
    rating: 5,
    energyLevel: 5,
    notes: 'Unbelievable pump. Felt extremely focused and motivated.',
    exercises: [
      {
        id: 'le-bench-1',
        exerciseId: 'ex-bench-press',
        name: 'Barbell Bench Press',
        category: 'Strength',
        sets: [
          { id: 'set-b1', reps: 8, weight: 135, isCompleted: true },
          { id: 'set-b2', reps: 8, weight: 140, isCompleted: true },
          { id: 'set-b3', reps: 8, weight: 145, isCompleted: true },
          { id: 'set-b4', reps: 6, weight: 150, isCompleted: true }
        ]
      },
      {
        id: 'le-ohp-1',
        exerciseId: 'ex-overhead-press',
        name: 'Barbell Overhead Press',
        category: 'Strength',
        sets: [
          { id: 'set-o1', reps: 8, weight: 85, isCompleted: true },
          { id: 'set-o2', reps: 8, weight: 95, isCompleted: true },
          { id: 'set-o3', reps: 8, weight: 95, isCompleted: true }
        ]
      },
      {
        id: 'le-tri-1',
        exerciseId: 'ex-tricep-pushdown',
        name: 'Cable Tricep Pushdown',
        category: 'Hypertrophy',
        sets: [
          { id: 'set-t1', reps: 12, weight: 45, isCompleted: true },
          { id: 'set-t2', reps: 12, weight: 50, isCompleted: true },
          { id: 'set-t3', reps: 10, weight: 55, isCompleted: true }
        ]
      }
    ]
  },
  {
    id: 'hist-3',
    name: '🔥 Pull Day Width & Arms',
    date: getDateOffset(7),
    durationMinutes: 48,
    rating: 4,
    energyLevel: 3,
    notes: 'Body was a bit fatigued, but crushed my arm goals.',
    exercises: [
      {
        id: 'le-pull-1',
        exerciseId: 'ex-pullup',
        name: 'Pull-up',
        category: 'Bodyweight',
        sets: [
          { id: 'set-p1', reps: 8, weight: 0, isCompleted: true },
          { id: 'set-p2', reps: 8, weight: 0, isCompleted: true },
          { id: 'set-p3', reps: 7, weight: 0, isCompleted: true },
          { id: 'set-p4', reps: 6, weight: 0, isCompleted: true }
        ]
      },
      {
        id: 'le-row-1',
        exerciseId: 'ex-dumbbell-row',
        name: 'Dumbbell Row',
        category: 'Strength',
        sets: [
          { id: 'set-r1', reps: 10, weight: 40, isCompleted: true },
          { id: 'set-r2', reps: 10, weight: 45, isCompleted: true },
          { id: 'set-r3', reps: 10, weight: 45, isCompleted: true }
        ]
      },
      {
        id: 'le-curl-1',
        exerciseId: 'ex-dumbbell-curl',
        name: 'Dumbbell Bicep Curl',
        category: 'Hypertrophy',
        sets: [
          { id: 'set-c1', reps: 12, weight: 20, isCompleted: true },
          { id: 'set-c2', reps: 12, weight: 25, isCompleted: true },
          { id: 'set-c3', reps: 10, weight: 25, isCompleted: true }
        ]
      }
    ]
  },
  {
    id: 'hist-4',
    name: '👑 Leg Day Dominance',
    date: getDateOffset(5),
    durationMinutes: 55,
    rating: 5,
    energyLevel: 4,
    notes: 'New personal record on squats! Kept form tight.',
    exercises: [
      {
        id: 'le-squat-2',
        exerciseId: 'ex-squat',
        name: 'Barbell Back Squat',
        category: 'Strength',
        sets: [
          { id: 'set-s21', reps: 6, weight: 175, isCompleted: true },
          { id: 'set-s22', reps: 6, weight: 185, isCompleted: true },
          { id: 'set-s23', reps: 6, weight: 195, isCompleted: true },
          { id: 'set-s24', reps: 6, weight: 205, isCompleted: true, isPR: true } // PR set
        ]
      },
      {
        id: 'le-deadlift-2',
        exerciseId: 'ex-deadlift',
        name: 'Barbell Deadlift',
        category: 'Strength',
        sets: [
          { id: 'set-d21', reps: 5, weight: 215, isCompleted: true },
          { id: 'set-d22', reps: 5, weight: 225, isCompleted: true },
          { id: 'set-d23', reps: 5, weight: 235, isCompleted: true }
        ]
      }
    ]
  },
  {
    id: 'hist-5',
    name: '⚡ Push Day Power',
    date: getDateOffset(2),
    durationMinutes: 50,
    rating: 5,
    energyLevel: 5,
    notes: 'Bench press felt lighter than usual, sets went up smooth!',
    exercises: [
      {
        id: 'le-bench-2',
        exerciseId: 'ex-bench-press',
        name: 'Barbell Bench Press',
        category: 'Strength',
        sets: [
          { id: 'set-b21', reps: 8, weight: 140, isCompleted: true },
          { id: 'set-b22', reps: 8, weight: 145, isCompleted: true },
          { id: 'set-b23', reps: 8, weight: 150, isCompleted: true },
          { id: 'set-b24', reps: 7, weight: 155, isCompleted: true, isPR: true } // PR set
        ]
      },
      {
        id: 'le-ohp-2',
        exerciseId: 'ex-overhead-press',
        name: 'Barbell Overhead Press',
        category: 'Strength',
        sets: [
          { id: 'set-o21', reps: 8, weight: 90, isCompleted: true },
          { id: 'set-o22', reps: 8, weight: 95, isCompleted: true },
          { id: 'set-o23', reps: 8, weight: 100, isCompleted: true }
        ]
      },
      {
        id: 'le-tri-2',
        exerciseId: 'ex-tricep-pushdown',
        name: 'Cable Tricep Pushdown',
        category: 'Hypertrophy',
        sets: [
          { id: 'set-t21', reps: 12, weight: 50, isCompleted: true },
          { id: 'set-t22', reps: 12, weight: 55, isCompleted: true },
          { id: 'set-t23', reps: 10, weight: 60, isCompleted: true }
        ]
      }
    ]
  }
];

export const getInitialGoals = (): FitnessGoal[] => [
  {
    id: 'g-squat',
    title: 'Squat 225 lbs for reps',
    category: 'exercise_weight',
    exerciseId: 'ex-squat',
    targetValue: 225,
    currentValue: 205,
    unit: 'lbs',
    deadlineDate: getDateOffset(-30), // 30 days in future or just hardcode a date
    isCompleted: false
  },
  {
    id: 'g-bench',
    title: 'Bench Press 155 lbs',
    category: 'exercise_weight',
    exerciseId: 'ex-bench-press',
    targetValue: 155,
    currentValue: 155,
    unit: 'lbs',
    deadlineDate: getDateOffset(-15),
    isCompleted: true
  },
  {
    id: 'g-count',
    title: 'Log 12 workouts',
    category: 'workouts_count',
    targetValue: 12,
    currentValue: 5,
    unit: 'workouts',
    deadlineDate: getDateOffset(-45),
    isCompleted: false
  },
  {
    id: 'g-streak',
    title: 'Maintain 3 workout week streak',
    category: 'streak',
    targetValue: 3,
    currentValue: 2,
    unit: 'weeks',
    deadlineDate: getDateOffset(-60),
    isCompleted: false
  }
];

export const MOTIVATIONAL_QUOTES = [
  { id: 'q1', text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { id: 'q2', text: 'Strength does not come from physical capacity. It comes from an indomitable will.', author: 'Mahatma Gandhi' },
  { id: 'q3', text: 'Your body can stand almost anything. It’s your mind that you have to convince.', author: 'Unknown' },
  { id: 'q4', text: 'Success isn’t always about greatness. It’s about consistency.', author: 'Dwayne Johnson' },
  { id: 'q5', text: 'What hurts today makes you stronger tomorrow.', author: 'Jay Cutler' },
  { id: 'q6', text: 'The clock is ticking. Are you becoming the person you want to be?', author: 'Greg Plitt' },
  { id: 'q7', text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' }
];
