import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useGuardStore } from '../store/useGuardStore';
import Header from '../components/Header';
import ShiftTimer from '../components/ShiftTimer';
import StatusBadge from '../components/StatusBadge';
import SosModal from '../components/SosModal';
import { MOCK_GUARD, MOCK_SITE, MOCK_SHIFT } from '../data/mockData';
import { formatDistance } from '../utils/haversine';
import { formatTime } from '../utils/formatters';

export default function HomeScreen({ navigation }) {
  const isClockedIn = useGuardStore((state) => state.isClockedIn);
  const clockInTime = useGuardStore((state) => state.clockInTime);
  const demoMode = useGuardStore((state) => state.demoMode);
  const lastLocation = useGuardStore((state) => state.lastLocation);
  const checkpoints = useGuardStore((state) => state.checkpoints);
  const clockIn = useGuardStore((state) => state.clockIn);
  const clockOut = useGuardStore((state) => state.clockOut);
  const updateLocation = useGuardStore((state) => state.updateLocation);
  const resetDemo = useGuardStore((state) => state.resetDemo);
  const geofenceBanner = useGuardStore((state) => state.geofenceBanner);
  const dismissGeofenceBanner = useGuardStore((state) => state.dismissGeofenceBanner);
  const geofenceEvents = useGuardStore((state) => state.geofenceEvents);
  const isWatchingLocation = useGuardStore((state) => state.isWatchingLocation);
  const simulateGeofenceBreach = useGuardStore((state) => state.simulateGeofenceBreach);
  const simulateGeofenceReturn = useGuardStore((state) => state.simulateGeofenceReturn);

  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [isClockingLoading, setIsClockingLoading] = useState(false);

  const completedCount = checkpoints.filter((cp) => cp.status === 'DONE').length;
  const totalCheckpoints = checkpoints.length;
  const progressPercent = Math.round((completedCount / totalCheckpoints) * 100);

  // Quick Clock In Action
  const handleQuickClockToggle = async () => {
    if (isClockedIn) {
      Alert.alert(
        'Confirm Clock Out',
        'Are you sure you want to clock out and end your shift?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clock Out',
            style: 'destructive',
            onPress: () => {
              clockOut();
              Alert.alert('Shift Ended', 'You have successfully clocked out.');
            },
          },
        ]
      );
      return;
    }

    // Attempt Clock In
    setIsClockingLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'GPS location is required to verify site perimeter clock-in. Please enable location permissions in settings.',
          [{ text: 'OK' }]
        );
        setIsClockingLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locData = updateLocation(position.coords);

      if (locData.insideZone || demoMode) {
        clockIn(locData);
        Alert.alert(
          'Clocked In Successfully!',
          `Welcome, ${MOCK_GUARD.name}. You are logged on duty at ${MOCK_SITE.name}.${
            demoMode ? '\n\n(Demo Mode active - Geofence bypassed)' : ''
          }`,
          [{ text: 'Start Shift' }]
        );
      } else {
        Alert.alert(
          'Outside Site Zone',
          `You are outside the site zone (${formatDistance(locData.distance)} away).\nAllowed radius: ${MOCK_SITE.radius}m.\n\nTurn on "Demo Mode" in the Clock tab to bypass.`,
          [
            { text: 'Go to Clock Tab', onPress: () => navigation.navigate('Clock') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        'GPS Error',
        `Could not retrieve GPS coordinates: ${err.message}. If testing on an emulator, use Demo Mode.`
      );
    } finally {
      setIsClockingLoading(false);
    }
  };

  // SOS Confirmation Dialog
  const handleSosPress = () => {
    Alert.alert(
      '🚨 Send emergency alert?',
      `This will immediately dispatch your GPS coordinates to the control room and emergency contacts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS NOW',
          style: 'destructive',
          onPress: () => {
            setSosModalVisible(true);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Header />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Geofence Alert Banners (Red warning on breach, Green on return) */}
        {geofenceBanner && isClockedIn && !demoMode && (
          <View
            style={[
              styles.geofenceBanner,
              geofenceBanner.type === 'danger'
                ? styles.geofenceBannerDanger
                : styles.geofenceBannerSuccess,
            ]}
          >
            <View style={styles.bannerIconBox}>
              <MaterialCommunityIcons
                name={
                  geofenceBanner.type === 'danger'
                    ? 'alert-octagon'
                    : 'shield-check'
                }
                size={26}
                color="#ffffff"
              />
            </View>
            <View style={styles.bannerTextColumn}>
              <View style={styles.bannerTagRow}>
                <View
                  style={[
                    styles.bannerPill,
                    geofenceBanner.type === 'danger'
                      ? styles.bannerPillDanger
                      : styles.bannerPillSuccess,
                  ]}
                >
                  <Text style={styles.bannerPillText}>
                    {geofenceBanner.type === 'danger'
                      ? 'PERIMETER BREACH'
                      : 'ZONE RESTORED'}
                  </Text>
                </View>
                {geofenceBanner.timestamp && (
                  <Text style={styles.bannerTimeText}>
                    {formatTime(geofenceBanner.timestamp)}
                  </Text>
                )}
              </View>
              <Text style={styles.bannerMessageText}>{geofenceBanner.message}</Text>
              <Text style={styles.bannerSubText}>
                {geofenceBanner.type === 'danger'
                  ? `Allowed radius: ${MOCK_SITE.radius}m • Return to site zone immediately`
                  : 'Alert flag reset • You are within the assigned site boundary'}
              </Text>
            </View>

            {geofenceBanner.type === 'success' && (
              <TouchableOpacity
                style={styles.bannerDismissButton}
                onPress={dismissGeofenceBanner}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Guard & Site Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-shield" size={24} color="#0284c7" />
            </View>
            <View style={styles.guardInfo}>
              <View style={styles.nameIdRow}>
                <Text style={styles.guardName}>{MOCK_GUARD.name}</Text>
                <View style={styles.guardIdBadge}>
                  <Text style={styles.guardIdText}>{MOCK_GUARD.id}</Text>
                </View>
              </View>
              <Text style={styles.guardRole}>{MOCK_GUARD.role}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.siteInfoRow}>
            <View style={styles.siteIconBox}>
              <Ionicons name="business" size={16} color="#0f172a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.siteName}>{MOCK_SITE.name}</Text>
              <Text style={styles.siteShift}>{MOCK_SHIFT.timeLabel}</Text>
            </View>
          </View>

          {/* GPS Status Indicator */}
          <View style={styles.gpsRow}>
            <View style={styles.gpsLabelRow}>
              <Text style={styles.gpsLabel}>GPS Perimeter Status:</Text>
              {isWatchingLocation && !demoMode && (
                <View style={styles.liveWatchBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveWatchText}>LIVE (10s)</Text>
                </View>
              )}
            </View>
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
              <View style={styles.gpsUnknown}>
                <Text style={styles.gpsUnknownText}>Awaiting Check-in</Text>
              </View>
            )}
          </View>
        </View>

        {/* Live Shift Timer */}
        <ShiftTimer />

        {/* Quick Clock In/Out Action Button */}
        <TouchableOpacity
          style={[
            styles.clockActionButton,
            isClockedIn ? styles.clockActionOut : styles.clockActionIn,
          ]}
          onPress={handleQuickClockToggle}
          disabled={isClockingLoading}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isClockedIn ? 'exit-to-app' : 'fingerprint'}
            size={24}
            color="#ffffff"
          />
          <Text style={styles.clockActionText}>
            {isClockingLoading
              ? 'Verifying Location...'
              : isClockedIn
              ? 'CLOCK OUT (END SHIFT)'
              : 'CLOCK IN NOW'}
          </Text>
        </TouchableOpacity>

        {/* Patrol Progress Card */}
        <View style={styles.patrolCard}>
          <View style={styles.patrolCardHeader}>
            <View style={styles.patrolTitleRow}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#0284c7" />
              <Text style={styles.patrolCardTitle}>PATROL ROUND</Text>
            </View>
            <Text style={styles.patrolCountText}>
              {completedCount} of {totalCheckpoints} completed
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Mini Checkpoint Status List */}
          <View style={styles.checkpointMiniList}>
            {checkpoints.map((cp) => {
              const done = cp.status === 'DONE';
              return (
                <View key={cp.id} style={styles.miniItemRow}>
                  <View style={styles.miniLeft}>
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={done ? '#10b981' : '#cbd5e1'}
                    />
                    <Text style={[styles.miniId, done && styles.miniIdDone]}>{cp.id}</Text>
                    <Text style={[styles.miniName, done && styles.miniNameDone]}>
                      {cp.name}
                    </Text>
                  </View>
                  <Text style={styles.miniStatus}>
                    {done ? formatTime(cp.scannedAt) : 'DUE'}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.patrolNavButton}
            onPress={() => navigation.navigate('Patrol')}
            activeOpacity={0.8}
          >
            <Text style={styles.patrolNavButtonText}>
              {isClockedIn ? 'GO TO PATROL SCANNER' : 'VIEW CHECKPOINTS'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {/* Geofence Perimeter Security Log Card */}
        <View style={styles.geofenceLogCard}>
          <View style={styles.geofenceLogHeader}>
            <View style={styles.geofenceLogTitleRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color="#0284c7" />
              <Text style={styles.geofenceLogTitle}>GEOFENCE ACTIVITY LOG</Text>
            </View>
            <View style={styles.eventCountBadge}>
              <Text style={styles.eventCountText}>
                {geofenceEvents.length} {geofenceEvents.length === 1 ? 'Event' : 'Events'}
              </Text>
            </View>
          </View>

          {/* Quick Simulation / Testing Controls */}
          <View style={styles.simControlsBox}>
            <Text style={styles.simTitle}>TEST GEOFENCE MONITORING</Text>
            <Text style={styles.simDesc}>
              Simulate moving outside/inside site radius ({MOCK_SITE.radius}m) to test alerts & logging:
            </Text>
            <View style={styles.simBtnRow}>
              <TouchableOpacity
                style={[styles.simBtn, styles.simBtnExit]}
                onPress={() => simulateGeofenceBreach()}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="exit-run" size={16} color="#dc2626" />
                <Text style={styles.simBtnExitText}>Simulate Exit (165m)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.simBtn, styles.simBtnReturn]}
                onPress={() => simulateGeofenceReturn()}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="account-arrow-left" size={16} color="#059669" />
                <Text style={styles.simBtnReturnText}>Simulate Return (0m)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* List of logged events */}
          {geofenceEvents.length === 0 ? (
            <View style={styles.emptyLogBox}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#94a3b8" />
              <Text style={styles.emptyLogText}>Perimeter secure • No exit events logged</Text>
            </View>
          ) : (
            <View style={styles.eventList}>
              {geofenceEvents.slice(0, 5).map((evt) => {
                const isExit = evt.type === 'EXIT';
                return (
                  <View key={evt.id} style={styles.eventRow}>
                    <View
                      style={[
                        styles.eventTypeDot,
                        isExit ? styles.dotExit : styles.dotReturn,
                      ]}
                    />
                    <View style={styles.eventInfo}>
                      <View style={styles.eventMetaRow}>
                        <Text
                          style={[
                            styles.eventTypeName,
                            isExit ? styles.textExit : styles.textReturn,
                          ]}
                        >
                          {isExit ? 'PERIMETER EXIT' : 'ZONE RETURN'}
                        </Text>
                        <Text style={styles.eventTime}>{formatTime(evt.timestamp)}</Text>
                      </View>
                      <Text style={styles.eventMsg}>{evt.message}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Reset Demo Option */}
        <View style={styles.resetContainer}>
          <TouchableOpacity
            style={styles.resetDemoButton}
            onPress={() => {
              Alert.alert(
                'Reset Demo Data?',
                'This will reset your clock-in status, timer, and checkpoint scans back to initial state.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset Demo',
                    style: 'destructive',
                    onPress: () => {
                      resetDemo();
                      Alert.alert('Demo Reset', 'All demo data has been restored to default.');
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="refresh-outline" size={14} color="#64748b" />
            <Text style={styles.resetDemoText}>Reset Demo State</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Large Red SOS Button Fixed at Bottom */}
      <View style={styles.bottomSosContainer}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSosPress}
          activeOpacity={0.85}
        >
          <View style={styles.sosGlowOuter}>
            <View style={styles.sosInnerRow}>
              <MaterialCommunityIcons name="alarm-light" size={26} color="#ffffff" />
              <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
              <MaterialCommunityIcons name="alarm-light" size={26} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* SOS Modal Component */}
      <SosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
      />
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
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardInfo: {
    flex: 1,
  },
  nameIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guardName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  guardIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guardIdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  guardRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  siteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  siteIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  siteShift: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gpsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  gpsUnknown: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsUnknownText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  clockActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clockActionIn: {
    backgroundColor: '#059669', // Emerald Green
  },
  clockActionOut: {
    backgroundColor: '#334155', // Slate dark
  },
  clockActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  patrolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  patrolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patrolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patrolCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  patrolCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  checkpointMiniList: {
    gap: 8,
    marginBottom: 12,
  },
  miniItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  miniLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  miniId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  miniIdDone: {
    color: '#047857',
  },
  miniName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  miniNameDone: {
    color: '#0f172a',
    fontWeight: '500',
  },
  miniStatus: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  patrolNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  patrolNavButtonText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  resetDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetDemoText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSosContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sosButton: {
    backgroundColor: '#dc2626', // Emergency Red
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  sosGlowOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  // Geofence Banners
  geofenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 12,
  },
  geofenceBannerDanger: {
    backgroundColor: '#dc2626', // Urgent perimeter breach red
    borderColor: '#b91c1c',
    borderWidth: 1,
  },
  geofenceBannerSuccess: {
    backgroundColor: '#059669', // Emerald perimeter secure green
    borderColor: '#047857',
    borderWidth: 1,
  },
  bannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextColumn: {
    flex: 1,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  bannerPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerPillDanger: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  bannerPillSuccess: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bannerPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bannerTimeText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  bannerMessageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  bannerSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  bannerDismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // GPS Row live watch badge
  gpsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveWatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveWatchText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.3,
  },

  // Geofence Activity Log Card
  geofenceLogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  geofenceLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  geofenceLogTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geofenceLogTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  eventCountBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  simControlsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  simTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  simDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 15,
  },
  simBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  simBtnExit: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  simBtnExitText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  simBtnReturn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  simBtnReturnText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyLogBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  emptyLogText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  eventList: {
    gap: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventTypeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  dotExit: {
    backgroundColor: '#dc2626',
  },
  dotReturn: {
    backgroundColor: '#10b981',
  },
  eventInfo: {
    flex: 1,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  textExit: {
    color: '#dc2626',
  },
  textReturn: {
    color: '#047857',
  },
  eventTime: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  eventMsg: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
    fontWeight: '500',
  },
});
