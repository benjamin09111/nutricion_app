import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { PatientsResponse } from "@/features/patients";

export type PatientTab = "Todos" | "Activos" | "Inactivos";

export type UsePatientsParams = {
  page: number;
  searchTerm: string;
  activeTab: PatientTab;
  classificationTags: string[];
  startDateFilter: string;
};

const buildPatientsQuery = ({
  page,
  searchTerm,
  activeTab,
  classificationTags,
  startDateFilter,
}: UsePatientsParams) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    ...(searchTerm && { search: searchTerm }),
    ...(activeTab !== "Todos" && { status: activeTab }),
    ...(classificationTags.length > 0 && {
      tags: classificationTags.join(","),
    }),
    ...(startDateFilter && { startDate: startDateFilter }),
  });

  return queryParams.toString();
};

async function fetchPatients(params: UsePatientsParams): Promise<PatientsResponse> {
  const token = getAuthToken();
  const response = await fetchApi(`/patients?${buildPatientsQuery(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la lista de pacientes");
  }

  return response.json();
}

async function mutatePatient(patientId: string, body: Record<string, unknown>) {
  const token = getAuthToken();
  const response = await fetchApi(`/patients/${patientId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el paciente");
  }

  return response.json();
}

async function deletePatient(patientId: string) {
  const token = getAuthToken();
  const response = await fetchApi(`/patients/${patientId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el paciente");
  }
}

export function usePatients(params: UsePatientsParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["patients", params],
    queryFn: () => fetchPatients(params),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ patientId, status }: { patientId: string; status: "Active" | "Inactive" }) =>
      mutatePatient(patientId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return {
    ...query,
    patients: query.data?.data ?? [],
    meta:
      query.data?.meta ??
      {
        total: 0,
        filteredTotal: 0,
        activeCount: 0,
        inactiveCount: 0,
        page: params.page,
        lastPage: 1,
      },
    deletePatient: deleteMutation.mutateAsync,
    togglePatientStatus: (patientId: string, status: "Active" | "Inactive") =>
      statusMutation.mutateAsync({ patientId, status }),
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,
  };
}
