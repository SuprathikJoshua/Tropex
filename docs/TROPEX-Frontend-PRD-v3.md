# Tropex

## Frontend PRD — Version 3.0

**Product Requirements Document · Retention & AI · Frontend Engineering Spec**

> **Author:** Suprathik Joshua · IIIT Lucknow
> **Stack:** Next.js 15 + TypeScript + Tailwind + Recharts
> **Status:** Ready for Development
> **Depends On:** V1, V2 frontend fully shipped. Backend V3 API live.

---

## Document Meta

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Document Type  | PRD — Frontend                                                                 |
| Version        | V3.0 — Retention & AI                                                          |
| Scope          | Streak claim UI, newspaper page, market event banner, admin tool               |
| Out of Scope   | Backend logic, cron jobs, animations (V4), mobile (V4)                         |
| Dependencies   | Backend V3 API endpoints live before integration testing                       |
| Target Devices | Desktop (1280px+) primary — same as V1                                         |

---

## What V3 Adds to the Frontend

| Screen / Component    | Route              | What It Does                                        |
| --------------------- | ------------------ | --------------------------------------------------- |
| Streak Claim Banner   | `/dashboard`       | Shows claim button when reward is available         |
| Streak Status Widget  | `/dashboard`       | Shows current streak count and next claim time      |
| Newspaper Page        | `/newspaper`       | Today's AI-generated edition in broadsheet layout   |
| Newspaper Archive     | `/newspaper/archive`| Grid of all past editions, clickable                |
| Past Edition Page     | `/newspaper/[date]`| Single past edition full view                       |
| Market Event Banner   | `/dashboard`, `/marketplace` | Full-width animated banner for active events |
| Admin Tool            | Separate HTML file | Trigger/cancel events, view stats, generate newspaper |

---

## User Stories — V3

| As a...  | I want to...                                          | So that...                                       |
| -------- | ----------------------------------------------------- | ------------------------------------------------ |
| Player   | see a claim button when my daily reward is ready      | I never miss my 250 TC daily reward              |
| Player   | see my current streak count on the dashboard          | I feel motivated to keep my streak alive         |
| Player   | read the AI newspaper every morning                   | The game world feels alive and I stay engaged    |
| Player   | browse past newspaper editions                        | I can catch up on market history I missed        |
| Player   | see a market event banner when prices are affected    | I know why a card's price is behaving unusually  |
| Admin    | trigger and cancel market events from a simple tool   | I can control the game economy without touching the DB |

---

## Screen-by-Screen Requirements

### FE-STREAK — Dashboard Streak UI

> **Route:** `/dashboard` — added as new components to existing dashboard layout

| ID   | Feature              | Description                                                                                                                 | Acceptance Criteria                                                        | Priority |
| ---- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| S-01 | Streak Claim Banner  | Yellow persistent banner at top of dashboard when `canClaim = true`. Shows streak count + "Claim 250 TC" button.           | Only shows when API returns `canClaim: true`. Disappears after claim.      | P0       |
| S-02 | Claim Button         | Calls `POST /rewards/claim`. On success: balance header updates, streakDays increments, banner hides.                       | Cannot click twice. Shows spinner during request.                          | P0       |
| S-03 | Streak Counter       | Small widget in dashboard sidebar or header: 🔥 N day streak. Shows `nextClaimAt` countdown if already claimed today.       | Accurate countdown. Updates after successful claim.                        | P1       |
| S-04 | Already Claimed State| If `canClaim = false`, banner is hidden. Streak widget shows "Next reward in X hours".                                      | Never shows claim button if cooldown active.                               | P1       |

**API Calls:**
- `GET /rewards/status` — on dashboard mount, determine if claim is available
- `POST /rewards/claim` — on button click

---

### FE-NEWS — Newspaper Page

> **Route:** `/newspaper` — dedicated full page in the dashboard layout

