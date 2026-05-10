import {ENDPOINTS} from '@constants/endpoints';
import {request} from './apiClient';

export const memoryService = {
  addMemory,
  getMemoriesByRide,
  deleteMemory,
};

async function addMemory(req) {
  return request({method: 'POST', path: ENDPOINTS.memories.add, body: req});
}

async function getMemoriesByRide(rideId) {
  return request({method: 'GET', path: ENDPOINTS.memories.byRide(rideId)});
}

async function deleteMemory(memoryId) {
  return request({method: 'DELETE', path: ENDPOINTS.memories.delete(memoryId)});
}
