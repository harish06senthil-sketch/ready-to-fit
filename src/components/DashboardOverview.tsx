import { useState, useMemo } from 'react';
import { 
  Flame, 
  Dumbbell, 
  Trophy, 
  Play, 
  Quote, 
  Plus, 
  Zap, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Compass
} from 'lucide-react';
import { LoggedWorkout, WorkoutRoutine, FitnessGoal } from '../types';
import { MOTIVATIONAL_QUOTES } from '../data/defaultData';

interface DashboardOverviewProps {
  history: LoggedWorkout[];
  routines: WorkoutRoutine[];
  goals: FitnessGoal[];
  onStartWorkout: (routineId?: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardOverview({
  history,
  routines,
  goals,
  onStartWorkout,
  onNavigateToTab
}: DashboardOverviewProps) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));

  const changeQuote = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    } while (nextIndex === quoteIndex && MOTIVATIONAL_QUOTES.length > 1);
    setQuoteIndex(nextIndex);
  };

  const activeQuote = MOTIVATIONAL_QUOTES[quoteIndex];

  // Calculate dynamic stats
  const stats = useMemo(() => {
    // 1. Total Workouts
    const totalWorkouts = history.length;

    // 2. Total Weight Lifted
    let totalWeight = 0;
    history.forEach(w => {
      w.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.isCompleted) {
            totalWeight += (set.weight || 0) * (set.reps || 0);
          }
        });
      });
    });

    // 3. Dynamic Streak Calculation (Workouts in the last N days)
    // For a nice visual, let's calculate active days in current week
    const today = new Date();
    const currentWeekWorkouts = history.filter(w => {
      const wDate = new Date(w.date);
      const diffTime = Math.abs(today.getTime() - wDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    // Approximate a motivational streak based on consistency
    let streak = 0;
    if (history.length > 0) {
      // Sort history descending by date
      const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestWorkoutDate = new Date(sortedHistory[0].date);
      latestWorkoutDate.setHours(0,0,0,0);
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      const diffDays = Math.floor((todayDate.getTime() - latestWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 2) {
        // Workout was today, yesterday or day before, let's count consecutive active calendar blocks
        streak = 1;
        let prevDate = latestWorkoutDate;
        for (let i = 1; i < sortedHistory.length; i++) {
          const checkDate = new Date(sortedHistory[i].date);
          checkDate.setHours(0,0,0,0);
          const gap = (prevDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);
          if (gap <= 3) {
            streak++;
            prevDate = checkDate;
          } else {
            break;
          }
        }
      } else {
        streak = 0; // Streak cooled down, need to re-ignite
      }
    }

    return {
      totalWorkouts,
      totalWeight,
      streak,
      weeklyCount: currentWeekWorkouts.length
    };
  }, [history]);

  // Generate 7 days of the current week (Mon-Sun or Sun-Sat)
  const weekDays = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    // Start from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasWorkout = history.some(w => w.date === dateStr);
      
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dateStr,
        hasWorkout,
        isToday: i === 0,
        dayNum: d.getDate()
      });
    }
    return days;
  }, [history]);

  // Goals at a glance
  const pendingGoals = useMemo(() => {
    return goals.filter(g => !g.isCompleted).slice(0, 2);
  }, [goals]);

  return (
    <div className="space-y-6" id="dashboard-overview-container">
      {/* Dynamic Header & Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-radial from-brand-card to-brand-bg p-6 rounded-2xl border border-brand-blue/25 relative overflow-hidden" id="dashboard-hero">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/5 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-brand-yellow text-sm font-semibold tracking-wider uppercase font-display">
            <Sparkles className="w-4 h-4 text-brand-yellow animate-pulse" />
            ATHLETIC ENGINE ONLINE
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-white">
            Push Harder <span className="text-brand-yellow">Today</span>.
          </h1>
          <p className="text-gray-400 text-sm max-w-md">
            Track weight, sets, and progression. Stay consistent to build unbreakable strength and power.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onStartWorkout()}
            className="relative group flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold py-3 px-5 rounded-xl transition-all duration-300 shadow-md shadow-brand-yellow/15 hover:shadow-brand-yellow/25 font-display text-sm tracking-wide transform active:scale-95"
            id="btn-quick-start-empty"
          >
            <Play className="w-4 h-4 fill-current" />
            START EMPTY SESSION
          </button>

          <button
            onClick={() => onNavigateToTab('plans')}
            className="relative group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-blue/50 text-white font-bold py-3 px-5 rounded-xl transition-all duration-300 shadow-md shadow-black/25 font-display text-sm tracking-wide transform active:scale-95 cursor-pointer"
            id="btn-navigate-to-plans"
          >
            <Compass className="w-4 h-4 text-brand-blue-light group-hover:animate-spin" />
            AI WORKOUT PLANS
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-yellow"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Motivational Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {/* Streak Stat */}
        <div className="bg-brand-card p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-brand-yellow/40 transition-all duration-300 group" id="stat-streak">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Consistency Streak</span>
            <Flame className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${stats.streak > 0 ? 'text-brand-yellow fill-brand-yellow/10' : 'text-slate-500'}`} />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-display text-white flex items-baseline gap-1">
              {stats.streak} <span className="text-sm font-normal text-gray-400">active {stats.streak === 1 ? 'log' : 'logs'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.streak > 0 ? 'Flame active! Keep it up!' : 'Log today to ignite streak'}
            </p>
          </div>
        </div>

        {/* Total Sessions Stat */}
        <div className="bg-brand-card p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-brand-blue/40 transition-all duration-300 group" id="stat-sessions">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Workouts</span>
            <Dumbbell className="w-6 h-6 text-brand-blue-light transition-transform duration-300 group-hover:rotate-45" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-display text-white">
              {stats.totalWorkouts}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sessions successfully logged</p>
          </div>
        </div>

        {/* Total Weight Stat */}
        <div className="bg-brand-card p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-brand-blue/40 transition-all duration-300 group" id="stat-weight">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Volume Lifted</span>
            <TrendingUp className="w-6 h-6 text-brand-blue-light transition-transform duration-300 group-hover:translate-y-[-2px]" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-display text-white font-mono">
              {stats.totalWeight.toLocaleString()} <span className="text-xs font-normal text-gray-400">lbs</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Accumulated weight moved</p>
          </div>
        </div>

        {/* Goals Progress Stat */}
        <div className="bg-brand-card p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-brand-yellow/40 transition-all duration-300 group" id="stat-goals">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Goals</span>
            <Trophy className="w-6 h-6 text-brand-yellow transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-display text-white">
              {goals.filter(g => g.isCompleted).length} / {goals.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Personal milestones met</p>
          </div>
        </div>
      </div>

      {/* Grid: Calendar / Active Week & Motivational Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-mid-section">
        {/* Weekly Activity Grid (Heatmap style) */}
        <div className="lg:col-span-7 bg-brand-card p-6 rounded-xl border border-slate-800" id="weekly-frequency-tracker">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-yellow" />
              Weekly Frequency
            </h2>
            <span className="text-xs bg-brand-blue-glow text-brand-blue-light font-semibold px-2.5 py-1 rounded-full border border-brand-blue/30">
              {stats.weeklyCount} of 7 Days Active
            </span>
          </div>
          
          <p className="text-xs text-gray-400 mb-6">
            Stay consistent! Muscle hypertrophy and physical strength thrive on regular, repeating muscle engagement.
          </p>

          <div className="grid grid-cols-7 gap-2.5" id="weekly-days-grid">
            {weekDays.map((day, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
                  day.hasWorkout 
                    ? 'bg-brand-blue/15 border-brand-blue text-white shadow-md shadow-brand-blue/10' 
                    : day.isToday
                    ? 'bg-brand-card border-brand-yellow/50 text-brand-yellow'
                    : 'bg-brand-bg/50 border-slate-800/80 text-gray-500'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider mb-1">{day.name}</span>
                <span className={`text-sm font-extrabold font-display ${day.hasWorkout ? 'text-brand-yellow' : ''}`}>
                  {day.dayNum}
                </span>
                <div className="mt-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    day.hasWorkout 
                      ? 'bg-brand-yellow animate-pulse' 
                      : day.isToday
                      ? 'border border-brand-yellow w-2 h-2 rounded-full'
                      : 'bg-slate-800'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Quotes Panel */}
        <div className="lg:col-span-5 bg-brand-card p-6 rounded-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group" id="motivational-quotes-panel">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-yellow/5 rounded-full blur-2xl group-hover:bg-brand-yellow/10 transition-colors duration-500 pointer-events-none"></div>
          <div className="flex items-center gap-2 text-brand-blue-light text-xs font-bold tracking-wider uppercase mb-3">
            <Quote className="w-4 h-4" />
            Inspiration Generator
          </div>

          <div className="space-y-3 my-auto">
            <p className="text-base font-medium italic text-gray-200 leading-relaxed font-display">
              "{activeQuote.text}"
            </p>
            <p className="text-xs font-semibold text-brand-yellow/90">
              — {activeQuote.author}
            </p>
          </div>

          <button
            onClick={changeQuote}
            className="mt-6 text-xs text-brand-blue-light hover:text-brand-yellow font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
          >
            Power up mind <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Workout Routines Templates Quick-start & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-lower-section">
        {/* Quick Launch Workout Routines */}
        <div className="bg-brand-card p-6 rounded-xl border border-slate-800 space-y-4" id="quick-launch-routines-section">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-brand-blue-light" />
              Quick-Start Routine Templates
            </h2>
            <button
              onClick={() => onNavigateToTab('routines')}
              className="text-xs text-brand-blue-light hover:text-brand-yellow font-bold transition-colors duration-200 flex items-center gap-1"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3" id="quick-start-routines-list">
            {routines.map((routine) => (
              <div 
                key={routine.id}
                className="bg-brand-bg/50 hover:bg-brand-card-hover p-4 rounded-xl border border-slate-800 hover:border-brand-blue/40 transition-all duration-300 flex justify-between items-center group"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="font-bold font-display text-white text-base group-hover:text-brand-yellow transition-colors duration-200">
                    {routine.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {routine.description}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {routine.exercises.length} Exercises default
                  </p>
                </div>

                <button
                  onClick={() => onStartWorkout(routine.id)}
                  className="bg-brand-blue/10 hover:bg-brand-yellow group-hover:bg-brand-yellow text-brand-blue-light group-hover:text-brand-bg p-2.5 rounded-lg border border-brand-blue/25 hover:border-brand-yellow transition-all duration-300"
                  title="Launch Routine"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}

            {routines.length === 0 && (
              <div className="text-center py-8 bg-brand-bg/30 rounded-xl border border-dashed border-slate-800 text-gray-500">
                <p className="text-sm">No templates defined yet</p>
                <button
                  onClick={() => onNavigateToTab('routines')}
                  className="mt-2 text-xs text-brand-yellow hover:underline font-bold"
                >
                  Create Custom Routine
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Personal Goals Progress */}
        <div className="bg-brand-card p-6 rounded-xl border border-slate-800 space-y-4" id="dashboard-goals-panel">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-yellow" />
              Active Target Goals
            </h2>
            <button
              onClick={() => onNavigateToTab('goals')}
              className="text-xs text-brand-blue-light hover:text-brand-yellow font-bold transition-colors duration-200 flex items-center gap-1"
            >
              All Goals <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4" id="dashboard-goals-list">
            {pendingGoals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              return (
                <div key={goal.id} className="space-y-2 bg-brand-bg/30 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-200 font-display">
                        {goal.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                        {goal.category.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-brand-yellow font-mono">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-blue to-brand-yellow transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>Progress: {percentage}%</span>
                    <span>Target: {new Date(goal.deadlineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              );
            })}

            {pendingGoals.length === 0 && (
              <div className="text-center py-8 bg-brand-bg/30 rounded-xl border border-dashed border-slate-800 text-gray-500">
                <p className="text-sm">All goals crushed! Time to set new targets.</p>
                <button
                  onClick={() => onNavigateToTab('goals')}
                  className="mt-2 text-xs text-brand-yellow hover:underline font-bold"
                >
                  Create New Goal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
