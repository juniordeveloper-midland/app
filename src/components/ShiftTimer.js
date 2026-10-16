import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGuardStore } from '../store/useGuardStore';
import { formatElapsedTime, formatTime } from '../utils/formatters';

export default function ShiftTimer({ variant = 'card' }) {
  const isClockedIn = useGuardStore((state) => state.isClockedIn);
  const clockInTime = useGuardStore((state) => state.clockInTime);
  const elapsedShiftSeconds = useGuardStore((state) => state.elapsedShiftSeconds);
  const incrementTimer = useGuardStore((state) => state.incrementTimer);

  useEffect(() => {
    if (!isClockedIn) return;

    // Tick immediately and then every second
    incrementTimer();
    const interval = setInterval(() => {
      incrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime, incrementTimer]);

  const displayTime = isClockedIn ? formatElapsedTime(elapsedShiftSeconds) : '00:00:00';

  if (variant === 'compact') {
    return (
      <View style={styles.compactRow}>
        <MaterialCommunityIcons
          name="timer-outline"
          size={16}
          color={isClockedIn ? '#10b981' : '#64748b'}
        />
        <Text style={[styles.compactTime, isClockedIn && styles.compactTimeActive]}>
          {displayTime}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, isClockedIn ? styles.cardActive : styles.cardInactive]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <MaterialCommunityIcons
            name={isClockedIn ? 'progress-clock' : 'clock-alert-outline'}
            size={18}
            color={isClockedIn ? '#10b981' : '#64748b'}
          />
          <Text style={styles.cardHeaderTitle}>
            {isClockedIn ? 'SHIFT TIMER (ACTIVE)' : 'SHIFT TIMER (INACTIVE)'}
          </Text>
        </View>

        {isClockedIn && (
          <View style={styles.liveIndicator}>
            <View style={styles.blinkingDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.timeDisplayContainer}>
        <Text style={[styles.timeDigits, isClockedIn ? styles.timeDigitsActive : styles.timeDigitsInactive]}>
          {displayTime}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>
          {isClockedIn && clockInTime
            ? `Clocked In at ${formatTime(clockInTime)}`
            : 'Clock in to begin shift tracking'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginVertical: 6,
  },
  cardActive: {
    backgroundColor: '#0f172a',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  blinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  liveText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  timeDigits: {
    fontFamily: 'monospace',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 2,
  },
  timeDigitsActive: {
    color: '#ffffff',
  },
  timeDigitsInactive: {
    color: '#64748b',
  },
  footerRow: {
    marginTop: 6,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactTime: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  compactTimeActive: {
    color: '#10b981',
  },
});
