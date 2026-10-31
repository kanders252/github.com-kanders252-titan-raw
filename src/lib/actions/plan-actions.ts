"use server";

import { revalidatePath } from "next/cache";
import { requireUserId, UnauthorizedError } from "@/lib/auth";
import { addDays, dateKeyToDb, todayKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { createMealPlanSchema, idSchema, type ActionResult } from "@/lib/validation";

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof UnauthorizedError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createMealPlan(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createMealPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the plan details." };
  }
  try {
    const userId = await requireUserId();
    const { name, durationDays, category, entries } = parsed.data;

    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    if (recipeIds.length) {
      const found = await prisma.recipe.count({ where: { id: { in: recipeIds } } });
      if (found !== recipeIds.length) return { ok: false, error: "One or more recipes no longer exist." };
    }

    const plan = await prisma.mealPlan.create({
      data: { name, durationDays, category, userId, isTemplate: false, entries: { create: entries } },
      select: { id: true },
    });
    revalidatePath("/plans");
    return { ok: true, data: plan };
  } catch (e) {
    return fail(e);
  }
}

/** Stamps today … today+duration-1 with this plan, so /daily shows the plan's recipes. */
export async function startMealPlan(planId: string): Promise<ActionResult<{ startDate: string; days: number }>> {
  const parsed = idSchema.safeParse(planId);
  if (!parsed.success) return { ok: false, error: "Invalid plan." };
  try {
    const userId = await requireUserId();
    const plan = await prisma.mealPlan.findUnique({
      where: { id: parsed.data },
      select: { id: true, durationDays: true, isTemplate: true, userId: true },
    });
    if (!plan || (!plan.isTemplate && plan.userId !== userId)) return { ok: false, error: "Plan not found." };

    const start = todayKey();
    await prisma.$transaction(async (tx) => {
      // Detach any previously started plan from today onward, so a shorter plan
      // doesn't leave stale days of the old one behind.
      await tx.dailyLog.updateMany({
        where: { userId, date: { gte: dateKeyToDb(start) }, planId: { not: null } },
        data: { planId: null, planDay: null },
      });
      for (let i = 0; i < plan.durationDays; i++) {
        const date = dateKeyToDb(addDays(start, i));
        await tx.dailyLog.upsert({
          where: { userId_date: { userId, date } },
          update: { planId: plan.id, planDay: i + 1 },
          create: { userId, date, planId: plan.id, planDay: i + 1 },
        });
      }
    });
    revalidatePath("/");
    revalidatePath("/daily");
    revalidatePath("/plans");
    revalidatePath(`/plans/${plan.id}`);
    return { ok: true, data: { startDate: start, days: plan.durationDays } };
  } catch (e) {
    return fail(e);
  }
}
