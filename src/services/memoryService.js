import {CONFIG} from '@constants/config';
import {ENDPOINTS} from '@constants/endpoints';
import {request} from './apiClient';
import * as local from './memoryServiceLocal';

export const memoryService = {
  addMemory,
  getMemoriesByRide,
  deleteMemory,
};

async function addMemory(req) {
  if (!CONFIG.sync.enabled) {
    return local.addMemory(req);
  }
  return request({method: 'POST', path: ENDPOINTS.memories.add, body: req});
}

async function getMemoriesByRide(rideId) {
  if (!CONFIG.sync.enabled) {
    return local.getMemoriesByRide(rideId);
  }
  return request({method: 'GET', path: ENDPOINTS.memories.byRide(rideId)});
}

async function deleteMemory(memoryId) {
  if (!CONFIG.sync.enabled) {
    return local.deleteMemory(memoryId);
  }
  return request({method: 'DELETE', path: ENDPOINTS.memories.delete(memoryId)});
}
