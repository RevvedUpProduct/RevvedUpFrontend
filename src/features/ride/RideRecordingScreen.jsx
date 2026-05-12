import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScreenContainer, StatusPill} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useRideStore} from '@store/rideStore';
import {useMemoryStore} from '@store/memoryStore';
import {AddMemorySheet} from '@features/memory/components/AddMemorySheet';
import {openAppLocationSettings} from '@features/ride/locationPermission';
import {RideControls} from './components/RideControls';
import {RideMap} from './components/RideMap';
import {RideMetricsBar} from './components/RideMetricsBar';
import {useRideTracker} from './useRideTracker';

const ACTIVE_STATUSES = ['recording', 'paused'];

const NAV_REPLACE_FALLBACK_MS = 2500;

/** Lets the MapView unmount before pushing Summary; always reaches replace via fallback timeout. */
function scheduleReplaceSummary(navigation, rideId) {
  let done = false;
  const runOnce = () => {
    if (done) return;
    done = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (navigation?.replace) {
          navigation.replace('RideSummary', {rideId});
        }
      }, 100);
    });
  };
  const fallbackId = setTimeout(runOnce, NAV_REPLACE_FALLBACK_MS);
  InteractionManager.runAfterInteractions(() => {
    clearTimeout(fallbackId);
    runOnce();
  });
}

