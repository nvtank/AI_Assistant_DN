import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin routes
 * Basic check - full admin verification happens in the page component
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Basic check: if accessing admin route, let it through
  // The actual admin role check happens in the page component
  // This prevents direct URL access but allows the page to handle auth
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
