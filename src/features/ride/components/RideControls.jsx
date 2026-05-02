import React from 'react';
import {StyleSheet, View} from 'react-native';
import {IconButton} from '@components/IconButton';
import {SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';

export function RideControls({status, onPause, onResume, onStop, onAddMemory}) {
  const isPaused = status === 'paused';

  return (
    <View style={styles.container}>
      <IconButton
        glyph={isPaused ? '▶' : '❚❚'}
        variant="secondary"
        size="md"
        onPress={isPaused ? onResume : onPause}
        accessibilityLabel={isPaused ? STRINGS.ride.resume : STRINGS.ride.pause}
        testID="ride-pause-toggle"
      />
      <IconButton
        glyph="◉"
        variant="primary"
        size="lg"
        onPress={onAddMemory}
        accessibilityLabel={STRINGS.ride.addMemory}
        testID="ride-add-memory"
      />
      <IconButton
        glyph="■"
        variant="danger"
        size="md"
        onPress={onStop}
        accessibilityLabel={STRINGS.ride.stop}
        testID="ride-stop"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingTop: SPACING.lg,
  },
});
