import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City } from '../data/cities';
import { getDailyGameData } from '../utils/dailySeed';
import confetti from 'canvas-confetti';

interface GameState {
  round: number;
  totalScore: number;
  roundScore: number;
  gameState: 'start' | 'playing' | 'revealed' | 'finished';
  targetCities: City[];
  referenceCities: City[];
  guess: { lat: number; lng: number } | null;
  tempGuess: { lat: number; lng: number } | null;
  
  // Stats
  gamesPlayed: number;
  highScore: number;
  totalLifetimeScore: number;
  lastDailyDate: string; // Track the date of the last played game
  
  // Actions
  initGame: () => void;
  startGame: () => void;
  setTempGuess: (lat: number, lng: number) => void;
  confirmGuess: () => void;
  nextRound: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      round: 1,
      totalScore: 0,
      roundScore: 0,
      gameState: 'start',
      targetCities: [],
      referenceCities: [],
      guess: null,
      tempGuess: null,
      
      gamesPlayed: 0,
      highScore: 0,
      totalLifetimeScore: 0,
      lastDailyDate: '',

      initGame: () => {
        const today = new Date().toDateString();
        const { lastDailyDate } = get();

        // If it's a new day, reset the game state
        if (lastDailyDate !== today) {
            const { targetCities, referenceCities } = getDailyGameData();
            set({ 
                targetCities, 
                referenceCities,
                lastDailyDate: today,
                gameState: 'start',
                round: 1,
                totalScore: 0,
                roundScore: 0,
                guess: null,
                tempGuess: null
            });
        } else {
            // Same day - ensure we have data if missing (e.g. first load of day but state was partial)
            const { targetCities } = get();
            if (targetCities.length === 0) {
                const { targetCities: newTargets, referenceCities: newRefs } = getDailyGameData();
                set({ targetCities: newTargets, referenceCities: newRefs });
            }
        }
      },

      startGame: () => {
        const { gameState } = get();
        // Prevent starting if already finished today
        if (gameState === 'finished') return;

        set({ gameState: 'playing', round: 1, totalScore: 0, roundScore: 0, guess: null, tempGuess: null });
      },

      setTempGuess: (lat, lng) => {
        if (get().gameState !== 'playing') return;
        set({ tempGuess: { lat, lng } });
      },

      confirmGuess: () => {
        const { tempGuess, targetCities, round } = get();
        if (!tempGuess) return;

        const target = targetCities[round - 1];
        const { lat, lng } = tempGuess;
        
        // Calculate distance (Haversine)
        const R = 6371; // Earth radius in km
        const dLat = (target.lat - lat) * Math.PI / 180;
        const dLng = (target.lng - lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

// ... inside confirmGuess

        // Calculate score (Max 5000, drops off with distance)
        let score = 0;
        if (distance < 50) {
            score = 5000;
        } else {
            score = Math.max(0, Math.round(5000 * (1 - (distance - 50) / 5000)));
        }

        // Trigger Confetti based on score
        if (score > 4000) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e'] }); // Green
        } else if (score > 2000) {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#eab308'] }); // Yellow
        } else {
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#ef4444'] }); // Red
        }

        set({ 
            guess: tempGuess,
            tempGuess: null,
            gameState: 'revealed',
            roundScore: score,
            totalScore: get().totalScore + score
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
                totalLifetimeScore: totalLifetimeScore + totalScore
            });
        } else {
            set({ round: round + 1, gameState: 'playing', guess: null, tempGuess: null, roundScore: 0 });
        }
      },

      resetGame: () => {
        set({ gameState: 'start', round: 1, totalScore: 0, roundScore: 0, guess: null, tempGuess: null });
      }
    }),
    {
      name: 'blind-globe-storage',
      partialize: (state) => ({ 
        round: state.round,
        totalScore: state.totalScore,
        gameState: state.gameState,
        targetCities: state.targetCities,
        referenceCities: state.referenceCities,
        // Persist stats
        gamesPlayed: state.gamesPlayed,
        highScore: state.highScore,
        totalLifetimeScore: state.totalLifetimeScore,
        lastDailyDate: state.lastDailyDate
      }),
    }
  )
);
