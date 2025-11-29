export interface City {
  name: string;
  lat: number;
  lng: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const CITIES: City[] = [
  // Easy / Major Cities
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, difficulty: 'easy' },
  { name: "New York", lat: 40.7128, lng: -74.0060, difficulty: 'easy' },
  { name: "London", lat: 51.5074, lng: -0.1278, difficulty: 'easy' },
  { name: "Paris", lat: 48.8566, lng: 2.3522, difficulty: 'easy' },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, difficulty: 'easy' },
  { name: "Moscow", lat: 55.7558, lng: 37.6173, difficulty: 'easy' },
  { name: "Cairo", lat: 30.0444, lng: 31.2357, difficulty: 'easy' },
  { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, difficulty: 'easy' },
  { name: "Beijing", lat: 39.9042, lng: 116.4074, difficulty: 'easy' },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, difficulty: 'easy' },
  
  // Medium
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, difficulty: 'medium' },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784, difficulty: 'medium' },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816, difficulty: 'medium' },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241, difficulty: 'medium' },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, difficulty: 'medium' },
  { name: "Toronto", lat: 43.6510, lng: -79.3470, difficulty: 'medium' },
  { name: "Berlin", lat: 52.5200, lng: 13.4050, difficulty: 'medium' },
  { name: "Madrid", lat: 40.4168, lng: -3.7038, difficulty: 'medium' },
  { name: "Rome", lat: 41.9028, lng: 12.4964, difficulty: 'medium' },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018, difficulty: 'medium' },

  // Hard
  { name: "Reykjavik", lat: 64.1466, lng: -21.9426, difficulty: 'hard' },
  { name: "Wellington", lat: -41.2865, lng: 174.7762, difficulty: 'hard' },
  { name: "Lima", lat: -12.0464, lng: -77.0428, difficulty: 'hard' },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219, difficulty: 'hard' },
  { name: "Ulaanbaatar", lat: 47.9181, lng: 106.9176, difficulty: 'hard' },
  { name: "Anchorage", lat: 61.2181, lng: -149.9003, difficulty: 'hard' },
  { name: "Perth", lat: -31.9505, lng: 115.8605, difficulty: 'hard' },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898, difficulty: 'hard' },
  { name: "Helsinki", lat: 60.1699, lng: 24.9384, difficulty: 'hard' },
  { name: "Santiago", lat: -33.4489, lng: -70.6693, difficulty: 'hard' }
];
