import type { MetadataRoute } from "next";
import { getAllPublicNutritionistSlugs } from "@/lib/public-nutritionists";

const baseUrl = "https://nutrinet.cl";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/nutricionistas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const slugs = await getAllPublicNutritionistSlugs();

    return [
      ...staticRoutes,
      ...slugs.map((slug) => ({
        url: `${baseUrl}/nutricionistas/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
