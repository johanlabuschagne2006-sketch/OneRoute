import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  phoneVerified: boolean("phone_verified").default(false),
  otpCode: varchar("otp_code"),
  otpExpiry: timestamp("otp_expires_at"),
  suspended: boolean("suspended").default(false),
  age: integer("age"),
  gender: varchar("gender"),
  address: text("address"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalRides: integer("total_rides").default(0),
  isVerified: boolean("is_verified").default(false),
  idDocumentUrl: varchar("id_document_url"),
  emergencyContact: varchar("emergency_contact"),
  currentLocation: jsonb("current_location"),
  paypalEmail: varchar("paypal_email"), // User's PayPal email for receiving payments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  color: varchar("color").notNull(),
  licensePlate: varchar("license_plate").notNull(),
  seats: integer("seats").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rides table
export const rides = pgTable("rides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  availableSeats: integer("available_seats").notNull(),
  pricePerSeat: decimal("price_per_seat", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("active"), // active, completed, cancelled
  notes: text("notes"),
  currentLocation: jsonb("current_location"),
  estimatedArrival: timestamp("estimated_arrival"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ride requests table
export const rideRequests = pgTable("ride_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").notNull().references(() => rides.id, { onDelete: "cascade" }),
  passengerId: varchar("passenger_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  seatsRequested: integer("seats_requested").notNull().default(1),
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected, cancelled
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").notNull().references(() => rides.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").notNull().references(() => rides.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text"), // text, location, image
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emergency alerts table
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rideId: varchar("ride_id").references(() => rides.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type").notNull(), // sos, breakdown, accident
  location: jsonb("location").notNull(),
  message: text("message"),
  status: varchar("status").default("active"), // active, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// ID verification documents table
export const idVerifications = pgTable("id_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: varchar("document_type").notNull(), // license, passport, national_id
  documentUrl: varchar("document_url").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideRequestId: varchar("ride_request_id").notNull().references(() => rideRequests.id, { onDelete: "cascade" }),
  payerId: varchar("payer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Admin settings table
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paypalEmail: varchar("paypal_email"), // Admin's PayPal email for receiving payments
  paypalClientId: varchar("paypal_client_id"), // Admin's PayPal app client ID
  paypalClientSecret: varchar("paypal_client_secret"), // Admin's PayPal app client secret
  paypalEnvironment: varchar("paypal_environment").default("sandbox"), // sandbox or production
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.10"), // 10% default
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  ridesAsDriver: many(rides),
  rideRequests: many(rideRequests),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
  chatMessages: many(chatMessages),
  emergencyAlerts: many(emergencyAlerts),
  idVerifications: many(idVerifications),
  paymentsSent: many(paymentTransactions, { relationName: "payer" }),
  paymentsReceived: many(paymentTransactions, { relationName: "recipient" }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
  rides: many(rides),
}));

export const ridesRelations = relations(rides, ({ one, many }) => ({
  driver: one(users, {
    fields: [rides.driverId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [rides.vehicleId],
    references: [vehicles.id],
  }),
  requests: many(rideRequests),
  reviews: many(reviews),
  chatMessages: many(chatMessages),
  emergencyAlerts: many(emergencyAlerts),
}));

export const rideRequestsRelations = relations(rideRequests, ({ one }) => ({
  ride: one(rides, {
    fields: [rideRequests.rideId],
    references: [rides.id],
  }),
  passenger: one(users, {
    fields: [rideRequests.passengerId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  ride: one(rides, {
    fields: [reviews.rideId],
    references: [rides.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewee",
  }),
}));

// New relations for advanced features
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  ride: one(rides, {
    fields: [chatMessages.rideId],
    references: [rides.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const emergencyAlertsRelations = relations(emergencyAlerts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyAlerts.userId],
    references: [users.id],
  }),
  ride: one(rides, {
    fields: [emergencyAlerts.rideId],
    references: [rides.id],
  }),
}));

export const idVerificationsRelations = relations(idVerifications, ({ one }) => ({
  user: one(users, {
    fields: [idVerifications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [idVerifications.reviewedBy],
    references: [users.id],
    relationName: "idReviewer",
  }),
}));

// Insert schemas  
export const insertUserSchema = createInsertSchema(users);

export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertRideSchema = createInsertSchema(rides);
export const insertRideRequestSchema = createInsertSchema(rideRequests);
export const insertReviewSchema = createInsertSchema(reviews);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts);
export const insertIdVerificationSchema = createInsertSchema(idVerifications);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;

export type RideRequest = typeof rideRequests.$inferSelect;
export type InsertRideRequest = z.infer<typeof insertRideRequestSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;

export type IdVerification = typeof idVerifications.$inferSelect;



export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions);
export const insertAdminSettingsSchema = createInsertSchema(adminSettings);

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertIdVerification = z.infer<typeof insertIdVerificationSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

// Extended types for API responses
export type RideWithDetails = Ride & {
  driver: User;
  vehicle: Vehicle;
  requests: (RideRequest & { passenger: User })[];
};

export type RideRequestWithDetails = RideRequest & {
  ride: RideWithDetails;
  passenger: User;
};
