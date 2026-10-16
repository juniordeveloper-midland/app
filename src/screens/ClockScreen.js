import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useGuardStore } from '../store/useGuardStore';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import ShiftTimer from '../components/ShiftTimer';
import { MOCK_GUARD, MOCK_SITE } from '../data/mockData';
import { formatDistance } from '../utils/haversine';
import { formatTime, formatShortDate } from '../utils/formatters';

export default function ClockScreen() {
  const isClockedIn = useGuardStore((state) => state.isClockedIn);
  const clockInTime = useGuardStore((state) => state.clockInTime);
  const clockOutTime = useGuardStore((state) => state.clockOutTime);
  const demoMode = useGuardStore((state) => state.demoMode);
  const setDemoMode = useGuardStore((state) => state.setDemoMode);
  const lastLocation = useGuardStore((state) => state.lastLocation);
  const clockIn = useGuardStore((state) => state.clockIn);
  const clockOut = useGuardStore((state) => state.clockOut);
  const updateLocation = useGuardStore((state) => state.updateLocation);

  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch current GPS position
  const fetchCurrentLocation = async () => {
    setIsLoadingGps(true);
    setErrorMessage(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        const msg = 'Location permission denied. Please grant location access in device settings.';
        setErrorMessage(msg);
        setIsLoadingGps(false);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locData = updateLocation(location.coords);
      return locData;
    } catch (err) {
      const msg = `Unable to acquire GPS signal: ${err.message}`;
      setErrorMessage(msg);
      return null;
    } finally {
      setIsLoadingGps(false);
    }
  };

  // Check GPS on screen load
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // Handle Clock In Action
  const handleClockIn = async () => {
    setErrorMessage(null);
    const locData = await fetchCurrentLocation();

    if (!locData) {
      if (!demoMode) {
        Alert.alert(
          'Location Required',
          'GPS reading is required to verify site geofence. Enable "Demo Mode" below to bypass.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const isInside = locData ? locData.insideZone : false;
    const distance = locData ? locData.distance : 0;

    if (isInside || demoMode) {
      clockIn(locData);
      Alert.alert(
        '✓ Shift Started',
        `Successfully clocked in at ${MOCK_SITE.name}.\nShift timer is now running.${
          demoMode && !isInside ? '\n\n(Geofence bypassed via Demo Mode)' : ''
        }`,
        [{ text: 'OK' }]
      );
    } else {
      const msg = `You are outside the site zone (${formatDistance(distance)} away). Allowed site radius is ${MOCK_SITE.radius}m.`;
      setErrorMessage(msg);
      Alert.alert(
        'Outside Site Zone',
        `${msg}\n\nTo test the demo without being at the exact coordinates, turn on "Demo Mode" below.`,
        [
          { text: 'Enable Demo Mode', onPress: () => setDemoMode(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Handle Clock Out Action
  const handleClockOut = () => {
    Alert.alert(
      'Confirm Clock Out',
      'Are you sure you want to clock out and conclude your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out',
          style: 'destructive',
          onPress: () => {
            clockOut();
            Alert.alert('Shift Concluded', 'You have successfully clocked out. Shift timer stopped.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="TIME & ATTENDANCE" subtitle="GPS Geofenced Shift Verification" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Duty Status Hero Card */}
        <View style={[styles.statusHeroCard, isClockedIn ? styles.heroActive : styles.heroInactive]}>
          <View style={styles.heroTop}>
            <View style={styles.heroStatusRow}>
              <View
                style={[
                  styles.heroStatusDot,
                  isClockedIn ? styles.heroStatusDotActive : styles.heroStatusDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.heroStatusText,
                  isClockedIn ? styles.heroStatusTextActive : styles.heroStatusTextInactive,
                ]}
              >
                {isClockedIn ? 'ON DUTY • CLOCKED IN' : 'OFF DUTY • NOT CLOCKED IN'}
              </Text>
            </View>

            <StatusBadge
              type="shift"
              value={isClockedIn}
              label={isClockedIn ? 'ACTIVE' : 'IDLE'}
              size="small"
            />
          </View>

          {/* Large Shift Timer */}
          <ShiftTimer />

          {/* Timestamps */}
          <View style={styles.timestampGrid}>
            <View style={styles.timestampBox}>
              <Text style={styles.timestampLabel}>CLOCK IN</Text>
              <Text style={styles.timestampValue}>
                {clockInTime ? formatTime(clockInTime) : '--:--:--'}
              </Text>
              {clockInTime && (
                <Text style={styles.timestampDate}>{formatShortDate(clockInTime)}</Text>
              )}
            </View>

            <View style={styles.timestampBox}>
              <Text style={styles.timestampLabel}>CLOCK OUT</Text>
              <Text style={styles.timestampValue}>
                {clockOutTime ? formatTime(clockOutTime) : '--:--:--'}
              </Text>
              {clockOutTime && (
                <Text style={styles.timestampDate}>{formatShortDate(clockOutTime)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Demo Mode Toggle Switch Card */}
        <View style={styles.demoModeCard}>
          <View style={styles.demoModeLeft}>
            <View style={styles.demoIconBox}>
              <Ionicons name="flask" size={20} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoModeTitle}>Demo Mode (Geofence Bypass)</Text>
              <Text style={styles.demoModeDescription}>
                Bypass the 100m radius check to clock in from anywhere or when testing on simulator.
              </Text>
            </View>
          </View>
          <Switch
            value={demoMode}
            onValueChange={setDemoMode}
            trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
            thumbColor={demoMode ? '#0284c7' : '#94a3b8'}
          />
        </View>

        {/* Site Geofence Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color="#0284c7" />
              <Text style={styles.cardTitle}>SITE GEOFENCE PERIMETER</Text>
            </View>
            <View style={styles.radiusPill}>
              <Text style={styles.radiusPillText}>{MOCK_SITE.radius}m Radius</Text>
            </View>
          </View>

          <View style={styles.siteDetailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Assigned Site</Text>
              <Text style={styles.detailValue}>{MOCK_SITE.name}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Target GPS Coordinates</Text>
              <Text style={styles.detailValueMono}>
                {MOCK_SITE.lat.toFixed(4)}° N, {MOCK_SITE.lng.toFixed(4)}° E
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValueSmall}>{MOCK_SITE.address}</Text>
            </View>
          </View>
        </View>

        {/* Live GPS Telemetry Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#10b981" />
              <Text style={styles.cardTitle}>CURRENT GPS TELEMETRY</Text>
            </View>

            <TouchableOpacity
              style={styles.refreshGpsButton}
              onPress={fetchCurrentLocation}
              disabled={isLoadingGps}
            >
              {isLoadingGps ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <>
                  <Ionicons name="refresh" size={14} color="#0284c7" />
                  <Text style={styles.refreshGpsText}>Refresh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {lastLocation ? (
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>Latitude</Text>
                <Text style={styles.telemetryValue}>{lastLocation.latitude.toFixed(6)}°</Text>
              </View>

              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>Longitude</Text>
                <Text style={styles.telemetryValue}>{lastLocation.longitude.toFixed(6)}°</Text>
              </View>

              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>GPS Accuracy</Text>
                <Text style={styles.telemetryValue}>±{lastLocation.accuracy} m</Text>
              </View>

              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>Distance to Gate</Text>
                <Text
                  style={[
                    styles.telemetryValue,
                    lastLocation.insideZone ? styles.distGreen : styles.distRed,
                  ]}
                >
                  {formatDistance(lastLocation.distance)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noGpsContainer}>
              <Text style={styles.noGpsText}>
                {isLoadingGps ? 'Reading GPS satellites...' : 'Tap Refresh to read your GPS position'}
              </Text>
            </View>
          )}

          {/* Geofence Status Result Row */}
          <View style={styles.geofenceStatusFooter}>
            <Text style={styles.geofenceStatusLabel}>Zone Boundary Status:</Text>
            {demoMode ? (
              <StatusBadge type="geofence" value="demo" size="small" />
            ) : lastLocation ? (
              <StatusBadge
                type="geofence"
                value={lastLocation.insideZone}
                label={lastLocation.insideZone ? 'Inside zone' : 'Outside zone'}
                size="small"
              />
            ) : (
              <Text style={styles.geofencePendingText}>Pending GPS reading</Text>
            )}
          </View>
        </View>

        {/* Error Alert Box if any */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={18} color="#dc2626" />
            <Text style={styles.errorBoxText}>{errorMessage}</Text>
          </View>
        )}

        {/* Main Clock Action Button */}
        <View style={styles.actionSection}>
          {!isClockedIn ? (
            <TouchableOpacity
              style={[styles.bigButton, styles.bigClockInButton]}
              onPress={handleClockIn}
              disabled={isLoadingGps}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="fingerprint" size={28} color="#ffffff" />
              <View>
                <Text style={styles.bigButtonTitle}>CLOCK IN TO SHIFT</Text>
                <Text style={styles.bigButtonSubtitle}>Verify GPS & start shift timer</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.bigButton, styles.bigClockOutButton]}
              onPress={handleClockOut}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="exit-to-app" size={28} color="#ffffff" />
              <View>
                <Text style={styles.bigButtonTitle}>CLOCK OUT</Text>
                <Text style={styles.bigButtonSubtitle}>End shift & stop timer</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  heroActive: {
    borderColor: '#059669',
  },
  heroInactive: {
    borderColor: '#e2e8f0',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  heroStatusDotActive: {
    backgroundColor: '#10b981',
  },
  heroStatusDotInactive: {
    backgroundColor: '#94a3b8',
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroStatusTextActive: {
    color: '#047857',
  },
  heroStatusTextInactive: {
    color: '#64748b',
  },
  timestampGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  timestampBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  timestampLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  timestampValue: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  timestampDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  demoModeCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  demoModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  demoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoModeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  demoModeDescription: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  radiusPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  radiusPillText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
  },
  siteDetailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  detailValueMono: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  detailValueSmall: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  refreshGpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
  },
  refreshGpsText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  telemetryItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  telemetryLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  telemetryValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  distGreen: {
    color: '#047857',
  },
  distRed: {
    color: '#dc2626',
  },
  noGpsContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  noGpsText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  geofenceStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  geofenceStatusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  geofencePendingText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
    flex: 1,
  },
  actionSection: {
    marginTop: 8,
  },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bigClockInButton: {
    backgroundColor: '#059669', // Emerald
  },
  bigClockOutButton: {
    backgroundColor: '#dc2626', // Red
  },
  bigButtonTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bigButtonSubtitle: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
