import { fetchApi, getApiUrl } from "@/lib/api-base";
import { getCurrentUser } from "@/lib/current-user";

type WorkflowCreationType =
  | "DIET"
  | "RECIPE"
  | "RECETARIO"
  | "SHOPPING_LIST"
  | "DELIVERABLE"
  | "FAST_DELIVERABLE"
  | "PAUTAS";

type WorkflowProjectMode = "CLINICAL" | "GENERAL";

export interface WorkflowProject {
  id: string;
  name: string;
  description?: string | null;
  mode: WorkflowProjectMode;
  status: string;
  patientId?: string | null;
  patient?: Record<string, unknown> | null;
  activeDietCreationId?: string | null;
  activeRecipeCreationId?: string | null;
  activeCartCreationId?: string | null;
  activeDeliverableCreationId?: string | null;
  activeDietCreation?: Record<string, unknown> | null;
  activeRecipeCreation?: Record<string, unknown> | null;
  activeCartCreation?: Record<string, unknown> | null;
  activeDeliverableCreation?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export const getWorkflowApiUrl = () =>
  getApiUrl();

export const getWorkflowAuthHeaders = (
  extraHeaders: Record<string, string> = {},
) => {
  return {
    ...extraHeaders,
  };
};

export async function fetchProject(projectId: string): Promise<WorkflowProject> {
  const response = await fetchApi(`/projects/${projectId}`, {
    headers: getWorkflowAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar el proyecto");
  }

  return response.json();
}

export async function createProject(payload: Record<string, unknown>) {
  const response = await fetchApi(`/projects`, {
    method: "POST",
    headers: getWorkflowAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo crear el proyecto");
  }

  return response.json();
}

export async function updateProject(
  projectId: string,
  payload: Record<string, unknown>,
) {
  const response = await fetchApi(`/projects/${projectId}`, {
    method: "PATCH",
    headers: getWorkflowAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo actualizar el proyecto");
  }

  return response.json();
}

export async function fetchCreation(creationId: string) {
  const currentUser = getCurrentUser();
  const planKey = String(
    currentUser?.currentPlan?.key || currentUser?.currentPlan?.slug || currentUser?.plan || "",
  ).toLowerCase();
  if (planKey.includes("free") || planKey.includes("freemium") || planKey.includes("gratis")) {
    throw new Error("Importar creaciones es una característica exclusiva de los planes de pago.");
  }

  const response = await fetchApi(
    `/creations/${creationId}`,
    {
      headers: getWorkflowAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar la creación");
  }

  return response.json();
}

export async function saveCreation(payload: {
  id?: string;
  name: string;
  type: WorkflowCreationType;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
}) {
  const isUpdate = Boolean(payload.id);
  const endpoint = isUpdate ? `/creations/${payload.id}` : `/creations`;
  const method = isUpdate ? "PATCH" : "POST";

  const response = await fetchApi(endpoint, {
    method,
    headers: getWorkflowAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.message || "No se pudo guardar la creación";
    if (errorMessage.includes("límite de") || errorMessage.includes("límite")) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("show-freemium-upgrade", {
            detail: {
              description: errorMessage,
            },
          })
        );
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export function buildProjectAwarePath(path: string, projectId?: string | null) {
  if (!projectId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}project=${projectId}`;
}
