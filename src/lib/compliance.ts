/**
 * TITAN-RAW deterministic raw-compliance rule engine.
 * Pure, synchronous, side-effect free. Safe to import from server or client.
 */

export const REQUIRED_TEMPERATURE_STATUS = "raw_under_115F" as const;
export const MAX_RAW_TEMP_F = 115;

export const BANNED_INGREDIENT_TERMS = [
  "pasteurized",
  "steamed",
  "roasted",
  "toasted",
  "cooked",
  "boiled",
  "baked",
  "fried",
  "canned",
] as const;

/** Spelling variants of the banned terms (same rule, broader net). */
const BANNED_INGREDIENT_VARIANTS = ["pasteurised", "grilled", "sauteed", "sautéed"] as const;

/** Heat-cooking verbs that must never appear in instructions (word-boundary, so "uncooked" is fine). */
const HEAT_VERBS =
  /(?<![a-zà-ÿ])(bak(?:e|ed|es|ing)|roast(?:ed|s|ing)?|boil(?:ed|s|ing)?|fr(?:y|ied|ies|ying)|simmer(?:ed|s|ing)?|saut[eé](?:ed|s|ing)?|grill(?:ed|s|ing)?|steam(?:ed|s|ing)?|toast(?:ed|s|ing)?|microwav(?:e|ed|es|ing)|cook(?:ed|s|ing)?|poach(?:ed|es|ing)?|blanch(?:ed|es|ing)?)(?![a-zà-ÿ])/i;

export const ALLOWED_PREP_TECHNIQUES = [
  "blend",
  "spiralize",
  "marinate",
  "dehydrate",
  "sprout",
  "ferment",
  "soak",
  "chop",
  "juice",
  "process",
  "massage",
] as const;

/** Whole-food overt fat allowlist, grouped by family. */
export const WHOLE_FOOD_FATS: Record<string, readonly string[]> = {
  avocado: ["avocado"],
  nuts: [
    "nut", // nut, nuts, pine nut, brazil nut, walnut, hazelnut, coconut is handled separately
    "almond",
    "cashew",
    "pecan",
    "macadamia",
    "pistachio",
  ],
  seeds: ["seed", "hemp hearts", "chia", "flax"],
  olives: ["olive"],
  coconutMeat: ["coconut meat"],
};

/** Extracted / refined fats that are always rejected. Strict raw: all butters, incl. cacao butter. */
const REJECTED_FAT_PATTERNS = [/\boils?\b/i, /\bbutter\b/i, /margarine/i, /shortening/i, /\blard\b/i];

const EXTRACTED_OIL_IN_INGREDIENT = /\boils?\b/i;
// 110°F, 110 F, 110.5 °F, 110 degrees F, 46°C, 46 degrees Celsius. (Celsius requires ° or "degrees",
// so "2 C" cup abbreviations don't match.)
const TEMPERATURE =
  /(\d+(?:\.\d+)?)\s*(?:(?:°|º|degrees?)\s*(F|C|fahrenheit|celsius)\b|(F)\b|(?:°|º)(?!\s*[A-Za-z]))/gi;

export interface ComplianceInput {
  temperatureStatus?: string | null;
  ingredients: unknown; // expected string[] (Prisma Json)
  instructions?: unknown; // expected string[] (Prisma Json), optional
  prepTechniques: string[];
  fatSource?: string | null;
  keyMicronutrients: string[];
}

export interface ComplianceResult {
  valid: boolean;
  violations: string[];
}

function asStringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((v) => typeof v === "string") ? value : null;
}

function isWholeFoodFat(fat: string): boolean {
  const f = fat.toLowerCase();
  // "coconut" alone (e.g. coconut oil/cream) does NOT count; only coconut meat.
  const withoutCoconut = f.replace(/coconut/g, "");
  return Object.entries(WHOLE_FOOD_FATS).some(([family, terms]) =>
    terms.some((t) => (family === "coconutMeat" ? f : withoutCoconut).includes(t)),
  );
}

export function validateRawCompliance(recipe: ComplianceInput): ComplianceResult {
  const violations: string[] = [];

  // Rule 1 — temperature status
  if (recipe.temperatureStatus !== REQUIRED_TEMPERATURE_STATUS) {
    violations.push(
      `temperatureStatus must be '${REQUIRED_TEMPERATURE_STATUS}' (got ${
        recipe.temperatureStatus == null ? "missing" : `'${recipe.temperatureStatus}'`
      })`,
    );
  }

  // Rule 2 — ingredients free of banned processing terms and extracted oils
  const ingredients = asStringArray(recipe.ingredients);
  if (!ingredients || ingredients.length === 0) {
    violations.push("ingredients must be a non-empty string[]");
  } else {
    for (const ing of ingredients) {
      const lower = ing.toLowerCase();
      for (const term of [...BANNED_INGREDIENT_TERMS, ...BANNED_INGREDIENT_VARIANTS]) {
        if (lower.includes(term)) violations.push(`ingredient "${ing}" contains banned term "${term}"`);
      }
      if (EXTRACTED_OIL_IN_INGREDIENT.test(ing)) {
        violations.push(`ingredient "${ing}" is an extracted oil (oil-free required)`);
      }
    }
  }

  // Rule 3 — prep techniques
  const techniques = recipe.prepTechniques ?? [];
  if (techniques.length === 0) {
    violations.push("at least one prepTechnique is required");
  }
  for (const t of techniques) {
    const norm = t.trim().toLowerCase();
    if (!(ALLOWED_PREP_TECHNIQUES as readonly string[]).includes(norm)) {
      violations.push(`prepTechnique "${t}" is not an allowed raw technique`);
    }
  }

  // Rule 4 — whole-food fat source only
  if (recipe.fatSource != null && recipe.fatSource.trim() !== "") {
    const fat = recipe.fatSource;
    const rejected = REJECTED_FAT_PATTERNS.find((p) => p.test(fat));
    if (rejected) {
      violations.push(`fatSource "${fat}" is an extracted/refined fat (oil/butter not allowed)`);
    } else if (!isWholeFoodFat(fat)) {
      violations.push(
        `fatSource "${fat}" is not a recognised whole-food fat (avocado, nuts, seeds, olives, coconut meat)`,
      );
    }
  }

  // Rule 5 — micronutrient density
  if ((recipe.keyMicronutrients ?? []).length < 2) {
    violations.push("keyMicronutrients must contain at least 2 entries");
  }

  // Rule 6 (guard) — instructions: no heat-cooking verbs, no temperature above 115°F (46°C)
  const instructions = asStringArray(recipe.instructions) ?? [];
  for (const step of instructions) {
    const verb = step.match(HEAT_VERBS);
    if (verb) violations.push(`instruction uses heat-cooking method "${verb[1]}": "${step}"`);
    for (const m of step.matchAll(TEMPERATURE)) {
      const value = Number(m[1]);
      const unit = (m[2] ?? m[3] ?? "F").toUpperCase();
      const fahrenheit = unit.startsWith("C") ? value * 1.8 + 32 : value;
      if (fahrenheit > MAX_RAW_TEMP_F) violations.push(`instruction exceeds ${MAX_RAW_TEMP_F}°F: "${step}"`);
    }
  }

  return { valid: violations.length === 0, violations };
}
