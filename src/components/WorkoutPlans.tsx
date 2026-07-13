import React from 'react';
import { 
  Plus, 
  Check, 
  Dumbbell, 
  Zap, 
  Flame, 
  RotateCw, 
  Compass, 
  Sparkles,
  ShieldCheck,
  Play,
  Youtube
} from 'lucide-react';
import { Exercise, WorkoutRoutine } from '../types';

// Import our beautiful AI generated image artifacts
const strengthImg = "/src/assets/images/strength_plan_1783833144032.jpg";
const hypertrophyImg = "/src/assets/images/hypertrophy_plan_1783833153949.jpg";
const cardioImg = "/src/assets/images/cardio_plan_1783833165944.jpg";
const bodyweightImg = "/src/assets/images/bodyweight_plan_1783833176291.jpg";
const flexibilityImg = "/src/assets/images/flexibility_plan_1783833188578.jpg";

interface WorkoutPlansProps {
  routines: WorkoutRoutine[];
  exercisesCatalog: Exercise[];
  onCreateRoutine: (routine: WorkoutRoutine) => void;
  onStartRoutineDirectly?: (routine: WorkoutRoutine) => void;
}

export default function WorkoutPlans({ routines, exercisesCatalog, onCreateRoutine, onStartRoutineDirectly }: WorkoutPlansProps) {
  
  // Custom definitions for the 5 AI generated workout plan packages
  const aiPlans = [
    {
      id: 'plan-cyber-strength',
      name: '⚡ Cyber Strength Blueprint',
      category: 'STRENGTH',
      tagline: 'Neuro-Muscular Peak Mechanical Tension',
      description: 'A heavy compound movement split targeting absolute load capacity, central nervous system conditioning, and raw structural strength.',
      image: strengthImg,
      accentColor: 'border-brand-yellow text-brand-yellow',
      glowShadow: 'shadow-brand-yellow/5 hover:border-brand-yellow/40',
      exercises: [
        { exerciseId: 'ex-squat', defaultSetsCount: 5, defaultReps: 5, defaultWeight: 185 },
        { exerciseId: 'ex-bench-press', defaultSetsCount: 5, defaultReps: 5, defaultWeight: 135 },
        { exerciseId: 'ex-deadlift', defaultSetsCount: 3, defaultReps: 5, defaultWeight: 225 },
        { exerciseId: 'ex-overhead-press', defaultSetsCount: 3, defaultReps: 5, defaultWeight: 95 }
      ],
      notes: 'Rest 120-180 seconds between sets for full ATP-CP restoration.',
      youtubeUrl: 'https://www.youtube.com/watch?v=U0L9v86I1Sg'
    },
    {
      id: 'plan-synthwave-hypertrophy',
      name: '🔥 Synthwave Hypertrophy Split',
      category: 'HYPERTROPHY',
      tagline: 'Metabolic Stress & Cellular Volumization',
      description: 'High volume, eccentric loading, and maximum mechanical tension designed to stimulate sarcoplasmic hypertrophy and massive muscle fullness.',
      image: hypertrophyImg,
      accentColor: 'border-pink-500 text-pink-400',
      glowShadow: 'shadow-pink-500/5 hover:border-pink-500/40',
      exercises: [
        { exerciseId: 'ex-bench-press', defaultSetsCount: 4, defaultReps: 10, defaultWeight: 115 },
        { exerciseId: 'ex-lat-pulldown', defaultSetsCount: 4, defaultReps: 12, defaultWeight: 100 },
        { exerciseId: 'ex-dumbbell-row', defaultSetsCount: 3, defaultReps: 10, defaultWeight: 45 },
        { exerciseId: 'ex-dumbbell-curl', defaultSetsCount: 3, defaultReps: 12, defaultWeight: 25 },
        { exerciseId: 'ex-tricep-pushdown', defaultSetsCount: 3, defaultReps: 15, defaultWeight: 50 }
      ],
      notes: 'Rest 60-90 seconds. Focus strictly on deep mind-muscle contraction.',
      youtubeUrl: 'https://www.youtube.com/watch?v=2e6i_S_0eH4'
    },
    {
      id: 'plan-neon-cardio',
      name: '🏃 Neon Cardio Shred Engine',
      category: 'CARDIO',
      tagline: 'Maximal VO2 Conditioning & EPOC Ignition',
      description: 'High-intensity interval cardio sequences mapped to blast calories, augment lung function capacity, and spike cellular oxygen consumption.',
      image: cardioImg,
      accentColor: 'border-cyan-400 text-cyan-400',
      glowShadow: 'shadow-cyan-400/5 hover:border-cyan-400/40',
      exercises: [
        { exerciseId: 'ex-treadmill-run', defaultSetsCount: 4, defaultReps: 12, defaultWeight: 0 }
      ],
      notes: 'Toggle sprint/recovery intervals: 1 min active run, 1 min recovery walk.',
      youtubeUrl: 'https://www.youtube.com/watch?v=ml6cT4AZdqI'
    },
    {
      id: 'plan-matrix-calisthenics',
      name: '🤸 Matrix Gymnastics Mastery',
      category: 'BODYWEIGHT',
      tagline: 'Relative Leverage Strength & Agility',
      description: 'A dedicated bodyweight and bar alignment routing meant to build shoulder stability, posterior pull power, and extreme core compression limits.',
      image: bodyweightImg,
      accentColor: 'border-green-400 text-green-400',
      glowShadow: 'shadow-green-400/5 hover:border-green-400/40',
      exercises: [
        { exerciseId: 'ex-pullup', defaultSetsCount: 5, defaultReps: 8, defaultWeight: 0 }
      ],
      notes: 'Ensure perfect lock-out on each rep. Control the negative descent.',
      youtubeUrl: 'https://www.youtube.com/watch?v=R0_mO6uL6g0'
    },
    {
      id: 'plan-zen-longevity',
      name: '🧘 Zen Longevity Active Flow',
      category: 'FLEXIBILITY',
      tagline: 'Decompression & Joint Capsule Mobility',
      description: 'A focused restoration sequence prioritizing muscular length-tension re-education, active spinal relief, and deep postural correction.',
      image: flexibilityImg,
      accentColor: 'border-purple-500 text-purple-400',
      glowShadow: 'shadow-purple-500/5 hover:border-purple-500/40',
      exercises: [
        { exerciseId: 'ex-pullup', defaultSetsCount: 3, defaultReps: 6, defaultWeight: 0 } // Standard bar hang for flexibility
      ],
      notes: 'Excellent daily morning routine. Hold passive hangs and breath slowly.',
      youtubeUrl: 'https://www.youtube.com/watch?v=COp7BR_Dvps'
    }
  ];

  const handleImportPlan = (plan: typeof aiPlans[0]) => {
    // Construct WorkoutRoutine payload
    const newRoutine: WorkoutRoutine = {
      id: `rt-ai-${plan.id}-${Date.now()}`,
      name: plan.name,
      description: plan.description,
      notes: plan.notes,
      exercises: plan.exercises
    };

    onCreateRoutine(newRoutine);
    
    // Play cool retro dual sound using Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}

    alert(`⚡ SUCCESS! The pre-configured plan "${plan.name}" has been loaded and synced into your Blueprint Templates folder. Go to the "Routines" tab to start logging!`);
  };

  const handleStartDirectly = (plan: typeof aiPlans[0]) => {
    // Construct WorkoutRoutine payload
    const newRoutine: WorkoutRoutine = {
      id: `rt-ai-${plan.id}-${Date.now()}`,
      name: plan.name,
      description: plan.description,
      notes: plan.notes,
      exercises: plan.exercises
    };

    if (onStartRoutineDirectly) {
      onStartRoutineDirectly(newRoutine);
    }
  };

  const isPlanSaved = (planName: string) => {
    return routines.some(r => r.name.toLowerCase() === planName.toLowerCase());
  };

  return (
    <div className="space-y-6 mt-4" id="ai-premium-plans-section">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 bg-brand-card p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-yellow animate-pulse" />
            <h3 className="text-base md:text-lg font-extrabold text-white font-display uppercase tracking-tight">AI PRE-MADE BLUEPRINT MATRIX</h3>
          </div>
          <p className="text-xs text-gray-400">
            Professional high-performance training templates pre-configured with distinct targets and gorgeous AI visuals.
          </p>
        </div>
        <span className="text-[10px] bg-slate-900 border border-slate-800 text-brand-yellow font-mono font-bold px-3 py-1 rounded-lg uppercase tracking-widest text-center self-start md:self-auto">
          ★ premium training vaults
        </span>
      </div>

      {/* Grid of workout plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="ai-plans-card-grid">
        {aiPlans.map((plan) => {
          const alreadySaved = isPlanSaved(plan.name);
          return (
            <div 
              key={plan.id}
              className={`bg-brand-card rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all duration-500 overflow-hidden flex flex-col justify-between group shadow-lg ${plan.glowShadow}`}
            >
              <div>
                {/* Visual Image container with Category Badge */}
                <div className="relative h-48 overflow-hidden bg-slate-950">
                  <img 
                    src={plan.image} 
                    alt={plan.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85"
                  />
                  
                  {/* Subtle Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-black/40"></div>

                  {/* Absolute Badge */}
                  <span className={`absolute top-4 left-4 border text-[9px] font-mono font-extrabold px-2.5 py-1 rounded bg-brand-card/90 backdrop-blur-sm tracking-wider uppercase ${plan.accentColor}`}>
                    {plan.category}
                  </span>
                </div>

                {/* Body details */}
                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white group-hover:text-brand-yellow transition-colors font-display tracking-tight">
                      {plan.name}
                    </h4>
                    <span className="block text-[10px] font-semibold text-slate-500 font-mono">
                      {plan.tagline}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Exercises Checklist Pre-views */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/60">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block">EXERCISES CONFIGURED:</span>
                    <div className="space-y-1.5">
                      {plan.exercises.map((item, index) => {
                        const baseEx = exercisesCatalog.find(e => e.id === item.exerciseId);
                        return (
                          <div key={index} className="flex justify-between items-center text-[11px] text-gray-300">
                            <span className="font-semibold truncate max-w-[170px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                              {baseEx ? baseEx.name : 'Target Drill'}
                            </span>
                            <span className="font-mono text-gray-500 text-[10px]">
                              {item.defaultSetsCount}x{item.defaultReps} @ {item.defaultWeight} lbs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Youtube Video Tutorial / Demo Link */}
                  <div className="pt-3 border-t border-slate-800/60">
                    <a 
                      href={plan.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer w-full justify-center group shadow shadow-red-950/40"
                    >
                      <Youtube className="w-3.5 h-3.5 fill-current text-red-500 group-hover:text-white transition-colors" />
                      <span>WATCH VIDEO TUTORIAL</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="p-5 pt-2 bg-slate-950/20 border-t border-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-auto">
                <span className="text-[10px] text-slate-500 font-mono font-semibold self-start sm:self-auto">
                  {plan.exercises.length} Exercises
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {alreadySaved ? (
                    <span className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-850 text-[10px] text-emerald-400 border border-emerald-500/20 rounded-lg font-bold uppercase tracking-wider">
                      <Check className="w-3 h-3" />
                      In blueprints
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImportPlan(plan)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Load Plan
                    </button>
                  )}

                  <button
                    onClick={() => handleStartDirectly(plan)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-bg rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow shadow-brand-yellow/15 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Session
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
