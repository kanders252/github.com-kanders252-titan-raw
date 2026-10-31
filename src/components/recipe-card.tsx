import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS, type RecipeCategory } from "@/types";

export interface RecipeCardData {
  id: string;
  title: string;
  category: RecipeCategory;
  badges: string[];
  isPremium: boolean;
  keyMicronutrients: string[];
}

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block focus-visible:outline-none" data-testid="recipe-card">
      <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABELS[recipe.category]}</Badge>
            {recipe.isPremium && (
              <Badge className="gap-1 bg-citrus text-black">
                <Sparkles className="h-3 w-3" /> Premium
              </Badge>
            )}
          </div>
          <CardTitle className="break-words">{recipe.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Rich in {recipe.keyMicronutrients.slice(0, 3).join(" · ")}</p>
          <div className="flex flex-wrap gap-1">
            {recipe.badges.map((b) => (
              <Badge key={b} variant="outline" className="font-normal">
                {b}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
