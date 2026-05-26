# Tropex

## Backend PRD — Version 3.0

**Product Requirements Document · Retention & AI · Backend Engineering Spec**

> **Author:** Suprathik Joshua · IIIT Lucknow
> **Stack:** Express + TypeScript + Bun + Prisma + PostgreSQL + Claude API + node-cron
> **Status:** Ready for Development
> **Depends On:** V1 and V2 fully shipped and tested

---

## Document Meta

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Document Type | PRD — Backend                                                                      |
| Version       | V3.0 — Retention & AI                                                              |
| Scope         | Streak system, AI newspaper, market events engine, admin API                       |
| Out of Scope  | Frontend UI, animations, mobile — see Frontend PRD V3                              |
| API Contract  | All endpoints conform to this spec. Frontend PRD V3 depends on these contracts.    |
| Runtime       | Bun 1.x                                                                            |
| Data Integrity| ACID compliance required for streak claim and market event price modifications     |
| Core Rule     | **Admin endpoints are protected by a secret key, not JWT. Never expose to client.**|

---

## What V3 Adds

V1 gave players a game. V2 gave them the ability to create cards. V3 gives them a reason to come back tomorrow. Three systems are added:

1. **Daily Streak System** — players claim 250 TC once every 24 hours. Streak counter tracks consecutive days.
2. **AI Newspaper** — a nightly cron job queries the day's market data, feeds it to the Claude API, and stores a daily edition as JSON. Players read it on the `/newspaper` page.
3. **Market Events** — real price multipliers applied to specific cards for a set duration. Can be triggered randomly by a cron job or manually by admin.

---

## New Database Models — V3

> Add these three models to the existing Prisma schema. Do not modify V1 or V2 models.

### StreakClaim

Tracks every daily claim per user. Used to enforce the 24-hour cooldown and count consecutive days.

```prisma
model StreakClaim {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  claimedAt DateTime @default(now())
  amount    Decimal  @default(250) @db.Decimal(18, 4)

  @@index([userId, claimedAt])
}
```

Also add to `User` model:
```prisma
streakDays    Int       @default(0)
lastClaimAt   DateTime?
streakClaims  StreakClaim[]
```

> Note: `streakDays` and `lastClaimAt` already exist in V1 schema. Only add `streakClaims` relation if not present.

---

### NewsEdition

Stores every nightly newspaper edition as structured JSON.

```prisma
model NewsEdition {
  id           String   @id @default(cuid())
  date         String   @unique  // "YYYY-MM-DD" — one per day
  headlines    Json               // string[] — 3-5 AI-generated headlines
  topMovers    Json               // { name, change24h, price }[]
  biggestTrade Json               // { username, cardName, amount, totalCost }
  incident     String             // AI-generated market incident paragraph
  leaderboard  Json               // { climbers[], fallers[] }
  generatedAt  DateTime @default(now())

  @@index([date])
}
```

---

### MarketEvent

Records active and past market events. A market event applies a price multiplier to one or more cards for a set duration.

```prisma
enum MarketEventType {
  FLASH_CRASH
  SECTOR_BOOM
  WHALE_SIGHTING
  VOLATILITY_STORM
  GOVT_DECISION
}

enum MarketEventStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

model MarketEvent {
  id             String            @id @default(cuid())
  type           MarketEventType
  title          String            // human-readable e.g. "Government bans BananaCorp"
  description    String            // short explanation shown to players
  affectedCardIds String[]          // array of card IDs affected
  multiplier     Decimal           @db.Decimal(6, 4)  // e.g. 0.6 = 40% drop, 1.4 = 40% rise
  startsAt       DateTime
  endsAt         DateTime
  status         MarketEventStatus @default(ACTIVE)
  triggeredBy    String            // "cron" or "admin"
  createdAt      DateTime          @default(now())

  @@index([status, endsAt])
}
```

---

## How Market Events Affect Prices

When a `MarketEvent` is `ACTIVE`, the pricing engine applies the event multiplier to the computed price for any affected card.

In `getPrice()` inside `pricing-engine.ts`:

```typescript
// After computing sigmoid price, check for active events
const activeEvent = await getActiveEventForCard(cardId);
if (activeEvent) {
  price = price.mul(activeEvent.multiplier);
}
```

