import { fetchApi } from "@/lib/api-base";

export interface PublicNutritionist {
  id: string;
  slug: string;
  fullName: string;
  professionalId: string | null;
  specialty: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  consultationMode: string;
  location: string | null;
  avatarUrl: string | null;
  bookingEnabled: boolean;
  showSchedule: boolean;
  publicPhone: string | null;
  publicEmail: string | null;
  instagram: string | null;
  linkedin: string | null;
  isPublic?: boolean;
  conditionsTreated: string | null;
  patientTypes: string | null;
  prices: string | null;
  officeAddress: string | null;
  paymentMethods: string | null;
  acceptedInsurance: string | null;
  country: string | null;
}

export interface PublicNutritionistsResponse {
  nutritionists: PublicNutritionist[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export type PublicNutritionistLookupResult =
  | { status: "ok"; nutritionist: PublicNutritionist }
  | { status: "gone"; nutritionist: null }
  | { status: "missing"; nutritionist: null };

const DEFAULT_LIMIT = 12;

export async function getPublicNutritionists(
  params: {
    search?: string;
    specialty?: string;
    mode?: string;
    location?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PublicNutritionistsResponse> {
  const query = new URLSearchParams();

  query.set("page", String(params.page || 1));
  query.set("limit", String(params.limit || DEFAULT_LIMIT));

  if (params.search) query.set("search", params.search);
  if (params.specialty) query.set("specialty", params.specialty);
  if (params.mode) query.set("mode", params.mode);
  if (params.location) query.set("location", params.location);

  try {
    const response = await fetchApi(
      `/public/nutritionists?${query.toString()}`,
      {
        cache: "no-store",
      },
    );

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

export async function getPublicNutritionistBySlug(
  slug: string,
): Promise<PublicNutritionistLookupResult> {
  try {
    const response = await fetchApi(`/public/nutritionists/${slug}`, {
      cache: "no-store",
    });

    if (response.status === 410) {
      return { status: "gone", nutritionist: null };
    }

    if (!response.ok) {
      return { status: "missing", nutritionist: null };
    }

    return {
      status: "ok",
      nutritionist: (await response.json()) as PublicNutritionist,
    };
  } catch {
    return { status: "missing", nutritionist: null };
  }
}

export async function getAllPublicNutritionistSlugs() {
  const pageSize = 100;
  const slugs: string[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await getPublicNutritionists({ page, limit: pageSize });
    slugs.push(
      ...result.nutritionists.map((nutritionist) => nutritionist.slug),
    );
    lastPage = result.lastPage;
    page += 1;
  } while (page <= lastPage);

  return slugs;
}
