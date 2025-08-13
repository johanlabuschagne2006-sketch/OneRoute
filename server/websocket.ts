import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ConnectedUser {
  userId: string;
  socket: WebSocket;
  rideId?: string;
  userType: 'driver' | 'passenger';
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private rideRooms: Map<string, Set<string>> = new Map(); // rideId -> Set of userIds

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket connection');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(ws, message);
        break;
      case 'join_ride':
        this.handleJoinRide(ws, message);
        break;
      case 'location_update':
        this.handleLocationUpdate(ws, message);
        break;
      case 'chat_message':
        this.handleChatMessage(ws, message);
        break;
      case 'emergency_alert':
        this.handleEmergencyAlert(ws, message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleAuth(ws: WebSocket, message: any) {
    const { userId, userType } = message;
    
    const connectedUser: ConnectedUser = {
      userId,
      socket: ws,
      userType
    };
    
    this.connectedUsers.set(userId, connectedUser);
    
    ws.send(JSON.stringify({
      type: 'auth_success',
      userId
    }));
  }

  private handleJoinRide(ws: WebSocket, message: any) {
    const { userId, rideId } = message;
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      user.rideId = rideId;
      
      // Add user to ride room
      if (!this.rideRooms.has(rideId)) {
        this.rideRooms.set(rideId, new Set());
      }
      this.rideRooms.get(rideId)!.add(userId);
      
      // Notify other users in the ride
      this.broadcastToRide(rideId, {
        type: 'user_joined_ride',
        userId,
        userType: user.userType
      }, userId);
    }
  }

  private handleLocationUpdate(ws: WebSocket, message: any) {
    const { userId, rideId, location } = message;
    
    // Broadcast location to all users in the ride
    this.broadcastToRide(rideId, {
      type: 'location_update',
      userId,
      location,
      timestamp: new Date().toISOString()
    }, userId);
  }

  private handleChatMessage(ws: WebSocket, message: any) {
    const { userId, rideId, messageText, messageType = 'text' } = message;
    
    // Broadcast message to all users in the ride
    this.broadcastToRide(rideId, {
      type: 'new_message',
      userId,
      message: messageText,
      messageType,
      timestamp: new Date().toISOString()
    });
  }

  private handleEmergencyAlert(ws: WebSocket, message: any) {
    const { userId, rideId, location, alertType } = message;
    
    // Broadcast emergency alert to all users in the ride
    this.broadcastToRide(rideId, {
      type: 'emergency_alert',
      userId,
      location,
      alertType,
      timestamp: new Date().toISOString()
    });
  }

  private handleDisconnection(ws: WebSocket) {
    // Find and remove disconnected user
    for (const [userId, user] of Array.from(this.connectedUsers.entries())) {
      if (user.socket === ws) {
        // Remove from ride room
        if (user.rideId) {
          const rideRoom = this.rideRooms.get(user.rideId);
          if (rideRoom) {
            rideRoom.delete(userId);
            if (rideRoom.size === 0) {
              this.rideRooms.delete(user.rideId);
            }
          }
          
          // Notify other users in the ride
          this.broadcastToRide(user.rideId, {
            type: 'user_left_ride',
            userId,
            userType: user.userType
          }, userId);
        }
        
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  private broadcastToRide(rideId: string, message: any, excludeUserId?: string) {
    const rideRoom = this.rideRooms.get(rideId);
    if (!rideRoom) return;

    for (const userId of Array.from(rideRoom)) {
      if (excludeUserId && userId === excludeUserId) continue;
      
      const user = this.connectedUsers.get(userId);
      if (user && user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(JSON.stringify(message));
      }
    }
  }

  // Public method to send notifications from server
  public notifyUser(userId: string, message: any) {
    const user = this.connectedUsers.get(userId);
    if (user && user.socket.readyState === WebSocket.OPEN) {
      user.socket.send(JSON.stringify(message));
    }
  }

  public notifyRide(rideId: string, message: any) {
    this.broadcastToRide(rideId, message);
  }
}