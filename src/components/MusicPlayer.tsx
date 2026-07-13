import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Music, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Radio, 
  Sliders, 
  Zap,
  Disc
} from 'lucide-react';

interface Track {
  name: string;
  genre: string;
  bpm: number;
  description: string;
  color: string;
  bassSequence: number[]; // scale degrees or note offsets
  leadSequence: number[];
}

const TRACKS: Track[] = [
  {
    name: "CYBERPUNK GRID",
    genre: "Synthwave Beat",
    bpm: 120,
    description: "Heavy driving industrial kick with pulsing cybernetic 16-bit bassline.",
    color: "from-purple-500 to-indigo-500",
    bassSequence: [0, 0, 3, 3, 7, 7, 5, 5, 10, 10, 8, 8, 7, 7, 5, 5],
    leadSequence: [12, 16, 19, 24, 19, 16, 12, 19, 14, 17, 21, 26, 21, 17, 14, 21]
  },
  {
    name: "RETRO CHIPTUNE",
    genre: "8-Bit Arcade",
    bpm: 140,
    description: "Fast-paced energetic 8-bit chip tunes with retro bleeps and noise ticks.",
    color: "from-brand-yellow to-amber-500",
    bassSequence: [0, 0, 0, 0, 5, 5, 5, 5, 7, 7, 7, 7, 12, 12, 12, 12],
    leadSequence: [12, 19, 16, 24, 12, 19, 16, 24, 17, 24, 21, 29, 19, 26, 23, 31]
  },
  {
    name: "AMBIENT TECHNO PULSE",
    genre: "Minimal Deep House",
    bpm: 110,
    description: "Deep mellow sub-bass pulse with spacey delays and echo soundscapes.",
    color: "from-cyan-500 to-brand-blue",
    bassSequence: [0, 12, 0, 12, 3, 15, 3, 15, 5, 17, 5, 17, 7, 19, 7, 19],
    leadSequence: [12, 0, 16, 0, 19, 0, 24, 0, 14, 0, 17, 0, 21, 0, 19, 0]
  },
  {
    name: "ELECTRICAL OVERDRIVE",
    genre: "Acid Electro Synth",
    bpm: 130,
    description: "Syncopated acid electro loop with resonating sweep filters and drive.",
    color: "from-emerald-500 to-teal-500",
    bassSequence: [0, 3, 5, 0, 3, 5, 7, 10, 0, 3, 5, 0, 12, 10, 7, 5],
    leadSequence: [12, 15, 17, 12, 15, 17, 19, 22, 12, 15, 17, 12, 24, 22, 19, 17]
  }
];

// Frequencies corresponding to notes starting at base frequency (e.g. root A1 = 55Hz)
const getNoteFreq = (rootFreq: number, interval: number): number => {
  return rootFreq * Math.pow(2, interval / 12);
};

