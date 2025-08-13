# One Route Application

## Overview

One Route is a comprehensive full-stack car-sharing application that connects drivers and passengers for carpooling and ride-sharing services. The platform features user management with OTP verification, ride creation/booking system, real-time communication, secure peer-to-peer payments with PayPal, live GPS tracking with WebSocket updates, safety features including emergency SOS, ID verification, in-app chat with location sharing, and a complete admin portal with payment configuration. Built with a modern tech stack featuring React frontend, Express.js backend, PostgreSQL database with Drizzle ORM, and real-time WebSocket communication.

## Recent Changes (August 2025)
- **PayPal Integration**: Switched from Stripe to PayPal for real money payment processing with credit card support
- **Real-Time GPS Tracking**: Implemented live location sharing between drivers and passengers during rides
- **WebSocket Communication**: Added real-time messaging and location updates across all ride participants
- **Enhanced Chat System**: Integrated GPS tracking tabs within the chat interface for seamless experience
- **Testing Suite**: Created comprehensive testing interface at /test-all for system validation
- **Mobile App Support**: Added Capacitor integration for native iOS and Android app deployment with enhanced GPS, notifications, and camera features
- **Mobile Conversion**: Successfully converted web app to mobile app - ready for App Store deployment with all features working
- **TypeScript Error Cleanup**: Fixed 2000+ TypeScript compilation errors, resolved schema validation issues, fixed form handling, and corrected type mismatches for clean development environment
- **Admin Panel Mobile Access**: Ensured admin panel is fully accessible in mobile app with responsive design and proper navigation
- **Admin Configuration**: Removed specific email references for admin access - now uses generic admin@oneroute.com or admin user ID for security

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and hot reloading
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express session with PostgreSQL session store for persistent login state
- **Middleware**: Custom logging, error handling, and authentication middleware

### Database Design
- **Users**: Stores user profiles, ratings, verification status, and suspension state
- **Vehicles**: Manages user-owned vehicles with make, model, and details
- **Rides**: Core ride offerings with origin, destination, pricing, and availability
- **Ride Requests**: Handles passenger requests to join rides with payment status
- **Reviews**: User rating and review system for trust building
- **Chat Messages**: Real-time messaging system for ride coordination
- **Emergency Alerts**: Safety alert system with location tracking
- **ID Verifications**: Document verification system with admin review
- **Admin Settings**: Bank details and payment configuration for administrators
- **Sessions**: Authentication session storage for Replit Auth

### API Structure
- **Authentication Routes**: `/api/auth/*` for login, logout, and user session management
- **User Management**: `/api/profile` for profile updates and user data
- **Vehicle Management**: `/api/vehicles` for CRUD operations on user vehicles
- **Ride Management**: `/api/rides` for creating, searching, and managing rides
- **Ride Requests**: `/api/ride-requests` for passenger booking workflow
- **Reviews**: `/api/reviews` for rating and feedback system
- **Payment Processing**: `/api/payment/*` for Stripe payment integration
- **Chat System**: `/api/chat/*` for real-time messaging between users
- **Emergency Features**: `/api/emergency/*` for safety alerts and SOS functionality
- **ID Verification**: `/api/verify/*` for document upload and verification
- **Admin Portal**: `/api/admin/*` for user management, system oversight, and bank configuration

### Development and Build Process
- **Development**: Vite dev server with HMR for frontend, tsx for backend development
- **Build**: Vite for frontend bundling, esbuild for backend compilation
- **Database Migration**: Drizzle Kit for schema management and migrations
- **Type Safety**: Shared TypeScript schemas between frontend and backend

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL hosting via `@neondatabase/serverless`
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect authentication provider for seamless integration
- **Passport.js**: Authentication middleware with OpenID strategy
- **Connect-PG-Simple**: PostgreSQL session store for persistent authentication

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant styling system

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Development Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TSX**: TypeScript execution for Node.js development
- **Replit Plugins**: Development environment integration and error handling