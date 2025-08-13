import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GPSTracker } from '@/components/GPSTracker';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Navigation, Users, MapPin, Wifi, WifiOff } from 'lucide-react';

export default function GPSDemo() {
  const { isConnected } = useWebSocket();
  const [demoRideId] = useState('demo-ride-123');
  const [isDriver, setIsDriver] = useState(true);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-6 h-6 text-sky-600" />
            Real-Time GPS Tracking Demo
            <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Live Location Sharing</span>
                </div>
                <p className="text-sm text-gray-600">
                  Real-time GPS coordinates shared between all ride participants
                </p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Multi-User Tracking</span>
                </div>
                <p className="text-sm text-gray-600">
                  See locations of all drivers and passengers in the ride
                </p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-sky-600" />
                  <span className="font-medium">Distance Calculation</span>
                </div>
                <p className="text-sm text-gray-600">
                  Automatic distance calculation between users
                </p>
              </Card>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-medium">Demo as:</span>
              <Button
                variant={isDriver ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDriver(true)}
              >
                Driver
              </Button>
              <Button
                variant={!isDriver ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDriver(false)}
              >
                Passenger
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <GPSTracker 
        rideId={demoRideId}
        isDriver={isDriver}
        onLocationUpdate={(location) => {
          console.log(`${isDriver ? 'Driver' : 'Passenger'} location:`, location);
        }}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
              <div>
                <strong>WebSocket Real-Time Communication:</strong> Instant location updates shared across all users
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <div>
                <strong>GPS Location Tracking:</strong> High-accuracy location detection with configurable update intervals
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
              <div>
                <strong>Live Distance Calculation:</strong> Real-time distance between ride participants
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-sky-500 rounded-full mt-2"></span>
              <div>
                <strong>Connection Status Monitoring:</strong> Visual indicators for WebSocket and GPS status
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
              <div>
                <strong>Multi-User Support:</strong> Track multiple drivers and passengers simultaneously
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}