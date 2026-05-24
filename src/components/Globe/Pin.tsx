import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Html } from '@react-three/drei';

interface PinProps {
  lat: number;
  lng: number;
  color: string;
  label?: string;
  /** 0-1 scale for animated entrance (defaults to 1 = fully visible) */
  scale?: number;
}

/** Color → emissive intensity mapping for pin glow */
const EMISSIVE_MAP: Record<string, number> = {
  blue: 0.4,
  orange: 0.5,
  red: 0.4,
  green: 0.5,
};

export function Pin({ lat, lng, color, label, scale: pinScale = 1 }: PinProps) {
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
  const emissiveIntensity = EMISSIVE_MAP[color] ?? 0.3;

  // Orient the pin to face away from center
  useFrame(() => {
    if (ref.current) {
      ref.current.lookAt(0, 0, 0);
    }
  });

  // Don't render if scale is effectively zero
  if (pinScale < 0.01) return null;

  return (
    <group position={position} scale={pinScale}>
      <group ref={ref} rotation={[0, 0, 0]}>
         {/* The pin visual. We rotate it so it points "down" to the surface. 
             Since we lookAt(0,0,0), the Z axis points to center. 
             We want the pin to point along Z. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
          <coneGeometry args={[0.02, 0.1, 16]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>

        {/* Localized glow on globe surface */}
        <pointLight 
          position={[0, 0, 0.02]} 
          intensity={0.15} 
          distance={0.3} 
          color={color} 
        />

        {label && (
          <Html position={[0, 0.15, 0]} center zIndexRange={[0, 0]}>
            <div style={{ 
              background: 'rgba(0,0,0,0.75)', 
              backdropFilter: 'blur(8px)',
              color: 'white', 
              padding: '4px 10px', 
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 0,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              letterSpacing: '0.01em'
            }}>
              {label}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
