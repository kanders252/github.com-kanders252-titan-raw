"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startMealPlan } from "@/lib/actions/plan-actions";

export function StartPlanButton({ planId, active }: { planId: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await startMealPlan(planId);
            if (!res.ok) return setMessage(res.error);
            setMessage(`Your ${res.data.days} days of abundance begin today!`);
            router.push("/daily");
            router.refresh();
          })
        }
        data-testid="start-plan"
      >
        <Play /> {pending ? "Starting…" : active ? "Restart from today" : "Start Plan"}
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
