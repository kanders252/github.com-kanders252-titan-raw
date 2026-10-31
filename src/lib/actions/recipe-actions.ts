"use server";

import { getSession } from "@/lib/auth";
import { validateRawCompliance, type ComplianceResult } from "@/lib/compliance";
import { prisma } from "@/lib/prisma";
import { idSchema, type ActionResult } from "@/lib/validation";

function isAdmin(email: string | null | undefined): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  // No admin list: allowed in development only (read-only op). Production fails closed.
  if (admins.length === 0) return process.env.NODE_ENV !== "production";
  return !!email && admins.includes(email.toLowerCase());
}

/** Admin: re-run the raw-compliance engine against a stored recipe. */
export async function auditRecipe(recipeId: string): Promise<ActionResult<ComplianceResult>> {
  const parsed = idSchema.safeParse(recipeId);
  if (!parsed.success) return { ok: false, error: "Invalid recipe id." };

  const session = await getSession();
  if (!session?.user) return { ok: false, error: "Please sign in to continue." };
  if (!isAdmin(session.user.email)) return { ok: false, error: "Admins only." };

  const recipe = await prisma.recipe.findUnique({ where: { id: parsed.data } });
  if (!recipe) return { ok: false, error: "Recipe not found." };
  return { ok: true, data: validateRawCompliance(recipe) };
}
