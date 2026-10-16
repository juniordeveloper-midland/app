import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ClockScreen from './src/screens/ClockScreen';
import PatrolScreen from './src/screens/PatrolScreen';
import { useGuardStore } from './src/store/useGuardStore';
import { useGeofenceMonitor } from './src/hooks/useGeofenceMonitor';

const Tab = createBottomTabNavigator();

export default function App() {
  const loadFromStorage = useGuardStore((state) => state.loadFromStorage);
  const checkpoints = useGuardStore((state) => state.checkpoints);
  const isClockedIn = useGuardStore((state) => state.isClockedIn);

  // Global geofence watcher (runs every 10s when clocked in and Demo Mode is OFF)
  useGeofenceMonitor();

  useEffect(() => {
    // Load persisted state from AsyncStorage on boot
    loadFromStorage();
  }, [loadFromStorage]);

  const dueCount = checkpoints.filter((cp) => cp.status === 'DUE').length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" backgroundColor="#0f172a" />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#0284c7', // Sky blue
              tabBarInactiveTintColor: '#64748b', // Slate
              tabBarStyle: {
                backgroundColor: '#ffffff',
                borderTopColor: '#e2e8f0',
                borderTopWidth: 1,
                height: Platform.OS === 'ios' ? 88 : 64,
                paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                paddingTop: 8,
                elevation: 8,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.3,
              },
            }}
          >
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                tabBarLabel: 'Dashboard',
                tabBarIcon: ({ color, size, focused }) => (
                  <MaterialCommunityIcons
                    name={focused ? 'shield-home' : 'shield-home-outline'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />

            <Tab.Screen
              name="Clock"
              component={ClockScreen}
              options={{
                tabBarLabel: 'Clock In/Out',
                tabBarBadge: isClockedIn ? 'ON' : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: 9,
                  fontWeight: '800',
                  height: 16,
                  minWidth: 16,
                  borderRadius: 8,
                  lineHeight: 16,
                },
                tabBarIcon: ({ color, size, focused }) => (
                  <MaterialCommunityIcons
                    name={focused ? 'clock-check' : 'clock-outline'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />

            <Tab.Screen
              name="Patrol"
              component={PatrolScreen}
              options={{
                tabBarLabel: 'QR Patrol',
                tabBarBadge: dueCount > 0 ? dueCount : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: '800',
                  height: 18,
                  minWidth: 18,
                  borderRadius: 9,
                  lineHeight: 18,
                },
                tabBarIcon: ({ color, size, focused }) => (
                  <MaterialCommunityIcons
                    name={focused ? 'qrcode-scan' : 'qrcode'}
                    size={24}
                    color={color}
                  />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
