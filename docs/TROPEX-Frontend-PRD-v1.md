# Tropex

## Frontend PRD — Version 1.0

**Product Requirements Document · Core Trading Game · Frontend Engineering Spec**

> **Author:** Suprathik Joshua · IIIT Lucknow
> **Stack:** Next.js 15 + TypeScript + Bun + Tailwind CSS + Recharts + Framer Motion
> **Status:** Ready for Development
> **Target:** Ship V1 by April 4

---

## Document Meta

| Field           | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Document Type   | PRD — Frontend                                                                     |
| Version         | V1.0 — Core Trading Game                                                           |
| Scope           | All frontend UI, components, screens, and client-side logic for V1                 |
| Out of Scope    | Backend API, database schema, DevOps — see Backend PRD                             |
| Dependencies    | Backend V1 API endpoints must be live for integration testing                      |
| Target Devices  | Desktop (1280px+) primary · Tablet (768px+) supported · Mobile in V4               |
| Browser Support | Chrome 120+ · Firefox 120+ · Safari 17+ · Edge 120+                                |
| Accessibility   | WCAG 2.1 AA — keyboard navigable, screen reader labels on all interactive elements |

---

## How the Game Works (Frontend Perspective)

Before building any screen, understand the core flow the frontend must support:

1. Player signs up → receives **1000 TropexCoin (BC)** automatically
2. Player browses the **marketplace** — a live grid of all tradeable cards
3. Player clicks a card → sees its **price history chart** and a **buy/sell form**
4. Player enters an amount → sees an **exact cost preview** before confirming
5. Player confirms → BC is debited, holding is added, **price moves on the curve**
6. Player's **portfolio value** updates in real-time — leaderboard reflects the change
7. If player hits **0 BC** → bankruptcy rescue banner appears → claim 50 BC to stay in

The frontend's job is to make this loop feel **fast, live, and satisfying**.

---

## Infrastructure Clarity

> Understand which service does what before writing a single line of frontend code.

| Service                | What the Frontend Uses It For                                            |
| ---------------------- | ------------------------------------------------------------------------ |
| **Neon (Postgres)**    | Where ALL data lives — never touched directly from frontend              |
| **Supabase Auth**      | `signUp()`, `signIn()`, `getSession()`, `onAuthStateChange()` only       |
| **Supabase Realtime**  | WebSocket subscriptions — price ticks, trade feed, balance updates       |
| **Upstash Redis**      | Never touched from frontend — backend only                               |
| **Next.js API Routes** | All data fetching goes through `/api/*` — no direct DB calls from client |

The frontend **never talks to Neon or Redis directly**. It only talks to:

- Supabase Auth SDK (sessions)
- Supabase Realtime SDK (live events)
- Your own `/api/*` routes (all data)

---

## User Stories — V1

> Every frontend feature traces back to one of these. No feature ships without a story.

| As a...          | I want to...                                          | So that...                                       |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------ |
| New Player       | sign up and immediately see my 1000 BC balance        | I know I have currency and can start trading     |
| New Player       | browse a live grid of tradeable cards with prices     | I can discover what to invest in                 |
| Player           | see a card's price history chart before trading       | I can make an informed buy/sell decision         |
| Player           | see the exact cost of my trade before confirming      | I am never surprised by slippage or final price  |
| Player           | see my portfolio value update instantly after trading | I get immediate feedback that my trade succeeded |
| Player           | see a live leaderboard of all players                 | I know my rank and feel motivated to climb       |
| Player           | see prices flash green or red on the marketplace      | The game feels alive and dynamic                 |
| Player           | see my full trade history on my profile               | I can review my decisions and learn from them    |
| Returning Player | land on dashboard and see what changed overnight      | I can quickly decide what to trade               |
| Broke Player     | see a rescue banner when my balance hits zero         | I know I can claim 50 BC to stay in the game     |

---

## Screen-by-Screen Requirements

### FE-AUTH — Authentication Screens

> **Routes:** `/login` `/signup` — Public. Redirect to `/dashboard` if already authenticated.

