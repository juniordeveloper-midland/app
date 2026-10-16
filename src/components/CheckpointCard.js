import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { formatTime } from '../utils/formatters';

export default function CheckpointCard({
  checkpoint,
  onScanPress,
  isClockedIn,
}) {
  const isDone = checkpoint.status === 'DONE';

  return (
    <View style={[styles.card, isDone ? styles.cardDone : styles.cardDue]}>
      <View style={styles.topRow}>
        <View style={styles.idBadgeGroup}>
          <View style={[styles.numberCircle, isDone ? styles.circleDone : styles.circleDue]}>
            <Text style={[styles.numberText, isDone ? styles.numberTextDone : styles.numberTextDue]}>
              {checkpoint.order || checkpoint.id.replace('CP-00', '')}
            </Text>
          </View>
          <View>
            <Text style={styles.checkpointId}>{checkpoint.id}</Text>
            <Text style={styles.checkpointName}>{checkpoint.name}</Text>
          </View>
        </View>

        <StatusBadge type="checkpoint" value={checkpoint.status} size="small" />
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#9ca3af" />
          <Text style={styles.locationText}>{checkpoint.location}</Text>
        </View>

        {isDone && checkpoint.scannedAt ? (
          <View style={styles.scanMetaRow}>
            <Ionicons name="checkmark-done" size={14} color="#10b981" />
            <Text style={styles.scanMetaText}>
              Scanned at {formatTime(checkpoint.scannedAt)}
            </Text>
          </View>
        ) : (
          <View style={styles.dueMetaRow}>
            <Ionicons name="time-outline" size={14} color="#f59e0b" />
            <Text style={styles.dueMetaText}>Inspection pending</Text>
          </View>
        )}
      </View>

      {!isDone && (
        <TouchableOpacity
          style={[
            styles.scanButton,
            !isClockedIn && styles.scanButtonDisabled,
          ]}
          onPress={() => onScanPress(checkpoint)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={18}
            color={isClockedIn ? '#ffffff' : '#9ca3af'}
          />
          <Text
            style={[
              styles.scanButtonText,
              !isClockedIn && styles.scanButtonTextDisabled,
            ]}
          >
            {isClockedIn ? `SCAN ${checkpoint.id}` : 'CLOCK IN TO SCAN'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#262626',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#404040',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDone: {
    borderColor: '#059669',
    backgroundColor: '#1b2d24',
  },
  cardDue: {
    borderColor: '#404040',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: '#10b981',
  },
  circleDue: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#4d4d4d',
  },
  numberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  numberTextDone: {
    color: '#ffffff',
  },
  numberTextDue: {
    color: '#d1d5db',
  },
  checkpointId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EB0505',
    letterSpacing: 0.5,
  },
  checkpointName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailsSection: {
    marginTop: 10,
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  scanMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  scanMetaText: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },
  dueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dueMetaText: {
    fontSize: 12,
    color: '#fde68a',
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EB0505',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  scanButtonDisabled: {
    backgroundColor: '#404040',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scanButtonTextDisabled: {
    color: '#9ca3af',
  },
});
