import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TrackingState, Continent } from '../types';

interface HolographicEarthProps {
  trackingRef: React.MutableRefObject<TrackingState>;
  onContinentChange: (continent: Continent) => void;
}

// Earth textures
const EARTH_MAP = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

export const HolographicEarth: React.FC<HolographicEarthProps> = ({ trackingRef, onContinentChange }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Viewport details for coordinate mapping
  const { viewport } = useThree();

  // State for smoothing values
  const currentScaleRef = useRef(2.2);
  const currentRotationSpeedRef = useRef(0);
  const currentPositionRef = useRef(new THREE.Vector3(-2.2, -0.2, 0)); // Initial position

  const earthTexture = useLoader(THREE.TextureLoader, EARTH_MAP);

  // Holographic Material Shader
  const earthMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: earthTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      color: new THREE.Color(0x00FFFF)
    });
  }, [earthTexture]);

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x0088aa,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !cloudRef.current || !ringRef.current || !groupRef.current) return;

    // Base rotation
    const baseSpeed = 0.1 * delta;
    let targetRotationSpeed = baseSpeed;
    let targetScale = currentScaleRef.current; // Maintain current scale by default
    const targetPosition = currentPositionRef.current.clone();

    const { leftHand } = trackingRef.current;

    // --- INTERACTION LOGIC (Left Hand) ---
    if (leftHand) {
      const landmarks = leftHand.landmarks;
      const palmX = landmarks[9].x; 
      const palmY = landmarks[9].y;

      // Distance for pinch detection (Thumb tip 4 vs Index tip 8)
      const thumb = landmarks[4];
      const index = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      // Threshold for switching between Drag (Pinch) and Scale/Rotate (Open)
      // Lowered to 0.04 to allow "close fingers" to register as small scale before turning into a drag
      const PINCH_THRESHOLD = 0.04; 
      const isPinching = distance < PINCH_THRESHOLD;

      if (isPinching) {
        // --- DRAG MODE (Move Position) ---
        // Map 0..1 (MediaPipe) to Viewport Coordinates
        
        const visualX = (1 - palmX) * viewport.width - (viewport.width / 2);
        const visualY = -(palmY * viewport.height - (viewport.height / 2)); // Y is inverted in 3D

        // Smooth follow
        targetPosition.set(visualX, visualY, 0);
        
        // While dragging, keep rotation steady or slow down
        targetRotationSpeed = baseSpeed * 0.5;

      } else {
        // --- INSPECT MODE (Rotate & Scale) ---
        
        // 1. Rotation (Horizontal movement of open hand)
        // Center point is 0.5. Left < 0.5, Right > 0.5
        const rotationInput = (palmX - 0.5) * -8.0 * delta; 
        targetRotationSpeed += rotationInput;

        // 2. Scale (Distance between fingers)
        // Formula optimized to allow very small scales
        // dist 0.04 (threshold) -> scale ~0.3 (Very Small)
        // dist 0.2  (normal)    -> scale ~2.5
        // dist 0.4  (wide)      -> scale ~5.0
        let desiredScale = distance * 13.0; 
        
        // Clamp: Min 0.3 (Tiny), Max 6.0 (Huge)
        desiredScale = Math.max(0.3, Math.min(desiredScale, 6.0));
        
        targetScale = desiredScale;
      }
    } else {
       // Idle breathing animation
       targetScale = 2.2 + Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Apply Smoothing (Lerp)
    currentRotationSpeedRef.current = THREE.MathUtils.lerp(currentRotationSpeedRef.current, targetRotationSpeed, 0.1);
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, 0.1); // Increased responsiveness for scale
    currentPositionRef.current.lerp(targetPosition, 0.1);

    // Update Transform
    groupRef.current.position.copy(currentPositionRef.current);
    
    meshRef.current.rotation.y += currentRotationSpeedRef.current;
    meshRef.current.scale.setScalar(currentScaleRef.current);

    // Sync decorative layers
    cloudRef.current.rotation.y += currentRotationSpeedRef.current * 1.1;
    cloudRef.current.scale.copy(meshRef.current.scale).multiplyScalar(1.02);
    
    ringRef.current.rotation.z -= 0.002;
    ringRef.current.scale.copy(meshRef.current.scale).multiplyScalar(1.4);

    // --- CONTINENT CALCULATION ---
    const rotationY = meshRef.current.rotation.y % (Math.PI * 2);
    const normalizedRot = rotationY < 0 ? rotationY + Math.PI * 2 : rotationY;
    const deg = THREE.MathUtils.radToDeg(normalizedRot);
    
    let currentContinent = Continent.UNKNOWN;
    if (deg < 60 || deg > 330) currentContinent = Continent.AFRICA_EUROPE;
    else if (deg >= 60 && deg < 160) currentContinent = Continent.AMERICAS;
    else if (deg >= 160 && deg < 250) currentContinent = Continent.PACIFIC;
    else currentContinent = Continent.ASIA;

    onContinentChange(currentContinent);
  });

  return (
    <group ref={groupRef}>
      {/* Core Earth */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>

      {/* Wireframe Overlay */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={wireframeMaterial} attach="material" />
      </mesh>

      {/* Decorative Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <meshBasicMaterial color={0x00FFFF} transparent opacity={0.5} />
      </mesh>
      
      {/* Ambient Light */}
      <ambientLight intensity={1.5} color={0x00FFFF} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ccffff" />
    </group>
  );
};