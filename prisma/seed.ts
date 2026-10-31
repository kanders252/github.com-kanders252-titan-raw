import { PrismaClient, type MealSlot, type PlanCategory, type RecipeCategory } from "@prisma/client";
import { validateRawCompliance } from "../src/lib/compliance";
import { MEAL_SLOTS } from "../src/types";

const prisma = new PrismaClient();

interface SeedRecipe {
  title: string;
  category: RecipeCategory;
  ingredients: string[];
  instructions: string[];
  badges: string[];
  isPremium: boolean;
  temperatureStatus: string;
  fatSource: string | null;
  keyMicronutrients: string[];
  prepTechniques: string[];
}

const RAW = "raw_under_115F";

export const SEED_RECIPES: SeedRecipe[] = [
  {
    title: "Jungle Juice",
    category: "JUICE",
    ingredients: ["1 whole pineapple, peeled", "2 cups fresh spinach", "1 large cucumber", "1 bunch fresh mint", "1 lime, peeled", "1-inch piece fresh ginger"],
    instructions: ["Chop the pineapple and cucumber into pieces that fit your juicer.", "Juice the pineapple, spinach, cucumber, mint, lime and ginger, alternating leafy greens with juicy fruit.", "Stir and enjoy right away for the most vibrant enzymes."],
    badges: ["Hydrating", "Green Power"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: null,
    keyMicronutrients: ["Vitamin C", "Manganese", "Folate", "Raw Enzymes"],
    prepTechniques: ["chop", "juice"],
  },
  {
    title: "High-Protein Veggie Salad",
    category: "SALAD",
    ingredients: ["4 cups chopped kale", "1 cup sprouted lentils", "1 cup sprouted mung beans", "1 cup broccoli florets, finely chopped", "1 red bell pepper, diced", "1/4 cup hemp seeds", "1 lemon, juiced", "1 clove garlic, minced", "Pinch of Himalayan salt"],
    instructions: ["Soak lentils and mung beans 8 hours, drain, and sprout 2–3 days, rinsing twice daily.", "Massage the kale with lemon juice, garlic and salt until it softens and darkens.", "Toss in the sprouts, broccoli and bell pepper.", "Shower with hemp seeds and serve generously."],
    badges: ["High-Protein", "Sprouted"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "hemp seeds",
    keyMicronutrients: ["Plant Protein", "Iron", "Vitamin K", "Magnesium", "Folate"],
    prepTechniques: ["soak", "sprout", "massage", "chop"],
  },
  {
    title: "Chocolate Pecan Pie",
    category: "DESSERT",
    ingredients: ["2 cups raw pecans, soaked 4 hours", "1 1/2 cups Medjool dates, pitted", "1/2 cup raw cacao powder", "1 ripe banana", "1 tsp vanilla bean powder", "Pinch of sea salt", "1/2 cup raw pecan halves for topping"],
    instructions: ["Process 1 cup soaked pecans with 1/2 cup dates and the salt into a sticky crust; press into a pie dish.", "Blend the remaining dates, banana, cacao and vanilla with 1 cup pecans until silky.", "Spread the filling over the crust and arrange pecan halves on top.", "Chill 2 hours to set, then slice and share."],
    badges: ["Celebration", "App Exclusive"],
    isPremium: true,
    temperatureStatus: RAW,
    fatSource: "soaked raw pecans",
    keyMicronutrients: ["Magnesium", "Potassium", "Copper", "Antioxidants"],
    prepTechniques: ["soak", "process", "blend"],
  },
  {
    title: "FullyRaw Caesar Salad",
    category: "SALAD",
    ingredients: ["2 heads romaine lettuce, chopped", "1/2 cup raw cashews, soaked 4 hours", "1 lemon, juiced", "2 cloves garlic", "1 tbsp raw apple cider vinegar with the mother", "1 tsp kelp granules", "1/2 cup water", "1 cup cherry tomatoes, halved", "2 tbsp hemp seeds"],
    instructions: ["Blend soaked cashews, lemon, garlic, vinegar, kelp and water into a creamy dressing.", "Toss the romaine with the dressing until every leaf is coated.", "Top with cherry tomatoes and hemp seeds."],
    badges: ["Classic", "Crowd Favorite"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "soaked raw cashews",
    keyMicronutrients: ["Vitamin A", "Vitamin K", "Iodine", "Folate"],
    prepTechniques: ["soak", "blend", "chop"],
  },
  {
    title: "Anti-Aging Superfood Smoothie",
    category: "SMOOTHIE",
    ingredients: ["2 cups wild blueberries", "2 ripe bananas", "1 cup fresh spinach", "1 tbsp chia seeds", "1 tbsp raw cacao nibs", "1 tsp camu camu powder", "1 1/2 cups fresh coconut water"],
    instructions: ["Add coconut water and greens to the blender first.", "Add blueberries, bananas, chia, cacao nibs and camu camu.", "Blend on high until completely smooth; pour and enjoy."],
    badges: ["Antioxidant-Rich", "Seasonal"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "chia seeds",
    keyMicronutrients: ["Vitamin C", "Anthocyanins", "Potassium", "Omega-3 ALA"],
    prepTechniques: ["blend"],
  },
  {
    title: "Creamy Lemon Garlic Pasta Alfredo",
    category: "MAIN",
    ingredients: ["3 medium zucchini", "1 cup raw cashews, soaked 4 hours", "1 lemon, juiced, plus zest", "3 cloves garlic", "1/2 cup water", "1/2 tsp Himalayan salt", "1/4 cup fresh basil, chopped", "Cracked black pepper"],
    instructions: ["Spiralize zucchini into noodles and pat dry.", "Blend cashews, lemon juice, zest, garlic, water and salt into a thick Alfredo sauce.", "Fold the sauce through the noodles and finish with basil and pepper."],
    badges: ["Comfort Food", "Quick"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "soaked raw cashews",
    keyMicronutrients: ["Vitamin C", "Copper", "Zinc", "Potassium"],
    prepTechniques: ["spiralize", "soak", "blend"],
  },
  {
    title: "Carrot Cake",
    category: "DESSERT",
    ingredients: ["3 cups grated carrots", "1 1/2 cups raw walnuts", "1 cup Medjool dates, pitted", "1/2 cup raisins", "1/2 cup shredded young coconut meat", "2 tsp cinnamon", "1/2 tsp nutmeg", "Frosting: 1 cup raw cashews soaked 4 hours, 1/2 lemon juiced, 4 dates, 1/3 cup water"],
    instructions: ["Process walnuts and dates until crumbly and sticky.", "Pulse in carrots, raisins, coconut meat and spices until combined; press into a cake pan.", "Blend the frosting ingredients until fluffy and spread over the cake.", "Chill 2 hours before slicing."],
    badges: ["Celebration", "Seasonal"],
    isPremium: true,
    temperatureStatus: RAW,
    fatSource: "raw walnuts",
    keyMicronutrients: ["Vitamin A", "Omega-3 ALA", "Manganese", "Fiber"],
    prepTechniques: ["process", "blend", "soak"],
  },
  {
    title: "Rainbow Buddha Bowls",
    category: "MAIN",
    ingredients: ["2 cups shredded purple cabbage", "2 carrots, spiralized", "1 cup sprouted chickpeas", "1 mango, cubed", "1 avocado, sliced", "1 cup cherry tomatoes", "2 cups mixed greens", "Dressing: 1 orange juiced, 1 tbsp raw sesame seeds, 1 tsp fresh ginger"],
    instructions: ["Soak chickpeas 12 hours, drain, and sprout 2 days.", "Blend the orange juice, sesame seeds and ginger into a bright dressing.", "Arrange greens, cabbage, carrot ribbons, sprouts, mango, tomatoes and avocado in a rainbow.", "Drizzle generously with dressing."],
    badges: ["Colorful", "Nutrient-Dense"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "avocado",
    keyMicronutrients: ["Vitamin C", "Vitamin A", "Folate", "Potassium", "Plant Protein"],
    prepTechniques: ["soak", "sprout", "spiralize", "blend", "chop"],
  },
  {
    title: "Cauliflower Wings",
    category: "SNACK",
    ingredients: ["1 large head cauliflower, cut into florets", "1 cup raw sunflower seeds, soaked 4 hours", "2 red bell peppers", "4 sun-dried tomatoes (raw, sun-dried only)", "2 Medjool dates", "1 tsp sweet paprika", "1/2 tsp cayenne", "1 clove garlic"],
    instructions: ["Blend sunflower seeds, bell peppers, tomatoes, dates, paprika, cayenne and garlic into a thick buffalo coating.", "Toss florets in the coating until fully covered.", "Dehydrate at 110°F for 8–10 hours, turning once, until crisp outside and tender inside."],
    badges: ["Game Day", "App Exclusive"],
    isPremium: true,
    temperatureStatus: RAW,
    fatSource: "soaked raw sunflower seeds",
    keyMicronutrients: ["Vitamin C", "Vitamin E", "Vitamin K", "Selenium"],
    prepTechniques: ["soak", "blend", "dehydrate"],
  },
  {
    title: "Mac n' Cheese",
    category: "MAIN",
    ingredients: ["3 yellow squash, spiralized and cut into elbows", "1 cup raw cashews, soaked 4 hours", "1 red bell pepper", "1/2 lemon, juiced", "1/2 tsp turmeric", "1 clove garlic", "1/2 tsp Himalayan salt", "1/3 cup water"],
    instructions: ["Spiralize squash and cut the noodles into short elbows.", "Blend cashews, bell pepper, lemon, turmeric, garlic, salt and water into a golden cheese sauce.", "Fold the sauce through the squash elbows and serve."],
    badges: ["Comfort Food", "Kid-Friendly"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "soaked raw cashews",
    keyMicronutrients: ["Vitamin C", "Vitamin B6", "Zinc", "Copper"],
    prepTechniques: ["spiralize", "soak", "blend"],
  },
  {
    title: "Lasagna",
    category: "MAIN",
    ingredients: ["3 zucchini, sliced lengthwise into thin sheets", "Marinara: 2 cups fresh tomatoes, 1/2 cup sun-dried tomatoes (raw), 2 dates, 1 clove garlic, fresh basil", "Pesto: 2 cups fresh basil, 1/2 cup raw pine nuts, 1 lemon juiced", "Ricotta: 1 1/2 cups raw macadamia nuts soaked 4 hours, 1 lemon juiced, 1/4 cup water", "2 cups spinach, chopped"],
    instructions: ["Marinate the zucchini sheets in lemon juice and a pinch of salt for 15 minutes.", "Blend the marinara; process the pesto; blend the macadamia ricotta.", "Layer zucchini, marinara, ricotta, spinach and pesto; repeat three times.", "Let rest 30 minutes so the layers meld, then slice."],
    badges: ["Showstopper", "App Exclusive"],
    isPremium: true,
    temperatureStatus: RAW,
    fatSource: "soaked raw macadamia nuts",
    keyMicronutrients: ["Lycopene", "Vitamin K", "Vitamin C", "Manganese"],
    prepTechniques: ["marinate", "blend", "process", "soak", "chop"],
  },
  {
    title: "Carrot Bacon",
    category: "SNACK",
    ingredients: ["4 large carrots, shaved into wide ribbons", "2 tbsp coconut aminos", "1 tbsp raw apple cider vinegar with the mother", "1 Medjool date, blended", "1/2 tsp paprika", "1/4 tsp garlic powder (low-temperature dried)"],
    instructions: ["Shave carrots into long, wide ribbons with a peeler.", "Whisk aminos, vinegar, blended date and spices into a marinade.", "Marinate the ribbons 1 hour.", "Dehydrate at 105°F for 6–8 hours until chewy-crisp."],
    badges: ["Savory", "Make-Ahead"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: null,
    keyMicronutrients: ["Vitamin A", "Beta-Carotene", "Potassium"],
    prepTechniques: ["marinate", "dehydrate", "blend"],
  },
  {
    title: "Juice for Clear Skin",
    category: "JUICE",
    ingredients: ["2 large cucumbers", "4 stalks celery", "2 green apples", "1 lemon, peeled", "1 cup fresh parsley", "1-inch piece fresh turmeric root"],
    instructions: ["Chop produce to fit your juicer.", "Juice everything, finishing with the lemon.", "Stir and drink within 20 minutes for peak freshness."],
    badges: ["Glow", "Hydrating"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: null,
    keyMicronutrients: ["Vitamin C", "Vitamin K", "Silica", "Potassium"],
    prepTechniques: ["chop", "juice"],
  },
  {
    title: "Cream Cheese",
    category: "DIP",
    ingredients: ["2 cups raw cashews, soaked 4 hours", "1/2 cup water", "1 lemon, juiced", "1 probiotic capsule (dairy-free)", "1/2 tsp Himalayan salt", "2 tbsp fresh chives, minced"],
    instructions: ["Blend cashews, water and probiotic until perfectly smooth.", "Cover with a cloth and ferment at room temperature for 12–24 hours until tangy.", "Stir in lemon juice, salt and chives. Chill to firm up.", "Serve with crunchy cucumber rounds, bell pepper strips and celery."],
    badges: ["Cultured", "Make-Ahead"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "soaked raw cashews",
    keyMicronutrients: ["Copper", "Zinc", "Magnesium", "Probiotics"],
    prepTechniques: ["soak", "blend", "ferment"],
  },
  {
    title: "Raw Zucchini Noodle Pad Thai",
    category: "MAIN",
    ingredients: ["3 zucchini, spiralized", "1 carrot, julienned", "1 cup shredded red cabbage", "1 cup mung bean sprouts", "1/4 cup fresh cilantro", "Sauce: 1/2 cup raw almonds soaked 8 hours, 1 lime juiced, 2 dates, 1 tbsp coconut aminos, 1 tsp fresh ginger, 1 clove garlic, 1/3 cup water", "2 tbsp chopped raw almonds for topping"],
    instructions: ["Spiralize zucchini and combine with carrot, cabbage and sprouts.", "Blend the soaked almonds, lime, dates, aminos, ginger, garlic and water into a creamy sauce.", "Toss the noodles in the sauce, top with cilantro and chopped almonds."],
    badges: ["High-Protein", "Global Flavors"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: "soaked raw almonds",
    keyMicronutrients: ["Vitamin E", "Magnesium", "Vitamin C", "Riboflavin"],
    prepTechniques: ["spiralize", "soak", "blend", "chop"],
  },
  // ── Infused waters: so the INFUSED_WATER slot always has something to assign ──
  {
    title: "Cucumber Mint Infused Water",
    category: "JUICE",
    ingredients: ["1/2 cucumber, thinly sliced", "8 fresh mint leaves", "1/2 lime, sliced", "32 oz filtered water"],
    instructions: ["Chop the cucumber and lime into thin slices.", "Lightly bruise the mint and add everything to a pitcher of water.", "Let infuse in the fridge for at least 1 hour."],
    badges: ["Hydrating", "Daily Ritual"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: null,
    keyMicronutrients: ["Vitamin K", "Vitamin C"],
    prepTechniques: ["chop", "soak"],
  },
  {
    title: "Strawberry Basil Infused Water",
    category: "JUICE",
    ingredients: ["6 strawberries, sliced", "6 fresh basil leaves", "32 oz filtered water"],
    instructions: ["Chop strawberries into slices.", "Add strawberries and basil to a pitcher of water.", "Infuse in the fridge 1–2 hours."],
    badges: ["Hydrating", "Seasonal"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: null,
    keyMicronutrients: ["Vitamin C", "Manganese"],
    prepTechniques: ["chop", "soak"],
  },
  {
    title: "Lemon Ginger Infused Water",
    category: "JUICE",
    ingredients: ["1 lemon, sliced", "1-inch piece fresh ginger, thinly sliced", "32 oz filtered water"],
    instructions: ["Chop lemon and ginger into thin slices.", "Add to a pitcher of water.", "Infuse 1 hour; refill the water throughout the day."],
    badges: ["Hydrating", "Morning Ritual"],
    isPremium: false,
    temperatureStatus: RAW,
    fatSource: null,
    keyMicronutrients: ["Vitamin C", "Gingerol"],
    prepTechniques: ["chop", "soak"],
  },
];

/** Slot → rotating pool of recipe titles used to build template plans. */
const SLOT_POOLS: Record<MealSlot, string[]> = {
  INFUSED_WATER: ["Cucumber Mint Infused Water", "Lemon Ginger Infused Water", "Strawberry Basil Infused Water"],
  BREAKFAST: ["Anti-Aging Superfood Smoothie", "Jungle Juice", "Juice for Clear Skin"],
  MORNING_SNACK: ["Carrot Bacon", "Cream Cheese", "Cauliflower Wings"],
  LUNCH: ["High-Protein Veggie Salad", "FullyRaw Caesar Salad", "Rainbow Buddha Bowls"],
  AFTERNOON_SNACK: ["Juice for Clear Skin", "Cream Cheese", "Carrot Bacon"],
  DINNER: ["Creamy Lemon Garlic Pasta Alfredo", "Raw Zucchini Noodle Pad Thai", "Lasagna", "Mac n' Cheese"],
  EVENING_SNACK: ["Cauliflower Wings", "Jungle Juice", "Anti-Aging Superfood Smoothie"],
  DESSERT: ["Chocolate Pecan Pie", "Carrot Cake"],
};

// Stable IDs: re-seeding updates templates in place, so users' active plans and links survive.
const TEMPLATES: { id: string; name: string; category: PlanCategory; durationDays: number }[] = [
  { id: "template-beginner-7", name: "Beginner Abundance Week", category: "BEGINNER", durationDays: 7 },
  { id: "template-detox-3", name: "3-Day Fresh Reset", category: "DETOX", durationDays: 3 },
  { id: "template-weight-loss-14", name: "14-Day Lean & Vibrant", category: "WEIGHT_LOSS", durationDays: 14 },
];

export function assertSeedCompliance(recipes: SeedRecipe[]): void {
  const failures = recipes
    .map((r) => ({ title: r.title, result: validateRawCompliance(r) }))
    .filter((f) => !f.result.valid);
  if (failures.length > 0) {
    const detail = failures.map((f) => `  ✗ ${f.title}\n    - ${f.result.violations.join("\n    - ")}`).join("\n");
    throw new Error(`Seed aborted: ${failures.length} recipe(s) failed raw compliance:\n${detail}`);
  }
}

async function main() {
  // Gate FIRST: nothing touches the database unless every recipe is compliant.
  assertSeedCompliance(SEED_RECIPES);
  console.log(`✓ All ${SEED_RECIPES.length} recipes pass validateRawCompliance`);

  // Idempotent: recipes are upserted by title and templates by stable id, so IDs never change.
  // Remove retired templates (anything not in TEMPLATES, e.g. pre-stable-id seeds).
  await prisma.mealPlan.deleteMany({ where: { isTemplate: true, id: { notIn: TEMPLATES.map((t) => t.id) } } });

  const idByTitle = new Map<string, string>();
  for (const r of SEED_RECIPES) {
    const existing = await prisma.recipe.findFirst({ where: { title: r.title }, select: { id: true } });
    const saved = existing
      ? await prisma.recipe.update({ where: { id: existing.id }, data: r })
      : await prisma.recipe.create({ data: r });
    idByTitle.set(r.title, saved.id);
  }

  for (const t of TEMPLATES) {
    const entries = [];
    for (let day = 1; day <= t.durationDays; day++) {
      for (const slot of MEAL_SLOTS) {
        const pool = SLOT_POOLS[slot];
        const title = pool[(day - 1) % pool.length];
        const recipeId = idByTitle.get(title);
        if (!recipeId) throw new Error(`Template references unknown recipe "${title}"`);
        entries.push({ day, slot, recipeId });
      }
    }
    const { id, ...fields } = t;
    await prisma.$transaction([
      prisma.mealPlan.upsert({
        where: { id },
        update: { ...fields, isTemplate: true, userId: null },
        create: { id, ...fields, isTemplate: true, userId: null },
      }),
      prisma.mealPlanEntry.deleteMany({ where: { planId: id } }),
      prisma.mealPlanEntry.createMany({ data: entries.map((e) => ({ ...e, planId: id })) }),
    ]);
    console.log(`✓ Template "${t.name}" (${t.durationDays} days × 8 slots)`);
  }
}

// Don't run against the DB when imported by unit tests.
if (!process.env.VITEST) {
  main()
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
