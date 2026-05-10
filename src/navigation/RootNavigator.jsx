import React from 'react';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {COLORS} from '@constants/colors';
import {HomeScreen} from '@features/home/HomeScreen';
import {RideRecordingScreen} from '@features/ride/RideRecordingScreen';
import {RideSummaryScreen} from '@features/ride/RideSummaryScreen';
import {RideHistoryScreen} from '@features/history/RideHistoryScreen';
import {RideDetailScreen} from '@features/history/RideDetailScreen';
import {MemoriesScreen} from '@features/memory/MemoriesScreen';

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

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {backgroundColor: COLORS.background},
          headerTitleStyle: {color: COLORS.textPrimary, fontWeight: '700'},
          headerTintColor: COLORS.textPrimary,
          contentStyle: {backgroundColor: COLORS.background},
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RideRecording"
          component={RideRecordingScreen}
          options={{
            headerShown: false,
            // Swipe-back is enabled but the screen intercepts it via
            // `beforeRemove` to confirm before discarding an active ride.
            gestureEnabled: true,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="RideSummary"
          component={RideSummaryScreen}
          options={{title: 'Ride Summary'}}
        />
        <Stack.Screen
          name="History"
          component={RideHistoryScreen}
          options={{title: 'Ride History'}}
        />
        <Stack.Screen
          name="RideDetail"
          component={RideDetailScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="Memories"
          component={MemoriesScreen}
          options={{title: 'Memories'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
