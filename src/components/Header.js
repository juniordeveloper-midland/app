import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useGuardStore } from '../store/useGuardStore';
import { MOCK_GUARD, MOCK_SITE } from '../data/mockData';

export default function Header({ title, subtitle }) {
  const isClockedIn = useGuardStore((state) => state.isClockedIn);
  const demoMode = useGuardStore((state) => state.demoMode);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#38bdf8" />
          </View>
          <View>
            <Text style={styles.brandTitle}>REGION SECURITY</Text>
            <Text style={styles.brandSubtitle}>OFFICER PORTAL</Text>
          </View>
        </View>

        <View style={styles.statusBadgesGroup}>
          {demoMode && (
            <View style={styles.demoBadge}>
              <Ionicons name="flask-outline" size={12} color="#f59e0b" />
              <Text style={styles.demoBadgeText}>DEMO</Text>
            </View>
          )}

          <View style={[styles.dutyBadge, isClockedIn ? styles.dutyActive : styles.dutyInactive]}>
            <View style={[styles.pulseDot, isClockedIn ? styles.pulseActive : styles.pulseInactive]} />
            <Text style={[styles.dutyText, isClockedIn ? styles.dutyTextActive : styles.dutyTextInactive]}>
              {isClockedIn ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
          </View>
        </View>
      </View>

      {(title || subtitle) && (
        <View style={styles.titleSection}>
          {title && <Text style={styles.pageTitle}>{title}</Text>}
          {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0f172a', // Dark navy
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  statusBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  demoBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  dutyActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  dutyInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: '#475569',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseActive: {
    backgroundColor: '#10b981',
  },
  pulseInactive: {
    backgroundColor: '#64748b',
  },
  dutyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dutyTextActive: {
    color: '#34d399',
  },
  dutyTextInactive: {
    color: '#94a3b8',
  },
  titleSection: {
    marginTop: 12,
  },
  pageTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
});
