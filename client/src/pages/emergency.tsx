import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock,
  Shield,
  Navigation,
  MessageSquare,
  Siren
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EmergencyAlert {
  id: string;
  userId: string;
  rideId?: string;
  alertType: string;
  location: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function Emergency() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch emergency alerts for the user
  const { data: alerts = [] } = useQuery<EmergencyAlert[]>({
    queryKey: ["/api/emergency/alerts"],
    enabled: !!user,
  });

  // Emergency alert mutation
  const createAlertMutation = useMutation({
    mutationFn: (alertData: any) => apiRequest("POST", "/api/emergency/alert", alertData),
    onSuccess: () => {
      setIsEmergencyActive(true);
      setEmergencyMessage("");
      toast({
        title: "Emergency Alert Sent",
        description: "Emergency services and your emergency contacts have been notified",
      });
      
      // Auto-disable emergency mode after 30 minutes
      setTimeout(() => setIsEmergencyActive(false), 30 * 60 * 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send emergency alert. Please try again or call 911 directly.",
        variant: "destructive",
      });
    },
  });

  const handleEmergencyAlert = (alertType: string) => {
    const alertData = {
      alertType,
      location: location ? JSON.stringify(location) : "Location unavailable",
      message: emergencyMessage || `${alertType} alert triggered`,
    };

    createAlertMutation.mutate(alertData);
  };

  const handleCallEmergency = () => {
    window.location.href = "tel:911";
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-600 flex items-center space-x-2">
          <Siren className="w-8 h-8" />
          <span>Emergency Center</span>
        </h1>
        <p className="text-muted-foreground">
          Quick access to emergency features and safety alerts
        </p>
      </div>

      {/* Emergency Status */}
      {isEmergencyActive && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Emergency Mode Active:</strong> Your emergency contacts and authorities have been notified. 
            Help is on the way. This alert will automatically deactivate in 30 minutes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Actions */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Actions</span>
            </CardTitle>
            <CardDescription>
              Immediate emergency response options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call 911 */}
            <Button
              onClick={handleCallEmergency}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-16 text-lg"
              size="lg"
            >
              <Phone className="w-6 h-6 mr-2" />
              Call 911 Emergency
            </Button>

            {/* Location Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Location Status:</span>
              </div>
              <Badge variant={location ? "default" : "secondary"}>
                {location ? "Available" : "Unavailable"}
              </Badge>
            </div>

            {/* Emergency Message */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Emergency Message (Optional)
              </label>
              <Textarea
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                placeholder="Describe your emergency situation..."
                rows={3}
              />
            </div>

            {/* Emergency Alert Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() => handleEmergencyAlert("medical")}
                disabled={createAlertMutation.isPending || isEmergencyActive}
                variant="destructive"
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Medical Emergency
              </Button>
              
              <Button
                onClick={() => handleEmergencyAlert("accident")}
                disabled={createAlertMutation.isPending || isEmergencyActive}
                variant="destructive"
                className="w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Vehicle Accident
              </Button>

              <Button
                onClick={() => handleEmergencyAlert("safety")}
                disabled={createAlertMutation.isPending || isEmergencyActive}
                variant="destructive"
                className="w-full"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Safety Concern
              </Button>

              <Button
                onClick={() => handleEmergencyAlert("breakdown")}
                disabled={createAlertMutation.isPending || isEmergencyActive}
                variant="outline"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Vehicle Breakdown
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Emergency History</span>
            </CardTitle>
            <CardDescription>
              Your recent emergency alerts and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No emergency alerts yet</p>
                <p className="text-sm">We hope it stays that way!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="font-medium capitalize">
                          {alert.alertType} Alert
                        </span>
                      </div>
                      <Badge
                        variant={
                          alert.status === "resolved"
                            ? "default"
                            : alert.status === "active"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(alert.createdAt), "PPp")}
                      </span>
                      {alert.location !== "Location unavailable" && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>Location shared</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Safety Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Before Your Ride:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Share your trip details with a trusted contact</li>
                <li>• Verify the driver and vehicle details</li>
                <li>• Ensure your phone is fully charged</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">During Your Ride:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Follow the GPS route and speak up if concerned</li>
                <li>• Stay alert and trust your instincts</li>
                <li>• Use the in-app emergency features if needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}