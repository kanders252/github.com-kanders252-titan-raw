import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PlanDayAccordion, type PlanDay } from "@/components/plan-day-accordion";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserId } from "@/lib/auth";
import { todayKey, dateKeyToDb } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { PLAN_CATEGORY_LABELS } from "@/types";
import { StartPlanButton } from "./start-plan-button";

export const metadata: Metadata = { title: "Plan" };
export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const plan = await prisma.mealPlan.findUnique({
    where: { id: params.id },
    include: {
      entries: {
        select: { day: true, slot: true, recipe: { select: { id: true, title: true } } },
        orderBy: { day: "asc" },
      },
    },
  });
  // Templates are visible to everyone; custom plans only to their owner.
  if (!plan || (!plan.isTemplate && plan.userId !== userId)) notFound();

  const days: PlanDay[] = Array.from({ length: plan.durationDays }, (_, i) => ({ day: i + 1, entries: {} }));
  for (const e of plan.entries) {
    const d = days[e.day - 1];
    if (d) d.entries[e.slot] = e.recipe;
  }

  const todayLog = userId
    ? await prisma.dailyLog.findUnique({
        where: { userId_date: { userId, date: dateKeyToDb(todayKey()) } },
        select: { planId: true, planDay: true },
      })
    : null;
  const active = todayLog?.planId === plan.id;

  return (
    <div className="space-y-5">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All plans
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{PLAN_CATEGORY_LABELS[plan.category]}</Badge>
            <Badge variant="outline">{plan.durationDays} days</Badge>
            {plan.isTemplate && <Badge variant="outline">Template</Badge>}
            {active && <Badge>Active · Day {todayLog?.planDay}</Badge>}
          </div>
          <h1 className="break-words text-2xl font-bold tracking-tight" data-testid="plan-title">
            {plan.name}
          </h1>
        </div>
        <StartPlanButton planId={plan.id} active={active} />
      </header>
      <PlanDayAccordion days={days} />
    </div>
  );
}
