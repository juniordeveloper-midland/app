import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MOCK_CHECKPOINTS } from '../data/mockData';

export default function CameraScannerModal({
  visible,
  onClose,
  onBarcodeScanned,
  isClockedIn,
}) {
  const isScreenFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanningDisabled, setIsScanningDisabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const scanLockTimeoutRef = useRef(null);

  // Reset states when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setIsScanningDisabled(false);
      setStatusMessage(null);
      setCameraError(null);
      setTorchEnabled(false);
      if (scanLockTimeoutRef.current) {
        clearTimeout(scanLockTimeoutRef.current);
        scanLockTimeoutRef.current = null;
      }
    }
  }, [visible]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (scanLockTimeoutRef.current) {
        clearTimeout(scanLockTimeoutRef.current);
      }
    };
  }, []);

  // Handle scanned QR barcode data
  const handleBarcodeScannedInternal = (scanningResult) => {
    if (isScanningDisabled) return;

    // Disable scanner immediately for 2 seconds to avoid duplicate scans
    setIsScanningDisabled(true);

    const rawData = (scanningResult?.data || '').trim();
    const result = onBarcodeScanned ? onBarcodeScanned(rawData) : null;

    if (result && result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      // On success, show confirmation briefly and close modal
      scanLockTimeoutRef.current = setTimeout(() => {
        setIsScanningDisabled(false);
        setStatusMessage(null);
        onClose();
      }, 1400);
    } else {
      const errorText =
        result?.message ||
        `Invalid QR code: "${rawData}". Checkpoints must match CP-001 through CP-004.`;
      setStatusMessage({
        type: 'error',
        text: errorText,
      });

      // Keep scanner disabled for 2 seconds, then re-enable
      scanLockTimeoutRef.current = setTimeout(() => {
        setIsScanningDisabled(false);
        setStatusMessage(null);
      }, 2000);
    }
  };

  // Helper for 1-tap testing without physical camera / printouts
  const simulateScan = (code) => {
    handleBarcodeScannedInternal({ data: code });
  };

  if (!visible) return null;

  // Determine if CameraView can be safely mounted
  const canMountCamera = Boolean(
    isScreenFocused &&
    visible &&
    permission &&
    permission.granted &&
    !cameraError
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>CHECKPOINT SCANNER</Text>

          <TouchableOpacity
            style={[styles.circleButton, torchEnabled && styles.torchActive]}
            onPress={() => setTorchEnabled((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            disabled={!canMountCamera}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={22}
              color={torchEnabled ? '#facc15' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        {/* Camera Permission State: Loading */}
        {!permission ? (
          <View style={styles.permissionContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.permissionText}>Loading camera module...</Text>
          </View>
        ) : !permission.granted ? (
          /* Camera Permission State: Not Granted */
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="camera-off" size={54} color="#ef4444" />
            <Text style={styles.permissionHeading}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>
              Camera permission is required to scan security patrol QR codes on site.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={18} color="#ffffff" />
              <Text style={styles.permissionButtonText}>Grant permission</Text>
            </TouchableOpacity>
          </View>
        ) : cameraError ? (
          /* Camera Runtime / Mount Error State */
          <View style={styles.permissionContainer}>
            <Ionicons name="alert-circle-outline" size={54} color="#ef4444" />
            <Text style={styles.permissionHeading}>Camera Error</Text>
            <Text style={styles.permissionSub}>{cameraError}</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => setCameraError(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#ffffff" />
              <Text style={styles.permissionButtonText}>Retry Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Live Camera Viewport Container (Parent View has flex: 1 with full dimensions) */
          <View style={styles.cameraWrapper}>
            {canMountCamera && (
              <CameraView
                style={[StyleSheet.absoluteFill, styles.cameraView]}
                facing="back"
                enableTorch={torchEnabled}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={isScanningDisabled ? undefined : handleBarcodeScannedInternal}
                onMountError={(error) => {
                  setCameraError(
                    error?.message ||
                      'Camera could not be started. Please check device permissions.'
                  );
                }}
              />
            )}

            {/* Viewfinder Target & Instructions Overlay */}
            <View style={styles.overlayContainer} pointerEvents="box-none">
              <View style={styles.overlayTop}>
                <Text style={styles.instructionText}>
                  Align checkpoint QR code within the frame
                </Text>
                {isScanningDisabled && (
                  <Text style={styles.cooldownText}>Scanner paused (2s debounce)</Text>
                )}
              </View>

              <View style={styles.viewfinderCenter} pointerEvents="box-none">
                <View style={styles.viewfinderTarget} pointerEvents="box-none">
                  {/* Four Corner Alignment Brackets */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {isScanningDisabled && (
                    <View style={styles.scanningIndicatorOverlay}>
                      <ActivityIndicator size="large" color="#10b981" />
                    </View>
                  )}
                </View>
              </View>

              {/* Bottom Feedback Banner Area */}
              <View style={styles.overlayBottom} pointerEvents="box-none">
                {statusMessage ? (
                  <View
                    style={[
                      styles.feedbackBanner,
                      statusMessage.type === 'success'
                        ? styles.feedbackSuccess
                        : styles.feedbackError,
                    ]}
                  >
                    <Ionicons
                      name={
                        statusMessage.type === 'success'
                          ? 'checkmark-circle'
                          : 'alert-circle'
                      }
                      size={20}
                      color="#ffffff"
                    />
                    <Text style={styles.feedbackText}>{statusMessage.text}</Text>
                  </View>
                ) : (
                  <Text style={styles.supportedText}>
                    Supports checkpoints CP-001 through CP-004
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Demo Simulator Bar: Instant testing without physical QR printouts */}
        <View style={styles.simulatorBar}>
          <View style={styles.simHeader}>
            <MaterialCommunityIcons name="test-tube" size={16} color="#38bdf8" />
            <Text style={styles.simHeaderText}>QUICK DEMO SIMULATOR</Text>
            <Text style={styles.simSubText}>(Tap to test scan)</Text>
          </View>
          <View style={styles.simButtonsRow}>
            {MOCK_CHECKPOINTS.map((cp) => (
              <TouchableOpacity
                key={cp.id}
                style={styles.simButton}
                onPress={() => simulateScan(cp.id)}
                disabled={isScanningDisabled}
                activeOpacity={0.7}
              >
                <Text style={styles.simButtonText}>{cp.id}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.simButton, styles.simButtonInvalid]}
              onPress={() => simulateScan('INVALID-CODE-999')}
              disabled={isScanningDisabled}
              activeOpacity={0.7}
            >
              <Text style={styles.simButtonTextInvalid}>Bad QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    zIndex: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchActive: {
    backgroundColor: '#854d0e',
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  overlayTop: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cooldownText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  viewfinderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderTarget: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38bdf8',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanningIndicatorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBottom: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 74,
    justifyContent: 'center',
  },
  supportedText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
  },
  feedbackSuccess: {
    backgroundColor: '#059669',
  },
  feedbackError: {
    backgroundColor: '#dc2626',
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  permissionHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionSub: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  permissionButton: {
    marginTop: 10,
    backgroundColor: '#0284c7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  permissionText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  simulatorBar: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  simHeaderText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simSubText: {
    color: '#64748b',
    fontSize: 11,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  simButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simButtonInvalid: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  simButtonText: {
    color: '#e0f2fe',
    fontSize: 11,
    fontWeight: '700',
  },
  simButtonTextInvalid: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
});
