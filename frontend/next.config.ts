import type { NextConfig } from "next";
import path from "node:path";

const apiOrigins = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_BACKEND_URL,
]
  .filter((value): value is string => Boolean(value))
  .flatMap((value) => {
    try {
      return [new URL(value).origin];
    } catch {
      return [];
    }
  });

// Host del bucket de Supabase Storage (avatares, PDF, exámenes). Sin esto el
// CSP bloquea en producción toda imagen subida por la aplicación, porque
// `img-src` sólo permitía 'self' y los avatares de Google.
const storageOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.googleusercontent.com${storageOrigin ? ` ${storageOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigins.join(" ")} https://accounts.google.com https://oauth2.googleapis.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      ...(storageOrigin
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(storageOrigin).hostname,
            },
          ]
        : []),
    ],
  },
  async headers() {
    if (process.env.NODE_ENV === "development") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
