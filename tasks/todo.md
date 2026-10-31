# TITAN-RAW — Architecture Plan

Status legend: [x] done · [ ] open

## 1. Prisma schema rationale
- **Enums** `MealSlot`, `RecipeCategory`, `PlanCategory` are Postgres enums, so invalid slots can't be stored.
  The order of `MealSlot` is the canonical day order. The app reads it from `MEAL_SLOTS` in `src/types/index.ts`, never from the enum's declaration order at runtime.
- **Recipe**: `ingredients`/`instructions` are `Json` (string[]) as specified. Compliance metadata (`temperatureStatus`, `fatSource`, `keyMicronutrients`, `prepTechniques`) lives on the row so we can re-audit at any time.
- **MealPlan** has a nullable `userId`. `null` + `isTemplate=true` means a shared template.
- **MealPlanEntry** `@@unique([planId, day, slot])` allows one recipe per slot per day. Deleting a plan cascades to its entries.
- **DailyLog** `@@unique([userId, date])` with `@db.Date` gives one row per user per calendar day, so upserts are idempotent.
- **NextAuth models** (`Account`, `Session`, `VerificationToken`) are added because the spec's `User` references them and the Prisma adapter requires them.
- **Additive deviations, needed to implement the spec:**
  - `DailyLog.planId` / `DailyLog.planDay`: `startMealPlan` stamps each future day with the plan and its day number, which is how `/daily` knows the "active plan for today". `onDelete: SetNull`.
  - `DailyLog.assignedRecipes Json @default("{}")`: a `{ [slot]: recipeId }` map for the "Assign Recipe" dropdown when no plan is active.
  - `Recipe` gets `@@index([category])`.

## 2. Server Actions (all inputs Zod-validated, all mutations require auth)
| Action | File | Effect | Revalidates |
|---|---|---|---|
| `auditRecipe(recipeId)` | recipe-actions.ts | runs `validateRawCompliance`. Requires auth; restricted to `ADMIN_EMAILS` when that is set | — |
| `getTodayLog()` | daily-actions.ts | find-or-create today's DailyLog; resolves plan or assigned recipes per slot | — |
| `toggleMealSlot(date, slot)` | daily-actions.ts | add/remove slot in `completedSlots` | `/`, `/daily` |
| `incrementWater(date)` | daily-actions.ts | `infusedWaterOz += 8` | `/`, `/daily` |
| `assignRecipeToSlot(date, slot, recipeId)` | daily-actions.ts | sets `assignedRecipes[slot]` | `/daily` |
| `createMealPlan(payload)` | plan-actions.ts | MealPlan + entries in one nested create | `/plans` |
| `startMealPlan(planId)` | plan-actions.ts | upsert DailyLog for today … today+duration-1 with planId/planDay | `/`, `/daily`, `/plans` |

"Today" is computed on the server in `APP_TIMEZONE` (default UTC) by `lib/date.ts`. The client never sends its own clock, so HOME and DAILY always agree.

## 3. Compliance rule breakdown (`src/lib/compliance.ts`)
Deterministic, synchronous, pure.
1. `temperatureStatus === 'raw_under_115F'`.
2. No ingredient contains a banned term (pasteurized, steamed, roasted, toasted, cooked, boiled, baked, fried, canned). Case-insensitive substring match. Ingredients must be a string[].
   2b. No ingredient lists an extracted oil (`\boils?\b`). This enforces the oil-free non-negotiable.
3. ≥1 prepTechnique, and every technique is in {blend, spiralize, marinate, dehydrate, sprout, ferment, soak, chop, juice, process, massage}.
4. If present, `fatSource` must not contain `oil` or `butter` (strict raw: cacao butter is rejected too), and it must name a whole-food fat: avocado, nuts (incl. named nuts), seeds (incl. named seeds), olives, coconut meat.
5. `keyMicronutrients.length >= 2`.
6. (Extra guard) any °F temperature in the instructions must be ≤ 115.

## 4. Seed strategy
- 15 required recipes + 3 infused-water recipes. Without the waters, the INFUSED_WATER slot would have nothing to assign.
- Boundary cases are avoided by wording: no "unpasteurized ACV" (it would match the `pasteurized` substring), so it is "raw apple cider vinegar with the mother". No nutritional yeast, miso, maple syrup or agave, because all of them are heat-processed.
- `seed.ts` validates **every** recipe before touching the DB and throws with all violations if any fail.
- Templates: Beginner (7d), Detox (3d), Weight Loss (14d). Every day × all 8 slots is filled from slot-specific pools, rotating by day.

## 5. Review hardening (code-reviewer pass)
- Dev login fails closed (any Vercel env, non-localhost prod builds, real-provider accounts).
- `startMealPlan` detaches older plans from today onward before stamping the new one.
- Templates have stable IDs (`template-*`); the seed upserts them in a transaction.
- DailyLog read-modify-write takes `SELECT … FOR UPDATE`; client dates are bounded to today ±1.
- Login `callbackUrl` is same-origin only (`lib/safe-redirect.ts`).
- Compliance rule 6 also catches heat verbs, decimal °F and °C.
- `auditRecipe` fails closed in production without `ADMIN_EMAILS`.
- DAILY uses functional optimistic updates with per-action revert, and re-syncs on focus.

## 6. Checklist
- [x] Plan
- [x] Scaffold (Next 14, TS strict, Tailwind, shadcn primitives, Prisma)
- [x] Schema + migration + seed
- [x] Compliance TDD (Vitest)
- [x] Auth → HOME → RECIPES → DAILY → PLANS
- [x] Playwright E2E (3 flows)
- [x] Quality gate
- [x] README + deploy config
