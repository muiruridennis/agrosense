import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthPath,
  isProtectedPath,
} from './lib/api/route-config';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const hasAccessToken = Boolean(accessToken);
  const hasRefreshToken = Boolean(refreshToken);

  const isAuthenticated = hasAccessToken || hasRefreshToken;

  /**
   * Auth-only pages:
   *
   * Logged-in users should not see login/register.
   */
  if (isAuthenticated && isAuthPath(pathname)) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url),
    );
  }

  /**
   * Protected pages:
   *
   * A user needs at least one auth token to access them.
   *
   * We intentionally allow the request through when a refresh
   * token exists. The Axios client can then attempt token refresh.
   */
  if (
    isProtectedPath(pathname) &&
    !hasAccessToken &&
    !hasRefreshToken
  ) {
    const loginUrl = new URL('/login', request.url);

    loginUrl.searchParams.set(
      'redirect',
      pathname,
    );

    return NextResponse.redirect(loginUrl);
  }

  /**
   * Everything else is public.
   *
   * This includes:
   * /contact
   * /about
   * /pricing
   * /auth/confirmEmail/*
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};