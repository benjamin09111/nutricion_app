import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/nutricionistas", "/nutricionistas/"],
        disallow: ["/dashboard", "/dashboard/", "/portal", "/portal/", "/login", "/api"],
      },
    ],
    sitemap: "https://nutrinet.cl/sitemap.xml",
    host: "https://nutrinet.cl",
  };
}
