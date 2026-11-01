import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';

export const SpatialCursor: React.FC = () => {
  const isHoveringInteractive = useStore((s) => s.isHoveringInteractive);
  const hasEntered = useStore((s) => s.hasEntered);

  const [isLocked, setIsLocked] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  const smoothPos = useRef({ x: -100, y: -100 });
  const animRef = useRef<number | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsLocked(document.pointerLockElement !== null);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleMouseMove);

    const updateCursor = () => {
      const lerpSpeed = 0.25;
      smoothPos.current.x += (mousePos.x - smoothPos.current.x) * lerpSpeed;
      smoothPos.current.y += (mousePos.y - smoothPos.current.y) * lerpSpeed;

      if (cursorRef.current && ringRef.current) {
        cursorRef.current.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`;
        ringRef.current.style.transform = `translate3d(${smoothPos.current.x}px, ${smoothPos.current.y}px, 0)`;
      }

      animRef.current = requestAnimationFrame(updateCursor);
    };

    animRef.current = requestAnimationFrame(updateCursor);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mousePos.x, mousePos.y]);

  if (!hasEntered) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* --- FPS SHOOTER CENTER CROSSHAIR (WHEN LOCKED) --- */}
      {isLocked ? (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          {/* Subtle Outer Aim Ring */}
          <div
            className={`rounded-full transition-all duration-150 border ${
              isHoveringInteractive
                ? 'w-7 h-7 border-cyan-400 bg-cyan-400/20 shadow-[0_0_12px_#38bdf8]'
                : 'w-5 h-5 border-white/50'
            }`}
          />
          {/* Center Precision Dot */}
          <div
            className={`absolute rounded-full ${
              isHoveringInteractive ? 'w-2 h-2 bg-cyan-300' : 'w-1.5 h-1.5 bg-white shadow-sm'
            }`}
          />
        </div>
      ) : (
        /* --- FREE CURSOR (WHEN UNLOCKED) --- */
        <>
          {/* Trailing Outer Ring */}
          <div
            ref={ringRef}
            className={`fixed top-0 left-0 -ml-4 -mt-4 rounded-full transition-all duration-200 pointer-events-none ${
              isHoveringInteractive
                ? 'w-9 h-9 -ml-4.5 -mt-4.5 border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(56,189,248,0.6)]'
                : 'w-7 h-7 border border-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
            }`}
            style={{ willChange: 'transform' }}
          >
            <span className="absolute top-1/2 left-0 w-1 h-[1px] bg-white/40 -translate-y-1/2" />
            <span className="absolute top-1/2 right-0 w-1 h-[1px] bg-white/40 -translate-y-1/2" />
            <span className="absolute top-0 left-1/2 w-[1px] h-1 bg-white/40 -translate-x-1/2" />
            <span className="absolute bottom-0 left-1/2 w-[1px] h-1 bg-white/40 -translate-x-1/2" />
          </div>

          {/* Immediate Core Dot */}
          <div
            ref={cursorRef}
            className={`fixed top-0 left-0 -ml-1.5 -mt-1.5 rounded-full pointer-events-none transition-transform duration-150 ${
              isHoveringInteractive
                ? 'w-3.5 h-3.5 -ml-1.75 -mt-1.75 bg-black border-2 border-cyan-300 shadow-[0_0_8px_#38bdf8]'
                : 'w-2.5 h-2.5 bg-black border border-white/80 shadow-[0_0_6px_rgba(0,0,0,0.8)]'
            }`}
            style={{ willChange: 'transform' }}
          />

          {/* Subtle Prompt to Click for Shooter Mode */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-cyan-300 animate-pulse pointer-events-none">
            Click screen for FPS shooter controls • ESC to unlock
          </div>
        </>
      )}
    </div>
  );
};
