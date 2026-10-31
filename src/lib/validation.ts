import { z } from "zod";
import { isDateKey } from "@/lib/date";
import { MEAL_SLOTS, PLAN_CATEGORIES } from "@/types";

export const MIN_PLAN_DAYS = 3;
export const MAX_PLAN_DAYS = 21;

export const mealSlotSchema = z.enum(MEAL_SLOTS);
export const dateKeySchema = z.string().refine(isDateKey, "Expected a YYYY-MM-DD date");
export const idSchema = z.string().min(1).max(64);

export const toggleMealSlotSchema = z.object({ date: dateKeySchema, slot: mealSlotSchema });
export const incrementWaterSchema = z.object({ date: dateKeySchema });
export const assignRecipeSchema = z.object({
  date: dateKeySchema,
  slot: mealSlotSchema,
  recipeId: idSchema.nullable(),
});

export const planEntrySchema = z.object({
  day: z.number().int().min(1).max(MAX_PLAN_DAYS),
  slot: mealSlotSchema,
  recipeId: idSchema,
});

export const createMealPlanSchema = z
  .object({
    name: z.string().trim().min(1, "Give your plan a name").max(80),
    durationDays: z.number().int().min(MIN_PLAN_DAYS).max(MAX_PLAN_DAYS),
    category: z.enum(PLAN_CATEGORIES),
    entries: z.array(planEntrySchema).max(MAX_PLAN_DAYS * MEAL_SLOTS.length),
  })
  .superRefine((plan, ctx) => {
    const seen = new Set<string>();
    plan.entries.forEach((e, i) => {
      if (e.day > plan.durationDays) {
        ctx.addIssue({ code: "custom", path: ["entries", i, "day"], message: `Day ${e.day} is beyond the plan length` });
      }
      const key = `${e.day}:${e.slot}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["entries", i], message: `Day ${e.day} ${e.slot} is assigned twice` });
      }
      seen.add(key);
    });
  });

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
