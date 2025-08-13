import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Send, MapPin, Phone } from "lucide-react";
import type { ChatMessage, User } from "@shared/schema";

interface RideChatProps {
  rideId: string;
  participants: User[];
}

type ChatMessageWithSender = ChatMessage & {
  sender: User;
};

export default function RideChat({ rideId, participants }: RideChatProps) {
  const [message, setMessage] = useState("");
  const { user } = useAuth() as { user: User };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat", rideId],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; messageType?: string }) => {
      return apiRequest("POST", `/api/chat/${rideId}/messages`, messageData);
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat", rideId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Could not send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Share location mutation
  const shareLocationMutation = useMutation({
    mutationFn: async () => {
      return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            resolve(location);
          },
          reject,
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    },
    onSuccess: async (location) => {
      await apiRequest("POST", `/api/chat/${rideId}/messages`, {
        message: `📍 Current Location: https://maps.google.com/?q=${location.lat},${location.lng}`,
        messageType: "location",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat", rideId] });
      toast({
        title: "Location Shared",
        description: "Your current location has been shared with ride participants.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Share Location",
        description: error.message || "Could not share location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ride Chat</CardTitle>
        <div className="flex -space-x-2">
          {participants.map((participant) => (
            <Avatar key={participant.id} className="w-8 h-8 border-2 border-white">
              <AvatarImage src={participant.profileImageUrl || ""} />
              <AvatarFallback className="text-xs">
                {participant.firstName?.[0]}{participant.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" />
            </div>
          ) : (messages as ChatMessageWithSender[])?.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              Start the conversation!
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {(messages as ChatMessageWithSender[]).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs ${msg.senderId === user?.id ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={msg.sender?.profileImageUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {msg.sender?.firstName?.[0]}{msg.sender?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          msg.senderId === user?.id
                            ? "bg-sky-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.messageType === "location" ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <a
                              href={msg.message.split(": ")[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              View Location
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.message}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {msg.createdAt ? formatTime(msg.createdAt.toString()) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
              className="bg-sky-500 hover:bg-sky-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => shareLocationMutation.mutate()}
              disabled={shareLocationMutation.isPending}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Share Location
            </Button>
            <Button
              onClick={() => toast({ title: "Calling...", description: "Feature coming soon!" })}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}