import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Dumbbell, 
  Sparkles, 
  X, 
  Check, 
  Info,
  ChevronDown
} from 'lucide-react';
import { Exercise, WorkoutRoutine } from '../types';

interface RoutinesManagerProps {
  routines: WorkoutRoutine[];
  exercisesCatalog: Exercise[];
  onCreateRoutine: (routine: WorkoutRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartRoutine: (routineId: string) => void;
}

export default function RoutinesManager({
  routines,
  exercisesCatalog,
  onCreateRoutine,
  onDeleteRoutine,
  onStartRoutine
}: RoutinesManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [routineNotes, setRoutineNotes] = useState('');
  
  // Selected exercises for the new routine
  const [selectedExList, setSelectedExList] = useState<{
    exerciseId: string;
    defaultSetsCount: number;
    defaultReps: number;
    defaultWeight: number;
  }[]>([]);

  // Search/Filter catalog inside the routine creator
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedExCategory, setSelectedExCategory] = useState('All');

  // Filtered Exercises list for adding to routine
  const filteredCatalog = useMemo(() => {
    return exercisesCatalog.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                            ex.targetMuscle.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = selectedExCategory === 'All' || ex.category === selectedExCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercisesCatalog, catalogSearch, selectedExCategory]);

  // Add exercise template to the routine list
  const addExerciseToTemplate = (exId: string) => {
    if (selectedExList.some(item => item.exerciseId === exId)) return; // Avoid duplicates

    setSelectedExList(prev => [...prev, {
      exerciseId: exId,
      defaultSetsCount: 3,
      defaultReps: 10,
      defaultWeight: 100
    }]);
  };

  // Remove exercise template
  const removeExerciseFromTemplate = (exId: string) => {
    setSelectedExList(prev => prev.filter(item => item.exerciseId !== exId));
  };

