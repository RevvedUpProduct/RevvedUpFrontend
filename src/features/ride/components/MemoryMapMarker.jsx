import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Marker} from 'react-native-maps';
import {COLORS} from '@constants/colors';
import {SHADOW} from '@constants/spacing';

/**
 * Compact heart-shaped marker for memory snapshots on the map.
 *
 * tracksViewChanges is false because the marker visual is static — keeping it
 * true causes constant re-renders and flicker on Android with PROVIDER_GOOGLE.
 *
 * The anchor is set to {x:0.5, y:1} so the bottom centre of the badge sits on
 * the exact GPS coordinate.
 */
export function MemoryMapMarker({memory, onPress}) {
  return (
    <Marker
      coordinate={memory.coordinate}
      tracksViewChanges={false}
      onPress={() => onPress?.(memory)}
      anchor={{x: 0.5, y: 1}}>
      <View style={[styles.badge, SHADOW.sm]}>
        <Text style={styles.heart} allowFontScaling={false}>♥</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heart: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
