import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';

interface PinProps {
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

export function Pin({ lat, lng, color, label }: PinProps) {
  const ref = useRef<Group>(null);

  // Convert Lat/Lng to 3D position on sphere (radius 1)
  // Three.js uses a different coordinate system, so we need to adjust.
  // Phi = 90 - lat, Theta = lng + 180 (usually)
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(Math.sin(phi) * Math.cos(theta));
  const z = Math.sin(phi) * Math.sin(theta);
  const y = Math.cos(phi);
  
  const position = new Vector3(x, y, z);

  // Orient the pin to face away from center
  useFrame(() => {
    if (ref.current) {
      ref.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group position={position}>
      <group ref={ref} rotation={[0, 0, 0]}>
         {/* The pin visual. We rotate it so it points "down" to the surface. 
             Since we lookAt(0,0,0), the Z axis points to center. 
             We want the pin to point along Z. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
          <coneGeometry args={[0.02, 0.1, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {label && (
          <Html position={[0, 0.15, 0]} center zIndexRange={[0, 0]}>
            <div style={{ 
              background: 'rgba(0,0,0,0.7)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 0
            }}>
              {label}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
