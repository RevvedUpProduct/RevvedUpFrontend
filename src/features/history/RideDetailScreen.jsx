import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Card, MetricTile, ScreenContainer, SectionHeader} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {MemoryViewer} from '@features/ride/components/MemoryViewer';
import {RideMap} from '@features/ride/components/RideMap';
import {useMemoryStore} from '@store/memoryStore';
import {useHistoryStore} from '@store/historyStore';
import {formatDate, formatDistance, formatDuration, formatSpeed, formatTime} from '@utils/format';

const EMPTY_MEMORIES = Object.freeze([]);

export function RideDetailScreen({route, navigation}) {
  const {rideId} = route.params;
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);

  const memories = useMemoryStore(s => s.byRide[rideId] ?? EMPTY_MEMORIES);
  const loadMemories = useMemoryStore(s => s.loadMemoriesForRide);
  const getRideDetailFromCache = useHistoryStore(s => s.getRideDetailFromCache);

  const handleMemoryPress = useCallback(memory => setSelectedMemory(memory), []);

  useEffect(() => {
    const cached = getRideDetailFromCache(rideId);
    if (cached) {
      setRide(cached);
      setError(null);
    } else {
      setRide(null);
      setError(STRINGS.errors.notFound);
    }
    loadMemories(rideId);
  }, [rideId, loadMemories, getRideDetailFromCache]);

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
          <RideMap
            coordinates={ride.coordinates}
            memories={memories}
            follow={false}
            fitToRoute
            onMemoryPress={handleMemoryPress}
          />
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
              <Pressable
                key={m.id}
                onPress={() => handleMemoryPress(m)}
                accessibilityRole="button"
                accessibilityLabel={m.caption ?? 'Memory'}
                style={({pressed}) => pressed && styles.memoryPressed}>
                <Card style={styles.memoryRow}>
                  <View style={styles.memoryRowInner}>
                    {/* Thumbnail */}
                    <View style={styles.memoryThumbWrapper}>
                      <Image
                        source={{uri: m.imageUri}}
                        style={styles.memoryThumb}
                        resizeMode="cover"
                      />
                    </View>
                    {/* Text */}
                    <View style={styles.memoryText}>
                      <Text style={styles.memoryTitle} numberOfLines={1}>
                        {m.caption ?? 'Memory Snapshot'}
                      </Text>
                      <Text style={styles.memoryMeta}>
                        {formatTime(m.capturedAt)}  ·  {m.coordinate.latitude.toFixed(4)},{' '}
                        {m.coordinate.longitude.toFixed(4)}
                      </Text>
                    </View>
                    <Text style={styles.memoryChevron}>›</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <MemoryViewer
        memory={selectedMemory}
        visible={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
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
  memoryPressed: {opacity: 0.82},
  memoryRow: {marginBottom: 0},
  memoryRowInner: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  memoryThumbWrapper: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
  },
  memoryThumb: {width: '100%', height: '100%'},
  memoryText: {flex: 1},
  memoryTitle: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.semibold},
  memoryMeta: {color: COLORS.textSecondary, fontSize: FONT.size.sm, marginTop: SPACING.xxs},
  memoryChevron: {color: COLORS.textTertiary, fontSize: FONT.size.xl, fontWeight: FONT.weight.light},
});