interface MusicPlayerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function MusicPlayer({ isOpen, setIsOpen }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [filterCutoff, setFilterCutoff] = useState(1500); // in Hz
  const [synthType, setSynthType] = useState<OscillatorType>('sawtooth');
  const [beatVisuals, setBeatVisuals] = useState<number>(0); // 0-15 steps
  const [isMuted, setIsMuted] = useState(false);

  // Audio nodes and context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  
  // Sequencer playback variables
  const isPlayingRef = useRef(false);
  const current16thNoteRef = useRef(0);
  const nextNoteTimeRef = useRef(0.0);
  const scheduleAheadTime = 0.1; // seconds ahead to schedule
  const timerIdRef = useRef<number | null>(null);

  // Sync state values to refs for safe access in audio loops
  const volumeRef = useRef(volume);
  const mutedRef = useRef(isMuted);
  const filterCutoffRef = useRef(filterCutoff);
  const synthTypeRef = useRef(synthType);
  const trackIndexRef = useRef(currentTrackIndex);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    mutedRef.current = isMuted;
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [isMuted]);

  useEffect(() => {
    filterCutoffRef.current = filterCutoff;
    if (filterNodeRef.current && audioCtxRef.current) {
      filterNodeRef.current.frequency.setValueAtTime(filterCutoff, audioCtxRef.current.currentTime);
    }
  }, [filterCutoff]);

  useEffect(() => {
    synthTypeRef.current = synthType;
  }, [synthType]);

  useEffect(() => {
    trackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = isMuted ? 0 : volume;
      masterGainRef.current = masterGain;

      const filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = filterCutoff;
      filterNodeRef.current = filterNode;

      // Routing: Synth/Drums -> Filter -> Master Gain -> Output
      filterNode.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const scheduleNote = (noteNumber: number, time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !filterNodeRef.current) return;

    const track = TRACKS[trackIndexRef.current];
    const step = noteNumber % 16;

    // Root notes
    let rootFreq = 55.0; // A1
    if (trackIndexRef.current === 1) rootFreq = 65.41; // C2 (Retro Chiptune is higher/happier)
    if (trackIndexRef.current === 2) rootFreq = 48.99; // G1 (Ambient Techno is lower/subby)
    if (trackIndexRef.current === 3) rootFreq = 55.0;  // A1

    // 1. SCHEDULING DRUM BEAT
    // Kick Drum on steps 0, 4, 8, 12 (Every beat)
    if (step % 4 === 0) {
      playKick(ctx, time);
    }

    // Snare Drum (Noise/Bleep click) on steps 4, 12
    if (step === 4 || step === 12) {
      playSnare(ctx, time);
    }

    // Hi-Hat on steps 2, 6, 10, 14 (Off-beats) and extra ticks
    if (step % 2 === 0 && step % 4 !== 0) {
      playHihat(ctx, time);
    } else if (trackIndexRef.current === 1 && step % 4 === 1) {
      // Extra bleeps for chiptune track
      playHihat(ctx, time, true);
    }

    // 2. SCHEDULING BASS LINE (always plays on ticks 0, 2, 4, 6, 8, 10, 12, 14 or syncopated)
    const playBassNote = step % 2 === 0 || (trackIndexRef.current === 3 && step % 3 === 0);
    if (playBassNote) {
      const interval = track.bassSequence[step];
      const freq = getNoteFreq(rootFreq, interval);
      playSynthBass(ctx, freq, time, trackIndexRef.current === 2 ? 0.25 : 0.15);
    }

    // 3. SCHEDULING MELODY/ARPEGGIO (on off-beats or steps)
    const playLeadNote = (trackIndexRef.current === 1 && step % 2 !== 0) || 
                          (trackIndexRef.current === 0 && step % 4 === 2) ||
                          (trackIndexRef.current === 3 && step % 4 !== 0);
    
    if (playLeadNote) {
      const leadInterval = track.leadSequence[step];
      const leadFreq = getNoteFreq(rootFreq * 2, leadInterval); // one octave up
      playLeadSynth(ctx, leadFreq, time);
    }
  };

  const playKick = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(filterNodeRef.current!);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.28);
    
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playSnare = (ctx: AudioContext, time: number) => {
    // Synth snare using custom bandpass noise burst or clean square oscillator pitch drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(filterNodeRef.current!);
    
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.linearRampToValueAtTime(100, time + 0.12);
    
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.start(time);
    osc.stop(time + 0.16);

    // Add white noise simulation burst
    const bufferSize = ctx.sampleRate * 0.1; // 100ms snare noise tail
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGainRef.current!);
    
    noise.start(time);
    noise.stop(time + 0.15);
  };

  const playHihat = (ctx: AudioContext, time: number, isHighPitch = false) => {
    const bufferSize = ctx.sampleRate * (isHighPitch ? 0.04 : 0.06);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = isHighPitch ? 9000 : 7000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isHighPitch ? 0.03 : 0.05));

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current!);

    source.start(time);
    source.stop(time + 0.08);
  };

  const playSynthBass = (ctx: AudioContext, freq: number, time: number, duration = 0.15) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = trackIndexRef.current === 2 ? 'sine' : 'sawtooth'; // Ambient Techno is smooth sine wave
    osc.frequency.setValueAtTime(freq, time);

    osc.connect(gain);
    gain.connect(filterNodeRef.current!);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.01);

    osc.start(time);
    osc.stop(time + duration);
  };

  const playLeadSynth = (ctx: AudioContext, freq: number, time: number) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = synthTypeRef.current;
    osc.frequency.setValueAtTime(freq, time);

    // sub oscillator for wider synth vibe
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.005, time); // detuned slightly

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(filterNodeRef.current!);

    // Soft envelope
    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.16);
    osc2.stop(time + 0.16);
  };

  const nextNote = () => {
    const track = TRACKS[trackIndexRef.current];
    const secondsPerBeat = 60.0 / track.bpm;
    const secondsPerNote = secondsPerBeat / 4.0; // 16th note length

    nextNoteTimeRef.current += secondsPerNote;

    // Advance note index
    current16thNoteRef.current = (current16thNoteRef.current + 1) % 16;
  };

  const scheduler = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      scheduleNote(current16thNoteRef.current, nextNoteTimeRef.current);
      
      const currentNoteVal = current16thNoteRef.current;
      // Sync UI beats visualization safely
      setTimeout(() => {
        setBeatVisuals(currentNoteVal);
      }, (nextNoteTimeRef.current - ctx.currentTime) * 1000);

      nextNote();
    }

    timerIdRef.current = window.setTimeout(scheduler, 25);
  };

  const startPlayback = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    isPlayingRef.current = true;
    setIsPlaying(true);

    current16thNoteRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;

    scheduler();
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    if (isPlaying) {
      stopPlayback();
      setTimeout(() => {
        startPlayback();
      }, 50);
    }
  };

  return (
    <>
      {/* Retro Synth Deck Modular Rack panel */}
      {isOpen && (
        <div 
          className="fixed bottom-36 right-4 left-4 md:left-auto md:right-6 md:bottom-20 z-50 w-auto md:w-96 bg-brand-card/95 backdrop-blur-xl border-2 border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-fade-in text-slate-100 max-h-[80vh] overflow-y-auto"
          id="synth-deck-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-yellow/10 rounded-xl border border-brand-yellow/30">
                <Radio className="w-4 h-4 text-brand-yellow animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm font-display tracking-tight text-white uppercase">ELECTRICAL SYNTH DECK</h3>
                <p className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">BIT ENERGY CO-PROCESSOR</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Graphic Equalizer Visualization */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-[10px] font-mono text-brand-yellow font-bold uppercase tracking-wider">
              <span>LED FREQUENCY BARS</span>
              <span>{TRACKS[currentTrackIndex].bpm} BPM</span>
            </div>

            {/* Simulated Animated Equalizer */}
            <div className="flex items-end justify-between h-14 px-2 bg-black/40 rounded-xl py-1 gap-[3px]">
              {Array.from({ length: 16 }).map((_, i) => {
                const isActive = beatVisuals === i;
                // Height calculation based on isPlaying and step values to look highly interactive
                const activeHeight = isPlaying 
                  ? `${Math.max(15, Math.floor(Math.sin((beatVisuals + i) * 1.2) * 40) + 60)}%`
                  : '10%';
                
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-75 ${
                      isActive 
                        ? 'bg-brand-yellow shadow-md shadow-brand-yellow/40' 
                        : isPlaying 
                          ? 'bg-brand-blue/50' 
                          : 'bg-slate-800'
                    }`}
                    style={{ height: activeHeight }}
                  />
                );
              })}
            </div>

            {/* 16-Step Sequencer Indicator */}
            <div className="grid gap-[2px] mt-1.5" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
              {Array.from({ length: 16 }).map((_, i) => {
                const isCurrent = beatVisuals === i && isPlaying;
                const isAccent = i % 4 === 0;
                return (
                  <div 
                    key={i} 
                    className={`h-2.5 rounded-sm transition-all duration-75 ${
                      isCurrent 
                        ? 'bg-brand-yellow scale-125 shadow shadow-brand-yellow/50' 
                        : isAccent 
                          ? 'bg-brand-blue/30 border border-brand-blue/40' 
                          : 'bg-slate-800'
                    }`}
                    title={`Step ${i + 1}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Track Selection list */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider uppercase">SELECT ELECTRICAL LOOP</span>
            <div className="flex flex-col gap-1.5">
              {TRACKS.map((track, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <button
                    key={track.name}
                    onClick={() => selectTrack(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r ' + track.color + ' border-transparent text-slate-900 shadow-lg shadow-black/10 scale-[1.01]' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Disc className={`w-4 h-4 ${isSelected && isPlaying ? 'animate-spin' : ''}`} />
                      <div>
                        <p className={`text-xs font-bold font-display uppercase tracking-wider ${isSelected ? 'text-black' : 'text-slate-100'}`}>
                          {track.name}
                        </p>
                        <p className={`text-[9px] font-mono ${isSelected ? 'text-slate-900/80 font-bold' : 'text-slate-400'}`}>
                          {track.genre}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-slate-900/20 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {track.bpm} BPM
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synth Controllers Panel */}
          <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-800 flex flex-col gap-3">
            <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-400 tracking-wider uppercase">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-blue" />
                <span>CO-PROCESSOR FILTERS</span>
              </div>
              <span className="text-brand-blue font-bold">LIVE MODE</span>
            </div>

            {/* Cutoff frequency sweep slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>FILTER FREQ (SWEER)</span>
                <span className="text-brand-blue font-bold">{filterCutoff} Hz</span>
              </div>
              <input
                type="range"
                min="300"
                max="4000"
                step="50"
                value={filterCutoff}
                onChange={(e) => setFilterCutoff(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue"
              />
            </div>

            {/* OSC shape select */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">OSCILLATOR FORM</span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {(['sawtooth', 'triangle', 'square'] as OscillatorType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSynthType(type)}
                    className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      synthType === type 
                        ? 'bg-brand-blue text-white shadow shadow-brand-blue/30' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type.substring(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 mt-1">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayback}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold font-display uppercase tracking-wider text-xs cursor-pointer shadow-lg transition-all transform hover:scale-[1.02] ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10' 
                  : 'bg-brand-yellow hover:bg-brand-yellow-dark text-slate-900 shadow-brand-yellow/10'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 stroke-[3]" />
                  <span>MUTE CYBER</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current stroke-[3]" />
                  <span>PLAY SYNTH</span>
                </>
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
