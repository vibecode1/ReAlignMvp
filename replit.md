# ReAlign - Short Sale Coordination Platform

## Overview

ReAlign is a communication platform designed for short sale coordination with transaction tracking, document management, and role-based access. The application provides a streamlined way for negotiators, sellers, buyers, agents, and escrow officers to collaborate on real estate transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

ReAlign uses a modern React-based frontend with the following key technologies:

- **React**: Core UI library
- **TypeScript**: For type safety
- **TailwindCSS**: For styling with a utility-first approach
- **Shadcn UI**: Component library built on Radix UI primitives
- **React Query**: For data fetching, caching, and state management
- **Wouter**: For client-side routing
- **React Hook Form**: For form handling with Zod validation

The frontend is built using Vite for fast development and optimized production builds.

### Backend

The server is built with:

- **Express.js**: Node.js web framework
- **TypeScript**: For type safety
- **Drizzle ORM**: For database interactions
- **Supabase Auth**: For authentication and magic links
- **PostgreSQL**: For data storage (via Drizzle ORM)

### Authentication

The application uses Supabase for authentication with:

- Traditional email/password login for negotiators
- Magic link authentication for other parties (buyers, sellers, agents)

### Database

The database schema is defined using Drizzle ORM with PostgreSQL. Key entities include:

- Users (with different roles)
- Transactions
- Transaction participants
- Messages
- Documents
- Document requests

## Key Components

### Backend Components

1. **Storage Service**: Centralizes database operations through Drizzle ORM
2. **Auth Controller**: Manages authentication flows
3. **Transaction Controller**: Handles transaction CRUD operations
4. **Message Controller**: Manages communication between parties
5. **Document Controller**: Handles document uploads and requests
6. **Notification Service**: Sends emails and notifications to users

### Frontend Components

1. **Auth Context**: Manages authentication state globally
2. **UI Components**: Built with Shadcn UI for a consistent design system
3. **Page Components**: Dashboard, TransactionList, TransactionView, etc.
4. **Form Components**: Login, magic link, and transaction forms
5. **Feature Components**: Document uploading, messaging, and transaction phase tracking

## Data Flow

1. **Authentication Flow**:
   - Users log in via email/password or magic link
   - JWT tokens are stored and passed with subsequent API requests
   - Auth context manages user state throughout the app

2. **Transaction Management Flow**:
   - Negotiators can create and manage transactions
   - Transactions progress through defined phases
   - Participants are added and notified via email
   - Documents are requested and uploaded through the system

3. **Communication Flow**:
   - All parties can send messages within a transaction
   - Messages are stored in the database and fetched via React Query
   - Real-time updates are managed through polling

## External Dependencies

### Backend Dependencies

- **@neondatabase/serverless**: For PostgreSQL database connections
- **@supabase/supabase-js**: For authentication services
- **drizzle-orm**: For database ORM
- **express**: For HTTP server
- **multer**: For file uploads
- **rate-limit**: For API rate limiting

### Frontend Dependencies

- **@radix-ui**: For accessible UI components
- **@tanstack/react-query**: For data fetching
- **@hookform/resolvers**: For form validation
- **wouter**: For client-side routing
- **clsx/tailwind-merge**: For conditional styling
- **lucide-react**: For icons

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Development Mode**:
   - Run via `npm run dev` which uses `tsx` to execute the server with TypeScript
   - Vite handles hot reloading for the frontend

2. **Production Mode**:
   - Frontend built with Vite
   - Backend compiled with esbuild
   - Server runs with Node.js in production mode

3. **Database**:
   - PostgreSQL database is provisioned through Replit
   - Connection managed via DATABASE_URL environment variable

4. **Environment Variables**:
   - NODE_ENV: For environment detection
   - DATABASE_URL: For database connection
   - SUPABASE_URL and SUPABASE_KEY: For authentication services
   - JWT_SECRET: For token signing

5. **Build Process**:
   - `npm run build`: Compiles both frontend and backend code
   - `npm run start`: Runs the compiled application in production mode

## Development Workflow

1. Start the development server:
   ```
   npm run dev
   ```

2. Make database schema changes in `shared/schema.ts`

3. Apply database changes:
   ```
   npm run db:push
   ```

4. Build for production:
   ```
   npm run build
   ```

5. Start production server:
   ```
   npm run start
   ```