# RevvedUp — API Contract

> Version: `0.2.0`
> Last updated: 2026-05-02
> Status: **Mocked.** All endpoints are implemented as in-memory JavaScript services in `src/services/`. To go live, set `CONFIG.useMockServices = false` in `src/constants/config.js` and point `CONFIG.api.baseUrl` at the real server — no other frontend changes are needed.

---

## Conventions

- **Base URL**: `https://api.revvedup.app/v1` (overridable via `CONFIG.api.baseUrl`).
- **Content-Type**: `application/json` for all requests and responses.
- **Auth**: Out of scope for v0.1. v0.2 will add `Authorization: Bearer <jwt>` on every request.
- **Timestamps**: ISO 8601 UTC strings — `2026-05-02T12:30:00.000Z`.
- **IDs**: Opaque strings prefixed by entity type — `ride_…`, `mem_…`.
- **Error shape** (all non-2xx):
  ```json
  {
    "error": {
      "code": "NOT_FOUND | VALIDATION | UNAUTHORIZED | CONFLICT | SERVER_ERROR",
      "message": "Human-readable description",
      "requestId": "req_abc123",
      "details": {}
    }
  }
  ```
- **Client envelope**: `apiClient.js` wraps every real HTTP call in a discriminated union so callers never `try/catch`:
  ```
  ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError }
  ```

---

## Shared types

```
Coordinate = {
  latitude:  number   // decimal degrees
  longitude: number
}

TrackedCoordinate = Coordinate & {
  timestamp: number   // ms since epoch (Date.now())
  speed?:    number   // m/s from GPS
  accuracy?: number   // meters — lower is better
  altitude?: number   // meters above sea level
  heading?:  number   // degrees 0–360, 0 = north
}

RideMetrics = {
  distanceMeters:   number
  durationMs:       number
  currentSpeedKmh:  number   // 0 when stopped
  averageSpeedKmh:  number
  maxSpeedKmh:      number
}

RideType   = "solo" | "group"
RideStatus = "recording" | "paused" | "completed" | "discarded"

Ride = {
  id:                 string
  status:             RideStatus
  type:               RideType
  startedAt:          string            // ISO timestamp
  endedAt:            string | null
  coordinates:        TrackedCoordinate[]
  metrics:            RideMetrics
  memoryIds:          string[]
  startLocationLabel: string | null     // backend reverse-geocodes this
  endLocationLabel:   string | null
}

RideSummary = {
  id:                 string
  type:               RideType
  startedAt:          string
  endedAt:            string | null
  distanceMeters:     number
  durationMs:         number
  startLocationLabel: string | null
  endLocationLabel:   string | null
  memoryCount:        number
}

MemorySnapshot = {
  id:          string
  rideId:      string
  imageUri:    string    // publicly accessible URL
  caption:     string | null
  coordinate:  Coordinate
  capturedAt:  string    // ISO timestamp
}
```

---

## Rides

### `POST /rides/start`

Called immediately when the user taps **Start Ride**. Returns a new `Ride` with `status: "recording"`.

**Request**
```json
{
  "type": "solo",
  "startedAt": "2026-05-02T08:00:00.000Z",
  "startCoordinate": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "timestamp": 1746172800000,
    "accuracy": 8,
    "speed": 0
  }
}
```

> `startCoordinate` is `null` when the first GPS fix hasn't arrived yet. The frontend populates it if a fix is already available when the user taps Start.

**Response — 201 Created**
```json
{
  "ride": {
    "id": "ride_lt8a9b3z_x9q2",
    "status": "recording",
    "type": "solo",
    "startedAt": "2026-05-02T08:00:00.000Z",
    "endedAt": null,
    "coordinates": [],
    "metrics": {
      "distanceMeters": 0,
      "durationMs": 0,
      "currentSpeedKmh": 0,
      "averageSpeedKmh": 0,
      "maxSpeedKmh": 0
    },
    "memoryIds": [],
    "startLocationLabel": null,
    "endLocationLabel": null
  }
}
```

**Errors**: `422 VALIDATION` if required fields are missing.

---

### `POST /rides/:rideId/stop`

Finalises the ride. The frontend sends the complete coordinate list and final computed metrics.

**Request**
```json
{
  "endedAt": "2026-05-02T10:24:30.000Z",
  "finalCoordinates": [
    {
      "latitude": 18.7541,
      "longitude": 73.4063,
      "timestamp": 1746181470000,
      "speed": 0,
      "accuracy": 9
    }
  ],
  "metrics": {
    "distanceMeters": 83400,
    "durationMs": 8670000,
    "currentSpeedKmh": 0,
    "averageSpeedKmh": 34.6,
    "maxSpeedKmh": 76.2
  }
}
```

