import React from 'react';
import {StyleSheet, View} from 'react-native';
import {MetricTile} from '@components/MetricTile';
import {COLORS} from '@constants/colors';
import {RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {formatDistance, formatDuration, formatSpeed} from '@utils/format';

export function RideMetricsBar({metrics}) {
  return (
    <View style={styles.container}>
      <MetricTile
        label={STRINGS.ride.distance}
        value={formatDistance(metrics.distanceMeters)}
        accentColor={COLORS.accentPrimary}
      />
      <View style={styles.divider} />
      <MetricTile
        label={STRINGS.ride.duration}
        value={formatDuration(metrics.durationMs)}
        accentColor={COLORS.accentCyan}
      />
      <View style={styles.divider} />
      <MetricTile
        label={STRINGS.ride.speed}
        value={formatSpeed(metrics.currentSpeedKmh)}
        accentColor={COLORS.accentAmber}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
});
