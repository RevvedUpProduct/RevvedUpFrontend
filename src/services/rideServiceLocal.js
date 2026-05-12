/**
 * Offline ride API — no network. Matches the `{ ok, data }` / `{ ok, error }`
 * shape of `apiClient.request` so stores stay unchanged.
 * When `CONFIG.sync.enabled` is true, use HTTP instead (see rideService.js).
 */

function newRideId() {
  return `ride_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function startRide(req) {
  const id = newRideId();
  return {
    ok: true,
    data: {
      ride: {
        id,
        type: req.type ?? 'solo',
        startedAt: req.startedAt,
        status: 'active',
      },
    },
  };
}

/**
 * @param {string} rideId
 * @param {object} req - includes endedAt, finalCoordinates, metrics; may include startedAt, type for local detail
 */
export async function stopRide(rideId, req) {
  const ride = {
    id: rideId,
    status: 'completed',
    type: req.type ?? 'solo',
    startedAt: req.startedAt,
    endedAt: req.endedAt,
    coordinates: req.finalCoordinates ?? [],
    ...(Array.isArray(req.coordinatesRaw) && req.coordinatesRaw.length > 0
      ? {coordinatesRaw: req.coordinatesRaw}
      : {}),
    metrics: req.metrics,
    memoryIds: Array.isArray(req.memoryIds) ? req.memoryIds : [],
    startLocationLabel: null,
    endLocationLabel: null,
  };
  return {ok: true, data: {ride}};
}

export async function appendCoordinates(_rideId, _req) {
  return {ok: true, data: {}};
}

export async function getRideHistory(_req = {}) {
  return {ok: true, data: {rides: [], page: 1, pageSize: 0}};
}

export async function getRideById(_rideId) {
  return {ok: false, error: {code: 'NOT_FOUND', message: 'Use local cache only when sync is off'}};
}
