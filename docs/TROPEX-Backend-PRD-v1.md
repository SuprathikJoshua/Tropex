# Tropex

## Backend PRD — Version 1.0

**Product Requirements Document · Core Trading Engine · Backend Engineering Spec**

> **Author:** Suprathik Joshua · IIIT Lucknow
> **Stack:** Next.js 15 API Routes + TypeScript + Bun + Prisma + Neon (Postgres) + Upstash Redis + Supabase Auth + Supabase Realtime
> **Status:** Ready for Development
> **Target:** Ship V1 by April 4

---

## Document Meta

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Document Type  | PRD — Backend                                                                         |
| Version        | V1.0 — Core Trading Engine                                                            |
| Scope          | All API endpoints, business logic, DB schema, caching, and realtime for V1            |
| Out of Scope   | Frontend UI, components, animations — see Frontend PRD                                |
| API Contract   | All endpoints conform to this spec. Frontend PRD depends on these contracts.          |
| Runtime        | Bun 1.x — drop-in Node.js replacement, faster startup, built-in TypeScript            |
| Data Integrity | ACID compliance required for ALL financial operations                                 |
| Core Rule      | **No trade price is ever accepted from the client. All prices computed server-side.** |

---

## Infrastructure — What Each Service Does

> One of the most important things to understand before writing any code.

| Service               | What It Does                                                                          | What It Does NOT Do                                     |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Neon (Postgres)**   | Stores ALL data permanently — every player, card, trade, holding, ledger row          | Nothing else                                            |
| **Prisma ORM**        | Type-safe interface to Neon — all DB queries go through Prisma                        | Never bypassed with raw SQL unless absolutely necessary |
| **Upstash Redis**     | Leaderboard sorted set · rate limiting counters · 1s price cache · rescue season lock | Never stores permanent data                             |
| **Supabase Auth**     | Issues JWTs on login/signup · validates sessions · Row Level Security on Neon tables  | Does NOT store your game data                           |
| **Supabase Realtime** | Broadcasts WebSocket events to all connected clients after trades                     | Does NOT store anything                                 |
| **Vercel**            | Hosts Next.js app and API routes as serverless functions                              | Does NOT run long-lived processes                       |

**The flow in plain English:**

> Player makes a trade → API Route validates → Prisma writes to Neon → Redis updates leaderboard + cache → Supabase Realtime broadcasts to all browsers

---

## System Architecture

```
HTTP Request
    ↓
Vercel Edge (CDN + routing)
    ↓
Next.js API Route (/app/api/*)
    ↓
Zod validation  →  reject 422 if invalid
    ↓
Supabase Auth   →  reject 401 if no valid JWT
    ↓
Redis rate limit →  reject 429 if over limit
    ↓
Business Logic + Prisma $transaction()
    ↓
Neon (Postgres) — ACID transaction
    ↓
Redis update    — leaderboard ZADD + price cache SET
    ↓
Supabase Realtime broadcast
    ↓
200 response to client
```

---

## Database Schema — V1 (6 Models)

> ⚠️ **RULE 1:** All monetary values use `Decimal(18,4)` — **NEVER `Float`**. Float has rounding errors that will cause financial bugs.
>
> ⚠️ **RULE 2:** `BalanceLedger` rows are **append-only** — never UPDATE or DELETE them. They are the source of truth for every balance change.

### What Each Table Stores

| Table           | What It Stores                                                 | One Row =                      |
| --------------- | -------------------------------------------------------------- | ------------------------------ |
| `Player`        | Every registered player's account data                         | One person                     |
| `Card`          | Every tradeable card and its bonding curve parameters          | One asset                      |
| `Trade`         | Every buy/sell action ever executed — never modified           | One trade action               |
| `Holding`       | Who currently owns how much of which card                      | One player's stake in one card |
| `BalanceLedger` | Every balance change ever — append only                        | One balance event              |
| `RescueLog`     | Record of every rescue grant given — one per player per season | One rescue event               |

### Who Can See What

