import {CONFIG} from '@constants/config';
import {ENDPOINTS} from '@constants/endpoints';
import {createId} from '@utils/id';
import {maybeMockFailure, request, simulateLatency} from './apiClient';
import {mockDb} from './mockDb';

export const memoryService = {
  addMemory,
  getMemoriesByRide,
  deleteMemory,
};

async function addMemory(req) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const failure = maybeMockFailure();
    if (failure) return {ok: false, error: failure};

    const memory = {
      id: createId('mem'),
      rideId: req.rideId,
      imageUri: req.imageUri,
      caption: req.caption,
      coordinate: req.coordinate,
      capturedAt: req.capturedAt,
    };
    mockDb.insertMemory(memory);
    return {ok: true, data: {memory}};
  }

  return request({method: 'POST', path: ENDPOINTS.memories.add, body: req});
}

async function getMemoriesByRide(rideId) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    return {ok: true, data: {memories: mockDb.listMemoriesForRide(rideId)}};
  }

  return request({method: 'GET', path: ENDPOINTS.memories.byRide(rideId)});
}

async function deleteMemory(memoryId) {
  if (CONFIG.useMockServices) {
    await simulateLatency();
    const ok = mockDb.deleteMemory(memoryId);
    if (!ok) {
      return {ok: false, error: {code: 'NOT_FOUND', message: `Memory ${memoryId} not found`}};
    }
    return {ok: true, data: {memoryId, deleted: true}};
  }

  return request({method: 'DELETE', path: ENDPOINTS.memories.delete(memoryId)});
}
