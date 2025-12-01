import React, { useEffect, useState, useRef } from 'react';
import { TrackingState, Continent } from '../types';
import { Shield, Radio, Activity, Globe, Crosshair, Cpu } from 'lucide-react';

interface CyberHUDProps {
  trackingRef: React.MutableRefObject<TrackingState>;
  activeContinent: Continent;
}

export const CyberHUD: React.FC<CyberHUDProps> = ({ trackingRef, activeContinent }) => {
  const [time, setTime] = useState('');
  const [hexStream, setHexStream] = useState<string[]>([]);
  
  // Floating Panel Refs
  const panelRef = useRef<HTMLDivElement>(null);
  const panelPos = useRef({ x: window.innerWidth - 420, y: 100 }); // Initial pos
  const isDragging = useRef(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(now.getMilliseconds() / 10));
    };
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, []);

  // Hex stream effect
  useEffect(() => {
    const chars = '0123456789ABCDEF';
    const interval = setInterval(() => {
      const line = Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(' ');
      setHexStream(prev => [line, ...prev].slice(0, 10));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Interaction Loop for Draggable Panel (60fps)
  useEffect(() => {
    let rAF: number;
    
    const loop = () => {
      const { rightHand } = trackingRef.current;
      const panel = panelRef.current;

      if (rightHand && panel) {
        // Pinch detection for Right Hand (Drag gesture)
        const thumb = rightHand.landmarks[4];
        const index = rightHand.landmarks[8];
        const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));

        // Threshold 0.05 for pinch
        if (dist < 0.05) {
          isDragging.current = true;
          
          // Map normalized coordinates (0-1) to screen pixels
          // MediaPipe X is normalized [0, 1]. In CSS, 0 is left.
          // Note: MediaPipe X is mirrored by default usually? We handled mirroring in drawing, 
          // but raw coordinates usually: x increases left to right? 
          // Actually, for front camera, usually x is 0 on left.
          // Let's assume standard mapping.
          
          const targetX = (1 - rightHand.landmarks[9].x) * window.innerWidth; // Mirror X
          const targetY = rightHand.landmarks[9].y * window.innerHeight;

          // Smooth follow
          panelPos.current.x += (targetX - panelPos.current.x - 200) * 0.1; // -200 to center on hand
          panelPos.current.y += (targetY - panelPos.current.y - 100) * 0.1;
        } else {
          isDragging.current = false;
        }

        // Apply Position
        panel.style.transform = `translate3d(${panelPos.current.x}px, ${panelPos.current.y}px, 0) scale(${isDragging.current ? 1.05 : 1})`;
        panel.style.borderColor = isDragging.current ? '#ffffff' : 'rgba(0, 255, 255, 0.5)';
      }

      rAF = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(rAF);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 select-none overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        {/* Left Status */}
        <div className="flex flex-col gap-2">
          <div className="border-l-4 border-cyan-400 pl-4 bg-black/40 p-2 backdrop-blur-sm">
            <h2 className="text-cyan-400 font-mono text-xs animate-pulse">SYSTEM STATUS</h2>
            <div className="text-cyan-100 font-sans text-xl font-bold flex items-center gap-2">
              <Shield size={18} /> ONLINE
            </div>
            <div className="text-cyan-600 text-xs font-mono mt-1">
               CPU: {Math.floor(Math.random() * 20 + 30)}% <br/>
               MEM: 64TB / 128TB
            </div>
          </div>
          
          {/* Hex Stream */}
          <div className="font-mono text-[10px] text-cyan-800/80 leading-none mt-4 opacity-50">
            {hexStream.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        {/* Right Title */}
        <div className="text-right">
          <h1 className="text-6xl font-black text-cyan-400 tracking-tighter glow-text font-sans opacity-90">
            J.A.R.V.I.S.
          </h1>
          <div className="text-2xl font-mono text-cyan-200 mt-[-10px]">{time}</div>
          <div className="h-1 w-full bg-cyan-900 mt-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-cyan-400 animate-slide-right"></div>
          </div>
        </div>
      </div>

      {/* Floating Panel (Right Hand Target) */}
      <div 
        ref={panelRef}
        className="absolute w-80 bg-black/60 border border-cyan-500/50 backdrop-blur-md text-cyan-100 p-4 rounded-br-2xl shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-colors duration-200"
        style={{ transform: `translate3d(${window.innerWidth - 420}px, 100px, 0)` }}
      >
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2">
          <span className="flex items-center gap-2 font-bold text-cyan-300">
            <Globe size={16} /> 地理情报分析
          </span>
          <Activity size={16} className="text-red-400 animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-cyan-600">目标区域</span>
            <span className="font-mono text-white bg-cyan-900/50 px-2 rounded">{activeContinent}</span>
          </div>
          
          <div className="h-24 bg-cyan-950/30 border border-cyan-800/30 relative overflow-hidden p-2">
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, .3) 25%, rgba(0, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .3) 75%, rgba(0, 255, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, .3) 25%, rgba(0, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .3) 75%, rgba(0, 255, 255, .3) 76%, transparent 77%, transparent)',
                    backgroundSize: '30px 30px'
                  }}>
             </div>
             <div className="font-mono text-[10px] text-cyan-400">
               > SCANNING TERRAIN...<br/>
               > ATMOSPHERE: STABLE<br/>
               > POPULATION: DENSE<br/>
               > THREAT LEVEL: LOW
             </div>
          </div>

          <div className="flex gap-2">
             <button className="flex-1 bg-cyan-900/40 hover:bg-cyan-400/20 border border-cyan-600/50 py-1 text-xs text-cyan-300">
                放大视图
             </button>
             <button className="flex-1 bg-cyan-900/40 hover:bg-cyan-400/20 border border-cyan-600/50 py-1 text-xs text-cyan-300">
                深度扫描
             </button>
          </div>
        </div>

        {/* Decorators */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-400"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-400"></div>
      </div>

      {/* Footer / Hand Status */}
      <div className="flex justify-between items-end">
        <div className="flex gap-4">
           <div className="flex items-center gap-2 text-cyan-600 text-sm font-mono">
             <Cpu size={14} />
             <span>LH: ROTATION/SCALE</span>
           </div>
           <div className="flex items-center gap-2 text-cyan-600 text-sm font-mono">
             <Radio size={14} />
             <span>RH: DRAG PANEL</span>
           </div>
        </div>
        
        <div className="flex items-center gap-2 text-cyan-800 text-xs font-mono">
           <Crosshair size={12} className="animate-spin-slow" />
           PROTOCOL V2.4.0 ACTIVE
        </div>
      </div>

    </div>
  );
};
