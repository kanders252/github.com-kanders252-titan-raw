import { describe, expect, it } from "vitest";
import { isDevLoginAllowed, type DevLoginEnv } from "@/lib/dev-login";

const LOCAL = ["http://localhost:3000", "http://127.0.0.1:3000"];
const REMOTE = ["https://titan-raw.app", "https://staging.titan-raw.app", "http://localhost.evil.com", "http://0.0.0.0:3000", "http://192.168.1.10:3000"];
const NODE_ENVS = ["development", "production", "test", undefined];
const on = (e: DevLoginEnv): DevLoginEnv => ({ ENABLE_DEV_LOGIN: "true", ...e });

describe("isDevLoginAllowed — security boundary", () => {
  describe("VERCEL=1 → always false, regardless of NODE_ENV or host", () => {
    for (const NODE_ENV of NODE_ENVS)
      for (const NEXTAUTH_URL of [...LOCAL, ...REMOTE])
        it(`NODE_ENV=${NODE_ENV} host=${NEXTAUTH_URL}`, () => {
          expect(isDevLoginAllowed(on({ VERCEL: "1", NODE_ENV, NEXTAUTH_URL }))).toBe(false);
        });

    it.each(["production", "preview", "development"])("VERCEL_ENV=%s alone also denies", (VERCEL_ENV) => {
      expect(isDevLoginAllowed(on({ VERCEL_ENV, NODE_ENV: "development", NEXTAUTH_URL: LOCAL[0] }))).toBe(false);
    });
  });

  describe("NODE_ENV=production AND host not localhost/127.0.0.1 → false", () => {
    it.each(REMOTE)("host=%s", (NEXTAUTH_URL) => {
      expect(isDevLoginAllowed(on({ NODE_ENV: "production", NEXTAUTH_URL }))).toBe(false);
    });
  });

  describe("true ONLY for NODE_ENV=development on localhost", () => {
    it.each(LOCAL)("allows development on %s", (NEXTAUTH_URL) => {
      expect(isDevLoginAllowed(on({ NODE_ENV: "development", NEXTAUTH_URL }))).toBe(true);
    });

    it.each(LOCAL)("denies production even on %s", (NEXTAUTH_URL) => {
      expect(isDevLoginAllowed(on({ NODE_ENV: "production", NEXTAUTH_URL }))).toBe(false);
    });

    it.each(["test", undefined, ""])("denies NODE_ENV=%s on localhost", (NODE_ENV) => {
      expect(isDevLoginAllowed(on({ NODE_ENV, NEXTAUTH_URL: LOCAL[0] }))).toBe(false);
    });

    it.each(REMOTE)("denies development on non-local host %s", (NEXTAUTH_URL) => {
      expect(isDevLoginAllowed(on({ NODE_ENV: "development", NEXTAUTH_URL }))).toBe(false);
    });

    it.each([undefined, "", "not a url"])("denies development with NEXTAUTH_URL=%s", (NEXTAUTH_URL) => {
      expect(isDevLoginAllowed(on({ NODE_ENV: "development", NEXTAUTH_URL }))).toBe(false);
    });

    it.each([
      "http://localhost@evil.com",
      "http://localhost:3000@evil.com",
      "http://evil.com#@localhost",
      "http://evil.com/?h=localhost",
      "http://localhost.:3000",
      "http://[::1]:3000",
    ])("denies adversarial/non-exact host %s", (NEXTAUTH_URL) => {
      expect(isDevLoginAllowed(on({ NODE_ENV: "development", NEXTAUTH_URL }))).toBe(false);
    });

    it.each(["HTTP://LOCALHOST:3000", " http://localhost:3000", "http://127.1:3000"])(
      "allows equivalent local spellings %s (WHATWG URL normalises them to a local host)",
      (NEXTAUTH_URL) => {
        expect(isDevLoginAllowed(on({ NODE_ENV: "development", NEXTAUTH_URL }))).toBe(true);
      },
    );

    it.each(["0", "false", ""])("treats any non-empty VERCEL value as Vercel (VERCEL=%j)", (VERCEL) => {
      const r = isDevLoginAllowed(on({ VERCEL, NODE_ENV: "development", NEXTAUTH_URL: LOCAL[0] }));
      expect(r).toBe(VERCEL === "");
    });

    it.each([undefined, "false", "1", "TRUE", "yes"])("denies when ENABLE_DEV_LOGIN=%s", (ENABLE_DEV_LOGIN) => {
      expect(isDevLoginAllowed({ ENABLE_DEV_LOGIN, NODE_ENV: "development", NEXTAUTH_URL: LOCAL[0] })).toBe(false);
    });
  });
});
