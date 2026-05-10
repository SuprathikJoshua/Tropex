# Tropex

> Real-time multiplayer economic simulation and card trading game — bet on creators, ride the curve, beat the market.

---

## Overview

Tropex is a real-time multiplayer trading platform where players buy and sell **creator cards** whose prices move along a **sigmoid bonding curve** based on live market activity. Think of it as a stock market, but the assets are people — and the price is determined by math, not mood.

Built as a full-stack monorepo with a focus on real-time performance, provably fair pricing, and a clean developer experience.

---

## Tech Stack

### Backend
| Layer | Tech |
|---|---|
| Runtime | Bun |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | Neon (PostgreSQL) |
| Cache / Pub-Sub | Upstash Redis |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |

### Frontend
| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Charts | Recharts |
| Language | TypeScript |

---

## Monorepo Structure

```
tropex/
├── apps/
│   ├── server/          # Express 5 backend (Bun)
│   └── web/             # Next.js 15 frontend
├── packages/
│   └── db/              # Prisma schema + client (shared)
└── package.json
```

---

## Features (V1 — Backend Complete)

### ✅ Authentication
- Supabase Auth integration (email/password)
- JWT verification middleware on all protected routes
- Session handling with Supabase client

### ✅ Cards API
- Full CRUD for creator cards
- Card metadata: name, category, description, image
- Seeded database with initial card set

### ✅ Sigmoid Bonding Curve Pricing Engine
- Price determined by supply via a sigmoid function — early buyers get low prices, late buyers pay a premium
- Built with `decimal.js` for precision arithmetic — no floating point drift
- Price recalculated on every trade

### ✅ Trade API
- Buy and sell endpoints with atomic wallet + holding updates
- Trade validation: balance checks, holding checks, supply checks
- Full trade history stored per user

### ✅ Wallet API
- Per-user wallet with balance tracking
- Debit/credit on trade execution
- Transaction log

### ✅ Portfolio API
- Aggregated holdings per user
- Current value computed from live card prices
- P&L calculation (cost basis vs. current value)

### ✅ Leaderboard API
- Ranked by portfolio value
- Supports pagination

### ✅ Database Seeding
- Seed script for cards, users, and initial balances
- Deterministic — safe to re-run in dev

---

## Pricing Model

Card price is derived from total supply using a sigmoid function:

```
price = P_min + (P_max - P_min) / (1 + e^(-k * (supply - midpoint)))
```

- `P_min` / `P_max` — floor and ceiling price bounds
- `k` — steepness of the curve (controls how fast price rises)
- `midpoint` — supply at which price is halfway between min and max

All arithmetic uses `decimal.js` to prevent precision loss at scale.

---

## API Reference (V1)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns session |
| POST | `/api/auth/logout` | Invalidate session |

### Cards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cards` | List all cards with current prices |
| GET | `/api/cards/:id` | Get single card detail |

### Trade
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/trade/buy` | Buy shares of a card |
| POST | `/api/trade/sell` | Sell shares of a card |
| GET | `/api/trade/history` | Get user's trade history |

### Wallet
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wallet` | Get current balance |
| GET | `/api/wallet/transactions` | Get transaction log |

### Portfolio
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/portfolio` | Get all holdings with current value and P&L |

### Leaderboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leaderboard` | Get top players ranked by portfolio value |

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) >= 1.0
- Node.js >= 18 (for Next.js)
- A [Neon](https://neon.tech) PostgreSQL database
- A [Supabase](https://supabase.com) project (Auth + Realtime)
- An [Upstash](https://upstash.com) Redis instance

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/tropex.git
cd tropex

# Install dependencies
bun install
```

### Environment Variables

Create `.env` files in both `apps/server` and `apps/web`.

**`apps/server/.env`**
```env
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PORT=3001
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Setup

```bash
# Push schema to your Neon database
cd packages/db
bunx prisma db push

# Seed initial data
bun run seed
```

### Development

```bash
# Run both apps concurrently from root
bun run dev
```

Or individually:

```bash
# Backend (runs on :3001)
cd apps/server && bun run dev

# Frontend (runs on :3000)
cd apps/web && bun run dev
```

---

## Roadmap

### V1 — Core Trading *(Backend complete, Frontend in progress)*
- [x] Auth system
- [x] Cards API + pricing engine
- [x] Trade, Wallet, Portfolio, Leaderboard APIs
- [x] Database seeding
- [ ] Cards display page
- [ ] Marketplace page
- [ ] Card detail page
- [ ] Leaderboard page
- [ ] Wallet page
- [ ] Profile page

### V2 — Creator Economy
- [ ] Tiered IPO fee system for card creation
- [ ] Creator dashboard
- [ ] Revenue sharing mechanics

### V3 — AI Newspaper
- [ ] Claude API-powered in-game news feed
- [ ] Market events generated from trade activity
- [ ] AI commentary on price movements

---

## Contributing

This is a personal project — not open to contributions at this stage.

---
