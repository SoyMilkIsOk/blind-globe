import { useRef, useMemo, useEffect } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import { TextureLoader, Vector3 } from 'three';
import { useLoader } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Pin } from './Pin';
import countriesData from '../../data/world-countries.json';
import { latLngToVector } from '../../utils/math';

// Better texture URL (Three.js example texture, reliable)
const REAL_MAP_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';

export function GameGlobe() {
  const { 
    gameState, 
    targetCities, 
    referenceCities, 
    round, 
    guess, 
    tempGuess,
    setTempGuess,
    hintLevel
  } = useGameStore();

  const globeRef = useRef<any>(null);
  
  const realMap = useLoader(TextureLoader, REAL_MAP_URL);

  const currentReference = referenceCities[round - 1];
  const currentTarget = targetCities[round - 1];

  // Camera Animation State
  const targetCameraPos = useRef<Vector3 | null>(null);

  // Trigger animation when revealed
  useEffect(() => {
    if (gameState === 'revealed' && currentTarget && guess) {
        const start = latLngToVector(guess.lat, guess.lng);
        const end = latLngToVector(currentTarget.lat, currentTarget.lng);
        
        // Calculate midpoint
        const mid = start.clone().add(end).normalize();
        
        // Calculate distance between points on sphere to adjust zoom
        const dist = start.distanceTo(end);
        
        // Adjust zoom based on distance (closer if points are close, further if far)
        // Base radius 2.0, add some factor of distance
        const zoomRadius = 2.0 + (dist * 0.8);
        
        targetCameraPos.current = mid.multiplyScalar(zoomRadius);
    } else {
        targetCameraPos.current = null;
    }
  }, [gameState, currentTarget, guess]);

  useFrame((state, delta) => {
    if (targetCameraPos.current) {
        // Smoothly interpolate camera position
        state.camera.position.lerp(targetCameraPos.current, 2 * delta);
        state.camera.lookAt(0, 0, 0);
        
        // Stop animating if close enough
        if (state.camera.position.distanceTo(targetCameraPos.current) < 0.05) {
            targetCameraPos.current = null;
        }
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (gameState !== 'playing') return;
    
    e.stopPropagation();

    const point = e.point;
    point.normalize();

    const phi = Math.acos(point.y);
    const theta = Math.atan2(point.z, -point.x);
    
    const lat = 90 - (phi * 180 / Math.PI);
    const lng = (theta * 180 / Math.PI) - 180;

    const normalizedLng = ((lng + 540) % 360) - 180;

    setTempGuess(lat, normalizedLng);
  };

  const isRevealed = gameState === 'revealed' || gameState === 'finished';
  const isStart = gameState === 'start';
  const isFinished = gameState === 'finished';
  const showRealMap = isRevealed || isStart;
  
  // Hide pins if finished or start
  const showPins = !isStart && !isFinished;

  // Calculate line points if revealed
  let linePoints: Vector3[] = [];
  if (isRevealed && guess && currentTarget) {
    const start = latLngToVector(guess.lat, guess.lng);
    const end = latLngToVector(currentTarget.lat, currentTarget.lng);
    
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const v = start.clone().lerp(end, t).normalize().multiplyScalar(1.02);
        linePoints.push(v);
    }
  }

  // Process Country Outlines
  const countryLines = useMemo(() => {
    const lines: Vector3[][] = [];
    
    // Safety check for data
    if (!(countriesData as any).features) {
        console.error("No features found in countriesData");
        return lines;
    }

    (countriesData as any).features.forEach((feature: any) => {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
            geometry.coordinates.forEach((ring: any[]) => {
                const points = ring.map(([lng, lat]) => latLngToVector(lat, lng, 1.005)); // Increased radius slightly
                lines.push(points);
            });
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach((polygon: any[]) => {
                polygon.forEach((ring: any[]) => {
                    const points = ring.map(([lng, lat]) => latLngToVector(lat, lng, 1.005));
                    lines.push(points);
                });
            });
        }
    });
    console.log(`Generated ${lines.length} country border lines`);
    return lines;
  }, []);

  console.log("GameGlobe Render:", { hintLevel, showRealMap, linesCount: countryLines.length });

  return (
    <group>
      {/* The Globe Sphere */}
      <Sphere 
        ref={globeRef} 
        args={[1, 64, 64]} 
        onPointerDown={handlePointerDown}
        rotation={[0, 0, 0]}
      >
        {showRealMap ? (
          <meshStandardMaterial map={realMap} roughness={0.5} metalness={0.1} />
        ) : (
          <>
            <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
          </>
        )}
      </Sphere>

      {/* Grid Lines (Only when not revealed and not start AND hint level < 2) */}
      {!showRealMap && hintLevel < 2 && (
        <group>
           {/* Longitude lines */}
           {Array.from({ length: 12 }).map((_, i) => (
             <Line
               key={`long-${i}`}
               points={createCirclePoints(1.001, 'y', i * 30)}
               color="#cccccc"
               lineWidth={1}
               transparent
               opacity={0.3}
             />
           ))}
           {/* Latitude lines */}
           {Array.from({ length: 11 }).map((_, i) => (
             <Line
               key={`lat-${i}`}
               points={createCirclePoints(1.001, 'x', 0, (i - 5) * 15)}
               color="#cccccc"
               lineWidth={1}
               transparent
               opacity={0.3}
             />
           ))}
        </group>
      )}

      {/* Country Outlines (Only when hint level >= 2 and not revealed/start) */}
      {!showRealMap && hintLevel >= 2 && (
        <group>
            {countryLines.map((points, i) => (
                <Line
                    key={`country-${i}`}
                    points={points}
                    color="#333333" 
                    lineWidth={1}
                    transparent
                    opacity={0.8}
                />
            ))}
        </group>
      )}

      {/* Reference Pin (Hidden on start and finished) */}
      {showPins && currentReference && (
        <Pin 
          lat={currentReference.lat} 
          lng={currentReference.lng} 
          color="blue" 
          label={hintLevel >= 1 || isRevealed ? `${currentReference.name}, ${currentReference.country}` : currentReference.name} 
        />
      )}

      {/* Temp Guess Pin (Orange, pulsing?) */}
      {tempGuess && !isRevealed && showPins && (
        <Pin 
          lat={tempGuess.lat} 
          lng={tempGuess.lng} 
          color="orange" 
          label="Confirm?"
        />
      )}

      {/* Final Guess Pin */}
      {guess && isRevealed && showPins && (
        <Pin 
          lat={guess.lat} 
          lng={guess.lng} 
          color="red" 
          label="Your Guess"
        />
      )}

      {/* Target Pin */}
      {isRevealed && currentTarget && showPins && (
        <Pin 
          lat={currentTarget.lat} 
          lng={currentTarget.lng} 
          color="green" 
          label={`${currentTarget.name}, ${currentTarget.country}`}
        />
      )}

      {/* Connection Line */}
      {isRevealed && linePoints.length > 0 && showPins && (
        <Line 
            points={linePoints} 
            color="yellow" 
            lineWidth={3} 
        />
      )}
    </group>
  );
}



