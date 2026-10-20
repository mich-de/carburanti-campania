// Confini della Campania con un piccolo margine: limitano la mappa e servono a verificare la posizione GPS
export const CAMPANIA_BOUNDS: [[number, number], [number, number]] = [
  [39.8, 13.6],
  [41.7, 15.9],
];

export interface UserLocation {
  lat: number;
  lng: number;
  // Precisione dichiarata dal dispositivo, in metri
  accuracy?: number;
  // Posizione scelta a mano toccando la mappa
  manual?: boolean;
}

export const isInCampania = (lat: number, lng: number): boolean => {
  const [[south, west], [north, east]] = CAMPANIA_BOUNDS;
  return lat >= south && lat <= north && lng >= west && lng <= east;
};

export const formatDistanceMeters = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
