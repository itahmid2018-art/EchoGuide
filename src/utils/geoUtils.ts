import { TravelMode } from '../types/tour';

// Calculates great-circle distance between two points in meters using Haversine formula
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculates compass bearing from point 1 to point 2 (0 - 360 degrees)
export function getBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

// Proximity geofence radius threshold depending on travel mode
export function getGeofenceRadiusMeters(mode: TravelMode): number {
  switch (mode) {
    case 'walking':
      return 75; // 75 meters
    case 'cycling':
      return 150; // 150 meters
    case 'driving':
      return 300; // 300 meters
    default:
      return 80;
  }
}

// Format meters to human readable distance (e.g., '45 m' or '1.4 km')
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format estimated travel time based on mode
export function formatTravelTime(meters: number, mode: TravelMode): string {
  let speedKmh = 4.5; // walking average ~4.5 km/h
  if (mode === 'cycling') speedKmh = 15;
  if (mode === 'driving') speedKmh = 35;

  const hours = meters / 1000 / speedKmh;
  const minutes = Math.round(hours * 60);

  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
