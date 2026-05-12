import React, {useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SHADOW, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {Card, ScreenContainer, SectionHeader} from '@components/index';
import {useHistoryStore} from '@store/historyStore';
import {useProfileStore} from '@store/profileStore';
import {formatDistance, formatDurationShort} from '@utils/format';
import {computeExplorerProgress} from '@utils/explorerProgress';
import {RideHistoryItem} from '@features/history/components/RideHistoryItem';

const GRADIENT_ID = 'explorerCardGrad';

export function HomeScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const rides = useHistoryStore(s => s.rides);
  const displayName = useProfileStore(s => s.profile.displayName);

  const totalRides = rides.length;
  const totalDistanceMeters = rides.reduce((acc, r) => acc + r.distanceMeters, 0);
  const totalDurationMs = rides.reduce((acc, r) => acc + r.durationMs, 0);
  const recent = rides.slice(0, 3);

  const explorer = useMemo(
    () => computeExplorerProgress(totalDistanceMeters, totalDurationMs, totalRides),
    [totalDistanceMeters, totalDurationMs, totalRides],
  );

  const cardInnerWidth = windowWidth - SPACING.lg * 2;
  const cardHeight = 132;

  const openSettings = () => {
    navigation.navigate('ProfileSettings');
  };

  return (
    <ScreenContainer edgeToEdge>
      <SafeAreaView style={styles.safeBottom} edges={['bottom', 'left', 'right']}>
        <View style={styles.homeColumn}>
          {/* Sticky top bar (outside ScrollView so it stays anchored while content scrolls) */}
          <View style={[styles.topBar, {paddingTop: insets.top}]}>
            <View style={styles.profileBlock}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account" size={26} color={COLORS.accentPrimary} />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileGreeting}>{STRINGS.home.profileGreeting}</Text>
                <Text style={styles.profileName}>{displayName}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={STRINGS.profile.title}
              onPress={openSettings}
              style={({pressed}) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}>
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

            {/* Explorer level / XP card with gradient */}
            <View style={[styles.explorerCardOuter, SHADOW.md]}>
              <View style={[styles.explorerCard, {width: cardInnerWidth, minHeight: cardHeight}]}>
                <Svg
                  width={cardInnerWidth}
                  height={cardHeight}
                  style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={COLORS.accentPrimary} stopOpacity="0.45" />
                      <Stop offset="0.45" stopColor={COLORS.accentViolet} stopOpacity="0.35" />
                      <Stop offset="1" stopColor={COLORS.accentCyan} stopOpacity="0.25" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width={cardInnerWidth} height={cardHeight} fill={`url(#${GRADIENT_ID})`} />
                </Svg>
                <View style={styles.explorerCardInner}>
                  <View style={styles.explorerTopRow}>
                    <View style={styles.explorerTitleRow}>
                      <MaterialCommunityIcons name="compass-outline" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.explorerTitle}>{STRINGS.home.explorerScore}</Text>
                    </View>
                    <View style={styles.levelBadge}>
                      <MaterialCommunityIcons name="shield-star-outline" size={16} color={COLORS.textInverse} />
                      <Text style={styles.levelBadgeText}>
                        {STRINGS.home.levelLabel} {explorer.level}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.xpRow}>
                    <MaterialCommunityIcons name="flash" size={18} color={COLORS.accentAmber} />
                    <Text style={styles.xpValue}>{explorer.xp.toLocaleString()} XP</Text>
                    <Text style={styles.xpSub}>
                      {explorer.xpIntoLevel}/{explorer.xpToNext} {STRINGS.home.xpToNext}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {width: `${Math.min(100, explorer.progressPct)}%`},
                      ]}
                    />
                  </View>
                  <Text style={styles.explorerFootnote}>
                    {formatDurationShort(totalDurationMs)} {STRINGS.home.riddenHint}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader
                title={STRINGS.home.recentRides}
                actionLabel={STRINGS.home.viewAll}
                onActionPress={() => navigation.navigate('History', {screen: 'RideHistory'})}
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
                      onPress={() =>
                        navigation.navigate('History', {screen: 'RideDetail', params: {rideId: ride.id}})
                      }
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={STRINGS.home.startRide}
        onPress={() => navigation.navigate('RideRecording')}
        style={({pressed}) => [
          styles.fab,
          {bottom: SPACING.xl + insets.bottom},
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
  safeBottom: {flex: 1},
  homeColumn: {flex: 1},
  scrollView: {flex: 1},
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.huge * 2,
    gap: SPACING.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    zIndex: 2,
    elevation: 3,
  },
  profileBlock: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {gap: 2, flex: 1},
  profileGreeting: {color: COLORS.textSecondary, fontSize: FONT.size.xs, fontWeight: FONT.weight.medium},
  profileName: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.bold},
  iconBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBtnPressed: {opacity: 0.88},
  header: {gap: SPACING.xs},
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
  explorerCardOuter: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  explorerCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surface,
  },
  explorerCardInner: {
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  explorerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  explorerTitleRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  explorerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,15,16,0.55)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  levelBadgeText: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  xpValue: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  xpSub: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    flex: 1,
    textAlign: 'right',
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(15,15,16,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentPrimary,
  },
  explorerFootnote: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.xs,
  },
  section: {gap: SPACING.sm},
  list: {gap: SPACING.md},
  empty: {color: COLORS.textSecondary, fontSize: FONT.size.md, textAlign: 'center', paddingVertical: SPACING.lg},
  fab: {
    position: 'absolute',
    right: SPACING.lg,
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
