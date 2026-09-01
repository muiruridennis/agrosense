
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