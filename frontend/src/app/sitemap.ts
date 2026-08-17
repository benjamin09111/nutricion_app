import type { MetadataRoute } from "next";
import { getAllPublicNutritionistSlugs } from "@/lib/public-nutritionists";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl"
).replace(/\/$/, "");

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/nutricionistas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sobre-nutrinet`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const slugs = await getAllPublicNutritionistSlugs();
    const nutritionistRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: `${baseUrl}/nutricionistas/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...nutritionistRoutes];
  } catch {
    return staticRoutes;
  }
}
