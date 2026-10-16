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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useGuardStore } from '../store/useGuardStore';
import Header from '../components/Header';
import CheckpointCard from '../components/CheckpointCard';
import CameraScannerModal from '../components/CameraScannerModal';
import { MOCK_CHECKPOINTS } from '../data/mockData';

export default function PatrolScreen({ navigation }) {
  const isClockedIn = useGuardStore((state) => state.isClockedIn);
  const checkpoints = useGuardStore((state) => state.checkpoints);
  const scanCheckpoint = useGuardStore((state) => state.scanCheckpoint);
  const resetDemo = useGuardStore((state) => state.resetDemo);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);

  const completedCount = checkpoints.filter((cp) => cp.status === 'DONE').length;
  const totalCount = checkpoints.length;
  const isAllComplete = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleOpenScanner = (targetCp = null) => {
    if (!isClockedIn) {
      Alert.alert(
        'Clock-In Required',
        'You must clock in to your shift before performing patrol checkpoint scans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Clock In', onPress: () => navigation.navigate('Clock') },
        ]
      );
      return;
    }

    setSelectedTarget(targetCp);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = (code) => {
    const result = scanCheckpoint(code);
    return result;
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="PATROL ROUTE" subtitle="Security Checkpoint Verification" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Not Clocked In Notice Banner */}
        {!isClockedIn && (
          <View style={styles.lockedNoticeCard}>
            <View style={styles.lockedNoticeIcon}>
              <MaterialCommunityIcons name="lock-alert" size={24} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedNoticeTitle}>Patrol Inactive</Text>
              <Text style={styles.lockedNoticeDescription}>
                Patrol checkpoint scanning is only permitted while actively clocked in on duty.
              </Text>
              <TouchableOpacity
                style={styles.lockedNoticeButton}
                onPress={() => navigation.navigate('Clock')}
                activeOpacity={0.8}
              >
                <Text style={styles.lockedNoticeButtonText}>Go to Clock In</Text>
                <Ionicons name="arrow-forward" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Patrol Progress Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTopRow}>
            <View>
              <Text style={styles.overviewSubtitle}>PATROL ROUND #1</Text>
              <Text style={styles.overviewTitle}>Perimeter Inspection</Text>
            </View>
            <View style={[styles.progressPill, isAllComplete && styles.progressPillComplete]}>
              <Text style={[styles.progressPillText, isAllComplete && styles.progressPillTextComplete]}>
                {completedCount} / {totalCount} Done
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                isAllComplete && styles.progressBarFillComplete,
              ]}
            />
          </View>

          <View style={styles.overviewFooter}>
            <Text style={styles.overviewFooterText}>
              {isAllComplete
                ? '✓ Round complete. All 4 security checkpoints inspected.'
                : `${totalCount - completedCount} checkpoint(s) remaining for this round.`}
            </Text>
          </View>
        </View>

        {/* Big Scan Checkpoint Button */}
        <TouchableOpacity
          style={[styles.scanTriggerButton, !isClockedIn && styles.scanTriggerDisabled]}
          onPress={() => handleOpenScanner()}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={26}
            color={isClockedIn ? '#ffffff' : '#94a3b8'}
          />
          <View>
            <Text
              style={[
                styles.scanTriggerTitle,
                !isClockedIn && styles.scanTriggerTitleDisabled,
              ]}
            >
              SCAN CHECKPOINT
            </Text>
            <Text
              style={[
                styles.scanTriggerSubtitle,
                !isClockedIn && styles.scanTriggerSubtitleDisabled,
              ]}
            >
              {isClockedIn ? 'Open camera to read QR tag' : 'Clock in to activate camera'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Checkpoint Cards List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>ASSIGNED CHECKPOINTS</Text>

          {checkpoints.map((cp) => (
            <CheckpointCard
              key={cp.id}
              checkpoint={cp}
              onScanPress={handleOpenScanner}
              isClockedIn={isClockedIn}
            />
          ))}
        </View>

        {/* Demo Helper & Reset */}
        <View style={styles.footerOptions}>
          <View style={styles.qrHelperCard}>
            <Ionicons name="information-circle-outline" size={18} color="#0284c7" />
            <Text style={styles.qrHelperText}>
              Scan QR codes containing CP-001 to CP-004. You can open{' '}
              <Text style={{ fontWeight: '700' }}>qr-test-codes.html</Text> in any browser to display
              and scan test codes right off your screen!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              Alert.alert(
                'Reset Patrol Progress?',
                'This will reset all checkpoints back to DUE state.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      resetDemo();
                      Alert.alert('Reset', 'Patrol round has been reset.');
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="refresh" size={14} color="#64748b" />
            <Text style={styles.resetButtonText}>Reset Demo Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Camera Scanner Modal */}
      <CameraScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
        isClockedIn={isClockedIn}
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
    paddingBottom: 32,
  },
  lockedNoticeCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  lockedNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  lockedNoticeDescription: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 16,
  },
  lockedNoticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#b45309',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  lockedNoticeButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  progressPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressPillComplete: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  progressPillTextComplete: {
    color: '#047857',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 5,
  },
  progressBarFillComplete: {
    backgroundColor: '#10b981',
  },
  overviewFooter: {
    marginTop: 4,
  },
  overviewFooterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  scanTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  scanTriggerDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanTriggerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  scanTriggerTitleDisabled: {
    color: '#94a3b8',
  },
  scanTriggerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  scanTriggerSubtitleDisabled: {
    color: '#cbd5e1',
  },
  listSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  footerOptions: {
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  qrHelperCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qrHelperText: {
    fontSize: 11,
    color: '#0369a1',
    flex: 1,
    lineHeight: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
});
