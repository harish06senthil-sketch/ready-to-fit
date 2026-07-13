import { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Zap, 
  Clock, 
  Dumbbell, 
  Award,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { LoggedWorkout, Exercise } from '../types';

interface HistoryDashboardProps {
  history: LoggedWorkout[];
  exercisesCatalog: Exercise[];
}

export default function HistoryDashboard({
  history,
  exercisesCatalog
}: HistoryDashboardProps) {
  // Collapsed state for history list item cards
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Exercise selected for progress chart plotting
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('ex-squat');

  const toggleExpandWorkout = (id: string) => {
    setExpandedWorkoutId(expandedWorkoutId === id ? null : id);
  };

  // Get only exercises that have records in our history to select in chart
  const exercisesWithHistory = useMemo(() => {
    const ids = new Set<string>();
    history.forEach(w => {
      w.exercises.forEach(ex => {
        ids.add(ex.exerciseId);
      });
    });
    return exercisesCatalog.filter(ex => ids.has(ex.id));
  }, [history, exercisesCatalog]);

  // Set default exercise with history if current is not in list
  useMemo(() => {
    if (exercisesWithHistory.length > 0 && !exercisesWithHistory.some(ex => ex.id === selectedExerciseId)) {
      setSelectedExerciseId(exercisesWithHistory[0].id);
    }
  }, [exercisesWithHistory, selectedExerciseId]);

  // Extract progression datapoints for the selected exercise
  // An estimated 1RM formula: Weight * (1 + Reps/30)
  const chartDatapoints = useMemo(() => {
    const points: {
      workoutId: string;
      dateStr: string;
      dateLabel: string;
      maxWeight: number;
      maxReps: number;
      estimated1RM: number;
    }[] = [];

    // Sort history chronologically (ascending for charts)
    const chronoHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    chronoHistory.forEach(w => {
      const exerciseLog = w.exercises.find(ex => ex.exerciseId === selectedExerciseId);
      if (exerciseLog) {
        let maxWeight = 0;
        let maxReps = 0;
        let max1RM = 0;

        exerciseLog.sets.forEach(set => {
          if (set.isCompleted) {
            if (set.weight > maxWeight) maxWeight = set.weight;
            if (set.reps > maxReps) maxReps = set.reps;
            
            // Epley 1RM formula
            const oneRepMax = set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30);
            if (oneRepMax > max1RM) max1RM = Math.round(oneRepMax * 10) / 10;
          }
        });

        if (max1RM > 0) {
          const dObj = new Date(w.date);
          points.push({
            workoutId: w.id,
            dateStr: w.date,
            dateLabel: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            maxWeight,
            maxReps,
            estimated1RM: max1RM
          });
        }
      }
    });

    return points;
  }, [history, selectedExerciseId]);

  // Hovered datapoint for SVG chart tooltip
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Calculate SVG dimensions and scale coordinates
  const svgChart = useMemo(() => {
    const width = 600;
    const height = 240;
    const padding = 45;

    if (chartDatapoints.length < 2) return null;

    const values = chartDatapoints.map(p => p.estimated1RM);
    const maxVal = Math.max(...values) * 1.05; // 5% padding on top
    const minVal = Math.max(0, Math.min(...values) * 0.95); // 5% padding on bottom or 0

    const valRange = maxVal - minVal || 10;

    // Map points to SVG coordinate space
    const mappedPoints = chartDatapoints.map((p, idx) => {
      const x = padding + (idx / (chartDatapoints.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.estimated1RM - minVal) / valRange) * (height - 2 * padding);
      return { ...p, x, y };
    });

    // Build the SVG path string (cubic bezier coordinates for smooth curves!)
    let pathD = `M ${mappedPoints[0].x} ${mappedPoints[0].y}`;
    for (let i = 1; i < mappedPoints.length; i++) {
      const p = mappedPoints[i];
      const prev = mappedPoints[i - 1];
      // Control points for smooth bezier interpolation
      const cpX1 = prev.x + (p.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (2 * (p.x - prev.x)) / 3;
      const cpY2 = p.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }

    // Gradient fill path
    const gradientPathD = `${pathD} L ${mappedPoints[mappedPoints.length - 1].x} ${height - padding} L ${mappedPoints[0].x} ${height - padding} Z`;

    return {
      width,
      height,
      padding,
      mappedPoints,
      pathD,
      gradientPathD,
      maxVal,
      minVal
    };
  }, [chartDatapoints]);

  const selectedExerciseDetails = useMemo(() => {
    return exercisesCatalog.find(ex => ex.id === selectedExerciseId);
  }, [exercisesCatalog, selectedExerciseId]);

  return (
    <div className="space-y-6" id="history-dashboard-container">
      
      {/* 1. PROGRESS ESTIMATED 1-REP MAX CHART */}
      <div className="bg-brand-card p-6 rounded-2xl border border-slate-800" id="progress-charts-panel">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <TrendingUp className="text-brand-yellow w-5 h-5" />
              Strength progression curves
            </h2>
            <p className="text-xs text-gray-400">
              Visualizes Estimated 1RM (Epley: <span className="font-mono text-[10px]">W * (1 + R/30)</span>) to monitor compound strength improvements over time.
            </p>
          </div>

          {/* Exercise Selector */}
          {exercisesWithHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider font-display">EXERCISE:</label>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-brand-blue"
              >
                {exercisesWithHistory.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {chartDatapoints.length >= 2 && svgChart ? (
          <div className="space-y-4">
            {/* Interactive SVG Chart wrapper */}
            <div className="relative w-full overflow-x-auto overflow-y-hidden pt-4 scrollbar-thin">
              <svg 
                viewBox={`0 0 ${svgChart.width} ${svgChart.height}`}
                className="w-full min-w-[550px] h-[240px] select-none"
              >
                <defs>
                  {/* Fill area gradient */}
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
                  </linearGradient>
                  
                  {/* Glowing filter */}
                  <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = svgChart.padding + ratio * (svgChart.height - 2 * svgChart.padding);
                  const val = svgChart.maxVal - ratio * (svgChart.maxVal - svgChart.minVal);
                  return (
                    <g key={idx}>
                      <line 
                        x1={svgChart.padding} 
                        y1={y} 
                        x2={svgChart.width - svgChart.padding} 
                        y2={y} 
                        className="stroke-slate-800/60 stroke-1 stroke-dasharray-[3,3]" 
                        strokeDasharray="3 3"
                      />
                      <text 
                        x={svgChart.padding - 8} 
                        y={y + 4} 
                        className="fill-gray-500 font-mono text-[9px] font-bold text-right"
                        textAnchor="end"
                      >
                        {Math.round(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Grid X Dates */}
                {svgChart.mappedPoints.map((pt, idx) => (
                  <text
                    key={idx}
                    x={pt.x}
                    y={svgChart.height - svgChart.padding + 16}
                    className="fill-gray-500 font-mono text-[9px] font-bold"
                    textAnchor="middle"
                  >
                    {pt.dateLabel}
                  </text>
                ))}

                {/* Gradient area fill under line */}
                <path d={svgChart.gradientPathD} fill="url(#chart-area-grad)" />

                {/* Main line path */}
                <path 
                  d={svgChart.pathD} 
                  fill="none" 
                  className="stroke-brand-blue stroke-3"
                  filter="url(#glow-effect)"
                />

                {/* Active hover crosshair vertical guide */}
                {hoveredPointIdx !== null && (
                  <line
                    x1={svgChart.mappedPoints[hoveredPointIdx].x}
                    y1={svgChart.padding}
                    x2={svgChart.mappedPoints[hoveredPointIdx].x}
                    y2={svgChart.height - svgChart.padding}
                    className="stroke-brand-yellow/30 stroke-1 stroke-dasharray-[2,2]"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Data point circles */}
                {svgChart.mappedPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPointIdx === idx ? 7 : 4}
                    className={`transition-all duration-150 cursor-pointer ${
                      hoveredPointIdx === idx 
                        ? 'fill-brand-yellow stroke-brand-bg stroke-3' 
                        : 'fill-brand-bg stroke-brand-blue stroke-2'
                    }`}
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onMouseLeave={() => setHoveredPointIdx(null)}
                  />
                ))}
              </svg>
            </div>

            {/* Custom interactive legend / tooltip info */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {hoveredPointIdx !== null ? (
                <>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">RECORD ON {chartDatapoints[hoveredPointIdx].dateStr}</span>
                    <h4 className="font-bold text-sm text-white">
                      Max weight: <span className="text-brand-yellow font-mono">{chartDatapoints[hoveredPointIdx].maxWeight} lbs</span> for {chartDatapoints[hoveredPointIdx].maxReps} reps
                    </h4>
                  </div>
                  
                  <div className="bg-brand-blue-glow border border-brand-blue/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-yellow fill-current" />
                    <span className="text-xs font-semibold text-gray-300">Est. 1RM Strength:</span>
                    <span className="text-sm font-extrabold font-mono text-brand-yellow">{chartDatapoints[hoveredPointIdx].estimated1RM} lbs</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 bg-brand-blue rounded-full"></div>
                    <p className="text-xs text-gray-400">
                      Hover over data points to review specific set stats and historic 1RM calculations.
                    </p>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono italic">
                    Calculations updated instantly
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Empty/Incomplete state */
          <div className="text-center py-12 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl text-gray-500 space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <h4 className="font-bold text-sm text-gray-300">Insufficient Progress Data</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto px-4">
              {exercisesWithHistory.length === 0 
                ? "You haven't completed any logged sessions containing standard strength templates yet. Log a workout session to initiate progression tracking!"
                : `We need at least two chronological records for "${selectedExerciseDetails?.name}" to project progression lines.`
              }
            </p>
          </div>
        )}
      </div>

      {/* 2. HISTORY LIST CARDS */}
      <div className="space-y-4" id="history-logs-panel">
        <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
          <CalendarDays className="text-brand-blue-light w-5 h-5" />
          Workout History Logs
        </h2>

        <div className="space-y-3" id="history-logs-list">
          {history.map((log) => {
            const isExpanded = expandedWorkoutId === log.id;
            
            // Calculate session statistics
            let totalSetsCount = 0;
            let totalVol = 0;
            log.exercises.forEach(ex => {
              ex.sets.forEach(s => {
                if (s.isCompleted) {
                  totalSetsCount++;
                  totalVol += (s.weight || 0) * (s.reps || 0);
                }
              });
            });

            return (
              <div 
                key={log.id} 
                className={`bg-brand-card rounded-xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-brand-blue/40 shadow-lg shadow-brand-blue/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header card button summary */}
                <button
                  onClick={() => toggleExpandWorkout(log.id)}
                  className="w-full text-left p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-slate-800/80 text-gray-400 font-bold px-2.5 py-0.5 rounded border border-slate-700/50 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-yellow" />
                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {log.rating && (
                        <div className="flex gap-0.5" title={`Quality: ${log.rating}/5 stars`}>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-3.5 h-3.5 ${idx < (log.rating || 0) ? 'text-brand-yellow fill-brand-yellow' : 'text-slate-700'}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base md:text-lg text-white font-display group-hover:text-brand-yellow transition-colors">
                      {log.name}
                    </h3>
                  </div>

                  {/* Summary Indicators */}
                  <div className="flex items-center gap-4 flex-wrap text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-blue-light" />
                      <span>{log.durationMinutes} min</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-brand-blue-light" />
                      <span>{log.exercises.length} Ex</span>
                    </div>

                    <div className="bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50">
                      Vol: <span className="text-white font-bold">{totalVol.toLocaleString()} lbs</span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Collapsible expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 bg-slate-950/20 space-y-4">
                    {/* Notes if provided */}
                    {log.notes && (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs text-gray-300 italic">
                        <span className="font-bold text-[10px] text-brand-yellow uppercase tracking-wider block not-italic mb-1">Session Reflections:</span>
                        "{log.notes}"
                      </div>
                    )}

                    {/* Exercises breakdown */}
                    <div className="space-y-4">
                      {log.exercises.map((ex, exIdx) => (
                        <div key={ex.id} className="space-y-1.5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-white font-display">
                              {exIdx + 1}. {ex.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">{ex.category}</span>
                          </div>

                          {/* Sets table/row summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ex.sets.map((set, setIdx) => (
                              <div 
                                key={set.id}
                                className={`bg-slate-900/50 p-2 rounded border border-slate-800/80 text-[11px] flex justify-between items-center ${
                                  set.isPR ? 'border-brand-yellow/30 bg-brand-yellow-glow/5' : ''
                                }`}
                              >
                                <span className="text-gray-500 font-bold">Set {setIdx + 1}</span>
                                <span className="font-mono font-bold text-gray-200">
                                  {set.weight} lbs x {set.reps}
                                </span>
                                {set.isPR && (
                                  <Award className="w-3.5 h-3.5 text-brand-yellow fill-current" title="Personal Record!" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {history.length === 0 && (
            <div className="text-center py-16 bg-brand-card rounded-xl border border-dashed border-slate-800 text-gray-500">
              <Sparkles className="w-10 h-10 mx-auto text-slate-700 animate-pulse mb-3" />
              <h3 className="font-bold text-base text-gray-200">History Log Empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                You haven't logged any fitness workouts yet! Go to the active dashboard and select start empty session to begin logging reps and sets.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
