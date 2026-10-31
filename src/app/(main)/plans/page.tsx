import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_CATEGORY_LABELS, SLOT_COUNT } from "@/types";

export const metadata: Metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

type PlanRow = { id: string; name: string; durationDays: number; category: keyof typeof PLAN_CATEGORY_LABELS; isTemplate: boolean };

export default async function PlansPage() {
  const userId = await getCurrentUserId();
  const select = { id: true, name: true, durationDays: true, category: true, isTemplate: true } as const;

  const [templates, mine, logs] = await Promise.all([
    prisma.mealPlan.findMany({ where: { isTemplate: true }, select, orderBy: { durationDays: "asc" } }),
    userId
      ? prisma.mealPlan.findMany({ where: { userId, isTemplate: false }, select, orderBy: { createdAt: "desc" } })
      : Promise.resolve([] as PlanRow[]),
    userId
      ? prisma.dailyLog.findMany({ where: { userId, planId: { not: null } }, select: { planId: true, completedSlots: true } })
      : Promise.resolve([] as { planId: string | null; completedSlots: string[] }[]),
  ]);

  const doneByPlan = new Map<string, number>();
  for (const l of logs) if (l.planId) doneByPlan.set(l.planId, (doneByPlan.get(l.planId) ?? 0) + l.completedSlots.length);

  const PlanCard = ({ plan }: { plan: PlanRow }) => {
    const done = doneByPlan.get(plan.id);
    const pct = done ? Math.round((done / (plan.durationDays * SLOT_COUNT)) * 100) : 0;
    return (
      <Link href={`/plans/${plan.id}`} className="group block" data-testid="plan-card">
        <Card className="h-full transition-shadow group-hover:shadow-md">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{PLAN_CATEGORY_LABELS[plan.category]}</Badge>
              <Badge variant="outline">{plan.durationDays} days</Badge>
            </div>
            <CardTitle className="break-words">{plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Progress value={pct} aria-label={`${plan.name} progress`} />
            <CardDescription>{done ? `${pct}% enjoyed so far` : "Ready when you are"}</CardDescription>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
          <p className="text-muted-foreground">Structured abundance, one vibrant day at a time.</p>
        </div>
        <Button asChild>
          <Link href="/plans/new">
            <Plus /> Create plan
          </Link>
        </Button>
      </div>

      {userId && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your plans</h2>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom plans yet. Build one around your favorite recipes.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="my-plans">
              {mine.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Starter templates</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