> Rule: Event multiplier is applied AFTER the bonding curve price is computed — it is a modifier on top, not a replacement.

A cron job runs every minute to expire events whose `endsAt` has passed — setting their status to `EXPIRED`.

---

## API Endpoints — V3

### Streak System

| Method | Endpoint              | Auth     | Purpose                             | Request | Response                                    | Rate Limit |
| ------ | --------------------- | -------- | ----------------------------------- | ------- | ------------------------------------------- | ---------- |
| `POST` | `/rewards/claim`      | Required | Claim daily 250 TC reward           | —       | `{ newBalance, streakDays, nextClaimAt }`   | 1/24h      |
| `GET`  | `/rewards/status`     | Required | Check if user can claim today       | —       | `{ canClaim, streakDays, nextClaimAt }`     | 60/min     |

---

### Newspaper

| Method | Endpoint                | Auth   | Purpose                          | Request | Response                        | Rate Limit |
| ------ | ----------------------- | ------ | -------------------------------- | ------- | ------------------------------- | ---------- |
| `GET`  | `/newspaper/today`      | Public | Get today's newspaper edition    | —       | `{ edition }` or 404 if not yet | 60/min     |
| `GET`  | `/newspaper/archive`    | Public | List all past editions           | `?page` | `{ editions[], total }`         | 30/min     |
| `GET`  | `/newspaper/:date`      | Public | Get edition by date (YYYY-MM-DD) | —       | `{ edition }`                   | 60/min     |

---

### Market Events

| Method | Endpoint              | Auth   | Purpose                        | Request | Response              | Rate Limit |
| ------ | --------------------- | ------ | ------------------------------ | ------- | --------------------- | ---------- |
| `GET`  | `/events/active`      | Public | Get all currently active events| —       | `{ events[] }`        | 60/min     |

---

### Admin Endpoints

> **Auth:** All admin endpoints require `x-admin-secret` header matching `ADMIN_SECRET` env var. Never JWT.

| Method   | Endpoint                      | Purpose                        | Request                                                        | Response           |
| -------- | ----------------------------- | ------------------------------ | -------------------------------------------------------------- | ------------------ |
| `POST`   | `/admin/events`               | Manually trigger market event  | `{ type, title, description, affectedCardIds, multiplier, durationMinutes }` | `{ event }` |
| `DELETE` | `/admin/events/:id`           | Cancel an active event         | —                                                              | `{ cancelled }`    |
| `GET`    | `/admin/events`               | List all events (all statuses) | `?status`                                                      | `{ events[] }`     |
| `GET`    | `/admin/stats`                | System stats overview          | —                                                              | `{ players, trades, volume, activeEvents }` |
| `POST`   | `/admin/newspaper/generate`   | Manually trigger newspaper     | —                                                              | `{ edition }`      |

---

## Streak Claim Flow — `POST /rewards/claim`

```
Step 1.  Authenticate — extract userId from JWT

Step 2.  Fetch user's lastClaimAt from DB

Step 3.  Check 24-hour cooldown
         IF lastClaimAt exists AND (now - lastClaimAt) < 24 hours
           Return 400 ALREADY_CLAIMED with nextClaimAt timestamp

Step 4.  BEGIN Postgres transaction

   4a.   Credit 250 TC to wallet
         UPDATE Wallet SET balance = balance + 250

   4b.   Update streak counter
         IF (now - lastClaimAt) <= 26 hours   ← 26h grace window
           streakDays = streakDays + 1
         ELSE
           streakDays = 1   ← streak broken, reset to 1

   4c.   Update lastClaimAt
         UPDATE User SET streakDays = ..., lastClaimAt = now()

   4d.   Insert StreakClaim row
         INSERT StreakClaim { userId, amount: 250 }

   4e.   Append to BalanceLedger
         INSERT BalanceLedger { walletId, delta: +250, reason: 'DAILY_STREAK' }

Step 5.  COMMIT

Step 6.  Return 200
         { newBalance, streakDays, nextClaimAt: now + 24h }
```

> **26-hour grace window:** A player who claims at 9pm on Monday can claim at up to 11pm on Tuesday without losing their streak. Prevents timezone-driven streak breaks.

---

## AI Newspaper Cron — Midnight UTC

