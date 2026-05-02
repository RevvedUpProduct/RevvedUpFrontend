import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Card, MetricTile, ScreenContainer, SectionHeader} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {RideMap} from '@features/ride/components/RideMap';
import {rideService} from '@services/rideService';
import {useMemoryStore} from '@store/memoryStore';
import {formatDate, formatDistance, formatDuration, formatSpeed, formatTime} from '@utils/format';

const EMPTY_MEMORIES = Object.freeze([]);

export function RideDetailScreen({route, navigation}) {
  const {rideId} = route.params;
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);

  const memories = useMemoryStore(s => s.byRide[rideId] ?? EMPTY_MEMORIES);
  const loadMemories = useMemoryStore(s => s.loadMemoriesForRide);

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

  useEffect(() => {
    if (ride) {
      navigation.setOptions({
        title:
          [ride.startLocationLabel, ride.endLocationLabel].filter(Boolean).join(' → ') ||
          formatDate(ride.startedAt),
      });
    }
  }, [ride, navigation]);

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
          <RideMap coordinates={ride.coordinates} memories={memories} follow={false} />
        </View>

        <Card>
          <Text style={styles.dateLabel}>{formatDate(ride.startedAt)}</Text>
          <Text style={styles.headlineDistance}>
            {formatDistance(ride.metrics.distanceMeters)}
          </Text>
        </Card>

        <Card>
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
          <View style={[styles.metricRow, {marginTop: SPACING.lg}]}>
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
          <View style={styles.section}>
            <SectionHeader title={STRINGS.memory.title} />
            {memories.map(m => (
              <Card key={m.id} style={styles.memoryRow}>
                <View style={styles.memoryRowInner}>
                  <Text style={styles.memoryGlyph}>📍</Text>
                  <View style={{flex: 1}}>
                    <Text style={styles.memoryTitle} numberOfLines={1}>
                      {m.caption ?? 'Memory'}
                    </Text>
                    <Text style={styles.memoryMeta}>
                      {formatTime(m.capturedAt)} · {m.coordinate.latitude.toFixed(4)},{' '}
                      {m.coordinate.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  error: {color: COLORS.danger, fontSize: FONT.size.md, textAlign: 'center'},
  mapWrapper: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: SPACING.base,
  },
  dateLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
  },
  headlineDistance: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.display,
    fontWeight: FONT.weight.bold,
    letterSpacing: -1,
  },
  metricRow: {flexDirection: 'row', gap: SPACING.lg},
  section: {gap: SPACING.sm},
  memoryRow: {marginBottom: SPACING.sm},
  memoryRowInner: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  memoryGlyph: {fontSize: 24},
  memoryTitle: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.semibold},
  memoryMeta: {color: COLORS.textSecondary, fontSize: FONT.size.sm, marginTop: SPACING.xxs},
});
