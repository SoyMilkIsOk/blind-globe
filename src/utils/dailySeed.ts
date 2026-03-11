import seedrandom from 'seedrandom';
import { CITIES, City } from '../data/cities';

export interface DailyGameData {
  targetCities: City[];
  referenceCities: City[];
}

/**
 * Deterministic Fisher-Yates shuffle using a seeded RNG.
 * Unlike Array.sort(() => 0.5 - rng()), this produces identical
 * results across ALL JavaScript engines (V8, SpiderMonkey, JSC).
 */
function fisherYatesShuffle<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetch the current date in America/Denver (MST/MDT) from an external,
 * device-independent time API. No local fallback — if all APIs fail,
 * the game cannot start (this guarantees every device gets the same cities).
 *
 * Chain: timeapi.io → worldtimeapi.org → throws error
 */
export const fetchDailyDateString = async (): Promise<string> => {
  // Helper: zero-pad a number to 2 digits
  const pad = (n: number) => String(n).padStart(2, '0');

  // --- 1. Primary: timeapi.io ---
  try {
    const res = await fetch(
      `https://timeapi.io/api/time/current/zone?timeZone=America/Denver&_=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`timeapi.io status ${res.status}`);
    const data = await res.json();
    // data shape: { year, month, day, ... }
    if (data.year && data.month && data.day) {
      const dateStr = `${data.year}-${pad(data.month)}-${pad(data.day)}`;
      console.log('[BlindGlobe] Daily seed from timeapi.io:', dateStr);
      return dateStr;
    }
    throw new Error('Unexpected timeapi.io response shape');
  } catch (err) {
    console.warn('[BlindGlobe] timeapi.io failed, trying fallback:', err);
  }

  // --- 2. Fallback: worldtimeapi.org ---
  try {
    const res = await fetch(
      `https://worldtimeapi.org/api/timezone/America/Denver?_=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`worldtimeapi.org status ${res.status}`);
    const data = await res.json();
    // data.datetime looks like "2026-03-10T14:30:00.123456-06:00"
    if (data.datetime) {
      const dateStr = data.datetime.slice(0, 10); // "YYYY-MM-DD"
      console.log('[BlindGlobe] Daily seed from worldtimeapi.org:', dateStr);
      return dateStr;
    }
    throw new Error('Unexpected worldtimeapi.org response shape');
  } catch (err) {
    console.warn('[BlindGlobe] worldtimeapi.org also failed:', err);
  }

  // --- 3. No local fallback — throw so the game shows an error ---
  throw new Error(
    'Could not fetch the daily date from any time API. Please check your internet connection and try again.'
  );
};

export const getDailyGameData = (dateString: string): DailyGameData => {
  const rng = seedrandom(dateString);

  // Filter cities by difficulty
  const easyCities = CITIES.filter(c => c.difficulty === 1);
  const mediumCities = CITIES.filter(c => c.difficulty === 3);
  const hardCities = CITIES.filter(c => c.difficulty === 5);

  // Deterministic shuffle using Fisher-Yates (works identically on every engine)
  const shuffledEasy = fisherYatesShuffle(easyCities, rng);
  const shuffledMedium = fisherYatesShuffle(mediumCities, rng);
  const shuffledHard = fisherYatesShuffle(hardCities, rng);

  const targetCities: City[] = [];
  const referenceCities: City[] = [];

  // Round 1: Easy
  targetCities.push(shuffledEasy[0]);
  
  // Round 2: Medium
  targetCities.push(shuffledMedium[0]);

  // Round 3: Hard
  targetCities.push(shuffledHard[0]);

  // Select reference cities — pick from full list, avoid matching target
  const pickReference = (target: City) => {
    let ref: City;
    do {
        const idx = Math.floor(rng() * CITIES.length);
        ref = CITIES[idx];
    } while (ref.name === target.name);
    return ref;
  };

  referenceCities.push(pickReference(targetCities[0]));
  referenceCities.push(pickReference(targetCities[1]));
  referenceCities.push(pickReference(targetCities[2]));

  return {
    targetCities,
    referenceCities
  };
};
