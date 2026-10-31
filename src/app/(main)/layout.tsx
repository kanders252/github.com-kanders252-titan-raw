import Link from "next/link";
import { Leaf } from "lucide-react";
import { BottomNav, SidebarNav } from "@/components/main-nav";
import { SignInLink, SignOutButton } from "@/components/auth-buttons";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";
import { getSession } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
          <Leaf className="h-5 w-5 text-primary" /> TITAN-RAW
        </Link>
        <SidebarNav />
        <div className="mt-auto space-y-2 px-2 text-sm">
          {user ? (
            <>
              <p className="truncate text-muted-foreground" data-testid="user-email">{user.email}</p>
              <SignOutButton />
            </>
          ) : (
            <SignInLink />
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <Leaf className="h-5 w-5 text-primary" /> TITAN-RAW
          </Link>
          <div className="flex items-center gap-1">
            <ShoppingListDrawer />
            {user ? <SignOutButton /> : <SignInLink />}
          </div>
        </header>
        <div className="hidden justify-end px-6 pt-4 md:flex">
          <ShoppingListDrawer />
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-10">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
