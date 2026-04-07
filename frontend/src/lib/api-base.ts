const FALLBACK_API_ORIGINS = [
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3002",
  "http://localhost:3002",
];

let preferredApiOrigin: string | null = null;

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");

export const getApiOriginCandidates = () => {
  const configuredOrigin = process.env.NEXT_PUBLIC_API_URL;
  const candidates = [
    configuredOrigin ? normalizeOrigin(configuredOrigin) : null,
    preferredApiOrigin,
    ...FALLBACK_API_ORIGINS,
  ].filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set(candidates.map(normalizeOrigin)));
};

export const getApiUrl = () =>
  preferredApiOrigin ||
  (process.env.NEXT_PUBLIC_API_URL
    ? normalizeOrigin(process.env.NEXT_PUBLIC_API_URL)
    : FALLBACK_API_ORIGINS[0]);

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const origin of getApiOriginCandidates()) {
    try {
      const response = await fetch(`${origin}${path}`, init);

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
