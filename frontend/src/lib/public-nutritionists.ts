import { fetchApi } from "@/lib/api-base";

export interface PublicNutritionist {
  id: string;
  slug: string;
  fullName: string;
  specialty: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  consultationMode: string;
  location: string | null;
  avatarUrl: string | null;
  bookingEnabled: boolean;
  publicPhone: string | null;
  publicEmail: string | null;
  instagram: string | null;
  isPublic?: boolean;
}

export interface PublicNutritionistsResponse {
  nutritionists: PublicNutritionist[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

const DEFAULT_LIMIT = 12;

export async function getPublicNutritionists(params: {
  search?: string;
  specialty?: string;
  mode?: string;
  location?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PublicNutritionistsResponse> {
  const query = new URLSearchParams();

  query.set("page", String(params.page || 1));
  query.set("limit", String(params.limit || DEFAULT_LIMIT));

  if (params.search) query.set("search", params.search);
  if (params.specialty) query.set("specialty", params.specialty);
  if (params.mode) query.set("mode", params.mode);
  if (params.location) query.set("location", params.location);

  try {
    const response = await fetchApi(`/public/nutritionists?${query.toString()}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar el directorio público");
    }

    return response.json();
  } catch {
    return {
      nutritionists: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || DEFAULT_LIMIT,
      lastPage: 1,
    };
  }
}

export async function getPublicNutritionistBySlug(slug: string) {
  try {
    const response = await fetchApi(`/public/nutritionists/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<PublicNutritionist>;
  } catch {
    return null;
  }
}

export async function getAllPublicNutritionistSlugs() {
  const pageSize = 100;
  const slugs: string[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await getPublicNutritionists({ page, limit: pageSize });
    slugs.push(...result.nutritionists.map((nutritionist) => nutritionist.slug));
    lastPage = result.lastPage;
    page += 1;
  } while (page <= lastPage);

  return slugs;
}
