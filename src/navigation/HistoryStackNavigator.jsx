import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {COLORS} from '@constants/colors';
import {RideHistoryScreen} from '@features/history/RideHistoryScreen';
import {RideDetailScreen} from '@features/history/RideDetailScreen';

const Stack = createNativeStackNavigator();

export function HistoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.background},
        headerTitleStyle: {color: COLORS.textPrimary, fontWeight: '700'},
        headerTintColor: COLORS.accentPrimary,
        contentStyle: {backgroundColor: COLORS.background},
      }}>
      <Stack.Screen
        name="RideHistory"
        component={RideHistoryScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RideDetail"
        component={RideDetailScreen}
        options={{title: ''}}
      />
    </Stack.Navigator>
  );
}
