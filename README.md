# RevvedUp Frontend — Complete Project README

**Tech stack:** React Native CLI · JavaScript (ES2022) · Zustand · react-native-maps · react-native-geolocation

> This is the **frontend** repo. The backend repo is at `RevvedUpProduct/RevvedUpBackend`.
> For the full API contract both sides agree on, see [`src/docs/API_CONTRACT.md`](./src/docs/API_CONTRACT.md).
> For the software design document, see [`src/docs/SDD.md`](./src/docs/SDD.md).

---

## Table of Contents

1. [What this app does](#1-what-this-app-does)
2. [What is already built](#2-what-is-already-built)
3. [Project structure](#3-project-structure)
4. [What YOU (Abhi) must do to connect to the real backend](#4-what-you-abhi-must-do-to-connect-to-the-real-backend)
   - [Step 1: Get the backend URL from Vishal](#step-1-get-the-backend-url-from-vishal)
   - [Step 2: Flip the two config values](#step-2-flip-the-two-config-values)
   - [Step 3: Run the app and verify each screen](#step-3-run-the-app-and-verify-each-screen)
5. [Local development setup](#5-local-development-setup)
6. [Running on Android](#6-running-on-android)
7. [Running on iOS](#7-running-on-ios)
8. [How the mock system works](#8-how-the-mock-system-works)
9. [All API endpoints the app calls](#9-all-api-endpoints-the-app-calls)
10. [Error format from the backend](#10-error-format-from-the-backend)
11. [What is NOT done yet (v0.2 scope)](#11-what-is-not-done-yet-v02-scope)
12. [Common problems and fixes](#12-common-problems-and-fixes)
13. [Questions to ask Vishal](#13-questions-to-ask-vishal)

---

## 1. What this app does

RevvedUp is a motorcycle ride-companion app. Core features in v0.1:

- **Home screen** — shows total rides, total distance, total ride time. Buttons to start a new ride or view history.
- **Ride recording** — full-screen dark map, live GPS polyline, real-time distance/duration/speed metrics. Button to add memory snapshots mid-ride.
- **Memory snapshots** — pin a photo (URL) + caption to the current GPS coordinate during a live ride.
- **Ride summary** — shown immediately after stopping a ride. Displays route on map, final metrics, and a list of memories added during the ride.
- **Ride history** — paginated list with filter chips (All / Solo / Group) and pull-to-refresh. Tap a ride to see full route + memories.
- **Ride detail** — full route polyline on map, all metrics, all memories listed with coordinates.

---

## 2. What is already built

Everything below is implemented and working with mock data:

| Screen / Feature | Status |
|-----------------|--------|
| HomeScreen | Done — shows stats from store |
| RideRecordingScreen | Done — GPS tracking, live map, metrics, memory sheet |
| RideSummaryScreen | Done — map replay, final metrics |
| RideHistoryScreen | Done — list, filter chips, pull-to-refresh |
| RideDetailScreen | Done — full route + memories |
| MemoriesScreen | Done — flat list of all memories for a ride |
| AddMemorySheet | Done — photo URL + caption input, posts to memories API |
| Navigation (stack) | Done — type-safe stack navigator |
| Zustand stores | Done — `rideStore`, `memoryStore`, `historyStore` |
| API service layer | Done — `apiClient`, `rideService`, `memoryService` |
| Mock data system | Done — entire app runs without any backend |
| GPS simulation (simulator) | Done — simulates Mumbai → Lonavala route in mock mode |

**The app is 100% functional right now with mock data.** Switching to real backend = two config value changes.

---

## 3. Project structure

```
src/
├── features/
│   ├── home/
│   │   └── HomeScreen.jsx
│   ├── ride/
│   │   ├── RideRecordingScreen.jsx
│   │   ├── RideSummaryScreen.jsx
│   │   └── hooks/useRideTracker.js
│   ├── memory/
│   │   ├── MemoriesScreen.jsx
│   │   └── components/AddMemorySheet.jsx
│   └── history/
│       ├── RideHistoryScreen.jsx
│       └── RideDetailScreen.jsx
├── components/           # Shared: Button, Card, BottomSheet, MetricTile, etc.
├── navigation/           # RootNavigator.jsx — type-safe stack
├── services/
│   ├── apiClient.js      # Base HTTP client — all API calls go through here
│   ├── rideService.js    # All ride-related API calls
│   ├── memoryService.js  # All memory-related API calls
│   └── mockDb.js         # In-memory mock data (used when useMockServices: true)
├── store/
│   ├── rideStore.js      # Active ride state
│   ├── memoryStore.js    # Memories for current ride
│   └── historyStore.js   # Past rides list + pagination
├── constants/
│   ├── config.js         # THE main config — baseUrl + useMockServices lives here
│   └── endpoints.js      # All API path strings — never hardcode paths elsewhere
├── utils/                # haversine, formatters, id generator
├── types/                # Domain types
└── docs/
    ├── API_CONTRACT.md   # Full API contract (both backend and frontend agreed on this)
    └── SDD.md            # Software Design Document
```

---

## 4. What YOU (Abhi) must do to connect to the real backend

### Step 1: Get the backend URL from Vishal

Ask Vishal for the live Render URL. It will look like:

```
https://revvedup-api.onrender.com
```

Verify it is live by opening this URL in a browser — it should return:
```json
{ "status": "UP" }
```

If it does not load, the backend service may be sleeping (free tier). Wait 30 seconds and try again.

You can also explore all available APIs at:
```
https://revvedup-api.onrender.com/swagger-ui/index.html
```

---

### Step 2: Flip the two config values

Open `src/constants/config.js` and change exactly two values:

```js
// BEFORE
export const CONFIG = {
  useMockServices: true,         // <-- change this to false
  api: {
    baseUrl: 'https://api.revvedup.app/v1',  // <-- change this to Vishal's URL
    ...
  }
};

// AFTER
export const CONFIG = {
  useMockServices: false,
  api: {
    baseUrl: 'https://revvedup-api.onrender.com/api/v1',  // Vishal's actual Render URL
    ...
  }
};
```

**That is the only change needed.** No other files need to be touched. The service layer (`rideService.js`, `memoryService.js`) already switches between mock and real automatically based on this flag.

---

### Step 3: Run the app and verify each screen

Test in this order after flipping the flag:

**1. Home Screen**
- Open the app — home screen should load
- Stats (total rides, distance, time) will show as 0 initially (no rides yet in the real DB)

**2. Start → Record → Stop a Ride**
- Tap "Start Ride" on home screen
- On a real device: grant location permission when prompted
- On a simulator: the GPS data will come from mock GPS (still simulates movement, but data is saved to real backend)
- Let it record for 10–20 seconds
- Tap "Stop Ride"
- Ride Summary screen should appear with real data from the backend

**3. Ride History**
- Go back to Home → History tab
- The ride you just completed should appear in the list
- Tap it → Ride Detail screen should show the route and metrics

**4. Add a Memory**
- Start a new ride
- During recording, tap the "+" / camera button to open AddMemorySheet
- Enter a caption and a photo URL (e.g. any HTTPS image URL for testing)
- Tap Save
- Stop the ride → Ride Summary should show the memory

**5. Memories List**
- On Ride Detail screen, tap to view memories → should list the memory you added

If all 5 work, the integration is complete.

---

## 5. Local development setup

**Prerequisites:**

| Tool | Version | How to install |
|------|---------|---------------|
| Node.js | 18 or 20 LTS | https://nodejs.org |
| JDK 17 | For Android build | `winget install EclipseAdoptium.Temurin.17.JDK` |
| Android Studio | Latest | https://developer.android.com/studio |
| Xcode | 15+ (Mac only) | App Store |
| CocoaPods | Latest (Mac only) | `sudo gem install cocoapods` |

**Install dependencies:**

```bash
npm install
```

**iOS only — install native pods:**

```bash
cd ios && pod install && cd ..
```

---

## 6. Running on Android

```bash
# Start Metro bundler (keep this terminal open)
npm start

# In a second terminal — run on Android device/emulator
npm run android
```

**Android native module setup (one-time):**

1. Open `android/app/src/main/AndroidManifest.xml`
2. Inside `<application>`, add your Google Maps API key:
   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_GOOGLE_MAPS_KEY" />
   ```
3. The `ACCESS_FINE_LOCATION` permission is already declared in the manifest

**Get a Google Maps API key (free):**
1. Go to https://console.cloud.google.com
2. Create a project → Enable "Maps SDK for Android"
3. Credentials → Create API Key
4. Restrict it to your Android app package name: `com.revvedupfrontend`

---

## 7. Running on iOS

```bash
# Start Metro bundler
npm start

# In a second terminal
npm run ios
```

**iOS native module setup (one-time):**

1. Open `ios/RevvedUpFrontend/Info.plist`
2. Add location permission description:
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>RevvedUp needs your location to track your ride route.</string>
   ```
3. The Google Maps key for iOS goes in `AppDelegate.mm`:
   ```objc
   [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_IOS_KEY"];
   ```

---

## 8. How the mock system works

When `CONFIG.useMockServices = true`:

- `rideService.js` and `memoryService.js` call functions in `mockDb.js` instead of hitting the real API
- `mockDb.js` is a plain in-memory JavaScript object — data resets every time you reload the app
- GPS tracking uses a simulated path (Mumbai → Lonavala hardcoded in `useRideTracker.js`)
- No network calls are made at all
- The app is fully usable on a simulator without any permissions

When `CONFIG.useMockServices = false`:

- All calls go through `apiClient.js` → real HTTP requests to `CONFIG.api.baseUrl`
- Real device GPS is used (requires location permission)
- Data is persisted in the Supabase database through the backend

---

## 9. All API endpoints the app calls

All paths are relative to `CONFIG.api.baseUrl` (e.g. `https://revvedup-api.onrender.com/api/v1`).

| Screen | Method | Path | When called |
|--------|--------|------|-------------|
| HomeScreen | GET | `/rides?page=1&pageSize=100` | On mount, to calculate stats |
| RideRecordingScreen | POST | `/rides/start` | When user taps Start Ride |
| RideRecordingScreen | POST | `/memories` | When user saves a memory snapshot |
| RideRecordingScreen | POST | `/rides/{rideId}/stop` | When user taps Stop Ride |
| RideSummaryScreen | GET | `/rides/{rideId}` | On mount |
| RideHistoryScreen | GET | `/rides?page={n}&type={filter}` | On mount + filter change + pull-to-refresh |
| RideDetailScreen | GET | `/rides/{rideId}` | On mount |
| RideDetailScreen | GET | `/rides/{rideId}/memories` | On mount |
| MemoriesScreen | GET | `/rides/{rideId}/memories` | On mount |

All endpoints require no auth header during MVP (`APP_AUTH_DEV_BYPASS=true` is set on the backend). When Vishal enables real auth, you will need to add:
```js
headers: { Authorization: `Bearer ${supabaseSession.access_token}` }
```
in `apiClient.js`. Vishal will tell you when to make this change.

---

## 10. Error format from the backend

All non-2xx responses from the backend follow this shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Ride abc123 not found",
    "requestId": "req_abc123"
  }
}
```

Possible `code` values:

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION` | 400 | Bad request body / missing field |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `CONFLICT` | 409 | State conflict (e.g. trying to add memory to a completed ride) |
| `SERVER_ERROR` | 500 | Backend bug — report to Vishal with the `requestId` |

---

## 11. What is NOT done yet (v0.2 scope)

These features are intentionally deferred. Do not block integration testing on them:

| Feature | Status | What is needed |
|---------|--------|---------------|
| Login / Signup screens | Not started | Supabase Auth UI + session management |
| Real image upload | Not started | Replace placeholder URLs with real image picker + Supabase Storage upload |
| Location labels (city names) | Not started | Backend will add reverse geocoding; for now `startLocationLabel` / `endLocationLabel` are `null` |
| Background GPS tracking | Not started | Requires `react-native-background-actions` or similar |
| Offline support | Not started | AsyncStorage / WatermelonDB caching |
| Group rides | Not started | Real-time presence via Supabase Realtime or Firebase |
| Push notifications | Not started | Firebase Cloud Messaging |
| Persistent ride state | Not started | If app is killed mid-ride, ride is lost |

---

## 12. Common problems and fixes

### Metro bundler: "Unable to resolve module"
**Fix:** `npm start -- --reset-cache`

### Android: "SDK location not found"
**Fix:** Create `android/local.properties` with:
```
sdk.dir=C:\\Users\\<your-username>\\AppData\\Local\\Android\\Sdk
```

### Android: map shows grey tiles (no map visible)
**Fix:** Google Maps API key is missing or wrong in `AndroidManifest.xml`. Double-check the key and make sure the Maps SDK is enabled in Google Cloud Console.

### iOS: "Command PhaseScriptExecution failed"
**Fix:** Run `cd ios && pod install && cd ..` again. Sometimes CocoaPods needs a reinstall after `npm install`.

### App crashes on start (real device, `useMockServices: false`)
**Fix:** The Render free tier sleeps after 15 minutes of inactivity. The first request takes up to 30 seconds. Add a loading state or show a "Connecting..." spinner while the health check resolves.

### Ride data not showing after integration flip
**Fix:** Double-check `CONFIG.api.baseUrl` does NOT have a trailing slash and DOES include `/api/v1`:
```
CORRECT:   https://revvedup-api.onrender.com/api/v1
INCORRECT: https://revvedup-api.onrender.com/
INCORRECT: https://revvedup-api.onrender.com/api/v1/
```

### Memory add returns 409 Conflict
**Fix:** The backend rejects adding memories to a ride that is already in `completed` status. Memories must be added while the ride is still in `recording` status (i.e. before calling Stop).

---

## 13. Questions to ask Vishal

If you hit a problem during integration, here are the most useful things to ask:

| Situation | What to ask |
|-----------|------------|
| Backend is down / not responding | "Can you check the Render dashboard logs? The health endpoint at `/api/v1/health` is returning an error." |
| Getting 401 Unauthorized | "Is `APP_AUTH_DEV_BYPASS` still set to `true` on Render?" |
| Getting 500 Server Error | "I'm getting a 500 on `POST /rides/start`. The `requestId` from the response is `req_xxx`. Can you check backend logs?" |
| Field is `null` that should have data | "The `startLocationLabel` field is null in the ride response — is reverse geocoding implemented yet?" |
| Not sure what to send in request body | "Can you share the Swagger UI URL? I'll check the schema there." |
| Want to test without real device | "The mock mode still works — I can flip `useMockServices` back to `true` locally to isolate whether it's a frontend or backend issue." |
| Need to reset test data | "Can you delete all rides for the dev user UUID `00000000-0000-0000-0000-000000000001` in Supabase SQL Editor?" |

---

## Type-checking and linting

```bash
npm run tsc    # TypeScript strict check, no emit
npm run lint   # ESLint
```

Run both before raising a PR.

---

## Switching between mock and live quickly (tip)

Instead of editing `config.js` each time, you can use an environment variable approach. For now, just comment/uncomment the one line:

```js
useMockServices: true,   // comment this for live
// useMockServices: false,  // uncomment this for live
```

This is useful when debugging — if something breaks in live mode, flip back to mock to confirm it works with mock data, then you know the issue is backend-related.