| ID   | Feature               | Description                                                                                                                     | Acceptance Criteria                                                        | Priority |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| A-01 | Signup Form           | Name, email, username, password. Calls Supabase Auth createUser. On success: backend credits 1000 BC, redirect to `/dashboard`. | All fields validated client-side. Inline errors under each field.          | P0       |
| A-02 | Login Form            | Email + password. Supabase signIn. Remember me toggle in localStorage.                                                          | Spinner on submit. Specific error for wrong credentials. Redirect < 500ms. | P0       |
| A-03 | Auth Error States     | Invalid credentials, email taken, weak password — each shows its own readable message.                                          | No generic errors. Every Supabase error code maps to human-readable copy.  | P0       |
| A-04 | Protected Route Guard | Next.js middleware redirects unauthenticated users from `/dashboard/*` to `/login`.                                             | Direct URL `/dashboard` → 307 redirect to `/login`.                        | P0       |
| A-05 | Loading States        | Submit buttons show spinner and disable during async auth.                                                                      | User cannot double-submit.                                                 | P1       |

---

### FE-DASH — Dashboard

> **Route:** `/dashboard` — First screen after login. Fast, dynamic, immediately useful.

| ID   | Feature                | Description                                                                                                  | Acceptance Criteria                                                                      | Priority |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------- |
| D-01 | Portfolio Value Header | Large number showing total portfolio value in BC. Updates live via Supabase Realtime channel `player-{id}`.  | Accurate to 2dp. Flashes green/red for 800ms on change.                                  | P0       |
| D-02 | Balance Display        | Current BC balance in top nav header. Updates instantly after every trade.                                   | Never shows stale balance. Always matches API.                                           | P0       |
| D-03 | Portfolio Line Chart   | Recharts LineChart of portfolio value over 7 days. Hover tooltip. Handles empty data for Day 1 players.      | No crash with 0 or 1 data points.                                                        | P0       |
| D-04 | Top Movers Row         | 3 cards: biggest 24h gainer, biggest 24h loser, highest volume. Each shows name, price, % change, sparkline. | Renders with minimum 2 data points on sparkline.                                         | P1       |
| D-05 | Quick Buy Row          | 4 trending cards (highest trade volume in last 6 hours) as tiles with Buy button.                            | Trending is server-determined — not client-guessed.                                      | P1       |
| D-06 | Live Trade Feed        | Right sidebar scrolling list of platform-wide trades via Supabase Realtime channel `trade-feed`.             | Auto-scrolls to newest. Max 50 items in DOM.                                             | P1       |
| D-07 | Bankruptcy Banner      | When balance ≤ 50 BC: yellow persistent banner with "Claim Rescue" button calling `POST /api/rescue`.        | Only shows at threshold. Disappears after successful claim. Cannot claim if balance > 0. | P1       |
| D-08 | Skeleton Loading       | All widgets show pulsing skeleton while data loads.                                                          | No layout shift when real data replaces skeletons.                                       | P1       |

---

### FE-MKT — Marketplace

> **Route:** `/marketplace` — Core discovery screen. Every player lands here first.

| ID   | Feature          | Description                                                                                                   | Acceptance Criteria                                                  | Priority |
| ---- | ---------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------- |
| M-01 | Card Grid        | 4-col desktop, 2-col tablet grid. Each tile: name, creator, price, 24h % change, sparkline, volume.           | Clean reflow at 768px and 1280px. No overflow.                       | P0       |
| M-02 | Live Price Ticks | Price label flashes green (up) or red (down) for 800ms when price updates via Realtime channel `card-prices`. | Flash within 1s of actual trade. CSS transition — not JS setTimeout. | P0       |
| M-03 | SparklineChart   | 48×32px inline Recharts chart per card tile showing 24h price history.                                        | Renders in < 16ms per card. No perf regression on full grid.         | P0       |
| M-04 | Filter Tabs      | All · Trending · New IPOs · My Holdings. Client-side filter — no API call on switch.                          | Filter state persists on browser back navigation.                    | P1       |
| M-05 | Sort Dropdown    | Sort by: Price High/Low · Volume · % Change 24h · Newest. Applies to current filtered set.                    | Stable sort — same-price ties always consistent.                     | P1       |
| M-06 | Search           | Debounced input (300ms) filtering by card name or creator username.                                           | No API call per keystroke. X button clears.                          | P2       |
| M-07 | Load More        | 24 cards initially. "Load More" appends next 24. Spinner on button.                                           | No full-page reload. Cards append, not replace.                      | P1       |

