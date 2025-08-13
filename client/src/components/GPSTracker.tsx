import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MapPin, Navigation, AlertTriangle, Users } from 'lucide-react';

interface GPSTrackerProps {
  rideId: string;
  isDriver?: boolean;
  onLocationUpdate?: (location: any) => void;
}

export function GPSTracker({ rideId, isDriver = false, onLocationUpdate }: GPSTrackerProps) {
  const { messages, isConnected, joinRide } = useWebSocket();
  const { currentLocation, isTracking, error, startTracking, stopTracking } = useGPSTracking({ rideId });
  const [otherUsersLocations, setOtherUsersLocations] = useState<Map<string, any>>(new Map());

  // Join ride room on mount
  useEffect(() => {
    if (isConnected) {
      joinRide(rideId);
    }
  }, [isConnected, rideId, joinRide]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    const locationUpdates = messages.filter(msg => msg.type === 'location_update');
    
    locationUpdates.forEach(update => {
      if (update.userId !== currentLocation?.timestamp) { // Not from current user
        setOtherUsersLocations(prev => {
          const newMap = new Map(prev);
          newMap.set(update.userId, {
            location: update.location,
            timestamp: update.timestamp,
            userId: update.userId
          });
          return newMap;
        });
      }
    });
  }, [messages]);

  // Notify parent component of location updates
  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate(currentLocation);
    }
  }, [currentLocation, onLocationUpdate]);

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return 'Unknown';
    return accuracy < 100 ? 'High' : accuracy < 500 ? 'Medium' : 'Low';
  };

  const formatDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-sky-600" />
          Live GPS Tracking
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant={isTracking ? "default" : "outline"}>
              {isTracking ? "Tracking" : "Stopped"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Current Location */}
        {currentLocation && (
          <div className="p-3 bg-sky-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span className="font-medium">Your Location</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
              <p>Lng: {currentLocation.longitude.toFixed(6)}</p>
              <p>Accuracy: {formatAccuracy(currentLocation.accuracy)}</p>
              <p>Updated: {new Date(currentLocation.timestamp || '').toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Other Users Locations */}
        {otherUsersLocations.size > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="font-medium">Other {isDriver ? 'Passengers' : 'Driver'}</span>
            </div>
            {Array.from(otherUsersLocations.values()).map((userLocation) => (
              <div key={userLocation.userId} className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>User ID: {userLocation.userId.slice(0, 8)}...</p>
                  <p>Lat: {userLocation.location.latitude.toFixed(6)}</p>
                  <p>Lng: {userLocation.location.longitude.toFixed(6)}</p>
                  {currentLocation && (
                    <p>Distance: {formatDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      userLocation.location.latitude,
                      userLocation.location.longitude
                    )}</p>
                  )}
                  <p>Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button 
              onClick={startTracking}
              className="bg-sky-600 hover:bg-sky-700"
              disabled={!isConnected}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button 
              onClick={stopTracking}
              variant="outline"
            >
              Stop Tracking
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <p>• Location updates are shared in real-time with ride participants</p>
          <p>• GPS accuracy depends on your device and signal strength</p>
          <p>• Tracking will continue in the background during your ride</p>
        </div>
      </CardContent>
    </Card>
  );
}