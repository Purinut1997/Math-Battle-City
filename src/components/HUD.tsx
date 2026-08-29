import React from 'react';
import { Volume2, VolumeX, Pause, Play, Heart, Target, Clock, Trophy } from 'lucide-react';

interface HUDProps {
  level: number;
  lives: number;
  score: number;
  timer: number;
  targetNumber: number;
  isMuted: boolean;
  isPaused: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
}

export function HUD({
  level,
  lives,
  score,
  timer,
  targetNumber,
  isMuted,
  isPaused,
  onToggleSound,
  onTogglePause,
}: HUDProps) {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between font-sans text-white text-xs sm:text-sm select-none z-10 rounded-t-2xl sm:rounded-t-3xl shadow-lg">
      
      {/* Left: Level & Lives */}
      <div className="flex items-center gap-3 sm:gap-5 z-20">
        {/* Level Badge */}
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
          <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Stage</span>
          <span className="font-orbitron text-white font-bold text-base sm:text-lg drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">{level}</span>
        </div>
        
        {/* Lives */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart 
              key={i} 
              size={18} 
              weight={i < lives ? "fill" : "regular"}
              className={`transition-all duration-300 ${
                i < lives 
                  ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-110' 
                  : 'text-white/20'
              }`} 
            />
          ))}
        </div>
      </div>

      {/* Center: Mission Target (Aligned to Game Arena Center, approx 38.2% of 680px width) */}
      <div className="absolute left-[38.2%] -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10 w-[140px] sm:w-[180px]">
        <div className="relative flex items-center justify-center bg-black/60 border border-green-500/50 rounded-xl px-4 py-1.5 shadow-[0_0_20px_rgba(34,197,94,0.3)] w-full overflow-hidden group">
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          
          <Target size={14} className="text-green-400 mr-2 opacity-80 hidden sm:block" />
          <div className="flex items-baseline gap-2">
            <span className="font-orbitron font-black text-xl sm:text-2xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
              {targetNumber > 0 ? targetNumber : '-'}
            </span>
          </div>
          
          {/* Subtle label overlay */}
          <span className="absolute -top-2 bg-black px-2 text-[9px] text-green-400 tracking-widest font-bold uppercase border border-green-500/30 rounded-full">
            Target
          </span>
        </div>
      </div>

      {/* Right: Stats & Controls */}
      <div className="flex items-center gap-3 sm:gap-5 z-20">
        
        {/* Score */}
        <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
          <Trophy size={14} className="text-amber-400" />
          <span className="font-orbitron text-amber-400 font-bold tracking-widest text-base">
            {score.toLocaleString().padStart(5, '0')}
          </span>
        </div>

        {/* Time (Mobile hidden) */}
        <div className="hidden md:flex items-center gap-2 text-white/60 font-orbitron">
          <Clock size={14} />
          <span className="text-sm tracking-widest">{formatTime(timer)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 ml-1">
          <button
            onClick={onToggleSound}
            className="p-2 bg-white/5 hover:bg-white/10 active:scale-95 rounded-full border border-white/10 transition-all text-white/80 hover:text-white"
          >
            {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />}
          </button>
          <button
            onClick={onTogglePause}
            className="p-2 bg-white/5 hover:bg-white/10 active:scale-95 rounded-full border border-white/10 transition-all text-white/80 hover:text-white"
          >
            {isPaused ? <Play size={16} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] fill-amber-400" /> : <Pause size={16} />}
          </button>
        </div>

      </div>
    </div>
  );
}
