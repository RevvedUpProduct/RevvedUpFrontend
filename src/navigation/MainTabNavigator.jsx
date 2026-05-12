import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '@constants/colors';
import {FONT, SPACING} from '@constants/spacing';
import {HomeScreen} from '@features/home/HomeScreen';
import {ExplorerScreen} from '@features/explorer/ExplorerScreen';
import {MemoriesScreen} from '@features/memory/MemoriesScreen';
import {HistoryStackNavigator} from './HistoryStackNavigator';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: {active: 'home', inactive: 'home-outline'},
  History: {active: 'history', inactive: 'history'},
  Explorer: {active: 'map-search', inactive: 'map-search-outline'},
  Memories: {active: 'heart', inactive: 'heart-outline'},
};

function TabIcon({name, focused}) {
  const set = TAB_ICONS[name];
  return (
    <MaterialCommunityIcons
      name={focused ? set.active : set.inactive}
      size={26}
      color={focused ? COLORS.accentPrimary : COLORS.textSecondary}
    />
  );
}

function tabScreenOptions(name) {
  return {
    tabBarIcon: ({focused}) => <TabIcon name={name} focused={focused} />,
    tabBarLabel: ({focused}) => (
      <Text
        style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}
        allowFontScaling={false}>
        {name}
      </Text>
    ),
  };
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, SPACING.sm);
  const tabBarBottomGap = Math.max(Math.round(insets.bottom * 0.25), SPACING.xs);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, {paddingBottom: bottomInset, marginBottom: tabBarBottomGap}],
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={tabScreenOptions('Home')}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={tabScreenOptions('History')}
      />
      <Tab.Screen
        name="Explorer"
        component={ExplorerScreen}
        options={tabScreenOptions('Explorer')}
      />
      <Tab.Screen
        name="Memories"
        component={MemoriesScreen}
        options={tabScreenOptions('Memories')}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 64,
    paddingTop: SPACING.xs,
  },
  label: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  labelActive: {
    color: COLORS.accentPrimary,
  },
  labelInactive: {
    color: COLORS.textSecondary,
  },
});
