import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Phone, Video, MoreVertical, Send, Paperclip, Smile } from "lucide-react";
import Navigation from "@/components/navigation";
import { Link } from "wouter";

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/avatars/sarah.jpg",
      lastMessage: "Thanks for the ride! See you tomorrow.",
      timestamp: "2 min ago",
      unread: 2,
      online: true,
      rideInfo: "Downtown → Airport"
    },
    {
      id: 2,
      name: "Mike Chen",
      avatar: "/avatars/mike.jpg",
      lastMessage: "I'm running 5 minutes late",
      timestamp: "15 min ago",
      unread: 1,
      online: true,
      rideInfo: "University → Mall"
    },
    {
      id: 3,
      name: "Emma Davis",
      avatar: "/avatars/emma.jpg",
      lastMessage: "Perfect! I'll be there at 3 PM",
      timestamp: "1 hour ago",
      unread: 0,
      online: false,
      rideInfo: "City Center → Beach"
    },
    {
      id: 4,
      name: "Alex Martinez",
      avatar: "/avatars/alex.jpg",
      lastMessage: "Can we meet at the main entrance instead?",
      timestamp: "Yesterday",
      unread: 0,
      online: false,
      rideInfo: "Train Station → Hospital"
    }
  ];

  const allMessages = {
    1: [
      {
        id: 1,
        senderId: 1,
        text: "Hi! I'm interested in your ride to the airport tomorrow at 3 PM",
        timestamp: "10:30 AM",
        isOwn: false
      },
      {
        id: 2,
        senderId: "user",
        text: "Great! I have one spot available. The pickup location is downtown near the coffee shop.",
        timestamp: "10:32 AM",
        isOwn: true
      },
      {
        id: 3,
        senderId: 1,
        text: "Perfect! What's the exact address?",
        timestamp: "10:33 AM",
        isOwn: false
      },
      {
        id: 4,
        senderId: "user",
        text: "123 Main Street, right next to Starbucks. I'll be in a blue Toyota Camry",
        timestamp: "10:35 AM",
        isOwn: true
      },
      {
        id: 5,
        senderId: 1,
        text: "Thanks for the ride! See you tomorrow.",
        timestamp: "10:36 AM",
        isOwn: false
      }
    ],
    2: [
      {
        id: 1,
        senderId: 2,
        text: "Hey! Are we still on for the ride to the mall?",
        timestamp: "2:15 PM",
        isOwn: false
      },
      {
        id: 2,
        senderId: "user",
        text: "Yes, but I'm running 5 minutes late. Sorry!",
        timestamp: "2:18 PM",
        isOwn: true
      },
      {
        id: 3,
        senderId: 2,
        text: "No problem, I'll wait by the main entrance",
        timestamp: "2:19 PM",
        isOwn: false
      }
    ],
    3: [
      {
        id: 1,
        senderId: 3,
        text: "Hi! I saw your ride posting to the beach",
        timestamp: "Yesterday",
        isOwn: false
      },
      {
        id: 2,
        senderId: "user",
        text: "Perfect! I'll be there at 3 PM sharp",
        timestamp: "Yesterday",
        isOwn: true
      }
    ],
    4: [
      {
        id: 1,
        senderId: 4,
        text: "Can we meet at the main entrance instead?",
        timestamp: "Yesterday",
        isOwn: false
      },
      {
        id: 2,
        senderId: "user",
        text: "Sure, that works better for me too",
        timestamp: "Yesterday",
        isOwn: true
      }
    ]
  };

  const messages = selectedChat ? (allMessages[selectedChat as keyof typeof allMessages] || []) : [];

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.rideInfo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      // In a real app, this would send the message to the server
      console.log("Sending message:", newMessage, "to conversation:", selectedChat);
      setNewMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Chat with your ride partners</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-sky-600" />
                    <span>Conversations</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-sky-50 text-sky-700">
                    {conversations.filter(c => c.unread > 0).length} unread
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-4 pt-0">
                    {filteredConversations.map((conversation) => (
                      <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                        <div className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={conversation.avatar} />
                                <AvatarFallback className="bg-sky-100 text-sky-700">
                                  {conversation.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {conversation.online && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.name}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {conversation.timestamp}
                                  </span>
                                  {conversation.unread > 0 && (
                                    <Badge className="bg-sky-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                      {conversation.unread}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-sky-600 font-medium mt-1">
                                {conversation.rideInfo}
                              </p>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conversation.lastMessage}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-8">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedConversation.avatar} />
                          <AvatarFallback className="bg-sky-100 text-sky-700">
                            {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedConversation.name}</h3>
                        <p className="text-sm text-sky-600">{selectedConversation.rideInfo}</p>
                        <p className="text-xs text-gray-500">
                          {selectedConversation.online ? 'Online' : 'Last seen 2 hours ago'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isOwn
                              ? 'bg-sky-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.isOwn ? 'text-sky-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>

                <Separator />

                {/* Message Input */}
                <div className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="pr-10"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}