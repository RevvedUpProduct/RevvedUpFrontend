import React, {useState} from 'react';
import {DarkTheme, NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {COLORS} from '@constants/colors';
import {RideRecordingScreen} from '@features/ride/RideRecordingScreen';
import {RideSummaryScreen} from '@features/ride/RideSummaryScreen';
import {EmergencyInformationScreen} from '@features/emergency/EmergencyInformationScreen';
import {RiderGearScreen} from '@features/gear/RiderGearScreen';
import {MyGarageScreen} from '@features/garage/MyGarageScreen';
import {ProfileSettingsScreen} from '@features/settings/ProfileSettingsScreen';
import {ActiveRideResumeGate} from './ActiveRideResumeGate';
import {MainTabNavigator} from './MainTabNavigator';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    primary: COLORS.accentPrimary,
    notification: COLORS.danger,
  },
};

/**
 * Root navigator structure:
 *
 *   NavigationContainer
 *     └── Stack.Navigator (no header)
 *           ├── "Main"  → MainTabNavigator (Home | History | Explorer | Memories)
 *           ├── "RideRecording"  → full-screen modal, hides the tab bar
 *           └── "RideSummary"   → full-screen, hides the tab bar
 *
 * RideRecording and RideSummary are pushed on top of the tab navigator so
 * the tab bar is completely absent during an active ride.
 */
export function RootNavigator() {
  const [navReady, setNavReady] = useState(false);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => setNavReady(true)}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: COLORS.background},
        }}>
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="MyGarage" component={MyGarageScreen} />
        <Stack.Screen name="EmergencyInformation" component={EmergencyInformationScreen} />
        <Stack.Screen name="RiderGear" component={RiderGearScreen} />
        <Stack.Screen
          name="RideRecording"
          component={RideRecordingScreen}
          options={{
            gestureEnabled: true,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="RideSummary"
          component={RideSummaryScreen}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: COLORS.background},
            headerTitleStyle: {color: COLORS.textPrimary, fontWeight: '700'},
            headerTintColor: COLORS.accentPrimary,
            title: 'Ride Summary',
          }}
        />
      </Stack.Navigator>
      <ActiveRideResumeGate navigationRef={navigationRef} navReady={navReady} />
    </NavigationContainer>
  );
}
