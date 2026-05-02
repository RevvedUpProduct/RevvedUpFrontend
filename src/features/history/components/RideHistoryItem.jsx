import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Card} from '@components/Card';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';
import {formatDate, formatDistance, formatDurationShort} from '@utils/format';

export function RideHistoryItem({ride, onPress}) {
  const subtitle = [ride.startLocationLabel, ride.endLocationLabel]
    .filter(Boolean)
    .join(' → ');

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.location} numberOfLines={1}>
            {subtitle || `${ride.type === 'group' ? 'Group' : 'Solo'} ride`}
          </Text>
          <Text style={styles.date}>{formatDate(ride.startedAt)}</Text>
        </View>
        <View style={styles.metrics}>
          <Text style={[styles.metric, {color: COLORS.accentPrimary}]}>
            {formatDistance(ride.distanceMeters)}
          </Text>
          <Text style={[styles.metric, {color: COLORS.accentCyan}]}>
            {formatDurationShort(ride.durationMs)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md},
  left: {flex: 1, gap: SPACING.xxs},
  location: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.semibold},
  date: {color: COLORS.textSecondary, fontSize: FONT.size.sm},
  metrics: {alignItems: 'flex-end', gap: SPACING.xxs},
  metric: {fontSize: FONT.size.md, fontWeight: FONT.weight.semibold},
});
