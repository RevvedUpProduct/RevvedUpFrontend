import {ENDPOINTS} from '@constants/endpoints';
import {request} from './apiClient';

export const rideService = {
  startRide,
  stopRide,
  appendCoordinates,
  getRideHistory,
  getRideById,
};

async function startRide(req) {
  return request({method: 'POST', path: ENDPOINTS.rides.start, body: req});
}

async function stopRide(rideId, req) {
  return request({method: 'POST', path: ENDPOINTS.rides.stop(rideId), body: req});
}

async function appendCoordinates(rideId, req) {
  return request({
    method: 'PATCH',
    path: ENDPOINTS.rides.appendCoordinates(rideId),
    body: req,
  });
}

async function getRideHistory(req = {}) {
  return request({
    method: 'GET',
    path: ENDPOINTS.rides.list,
    query: {page: req.page, pageSize: req.pageSize, type: req.type},
  });
}

async function getRideById(rideId) {
  return request({method: 'GET', path: ENDPOINTS.rides.byId(rideId)});
}