| ID   | Feature            | Description                                                                                                                        | Acceptance Criteria                                                    | Priority |
| ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| N-01 | Newspaper Header   | Broadsheet-style header: "THE BANANA TIMES" in large serif-style font. Date of today's edition. Yellow accent line below.          | Renders on all screen sizes without overflow.                          | P0       |
| N-02 | Headlines Section  | 3-5 AI headlines rendered as large bold text. Each headline on its own row with a yellow bullet or numbering.                      | Headlines from API — never hardcoded.                                  | P0       |
| N-03 | Top Movers Section | Two-column layout: Top Gainers (green) and Top Losers (red). Each card shows: name, price, 24h change %.                           | Uses data from `topMovers` field of edition JSON.                      | P0       |
| N-04 | Market Incident    | Full-width text block styled like a news article paragraph. Shows AI-generated incident text explaining market moves.               | Text from `incident` field of edition JSON.                            | P0       |
| N-05 | Leaderboard Drama  | Small section showing rank climbers and fallers from past 24h. Green arrow up, red arrow down.                                     | Uses data from `leaderboard` field.                                    | P1       |
| N-06 | Not Yet Generated  | If today's edition not yet available (before midnight cron runs), show empty state: "Today's edition is being prepared."           | Never crashes. Graceful empty state.                                   | P0       |
| N-07 | Archive Link       | Button at bottom: "Browse Past Editions →" → `/newspaper/archive`                                                                  | Always visible.                                                        | P1       |

**API Calls:**
- `GET /newspaper/today` — on page mount

---

### FE-ARCHIVE — Newspaper Archive

> **Route:** `/newspaper/archive`

| ID   | Feature           | Description                                                                                                      | Acceptance Criteria                          | Priority |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------- |
| A-01 | Edition Grid      | Grid of past editions. Each card shows: date, first headline, sentiment badge (BULLISH/BEARISH/NEUTRAL).          | Sorted newest first. 12 per page.            | P0       |
| A-02 | Sentiment Badge   | BULLISH = green badge. BEARISH = red badge. NEUTRAL = grey badge.                                                | Correct color per sentiment value.           | P0       |
| A-03 | Click to Open     | Clicking edition card navigates to `/newspaper/[date]`                                                            | Correct date in URL.                         | P0       |
| A-04 | Empty State       | If no editions exist yet, show: "No editions yet. Check back after midnight."                                     | No crash.                                    | P0       |
| A-05 | Pagination        | Load More button appends next 12 editions.                                                                        | No full-page reload.                         | P1       |

**API Calls:**
- `GET /newspaper/archive?page=1` — on mount and Load More

---

### FE-EDITION — Single Past Edition

> **Route:** `/newspaper/[date]`

| ID   | Feature        | Description                                                             | Acceptance Criteria                               | Priority |
| ---- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| E-01 | Full Edition   | Same layout as today's newspaper page but for a past date.              | All sections render with archived data.           | P0       |
| E-02 | Back Link      | "← Back to Archive" link at top.                                        | Navigates to `/newspaper/archive`.                | P0       |
| E-03 | 404 State      | If date has no edition, show "No edition found for this date."          | No crash. Clean error state.                      | P0       |

**API Calls:**
- `GET /newspaper/:date` — on mount using date from URL params

---

### FE-EVENT — Market Event Banner

> **Location:** Top of `/dashboard` and `/marketplace` pages — above main content

| ID   | Feature              | Description                                                                                                              | Acceptance Criteria                                           | Priority |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------- |
| EV-01| Event Banner         | Full-width banner when `GET /events/active` returns events. Shows event title, description, affected cards, time remaining.| Only shows when active events exist. Hidden when none.        | P0       |
| EV-02| Event Type Color     | FLASH_CRASH = red banner. SECTOR_BOOM = green. WHALE_SIGHTING = blue. GOVT_DECISION = yellow.                            | Correct color per event type.                                 | P0       |
| EV-03| Countdown Timer      | Live countdown to `endsAt` updating every second.                                                                        | Accurate. Shows "Ended" when expired.                         | P1       |
| EV-04| Affected Cards       | List of affected card names as clickable badges → navigates to `/card/[id]`.                                             | Correct card links.                                           | P1       |
| EV-05| Multiple Events      | If more than one active event, show them stacked or in a carousel.                                                       | No layout breaking with 2-3 events.                           | P2       |

**API Calls:**
- `GET /events/active` — on dashboard and marketplace mount. Refetch every 60s.

---

### FE-ADMIN — Admin Tool

> **Type:** Standalone HTML file — NOT part of Next.js app. No React. Plain HTML + vanilla JS.
> **File:** `admin/index.html`
> **Auth:** `x-admin-secret` header sent with every request. Entered once via prompt on load.

