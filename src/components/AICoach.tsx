import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Flame, 
  Plus, 
  MessageSquare, 
  HelpCircle, 
  ChevronRight, 
  Trophy, 
  Dumbbell, 
  AlertCircle,
  RefreshCw,
  Zap,
  Music,
  Mic,
  MicOff
} from 'lucide-react';
import { FitnessGoal, LoggedWorkout, WorkoutRoutine, Exercise } from '../types';
import WorkoutPlans from './WorkoutPlans';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AICoachProps {
  goals: FitnessGoal[];
  history: LoggedWorkout[];
  routines: WorkoutRoutine[];
  exercisesCatalog: Exercise[];
  onCreateRoutine: (newRoutine: WorkoutRoutine) => void;
}

export default function AICoach({ 
  goals, 
  history, 
  routines, 
  exercisesCatalog, 
  onCreateRoutine 
}: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('pulsetrak_coach_chat');
    return saved ? JSON.parse(saved) : [
      {
        role: 'assistant',
        text: `⚡ **WELCOME TO THE PULSETRAK AI COACH TERMINAL!** ⚡\n\nI am your energetic, synthwave-fueled fitness engine. Whether you want a blazing pep talk, a customized training routine, or an analysis of your current physical achievements—I'm here to push your code to the limits!\n\n**Ask me anything, or tap one of the power-up commands below to start!**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false; // Stop listening automatically after a short phrase
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        playBeep(600, 0.1, 'sine');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error", event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("🎤 Microphone access is blocked! Please check your browser address bar/settings, allow microphone permissions for this page, and try again.");
        } else if (event.error === 'no-speech') {
          // Just timed out or no speech detected
        } else {
          alert(`🎤 Microphone error: ${event.error}. Please ensure your mic is plugged in and active.`);
        }
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
          playBeep(900, 0.12, 'sine');
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice receiver is not fully supported in this browser version or environment. For best results, use Chrome, Edge or Safari!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech Recognition Failed to Start", e);
      }
    }
  };

  // Sync chat to local storage
  useEffect(() => {
    localStorage.setItem('pulsetrak_coach_chat', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Quick action play/send retro click sounds using Web Audio API
  const playBeep = (freq: number, duration: number, type: OscillatorType = 'triangle') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext blocked or not supported
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    if (!textToSend) {
      setInputMessage('');
    }
    
    // Play sci-fi transmission click
    playBeep(880, 0.08, 'sine');
    setTimeout(() => playBeep(1200, 0.05, 'sine'), 50);

    const userMsg: Message = {
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setApiKeyError(false);

    try {
      // Format context to feed Gemini
      const simplifiedGoals = goals.map(g => ({
        title: g.title,
        target: `${g.targetValue} ${g.unit}`,
        current: `${g.currentValue} ${g.unit}`,
        isCompleted: g.isCompleted
      }));

      const simplifiedHistory = history.slice(0, 3).map(h => ({
        name: h.name,
        date: h.date,
        durationMinutes: h.durationMinutes,
        exercisesCount: h.exercises.length,
        notes: h.notes,
        energy: h.energyLevel,
        rating: h.rating
      }));

      const simplifiedRoutines = routines.map(r => ({
        name: r.name,
        exercises: r.exercises.map(re => {
          const matchedEx = exercisesCatalog.find(e => e.id === re.exerciseId);
          return matchedEx ? matchedEx.name : 'Unknown Exercise';
        })
      }));

      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            text: m.text
          })),
          context: {
            goals: simplifiedGoals,
            history: simplifiedHistory,
            routines: simplifiedRoutines
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'API_KEY_MISSING') {
          setApiKeyError(true);
          throw new Error("API Key Missing");
        }
        throw new Error(data.message || "Something went wrong.");
      }

      playBeep(1000, 0.12, 'triangle');
      setTimeout(() => playBeep(1400, 0.08, 'sine'), 80);

      const coachMsg: Message = {
        role: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      console.error("Coach fetch error:", err);
      let errMsgText = "⚡ **TRANSMISSION SYSTEM INTERRUPT** ⚡\n\nFailed to download response from PulseTrak coach. Ensure server-side API is responsive.";
      if (err.message === 'API Key Missing' || apiKeyError) {
        errMsgText = `🔑 **GEMINI_API_KEY IS NOT CONFIGURED**\n\nThe AI Coach requires a Gemini API key. Please configure your key in **Settings > Secrets** in the AI Studio platform to unlock high-energy workouts!`;
      }
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: errMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    playBeep(440, 0.15, 'sawtooth');
    setMessages([
      {
        role: 'assistant',
        text: `⚡ **COACH TERMINAL RESET COMPLETE** ⚡\n\nAll session logs cleared. What fitness matrix shall we build today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Quick Action triggers
  const executePowerUp = (command: string, promptText: string) => {
    handleSendMessage(promptText);
  };

  // Format helper to convert markdown to HTML simply (handles bold, code ticks, headers, and bullets)
  const formatCoachText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;

      // Check headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-brand-yellow font-display uppercase tracking-wider mt-3 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-extrabold text-brand-yellow font-display uppercase tracking-widest mt-4 mb-1.5 border-b border-brand-yellow/10 pb-0.5">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-black text-white font-display uppercase tracking-widest mt-5 mb-2">{line.replace('# ', '')}</h2>;
      }

      // Check bullet points
      const isBullet = line.startsWith('- ') || line.startsWith('* ');
      if (isBullet) {
        const content = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 text-xs md:text-sm leading-relaxed my-1">
            {parseInlineMarkdown(content)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-slate-200 text-xs md:text-sm leading-relaxed mb-2.5 break-words">
          {parseInlineMarkdown(formatted)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Basic bold ** and code ` replacement
    const parts = text.split(/(\*\*|`)/g);
    let isBold = false;
    let isCode = false;
    
    return parts.map((part, i) => {
      if (part === '**') {
        isBold = !isBold;
        return null;
      }
      if (part === '`') {
        isCode = !isCode;
        return null;
      }
      
      if (isBold) {
        return <strong key={i} className="text-white font-semibold">{part}</strong>;
      }
      if (isCode) {
        return <code key={i} className="bg-slate-950 px-1.5 py-0.5 rounded text-xs text-brand-yellow font-mono border border-slate-800/80">{part}</code>;
      }
      
      return part;
    });
  };

  // Interactive custom routine importer generator
  // Scan coach responses for structural cues of routines to allow importing!
  const detectAndCreateRoutineFromCoach = (text: string) => {
    // If the coach suggests exercises, we can map common exercises to our catalog and build a routine
    const coachRoutine: WorkoutRoutine = {
      id: `ai-routine-${Date.now()}`,
      name: "AI Cyber Charge",
      description: "Custom routine generated by PulseTrak AI Coach",
      exercises: []
    };

    // Very simple matching of exercises present in catalog
    const matchedExercises: { exerciseId: string; defaultSetsCount: number; defaultReps: number; defaultWeight: number }[] = [];
    
    exercisesCatalog.forEach(ex => {
      if (text.toLowerCase().includes(ex.name.toLowerCase())) {
        matchedExercises.push({
          exerciseId: ex.id,
          defaultSetsCount: 3,
          defaultReps: 10,
          defaultWeight: ex.equipment === 'Barbell' ? 45 : ex.equipment === 'Dumbbell' ? 25 : 0
        });
      }
    });

    if (matchedExercises.length > 0) {
      coachRoutine.exercises = matchedExercises.slice(0, 5); // max 5 exercises
      return coachRoutine;
    }
    return null;
  };

  const handleImportAIRoutine = (routine: WorkoutRoutine) => {
    onCreateRoutine(routine);
    playBeep(600, 0.08, 'sine');
    setTimeout(() => playBeep(900, 0.12, 'sine'), 50);
    alert(`⚡ AI ROUTINE IMPORTED! "${routine.name}" has been successfully added to your Routines database.`);
  };

  const lastResponse = messages[messages.length - 1]?.text || '';
  const detectedRoutine = messages[messages.length - 1]?.role === 'assistant' && lastResponse.length > 50 
    ? detectAndCreateRoutineFromCoach(lastResponse) 
    : null;

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto" id="ai-coach-dashboard">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-card to-slate-900 p-5 rounded-3xl border border-slate-800/80 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 border-2 border-brand-yellow flex items-center justify-center text-brand-yellow shadow-lg shadow-brand-yellow/5">
            <Bot className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg md:text-xl font-display tracking-tight text-white uppercase">AI FITNESS COACH</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-yellow"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Personal cyber-motivator & custom routine developer</p>
          </div>
        </div>

        {/* Clear chat logs button */}
        <button 
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>RESET MATRIX Logs</span>
        </button>
      </div>

      {/* Main Terminal Shell container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Side: Cybernetic Actions Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-brand-card/90 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 text-[10px] font-mono text-brand-yellow font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              <span>COACH POWER-UPS</span>
            </div>

            <button
              onClick={() => executePowerUp('motivate', 'Give me an instant high-energy motivation boost!')}
              className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl text-left transition-all cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-slate-200 group-hover:text-brand-yellow font-display uppercase tracking-wider">🔥 CHARGE ENGINE</span>
                <span className="block text-[10px] text-slate-400">Instant motivation blast</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-yellow" />
            </button>

            <button
              onClick={() => executePowerUp('goals_review', 'Review my fitness goals and history to give me an status report.')}
              className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl text-left transition-all cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-slate-200 group-hover:text-brand-yellow font-display uppercase tracking-wider">📈 GOALS MATRIX</span>
                <span className="block text-[10px] text-slate-400">Audit current progress</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-yellow" />
            </button>

            <button
              onClick={() => executePowerUp('suggest_routine', 'Based on my catalog and fitness targets, design a balanced weekly routine.')}
              className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl text-left transition-all cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-slate-200 group-hover:text-brand-yellow font-display uppercase tracking-wider">🏋️ COMPILE ROUTINE</span>
                <span className="block text-[10px] text-slate-400">Generate custom workout</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-yellow" />
            </button>

            <button
              onClick={() => executePowerUp('tips', 'Explain progressive overload and give me 3 expert posture form hacks.')}
              className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl text-left transition-all cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-slate-200 group-hover:text-brand-yellow font-display uppercase tracking-wider">💡 SCIENCE HACKS</span>
                <span className="block text-[10px] text-slate-400">Scientific lift guides</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-yellow" />
            </button>
          </div>

          {/* Quick Context Panel */}
          <div className="bg-brand-card/90 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-2 font-mono text-[10px]">
            <div className="text-slate-400 uppercase font-bold border-b border-slate-800 pb-1.5 tracking-wider">ACTIVE MATRIX CONTEXT</div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 uppercase font-bold">SAVED GOALS:</span>
              <span className="text-brand-yellow font-bold">{goals.length} ACTIVE</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 uppercase font-bold">WORKOUT HISTORY:</span>
              <span className="text-brand-blue-light font-bold">{history.length} LOGS</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 uppercase font-bold">ROUTINES:</span>
              <span className="text-slate-200 font-bold">{routines.length} SAVED</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Chat Terminal */}
        <div className="lg:col-span-3 flex flex-col h-[520px] bg-brand-card/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl shadow-black/5" id="chat-terminal">
          
          {/* Chat Messages Log view */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4" id="chat-scroller">
            {messages.map((msg, index) => {
              const isCoach = msg.role === 'assistant';
              return (
                <div 
                  key={index}
                  className={`flex gap-3.5 max-w-[85%] ${isCoach ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar bubble */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                    isCoach 
                      ? 'bg-brand-yellow/10 border-brand-yellow text-brand-yellow' 
                      : 'bg-brand-blue/10 border-brand-blue text-brand-blue-light'
                  }`}>
                    {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message body */}
                  <div className="flex flex-col gap-1">
                    <div className={`rounded-2xl px-4 py-3 border shadow ${
                      isCoach 
                        ? 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-sm' 
                        : 'bg-brand-blue text-white border-transparent rounded-tr-sm'
                    }`}>
                      {isCoach ? (
                        <div className="space-y-1">
                          {formatCoachText(msg.text)}
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                    {/* Timestamp */}
                    <span className={`text-[9px] font-mono font-semibold text-slate-500 ${isCoach ? 'text-left' : 'text-right'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Simulated generating loading bar */}
            {isLoading && (
              <div className="flex gap-3.5 max-w-[80%] mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <Bot className="w-4 h-4 animate-spin text-brand-yellow" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="bg-slate-900/95 border border-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3.5 space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-brand-yellow font-bold uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 animate-bounce" />
                      <span>DOWNLOADING RESPONSE SYNAPSE...</span>
                    </div>
                    <div className="w-48 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-brand-yellow rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Action container: detected custom routine direct importer! */}
          {detectedRoutine && (
            <div className="bg-brand-yellow/10 border-t border-b border-brand-yellow/20 px-4 py-3 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-brand-yellow animate-bounce" />
                <div>
                  <p className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">COACH ROUTINE COMPILED!</p>
                  <p className="text-[10px] font-semibold text-slate-400">Ready to flash directly into your local database.</p>
                </div>
              </div>
              <button
                onClick={() => handleImportAIRoutine(detectedRoutine)}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellow-dark text-slate-900 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>SAVE ROUTINE</span>
              </button>
            </div>
          )}

          {/* Chat text input footer */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-800 bg-slate-950/60 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? "Listening... Speak now!" : "Ask coach for motivation, training tips, or routine plans..."}
              disabled={isLoading}
              className="flex-1 bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 border border-slate-800 focus:border-slate-700/80 rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-yellow/30 transition-all font-sans"
              id="coach-terminal-input"
            />

            {/* Mic voice receiver button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-lg border ${
                isListening 
                  ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-red-500/10' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
              id="coach-mic-button"
              title={isListening ? "Listening... click to stop" : "Use microphone / Voice input"}
            >
              {isListening ? <Mic className="w-4 h-4 text-white animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="w-11 h-11 rounded-2xl bg-brand-yellow text-slate-900 flex items-center justify-center hover:bg-brand-yellow-dark disabled:bg-slate-800 disabled:text-slate-600 transition-all shrink-0 cursor-pointer shadow-lg shadow-brand-yellow/5"
              id="coach-send-button"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

      {/* Premium AI Workout Plans with generated AI images */}
      <WorkoutPlans 
        routines={routines}
        exercisesCatalog={exercisesCatalog}
        onCreateRoutine={onCreateRoutine}
      />

    </div>
  );
}
