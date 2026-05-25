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

/** Phase 1: Move camera to guess location */
const PHASE1_DURATION = 0.6;
/** Phase 2: Follow line from guess to real answer */
const PHASE2_DURATION = 1.5;
/** Phase 3: Zoom out to reveal both pins */
const PHASE3_DURATION = 0.6;
/** Total animation time */
const TOTAL_ANIM_DURATION = PHASE1_DURATION + PHASE2_DURATION + PHASE3_DURATION;
const CARD_DELAY_MS = (TOTAL_ANIM_DURATION + 0.15) * 1000;

// ── Pre-allocated Vector3s to avoid GC pressure in the render loop ──
const _camPos = new Vector3();
const _lookAt = new Vector3();

// Throttle threshold — only trigger React re-render when value changes by this much
const STATE_THRESHOLD = 0.015;

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
  const revealStartTime = useRef<number | null>(null);
  const [targetPinScale, setTargetPinScale] = useState(0);
  const [lineProgress, setLineProgress] = useState(0);
  const [revealReady, setRevealReady] = useState(false);

  // Track last emitted state values to throttle re-renders
  const lastEmittedPinScale = useRef(0);
  const lastEmittedLineProgress = useRef(0);

  // Captured initial camera position when reveal starts
  const initialCameraPos = useRef<Vector3 | null>(null);

  // Pre-computed camera targets for each phase
  const cameraTargets = useRef<{
    guessPos: Vector3;
    targetPos: Vector3;
    revealPos: Vector3;
    lookAtOffset: Vector3;
  } | null>(null);

  // Reset reveal state when entering revealed or leaving it
  useEffect(() => {
    if (gameState === 'revealed') {
      revealStartTime.current = null;
      initialCameraPos.current = null;
      setTargetPinScale(0);
      setLineProgress(0);
      lastEmittedPinScale.current = 0;
      lastEmittedLineProgress.current = 0;
      setRevealReady(false);

      // Pre-compute camera positions
      if (guess && currentTarget) {
        const isMobile = window.innerWidth < 768;
        const closeZoom = isMobile ? 2.2 : 1.8;

        const guessVec = latLngToVector(guess.lat, guess.lng);
        const targetVec = latLngToVector(currentTarget.lat, currentTarget.lng);

        // Phase 1 end: Camera close to guess pin
        const guessPos = guessVec.clone().multiplyScalar(closeZoom);

        // Phase 2 end: Camera close to real answer pin
        const targetPos = targetVec.clone().multiplyScalar(closeZoom);

        // Phase 3 end: Zoom out to fit BOTH pins on screen
        const mid = guessVec.clone().add(targetVec).normalize();
        const dist = guessVec.distanceTo(targetVec);

        // FOV-based zoom calculation
        const halfFovRad = (45 / 2) * Math.PI / 180;
        const halfChord = dist / 2;
        // Margin: fraction of the FOV used for pins (rest is padding/labels/offset)
        const margin = isMobile ? 0.35 : 0.50;
        const minZoom = halfChord / (Math.tan(halfFovRad) * margin);
        // Extra zoom boost for portrait displays
        const aspect = window.innerWidth / window.innerHeight;
        const portraitBoost = aspect < 1 ? 1.3 : 1;
        const revealZoom = Math.max(closeZoom + 0.3, minZoom * portraitBoost);
        // No hard clamp — let it go as far as needed
        const clampedZoom = Math.min(revealZoom, 7.0);
        const revealPos = mid.clone().multiplyScalar(clampedZoom);

        // LookAt offset to push globe content above the round result card
        const offsetAmount = isMobile ? 0.45 : 0.22;
        const lookAtOffset = new Vector3(0, -offsetAmount, 0);

        cameraTargets.current = { guessPos, targetPos, revealPos, lookAtOffset };
      }

      // Signal to GameUI that the card can appear after the animation
      const timer = setTimeout(() => setRevealReady(true), CARD_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      // Reset when not revealed
      revealStartTime.current = null;
      initialCameraPos.current = null;
      setTargetPinScale(1);
      setLineProgress(1);
      lastEmittedPinScale.current = 1;
      lastEmittedLineProgress.current = 1;
      setRevealReady(false);
      cameraTargets.current = null;
    }
  }, [gameState]);

  // Expose revealReady to the store-less GameUI via a DOM attribute
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.dataset.revealReady = String(revealReady);
    }
  }, [revealReady]);

  // ── Throttled state setters: only re-render when value changes meaningfully ──
  const emitPinScale = (value: number) => {
    if (Math.abs(value - lastEmittedPinScale.current) > STATE_THRESHOLD || value >= 1) {
      setTargetPinScale(value);
      lastEmittedPinScale.current = value;
    }
  };
  const emitLineProgress = (value: number) => {
    if (Math.abs(value - lastEmittedLineProgress.current) > STATE_THRESHOLD || value >= 1) {
      setLineProgress(value);
      lastEmittedLineProgress.current = value;
    }
  };

  useFrame((state) => {
    if (gameState !== 'revealed') return;

    // Capture initial camera position on the very first frame
    if (revealStartTime.current === null) {
      revealStartTime.current = state.clock.elapsedTime;
      initialCameraPos.current = state.camera.position.clone();
    }

    const elapsed = state.clock.elapsedTime - revealStartTime.current;
    const targets = cameraTargets.current;
    const startPos = initialCameraPos.current;

    if (!targets || !startPos) return;

    // Global progress (0 → 1) drives the lookAt offset smoothly across all phases
    const globalT = Math.min(1, elapsed / TOTAL_ANIM_DURATION);
    const offsetScale = easeInOutCubic(globalT);
    // Re-use pre-allocated _lookAt vector — zero allocations
    _lookAt.copy(targets.lookAtOffset).multiplyScalar(offsetScale);

    // ── Phase 1: Move camera from current position to guess pin ──
    if (elapsed < PHASE1_DURATION) {
      const t = Math.min(1, elapsed / PHASE1_DURATION);
      const eased = easeOutCubic(t);

      _camPos.copy(startPos).lerp(targets.guessPos, eased);
      state.camera.position.copy(_camPos);
      state.camera.lookAt(_lookAt.x, _lookAt.y, _lookAt.z);

      // Target pin scales up
      const pinVal = easeOutCubic(Math.min(1, elapsed / (PHASE1_DURATION * 0.8)));
      emitPinScale(pinVal);
    }
    // ── Phase 2: Follow line from guess to real answer ──
    else if (elapsed < PHASE1_DURATION + PHASE2_DURATION) {
      const phase2Elapsed = elapsed - PHASE1_DURATION;
      const t = Math.min(1, phase2Elapsed / PHASE2_DURATION);
      const eased = easeInOutCubic(t);

      _camPos.copy(targets.guessPos).lerp(targets.targetPos, eased);
      state.camera.position.copy(_camPos);
      state.camera.lookAt(_lookAt.x, _lookAt.y, _lookAt.z);

      emitLineProgress(eased);
      emitPinScale(1);
    }
    // ── Phase 3: Zoom out to reveal both pins ──
    else if (elapsed < TOTAL_ANIM_DURATION) {
      const phase3Elapsed = elapsed - PHASE1_DURATION - PHASE2_DURATION;
      const t = Math.min(1, phase3Elapsed / PHASE3_DURATION);
      const eased = easeOutCubic(t);

      _camPos.copy(targets.targetPos).lerp(targets.revealPos, eased);
      state.camera.position.copy(_camPos);
      state.camera.lookAt(_lookAt.x, _lookAt.y, _lookAt.z);

      emitLineProgress(1);
      emitPinScale(1);
    } else {
      // Animation complete — keep camera positioned every frame
      // (prevents OrbitControls from snapping when it re-enables)
      state.camera.position.copy(targets.revealPos);
      state.camera.lookAt(
        targets.lookAtOffset.x,
        targets.lookAtOffset.y,
        targets.lookAtOffset.z
      );
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
    const segments = 40;
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
    
    if (!(countriesData as any).features) {
        console.error("No features found in countriesData");
        return lines;
    }

    (countriesData as any).features.forEach((feature: any) => {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
            geometry.coordinates.forEach((ring: any[]) => {
                const points = ring.map(([lng, lat]) => latLngToVector(lat, lng, 1.005));
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


// ── Easing Functions ──

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Helper to create circle points for grid
function createCirclePoints(radius: number, axis: 'x' | 'y', rotationDeg: number, latOffsetDeg: number = 0): Vector3[] {
    const points: Vector3[] = [];
    const segments = 64;
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        let x = 0, y = 0, z = 0;

        if (axis === 'y') {
            x = radius * Math.sin(theta);
            y = radius * Math.cos(theta);
            z = 0;
            
            const rot = rotationDeg * Math.PI / 180;
            const x_new = x * Math.cos(rot) - z * Math.sin(rot);
            const z_new = x * Math.sin(rot) + z * Math.cos(rot);
            x = x_new;
            z = z_new;
        } else {
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
