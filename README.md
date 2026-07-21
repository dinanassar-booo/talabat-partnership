# talabat for Business — Partner Portal

MVP partner benefits platform. Allows corporate partners to self-serve employee benefit programs (voucher wallet, TPro, dine-out) without manual CRM intervention.

## Quick start

```bash
npm install
node --input-type=module src/db/migrate.ts   # creates dev.db + seeds demo data
npm run dev
```

Open http://localhost:3000

**Demo login:** `demo@emirates.com` / `demo1234`

## Architecture

- **Framework:** Next.js 16 App Router (TypeScript)
- **Database:** libsql (SQLite) + Drizzle ORM — zero native binaries
- **Auth:** JWT in httpOnly cookie (bcrypt passwords)
- **PII model:** Employee IDs stored as HMAC-SHA256 hashes only. Raw IDs never enter the system.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/dashboard` or `/login` |
| `/signup` | 3-step partner registration with T&C |
| `/login` | Session login |
| `/dashboard` | Metrics, campaigns, quick links |
| `/dashboard/employees` | Upload CSV, manage opt-outs |
| `/dashboard/benefits` | Benefit type catalog |
| `/dashboard/campaigns` | All campaigns with GMV tracking |
| `/dashboard/campaigns/new` | New campaign wizard |
| `/dashboard/onboarding` | Setup checklist |
| `/dashboard/billing` | Budget top-up |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create partner account |
| `/api/auth/login` | POST | Login → sets session cookie |
| `/api/auth/logout` | POST | Clear session |
| `/api/employees` | GET | List employees (hashes only) |
| `/api/employees/upload` | POST | CSV upload (add or replace) |
| `/api/employees/[id]` | DELETE | Soft-remove employee |
| `/api/campaigns` | GET/POST | List / create campaigns |
| `/api/benefits` | GET | Active benefit types |
| `/api/billing` | GET | Budget account |
| `/api/billing/topup` | POST | Add balance |

## Week 2 TODO (Braze integration)

- [ ] `POST /api/braze/trigger` — fire canvas when campaign goes active
- [ ] Webhook receiver for redemption events → update `budget_used`
- [ ] Canvas Context payload builder (creditValue, cycleType, partnerName)
- [ ] Auto-enroll employees in campaign on CSV upload
- [ ] Campaign status → `active` when budget > 0 and employees > 0
