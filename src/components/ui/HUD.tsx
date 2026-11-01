import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { sounds } from '../../utils/sound';
import { ShoppingBag, Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';
import { TeleportBar } from './TeleportBar';

export const HUD: React.FC = () => {
  const hasEntered = useStore((s) => s.hasEntered);
  const cart = useStore((s) => s.cart);
  const toggleCart = useStore((s) => s.toggleCart);
  const isAudioMuted = useStore((s) => s.isAudioMuted);
  const toggleAudio = useStore((s) => s.toggleAudio);
  const setIsHoveringInteractive = useStore((s) => s.setIsHoveringInteractive);

  const [showHelp, setShowHelp] = useState(false);

  if (!hasEntered) return null;

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0);

  const handleAudioToggle = () => {
    sounds.playClick();
    sounds.setMuted(!isAudioMuted);
    toggleAudio();
  };

  const handleCartOpen = () => {
    sounds.playClick();
    toggleCart();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* --- TOP BAR --- */}
      <header className="flex items-center justify-between w-full">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-panel pointer-events-auto border border-white/10 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
            <span className="font-heading font-bold text-sm tracking-wider text-white">NEXUS MART</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
              3D VIRTUAL
            </span>
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2.5">
          {/* Audio Synthesizer Mute / Unmute */}
          <button
            onClick={handleAudioToggle}
            onMouseEnter={() => {
              setIsHoveringInteractive(true);
              sounds.playHover();
            }}
            onMouseLeave={() => setIsHoveringInteractive(false)}
            aria-label="Toggle Sound"
            className="p-3 rounded-2xl glass-panel pointer-events-auto border border-white/10 text-slate-300 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all active:scale-95"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Controls Quick Help Drawer Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowHelp(!showHelp);
            }}
            onMouseEnter={() => {
              setIsHoveringInteractive(true);
              sounds.playHover();
            }}
            onMouseLeave={() => setIsHoveringInteractive(false)}
            aria-label="Help Guide"
            className="p-3 rounded-2xl glass-panel pointer-events-auto border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 hidden sm:flex"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Interactive Cart Drawer Pill */}
          <button
            onClick={handleCartOpen}
            onMouseEnter={() => {
              setIsHoveringInteractive(true);
              sounds.playHover();
            }}
            onMouseLeave={() => setIsHoveringInteractive(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-panel pointer-events-auto border border-white/15 hover:border-cyan-400/50 transition-all shadow-xl active:scale-95 group"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-bounce shadow-md">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Cart</span>
              <span className="text-xs font-bold text-white font-mono">${totalPrice.toFixed(2)}</span>
            </div>
          </button>
        </div>
      </header>

      {/* --- COLLAPSIBLE CONTROLS HELP POPUP --- */}
      {showHelp && (
        <div className="self-end mt-2 max-w-xs p-4 rounded-2xl glass-panel pointer-events-auto border border-white/10 text-xs shadow-2xl animate-float">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Controls Guide
            </span>
            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="space-y-1.5 text-slate-300 text-[11px]">
            <p><span className="text-cyan-300 font-mono font-bold">WASD / Arrows:</span> Walk smoothly</p>
            <p><span className="text-cyan-300 font-mono font-bold">Shift:</span> Sprint run</p>
            <p><span className="text-cyan-300 font-mono font-bold">Mouse Look:</span> Click screen for shooter controls</p>
            <p><span className="text-cyan-300 font-mono font-bold">ESC Key:</span> Release mouse to click UI / cart</p>
            <p><span className="text-cyan-300 font-mono font-bold">Hotspot (&lt; 5m):</span> Hover for quick card, click for 3D model</p>
          </div>
        </div>
      )}

      {/* --- BOTTOM SECTION: TELEPORT BAR & CONTROLS HELPER --- */}
      <footer className="w-full flex flex-col items-center gap-3">
        {/* Navigation / Mini-Map Teleport Bar */}
        <TeleportBar />

        {/* Minimal Bottom Guide Pill */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-md text-[11px] font-mono text-slate-400 pointer-events-auto">
          <span>Walk: <kbd className="text-cyan-300">W A S D</kbd></span>
          <span>•</span>
          <span>Look: Mouse FPS (Click / ESC)</span>
          <span>•</span>
          <span>Sprint: <kbd className="text-cyan-300">Shift</kbd></span>
        </div>
      </footer>
    </div>
  );
};
