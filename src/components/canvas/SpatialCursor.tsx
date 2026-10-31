import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';

export const SpatialCursor: React.FC = () => {
  const isHoveringInteractive = useStore((s) => s.isHoveringInteractive);
  const hasEntered = useStore((s) => s.hasEntered);

  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [edgeZone, setEdgeZone] = useState<{ left: boolean; right: boolean; up: boolean; down: boolean }>({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const smoothPos = useRef({ x: -100, y: -100 });
  const animRef = useRef<number | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add custom cursor class to body
    document.body.classList.add('custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      setMousePos({ x: clientX, y: clientY });

      // Calculate edge zones (outer 35% margin = central 65% deadzone)
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = (clientX / w) * 2 - 1; // -1 to 1
      const ny = (clientY / h) * 2 - 1; // -1 to 1

      const DEADZONE = 0.65;
      setEdgeZone({
        left: nx < -DEADZONE,
        right: nx > DEADZONE,
        up: ny < -DEADZONE,
        down: ny > DEADZONE,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Spring/lerp trailing animation loop
    const updateCursor = () => {
      const lerpSpeed = 0.22;
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
      window.removeEventListener('mousemove', handleMouseMove);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      document.body.classList.remove('custom-cursor');
    };
  }, [mousePos.x, mousePos.y]);

  if (!hasEntered) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Trailing Outer Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 -ml-4 -mt-4 rounded-full transition-all duration-200 pointer-events-none ${
          isHoveringInteractive
            ? 'w-10 h-10 -ml-5 -mt-5 border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(56,189,248,0.6)]'
            : 'w-8 h-8 border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Subtle crosshair ticks */}
        <span className="absolute top-1/2 left-0 w-1 h-[1px] bg-white/40 -translate-y-1/2" />
        <span className="absolute top-1/2 right-0 w-1 h-[1px] bg-white/40 -translate-y-1/2" />
        <span className="absolute top-0 left-1/2 w-[1px] h-1 bg-white/40 -translate-x-1/2" />
        <span className="absolute bottom-0 left-1/2 w-[1px] h-1 bg-white/40 -translate-x-1/2" />
      </div>

      {/* Immediate Black Core Dot */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 -ml-1.5 -mt-1.5 rounded-full pointer-events-none transition-transform duration-150 ${
          isHoveringInteractive
            ? 'w-4 h-4 -ml-2 -mt-2 bg-black border-2 border-cyan-300 shadow-[0_0_8px_#38bdf8]'
            : 'w-3 h-3 bg-black border border-white/80 shadow-[0_0_6px_rgba(0,0,0,0.8)]'
        }`}
        style={{ willChange: 'transform' }}
      />

      {/* Visual Edge-Panning Prompt Indicators */}
      {edgeZone.left && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-cyan-400/80 bg-black/60 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md animate-pulse">
          <span>‹ PANNING LEFT</span>
        </div>
      )}
      {edgeZone.right && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-cyan-400/80 bg-black/60 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md animate-pulse">
          <span>PANNING RIGHT ›</span>
        </div>
      )}
      {edgeZone.up && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-cyan-400/80 bg-black/60 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md animate-pulse">
          <span>ˆ TILTING UP</span>
        </div>
      )}
      {edgeZone.down && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-cyan-400/80 bg-black/60 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md animate-pulse">
          <span>ˇ TILTING DOWN</span>
        </div>
      )}
    </div>
  );
};
