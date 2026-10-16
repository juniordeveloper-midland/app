/**
 * Haversine formula calculation for GPS coordinates distance in metres.
 * R = 6,371,000 meters (mean Earth radius)
 */
export function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format metres into a readable string (e.g. "45 m" or "1.24 km")
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined) return "--";
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Checks if current GPS coordinates are within specified geofence radius
 */
export function isInsideGeofence(currentLat, currentLng, targetLat, targetLng, radiusMeters) {
  const distance = calculateDistanceInMeters(currentLat, currentLng, targetLat, targetLng);
  return {
    inside: distance <= radiusMeters,
    distance,
  };
}
