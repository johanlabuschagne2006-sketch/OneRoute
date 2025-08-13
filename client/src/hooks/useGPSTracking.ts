import { useState, useEffect, useRef } from 'react';
import { useWebSocket, LocationData } from './useWebSocket';

export interface GPSTrackingOptions {
  rideId: string;
  enableHighAccuracy?: boolean;
  updateInterval?: number; // milliseconds
  maxAge?: number; // milliseconds
  timeout?: number; // milliseconds
}

export function useGPSTracking(options: GPSTrackingOptions) {
  const { sendLocationUpdate } = useWebSocket();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    rideId,
    enableHighAccuracy = true,
    updateInterval = 5000, // 5 seconds
    maxAge = 10000, // 10 seconds
    timeout = 15000 // 15 seconds
  } = options;

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    const watchOptions: PositionOptions = {
      enableHighAccuracy,
      maximumAge: maxAge,
      timeout
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        setCurrentLocation(location);
        sendLocationUpdate(rideId, location);
      },
      (error) => {
        setError(`GPS Error: ${error.message}`);
        setIsTracking(false);
      },
      watchOptions
    );

    // Start continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        setCurrentLocation(location);
        
        // Send location updates at specified intervals
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            sendLocationUpdate(rideId, location);
          }, updateInterval);
        }
      },
      (error) => {
        setError(`GPS Error: ${error.message}`);
        stopTracking();
      },
      watchOptions
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsTracking(false);
  };

  const getCurrentPosition = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          resolve(location);
        },
        (error) => reject(new Error(`GPS Error: ${error.message}`)),
        {
          enableHighAccuracy,
          maximumAge: maxAge,
          timeout
        }
      );
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentPosition
  };
}