// Helper to create circle points for grid
function createCirclePoints(radius: number, axis: 'x' | 'y', rotationDeg: number, latOffsetDeg: number = 0): Vector3[] {
    const points: Vector3[] = [];
    const segments = 64;
    
    // If drawing latitude lines (axis 'x' roughly), we need to handle the offset (latitude)
    // If drawing longitude (axis 'y'), we rotate around Y.
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        let x = 0, y = 0, z = 0;

        if (axis === 'y') {
            // Longitude: Circle through poles, rotated by rotationDeg
            // Standard circle in XZ plane, rotated 90 deg to stand up? 
            // Actually, longitude lines are great circles passing through poles.
            // A circle in YZ plane rotated around Y.
            x = radius * Math.sin(theta);
            y = radius * Math.cos(theta);
            z = 0;
            
            // Rotate around Y
            const rot = rotationDeg * Math.PI / 180;
            const x_new = x * Math.cos(rot) - z * Math.sin(rot);
            const z_new = x * Math.sin(rot) + z * Math.cos(rot);
            x = x_new;
            z = z_new;
        } else {
            // Latitude: Circle parallel to equator (XZ plane), at y offset
            const latRad = latOffsetDeg * Math.PI / 180;
            const r = radius * Math.cos(latRad);
            const y_off = radius * Math.sin(latRad);
            
            x = r * Math.sin(theta);
            z = r * Math.cos(theta);
            y = y_off;
        }
        
        points.push(new Vector3(x, y, z));
    }
    return points;
}
