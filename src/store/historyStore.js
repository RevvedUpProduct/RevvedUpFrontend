import {create} from 'zustand';
import {rideService} from '@services/rideService';

const initialState = {
  rides: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  filter: 'all',
};

export const useHistoryStore = create((set, get) => ({
  ...initialState,

  load: async () => {
    if (get().isLoading) return;
    set({isLoading: true, error: null});
    const res = await rideService.getRideHistory({});
    if (!res.ok) {
      set({isLoading: false, error: res.error.message});
      return;
    }
    set({rides: res.data.rides, isLoading: false});
  },

  refresh: async () => {
    set({isRefreshing: true, error: null});
    const res = await rideService.getRideHistory({});
    if (!res.ok) {
      set({isRefreshing: false, error: res.error.message});
      return;
    }
    set({rides: res.data.rides, isRefreshing: false});
  },

  setFilter: (filter) => set({filter}),
}));
