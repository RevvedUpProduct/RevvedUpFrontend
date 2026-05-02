import React, {useMemo} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING, TOUCH_TARGET} from '@constants/spacing';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  testID,
  style,
  accessibilityLabel,
}) {
  const isInteractive = !disabled && !loading;

  const containerStyle = useMemo(
    () =>
      [
        styles.base,
        sizeStyles[size],
        variantStyles[variant].container,
        fullWidth ? styles.fullWidth : null,
        disabled ? styles.disabled : null,
        style,
      ].filter(Boolean),
    [variant, size, fullWidth, disabled, style],
  );

  return (
    <Pressable
      testID={testID}
      onPress={isInteractive ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled: !isInteractive, busy: loading}}
      android_ripple={{color: 'rgba(255,255,255,0.08)'}}
      style={({pressed}) => [
        ...containerStyle,
        pressed && isInteractive ? styles.pressed : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].label.color} />
      ) : (
        <>
          {iconLeft}
          <Text style={[styles.label, sizeLabelStyles[size], variantStyles[variant].label]}>
            {label}
          </Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    minHeight: TOUCH_TARGET.min,
  },
  fullWidth: {alignSelf: 'stretch'},
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.85, transform: [{scale: 0.98}]},
  label: {
    fontWeight: FONT.weight.semibold,
    letterSpacing: 0.2,
  },
});

const sizeStyles = {
  sm: {paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm},
  md: {paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, minHeight: TOUCH_TARGET.comfortable},
  lg: {paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base, minHeight: TOUCH_TARGET.large},
};

const sizeLabelStyles = {
  sm: {fontSize: FONT.size.sm},
  md: {fontSize: FONT.size.md},
  lg: {fontSize: FONT.size.lg},
};

const variantStyles = {
  primary: {
    container: {backgroundColor: COLORS.accentPrimary},
    label: {color: COLORS.textInverse},
  },
  secondary: {
    container: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    label: {color: COLORS.textPrimary},
  },
  ghost: {
    container: {backgroundColor: 'transparent'},
    label: {color: COLORS.accentPrimary},
  },
  danger: {
    container: {backgroundColor: COLORS.danger},
    label: {color: '#FFFFFF'},
  },
};
