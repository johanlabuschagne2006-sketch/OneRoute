import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { User, Car, Star, Shield, Phone } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { ProfilePictureUploader } from "@/components/ProfilePictureUploader";
import type { UploadResult } from "@uppy/core";

const profileSchema = insertUserSchema.extend({
  phone: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  paypalEmail: z.string().email().optional().or(z.literal("")),
});

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900, "Invalid year"),
  color: z.string().min(1, "Color is required"),
  licensePlate: z.string().min(1, "License plate is required"),
});

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

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

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      age: undefined,
      gender: "",
      address: "",
      paypalEmail: "",
    },
  });

  // Update form values when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        phone: (user as any)?.phone || "",
        age: (user as any)?.age || undefined,
        gender: (user as any)?.gender || "",
        paypalEmail: (user as any)?.paypalEmail || "",
        address: (user as any)?.address || "",
      });
    }
  }, [user, profileForm]);

  // Vehicle form
  const vehicleForm = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      licensePlate: "",
      seats: 4,
    },
  });

  // Fetch user vehicles
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    enabled: isAuthenticated,
  });

  // Fetch user reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["/api/reviews", (user as any)?.id],
    enabled: isAuthenticated && !!(user as any)?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      toast({
        title: "Error",
        description: errorMessage.includes("Failed to update profile") ? errorMessage : `Failed to update profile: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle added successfully!",
      });
      setShowAddVehicle(false);
      vehicleForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
      const errorMessage = error instanceof Error ? error.message : "Failed to add vehicle. Please try again.";
      toast({
        title: "Error",
        description: errorMessage.includes("Failed to add vehicle") ? errorMessage : `Failed to add vehicle: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitVehicle = (data: any) => {
    addVehicleMutation.mutate(data);
  };

  // Profile picture update mutation
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (profilePictureURL: string) => {
      return await apiRequest("PUT", "/api/profile-picture", { profilePictureURL });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile picture. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleProfilePictureUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      if (uploadURL) {
        updateProfilePictureMutation.mutate(uploadURL);
      }
    }
  };

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
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4 mb-6">
                <ProfilePictureUploader
                  currentImageUrl={(user as any)?.profileImageUrl}
                  onComplete={handleProfilePictureUpload}
                  fallbackText={`${(user as any)?.firstName?.[0] || ""}${(user as any)?.lastName?.[0] || ""}`.toUpperCase()}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-gray-600">{(user as any)?.rating || "0.0"}</span>
                    <span className="text-gray-500">({(user as any)?.totalRides || 0} rides)</span>
                    {(user as any)?.isVerified && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setEditingProfile(!editingProfile)}
                  variant={editingProfile ? "outline" : "default"}
                  className={!editingProfile ? "bg-sky-500 hover:bg-sky-600" : ""}
                >
                  {editingProfile ? "Cancel" : "Edit Profile"}
                </Button>
                <Button onClick={() => window.location.href = '/api/logout'} variant="outline">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          {editingProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register("firstName")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register("lastName")}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        {...profileForm.register("phone")}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        {...profileForm.register("age", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={profileForm.watch("gender")} 
                        onValueChange={(value) => profileForm.setValue("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      {...profileForm.register("address")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="paypalEmail">PayPal Email (for receiving payments)</Label>
                    <Input
                      id="paypalEmail"
                      type="email"
                      {...profileForm.register("paypalEmail")}
                      placeholder="your-email@paypal.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your PayPal email to receive payments when you offer rides
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-sky-500 hover:bg-sky-600"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Vehicles Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Car className="w-5 h-5" />
                  <span>Your Vehicles</span>
                </CardTitle>
                <Button 
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  Add Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddVehicle && (
                <form onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)} className="space-y-4 mb-6 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="make">Make</Label>
                      <Input
                        id="make"
                        {...vehicleForm.register("make")}
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        {...vehicleForm.register("model")}
                        placeholder="Camry"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        {...vehicleForm.register("year", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        {...vehicleForm.register("color")}
                        placeholder="Blue"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seats">Seats</Label>
                      <Select 
                        value={vehicleForm.watch("seats")?.toString()} 
                        onValueChange={(value) => vehicleForm.setValue("seats", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 seats</SelectItem>
                          <SelectItem value="4">4 seats</SelectItem>
                          <SelectItem value="5">5 seats</SelectItem>
                          <SelectItem value="7">7 seats</SelectItem>
                          <SelectItem value="8">8 seats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="licensePlate">License Plate</Label>
                    <Input
                      id="licensePlate"
                      {...vehicleForm.register("licensePlate")}
                      placeholder="ABC123"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      className="bg-sky-500 hover:bg-sky-600"
                      disabled={addVehicleMutation.isPending}
                    >
                      {addVehicleMutation.isPending ? "Adding..." : "Add Vehicle"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowAddVehicle(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {isLoadingVehicles ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : (vehicles as any[]).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No vehicles added yet. Add your first vehicle to start offering rides!
                </p>
              ) : (
                <div className="space-y-3">
                  {(vehicles as any[]).map((vehicle: any) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {vehicle.color} • {vehicle.licensePlate} • {vehicle.seats} seats
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : (reviews as any[]).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No reviews yet. Complete rides to start receiving reviews!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(reviews as any[]).map((review: any) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
