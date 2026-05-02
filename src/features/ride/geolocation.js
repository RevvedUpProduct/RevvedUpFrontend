function loadNativeGeolocation() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-community/geolocation');
  } catch {
    return null;
  }
}

export function createNativeGeolocationProvider() {
  const Geo = loadNativeGeolocation();

  if (!Geo) {
    return createSimulatedGeolocationProvider();
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

/**
 * Walks a path roughly from Mumbai → Lonavala.
 */
export function createSimulatedGeolocationProvider() {
  let lat = 19.076;
  let lng = 72.8777;
  const dLat = 0.00012;
  const dLng = 0.00018;
  const tickMs = 1500;

  return {
    watch(onFix) {
      const id = setInterval(() => {
        const jitter = (Math.random() - 0.5) * 0.00006;
        lat += dLat + jitter;
        lng += dLng + jitter;
        onFix({
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
          speed: 16 + Math.random() * 6,
          accuracy: 8,
          heading: 110 + Math.random() * 5,
        });
      }, tickMs);
      return () => clearInterval(id);
    },
    getCurrent() {
      return Promise.resolve({
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        speed: 0,
        accuracy: 8,
      });
    },
  };
}
