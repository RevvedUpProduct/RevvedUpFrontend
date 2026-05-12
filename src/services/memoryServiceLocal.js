/**
 * Offline memory API — no network. Confirmed objects are persisted by memoryStore (MMKV).
 */

function newMemoryId() {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function addMemory(req) {
  const memory = {
    id: newMemoryId(),
    rideId: req.rideId,
    imageUri: req.imageUri,
    caption: req.caption ?? null,
    coordinate: req.coordinate,
    capturedAt: req.capturedAt ?? new Date().toISOString(),
  };
  return {ok: true, data: {memory}};
}

export async function getMemoriesByRide(_rideId) {
  return {ok: true, data: {memories: []}};
}

export async function deleteMemory(_memoryId) {
  return {ok: true, data: {deleted: true}};
}
