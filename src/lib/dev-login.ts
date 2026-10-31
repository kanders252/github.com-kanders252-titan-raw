/**
 * Security boundary: decides whether the passwordless "dev login" provider may exist.
 * Pure function of the environment; no I/O, so it is exhaustively unit-tested.
 *
 * Allowed ONLY when ALL of:
 *   - ENABLE_DEV_LOGIN === "true"
 *   - not running on Vercel (VERCEL / VERCEL_ENV unset), whatever NODE_ENV or host says
 *   - NODE_ENV === "development" (production, test or unset → denied)
 *   - NEXTAUTH_URL host is exactly localhost or 127.0.0.1 (missing/invalid → denied)
 */
export type DevLoginEnv = Partial<
  Record<"ENABLE_DEV_LOGIN" | "VERCEL" | "VERCEL_ENV" | "NODE_ENV" | "NEXTAUTH_URL", string>
>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function isDevLoginAllowed(env: DevLoginEnv): boolean {
  if (env.ENABLE_DEV_LOGIN !== "true") return false;
  if (env.VERCEL || env.VERCEL_ENV) return false;
  if (env.NODE_ENV !== "development") return false;
  try {
    return LOCAL_HOSTS.has(new URL(env.NEXTAUTH_URL ?? "").hostname);
  } catch {
    return false;
  }
}
