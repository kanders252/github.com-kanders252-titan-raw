"use client";

import { useState } from "react";
import { Check, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useShoppingList } from "@/lib/shopping-list";

interface Props {
  recipe: { id: string; title: string };
  ingredients: string[];
}

/** Ingredient checkboxes are local UI state only; the shopping list goes to localStorage only. */
export function IngredientChecklist({ recipe, ingredients }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState(false);
  const { addMany } = useShoppingList();

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const add = (items: string[]) => {
    addMany(items, recipe);
    setAdded(true);
  };

  const selected = ingredients.filter((_, i) => checked.has(i));

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {ingredients.map((ing, i) => (
          <li key={i} className="flex items-start gap-3">
            <Checkbox id={`ing-${i}`} checked={checked.has(i)} onCheckedChange={() => toggle(i)} className="mt-0.5" />
            <label htmlFor={`ing-${i}`} className="min-w-0 break-words text-sm leading-snug">
              {ing}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button onClick={() => add(ingredients)} data-testid="add-all-to-shopping-list">
          {added ? <Check /> : <ShoppingBasket />} Add All to Shopping List
        </Button>
        {selected.length > 0 && (
          <Button variant="outline" onClick={() => add(selected)}>
            Add {selected.length} selected
          </Button>
        )}
      </div>
      {added && (
        <p role="status" className="text-sm text-primary">
          Added to your basket. 🌿
        </p>
      )}
    </div>
  );
}
