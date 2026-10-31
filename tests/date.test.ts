import { describe, expect, it } from "vitest";
import { addDays, dateKeyToDb, dbToDateKey, isDateKey, todayKey } from "@/lib/date";

describe("date helpers", () => {
  it("computes today in a timezone", () => {
    const instant = new Date("2026-01-01T03:00:00Z");
    expect(todayKey(instant, "UTC")).toBe("2026-01-01");
    expect(todayKey(instant, "America/Los_Angeles")).toBe("2025-12-31");
  });
  it("validates keys", () => {
    expect(isDateKey("2026-02-28")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("26-1-1")).toBe(false);
  });
  it("round-trips and adds days across month ends", () => {
    expect(dbToDateKey(dateKeyToDb("2026-03-15"))).toBe("2026-03-15");
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
  });
});
