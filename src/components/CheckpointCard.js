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
          <Ionicons name="location-outline" size={14} color="#64748b" />
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
            color={isClockedIn ? '#ffffff' : '#94a3b8'}
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
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDone: {
    borderColor: '#a7f3d0',
    backgroundColor: '#f0fdf4',
  },
  cardDue: {
    borderColor: '#e2e8f0',
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
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  numberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  numberTextDone: {
    color: '#ffffff',
  },
  numberTextDue: {
    color: '#475569',
  },
  checkpointId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  checkpointName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
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
    color: '#64748b',
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
    color: '#047857',
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
    color: '#b45309',
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  scanButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scanButtonTextDisabled: {
    color: '#94a3b8',
  },
});
