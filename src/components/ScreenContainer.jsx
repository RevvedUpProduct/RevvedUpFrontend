import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '@constants/colors';

export function ScreenContainer({children, edgeToEdge = false, style}) {
  if (edgeToEdge) {
    return <View style={[styles.root, style]}>{children}</View>;
  }
  return <SafeAreaView style={[styles.root, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
