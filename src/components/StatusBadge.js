import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatusBadge({ type, value, label, size = 'medium' }) {
  if (type === 'geofence') {
    if (value === 'demo') {
      return (
        <View style={[styles.badge, styles.demoGeofence, size === 'small' && styles.badgeSmall]}>
          <Ionicons name="shield-checkmark" size={size === 'small' ? 12 : 14} color="#f59e0b" />
          <Text style={[styles.text, styles.textAmber, size === 'small' && styles.textSmall]}>
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
          color={inside ? '#10b981' : '#EB0505'}
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  redBadge: {
    backgroundColor: 'rgba(235, 5, 5, 0.15)',
    borderColor: 'rgba(235, 5, 5, 0.4)',
  },
  amberBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  slateBadge: {
    backgroundColor: '#333333',
    borderColor: '#4d4d4d',
  },
  demoGeofence: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
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
    color: '#34d399',
  },
  textRed: {
    color: '#f87171',
  },
  textAmber: {
    color: '#fbbf24',
  },
  textSlate: {
    color: '#9ca3af',
  },
  textBlue: {
    color: '#EB0505',
  },
});
