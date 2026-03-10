import seedrandom from 'seedrandom';
import { CITIES, City } from '../data/cities';

export interface DailyGameData {
  targetCities: City[];
  referenceCities: City[];
}

export const getDailyDateString = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver', // US/Mountain
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // formatToParts gives us reliable parts regardless of locale separator preferences
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
};

/**
 * Fetch the current date in America/Denver (MST/MDT) from an external,
 * device-independent time API. Falls back through multiple sources to
 * guarantee every player worldwide sees the same daily cities.
 *
 * Chain: timeapi.io → worldtimeapi.org → local Intl fallback
 */
export const fetchDailyDateString = async (): Promise<string> => {
  // Helper: zero-pad a number to 2 digits
  const pad = (n: number) => String(n).padStart(2, '0');

  // --- 1. Primary: timeapi.io ---
  try {
    const res = await fetch(
      'https://timeapi.io/api/time/current/zone?timeZone=America/Denver',
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
      'https://worldtimeapi.org/api/timezone/America/Denver',
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
    console.warn('[BlindGlobe] worldtimeapi.org failed, using local fallback:', err);
  }

  // --- 3. Last resort: device local time via Intl ---
  const dateStr = getDailyDateString();
  console.log('[BlindGlobe] Daily seed from local Intl fallback:', dateStr);
  return dateStr;
};

export const getDailyGameData = (dateString?: string): DailyGameData => {
  // Create a seed based on the provided date or current date in Eastern Time
  const seed = dateString || getDailyDateString();
  
  const rng = seedrandom(seed);

  // Filter cities by difficulty
  const easyCities = CITIES.filter(c => c.difficulty === 'easy');
  const mediumCities = CITIES.filter(c => c.difficulty === 'medium');
  const hardCities = CITIES.filter(c => c.difficulty === 'hard');

  // Shuffle each category
  const shuffledEasy = [...easyCities].sort(() => 0.5 - rng());
  const shuffledMedium = [...mediumCities].sort(() => 0.5 - rng());
  const shuffledHard = [...hardCities].sort(() => 0.5 - rng());

  const targetCities: City[] = [];
  const referenceCities: City[] = [];

  // Round 1: Easy
  targetCities.push(shuffledEasy[0]);
  
  // Round 2: Medium
  targetCities.push(shuffledMedium[0]);

  // Round 3: Hard
  targetCities.push(shuffledHard[0]);

  // Select reference cities
  // We want reference cities to be distinct from targets.
  // We can pick from the general pool or specific pools.
  // Let's pick from the same difficulty pool for fairness/relevance, or just random?
  // "Reference city" usually implies a starting point.
  // Let's just pick a random city that isn't the target for that round.
  
  // Helper to pick a reference city
  const pickReference = (target: City) => {
    // Combine all cities or pick from same difficulty? 
    // Let's pick from the full list to give variety, but maybe bias towards known cities?
    // Actually, let's just pick from the full list but ensure it's not the target.
    // Combine all cities or pick from same difficulty? 
    // Let's pick from the full list to give variety, but maybe bias towards known cities?
    // Actually, let's just pick from the full list but ensure it's not the target.
    // Better: just pick a random index from CITIES
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
