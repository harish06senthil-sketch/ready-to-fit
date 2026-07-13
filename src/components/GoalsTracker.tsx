import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  X, 
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { FitnessGoal, GoalCategory, Exercise } from '../types';

interface GoalsTrackerProps {
  goals: FitnessGoal[];
  exercisesCatalog: Exercise[];
  onCreateGoal: (newGoal: FitnessGoal) => void;
  onUpdateGoalProgress: (goalId: string, current: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function GoalsTracker({
  goals,
  exercisesCatalog,
  onCreateGoal,
  onUpdateGoalProgress,
  onDeleteGoal
}: GoalsTrackerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('exercise_weight');
  const [selectedExId, setSelectedExId] = useState('');
  const [targetVal, setTargetVal] = useState<number>(150);
  const [currentVal, setCurrentVal] = useState<number>(100);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // 30 days in future
    return d.toISOString().split('T')[0];
  });

  // Calculate default unit based on selected category
  const defaultUnit = useMemo(() => {
    switch (goalCategory) {
      case 'exercise_weight':
      case 'body_weight':
        return 'lbs';
      case 'workouts_count':
        return 'workouts';
      case 'streak':
        return 'weeks';
      default:
        return 'units';
    }
  }, [goalCategory]);

  // Handle creating the goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      alert("Please enter a clear goal title.");
      return;
    }

    const newGoal: FitnessGoal = {
      id: `goal-${Date.now()}`,
      title: goalTitle.trim(),
      category: goalCategory,
      exerciseId: goalCategory === 'exercise_weight' ? selectedExId || undefined : undefined,
      targetValue: targetVal,
      currentValue: currentVal,
      unit: defaultUnit,
      deadlineDate: deadline,
      isCompleted: currentVal >= targetVal
    };

    onCreateGoal(newGoal);

    // Reset Form
    setGoalTitle('');
    setGoalCategory('exercise_weight');
    setSelectedExId('');
    setTargetVal(150);
    setCurrentVal(100);
    setShowCreateModal(false);
  };

  // Separate active vs completed goals
  const activeGoals = useMemo(() => goals.filter(g => !g.isCompleted), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.isCompleted), [goals]);

  return (
    <div className="space-y-6" id="goals-tracker-container">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-brand-card p-6 rounded-2xl border border-slate-800" id="goals-header">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <Trophy className="w-6 h-6 text-brand-yellow" />
            Personal Targets & Goals
          </h2>
          <p className="text-xs text-gray-400">
            Set and log structural workout metrics, weight plate targets, or session totals to stay hyper-focused.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-brand-yellow/10"
          id="btn-create-goal"
        >
          <Plus className="w-4 h-4" />
          Declare Target
        </button>
      </div>

      {/* Grid: Active Goals & Completed Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="goals-listing-grid">
        
        {/* ACTIVE TARGETS */}
        <div className="lg:col-span-8 space-y-4" id="active-targets-column">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue-light flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-brand-blue-light" />
            Active Benchmarks ({activeGoals.length})
          </h3>

          <div className="space-y-4" id="active-goals-list">
            {activeGoals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              return (
                <div 
                  key={goal.id} 
                  className="bg-brand-card p-5 rounded-xl border border-slate-800/80 hover:border-brand-blue/30 transition-all duration-300 space-y-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white font-display text-base">
                        {goal.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-gray-400 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          {goal.category.replace('_', ' ')}
                        </span>
                        <span className="text-gray-600 text-xs">•</span>
                        <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Target: {new Date(goal.deadlineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Remove Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress visual */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">Update Progress:</span>
                        
                        {/* Progressive controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateGoalProgress(goal.id, Math.max(0, goal.currentValue - 5))}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-gray-300 font-bold px-2 py-0.5 text-xs transition-colors"
                          >
                            -5
                          </button>
                          
                          <input
                            type="number"
                            value={goal.currentValue}
                            onChange={(e) => onUpdateGoalProgress(goal.id, parseFloat(e.target.value) || 0)}
                            className="bg-slate-900 border border-slate-800 rounded font-mono font-extrabold text-xs text-brand-yellow w-14 text-center py-0.5"
                          />

                          <button
                            type="button"
                            onClick={() => onUpdateGoalProgress(goal.id, goal.currentValue + 5)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-gray-300 font-bold px-2 py-0.5 text-xs transition-colors"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-gray-300">
                        {goal.currentValue} / <span className="text-brand-yellow font-extrabold">{goal.targetValue} {goal.unit}</span>
                      </span>
                    </div>

                    {/* Proportional slider bar */}
                    <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-blue to-brand-yellow transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold font-mono">
                      <span>PROGRESS: {percentage}%</span>
                      {percentage >= 100 && (
                        <span className="text-brand-yellow animate-pulse flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> MILESTONE ACHIEVED!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {activeGoals.length === 0 && (
              <div className="text-center py-16 bg-brand-card rounded-xl border border-dashed border-slate-800 text-gray-500">
                <Target className="w-10 h-10 mx-auto text-slate-700 animate-pulse mb-3" />
                <h4 className="font-bold text-base text-gray-200">No Active Goals</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                  Ready to level up? Click "Declare Target" to write a workout milestone and start charting progression.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COMPLETED / CRUSHED GOALS */}
        <div className="lg:col-span-4 space-y-4" id="completed-targets-column">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-yellow flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-brand-yellow fill-brand-yellow/10" />
            Crushed Milestones ({completedGoals.length})
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="completed-goals-list">
            {completedGoals.map((goal) => (
              <div 
                key={goal.id} 
                className="bg-brand-blue/5 p-4 rounded-xl border border-brand-yellow/25 hover:border-brand-yellow/40 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-gray-300 line-through decoration-brand-yellow/60 font-display">
                      {goal.title}
                    </h4>
                    <span className="inline-block text-[8px] bg-brand-yellow/15 text-brand-yellow font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                      COMPLETED
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-slate-800/80 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] text-gray-400 font-mono">
                  <span>MET: {goal.targetValue} {goal.unit}</span>
                  <span>🏆 Champion status</span>
                </div>
              </div>
            ))}

            {completedGoals.length === 0 && (
              <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-800/50 text-gray-500">
                <p className="text-xs">No medals logged yet. Consistent progression leads to solid triumphs.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: DECLARE GOAL TARGET */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Declare Training Target</h3>
                <p className="text-xs text-gray-400">Set a specific numeric benchmark with deadlines.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateGoal} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Goal Title / Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Squat 225 lbs for sets"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Goal Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="exercise_weight">Exercise Max Weight Lifted</option>
                    <option value="workouts_count">Total Workout Session Count</option>
                    <option value="streak">Active Week Routine Streak</option>
                    <option value="body_weight">Target Body Weight</option>
                  </select>
                </div>

                {/* If exercise selected, show exercise selection */}
                {goalCategory === 'exercise_weight' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Exercise</label>
                    <select
                      value={selectedExId}
                      onChange={(e) => setSelectedExId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                      required={goalCategory === 'exercise_weight'}
                    >
                      <option value="">-- Choose Exercise --</option>
                      {exercisesCatalog.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Value ({defaultUnit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetVal}
                    onChange={(e) => setTargetVal(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Starting Value ({defaultUnit})</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentVal}
                    onChange={(e) => setCurrentVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Deadline Date</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand-yellow/15"
                >
                  Confirm Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
