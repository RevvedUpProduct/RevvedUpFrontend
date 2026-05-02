import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {Button, BottomSheet} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useMemoryStore} from '@store/memoryStore';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
  'https://images.unsplash.com/photo-1520496938502-9e21c1a6c3a4',
  'https://images.unsplash.com/photo-1502175353174-a7a44e84da10',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b',
];

function pickPlaceholder() {
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
}

export function AddMemorySheet({visible, onClose, rideId, currentCoordinate}) {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const isAdding = useMemoryStore(s => s.isAdding);
  const addMemory = useMemoryStore(s => s.addMemory);

  const reset = () => {
    setCaption('');
    setImageUri(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!rideId || !currentCoordinate || !imageUri) return;
    const res = await addMemory({
      rideId,
      imageUri,
      caption: caption.trim() || undefined,
      coordinate: currentCoordinate,
    });
    if (res.ok) handleClose();
  };

  const canSave = Boolean(rideId && currentCoordinate && imageUri) && !isAdding;

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={STRINGS.memory.addTitle}>
      <View style={styles.content}>
        <View style={styles.previewContainer}>
          {imageUri ? (
            <View style={styles.previewFilled}>
              <Text style={styles.previewLabel} numberOfLines={1}>
                {imageUri.split('/').pop()}
              </Text>
            </View>
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyGlyph}>📷</Text>
              <Text style={styles.previewEmptyLabel}>No image selected</Text>
            </View>
          )}
        </View>

        <Button
          label={STRINGS.memory.pickFromGallery}
          variant="secondary"
          fullWidth
          onPress={() => setImageUri(pickPlaceholder())}
        />

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={STRINGS.memory.captionPlaceholder}
          placeholderTextColor={COLORS.textTertiary}
          style={styles.input}
          multiline
          maxLength={140}
        />

        <Button
          label={STRINGS.memory.save}
          variant="primary"
          fullWidth
          loading={isAdding}
          disabled={!canSave}
          onPress={handleSave}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {gap: SPACING.md},
  previewContainer: {
    height: 140,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmpty: {alignItems: 'center', gap: SPACING.xs},
  previewEmptyGlyph: {fontSize: 36},
  previewEmptyLabel: {color: COLORS.textSecondary, fontSize: FONT.size.sm},
  previewFilled: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.base},
  previewLabel: {color: COLORS.textPrimary, fontSize: FONT.size.sm},
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT.size.md,
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
