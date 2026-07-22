import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/privacy-policy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/formulario-paciente",
]);

const isStaticAsset = (pathname: string) =>
  pathname.startsWith("/_next/") || /\.[a-zA-Z0-9]+$/.test(pathname);

const isPublicIntakeForm = (pathname: string) =>
  pathname.startsWith("/formulario-paciente/") ||
  pathname.startsWith("/api/public/patient-intake/");

const STAFF_ROLES = new Set([
  "ADMIN",
  "ADMIN_MASTER",
  "ADMIN_GENERAL",
  "WORKER",
]);

const ONBOARDING_PATH = "/onboarding/rut";

const WORKER_ALLOWED_ADMIN_PATHS = [
  "/dashboard/admin/nutricionistas",
  "/dashboard/admin/mensajes",
  "/dashboard/admin/feedback",
  "/dashboard/admin/cupones",
];

const isAllowedWorkerAdminPath = (pathname: string) =>
  pathname === "/dashboard/admin" ||
  WORKER_ALLOWED_ADMIN_PATHS.some(
    (allowedPath) => pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const userData = request.cookies.get("user")?.value;
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || PUBLIC_PATHS.has(pathname) || isPublicIntakeForm(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let parsedUser: { role?: string; rut?: string | null } | null = null;
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
  const isAuthRoute = pathname === "/login";
  const isOnboardingRoute = pathname.startsWith(ONBOARDING_PATH);
  const needsRut = Boolean(
    parsedUser && !STAFF_ROLES.has(parsedUser.role || "") && !parsedUser.rut,
  );

  if (!token && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && needsRut && !isOnboardingRoute) {
    const url = new URL(ONBOARDING_PATH, request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

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
    if (needsRut) {
      const url = new URL(ONBOARDING_PATH, request.url);
      url.searchParams.set("next", "/dashboard");
      return NextResponse.redirect(url);
    }

    const target =
      parsedUser && STAFF_ROLES.has(parsedUser.role || "")
        ? "/dashboard/admin"
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isDashboardRoute && parsedUser) {
    const isStaff = STAFF_ROLES.has(parsedUser.role || "");
    const isWorker = parsedUser.role === "WORKER";

    if (pathname === "/dashboard" && isStaff) {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    if (isWorker) {
      if (
        pathname.startsWith("/dashboard/admin") &&
        !isAllowedWorkerAdminPath(pathname)
      ) {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }

      if (
        !pathname.startsWith("/dashboard/admin") &&
        pathname !== "/dashboard"
      ) {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
    }

    if (pathname.startsWith("/dashboard/admin") && !isStaff) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isOnboardingRoute && token && !needsRut) {
    const target =
      parsedUser && STAFF_ROLES.has(parsedUser.role || "")
        ? "/dashboard/admin"
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
