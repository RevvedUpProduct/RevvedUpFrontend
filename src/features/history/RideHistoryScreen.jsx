import React, {useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Card} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useHistoryStore} from '@store/historyStore';
import {formatDate, formatDistance, formatDurationShort} from '@utils/format';
import {RideHistoryItem} from './components/RideHistoryItem';

const FILTERS = [
  {key: 'all', label: STRINGS.history.filterAll},
  {key: 'solo', label: STRINGS.history.filterSolo},
  {key: 'group', label: STRINGS.history.filterGroup},
];

function rideMatchesQuery(ride, q) {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const hay = [
    ride.id,
    ride.type,
    formatDate(ride.startedAt),
    ride.startLocationLabel,
    ride.endLocationLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

export function RideHistoryScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const rides = useHistoryStore(s => s.rides);
  const isRefreshing = useHistoryStore(s => s.isRefreshing);
  const filter = useHistoryStore(s => s.filter);
  const load = useHistoryStore(s => s.load);
  const refresh = useHistoryStore(s => s.refresh);
  const setFilter = useHistoryStore(s => s.setFilter);

  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const byType = filter === 'all' ? rides : rides.filter(r => r.type === filter);
    return byType.filter(r => rideMatchesQuery(r, search));
  }, [filter, rides, search]);

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

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={STRINGS.history.searchPlaceholder}
          placeholderTextColor={COLORS.textTertiary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

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
    <View style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={[
          styles.listContent,
          {paddingTop: Math.max(insets.top, SPACING.sm)},
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.accentPrimary}
          />
        }
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyLabel}>
              {rides.length === 0 ? STRINGS.home.noRides : STRINGS.history.noSearchResults}
            </Text>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.background},
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {gap: SPACING.md, paddingBottom: SPACING.lg},
  title: {color: COLORS.textPrimary, fontSize: FONT.size.xxl, fontWeight: FONT.weight.bold},
  subtitle: {color: COLORS.textSecondary, fontSize: FONT.size.md},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
    paddingVertical: SPACING.xs,
  },
  filterRow: {flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap'},
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
  emptyLabel: {color: COLORS.textSecondary, textAlign: 'center', fontSize: FONT.size.md, paddingVertical: SPACING.lg},
});
