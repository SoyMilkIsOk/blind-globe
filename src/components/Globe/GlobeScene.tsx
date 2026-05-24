import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { GameGlobe } from './GameGlobe';
import { Suspense } from 'react';

import { CameraController } from './CameraController';
import { useGameStore } from '../../store/gameStore';

/** Atmospheric glow shell around the globe */
function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[1.06, 64, 64]} />
      <meshBasicMaterial 
        color="#4a90d9" 
        transparent 
        opacity={0.07} 
        depthWrite={false}
      />
    </mesh>
  );
}

export function GlobeScene() {
  const gameState = useGameStore(state => state.gameState);
  // Bright lighting for Start (Real Map) and Revealed/Finished
  const isBright = gameState === 'start' || gameState === 'revealed' || gameState === 'finished';
  
  // Initial position check
  const isMobile = window.innerWidth < 768;
  const initialZ = isMobile ? 3.5 : 2.5;

  return (
    <div style={{ width: '100%', height: '100vh', background: '#080810' }}>
      <Canvas camera={{ position: [0, 0, initialZ], fov: 45 }}>
        <Suspense fallback={null}>
          {/* Ambient fill */}
          <ambientLight intensity={isBright ? 1.4 : 0.5} />
          
          {/* Primary key light */}
          <pointLight position={[10, 10, 10]} intensity={isBright ? 1.5 : 0.8} />
          
          {/* Hemisphere light for natural fill (sky blue top, dark bottom) */}
          <hemisphereLight 
            args={['#b1d8ff', '#1a1a2e', isBright ? 0.6 : 0.3]} 
          />
          
          {/* Directional light for bright states */}
          {isBright && <directionalLight position={[5, 3, 5]} intensity={1.5} />}
          
          {/* Rim light — backlighting for 3D depth pop */}
          <pointLight 
            position={[-8, -2, -8]} 
            intensity={isBright ? 0.8 : 0.4} 
            color="#6366f1" 
          />
          
          {/* Subtle top accent light */}
          <pointLight 
            position={[0, 8, 2]} 
            intensity={0.3} 
            color="#93c5fd" 
          />
          
          <Stars 
            radius={100} 
            depth={50} 
            count={6000} 
            factor={4} 
            saturation={0.1} 
            fade 
            speed={0.8} 
          />
          
          <AtmosphereGlow />
          <GameGlobe />
          <CameraController />
          
          <OrbitControls 
            makeDefault
            enablePan={false} 
            minDistance={1.5} 
            maxDistance={4} 
            rotateSpeed={0.5}
            target={isMobile ? [0, .5, 0] : [0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
