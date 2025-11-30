import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { GameGlobe } from './GameGlobe';
import { Suspense } from 'react';

import { CameraController } from './CameraController';
import { useGameStore } from '../../store/gameStore';

export function GlobeScene() {
  const gameState = useGameStore(state => state.gameState);
  // Bright lighting for Start (Real Map) and Revealed/Finished
  const isBright = gameState === 'start' || gameState === 'revealed' || gameState === 'finished';
  
  // Initial position check
  const isMobile = window.innerWidth < 768;
  const initialZ = isMobile ? 3.5 : 2.5;

  return (
    <div style={{ width: '100%', height: '100vh', background: '#111' }}>
      <Canvas camera={{ position: [0, 0, initialZ], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={isBright ? 1.5 : 0.6} />
          <pointLight position={[10, 10, 10]} intensity={isBright ? 1.5 : 0.8} />
          {isBright && <directionalLight position={[5, 3, 5]} intensity={1.5} />}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
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
