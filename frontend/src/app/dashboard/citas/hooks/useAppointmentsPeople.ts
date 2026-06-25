import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { type Patient } from "@/features/patients";
import { type PatientPortalOverview } from "@/features/patient-portal/types";
import { getAuthToken } from "@/lib/auth-token";

export function useAppointmentPatients(searchQuery: string, enabled: boolean) {
  return useQuery({
    queryKey: ["appointments", "patients", searchQuery],
    queryFn: async (): Promise<Patient[]> => {
      const token = getAuthToken();
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });

      const response = await fetchApi(`/patients?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los pacientes.");
      }

      const payload = (await response.json()) as { data?: Patient[] };
      return Array.isArray(payload?.data) ? payload.data : [];
    },
    enabled,
  });
}

export function useAppointmentPatientPortalStatus(
  patientId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["appointments", "patient-portal-status", patientId],
    queryFn: async (): Promise<string | null> => {
      if (!patientId) return null;
      const token = getAuthToken();
      const response = await fetchApi(`/patient-portals/patients/${patientId}/overview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) return null;
      const payload = (await response.json().catch(() => ({}))) as Partial<PatientPortalOverview> & {
        status?: string;
      };
      return typeof payload.status === "string" ? payload.status : null;
    },
    enabled,
  });
}
