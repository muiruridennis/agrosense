import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/crops',
  '/livestock',
  '/ledger',
  '/advisor',
  '/profile',
  '/settings',
];

// Routes for authenticated users only (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/signup'];

export async function proxy (request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for both tokens
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasAccessToken = !!accessToken;
  const hasRefreshToken = !!refreshToken;

  // Redirect authenticated users away from auth pages
  if (hasAccessToken && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect private routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // ✅ ONLY redirect if BOTH tokens are missing
  // If refresh token exists, let the page load and let axios handle refresh
  if (isProtectedRoute && !hasAccessToken && !hasRefreshToken) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};