import {
  users,
  vehicles,
  rides,
  rideRequests,
  reviews,
  chatMessages,
  emergencyAlerts,
  idVerifications,
  adminSettings,
  paymentTransactions,
  type User,
  type UpsertUser,
  type Vehicle,
  type InsertVehicle,
  type Ride,
  type InsertRide,
  type RideRequest,
  type InsertRideRequest,
  type Review,
  type InsertReview,
  type ChatMessage,
  type InsertChatMessage,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type IdVerification,
  type InsertIdVerification,
  type InsertAdminSettings,
  type AdminSettings,
  type RideWithDetails,
  type RideRequestWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, ne, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  
  // Vehicle operations
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getUserVehicles(userId: string): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  
  // Ride operations
  createRide(ride: InsertRide): Promise<Ride>;
  getRide(id: string): Promise<RideWithDetails | undefined>;
  searchRides(filters: {
    origin?: string;
    destination?: string;
    date?: Date;
    minSeats?: number;
  }): Promise<RideWithDetails[]>;
  getUserRides(userId: string, type: 'driver' | 'passenger'): Promise<RideWithDetails[]>;
  updateRide(id: string, data: Partial<Ride>): Promise<Ride>;
  deleteRide(id: string): Promise<void>;
  
  // Ride request operations
  createRideRequest(request: InsertRideRequest): Promise<RideRequest>;
  getRideRequest(id: string): Promise<RideRequestWithDetails | undefined>;
  getRideRequests(rideId: string): Promise<RideRequestWithDetails[]>;
  getUserRideRequests(userId: string): Promise<RideRequestWithDetails[]>;
  updateRideRequestStatus(id: string, status: string): Promise<RideRequest>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getRideReviews(rideId: string): Promise<Review[]>;
  getUserReviews(userId: string): Promise<Review[]>;
  
  // Advanced features
  updateUserOTP(id: string, otpCode: string, otpExpiry: Date): Promise<User>;
  
  // Payment operations
  processPayment(payment: {
    userId: string;
    rideId: string;
    amount: number;
    paymentMethod: string;
    status: string;
  }): Promise<any>;
  verifyUserPhone(id: string, phone: string): Promise<User>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getRideMessages(rideId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(rideId: string, userId: string): Promise<void>;
  
  // Emergency alert operations
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getEmergencyAlerts(userId?: string): Promise<EmergencyAlert[]>;
  updateEmergencyAlert(id: string, data: Partial<EmergencyAlert>): Promise<EmergencyAlert>;
  
  // ID verification operations
  createIdVerification(verification: InsertIdVerification): Promise<IdVerification>;
  getUserIdVerifications(userId: string): Promise<IdVerification[]>;
  getIdVerifications(userId: string): Promise<IdVerification[]>;
  updateIdVerificationStatus(id: string, status: string, reviewNotes?: string, reviewedBy?: string): Promise<IdVerification>;
  getPendingIdVerifications(): Promise<IdVerification[]>;
  
  // Admin operations
  createAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings>;
  getAdminSettings(adminId: string): Promise<AdminSettings | undefined>;
  updateAdminSettings(adminId: string, data: Partial<AdminSettings>): Promise<AdminSettings>;
  getAllUsers(): Promise<User[]>;
  suspendUser(userId: string, suspended: boolean): Promise<User>;
  
  // Payment operations
  createPaymentTransaction(transaction: any): Promise<any>;
  updatePaymentTransaction(id: string, data: any): Promise<any>;
  getPaymentTransactions(userId?: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Vehicle operations
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle as any).returning();
    return newVehicle;
  }

  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.userId, userId));
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // Ride operations
  async createRide(ride: InsertRide): Promise<Ride> {
    const [newRide] = await db.insert(rides).values(ride as any).returning();
    return newRide;
  }

  async getRide(id: string): Promise<RideWithDetails | undefined> {
    const result = await db
      .select()
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.id))
      .leftJoin(vehicles, eq(rides.vehicleId, vehicles.id))
      .where(eq(rides.id, id));

    if (result.length === 0) return undefined;

    const ride = result[0].rides;
    const driver = result[0].users!;
    const vehicle = result[0].vehicles!;

    // Get ride requests
    const requestsResult = await db
      .select()
      .from(rideRequests)
      .leftJoin(users, eq(rideRequests.passengerId, users.id))
      .where(eq(rideRequests.rideId, id));

    const requests = requestsResult.map(r => ({
      ...r.ride_requests,
      passenger: r.users!,
    }));

    return {
      ...ride,
      driver,
      vehicle,
      requests,
    };
  }

  async searchRides(filters: {
    origin?: string;
    destination?: string;
    date?: Date;
    minSeats?: number;
  }): Promise<RideWithDetails[]> {
    let query = db
      .select()
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.id))
      .leftJoin(vehicles, eq(rides.vehicleId, vehicles.id))
      .where(eq(rides.status, 'active'));

    // Apply filters
    const conditions = [eq(rides.status, 'active')];

    if (filters.origin) {
      conditions.push(eq(rides.origin, filters.origin));
    }
    
    if (filters.destination) {
      conditions.push(eq(rides.destination, filters.destination));
    }
    
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push(
        and(
          gte(rides.departureDate, startOfDay),
          lte(rides.departureDate, endOfDay)
        )!
      );
    }
    
    if (filters.minSeats) {
      conditions.push(gte(rides.availableSeats, filters.minSeats));
    }

    const finalQuery = db
      .select()
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.id))
      .leftJoin(vehicles, eq(rides.vehicleId, vehicles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(rides.departureDate));

    const result = await finalQuery;

    const ridesWithDetails: RideWithDetails[] = [];
    
    for (const row of result) {
      const ride = row.rides;
      const driver = row.users!;
      const vehicle = row.vehicles!;

      // Get ride requests for each ride
      const requestsResult = await db
        .select()
        .from(rideRequests)
        .leftJoin(users, eq(rideRequests.passengerId, users.id))
        .where(eq(rideRequests.rideId, ride.id));

      const requests = requestsResult.map(r => ({
        ...r.ride_requests,
        passenger: r.users!,
      }));

      ridesWithDetails.push({
        ...ride,
        driver,
        vehicle,
        requests,
      });
    }

    return ridesWithDetails;
  }

  async getUserRides(userId: string, type: 'driver' | 'passenger'): Promise<RideWithDetails[]> {
    if (type === 'driver') {
      const result = await db
        .select()
        .from(rides)
        .leftJoin(users, eq(rides.driverId, users.id))
        .leftJoin(vehicles, eq(rides.vehicleId, vehicles.id))
        .where(eq(rides.driverId, userId))
        .orderBy(desc(rides.createdAt));

      const ridesWithDetails: RideWithDetails[] = [];
      
      for (const row of result) {
        const ride = row.rides;
        const driver = row.users!;
        const vehicle = row.vehicles!;

        const requestsResult = await db
          .select()
          .from(rideRequests)
          .leftJoin(users, eq(rideRequests.passengerId, users.id))
          .where(eq(rideRequests.rideId, ride.id));

        const requests = requestsResult.map(r => ({
          ...r.ride_requests,
          passenger: r.users!,
        }));

        ridesWithDetails.push({
          ...ride,
          driver,
          vehicle,
          requests,
        });
      }

      return ridesWithDetails;
    } else {
      // Get rides where user has requests
      const result = await db
        .select()
        .from(rideRequests)
        .leftJoin(rides, eq(rideRequests.rideId, rides.id))
        .leftJoin(users, eq(rides.driverId, users.id))
        .leftJoin(vehicles, eq(rides.vehicleId, vehicles.id))
        .where(eq(rideRequests.passengerId, userId))
        .orderBy(desc(rideRequests.createdAt));

      const ridesWithDetails: RideWithDetails[] = [];
      
      for (const row of result) {
        if (!row.rides) continue;
        
        const ride = row.rides;
        const driver = row.users!;
        const vehicle = row.vehicles!;

        const requestsResult = await db
          .select()
          .from(rideRequests)
          .leftJoin(users, eq(rideRequests.passengerId, users.id))
          .where(eq(rideRequests.rideId, ride.id));

        const requests = requestsResult.map(r => ({
          ...r.ride_requests,
          passenger: r.users!,
        }));

        ridesWithDetails.push({
          ...ride,
          driver,
          vehicle,
          requests,
        });
      }

      return ridesWithDetails;
    }
  }

  async updateRide(id: string, data: Partial<Ride>): Promise<Ride> {
    const [ride] = await db
      .update(rides)
      .set(data)
      .where(eq(rides.id, id))
      .returning();
    return ride;
  }

  async deleteRide(id: string): Promise<void> {
    await db.delete(rides).where(eq(rides.id, id));
  }

  // Ride request operations
  async createRideRequest(request: InsertRideRequest): Promise<RideRequest> {
    const [newRequest] = await db.insert(rideRequests).values(request as any).returning();
    return newRequest;
  }

  async getRideRequest(id: string): Promise<RideRequestWithDetails | undefined> {
    const result = await db
      .select()
      .from(rideRequests)
      .leftJoin(rides, eq(rideRequests.rideId, rides.id))
      .leftJoin(users, eq(rideRequests.passengerId, users.id))
      .where(eq(rideRequests.id, id));

    if (result.length === 0) return undefined;

    const request = result[0].ride_requests;
    const ride = result[0].rides!;
    const passenger = result[0].users!;

    // Get full ride details
    const rideDetails = await this.getRide(ride.id);
    
    return {
      ...request,
      ride: rideDetails!,
      passenger,
    };
  }

  async getRideRequests(rideId: string): Promise<RideRequestWithDetails[]> {
    const result = await db
      .select()
      .from(rideRequests)
      .leftJoin(users, eq(rideRequests.passengerId, users.id))
      .where(eq(rideRequests.rideId, rideId))
      .orderBy(desc(rideRequests.createdAt));

    const requestsWithDetails: RideRequestWithDetails[] = [];
    
    for (const row of result) {
      const request = row.ride_requests;
      const passenger = row.users!;
      const rideDetails = await this.getRide(rideId);

      requestsWithDetails.push({
        ...request,
        ride: rideDetails!,
        passenger,
      });
    }

    return requestsWithDetails;
  }

  async getUserRideRequests(userId: string): Promise<RideRequestWithDetails[]> {
    const result = await db
      .select()
      .from(rideRequests)
      .leftJoin(users, eq(rideRequests.passengerId, users.id))
      .where(eq(rideRequests.passengerId, userId))
      .orderBy(desc(rideRequests.createdAt));

    const requestsWithDetails: RideRequestWithDetails[] = [];
    
    for (const row of result) {
      const request = row.ride_requests;
      const passenger = row.users!;
      const rideDetails = await this.getRide(request.rideId);

      requestsWithDetails.push({
        ...request,
        ride: rideDetails!,
        passenger,
      });
    }

    return requestsWithDetails;
  }

  async updateRideRequestStatus(id: string, status: string): Promise<RideRequest> {
    const [request] = await db
      .update(rideRequests)
      .set({ status } as any)
      .where(eq(rideRequests.id, id))
      .returning();
    return request;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review as any).returning();
    return newReview;
  }

  async getRideReviews(rideId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.rideId, rideId));
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  // Advanced features implementation
  async updateUserOTP(id: string, otpCode: string, otpExpiry: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ otpCode, otpExpiry, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyUserPhone(id: string, phone: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        phone, 
        phoneVerified: true, 
        otpCode: null, 
        otpExpiry: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message as any).returning();
    return newMessage;
  }

  async getChatMessages(rideId: string): Promise<ChatMessage[]> {
    const result = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.rideId, rideId))
      .orderBy(asc(chatMessages.createdAt));

    return result.map(row => ({
      ...row.chat_messages,
      sender: row.users!,
    })) as any;
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [newAlert] = await db.insert(emergencyAlerts).values(alert as any).returning();
    return newAlert;
  }

  async getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts)
      .where(eq(emergencyAlerts.userId, userId))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async createIdVerification(verification: InsertIdVerification): Promise<IdVerification> {
    const [newVerification] = await db.insert(idVerifications).values(verification as any).returning();
    return newVerification;
  }

  async getIdVerifications(userId: string): Promise<IdVerification[]> {
    return await db.select().from(idVerifications)
      .where(eq(idVerifications.userId, userId))
      .orderBy(desc(idVerifications.createdAt));
  }

  async getUserIdVerifications(userId: string): Promise<IdVerification[]> {
    return this.getIdVerifications(userId);
  }

  async getPendingIdVerifications(): Promise<IdVerification[]> {
    return await db.select().from(idVerifications)
      .where(eq(idVerifications.status, 'pending'))
      .orderBy(desc(idVerifications.createdAt));
  }

  async updateIdVerificationStatus(id: string, status: string, reviewNotes?: string, reviewedBy?: string): Promise<IdVerification> {
    const [verification] = await db
      .update(idVerifications)
      .set({ 
        reviewNotes,
        reviewedBy: reviewedBy || null,
        reviewedAt: new Date()
      } as any)
      .where(eq(idVerifications.id, id))
      .returning();
    return verification;
  }

  // Admin methods implementation
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async suspendUser(userId: string, suspended: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ suspended })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllRides(): Promise<RideWithDetails[]> {
    const result = await db
      .select()
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.id))
      .leftJoin(vehicles, eq(rides.vehicleId, vehicles.id))
      .orderBy(desc(rides.createdAt));

    return result.map(row => ({
      ...row.rides,
      driver: row.users!,
      vehicle: row.vehicles!,
      requests: [], // Simplified for admin view
    })) as RideWithDetails[];
  }

  async getAllEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts)
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async getAllIdVerifications(): Promise<IdVerification[]> {
    const result = await db
      .select()
      .from(idVerifications)
      .leftJoin(users, eq(idVerifications.userId, users.id))
      .orderBy(desc(idVerifications.createdAt));

    return result.map(row => ({
      ...row.id_verifications,
      user: row.users!,
    })) as any;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getNewUsersCount(days: number): Promise<number> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, dateThreshold));
    
    return result[0].count;
  }

  async getActiveRidesCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(rides)
      .where(eq(rides.status, 'active'));
    
    return result[0].count;
  }

  async getCompletedRidesCount(days: number): Promise<number> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(rides)
      .where(and(
        eq(rides.status, 'completed'),
        gte(rides.createdAt, dateThreshold)
      ));
    
    return result[0].count;
  }

  async updateUserSuspension(id: string, suspended: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ suspended, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Admin settings implementation
  async getAdminSettings(adminId: string): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings)
      .where(eq(adminSettings.adminId, adminId));
    return settings;
  }

  async createAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings> {
    const [newSettings] = await db.insert(adminSettings).values(settings as any).returning();
    return newSettings;
  }

  async updateAdminSettings(adminId: string, settingsData: Partial<InsertAdminSettings>): Promise<AdminSettings> {
    const [updatedSettings] = await db
      .update(adminSettings)
      .set({ ...settingsData } as any)
      .where(eq(adminSettings.adminId, adminId))
      .returning();
    return updatedSettings;
  }

  // Payment operations
  async getPaymentTransactions(userId?: string): Promise<any[]> {
    // Mock implementation for credit-based system
    return [];
  }

  async createPaymentTransaction(transaction: any): Promise<any> {
    // Mock implementation for credit-based system
    return { id: "tx_" + Date.now(), ...transaction };
  }

  async updatePaymentTransaction(id: string, data: any): Promise<any> {
    // Mock implementation for credit-based system
    return { id, ...data };
  }

  // Credit-based payment processing
  async processPayment(payment: {
    userId: string;
    rideId: string;
    amount: number;
    paymentMethod: string;
    status: string;
  }): Promise<any> {
    // In a real app, this would deduct credits from user's balance
    // and create a transaction record
    return {
      id: "payment_" + Date.now(),
      ...payment,
      createdAt: new Date().toISOString()
    };
  }

  // Missing chat operations
  async getRideMessages(rideId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.rideId, rideId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async markMessagesAsRead(rideId: string, userId: string): Promise<void> {
    // Mock implementation - in real app would update read status
  }

  // Missing emergency operations
  async updateEmergencyAlert(id: string, data: Partial<EmergencyAlert>): Promise<EmergencyAlert> {
    const [alert] = await db
      .update(emergencyAlerts)
      .set(data)
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return alert;
  }
}

export const storage = new DatabaseStorage();