| Table           | Player sees                                       | Other players see                                 |
| --------------- | ------------------------------------------------- | ------------------------------------------------- |
| `Player`        | Own row (balance, streak, username)               | Username + portfolio value only (for leaderboard) |
| `Card`          | All cards (public marketplace)                    | All cards (public marketplace)                    |
| `Trade`         | Own trade history                                 | Nothing — private                                 |
| `Holding`       | Own holdings                                      | Nothing — private                                 |
| `BalanceLedger` | Reflected in balance number only — never raw rows | Nothing                                           |
| `RescueLog`     | "Rescued this season" badge — never raw row       | Just the badge on profile                         |

> **Row Level Security (RLS)** is enforced at the Postgres level via Supabase Auth. Even if someone calls the API with another player's ID, the database itself refuses to return that data.

### Full Prisma Schema

```prisma
// /prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // points to Neon — NOT Supabase
}

enum TradeType {
  BUY
  SELL
}

model Player {
  id           String          @id @default(cuid())
  username     String          @unique
  email        String          @unique
  balance      Decimal         @default(1000) @db.Decimal(18, 4)
  streakDays   Int             @default(0)
  lastClaimAt  DateTime?
  rescueCount  Int             @default(0)   // resets each season
  createdAt    DateTime        @default(now())

  trades       Trade[]
  holdings     Holding[]
  ledger       BalanceLedger[]
  cards        Card[]          @relation("Creator")
  rescues      RescueLog[]
}

model Card {
  id            String    @id @default(cuid())
  name          String
  creatorId     String
  creator       Player    @relation("Creator", fields: [creatorId], references: [id])
  basePrice     Decimal   @db.Decimal(18, 4)   // price when supply = 0
  maxPrice      Decimal   @db.Decimal(18, 4)   // price when supply = totalSupply
  sensitivity   Decimal   @db.Decimal(10, 6)   // sigmoid steepness — controls volatility
  currentSupply Decimal   @default(0) @db.Decimal(18, 4)
  version       Int       @default(0)           // optimistic lock — incremented per trade
  createdAt     DateTime  @default(now())

  trades        Trade[]
  holdings      Holding[]

  @@index([createdAt])
}

model Trade {
  id            String    @id @default(cuid())
  playerId      String
  player        Player    @relation(fields: [playerId], references: [id])
  cardId        String
  card          Card      @relation(fields: [cardId], references: [id])
  type          TradeType
  amount        Decimal   @db.Decimal(18, 4)
  totalCost     Decimal   @db.Decimal(18, 4)   // actual BC debited/credited
  supplyBefore  Decimal   @db.Decimal(18, 4)   // card supply before this trade
  supplyAfter   Decimal   @db.Decimal(18, 4)   // card supply after this trade
  createdAt     DateTime  @default(now())

  ledger        BalanceLedger[]

  @@index([cardId, createdAt])
  @@index([playerId, createdAt])
}

model Holding {
  id        String  @id @default(cuid())
  playerId  String
  player    Player  @relation(fields: [playerId], references: [id])
  cardId    String
  card      Card    @relation(fields: [cardId], references: [id])
  quantity  Decimal @db.Decimal(18, 4)

  @@unique([playerId, cardId])   // one row per player per card
}

model BalanceLedger {
  id        String   @id @default(cuid())
  playerId  String
  player    Player   @relation(fields: [playerId], references: [id])
  delta     Decimal  @db.Decimal(18, 4)  // negative = debit, positive = credit
  reason    String                        // BUY | SELL | SIGNUP | RESCUE | DAILY
  tradeId   String?                       // null for non-trade events
  trade     Trade?   @relation(fields: [tradeId], references: [id])
  createdAt DateTime @default(now())

  @@index([playerId, createdAt])
}

model RescueLog {
  id        String   @id @default(cuid())
  playerId  String
  player    Player   @relation(fields: [playerId], references: [id])
  amount    Decimal  @default(50) @db.Decimal(18, 4)
  seasonId  String                       // e.g. "2025-S1"
  createdAt DateTime @default(now())

  @@unique([playerId, seasonId])         // one rescue per player per season
  @@index([playerId])
}
```

---

## Pricing Engine Specification

