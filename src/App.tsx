import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  History as HistoryIcon, 
  ClipboardList, 
  Target, 
  Flame, 
  Sparkles,
  Play,
  HeartPulse,
  Music,
  Compass
} from 'lucide-react';

import { 
  LoggedWorkout, 
  WorkoutRoutine, 
  FitnessGoal, 
  Exercise 
} from './types';

import { 
  DEFAULT_EXERCISES, 
  DEFAULT_ROUTINES, 
  getInitialWorkoutHistory, 
  getInitialGoals 
} from './data/defaultData';

import DashboardOverview from './components/DashboardOverview';
import WorkoutLogger from './components/WorkoutLogger';
import HistoryDashboard from './components/HistoryDashboard';
import RoutinesManager from './components/RoutinesManager';
import GoalsTracker from './components/GoalsTracker';
import AICoach from './components/AICoach';
import MusicPlayer from './components/MusicPlayer';
import WorkoutPlans from './components/WorkoutPlans';

type TabType = 'dashboard' | 'active_workout' | 'history' | 'routines' | 'goals' | 'ai_coach' | 'plans';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Core States (loaded from localStorage or initialized with defaults)
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const saved = localStorage.getItem('workout_exercises');
    return saved ? JSON.parse(saved) : DEFAULT_EXERCISES;
  });

  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() => {
    const saved = localStorage.getItem('workout_routines');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });

  const [history, setHistory] = useState<LoggedWorkout[]>(() => {
    const saved = localStorage.getItem('workout_history');
    return saved ? JSON.parse(saved) : getInitialWorkoutHistory();
  });

  const [goals, setGoals] = useState<FitnessGoal[]>(() => {
    const saved = localStorage.getItem('workout_goals');
    return saved ? JSON.parse(saved) : getInitialGoals();
  });

  // Track the active workout session in-progress
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | undefined>(undefined);
  const [isSessionInProgress, setIsSessionInProgress] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);

  // Synchronize states with localStorage
  useEffect(() => {
    localStorage.setItem('workout_exercises', JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem('workout_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('workout_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('workout_goals', JSON.stringify(goals));
  }, [goals]);

  // Event handlers
  const handleStartWorkout = (routineId?: string) => {
    if (isSessionInProgress) {
      if (!confirm("An active workout session is already running. Would you like to discard it and start a new session?")) {
        setActiveTab('active_workout');
        return;
      }
    }

    if (routineId) {
      const routineObj = routines.find(r => r.id === routineId);
      setActiveRoutine(routineObj);
    } else {
      setActiveRoutine(undefined);
    }

    setIsSessionInProgress(true);
    setActiveTab('active_workout');
  };

  const handleStartRoutineDirectly = (routine: WorkoutRoutine) => {
    if (isSessionInProgress) {
      if (!confirm("An active workout session is already running. Would you like to discard it and start a new session?")) {
        setActiveTab('active_workout');
        return;
      }
    }

    // Save to templates list if it doesn't already exist by name
    if (!routines.some(r => r.name.toLowerCase() === routine.name.toLowerCase())) {
      setRoutines(prev => [routine, ...prev]);
    }

    // Directly load as active routine and activate session
    setActiveRoutine(routine);
    setIsSessionInProgress(true);
    setActiveTab('active_workout');
  };

  const handleSaveWorkout = (completedWorkout: LoggedWorkout) => {
    // 1. Add to history
    setHistory(prev => [completedWorkout, ...prev]);

    // 2. Clear active flags
    setIsSessionInProgress(false);
    setActiveRoutine(undefined);

    // 3. Scan & update fitness goals progress dynamically!
    setGoals(prevGoals => {
      return prevGoals.map(goal => {
        let updatedValue = goal.currentValue;

        if (goal.isCompleted) return goal;

        // Update based on goals types
        if (goal.category === 'workouts_count') {
          // Increase session counts
          updatedValue = updatedValue + 1;
        } else if (goal.category === 'exercise_weight' && goal.exerciseId) {
          // Find max weight hit for this exercise inside this logged workout
          const matchedEx = completedWorkout.exercises.find(e => e.exerciseId === goal.exerciseId);
          if (matchedEx) {
            let maxWtThisSession = 0;
            matchedEx.sets.forEach(set => {
              if (set.isCompleted && set.weight > maxWtThisSession) {
                maxWtThisSession = set.weight;
              }
            });
            if (maxWtThisSession > updatedValue) {
              updatedValue = maxWtThisSession;
            }
          }
        }

        const isNowCompleted = updatedValue >= goal.targetValue;

        return {
          ...goal,
          currentValue: updatedValue,
          isCompleted: isNowCompleted
        };
      });
    });

    // 4. Navigate back to history
    setActiveTab('history');
  };

  const handleCancelWorkout = () => {
    setIsSessionInProgress(false);
    setActiveRoutine(undefined);
    setActiveTab('dashboard');
  };

  const handleAddCustomExercise = (newEx: Exercise) => {
    setExercises(prev => [...prev, newEx]);
  };

  const handleCreateRoutine = (newRoutine: WorkoutRoutine) => {
    setRoutines(prev => [newRoutine, ...prev]);
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines(prev => prev.filter(r => r.id !== routineId));
  };

  const handleCreateGoal = (newGoal: FitnessGoal) => {
    setGoals(prev => [newGoal, ...prev]);
  };

  const handleUpdateGoalProgress = (goalId: string, current: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          currentValue: current,
          isCompleted: current >= g.targetValue
        };
      }
      return g;
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col justify-between" id="applet-container">
      
      {/* Top Athletic Header */}
      <header className="sticky top-0 z-40 bg-brand-bg/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 md:px-6" id="applet-header">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-yellow flex items-center justify-center text-brand-bg shadow-md shadow-brand-blue/10">
              <HeartPulse className="w-5 h-5 text-brand-bg stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight font-display text-white">
                PULSE<span className="text-brand-yellow font-medium">TRAK</span>
              </span>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider -mt-1 font-mono">FITNESS ENGINE</p>
            </div>
          </div>

          {/* Running active session alert widget */}
          {isSessionInProgress && activeTab !== 'active_workout' && (
            <button
              onClick={() => setActiveTab('active_workout')}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 rounded-full text-red-400 text-xs font-bold animate-pulse-subtle cursor-pointer transition-all"
              id="active-timer-widget"
            >
              <Dumbbell className="w-3.5 h-3.5 animate-spin" />
              <span>ACTIVE WORKOUT IN PROGRESS</span>
            </button>
          )}

          {/* Controls & User info container */}
          <div className="flex items-center gap-2.5">
            {/* Music trigger button (in a different, premium place!) */}
            <button
              onClick={() => setIsMusicOpen(!isMusicOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                isMusicOpen 
                  ? 'bg-brand-yellow text-slate-900 border-transparent shadow shadow-brand-yellow/30' 
                  : 'bg-slate-900 hover:bg-slate-800 text-gray-300 border-slate-800'
              }`}
              id="header-music-trigger"
              title="Toggle Cyber Beats Player"
            >
              <Music className={`w-3.5 h-3.5 ${isMusicOpen ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-display text-[9px] uppercase tracking-widest">CYBER BEATS</span>
            </button>

            {/* User Email tag */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse"></div>
              <span className="text-[10px] md:text-xs font-semibold text-gray-400 font-mono"></span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 mb-20 md:mb-6" id="applet-main-content">
        
        {activeTab === 'dashboard' && (
          <DashboardOverview
            history={history}
            routines={routines}
            goals={goals}
            onStartWorkout={handleStartWorkout}
            onNavigateToTab={(tab) => setActiveTab(tab as TabType)}
          />
        )}

        {activeTab === 'active_workout' && (
          <WorkoutLogger
            activeRoutine={activeRoutine}
            exercisesCatalog={exercises}
            onSaveWorkout={handleSaveWorkout}
            onCancelWorkout={handleCancelWorkout}
            onAddCustomExercise={handleAddCustomExercise}
          />
        )}

        {activeTab === 'history' && (
          <HistoryDashboard
            history={history}
            exercisesCatalog={exercises}
          />
        )}

        {activeTab === 'routines' && (
          <RoutinesManager
            routines={routines}
            exercisesCatalog={exercises}
            onCreateRoutine={handleCreateRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onStartRoutine={handleStartWorkout}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTracker
            goals={goals}
            exercisesCatalog={exercises}
            onCreateGoal={handleCreateGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'ai_coach' && (
          <AICoach
            goals={goals}
            history={history}
            routines={routines}
            exercisesCatalog={exercises}
            onCreateRoutine={handleCreateRoutine}
          />
        )}

        {activeTab === 'plans' && (
          <WorkoutPlans
            routines={routines}
            exercisesCatalog={exercises}
            onCreateRoutine={handleCreateRoutine}
            onStartRoutineDirectly={handleStartRoutineDirectly}
          />
        )}

      </main>

      {/* Responsive Footer Navigation Hub */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-brand-card/95 backdrop-blur-md border-t border-slate-800 py-2.5 px-4 shadow-2xl" id="applet-footer-nav">
        <div className="max-w-xl mx-auto grid grid-cols-7 gap-0.5 sm:gap-1">
          
          {/* Dashboard Tab Button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">Dash</span>
          </button>

          {/* AI Plans Tab Button */}
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'plans' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5 mb-1 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">Plans</span>
            <span className="absolute top-1 right-2 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-yellow"></span>
            </span>
          </button>

          {/* Active Logging Tab Button */}
          <button
            onClick={() => {
              if (isSessionInProgress) {
                setActiveTab('active_workout');
              } else {
                handleStartWorkout();
              }
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'active_workout' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">Log</span>
            {isSessionInProgress && (
              <span className="absolute top-1 right-3 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* History Tab Button */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <HistoryIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">History</span>
          </button>

          {/* Blueprints Tab Button */}
          <button
            onClick={() => setActiveTab('routines')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'routines' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">Routines</span>
          </button>

          {/* Goals Tab Button */}
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'goals' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">Goals</span>
          </button>

          {/* AI Coach Tab Button */}
          <button
            onClick={() => setActiveTab('ai_coach')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ai_coach' 
                ? 'text-brand-yellow bg-slate-900/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-display">Coach</span>
          </button>

        </div>
      </nav>

      {/* Cyber Synth Background Music Player */}
      <MusicPlayer isOpen={isMusicOpen} setIsOpen={setIsMusicOpen} />

    </div>
  );
}
