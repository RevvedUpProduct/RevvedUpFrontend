import {useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import {STRINGS} from '@constants/strings';
import {readJSON, deleteKey, STORAGE_KEYS} from '@services/storage';
import {useRideStore} from '@store/rideStore';

let resumeOfferShownThisColdStart = false;

/**
 * After NavigationContainer is ready, prompts to resume an in-progress ride from MMKV.
 */
export function ActiveRideResumeGate({navigationRef, navReady}) {
  const restoreFromActiveRideSnapshot = useRideStore(s => s.restoreFromActiveRideSnapshot);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!navReady || ranRef.current) return;
    if (!navigationRef.isReady?.()) return;

    if (resumeOfferShownThisColdStart) {
      ranRef.current = true;
      return;
    }

    const snap = readJSON(STORAGE_KEYS.ACTIVE_RIDE);
    if (!snap?.rideId || !snap?.startedAt) {
      ranRef.current = true;
      return;
    }
    if (snap.status !== 'recording' && snap.status !== 'paused') {
      ranRef.current = true;
      return;
    }

    const route = navigationRef.getCurrentRoute?.();
    if (route?.name === 'RideRecording') {
      ranRef.current = true;
      return;
    }

    resumeOfferShownThisColdStart = true;
    ranRef.current = true;

    Alert.alert(STRINGS.ride.resumeRideTitle, STRINGS.ride.resumeRideMessage, [
      {
        text: STRINGS.ride.resumeRideDiscard,
        style: 'destructive',
        onPress: () => {
          deleteKey(STORAGE_KEYS.ACTIVE_RIDE);
        },
      },
      {
        text: STRINGS.ride.resumeRideConfirm,
        onPress: () => {
          const ok = restoreFromActiveRideSnapshot(snap);
          if (ok) {
            navigationRef.navigate('RideRecording');
          }
        },
      },
    ]);
  }, [navReady, navigationRef, restoreFromActiveRideSnapshot]);

  return null;
}
