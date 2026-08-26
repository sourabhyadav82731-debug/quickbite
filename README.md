# QuickBite

A multi-sided food delivery platform with 4 role-based portals (Customer, Restaurant, Delivery,
Admin) sharing one NestJS backend and one Next.js frontend. This is a **thin scaffold**: the core
cross-portal order lifecycle is fully wired end-to-end with real auth, REST, and WebSockets; a
number of auxiliary features are intentionally stubbed (see "Known limitations" below).

## Stack

- **apps/api** — NestJS, TypeORM + SQLite (auto-seeded dev DB), JWT auth (access + refresh,
  bcrypt, RBAC), Swagger docs, two Socket.IO gateways (`/ws/orders`, `/ws/delivery`).
- **apps/web** — Next.js 16 App Router, one app serving the launcher hub plus all 4 portal route
  groups, each with its own CSS-variable theme and light/dark toggle. Zustand for the cart,
  TanStack Query for server state, socket.io-client for realtime.
- **packages/types, config, validation, api-client** — shared across both apps, consumed as raw
  TypeScript (no build step) via `transpilePackages` (web) and `tsconfig` paths (api).

## Setup

Requires Node.js and pnpm (already installed on this machine via Homebrew).

```bash
cd ~/quickbite
pnpm install
cp .env.example apps/api/.env
pnpm dev   # runs both apps concurrently
```

- API: http://localhost:3000 (Swagger at `/api/docs`)
- Web: http://localhost:3001

The SQLite database auto-seeds on first boot (empty `users` table) with demo accounts, sample
restaurants/menus, coupons, a driver, and a few orders in different lifecycle states so every
screen is populated immediately. Re-run manually anytime with `pnpm seed` (only seeds if the DB
is empty).

## Demo credentials

All demo accounts use password `Password@123`:

| Role | Email |
|---|---|
| Customer | customer@quickbite.com |
| Restaurant Owner | owner@quickbite.com |
| Delivery Partner | driver@quickbite.com |
| Admin | admin@quickbite.com |

## Known limitation: one browser session at a time

The web app is a single Next.js origin with one shared JWT slot (localStorage + a `qb_role`
cookie for route-guarding middleware). Logging in as a second role in the **same browser** will
overwrite the first session. To use multiple roles simultaneously (e.g. to watch an order move
live across Customer → Restaurant → Delivery → Admin), use separate browser profiles or
incognito windows per role.

## End-to-end smoke test

1. Open http://localhost:3001 — confirm all 4 portal cards render with a green "API online" dot.
2. **Customer** (own browser profile): log in, browse a restaurant, add a dish (try one with
   addons), check out with a seeded address and the `WELCOME50` coupon → order appears in
   Orders as `PLACED`.
3. **Restaurant owner** (separate profile): `/restaurant/kitchen` — the new ticket appears live
   with no refresh. Accept → Start Preparing → Food Ready.
4. Confirm the customer's order tracking page (`/customer/orders/[id]`) advances live as the
   restaurant changes status, and shows a delivery-partner card once a driver is assigned.
5. **Delivery partner** (separate profile): go online in the header. An offer popup appears with
   a 45s countdown — accept it, then `/delivery/active` walks through all 6 stages, using the
   OTPs shown on the customer's tracking page for pickup and drop.
6. **Admin** (separate profile): `/admin/orders` reflects the order live; `/admin/live-map` shows
   the driver's dot moving (the active-delivery page pings a simulated location every 4s while
   "Out for Delivery").
7. Confirm the order reaches `DELIVERED` everywhere and the customer can leave a review.

## Known limitations / stubbed for this pass

These are clearly labeled in their respective UI screens:

- **Payments** — no real gateway; checkout simulates an instantly-succeeded payment.
- **Maps** — no Google Maps/Mapbox key; live-map and heatmap use simple SVG visualizations.
- **AI Copilots** (restaurant & delivery) — canned responses, not a real LLM integration.
- **PDF receipts, staff permissions enforcement, payout bank scheduling, fraud/ML detection,
  operating-hours persistence** — UI exists but isn't wired to persistent backend state.
- Production build (`pnpm build`) is not yet configured to bundle the workspace packages for
  `apps/api`; `pnpm dev` (ts-node) is the supported path for now.
- Next's `middleware.ts` convention is deprecated in Next 16 in favor of `proxy.ts` (still
  functional, shows a build-time warning only).

## Commit

This repo was `git init`'d but nothing has been committed yet — review the working tree and
commit when ready.
