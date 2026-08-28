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

// ─── Sesión autoritativa ─────────────────────────────────────────────────────
// SEGURIDAD: el rol se pregunta SIEMPRE al backend, que lo lee de la base de
// datos. Nunca se deduce de la cookie "user" (escribible por el navegador) ni
// del contenido del JWT (editable a mano). Sin esto, cualquiera podría poner
// role=ADMIN en sus cookies y entrar al panel de administración.
type SessionInfo = { role: string | null; rut: string | null };

const SESSION_CACHE_TTL_MS = 15_000;
const sessionCache = new Map<
  string,
  { expiresAt: number; session: SessionInfo | null }
>();

const getApiOrigin = () => {
  const raw =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  return raw ? raw.replace(/\/+$/, "") : null;
};

const fetchSession = async (
  request: NextRequest,
  sessionToken: string,
): Promise<SessionInfo | null> => {
  const cached = sessionCache.get(sessionToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session;
  }

  const origin = getApiOrigin();
  if (!origin) return null;

  let session: SessionInfo | null = null;
  try {
    const response = await fetch(`${origin}/auth/session-role`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
        ...(process.env.NEXT_PUBLIC_TENANT_ID
          ? { "X-Tenant-ID": process.env.NEXT_PUBLIC_TENANT_ID }
          : {}),
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as Partial<SessionInfo>;
      session = {
        role: typeof data?.role === "string" ? data.role : null,
        rut: typeof data?.rut === "string" ? data.rut : null,
      };
    } else if (response.status === 401 || response.status === 403) {
      session = null;
    } else {
      return null; // Error transitorio: no se cachea.
    }
  } catch {
    return null;
  }

  if (sessionCache.size > 500) sessionCache.clear();
  sessionCache.set(sessionToken, {
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    session,
  });

  return session;
};

export default async function proxy(request: NextRequest) {
  // auth_session_present is a non-httpOnly cookie (value "1") set by the backend
  // alongside the httpOnly JWT. It signals that a session exists without exposing the token.
  const token = request.cookies.get("auth_session_present")?.value;
  // El JWT httpOnly no es legible por JS, pero sí por el middleware: se usa sólo
  // como clave de caché y se reenvía al backend. Nunca se decodifica aquí.
  const sessionToken = request.cookies.get("auth_session")?.value;
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || PUBLIC_PATHS.has(pathname) || isPublicIntakeForm(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isAuthRoute = pathname === "/login";
  const isOnboardingRoute = pathname.startsWith(ONBOARDING_PATH);

  if (!token && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isDashboardRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const needsSession =
    Boolean(token) && (isDashboardRoute || isAuthRoute || isOnboardingRoute);

  if (!needsSession) {
    return NextResponse.next();
  }

  const session = sessionToken ? await fetchSession(request, sessionToken) : null;

  if (!session) {
    // Si el middleware en el servidor no pudo consultar el rol al backend
    // (por ejemplo, si la cookie httpOnly está en un dominio cruzado en producción),
    // se permite el paso para que AdminContext y AdminLayout en el cliente verifiquen
    // el rol autoritativamente con /auth/me usando credenciales CORS.
    return NextResponse.next();
  }

  const isStaff = STAFF_ROLES.has(session.role || "");
  const isWorker = session.role === "WORKER";
  const needsRut = !isStaff && !session.rut;

  if (needsRut && !isOnboardingRoute) {
    const url = new URL(ONBOARDING_PATH, request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute) {
    if (needsRut) {
      const url = new URL(ONBOARDING_PATH, request.url);
      url.searchParams.set("next", "/dashboard");
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(
      new URL(isStaff ? "/dashboard/admin" : "/dashboard", request.url),
    );
  }

  if (isDashboardRoute) {
    if (pathname === "/dashboard" && isStaff) {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    if (isWorker) {
      if (isAdminRoute && !isAllowedWorkerAdminPath(pathname)) {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }

      if (!isAdminRoute && pathname !== "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
    }

    if (isAdminRoute && !isStaff) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isOnboardingRoute && !needsRut) {
    return NextResponse.redirect(
      new URL(isStaff ? "/dashboard/admin" : "/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