> `finalCoordinates` is the **full** coordinate array recorded by the app for that ride. The backend merges these with the initial `startCoordinate` to form the canonical polyline. This avoids sending intermediate batches during recording in v0.1 (see `PATCH /rides/:rideId/coordinates` below for the streaming alternative).

**Response — 200 OK**
```json
{
  "ride": {
    "id": "ride_lt8a9b3z_x9q2",
    "status": "completed",
    "endedAt": "2026-05-02T10:24:30.000Z",
    "coordinates": [ /* full TrackedCoordinate[] */ ],
    "metrics": { /* as submitted */ },
    "startLocationLabel": "Bandra, Mumbai",
    "endLocationLabel": "Lonavala",
    "memoryIds": [ "mem_lt8aa1cf_y3p8" ]
  }
}
```

> Backend should populate `startLocationLabel` / `endLocationLabel` by reverse-geocoding the first and last coordinate. The frontend displays these in history / detail screens.

**Errors**: `404 NOT_FOUND` if the ride does not exist or is already completed.

---

### `PATCH /rides/:rideId/coordinates`

Streams a batch of coordinates mid-ride. **Currently not called by the frontend** (v0.1 sends everything at stop time). Implement on the backend now so the frontend can progressively flush coordinates every N fixes in v0.2 — critical for rides longer than ~2 hours to keep the stop-time payload manageable.

**Request**
```json
{
  "coordinates": [
    {
      "latitude": 19.077,
      "longitude": 72.879,
      "timestamp": 1746172802000,
      "speed": 16.4,
      "accuracy": 7,
      "heading": 112
    }
  ]
}
```

**Response — 200 OK**
```json
{ "rideId": "ride_lt8a9b3z_x9q2", "appended": 1 }
```

**Errors**: `404 NOT_FOUND`, `409 CONFLICT` if ride is not in `recording` state.

---

### `GET /rides`

Paged list of completed rides for the History screen. Returns `RideSummary` objects (no coordinate arrays — those are only fetched on demand via `GET /rides/:rideId`).

**Query parameters**

| Param      | Type                 | Default | Notes                    |
|------------|----------------------|---------|--------------------------|
| `page`     | int ≥ 1              | `1`     |                          |
| `pageSize` | int 1–50             | `20`    |                          |
| `type`     | `"solo" \| "group"`  | —       | Omit to return both      |

