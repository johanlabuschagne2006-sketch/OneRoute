import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Phone, MapPin, Loader2 } from "lucide-react";

interface EmergencySOSProps {
  rideId?: string;
}

export default function EmergencySOS({ rideId }: EmergencySOSProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState<"sos" | "breakdown" | "accident">("sos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleEmergencyAlert = async () => {
    setIsSubmitting(true);
    
    try {
      // Get current location
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);

      // Send emergency alert
      await apiRequest("POST", "/api/emergency/alert", {
        rideId,
        alertType,
        location: currentLocation,
        message: message || `Emergency ${alertType} alert from One Route user`,
      });

      toast({
        title: "Emergency Alert Sent!",
        description: "Emergency services and your emergency contact have been notified.",
      });

      // Call emergency services (in a real app, this would trigger actual emergency services)
      toast({
        title: "Calling Emergency Services",
        description: "Connecting to emergency services...",
        variant: "destructive",
      });

      setIsOpen(false);
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to Send Alert",
        description: error.message || "Could not send emergency alert. Please call emergency services directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg"
        >
          <AlertTriangle className="w-6 h-6 mr-2" />
          EMERGENCY SOS
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Emergency Alert
          </DialogTitle>
          <DialogDescription>
            This will immediately alert emergency services and your emergency contact with your current location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant={alertType === "sos" ? "destructive" : "outline"}
              onClick={() => setAlertType("sos")}
              className="justify-start"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              General Emergency (SOS)
            </Button>
            <Button
              variant={alertType === "accident" ? "destructive" : "outline"}
              onClick={() => setAlertType("accident")}
              className="justify-start"
            >
              <Phone className="w-4 h-4 mr-2" />
              Car Accident
            </Button>
            <Button
              variant={alertType === "breakdown" ? "destructive" : "outline"}
              onClick={() => setAlertType("breakdown")}
              className="justify-start"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Vehicle Breakdown
            </Button>
          </div>

          <Textarea
            placeholder="Describe the emergency (optional)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-20"
          />

          <div className="flex justify-between space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmergencyAlert}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Send Emergency Alert
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}