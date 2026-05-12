import {useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import {CONFIG} from '@constants/config';
import {useRideStore} from '@store/rideStore';
import {createNativeGeolocationProvider} from './geolocation';
import {ensureForegroundLocationPermission} from './locationPermission';

/**
 * Subscribes to GPS while recording: permission gate, watch with auto-restart on
 * native errors, watchdog (lost / degraded), optional single-shot probes, and
 * metrics tick. GPS pill state is driven by accepted fixes, not raw callbacks.
 */
export function useRideTracker() {
  const status = useRideStore(s => s.status);
  const appendCoordinate = useRideStore(s => s.appendCoordinate);
  const tick = useRideStore(s => s.tick);
  const setGpsStatus = useRideStore(s => s.setGpsStatus);
  const [foregroundEpoch, setForegroundEpoch] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        setForegroundEpoch(e => e + 1);
      }
    });
    return () => sub.remove();
  }, []);

  const providerRef = useRef(null);
  if (providerRef.current === null) {
    providerRef.current = createNativeGeolocationProvider();
  }

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;
    if (status !== 'recording') return;

    const gps = CONFIG.gps ?? {};
    const noNativeFixMs = gps.noNativeFixMs ?? 45_000;
    const noAcceptedFixMs = gps.noAcceptedFixMs ?? 30_000;
    const maxRestarts = gps.maxWatchRestarts ?? 5;
    const baseDelay = gps.watchRestartBaseMs ?? 500;
    const maxDelay = gps.maxWatchRestartDelayMs ?? 30_000;
    const probeMs = gps.probeIntervalMs ?? 25_000;
    const watchdogMs = gps.watchdogTickMs ?? 1_500;

    let cancelled = false;
    let unsubscribe = null;
    let restartTimeout = null;
    let watchdogId = null;
    let probeId = null;
    let restartCount = 0;

    const sessionStartAt = Date.now();
    let lastNativeAt = 0;
    let firstNativeAt = 0;

    const clearWatch = () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
        unsubscribe = null;
      }
    };

    const applyHealthFromWatchdog = () => {
      if (cancelled) return;
      const coordsLen = useRideStore.getState().coordinates.length;
      const now = Date.now();
      if (useRideStore.getState().gpsStatus === 'denied') {
        return;
      }

      const everNative = lastNativeAt > 0;

      if (!everNative && now - sessionStartAt > noNativeFixMs) {
        setGpsStatus('lost');
        return;
      }

      if (
        coordsLen === 0 &&
        firstNativeAt > 0 &&
        now - firstNativeAt > noAcceptedFixMs &&
        now - lastNativeAt < 12_000
      ) {
        setGpsStatus('degraded');
        return;
      }

      if (coordsLen > 0 && everNative && now - lastNativeAt > noNativeFixMs) {
        setGpsStatus('lost');
      }
    };

    const bindWatch = () => {
      clearWatch();
      if (cancelled) return;

      unsubscribe = provider.watch(
        coord => {
          const now = Date.now();
          if (firstNativeAt === 0) {
            firstNativeAt = now;
          }
          lastNativeAt = now;
          restartCount = 0;
          const accepted = appendCoordinate(coord);
          const coordsLen = useRideStore.getState().coordinates.length;
          const prevGps = useRideStore.getState().gpsStatus;

          if (accepted) {
            setGpsStatus('active');
            return;
          }

          if (coordsLen > 0) {
            if (prevGps === 'lost' || prevGps === 'degraded') {
              setGpsStatus('active');
            }
            return;
          }

          if (prevGps === 'lost') {
            setGpsStatus('receiving');
          } else if (prevGps !== 'active' && prevGps !== 'degraded') {
            setGpsStatus('receiving');
          }
        },
        () => {
          clearWatch();
          setGpsStatus('lost');
          restartCount += 1;
          if (cancelled || restartCount > maxRestarts) {
            return;
          }
          const exp = Math.min(maxDelay, baseDelay * 2 ** Math.min(restartCount, 8));
          restartTimeout = setTimeout(() => {
            restartTimeout = null;
            if (!cancelled) {
              setGpsStatus('searching');
              bindWatch();
            }
          }, exp);
        },
      );
    };

    const run = async () => {
      setGpsStatus('searching');
      const perm = await ensureForegroundLocationPermission();
      if (cancelled) return;
      if (perm !== 'granted') {
        setGpsStatus('denied');
        return;
      }
      lastNativeAt = 0;
      lastAcceptedAt = 0;
      restartCount = 0;
      bindWatch();

      watchdogId = setInterval(applyHealthFromWatchdog, watchdogMs);

      probeId = setInterval(async () => {
        if (cancelled) return;
        const st = useRideStore.getState();
        if (st.status !== 'recording') return;
        const g = st.gpsStatus;
        if (g !== 'lost' && g !== 'degraded') return;
        try {
          const c = await provider.getCurrent();
          if (cancelled) return;
          const now = Date.now();
          if (firstNativeAt === 0) {
            firstNativeAt = now;
          }
          lastNativeAt = now;
          restartCount = 0;
          const accepted = appendCoordinate(c);
          if (accepted) {
            setGpsStatus('active');
          }
        } catch {
          /* ignore probe failure */
        }
      }, probeMs);
    };

    void run();

    return () => {
      cancelled = true;
      clearWatch();
      if (restartTimeout) clearTimeout(restartTimeout);
      if (watchdogId) clearInterval(watchdogId);
      if (probeId) clearInterval(probeId);
    };
  }, [status, appendCoordinate, setGpsStatus, foregroundEpoch]);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(tick, CONFIG.ride.metricsTickMs);
    return () => clearInterval(id);
  }, [status, tick]);
}
