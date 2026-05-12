import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';

/**
 * Flush top app bar (WhatsApp-style): status bar inset applied once here only.
 */
export function AppHeaderBar({title, onBack, right, backAccessibilityLabel = 'Back'}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, {paddingTop: insets.top}]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}
            onPress={onBack}
            style={({pressed}) => [styles.backSquare, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right != null ? <View style={styles.rightSlot}>{right}</View> : <View style={styles.backPlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    minHeight: 48,
  },
  backSquare: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {width: 40, height: 40},
  title: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {opacity: 0.85},
});
