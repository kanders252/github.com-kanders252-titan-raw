import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CreatePlanForm } from "./create-plan-form";

export const metadata: Metadata = { title: "Create plan" };
export const dynamic = "force-dynamic";

/** Thin server wrapper: fetches the recipe list, then hands off to the client form. */
export default async function NewPlanPage() {
  const recipes = await prisma.recipe.findMany({
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a plan</h1>
        <p className="text-muted-foreground">Design your days of abundance. Fill as many moments as you like.</p>
      </div>
      <CreatePlanForm recipes={recipes} />
    </div>
  );
}
