import { create } from 'zustand';
import { Alert, Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_CHECKPOINTS, MOCK_SITE } from '../data/mockData';
import { calculateDistanceInMeters } from '../utils/haversine';

const STORAGE_KEY = '@region_guard_state_v2';

const initialCheckpoints = MOCK_CHECKPOINTS.map((cp) => ({
  ...cp,
  status: 'DUE',
  scannedAt: null,
}));

export const useGuardStore = create((set, get) => ({
  // Core shift state
  isClockedIn: false,
  clockInTime: null,
  clockOutTime: null,
  elapsedShiftSeconds: 0,
  
  // Demo Mode: default to true so anyone testing the app can clock-in immediately without geofence failure
  demoMode: true,

  // GPS state
  lastLocation: null,
  gpsError: null,
  isWatchingLocation: false,

  // Geofence monitoring state
  hasAlertedOutside: false,
  geofenceBanner: null, // { type: 'danger' | 'success', message: string, distance: number, timestamp: string }
  geofenceEvents: [],   // Array of { id, type: 'EXIT' | 'RETURN', timestamp, distance, message }

  // Patrol checkpoints state
  checkpoints: initialCheckpoints,

  // UI / Modal state
  isSosModalVisible: false,
  isScannerVisible: false,
  isLoaded: false,

  // Save current state to AsyncStorage
  saveToStorage: async () => {
    try {
      const state = get();
      const payload = {
        isClockedIn: state.isClockedIn,
        clockInTime: state.clockInTime,
        clockOutTime: state.clockOutTime,
        elapsedShiftSeconds: state.elapsedShiftSeconds,
        demoMode: state.demoMode,
        lastLocation: state.lastLocation,
        checkpoints: state.checkpoints,
        geofenceEvents: state.geofenceEvents || [],
        geofenceBanner: state.geofenceBanner || null,
        hasAlertedOutside: state.hasAlertedOutside || false,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to save guard state to AsyncStorage:', err);
    }
  },

  // Load state on app start
  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          isClockedIn: Boolean(parsed.isClockedIn),
          clockInTime: parsed.clockInTime || null,
          clockOutTime: parsed.clockOutTime || null,
          elapsedShiftSeconds: parsed.elapsedShiftSeconds || 0,
          demoMode: parsed.demoMode !== undefined ? parsed.demoMode : true,
          lastLocation: parsed.lastLocation || null,
          checkpoints: parsed.checkpoints && parsed.checkpoints.length > 0 ? parsed.checkpoints : initialCheckpoints,
          geofenceEvents: parsed.geofenceEvents || [],
          geofenceBanner: parsed.geofenceBanner || null,
          hasAlertedOutside: Boolean(parsed.hasAlertedOutside),
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (err) {
      console.warn('Failed to load guard state from AsyncStorage:', err);
      set({ isLoaded: true });
    }
  },

  // Set Demo Mode toggle
  setDemoMode: (enabled) => {
    set({
      demoMode: enabled,
      // If turning Demo Mode ON, dismiss any active geofence breach banner
      geofenceBanner: enabled ? null : get().geofenceBanner,
    });
    get().saveToStorage();
  },

  // State setters
  setIsWatchingLocation: (watching) => set({ isWatchingLocation: watching }),
  dismissGeofenceBanner: () => set({ geofenceBanner: null }),
  setGpsError: (errorMsg) => set({ gpsError: errorMsg }),

  // Update GPS location record (used for single manual readings)
  updateLocation: (coords) => {
    if (!coords) return;
    const distance = calculateDistanceInMeters(
      coords.latitude,
      coords.longitude,
      MOCK_SITE.lat,
      MOCK_SITE.lng
    );
    const insideZone = distance <= MOCK_SITE.radius;
    
    const locationData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Math.round(coords.accuracy || 0),
      distance,
      insideZone,
      timestamp: new Date().toISOString(),
    };

    set({ lastLocation: locationData, gpsError: null });
    get().saveToStorage();

    // If clocked in and Demo Mode is OFF, also evaluate geofence transitions
    if (get().isClockedIn && !get().demoMode) {
      get().processGeofenceLocation(coords);
    }

    return locationData;
  },

  // Core Geofence Location Processing (called by watchPositionAsync every 10s)
  processGeofenceLocation: (coords) => {
    if (!coords) return;
    const { demoMode, isClockedIn, hasAlertedOutside, lastLocation } = get();

    // Respect Demo Mode: if ON, skip the monitoring
    if (demoMode || !isClockedIn) {
      return;
    }

    const distance = calculateDistanceInMeters(
      coords.latitude,
      coords.longitude,
      MOCK_SITE.lat,
      MOCK_SITE.lng
    );
    const insideZone = distance <= MOCK_SITE.radius;
    const now = new Date().toISOString();

    const locationData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Math.round(coords.accuracy || 0),
      distance,
      insideZone,
      timestamp: now,
    };

    if (!insideZone) {
      // Guard is OUTSIDE the site radius
      const bannerMsg = `You have left the site zone (${Math.round(distance)} metres away)`;

      // Trigger vibration + in-app alert once (do not spam repeated alerts)
      if (!hasAlertedOutside) {
        try {
          if (Platform.OS === 'android') {
            Vibration.vibrate([0, 500, 200, 500]);
          } else {
            Vibration.vibrate(500);
          }
        } catch (vErr) {
          console.warn('Vibration failed:', vErr);
        }

        Alert.alert(
          '⚠️ Perimeter Breach Warning',
          `You have left the site zone (${Math.round(distance)} metres away).\n\nAllowed radius: ${MOCK_SITE.radius}m. Please return to your post immediately.`,
          [{ text: 'Acknowledge', style: 'default' }]
        );

        // Log exit event with time in local state and AsyncStorage
        const exitEvent = {
          id: `exit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'EXIT',
          timestamp: now,
          distance: Math.round(distance),
          message: bannerMsg,
        };

        const updatedEvents = [exitEvent, ...(get().geofenceEvents || [])].slice(0, 50);

        set({
          lastLocation: locationData,
          gpsError: null,
          hasAlertedOutside: true,
          geofenceBanner: {
            type: 'danger',
            message: bannerMsg,
            distance: Math.round(distance),
            timestamp: now,
          },
          geofenceEvents: updatedEvents,
        });
        get().saveToStorage();
        return locationData;
      } else {
        // Already alerted once for this breach, update location and distance in banner without re-alerting
        set({
          lastLocation: locationData,
          gpsError: null,
          geofenceBanner: {
            type: 'danger',
            message: bannerMsg,
            distance: Math.round(distance),
            timestamp: now,
          },
        });
        get().saveToStorage();
        return locationData;
      }
    } else {
      // Guard is INSIDE the site radius
      const wasOutside = hasAlertedOutside || (lastLocation && !lastLocation.insideZone);

      if (wasOutside) {
        // Guard returns inside the radius:
        // Show green banner "Back inside site zone" and reset the alert flag.
        const returnMsg = 'Back inside site zone';

        const returnEvent = {
          id: `return-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'RETURN',
          timestamp: now,
          distance: Math.round(distance),
          message: returnMsg,
        };

        const updatedEvents = [returnEvent, ...(get().geofenceEvents || [])].slice(0, 50);

        set({
          lastLocation: locationData,
          gpsError: null,
          hasAlertedOutside: false, // Reset alert flag so next exit triggers alert again
          geofenceBanner: {
            type: 'success',
            message: returnMsg,
            distance: Math.round(distance),
            timestamp: now,
          },
          geofenceEvents: updatedEvents,
        });
        get().saveToStorage();
        return locationData;
      } else {
        // Normal update inside zone
        set({
          lastLocation: locationData,
          gpsError: null,
        });
        get().saveToStorage();
        return locationData;
      }
    }
  },

  // Simulation helpers for testing / emulator review
  simulateGeofenceBreach: () => {
    // If Demo Mode is on, turn it off so monitoring can activate
    if (get().demoMode) {
      set({ demoMode: false });
    }
    // If not clocked in, auto clock-in for the test
    if (!get().isClockedIn) {
      get().clockIn();
    }
    // ~167 meters away from MOCK_SITE (outside the 100m radius)
    const breachCoords = {
      latitude: MOCK_SITE.lat + 0.0015,
      longitude: MOCK_SITE.lng,
      accuracy: 8,
    };
    return get().processGeofenceLocation(breachCoords);
  },

  simulateGeofenceReturn: () => {
    // Return inside radius (0 meters away from MOCK_SITE center)
    const returnCoords = {
      latitude: MOCK_SITE.lat,
      longitude: MOCK_SITE.lng,
      accuracy: 5,
    };
    return get().processGeofenceLocation(returnCoords);
  },

  // Clock In Action
  clockIn: (locationData) => {
    const now = new Date().toISOString();
    set({
      isClockedIn: true,
      clockInTime: now,
      clockOutTime: null,
      elapsedShiftSeconds: 0,
      lastLocation: locationData || get().lastLocation,
      gpsError: null,
      hasAlertedOutside: false,
      geofenceBanner: null,
    });
    get().saveToStorage();
  },

  // Clock Out Action
  clockOut: () => {
    const now = new Date().toISOString();
    set({
      isClockedIn: false,
      clockOutTime: now,
      isWatchingLocation: false,
      hasAlertedOutside: false,
      geofenceBanner: null,
    });
    get().saveToStorage();
  },

  // Tick timer
  incrementTimer: () => {
    const { isClockedIn, clockInTime } = get();
    if (!isClockedIn || !clockInTime) return;
    
    const startTime = new Date(clockInTime).getTime();
    const now = Date.now();
    const seconds = Math.max(0, Math.floor((now - startTime) / 1000));
    set({ elapsedShiftSeconds: seconds });
  },

  // Scan checkpoint QR
  scanCheckpoint: (code) => {
    const trimmedCode = (code || '').trim().toUpperCase();
    const { checkpoints, isClockedIn } = get();

    if (!isClockedIn) {
      return {
        success: false,
        reason: 'NOT_CLOCKED_IN',
        message: 'Patrol only allowed while clocked in.',
      };
    }

    const checkpoint = checkpoints.find((cp) => cp.id.toUpperCase() === trimmedCode);
    if (!checkpoint) {
      return {
        success: false,
        reason: 'INVALID_CODE',
        message: `Invalid QR code: "${code}". Checkpoints must match CP-001 through CP-004.`,
      };
    }

    if (checkpoint.status === 'DONE') {
      return {
        success: false,
        reason: 'ALREADY_SCANNED',
        message: `Checkpoint ${checkpoint.id} (${checkpoint.name}) was already scanned.`,
        checkpoint,
      };
    }

    // Mark as DONE
    const updated = checkpoints.map((cp) =>
      cp.id.toUpperCase() === trimmedCode
        ? { ...cp, status: 'DONE', scannedAt: new Date().toISOString() }
        : cp
    );

    set({ checkpoints: updated });
    get().saveToStorage();

    const updatedCheckpoint = updated.find((cp) => cp.id.toUpperCase() === trimmedCode);
    const completedCount = updated.filter((cp) => cp.status === 'DONE').length;

    return {
      success: true,
      checkpoint: updatedCheckpoint,
      completedCount,
      totalCount: updated.length,
      allDone: completedCount === updated.length,
      message: `Successfully verified checkpoint: ${checkpoint.id} - ${checkpoint.name}!`,
    };
  },

  // Reset Demo to fresh state
  resetDemo: () => {
    set({
      isClockedIn: false,
      clockInTime: null,
      clockOutTime: null,
      elapsedShiftSeconds: 0,
      checkpoints: initialCheckpoints,
      lastLocation: null,
      gpsError: null,
      isWatchingLocation: false,
      hasAlertedOutside: false,
      geofenceBanner: null,
      geofenceEvents: [],
    });
    get().saveToStorage();
  },

  // Modal controls
  setSosModalVisible: (visible) => set({ isSosModalVisible: visible }),
  setScannerVisible: (visible) => set({ isScannerVisible: visible }),
}));
