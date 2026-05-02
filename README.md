# RevvedUp 🏍️

A motorcycle ride-companion mobile app — built with **React Native CLI + TypeScript + Zustand + react-native-maps**.

> Looking for design / architecture decisions? Read the **[Software Design Document](./src/docs/SDD.md)** and **[API Contract](./src/docs/API_CONTRACT.md)**. Both live in-tree under `src/docs/` and are updated alongside every feature.

## What's inside

- **Ride tracking** — full-screen dark map, live polyline, Distance / Duration / Speed metrics computed via the Haversine formula.
- **Memory snapshots** — pin photos to map coordinates from inside a live ride.
- **Ride history** — paged list with filter chips and pull-to-refresh; tap a ride to see the full route + memories.
- **Mocked backend** — the entire app runs end-to-end without a server; mocks live behind the same service interface the real API will implement.

## Project structure

```
src/
├── features/        # Vertical feature slices
│   ├── home/
│   ├── ride/        # RideRecordingScreen, RideSummaryScreen, geolocation hook
│   ├── memory/      # AddMemorySheet, MemoriesScreen
│   └── history/     # RideHistoryScreen, RideDetailScreen
├── components/      # Reusable primitives: Button, Card, BottomSheet, MetricTile…
├── navigation/      # Type-safe stack navigator
├── services/        # apiClient + rideService + memoryService (+ in-memory mocks)
├── store/           # Zustand stores: ride, memory, history
├── constants/       # colors, spacing, strings, config, endpoints
├── utils/           # Pure helpers (haversine, formatters, id)
├── types/           # Domain & API contracts (no `any`, anywhere)
└── docs/            # SDD.md + API_CONTRACT.md
```

Path aliases (`@components/*`, `@features/*`, …) are wired through both `tsconfig.json` and `babel.config.js`.

## Getting started

```bash
# Install JS deps
npm install

# (iOS only) install pods
cd ios && pod install && cd ..

# Run
npm run android
# or
npm run ios
```

By default `CONFIG.useMockServices = true` (in `src/constants/config.ts`) and `useRideTracker` uses a simulated GPS provider that walks Mumbai → Lonavala. The whole app is fully usable on the simulator without granting any permissions.

To switch to real GPS + a real backend, flip `useMockServices` to `false` and provide `CONFIG.api.baseUrl`.

## Type-checking & linting

```bash
npm run tsc    # strict TS, no emit
npm run lint
```

## Native module setup notes

- **react-native-maps**: requires a Google Maps API key on Android (`AndroidManifest.xml` `com.google.android.geo.API_KEY`) and CocoaPods install on iOS.
- **@react-native-community/geolocation**: add `NSLocationWhenInUseUsageDescription` to `Info.plist` and `ACCESS_FINE_LOCATION` to `AndroidManifest.xml`.
- **react-native-permissions**: configure `Podfile` permission_handlers so only the location permission is built (keeps app size down).

## Roadmap

Tracked in detail in [`src/docs/SDD.md` § 8](./src/docs/SDD.md#8-open-questions). Highlights:

- Background location updates (v0.2).
- Persisted state via AsyncStorage / WatermelonDB (v0.2).
- Real image picker (`react-native-image-picker`) replacing the mock.
- Group rides (real-time peer presence) — model is already forward-compatible.
- Auth + sync once the backend ships.
