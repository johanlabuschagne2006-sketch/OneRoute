import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNativeGPS } from '@/hooks/useNativeGPS';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { useCapacitor } from '@/hooks/useCapacitor';
import { 
  MapPin, 
  Navigation, 
  Smartphone, 
  Wifi, 
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function MobileGPS() {
  const { isNative, platform, isIOS, isAndroid } = useCapacitor();
  const { 
    position, 
    error, 
    isTracking, 
    startTracking, 
    stopTracking,
    getCurrentPosition 
  } = useNativeGPS();
  const { sendLocalNotification, requestWebNotificationPermission } = useNativeNotifications();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (position) {
      setLastUpdate(new Date());
    }
  }, [position]);

  const handleTestNotification = async () => {
    if (isNative) {
      await sendLocalNotification(
        'One Route GPS Test',
        'Your location tracking is working perfectly!',
        { type: 'gps_test' }
      );
    } else {
      await requestWebNotificationPermission();
      await sendLocalNotification(
        'One Route GPS Test',
        'Your location tracking is working perfectly!'
      );
    }
  };

  const handleGetCurrentLocation = async () => {
    const pos = await getCurrentPosition();
    if (pos) {
      await sendLocalNotification(
        'Location Updated',
        `Lat: ${pos.latitude.toFixed(6)}, Lng: ${pos.longitude.toFixed(6)}`
      );
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-sky-600" />
            Mobile GPS Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Platform:</span>
              <Badge variant={isNative ? "default" : "secondary"}>
                {platform.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode:</span>
              <Badge variant={isNative ? "default" : "outline"}>
                {isNative ? 'Native' : 'Web'}
              </Badge>
            </div>
          </div>

          {isNative && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Running in native {isIOS ? 'iOS' : isAndroid ? 'Android' : 'mobile'} app
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-600" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">GPS Tracking:</span>
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {position && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Latitude:</span>
                  <div className="text-sky-600">{position.latitude.toFixed(6)}</div>
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>
                  <div className="text-sky-600">{position.longitude.toFixed(6)}</div>
                </div>
                <div>
                  <span className="font-medium">Accuracy:</span>
                  <div className="text-green-600">{position.accuracy.toFixed(0)}m</div>
                </div>
                <div>
                  <span className="font-medium">Last Update:</span>
                  <div className="text-gray-600">
                    {lastUpdate?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "destructive" : "default"}
              className="flex-1"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
            <Button 
              onClick={handleGetCurrentLocation}
              variant="outline"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-600" />
            Mobile Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleTestNotification}
            className="w-full"
            variant="outline"
          >
            <Bell className="w-4 h-4 mr-2" />
            Test Mobile Notification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mobile Features Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Native GPS</span>
              <CheckCircle className={`w-4 h-4 ${isNative ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Push Notifications</span>
              <CheckCircle className={`w-4 h-4 ${isNative ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Background Location</span>
              <CheckCircle className={`w-4 h-4 ${isNative ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Camera Access</span>
              <CheckCircle className={`w-4 h-4 ${isNative ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">File System</span>
              <CheckCircle className={`w-4 h-4 ${isNative ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}