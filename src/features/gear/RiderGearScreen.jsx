import React from 'react';
import {ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppHeaderBar, ScreenContainer} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SHADOW, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useProfileStore} from '@store/profileStore';
import {formatDate} from '@utils/format';

const INTERCOM_GRAD = 'riderGearIntercomGrad';

function gearStatusColor(status) {
  if (status === 'replace') {
    return COLORS.accentOrange;
  }
  return COLORS.accentPrimary;
}

export function RiderGearScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const riderGear = useProfileStore(s => s.riderGear);
  const cardInnerWidth = windowWidth - SPACING.lg * 2;
  const intercomHeight = 128;

  const {intercom} = riderGear;
  const rangeKm = intercom.rangeM >= 1000 ? `${(intercom.rangeM / 1000).toFixed(1)} km` : `${intercom.rangeM} m`;

  return (
    <ScreenContainer edgeToEdge>
      <AppHeaderBar title={STRINGS.gear.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: SPACING.xxl + insets.bottom}]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{STRINGS.gear.equipmentSection}</Text>
        {riderGear.equipment.map(item => (
          <View key={item.id} style={styles.equipRow}>
            <View style={styles.equipIcon}>
              <MaterialCommunityIcons
                name={item.icon || 'shield-outline'}
                size={22}
                color={COLORS.textPrimary}
              />
            </View>
            <View style={styles.equipBody}>
              <Text style={styles.equipName}>{item.name}</Text>
              <Text style={styles.equipModel}>{item.model}</Text>
              <View style={styles.equipMeta}>
                <Text style={[styles.equipStatus, {color: gearStatusColor(item.status)}]}>
                  {item.statusLabel}
                </Text>
                <Text style={styles.equipDate}>
                  {STRINGS.gear.checked} {formatDate(item.checkedDate)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, styles.sectionSpaced]}>{STRINGS.gear.intercomSection}</Text>
        <View style={[styles.intercomOuter, SHADOW.md]}>
          <View style={[styles.intercomCard, {width: cardInnerWidth, minHeight: intercomHeight}]}>
            <Svg width={cardInnerWidth} height={intercomHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id={INTERCOM_GRAD} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={COLORS.accentViolet} stopOpacity="0.45" />
                  <Stop offset="1" stopColor={COLORS.accentCyan} stopOpacity="0.35" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={cardInnerWidth} height={intercomHeight} fill={`url(#${INTERCOM_GRAD})`} />
            </Svg>
            <View style={styles.intercomInner}>
              <View style={styles.intercomTop}>
                <MaterialCommunityIcons name="headset" size={24} color={COLORS.textPrimary} />
                <Text style={styles.intercomDevice}>{intercom.deviceName}</Text>
              </View>
              <View style={styles.intercomStats}>
                <Text style={styles.intercomStat}>
                  {STRINGS.gear.battery} {intercom.batteryPct}%
                </Text>
                <Text style={styles.intercomStat}>{STRINGS.gear.range} {rangeKm}</Text>
              </View>
              <Text style={styles.pairedLabel}>{STRINGS.gear.paired}</Text>
              <Text style={styles.pairedValue}>{intercom.paired.join(' · ')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md},
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSpaced: {marginTop: SPACING.sm},
  equipRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
  },
  equipIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipBody: {flex: 1, gap: 4},
  equipName: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.bold},
  equipModel: {color: COLORS.textSecondary, fontSize: FONT.size.sm},
  equipMeta: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.xs},
  equipStatus: {fontSize: FONT.size.xs, fontWeight: FONT.weight.bold},
  equipDate: {color: COLORS.textTertiary, fontSize: FONT.size.xs},
  intercomOuter: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  intercomCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surface,
  },
  intercomInner: {padding: SPACING.base, gap: SPACING.sm},
  intercomTop: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  intercomDevice: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  intercomStats: {flexDirection: 'row', gap: SPACING.lg},
  intercomStat: {color: COLORS.textSecondary, fontSize: FONT.size.sm},
  pairedLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  pairedValue: {color: COLORS.textPrimary, fontSize: FONT.size.sm},
});
