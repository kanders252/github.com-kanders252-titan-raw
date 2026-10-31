import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks, Salad, Sun } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { randomAffirmation } from "@/lib/affirmations";
import { getCurrentUserId } from "@/lib/auth";
import { todayKey } from "@/lib/date";
import { buildDailyView, findLog, firstIncompleteSlot } from "@/lib/daily-service";
import { SLOT_COUNT, SLOT_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const key = todayKey();
  // Read-only: no DailyLog yet simply renders 0/8 (it's created lazily on /daily).
  const log = userId ? await findLog(userId, key) : null;
  const completed = log?.completedSlots ?? [];
  const next = firstIncompleteSlot(completed);
  const view = userId && next ? await buildDailyView(log, key) : null;
  const nextRecipe = view?.slots.find((s) => s.slot === next)?.recipe ?? null;
  const affirmation = randomAffirmation();

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <ProgressRing completed={completed.length} />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{key}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {completed.length === SLOT_COUNT ? "A fully nourished day! 🌈" : "Today's abundance"}
          </h1>
          <p className="text-muted-foreground">
            {userId
              ? `${completed.length} of ${SLOT_COUNT} meal moments enjoyed · ${log?.infusedWaterOz ?? 0} oz infused water`
              : "Sign in to start filling your day with living food."}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-accent/60">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 font-medium text-accent-foreground">
              <Sun className="h-4 w-4" /> Today&apos;s Focus
            </CardDescription>
            <CardTitle className="text-xl leading-snug" data-testid="todays-focus">
              {affirmation}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Up next</CardDescription>
            <CardTitle data-testid="next-slot">
              {userId ? (next ? SLOT_LABELS[next] : "All 8 moments enjoyed") : SLOT_LABELS.INFUSED_WATER}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {nextRecipe
                ? `On the menu: ${nextRecipe.title}`
                : next
                  ? "Pick something vibrant from the recipe garden."
                  : "Savor the feeling. Tomorrow brings a fresh harvest."}
            </p>
            <Button asChild size="sm">
              <Link href="/daily">
                Open today <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section aria-label="Quick actions" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/daily", label: "Daily rhythm", desc: "Check off your 8 moments", icon: ListChecks },
          { href: "/recipes", label: "Recipes", desc: "Explore living dishes", icon: Salad },
          { href: "/plans", label: "Plans", desc: "Follow or build a plan", icon: CalendarDays },
        ].map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="flex items-center gap-3 p-4 transition-shadow group-hover:shadow-md">
              <div className="rounded-full bg-secondary p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{label}</p>
                <p className="truncate text-sm text-muted-foreground">{desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
