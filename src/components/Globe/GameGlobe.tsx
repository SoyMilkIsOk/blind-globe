import { useRef, useMemo, useEffect, useState } from 'react';
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

/** Duration of the reveal animation in seconds */
const REVEAL_DURATION = 1.0;
/** Delay before the line starts drawing (target pin appears first) */
const LINE_DELAY = 0.3;
/** Total time before the result card appears */
const CARD_DELAY_MS = 1200;

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

  // ── Reveal Animation State ──
  const revealProgress = useRef(0);
  const revealStartTime = useRef<number | null>(null);
  const [targetPinScale, setTargetPinScale] = useState(0);
  const [lineProgress, setLineProgress] = useState(0);
  const [revealReady, setRevealReady] = useState(false);

  // Reset reveal state when entering revealed or leaving it
  useEffect(() => {
    if (gameState === 'revealed') {
      revealProgress.current = 0;
      revealStartTime.current = null;
      setTargetPinScale(0);
      setLineProgress(0);
      setRevealReady(false);

      // Signal to GameUI that the card can appear after the animation
      const timer = setTimeout(() => setRevealReady(true), CARD_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      // Reset when not revealed
      revealProgress.current = 0;
      revealStartTime.current = null;
      setTargetPinScale(1);
      setLineProgress(1);
      setRevealReady(false);
    }
  }, [gameState]);

  // Expose revealReady to the store-less GameUI via a DOM attribute
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.dataset.revealReady = String(revealReady);
    }
  }, [revealReady]);

  // Camera Animation State
  const targetCameraPos = useRef<Vector3 | null>(null);

  // Trigger camera animation when revealed
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
    // Camera interpolation
    if (targetCameraPos.current) {
        state.camera.position.lerp(targetCameraPos.current, 2 * delta);
        state.camera.lookAt(0, 0, 0);
        
        if (state.camera.position.distanceTo(targetCameraPos.current) < 0.05) {
            targetCameraPos.current = null;
        }
    }

    // Reveal animation
    if (gameState === 'revealed') {
      if (revealStartTime.current === null) {
        revealStartTime.current = state.clock.elapsedTime;
      }
      
      const elapsed = state.clock.elapsedTime - revealStartTime.current;
      
      // Phase 1: Target pin scales up (0 → LINE_DELAY)
      const pinT = Math.min(1, elapsed / LINE_DELAY);
      const easedPin = 1 - Math.pow(1 - pinT, 3); // ease-out cubic
      setTargetPinScale(easedPin);
      
      // Phase 2: Line draws (LINE_DELAY → REVEAL_DURATION)
      if (elapsed > LINE_DELAY) {
        const lineT = Math.min(1, (elapsed - LINE_DELAY) / (REVEAL_DURATION - LINE_DELAY));
        const easedLine = 1 - Math.pow(1 - lineT, 2); // ease-out quad
        setLineProgress(easedLine);
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

  // Calculate ALL line points (we'll slice based on progress)
  const allLinePoints = useMemo(() => {
    if (!guess || !currentTarget) return [];
    const start = latLngToVector(guess.lat, guess.lng);
    const end = latLngToVector(currentTarget.lat, currentTarget.lng);
    
    const points: Vector3[] = [];
    const segments = 40; // More segments for smoother animation
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const v = start.clone().lerp(end, t).normalize().multiplyScalar(1.02);
      points.push(v);
    }
    return points;
  }, [guess, currentTarget]);

  // Sliced line points based on reveal progress
  const visibleLinePoints = useMemo(() => {
    if (allLinePoints.length === 0) return [];
    if (gameState === 'finished') return allLinePoints;
    const count = Math.max(2, Math.ceil(allLinePoints.length * lineProgress));
    return allLinePoints.slice(0, count);
  }, [allLinePoints, lineProgress, gameState]);

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
    return lines;
  }, []);

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

      {/* Target Pin — animated scale-up on reveal */}
      {isRevealed && currentTarget && showPins && (
        <Pin 
          lat={currentTarget.lat} 
          lng={currentTarget.lng} 
          color="green" 
          label={`${currentTarget.name}, ${currentTarget.country}`}
          scale={isFinished ? 1 : targetPinScale}
        />
      )}

      {/* Connection Line — animated draw on reveal */}
      {isRevealed && visibleLinePoints.length >= 2 && showPins && lineProgress > 0 && (
        <Line 
            points={visibleLinePoints} 
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