**Schedule:** `0 0 * * *` (every day at midnight UTC)

**File:** `src/jobs/newspaper.job.ts`

```
Step 1.  Query market data for past 24 hours:
         - Top 3 cards by price gain (% change)
         - Top 3 cards by price loss (% change)
         - Largest single trade (by totalCost)
         - Leaderboard top 5 + any rank changes vs yesterday

Step 2.  Build Claude API prompt with market data
         Include instruction to return ONLY valid JSON

Step 3.  Call Claude API (claude-sonnet-4-20250514)
         System prompt: "You are the editor of The Banana Times, a fictional daily financial newspaper..."
         User prompt: [structured market data]
         Expected JSON output: { headlines[], incident, sentiment }

Step 4.  Parse Claude response

Step 5.  Save to NewsEdition table
         date: today's date (YYYY-MM-DD)
         headlines: Claude's headlines array
         topMovers: queried from DB
         biggestTrade: queried from DB
         incident: Claude's incident paragraph
         leaderboard: queried from DB

Step 6.  Log success or error to console
```

### Claude API Prompt Template

```
System:
You are the editor of The Banana Times — a fictional daily financial newspaper
inside a trading card game. Write in a dramatic, financial news style.
Respond ONLY with valid JSON. No markdown. No explanation.

User:
Today's market data:
- Top gainers: {topGainers}
- Top losers: {topLosers}
- Biggest trade: {biggestTrade}
- Leaderboard changes: {leaderboardChanges}

Generate a newspaper edition with this exact JSON structure:
{
  "headlines": ["string", "string", "string"],
  "incident": "string (2-3 sentences describing a fictional real-world event that explains today's price moves)",
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL"
}
```

---

## Market Event Cron — Random Daily Event

**Schedule:** `0 12 * * *` (every day at noon UTC — one event per day)

**File:** `src/jobs/marketEvent.job.ts`

```
Step 1.  Pick random event type from [FLASH_CRASH, SECTOR_BOOM, WHALE_SIGHTING, GOVT_DECISION]

Step 2.  Pick 1-3 random LIVE cards from DB

Step 3.  Set multiplier based on event type:
         FLASH_CRASH:    0.5 – 0.7  (price drop 30-50%)
         SECTOR_BOOM:    1.3 – 1.5  (price rise 30-50%)
         WHALE_SIGHTING: 1.1 – 1.2  (price rise 10-20%)
         GOVT_DECISION:  0.6 – 1.4  (random direction)

Step 4.  Set duration:
         FLASH_CRASH:    1-3 hours
         SECTOR_BOOM:    2-4 hours
         WHALE_SIGHTING: 1-2 hours
         GOVT_DECISION:  4-8 hours

Step 5.  INSERT MarketEvent row

Step 6.  Log event created
```

## Event Expiry Cron

**Schedule:** `* * * * *` (every minute)

```
Step 1.  Find all MarketEvents where status = ACTIVE AND endsAt < now()
Step 2.  UPDATE status = EXPIRED for each
Step 3.  Log count of expired events
```

---

## Admin Secret Middleware

```typescript
// src/middlewares/admin.middleware.ts
export const verifyAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

---

## New Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_SECRET=your-long-random-secret-here
```

---

## V3 Acceptance Criteria

| Criteria                                              | Target                          |
| ----------------------------------------------------- | ------------------------------- |
| Daily claim grants exactly 250 TC                     | Verified in DB after claim      |
| User cannot claim twice in 24 hours                   | Second claim returns 400        |
| Streak counter increments on consecutive days         | Correct after 3-day test        |
| Streak resets if gap > 26 hours                       | Verified at 27h mark            |
| Newspaper generates every midnight                    | 3 consecutive nights verified   |
| Newspaper JSON valid and parseable                    | No parse errors in 3 editions   |
| Market event multiplier applies to card price         | Price modified for event duration|
| Event status flips to EXPIRED after endsAt            | Cron verified within 1 minute   |
| Admin can manually trigger event via API              | Works with correct secret       |
| Admin endpoint rejects wrong secret with 401          | Always                          |
| `tsc --noEmit` passes with zero errors                | Zero errors                     |

---

_Backend V3 PRD · 10 endpoints · 3 new DB models · 3 cron jobs · Streak + AI Newspaper + Market Events_