> ⚠️ **This is the financial core of the game. Write unit tests before wiring to any endpoint.**
>
> **File location:** `/lib/pricing-engine.ts` — server-side only. Never import this on the client.

### How Price Works

Each card has a **sigmoid (S-curve) bonding curve**. The price at any moment is purely a function of the current supply outstanding:

- **Low supply** (few people own it) → price is near `basePrice`
- **Mid supply** (half the curve consumed) → price is midway, steepest slope, most volatile
- **High supply** (nearly maxed out) → price is near `maxPrice`, flattening out

When a player **buys**, supply goes up and price rises. When a player **sells**, supply goes down and price falls. There is no other player on the other side — trades happen against the curve directly.

### Functions Required

| Function                                | What It Does                                            | Algorithm                                                                                 |
| --------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `getPrice(supply, params)`              | Price at a given supply level                           | `P(s) = base + (max-base) / (1 + e^(-k*(s - midpoint)))` where midpoint = totalSupply / 2 |
| `getBuyCost(supply, amount, params)`    | Total BC cost to buy `amount` units from current supply | Numerical integration of `getPrice` over [supply, supply+amount] using 200 steps          |
| `getSellReturn(supply, amount, params)` | Total BC received for selling `amount` units            | Numerical integration over [supply-amount, supply] — always less than buy cost            |
| `getSlippage(orderSize, liquidity)`     | Slippage multiplier for large orders                    | `min(0.15, (orderSize/liquidity)^1.5 × 0.1)` — returns 0.0 to 0.15                        |
| `applySlippage(cost, slippage)`         | Apply slippage to a raw cost                            | `cost × (1 + slippage)`                                                                   |

### Required Test Cases (write before wiring to API)

| Test                                                  | Expected                                  |
| ----------------------------------------------------- | ----------------------------------------- |
| `getPrice(supply=0, params)`                          | Within 1% of `basePrice`                  |
| `getPrice(supply=midpoint, params)`                   | Exactly `(basePrice + maxPrice) / 2`      |
| `getPrice(supply=totalSupply, params)`                | Within 1% of `maxPrice`                   |
| `getBuyCost(0, 1000, params)`                         | ≈ 1000 × `getBuyCost(0, 1, params)` ±0.1% |
| `getSellReturn` always < `getBuyCost` for same inputs | Always                                    |
| `getSlippage(0, 1000)`                                | 0                                         |
| `getSlippage(1000, 1000)`                             | 0.1                                       |
| `getSlippage(10000, 1000)`                            | 0.15 (capped)                             |

### Reference Implementation

```typescript
// /lib/pricing-engine.ts
import Decimal from "decimal.js";

interface CurveParams {
	basePrice: Decimal;
	maxPrice: Decimal;
	sensitivity: Decimal;
	totalSupply: Decimal;
}

export function getPrice(supply: Decimal, p: CurveParams): Decimal {
	const midpoint = p.totalSupply.div(2);
	const exponent = p.sensitivity
		.negated()
		.mul(supply.minus(midpoint))
		.toNumber();
	const sigmoid = new Decimal(1).div(new Decimal(1).plus(Math.exp(exponent)));
	return p.basePrice.plus(p.maxPrice.minus(p.basePrice).mul(sigmoid));
}

export function getBuyCost(
	currentSupply: Decimal,
	amount: Decimal,
	p: CurveParams,
): Decimal {
	const STEPS = 200;
	const delta = amount.div(STEPS);
	let total = new Decimal(0);
	for (let i = 0; i < STEPS; i++) {
		total = total.plus(
			getPrice(currentSupply.plus(delta.mul(i)), p).mul(delta),
		);
	}
	return total;
}

export function getSellReturn(
	currentSupply: Decimal,
	amount: Decimal,
	p: CurveParams,
): Decimal {
	const STEPS = 200;
	const delta = amount.div(STEPS);
	let total = new Decimal(0);
	for (let i = 0; i < STEPS; i++) {
		total = total.plus(
			getPrice(currentSupply.minus(delta.mul(i + 1)), p).mul(delta),
		);
	}
	return total;
}

export function getSlippage(orderSize: Decimal, liquidity: Decimal): number {
	const ratio = orderSize.div(liquidity).toNumber();
	return Math.min(0.15, Math.pow(ratio, 1.5) * 0.1);
}

export function applySlippage(cost: Decimal, slippage: number): Decimal {
	return cost.mul(new Decimal(1).plus(slippage));
}
```

