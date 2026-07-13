import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  Save, 
  Award, 
  Search, 
  X, 
  Zap, 
  Star,
  ChevronRight,
  Dumbbell,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Exercise, LoggedExercise, ExerciseSet, LoggedWorkout, WorkoutRoutine } from '../types';

interface WorkoutLoggerProps {
  activeRoutine?: WorkoutRoutine;
  exercisesCatalog: Exercise[];
  onSaveWorkout: (workout: LoggedWorkout) => void;
  onCancelWorkout: () => void;
  onAddCustomExercise: (newEx: Exercise) => void;
}

export default function WorkoutLogger({
  activeRoutine,
  exercisesCatalog,
  onSaveWorkout,
  onCancelWorkout,
  onAddCustomExercise
}: WorkoutLoggerProps) {
  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active workout structure
  const [workoutName, setWorkoutName] = useState(() => 
    activeRoutine ? activeRoutine.name : '🏋️ Gym Workout Session'
  );
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  
  // Modals & rating states
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  // Finished session ratings
  const [sessionRating, setSessionRating] = useState(4);
  const [sessionEnergy, setSessionEnergy] = useState(4);
  const [sessionNotes, setSessionNotes] = useState('');

  // Exercise search & custom exercise states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<Exercise['category']>('Strength');
  const [newExEquipment, setNewExEquipment] = useState<Exercise['equipment']>('Barbell');
  const [newExMuscle, setNewExMuscle] = useState('');

  // Start timer on component mount
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // If a routine is provided, build initial workout exercises from template
  useEffect(() => {
    if (activeRoutine) {
      const initialExercises: LoggedExercise[] = activeRoutine.exercises.map(entry => {
        const baseEx = exercisesCatalog.find(e => e.id === entry.exerciseId);
        const name = baseEx ? baseEx.name : 'Unknown Exercise';
        const category = baseEx ? baseEx.category : 'Strength';
        
        // Generate sets based on the routine parameters
        const sets: ExerciseSet[] = [];
        for (let i = 0; i < entry.defaultSetsCount; i++) {
          sets.push({
            id: `set-${Date.now()}-${Math.random()}`,
            reps: entry.defaultReps,
            weight: entry.defaultWeight,
            isCompleted: false
          });
        }

        return {
          id: `le-${Date.now()}-${Math.random()}`,
          exerciseId: entry.exerciseId,
          name,
          category,
          sets
        };
      });

      setLoggedExercises(initialExercises);
    }
  }, [activeRoutine, exercisesCatalog]);

  // Format active timer
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // Add exercise to active session
  const selectExerciseForWorkout = (exercise: Exercise) => {
    const newLoggedEx: LoggedExercise = {
      id: `le-${Date.now()}-${Math.random()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: [
        {
          id: `set-${Date.now()}-${Math.random()}`,
          reps: 10,
          weight: 100,
          isCompleted: false
        }
      ]
    };
    setLoggedExercises(prev => [...prev, newLoggedEx]);
    setShowAddExerciseModal(false);
  };

  // Add customized exercise
  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !newExMuscle.trim()) return;

    const newEx: Exercise = {
      id: `ex-custom-${Date.now()}`,
      name: newExName.trim(),
      category: newExCategory,
      equipment: newExEquipment,
      targetMuscle: newExMuscle.trim(),
      description: 'Custom exercise added by user.'
    };

    onAddCustomExercise(newEx);
    selectExerciseForWorkout(newEx);
    
    // Reset form
    setNewExName('');
    setNewExMuscle('');
    setShowNewExerciseForm(false);
  };

  // Set management helpers
  const handleAddSet = (exerciseId: string) => {
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: `set-${Date.now()}-${Math.random()}`,
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : 100,
          isCompleted: false
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      }
      return ex;
    }));
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        // Must maintain at least one set or offer to delete exercise
        const filteredSets = ex.sets.filter(s => s.id !== setId);
        return {
          ...ex,
          sets: filteredSets.length > 0 ? filteredSets : ex.sets
        };
      }
      return ex;
    }));
  };

  const handleUpdateSetField = (exerciseId: string, setId: string, field: keyof ExerciseSet, value: any) => {
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id === setId) {
              return { ...s, [field]: value };
            }
            return s;
          })
        };
      }
      return ex;
    }));
  };

  const handleDeleteExerciseFromWorkout = (exerciseId: string) => {
    setLoggedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  // Filter list of exercises in modal
  const filteredExercises = useMemo(() => {
    return exercisesCatalog.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ex.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || ex.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [exercisesCatalog, searchQuery, categoryFilter]);

  // Submit final workout to history
  const handleFinishWorkout = () => {
    if (loggedExercises.length === 0) {
      alert("Please add at least one exercise to save a workout.");
      return;
    }

    // Prepare workout object
    const finalWorkout: LoggedWorkout = {
      id: `workout-${Date.now()}`,
      name: workoutName.trim() || 'Gym Session',
      date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
      durationMinutes: Math.max(1, Math.ceil(secondsElapsed / 60)),
      exercises: loggedExercises.filter(ex => ex.sets.some(s => s.isCompleted)), // save completed only
      rating: sessionRating,
      energyLevel: sessionEnergy,
      notes: sessionNotes.trim() || undefined
    };

    if (finalWorkout.exercises.length === 0) {
      alert("No exercises sets were marked as completed! Please check off at least one set.");
      return;
    }

    onSaveWorkout(finalWorkout);
    setShowFinishModal(false);
  };

  return (
    <div className="space-y-6" id="active-session-logger">
      {/* Session Header Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-card p-6 rounded-2xl border border-brand-blue/30 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="bg-brand-blue/20 p-3.5 rounded-xl border border-brand-blue-light/30">
            <Clock className="w-7 h-7 text-brand-yellow animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-red-400 font-display">ACTIVE SESSION TIMER</span>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="text-xl md:text-2xl font-extrabold text-white bg-transparent border-b border-dashed border-slate-700 hover:border-brand-yellow focus:border-brand-yellow focus:outline-none py-0.5 max-w-xs md:max-w-md font-display"
                placeholder="Workout Name..."
              />
            </div>
          </div>
        </div>

        {/* Workout Timer + Finish Buttons */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="bg-brand-bg/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2.5">
            <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider font-display">TIME</span>
            <span className="text-lg font-bold font-mono text-brand-yellow">
              {formatTime(secondsElapsed)}
            </span>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-gray-300"
            title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
          >
            <RotateCcw className={`w-4 h-4 ${isTimerRunning ? '' : 'rotate-180 transition-transform'}`} />
          </button>

          <button
            onClick={() => setShowFinishModal(true)}
            className="flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md shadow-brand-yellow/15 text-sm font-display tracking-wide"
          >
            <Save className="w-4 h-4" />
            FINISH
          </button>
        </div>
      </div>

      {/* Main Exercises List in current workout */}
      <div className="space-y-6" id="logged-exercises-container">
        {loggedExercises.map((loggedEx, exIdx) => (
          <div 
            key={loggedEx.id}
            className="bg-brand-card rounded-xl border border-slate-800/80 overflow-hidden"
          >
            {/* Header: Exercise Info */}
            <div className="bg-slate-900/50 p-4 border-b border-slate-800/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-blue-glow flex items-center justify-center text-brand-blue-light border border-brand-blue/30">
                  <span className="text-xs font-bold font-mono">{exIdx + 1}</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    {loggedEx.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-brand-blue-light tracking-wide">
                    {loggedEx.category}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteExerciseFromWorkout(loggedEx.id)}
                className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
                title="Remove Exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sets Panel */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 w-16 text-center">Set</th>
                    <th className="py-2.5 w-24 text-center">Previous</th>
                    <th className="py-2.5 w-32 text-center">Weight (lbs)</th>
                    <th className="py-2.5 w-32 text-center">Reps</th>
                    <th className="py-2.5 w-20 text-center">PR?</th>
                    <th className="py-2.5 w-16 text-center">Done</th>
                    <th className="py-2.5 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loggedEx.sets.map((set, setIdx) => (
                    <tr 
                      key={set.id}
                      className={`transition-colors duration-150 ${set.isCompleted ? 'bg-brand-blue-glow/10' : ''}`}
                    >
                      <td className="py-2.5 text-center font-bold text-sm text-gray-300 font-display">
                        {setIdx + 1}
                      </td>
                      
                      <td className="py-2.5 text-center text-xs text-gray-500 font-mono">
                        —
                      </td>

                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 max-w-[120px] mx-auto">
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => handleUpdateSetField(loggedEx.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-brand-blue"
                            min="0"
                            step="0.5"
                          />
                          <span className="text-[10px] text-gray-500 uppercase font-bold font-mono">lbs</span>
                        </div>
                      </td>

                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 max-w-[100px] mx-auto">
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => handleUpdateSetField(loggedEx.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                            className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-brand-blue"
                            min="0"
                          />
                          <span className="text-[10px] text-gray-500 uppercase font-bold font-mono">reps</span>
                        </div>
                      </td>

                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateSetField(loggedEx.id, set.id, 'isPR', !set.isPR)}
                          className={`p-1 rounded transition-all duration-200 ${
                            set.isPR 
                              ? 'bg-brand-yellow/25 text-brand-yellow border border-brand-yellow/40' 
                              : 'text-slate-600 hover:text-slate-400 border border-transparent'
                          }`}
                          title="Mark as Personal Record"
                        >
                          <Award className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateSetField(loggedEx.id, set.id, 'isCompleted', !set.isCompleted)}
                          className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-all duration-200 ${
                            set.isCompleted 
                              ? 'bg-brand-yellow text-brand-bg border-brand-yellow' 
                              : 'bg-slate-900 border border-slate-700 hover:border-brand-blue-light'
                          }`}
                        >
                          {set.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </td>

                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSet(loggedEx.id, set.id)}
                          className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-slate-800/80 transition-colors"
                          disabled={loggedEx.sets.length <= 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Set Add footer */}
            <div className="bg-slate-900/20 p-3 border-t border-slate-800/50 flex justify-start">
              <button
                type="button"
                onClick={() => handleAddSet(loggedEx.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-blue-light hover:text-brand-yellow transition-all px-3 py-1.5 rounded bg-brand-blue/5 hover:bg-brand-blue/10 border border-brand-blue/15"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD SET
              </button>
            </div>
          </div>
        ))}

        {/* Empty state: No exercises in current workout */}
        {loggedExercises.length === 0 && (
          <div className="bg-brand-card rounded-xl border border-dashed border-slate-800 py-16 px-6 text-center space-y-3" id="empty-workout-logger-message">
            <div className="w-14 h-14 bg-slate-900/80 rounded-full flex items-center justify-center border border-slate-800 mx-auto">
              <Dumbbell className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-gray-200">Session is Empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Press the Add Exercise button below to select templates or build your unique training flow.
              </p>
            </div>
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="mt-2 bg-brand-blue/15 hover:bg-brand-blue text-brand-blue-light hover:text-white border border-brand-blue/30 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Add Your First Exercise
            </button>
          </div>
        )}

        {/* Control Footer */}
        <div className="flex gap-3 justify-between items-center pt-4" id="active-session-logger-footer">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel? This will wipe the active logged session.")) {
                onCancelWorkout();
              }
            }}
            className="text-xs font-bold text-gray-400 hover:text-red-400 uppercase tracking-wider py-2.5 px-4 rounded border border-transparent hover:border-slate-800"
          >
            Cancel Workout
          </button>

          <button
            onClick={() => setShowAddExerciseModal(true)}
            className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm font-display tracking-wide"
          >
            <Plus className="w-4 h-4" />
            ADD EXERCISE
          </button>
        </div>
      </div>

      {/* MODAL 1: ADD EXERCISE CATALOG */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Add Exercise</h3>
                <p className="text-xs text-gray-400">Select an exercise to add to your workout session</p>
              </div>
              <button 
                onClick={() => {
                  setShowAddExerciseModal(false);
                  setShowNewExerciseForm(false);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle form button */}
            <div className="px-5 pt-4">
              <button
                onClick={() => setShowNewExerciseForm(!showNewExerciseForm)}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold border border-dashed transition-colors flex items-center justify-center gap-1.5 bg-brand-blue/5 border-brand-blue/30 text-brand-blue-light hover:bg-brand-blue/10"
              >
                {showNewExerciseForm ? 'Back to Exercise List' : '🛠️ Create New Custom Exercise'}
              </button>
            </div>

            {showNewExerciseForm ? (
              /* CREATE EXERCISE FORM */
              <form onSubmit={handleCreateCustomExercise} className="p-5 flex-1 overflow-y-auto space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exercise Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incline Bench Press"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <select
                      value={newExCategory}
                      onChange={(e) => setNewExCategory(e.target.value as Exercise['category'])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Strength">Strength</option>
                      <option value="Hypertrophy">Hypertrophy</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Bodyweight">Bodyweight</option>
                      <option value="Flexibility">Flexibility</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Equipment</label>
                    <select
                      value={newExEquipment}
                      onChange={(e) => setNewExEquipment(e.target.value as Exercise['equipment'])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Barbell">Barbell</option>
                      <option value="Dumbbell">Dumbbell</option>
                      <option value="Machine">Machine</option>
                      <option value="Bodyweight">Bodyweight</option>
                      <option value="Cables">Cables</option>
                      <option value="Kettlebell">Kettlebell</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Muscle Group</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest, Quads, Biceps"
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold rounded-xl transition-all font-display text-sm uppercase tracking-wider"
                  >
                    Add & Start Logging
                  </button>
                </div>
              </form>
            ) : (
              /* SEARCH & LIST OF EXERCISES */
              <>
                {/* Search Bar & Filters */}
                <div className="p-5 pb-2 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by exercise name or target muscle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  {/* Horizontal Category Scroller */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {['All', 'Strength', 'Hypertrophy', 'Bodyweight', 'Cardio'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-slate-900 text-gray-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercises Catalog List Scroll */}
                <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-2">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => selectExerciseForWorkout(ex)}
                      className="w-full text-left bg-slate-900/60 hover:bg-brand-card-hover p-4 rounded-xl border border-slate-800 hover:border-brand-blue/30 transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-gray-200 group-hover:text-brand-yellow transition-colors font-display">
                          {ex.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase font-bold text-brand-blue-light">{ex.category}</span>
                          <span className="text-gray-600 text-xs">•</span>
                          <span className="text-[10px] text-gray-400">{ex.equipment}</span>
                          <span className="text-gray-600 text-xs">•</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{ex.targetMuscle}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow transition-colors" />
                    </button>
                  ))}

                  {filteredExercises.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">No exercises matched your search.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('All');
                        }}
                        className="text-xs text-brand-yellow hover:underline mt-1 font-bold"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: FINISH WORKOUT DIALOG (RATINGS & NOTES) */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-brand-yellow-glow rounded-full flex items-center justify-center mx-auto border border-brand-yellow/30">
                <Award className="w-8 h-8 text-brand-yellow" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Crushed It! 🎉</h3>
              <p className="text-xs text-gray-400">Evaluate your performance to complete the session log.</p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Rating Star Selection */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Session Quality Rating</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSessionRating(star)}
                      className="p-1 cursor-pointer transition-transform duration-200 hover:scale-125 focus:outline-none"
                    >
                      <Star 
                        className={`w-7 h-7 ${
                          star <= sessionRating 
                            ? 'text-brand-yellow fill-brand-yellow' 
                            : 'text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level Selection */}
              <div className="space-y-1.5 text-center pt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Energy Level</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((bolt) => (
                    <button
                      key={bolt}
                      onClick={() => setSessionEnergy(bolt)}
                      className="p-1 cursor-pointer transition-transform duration-200 hover:scale-125 focus:outline-none"
                    >
                      <Zap 
                        className={`w-7 h-7 ${
                          bolt <= sessionEnergy 
                            ? 'text-brand-yellow fill-brand-yellow' 
                            : 'text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Session Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workout Notes / Reflections</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="How did it feel? Did you hit PRs or break sweat ceilings?"
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="py-3 text-xs font-bold border border-slate-800 hover:bg-slate-800 rounded-xl text-gray-400 uppercase tracking-wider"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="py-3 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-brand-yellow/15"
              >
                Log Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
