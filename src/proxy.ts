import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { getJwtSecretBytes } from './lib/security';

// We use jose for edge-compatible token verification because jsonwebtoken uses Node crypto APIs
// which are not supported in Edge/Middleware runtime environments.
const JWT_SECRET_BYTES = getJwtSecretBytes();

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. If visiting the login page
  if (pathname.startsWith('/login')) {
    if (token) {
      try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES);
        const role = (payload.role as string).toLowerCase();
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
      } catch {
        // Expired/invalid token, let user access login
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // 2. If visiting dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES);
      const role = (payload.role as string).toUpperCase();

      // Ensure proper role matches their dashboard base path
      if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
      if (pathname.startsWith('/dashboard/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
      if (pathname.startsWith('/dashboard/accountant') && role !== 'ACCOUNTANT' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
      if (pathname.startsWith('/dashboard/staff') && role !== 'STAFF' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }

      // Root /dashboard redirect to specific role dashboard
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.warn('Middleware authentication failed, redirecting to login.', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
