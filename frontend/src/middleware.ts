import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const userData = request.cookies.get('user')?.value;
    const { pathname } = request.nextUrl;

    // Define protected routes
    const isDashboardRoute = pathname.startsWith('/dashboard');
    const isAuthRoute = pathname === '/login' || pathname === '/register';

    // 1. If trying to access dashboard without token, redirect to login
    if (isDashboardRoute && !token) {
        const url = new URL('/login', request.url);
        // Store the original destination to redirect back after login
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    // 2. If logged in and trying to access auth routes, redirect to dashboard
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 3. Authorization (RBAC)
    if (isDashboardRoute && userData) {
        try {
            const user = JSON.parse(userData);

            // Example: Admin-only routes
            // If we have specific admin routes like /dashboard/admin, only Allow ADMIN role
            if (pathname.startsWith('/dashboard/admin') && !['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(user.role)) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (e) {
            // If user cookie is malformed, clear it and redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token');
            response.cookies.delete('user');
            return response;
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};
