import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const userData = request.cookies.get("user")?.value;
  const { pathname } = request.nextUrl;
  let parsedUser: { role?: string } | null = null;
  let userParseFailed = false;

  if (userData) {
    try {
      parsedUser = JSON.parse(userData);
    } catch {
      userParseFailed = true;
      parsedUser = null;
    }
  }

  // Define protected routes
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // 1. If trying to access dashboard without token, redirect to login
  if (isDashboardRoute && !token) {
    const url = new URL("/login", request.url);
    // Store the original destination to redirect back after login
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (userParseFailed) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    response.cookies.delete("user");
    return response;
  }

  // 2. If logged in and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && token) {
    const target =
      parsedUser && ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(parsedUser.role || "")
        ? "/dashboard/admin"
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Authorization (RBAC)
  if (isDashboardRoute && parsedUser) {
    const isAdmin = ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(
      parsedUser.role || "",
    );

    if (pathname === "/dashboard" && isAdmin) {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    if (pathname.startsWith("/dashboard/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
