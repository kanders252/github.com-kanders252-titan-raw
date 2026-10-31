"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MealSlot } from "@prisma/client";
import { MealSlotRow } from "@/components/meal-slot-row";
import { Progress } from "@/components/ui/progress";
import { assignRecipeToSlot, getTodayLog, incrementWater, toggleMealSlot } from "@/lib/actions/daily-actions";
import { SLOT_COUNT, type DailyView } from "@/types";

export default function DailyPage() {
  const router = useRouter();
  const [view, setView] = useState<DailyView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await getTodayLog();
    if (res.ok) {
      setView(res.data);
      setError(null);
    } else setError(res.error);
  }, []);

  useEffect(() => {
    void load();
    // Re-sync when the tab regains focus (another device, or the calendar day rolled over).
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // All optimistic updates are functional and each failure reverts only its own change,
  // so rapid taps can't clobber each other.
  const flipSlot = (slot: MealSlot) =>
    setView((v) => {
      if (!v) return v;
      const slots = v.slots.map((s) => (s.slot === slot ? { ...s, completed: !s.completed } : s));
      return { ...v, slots, completedCount: slots.filter((s) => s.completed).length };
    });

  const onToggle = (slot: MealSlot) => {
    if (!view) return;
    const date = view.date;
    flipSlot(slot);
    startTransition(async () => {
      const res = await toggleMealSlot(date, slot);
      if (!res.ok) {
        flipSlot(slot);
        setError(res.error);
        return;
      }
      router.refresh(); // keep the client router cache in step with revalidatePath('/')
    });
  };

  const setSlotRecipe = (slot: MealSlot, recipe: { id: string; title: string } | null) =>
    setView((v) => v && { ...v, slots: v.slots.map((s) => (s.slot === slot ? { ...s, recipe } : s)) });

  const onAssign = (slot: MealSlot, recipeId: string | null) => {
    if (!view) return;
    const date = view.date;
    const previous = view.slots.find((s) => s.slot === slot)?.recipe ?? null;
    const r = recipeId ? view.recipes.find((x) => x.id === recipeId) : null;
    setSlotRecipe(slot, r ? { id: r.id, title: r.title } : null);
    startTransition(async () => {
      const res = await assignRecipeToSlot(date, slot, recipeId);
      if (!res.ok) {
        setSlotRecipe(slot, previous);
        setError(res.error);
      }
    });
  };

  const addWater = (oz: number) => setView((v) => v && { ...v, infusedWaterOz: Math.max(0, v.infusedWaterOz + oz) });

  const onAddWater = () => {
    if (!view) return;
    const date = view.date;
    addWater(8);
    startTransition(async () => {
      const res = await incrementWater(date);
      if (!res.ok) {
        addWater(-8);
        setError(res.error);
      }
    });
  };

  if (!view) {
    return (
      <div className="space-y-3" aria-busy="true">
        <h1 className="text-2xl font-bold tracking-tight">Daily rhythm</h1>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: SLOT_COUNT }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Daily rhythm</h1>
          <span className="text-sm text-muted-foreground">{view.date}</span>
        </div>
        {view.plan ? (
          <p className="text-sm">
            Following{" "}
            <Link href={`/plans/${view.plan.id}`} className="font-medium text-primary hover:underline">
              {view.plan.name}
            </Link>{" "}
            · Day {view.plan.day} of {view.plan.durationDays}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Choose what delights you for each moment, or{" "}
            <Link href="/plans" className="text-primary hover:underline">
              start a plan
            </Link>
            .
          </p>
        )}
        <div className="flex items-center gap-3">
          <Progress value={(view.completedCount / SLOT_COUNT) * 100} aria-label="Daily progress" />
          <span className="shrink-0 text-sm font-semibold tabular-nums" data-testid="daily-count">
            {view.completedCount}/{SLOT_COUNT}
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ol className="space-y-2" aria-label="Today's meal moments">
        {view.slots.map((s) => (
          <MealSlotRow
            key={s.slot}
            view={s}
            recipes={view.recipes}
            onToggle={() => onToggle(s.slot)}
            onAssign={(id) => onAssign(s.slot, id)}
            {...(s.slot === "INFUSED_WATER" && { onAddWater, waterOz: view.infusedWaterOz })}
          />
        ))}
      </ol>
      <span className="sr-only" aria-live="polite">
        {pending ? "Saving…" : "Saved"}
      </span>
    </div>
  );
}
