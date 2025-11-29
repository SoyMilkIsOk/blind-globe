import seedrandom from 'seedrandom';
import { CITIES, City } from '../data/cities';

export interface DailyGameData {
  targetCities: City[];
  referenceCities: City[];
}

export const getDailyGameData = (): DailyGameData => {
  // Create a seed based on the current date in Eastern Time (America/New_York)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const seed = formatter.format(now);
  
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
