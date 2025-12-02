import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader, useThree, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { TrackingState, Continent, PlanetConfig } from '../types';

// Extend JSX.IntrinsicElements to include Three.js elements used by React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface HolographicPlanetProps {
  trackingRef: React.MutableRefObject<TrackingState>;
  onContinentChange: (continent: Continent) => void;
  planet: PlanetConfig;
}

export const HolographicEarth: React.FC<HolographicPlanetProps> = ({ trackingRef, onContinentChange, planet }) => {
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

  // Load texture dynamically based on planet prop
  const texture = useLoader(THREE.TextureLoader, planet.texture);

  // Re-create materials when planet changes to update colors
  const earthMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      color: new THREE.Color(planet.color)
    });
  }, [texture, planet.color]);

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(planet.color),
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
  }, [planet.color]);

  const ringMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(planet.color),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
  }, [planet.color]);

  useFrame((state, delta) => {
    if (!meshRef.current || !cloudRef.current || !ringRef.current || !groupRef.current) return;

    // Base rotation
    const baseSpeed = 0.1 * delta;
    let targetRotationSpeed = baseSpeed;
    let targetScale = currentScaleRef.current;
    const targetPosition = currentPositionRef.current.clone();

    const { leftHand } = trackingRef.current;

    // --- INTERACTION LOGIC (Left Hand) ---
    if (leftHand) {
      const landmarks = leftHand.landmarks;
      const palmX = landmarks[9].x; 
      const palmY = landmarks[9].y;

      const thumb = landmarks[4];
      const index = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );
      
      // Threshold 0.04
      const PINCH_THRESHOLD = 0.04; 
      const isPinching = distance < PINCH_THRESHOLD;

      if (isPinching) {
        // --- DRAG MODE ---
        const visualX = (1 - palmX) * viewport.width - (viewport.width / 2);
        const visualY = -(palmY * viewport.height - (viewport.height / 2)); 

        targetPosition.set(visualX, visualY, 0);
        targetRotationSpeed = baseSpeed * 0.5;

      } else {
        // --- INSPECT MODE ---
        const rotationInput = (palmX - 0.5) * -8.0 * delta; 
        targetRotationSpeed += rotationInput;

        let desiredScale = distance * 13.0; 
        desiredScale = Math.max(0.3, Math.min(desiredScale, 6.0));
        targetScale = desiredScale;
      }
    } else {
       // Idle breathing animation
       targetScale = 2.2 + Math.sin(state.clock.elapsedTime) * 0.05;
    }

    // Apply Smoothing (Lerp)
    currentRotationSpeedRef.current = THREE.MathUtils.lerp(currentRotationSpeedRef.current, targetRotationSpeed, 0.1);
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, 0.1); 
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

    // --- SIMPLE REGION CALCULATION ---
    // For Mars/Moon we just keep the math simple for now, 
    // or we could map craters if we had specific lat/lon data.
    // Keeping the original "Continent" logic for Earth, defaulting to sectors for others.
    if (planet.id === 'earth') {
      const rotationY = meshRef.current.rotation.y % (Math.PI * 2);
      const normalizedRot = rotationY < 0 ? rotationY + Math.PI * 2 : rotationY;
      const deg = THREE.MathUtils.radToDeg(normalizedRot);
      
      let currentContinent = Continent.UNKNOWN;
      if (deg < 60 || deg > 330) currentContinent = Continent.AFRICA_EUROPE;
      else if (deg >= 60 && deg < 160) currentContinent = Continent.AMERICAS;
      else if (deg >= 160 && deg < 250) currentContinent = Continent.PACIFIC;
      else currentContinent = Continent.ASIA;
      onContinentChange(currentContinent);
    } else {
       onContinentChange(Continent.UNKNOWN);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core Planet */}
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
        <primitive object={ringMaterial} attach="material" />
      </mesh>
      
      {/* Dynamic Lights */}
      <ambientLight intensity={1.0} color={planet.color} />
      <pointLight position={[10, 10, 10]} intensity={2} color={planet.color} />
    </group>
  );
};