"use client";

import { useCallback, useEffect, useState } from "react";
import { SHOPPING_LIST_KEY, type ShoppingListItem } from "@/types";

// Shopping list lives ONLY in localStorage. Never sent to the server.
const EVENT = "titan-raw-shopping-list-change";

function isItem(v: unknown): v is ShoppingListItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.text === "string" &&
    typeof o.recipeId === "string" &&
    typeof o.recipeTitle === "string" &&
    typeof o.done === "boolean"
  );
}

export function readShoppingList(): ShoppingListItem[] {
  try {
    const raw = window.localStorage.getItem(SHOPPING_LIST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

function writeShoppingList(items: ShoppingListItem[]) {
  try {
    window.localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode); the in-memory state still updates
  }
  window.dispatchEvent(new Event(EVENT));
}

const norm = (s: string) => s.trim().toLowerCase();

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readShoppingList());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((fn: (prev: ShoppingListItem[]) => ShoppingListItem[]) => {
    const next = fn(readShoppingList());
    writeShoppingList(next);
    setItems(next);
  }, []);

  const addMany = useCallback(
    (texts: string[], recipe: { id: string; title: string }) =>
      update((prev) => {
        const existing = new Set(prev.map((i) => `${i.recipeId}:${norm(i.text)}`));
        const added = texts
          .filter((t) => !existing.has(`${recipe.id}:${norm(t)}`))
          .map((text) => ({
            id: `${recipe.id}:${norm(text)}`,
            text,
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            done: false,
          }));
        return [...prev, ...added];
      }),
    [update],
  );

  const toggle = useCallback(
    (id: string) => update((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))),
    [update],
  );
  const remove = useCallback((id: string) => update((prev) => prev.filter((i) => i.id !== id)), [update]);
  const clearDone = useCallback(() => update((prev) => prev.filter((i) => !i.done)), [update]);
  const clearAll = useCallback(() => update(() => []), [update]);

  return { items, addMany, toggle, remove, clearDone, clearAll };
}
