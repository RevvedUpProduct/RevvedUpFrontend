import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SHADOW, SPACING} from '@constants/spacing';
import {formatDate, formatTime} from '@utils/format';

/**
 * Bottom-sheet style photo viewer for a single memory snapshot.
 *
 * Slides up from the bottom with an animated backdrop. Tapping the backdrop or
 * the ✕ button dismisses it. The sheet height adapts to the screen width so the
 * photo keeps a consistent 4:3 aspect ratio on all device sizes.
 */
export function MemoryViewer({memory, visible, onClose}) {
  const {width} = useWindowDimensions();
  // 4:3 photo area – feels generous without going full-screen.
  const imageHeight = Math.round(width * 0.75);
  const SHEET_HEIGHT = imageHeight + 152; // photo + metadata + handle

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 40, 0],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.78],
  });

  // Keep the Modal mounted when !visible so the slide-out animation
  // has something to animate against. We only skip rendering the inner
  // tree when memory is null (no data at all).
  if (!memory) return null;

  const lat = memory.coordinate.latitude.toFixed(5);
  const lon = memory.coordinate.longitude.toFixed(5);
  const dateStr = formatDate(memory.capturedAt);
  const timeStr = formatTime(memory.capturedAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>

        {/* ── Backdrop ─────────────────────────────────────── */}
        <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* ── Sheet ────────────────────────────────────────── */}
        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Photo */}
          <View style={[styles.imageWrapper, {height: imageHeight}, SHADOW.sm]}>
            <Image
              source={{uri: memory.imageUri}}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Close button overlaid on photo */}
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close memory viewer">
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Metadata */}
          <View style={styles.meta}>
            <Text style={styles.caption} numberOfLines={2}>
              {memory.caption || 'Memory Snapshot'}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dateStr}  ·  {timeStr}</Text>
              </View>
            </View>

            <Text style={styles.coords}>
              {lat}°,  {lon}°
            </Text>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Semi-transparent dark overlay behind the sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingBottom: SPACING.xxl,
  },

  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  imageWrapper: {
    width: '100%',
    backgroundColor: COLORS.surfaceMuted,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  closeBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
    lineHeight: 14,
  },

  meta: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    gap: SPACING.xs,
  },

  caption: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.semibold,
    lineHeight: FONT.size.lg * 1.4,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  badge: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },

  coords: {
    color: COLORS.textTertiary,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xxs,
    fontVariant: ['tabular-nums'],
  },
});
