import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { latLngToVector } from '../../utils/math';

export function CameraController() {
  const { camera, controls } = useThree();
  const { round, referenceCities, gameState } = useGameStore();

  useEffect(() => {
    if (gameState === 'start' || gameState === 'playing') {
        const currentReference = referenceCities[round - 1];
        if (currentReference) {
            // Check for mobile (simple width check)
            const isMobile = window.innerWidth < 768;
            const distance = isMobile ? 3.5 : 2.5;

            // Calculate position: unit vector * distance
            const position = latLngToVector(currentReference.lat, currentReference.lng, distance);
            
            // Move camera
            camera.position.copy(position);
            camera.lookAt(0, 0, 0);
            
            // Update controls if they exist
            // @ts-ignore
            if (controls) {
                // @ts-ignore
                controls.update();
            }
        }
    }
  }, [round, referenceCities, gameState, camera, controls]);

  return null;
}
