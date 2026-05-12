import {create} from 'zustand';
import {CONFIG} from '@constants/config';
import {rideService} from '@services/rideService';
import {snapCoordinatesToRoads} from '@services/roadsSnapService';
import {writeJSON, deleteKey, STORAGE_KEYS} from '@services/storage';
import {useHistoryStore} from '@store/historyStore';
import {useMemoryStore} from '@store/memoryStore';
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
    // Provisional id so UI (end ride, memories) works before POST /rides/start returns
    // (slow network / cold backend). Replaced by server id when the call succeeds.
    const provisionalRideId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    set({
      ...initialState,
      type,
      status: 'recording',
      startedAt,
      lastResumedAt: Date.now(),
      isSyncing: true,
      rideId: provisionalRideId,
    });
    _persistActiveRide(get());

    const res = await rideService.startRide({type, startedAt, startCoordinate});
    if (!res.ok) {
      set({...initialState, status: 'idle', isSyncing: false, error: res.error.message});
      deleteKey(STORAGE_KEYS.ACTIVE_RIDE);
      return {ok: false, error: res.error.message};
    }

    const serverRideId = res.data?.ride?.id;
    if (!serverRideId) {
      const message = 'Ride did not start — missing ride id from server.';
      set({...initialState, status: 'idle', isSyncing: false, error: message});
      deleteKey(STORAGE_KEYS.ACTIVE_RIDE);
      return {ok: false, error: message};
    }

    if (serverRideId !== provisionalRideId) {
      useMemoryStore.getState().rekeyRideMemories(provisionalRideId, serverRideId);
    }

    const coords = startCoordinate ? [startCoordinate] : [];
    set({rideId: serverRideId, coordinates: coords, isSyncing: false, error: null});

    // Persist active ride state to MMKV for crash recovery.
    _persistActiveRide(get());
    return {ok: true};
  },

  pauseRide: () => {
    const {status, lastResumedAt, accumulatedDurationMs} = get();
    if (status !== 'recording' || lastResumedAt == null) return;
    const next = {
      status: 'paused',
      accumulatedDurationMs: accumulatedDurationMs + (Date.now() - lastResumedAt),
      lastResumedAt: null,
    };
    set(next);
    _persistActiveRide({...get(), ...next});
  },

  resumeRide: () => {
    if (get().status !== 'paused') return;
    const next = {status: 'recording', lastResumedAt: Date.now()};
    set(next);
    _persistActiveRide({...get(), ...next});
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

    const rawCoordinates = [...state.coordinates];
    const snapRes = await snapCoordinatesToRoads(rawCoordinates);
    const snappedOk = snapRes.ok && Array.isArray(snapRes.coordinates) && snapRes.coordinates.length >= 2;
    const displayCoordinates = snappedOk ? snapRes.coordinates : rawCoordinates;
    const coordinatesRaw = snappedOk ? rawCoordinates : undefined;

    // ── Local-first: write the completed ride to MMKV immediately ────────────
    // displayCoordinates = Google Roads snap when configured; else raw GPS trace.
    const memoryList = useMemoryStore.getState().byRide[state.rideId] ?? [];
    const memoryIds = memoryList.map(m => m.id);
    const localRide = {
      id: state.rideId,
      status: 'completed',
      type: state.type,
      startedAt: state.startedAt,
      endedAt,
      coordinates: displayCoordinates,
      ...(coordinatesRaw ? {coordinatesRaw} : {}),
      metrics: finalMetrics,
      memoryIds,
      startLocationLabel: null,
      endLocationLabel: null,
    };

    const historyStore = useHistoryStore.getState();
    historyStore.persistRide(localRide);
    historyStore.persistRideDetail(localRide);
    // ────────────────────────────────────────────────────────────────────────

    set({isSyncing: true});
    const res = await rideService.stopRide(state.rideId, {
      endedAt,
      finalCoordinates: displayCoordinates,
      ...(coordinatesRaw ? {coordinatesRaw} : {}),
      metrics: finalMetrics,
      startedAt: state.startedAt,
      type: state.type,
      memoryIds,
    });

    if (!res.ok) {
      // The local copy is already saved. Just report the sync error — the
      // ride is NOT lost.
      set({
        status: 'completed',
        isSyncing: false,
        error: res.error.message,
        metrics: finalMetrics,
        accumulatedDurationMs: finalDuration,
        lastResumedAt: null,
      });
      deleteKey(STORAGE_KEYS.ACTIVE_RIDE);
      // Return the locally-saved ride so the UI can still navigate to summary.
      return {ok: true, ride: localRide, syncError: res.error.message};
    }

    // Sync succeeded: update local cache with any server-computed fields
    const serverRide = res.data.ride;
    const mergedRide =
      coordinatesRaw != null && serverRide != null && !serverRide.coordinatesRaw
        ? {...serverRide, coordinatesRaw}
        : serverRide;
    historyStore.persistRide(mergedRide);
    historyStore.persistRideDetail(mergedRide);

    set({
      status: 'completed',
      isSyncing: false,
      metrics: finalMetrics,
      accumulatedDurationMs: finalDuration,
      lastResumedAt: null,
    });
    deleteKey(STORAGE_KEYS.ACTIVE_RIDE);
    return {ok: true, ride: mergedRide};
  },

  /**
   * @returns {boolean} true if the fix was stored (affects GPS pill / health UX).
   */
  appendCoordinate: coord => {
    const state = get();
    if (state.status !== 'recording') {
      return false;
    }

    if (coord.accuracy != null && coord.accuracy > CONFIG.ride.maxAccuracyMeters) {
      return false;
    }

    const prev = state.coordinates[state.coordinates.length - 1];
    if (prev) {
      const segmentMeters = haversineMeters(prev, coord);

      if (CONFIG.ride.rejectImpossibleSegments !== false) {
        const t0 = prev.timestamp;
        const t1 = coord.timestamp;
        if (t0 != null && t1 != null) {
          const dtMs = t1 - t0;
          const maxGapMs = CONFIG.ride.maxSegmentTimeGapMs ?? 180_000;
          if (dtMs > 0 && dtMs < maxGapMs) {
            const speedKmh = (segmentMeters / (dtMs / 1000)) * 3.6;
            if (speedKmh > CONFIG.ride.maxPlausibleSpeedKmh) {
              return false;
            }
          }
        }
      }

      if (segmentMeters < CONFIG.ride.minDistanceMeters) {
        return false;
      }

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

      const next = {
        coordinates: newCoords,
        metrics: {
          distanceMeters: newDistance,
          durationMs: liveDuration,
          currentSpeedKmh: clampedInst,
          averageSpeedKmh: avg,
          maxSpeedKmh: maxSpeed,
        },
      };
      set(next);
      // Persist first point + every 10th for crash recovery without excessive I/O.
      if (newCoords.length === 1 || newCoords.length % 10 === 0) {
        _persistActiveRide({...get(), ...next});
      }
      return true;
    }

    const next = {coordinates: [coord]};
    set(next);
    _persistActiveRide({...get(), ...next});
    return true;
  },

  tick: () => {
    const state = get();
    if (state.status !== 'recording' || state.lastResumedAt == null) return;
    const liveDuration = state.accumulatedDurationMs + (Date.now() - state.lastResumedAt);
    const avg =
      liveDuration > 0
        ? (state.metrics.distanceMeters / 1000) / (liveDuration / 3_600_000)
        : 0;
    set({metrics: {...state.metrics, durationMs: liveDuration, averageSpeedKmh: avg}});
  },

  setGpsStatus: gpsStatus => set({gpsStatus}),

  /**
   * Restore in-progress ride from MMKV (cold start / resume). Caller should navigate to RideRecording.
   * @param {object} snap payload from ACTIVE_RIDE key
   */
  restoreFromActiveRideSnapshot: snap => {
    if (!snap?.rideId || !snap?.startedAt) {
      return false;
    }
    const st = snap.status;
    if (st !== 'recording' && st !== 'paused') {
      return false;
    }
    const coordinates = Array.isArray(snap.coordinates) ? snap.coordinates : [];
    const metrics = snap.metrics && typeof snap.metrics === 'object' ? {...initialMetrics, ...snap.metrics} : {...initialMetrics};
    const paused = st === 'paused';
    set({
      ...initialState,
      rideId: snap.rideId,
      type: snap.type ?? 'solo',
      status: paused ? 'paused' : 'recording',
      startedAt: snap.startedAt,
      lastResumedAt: paused ? null : Date.now(),
      accumulatedDurationMs: snap.accumulatedDurationMs ?? 0,
      coordinates,
      metrics,
      gpsStatus: 'searching',
      isSyncing: false,
      error: null,
    });
    _persistActiveRide(get());
    return true;
  },

  reset: () => {
    deleteKey(STORAGE_KEYS.ACTIVE_RIDE);
    set({...initialState});
  },
}));

// ── Private helpers ───────────────────────────────────────────────────────────

function _persistActiveRide(state) {
  if (!state.rideId) return;
  writeJSON(STORAGE_KEYS.ACTIVE_RIDE, {
    rideId: state.rideId,
    status: state.status,
    type: state.type,
    startedAt: state.startedAt,
    accumulatedDurationMs: state.accumulatedDurationMs,
    coordinates: state.coordinates,
    metrics: state.metrics,
  });
}
