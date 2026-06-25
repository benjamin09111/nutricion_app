import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";

export interface Nutritionist {
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
}

export interface PublicNutritionistsResponse {
  nutritionists: Nutritionist[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export function usePublicNutritionists(params: {
  search: string;
  mode: string;
  location: string;
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: ["public-nutritionists", params],
    queryFn: async (): Promise<PublicNutritionistsResponse> => {
      const query = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      });

      if (params.search) query.set("search", params.search);
      if (params.mode) query.set("mode", params.mode);
      if (params.location) query.set("location", params.location);

      const response = await fetchApi(`/public/nutritionists?${query.toString()}`);
      if (!response.ok) {
        throw new Error("No se pudo cargar el directorio");
      }

      return response.json();
    },
    placeholderData: keepPreviousData,
  });
}
