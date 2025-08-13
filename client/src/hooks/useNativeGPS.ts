import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function useNativeGPS() {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);

  const startTracking = useCallback(async () => {
    setError(null);
    
    try {
      // Request permissions first
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        setError('Location permission denied');
        return;
      }

      setIsTracking(true);

      // Get current position immediately
      const currentPosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      updatePosition(currentPosition);

      // Start watching position changes
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        },
        (position) => {
          if (position) {
            updatePosition(position);
          }
        }
      );

      setWatchId(id);
    } catch (err) {
      console.error('Failed to start GPS tracking:', err);
      setError(err instanceof Error ? err.message : 'GPS tracking failed');
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  const updatePosition = (pos: Position) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp
    });
  };

  // Fallback to web geolocation if not on native platform
  const startWebTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        });
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        });
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }
    );

    setWatchId(id.toString());
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GPSPosition | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        };
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp
              });
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
    } catch (err) {
      console.error('Failed to get current position:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchId) {
        if (Capacitor.isNativePlatform()) {
          Geolocation.clearWatch({ id: watchId });
        } else {
          navigator.geolocation.clearWatch(parseInt(watchId));
        }
      }
    };
  }, [watchId]);

  const isNative = Capacitor.isNativePlatform();

  return {
    position,
    error,
    isTracking,
    startTracking: isNative ? startTracking : startWebTracking,
    stopTracking,
    getCurrentPosition,
    isNative
  };
}