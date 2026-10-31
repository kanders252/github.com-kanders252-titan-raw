import { withAuth } from "next-auth/middleware";

export default withAuth({ pages: { signIn: "/login" } });

// Protected routes. /recipes and /plans (list) stay public for browsing; all mutations
// are additionally guarded inside each Server Action.
export const config = {
  matcher: ["/daily", "/plans/new", "/plans/:id"],
};
