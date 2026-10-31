# TITAN-RAW 🌿

A structured, **100% raw vegan** lifestyle app built around abundance and good nutrient distribution, not restriction.
Every recipe is uncooked, never heated above **115°F (46°C)**, and gluten-, dairy- and oil-free. Overt fats come only from whole foods.

**Stack:** Next.js 14 (App Router, TypeScript strict) · PostgreSQL + Prisma · NextAuth (magic link, Google) · Tailwind + shadcn/ui · Zod · Vitest · Playwright

---

## Quick start (about 5 minutes)

### Prerequisites
- **Node 20+**
- A **PostgreSQL connection string**: local Postgres, `docker compose up -d` (uses the included `docker-compose.yml`), or a Neon/Supabase database

### Run it
```bash
npm install
```
```bash
cp .env.example .env
```
Edit `.env` if your database URL differs. The defaults match `docker-compose.yml`.
```bash
npx prisma migrate dev
```
```bash
npx prisma db seed
```
```bash
npm run dev
```
Open http://localhost:3000. With `ENABLE_DEV_LOGIN="true"` (the default in `.env.example`) you can sign in with any email and no password. Use it locally only.

The seed is **compliance-gated**: it runs `validateRawCompliance` on every recipe *before* writing anything, and it aborts with the full list of violations if any recipe fails. It is idempotent. Recipes are upserted by title, and template plans are rebuilt.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (pooled URL on Neon/Supabase) |
| `DIRECT_URL` | ✅ | Direct (non-pooled) URL, used by migrations. Locally, the same value as `DATABASE_URL` |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | e.g. `http://localhost:3000` or your production URL |
| `GOOGLE_CLIENT_ID` | optional | Google OAuth (redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google`) |
| `GOOGLE_CLIENT_SECRET` | optional | Google OAuth |
| `EMAIL_SERVER` / `EMAIL_FROM` | optional | SMTP for email magic links, e.g. `smtp://user:pass@host:587` |
| `ENABLE_DEV_LOGIN` | dev/E2E only | `"true"` enables a passwordless dev login. Allowed **only** when `NODE_ENV=development` and `NEXTAUTH_URL` is `localhost`/`127.0.0.1`, and never when `VERCEL`/`VERCEL_ENV` is set (`src/lib/dev-login.ts`, fully unit-tested). It never signs in as an account created through Google or email |
| `APP_TIMEZONE` | optional | IANA tz that defines "today" for daily logs (default `UTC`) |
| `ADMIN_EMAILS` | optional | Comma-separated list allowed to run `auditRecipe`. Unset means dev-only access; production denies everyone |

## Testing & quality gate

```bash
npx tsc --noEmit
```
```bash
npm run lint
```
```bash
npm run build
```
```bash
npx vitest run
```
```bash
npx playwright test
```

- **Vitest** covers the compliance engine (every rule plus edge cases), every seed recipe, the seed gate, Zod schemas and date helpers.
- **Playwright** starts `next dev` itself (dev login exists only in development) and needs a seeded DB. The production build is checked separately by `npm run build`. It covers:
  1. login → `/daily` → check Breakfast → HOME ring shows **1/8**
  2. `/plans/new` → 3-day plan with all 8 day-1 slots → plan appears in `/plans`
  3. `/recipes` → search "Jungle" → detail → **Add All to Shopping List** → `localStorage["titan-raw-shopping-list"]` holds the right ingredients
  4. Start a template plan → `/daily` shows that plan's recipes, and +8 oz water works
  5. Protected routes redirect to `/login`, and no page scrolls horizontally at **375px**
- If Playwright can't find a browser in your environment, set `PW_CHROMIUM_PATH=/path/to/chromium`.

CI runs the full gate on every push (`.github/workflows/quality-gate.yml`).

## Deploying to Vercel

1. **Create a database** on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - Neon: `DATABASE_URL` = pooled connection string (`-pooler` host, add `?sslmode=require&pgbouncer=true`); `DIRECT_URL` = direct connection string.
   - Supabase: `DATABASE_URL` = transaction pooler (port 6543, `?pgbouncer=true`); `DIRECT_URL` = session/direct connection (port 5432).
2. **Import the repo** in Vercel and set the env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and optionally `EMAIL_SERVER` and `EMAIL_FROM`. **Do not** set `ENABLE_DEV_LOGIN`.
3. **Build:** `vercel.json` sets the build command to `npm run vercel-build`, which runs `prisma migrate deploy && next build`, so migrations apply on every deploy. `postinstall` runs `prisma generate`.
4. **Seed once** against production from your machine:
   ```bash
   DATABASE_URL="<direct url>" npx prisma db seed
   ```
5. In Google Cloud Console, add `https://<your-domain>/api/auth/callback/google` as an authorized redirect URI.

## Architecture at a glance

```
src/
  app/(auth)/login         sign-in (Google, magic link, dev login)
  app/(main)/              bottom nav (mobile) / sidebar (desktop)
    page.tsx               HOME: progress ring, Today's Focus, next slot
    recipes/               list (search + category) and detail
    plans/                 list, new (client form), [id] (accordion + Start Plan)
    daily/                 DAILY: 8 fixed slots, toggles, water, assign recipe
  components/              recipe-card, meal-slot-row, progress-ring, plan-day-accordion, shopping-list-drawer, ui/*
  lib/
    compliance.ts          deterministic raw-compliance rule engine (pure)
    actions/               Server Actions (Zod-validated, auth-guarded)
    daily-service.ts       DailyLog read model shared by HOME and DAILY
    shopping-list.ts       localStorage-only shopping list hook
prisma/schema.prisma, prisma/seed.ts
```

**Raw compliance rules** (`src/lib/compliance.ts`):
1. `temperatureStatus === "raw_under_115F"`
2. No ingredient contains *pasteurized, steamed, roasted, toasted, cooked, boiled, baked, fried, canned*, and no ingredient is an extracted oil
3. ≥1 prep technique, all drawn from *blend, spiralize, marinate, dehydrate, sprout, ferment, soak, chop, juice, process, massage*
4. `fatSource`, if present, is a whole food (avocado, nuts, seeds, olives, coconut meat). Oils and butters are rejected, cacao butter included
5. ≥2 key micronutrients
6. (guard) no instruction calls for a temperature above 115°F

**Non-negotiables:** the 8 meal slots are fixed in this order: Infused Water → Breakfast → Morning Snack → Lunch → Afternoon Snack → Dinner → Evening Snack → Dessert. The shopping list never leaves `localStorage`. HOME progress = `completedSlots.length / 8`.

Architecture plan and schema rationale: [`tasks/todo.md`](tasks/todo.md). Claude Code agent and model-routing policy: [`CLAUDE.md`](CLAUDE.md) and [`.claude/`](.claude).