---

## API Endpoints — V1

> **All endpoints:**
>
> - Return JSON
> - Errors return `{ error: string, code: string }`
> - All Decimal values serialised as `string` (never `number`) to avoid JS float precision loss
> - Auth "Required" means a valid Supabase JWT in the `Authorization: Bearer <token>` header

| Method | Endpoint                 | Auth     | Purpose                                 | Request                         | Response                          | Rate Limit |
| ------ | ------------------------ | -------- | --------------------------------------- | ------------------------------- | --------------------------------- | ---------- |
| `POST` | `/api/auth/signup`       | Public   | Create player, credit 1000 BC           | `{ username, email, password }` | `{ player, session }`             | 5/min      |
| `POST` | `/api/auth/login`        | Public   | Supabase sign in                        | `{ email, password }`           | `{ session }`                     | 10/min     |
| `GET`  | `/api/cards`             | Public   | List all cards with live prices         | `?filter&sort&page`             | `{ cards[], total }`              | 60/min     |
| `GET`  | `/api/cards/:id`         | Public   | Single card full detail + current price | —                               | `{ card, currentPrice }`          | 60/min     |
| `GET`  | `/api/cards/:id/history` | Public   | Price history points for chart          | `?range=1D\|7D\|30D`            | `{ points[] }`                    | 60/min     |
| `GET`  | `/api/cards/:id/trades`  | Public   | Trade history for a card                | `?page&limit`                   | `{ trades[], total }`             | 60/min     |
| `GET`  | `/api/trade/preview`     | Required | Compute cost preview — no side effects  | `?cardId&amount&type`           | `{ cost, newPrice, slippage }`    | 120/min    |
| `POST` | `/api/trade/buy`         | Required | Atomic buy — debit BC, add holding      | `{ cardId, amount }`            | `{ trade, newBalance, newPrice }` | 10/min     |
| `POST` | `/api/trade/sell`        | Required | Atomic sell — credit BC, reduce holding | `{ cardId, amount }`            | `{ trade, newBalance, newPrice }` | 10/min     |
| `POST` | `/api/rescue`            | Required | Grant 50 BC rescue if balance = 0       | —                               | `{ newBalance, rescueCount }`     | 1/season   |
| `GET`  | `/api/leaderboard`       | Required | Top 100 players + caller's own rank     | —                               | `{ top100[], myRank }`            | 30/min     |
| `GET`  | `/api/player/:username`  | Public   | Player public profile + holdings        | —                               | `{ player, holdings[] }`          | 60/min     |
| `GET`  | `/api/portfolio`         | Required | Authenticated player's full portfolio   | —                               | `{ holdings[], totalValue }`      | 60/min     |
| `GET`  | `/api/portfolio/history` | Required | Portfolio value over time               | `?range=7D\|30D\|all`           | `{ points[] }`                    | 30/min     |
| `GET`  | `/api/search`            | Public   | Full-text search cards and players      | `?q`                            | `{ cards[], players[] }`          | 60/min     |
| `GET`  | `/api/health`            | Public   | System health check                     | —                               | `{ db, redis, realtime }`         | Unlimited  |

---

## Atomic Trade Flow — `POST /api/trade/buy`

> Every single step executes or the **entire transaction rolls back**. No partial state is ever possible.

