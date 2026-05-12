import React, {useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button, BottomSheet} from '@components/index';
import {COLORS} from '@constants/colors';
import {CONFIG} from '@constants/config';
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

// saveToPhotos: false — keeps capture in a temp file URI for addMemory only. true requires
// extra Android/iOS permissions and can crash when writing to the public photo roll.
const CAMERA_OPTIONS = {
  ...PICKER_OPTIONS,
  mediaType: 'photo',
  saveToPhotos: false,
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
  const insets = useSafeAreaInsets();
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

  /** GPS fix optional: without a track point yet, pin to map default (same as live map center). */
  const pinCoordinate = currentCoordinate ?? CONFIG.map.fallbackCoordinate;

  const handleSave = async () => {
    if (!rideId || !asset) return;
    const res = await addMemory({
      rideId,
      imageUri: asset.uri,
      caption: caption.trim() || undefined,
      coordinate: pinCoordinate,
    });
    if (res.ok) handleClose();
  };

  const canSave = Boolean(rideId && asset) && !isAdding;

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={STRINGS.memory.addTitle}
      heightFraction={0.78}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Photo preview */}
          <View style={styles.previewContainer}>
            {asset ? (
              <>
                <Image source={{uri: asset.uri}} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewBadge}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.accentPrimary} />
                  <Text style={styles.previewBadgeText}>Selected</Text>
                </View>
              </>
            ) : (
              <View style={styles.previewEmpty}>
                <MaterialCommunityIcons name="image-plus" size={40} color={COLORS.textSecondary} />
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
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="camera-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionLabel}>Take Photo</Text>
                <Text style={styles.actionSubLabel}>Use camera</Text>
              </View>
            </Pressable>
            <Pressable
              style={({pressed}) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              onPress={onPickFromGallery}
              accessibilityRole="button"
              accessibilityLabel="Pick from gallery">
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="image-multiple-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionLabel}>{STRINGS.memory.pickFromGallery}</Text>
                <Text style={styles.actionSubLabel}>Choose from gallery</Text>
              </View>
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
        </ScrollView>

        {/* Always visible above home indicator / gesture bar */}
        <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, SPACING.md)}]}>
          <Button
            label={STRINGS.memory.save}
            variant="primary"
            fullWidth
            loading={isAdding}
            disabled={!canSave}
            onPress={handleSave}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  footer: {
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  previewContainer: {
    height: 160,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {width: '100%', height: '100%'},
  previewBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,18,20,0.88)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  previewBadgeText: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  previewEmpty: {alignItems: 'center', gap: SPACING.xs},
  previewEmptyLabel: {color: COLORS.textSecondary, fontSize: FONT.size.sm},

  actionRow: {flexDirection: 'row', gap: SPACING.md},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnPressed: {opacity: 0.8},
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  actionTextWrap: {gap: 2, flex: 1},
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  actionSubLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.xs,
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
