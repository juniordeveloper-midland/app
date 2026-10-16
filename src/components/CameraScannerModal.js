import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MOCK_CHECKPOINTS } from '../data/mockData';

export default function CameraScannerModal({
  visible,
  onClose,
  onBarcodeScanned,
  isClockedIn,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanningLocked, setIsScanningLocked] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleBarCodeRead = ({ data }) => {
    if (isScanningLocked) return;
    setIsScanningLocked(true);

    const result = onBarcodeScanned(data);

    if (result && result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setIsScanningLocked(false);
        setStatusMessage(null);
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: result?.message || `Invalid QR code: ${data}`,
      });
      setTimeout(() => {
        setIsScanningLocked(false);
        setStatusMessage(null);
      }, 2500);
    }
  };

  const simulateScan = (code) => {
    handleBarCodeRead({ data: code });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>CHECKPOINT SCANNER</Text>

          <TouchableOpacity
            style={[styles.circleButton, torchEnabled && styles.torchActive]}
            onPress={() => setTorchEnabled((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={22}
              color={torchEnabled ? '#facc15' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        {/* Camera Permission Handling */}
        {!permission ? (
          <View style={styles.permissionContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.permissionText}>Loading camera module...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="camera-off" size={48} color="#ef4444" />
            <Text style={styles.permissionHeading}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>
              Camera permission is required to scan security patrol QR codes on site.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Live Camera View */
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isScanningLocked ? undefined : handleBarCodeRead}
            />

            {/* Viewfinder Target Overlay */}
            <View style={styles.overlayContainer}>
              <View style={styles.overlayTop}>
                <Text style={styles.instructionText}>
                  Align checkpoint QR code within the frame
                </Text>
              </View>

              <View style={styles.viewfinderCenter}>
                <View style={styles.viewfinderTarget}>
                  {/* Four Corner Marks */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {isScanningLocked && (
                    <View style={styles.scanningIndicatorOverlay}>
                      <ActivityIndicator size="large" color="#10b981" />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.overlayBottom}>
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

        {/* Demo Simulator Bar: Allows 1-tap testing without physical printouts */}
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
                disabled={isScanningLocked}
              >
                <Text style={styles.simButtonText}>{cp.id}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.simButton, styles.simButtonInvalid]}
              onPress={() => simulateScan('INVALID-CODE-999')}
              disabled={isScanningLocked}
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
    position: 'relative',
    overflow: 'hidden',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  overlayTop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 80,
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
  },
  permissionButton: {
    marginTop: 10,
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
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
