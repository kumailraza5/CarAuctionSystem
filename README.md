# Vehicle Sale and Purchase Platform with Online Auction System

A full-stack web marketplace for buying and selling vehicles with real-time online auctions, role-based access control, administrative listing approval, and an automated notification system.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Test Accounts](#test-accounts)
- [API Overview](#api-overview)
- [Dependencies](#dependencies)

---

## Project Overview

This platform provides a unified environment where:

- **Sellers** can list vehicles for sale or create timed auctions
- **Buyers** can browse listings, place bids, and purchase vehicles instantly via Buy Now
- **Admins** can approve/reject listings, manage users, and monitor platform statistics

---

## Features

- JWT-based authentication with role-based access (Buyer / Seller / Admin)
- Vehicle listing management with admin approval workflow
- Real-time auction system with countdown timers and live bid history
- Competitive bidding with validation (each bid must exceed the current highest)
- Buy Now instant purchase option
- Automated notifications (outbid, auction won, listing approved/rejected)
- Admin panel with user management and platform-wide statistics
- Fully responsive UI with dark cockpit-style design theme

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React | 19.x |
| **Frontend Build** | Vite | 6.x |
| **Frontend Styling** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI + Shadcn/ui | Latest |
| **State Management** | TanStack React Query | 5.x |
| **Routing** | Wouter | 3.x |
| **Forms** | React Hook Form + Zod | Latest |
| **Animations** | Framer Motion | Latest |
| **Backend** | Node.js + Express 5 | Express 5.x |
| **Language** | TypeScript | 5.9.x |
| **Database** | PostgreSQL | 14+ |
| **ORM** | Drizzle ORM | Latest |
| **Authentication** | JSON Web Token (JWT) | 9.x |
| **Password Hashing** | bcryptjs | 3.x |
| **API Spec** | OpenAPI 3.0 (YAML) | — |
| **API Codegen** | Orval | Latest |
| **Logger** | Pino + pino-http | 9.x / 10.x |
| **Package Manager** | pnpm (workspace monorepo) | 10.x |
| **Runtime** | Node.js | 24.x |

---

## Project Structure

```
workspace/
├── artifacts/
│   ├── api-server/              # Express 5 REST API backend
│   │   ├── src/
│   │   │   ├── index.ts         # Server entry point
│   │   │   ├── app.ts           # Express app setup & middleware
│   │   │   ├── middlewares/
│   │   │   │   └── auth.ts      # JWT auth & role guards
│   │   │   └── routes/
│   │   │       ├── auth.ts
│   │   │       ├── users.ts
│   │   │       ├── vehicles.ts
│   │   │       ├── auctions.ts
│   │   │       ├── admin.ts
│   │   │       ├── notifications.ts
│   │   │       └── dashboard.ts
│   │   └── package.json
│   │
│   └── vehicle-platform/        # React + Vite frontend
│       ├── src/
│       │   ├── App.tsx           # Root component & router
│       │   ├── contexts/
│       │   │   └── AuthContext.tsx
│       │   ├── pages/            # All page components
│       │   └── components/       # Reusable UI components
│       ├── index.html
│       └── package.json
│
├── lib/
│   ├── api-spec/                # OpenAPI specification
│   │   └── openapi.yaml
│   ├── api-client-react/        # Auto-generated React Query hooks
│   ├── api-zod/                 # Auto-generated Zod validation schemas
│   └── db/                      # Database schema & connection
│       └── src/
│           └── schema/
│               ├── users.ts
│               ├── vehicles.ts
│               ├── auctions.ts
│               ├── bids.ts
│               └── notifications.ts
│
├── scripts/
│   └── src/
│       └── seed.ts              # Database seed script
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Prerequisites

Make sure you have the following installed on your system before proceeding:

| Tool | Minimum Version | Download |
|---|---|---|
| **Node.js** | 20.x or higher | https://nodejs.org |
| **pnpm** | 9.x or higher | https://pnpm.io/installation |
| **PostgreSQL** | 14.x or higher | https://www.postgresql.org/download |
| **Git** | Any recent version | https://git-scm.com |

### Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

---

## Installation & Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/vehicle-auction-platform.git
cd vehicle-auction-platform
```

### Step 2 — Install All Dependencies

This installs dependencies for all packages in the monorepo at once:

```bash
pnpm install
```

### Step 3 — Set Up Environment Variables

Create a `.env` file in the **root** of the project:

```bash
cp .env.example .env
```

Then open `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

### Step 4 — Set Up the Database

Make sure PostgreSQL is running, then create a database:

```bash
psql -U postgres -c "CREATE DATABASE vehicle_auction;"
```

Push the schema to the database:

```bash
pnpm --filter @workspace/db run push
```

### Step 5 — Seed Test Data (Optional)

Populate the database with sample users, vehicles, and auctions:

```bash
pnpm --filter @workspace/scripts run seed
```

### Step 6 — Run the Application

Start both the API server and the frontend in separate terminals:

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/vehicle-platform run dev
```

The app will be available at:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ─── Database ─────────────────────────────────────────────
# Full PostgreSQL connection string
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/vehicle_auction

# ─── Authentication ───────────────────────────────────────
# Secret key used to sign JWT tokens — use a long random string
SESSION_SECRET=your_super_secret_key_here_minimum_32_characters

# ─── Server ───────────────────────────────────────────────
# Port for the API server (default: 3000)
PORT=3000

# ─── Environment ──────────────────────────────────────────
NODE_ENV=development
```

> **Important:** Never commit your `.env` file to version control. Add it to `.gitignore`.

### Generating a Secure SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

The database schema is managed by **Drizzle ORM**. All tables and enums are defined in TypeScript under `lib/db/src/schema/`.

### Push Schema to Database

```bash
pnpm --filter @workspace/db run push
```

### Regenerate API Types (after changing openapi.yaml)

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Database Tables

| Table | Description |
|---|---|
| `users` | User accounts with roles (buyer / seller / admin) |
| `vehicles` | Vehicle listings with approval status |
| `auctions` | Auction events linked to vehicles |
| `bids` | Individual bids per auction per user |
| `notifications` | User notifications for key events |

---

## Running the Application

### Development Mode

```bash
# Run everything (from root)
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/vehicle-platform run dev
```

### Build for Production

```bash
pnpm run build
```

### Run Production Build

```bash
pnpm --filter @workspace/api-server run start
pnpm --filter @workspace/vehicle-platform run serve
```

---

## Test Accounts

After running the seed script, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@autoauction.com | admin123 |
| **Seller** | john@motors.com | seller123 |
| **Buyer** | sarah@email.com | buyer123 |

---

## API Overview

All API routes are prefixed with `/api`.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and receive JWT | Public |
| GET | `/auth/me` | Get current user | Required |
| GET | `/vehicles` | List approved vehicles | Public |
| POST | `/vehicles` | Create vehicle listing | Seller |
| GET | `/vehicles/:id` | Get vehicle details | Public |
| PATCH | `/vehicles/:id` | Update vehicle | Seller/Admin |
| DELETE | `/vehicles/:id` | Delete vehicle | Seller/Admin |
| POST | `/vehicles/:id/buy-now` | Instant purchase | Buyer |
| GET | `/auctions` | List all auctions | Public |
| POST | `/auctions` | Create auction | Seller |
| GET | `/auctions/:id` | Get auction + bids | Public |
| POST | `/auctions/:id/bids` | Place a bid | Buyer |
| GET | `/admin/users` | List all users | Admin |
| PATCH | `/admin/users/:id/role` | Change user role | Admin |
| PATCH | `/admin/vehicles/:id/approve` | Approve listing | Admin |
| PATCH | `/admin/vehicles/:id/reject` | Reject listing | Admin |
| GET | `/admin/stats` | Platform statistics | Admin |
| GET | `/notifications` | Get my notifications | Required |
| PATCH | `/notifications/:id/read` | Mark as read | Required |
| GET | `/dashboard/summary` | Homepage stats | Public |

---

## Dependencies

### Backend (`artifacts/api-server`)

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5 | Web framework |
| `drizzle-orm` | catalog | TypeScript ORM for PostgreSQL |
| `jsonwebtoken` | ^9.0.3 | JWT creation and verification |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `cors` | ^2 | Cross-Origin Resource Sharing |
| `cookie-parser` | ^1.4.7 | Cookie parsing middleware |
| `pino` | ^9 | High-performance JSON logger |
| `pino-http` | ^10 | HTTP request logging |
| `@workspace/db` | workspace | Shared database schema |
| `@workspace/api-zod` | workspace | Auto-generated Zod schemas |

**Dev Dependencies:**

| Package | Purpose |
|---|---|
| `esbuild` | Fast TypeScript/JS bundler |
| `typescript` | TypeScript compiler |
| `@types/express` | Express type definitions |
| `@types/jsonwebtoken` | JWT type definitions |
| `@types/bcryptjs` | bcrypt type definitions |
| `pino-pretty` | Human-readable log formatting |

---

### Frontend (`artifacts/vehicle-platform`)

| Package | Version | Purpose |
|---|---|---|
| `react` | catalog (19.x) | UI library |
| `react-dom` | catalog | React DOM renderer |
| `vite` | catalog | Build tool & dev server |
| `tailwindcss` | catalog | Utility-first CSS framework |
| `@tanstack/react-query` | catalog | Server state management & caching |
| `wouter` | ^3.3.5 | Lightweight client-side router |
| `react-hook-form` | ^7.55.0 | Form state management |
| `zod` | catalog | Schema validation |
| `@hookform/resolvers` | ^3.10.0 | Zod adapter for React Hook Form |
| `framer-motion` | catalog | Animation library |
| `lucide-react` | catalog | Icon library |
| `react-icons` | ^5.4.0 | Extended icon set |
| `date-fns` | ^3.6.0 | Date formatting utilities |
| `recharts` | ^2.15.2 | Chart components |
| `sonner` | ^2.0.7 | Toast notifications |
| `clsx` | catalog | Conditional className utility |
| `tailwind-merge` | catalog | Tailwind class merging |
| `class-variance-authority` | catalog | Component variant management |
| `next-themes` | ^0.4.6 | Dark/light theme switching |
| `cmdk` | ^1.1.1 | Command palette component |
| `vaul` | ^1.1.2 | Drawer component |
| `embla-carousel-react` | ^8.6.0 | Carousel component |
| `react-resizable-panels` | ^2.1.7 | Resizable panel layouts |
| `input-otp` | ^1.4.2 | OTP input component |
| `react-day-picker` | ^9.11.1 | Date picker component |
| `@radix-ui/*` | ^1–2.x | Headless accessible UI primitives |
| `@workspace/api-client-react` | workspace | Auto-generated React Query hooks |

---

### Shared Libraries (`lib/`)

| Package | Purpose |
|---|---|
| `@workspace/db` | Drizzle schema definitions + DB connection |
| `@workspace/api-spec` | OpenAPI YAML spec + Orval codegen config |
| `@workspace/api-client-react` | Auto-generated React Query hooks (from OpenAPI) |
| `@workspace/api-zod` | Auto-generated Zod validation schemas (from OpenAPI) |

---

### Root Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ~5.9.2 | TypeScript compiler (workspace-wide) |
| `prettier` | ^3.8.1 | Code formatter |
| `pnpm` | 10.x | Monorepo package manager |

---

## License

MIT — free to use for academic and commercial purposes.
