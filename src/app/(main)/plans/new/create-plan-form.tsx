"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MealSlot, PlanCategory } from "@prisma/client";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMealPlan } from "@/lib/actions/plan-actions";
import { MAX_PLAN_DAYS, MIN_PLAN_DAYS } from "@/lib/validation";
import {
  CATEGORY_LABELS, MEAL_SLOTS, PLAN_CATEGORIES, PLAN_CATEGORY_LABELS, SLOT_LABELS, type RecipeOption,
} from "@/types";

type Assignments = Record<string, string>; // `${day}:${slot}` → recipeId
const key = (day: number, slot: MealSlot) => `${day}:${slot}`;

export function CreatePlanForm({ recipes }: { recipes: RecipeOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [durationInput, setDurationInput] = useState("7");
  const [category, setCategory] = useState<PlanCategory>("CUSTOM");
  const [assignments, setAssignments] = useState<Assignments>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const duration = Number(durationInput);
  const durationValid = Number.isInteger(duration) && duration >= MIN_PLAN_DAYS && duration <= MAX_PLAN_DAYS;
  const days = durationValid ? Array.from({ length: duration }, (_, i) => i + 1) : [];

  const entries = useMemo(
    () =>
      Object.entries(assignments)
        .filter(([k, v]) => v && Number(k.split(":")[0]) <= (durationValid ? duration : 0))
        .map(([k, recipeId]) => {
          const [d, slot] = k.split(":");
          return { day: Number(d), slot: slot as MealSlot, recipeId };
        }),
    [assignments, duration, durationValid],
  );

  const assign = (day: number, slot: MealSlot, recipeId: string) =>
    setAssignments((prev) => ({ ...prev, [key(day, slot)]: recipeId }));

  const copyDayOneToAll = () =>
    setAssignments((prev) => {
      const next = { ...prev };
      for (const d of days.slice(1)) for (const s of MEAL_SLOTS) next[key(d, s)] = prev[key(1, s)] ?? "";
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!durationValid) return setError(`Plans run ${MIN_PLAN_DAYS}–${MAX_PLAN_DAYS} days.`);
    startTransition(async () => {
      const res = await createMealPlan({ name, durationDays: duration, category, entries });
      if (!res.ok) return setError(res.error);
      router.push(`/plans/${res.data.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="My Rainbow Week" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-duration">Duration (days)</Label>
            <Input
              id="plan-duration"
              type="number"
              inputMode="numeric"
              min={MIN_PLAN_DAYS}
              max={MAX_PLAN_DAYS}
              required
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              aria-invalid={!durationValid}
            />
            {!durationValid && <p className="text-xs text-destructive">Choose {MIN_PLAN_DAYS}–{MAX_PLAN_DAYS} days.</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="plan-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as PlanCategory)}>
              <SelectTrigger id="plan-category" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {PLAN_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {durationValid && (
        <section className="space-y-3" aria-label="Day-by-day menu">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Day-by-day menu</h2>
            <Button type="button" variant="outline" size="sm" onClick={copyDayOneToAll}>
              <Copy /> Repeat day 1 on every day
            </Button>
          </div>
          {days.map((day) => (
            <Card key={day} data-testid={`plan-day-${day}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Day {day}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {MEAL_SLOTS.map((slot) => {
                  const id = `d${day}-${slot}`;
                  return (
                    <div key={slot} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2">
                      <Label htmlFor={id} className="text-sm">
                        {SLOT_LABELS[slot]}
                      </Label>
                      <select
                        id={id}
                        value={assignments[key(day, slot)] ?? ""}
                        onChange={(e) => assign(day, slot, e.target.value)}
                        className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        data-testid={`select-${day}-${slot}`}
                      >
                        <option value="">Choose a recipe…</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({CATEGORY_LABELS[r.category]})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur md:bottom-4">
        <span className="text-sm text-muted-foreground">{entries.length} moments planned</span>
        <Button type="submit" disabled={pending || !durationValid} data-testid="create-plan-submit">
          {pending ? "Saving…" : "Create plan"}
        </Button>
      </div>
    </form>
  );
}
