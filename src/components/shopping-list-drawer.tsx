"use client";

import { ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useShoppingList } from "@/lib/shopping-list";

export function ShoppingListDrawer() {
  const { items, toggle, remove, clearDone, clearAll } = useShoppingList();
  const open = items.filter((i) => !i.done).length;

  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.recipeTitle] ??= []).push(item);
    return acc;
  }, {});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Open shopping list" data-testid="shopping-list-trigger">
          <ShoppingBasket />
          <span className="tabular-nums">{open}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your market basket</DialogTitle>
          <DialogDescription>Saved on this device only.</DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Your basket is ready to be filled. Add ingredients from any recipe.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groups).map(([title, groupItems]) => (
              <section key={title}>
                <h4 className="mb-2 text-sm font-semibold">{title}</h4>
                <ul className="space-y-2">
                  {groupItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`sl-${item.id}`}
                        checked={item.done}
                        onCheckedChange={() => toggle(item.id)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`sl-${item.id}`}
                        className={`min-w-0 flex-1 break-words text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
                      >
                        {item.text}
                      </label>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${item.text}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
            <Button variant="secondary" size="sm" onClick={clearDone}>
              Clear gathered
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
