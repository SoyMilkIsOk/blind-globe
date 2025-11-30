import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City } from '../data/cities';
import { getDailyGameData, getDailyDateString } from '../utils/dailySeed';
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
  
  hintLevel: number;
  
  lastDistance: number | null; // Track distance of last guess

  // Actions
  initGame: () => void;
  startGame: () => void;
  setTempGuess: (lat: number, lng: number) => void;
  useHint: () => void;
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
      hintLevel: 0,
      lastDistance: null,

      initGame: () => {
        const today = getDailyDateString();
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
                tempGuess: null,
                hintLevel: 0,
                lastDistance: null
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
        const R = 6371; // Earth radius in km
        const dLat = (target.lat - lat) * Math.PI / 180;
        const dLng = (target.lng - lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

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

        // Ensure round score doesn't go below zero (optional, but good practice? User didn't specify, but usually scores are non-negative. 
        // Actually, if they want to subtract from total score, it implies net score could be negative or just reduce the total.
        // "Subtracts 300 points from the user's score". If round score is 0, total score should decrease.
        // So we calculate net round score, which can be negative.
        const netRoundScore = guessScore - penalty;

        // Trigger Confetti based on guess score (not net score, to reward accuracy)
        if (guessScore > 4000) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e'] }); // Green
        } else if (guessScore > 2000) {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#eab308'] }); // Yellow
        } else {
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#ef4444'] }); // Red
        }

        set({ 
            guess: tempGuess,
            tempGuess: null,
            gameState: 'revealed',
            roundScore: guessScore, // Keep raw guess score for display? Or net? 
            // The UI currently shows "Guess Score: {roundScore}". So roundScore should be the guess score.
            // And then we calculate net in the UI. 
            // BUT, we need to update totalScore.
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