```
Step 1.  Parse request body
         Zod schema: { cardId: string, amount: string }
         Reject 422 if invalid or amount ≤ 0

Step 2.  Authenticate
         Extract playerId from Supabase JWT
         Reject 401 if missing or expired

Step 3.  Rate limit check
         Redis: INCR ratelimit:trade:{playerId}
         Reject 429 if count > 10
         Set EXPIRE 60s on first increment

Step 4.  BEGIN Postgres transaction ($transaction)

   4a.   Lock the card row
         SELECT * FROM Card WHERE id = cardId FOR UPDATE
         Prevents any other trade on this card until we commit

   4b.   Compute cost
         cost = getBuyCost(card.currentSupply, amount, curveParams)

   4c.   Compute slippage
         slippage = getSlippage(amount, card.currentSupply)

   4d.   Compute total
         totalCost = applySlippage(cost, slippage)

   4e.   Lock the player row
         SELECT balance FROM Player WHERE id = playerId FOR UPDATE

   4f.   *** BALANCE CHECK ***
         IF player.balance < totalCost
           ROLLBACK → return 400 INSUFFICIENT_BALANCE
         This is the guard that ensures balance NEVER goes negative

   4g.   Debit player balance
         UPDATE Player SET balance = balance - totalCost

   4h.   Update card supply + optimistic lock
         UPDATE Card SET
           currentSupply = currentSupply + amount,
           version = version + 1

   4i.   Record the trade (immutable)
         INSERT Trade {
           playerId, cardId, type: BUY,
           amount, totalCost,
           supplyBefore: card.currentSupply,
           supplyAfter: card.currentSupply + amount
         }

   4j.   Update holding (upsert)
         UPSERT Holding { playerId, cardId }
         SET quantity = quantity + amount
         (creates row if first time player buys this card)

   4k.   Append to balance ledger (never update, only insert)
         INSERT BalanceLedger {
           playerId,
           delta: -totalCost,   ← negative = money left wallet
           reason: 'BUY',
           tradeId: trade.id
         }

Step 5.  COMMIT

Step 6.  Update Redis leaderboard
         ZADD leaderboard {newPortfolioValue} {playerId}

Step 7.  Cache new price in Redis
         SET price:{cardId} {newPrice} EX 1   ← expires after 1 second

Step 8.  Broadcast via Supabase Realtime
         channel: 'card-prices'  → { cardId, newPrice, change24h }
         channel: 'trade-feed'   → { username, cardName, type, amount, totalCost }
         channel: 'player-{id}'  → { newBalance }

Step 9.  Return 200
         { trade, newBalance, newPrice }
```

---

## Rescue Flow — `POST /api/rescue`

> Triggered when player balance hits 0. One rescue per player per season. Grants exactly 50 BC.

```
Step 1.  Authenticate — extract playerId from JWT

Step 2.  Check Redis season lock
         GET rescue:{playerId}:{currentSeasonId}
         If key exists → return 400 ALREADY_RESCUED

Step 3.  BEGIN Postgres transaction

   3a.   Lock player row
         SELECT balance, rescueCount FROM Player WHERE id = playerId FOR UPDATE

   3b.   Eligibility check
         IF player.balance > 0 → ROLLBACK → return 400 RESCUE_NOT_ELIGIBLE

   3c.   Double-check DB (Redis could have expired)
         IF RescueLog exists for (playerId, currentSeasonId) → return 400 ALREADY_RESCUED

   3d.   Credit rescue grant
         UPDATE Player SET
           balance = 50,
           rescueCount = rescueCount + 1

   3e.   Record rescue
         INSERT RescueLog { playerId, amount: 50, seasonId: currentSeasonId }

   3f.   Append to balance ledger
         INSERT BalanceLedger { playerId, delta: +50, reason: 'RESCUE' }

Step 4.  COMMIT

Step 5.  Set Redis season lock
         SET rescue:{playerId}:{seasonId} 1 EXAT {seasonEndTimestamp}

Step 6.  Broadcast via Supabase Realtime
         channel: 'player-{playerId}' → { newBalance: 50, rescueGranted: true }

Step 7.  Return 200
         { newBalance: 50, rescueCount }
```

---

## Redis Data Structures

