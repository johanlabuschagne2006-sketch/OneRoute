import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import RideCard from "@/components/ride-card";
import RideForm from "@/components/ride-form";
import { Search, Plus } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import type { RideWithDetails } from "@shared/schema";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("passenger");
  const [searchFilters, setSearchFilters] = useState({
    origin: "",
    destination: "",
    date: "",
    minSeats: ""
  });

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

  // Search rides query
  const { data: searchResults = [], isLoading: isSearching, refetch: searchRides } = useQuery<RideWithDetails[]>({
    queryKey: ["/api/rides/search", searchFilters],
    enabled: false, // Only search when triggered
  });

  // User's rides query
  const { data: userRides = [], isLoading: isLoadingUserRides } = useQuery<RideWithDetails[]>({
    queryKey: ["/api/rides", { type: activeTab === "driver" ? "driver" : "passenger" }],
    enabled: isAuthenticated,
  });

  const handleSearch = () => {
    if (!searchFilters.origin?.trim() || !searchFilters.destination?.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter both pickup and destination locations.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if search date is in the future (if provided)
    if (searchFilters.date) {
      const searchDate = new Date(searchFilters.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (searchDate < today) {
        toast({
          title: "Search Error",
          description: "Please select a date that is today or in the future.",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      searchRides();
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search for rides. Please try again.",
        variant: "destructive",
      });
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Mode Toggle */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="passenger" className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>Find a Ride</span>
                  </TabsTrigger>
                  <TabsTrigger value="driver" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Offer a Ride</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Passenger Mode */}
          <TabsContent value="passenger" className="space-y-6 overflow-y-auto max-h-[calc(100vh-280px)] pb-8">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle>Find Your Perfect Ride</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">From</Label>
                    <Input
                      id="origin"
                      placeholder="Enter pickup location"
                      value={searchFilters.origin}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, origin: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">To</Label>
                    <Input
                      id="destination"
                      placeholder="Enter destination"
                      value={searchFilters.destination}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={searchFilters.date}
                      min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minSeats">Passengers</Label>
                    <Select value={searchFilters.minSeats} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, minSeats: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Number of passengers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 passenger</SelectItem>
                        <SelectItem value="2">2 passengers</SelectItem>
                        <SelectItem value="3">3 passengers</SelectItem>
                        <SelectItem value="4">4 passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSearch} 
                      className="w-full bg-sky-500 hover:bg-sky-600"
                      disabled={isSearching || !searchFilters.origin || !searchFilters.destination}
                    >
                      {isSearching ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Searching...</span>
                        </div>
                      ) : (
                        "Search Rides"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Searching for rides...</p>
              </div>
            )}
            
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Available Rides</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.map((ride: RideWithDetails) => (
                    <RideCard key={ride.id} ride={ride} mode="passenger" />
                  ))}
                </div>
              </div>
            )}

            {/* User's Ride Requests */}
            <div className="space-y-4 pb-16">
              <h3 className="text-lg font-semibold text-gray-800 sticky top-0 bg-gray-50 py-2 z-10">Your Ride Requests</h3>
              {isLoadingUserRides ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : userRides.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No ride requests found. Search for rides above to get started!
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 pb-8">
                  {userRides.map((ride: RideWithDetails) => (
                    <RideCard key={ride.id} ride={ride} mode="passenger" />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Driver Mode */}
          <TabsContent value="driver" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Create Ride Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create a New Ride</CardTitle>
              </CardHeader>
              <CardContent>
                <RideForm />
              </CardContent>
            </Card>

            {/* Driver's Rides */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Your Rides</h3>
              {isLoadingUserRides ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : userRides.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No rides created yet. Create your first ride above!
                  </CardContent>
                </Card>
              ) : (
                userRides.map((ride: RideWithDetails) => (
                  <RideCard key={ride.id} ride={ride} mode="driver" />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
