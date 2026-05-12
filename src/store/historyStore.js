import {create} from 'zustand';
import {readJSON, writeJSON, STORAGE_KEYS} from '@services/storage';

const initialState = {
  rides: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  filter: 'all',
};

export const useHistoryStore = create((set, get) => ({
  ...initialState,

  /**
   * Boot: read ride list from MMKV only (no network in local-only phase).
   */
  hydrate: () => {
    const cached = readJSON(STORAGE_KEYS.RIDES);
    if (cached) {
      set({rides: cached});
    }
  },

  /**
   * Re-read history list from MMKV (e.g. after external writes).
   */
  load: () => {
    const cached = readJSON(STORAGE_KEYS.RIDES);
    set({rides: cached ?? [], isLoading: false, error: null});
  },

  /**
   * Pull-to-refresh: re-load from disk only (no API).
   */
  refresh: async () => {
    set({isRefreshing: true, error: null});
    const cached = readJSON(STORAGE_KEYS.RIDES);
    set({rides: cached ?? [], isRefreshing: false, error: null});
  },

  persistRide: ride => {
    const summary = {
      id: ride.id,
      type: ride.type ?? 'solo',
      startedAt: ride.startedAt,
      endedAt: ride.endedAt,
      distanceMeters: ride.metrics?.distanceMeters ?? 0,
      durationMs: ride.metrics?.durationMs ?? 0,
      startLocationLabel: ride.startLocationLabel ?? null,
      endLocationLabel: ride.endLocationLabel ?? null,
      memoryCount: ride.memoryIds?.length ?? 0,
    };

    const current = get().rides;
    const exists = current.some(r => r.id === summary.id);
    const updated = exists
      ? current.map(r => (r.id === summary.id ? summary : r))
      : [summary, ...current];

    writeJSON(STORAGE_KEYS.RIDES, updated);
    set({rides: updated});
  },

  persistRideDetail: ride => {
    writeJSON(STORAGE_KEYS.rideDetail(ride.id), ride);
  },

  getRideDetailFromCache: rideId => {
    return readJSON(STORAGE_KEYS.rideDetail(rideId));
  },

  setFilter: filter => set({filter}),
}));
