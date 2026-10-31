import { describe, expect, it } from "vitest";
import { SEED_RECIPES, assertSeedCompliance } from "../prisma/seed";
import { validateRawCompliance } from "@/lib/compliance";

const REQUIRED = [
  "Jungle Juice", "High-Protein Veggie Salad", "Chocolate Pecan Pie", "FullyRaw Caesar Salad",
  "Anti-Aging Superfood Smoothie", "Creamy Lemon Garlic Pasta Alfredo", "Carrot Cake",
  "Rainbow Buddha Bowls", "Cauliflower Wings", "Mac n' Cheese", "Lasagna", "Carrot Bacon",
  "Juice for Clear Skin", "Cream Cheese", "Raw Zucchini Noodle Pad Thai",
];

describe("seed data", () => {
  it("contains every required recipe", () => {
    const titles = SEED_RECIPES.map((r) => r.title);
    for (const t of REQUIRED) expect(titles).toContain(t);
  });

  it.each(SEED_RECIPES.map((r) => [r.title, r] as const))("%s passes raw compliance", (_t, r) => {
    expect(validateRawCompliance(r).violations).toEqual([]);
  });

  it("the seed gate throws when any recipe is non-compliant", () => {
    const bad = { ...SEED_RECIPES[0], ingredients: ["roasted cashews"] };
    expect(() => assertSeedCompliance([...SEED_RECIPES, bad])).toThrow(/failed raw compliance/);
  });
});
