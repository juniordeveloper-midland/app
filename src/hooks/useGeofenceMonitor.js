import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useGuardStore } from '../store/useGuardStore';

/**
 * useGeofenceMonitor
 * 
 * Watches guard GPS position every 10 seconds with balanced accuracy
 * while clocked in and Demo Mode is disabled.
 * Automatically stops watching when guard clocks out or Demo Mode is toggled on.
 */
export function useGeofenceMonitor() {
  const isClockedIn = useGuardStore((state) => state.isClockedIn);
  const demoMode = useGuardStore((state) => state.demoMode);
  const isLoaded = useGuardStore((state) => state.isLoaded);
  const processGeofenceLocation = useGuardStore((state) => state.processGeofenceLocation);
  const setGpsError = useGuardStore((state) => state.setGpsError);
  const setIsWatchingLocation = useGuardStore((state) => state.setIsWatchingLocation);

  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    // Respect Demo Mode: if ON, skip the monitoring
    // Only monitor if clocked in AND demoMode is OFF
    const shouldWatch = Boolean(isClockedIn && !demoMode);

    if (!shouldWatch) {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
        setIsWatchingLocation(false);
      }
      return;
    }

    let isMounted = true;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setGpsError('Location permission denied. Cannot monitor geofence perimeter.');
            setIsWatchingLocation(false);
          }
          return;
        }

        // Clean up any existing subscription before starting a new one
        if (subscriptionRef.current) {
          subscriptionRef.current.remove();
          subscriptionRef.current = null;
        }

        // Check initial position immediately so there is no 10-second delay upon clocking in
        try {
          const initialPos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted && initialPos && initialPos.coords) {
            processGeofenceLocation(initialPos.coords);
          }
        } catch (initialErr) {
          console.warn('Initial position check failed:', initialErr);
        }

        if (!isMounted) return;

        // Start watching position every 10 seconds with balanced accuracy
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // every 10 seconds
            distanceInterval: 0,
          },
          (location) => {
            if (isMounted && location && location.coords) {
              processGeofenceLocation(location.coords);
            }
          }
        );

        if (isMounted) {
          subscriptionRef.current = subscription;
          setIsWatchingLocation(true);
        } else {
          subscription.remove();
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Location.watchPositionAsync error:', err);
          setGpsError(`GPS watch error: ${err.message}`);
          setIsWatchingLocation(false);
        }
      }
    }

    startWatching();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
        setIsWatchingLocation(false);
      }
    };
  }, [isClockedIn, demoMode, isLoaded, processGeofenceLocation, setGpsError, setIsWatchingLocation]);
}