| Key Pattern                    | Type          | TTL                  | Purpose                                                                                                    |
| ------------------------------ | ------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `leaderboard`                  | Sorted Set    | No expiry            | `ZADD score=portfolioValue member=playerId`. `ZREVRANGE 0 99` for top 100. `ZREVRANK` for individual rank. |
| `price:{cardId}`               | String        | 1 second             | Latest price cache. Reduces DB reads during high-traffic bursts.                                           |
| `ratelimit:trade:{playerId}`   | String (INCR) | 60 seconds           | Trade rate limiter. INCR per trade. Auto-expires.                                                          |
| `ratelimit:{route}:{playerId}` | String (INCR) | 60 seconds           | Generic per-route rate limiter.                                                                            |
| `rescue:{playerId}:{seasonId}` | String        | Season end timestamp | Season rescue lock. Set after rescue. Expires when season ends.                                            |
| `lb:snapshot:{date}`           | Hash          | 48 hours             | Nightly portfolio snapshot per player. Used to compute 24h rank change badges.                             |

---

## Supabase Realtime Channels

| Channel             | Event Payload                                     | Triggered When            | Client Action                          |
| ------------------- | ------------------------------------------------- | ------------------------- | -------------------------------------- |
| `card-prices`       | `{ cardId, newPrice, change24h }`                 | After every trade         | Flash price on marketplace card tile   |
| `trade-feed`        | `{ username, cardName, type, amount, totalCost }` | After every trade         | Prepend to dashboard live feed sidebar |
| `leaderboard`       | `{ top10: [{ rank, username, value }] }`          | Every 5s via cron job     | Re-render top 10 leaderboard rows      |
| `player-{playerId}` | `{ newBalance, tradeId?, rescueGranted? }`        | After own trade or rescue | Update balance in header immediately   |

---

## Security Requirements

| Requirement              | Rule                                                                                | How It's Enforced                                          |
| ------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Server-side pricing      | Price is **NEVER** read from request body. Always recomputed from DB.               | Code review gate — PR rejected if `req.body.price` appears |
| Input validation         | Every route has a Zod schema. Extra fields stripped. Missing required fields → 422. | `zod.strict()` on all request schemas                      |
| Auth on sensitive routes | All `/api/trade/*` and `/api/rescue` require valid Supabase JWT.                    | Middleware wrapping those route groups                     |
| Rate limiting            | Redis INCR per user per route. Trade: 10/min. Signup: 5/min. Preview: 120/min.      | Redis check runs before any business logic                 |
| Atomic transactions      | Every trade and rescue uses Prisma `$transaction()` with `SELECT FOR UPDATE`.       | No trade logic outside of `$transaction()`                 |
| Row Level Security       | Supabase RLS: players can only read/write their own rows.                           | RLS policies enabled on all tables in Supabase dashboard   |
| No negative balance      | Balance check (step 4f) inside transaction before any UPDATE.                       | Hard guard — not optional                                  |
| Rescue abuse prevention  | Redis key + DB `RescueLog` both checked before granting.                            | Two independent checks — Redis can expire, DB cannot       |
| Optimistic locking       | `Card.version` incremented per trade. Concurrent conflicts → 409.                   | `version` check in UPDATE WHERE clause                     |
| No SQL injection         | Prisma parameterises all queries. No raw SQL with user input.                       | ESLint rule banning `$queryRawUnsafe`                      |

---

## API Error Codes

| HTTP  | Code                    | Meaning                                                       | What Client Should Do                   |
| ----- | ----------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `400` | `INVALID_AMOUNT`        | Amount ≤ 0, non-numeric, or unsafe                            | Show inline form error                  |
| `400` | `INSUFFICIENT_BALANCE`  | Player balance < totalCost                                    | Show how much more BC is needed         |
| `400` | `INSUFFICIENT_HOLDINGS` | Sell amount > current holdings                                | Show max sellable quantity              |
| `400` | `RESCUE_NOT_ELIGIBLE`   | Balance > 0, rescue not available                             | Hide rescue button                      |
| `400` | `ALREADY_RESCUED`       | Already rescued this season                                   | Show season rescue limit message        |
| `401` | `UNAUTHENTICATED`       | Missing or expired JWT                                        | Redirect to `/login`                    |
| `404` | `CARD_NOT_FOUND`        | cardId does not exist                                         | Redirect to `/marketplace`              |
| `409` | `CONCURRENT_CONFLICT`   | Optimistic lock failed — another trade just hit the same card | Retry with exponential backoff (max 3×) |
| `422` | `VALIDATION_ERROR`      | Zod schema failed — missing or wrong-type field               | Show which fields failed                |
| `429` | `RATE_LIMIT_EXCEEDED`   | Too many requests in the window                               | Show cooldown timer in UI               |
| `500` | `INTERNAL_ERROR`        | Unexpected server error — logged to Sentry in V3              | Show generic error toast                |