  // Update specific field inside exercise template
  const updateTemplateField = (exId: string, field: 'defaultSetsCount' | 'defaultReps' | 'defaultWeight', value: number) => {
    setSelectedExList(prev => prev.map(item => {
      if (item.exerciseId === exId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Save the custom routine
  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) {
      alert("Please provide a name for your custom routine.");
      return;
    }
    if (selectedExList.length === 0) {
      alert("Please select at least one exercise to create a template.");
      return;
    }

    const newRoutine: WorkoutRoutine = {
      id: `rt-custom-${Date.now()}`,
      name: routineName.trim(),
      description: routineDesc.trim() || 'Custom workout routine',
      notes: routineNotes.trim() || undefined,
      exercises: selectedExList
    };

    onCreateRoutine(newRoutine);
    
    // Reset form & state
    setRoutineName('');
    setRoutineDesc('');
    setRoutineNotes('');
    setSelectedExList([]);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6" id="routines-manager-container">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-brand-card p-6 rounded-2xl border border-slate-800" id="routines-header">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-brand-yellow" />
            Routine Templates
          </h2>
          <p className="text-xs text-gray-400">
            Build specialized custom blueprints to launch structured, quick-logging active workout sessions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-brand-yellow/10"
          id="btn-create-routine"
        >
          <Plus className="w-4 h-4" />
          Create Blueprints
        </button>
      </div>

      {/* Blueprints Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="routines-templates-grid">
        {routines.map((routine) => (
          <div 
            key={routine.id}
            className="bg-brand-card rounded-xl border border-slate-800 hover:border-brand-blue/30 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
          >
            {/* Upper portion */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-extrabold text-lg text-white font-display group-hover:text-brand-yellow transition-colors line-clamp-1">
                  {routine.name}
                </h3>
                
                {/* Delete button (Avoid for default routines to keep standard blueprints, but enable for all or custom) */}
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${routine.name}" template?`)) {
                      onDeleteRoutine(routine.id);
                    }
                  }}
                  className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Routine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed min-h-[32px] line-clamp-2">
                {routine.description}
              </p>

              {/* Exercises in blueprint summary */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-blue-light">Target Blueprint:</h4>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {routine.exercises.map((item, idx) => {
                    const exInfo = exercisesCatalog.find(e => e.id === item.exerciseId);
                    return (
                      <div key={idx} className="flex justify-between text-xs text-gray-300">
                        <span className="font-medium truncate max-w-[150px]">
                          • {exInfo ? exInfo.name : 'Unknown Exercise'}
                        </span>
                        <span className="font-mono text-gray-500 text-[10px] whitespace-nowrap">
                          {item.defaultSetsCount}x{item.defaultReps} @ {item.defaultWeight} lbs
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Launch CTA Bar */}
            <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-mono">
                {routine.exercises.length} Exercises pre-set
              </span>

              <button
                onClick={() => onStartRoutine(routine.id)}
                className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-yellow text-white hover:text-brand-bg font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Blueprint
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: BUILD BLUEPRINT */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Create Custom Routine Blueprint</h3>
                <p className="text-xs text-gray-400">Design a standard template with configured sets, reps, and target weights.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content splits into Catalog (Left) and Blueprint structure (Right) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* LEFT COLUMN: EXERCISE SELECTOR */}
              <div className="w-full md:w-1/2 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/10">
                <div className="p-4 border-b border-slate-800/80 space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">1. Search & Select Exercises</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search exercises to add..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  {/* Cat filters */}
                  <div className="flex gap-1 overflow-x-auto">
                    {['All', 'Strength', 'Hypertrophy', 'Bodyweight', 'Cardio'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedExCategory(cat)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap border cursor-pointer ${
                          selectedExCategory === cat
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-slate-900 text-gray-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredCatalog.map(ex => {
                    const isAdded = selectedExList.some(item => item.exerciseId === ex.id);
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        disabled={isAdded}
                        onClick={() => addExerciseToTemplate(ex.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center ${
                          isAdded 
                            ? 'bg-slate-900 border-slate-800 text-gray-500 cursor-not-allowed opacity-50' 
                            : 'bg-brand-bg/50 border-slate-800 hover:border-brand-blue/30 cursor-pointer'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-xs text-gray-200">{ex.name}</h4>
                          <span className="text-[9px] uppercase font-bold text-brand-blue-light">{ex.targetMuscle} • {ex.equipment}</span>
                        </div>
                        {isAdded ? (
                          <Check className="w-4 h-4 text-brand-yellow" />
                        ) : (
                          <Plus className="w-4 h-4 text-brand-blue-light" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: BLUEPRINT CONFIGURATION */}
              <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-brand-card">
                <form onSubmit={handleSaveRoutine} className="flex flex-col h-full overflow-hidden">
                  
                  {/* Routine info header */}
                  <div className="p-4 border-b border-slate-800 space-y-3 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">2. Blueprint Blueprint Info</span>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Blueprint Title (e.g. Hypertrophy Upper)"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-blue"
                      />
                      <input
                        type="text"
                        placeholder="Sub-description (e.g. Focus on chest power)"
                        value={routineDesc}
                        onChange={(e) => setRoutineDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Configured Exercises Scroll list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      3. Pre-Configure Sets, Reps & Weight ({selectedExList.length})
                    </span>

                    {selectedExList.map((item, idx) => {
                      const exInfo = exercisesCatalog.find(e => e.id === item.exerciseId);
                      return (
                        <div 
                          key={item.exerciseId}
                          className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-3 relative group"
                        >
                          <button
                            type="button"
                            onClick={() => removeExerciseFromTemplate(item.exerciseId)}
                            className="absolute top-2.5 right-2.5 text-gray-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div>
                            <span className="text-[10px] uppercase font-extrabold text-brand-yellow font-display mr-1.5">{idx + 1}</span>
                            <span className="text-xs font-bold text-white">{exInfo ? exInfo.name : 'Unknown Exercise'}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {/* Sets count */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-gray-500 uppercase font-bold">Sets</label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.defaultSetsCount}
                                onChange={(e) => updateTemplateField(item.exerciseId, 'defaultSetsCount', parseInt(e.target.value) || 1)}
                                className="w-full bg-brand-bg border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs font-semibold text-white focus:outline-none"
                              />
                            </div>
                            {/* Reps count */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-gray-500 uppercase font-bold">Reps</label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.defaultReps}
                                onChange={(e) => updateTemplateField(item.exerciseId, 'defaultReps', parseInt(e.target.value) || 1)}
                                className="w-full bg-brand-bg border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs font-semibold text-white focus:outline-none"
                              />
                            </div>
                            {/* Weight default */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-gray-500 uppercase font-bold">Weight (lbs)</label>
                              <input
                                type="number"
                                min="0"
                                required
                                value={item.defaultWeight}
                                onChange={(e) => updateTemplateField(item.exerciseId, 'defaultWeight', parseFloat(e.target.value) || 0)}
                                className="w-full bg-brand-bg border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs font-semibold text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {selectedExList.length === 0 && (
                      <div className="text-center py-16 text-gray-500 border border-dashed border-slate-800 rounded-xl">
                        <Info className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                        <p className="text-xs">No exercises configured in this template yet.</p>
                        <p className="text-[10px] text-gray-600">Select exercises on the left column to populate.</p>
                      </div>
                    )}
                  </div>

                  {/* Save button footer */}
                  <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex-shrink-0">
                    <button
                      type="submit"
                      disabled={selectedExList.length === 0}
                      className="w-full py-3 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Custom Blueprint
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
