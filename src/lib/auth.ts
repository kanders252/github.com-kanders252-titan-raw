import "server-only";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Passwordless "dev login" for local development and Playwright only. Fails closed:
 * requires ENABLE_DEV_LOGIN=true AND never on any Vercel deployment (production or preview)
 * AND, when running a production build, NEXTAUTH_URL must point at localhost (E2E uses `next start`).
 */
export function isDevLoginEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ENABLE_DEV_LOGIN !== "true") return false;
  if (env.VERCEL || env.VERCEL_ENV) return false;
  if (env.NODE_ENV !== "production") return true;
  try {
    const host = new URL(env.NEXTAUTH_URL ?? "").hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

const providers: Provider[] = [];

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(EmailProvider({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM }));
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (isDevLoginEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "dev-login",
      name: "Dev login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email() }).safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        // Never let dev login impersonate an account that signed in through a real provider.
        const existing = await prisma.user.findUnique({
          where: { email },
          select: { emailVerified: true, _count: { select: { accounts: true } } },
        });
        if (existing && (existing.emailVerified || existing._count.accounts > 0)) return null;
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // JWT sessions let the email, OAuth and credentials providers coexist; the adapter
  // still persists users, accounts and verification tokens.
  session: { strategy: "jwt" },
  pages: { signIn: "/login", verifyRequest: "/login?check=email" },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Please sign in to continue.");
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError();
  return id;
}

export function availableProviders() {
  return {
    email: Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM),
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    dev: isDevLoginEnabled(),
  };
}
