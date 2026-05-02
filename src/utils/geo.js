const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates using the Haversine formula.
 * Returns meters.
 */
export function haversineMeters(a, b) {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Sum the great-circle distances between successive coordinates.
 */
export function totalDistanceMeters(coords) {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineMeters(coords[i - 1], coords[i]);
  }
  return total;
}

/**
 * Compute current speed in km/h between the last two fixes.
 */
export function currentSpeedKmh(coords) {
  if (coords.length < 2) return 0;
  const last = coords[coords.length - 1];
  const prev = coords[coords.length - 2];
  const dtSeconds = (last.timestamp - prev.timestamp) / 1000;
  if (dtSeconds <= 0) return 0;
  const dMeters = haversineMeters(prev, last);
  return (dMeters / dtSeconds) * 3.6;
}

/**
 * Compute the bounding region for an array of coordinates with optional padding.
 */
export function regionForCoordinates(coords, paddingFactor = 1.4) {
  if (coords.length === 0) return null;
  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.005, (maxLat - minLat) * paddingFactor),
    longitudeDelta: Math.max(0.005, (maxLng - minLng) * paddingFactor),
  };
}
