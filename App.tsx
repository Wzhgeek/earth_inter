import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { VisionService } from './services/visionService';
import { HandLandmarker } from '@mediapipe/tasks-vision';
import { HolographicEarth } from './components/HolographicEarth';
import { CyberHUD } from './components/CyberHUD';
import { TrackingState, Continent, HandData, PLANETS, PlanetConfig } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeContinent, setActiveContinent] = useState<Continent>(Continent.UNKNOWN);
  const [activePlanet, setActivePlanet] = useState<PlanetConfig>(PLANETS[0]);

  // Mutable Ref to store latest tracking data (accessed by R3F loop and HUD loop)
  const trackingRef = useRef<TrackingState>({
    leftHand: null,
    rightHand: null
  });

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }

        handLandmarker = await VisionService.initialize();
        setIsLoading(false);
        
        predict();
      } catch (err) {
        console.error(err);
        setError("Camera access denied or initialization failed.");
        setIsLoading(false);
      }
    };

    const predict = async () => {
      if (!handLandmarker || !videoRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(predict);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.readyState < 2 || !ctx) {
        animationFrameId = requestAnimationFrame(predict);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(video, startTimeMs);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let newLeftHand: HandData | null = null;
      let newRightHand: HandData | null = null;

      if (results.landmarks) {
        for (let i = 0; i < results.landmarks.length; i++) {
          const landmarks = results.landmarks[i];
          const handedness = results.handedness[i][0].categoryName;
          
          drawConnectors(ctx, landmarks, activePlanet.color); // Use planet color for skeleton

          const handData: HandData = {
            landmarks,
            handedness: handedness as 'Left' | 'Right'
          };

          if (handedness === 'Left') newLeftHand = handData;
          else newRightHand = handData;
        }
      }

      trackingRef.current = {
        leftHand: newLeftHand,
        rightHand: newRightHand
      };

      animationFrameId = requestAnimationFrame(predict);
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [activePlanet]); // Re-bind effect if planet color changes usually not needed for canvas draw but ensures color update

  const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: any[], color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillStyle = '#FFFFFF';

    const connections = [
      [0,1], [1,2], [2,3], [3,4], 
      [0,5], [5,6], [6,7], [7,8], 
      [5,9], [9,10], [10,11], [11,12], 
      [9,13], [13,14], [14,15], [15,16], 
      [13,17], [17,18], [18,19], [19,20], 
      [0,17] 
    ];

    ctx.beginPath();
    connections.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
      ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    });
    ctx.stroke();

    for (const lm of landmarks) {
       ctx.beginPath();
       ctx.arc(lm.x * ctx.canvas.width, lm.y * ctx.canvas.height, 3, 0, 2 * Math.PI);
       ctx.fill();
    }
    
    ctx.shadowBlur = 0;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Background Layer: Webcam */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale contrast-125 brightness-75 transform -scale-x-100"
        autoPlay
        playsInline
        muted
      />

      {/* 2D Canvas Layer: Hand Skeleton Overlay */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none opacity-80"
      />

      {/* Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none scanline-overlay z-0"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,20,30,0.8)_100%)] z-0"></div>

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
          <HolographicEarth 
            trackingRef={trackingRef} 
            onContinentChange={setActiveContinent}
            planet={activePlanet}
            key={activePlanet.id} // Forces re-mount on planet change to ensure texture load
          />
        </Canvas>
      </div>

      {/* UI Layer */}
      <CyberHUD 
        trackingRef={trackingRef} 
        activeContinent={activeContinent}
        activePlanet={activePlanet}
        onSelectPlanet={setActivePlanet}
      />

      {/* Loading / Error States */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-cyan-500">
          <Loader2 className="w-16 h-16 animate-spin mb-4" />
          <h2 className="text-2xl font-mono tracking-widest animate-pulse">INITIALIZING J.A.R.V.I.S...</h2>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-red-500 font-mono">
          <div className="border border-red-500 p-8 rounded bg-red-950/20">
            <h2 className="text-3xl mb-2">SYSTEM FAILURE</h2>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;