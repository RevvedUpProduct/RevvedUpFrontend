function loadNativeGeolocation() {
  try {
    // The package is shipped as an ES module with a default export. When loaded
    // via `require`, Metro returns the module-namespace object; the real API
    // (watchPosition, getCurrentPosition, clearWatch) lives on `.default`.
    // We accept either shape so a plain CJS module would still work.
    const mod = require('@react-native-community/geolocation');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * Wraps `@react-native-community/geolocation` so the rest of the app can stay
 * agnostic to the underlying native module. Returns the same {latitude,
 * longitude, speed, accuracy, ...} shape used by the ride store.
 */
export function createNativeGeolocationProvider() {
  const Geo = loadNativeGeolocation();

  if (!Geo) {
    throw new Error(
      'Native geolocation module is not available. Make sure ' +
        '@react-native-community/geolocation is installed and linked.',
    );
  }

  return {
    watch(onFix, onError) {
      const id = Geo.watchPosition(
        position => {
          onFix({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            speed: position.coords.speed ?? undefined,
            accuracy: position.coords.accuracy ?? undefined,
            altitude: position.coords.altitude ?? undefined,
            heading: position.coords.heading ?? undefined,
          });
        },
        err => onError?.(new Error(err.message)),
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 1500,
          fastestInterval: 1000,
        },
      );
      return () => Geo.clearWatch(id);
    },
    getCurrent() {
      return new Promise((resolve, reject) => {
        Geo.getCurrentPosition(
          pos =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: pos.timestamp,
              speed: pos.coords.speed ?? undefined,
              accuracy: pos.coords.accuracy ?? undefined,
              altitude: pos.coords.altitude ?? undefined,
              heading: pos.coords.heading ?? undefined,
            }),
          err => reject(new Error(err.message)),
          {enableHighAccuracy: true},
        );
      });
    },
  };
}
