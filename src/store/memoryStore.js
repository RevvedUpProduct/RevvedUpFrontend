import {create} from 'zustand';
import {memoryService} from '@services/memoryService';

const initialState = {
  byRide: {},
  isAdding: false,
  error: null,
};

export const useMemoryStore = create((set, get) => ({
  ...initialState,

  addMemory: async ({rideId, imageUri, coordinate, caption, capturedAt}) => {
    set({isAdding: true, error: null});
    const res = await memoryService.addMemory({
      rideId,
      imageUri,
      caption,
      coordinate,
      capturedAt: capturedAt ?? new Date().toISOString(),
    });

    if (!res.ok) {
      set({isAdding: false, error: res.error.message});
      return {ok: false, error: res.error.message};
    }

    const existing = get().byRide[rideId] ?? [];
    set({
      isAdding: false,
      byRide: {...get().byRide, [rideId]: [...existing, res.data.memory]},
    });
    return {ok: true, memory: res.data.memory};
  },

  loadMemoriesForRide: async (rideId) => {
    const res = await memoryService.getMemoriesByRide(rideId);
    if (!res.ok) {
      set({error: res.error.message});
      return;
    }
    set({byRide: {...get().byRide, [rideId]: res.data.memories}});
  },

  removeMemory: async (memoryId, rideId) => {
    const res = await memoryService.deleteMemory(memoryId);
    if (!res.ok) return {ok: false, error: res.error.message};
    const remaining = (get().byRide[rideId] ?? []).filter(m => m.id !== memoryId);
    set({byRide: {...get().byRide, [rideId]: remaining}});
    return {ok: true};
  },

  reset: () => set({...initialState}),
}));
