import {CONFIG} from '@constants/config';
import {ENDPOINTS} from '@constants/endpoints';
import {createId} from '@utils/id';
import {request, simulateLatency, maybeMockFailure} from './apiClient';
import {mockDb} from './mockDb';

export const rideService = {
  startRide,
  stopRide,
  appendCoordinates,
  getRideHistory,
  getRideById,
};

async function startRide(req) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const failure = maybeMockFailure();
    if (failure) return {ok: false, error: failure};

    const ride = {
      id: createId('ride'),
      status: 'recording',
      type: req.type,
      startedAt: req.startedAt,
      endedAt: null,
      coordinates: req.startCoordinate ? [req.startCoordinate] : [],
      metrics: {
        distanceMeters: 0,
        durationMs: 0,
        currentSpeedKmh: 0,
        averageSpeedKmh: 0,
        maxSpeedKmh: 0,
      },
      memoryIds: [],
    };
    mockDb.insertRide(ride);
    return {ok: true, data: {ride}};
  }

  return request({method: 'POST', path: ENDPOINTS.rides.start, body: req});
}

async function stopRide(rideId, req) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const failure = maybeMockFailure();
    if (failure) return {ok: false, error: failure};

    const updated = mockDb.updateRide(rideId, ride => ({
      ...ride,
      status: 'completed',
      endedAt: req.endedAt,
      coordinates: [...ride.coordinates, ...req.finalCoordinates],
      metrics: req.metrics,
    }));

    if (!updated) {
      return {ok: false, error: {code: 'NOT_FOUND', message: `Ride ${rideId} not found`}};
    }
    return {ok: true, data: {ride: updated}};
  }

  return request({method: 'POST', path: ENDPOINTS.rides.stop(rideId), body: req});
}

async function appendCoordinates(rideId, req) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const updated = mockDb.updateRide(rideId, ride => ({
      ...ride,
      coordinates: [...ride.coordinates, ...req.coordinates],
    }));
    if (!updated) {
      return {ok: false, error: {code: 'NOT_FOUND', message: `Ride ${rideId} not found`}};
    }
    return {ok: true, data: {rideId, appended: req.coordinates.length}};
  }

  return request({method: 'PATCH', path: ENDPOINTS.rides.appendCoordinates(rideId), body: req});
}

async function getRideHistory(req = {}) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const all = mockDb.listRideSummaries();
    const filtered = req.type ? all.filter(r => r.type === req.type) : all;
    const page = req.page ?? 1;
    const pageSize = req.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return {
      ok: true,
      data: {
        rides: filtered.slice(start, start + pageSize),
        page,
        pageSize,
        total: filtered.length,
      },
    };
  }

  return request({
    method: 'GET',
    path: ENDPOINTS.rides.list,
    query: {page: req.page, pageSize: req.pageSize, type: req.type},
  });
}

async function getRideById(rideId) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const ride = mockDb.getRide(rideId);
    if (!ride) {
      return {ok: false, error: {code: 'NOT_FOUND', message: `Ride ${rideId} not found`}};
    }
    return {ok: true, data: {ride}};
  }

  return request({method: 'GET', path: ENDPOINTS.rides.byId(rideId)});
}
