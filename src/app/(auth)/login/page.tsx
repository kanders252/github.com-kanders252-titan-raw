import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { availableProviders, getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { safeCallback } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; check?: string; error?: string };
}) {
  const callbackUrl = safeCallback(searchParams.callbackUrl);
  const session = await getSession();
  if (session?.user) redirect(callbackUrl);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Link href="/" className="mb-2 flex items-center gap-2 text-xl font-bold">
            <Leaf className="h-6 w-6 text-primary" /> TITAN-RAW
          </Link>
          <CardTitle>Welcome to the garden</CardTitle>
          <CardDescription>Sign in to track your daily rhythm and build abundant plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {searchParams.check === "email" ? (
            <p className="text-center text-sm">Check your inbox. A sign-in link is on its way. 🌿</p>
          ) : (
            <LoginForm
              callbackUrl={callbackUrl}
              providers={availableProviders()}
              error={searchParams.error}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
