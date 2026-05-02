import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';

export function MetricTile({
  label,
  value,
  hint,
  accentColor = COLORS.textPrimary,
  align = 'center',
  testID,
}) {
  return (
    <View style={[styles.container, {alignItems: align}]} testID={testID}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, {color: accentColor}]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.xxs,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    letterSpacing: -0.5,
  },
  hint: {
    color: COLORS.textTertiary,
    fontSize: FONT.size.xs,
  },
});