export function RideRecordingScreen({navigation}) {
  const status = useRideStore(s => s.status);
  const rideId = useRideStore(s => s.rideId);
  const coordinates = useRideStore(s => s.coordinates);
  const metrics = useRideStore(s => s.metrics);
  const gpsStatus = useRideStore(s => s.gpsStatus);
  const isSyncing = useRideStore(s => s.isSyncing);
  const startRide = useRideStore(s => s.startRide);
  const pauseRide = useRideStore(s => s.pauseRide);
  const resumeRide = useRideStore(s => s.resumeRide);
  const stopRide = useRideStore(s => s.stopRide);
  const resetRide = useRideStore(s => s.reset);

  const memoriesByRide = useMemoryStore(s => s.byRide);
  const memories = rideId ? memoriesByRide[rideId] ?? [] : [];

  const [addMemoryVisible, setAddMemoryVisible] = useState(false);
  const [startError, setStartError] = useState(null);
  const [savingRide, setSavingRide] = useState(false);

  const hasAttemptedAutoStart = useRef(false);

  const canEndRide = ACTIVE_STATUSES.includes(status) && Boolean(rideId);
  const showStartingRideHint =
    ACTIVE_STATUSES.includes(status) && isSyncing && String(rideId ?? '').startsWith('local_');

  useRideTracker();

  useEffect(() => {
    if (status !== 'idle') {
      hasAttemptedAutoStart.current = true;
      return;
    }
    if (hasAttemptedAutoStart.current) return;
    hasAttemptedAutoStart.current = true;
    void startRide().then(res => {
      if (!res?.ok) {
        setStartError(typeof res?.error === 'string' ? res.error : res?.error?.message ?? 'Unknown error');
      } else {
        setStartError(null);
      }
    });
  }, [status, startRide]);

  const handleRetryStart = useCallback(async () => {
    setStartError(null);
    const res = await startRide();
    if (!res?.ok) {
      setStartError(typeof res?.error === 'string' ? res.error : res?.error?.message ?? 'Unknown error');
    }
  }, [startRide]);

  const runStopThenNavigate = useCallback(
    fromBackNavigation => {
      const finish = async () => {
        setSavingRide(true);
        try {
          const res = await stopRide();
          if (res.ok && res.ride) {
            scheduleReplaceSummary(navigation, res.ride.id);
            return;
          }
          const message =
            typeof res.error === 'string' ? res.error : res?.error?.message ?? 'Unknown error';
          const buttons = fromBackNavigation
            ? [
                {text: 'Stay', style: 'cancel'},
                {
                  text: STRINGS.ride.goHome,
                  style: 'destructive',
                  onPress: () => {
                    resetRide();
                    InteractionManager.runAfterInteractions(() => {
                      requestAnimationFrame(() => navigation.navigate('Home'));
                    });
                  },
                },
              ]
            : [{text: 'OK'}];
          Alert.alert(STRINGS.ride.stopFailedTitle, message, buttons);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          const buttons = fromBackNavigation
            ? [
                {text: 'Stay', style: 'cancel'},
                {
                  text: STRINGS.ride.goHome,
                  style: 'destructive',
                  onPress: () => {
                    resetRide();
                    InteractionManager.runAfterInteractions(() => {
                      requestAnimationFrame(() => navigation.navigate('Home'));
                    });
                  },
                },
              ]
            : [{text: 'OK'}];
          Alert.alert(STRINGS.ride.stopFailedTitle, message, buttons);
        } finally {
          setSavingRide(false);
        }
      };
      void finish();
    },
    [stopRide, navigation, resetRide],
  );

  const handleStop = useCallback(() => {
    if (!canEndRide) return;
    Alert.alert(STRINGS.ride.confirmStopTitle, STRINGS.ride.confirmStopMessage, [
      {text: STRINGS.ride.cancel, style: 'cancel'},
      {
        text: STRINGS.ride.confirmStop,
        style: 'destructive',
        onPress: () => runStopThenNavigate(false),
      },
    ]);
  }, [canEndRide, runStopThenNavigate]);

  const confirmDiscardOrStop = useCallback(() => {
    Alert.alert(
      'Leave ride?',
      'You have a ride in progress. End it now to save your route, or stay on the screen to keep recording.',
      [
        {text: 'Stay', style: 'cancel'},
        {
          text: STRINGS.ride.confirmStop,
          style: 'destructive',
          onPress: () => runStopThenNavigate(true),
        },
      ],
    );
  }, [runStopThenNavigate]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (ACTIVE_STATUSES.includes(status)) {
        confirmDiscardOrStop();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [status, confirmDiscardOrStop]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!ACTIVE_STATUSES.includes(status)) return;
      e.preventDefault();
      confirmDiscardOrStop();
    });
    return unsubscribe;
  }, [navigation, status, confirmDiscardOrStop]);

  const lastCoord = coordinates[coordinates.length - 1];

  const showMap = ACTIVE_STATUSES.includes(status);

  const gpsLabel =
    gpsStatus === 'active'
      ? STRINGS.ride.gpsActive
      : gpsStatus === 'denied'
      ? STRINGS.ride.permissionDeniedTitle
      : gpsStatus === 'lost'
      ? STRINGS.ride.gpsLost
      : gpsStatus === 'degraded'
      ? STRINGS.ride.gpsDegraded
      : gpsStatus === 'receiving'
      ? STRINGS.ride.gpsReceiving
      : STRINGS.ride.gpsSearching;

  const gpsTone =
    gpsStatus === 'active'
      ? 'success'
      : gpsStatus === 'lost' || gpsStatus === 'denied'
      ? 'danger'
      : gpsStatus === 'degraded'
      ? 'warning'
      : 'info';

  const gpsPill = (
    <Pressable
      onPress={gpsStatus === 'denied' ? openAppLocationSettings : undefined}
      disabled={gpsStatus !== 'denied'}
      accessibilityRole={gpsStatus === 'denied' ? 'button' : undefined}
      accessibilityLabel={gpsStatus === 'denied' ? STRINGS.ride.openSettings : undefined}>
      <StatusPill label={gpsLabel} tone={gpsTone} />
    </Pressable>
  );

  const startingPill = showStartingRideHint ? (
    <StatusPill label={STRINGS.ride.startingRide} tone="info" />
  ) : null;

  const showStartFailure = status === 'idle' && startError;

  return (
    <ScreenContainer edgeToEdge>
      {showMap ? (
        <RideMap coordinates={coordinates} memories={memories} follow />
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={COLORS.accentPrimary} />
        </View>
      )}

      <Modal visible={savingRide} transparent animationType="fade">
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={COLORS.accentPrimary} />
            <Text style={styles.savingText}>{STRINGS.ride.savingRide}</Text>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.topSafeArea} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow}>
          {gpsPill}
          {startingPill}
        </View>
        {gpsStatus === 'denied' ? (
          <Pressable onPress={openAppLocationSettings} style={styles.settingsLink}>
            <Text style={styles.settingsLinkText}>{STRINGS.ride.openSettings}</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>

      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.bottomCard}>
          <RideMetricsBar metrics={metrics} />
          <RideControls
            status={status}
            onPause={pauseRide}
            onResume={resumeRide}
            onStop={handleStop}
            onAddMemory={() => setAddMemoryVisible(true)}
            stopDisabled={!canEndRide}
          />
        </View>
      </SafeAreaView>

      {showStartFailure ? (
        <View style={styles.errorOverlay} pointerEvents="box-none">
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{STRINGS.ride.startRideFailedTitle}</Text>
            <Text style={styles.errorBody}>{startError}</Text>
            <Pressable style={styles.primaryBtn} onPress={handleRetryStart}>
              <Text style={styles.primaryBtnText}>{STRINGS.ride.startRideRetry}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setStartError(null);
                navigation.goBack();
              }}>
              <Text style={styles.secondaryBtnText}>{STRINGS.ride.cancel}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <AddMemorySheet
        visible={addMemoryVisible}
        onClose={() => setAddMemoryVisible(false)}
        rideId={rideId}
        currentCoordinate={lastCoord}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSafeArea: {position: 'absolute', top: 0, left: 0, right: 0},
  topRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingsLink: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  settingsLinkText: {
    color: COLORS.accentCyan,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  bottomSafeArea: {position: 'absolute', bottom: 0, left: 0, right: 0},
  bottomCard: {
    margin: SPACING.lg,
    padding: SPACING.base,
    backgroundColor: COLORS.surfaceOverlay,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
  },
  errorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  errorBody: {color: COLORS.textSecondary, fontSize: FONT.size.md},
  primaryBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: SPACING.base,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: FONT.weight.bold,
    fontSize: FONT.size.md,
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {color: COLORS.textSecondary, fontSize: FONT.size.md},
  savingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  savingText: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
});
