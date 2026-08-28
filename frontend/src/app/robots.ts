import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/nutricionistas",
          "/nutricionistas/*",
          "/sobre-nutrinet",
          "/privacy-policy",
          "/terms",
          "/sitemap.xml",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/portal",
          "/portal/*",
          "/formulario-paciente",
          "/formulario-paciente/*",
          "/login",
          "/api",
          "/api/*",
          "/maintenance",
          "/onboarding",
          "/onboarding/*",
          "/sesion-actualizada",
          "/verify-email",
          "/auth",
          "/auth/*",
          "/plan",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
