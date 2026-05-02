import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';

const TONE_COLORS = {
  success: {bg: 'rgba(93,216,121,0.16)', fg: COLORS.accentPrimary},
  info: {bg: 'rgba(26,181,210,0.16)', fg: COLORS.accentCyan},
  warning: {bg: 'rgba(196,154,42,0.18)', fg: COLORS.accentAmber},
  danger: {bg: 'rgba(229,82,58,0.18)', fg: COLORS.danger},
  neutral: {bg: COLORS.surfaceMuted, fg: COLORS.textSecondary},
};

export function StatusPill({label, tone = 'neutral', style}) {
  const t = TONE_COLORS[tone];
  return (
    <View style={[styles.container, {backgroundColor: t.bg}, style]}>
      <View style={[styles.dot, {backgroundColor: t.fg}]} />
      <Text style={[styles.label, {color: t.fg}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
