import React, { useEffect, useState, useRef } from 'react';
import { TrackingState, Continent, PlanetConfig, PLANETS } from '../types';
import { Shield, Radio, Activity, Globe, Crosshair, Cpu, Wind, Thermometer, Orbit } from 'lucide-react';

interface CyberHUDProps {
  trackingRef: React.MutableRefObject<TrackingState>;
  activeContinent: Continent;
  activePlanet: PlanetConfig;
  onSelectPlanet: (p: PlanetConfig) => void;
}

// Map themes to Tailwind classes explicitly
const THEME_STYLES = {
  cyan: {
    text: 'text-cyan-400',
    textDim: 'text-cyan-600',
    textLight: 'text-cyan-100',
    border: 'border-cyan-500',
    bg: 'bg-cyan-900',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    pulse: 'text-cyan-400'
  },
  red: {
    text: 'text-red-500',
    textDim: 'text-red-800',
    textLight: 'text-red-200',
    border: 'border-red-600',
    bg: 'bg-red-950',
    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.4)]',
    pulse: 'text-red-500'
  },
  slate: {
    text: 'text-slate-300',
    textDim: 'text-slate-500',
    textLight: 'text-white',
    border: 'border-slate-400',
    bg: 'bg-slate-800',
    glow: 'shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    pulse: 'text-white'
  }
};

