import {create} from 'zustand';
import {CONFIG} from '@constants/config';
import {rideService} from '@services/rideService';
import {currentSpeedKmh, haversineMeters} from '@utils/geo';

const initialMetrics = {
  distanceMeters: 0,
  durationMs: 0,
  currentSpeedKmh: 0,
  averageSpeedKmh: 0,
  maxSpeedKmh: 0,
};

const initialState = {
  rideId: null,
  status: 'idle',
  type: 'solo',
  startedAt: null,
  lastResumedAt: null,
  accumulatedDurationMs: 0,
  coordinates: [],
  metrics: initialMetrics,
  gpsStatus: 'idle',
  isSyncing: false,
  error: null,
};

export const useRideStore = create((set, get) => ({
  ...initialState,

  startRide: async ({type = 'solo', startCoordinate} = {}) => {
    const startedAt = new Date().toISOString();
    set({...initialState, type, status: 'recording', startedAt, lastResumedAt: Date.now(), isSyncing: true});

    const res = await rideService.startRide({type, startedAt, startCoordinate});
    if (!res.ok) {
      set({status: 'idle', isSyncing: false, error: res.error.message});
      return {ok: false, error: res.error.message};
    }
    set({
      rideId: res.data.ride.id,
      coordinates: startCoordinate ? [startCoordinate] : [],
      isSyncing: false,
      error: null,
    });
    return {ok: true};
  },

  pauseRide: () => {
    const {status, lastResumedAt, accumulatedDurationMs} = get();
    if (status !== 'recording' || lastResumedAt == null) return;
    set({
      status: 'paused',
      accumulatedDurationMs: accumulatedDurationMs + (Date.now() - lastResumedAt),
      lastResumedAt: null,
    });
  },

  resumeRide: () => {
    if (get().status !== 'paused') return;
    set({status: 'recording', lastResumedAt: Date.now()});
  },

  stopRide: async () => {
    const state = get();
    if (state.status === 'idle' || !state.rideId) {
      return {ok: false, error: 'No ride in progress'};
    }
    const endedAt = new Date().toISOString();
    const finalDuration =
      state.accumulatedDurationMs +
      (state.lastResumedAt ? Date.now() - state.lastResumedAt : 0);

    const finalMetrics = {
      ...state.metrics,
      durationMs: finalDuration,
      averageSpeedKmh:
        finalDuration > 0
          ? (state.metrics.distanceMeters / 1000) / (finalDuration / 3_600_000)
          : 0,
      currentSpeedKmh: 0,
    };

    set({isSyncing: true});
    const res = await rideService.stopRide(state.rideId, {
      endedAt,
      finalCoordinates: state.coordinates,
      metrics: finalMetrics,
    });

    if (!res.ok) {
      set({isSyncing: false, error: res.error.message});
      return {ok: false, error: res.error.message};
    }

    set({
      status: 'completed',
      isSyncing: false,
      metrics: finalMetrics,
      accumulatedDurationMs: finalDuration,
      lastResumedAt: null,
    });
    return {ok: true, ride: res.data.ride};
  },

  appendCoordinate: (coord) => {
    const state = get();
    if (state.status !== 'recording') return;

    if (coord.accuracy != null && coord.accuracy > CONFIG.ride.maxAccuracyMeters) return;

    const prev = state.coordinates[state.coordinates.length - 1];
    if (prev) {
      const segmentMeters = haversineMeters(prev, coord);
      if (segmentMeters < CONFIG.ride.minDistanceMeters) return;

      const newCoords = [...state.coordinates, coord];
      const newDistance = state.metrics.distanceMeters + segmentMeters;

      const inst = currentSpeedKmh(newCoords);
      const clampedInst = Math.min(inst, CONFIG.ride.maxPlausibleSpeedKmh);
      const maxSpeed = Math.max(state.metrics.maxSpeedKmh, clampedInst);

      const liveDuration =
        state.accumulatedDurationMs +
        (state.lastResumedAt ? Date.now() - state.lastResumedAt : 0);
      const avg =
        liveDuration > 0 ? (newDistance / 1000) / (liveDuration / 3_600_000) : 0;

      set({
        coordinates: newCoords,
        metrics: {
          distanceMeters: newDistance,
          durationMs: liveDuration,
          currentSpeedKmh: clampedInst,
          averageSpeedKmh: avg,
          maxSpeedKmh: maxSpeed,
        },
      });
    } else {
      set({coordinates: [coord]});
    }
  },

  tick: () => {
    const state = get();
    if (state.status !== 'recording' || state.lastResumedAt == null) return;
    const liveDuration = state.accumulatedDurationMs + (Date.now() - state.lastResumedAt);
    const avg =
      liveDuration > 0
        ? (state.metrics.distanceMeters / 1000) / (liveDuration / 3_600_000)
        : 0;
    set({
      metrics: {...state.metrics, durationMs: liveDuration, averageSpeedKmh: avg},
    });
  },

  setGpsStatus: (gpsStatus) => set({gpsStatus}),
  reset: () => set({...initialState}),
}));
