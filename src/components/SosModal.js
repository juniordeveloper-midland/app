import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { MOCK_GUARD, MOCK_SITE, SOS_CONTACT_NUMBER, CONTROL_ROOM } from '../data/mockData';
import { formatTime, generateSosMessage, getGoogleMapsLink } from '../utils/formatters';

export default function SosModal({ visible, onClose }) {
  const [phase, setPhase] = useState('transmitting'); // 'transmitting' | 'acknowledged'
  const [sosPayload, setSosPayload] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!visible) {
      setPhase('transmitting');
      setCountdown(3);
      setSosPayload(null);
      return;
    }

    // Trigger transmission sequence
    triggerEmergencyDispatch();
  }, [visible]);

  // Acknowledgment timer countdown
  useEffect(() => {
    if (!visible || phase !== 'transmitting') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase('acknowledged');
    }
  }, [visible, phase, countdown]);

  const triggerEmergencyDispatch = async () => {
    setPhase('transmitting');
    setCountdown(3);

    let lat = MOCK_SITE.lat;
    let lng = MOCK_SITE.lng;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }
    } catch (e) {
      console.warn('GPS reading fallback to default for SOS:', e);
    }

    const now = new Date();
    const message = generateSosMessage({
      guardName: MOCK_GUARD.name,
      siteName: MOCK_SITE.name,
      timestamp: now,
      lat,
      lng,
    });

    setSosPayload({
      guardName: MOCK_GUARD.name,
      guardId: MOCK_GUARD.id,
      siteName: MOCK_SITE.name,
      timeStr: formatTime(now),
      lat,
      lng,
      message,
    });

    // =========================================================================
    // 💬 WHATSAPP DISPATCH OPTION:
    // To route emergency alerts to WhatsApp instead of SMS, uncomment below:
    //
    // const cleanPhone = SOS_CONTACT_NUMBER.replace(/[^\d]/g, '');
    // const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    // await Linking.openURL(waUrl);
    // =========================================================================

    // Default: Dispatch via Native SMS
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([SOS_CONTACT_NUMBER], message);
      } else {
        // Fallback for devices without native SMS composer
        const smsUrl = `sms:${SOS_CONTACT_NUMBER}?body=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
        }
      }
    } catch (smsErr) {
      console.warn('SMS dispatch error:', smsErr);
    }
  };

  const openWhatsAppFallback = () => {
    if (!sosPayload) return;
    const cleanPhone = SOS_CONTACT_NUMBER.replace(/[^\d]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(sosPayload.message)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  const callControlRoom = () => {
    Linking.openURL(`tel:${SOS_CONTACT_NUMBER}`).catch(() => {
      Alert.alert('Phone Call', `Dial emergency number: ${SOS_CONTACT_NUMBER}`);
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Banner */}
          <View style={[styles.headerBanner, phase === 'acknowledged' ? styles.headerAck : styles.headerAlert]}>
            <MaterialCommunityIcons
              name={phase === 'acknowledged' ? 'shield-check' : 'alert-decagram'}
              size={36}
              color="#ffffff"
            />
            <Text style={styles.headerTitle}>
              {phase === 'acknowledged' ? 'ALERT ACKNOWLEDGED' : 'EMERGENCY SOS ACTIVE'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {phase === 'acknowledged'
                ? 'Control room confirmed receipt'
                : 'Transmitting priority distress signal'}
            </Text>
          </View>

          {/* Body Content */}
          <View style={styles.modalBody}>
            {phase === 'transmitting' ? (
              <View style={styles.transmittingBox}>
                <ActivityIndicator size="large" color="#EB0505" style={{ marginBottom: 12 }} />
                <Text style={styles.transmittingTitle}>Alert sent to control room...</Text>
                <Text style={styles.transmittingCount}>
                  Awaiting acknowledgment ({countdown}s)
                </Text>
              </View>
            ) : (
              <View style={styles.ackBox}>
                <View style={styles.ackIconWrapper}>
                  <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                </View>
                <Text style={styles.ackTitle}>Control room acknowledged ✓</Text>
                <Text style={styles.ackDescription}>
                  Response dispatcher logged coordinates. Incident response team on standby.
                </Text>
              </View>
            )}

            {/* Incident Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Guard:</Text>
                <Text style={styles.summaryValue}>
                  {MOCK_GUARD.name} ({MOCK_GUARD.id})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Site:</Text>
                <Text style={styles.summaryValue}>{MOCK_SITE.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{sosPayload?.timeStr || '--:--:--'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GPS:</Text>
                <Text style={styles.summaryValue}>
                  {sosPayload ? `${sosPayload.lat.toFixed(4)}, ${sosPayload.lng.toFixed(4)}` : 'Resolving...'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dispatch To:</Text>
                <Text style={styles.summaryValue}>{SOS_CONTACT_NUMBER}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonStack}>
              <TouchableOpacity
                style={styles.whatsAppButton}
                onPress={openWhatsAppFallback}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                <Text style={styles.whatsAppButtonText}>Open in WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callButton}
                onPress={callControlRoom}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color="#ffffff" />
                <Text style={styles.callButtonText}>Call Control Room</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissButtonText}>
                  {phase === 'acknowledged' ? 'Close & Return' : 'Cancel Alert'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#262626',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#404040',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBanner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAlert: {
    backgroundColor: '#EB0505',
  },
  headerAck: {
    backgroundColor: '#059669',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  headerSubtitle: {
    color: '#fee2e2',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  modalBody: {
    padding: 20,
  },
  transmittingBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  transmittingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  transmittingCount: {
    fontSize: 13,
    color: '#EB0505',
    fontWeight: '600',
    marginTop: 4,
  },
  ackBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ackIconWrapper: {
    marginBottom: 6,
  },
  ackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
  },
  ackDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#404040',
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  buttonStack: {
    gap: 8,
    marginTop: 6,
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 12,
  },
  whatsAppButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#404040',
    borderRadius: 10,
    paddingVertical: 12,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
});
