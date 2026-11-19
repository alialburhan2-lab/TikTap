/** Great-circle distance in kilometres. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Rough road-distance estimate: straight line × 1.3.
 * This is an ESTIMATE only and is always labelled as such in the UI — it is not a verified road route.
 */
export const ROAD_FACTOR = 1.3;
export function estimatedRoadKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return haversineKm(a, b) * ROAD_FACTOR;
}

/** Assumed average intercity driving speed for time estimates (km/h). */
export const AVG_SPEED_KMH = 70;
