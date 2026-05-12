export const CONFIG = {
  /**
   * When false (default): rides and memories are device-only via local services.
   * Set to true when the MVP sync layer talks to `api.baseUrl`.
   */
  sync: {
    enabled: false,
  },

  api: {
    // Real backend deployed on Render (used only when sync.enabled is true).
    // NOTE: Render free tier has a ~30s cold start on first request after idle.
    baseUrl: 'https://revvedupbackend.onrender.com/api/v1',
    // 65s covers the Render cold-start window with a small buffer.
    timeoutMs: 65_000,
  },

  /**
   * GPS health, watchdog, and watch restart (transient signal loss).
   */
  gps: {
    /** No native location callback for this long → treat as signal lost. */
    noNativeFixMs: 45_000,
    /** Native callbacks arrive but nothing is accepted by appendCoordinate for this long → degraded (accuracy / stationary). */
    noAcceptedFixMs: 30_000,
    /** Max automatic watch restarts after native error before backing off to user action. */
    maxWatchRestarts: 5,
    /** Base delay (ms) for exponential backoff between watch restarts; capped by maxWatchRestartDelayMs. */
    watchRestartBaseMs: 500,
    maxWatchRestartDelayMs: 30_000,
    /** While lost/degraded, probe single-shot location at this interval (ms). */
    probeIntervalMs: 25_000,
    /** How often the GPS watchdog runs (ms). */
    watchdogTickMs: 1_500,
  },

  ride: {
    locationIntervalMs: 1_500,
    /** Minimum spacing between stored points; lower = denser polyline (more API points if snapping). */
    minDistanceMeters: 5,
    maxAccuracyMeters: 30,
    maxPlausibleSpeedKmh: 250,
    /** Drop a fix if segment speed vs previous fix exceeds this (needs both timestamps). */
    rejectImpossibleSegments: true,
    /** Skip speed check when GPS gap exceeds this (e.g. tunnel / lost signal). */
    maxSegmentTimeGapMs: 180_000,
    metricsTickMs: 1_000,
  },

  /**
   * Google Roads API — snap trace to road centerlines after each ride (display polyline).
   * Enable "Roads API" for your GCP key. Leave apiKey empty to keep raw GPS-only lines.
   */
  roads: {
    snapEnabled: true,
    apiKey: '',
    interpolate: true,
    maxPointsPerRequest: 100,
    timeoutMs: 30_000,
  },

  map: {
    initialLatitudeDelta: 0.02,
    initialLongitudeDelta: 0.02,
    polylineWidth: 5,
    followRecenterThresholdMeters: 50,
    /** Same default center as RideMap when GPS has no points yet; used to pin memories. */
    fallbackCoordinate: {latitude: 19.076, longitude: 72.8777},
  },

  storage: {
    rideHistoryKey: '@revvedup/ride-history',
    memoriesKey: '@revvedup/memories',
  },
};
