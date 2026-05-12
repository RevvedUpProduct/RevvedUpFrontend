import {CONFIG} from '@constants/config';
import {ENDPOINTS} from '@constants/endpoints';
import {request} from './apiClient';
import * as local from './rideServiceLocal';

export const rideService = {
  startRide,
  stopRide,
  appendCoordinates,
  getRideHistory,
  getRideById,
};

async function startRide(req) {
  if (!CONFIG.sync.enabled) {
    return local.startRide(req);
  }
  return request({method: 'POST', path: ENDPOINTS.rides.start, body: req});
}

async function stopRide(rideId, req) {
  if (!CONFIG.sync.enabled) {
    return local.stopRide(rideId, req);
  }
  const body = {
    endedAt: req.endedAt,
    finalCoordinates: req.finalCoordinates,
    metrics: req.metrics,
    ...(Array.isArray(req.coordinatesRaw) ? {coordinatesRaw: req.coordinatesRaw} : {}),
  };
  return request({method: 'POST', path: ENDPOINTS.rides.stop(rideId), body});
}

async function appendCoordinates(rideId, req) {
  if (!CONFIG.sync.enabled) {
    return local.appendCoordinates(rideId, req);
  }
  return request({
    method: 'PATCH',
    path: ENDPOINTS.rides.appendCoordinates(rideId),
    body: req,
  });
}

async function getRideHistory(req = {}) {
  if (!CONFIG.sync.enabled) {
    return local.getRideHistory(req);
  }
  return request({
    method: 'GET',
    path: ENDPOINTS.rides.list,
    query: {page: req.page, pageSize: req.pageSize, type: req.type},
  });
}

async function getRideById(rideId) {
  if (!CONFIG.sync.enabled) {
    return local.getRideById(rideId);
  }
  return request({method: 'GET', path: ENDPOINTS.rides.byId(rideId)});
}
