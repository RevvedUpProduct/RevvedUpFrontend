import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScreenContainer, StatusPill} from '@components/index';
import {COLORS} from '@constants/colors';
import {CONFIG} from '@constants/config';
import {SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useRideStore} from '@store/rideStore';
import {useMemoryStore} from '@store/memoryStore';
import {AddMemorySheet} from '@features/memory/components/AddMemorySheet';
import {RideControls} from './components/RideControls';
import {RideMap} from './components/RideMap';
import {RideMetricsBar} from './components/RideMetricsBar';
import {useRideTracker} from './useRideTracker';

export function RideRecordingScreen({navigation}) {
  const status = useRideStore(s => s.status);
  const rideId = useRideStore(s => s.rideId);
  const coordinates = useRideStore(s => s.coordinates);
  const metrics = useRideStore(s => s.metrics);
  const gpsStatus = useRideStore(s => s.gpsStatus);
  const startRide = useRideStore(s => s.startRide);
  const pauseRide = useRideStore(s => s.pauseRide);
  const resumeRide = useRideStore(s => s.resumeRide);
  const stopRide = useRideStore(s => s.stopRide);

  const memoriesByRide = useMemoryStore(s => s.byRide);
  const memories = rideId ? memoriesByRide[rideId] ?? [] : [];

  const [addMemoryVisible, setAddMemoryVisible] = useState(false);

  useRideTracker({simulate: CONFIG.useMockServices});

  // Auto-start once on mount; ref guards against infinite retry if service fails.
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (hasAutoStarted.current) return;
    if (status === 'idle') {
      hasAutoStarted.current = true;
      void startRide();
    }
  }, [status, startRide]);

  const handleStop = useCallback(() => {
    Alert.alert(STRINGS.ride.confirmStopTitle, STRINGS.ride.confirmStopMessage, [
      {text: STRINGS.ride.cancel, style: 'cancel'},
      {
        text: STRINGS.ride.confirmStop,
        style: 'destructive',
        onPress: async () => {
          const res = await stopRide();
          if (res.ok && res.ride) {
            navigation.replace('RideSummary', {rideId: res.ride.id});
          }
        },
      },
    ]);
  }, [stopRide, navigation]);

  const lastCoord = coordinates[coordinates.length - 1];

  const gpsPill = (
    <StatusPill
      label={
        gpsStatus === 'active'
          ? STRINGS.ride.gpsActive
          : gpsStatus === 'lost' || gpsStatus === 'denied'
          ? STRINGS.ride.gpsLost
          : STRINGS.ride.gpsSearching
      }
      tone={gpsStatus === 'active' ? 'success' : gpsStatus === 'lost' ? 'danger' : 'info'}
    />
  );

  return (
    <ScreenContainer edgeToEdge>
      <RideMap coordinates={coordinates} memories={memories} follow />

      <SafeAreaView style={styles.topSafeArea} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow}>{gpsPill}</View>
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
          />
        </View>
      </SafeAreaView>

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
  topSafeArea: {position: 'absolute', top: 0, left: 0, right: 0},
  topRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
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
});
