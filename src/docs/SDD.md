# RevvedUp — Software Design Document (SDD)

> Version: `0.2.0`
> Last updated: 2026-05-02
> Owner: RevvedUp mobile team
> Status: **Living document.** Update this file every time a feature ships or a design decision changes.

---

## 1. Purpose & scope

RevvedUp is a motorcycle ride-companion mobile app. v0.1 ships:

1. **Ride tracking** — record GPS routes with live distance / duration / speed.
2. **Memory snapshots** — pin photos to map coordinates during a ride.
3. **Ride history** — browse and revisit completed rides on a map.

Out of scope for v0.1: authentication, group rides (real-time peer location), social feeds, offline tile caching, background tracking, image uploads.

---

## 2. Tech stack

| Concern              | Choice                                             | Rationale                                                  |
|----------------------|----------------------------------------------------|------------------------------------------------------------|
| Mobile framework     | React Native CLI 0.79 (no Expo)                    | Native modules ship without ejecting                       |
| Language             | **JavaScript (ES2022)**                            | Converted from TypeScript — no `tsc` in CI, lower tooling friction for v0.1 |
| State management     | Zustand 5                                          | Minimal API, one store per feature, no boilerplate         |
| Navigation           | `@react-navigation/native-stack`                   | Native transitions, gesture control per screen             |
| Maps                 | `react-native-maps` + `PROVIDER_GOOGLE` (Android)  | Native polyline rendering, `fitToCoordinates` for summary  |
| Geolocation          | `@react-native-community/geolocation`              | Battle-tested foreground tracking                          |

### Screen / navigation map

```
Home
├── RideRecording (gesture-back disabled, fade_from_bottom)
│   └── RideSummary  (replace — no back to live ride)
├── History
│   └── RideDetail
│       └── Memories
└── Memories (standalone, no rideId → shows all)
```

### Module map

```
src/
├── features/
│   ├── home/          HomeScreen
│   ├── ride/          RideRecordingScreen, RideSummaryScreen,
│   │                  RideMap, RideMetricsBar, RideControls,
│   │                  useRideTracker, geolocation
│   ├── memory/        MemoriesScreen, AddMemorySheet
│   └── history/       RideHistoryScreen, RideDetailScreen,
│                      RideHistoryItem
├── components/        Button, Card, BottomSheet, MetricTile,
│                      ScreenContainer, SectionHeader, StatusPill,
│                      IconButton
├── navigation/        RootNavigator
├── services/          apiClient, rideService, memoryService, mockDb
├── store/             rideStore, memoryStore, historyStore
├── constants/         colors, spacing, strings, config, endpoints
├── utils/             geo (haversine, speed), format, id
└── docs/              SDD (this file), API_CONTRACT.md
```

> `src/types/` was removed when the codebase was converted from TypeScript to JavaScript. Type contracts are documented in `API_CONTRACT.md` instead.

---

## 3. Cross-cutting concerns

### 3.1 Theming

- **Dark theme only** — derived from Figma design tokens (`oklch` → sRGB hex).
- All colour tokens live in `src/constants/colors.js`. No hex literals anywhere else.
- 8pt spacing grid (`SPACING`) and a font scale (`FONT`) keep visuals consistent.
- Map uses `MAP_DARK_STYLE` (array of Google Maps style rules) exported from `colors.js`.

### 3.2 State management

One Zustand store per feature concern:

| Store            | Owns                                      | Key actions                                              |
|------------------|-------------------------------------------|----------------------------------------------------------|
| `useRideStore`   | Active ride (recording / paused / done)   | `startRide`, `pauseRide`, `resumeRide`, `stopRide`, `appendCoordinate`, `tick`, `reset` |
| `useMemoryStore` | Snapshots cached per ride (`byRide: {}`)  | `addMemory`, `loadMemoriesForRide`, `removeMemory`       |
| `useHistoryStore`| Paged completed-ride list                 | `load`, `refresh`, `setFilter`                           |

**Zustand selector rule**: selectors that may return a new array/object when the underlying key is absent **must** use a module-level stable reference as the fallback — never an inline `[]` or `{}` literal. `useSyncExternalStore` (used internally by Zustand 5) compares snapshots with `Object.is`; an inline literal fails that check every render and causes an infinite re-render loop.

```js
// ✅ correct — EMPTY_MEMORIES is the same reference every call
const EMPTY_MEMORIES = Object.freeze([]);
const memories = useMemoryStore(s => s.byRide[rideId] ?? EMPTY_MEMORIES);

// ❌ wrong — new [] on every selector call → infinite loop
const memories = useMemoryStore(s => s.byRide[rideId] ?? []);
```

