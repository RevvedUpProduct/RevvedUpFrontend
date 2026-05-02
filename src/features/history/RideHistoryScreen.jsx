import React, {useEffect, useMemo} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Card, ScreenContainer} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useHistoryStore} from '@store/historyStore';
import {formatDistance, formatDurationShort} from '@utils/format';
import {RideHistoryItem} from './components/RideHistoryItem';

const FILTERS = [
  {key: 'all', label: STRINGS.history.filterAll},
  {key: 'solo', label: STRINGS.history.filterSolo},
  {key: 'group', label: STRINGS.history.filterGroup},
];

export function RideHistoryScreen({navigation}) {
  const rides = useHistoryStore(s => s.rides);
  const isLoading = useHistoryStore(s => s.isLoading);
  const isRefreshing = useHistoryStore(s => s.isRefreshing);
  const filter = useHistoryStore(s => s.filter);
  const load = useHistoryStore(s => s.load);
  const refresh = useHistoryStore(s => s.refresh);
  const setFilter = useHistoryStore(s => s.setFilter);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === 'all' ? rides : rides.filter(r => r.type === filter)),
    [filter, rides],
  );

  const totals = useMemo(
    () => ({
      count: rides.length,
      distance: rides.reduce((acc, r) => acc + r.distanceMeters, 0),
      duration: rides.reduce((acc, r) => acc + r.durationMs, 0),
    }),
    [rides],
  );

  const renderItem = ({item}) => (
    <RideHistoryItem
      ride={item}
      onPress={() => navigation.navigate('RideDetail', {rideId: item.id})}
    />
  );

  const Header = (
    <View style={styles.header}>
      <Text style={styles.title}>{STRINGS.history.title}</Text>
      <Text style={styles.subtitle}>{STRINGS.history.subtitle}</Text>

      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{selected: active}}
              onPress={() => setFilter(f.key)}
              style={({pressed}) => [
                styles.filterChip,
                active ? styles.filterChipActive : styles.filterChipIdle,
                pressed ? styles.filterChipPressed : null,
              ]}>
              <Text
                style={[
                  styles.filterChipLabel,
                  {color: active ? COLORS.textInverse : COLORS.textPrimary},
                ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={[styles.statValue, {color: COLORS.accentPrimary}]}>{totals.count}</Text>
          <Text style={styles.statLabel}>{STRINGS.history.statTotalRides}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={[styles.statValue, {color: COLORS.accentCyan}]}>
            {formatDistance(totals.distance)}
          </Text>
          <Text style={styles.statLabel}>{STRINGS.history.statTotalKm}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={[styles.statValue, {color: COLORS.accentAmber}]}>
            {formatDurationShort(totals.duration)}
          </Text>
          <Text style={styles.statLabel}>{STRINGS.history.statTotalTime}</Text>
        </View>
      </Card>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.accentPrimary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={COLORS.accentPrimary} />
            </View>
          ) : (
            <Card>
              <Text style={styles.emptyLabel}>{STRINGS.home.noRides}</Text>
            </Card>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {gap: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.lg},
  title: {color: COLORS.textPrimary, fontSize: FONT.size.xxl, fontWeight: FONT.weight.bold},
  subtitle: {color: COLORS.textSecondary, fontSize: FONT.size.md},
  filterRow: {flexDirection: 'row', gap: SPACING.sm},
  filterChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentPrimary,
  },
  filterChipIdle: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  filterChipPressed: {opacity: 0.85},
  filterChipLabel: {fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold},
  statsRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  statCol: {flex: 1, alignItems: 'center', gap: SPACING.xxs},
  statDivider: {width: 1, height: 32, backgroundColor: COLORS.border},
  statValue: {fontSize: FONT.size.lg, fontWeight: FONT.weight.bold},
  statLabel: {color: COLORS.textSecondary, fontSize: FONT.size.xs, textTransform: 'uppercase', letterSpacing: 0.4},
  separator: {height: SPACING.md},
  empty: {paddingVertical: SPACING.xxl, alignItems: 'center'},
  emptyLabel: {color: COLORS.textSecondary, textAlign: 'center', fontSize: FONT.size.md, paddingVertical: SPACING.lg},
});
