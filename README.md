# KLAUN-EC Platform

Full-stack web platform implementing the **KLAUN-EC economic model** from the whitepaper
*« Introduction et Modèle Économique »* — community mining ecosystem built around the
**KLAUN COIN (KLC)** token (reference value: 1 KLC = 1 USD).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MongoDB (Mongoose) · JWT auth (httpOnly cookie) · bilingual FR/EN UI.

---

## 1. Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional for local dev — defaults work out of the box)
cp .env.example .env.local

# 3. Start MongoDB (local default: mongodb://localhost:27017/klaunec)
brew services start mongodb-community        # macOS / Homebrew
# ...or point MONGODB_URI in .env.local to a MongoDB Atlas cluster

# 4. Seed the database (11 plans + admin account)
npm run seed

# 5. Run
npm run dev          # development  → http://localhost:3000
# or: npm run build && npm start   # production
```

**Default admin account** (created by the seed — change the password immediately):

| Email               | Password      |
| ------------------- | ------------- |
| `admin@klaunec.com` | `Admin@12345` |

Override at seed time with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars.

---

## 2. What's implemented (whitepaper coverage)

| Whitepaper section | Implementation |
| --- | --- |
| 11 Membership Plans (STARTER 10 USD → HUB 2000 2 000 USD) | Seeded in DB, purchasable, daily KLC allocation per plan |
| Daily Mining (0.10 → 20 KLC/day) | Lazy credit on every session/wallet fetch **+** cron endpoint |
| Referral Program G1/G2/G3 (5 % → 12.5 % / 2–4 % / 1–2 %) | Credited instantly on each plan purchase, rates depend on the purchased plan |
| Upgrade Bonus & Renouvellement (5 % / 7.5 %) | Paid to the direct sponsor when a referred member renews while their contract is still active |
| Award Program (SAPPHIRE → CROWN) | Auto-evaluated sliding-window qualification; bonus = rate × qualifying volume |
| Mentor Bonus (2 %) | Paid to the direct sponsor on each award earned by a referral |
| Withdrawal Fee (5 %) | Deducted on withdrawal request (net = 95 %), min. 10 KLC, admin approval workflow |
| KLC Exchange (1 KLC = 1 USD) | Reference value displayed across the UI with the whitepaper disclaimer |

### Pages
- `/` — landing page presenting the full whitepaper (FR/EN)
- `/login`, `/register` (referral code via `?ref=CODE`)
- `/dashboard` — overview, plans, mining, referrals (3-generation tree), awards, wallet
- `/admin` — statistics, users, withdrawal approval, mining hubs

---

## 3. Economic engine (where the rules live)

| File | Responsibility |
| --- | --- |
| `src/lib/plans.ts` | All whitepaper constants: plans, referral rates, renewal brackets, award tiers, 5 % fee |
| `src/lib/commissions.ts` | Purchase flow → G1/G2/G3 commissions, renewal bonus, award evaluation + mentor bonus |
| `src/lib/mining.ts` | Daily mining credit (per active membership, capped at end date) |
| `src/models/*` | User, Plan, Membership, Transaction, Withdrawal, Award schemas |
| `scripts/seed.mjs` | Plans + admin seeding |

### Daily mining — two activation paths
1. **Lazy**: every `GET /api/auth/me` / `GET /api/wallet` credits all full days elapsed since the last credit.
2. **Cron** (recommended in production, once a day):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/mining
```

System crontab example: `17 3 * * * curl -s -H "Authorization: Bearer …" https://…/api/cron/mining`

---

## 4. Configuration (.env.local)

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017/klaunec` | MongoDB connection string (use Atlas URI in production) |
| `JWT_SECRET` | dev fallback | **Set a long random value in production** |
| `CRON_SECRET` | dev fallback | Bearer token protecting `/api/cron/mining` |

## 5. API overview

`POST /api/auth/register|login|logout` · `GET /api/auth/me` · `GET /api/plans` ·
`GET|POST /api/memberships` · `POST /api/mining/credit` · `GET /api/cron/mining` ·
`GET /api/referrals` · `GET /api/awards` · `GET /api/wallet` ·
`GET|POST /api/withdrawals` · `GET /api/admin/stats|users|withdrawals|memberships` ·
`PATCH /api/admin/withdrawals/:id` (`approve` | `reject`)

All responses: `{ ok: true, data: … }` or `{ ok: false, error: "<code>" }`.

## 6. Production checklist

- [ ] Set `JWT_SECRET`, `CRON_SECRET`, `MONGODB_URI` (Atlas) in the hosting env
- [ ] Change the admin password
- [ ] Schedule the daily cron call to `/api/cron/mining`
- [ ] Serve over HTTPS (the auth cookie is `Secure` in production)
- [ ] Legal review of the economic-model wording for the target jurisdiction