---

### FE-CARD — Card Detail & Trading

> **Route:** `/card/[id]` — Highest stakes screen. TropexCoins change hands here.

| ID   | Feature             | Description                                                                                    | Acceptance Criteria                                                          | Priority |
| ---- | ------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| C-01 | Price Line Chart    | Recharts LineChart with 1D / 7D / 30D toggle. Hover crosshair tooltip with price + timestamp.  | Handles 0 and 1 data points gracefully. Range switch without full re-render. | P0       |
| C-02 | Buy/Sell Toggle     | Tab switch between Buy and Sell mode. Sell disabled if player holds 0 of this card.            | State preserved when switching modes.                                        | P0       |
| C-03 | Amount Input        | Number input + / − stepper. Min 0.01. Blur validation rejects non-numeric.                     | 400ms debounce triggers preview fetch after user stops typing.               | P0       |
| C-04 | Live Price Preview  | "Estimated cost: X BC" updates as user types. Calls `GET /api/trade/preview`.                  | Slippage warning shown in yellow if order > 2% of liquidity.                 | P0       |
| C-05 | Trade Confirm Modal | On Trade click: modal shows final cost, new price after trade, slippage %, Confirm/Cancel.     | Confirm disabled 500ms after click — prevents double-submit.                 | P0       |
| C-06 | Trade Success       | Modal closes, balance header updates, holdings badge refreshes. Success toast for 3s.          | No page reload. All updates via React Query invalidation + Realtime.         | P0       |
| C-07 | Trade Error States  | Insufficient balance, rate limit, card not found — each shows specific message inside modal.   | Error clears on next input change. Raw API strings never shown.              | P0       |
| C-08 | Holdings Badge      | Above trade form: current quantity held + current value in BC. Updates after trade.            | Only visible when player holds > 0 of this card.                             | P1       |
| C-09 | Trade History Table | Paginated table: timestamp · player · BUY/SELL badge · amount · price. Own trades highlighted. | Paginates at 20 rows. Columns sortable.                                      | P1       |
| C-10 | Creator Panel       | Right sidebar: creator username, avatar initials, link to their profile.                       | Shows "You" badge if viewer is the card's creator.                           | P2       |

---

### FE-LB — Leaderboard

> **Route:** `/leaderboard` — The competitive heart of the game. Must feel live.

| ID   | Feature           | Description                                                                                                   | Acceptance Criteria                                                        | Priority |
| ---- | ----------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| L-01 | Ranked Table      | Top 100: rank · avatar · username · portfolio value · 24h change. Updates via Realtime channel `leaderboard`. | Sequential ranks 1–100. No duplicates.                                     | P0       |
| L-02 | Your Rank Row     | Sticky row below table: always shows logged-in player's rank, value, and distance to rank above.              | Visible even at rank #500. Not in top-100 section unless actually top 100. | P0       |
| L-03 | Rank Change Badge | +N / −N vs 24h ago. Green arrow up, red arrow down, grey dash for unchanged.                                  | Based on midnight snapshot. Accurate.                                      | P1       |
| L-04 | Live Reorder      | Rows animate smoothly when ranks change via Realtime.                                                         | Animation under 400ms. No flicker on rapid updates.                        | P1       |
| L-05 | Season Timer      | Countdown to end of current season. Top 3 get permanent trophy badge on profile.                              | Accurate to the second.                                                    | P2       |

---

### FE-PROF — Player Profile

> **Route:** `/profile/[username]` — Public view for all. Full detail only for own profile.

| ID   | Feature           | Description                                                                                                   | Acceptance Criteria                            | Priority |
| ---- | ----------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| P-01 | Portfolio Table   | Card name · quantity · current value in BC · P&L (value − cost basis). Sortable.                              | P&L correct sign: + green, − red.              | P0       |
| P-02 | Net Worth Chart   | LineChart of portfolio value over time. 7D / 30D / All toggle. Own profile only.                              | Empty state for players with no trade history. | P1       |
| P-03 | Trade History Log | Paginated: card name · BUY/SELL · amount · total cost · date. Own profile only — other profiles show nothing. | Privacy enforced at API level, not just UI.    | P1       |
| P-04 | Stats Row         | Total trades · total BC volume · current rank · days since signup.                                            | Consistent with DB — never stale.              | P1       |
| P-05 | Streak Badge      | Current streak day count with 🔥 if streak ≥ 7. Shows last claim timestamp. Own profile only.                 | Updates after daily claim.                     | P1       |
| P-06 | Bankruptcy Marker | If rescued this season: small badge "Rescued once this season".                                               | Visible to all — transparency mechanic.        | P2       |

