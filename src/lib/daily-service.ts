import "server-only";
import type { DailyLog, MealSlot } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dateKeyToDb, todayKey } from "@/lib/date";
import { MEAL_SLOTS, SLOT_LABELS, type DailyView, type RecipeOption } from "@/types";

/** Sort slots into the canonical fixed order and drop duplicates. */
export function normalizeSlots(slots: MealSlot[]): MealSlot[] {
  const set = new Set(slots);
  return MEAL_SLOTS.filter((s) => set.has(s));
}

export function firstIncompleteSlot(completed: MealSlot[]): MealSlot | null {
  return MEAL_SLOTS.find((s) => !completed.includes(s)) ?? null;
}

function parseAssigned(value: unknown): Partial<Record<MealSlot, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Partial<Record<MealSlot, string>> = {};
  for (const slot of MEAL_SLOTS) {
    const v = (value as Record<string, unknown>)[slot];
    if (typeof v === "string") out[slot] = v;
  }
  return out;
}

export async function findLog(userId: string, dateKey: string) {
  return prisma.dailyLog.findUnique({ where: { userId_date: { userId, date: dateKeyToDb(dateKey) } } });
}

export async function getOrCreateLog(userId: string, dateKey: string): Promise<DailyLog> {
  const date = dateKeyToDb(dateKey);
  return prisma.dailyLog.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  });
}

/** Builds the full DAILY view model (slots in fixed order with plan/assigned recipes). */
export async function buildDailyView(log: DailyLog | null, dateKey: string = todayKey()): Promise<DailyView> {
  const completed = normalizeSlots(log?.completedSlots ?? []);
  const recipeRows = await prisma.recipe.findMany({
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
  });
  const recipes: RecipeOption[] = recipeRows;
  const titleById = new Map(recipes.map((r) => [r.id, r.title]));

  let plan: DailyView["plan"] = null;
  const planned = new Map<MealSlot, string>();
  if (log?.planId && log.planDay) {
    const p = await prisma.mealPlan.findUnique({
      where: { id: log.planId },
      select: {
        id: true,
        name: true,
        durationDays: true,
        entries: { where: { day: log.planDay }, select: { slot: true, recipeId: true } },
      },
    });
    if (p) {
      plan = { id: p.id, name: p.name, day: log.planDay, durationDays: p.durationDays };
      for (const e of p.entries) planned.set(e.slot, e.recipeId);
    }
  }
  const assigned = parseAssigned(log?.assignedRecipes);

  return {
    date: dateKey,
    completedCount: completed.length,
    infusedWaterOz: log?.infusedWaterOz ?? 0,
    plan,
    recipes,
    slots: MEAL_SLOTS.map((slot) => {
      const plannedId = planned.get(slot);
      const id = plannedId ?? assigned[slot];
      const title = id ? titleById.get(id) : undefined;
      return {
        slot,
        label: SLOT_LABELS[slot],
        completed: completed.includes(slot),
        recipe: id && title ? { id, title } : null,
        fromPlan: Boolean(plannedId),
      };
    }),
  };
}
