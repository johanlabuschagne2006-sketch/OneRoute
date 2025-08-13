import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user } = useAuth() as { user: any };
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with server
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        userType: 'user' // Will be determined by context
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const joinRide = (rideId: string) => {
    sendMessage({
      type: 'join_ride',
      userId: user?.id,
      rideId
    });
  };

  const sendLocationUpdate = (rideId: string, location: LocationData) => {
    sendMessage({
      type: 'location_update',
      userId: user?.id,
      rideId,
      location
    });
  };

  const sendChatMessage = (rideId: string, messageText: string, messageType = 'text') => {
    sendMessage({
      type: 'chat_message',
      userId: user?.id,
      rideId,
      messageText,
      messageType
    });
  };

  const sendEmergencyAlert = (rideId: string, location: LocationData, alertType = 'emergency') => {
    sendMessage({
      type: 'emergency_alert',
      userId: user?.id,
      rideId,
      location,
      alertType
    });
  };

  return {
    isConnected,
    messages,
    sendMessage,
    joinRide,
    sendLocationUpdate,
    sendChatMessage,
    sendEmergencyAlert
  };
}