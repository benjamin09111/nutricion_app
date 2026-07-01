import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-base';
import { getAuthToken } from '@/lib/auth-token';
import type {
  IntakeLinkResponse,
  IntakeSubmissionsResponse,
  IntakeSubmissionStats,
  PatientIntakeSubmission,
} from '../types';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

async function fetchMyIntakeLink(): Promise<IntakeLinkResponse> {
  const token = getAuthToken();
  const response = await fetchApi('/patient-intake/link', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error('Error al obtener link');
  return response.json();
}

async function createOrGetMyIntakeLink(): Promise<any> {
  const token = getAuthToken();
  const response = await fetchApi('/patient-intake/link', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Error al crear link');
  return response.json();
}

async function regenerateMyIntakeLink(): Promise<any> {
  const token = getAuthToken();
  const response = await fetchApi('/patient-intake/link/regenerate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Error al regenerar link');
  return response.json();
}

async function setIntakeLinkStatus(status: 'ACTIVE' | 'DISABLED'): Promise<any> {
  const token = getAuthToken();
  const response = await fetchApi('/patient-intake/link/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Error al actualizar estado del link');
  return response.json();
}

async function fetchSubmissions(params: {
  status?: SubmissionStatus | 'TODOS';
  page?: number;
  limit?: number;
}): Promise<IntakeSubmissionsResponse> {
  const token = getAuthToken();
  const queryParams = new URLSearchParams({
    ...(params.status && params.status !== 'TODOS' && { status: params.status }),
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  const response = await fetchApi(
    `/patient-intake/submissions?${queryParams.toString()}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (!response.ok) throw new Error('Error al obtener solicitudes');
  return response.json();
}

async function fetchSubmissionStats(): Promise<IntakeSubmissionStats> {
  const token = getAuthToken();
  const response = await fetchApi('/patient-intake/submissions/stats', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error('Error al obtener estadísticas');
  return response.json();
}

async function fetchSubmission(id: string): Promise<PatientIntakeSubmission> {
  const token = getAuthToken();
  const response = await fetchApi(`/patient-intake/submissions/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error('Error al obtener solicitud');
  return response.json();
}

async function reviewSubmission(
  id: string,
  action: 'APPROVED' | 'REJECTED',
  rejectReason?: string,
): Promise<PatientIntakeSubmission> {
  const token = getAuthToken();
  const response = await fetchApi(`/patient-intake/submissions/${id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, rejectReason }),
  });
  if (!response.ok) throw new Error('Error al revisar solicitud');
  return response.json();
}

export function useIntakeLink() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['intake-link'],
    queryFn: fetchMyIntakeLink,
  });

  const createMutation = useMutation({
    mutationFn: createOrGetMyIntakeLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-link'] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateMyIntakeLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-link'] });
      queryClient.invalidateQueries({ queryKey: ['intake-submissions'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: setIntakeLinkStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-link'] });
    },
  });

  return {
    ...query,
    createLink: createMutation.mutateAsync,
    regenerateLink: regenerateMutation.mutateAsync,
    setStatus: statusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    isSettingStatus: statusMutation.isPending,
  };
}

export function useIntakeSubmissions(params: {
  status?: SubmissionStatus | 'TODOS';
  page?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['intake-submissions', params],
    queryFn: () => fetchSubmissions(params),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      rejectReason,
    }: {
      id: string;
      action: 'APPROVED' | 'REJECTED';
      rejectReason?: string;
    }) => reviewSubmission(id, action, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['intake-submission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  return {
    ...query,
    reviewSubmission: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
  };
}

export function useIntakeSubmissionStats() {
  return useQuery({
    queryKey: ['intake-submission-stats'],
    queryFn: fetchSubmissionStats,
  });
}

export function useIntakeSubmission(id: string) {
  return useQuery({
    queryKey: ['intake-submission', id],
    queryFn: () => fetchSubmission(id),
    enabled: !!id,
  });
}
