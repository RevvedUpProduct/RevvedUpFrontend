import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Button, Card, MetricTile, ScreenContainer, SectionHeader} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {rideService} from '@services/rideService';
import {useMemoryStore} from '@store/memoryStore';
import {useRideStore} from '@store/rideStore';
import {formatDate, formatDistance, formatDuration, formatSpeed} from '@utils/format';
import {RideMap} from './components/RideMap';

// Stable reference so the Zustand selector always returns the same empty array
// identity when there are no memories yet, avoiding the useSyncExternalStore
// "getSnapshot result must be cached" infinite-loop warning.
const EMPTY_MEMORIES = Object.freeze([]);

export function RideSummaryScreen({route, navigation}) {
  const {rideId} = route.params;
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);

  const memories = useMemoryStore(s => s.byRide[rideId] ?? EMPTY_MEMORIES);
  const loadMemories = useMemoryStore(s => s.loadMemoriesForRide);
  const resetRide = useRideStore(s => s.reset);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await rideService.getRideById(rideId);
      if (!active) return;
      if (res.ok) setRide(res.data.ride);
      else setError(res.error.message);
    })();
    void loadMemories(rideId);
    return () => {
      active = false;
    };
  }, [rideId, loadMemories]);

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!ride) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.accentPrimary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mapWrapper}>
          <RideMap
            coordinates={ride.coordinates}
            memories={memories}
            follow={false}
            fitToRoute
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.distance}>{formatDistance(ride.metrics.distanceMeters)}</Text>
          <Text style={styles.subtitle}>
            {formatDate(ride.startedAt)} · {ride.type === 'group' ? 'Group ride' : 'Solo ride'}
          </Text>
        </View>

        <Card style={styles.metricsGrid}>
          <View style={styles.metricRow}>
            <MetricTile
              label={STRINGS.ride.duration}
              value={formatDuration(ride.metrics.durationMs)}
              accentColor={COLORS.accentCyan}
              align="flex-start"
            />
            <MetricTile
              label={STRINGS.ride.avgSpeed}
              value={formatSpeed(ride.metrics.averageSpeedKmh)}
              accentColor={COLORS.accentAmber}
              align="flex-start"
            />
          </View>
          <View style={styles.metricRow}>
            <MetricTile
              label={STRINGS.ride.maxSpeed}
              value={formatSpeed(ride.metrics.maxSpeedKmh)}
              accentColor={COLORS.accentViolet}
              align="flex-start"
            />
            <MetricTile
              label="Memories"
              value={String(memories.length)}
              accentColor={COLORS.accentPrimary}
              align="flex-start"
            />
          </View>
        </Card>

        {memories.length > 0 ? (
          <View style={styles.memoriesSection}>
            <SectionHeader title={STRINGS.memory.title} />
            <View style={styles.memoryGrid}>
              {memories.map(m => (
                <Card key={m.id} style={styles.memoryTile} padding="sm">
                  <Text style={styles.memoryTime} numberOfLines={1}>
                    {m.caption ?? '📷 Memory'}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        <Button
          label="Done"
          variant="primary"
          fullWidth
          onPress={() => {
            resetRide();
            navigation.popToTop();
          }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  error: {color: COLORS.danger, fontSize: FONT.size.md, textAlign: 'center', paddingHorizontal: SPACING.lg},
  mapWrapper: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: SPACING.base,
  },
  header: {gap: SPACING.xs},
  distance: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.display,
    fontWeight: FONT.weight.bold,
    letterSpacing: -1,
  },
  subtitle: {color: COLORS.textSecondary, fontSize: FONT.size.md},
  metricsGrid: {gap: SPACING.lg},
  metricRow: {flexDirection: 'row', gap: SPACING.lg},
  memoriesSection: {gap: SPACING.sm},
  memoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  memoryTile: {
    width: '31%',
    aspectRatio: 1,
    justifyContent: 'flex-end',
  },
  memoryTime: {color: COLORS.textPrimary, fontSize: FONT.size.sm},
});
