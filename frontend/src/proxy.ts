import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/privacy-policy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
]);

const isStaticAsset = (pathname: string) =>
  pathname.startsWith("/_next/") || /\.[a-zA-Z0-9]+$/.test(pathname);

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const userData = request.cookies.get("user")?.value;
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

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

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isDashboardRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (userParseFailed) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    response.cookies.delete("user");
    return response;
  }

  if (isAuthRoute && token) {
    const target =
      parsedUser && ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(parsedUser.role || "")
        ? "/dashboard/admin"
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

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

export const config = {
  matcher: ["/:path*"],
};
