export const CONFIG = {
  api: {
    // Real backend deployed on Render.
    // NOTE: Render free tier has a ~30s cold start on first request after idle.
    baseUrl: 'https://revvedup-api.onrender.com/api/v1',
    // 65s covers the Render cold-start window with a small buffer.
    timeoutMs: 65_000,
  },

  ride: {
    locationIntervalMs: 1_500,
    minDistanceMeters: 5,
    maxAccuracyMeters: 30,
    maxPlausibleSpeedKmh: 250,
    metricsTickMs: 1_000,
  },

  map: {
    initialLatitudeDelta: 0.02,
    initialLongitudeDelta: 0.02,
    polylineWidth: 5,
    followRecenterThresholdMeters: 50,
  },

  storage: {
    rideHistoryKey: '@revvedup/ride-history',
    memoriesKey: '@revvedup/memories',
  },
};
