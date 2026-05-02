import React, {useEffect} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {Card, ScreenContainer} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useMemoryStore} from '@store/memoryStore';
import {formatDate, formatTime} from '@utils/format';

export function MemoriesScreen({route}) {
  const rideId = route?.params?.rideId;
  const byRide = useMemoryStore(s => s.byRide);
  const loadForRide = useMemoryStore(s => s.loadMemoriesForRide);

  useEffect(() => {
    if (rideId) void loadForRide(rideId);
  }, [rideId, loadForRide]);

  const memories = rideId ? byRide[rideId] ?? [] : Object.values(byRide).flat();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{STRINGS.memory.title}</Text>
          <Text style={styles.subtitle}>{STRINGS.memory.subtitle}</Text>
        </View>

        {memories.length === 0 ? (
          <Card>
            <Text style={styles.empty}>{STRINGS.memory.noMemories}</Text>
          </Card>
        ) : (
          <View style={styles.grid}>
            {memories.map(m => (
              <Card key={m.id} style={styles.tile} padding="sm">
                <View style={styles.thumb}>
                  <Text style={styles.thumbGlyph}>📍</Text>
                </View>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {m.caption ?? 'Memory'}
                </Text>
                <Text style={styles.tileMeta} numberOfLines={1}>
                  {formatDate(m.capturedAt)} · {formatTime(m.capturedAt)}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg},
  header: {gap: SPACING.xs, paddingTop: SPACING.sm},
  title: {color: COLORS.textPrimary, fontSize: FONT.size.xxl, fontWeight: FONT.weight.bold},
  subtitle: {color: COLORS.textSecondary, fontSize: FONT.size.md},
  empty: {color: COLORS.textSecondary, textAlign: 'center', fontSize: FONT.size.md, paddingVertical: SPACING.lg},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  tile: {width: '47%', gap: SPACING.xs},
  thumb: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {fontSize: 36},
  tileTitle: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.semibold},
  tileMeta: {color: COLORS.textTertiary, fontSize: FONT.size.xs},
});
