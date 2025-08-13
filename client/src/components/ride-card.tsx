import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import UserProfileModal from "./user-profile-modal";
import { 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  Star, 
  Shield,
  MessageCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { RideWithDetails } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface RideCardProps {
  ride: RideWithDetails;
  mode: "driver" | "passenger";
}

// Default props validation
const defaultProps = {
  mode: "passenger" as const,
};

export default function RideCard({ ride, mode = defaultProps.mode }: RideCardProps) {
  // Validate required props
  if (!ride || !ride.id) {
    console.warn('RideCard: Invalid ride prop provided');
    return null;
  }
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Request ride mutation
  const requestRideMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ride-requests", {
        rideId: ride.id,
        seatsRequested: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ride request sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rides/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send ride request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept/reject request mutations
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      return await apiRequest("PUT", `/api/ride-requests/${requestId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      const errorMessage = error instanceof Error ? error.message : "Failed to update request. Please try again.";
      toast({
        title: "Error",
        description: errorMessage.includes("Failed to update request") ? errorMessage : `Failed to update request: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const handleRequestRide = () => {
    requestRideMutation.mutate();
  };

  const handleAcceptRequest = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: "accepted" });
  };

  const handleRejectRequest = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: "rejected" });
  };

  const handleShowProfile = (user: any) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const pendingRequests = ride.requests?.filter(req => req.status === "pending") || [];
  const acceptedRequests = ride.requests?.filter(req => req.status === "accepted") || [];

  return (
    <>
      <Card className="hover:shadow-md transition-shadow border-l-4 border-sky-500">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex-1">
              {/* Driver Info */}
              <div className="flex items-center space-x-4 mb-3">
                <Avatar
                  className="w-12 h-12 cursor-pointer border-2 border-sky-500"
                  onClick={() => handleShowProfile(ride.driver)}
                >
                  <AvatarImage src={ride.driver.profileImageUrl || ""} />
                  <AvatarFallback>
                    {ride.driver.firstName?.[0]}{ride.driver.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 
                    className="font-semibold text-gray-800 cursor-pointer hover:text-sky-600"
                    onClick={() => handleShowProfile(ride.driver)}
                  >
                    {ride.driver.firstName} {ride.driver.lastName}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{ride.driver.rating || "0.0"}</span>
                    </div>
                    <span className="text-gray-500 text-sm">({ride.driver.totalRides || 0} rides)</span>
                    {ride.driver.isVerified && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Shield className="w-3 h-3" />
                        <span className="text-xs">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <MapPin className="w-4 h-4 text-sky-500 mr-2" />
                    <span className="text-sm">{ride.origin} → {ride.destination}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 text-sky-500 mr-2" />
                    <span className="text-sm">{formatDate(ride.departureDate.toString())}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Car className="w-4 h-4 text-sky-500 mr-2" />
                    <span className="text-sm">
                      {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model} - {ride.vehicle.color}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 text-sky-500 mr-2" />
                    <span className="text-sm">{ride.availableSeats} of {ride.vehicle.seats} seats available</span>
                  </div>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="flex items-center space-x-2 mb-2">
                {getStatusBadge(ride.status)}
                {acceptedRequests.length > 0 && (
                  <Badge variant="outline">
                    {acceptedRequests.length} passenger{acceptedRequests.length > 1 ? 's' : ''} booked
                  </Badge>
                )}
              </div>

              {ride.notes && (
                <p className="text-sm text-gray-600 italic mb-3">"{ride.notes}"</p>
              )}
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col items-end space-y-3 mt-4 md:mt-0">
              <div className="text-right">
                <div className="text-2xl font-bold text-sky-600">${ride.pricePerSeat}</div>
                <div className="text-sm text-gray-500">per person</div>
              </div>

              {mode === "passenger" && ride.status === "active" && (
                <Button 
                  onClick={handleRequestRide}
                  className="bg-sky-500 hover:bg-sky-600"
                  disabled={requestRideMutation.isPending}
                >
                  {requestRideMutation.isPending ? "Requesting..." : "Request Ride"}
                </Button>
              )}

              {mode === "driver" && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Messages</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests (Driver View) */}
          {mode === "driver" && pendingRequests.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3">Pending Requests</h5>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        className="w-8 h-8 cursor-pointer"
                        onClick={() => handleShowProfile(request.passenger)}
                      >
                        <AvatarImage src={request.passenger.profileImageUrl || ""} />
                        <AvatarFallback className="text-xs">
                          {request.passenger.firstName?.[0]}{request.passenger.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p 
                          className="font-medium text-sm cursor-pointer hover:text-sky-600"
                          onClick={() => handleShowProfile(request.passenger)}
                        >
                          {request.passenger.firstName} {request.passenger.lastName}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">
                            {request.passenger.rating || "0.0"} ({request.passenger.totalRides || 0} rides)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={updateRequestMutation.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={updateRequestMutation.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Passengers (Driver View) */}
          {mode === "driver" && acceptedRequests.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3">Confirmed Passengers</h5>
              <div className="space-y-2">
                {acceptedRequests.map((request) => (
                  <div key={request.id} className="flex items-center space-x-3 p-2">
                    <Avatar
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => handleShowProfile(request.passenger)}
                    >
                      <AvatarImage src={request.passenger.profileImageUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {request.passenger.firstName?.[0]}{request.passenger.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span 
                      className="text-sm cursor-pointer hover:text-sky-600"
                      onClick={() => handleShowProfile(request.passenger)}
                    >
                      {request.passenger.firstName} {request.passenger.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({request.seatsRequested} seat{request.seatsRequested > 1 ? 's' : ''})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