export const CyberHUD: React.FC<CyberHUDProps> = ({ trackingRef, activeContinent, activePlanet, onSelectPlanet }) => {
  const [time, setTime] = useState('');
  const [hexStream, setHexStream] = useState<string[]>([]);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const panelPos = useRef({ x: window.innerWidth - 420, y: 100 }); 
  const isDragging = useRef(false);

  // Get current theme styles
  const theme = THEME_STYLES[activePlanet.theme];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(now.getMilliseconds() / 10));
    };
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const chars = '0123456789ABCDEF';
    const interval = setInterval(() => {
      const line = Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(' ');
      setHexStream(prev => [line, ...prev].slice(0, 10));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Interaction Loop
  useEffect(() => {
    let rAF: number;
    const loop = () => {
      const { rightHand } = trackingRef.current;
      const panel = panelRef.current;

      if (rightHand && panel) {
        const thumb = rightHand.landmarks[4];
        const index = rightHand.landmarks[8];
        const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));

        if (dist < 0.05) {
          isDragging.current = true;
          const targetX = (1 - rightHand.landmarks[9].x) * window.innerWidth; 
          const targetY = rightHand.landmarks[9].y * window.innerHeight;

          panelPos.current.x += (targetX - panelPos.current.x - 200) * 0.1;
          panelPos.current.y += (targetY - panelPos.current.y - 100) * 0.1;
        } else {
          isDragging.current = false;
        }

        panel.style.transform = `translate3d(${panelPos.current.x}px, ${panelPos.current.y}px, 0) scale(${isDragging.current ? 1.05 : 1})`;
        panel.style.borderColor = isDragging.current ? '#ffffff' : 'rgba(100, 100, 100, 0.5)';
      }
      rAF = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rAF);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 select-none overflow-hidden transition-colors duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className={`border-l-4 ${theme.border} pl-4 bg-black/40 p-2 backdrop-blur-sm transition-colors duration-500`}>
            <h2 className={`${theme.text} font-mono text-xs animate-pulse`}>SYSTEM STATUS</h2>
            <div className={`${theme.textLight} font-sans text-xl font-bold flex items-center gap-2`}>
              <Shield size={18} /> ONLINE
            </div>
            <div className={`${theme.textDim} text-xs font-mono mt-1`}>
               CPU: {Math.floor(Math.random() * 20 + 30)}% <br/>
               TARGET: {activePlanet.name}
            </div>
          </div>
          
          <div className={`font-mono text-[10px] ${theme.textDim} leading-none mt-4 opacity-50`}>
            {hexStream.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        <div className="text-right">
          <h1 className={`text-6xl font-black ${theme.text} tracking-tighter glow-text font-sans opacity-90 transition-colors duration-500`}>
            J.A.R.V.I.S.
          </h1>
          <div className={`text-2xl font-mono ${theme.textLight} mt-[-10px] opacity-80`}>{time}</div>
          <div className={`h-1 w-full bg-gray-900 mt-2 relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 h-full w-1/3 ${theme.bg} brightness-150 animate-slide-right`}></div>
          </div>
        </div>
      </div>

      {/* Draggable Info Panel */}
      <div 
        ref={panelRef}
        className={`absolute w-80 bg-black/70 border ${theme.border} backdrop-blur-md ${theme.textLight} p-4 rounded-br-2xl ${theme.glow} transition-all duration-500`}
        style={{ transform: `translate3d(${window.innerWidth - 420}px, 100px, 0)` }}
      >
        <div className={`flex items-center justify-between border-b ${theme.border} border-opacity-30 pb-2 mb-2`}>
          <span className={`flex items-center gap-2 font-bold ${theme.text}`}>
            <Globe size={16} /> 行星情报
          </span>
          <Activity size={16} className={`${theme.pulse} animate-pulse`} />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className={theme.textDim}>目标区域</span>
            <span className={`font-mono text-white ${theme.bg} bg-opacity-50 px-2 rounded`}>
              {activePlanet.id === 'earth' ? activeContinent : activePlanet.name}
            </span>
          </div>
          
          {/* Planet Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mt-2">
             <div className={`bg-black/40 p-2 border border-white/10 rounded flex flex-col gap-1`}>
                <div className={`flex items-center gap-1 text-[10px] ${theme.textDim}`}>
                  <Orbit size={10} /> 重力
                </div>
                <div className="font-mono text-sm">{activePlanet.stats.gravity}</div>
             </div>
             <div className={`bg-black/40 p-2 border border-white/10 rounded flex flex-col gap-1`}>
                <div className={`flex items-center gap-1 text-[10px] ${theme.textDim}`}>
                  <Thermometer size={10} /> 均温
                </div>
                <div className="font-mono text-sm">{activePlanet.stats.temp}</div>
             </div>
             <div className={`bg-black/40 p-2 border border-white/10 rounded flex flex-col gap-1`}>
                <div className={`flex items-center gap-1 text-[10px] ${theme.textDim}`}>
                  <Wind size={10} /> 大气
                </div>
                <div className="font-mono text-sm">{activePlanet.stats.atmosphere}</div>
             </div>
             <div className={`bg-black/40 p-2 border border-white/10 rounded flex flex-col gap-1`}>
                <div className={`flex items-center gap-1 text-[10px] ${theme.textDim}`}>
                  <Activity size={10} /> 人口
                </div>
                <div className="font-mono text-sm">{activePlanet.stats.population}</div>
             </div>
          </div>

          <div className={`h-16 ${theme.bg} bg-opacity-20 border ${theme.border} border-opacity-30 relative overflow-hidden p-2`}>
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{
                    backgroundImage: `linear-gradient(0deg, transparent 24%, ${activePlanet.color} 25%, ${activePlanet.color} 26%, transparent 27%, transparent 74%, ${activePlanet.color} 75%, ${activePlanet.color} 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, ${activePlanet.color} 25%, ${activePlanet.color} 26%, transparent 27%, transparent 74%, ${activePlanet.color} 75%, ${activePlanet.color} 76%, transparent 77%, transparent)`,
                    backgroundSize: '30px 30px'
                  }}>
             </div>
             <div className={`font-mono text-[10px] ${theme.text} opacity-80`}>
               > TERRAIN SCAN: COMPLETE<br/>
               > SURFACE: {activePlanet.id === 'earth' ? 'WATER/LAND' : 'CRATER/DUST'}<br/>
               > ORBITAL STABILITY: 99.9%
             </div>
          </div>
        </div>
      </div>

      {/* Footer / Planet Switcher */}
      <div className="flex flex-col items-center w-full mb-4 pointer-events-auto">
         
         {/* Planet Dock */}
         <div className="flex gap-4 mb-6 backdrop-blur-md bg-black/40 p-3 rounded-full border border-white/10">
            {PLANETS.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPlanet(p)}
                className={`
                  relative px-4 py-2 rounded-full font-mono text-xs transition-all duration-300
                  ${activePlanet.id === p.id 
                    ? `bg-${p.theme}-900/80 text-white border border-${p.theme}-400 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110` 
                    : 'text-gray-500 hover:text-white hover:bg-white/10'}
                `}
              >
                {p.name}
              </button>
            ))}
         </div>

         {/* Status Line */}
         <div className="w-full flex justify-between items-end px-4">
            <div className="flex gap-4">
               <div className={`flex items-center gap-2 ${theme.textDim} text-sm font-mono`}>
                 <Cpu size={14} />
                 <span>LH: NAV</span>
               </div>
               <div className={`flex items-center gap-2 ${theme.textDim} text-sm font-mono`}>
                 <Radio size={14} />
                 <span>RH: UI</span>
               </div>
            </div>
            
            <div className={`flex items-center gap-2 ${theme.textDim} text-xs font-mono`}>
               <Crosshair size={12} className="animate-spin-slow" />
               PROTOCOL V3.0 (INTERSTELLAR)
            </div>
         </div>
      </div>

    </div>
  );
};