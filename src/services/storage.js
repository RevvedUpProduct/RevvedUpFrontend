import {createMMKV} from 'react-native-mmkv';

/**
 * Single shared MMKV instance for the app.
 *
 * MMKV reads are synchronous, so stores hydrate instantly at boot — no
 * loading state needed in the UI.
 *
 * Why v4 (createMMKV) and not v2 (new MMKV()):
 * RN 0.79 + new architecture defaults to **bridgeless mode**, where the
 * legacy `global.nativeCallSyncHook` JSI handle no longer exists. v2 of
 * react-native-mmkv checks for that hook and throws if missing. v4 is
 * built on top of `react-native-nitro-modules`, which works correctly
 * under bridgeless.
 */
export const storage = createMMKV({id: 'revvedup'});

// ── Key constants ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  /** JSON array of RideSummary objects (history list). */
  RIDES: 'rides',
  /** JSON of full Ride object (with coordinates). Key: rides/{id} */
  rideDetail: id => `rides/${id}`,
  /** JSON of { byRide: { rideId: Memory[] } } */
  MEMORIES: 'memories',
  /** JSON of active in-progress ride state (for crash recovery). */
  ACTIVE_RIDE: 'active_ride',
  /** Profile hub: { displayName, email } */
  PROFILE: 'profile',
  /** { bikes: [...] } */
  GARAGE: 'garage',
  /** Emergency & medical JSON */
  EMERGENCY: 'emergency',
  /** Rider gear + intercom JSON */
  RIDER_GEAR: 'rider_gear',
};

// ── JSON helpers ──────────────────────────────────────────────────────────────

/**
 * Read a JSON value from MMKV. Returns null if the key is absent or the
 * stored string is not valid JSON.
 */
export function readJSON(key) {
  try {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Write a JSON-serialisable value to MMKV.
 */
export function writeJSON(key, value) {
  storage.set(key, JSON.stringify(value));
}

/**
 * Delete a key from MMKV.
 * NOTE: v4's API renamed `delete` → `remove`.
 */
export function deleteKey(key) {
  storage.remove(key);
}
