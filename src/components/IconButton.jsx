import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {COLORS} from '@constants/colors';
import {RADIUS, SHADOW, TOUCH_TARGET} from '@constants/spacing';

export function IconButton({
  glyph,
  onPress,
  variant = 'primary',
  size = 'lg',
  accessibilityLabel,
  disabled = false,
  testID,
  style,
}) {
  const sizePx = sizeMap[size];
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled}}
      style={({pressed}) => [
        styles.base,
        {width: sizePx, height: sizePx},
        variantStyle.container,
        SHADOW.md,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}>
      <Text style={[styles.glyph, {fontSize: sizePx * 0.45}, variantStyle.label]}>{glyph}</Text>
    </Pressable>
  );
}

const sizeMap = {
  sm: TOUCH_TARGET.min,
  md: TOUCH_TARGET.comfortable,
  lg: TOUCH_TARGET.large,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
  },
  pressed: {opacity: 0.9, transform: [{scale: 0.92}]},
  disabled: {opacity: 0.4},
});

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
  danger: {
    container: {backgroundColor: COLORS.danger},
    label: {color: '#FFFFFF'},
  },
};
