"use client";

import Link from "next/link";
import { Droplets, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DailySlotView, RecipeOption } from "@/types";

const UNASSIGNED = "__none__";

interface Props {
  view: DailySlotView;
  recipes: RecipeOption[];
  waterOz?: number;
  disabled?: boolean;
  onToggle: () => void;
  onAssign: (recipeId: string | null) => void;
  onAddWater?: () => void;
}

export function MealSlotRow({ view, recipes, waterOz, disabled, onToggle, onAssign, onAddWater }: Props) {
  const id = `slot-${view.slot}`;
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors sm:flex-row sm:items-center sm:p-4",
        view.completed && "border-primary/40 bg-secondary/60",
      )}
      data-testid={`slot-row-${view.slot}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          id={id}
          checked={view.completed}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label={`Mark ${view.label} as enjoyed`}
          className="mt-0.5 h-6 w-6"
          data-testid={`slot-checkbox-${view.slot}`}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={id} className="block font-semibold leading-tight">
            {view.label}
          </label>
          {view.recipe && view.fromPlan ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/recipes/${view.recipe.id}`} className="break-words text-primary hover:underline">
                {view.recipe.title}
              </Link>
              <Badge variant="outline" className="font-normal">
                from plan
              </Badge>
            </div>
          ) : (
            <Select
              value={view.recipe?.id ?? UNASSIGNED}
              onValueChange={(v) => onAssign(v === UNASSIGNED ? null : v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-full sm:max-w-xs" aria-label={`Assign recipe for ${view.label}`}>
                <SelectValue placeholder="Assign Recipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Assign Recipe</SelectItem>
                {recipes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {onAddWater && (
        <div className="flex items-center justify-between gap-3 pl-9 sm:pl-0">
          <span className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground" data-testid="water-oz">
            <Droplets className="h-4 w-4 text-sky-500" /> {waterOz ?? 0} oz
          </span>
          <Button size="sm" variant="secondary" onClick={onAddWater} disabled={disabled} data-testid="add-water">
            <Plus /> 8 oz
          </Button>
        </div>
      )}
    </li>
  );
}