---

## Component Inventory

> All in `/components/`. Shared primitives in `/components/ui/`. Screen-specific in `/components/[screen]/`.

| Component           | File                            | Props                   | State             | API                               |
| ------------------- | ------------------------------- | ----------------------- | ----------------- | --------------------------------- |
| `PriceTag`          | `/ui/PriceTag.tsx`              | price, change, size     | none              | none                              |
| `SparklineChart`    | `/ui/SparklineChart.tsx`        | data[], color, width    | none              | none                              |
| `SkeletonBox`       | `/ui/SkeletonBox.tsx`           | width, height, rounded  | none              | none                              |
| `TradeButton`       | `/ui/TradeButton.tsx`           | type, loading, disabled | none              | none                              |
| `ToastProvider`     | `/ui/Toast.tsx`                 | —                       | toasts[]          | none                              |
| `ModalWrapper`      | `/ui/Modal.tsx`                 | open, onClose, children | none              | none                              |
| `AvatarBadge`       | `/ui/Avatar.tsx`                | username, size          | none              | none                              |
| `BankruptcyBanner`  | `/ui/BankruptcyBanner.tsx`      | balance, onClaim        | claiming          | `POST /api/rescue`                |
| `BalanceHeader`     | `/layout/BalanceHeader.tsx`     | —                       | balance           | Realtime `player-{id}`            |
| `SideNav`           | `/layout/SideNav.tsx`           | —                       | activeRoute       | none                              |
| `PortfolioChart`    | `/dashboard/PortfolioChart.tsx` | data[]                  | timeRange         | `GET /api/portfolio/history`      |
| `TopMovers`         | `/dashboard/TopMovers.tsx`      | —                       | cards[]           | `GET /api/cards?sort=change`      |
| `LiveTradeFeed`     | `/dashboard/TradeFeed.tsx`      | —                       | trades[]          | Realtime `trade-feed`             |
| `CardGrid`          | `/marketplace/CardGrid.tsx`     | filter, sort            | cards[], loading  | `GET /api/cards`                  |
| `CardTile`          | `/marketplace/CardTile.tsx`     | card                    | priceFlash        | Realtime `card-prices`            |
| `FilterBar`         | `/marketplace/FilterBar.tsx`    | onChange                | activeFilter      | none                              |
| `PriceChart`        | `/card/PriceChart.tsx`          | cardId                  | range, data[]     | `GET /api/cards/:id/history`      |
| `TradeForm`         | `/card/TradeForm.tsx`           | cardId, mode            | amount, preview   | `GET /api/trade/preview`          |
| `TradeConfirm`      | `/card/TradeConfirm.tsx`        | preview, onConfirm      | submitting        | `POST /api/trade/buy\|sell`       |
| `TradeHistoryTable` | `/card/TradeHistory.tsx`        | cardId                  | page, trades[]    | `GET /api/cards/:id/trades`       |
| `LeaderboardTable`  | `/leaderboard/Table.tsx`        | —                       | players[], myRank | `GET /api/leaderboard` + Realtime |
| `HoldingsTable`     | `/profile/Holdings.tsx`         | playerId                | holdings[]        | `GET /api/player/:id/holdings`    |

---

## State Management & Data Flow

### React Query — Server State

| Query Key                     | Stale Time | Invalidated After        |
| ----------------------------- | ---------- | ------------------------ |
| `['cards', filter, sort]`     | 30s        | —                        |
| `['card', id]`                | 10s        | —                        |
| `['preview', cardId, amount]` | 2s         | —                        |
| `['portfolio']`               | 30s        | Successful trade         |
| `['leaderboard']`             | 60s        | Supplemented by Realtime |
| `['trades', cardId]`          | 60s        | —                        |
| `['portfolio/history']`       | 5min       | Successful trade         |

