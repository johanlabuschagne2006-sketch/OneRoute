import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { WebSocketManager } from "./websocket";
import { 
  insertRideSchema, 
  insertVehicleSchema, 
  insertRideRequestSchema,
  insertReviewSchema 
} from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// PayPal imports (comment out to prevent errors when no credentials)
// import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const updateData = req.body;
      
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile picture upload routes
  app.post('/api/profile-picture/upload', isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProfilePictureUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting profile picture upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put('/api/profile-picture', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { profilePictureURL } = req.body;

      if (!profilePictureURL) {
        return res.status(400).json({ error: "profilePictureURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeProfilePicturePath(profilePictureURL);

      // Update user profile with new picture path
      const user = await storage.updateUserProfile(userId, { 
        profileImageUrl: objectPath 
      });

      res.json({ user, objectPath });
    } catch (error) {
      console.error("Error setting profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve profile pictures
  app.get("/profile-pictures/:picturePath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getProfilePictureFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving profile picture:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Vehicle routes
  app.post('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        userId
      });
      
      const vehicle = await storage.createVehicle(vehicleData);
      res.json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create vehicle" });
      }
    }
  });

  app.get('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const vehicles = await storage.getUserVehicles(userId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.put('/api/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const vehicleId = req.params.id;
      const updateData = req.body;
      
      const vehicle = await storage.updateVehicle(vehicleId, updateData);
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete('/api/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const vehicleId = req.params.id;
      await storage.deleteVehicle(vehicleId);
      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Ride routes
  app.post('/api/rides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const rideData = insertRideSchema.parse({
        ...req.body,
        driverId: userId
      });
      
      const ride = await storage.createRide(rideData);
      res.json(ride);
    } catch (error) {
      console.error("Error creating ride:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ride data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ride" });
      }
    }
  });

  app.get('/api/rides/search', async (req, res) => {
    try {
      const { origin, destination, date, minSeats } = req.query;
      
      const filters: any = {};
      if (origin) filters.origin = origin as string;
      if (destination) filters.destination = destination as string;
      if (date) filters.date = new Date(date as string);
      if (minSeats) filters.minSeats = parseInt(minSeats as string);
      
      const rides = await storage.searchRides(filters);
      res.json(rides);
    } catch (error) {
      console.error("Error searching rides:", error);
      res.status(500).json({ message: "Failed to search rides" });
    }
  });

  app.get('/api/rides/:id', async (req, res) => {
    try {
      const rideId = req.params.id;
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      res.json(ride);
    } catch (error) {
      console.error("Error fetching ride:", error);
      res.status(500).json({ message: "Failed to fetch ride" });
    }
  });

  app.get('/api/rides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { type = 'driver' } = req.query;
      
      const rides = await storage.getUserRides(userId, type as 'driver' | 'passenger');
      res.json(rides);
    } catch (error) {
      console.error("Error fetching user rides:", error);
      res.status(500).json({ message: "Failed to fetch rides" });
    }
  });

  app.put('/api/rides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rideId = req.params.id;
      const updateData = req.body;
      
      const ride = await storage.updateRide(rideId, updateData);
      res.json(ride);
    } catch (error) {
      console.error("Error updating ride:", error);
      res.status(500).json({ message: "Failed to update ride" });
    }
  });

  app.delete('/api/rides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rideId = req.params.id;
      await storage.deleteRide(rideId);
      res.json({ message: "Ride deleted successfully" });
    } catch (error) {
      console.error("Error deleting ride:", error);
      res.status(500).json({ message: "Failed to delete ride" });
    }
  });

  // Ride request routes
  app.post('/api/ride-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const requestData = insertRideRequestSchema.parse({
        ...req.body,
        passengerId: userId
      });
      
      const request = await storage.createRideRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating ride request:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ride request" });
      }
    }
  });

  app.get('/api/ride-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { rideId } = req.query;
      
      let requests;
      if (rideId) {
        requests = await storage.getRideRequests(rideId as string);
      } else {
        requests = await storage.getUserRideRequests(userId);
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching ride requests:", error);
      res.status(500).json({ message: "Failed to fetch ride requests" });
    }
  });

  app.put('/api/ride-requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = req.params.id;
      const { status } = req.body;
      
      const request = await storage.updateRideRequestStatus(requestId, status);
      res.json(request);
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Review routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: userId
      });
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid review data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create review" });
      }
    }
  });

  app.get('/api/reviews/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // OTP Verification Routes
  app.post("/api/auth/send-otp", isAuthenticated, async (req: any, res) => {
    try {
      const { phone } = req.body;
      const userId = (req.user as any).claims.sub;
      
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Update user with OTP
      await storage.updateUserOTP(userId, otpCode, otpExpiry);
      
      // In production, send SMS via Twilio/similar service
      console.log(`OTP for ${phone}: ${otpCode}`);
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", isAuthenticated, async (req: any, res) => {
    try {
      const { phone, otp } = req.body;
      const userId = (req.user as any).claims.sub;
      
      const user = await storage.getUser(userId);
      if (!user || user.otpCode !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Mark phone as verified
      await storage.verifyUserPhone(userId, phone);
      
      res.json({ message: "Phone verified successfully" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Emergency Alert Routes
  app.post("/api/emergency/alert", isAuthenticated, async (req: any, res) => {
    try {
      const { rideId, alertType, location, message } = req.body;
      const userId = (req.user as any).claims.sub;
      
      const alert = await storage.createEmergencyAlert({
        userId,
        rideId,
        alertType,
        location,
        message,
      });
      
      // In production, notify emergency services and contacts
      console.log(`Emergency alert from user ${userId}:`, alert);
      
      res.json(alert);
    } catch (error) {
      console.error("Error creating emergency alert:", error);
      res.status(500).json({ message: "Failed to create emergency alert" });
    }
  });

  // Chat Routes
  app.get("/api/chat/:rideId", isAuthenticated, async (req: any, res) => {
    try {
      const { rideId } = req.params;
      const messages = await storage.getRideMessages(rideId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/:rideId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { rideId } = req.params;
      const { message, messageType = "text" } = req.body;
      const senderId = (req.user as any).claims.sub;
      
      const chatMessage = await storage.createChatMessage({
        rideId,
        senderId,
        message,
        messageType,
      });
      
      res.json(chatMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ID Verification Routes
  app.post("/api/verify/upload", isAuthenticated, async (req: any, res) => {
    try {
      const { documentType, documentUrl } = req.body;
      const userId = (req.user as any).claims.sub;
      
      const verification = await storage.createIdVerification({
        userId,
        documentType,
        documentUrl,
        status: "pending"
      });
      
      res.json(verification);
    } catch (error) {
      console.error("Error uploading ID verification:", error);
      res.status(500).json({ message: "Failed to upload verification" });
    }
  });

  app.get("/api/verify/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const verifications = await storage.getUserIdVerifications(userId);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      // Note: In production, add admin role checking
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:userId/suspend", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { suspended } = req.body;
      
      const user = await storage.suspendUser(userId, suspended);
      res.json(user);
    } catch (error) {
      console.error("Error updating user suspension:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/admin/verifications", isAuthenticated, async (req: any, res) => {
    try {
      const verifications = await storage.getPendingIdVerifications();
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.put("/api/admin/verifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      const reviewerId = (req.user as any).claims.sub;
      
      const verification = await storage.updateIdVerificationStatus(id, status, reviewNotes, reviewerId);
      res.json(verification);
    } catch (error) {
      console.error("Error updating verification:", error);
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  app.get("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = (req.user as any).claims.sub;
      const settings = await storage.getAdminSettings(adminId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = (req.user as any).claims.sub;
      const settingsData = req.body;
      
      const settings = await storage.createAdminSettings({
        adminId,
        ...settingsData
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error creating admin settings:", error);
      res.status(500).json({ message: "Failed to create settings" });
    }
  });

  app.put("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = (req.user as any).claims.sub;
      const settingsData = req.body;
      
      const settings = await storage.updateAdminSettings(adminId, settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // PayPal Payment Routes
  app.get("/paypal/setup", async (req, res) => {
    try {
      // Mock implementation until PayPal keys are provided
      res.json({
        clientToken: "mock_client_token",
        message: "PayPal integration pending - need PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"
      });
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(500).json({ error: "PayPal setup failed" });
    }
  });

  app.post("/paypal/order", async (req, res) => {
    try {
      const { amount, currency = "USD", intent = "CAPTURE" } = req.body;
      
      // Mock implementation until PayPal keys are provided
      res.json({
        id: "mock_order_" + Date.now(),
        status: "CREATED",
        message: "PayPal integration pending - need PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"
      });
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    try {
      const { orderID } = req.params;
      
      // Mock implementation until PayPal keys are provided
      res.json({
        id: orderID,
        status: "COMPLETED",
        message: "PayPal integration pending - need PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"
      });
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ error: "Failed to capture PayPal order" });
    }
  });

  app.get("/api/payment/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const transactions = await storage.getPaymentTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // PayPal routes (demo mode - requires API credentials)
  app.get("/paypal/setup", async (req, res) => {
    res.json({ 
      clientToken: "demo_token_requires_paypal_credentials",
      message: "Demo mode - add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to process real payments"
    });
  });

  app.post("/paypal/order", async (req, res) => {
    res.json({ 
      id: "demo_order_id",
      message: "Demo mode - add PayPal credentials for real payment processing"
    });
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    res.json({ 
      status: "COMPLETED",
      message: "Demo mode - payment would be processed with real PayPal credentials"
    });
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time features
  const wsManager = new WebSocketManager(httpServer);
  
  // Add WebSocket manager to routes for notifications
  app.locals.wsManager = wsManager;
  
  return httpServer;
}

