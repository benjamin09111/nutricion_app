import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";

export interface TagItem {
  id: string;
  name: string;
  nutritionistId?: string | null;
  [key: string]: any;
}

export interface MetricItem {
  id: string;
  name: string;
  unit: string;
  key: string;
  icon?: string;
  color?: string;
  nutritionistId?: string | null;
  [key: string]: any;
}

async function fetchTagsApi(): Promise<TagItem[]> {
  const token = getAuthToken();
  const res = await fetchApi("/tags", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("No se pudieron cargar los tags");
  return res.json();
}

async function fetchMetricsApi(): Promise<MetricItem[]> {
  const token = getAuthToken();
  const res = await fetchApi("/metrics", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("No se pudieron cargar las métricas");
  return res.json();
}

async function createTagApi(name: string): Promise<TagItem> {
  const token = getAuthToken();
  const res = await fetchApi("/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("No se pudo crear la etiqueta");
  return res.json();
}

async function deleteTagApi(tagName: string) {
  const token = getAuthToken();
  const res = await fetchApi(`/tags/${encodeURIComponent(tagName)}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("No se pudo eliminar la etiqueta");
}

async function createMetricApi(metric: { name: string; unit: string; key: string; icon?: string; color?: string }) {
  const token = getAuthToken();
  const res = await fetchApi("/metrics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(metric),
  });
  if (!res.ok) throw new Error("No se pudo crear la métrica");
  return res.json();
}

async function deleteMetricApi(metricId: string) {
  const token = getAuthToken();
  const res = await fetchApi(`/metrics/${metricId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("No se pudo eliminar la métrica");
}

export function useDetails() {
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTagsApi,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetricsApi,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const createTagMutation = useMutation({
    mutationFn: createTagApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTagApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const createMetricMutation = useMutation({
    mutationFn: createMetricApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  const deleteMetricMutation = useMutation({
    mutationFn: deleteMetricApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  return {
    tags: tagsQuery.data ?? [],
    isTagsLoading: tagsQuery.isLoading,
    metrics: metricsQuery.data ?? [],
    isMetricsLoading: metricsQuery.isLoading,
    createTag: createTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    createMetric: createMetricMutation.mutateAsync,
    deleteMetric: deleteMetricMutation.mutateAsync,
  };
}
