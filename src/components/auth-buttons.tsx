"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}

export function SignInLink() {
  return (
    <Button asChild size="sm">
      <Link href="/login">Sign in</Link>
    </Button>
  );
}
