import {useEffect, useRef} from 'react';
import {CONFIG} from '@constants/config';
import {useRideStore} from '@store/rideStore';
import {createNativeGeolocationProvider, createSimulatedGeolocationProvider} from './geolocation';

export function useRideTracker({simulate = false} = {}) {
  const status = useRideStore(s => s.status);
  const appendCoordinate = useRideStore(s => s.appendCoordinate);
  const tick = useRideStore(s => s.tick);
  const setGpsStatus = useRideStore(s => s.setGpsStatus);

  const providerRef = useRef(null);

  if (providerRef.current === null) {
    providerRef.current = simulate
      ? createSimulatedGeolocationProvider()
      : createNativeGeolocationProvider();
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
