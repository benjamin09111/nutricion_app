import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { ConsultationsResponse } from "../types";

export type UseConsultationsParams = {
  page: number;
  searchTerm?: string;
  patientId?: string | null;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
};

const buildConsultationsQuery = ({
  page,
  searchTerm,
  patientId,
  dateFrom,
  dateTo,
  type = "CLINICAL",
}: UseConsultationsParams) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    type,
    ...(searchTerm && { search: searchTerm }),
    ...(patientId && { patientId }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  });

  return queryParams.toString();
};

async function fetchConsultations(params: UseConsultationsParams): Promise<ConsultationsResponse> {
  const token = getAuthToken();
  const response = await fetchApi(`/consultations?${buildConsultationsQuery(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la lista de consultas");
  }

  return response.json();
}

async function deleteConsultation(id: string) {
  const token = getAuthToken();
  const response = await fetchApi(`/consultations/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar la consulta");
  }
}

export function useConsultations(params: UseConsultationsParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["consultations", params],
    queryFn: () => fetchConsultations(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConsultation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });

  return {
    ...query,
    consultations: query.data?.data ?? [],
    meta: query.data?.meta ?? { total: 0, page: params.page, lastPage: 1 },
    deleteConsultation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
