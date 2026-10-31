import { describe, expect, it } from "vitest";
import { createMealPlanSchema, toggleMealSlotSchema } from "@/lib/validation";

const base = { name: "My Plan", durationDays: 3, category: "CUSTOM" as const, entries: [] };

describe("createMealPlanSchema", () => {
  it("accepts a valid plan", () => {
    const r = createMealPlanSchema.safeParse({ ...base, entries: [{ day: 1, slot: "BREAKFAST", recipeId: "abc" }] });
    expect(r.success).toBe(true);
  });
  it.each([2, 22, 3.5])("rejects durationDays %s", (d) => {
    expect(createMealPlanSchema.safeParse({ ...base, durationDays: d }).success).toBe(false);
  });
  it("rejects entries beyond the duration", () => {
    expect(createMealPlanSchema.safeParse({ ...base, entries: [{ day: 4, slot: "LUNCH", recipeId: "a" }] }).success).toBe(false);
  });
  it("rejects duplicate day/slot", () => {
    const e = { day: 1, slot: "LUNCH", recipeId: "a" };
    expect(createMealPlanSchema.safeParse({ ...base, entries: [e, e] }).success).toBe(false);
  });
  it("rejects unknown slots and categories", () => {
    expect(createMealPlanSchema.safeParse({ ...base, category: "KETO" }).success).toBe(false);
    expect(createMealPlanSchema.safeParse({ ...base, entries: [{ day: 1, slot: "BRUNCH", recipeId: "a" }] }).success).toBe(false);
  });
  it("rejects a blank name", () => {
    expect(createMealPlanSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
  });
});

describe("toggleMealSlotSchema", () => {
  it("requires a real date key", () => {
    expect(toggleMealSlotSchema.safeParse({ date: "2026-13-01", slot: "DINNER" }).success).toBe(false);
    expect(toggleMealSlotSchema.safeParse({ date: "2026-10-31", slot: "DINNER" }).success).toBe(true);
  });
});
