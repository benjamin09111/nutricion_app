import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/privacy-policy", "/terms", "/sitemap.xml"],
        disallow: ["/dashboard", "/portal", "/login", "/api", "/maintenance"],
      },
    ],
    sitemap: "https://nutrinet.cl/sitemap.xml",
    host: "https://nutrinet.cl",
  };
}
