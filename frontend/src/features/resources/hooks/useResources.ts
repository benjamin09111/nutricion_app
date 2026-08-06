import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";

export interface ResourceItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sources?: string;
  nutritionistId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isMine?: boolean;
  isPublic?: boolean;
  format?: string;
  fileUrl?: string;
}

async function fetchResourcesApi(): Promise<ResourceItem[]> {
  const token = getAuthToken();
  const res = await fetchApi("/resources", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar los recursos");
  }

  const userData: ResourceItem[] = await res.json();
  if (userData && userData.length > 0) {
    const seenMap = new Map<string, ResourceItem>();
    for (const r of userData) {
      const key = r.id || `${r.title.toLowerCase().trim()}_${r.nutritionistId || "null"}`;
      if (!seenMap.has(key)) {
        seenMap.set(key, r);
      }
    }
    return Array.from(seenMap.values());
  }

  return [];
}

async function deleteResourceApi(id: string) {
  const token = getAuthToken();
  const res = await fetchApi(`/resources/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error("No se pudo eliminar el recurso");
  }
}

export function useResources() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResourcesApi,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResourceApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  return {
    ...query,
    resources: query.data ?? [],
    deleteResource: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
