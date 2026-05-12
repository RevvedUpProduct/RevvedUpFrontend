import {create} from 'zustand';
import {memoryService} from '@services/memoryService';
import {readJSON, writeJSON, STORAGE_KEYS} from '@services/storage';

const initialState = {
  byRide: {},
  isAdding: false,
  error: null,
};

function readByRide() {
  const stored = readJSON(STORAGE_KEYS.MEMORIES);
  return stored?.byRide ?? {};
}

function writeByRide(byRide) {
  writeJSON(STORAGE_KEYS.MEMORIES, {byRide});
}

export const useMemoryStore = create((set, get) => ({
  ...initialState,

  hydrate: () => {
    const byRide = readByRide();
    set({byRide});
  },

  addMemory: async ({rideId, imageUri, coordinate, caption, capturedAt}) => {
    set({isAdding: true, error: null});

    const tempId = `local_${Date.now()}`;
    const optimistic = {
      id: tempId,
      rideId,
      imageUri,
      caption: caption ?? null,
      coordinate,
      capturedAt: capturedAt ?? new Date().toISOString(),
    };

    const prevByRide = get().byRide;
    const prevList = prevByRide[rideId] ?? [];
    const optimisticByRide = {...prevByRide, [rideId]: [...prevList, optimistic]};
    set({byRide: optimisticByRide});
    writeByRide(optimisticByRide);

    const res = await memoryService.addMemory({
      rideId,
      imageUri,
      caption,
      coordinate,
      capturedAt: optimistic.capturedAt,
    });

    if (!res.ok) {
      const reverted = {
        ...get().byRide,
        [rideId]: (get().byRide[rideId] ?? []).filter(m => m.id !== tempId),
      };
      set({isAdding: false, error: res.error.message, byRide: reverted});
      writeByRide(reverted);
      return {ok: false, error: res.error.message};
    }

    const serverMemory = res.data.memory;
    const currentList = get().byRide[rideId] ?? [];
    const confirmed = currentList.map(m => (m.id === tempId ? serverMemory : m));
    const confirmedByRide = {...get().byRide, [rideId]: confirmed};
    set({isAdding: false, byRide: confirmedByRide});
    writeByRide(confirmedByRide);
    return {ok: true, memory: serverMemory};
  },

  /**
   * Local-only phase: populate from MMKV only (no API read).
   */
  loadMemoriesForRide: rideId => {
    const stored = readByRide();
    const list = stored[rideId] ?? [];
    set(state => ({
      byRide: {...state.byRide, [rideId]: list},
    }));
  },

  /**
   * When the server assigns a canonical ride id, move optimistic memories off the provisional key.
   */
  rekeyRideMemories: (fromRideId, toRideId) => {
    if (!fromRideId || !toRideId || fromRideId === toRideId) return;
    const byRide = {...get().byRide};
    const moved = byRide[fromRideId];
    if (!moved?.length) {
      delete byRide[fromRideId];
      writeByRide(byRide);
      set({byRide});
      return;
    }
    const reTagged = moved.map(m => ({...m, rideId: toRideId}));
    const merged = [...(byRide[toRideId] ?? []), ...reTagged];
    delete byRide[fromRideId];
    byRide[toRideId] = merged;
    writeByRide(byRide);
    set({byRide});
  },

  removeMemory: async (memoryId, rideId) => {
    const before = get().byRide[rideId] ?? [];
    const after = before.filter(m => m.id !== memoryId);
    const updated = {...get().byRide, [rideId]: after};
    set({byRide: updated});
    writeByRide(updated);

    const res = await memoryService.deleteMemory(memoryId);
    if (!res.ok) {
      const reverted = {...get().byRide, [rideId]: before};
      set({byRide: reverted});
      writeByRide(reverted);
      return {ok: false, error: res.error.message};
    }
    return {ok: true};
  },

  reset: () => {
    set({...initialState});
  },
}));