### 3.3 Service layer

- All HTTP calls go through `services/apiClient.js`, which returns `ApiResponse<T>`.
- `CONFIG.useMockServices` (in `src/constants/config.js`) switches between real HTTP and the in-memory mock at build time. No other changes are needed to go live.
- Mock implementations in `rideService.js` / `memoryService.js` back onto `mockDb.js` (a plain `Map`-backed class).
- All mocks wrap responses in `simulateLatency()` (200–700 ms) so network-dependent UX paths are exercised in dev.
- `src/constants/endpoints.js` is the single source of truth for all URL paths.

### 3.4 Engineering practices

- **No inline styles** — all components use `StyleSheet.create`.
- **No hardcoded values** — all colours, spacing, strings, and config live in `src/constants/`.
- **Path aliases** — `@components/*`, `@features/*`, `@store/*`, `@services/*`, `@constants/*`, `@utils/*` via `babel.config.js` `module-resolver`.
- **No try/catch for API calls** — `apiClient.js` returns a discriminated `{ok, data}` / `{ok, error}` union; callers branch on `res.ok`.

---

## 4. Feature: Ride tracking

### 4.1 Problem statement

Riders need to record where they went, how far, and how fast — without touching their phone while riding. The recording flow must be glanceable, glove-friendly, and resilient to brief GPS signal loss.

### 4.2 UI flow

1. **Home** → tap **Start Ride** (large FAB).
2. `RideRecordingScreen` pushes with `gesture-back: false` (prevents accidental dismissal).
3. Screen auto-calls `useRideStore.startRide()` on mount via a `useRef`-guarded `useEffect` (the `hasAutoStarted` ref prevents re-triggering if the service call fails and `status` reverts to `idle`).
4. `useRideTracker` starts the GPS provider. Live fixes flow into `appendCoordinate`.
5. `RideMap` re-centres on each new fix (`follow={true}`). `RideMetricsBar` shows Distance / Duration / Speed. `RideControls` exposes Pause / Camera / Stop.
6. **Stop** → `Alert` confirmation → `stopRide()` → `navigation.replace('RideSummary', { rideId })`.
7. `RideSummaryScreen` fetches the full ride from the service, renders the polyline with `fitToRoute={true}` (map auto-zooms to contain the entire route), headline metrics, and any memories pinned during the ride.

### 4.3 State (`useRideStore`)

| Key                     | Purpose                                                              |
|-------------------------|----------------------------------------------------------------------|
| `rideId`                | ID returned from `POST /rides/start`                                 |
| `status`                | `idle \| recording \| paused \| completed`                           |
| `type`                  | `"solo" \| "group"`                                                  |
| `coordinates`           | Accuracy- and distance-filtered `TrackedCoordinate[]`                |
| `metrics`               | `{ distanceMeters, durationMs, currentSpeedKmh, averageSpeedKmh, maxSpeedKmh }` |
| `lastResumedAt`         | Wall-clock anchor for current segment duration                       |
| `accumulatedDurationMs` | Duration banked before the current segment (pause-aware)             |
| `gpsStatus`             | `idle \| searching \| active \| lost`                                |
| `isSyncing`             | `true` while a service call is in flight                             |
| `error`                 | Last service error message, or `null`                                |

### 4.4 GPS provider (`geolocation.js`)

Two providers, swapped by `CONFIG.useMockServices`:

| Provider                          | When used         | Behaviour                                                                     |
|-----------------------------------|-------------------|-------------------------------------------------------------------------------|
| `createNativeGeolocationProvider` | real device       | `watchPosition` with `enableHighAccuracy`, 5 m `distanceFilter`, 1.5 s interval |
| `createSimulatedGeolocationProvider` | mock / emulator | Increments lat/lng north-east from Mumbai (~16–22 km/h jitter) every 1.5 s   |

### 4.5 Tracking algorithm

1. **Sampling**: GPS provider emits a `TrackedCoordinate` every ~1.5 s.
2. **Accuracy filter**: drop fixes with `accuracy > CONFIG.ride.maxAccuracyMeters` (30 m default).
3. **Distance filter**: drop fixes within `CONFIG.ride.minDistanceMeters` (5 m) of the previous fix to suppress stationary jitter.
4. **Distance**: incremental Haversine — `dist += haversineMeters(prev, current)`.
5. **Duration**: `accumulatedDurationMs + (Date.now() - lastResumedAt)` — pause-safe.
6. **Instant speed**: Haversine over Δt, clamped to `maxPlausibleSpeedKmh` (250).
7. **Average speed**: `(distKm) / (durationHrs)` — recomputed on every fix and every `tick`.
8. **Max speed**: running `Math.max`.
9. **1 Hz tick**: a `setInterval` in `useRideTracker` keeps on-screen duration updating even through tunnels when no new fix arrives.

