import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {COLORS} from '@constants/colors';
import {RADIUS, SPACING} from '@constants/spacing';

export function Card({onPress, padding = 'base', variant = 'default', style, children, ...rest}) {
  const padValue = padding === 'none' ? 0 : SPACING[padding];
  const variantStyle = variantStyles[variant];
  const containerStyle = [
    styles.base,
    variantStyle,
    {padding: padValue},
    style,
  ].filter(Boolean);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({pressed}) => [
          ...containerStyle,
          pressed ? styles.pressed : null,
        ]}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
});

const variantStyles = {
  default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
};
