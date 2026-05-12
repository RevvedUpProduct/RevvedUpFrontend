import React, {useState} from 'react';
import {Alert, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppHeaderBar, ScreenContainer} from '@components/index';
import {COLORS} from '@constants/colors';
import {FONT, RADIUS, SPACING} from '@constants/spacing';
import {STRINGS} from '@constants/strings';
import {useProfileStore} from '@store/profileStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function docStatusColor(status) {
  switch (status) {
    case 'valid':
      return COLORS.accentCyan;
    case 'expiring':
      return COLORS.accentOrange;
    case 'expired':
      return COLORS.danger;
    default:
      return COLORS.textSecondary;
  }
}

export function MyGarageScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const garage = useProfileStore(s => s.garage);
  const [expandedId, setExpandedId] = useState(null);

  const toggle = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const onAddBike = () => {
    Alert.alert(STRINGS.garage.addBikeTitle, STRINGS.garage.addBikeMessage);
  };

  return (
    <ScreenContainer edgeToEdge>
      <AppHeaderBar
        title={STRINGS.garage.title}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={STRINGS.garage.addBike}
            onPress={onAddBike}
            style={({pressed}) => [styles.addBtn, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="plus" size={22} color={COLORS.accentPrimary} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: SPACING.xxl + insets.bottom}]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {STRINGS.garage.bikesHeading} ({garage.bikes.length})
        </Text>
        {garage.bikes.map(bike => {
          const open = expandedId === bike.id;
          return (
            <View key={bike.id} style={styles.bikeCard}>
              <Pressable onPress={() => toggle(bike.id)} style={styles.bikeHeader}>
                <MaterialCommunityIcons name="motorbike" size={22} color={COLORS.textPrimary} />
                <View style={styles.bikeTitleCol}>
                  <View style={styles.bikeTitleRow}>
                    <Text style={styles.bikeName}>{bike.name}</Text>
                    {bike.isPrimary ? (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>{STRINGS.garage.primary}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.bikeMeta}>
                    {bike.year} · {bike.plate}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={COLORS.textTertiary}
                />
              </Pressable>
              <Pressable onPress={() => toggle(bike.id)} style={styles.docToggleRow}>
                <Text style={styles.docToggle}>
                  {open ? STRINGS.garage.hideDocuments : STRINGS.garage.viewDocuments}
                </Text>
              </Pressable>
              {open ? (
                <View style={styles.docList}>
                  {bike.documents.map(doc => (
                    <View key={doc.id} style={styles.docRow}>
                      <MaterialCommunityIcons
                        name={doc.icon || 'file-document-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                      <View style={styles.docBody}>
                        <View style={styles.docTitleRow}>
                          <Text style={styles.docTitle}>{doc.title}</Text>
                          <Text style={[styles.docStatus, {color: docStatusColor(doc.status)}]}>
                            {STRINGS.garage[`docStatus_${doc.status}`] ?? doc.status}
                          </Text>
                        </View>
                        <Text style={styles.docSubtitle}>{doc.subtitle}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md},
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bikeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  bikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.base,
  },
  bikeTitleCol: {flex: 1, gap: 4},
  bikeTitleRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap'},
  bikeName: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  primaryBadge: {
    backgroundColor: 'rgba(93, 216, 121, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  primaryBadgeText: {
    color: COLORS.accentPrimary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
  },
  bikeMeta: {color: COLORS.textSecondary, fontSize: FONT.size.sm},
  docToggleRow: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  docToggle: {
    color: COLORS.accentPrimary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  docList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  docRow: {flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start'},
  docBody: {flex: 1, gap: 4},
  docTitleRow: {flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm},
  docTitle: {color: COLORS.textPrimary, fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, flex: 1},
  docStatus: {fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, textTransform: 'uppercase'},
  docSubtitle: {color: COLORS.textSecondary, fontSize: FONT.size.xs},
  pressed: {opacity: 0.85},
});
