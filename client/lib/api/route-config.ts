// lib/api/route-config.ts

/**
 * Routes that require an authenticated user.
 *
 * Anything NOT in this list is considered public unless
 * it is explicitly an auth-only route.
 */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/crops",
  "/livestock",
  "/ledger",
  "/advisor",
  "/profile",
  "/settings",
] as const;

/**
 * Routes that are only intended for unauthenticated users.
 *
 * If an authenticated user visits these pages, they are sent
 * to the dashboard.
 */
export const AUTH_ROUTES = ["/login", "/register"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
