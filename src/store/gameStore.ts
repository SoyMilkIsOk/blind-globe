import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City } from '../data/cities';
import { getDailyGameData, fetchDailyDateString } from '../utils/dailySeed';
import { calculateDistance } from '../utils/distance';
import confetti from 'canvas-confetti';

interface GameState {
  round: number;
  totalScore: number;
  roundScore: number;
  gameState: 'loading' | 'error' | 'start' | 'playing' | 'revealed' | 'finished';
  targetCities: City[];
  referenceCities: City[];
  roundDifficulties: number[];
  gameDifficulty: number;
  guess: { lat: number; lng: number } | null;
  tempGuess: { lat: number; lng: number } | null;
  
  // Stats
  gamesPlayed: number;
  highScore: number;
  totalLifetimeScore: number;
  lastDailyDate: string; // Track the date of the last played game
  
  hintLevel: number;
  
  lastDistance: number | null; // Track distance of last guess

  // Error message when APIs fail
  errorMessage: string;

  // Actions
  initGame: () => Promise<void>;
  retryInit: () => Promise<void>;
  startGame: () => void;
  setTempGuess: (lat: number, lng: number) => void;
  useHint: () => void;
  confirmGuess: () => void;
  nextRound: () => void;
  resetGame: () => void;
}

let initPromise: Promise<void> | null = null;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      round: 1,
      totalScore: 0,
      roundScore: 0,
      gameState: 'loading',
      targetCities: [],
      referenceCities: [],
      roundDifficulties: [],
      gameDifficulty: 1,
      guess: null,
      tempGuess: null,
      
      gamesPlayed: 0,
      highScore: 0,
      totalLifetimeScore: 0,
      lastDailyDate: '',
      hintLevel: 0,
      lastDistance: null,
      errorMessage: '',

      initGame: async () => {
        if (initPromise) return initPromise;

        initPromise = (async () => {
          // Capture the previously persisted state before we override it to loading
          const { lastDailyDate, gameState: persistedState } = get();
          
          set({ gameState: 'loading', errorMessage: '' });

          try {
            // Fetch the authoritative date string — NO local fallback
            const today = await fetchDailyDateString();

            // If it's a new day, reset the game state
            if (lastDailyDate !== today) {
                const { targetCities, referenceCities } = getDailyGameData(today);
                const roundDifficulties = targetCities.map((target, idx) => {
                    const ref = referenceCities[idx];
                    const distance = calculateDistance(target.lat, target.lng, ref.lat, ref.lng);
                    const avgDiff = (Number(target.difficulty) + Number(ref.difficulty)) / 2;
                    const distDiff = Math.min(5, Math.ceil(distance / 3500));
                    return Math.min(10, Math.max(1, Math.round(avgDiff + distDiff)));
                });
                const gameDifficulty = Math.round(roundDifficulties.reduce((a, b) => a + b, 0) / 3);

                set({ 
                    targetCities, 
                    referenceCities,
                    roundDifficulties,
                    gameDifficulty,
                    lastDailyDate: today,
                    gameState: 'start',
                    round: 1,
                    totalScore: 0,
                    roundScore: 0,
                    guess: null,
                    tempGuess: null,
                    hintLevel: 0,
                    lastDistance: null,
                    errorMessage: ''
                });
            } else {
                // Same day — restore previous game state but ALWAYS regenerate cities 
                // to ensure we bypass any old cached arrays from local storage backups.
                const { targetCities: newTargets, referenceCities: newRefs } = getDailyGameData(today);
                const roundDifficulties = newTargets.map((target, idx) => {
                    const ref = newRefs[idx];
                    const distance = calculateDistance(target.lat, target.lng, ref.lat, ref.lng);
                    const avgDiff = (Number(target.difficulty) + Number(ref.difficulty)) / 2;
                    const distDiff = Math.min(5, Math.ceil(distance / 3500));
                    return Math.min(10, Math.max(1, Math.round(avgDiff + distDiff)));
                });
                const gameDifficulty = Math.round(roundDifficulties.reduce((a, b) => a + b, 0) / 3);
                
                // If previously in a valid game state, keep it; otherwise show start
                if (persistedState === 'loading' || persistedState === 'error') {
                    set({ targetCities: newTargets, referenceCities: newRefs, roundDifficulties, gameDifficulty, gameState: 'start' });
                } else {
                    set({ targetCities: newTargets, referenceCities: newRefs, roundDifficulties, gameDifficulty, gameState: persistedState });
                }
            }
          } catch (err) {
            const message = err instanceof Error
              ? err.message
              : 'Unable to connect to time server. Please check your internet connection.';
            console.error('[BlindGlobe] initGame failed:', message);
            set({ gameState: 'error', errorMessage: message });
          } finally {
            initPromise = null;
          }
        })();

        return initPromise;
      },

      retryInit: async () => {
        // Alias for initGame — gives the UI a clear "retry" action
        await get().initGame();
      },

      startGame: () => {
        const { gameState } = get();
        // Prevent starting if in an invalid state
        if (gameState === 'finished' || gameState === 'loading' || gameState === 'error') return;

        set({ gameState: 'playing', round: 1, totalScore: 0, roundScore: 0, guess: null, tempGuess: null, hintLevel: 0, lastDistance: null });
      },

      setTempGuess: (lat, lng) => {
        if (get().gameState !== 'playing') return;
        set({ tempGuess: { lat, lng } });
      },

      useHint: () => {
        const { hintLevel } = get();
        if (hintLevel >= 2) return;
    
        let newLevel = hintLevel;
    
        if (hintLevel === 0) {
            newLevel = 1;
        } else if (hintLevel === 1) {
            newLevel = 2;
        }
    
        set({ hintLevel: newLevel });
      },

      confirmGuess: () => {
        const { tempGuess, targetCities, round, hintLevel } = get();
        if (!tempGuess) return;

        const target = targetCities[round - 1];
        const { lat, lng } = tempGuess;
        
        // Calculate distance (Haversine)
        const distance = calculateDistance(target.lat, target.lng, lat, lng);

        // Calculate score (Max 5000, drops off with distance)
        let guessScore = 0;
        if (distance < 50) {
            guessScore = 5000;
        } else {
            guessScore = Math.max(0, Math.round(5000 * (1 - (distance - 50) / 5000)));
        }

        // Apply Penalties
        let penalty = 0;
        if (hintLevel >= 1) penalty += 500;
        if (hintLevel >= 2) penalty += 2000;

        const netRoundScore = guessScore - penalty;

        // Trigger Confetti based on guess score
        if (guessScore > 4000) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e'] });
        } else if (guessScore > 2000) {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#eab308'] });
        } else {
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#ef4444'] });
        }

        set({ 
            guess: tempGuess,
            tempGuess: null,
            gameState: 'revealed',
            roundScore: guessScore,
            totalScore: get().totalScore + netRoundScore,
            lastDistance: Math.round(distance)
        });
      },

      nextRound: () => {
        const { round, totalScore, gamesPlayed, highScore, totalLifetimeScore } = get();
        if (round >= 3) {
            // Game Finished - Update Stats
            set({ 
                gameState: 'finished',
                gamesPlayed: gamesPlayed + 1,
                highScore: Math.max(highScore, totalScore),
                totalLifetimeScore: totalLifetimeScore + totalScore,
                lastDistance: null
            });
        } else {
            set({ round: round + 1, gameState: 'playing', guess: null, tempGuess: null, roundScore: 0, hintLevel: 0, lastDistance: null });
        }
      },

      resetGame: () => {
        set({ gameState: 'start', round: 1, totalScore: 0, roundScore: 0, guess: null, tempGuess: null, hintLevel: 0, lastDistance: null });
      }
    }),
    {
      name: 'blind-globe-storage',
      partialize: (state) => ({ 
        round: state.round,
        totalScore: state.totalScore,
        roundScore: state.roundScore,
        gameState: state.gameState,
        targetCities: state.targetCities,
        referenceCities: state.referenceCities,
        roundDifficulties: state.roundDifficulties,
        gameDifficulty: state.gameDifficulty,
        guess: state.guess,
        hintLevel: state.hintLevel,
        lastDistance: state.lastDistance,
        // Persist stats
        gamesPlayed: state.gamesPlayed,
        highScore: state.highScore,
        totalLifetimeScore: state.totalLifetimeScore,
        lastDailyDate: state.lastDailyDate
      }),
    }
  )
);
