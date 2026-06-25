import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_MODE = true;

const PUBLIC_PATHS = new Set([
  "/privacy-policy",
  "/terms",
  "/maintenance",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
]);

const isStaticAsset = (pathname: string) =>
  pathname.startsWith("/_next/") || /\.[a-zA-Z0-9]+$/.test(pathname);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isStaticAsset(pathname) || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json(
      { message: "NutriNet está en mantenimiento." },
      { status: 503 },
    );
  }

  if (MAINTENANCE_MODE) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