**Response — 200 OK**
```json
{
  "rides": [
    {
      "id": "ride_lt8a9b3z_x9q2",
      "type": "solo",
      "startedAt": "2026-05-02T08:00:00.000Z",
      "endedAt": "2026-05-02T10:24:30.000Z",
      "distanceMeters": 83400,
      "durationMs": 8670000,
      "startLocationLabel": "Bandra, Mumbai",
      "endLocationLabel": "Lonavala",
      "memoryCount": 1
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

> The frontend's `historyStore` currently fetches **all** rides on each load and filters `type` client-side. When rides exceed one page, server-side filtering becomes mandatory — pass the `type` query param as-is from `useHistoryStore.filter`.

---

### `GET /rides/:rideId`

Full ride detail. Includes the complete `coordinates` array (used by `RideSummaryScreen` and `RideDetailScreen` to render the polyline).

**Response — 200 OK**
```json
{
  "ride": {
    "id": "ride_lt8a9b3z_x9q2",
    "status": "completed",
    "type": "solo",
    "startedAt": "2026-05-02T08:00:00.000Z",
    "endedAt": "2026-05-02T10:24:30.000Z",
    "coordinates": [ /* full TrackedCoordinate[] */ ],
    "metrics": {
      "distanceMeters": 83400,
      "durationMs": 8670000,
      "currentSpeedKmh": 0,
      "averageSpeedKmh": 34.6,
      "maxSpeedKmh": 76.2
    },
    "memoryIds": [ "mem_lt8aa1cf_y3p8" ],
    "startLocationLabel": "Bandra, Mumbai",
    "endLocationLabel": "Lonavala"
  }
}
```

**Errors**: `404 NOT_FOUND`.

---

## Memories

### `POST /memories`

Adds a memory snapshot pinned to a map coordinate during a ride.

**Request**
```json
{
  "rideId": "ride_lt8a9b3z_x9q2",
  "imageUri": "https://cdn.revvedup.app/memories/img_abc.jpg",
  "caption": "Sunset at the ghat",
  "coordinate": {
    "latitude": 18.7541,
    "longitude": 73.4063
  },
  "capturedAt": "2026-05-02T09:42:11.000Z"
}
```

> `imageUri` is a fully resolved, publicly accessible URL. In v0.1 the app sends a mock URL. For production, the frontend will first upload the image to a CDN (see **Improvements** below) and then send the resulting URL here.

**Response — 201 Created**
```json
{
  "memory": {
    "id": "mem_lt8aa1cf_y3p8",
    "rideId": "ride_lt8a9b3z_x9q2",
    "imageUri": "https://cdn.revvedup.app/memories/img_abc.jpg",
    "caption": "Sunset at the ghat",
    "coordinate": { "latitude": 18.7541, "longitude": 73.4063 },
    "capturedAt": "2026-05-02T09:42:11.000Z"
  }
}
```

**Errors**: `404 NOT_FOUND` if `rideId` does not exist. `409 CONFLICT` if ride is already completed (backend may choose to allow this for memories added during upload lag).

---

### `GET /rides/:rideId/memories`

Returns all memories for a single ride, sorted by `capturedAt` ascending.

**Response — 200 OK**
```json
{
  "memories": [
    {
      "id": "mem_lt8aa1cf_y3p8",
      "rideId": "ride_lt8a9b3z_x9q2",
      "imageUri": "https://cdn.revvedup.app/memories/img_abc.jpg",
      "caption": "Sunset at the ghat",
      "coordinate": { "latitude": 18.7541, "longitude": 73.4063 },
      "capturedAt": "2026-05-02T09:42:11.000Z"
    }
  ]
}
```

---

### `DELETE /memories/:memoryId`

**Response — 200 OK**
```json
{ "memoryId": "mem_lt8aa1cf_y3p8", "deleted": true }
```

**Errors**: `404 NOT_FOUND`.

---

## Removing the mocks — checklist

When the real backend is ready, do the following in the frontend codebase:

1. **`src/constants/config.js`** — set `useMockServices: false`.
2. **`src/constants/config.js`** — set `api.baseUrl` to the production/staging URL.
3. **Auth header** — add `Authorization: Bearer <token>` to `src/services/apiClient.js` once auth lands. The `request()` helper is the single place to add it.
4. **Image upload** — replace the mock `imageUri` in `AddMemorySheet.jsx` with a real upload flow (see Improvements).
5. **Coordinate streaming** — hook up `rideService.appendCoordinates()` inside `useRideTracker.js` to flush batches every N fixes, rather than sending everything at stop time.
6. **No other changes needed** — service files, stores, and screens are all written against this contract already.

---

## Improvements identified in v0.1

| # | Area | Issue | Recommended fix |
|---|------|-------|-----------------|
| 1 | Coordinate streaming | All coordinates are buffered in memory and sent in one payload at stop time. A 3-hour ride at 1 fix/1.5 s = ~7200 coordinates ≈ large JSON body. | Call `PATCH /rides/:rideId/coordinates` every 50 fixes during recording. Backend already supports this endpoint. |
| 2 | Image upload | `AddMemorySheet` currently accepts a hardcoded mock URI. No real image picker or upload is wired. | Add `react-native-image-picker`, upload to a CDN via a presigned URL from the backend, then pass the CDN URL to `POST /memories`. |
| 3 | Reverse geocoding | `startLocationLabel` / `endLocationLabel` are always `null` in the frontend. | Backend should reverse-geocode the first and last `TrackedCoordinate` using Google Maps Geocoding API or Mapbox on `POST /rides/:rideId/stop` and persist the labels on the ride record. |
| 4 | History pagination | `historyStore` fetches all rides in one call and filters `type` client-side. Works until rides exceed `pageSize: 20`. | Pass `filter` from the store as the `type` query param and implement cursor-based or page-based infinite scroll on `RideHistoryScreen`. |
| 5 | Background tracking | GPS tracking stops when the app is backgrounded. | Android: Foreground Service with a persistent notification. iOS: add `UIBackgroundModes: location` to `Info.plist`. |
| 6 | Crash safety | Active ride state lives only in Zustand (in-memory). A crash loses the entire ride. | Checkpoint `useRideStore` state to AsyncStorage every 30 s using Zustand `persist` middleware. Restore on app launch if an incomplete ride is found. |
| 7 | GPS permission UX | No actual permission request is made in v0.1; the mock provider starts regardless. | Use `react-native-permissions` to request `ACCESS_FINE_LOCATION` before calling `startRide`, and show a blocked-state UI if denied. |
| 8 | `PATCH /coordinates` not called | `rideService.appendCoordinates` exists but nothing calls it during recording. | See improvement #1. |
