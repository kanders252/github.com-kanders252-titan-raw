import type { MealSlot, PlanCategory, RecipeCategory } from "@prisma/client";

export type { MealSlot, PlanCategory, RecipeCategory };

/** The canonical, fixed order of the 8 daily slots. Never reorder. */
export const MEAL_SLOTS = [
  "INFUSED_WATER",
  "BREAKFAST",
  "MORNING_SNACK",
  "LUNCH",
  "AFTERNOON_SNACK",
  "DINNER",
  "EVENING_SNACK",
  "DESSERT",
] as const satisfies readonly MealSlot[];

export const SLOT_COUNT = MEAL_SLOTS.length; // 8

export const SLOT_LABELS: Record<MealSlot, string> = {
  INFUSED_WATER: "Infused Water",
  BREAKFAST: "Breakfast",
  MORNING_SNACK: "Morning Snack",
  LUNCH: "Lunch",
  AFTERNOON_SNACK: "Afternoon Snack",
  DINNER: "Dinner",
  EVENING_SNACK: "Evening Snack",
  DESSERT: "Dessert",
};

export const RECIPE_CATEGORIES = [
  "JUICE",
  "SMOOTHIE",
  "SALAD",
  "SOUP",
  "DESSERT",
  "DIP",
  "SNACK",
  "MAIN",
] as const satisfies readonly RecipeCategory[];

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  JUICE: "Juice",
  SMOOTHIE: "Smoothie",
  SALAD: "Salad",
  SOUP: "Soup",
  DESSERT: "Dessert",
  DIP: "Dip",
  SNACK: "Snack",
  MAIN: "Main",
};

export const PLAN_CATEGORIES = [
  "BEGINNER",
  "DETOX",
  "WEIGHT_LOSS",
  "CUSTOM",
] as const satisfies readonly PlanCategory[];

export const PLAN_CATEGORY_LABELS: Record<PlanCategory, string> = {
  BEGINNER: "Beginner",
  DETOX: "Detox",
  WEIGHT_LOSS: "Weight Loss",
  CUSTOM: "Custom",
};

export const SHOPPING_LIST_KEY = "titan-raw-shopping-list";

export interface ShoppingListItem {
  id: string;
  text: string;
  recipeId: string;
  recipeTitle: string;
  done: boolean;
}

export interface RecipeOption {
  id: string;
  title: string;
  category: RecipeCategory;
}

export interface DailySlotView {
  slot: MealSlot;
  label: string;
  completed: boolean;
  recipe: { id: string; title: string } | null;
  fromPlan: boolean;
}

export interface DailyView {
  date: string; // YYYY-MM-DD
  completedCount: number;
  infusedWaterOz: number;
  plan: { id: string; name: string; day: number; durationDays: number } | null;
  slots: DailySlotView[];
  recipes: RecipeOption[];
}
