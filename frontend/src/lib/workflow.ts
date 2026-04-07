import Cookies from "js-cookie";
import { fetchApi, getApiUrl } from "@/lib/api-base";

type WorkflowCreationType =
  | "DIET"
  | "RECIPE"
  | "SHOPPING_LIST"
  | "DELIVERABLE";

type WorkflowProjectMode = "CLINICAL" | "GENERAL";

export interface WorkflowProject {
  id: string;
  name: string;
  description?: string | null;
  mode: WorkflowProjectMode;
  status: string;
  patientId?: string | null;
  patient?: any;
  activeDietCreationId?: string | null;
  activeRecipeCreationId?: string | null;
  activeCartCreationId?: string | null;
  activeDeliverableCreationId?: string | null;
  activeDietCreation?: any;
  activeRecipeCreation?: any;
  activeCartCreation?: any;
  activeDeliverableCreation?: any;
  metadata?: Record<string, unknown> | null;
}

export const getWorkflowApiUrl = () =>
  getApiUrl();

export const getWorkflowAuthHeaders = (
  extraHeaders: Record<string, string> = {},
) => {
  const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
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
  name: string;
  type: WorkflowCreationType;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
}) {
  const response = await fetchApi(`/creations`, {
    method: "POST",
    headers: getWorkflowAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo guardar la creación");
  }

  return response.json();
}

export function buildProjectAwarePath(path: string, projectId?: string | null) {
  if (!projectId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}project=${projectId}`;
}
