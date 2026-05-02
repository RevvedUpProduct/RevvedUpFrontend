export const CONFIG = {
  useMockServices: true,

  api: {
    mockLatencyMinMs: 200,
    mockLatencyMaxMs: 700,
    mockFailureRate: 0,
    baseUrl: 'https://api.revvedup.app/v1',
    timeoutMs: 15_000,
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
