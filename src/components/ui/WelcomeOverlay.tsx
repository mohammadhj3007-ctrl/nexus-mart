import React from 'react';
import { useStore } from '../../store/useStore';
import { sounds } from '../../utils/sound';
import { ArrowRight, Compass, Move, Eye, Sparkles } from 'lucide-react';

export const WelcomeOverlay: React.FC = () => {
  const hasEntered = useStore((s) => s.hasEntered);
  const enterStore = useStore((s) => s.enterStore);
  const setIsHoveringInteractive = useStore((s) => s.setIsHoveringInteractive);

  if (hasEntered) return null;

  const handleEnter = () => {
    sounds.playClick();
    sounds.startAmbient();
    enterStore();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050811]/85 backdrop-blur-xl transition-all duration-700">
      {/* Background ambient glow shapes */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] -top-10 -left-10 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-purple-500/15 blur-[120px] -bottom-10 -right-10 pointer-events-none" />

      <div className="relative max-w-xl w-full p-8 md:p-10 rounded-3xl glass-panel text-center border border-white/15 shadow-2xl">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Next-Generation Virtual Commerce</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-white mb-3">
          Welcome to <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">NEXUS MART</span>
        </h1>
        <p className="text-slate-300 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
          An ultra-smooth, boutique-scale interactive 3D retail experience. Walk the aisles, inspect procedural products, and discover modern shopping.
        </p>

        {/* Interactive Controls Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Movement</h4>
              <p className="text-[12px] text-slate-400 mt-0.5">Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">W</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">A</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">S</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">D</kbd> or arrow keys to stroll smoothly through the store.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Spatial Look</h4>
              <p className="text-[12px] text-slate-400 mt-0.5">Aim freely in the center deadzone. Move to screen edges to pan camera and look around.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 sm:col-span-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Interactive Hotspots</h4>
              <p className="text-[12px] text-slate-400 mt-0.5">Step within 5 meters of product shelves to reveal glowing hotspots. Hover to view quick cards or click to inspect 3D models.</p>
            </div>
          </div>
        </div>

        {/* Enter CTA Button */}
        <button
          onClick={handleEnter}
          onMouseEnter={() => {
            setIsHoveringInteractive(true);
            sounds.playHover();
          }}
          onMouseLeave={() => setIsHoveringInteractive(false)}
          className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 text-slate-950 font-bold text-base transition-all duration-300 hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] active:scale-95"
        >
          <span>ENTER STOREFRONT</span>
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <p className="text-[11px] text-slate-500 mt-4 font-mono">
          Spatial Audio enabled • Built with Three.js & React
        </p>
      </div>
    </div>
  );
};