### 4.6 Map component (`RideMap`)

| Prop          | Default | Purpose                                                                  |
|---------------|---------|--------------------------------------------------------------------------|
| `coordinates` | —       | `TrackedCoordinate[]` from the store or fetched ride                     |
| `memories`    | `[]`    | `MemorySnapshot[]` — rendered as map pins                                |
| `follow`      | `true`  | When `true`, camera animates to the last coordinate on each new fix      |
| `fitToRoute`  | `false` | When `true`, calls `fitToCoordinates` on `onMapReady` to show full route |

`fitToRoute={true}` is used on `RideSummaryScreen` and `RideDetailScreen`. The edge padding is 80 dp top/bottom, 60 dp left/right so the start/end markers aren't clipped.

On `fitToRoute` screens, `showsUserLocation` is suppressed (the blue dot doesn't belong on a historical route view).

### 4.7 API calls

| Action         | Endpoint                          | Notes                                   |
|----------------|-----------------------------------|-----------------------------------------|
| `startRide`    | `POST /rides/start`               |                                         |
| `stopRide`     | `POST /rides/:rideId/stop`        | Sends full `coordinates` array          |
| *(future)*     | `PATCH /rides/:rideId/coordinates`| Not yet called; see Improvements        |
| History load   | `GET /rides`                      |                                         |
| Detail / summary | `GET /rides/:rideId`            | Returns full coordinate polyline        |

### 4.8 Known bugs fixed in v0.1

| Bug | Root cause | Fix applied |
|-----|-----------|-------------|
| Infinite re-render on `RideSummaryScreen` / `RideDetailScreen` | `useMemoryStore(s => s.byRide[rideId] ?? [])` returned a new `[]` reference every selector call, failing `Object.is` comparison in `useSyncExternalStore` | Hoisted `const EMPTY_MEMORIES = Object.freeze([])` to module scope in both files |
| Polyline missing on summary map | `stopRide` passed `finalCoordinates: []` (hardcoded empty) to the service; the mock DB never stored the recorded coordinates | Changed to `finalCoordinates: state.coordinates` |

### 4.9 Edge cases

- **GPS not yet fixed when Start is tapped**: `startCoordinate` is `null`; recording begins and the first valid fix populates the polyline.
- **Signal lost mid-ride**: `gpsStatus → 'lost'`; recording continues — the polyline resumes seamlessly when fixes return.
- **Pause then phone-lock**: `accumulatedDurationMs` is correct; duration resumes from the right place on unlock.
- **Stop service failure**: ride remains `recording`; the `Alert` shows the error and lets the user retry without data loss.
- **GPS jitter / accuracy spikes**: both accuracy and distance filters guard the polyline.

### 4.10 Future improvements

- Background location (Android Foreground Service + `UIBackgroundModes: location` on iOS).
- Crash-safe checkpoint: persist `useRideStore` state to AsyncStorage every 30 s.
- Auto-pause when speed = 0 for > 60 s.
- Progressive coordinate streaming via `PATCH /rides/:rideId/coordinates` (avoid large payload at stop for long rides).
- Elevation profile — `altitude` is already captured in `TrackedCoordinate`.
- Per-km splits / lap timer.

---

## 5. Feature: Memory snapshots

### 5.1 Problem statement

Riders want to remember *where* the perfect view, the breakfast stop, the unexpected detour happened — spatially, not just chronologically. Each memory must live on the map at the exact coordinate it was taken.

### 5.2 UI flow

1. From `RideRecordingScreen`, tap the **camera button** (centre of `RideControls`).
2. `AddMemorySheet` (a `BottomSheet`) opens: image preview area, "Pick from gallery" (mock — returns a static placeholder URI), optional caption input, Save.
3. Save → `useMemoryStore.addMemory({ rideId, imageUri, caption, coordinate, capturedAt })`.
4. On success, store appends the new memory to `byRide[rideId]` and the sheet closes.
5. The marker appears on the live `RideMap` immediately (no refetch needed — store is source of truth).
6. On `RideSummaryScreen` / `RideDetailScreen`, memories render as map pins **and** as a tiled grid section.

### 5.3 State (`useMemoryStore`)

```
byRide:    Record<string, MemorySnapshot[]>  // keyed by rideId
isAdding:  boolean
error:     string | null
```

Actions: `addMemory`, `loadMemoriesForRide`, `removeMemory`, `reset`.

> **Selector stability rule applies here too.** Always use a stable fallback constant, not an inline `[]` (see Section 3.2).

### 5.4 API calls

| Action              | Endpoint                      |
|---------------------|-------------------------------|
| `addMemory`         | `POST /memories`              |
| `loadMemoriesForRide` | `GET /rides/:rideId/memories` |
| `removeMemory`      | `DELETE /memories/:memoryId`  |

### 5.5 Edge cases

- **No active ride**: Save button is disabled; `rideId` is read from `useRideStore`.
- **No GPS fix yet**: Save disabled until a coordinate is available.
- **Image picker cancelled**: sheet stays open, no state change.
- **Network failure**: `error` field set on store; sheet stays open for retry.

### 5.6 Future improvements

- Real image picker (`react-native-image-picker`) with camera + gallery sources.
- Image upload to a CDN via presigned URL from backend; `imageUri` then points to the CDN.
- Memory clustering at low zoom levels.
- Tap map marker → in-place lightbox (currently navigates to the `Memories` screen).
- Swipe-to-delete in the memory list.

---

## 6. Feature: Ride history

### 6.1 Problem statement

A rider's history is the most-revisited surface. The list must load instantly, feel native via pull-to-refresh, and let users filter Solo vs Group rides.

### 6.2 UI flow

1. **Home** → "View all" link opens `RideHistoryScreen`.
2. Header shows title, filter chips (All / Solo / Group), and a summary totals card.
3. `FlatList` of `RideHistoryItem` rows — each shows distance, duration, start label, date.
4. Pull-to-refresh calls `historyStore.refresh()`.
5. Tapping a row pushes `RideDetailScreen` with `{ rideId }`.
6. `RideDetailScreen` fetches the full ride (with polyline) on mount, renders `RideMap` with `fitToRoute={true}`, headline metrics, and the memories grid.

### 6.3 State (`useHistoryStore`)

```
rides:        RideSummary[]
isLoading:    boolean
isRefreshing: boolean
error:        string | null
filter:       "all" | "solo" | "group"
```

> **Current limitation**: `filter` is applied client-side only. `load()` always fetches all rides without passing the filter to the API. This is fine while the data fits in one page, but must be fixed before pagination lands (see Improvements).

### 6.4 API calls

| Action    | Endpoint      |
|-----------|---------------|
| `load`    | `GET /rides`  |
| `refresh` | `GET /rides`  |

### 6.5 Edge cases

- **No rides yet**: empty-state card ("No rides yet — your first journey awaits.").
- **Load failure**: error shown in list area; pull-to-refresh retries.
- **Large lists**: `FlatList` virtualisation prevents memory issues; infinite scroll is a v0.2 task.

### 6.6 Future improvements

- Pass `filter` to `GET /rides?type=…` and add server-side pagination with infinite scroll.
- Search by location label.
- Calendar grouping (Today / This Week / This Month / older).
- Aggregate analytics tile: total distance, total time, avg speed across a time window.

---

## 7. Feature: Group rides (placeholder)

Stubbed for v0.2. Will reuse the `Ride` model with `type: 'group'` and add a real-time peer-location channel (Supabase Realtime or Firebase RTDB). The data model is already forward-compatible — `RideType = "solo" | "group"` is in use throughout.

---

## 8. Open questions / decisions pending

| # | Question | Status |
|---|----------|--------|
| 1 | Background tracking | Deferred to v0.2. Android: Foreground Service. iOS: `UIBackgroundModes: location`. |
| 2 | State persistence | Deferred to v0.2. Use Zustand `persist` middleware + AsyncStorage. |
| 3 | Auth | Deferred. Mocks assume a single anonymous user. Will add JWT Bearer header in `apiClient.js`. |
| 4 | Crash safety | Deferred to v0.2. Checkpoint `useRideStore` to AsyncStorage every 30 s. |
| 5 | Image upload | Deferred. Need CDN + presigned URL flow before `POST /memories` goes live. |
| 6 | Coordinate streaming | `PATCH /rides/:rideId/coordinates` is in the service layer but not yet called. Should flush every 50 fixes to keep stop-time payload small. |
| 7 | Server-side history filter | `historyStore` currently ignores `filter` when calling `GET /rides`. Must pass `type` query param before pagination. |
| 8 | GPS permissions UX | No real permission request in v0.1. Use `react-native-permissions` before `startRide`. |
