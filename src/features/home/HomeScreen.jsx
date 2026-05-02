import React, {useEffect} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SHADOW, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {Card, ScreenContainer, SectionHeader} from '@components/index';
import {useHistoryStore} from '@store/historyStore';
import {formatDistance, formatDurationShort} from '@utils/format';
import {RideHistoryItem} from '@features/history/components/RideHistoryItem';

export function HomeScreen({navigation}) {
  const rides = useHistoryStore(s => s.rides);
  const load = useHistoryStore(s => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const totalRides = rides.length;
  const totalDistanceMeters = rides.reduce((acc, r) => acc + r.distanceMeters, 0);
  const totalDurationMs = rides.reduce((acc, r) => acc + r.durationMs, 0);
  const recent = rides.slice(0, 3);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{STRINGS.home.greeting}</Text>
          <Text style={styles.subgreeting}>{STRINGS.app.tagline}</Text>
        </View>

        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>{STRINGS.home.totalDistance}</Text>
            <Text style={[styles.metricValue, {color: COLORS.accentPrimary}]}>
              {formatDistance(totalDistanceMeters)}
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>{STRINGS.home.totalRides}</Text>
            <Text style={[styles.metricValue, {color: COLORS.accentCyan}]}>{totalRides}</Text>
          </Card>
        </View>

        <Card style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreTitle}>{STRINGS.home.explorerScore}</Text>
            <Text style={styles.scoreLevel}>
              {formatDurationShort(totalDurationMs)} ridden
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.min(100, totalRides * 5)}%`},
              ]}
            />
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader
            title={STRINGS.home.recentRides}
            actionLabel={STRINGS.home.viewAll}
            onActionPress={() => navigation.navigate('History')}
          />
          {recent.length === 0 ? (
            <Card>
              <Text style={styles.empty}>{STRINGS.home.noRides}</Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {recent.map(ride => (
                <RideHistoryItem
                  key={ride.id}
                  ride={ride}
                  onPress={() => navigation.navigate('RideDetail', {rideId: ride.id})}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={STRINGS.home.startRide}
        onPress={() => navigation.navigate('RideRecording')}
        style={({pressed}) => [
          styles.fab,
          SHADOW.lg,
          pressed ? styles.fabPressed : null,
        ]}>
        <Text style={styles.fabGlyph}>▶</Text>
        <Text style={styles.fabLabel}>{STRINGS.home.startRide}</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.huge * 2,
    gap: SPACING.lg,
  },
  header: {gap: SPACING.xs, paddingTop: SPACING.sm},
  greeting: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    letterSpacing: -0.5,
  },
  subgreeting: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.md,
  },
  metricsRow: {flexDirection: 'row', gap: SPACING.md},
  metricCard: {flex: 1, gap: SPACING.xs},
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    letterSpacing: -0.5,
  },
  scoreCard: {gap: SPACING.md},
  scoreRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  scoreTitle: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.semibold},
  scoreLevel: {color: COLORS.accentPrimary, fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold},
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentPrimary,
  },
  section: {gap: SPACING.sm},
  list: {gap: SPACING.md},
  empty: {color: COLORS.textSecondary, fontSize: FONT.size.md, textAlign: 'center', paddingVertical: SPACING.lg},
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentPrimary,
  },
  fabPressed: {opacity: 0.9, transform: [{scale: 0.97}]},
  fabGlyph: {color: COLORS.textInverse, fontSize: FONT.size.md},
  fabLabel: {
    color: COLORS.textInverse,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    letterSpacing: 0.3,
  },
});