---

## Seed Data Requirements

> New players must see a populated, active-looking marketplace from their very first login.

### What to Seed

- **BananaBank system account** — not a real player, used only for seeding. Unlimited balance.
- **10 starter cards** — created by BananaBank. Varied curve parameters:
  - 2 slow-rising cards (low sensitivity) — price range 5–50 BC
  - 3 mid-range cards (medium sensitivity) — price range 20–200 BC
  - 3 steep cards (high sensitivity) — price range 10–500 BC
  - 2 near-maxed cards (scarcity feel) — already at 80%+ of supply consumed
- **100 historical trades per card** — spread across the past 30 days with realistic timestamps
- **Leaderboard init** — run `ZADD leaderboard` for BananaBank after seed

### Seed Script Rules

- **Idempotent** — running twice produces no duplicates. Use `upsert` everywhere.
- **Realistic timestamps** — trades spread across 30 days, not all at once.
- **Location** — `/prisma/seed.ts`. Run with: `bun prisma db seed`
- **Dev vs Prod** — auto-runs in development. Requires `--prod` flag for production.

---

## V1 Acceptance Criteria

### Automated Test Suite

| Test                                                      | Expected                              | Type        |
| --------------------------------------------------------- | ------------------------------------- | ----------- |
| `getPrice(supply=0)` returns value within 1% of basePrice | Pass                                  | Unit        |
| `getBuyCost(0, 1000)` ≈ 1000 × `getBuyCost(0, 1)` ±0.1%   | Pass                                  | Unit        |
| `getSellReturn` always < `getBuyCost` for same inputs     | Pass                                  | Unit        |
| `getSlippage` caps at 0.15 for very large orders          | 0.15                                  | Unit        |
| Player balance debited correctly after buy                | balance decreases by totalCost        | Integration |
| Player balance credited correctly after sell              | balance increases                     | Integration |
| 2 simultaneous buys on same card                          | 1 succeeds, 1 returns 409             | Integration |
| Buy when balance < totalCost                              | Returns 400 INSUFFICIENT_BALANCE      | Integration |
| 11 trades in 60s from same player                         | 11th returns 429                      | Integration |
| Sell all units of a card                                  | Holding row deleted from DB           | Integration |
| Every trade creates exactly 1 BalanceLedger row           | Correct delta sign                    | Integration |
| Rescue with balance = 0                                   | 50 BC credited, RescueLog row created | Integration |
| Rescue with balance = 10                                  | Returns 400 RESCUE_NOT_ELIGIBLE       | Integration |
| Rescue twice same season                                  | Returns 400 ALREADY_RESCUED           | Integration |
| Redis leaderboard ZSCORE updated after trade              | Reflects new portfolio value          | Integration |
| Supabase Realtime event received after trade              | Event arrives within 1 second         | Integration |

### Performance Targets

| Endpoint                 | Target (p99)                |
| ------------------------ | --------------------------- |
| `POST /api/trade/buy`    | < 300ms                     |
| `GET /api/cards`         | < 100ms (Redis price cache) |
| `GET /api/leaderboard`   | < 50ms (pure Redis read)    |
| `GET /api/trade/preview` | < 50ms (no DB write)        |
| `POST /api/rescue`       | < 200ms                     |

### Infrastructure Checklist

- [ ] All Prisma migrations apply cleanly on a fresh database
- [ ] `bun prisma db seed` runs idempotently — safe to run twice
- [ ] All required env vars documented in `.env.example`
- [ ] `GET /api/health` returns `{ db: 'ok', redis: 'ok', realtime: 'ok' }`
- [ ] No API keys or secrets committed to source code
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Prisma client pointed at **Neon connection string** — not Supabase

---

_Backend V1 PRD · 16 endpoints · 6 DB models · 4 Realtime channels · Full atomic trade + rescue flows · 16 test cases_
