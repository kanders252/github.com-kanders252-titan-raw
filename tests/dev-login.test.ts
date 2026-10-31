import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@next-auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));

const { isDevLoginEnabled } = await import("@/lib/auth");
const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv;

describe("isDevLoginEnabled (fails closed)", () => {
  it("is off unless explicitly enabled", () => {
    expect(isDevLoginEnabled(env({ NODE_ENV: "development" }))).toBe(false);
  });
  it("is on in development", () => {
    expect(isDevLoginEnabled(env({ ENABLE_DEV_LOGIN: "true", NODE_ENV: "development" }))).toBe(true);
  });
  it("is on for a production build served on localhost (E2E)", () => {
    expect(
      isDevLoginEnabled(env({ ENABLE_DEV_LOGIN: "true", NODE_ENV: "production", NEXTAUTH_URL: "http://localhost:3000" })),
    ).toBe(true);
  });
  it("is off for a production build on a real host", () => {
    expect(
      isDevLoginEnabled(env({ ENABLE_DEV_LOGIN: "true", NODE_ENV: "production", NEXTAUTH_URL: "https://titan-raw.app" })),
    ).toBe(false);
  });
  it.each(["production", "preview", "development"])("is off on any Vercel deployment (%s)", (v) => {
    expect(isDevLoginEnabled(env({ ENABLE_DEV_LOGIN: "true", NODE_ENV: "development", VERCEL_ENV: v, VERCEL: "1" }))).toBe(false);
  });
});
