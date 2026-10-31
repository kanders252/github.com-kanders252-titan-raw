import { describe, expect, it } from "vitest";
import { safeCallback } from "@/lib/safe-redirect";
import { isNearToday } from "@/lib/date";

describe("safeCallback", () => {
  it.each(["/\\evil.com", "//evil.com", "https://evil.com", "/\\/evil.com", "javascript:alert(1)", undefined])(
    "rejects %s",
    (u) => expect(safeCallback(u)).toBe("/"),
  );
  it("keeps same-origin paths with query", () => {
    expect(safeCallback("/plans/new?x=1")).toBe("/plans/new?x=1");
  });
});

describe("isNearToday", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  it("allows today ±1", () => {
    expect(isNearToday("2026-10-30", now)).toBe(true);
    expect(isNearToday("2026-10-31", now)).toBe(true);
    expect(isNearToday("2026-11-01", now)).toBe(true);
  });
  it("rejects far dates", () => {
    expect(isNearToday("2026-11-05", now)).toBe(false);
    expect(isNearToday("0001-01-01", now)).toBe(false);
  });
});
