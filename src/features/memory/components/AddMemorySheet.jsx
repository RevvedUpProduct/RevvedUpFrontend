import React, {useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {Button, BottomSheet} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useMemoryStore} from '@store/memoryStore';

// react-native-image-picker shared options. mediaType: 'mixed' lets the user
// pick photos AND videos from the gallery; the camera flow uses 'photo' since
// most rides will capture photos, not videos.
const PICKER_OPTIONS = {
  mediaType: 'mixed',
  quality: 0.85,
  maxWidth: 1920,
  maxHeight: 1920,
  selectionLimit: 1,
  includeBase64: false,
};

const CAMERA_OPTIONS = {
  ...PICKER_OPTIONS,
  mediaType: 'photo',
  saveToPhotos: true,
  cameraType: 'back',
};

async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera permission',
      message: 'RevvedUp needs camera access to capture memories during rides.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function AddMemorySheet({visible, onClose, rideId, currentCoordinate}) {
  const [caption, setCaption] = useState('');
  const [asset, setAsset] = useState(null); // {uri, type, fileName}
  const isAdding = useMemoryStore(s => s.isAdding);
  const addMemory = useMemoryStore(s => s.addMemory);

  const reset = () => {
    setCaption('');
    setAsset(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickerResult = result => {
    if (result.didCancel) return;
    if (result.errorCode) {
      // Image-picker reports `permission` (Android 13+ media permission denied)
      // separately so we can guide the user to Settings.
      if (result.errorCode === 'permission') {
        Alert.alert(
          'Permission needed',
          'Allow access to your photos in Settings to pick a memory.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      }
      Alert.alert('Could not load media', result.errorMessage ?? 'Try again.');
      return;
    }
    const picked = result.assets?.[0];
    if (!picked?.uri) return;
    setAsset({
      uri: picked.uri,
      type: picked.type ?? 'image/jpeg',
      fileName: picked.fileName ?? 'memory.jpg',
    });
  };

  const onPickFromGallery = async () => {
    const result = await launchImageLibrary(PICKER_OPTIONS);
    handlePickerResult(result);
  };

  const onTakePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert(
        'Camera blocked',
        'Enable camera access in Settings to capture a memory.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ],
      );
      return;
    }
    const result = await launchCamera(CAMERA_OPTIONS);
    handlePickerResult(result);
  };

  const handleSave = async () => {
    if (!rideId || !currentCoordinate || !asset) return;
    const res = await addMemory({
      rideId,
      imageUri: asset.uri,
      caption: caption.trim() || undefined,
      coordinate: currentCoordinate,
    });
    if (res.ok) handleClose();
  };

  const canSave = Boolean(rideId && currentCoordinate && asset) && !isAdding;

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={STRINGS.memory.addTitle}>
      <View style={styles.content}>

        {/* Photo preview */}
        <View style={styles.previewContainer}>
          {asset ? (
            <Image source={{uri: asset.uri}} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyGlyph}>📷</Text>
              <Text style={styles.previewEmptyLabel}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Capture / pick row */}
        <View style={styles.actionRow}>
          <Pressable
            style={({pressed}) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={onTakePhoto}
            accessibilityRole="button"
            accessibilityLabel="Take photo">
            <Text style={styles.actionGlyph}>📸</Text>
            <Text style={styles.actionLabel}>Take Photo</Text>
          </Pressable>
          <Pressable
            style={({pressed}) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={onPickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Pick from gallery">
            <Text style={styles.actionGlyph}>🖼️</Text>
            <Text style={styles.actionLabel}>{STRINGS.memory.pickFromGallery}</Text>
          </Pressable>
        </View>

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
    height: 180,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {width: '100%', height: '100%'},
  previewEmpty: {alignItems: 'center', gap: SPACING.xs},
  previewEmptyGlyph: {fontSize: 36},
  previewEmptyLabel: {color: COLORS.textSecondary, fontSize: FONT.size.sm},

  actionRow: {flexDirection: 'row', gap: SPACING.md},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnPressed: {opacity: 0.8},
  actionGlyph: {fontSize: 18},
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },

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
