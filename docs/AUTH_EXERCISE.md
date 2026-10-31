# Auth exercise plan: run with real credentials

**Status: NOT YET OBSERVED.** Google OAuth, magic-link email, session persistence and logout have
only been configured, never exercised with real providers. Treat auth as unverified until every box
below is ticked and reported back.

Use a **staging** setup throughout: a staging Neon branch, a staging deployment (or `npm run build && npm run start`
locally), and test accounts only. Dev login must be **off**: don't set `ENABLE_DEV_LOGIN`, and note that a production
build ignores it anyway.

---

## 0. Preparation

| # | Step | You should see | Failure looks like |
|---|---|---|---|
| 0.1 | Create a Neon **staging** branch. Copy its pooled URL (`DATABASE_URL`, with `?sslmode=require&pgbouncer=true`) and its direct URL (`DIRECT_URL`, with `?sslmode=require`). | Two connection strings | — |
| 0.2 | `npm run db:migrate:status` with both URLs exported | `2 migrations found… not yet applied` (fresh) or `Database schema is up to date!` | `P1001 Can't reach database server`: wrong host or SSL settings |
| 0.3 | `npm run db:migrate:deploy`, then `npx prisma db seed` | `All migrations have been successfully applied.`, then `✓ All 18 recipes pass validateRawCompliance` and 3 `✓ Template` lines | Any `✗` compliance line (the seed aborts and writes nothing), or a migration error |
| 0.4 | Set the app env: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL=<exact staging origin, no trailing slash>`, `NEXTAUTH_SECRET=$(openssl rand -base64 32)`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EMAIL_SERVER`, `EMAIL_FROM` | — | — |
| 0.5 | Open `<origin>/login` | A **"Continue with Google"** button and an **"Email me a magic link"** button. **No** "Sign in (dev)" button | "Sign in (dev)" visible: **stop**, the dev-login gate is wrong. "No sign-in providers are configured": the env vars aren't loaded |
| 0.6 | Open `<origin>/api/auth/providers` | JSON with `google` and `email`, **no** `dev-login` | `dev-login` present: **stop** (security) |

## 1. Google OAuth round-trip (staging Neon)

Pre-req: in Google Cloud Console → Credentials → your OAuth client, add the authorized redirect URI
`<origin>/api/auth/callback/google`. If the consent screen is in "Testing" mode, add your Google account as a test user.

| # | Step | You should see | Failure looks like |
|---|---|---|---|
| 1.1 | In a fresh private window, open `<origin>/daily` | Redirect to `/login?callbackUrl=%2Fdaily` (or the full URL) | `/daily` renders while logged out: the middleware isn't protecting it |
| 1.2 | Click **Continue with Google** | Google's account chooser for **your** OAuth app name | `Error 400: redirect_uri_mismatch`: the redirect URI in step "Pre-req" doesn't exactly match `NEXTAUTH_URL` |
| 1.3 | Choose the test account and consent | You land back on **`/daily`**, the 8 slots render (Infused Water → Dessert), and the sidebar/header shows your email | `/login?error=OAuthCallback` or `OAuthAccountNotLinked` (see 1.5); `/api/auth/error?error=Configuration` (bad secret, client ID or DB); slots never load (DB/session problem; check server logs) |
| 1.4 | DB check: `psql "$DIRECT_URL" -c 'select u.email, a.provider from "User" u join "Account" a on a."userId"=u.id'` | One row: your email, `google` | No row: the adapter isn't writing. Two `User` rows for one email: duplicate-user bug |
| 1.5 | Edge case: if this email was **first** used via magic link, Google sign-in shows `OAuthAccountNotLinked` | This is expected NextAuth behaviour (no automatic linking); just note it | — |
| 1.6 | Tick **Breakfast** on `/daily`, then open `/` | Progress ring **1/8** | Ring still 0/8: revalidation or session issue |

## 2. Magic-link email (real SMTP)

