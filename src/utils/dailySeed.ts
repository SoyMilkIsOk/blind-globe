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

export const fetchDailyDateString = async (): Promise<string> => {
  try {
    // Make a HEAD request to the current page to get the server's Date header
    const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = response.headers.get('Date');
    
    if (!dateHeader) throw new Error('No Date header found in response');

    const serverDate = new Date(dateHeader);
    
    // Format the server date to US/Mountain time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver', // US/Mountain
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = formatter.formatToParts(serverDate);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Failed to fetch server time, falling back to local time:', error);
    return getDailyDateString();
  }
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
