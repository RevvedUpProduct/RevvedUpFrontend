import {useEffect, useRef} from 'react';
import {CONFIG} from '@constants/config';
import {useRideStore} from '@store/rideStore';
import {createNativeGeolocationProvider} from './geolocation';

/**
 * Subscribes to the native GPS provider while the ride is in 'recording'
 * state and feeds each fix into the ride store. Also drives the per-second
 * metrics ticker so the duration / average speed update smoothly even
 * between GPS fixes.
 */
export function useRideTracker() {
  const status = useRideStore(s => s.status);
  const appendCoordinate = useRideStore(s => s.appendCoordinate);
  const tick = useRideStore(s => s.tick);
  const setGpsStatus = useRideStore(s => s.setGpsStatus);

  const providerRef = useRef(null);
  if (providerRef.current === null) {
    providerRef.current = createNativeGeolocationProvider();
  }

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;
    if (status !== 'recording') return;

    setGpsStatus('searching');
    let gotFirstFix = false;

    const unsubscribe = provider.watch(
      coord => {
        if (!gotFirstFix) {
          gotFirstFix = true;
          setGpsStatus('active');
        }
        appendCoordinate(coord);
      },
      () => setGpsStatus('lost'),
    );

    return () => {
      unsubscribe();
    };
  }, [status, appendCoordinate, setGpsStatus]);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(tick, CONFIG.ride.metricsTickMs);
    return () => clearInterval(id);
  }, [status, tick]);
}
