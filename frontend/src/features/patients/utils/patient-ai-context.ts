import { fetchApi } from "@/lib/api-base";

export async function fetchPatientAiContext(patientId: string, token: string) {
  const response = await fetchApi(`/patients/${patientId}/ai-context`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      (errorBody as any)?.message || "No se pudo obtener el contexto IA del paciente",
    );
  }

  return response.json();
}
