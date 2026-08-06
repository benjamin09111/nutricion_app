import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { Creation, CreationType } from "../types";

export const mapBackendTypeToFrontend = (type: string): CreationType => {
  switch (type) {
    case "DIET":
      return CreationType.DIET;
    case "SHOPPING_LIST":
      return CreationType.SHOPPING_LIST;
    case "RECIPE":
      return CreationType.RECIPE;
    case "FAST_DELIVERABLE":
      return CreationType.FAST_DELIVERABLE;
    case "PAUTAS":
      return CreationType.PAUTAS;
    case "SCREENING_TEST":
      return CreationType.SCREENING_TEST;
    default:
      return CreationType.OTHER;
  }
};

const formatCreationTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Santiago",
  });
};

export function mapRawCreationToFrontend(item: any): Creation {
  const contentConstraints = Array.isArray(item.content?.activeConstraints)
    ? item.content.activeConstraints
    : [];
  const allFilterTags = Array.from(
    new Set([...(item.tags || []), ...contentConstraints]),
  );

  return {
    id: item.id,
    name: item.name,
    type: mapBackendTypeToFrontend(item.type),
    createdAt: formatCreationTimestamp(item.createdAt),
    size: "1.2 MB",
    format: "PDF",
    tags: item.tags || [],
    filterTags: allFilterTags,
    patientName: item.patient?.name || item.metadata?.patientName || null,
  };
}

async function fetchCreations(): Promise<Creation[]> {
  const token = getAuthToken();
  const response = await fetchApi("/creations", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar las creaciones");
  }

  const data = await response.json();
  return data.map(mapRawCreationToFrontend);
}

async function deleteCreation(id: string) {
  const token = getAuthToken();
  const response = await fetchApi(`/creations/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar la creación");
  }
}

export function useCreations(initialData?: Creation[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleInvalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["creations"] });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("creation-saved", handleInvalidate);
      window.addEventListener("membership-usage-updated", handleInvalidate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("creation-saved", handleInvalidate);
        window.removeEventListener("membership-usage-updated", handleInvalidate);
      }
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["creations"],
    queryFn: fetchCreations,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCreation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["creations"] });
    },
  });

  return {
    ...query,
    creations: query.data ?? [],
    deleteCreation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
