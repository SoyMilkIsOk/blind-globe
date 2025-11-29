import seedrandom from 'seedrandom';
import { CITIES, City } from '../data/cities';

export interface DailyGameData {
  targetCities: City[];
  referenceCities: City[];
}

export const getDailyGameData = (): DailyGameData => {
  // Create a seed based on the current date (UTC)
  const today = new Date();
  const seed = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
  
  const rng = seedrandom(seed);

  // Shuffle cities using the seeded RNG
  const shuffledCities = [...CITIES].sort(() => 0.5 - rng());

  // We need 3 rounds. For each round, we need a target city and a reference city.
  // They must be distinct.
  
  const targetCities: City[] = [];
  const referenceCities: City[] = [];
  
  let index = 0;
  
  for (let i = 0; i < 3; i++) {
    // Pick target
    const target = shuffledCities[index++];
    targetCities.push(target);
    
    // Pick reference (ensure it's not the same as target)
    let reference = shuffledCities[index++];
    while (reference.name === target.name) {
      reference = shuffledCities[index++];
    }
    referenceCities.push(reference);
  }

  return {
    targetCities,
    referenceCities
  };
};
