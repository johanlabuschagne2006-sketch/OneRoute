import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GPSTracker } from "@/components/GPSTracker";
import { 
  Send, 
  MessageCircle, 
  AlertTriangle, 
  MapPin, 
  Clock,
  Car,
  User,
  Navigation
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  messageType: 'text' | 'system' | 'emergency';
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface RideDetails {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  price: string;
  status: string;
  driver: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
  };
}

export default function Chat() {
  const [match, params] = useRoute('/chat/:rideId');
  const rideId = (params as any)?.rideId;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { messages: wsMessages, isConnected, sendChatMessage } = useWebSocket();
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("chat");

  // Fetch ride details
  const { data: ride } = useQuery<RideDetails>({
    queryKey: ["/api/rides", rideId],
    enabled: !!rideId,
  });

  // Fetch chat messages
  const { data: messages = [], refetch } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", rideId],
    enabled: !!rideId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest("POST", `/api/chat/${rideId}/messages`, { message }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat", rideId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Emergency alert mutation
  const emergencyMutation = useMutation({
    mutationFn: (alertData: any) => 
      apiRequest("POST", "/api/emergency/alert", alertData),
    onSuccess: () => {
      toast({
        title: "Emergency Alert Sent",
        description: "Emergency services and contacts have been notified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat", rideId] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleEmergencyAlert = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          emergencyMutation.mutate({
            rideId,
            alertType: "emergency",
            location: JSON.stringify(location),
            message: "Emergency alert triggered from chat",
          });
        },
        () => {
          emergencyMutation.mutate({
            rideId,
            alertType: "emergency",
            location: "Location unavailable",
            message: "Emergency alert triggered from chat",
          });
        }
      );
    }
  };

  if (!ride) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center">Loading ride details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Ride Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-full">
                <Car className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {ride.origin} → {ride.destination}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(ride.departureDate), "PPp")}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{ride.driver.firstName} {ride.driver.lastName}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={ride.status === 'active' ? 'default' : 'secondary'}>
                {ride.status}
              </Badge>
              <Button
                onClick={handleEmergencyAlert}
                disabled={emergencyMutation.isPending}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Emergency
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat and GPS Tracking Tabs */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
                {!isConnected && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
              </TabsTrigger>
              <TabsTrigger value="gps" className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Live GPS
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-4 h-[500px]">
              <div className="flex flex-col h-full">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 border rounded-lg">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === (user as any)?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.messageType === 'system'
                              ? "mx-auto"
                              : message.senderId === (user as any)?.id
                              ? ""
                              : "flex items-start space-x-2"
                          }`}
                        >
                          {message.senderId !== (user as any)?.id && message.messageType !== 'system' && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={message.sender?.profileImageUrl} />
                              <AvatarFallback>
                                {message.sender?.firstName?.[0]}
                                {message.sender?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={`rounded-lg p-3 ${
                              message.messageType === 'system'
                                ? "bg-gray-100 dark:bg-gray-800 text-center text-sm"
                                : message.messageType === 'emergency'
                                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                : message.senderId === (user as any)?.id
                                ? "bg-sky-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            <div className="text-sm">{message.message}</div>
                            <div
                              className={`text-xs mt-1 ${
                                message.senderId === (user as any)?.id
                                  ? "text-sky-100"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {format(new Date(message.createdAt), "p")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <Separator className="my-4" />
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="gps" className="mt-4 h-[500px]">
              <div className="h-full overflow-y-auto">
                <GPSTracker 
                  rideId={rideId!} 
                  isDriver={ride?.driver.firstName === (user as any)?.firstName}
                  onLocationUpdate={(location) => {
                    console.log('Location updated:', location);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}