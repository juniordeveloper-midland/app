import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatusBadge({ type, value, label, size = 'medium' }) {
  if (type === 'geofence') {
    if (value === 'demo') {
      return (
        <View style={[styles.badge, styles.demoGeofence, size === 'small' && styles.badgeSmall]}>
          <Ionicons name="shield-checkmark" size={size === 'small' ? 12 : 14} color="#38bdf8" />
          <Text style={[styles.text, styles.textBlue, size === 'small' && styles.textSmall]}>
            DEMO BYPASS (ACTIVE)
          </Text>
        </View>
      );
    }

    const inside = Boolean(value);
    return (
      <View
        style={[
          styles.badge,
          inside ? styles.greenBadge : styles.redBadge,
          size === 'small' && styles.badgeSmall,
        ]}
      >
        <Ionicons
          name={inside ? 'location' : 'alert-circle'}
          size={size === 'small' ? 12 : 14}
          color={inside ? '#10b981' : '#dc2626'}
        />
        <Text
          style={[
            styles.text,
            inside ? styles.textGreen : styles.textRed,
            size === 'small' && styles.textSmall,
          ]}
        >
          {label || (inside ? 'Inside zone' : 'Outside zone')}
        </Text>
      </View>
    );
  }

  if (type === 'checkpoint') {
    const isDone = value === 'DONE';
    return (
      <View
        style={[
          styles.badge,
          isDone ? styles.greenBadge : styles.amberBadge,
          size === 'small' && styles.badgeSmall,
        ]}
      >
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'time-outline'}
          size={size === 'small' ? 12 : 14}
          color={isDone ? '#10b981' : '#f59e0b'}
        />
        <Text
          style={[
            styles.text,
            isDone ? styles.textGreen : styles.textAmber,
            size === 'small' && styles.textSmall,
          ]}
        >
          {isDone ? 'DONE ✓' : 'DUE'}
        </Text>
      </View>
    );
  }

  // Default shift status
  const isClockedIn = Boolean(value);
  return (
    <View
      style={[
        styles.badge,
        isClockedIn ? styles.greenBadge : styles.slateBadge,
        size === 'small' && styles.badgeSmall,
      ]}
    >
      <MaterialCommunityIcons
        name={isClockedIn ? 'account-clock' : 'account-off'}
        size={size === 'small' ? 12 : 14}
        color={isClockedIn ? '#10b981' : '#94a3b8'}
      />
      <Text
        style={[
          styles.text,
          isClockedIn ? styles.textGreen : styles.textSlate,
          size === 'small' && styles.textSmall,
        ]}
      >
        {label || (isClockedIn ? 'CLOCKED IN' : 'OFF DUTY')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  greenBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  redBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  amberBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  slateBadge: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  demoGeofence: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
  textGreen: {
    color: '#047857',
  },
  textRed: {
    color: '#dc2626',
  },
  textAmber: {
    color: '#b45309',
  },
  textSlate: {
    color: '#475569',
  },
  textBlue: {
    color: '#0284c7',
  },
});
