import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Bell, User as UserIcon, History, Settings, LogOut, Home, Search, Car, MessageSquare, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navigation() {
  const { user, isLoading } = useAuth() as { user: User | undefined; isLoading: boolean };
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [notifications] = useState(3); // Mock notification count
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      type: "ride_request",
      title: "New ride request",
      message: "Sarah wants to join your ride to Downtown",
      time: "5 minutes ago",
      read: false,
      icon: Home,
      rideId: "ride-123",
      actionUrl: "/rides/ride-123/chat"
    },
    {
      id: 2,
      type: "message",
      title: "New message",
      message: "Driver: I'm running 5 minutes late",
      time: "15 minutes ago",
      read: false,
      icon: Bell,
      rideId: "ride-456",
      actionUrl: "/rides/ride-456/chat"
    },
    {
      id: 3,
      type: "ride_completed",
      title: "Ride completed",
      message: "Your ride to Airport has been completed",
      time: "2 hours ago",
      read: true,
      icon: History,
      rideId: "ride-789",
      actionUrl: "/history"
    }
  ]);

  const handleNotificationClick = (notification: any) => {
    // Mark notification as read
    setNotificationsList(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate based on notification type using window.location
    if (notification.type === "ride_request") {
      // For ride requests, show a simple alert and go to home for now
      alert(`Ride request from Sarah! You can communicate with them through the ride details.`);
      window.location.href = "/";
    } else if (notification.type === "message") {
      // For messages, show alert and go to messages
      alert(`New message from your ride partner! Check your ride messages.`);
      window.location.href = "/messages";
    } else if (notification.type === "ride_completed") {
      // For completed rides, go to ride history
      window.location.href = "/history";
    } else {
      // Default: go to home
      window.location.href = "/";
    }
  };

  // Check if user is admin
  const isAdmin = user?.email === "admin@oneroute.com" || user?.id === "admin";

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/history", icon: History, label: "History" },
    { path: "/profile", icon: UserIcon, label: "Profile" },
    ...(isAdmin ? [{ path: "/admin", icon: Settings, label: "Admin" }] : []),
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/one-route-logo.png" 
                    alt="One Route Logo" 
                    className="h-10 w-10 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  <span className="text-xl font-bold text-sky-600">One Route</span>
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation Items */}
            {!isMobile && (
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive 
                          ? 'text-sky-600 bg-sky-50' 
                          : 'text-gray-600 hover:text-sky-600 hover:bg-sky-50'
                      }`}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            
            {/* User Profile Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="bg-sky-50 hover:bg-sky-100 text-sky-600 p-2 rounded-full"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                    {notifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0 min-w-0">
                        {notifications}
                      </Badge>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700">
                      Mark all read
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px]">
                    {notificationsList.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notificationsList.map((notification) => {
                          const Icon = notification.icon;
                          return (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.read ? 'bg-sky-50 border-l-4 border-l-sky-500' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-full ${
                                  notification.type === 'ride_request' ? 'bg-blue-100 text-blue-600' :
                                  notification.type === 'message' ? 'bg-green-100 text-green-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h5 className="text-sm font-medium text-gray-900 truncate">
                                      {notification.title}
                                    </h5>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-sky-500 rounded-full ml-2" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t bg-gray-50">
                    <Button variant="ghost" size="sm" className="w-full text-sky-600 hover:text-sky-700">
                      View all notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    role="button"
                    aria-label="User menu"
                    tabIndex={0}
                  >
                    <Avatar className="w-8 h-8 border-2 border-sky-500">
                      <AvatarImage src={user?.profileImageUrl || ""} />
                      <AvatarFallback className="bg-sky-100 text-sky-700">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {!isMobile && (
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium text-gray-700">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-yellow-500">⭐</span>
                          <span className="text-xs text-gray-500">{user?.rating || "0.0"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  
                  <Link href="/history">
                    <DropdownMenuItem className="cursor-pointer">
                      <History className="w-4 h-4 mr-2" />
                      Ride History
                    </DropdownMenuItem>
                  </Link>
                  
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                    isActive 
                      ? 'text-sky-600' 
                      : 'text-gray-400 hover:text-sky-600'
                  }`}>
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
