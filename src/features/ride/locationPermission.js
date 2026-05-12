import {Platform} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';

function iosWhenInUse() {
  return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
}

function androidFine() {
  return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
}

/**
 * @returns {Promise<'granted' | 'denied' | 'blocked'>}
 */
export async function ensureForegroundLocationPermission() {
  const permission = Platform.OS === 'ios' ? iosWhenInUse() : androidFine();
  const current = await check(permission);
  if (current === RESULTS.GRANTED) {
    return 'granted';
  }
  if (current === RESULTS.BLOCKED || current === RESULTS.UNAVAILABLE) {
    return 'blocked';
  }
  const next = await request(permission);
  if (next === RESULTS.GRANTED) {
    return 'granted';
  }
  if (next === RESULTS.BLOCKED) {
    return 'blocked';
  }
  return 'denied';
}

export function openAppLocationSettings() {
  void openSettings();
}
