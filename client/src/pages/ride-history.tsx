import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Calendar, MapPin, Users, DollarSign, CreditCard } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import type { RideWithDetails } from "@shared/schema";

export default function RideHistory() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch driver rides
  const { data: driverRides = [], isLoading: isLoadingDriverRides } = useQuery({
    queryKey: ["/api/rides", { type: "driver" }],
    enabled: isAuthenticated,
  });

  // Fetch passenger rides
  const { data: passengerRides = [], isLoading: isLoadingPassengerRides } = useQuery({
    queryKey: ["/api/rides", { type: "passenger" }],
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const RideCard = ({ ride, type }: { ride: RideWithDetails; type: "driver" | "passenger" }) => (
    <Card key={ride.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <span className="font-medium">{ride.origin} → {ride.destination}</span>
              {getStatusBadge(ride.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{ride.departureDate ? formatDate(ride.departureDate.toString()) : 'Date TBD'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{ride.availableSeats} seats available</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>${ride.pricePerSeat}/seat</span>
              </div>
            </div>

            {type === "driver" ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Vehicle: {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model}
                </p>
                {ride.requests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Passengers:</p>
                    <div className="space-y-1">
                      {ride.requests
                        .filter(req => req.status === "accepted")
                        .map(req => (
                          <div key={req.id} className="text-sm text-gray-600">
                            {req.passenger.firstName} {req.passenger.lastName} ({req.seatsRequested} seat{req.seatsRequested > 1 ? 's' : ''})
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Driver: {ride.driver.firstName} {ride.driver.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  Vehicle: {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model}
                </p>
              </div>
            )}

            {ride.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">"{ride.notes}"</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Created {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : 'Unknown'}</span>
          {type === "driver" && (
            <span>{ride.requests.filter(r => r.status === "accepted").length} passengers booked</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Ride History</h1>
          <p className="text-gray-600">View all your rides as a driver and passenger</p>
        </div>

        <Tabs defaultValue="driver" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="driver">As Driver</TabsTrigger>
            <TabsTrigger value="passenger">As Passenger</TabsTrigger>
          </TabsList>

          <TabsContent value="driver" className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pb-8">
            <Card>
              <CardHeader>
                <CardTitle>Rides You've Offered</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingDriverRides ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full" />
                  </div>
                ) : (driverRides as RideWithDetails[])?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No rides offered yet</p>
                    <p className="text-sm">Create your first ride to start sharing!</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-8">
                    {(driverRides as RideWithDetails[])?.map((ride: RideWithDetails) => (
                      <RideCard key={ride.id} ride={ride} type="driver" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passenger" className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pb-8">
            <Card>
              <CardHeader>
                <CardTitle>Rides You've Requested</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPassengerRides ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full" />
                  </div>
                ) : (passengerRides as RideWithDetails[])?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No ride requests yet</p>
                    <p className="text-sm">Search for rides to start traveling!</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-8">
                    {(passengerRides as RideWithDetails[])?.map((ride: RideWithDetails) => (
                      <RideCard key={ride.id} ride={ride} type="passenger" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
