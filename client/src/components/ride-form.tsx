import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRideSchema } from "@shared/schema";
import { z } from "zod";
import { MapPin, Calendar, Clock, Users, DollarSign, Car } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const rideFormSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  availableSeats: z.number().min(1, "At least 1 seat required"),
  pricePerSeat: z.string().min(1, "Price is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  notes: z.string().optional(),
});

type RideFormData = z.infer<typeof rideFormSchema>;

export default function RideForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RideFormData>({
    resolver: zodResolver(rideFormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      departureDate: "",
      departureTime: "",
      availableSeats: 1,
      pricePerSeat: "",
      vehicleId: "",
      notes: "",
    },
  });

  // Fetch user vehicles
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
  });

  // Create ride mutation
  const createRideMutation = useMutation({
    mutationFn: async (data: RideFormData) => {
      // Combine date and time into a single datetime
      const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
      
      const rideData = {
        ...data,
        departureDate: departureDateTime.toISOString(),
        pricePerSeat: parseFloat(data.pricePerSeat),
      };
      
      // Remove the separate time field
      const { departureTime, ...finalData } = rideData;
      
      return await apiRequest("POST", "/api/rides", finalData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ride created successfully!",
      });
      form.reset();
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
      const errorMessage = error instanceof Error ? error.message : "Failed to create ride. Please try again.";
      toast({
        title: "Error",
        description: errorMessage.includes("Failed to create ride") ? errorMessage : `Failed to create ride: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RideFormData) => {
    // Additional validation before submission
    if (!data.origin?.trim() || !data.destination?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both pickup and destination locations.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.departureDate || !data.departureTime) {
      toast({
        title: "Validation Error", 
        description: "Please select both departure date and time.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if departure time is in the future
    const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
    if (departureDateTime <= new Date()) {
      toast({
        title: "Validation Error",
        description: "Departure time must be in the future.",
        variant: "destructive",
      });
      return;
    }
    
    createRideMutation.mutate(data);
  };

  // Get today's date for min date validation (local timezone aware)
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Route Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="origin" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-sky-500" />
            <span>From</span>
          </Label>
          <Input
            id="origin"
            placeholder="Departure location"
            {...form.register("origin")}
            className="focus:ring-sky-500 focus:border-sky-500"
          />
          {form.formState.errors.origin && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.origin.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="destination" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>To</span>
          </Label>
          <Input
            id="destination"
            placeholder="Destination"
            {...form.register("destination")}
            className="focus:ring-sky-500 focus:border-sky-500"
          />
          {form.formState.errors.destination && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.destination.message}</p>
          )}
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="departureDate" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>Date</span>
          </Label>
          <Input
            id="departureDate"
            type="date"
            min={today}
            {...form.register("departureDate")}
            className="focus:ring-sky-500 focus:border-sky-500"
          />
          {form.formState.errors.departureDate && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.departureDate.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="departureTime" className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-500" />
            <span>Departure Time</span>
          </Label>
          <Input
            id="departureTime"
            type="time"
            {...form.register("departureTime")}
            className="focus:ring-sky-500 focus:border-sky-500"
          />
          {form.formState.errors.departureTime && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.departureTime.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="availableSeats" className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-500" />
            <span>Available Seats</span>
          </Label>
          <Select 
            value={form.watch("availableSeats")?.toString()} 
            onValueChange={(value) => form.setValue("availableSeats", parseInt(value))}
          >
            <SelectTrigger className="focus:ring-sky-500 focus:border-sky-500">
              <SelectValue placeholder="Select seats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 seat</SelectItem>
              <SelectItem value="2">2 seats</SelectItem>
              <SelectItem value="3">3 seats</SelectItem>
              <SelectItem value="4">4 seats</SelectItem>
              <SelectItem value="5">5 seats</SelectItem>
              <SelectItem value="6">6 seats</SelectItem>
              <SelectItem value="7">7 seats</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.availableSeats && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.availableSeats.message}</p>
          )}
        </div>
      </div>

      {/* Price and Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pricePerSeat" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-sky-500" />
            <span>Price per Seat</span>
          </Label>
          <Input
            id="pricePerSeat"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...form.register("pricePerSeat")}
            className="focus:ring-sky-500 focus:border-sky-500"
          />
          {form.formState.errors.pricePerSeat && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.pricePerSeat.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="vehicleId" className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-sky-500" />
            <span>Vehicle</span>
          </Label>
          {isLoadingVehicles ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full" />
            </div>
          ) : (vehicles as any[]).length === 0 ? (
            <div className="p-3 border rounded-lg text-center text-gray-500">
              <p className="text-sm">No vehicles found.</p>
              <p className="text-xs">Add a vehicle in your profile first.</p>
            </div>
          ) : (
            <Select 
              value={form.watch("vehicleId")} 
              onValueChange={(value) => form.setValue("vehicleId", value)}
            >
              <SelectTrigger className="focus:ring-sky-500 focus:border-sky-500">
                <SelectValue placeholder="Select your vehicle" />
              </SelectTrigger>
              <SelectContent>
                {(vehicles as any[]).map((vehicle: any) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.color} ({vehicle.licensePlate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {form.formState.errors.vehicleId && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.vehicleId.message}</p>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Any special instructions, preferences, or additional information..."
          {...form.register("notes")}
          className="focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3"
        disabled={createRideMutation.isPending || (vehicles as any[]).length === 0}
      >
        {createRideMutation.isPending ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Creating Ride...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>Create Ride</span>
          </div>
        )}
      </Button>

      {(vehicles as any[]).length === 0 && (
        <p className="text-sm text-gray-600 text-center">
          You need to add a vehicle in your profile before creating rides.
        </p>
      )}
    </form>
  );
}
