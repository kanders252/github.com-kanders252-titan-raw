import { describe, expect, it } from "vitest";
import { validateRawCompliance, type ComplianceInput } from "@/lib/compliance";

const passing: ComplianceInput = {
  temperatureStatus: "raw_under_115F",
  ingredients: ["avocado", "lemon", "kale"],
  instructions: ["Massage kale with avocado and lemon."],
  prepTechniques: ["massage"],
  fatSource: "avocado",
  keyMicronutrients: ["Vitamin C", "Potassium"],
};

describe("validateRawCompliance", () => {
  it("passes a fully compliant recipe", () => {
    expect(validateRawCompliance(passing)).toEqual({ valid: true, violations: [] });
  });

  it("fails on a banned ingredient term (pasteurized almonds)", () => {
    const r = validateRawCompliance({ ...passing, ingredients: ["pasteurized almonds", "kale"] });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.includes("pasteurized"))).toBe(true);
  });

  it("fails on a disallowed prep technique (bake)", () => {
    const r = validateRawCompliance({ ...passing, prepTechniques: ["bake"] });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.includes("bake"))).toBe(true);
  });

  it("fails on an extracted oil fat source (olive oil)", () => {
    const r = validateRawCompliance({ ...passing, fatSource: "olive oil" });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.toLowerCase().includes("oil"))).toBe(true);
  });

  it("fails when temperatureStatus is missing", () => {
    const r = validateRawCompliance({ ...passing, temperatureStatus: undefined });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.includes("temperatureStatus"))).toBe(true);
  });

  // ── additional edge cases ──
  it.each(["steamed", "ROASTED", "Toasted", "cooked", "boiled", "baked", "fried", "canned"])(
    "rejects banned term %s case-insensitively",
    (term) => {
      const r = validateRawCompliance({ ...passing, ingredients: [`${term} cashews`] });
      expect(r.valid).toBe(false);
    },
  );

  it("fails when there are no prep techniques", () => {
    expect(validateRawCompliance({ ...passing, prepTechniques: [] }).valid).toBe(false);
  });

  it("rejects butter, including cacao butter (strict raw)", () => {
    expect(validateRawCompliance({ ...passing, fatSource: "cacao butter" }).valid).toBe(false);
  });

  it("rejects a fat source that is not a recognised whole food", () => {
    expect(validateRawCompliance({ ...passing, fatSource: "margarine" }).valid).toBe(false);
  });

  it.each(["soaked raw cashews", "sunflower seeds", "kalamata olives", "young coconut meat", "raw walnuts"])(
    "accepts whole-food fat %s",
    (fat) => {
      expect(validateRawCompliance({ ...passing, fatSource: fat }).valid).toBe(true);
    },
  );

  it("allows a null fat source", () => {
    expect(validateRawCompliance({ ...passing, fatSource: null }).valid).toBe(true);
  });

  it("requires at least 2 key micronutrients", () => {
    expect(validateRawCompliance({ ...passing, keyMicronutrients: ["Vitamin C"] }).valid).toBe(false);
  });

  it("rejects extracted oil in ingredients but not words like 'boil-free' lookalikes", () => {
    expect(validateRawCompliance({ ...passing, ingredients: ["1 tbsp coconut oil"] }).valid).toBe(false);
  });

  it("rejects non-array ingredients", () => {
    expect(validateRawCompliance({ ...passing, ingredients: "kale" as unknown }).valid).toBe(false);
  });

  it("rejects instructions above 115°F", () => {
    const r = validateRawCompliance({ ...passing, instructions: ["Dehydrate at 145°F for 2 hours."] });
    expect(r.valid).toBe(false);
  });

  it("accepts dehydrating at or below 115°F", () => {
    const r = validateRawCompliance({
      ...passing,
      prepTechniques: ["dehydrate"],
      instructions: ["Dehydrate at 105°F for 8 hours, never above 115 F."],
    });
    expect(r.valid).toBe(true);
  });

  it("collects multiple violations at once", () => {
    const r = validateRawCompliance({
      temperatureStatus: "cooked",
      ingredients: ["roasted peanuts"],
      prepTechniques: ["fry"],
      fatSource: "canola oil",
      keyMicronutrients: [],
    });
    expect(r.violations.length).toBeGreaterThanOrEqual(5);
  });
});

describe("validateRawCompliance: hardened instruction checks", () => {
  const base: ComplianceInput = {
    temperatureStatus: "raw_under_115F",
    ingredients: ["kale"],
    prepTechniques: ["dehydrate"],
    keyMicronutrients: ["Vitamin C", "Iron"],
  };
  it.each([
    "Dehydrate at 118.5°F overnight.",
    "Warm to 120 degrees F.",
    "Dehydrate at 60°C.",
    "Hold at 50 degrees Celsius.",
  ])("rejects over-temperature: %s", (step) => {
    expect(validateRawCompliance({ ...base, instructions: [step] }).valid).toBe(false);
  });
  it.each(["Dehydrate at 45°C.", "Dehydrate at 105°F.", "Add 2 C water and blend."])("accepts: %s", (step) => {
    expect(validateRawCompliance({ ...base, instructions: [step] }).valid).toBe(true);
  });
  it.each(["Bake until golden.", "Simmer for 10 minutes.", "Sauté the onions.", "Lightly toast the seeds."])(
    "rejects heat-cooking instruction: %s",
    (step) => {
      expect(validateRawCompliance({ ...base, instructions: [step] }).valid).toBe(false);
    },
  );
  it("does not flag 'uncooked' in instructions", () => {
    expect(validateRawCompliance({ ...base, instructions: ["Keep everything uncooked and fresh."] }).valid).toBe(true);
  });
  it("rejects British 'pasteurised' in ingredients", () => {
    expect(validateRawCompliance({ ...base, ingredients: ["pasteurised juice"] }).valid).toBe(false);
  });
});
