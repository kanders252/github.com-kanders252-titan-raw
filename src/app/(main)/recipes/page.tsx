import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, RECIPE_CATEGORIES, type RecipeCategory } from "@/types";

export const metadata: Metadata = { title: "Recipes" };
export const dynamic = "force-dynamic";

function isCategory(v: string | undefined): v is RecipeCategory {
  return !!v && (RECIPE_CATEGORIES as readonly string[]).includes(v);
}

export default async function RecipesPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const category = isCategory(searchParams.category) ? searchParams.category : undefined;

  const where: Prisma.RecipeWhereInput = {
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(category && { category }),
  };
  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { title: "asc" },
    select: { id: true, title: true, category: true, badges: true, isPremium: true, keyMicronutrients: true },
  });

  const href = (c?: RecipeCategory) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    const s = p.toString();
    return s ? `/recipes?${s}` : "/recipes";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recipe garden</h1>
        <p className="text-muted-foreground">Living dishes, all under 115°F and bursting with nutrients.</p>
      </div>

      <form action="/recipes" className="flex gap-2" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search recipes…" className="pl-9" aria-label="Search recipes" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2 pb-1">
          {[undefined, ...RECIPE_CATEGORIES].map((c) => (
            <li key={c ?? "all"}>
              <Link
                href={href(c)}
                className={cn(
                  "inline-block rounded-full border px-3 py-1 text-sm transition-colors hover:bg-secondary",
                  c === category && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {c ? CATEGORY_LABELS[c] : "All"}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {recipes.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Nothing matches yet. Try another search, the garden is full of options.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}
