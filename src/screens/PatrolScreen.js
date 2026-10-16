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
            <Ionicons name="information-circle-outline" size={18} color="#EB0505" />
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
    backgroundColor: '#333333',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  lockedNoticeCard: {
    backgroundColor: '#2a2416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#854d0e',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  lockedNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#451a03',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fef3c7',
  },
  lockedNoticeDescription: {
    fontSize: 12,
    color: '#fde68a',
    marginTop: 2,
    lineHeight: 16,
  },
  lockedNoticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EB0505',
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
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
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
    color: '#EB0505',
    letterSpacing: 0.8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 1,
  },
  progressPill: {
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4d4d4d',
  },
  progressPillComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d1d5db',
  },
  progressPillTextComplete: {
    color: '#34d399',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#3a3a3a',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EB0505',
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
    color: '#9ca3af',
    fontWeight: '500',
  },
  scanTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#EB0505',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#EB0505',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  scanTriggerDisabled: {
    backgroundColor: '#404040',
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
    color: '#9ca3af',
  },
  scanTriggerSubtitle: {
    color: '#fecaca',
    fontSize: 11,
    fontWeight: '500',
  },
  scanTriggerSubtitleDisabled: {
    color: '#6b7280',
  },
  listSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
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
    backgroundColor: 'rgba(235, 5, 5, 0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 5, 5, 0.35)',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qrHelperText: {
    fontSize: 11,
    color: '#fca5a5',
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
    color: '#9ca3af',
    fontWeight: '600',
  },
});
