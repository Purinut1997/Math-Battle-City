import React, { useCallback, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onVirtualKey: (key: string, pressed: boolean) => void;
}

export function MobileControls({ onVirtualKey }: MobileControlsProps) {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const currentDir = useRef<string | null>(null);

  const handleTouchStart = useCallback(
    (key: string, e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onVirtualKey(key, true);
      // Haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    },
    [onVirtualKey]
  );

  const handleTouchEnd = useCallback(
    (key: string, e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onVirtualKey(key, false);
    },
    [onVirtualKey]
  );

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });

    let newDir: string | null = null;
    if (distance > maxRadius * 0.2) {
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      } else {
        newDir = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      }
    }

    if (currentDir.current !== newDir) {
      if (currentDir.current) {
        onVirtualKey(currentDir.current, false);
      }
      if (newDir) {
        onVirtualKey(newDir, true);
        if (navigator.vibrate) navigator.vibrate(10);
      }
      currentDir.current = newDir;
    }
  }, [onVirtualKey]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateJoystick(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setStickPos({ x: 0, y: 0 });
    if (currentDir.current) {
      onVirtualKey(currentDir.current, false);
      currentDir.current = null;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex items-center justify-between px-6 py-4 select-none touch-none bg-[#1e1e1e]/90 backdrop-blur-sm rounded-3xl border border-[#444] shadow-xl mt-2">
      {/* Analog Joystick */}
      <div 
        ref={joystickBaseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-36 h-36 bg-[#2a2a2a] rounded-full border-4 border-[#333] shadow-inner flex items-center justify-center touch-none cursor-pointer"
      >
        {/* Directional markers */}
        <div className="absolute top-2 w-2 h-2 bg-[#444] rounded-full" />
        <div className="absolute bottom-2 w-2 h-2 bg-[#444] rounded-full" />
        <div className="absolute left-2 w-2 h-2 bg-[#444] rounded-full" />
        <div className="absolute right-2 w-2 h-2 bg-[#444] rounded-full" />
        
        {/* The Stick */}
        <div 
          className="w-16 h-16 bg-gradient-to-b from-[#666] to-[#444] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-[#555] flex items-center justify-center pointer-events-none transition-transform duration-75"
          style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
        >
          <div className="w-8 h-8 bg-gradient-to-b from-[#555] to-[#333] rounded-full shadow-inner border border-[#333]" />
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center gap-4">
        {/* Fire Button (A) */}
        <div className="flex flex-col items-center">
          <button
            id="action-fire-btn"
            onTouchStart={(e) => handleTouchStart(' ', e)}
            onTouchEnd={(e) => handleTouchEnd(' ', e)}
            onMouseDown={(e) => handleTouchStart(' ', e)}
            onMouseUp={(e) => handleTouchEnd(' ', e)}
            onMouseLeave={(e) => handleTouchEnd(' ', e)}
            className="w-24 h-24 bg-gradient-to-b from-[#e83020] to-[#991508] active:from-[#800f05] active:to-[#550a03] rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg shadow-red-950/60 border-2 border-red-400 active:scale-95 ring-4 ring-[#2d2d2d] touch-none"
            aria-label="Fire Button"
          >
            <Crosshair size={28} className="mb-1" />
            <span className="text-sm tracking-wider">ยิง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
