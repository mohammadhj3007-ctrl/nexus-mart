import React from 'react';
import { TELEPORT_ZONES } from '../../data/products';
import { useStore } from '../../store/useStore';
import { sounds } from '../../utils/sound';
import { Navigation, Coffee, ShoppingCart, Cpu, Sparkles, LogIn } from 'lucide-react';

export const TeleportBar: React.FC = () => {
  const teleportTo = useStore((s) => s.teleportTo);
  const playerPos = useStore((s) => s.playerPos);
  const setIsHoveringInteractive = useStore((s) => s.setIsHoveringInteractive);

  // Determine closest zone for active tab styling
  let closestZone = TELEPORT_ZONES[0];
  let minDistance = Infinity;

  TELEPORT_ZONES.forEach((zone) => {
    const d = Math.sqrt(
      Math.pow(playerPos[0] - zone.position[0], 2) +
        Math.pow(playerPos[2] - zone.position[2], 2)
    );
    if (d < minDistance) {
      minDistance = d;
      closestZone = zone;
    }
  });

  const getIcon = (id: string) => {
    switch (id) {
      case 'entrance':
        return <LogIn className="w-3.5 h-3.5" />;
      case 'aisle-1':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'aisle-2':
        return <ShoppingCart className="w-3.5 h-3.5" />;
      case 'aisle-3':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'aisle-4':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'checkout':
        return <Navigation className="w-3.5 h-3.5" />;
      default:
        return <Navigation className="w-3.5 h-3.5" />;
    }
  };

  const handleTeleport = (zone: typeof TELEPORT_ZONES[0]) => {
    sounds.playTeleport();
    teleportTo(zone.position, zone.lookAt);
  };

  return (
    <nav className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel pointer-events-auto border border-white/10 shadow-2xl overflow-x-auto max-w-full">
      <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-cyan-400 border-r border-white/10 mr-1 hidden sm:flex">
        <Navigation className="w-3 h-3 text-cyan-400" />
        <span className="font-bold uppercase tracking-wider">NAV</span>
      </div>

      {TELEPORT_ZONES.map((zone) => {
        const isActive = closestZone.id === zone.id;

        return (
          <button
            key={zone.id}
            onClick={() => handleTeleport(zone)}
            onMouseEnter={() => {
              setIsHoveringInteractive(true);
              sounds.playHover();
            }}
            onMouseLeave={() => setIsHoveringInteractive(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap active:scale-95 ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
          >
            <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
              {getIcon(zone.id)}
            </span>
            <span className="font-semibold">{zone.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
