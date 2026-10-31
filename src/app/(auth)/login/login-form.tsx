"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  callbackUrl: string;
  providers: { email: boolean; google: boolean; dev: boolean };
  error?: string;
}

export function LoginForm({ callbackUrl, providers, error }: Props) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const none = !providers.email && !providers.google && !providers.dev;

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    if (providers.email) await signIn("email", { email, callbackUrl });
    else await signIn("dev-login", { email, callbackUrl });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-2 text-center text-sm text-destructive">
          We couldn&apos;t sign you in. Please try again.
        </p>
      )}
      {providers.google && (
        <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl })}>
          Continue with Google
        </Button>
      )}
      {(providers.email || providers.dev) && (
        <form onSubmit={submitEmail} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {providers.email ? "Email me a magic link" : "Sign in (dev)"}
          </Button>
          {!providers.email && providers.dev && (
            <p className="text-center text-xs text-muted-foreground">
              Dev login is enabled (ENABLE_DEV_LOGIN). Configure EMAIL_SERVER for magic links.
            </p>
          )}
        </form>
      )}
      {none && (
        <p className="text-center text-sm text-muted-foreground">
          No sign-in providers are configured. Set GOOGLE_CLIENT_ID/SECRET or EMAIL_SERVER (see README).
        </p>
      )}
    </div>
  );
}
