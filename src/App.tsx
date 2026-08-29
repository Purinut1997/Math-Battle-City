import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/constants';
import { sounds } from './game/sound';
import { Play, RotateCcw, Shield, Award, HelpCircle, Gamepad2, Sparkles } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<
    'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'LEVEL_TRANSITION'
  >('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [targetNumber, setTargetNumber] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showTargetPopup, setShowTargetPopup] = useState(false);

  // Trigger popup when level or target changes
  useEffect(() => {
    if (gameState === 'PLAYING' && targetNumber > 0) {
      setShowTargetPopup(true);
      const t = setTimeout(() => setShowTargetPopup(false), 3000);
      return () => clearTimeout(t);
    }
  }, [level, targetNumber, gameState]);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      const engine = new GameEngine(canvasRef.current);
      engine.onStateChange = (state) => setGameState(state as any);
      engine.onScoreChange = setScore;
      engine.onLivesChange = setLives;
      engine.onLevelChange = setLevel;
      engine.onTargetChange = setTargetNumber;
      engineRef.current = engine;

      // Draw initial frame
      engine.draw();
    }
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any;
    if (gameState === 'PLAYING') {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else if (gameState === 'MENU' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleStartGame = (startLevel: number = 1) => {
    if (engineRef.current) {
      setShowHowToPlay(false);
      engineRef.current.startGame(startLevel, 3, 0);
    }
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  };

  const handleVirtualKey = (key: string, pressed: boolean) => {
    if (engineRef.current) {
      engineRef.current.setVirtualKey(key, pressed);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#050814] to-black flex flex-col items-center justify-center p-2 sm:p-4 font-sans select-none overflow-x-hidden text-gray-100">
      
      {/* Decorative Grid Background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] pointer-events-none opacity-50 z-0" />

      {/* Force Landscape Overlay for Mobile Devices */}
      <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex-col items-center justify-center p-6 text-center landscape:hidden lg:hidden flex">
        <RotateCcw className="text-cyan-400 mb-6 animate-[spin_3s_linear_infinite]" size={64} />
        <h2 className="text-2xl font-black text-white mb-3 tracking-wide">โปรดหมุนหน้าจอแนวนอน</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          เกมนี้ถูกออกแบบมาให้เล่นในรูปแบบแนวนอน (Landscape) เพื่อการควบคุมและมุมมองที่ดีที่สุดครับ
        </p>
      </div>

      {/* Top Banner / Title Header */}
      <header className="mb-3 text-center z-10 relative">
        <h1 className="font-orbitron text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center gap-3">
          <Gamepad2 className="text-cyan-400" size={28} />
          MATH BATTLE
          <span className="text-xs sm:text-sm bg-blue-950/50 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 font-sans tracking-normal shadow-[0_0_10px_rgba(34,211,238,0.2)] backdrop-blur-sm">
            Operation Number Shield
          </span>
        </h1>
      </header>

      {/* Main Arcade Frame Container */}
      <div className="w-full max-w-[720px] flex flex-col items-center z-10 relative">
        {/* Arcade Screen Bezel */}
        <div className="w-full bg-gradient-to-b from-[#1a1c29] to-[#0f111a] p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-cyan-500/20 backdrop-blur-sm relative overflow-hidden">
          
          {/* Subtle bezel glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          
          {/* Top HUD Bar */}
          <HUD
            level={level}
            lives={lives}
            score={score}
            timer={timer}
            targetNumber={targetNumber}
            isMuted={isMuted}
            isPaused={gameState === 'PAUSED'}
            onToggleSound={handleToggleSound}
            onTogglePause={handleTogglePause}
          />

          {/* CRT Game Screen with Aspect Ratio Scaling */}
          <div className="relative w-full aspect-[680/560] bg-black overflow-hidden rounded-b-xl sm:rounded-b-2xl border border-white/5 shadow-inner">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full block image-pixelated relative z-0"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* CRT Scanline overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] z-10 mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] z-10" />

            {/* START MENU OVERLAY */}
            {gameState === 'MENU' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-between p-6 text-center z-30 animate-fade-in">
                
                {/* Decorative top elements */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-900/40 to-transparent pointer-events-none" />
                
                {/* Title */}
                <div className="mt-8 sm:mt-12 relative">
                  <div className="inline-flex items-center gap-2 bg-cyan-950/40 text-cyan-400 text-xs px-4 py-1.5 rounded-full border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(34,211,238,0.2)] backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    เวอร์ชันภาษาไทย • 16-BIT RETRO EDITION
                  </div>
                  <h2 className="font-orbitron text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_4px_15px_rgba(250,204,21,0.5)] leading-tight tracking-wider">
                    MATH BATTLE
                  </h2>
                  <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-[0.2em] mt-1">
                    CITY
                  </h3>
                  <p className="text-sm sm:text-base text-cyan-100/70 mt-3 font-sans">
                    เกมยิงรถถังคณิตศาสตร์ ป้องกันฐานตัวเลข
                  </p>
                </div>

                {/* Start Buttons */}
                <div className="w-full max-w-sm flex flex-col gap-4 my-auto relative z-10">
                  <button
                    id="start-game-btn"
                    onClick={() => handleStartGame(1)}
                    className="group relative w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 active:scale-95 text-white font-bold text-lg sm:text-xl rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] border border-cyan-400/50 flex items-center justify-center gap-3 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Play size={24} className="fill-current drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] relative z-10" />
                    <span className="font-orbitron tracking-widest relative z-10">PRESS START</span>
                  </button>

                  <button
                    id="how-to-play-btn"
                    onClick={() => setShowHowToPlay(true)}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 active:scale-95 text-cyan-200 text-sm font-semibold rounded-xl border border-white/10 hover:border-cyan-500/30 flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
                  >
                    <HelpCircle size={18} />
                    วิธีเล่นและกติกา
                  </button>
                </div>

                {/* Footer Watermark */}
                <div className="w-full flex items-center justify-between text-[11px] text-white/40 pt-4 border-t border-white/10 relative z-10">
                  <span className="font-sans">PC: WASD / Spacebar • Mobile: Joystick / Button</span>
                  <span className="text-cyan-500/80 font-bold tracking-wider">Created by MIKPURINUT</span>
                </div>
              </div>
            )}

            {/* HOW TO PLAY MODAL */}
            {showHowToPlay && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-6 text-left z-40 overflow-y-auto animate-fade-in">
                <div className="w-full max-w-md relative z-10">
                  <h3 className="font-orbitron text-2xl font-black text-cyan-400 text-center mb-6 flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    <Shield size={24} className="text-cyan-300" />
                    HOW TO PLAY
                  </h3>

                  <div className="space-y-3 text-sm text-cyan-50/90 bg-cyan-950/20 p-5 rounded-2xl border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-green-400 font-black text-base">01</span>
                      <p>
                        <b className="text-green-300">ยิงสมการที่ถูกต้อง:</b> ดูตัวเลขเป้าหมายบนฐาน (เช่น เป้าหมาย 15) แล้วยิงรถถังที่มีสมการผลลัพธ์เท่ากับเลขเป้าหมาย (เช่น <span className="text-green-400">10+5</span>) ได้ <b className="text-amber-400">+500 คะแนน</b>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-rose-400 font-black text-base">02</span>
                      <p>
                        <b className="text-rose-400">ระวังยิงผิด:</b> หากยิงรถถังที่สมการไม่ตรง จะเสีย <b className="text-rose-500">-500 คะแนน</b> และรถถังคันนั้นจะกลายเป็น <b className="text-rose-500 animate-pulse">Enraged (สีแดง)</b> วิ่งเข้าหาฐานเร็วขึ้น 2 เท่า!
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 font-black text-base">03</span>
                      <p>
                        <b className="text-purple-300">ไอเทมพิเศษ:</b> เก็บไอเทมที่ดรอป เช่น <b>π (Pi Bomb)</b> ล้างศัตรูผิด, <b>📐 (Protractor)</b> สร้างเกราะเหล็ก 15 วิ, <b>⏱️ (Calculator)</b> แช่แข็งศัตรู 5 วิ, <b>❤️ (+1 Life)</b>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-amber-400 font-black text-base">04</span>
                      <p>
                        <b className="text-amber-300">ด่าน 10 Boss Battle:</b> ยิงสมุนตัวเลขที่ตรงกับค่า X (เช่น <span className="text-cyan-400">3X + 5 = 20 → X = 5</span>) เพื่อเก็บ Number Bullet ยิงโจมตี Boss ให้ครบ 5 ครั้ง
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  id="close-how-to-play-btn"
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full max-w-xs mt-6 py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-cyan-100 font-bold text-sm rounded-xl border border-white/20 hover:border-cyan-500/50 transition-all backdrop-blur-md relative z-10"
                >
                  เข้าใจแล้ว • ปิดหน้าต่าง
                </button>
              </div>
            )}

            {/* LEVEL TRANSITION OVERLAY */}
            {gameState === 'LEVEL_TRANSITION' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center z-30 animate-fade-in">
                <div className="font-orbitron text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] mb-4 animate-[bounce_2s_infinite]">
                  STAGE {level} CLEAR!
                </div>
                <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-6" />
                <p className="text-cyan-200/80 tracking-widest uppercase text-sm font-bold flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Preparing Stage {level + 1}
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </p>
              </div>
            )}

            {/* PAUSE OVERLAY */}
            {gameState === 'PAUSED' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center z-30 animate-fade-in">
                <h3 className="font-orbitron text-4xl sm:text-5xl font-black text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-[0.2em] mb-8">
                  PAUSED
                </h3>
                <button
                  id="resume-btn"
                  onClick={handleTogglePause}
                  className="group relative px-8 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-2xl border border-white/20 flex items-center gap-3 transition-all backdrop-blur-md overflow-hidden"
                >
                  <div className="absolute inset-0 bg-cyan-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Play size={20} className="fill-current relative z-10" /> 
                  <span className="font-orbitron tracking-widest relative z-10">RESUME</span>
                </button>
              </div>
            )}

            {/* TARGET NOTIFICATION POPUP */}
            {showTargetPopup && gameState === 'PLAYING' && (
              <div className="absolute inset-x-0 top-1/4 flex justify-center z-20 pointer-events-none animate-[slide-down_0.3s_ease-out]">
                <div className="bg-black/60 backdrop-blur-md border border-cyan-500/50 px-8 py-4 rounded-3xl shadow-[0_0_40px_rgba(34,211,238,0.4)] text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <div className="text-cyan-400 text-xs sm:text-sm font-bold mb-2 uppercase tracking-[0.2em] relative z-10">
                    NEW TARGET ACQUIRED
                  </div>
                  <div className="text-white text-3xl sm:text-4xl font-orbitron font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] relative z-10">
                    <span className="opacity-80">SOLVE: </span><span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">{targetNumber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* GAME OVER OVERLAY */}
            {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
                
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-rose-900/40 to-transparent pointer-events-none" />
                
                <h2 className="font-orbitron text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-red-600 drop-shadow-[0_0_25px_rgba(225,29,72,0.6)] tracking-wider mb-2 relative z-10">
                  GAME OVER
                </h2>
                <p className="text-sm sm:text-base text-rose-200/80 mb-8 font-sans relative z-10">
                  ฐานบัญชาการถูกทำลาย หรือ พลังชีวิตหมดลง
                </p>

                <div className="bg-black/40 backdrop-blur-sm px-10 py-6 rounded-3xl border border-rose-500/30 mb-8 shadow-inner relative z-10">
                  <div className="text-xs text-rose-300/80 uppercase tracking-widest font-bold mb-1">Final Score</div>
                  <div className="font-orbitron text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-4">{score.toLocaleString().padStart(5, '0')}</div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent mb-4" />
                  <div className="text-sm text-rose-200">Survived to Stage: <span className="font-orbitron font-bold text-amber-400 text-lg ml-2">{level}</span></div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <button
                    id="restart-game-btn"
                    onClick={() => handleStartGame(1)}
                    className="group relative px-8 py-4 bg-gradient-to-r from-rose-700 to-red-900 hover:from-rose-600 hover:to-red-800 active:scale-95 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.4)] border border-rose-400/50 flex items-center justify-center gap-3 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <RotateCcw size={20} className="relative z-10" />
                    <span className="font-orbitron tracking-widest relative z-10">RESTART</span>
                  </button>
                </div>
              </div>
            )}

            {/* VICTORY OVERLAY */}
            {gameState === 'VICTORY' && (
              <div className="absolute inset-0 bg-blue-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in overflow-hidden">
                
                {/* Confetti / glow effects */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjMwIiBmaWxsPSJyZ2JhKDI1MCwgMjA0LCAyMSwgMC4wNSkiIGZpbHRlcj0iYmx1cigyMHB4KSIvPjwvc3ZnPg==')] opacity-50" />
                
                <Award size={64} className="text-yellow-400 mb-6 animate-[bounce_3s_infinite] drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] relative z-10" />
                
                <h2 className="font-orbitron text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] mb-3 relative z-10">
                  MISSION ACCOMPLISHED
                </h2>
                <p className="text-sm sm:text-base text-cyan-200 mb-8 max-w-[80%] relative z-10">
                  คุณได้ปกป้อง Number Shield และปราบ Boss สำเร็จครบทั้ง 10 ด่าน!
                </p>

                <div className="bg-black/50 backdrop-blur-md px-10 py-6 rounded-3xl border border-amber-500/30 mb-8 shadow-inner relative z-10">
                  <div className="text-xs text-amber-300/80 uppercase tracking-widest font-bold mb-1">Total Score</div>
                  <div className="font-orbitron text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] mb-4">{score.toLocaleString().padStart(5, '0')}</div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-4" />
                  <div className="text-sm text-cyan-200/80">Clear Time: <span className="font-orbitron font-bold text-white ml-2">{Math.floor(timer / 60)}M {timer % 60}S</span></div>
                </div>

                <button
                  id="victory-replay-btn"
                  onClick={() => handleStartGame(1)}
                  className="group relative px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 active:scale-95 text-black font-black rounded-2xl shadow-[0_0_40px_rgba(250,204,21,0.5)] border border-yellow-300 flex items-center justify-center gap-3 transition-all overflow-hidden relative z-10"
                >
                  <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Sparkles size={22} className="relative z-10" />
                  <span className="font-orbitron tracking-widest relative z-10 text-lg">PLAY AGAIN</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Touch Controls (Always available on touch devices, visible under arcade frame) */}
        {isTouchDevice && (
          <div className="w-full mt-2">
            <MobileControls onVirtualKey={handleVirtualKey} />
          </div>
        )}

        {/* Desktop Keyboard Controls Legend */}
        {!isTouchDevice && (
          <div className="mt-4 w-full flex items-center justify-center gap-6 text-xs text-cyan-200/50 px-2 font-sans relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10 text-white font-orbitron tracking-widest shadow-inner">WASD</span>
              <span>MOVE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10 text-white font-orbitron tracking-widest shadow-inner">SPACE</span>
              <span>FIRE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10 text-white font-orbitron tracking-widest shadow-inner">P</span>
              <span>PAUSE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
