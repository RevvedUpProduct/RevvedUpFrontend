import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppHeaderBar, ScreenContainer} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useProfileStore} from '@store/profileStore';

function buildEditDraft(e) {
  return {
    contacts: e.contacts.map(c => ({...c})),
    bloodGroup: e.bloodGroup,
    allergiesText: e.allergies.join(', '),
    medicationsText: e.medications.join('\n'),
    conditionsText: e.conditions.join('\n'),
  };
}

export function EmergencyInformationScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const emergency = useProfileStore(s => s.emergency);
  const setEmergency = useProfileStore(s => s.setEmergency);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(() => buildEditDraft(emergency));

  const openEdit = () => {
    setDraft(buildEditDraft(useProfileStore.getState().emergency));
    setModalOpen(true);
  };

  const save = () => {
    const allergies = draft.allergiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const medications = draft.medicationsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const conditions = draft.conditionsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    setEmergency({
      contacts: draft.contacts,
      bloodGroup: draft.bloodGroup.trim() || '—',
      allergies,
      medications,
      conditions,
    });
    setModalOpen(false);
  };

  const updateContact = (index, field, value) => {
    setDraft(prev => {
      const contacts = prev.contacts.map((c, i) => (i === index ? {...c, [field]: value} : c));
      return {...prev, contacts};
    });
  };

  return (
    <ScreenContainer edgeToEdge>
      <AppHeaderBar title={STRINGS.emergency.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: SPACING.xxl + insets.bottom}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={COLORS.danger} />
          <Text style={styles.bannerText}>{STRINGS.emergency.banner}</Text>
        </View>

        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>{STRINGS.emergency.contactsTitle}</Text>
          <Pressable onPress={openEdit} style={({pressed}) => pressed && styles.pressed}>
            <Text style={styles.editLink}>{STRINGS.emergency.edit}</Text>
          </Pressable>
        </View>
        {emergency.contacts.map(c => (
          <View key={c.id} style={styles.contactCard}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactRelation}>{c.relation}</Text>
            <View style={styles.phoneRow}>
              <MaterialCommunityIcons name="phone" size={18} color={COLORS.accentPrimary} />
              <Text style={styles.phone}>{c.phone}</Text>
            </View>
          </View>
        ))}

        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>{STRINGS.emergency.medicalTitle}</Text>
          <Pressable onPress={openEdit} style={({pressed}) => pressed && styles.pressed}>
            <Text style={styles.editLink}>{STRINGS.emergency.edit}</Text>
          </Pressable>
        </View>
        <View style={styles.medicalCard}>
          <Text style={styles.medicalLabel}>{STRINGS.emergency.bloodGroup}</Text>
          <Text style={styles.medicalValue}>{emergency.bloodGroup}</Text>
          <Text style={[styles.medicalLabel, styles.medicalSpaced]}>{STRINGS.emergency.allergies}</Text>
          <View style={styles.chips}>
            {emergency.allergies.map(a => (
              <View key={a} style={styles.chip}>
                <Text style={styles.chipText}>{a}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.medicalLabel, styles.medicalSpaced]}>{STRINGS.emergency.medications}</Text>
          {emergency.medications.map((m, i) => (
            <Text key={i} style={styles.bullet}>
              • {m}
            </Text>
          ))}
          <Text style={[styles.medicalLabel, styles.medicalSpaced]}>{STRINGS.emergency.conditions}</Text>
          {emergency.conditions.map((m, i) => (
            <Text key={i} style={styles.bullet}>
              • {m}
            </Text>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, {paddingBottom: SPACING.lg + insets.bottom}]}>
            <Text style={styles.modalTitle}>{STRINGS.emergency.editTitle}</Text>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>{STRINGS.emergency.contactsTitle}</Text>
              {draft.contacts.map((c, i) => (
                <View key={c.id} style={styles.contactEdit}>
                  <TextInput
                    style={styles.input}
                    value={c.name}
                    onChangeText={v => updateContact(i, 'name', v)}
                    placeholder={STRINGS.emergency.placeholderName}
                    placeholderTextColor={COLORS.textTertiary}
                  />
                  <TextInput
                    style={styles.input}
                    value={c.relation}
                    onChangeText={v => updateContact(i, 'relation', v)}
                    placeholder={STRINGS.emergency.placeholderRelation}
                    placeholderTextColor={COLORS.textTertiary}
                  />
                  <TextInput
                    style={styles.input}
                    value={c.phone}
                    onChangeText={v => updateContact(i, 'phone', v)}
                    placeholder={STRINGS.emergency.placeholderPhone}
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>
              ))}
              <Text style={styles.inputLabel}>{STRINGS.emergency.bloodGroup}</Text>
              <TextInput
                style={styles.input}
                value={draft.bloodGroup}
                onChangeText={v => setDraft(prev => ({...prev, bloodGroup: v}))}
                placeholder="O+"
                placeholderTextColor={COLORS.textTertiary}
              />
              <Text style={styles.inputLabel}>{STRINGS.emergency.allergies}</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.allergiesText}
                onChangeText={v => setDraft(prev => ({...prev, allergiesText: v}))}
                placeholder={STRINGS.emergency.placeholderAllergies}
                placeholderTextColor={COLORS.textTertiary}
              />
              <Text style={styles.inputLabel}>{STRINGS.emergency.medications}</Text>
              <TextInput
                style={[styles.input, styles.inputMultilineTall]}
                value={draft.medicationsText}
                onChangeText={v => setDraft(prev => ({...prev, medicationsText: v}))}
                placeholder={STRINGS.emergency.placeholderMedications}
                placeholderTextColor={COLORS.textTertiary}
                multiline
              />
              <Text style={styles.inputLabel}>{STRINGS.emergency.conditions}</Text>
              <TextInput
                style={[styles.input, styles.inputMultilineTall]}
                value={draft.conditionsText}
                onChangeText={v => setDraft(prev => ({...prev, conditionsText: v}))}
                placeholder={STRINGS.emergency.placeholderConditions}
                placeholderTextColor={COLORS.textTertiary}
                multiline
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={({pressed}) => [styles.modalBtn, styles.modalBtnGhost, pressed && styles.pressed]}>
                <Text style={styles.modalBtnGhostText}>{STRINGS.emergency.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={save}
                style={({pressed}) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.pressed]}>
                <Text style={styles.modalBtnPrimaryText}>{STRINGS.emergency.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md},
  banner: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    backgroundColor: 'rgba(229, 82, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 82, 58, 0.35)',
    borderRadius: RADIUS.md,
    padding: SPACING.base,
  },
  bannerText: {flex: 1, color: COLORS.textPrimary, fontSize: FONT.size.sm, lineHeight: 20},
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  blockTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  editLink: {color: COLORS.accentPrimary, fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold},
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: 4,
  },
  contactName: {color: COLORS.textPrimary, fontSize: FONT.size.md, fontWeight: FONT.weight.bold},
  contactRelation: {color: COLORS.textSecondary, fontSize: FONT.size.sm},
  phoneRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs},
  phone: {color: COLORS.textPrimary, fontSize: FONT.size.sm},
  medicalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.xs,
  },
  medicalLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medicalSpaced: {marginTop: SPACING.sm},
  medicalValue: {color: COLORS.textPrimary, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  chip: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {color: COLORS.textPrimary, fontSize: FONT.size.xs},
  bullet: {color: COLORS.textSecondary, fontSize: FONT.size.sm, lineHeight: 22},
  pressed: {opacity: 0.85},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.backgroundElevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    maxHeight: '92%',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.md,
  },
  modalScroll: {maxHeight: 420},
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
  },
  inputMultiline: {minHeight: 44},
  inputMultilineTall: {minHeight: 88, textAlignVertical: 'top'},
  contactEdit: {gap: SPACING.sm, marginBottom: SPACING.md},
  modalActions: {flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md},
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalBtnGhost: {borderWidth: 1, borderColor: COLORS.border},
  modalBtnGhostText: {color: COLORS.textPrimary, fontWeight: FONT.weight.semibold},
  modalBtnPrimary: {backgroundColor: COLORS.accentPrimary},
  modalBtnPrimaryText: {color: COLORS.textInverse, fontWeight: FONT.weight.bold},
});
