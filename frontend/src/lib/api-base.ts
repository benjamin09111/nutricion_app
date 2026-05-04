const LOCAL_DEV_API_ORIGINS = [
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3002",
  "http://localhost:3002",
];

let preferredApiOrigin: string | null = null;

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");
const isProductionBuild = process.env.NODE_ENV === "production";

const isLoopbackHost = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const isLoopbackOrigin = (origin: string) => {
  try {
    const parsed = new URL(origin);
    return isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
};

const isLocalDevRuntime = () => {
  const isDev = process.env.NODE_ENV !== "production";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    return isDev || isLocalHost;
  }

  return isDev;
};

const getSameOriginCandidate = () =>
  typeof window !== "undefined" && window.location?.origin
    ? normalizeOrigin(window.location.origin)
    : null;

export const getApiOriginCandidates = () => {
  const configuredOrigin = process.env.NEXT_PUBLIC_API_URL;
  const safeConfiguredOrigin =
    configuredOrigin &&
    !(isProductionBuild && isLoopbackOrigin(configuredOrigin))
      ? normalizeOrigin(configuredOrigin)
      : null;
  const sameOrigin = getSameOriginCandidate();
  const localDevOrigins = isLocalDevRuntime() ? LOCAL_DEV_API_ORIGINS : [];
  const candidates = [
    safeConfiguredOrigin,
    sameOrigin,
    preferredApiOrigin,
    ...localDevOrigins,
  ].filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set(candidates.map(normalizeOrigin)));
};

export const getApiUrl = () =>
  preferredApiOrigin ||
  (process.env.NEXT_PUBLIC_API_URL &&
  !(isProductionBuild && isLoopbackOrigin(process.env.NEXT_PUBLIC_API_URL))
    ? normalizeOrigin(process.env.NEXT_PUBLIC_API_URL)
    : getSameOriginCandidate() || (isLocalDevRuntime() ? LOCAL_DEV_API_ORIGINS[0] : ""));

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const origin of getApiOriginCandidates()) {
    try {
      const response = await fetch(`${origin}${path}`, init);

      if (response.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
        // Prevent multiple toasts/redirects if there are concurrent requests
        if (!(window as any)._isRedirectingToLogin) {
          (window as any)._isRedirectingToLogin = true;
          import("js-cookie").then((m) => m.default.remove("auth_token"));
          localStorage.removeItem("auth_token");
          import("sonner").then(({ toast }) => {
            toast.error("Tu sesión expiró. Por favor inicia sesión nuevamente.", { id: "session-expired", duration: 3000 });
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
        // Return a promise that never resolves so the component just waits while we redirect
        // This prevents component-level "error loading X" toasts from showing up.
        return new Promise(() => {});
      }

      if (response.ok || ![404].includes(response.status)) {
        preferredApiOrigin = origin;
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo conectar con la API.");
}
