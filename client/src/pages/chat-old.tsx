import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Car,
  Clock,
  User,
  Send,
  MessageCircle,
  Navigation,
  AlertTriangle,
  MapPin
} from 'lucide-react';

export default function ChatOld() {
  const [match, params] = useRoute('/chat-old/:rideId');
  if (!match || !params) return null;
  const rideId = (params as any)?.rideId;
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');

  // WebSocket connection
  const { isConnected, messages, sendMessage } = useWebSocket();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch ride details
  const { data: ride } = useQuery({
    queryKey: ['/api/rides', rideId],
    enabled: !!rideId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, messageType = 'normal' }: { message: string; messageType?: string }) => {
      return apiRequest('POST', '/api/chat/send', {
        rideId,
        message,
        messageType,
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat', rideId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Emergency alert mutation
  const emergencyMutation = useMutation({
    mutationFn: async (alertData: any) => {
      return apiRequest('POST', '/api/emergency/alert', alertData);
    },
    onSuccess: () => {
      toast({
        title: "Emergency Alert Sent",
        description: "All participants have been notified",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send emergency alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && rideId) {
      // Send via WebSocket for real-time delivery
      sendMessage({ 
        type: 'message',
        rideId: rideId || '',
        message: newMessage.trim(),
        senderId: (user as any)?.id 
      });
      // Also save to database
      sendMessageMutation.mutate({ message: newMessage.trim() });
    }
  };

  const handleEmergencyAlert = () => {
    if (!rideId) return;
    
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
      <div className="container mx-auto p-6">
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
                  {(ride as any)?.origin || 'Origin'} → {(ride as any)?.destination || 'Destination'}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{(ride as any)?.departureDate ? format(new Date((ride as any).departureDate), "PPp") : 'Date TBD'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{(ride as any)?.driver?.firstName || 'Driver'} {(ride as any)?.driver?.lastName || ''}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={(ride as any)?.status === 'active' ? 'default' : 'secondary'}>
                {(ride as any)?.status || 'Unknown'}
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
          </Tabs>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
            <CardContent className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
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
            </CardContent>

            {/* Message Input */}
            <Separator />
            <div className="p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
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

          <TabsContent value="gps" className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sky-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">Live GPS Tracking</span>
              </div>
              <div className="text-center text-gray-500 py-8">
                <Navigation className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>GPS tracking interface would be integrated here</p>
                <p className="text-sm mt-2">Real-time location sharing between ride participants</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}