| ID   | Feature               | Description                                                                                                             | Acceptance Criteria                               | Priority |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| AD-01| Secret Key Prompt     | On page load, prompt for admin secret. Stored in memory only — never localStorage.                                      | Requests fail without correct secret.             | P0       |
| AD-02| Trigger Event Form    | Form fields: Event Type (dropdown), Title, Description, Affected Card IDs (comma-separated), Multiplier, Duration (mins).| POST to `/admin/events`. Success shows event ID.  | P0       |
| AD-03| Active Events List    | Table of all active events: ID, type, title, affected cards, endsAt, Cancel button.                                     | Cancel calls DELETE `/admin/events/:id`.          | P0       |
| AD-04| System Stats          | Cards showing: total players, total trades, total volume, active events count.                                           | Fetches from `GET /admin/stats`.                  | P1       |
| AD-05| Generate Newspaper    | Button to manually trigger newspaper generation for today.                                                               | POST to `/admin/newspaper/generate`. Shows result.| P1       |
| AD-06| Error Display         | All errors shown inline. Wrong secret shows "Unauthorized".                                                              | No silent failures.                               | P0       |

---

## Design Tokens (unchanged from V1)

```css
:root {
  --color-bg:           #0D0D0D;
  --color-surface:      #141414;
  --color-border:       #2A2A2A;
  --color-banana:       #FFD600;
  --color-up:           #00E87A;
  --color-down:         #FF4D4D;
  --color-text-primary: #E8E8E8;
  --color-text-muted:   #666666;
  --font-mono:          'DM Mono';
  --font-sans:          'Inter';
}
```

### Event Banner Colors

| Event Type       | Background | Text    |
| ---------------- | ---------- | ------- |
| FLASH_CRASH      | `#FF4D4D`  | `#0D0D0D` |
| SECTOR_BOOM      | `#00E87A`  | `#0D0D0D` |
| WHALE_SIGHTING   | `#4D7FFF`  | `#FFFFFF` |
| GOVT_DECISION    | `#FFD600`  | `#0D0D0D` |
| VOLATILITY_STORM | `#B366FF`  | `#FFFFFF` |

---

## New Components — V3

| Component           | File                               | Props                            | API Call                    |
| ------------------- | ---------------------------------- | -------------------------------- | --------------------------- |
| `StreakBanner`      | `/components/dashboard/StreakBanner.tsx` | `streakDays, canClaim, onClaim` | `POST /rewards/claim`       |
| `StreakWidget`      | `/components/dashboard/StreakWidget.tsx` | `streakDays, nextClaimAt`      | none                        |
| `EventBanner`       | `/components/ui/EventBanner.tsx`   | `events[]`                       | none (passed from page)     |
| `NewspaperHeader`   | `/components/newspaper/Header.tsx` | `date`                           | none                        |
| `HeadlinesList`     | `/components/newspaper/Headlines.tsx` | `headlines[]`                 | none                        |
| `TopMoversGrid`     | `/components/newspaper/TopMovers.tsx` | `topMovers[]`                  | none                        |
| `IncidentBlock`     | `/components/newspaper/Incident.tsx` | `incident`                     | none                        |
| `EditionCard`       | `/components/newspaper/EditionCard.tsx` | `edition`                    | none                        |

---

## V3 Acceptance Criteria

### Functional — all P0 must pass before V3 ships

- [ ] Streak banner appears on dashboard when `canClaim = true`
- [ ] Claiming reward updates balance header without page reload
- [ ] Claiming twice in 24 hours shows correct error / hides button
- [ ] Streak counter shows correct day count after claim
- [ ] Newspaper page renders today's edition with all sections
- [ ] Newspaper shows graceful empty state before midnight cron runs
- [ ] Archive page lists past editions sorted newest first
- [ ] Past edition page renders correctly by date URL param
- [ ] Market event banner appears on dashboard when events active
- [ ] Event countdown timer accurate and updates live
- [ ] Admin tool can trigger a market event with correct fields
- [ ] Admin tool shows 401 error with wrong secret
- [ ] Admin can cancel active event and it disappears from active list

### Non-Functional

- [ ] `tsc --noEmit` passes with zero errors
- [ ] No console errors on any V3 page
- [ ] All V3 pages load without breaking existing V1/V2 pages
- [ ] Admin tool works in plain browser — no build step required

---

_Frontend V3 PRD · 4 new pages · 1 admin tool · 8 new components · Streak + AI Newspaper + Market Events_
