"use client";

import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MEAL_SLOTS, SLOT_LABELS, type MealSlot } from "@/types";

export interface PlanDay {
  day: number;
  entries: Partial<Record<MealSlot, { id: string; title: string }>>;
}

export function PlanDayAccordion({ days }: { days: PlanDay[] }) {
  return (
    <Accordion type="multiple" defaultValue={["day-1"]} className="rounded-lg border bg-card px-4">
      {days.map(({ day, entries }) => {
        const filled = Object.keys(entries).length;
        return (
          <AccordionItem key={day} value={`day-${day}`} className="last:border-b-0">
            <AccordionTrigger>
              <span className="flex flex-1 items-center justify-between pr-3">
                <span>Day {day}</span>
                <span className="text-sm font-normal text-muted-foreground">{filled}/8 moments</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="divide-y">
                {MEAL_SLOTS.map((slot) => {
                  const r = entries[slot];
                  return (
                    <li key={slot} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:justify-between sm:gap-4">
                      <span className="text-muted-foreground">{SLOT_LABELS[slot]}</span>
                      {r ? (
                        <Link href={`/recipes/${r.id}`} className="break-words font-medium text-primary hover:underline sm:text-right">
                          {r.title}
                        </Link>
                      ) : (
                        <span className="italic text-muted-foreground">Your choice</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
