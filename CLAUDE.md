# TITAN-RAW — Project Identity

A structured 100% raw vegan lifestyle app. Philosophy: **abundance and proper nutrient distribution, not restriction.**
All food is uncooked/unprocessed, never heated above 115°F (46°C), gluten-free, dairy-free and oil-free. Overt fats come only from whole foods (avocado, seeds, nuts, olives, coconut meat).

## Non-negotiables
- 8 meal slots, fixed order: Infused Water, Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack, Dessert. Source of truth: `MEAL_SLOTS` in `src/types/index.ts`. Never reorder, rename, add or remove.
- Every seed recipe must pass `validateRawCompliance` (`src/lib/compliance.ts`). `prisma/seed.ts` throws on failure.
- HOME progress ring = `completedSlots.length / 8`. DailyLog mutations call `revalidatePath('/')` and `revalidatePath('/daily')`.
- Shopping list lives ONLY in localStorage (`titan-raw-shopping-list`). Never in the DB or in Server Actions.
- Server Components for reads; Server Actions (Zod-validated) for mutations. Never import Prisma in a Client Component.
- Usable at 375px width with no horizontal scroll.
- Copy is abundance-oriented. No calorie counting or clinical language.

## Model routing policy
| Model | Role | Effort |
|---|---|---|
| Opus 5.5 (default backbone) | Prisma schema, Server Actions, services, seed content, compliance engine | `medium`; `xhigh` for multi-file refactors, relation design, rule engine |
| Sonnet 5.5 | UI scaffolding, Tailwind, refactors, code review, build fixes, Playwright | `high`; `xhigh` for constraint-satisfaction UI |
| Haiku 5.5 | Bulk seed text expansion, README summarization, zero-judgment boilerplate | `medium`. Never makes recipe, nutrition or compliance decisions |
| Fable 5.1 | Async escalation only, when Opus `xhigh` can't converge on multi-week nutrition feasibility or a boundary compliance case | `max` ceiling, run via background task, <5% of calls, never on the critical path |

Sub-agents in `.claude/agents/` are pinned to these models.

## Commands
- `npx vitest run` runs the unit tests (compliance engine).
- `npx playwright test` runs E2E (needs a seeded DB and `ENABLE_DEV_LOGIN=true`).
- `npx prisma migrate dev` then `npx prisma db seed`.