Pre-req: `EMAIL_SERVER=smtp://<user>:<pass>@<host>:587` from a real provider (Postmark, Resend SMTP,
SendGrid, SES…) and `EMAIL_FROM` on a domain verified with that provider (SPF/DKIM set).

| # | Step | You should see | Failure looks like |
|---|---|---|---|
| 2.1 | Private window → `/login` → enter an inbox you control → **Email me a magic link** | Redirect to `/login?check=email` with "Check your inbox" | `/api/auth/error?error=EmailSignin`: SMTP auth or connection failure (check server logs for the nodemailer error) |
| 2.2 | DB check: `select identifier, expires from "VerificationToken"` | One row for your email, expiring in about 24h | No row: the adapter isn't writing tokens |
| 2.3 | Check the inbox (and spam) | Within about 1 minute, an email from `EMAIL_FROM` with a "Sign in" link whose host is your `NEXTAUTH_URL` | No email: check the provider's activity log. Link host is `localhost` on staging: `NEXTAUTH_URL` is wrong. Lands in spam: SPF/DKIM not set |
| 2.4 | Click the link | You're signed in and land on the callback URL (or `/`) | `error=Verification`: token expired or already used, or the link was pre-fetched by a mail scanner (try again with a different inbox) |
| 2.5 | Click the **same link again** | An error page (`error=Verification`): tokens are single-use | It signs you in again: **security failure**, report it |
| 2.6 | DB check: `select email, "emailVerified" from "User" where email='<inbox>'` | `emailVerified` set | Null: the adapter didn't complete verification |

## 3. Session persistence across reload

| # | Step | You should see | Failure looks like |
|---|---|---|---|
| 3.1 | While signed in (via Google or email), DevTools → Application → Cookies | `__Secure-next-auth.session-token` (on https; plain `next-auth.session-token` on http), `HttpOnly`, `Secure` on https, `SameSite=Lax` | Missing `HttpOnly` or `Secure` on https: report it |
| 3.2 | Hard-reload `/daily` (Cmd/Ctrl+Shift+R) | Still signed in. Your previously ticked slots are still ticked | Redirect to `/login`: the cookie isn't persisting (check `NEXTAUTH_URL` scheme/host and `NEXTAUTH_SECRET` stability) |
| 3.3 | Close the tab, open a new one at `<origin>/` | Still signed in. The ring shows today's count | Signed out: the session cookie was set as a browser-session cookie, or the domain is wrong |
| 3.4 | On Vercel: trigger a redeploy, then reload | Still signed in (the JWT stays valid because `NEXTAUTH_SECRET` is unchanged) | Signed out after a redeploy: `NEXTAUTH_SECRET` isn't set in Vercel, or it differs per deployment |

## 4. Logout invalidates the session

| # | Step | You should see | Failure looks like |
|---|---|---|---|
| 4.1 | Before logging out, copy the `session-token` cookie value somewhere temporary | — | — |
| 4.2 | Click **Sign out** | You land on `/`, see a "Sign in" button, and the ring shows 0/8 with the sign-in prompt | Still shows your email: the sign-out didn't clear the cookie |
| 4.3 | Open `/daily` | Redirect to `/login` | `/daily` renders: the session is still valid |
| 4.4 | DevTools → Cookies | The `session-token` cookie is gone | Cookie still present |
| 4.5 | **Replay check:** manually re-add the copied cookie, then reload `/daily` | ⚠️ **Expected with the current config: you are signed back in.** Sessions are stateless JWTs (`session.strategy: "jwt"`), so sign-out deletes the cookie but can't revoke a token that was copied. It stays valid until it expires (30 days by default) | — |
| 4.6 | Record the result of 4.5 | — | If "logout invalidates the session" must hold **server-side** (stolen-cookie revocation), that's a change request: switch to `strategy: "database"` (and drop the credentials provider from production, which already happens) or shorten `maxAge`. Not changed yet, pending your decision |

---

### Report back
For each row, record ✅ / ❌ and paste any error URL (`?error=…`) and the matching server log lines.
Auth counts as "working" only when sections 1–4 are all ✅ (with 4.5 accepted or a decision made).
