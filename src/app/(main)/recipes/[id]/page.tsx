import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Leaf, Sparkles, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/types";
import { IngredientChecklist } from "./ingredient-checklist";

export const dynamic = "force-dynamic";

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

async function getRecipe(id: string) {
  return prisma.recipe.findUnique({ where: { id } });
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await getRecipe(params.id);
  return { title: r?.title ?? "Recipe" };
}

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const recipe = await getRecipe(params.id);
  if (!recipe) notFound();

  const ingredients = asStrings(recipe.ingredients);
  const instructions = asStrings(recipe.instructions);

  return (
    <article className="space-y-6">
      <Link href="/recipes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All recipes
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{CATEGORY_LABELS[recipe.category]}</Badge>
          {recipe.isPremium && (
            <Badge className="gap-1 bg-citrus text-black">
              <Sparkles className="h-3 w-3" /> Premium
            </Badge>
          )}
          {recipe.badges.map((b) => (
            <Badge key={b} variant="outline">
              {b}
            </Badge>
          ))}
        </div>
        <h1 className="break-words text-3xl font-bold tracking-tight">{recipe.title}</h1>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-primary" />
            <dt className="sr-only">Temperature</dt>
            <dd>{recipe.temperatureStatus === "raw_under_115F" ? "Raw, never above 115°F" : recipe.temperatureStatus}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <dt className="sr-only">Whole-food fat</dt>
            <dd>{recipe.fatSource ? `Whole-food fat: ${recipe.fatSource}` : "Naturally fat-light"}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <IngredientChecklist recipe={{ id: recipe.id, title: recipe.title }} ingredients={ingredients} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 break-words">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nutrient highlights</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recipe.keyMicronutrients.map((m) => (
              <Badge key={m} variant="secondary">
                {m}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw techniques</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recipe.prepTechniques.map((t) => (
              <Badge key={t} variant="outline" className="capitalize">
                {t}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
