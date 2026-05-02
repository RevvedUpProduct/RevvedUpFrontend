import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';

export function SectionHeader({title, actionLabel, onActionPress}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          style={({pressed}) => [styles.action, pressed ? styles.pressed : null]}>
          <Text style={styles.actionLabel}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    letterSpacing: -0.2,
  },
  action: {paddingVertical: SPACING.xs, paddingHorizontal: SPACING.xs},
  actionLabel: {
    color: COLORS.accentPrimary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  pressed: {opacity: 0.6},
});
