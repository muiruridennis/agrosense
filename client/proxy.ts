// import { NextRequest, NextResponse } from 'next/server';
// import {
//   isAuthPath,
//   isProtectedPath,
// } from './lib/api/route-config';

// export function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   const accessToken = request.cookies.get('access_token')?.value;
//   const refreshToken = request.cookies.get('refresh_token')?.value;

//   const hasAccessToken = Boolean(accessToken);
//   const hasRefreshToken = Boolean(refreshToken);

//   const isAuthenticated = hasAccessToken || hasRefreshToken;

//   /**
//    * Auth-only pages:
//    *
//    * Logged-in users should not see login/register.
//    */
//   if (isAuthenticated && isAuthPath(pathname)) {
//     return NextResponse.redirect(
//       new URL('/dashboard', request.url),
//     );
//   }

//   /**
//    * Protected pages:
//    *
//    * A user needs at least one auth token to access them.
//    *
//    * We intentionally allow the request through when a refresh
//    * token exists. The Axios client can then attempt token refresh.
//    */
//   if (
//     isProtectedPath(pathname) &&
//     !hasAccessToken &&
//     !hasRefreshToken
//   ) {
//     const loginUrl = new URL('/login', request.url);

//     loginUrl.searchParams.set(
//       'redirect',
//       pathname,
//     );

//     return NextResponse.redirect(loginUrl);
//   }

//   /**
//    * Everything else is public.
//    *
//    * This includes:
//    * /contact
//    * /about
//    * /pricing
//    * /auth/confirmEmail/*
//    */
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
//   ],
// };
import { de } from 'date-fns/locale';
import { NextRequest, NextResponse } from 'next/server';

// Auth gating was removed from this middleware. It ran on the client's
// own domain (agrosense-client.onrender.com), but the auth cookies are
// set by the API on a different domain (agrosense-server-*.onrender.com)
// — middleware can only ever see cookies scoped to its own domain, so
// request.cookies.get('access_token') was always undefined here,
// regardless of whether the user was actually logged in. Every request
// to a protected route was being redirected to /login unconditionally.
//
// AuthProvider (client-side) correctly determines auth state via a
// cross-site call to /auth/currentuser — which does carry the cookies,
// since that's a real fetch/XHR request, not server-side middleware —
// and is the single source of truth for redirects until API requests
// are proxied through this domain (see /areas/agrosense.md for that
// follow-up).

export default function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};