### Client State — `useState`

- **Trade form** — `amount`, `mode (buy/sell)`, `confirmModalOpen` — local to `TradeForm`
- **Filter/sort** — `activeFilter`, `sortBy` — local to Marketplace page
- **Chart range** — `range ('1D'|'7D'|'30D')` — local to `PriceChart`
- **Nav active route** — derived from `usePathname()`, not stored

### Realtime Subscriptions

| Channel             | Payload                                           | Client Action             |
| ------------------- | ------------------------------------------------- | ------------------------- |
| `card-prices`       | `{ cardId, newPrice, change24h }`                 | Flash price on card tile  |
| `trade-feed`        | `{ username, cardName, type, amount, totalCost }` | Prepend to dashboard feed |
| `leaderboard`       | `{ top10: [{ rank, username, value }] }`          | Re-render top 10 rows     |
| `player-{playerId}` | `{ newBalance, tradeId?, rescueGranted? }`        | Update balance header     |

### Query Invalidation Rules

- **After buy/sell** → invalidate `['portfolio']`, `['card', id]`, `['leaderboard']`
- **On price Realtime** → update card cache entry directly — no refetch
- **On balance Realtime** → update header directly — no refetch
- **On window focus** → React Query auto-refetches stale queries

---

## Design Tokens

```css
:root {
	--color-bg: #0d0d0d; /* page background */
	--color-surface: #141414; /* cards, panels, modals */
	--color-border: #2a2a2a; /* borders and dividers */
	--color-banana: #ffd600; /* primary accent */
	--color-up: #00e87a; /* price up, positive P&L, success */
	--color-down: #ff4d4d; /* price down, negative P&L, errors */
	--color-text-primary: #e8e8e8; /* headings, important labels */
	--color-text-muted: #666666; /* secondary copy, timestamps */
	--font-mono: "DM Mono"; /* prices, numbers, tickers */
	--font-sans: "Inter"; /* all UI text */
	--radius-card: 10px;
	--radius-btn: 6px;
	--transition-price: 150ms ease;
}
```

---

## Error Handling Standards

| Error                | Where It Shows                  | Message Copy                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------- |
| Network error        | Toast — bottom right            | "Connection issue. Please try again."                   |
| Insufficient balance | Inline below trade form         | "You need X BC more to place this order."               |
| Rate limit (429)     | Inline below trade form         | "Trading too fast. Wait a moment."                      |
| Invalid amount       | Inline below input              | "Amount must be greater than 0."                        |
| Session expired      | Redirect to `/login` + toast    | "Session expired. Please log in again."                 |
| Card not found       | Full-page error on `/card/[id]` | "This card no longer exists."                           |
| API 500              | Toast notification              | "Something went wrong. We've been notified."            |
| Empty state          | Illustrated grid empty state    | "No cards found. Try a different filter."               |
| Balance hits zero    | Dashboard banner (persistent)   | "You've gone broke! Claim 50 BC rescue to get back in." |

---

## V1 Acceptance Criteria

### Functional — all P0 must pass before V1 ships

- [ ] New player can signup → make first trade in under 2 minutes
- [ ] Trade form shows correct price preview before confirming
- [ ] Balance in header updates immediately after trade — no page refresh
- [ ] Leaderboard shows correct rank for logged-in player
- [ ] Price tick flash visible within 1 second of trade on marketplace
- [ ] Bankruptcy banner appears when balance reaches 0
- [ ] Rescue claim grants exactly 50 BC and banner disappears
- [ ] All error messages are human-readable — no raw API errors ever shown
- [ ] All forms reject empty submission with inline validation

### Non-Functional

- [ ] Lighthouse Performance ≥ 85 on `/dashboard`
- [ ] Time to Interactive < 3s on simulated 4G
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No console errors in Chrome DevTools on any screen
- [ ] All interactive elements reachable by Tab key
- [ ] All images have `alt` text
- [ ] No layout overflow at 1280px, 1024px, 768px
- [ ] No stale data visible longer than 30s on any active page

---

_Frontend V1 PRD · 6 screens · 38 requirements · 22 components · Next.js 15 + TypeScript + Tailwind_
