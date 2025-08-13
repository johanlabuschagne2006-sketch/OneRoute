import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Navigation, Clock, AlertCircle, Loader2 } from "lucide-react";

interface GPSTrackerProps {
  rideId: string;
  isDriver: boolean;
}

export default function GPSTracker({ rideId, isDriver }: GPSTrackerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const { toast } = useToast();

  const startTracking = () => {
    if (!navigator.geolocation) {
      setTrackingError("GPS tracking is not supported on this device");
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    // Watch position with high accuracy
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(newLocation);
        setLastUpdate(new Date());

        // Update location in database if user is driver
        if (isDriver) {
          try {
            await apiRequest("PUT", `/api/rides/${rideId}/location`, {
              location: newLocation,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Failed to update ride location:", error);
          }
        }
      },
      (error) => {
        setTrackingError(error.message);
        setIsTracking(false);
        toast({
          title: "GPS Error",
          description: error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Cache location for 30 seconds
      }
    );

    // Store watch ID to clear it later
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const stopTracking = () => {
    setIsTracking(false);
    toast({
      title: "GPS Tracking Stopped",
      description: "Location tracking has been disabled.",
    });
  };

  const openInMaps = () => {
    if (!location) return;
    
    const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    window.open(url, "_blank");
  };

  const shareLocation = async () => {
    if (!location) return;

    try {
      await apiRequest("POST", `/api/chat/${rideId}/messages`, {
        message: `📍 Current Location: https://maps.google.com/?q=${location.lat},${location.lng}`,
        messageType: "location",
      });

      toast({
        title: "Location Shared",
        description: "Your current location has been shared with ride participants.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Share Location",
        description: error.message || "Could not share location.",
        variant: "destructive",
      });
    }
  };

  // Auto-start tracking for drivers
  useEffect(() => {
    if (isDriver) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [isDriver, rideId]);

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 minute ago";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-sky-600" />
            GPS Tracking
          </div>
          <div className="flex items-center space-x-2">
            {isTracking && (
              <Badge className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            )}
            {trackingError && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Location Display */}
        {location ? (
          <div className="bg-sky-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-sky-600 mr-2" />
                <span className="font-medium">Current Location</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInMaps}
                className="text-sky-600 hover:text-sky-700"
              >
                View on Map
              </Button>
            </div>
            <p className="text-sm text-gray-600 font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
            {lastUpdate && (
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Updated {formatLastUpdate(lastUpdate)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No location data available</p>
          </div>
        )}

        {/* Error Display */}
        {trackingError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{trackingError}</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-1 gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="bg-sky-500 hover:bg-sky-600"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Start GPS Tracking
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Stop Tracking
            </Button>
          )}

          {location && (
            <Button
              onClick={shareLocation}
              variant="outline"
              className="border-sky-200 text-sky-600 hover:bg-sky-50"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Share Location
            </Button>
          )}
        </div>

        {/* Driver-specific features */}
        {isDriver && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Navigation className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Driver Mode</span>
            </div>
            <p className="text-sm text-blue-700">
              Your location is automatically shared with passengers for their safety and convenience.
            </p>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p>
            🔒 Your location data is only shared with ride participants and is not stored permanently.
            You can stop tracking at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}