# System Architecture & Documentation

## Overview

Vehicle Sale and Purchase Platform with an integrated Online Real-Time Auction System built with TypeScript and pnpm workspaces.

## Technology Stack

- **Monorepo Architecture**: pnpm workspaces
- **Node.js runtime**: Node 20+
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Backend API**: Express 5
- **Database & ORM**: PostgreSQL + Drizzle ORM
- **Authentication**: Supabase Auth / JWT + bcrypt
- **Schema Validation**: Zod, Drizzle-Zod
- **Frontend Framework**: React 19 + Vite + Tailwind CSS
- **State & Data Fetching**: TanStack React Query

## Application Modules & Features

### 1. User Management & Access Control
- Registration and login with role-based clearance: Buyer, Seller, Admin
- Profile management and role-specific UI flows

### 2. Vehicle Marketplace (Direct Sale)
- Sellers can create, update, and manage vehicle listings with multiple photos, specifications, condition, and pricing
- Admin review & approval workflow for listings
- Instant direct purchase ("Buy Now") functionality
- Real-time direct chat between buyers and sellers on vehicle listings

### 3. Online Auction System
- Dedicated vehicle auction lifecycle (Upcoming, Active, Ended)
- Real-time bidding engine with dynamic price increment validation
- Bid history tracking and live countdown timers

### 4. Admin Management Console
- User role management and account verification
- Vehicle listing moderation (approval/rejection)
- Real-time platform analytics, statistics, and transaction oversight

### 5. Notification & History Center
- Real-time alerts for outbids, won auctions, listing approvals, and status updates
- User purchase history and active transaction dashboard

## Project Directory Structure

```text
Vehicle-Sale-Hub/
├── artifacts/
│   ├── api-server/         # Express API server (auth, vehicles, auctions, bids, chat)
│   └── vehicle-platform/   # React + Vite frontend application
├── lib/
│   ├── api-spec/           # OpenAPI specifications and codegen
│   ├── api-client-react/   # Generated React Query hooks & API client
│   ├── api-zod/            # Zod validation schemas
│   └── db/                 # Drizzle ORM schema & DB client
│       └── src/schema/
│           ├── users.ts
│           ├── vehicles.ts
│           ├── auctions.ts
│           ├── bids.ts
│           ├── notifications.ts
│           └── listing_messages.ts
├── scripts/                # Database utilities and project tools
└── ...
```

## Database Schema Overview

- `users` — user credentials, roles (buyer/seller/admin), and profile info
- `vehicles` — vehicle inventory with specs, pricing, images, and approval status
- `auctions` — auction instances linked to vehicles with start/end timestamps and reserve prices
- `bids` — immutable bid log per auction per bidder
- `listing_messages` — direct communication channel between buyer and seller per vehicle
- `notifications` — transactional notification inbox for users

## Running Locally

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure your database and authentication keys.

3. **Start Development Servers**:
   ```bash
   pnpm run dev
   ```
