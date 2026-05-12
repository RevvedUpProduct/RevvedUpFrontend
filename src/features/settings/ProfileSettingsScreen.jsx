import React, {useMemo} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppHeaderBar, ScreenContainer} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SHADOW, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useHistoryStore} from '@store/historyStore';
import {useProfileStore} from '@store/profileStore';
import {computeExplorerProgress} from '@utils/explorerProgress';
import {formatDistance} from '@utils/format';
import {displayInitials} from '@utils/profileDisplay';

const CARD_GRAD_ID = 'profileHubCardGrad';

const MENU = [
  {key: 'garage', icon: 'garage', labelKey: 'myGarage', route: 'MyGarage'},
  {key: 'emergency', icon: 'heart-pulse', labelKey: 'emergencyInfo', route: 'EmergencyInformation'},
  {key: 'gear', icon: 'shield-outline', labelKey: 'riderGear', route: 'RiderGear'},
];

export function ProfileSettingsScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const profile = useProfileStore(s => s.profile);
  const resetBundle = useProfileStore(s => s.resetProfileBundleToDefaults);
  const rides = useHistoryStore(s => s.rides);

  const totalRides = rides.length;
  const totalDistanceMeters = rides.reduce((acc, r) => acc + r.distanceMeters, 0);
  const totalDurationMs = rides.reduce((acc, r) => acc + r.durationMs, 0);

  const explorer = useMemo(
    () => computeExplorerProgress(totalDistanceMeters, totalDurationMs, totalRides),
    [totalDistanceMeters, totalDurationMs, totalRides],
  );

  const cardInnerWidth = windowWidth - SPACING.lg * 2;
  const cardHeight = 140;
  const initials = displayInitials(profile.displayName);

  const onSignOut = () => {
    Alert.alert(STRINGS.profile.signOutTitle, STRINGS.profile.signOutMessage, [
      {text: STRINGS.profile.cancel, style: 'cancel'},
      {
        text: STRINGS.profile.signOutConfirm,
        style: 'destructive',
        onPress: () => {
          resetBundle();
          Alert.alert(STRINGS.profile.signedOutTitle, STRINGS.profile.signedOutMessage);
        },
      },
    ]);
  };

  return (
    <ScreenContainer edgeToEdge>
      <AppHeaderBar title={STRINGS.profile.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: SPACING.xxl + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCardOuter, SHADOW.md]}>
          <View style={[styles.profileCard, {width: cardInnerWidth, minHeight: cardHeight}]}>
            <Svg width={cardInnerWidth} height={cardHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id={CARD_GRAD_ID} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={COLORS.accentPrimary} stopOpacity="0.5" />
                  <Stop offset="0.5" stopColor={COLORS.accentViolet} stopOpacity="0.35" />
                  <Stop offset="1" stopColor={COLORS.accentCyan} stopOpacity="0.28" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={cardInnerWidth} height={cardHeight} fill={`url(#${CARD_GRAD_ID})`} />
            </Svg>
            <View style={styles.profileCardInner}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileTextCol}>
                <Text style={styles.profileName}>{profile.displayName}</Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{totalRides}</Text>
            <Text style={styles.statLabel}>{STRINGS.profile.statRides}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatDistance(totalDistanceMeters)}
            </Text>
            <Text style={styles.statLabel}>{STRINGS.profile.statDistance}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{explorer.level}</Text>
            <Text style={styles.statLabel}>{STRINGS.profile.statLevel}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{STRINGS.profile.menuSection}</Text>
        {MENU.map(row => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            onPress={() => navigation.navigate(row.route)}
            style={({pressed}) => [styles.menuRow, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={row.icon} size={22} color={COLORS.accentPrimary} />
            <Text style={styles.menuLabel}>{STRINGS.profile[row.labelKey]}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={onSignOut}
          style={({pressed}) => [styles.signOut, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={styles.signOutText}>{STRINGS.profile.signOut}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  profileCardOuter: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  profileCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surface,
  },
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.base,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  profileTextCol: {flex: 1, gap: 4},
  profileName: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  statCell: {flex: 1, alignItems: 'center', gap: 4},
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {width: 1, height: 36, backgroundColor: COLORS.border},
  sectionLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: SPACING.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  pressed: {opacity: 0.88},
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(229, 82, 58, 0.08)',
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
});
