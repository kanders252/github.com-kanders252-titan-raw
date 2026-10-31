"use server";

import { Prisma, type DailyLog, type MealSlot } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUserId, UnauthorizedError } from "@/lib/auth";
import { dateKeyToDb, isNearToday, todayKey } from "@/lib/date";
import { buildDailyView, getOrCreateLog, normalizeSlots } from "@/lib/daily-service";
import { prisma } from "@/lib/prisma";
import {
  assignRecipeSchema,
  incrementWaterSchema,
  toggleMealSlotSchema,
  type ActionResult,
} from "@/lib/validation";
import type { DailyView } from "@/types";

const WATER_STEP_OZ = 8;

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof UnauthorizedError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const OUT_OF_RANGE = { ok: false as const, error: "You can only update today's log." };

/**
 * Find-or-create the user's log for a day and take a row lock (SELECT … FOR UPDATE), so
 * concurrent read-modify-write updates from two tabs/devices can't drop each other's changes.
 */
async function lockLog(tx: Prisma.TransactionClient, userId: string, dateKey: string): Promise<DailyLog> {
  const date = dateKeyToDb(dateKey);
  const { id } = await tx.dailyLog.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
    select: { id: true },
  });
  await tx.$queryRaw`SELECT id FROM "DailyLog" WHERE id = ${id} FOR UPDATE`;
  return tx.dailyLog.findUniqueOrThrow({ where: { id } });
}

function revalidateDaily() {
  revalidatePath("/");
  revalidatePath("/daily");
}

/** Fetch-or-create today's DailyLog (today = server's APP_TIMEZONE calendar day). */
export async function getTodayLog(): Promise<ActionResult<DailyView>> {
  try {
    const userId = await requireUserId();
    const key = todayKey();
    const log = await getOrCreateLog(userId, key);
    return { ok: true, data: await buildDailyView(log, key) };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleMealSlot(
  date: string,
  slot: MealSlot,
): Promise<ActionResult<{ completedSlots: MealSlot[] }>> {
  const parsed = toggleMealSlotSchema.safeParse({ date, slot });
  if (!parsed.success) return { ok: false, error: "Invalid date or meal slot." };
  if (!isNearToday(parsed.data.date)) return OUT_OF_RANGE;
  try {
    const userId = await requireUserId();
    const completedSlots = await prisma.$transaction(async (tx) => {
      const log = await lockLog(tx, userId, parsed.data.date);
      const has = log.completedSlots.includes(parsed.data.slot);
      const next = normalizeSlots(
        has ? log.completedSlots.filter((s) => s !== parsed.data.slot) : [...log.completedSlots, parsed.data.slot],
      );
      await tx.dailyLog.update({ where: { id: log.id }, data: { completedSlots: { set: next } } });
      return next;
    });
    revalidateDaily();
    return { ok: true, data: { completedSlots } };
  } catch (e) {
    return fail(e);
  }
}

export async function incrementWater(date: string): Promise<ActionResult<{ infusedWaterOz: number }>> {
  const parsed = incrementWaterSchema.safeParse({ date });
  if (!parsed.success) return { ok: false, error: "Invalid date." };
  if (!isNearToday(parsed.data.date)) return OUT_OF_RANGE;
  try {
    const userId = await requireUserId();
    const day = dateKeyToDb(parsed.data.date);
    const log = await prisma.dailyLog.upsert({
      where: { userId_date: { userId, date: day } },
      update: { infusedWaterOz: { increment: WATER_STEP_OZ } },
      create: { userId, date: day, infusedWaterOz: WATER_STEP_OZ },
    });
    revalidateDaily();
    return { ok: true, data: { infusedWaterOz: log.infusedWaterOz } };
  } catch (e) {
    return fail(e);
  }
}

export async function assignRecipeToSlot(
  date: string,
  slot: MealSlot,
  recipeId: string | null,
): Promise<ActionResult> {
  const parsed = assignRecipeSchema.safeParse({ date, slot, recipeId });
  if (!parsed.success) return { ok: false, error: "Invalid assignment." };
  if (!isNearToday(parsed.data.date)) return OUT_OF_RANGE;
  try {
    const userId = await requireUserId();
    if (parsed.data.recipeId) {
      const exists = await prisma.recipe.count({ where: { id: parsed.data.recipeId } });
      if (!exists) return { ok: false, error: "That recipe no longer exists." };
    }
    await prisma.$transaction(async (tx) => {
      const log = await lockLog(tx, userId, parsed.data.date);
      const current =
        log.assignedRecipes && typeof log.assignedRecipes === "object" && !Array.isArray(log.assignedRecipes)
          ? { ...(log.assignedRecipes as Record<string, string>) }
          : {};
      if (parsed.data.recipeId) current[parsed.data.slot] = parsed.data.recipeId;
      else delete current[parsed.data.slot];
      await tx.dailyLog.update({ where: { id: log.id }, data: { assignedRecipes: current as Prisma.InputJsonObject } });
    });
    revalidateDaily();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}
