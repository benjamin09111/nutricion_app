import { getAuthToken } from "@/lib/auth-token";

const APPOINTMENTS_PROXY_BASE = "/api/appointments";

const getTenantId = () =>
  process.env.NEXT_PUBLIC_TENANT_ID ||
  process.env.TENANT_ID ||
  "";

export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type AppointmentCalendar = {
  id: string;
  nutritionistId: string;
  name: string;
  title: string;
  description: string;
  timeZone: string;
  timezone?: string;
  googleCalendarConnected?: boolean;
  metadata: Record<string, unknown> | null;
};

export type AppointmentBookingLink = {
  id: string;
  calendarId: string;
  token: string;
  url: string;
  expiresAt: string | null;
  allowedUses: number | null;
  useCount: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
};

export type AppointmentSlot = {
  start: string;
  end: string;
  available: boolean;
  status: string;
  title?: string;
  label?: string;
  patientName?: string;
  notes?: string;
};

export type AppointmentEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  patientName?: string;
  notes?: string;
  color?: string;
  allDay?: boolean;
};

export type AppointmentRequest = {
  id: string;
  title: string;
  patientName?: string;
  start: string;
  end: string;
  requestedAt: string;
  status: string;
  notes?: string;
};

export type CreateBookingLinkRequest = {
  calendarId: string;
  mode?: string;
  allowedUses?: number | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
  fixedStartAt?: string;
  fixedEndAt?: string;
};

export type AppointmentsApiError = {
  message: string;
  status: number;
  requestId: string | null;
  endpoint: string;
};

export const parseAppointmentsError = (
  response: Response,
  endpoint: string,
): AppointmentsApiError => {
  const requestId =
    response.headers.get("x-request-id") ||
    response.headers.get("x-request-id".toUpperCase()) ||
    null;

  const messages: Record<number, string> = {
    401: "Sesión expirada o no autorizada. Inicia sesión nuevamente.",
    403: "No tienes permisos para esta acción.",
    404: "El recurso solicitado no existe o fue eliminado.",
    409: "Este horario ya no está disponible. Intenta con otro bloque.",
    410: "El enlace de citas ha expirado o ya fue utilizado.",
    422: "Algunos campos no son válidos. Revisa la información ingresada.",
  };

  return {
    message:
      messages[response.status] ||
      "Ocurrió un error inesperado en el servicio de citas.",
    status: response.status,
    requestId,
    endpoint,
  };
};

const getAppointmentsAuthMode = () =>
  process.env.NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE || "jwt";

const buildHeaders = (init?: RequestInit) => {
  const headers = new Headers(init?.headers || {});
  const authMode = getAppointmentsAuthMode();
  const token = getAuthToken();

  if (authMode === "jwt" && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const tenantId = getTenantId();
  if (tenantId && !headers.has("X-Tenant-ID")) {
    headers.set("X-Tenant-ID", tenantId);
  }

  return headers;
};

export async function fetchAppointmentsApi(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${APPOINTMENTS_PROXY_BASE}${path}`, {
    ...init,
    headers: buildHeaders(init),
    cache: "no-store",
  });
}

export async function fetchAppointmentsJson<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetchAppointmentsApi(path, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "El servicio de citas rechazó la autenticación. Si este módulo no requiere JWT, deja APPOINTMENTS_AUTH_MODE=public. Si sí lo requiere, revisa tu sesión o configura el modo jwt.",
      );
    }

    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? ((payload as { message: string }).message as string)
        : "No se pudo completar la operación con el servicio de citas.";
    throw new Error(message);
  }

  return payload as T;
}

export const getAppointmentDisplayName = (value: AppointmentCalendar | null) =>
  (value?.name || value?.title || "Agenda de citas").trim();

export async function createBookingLink(payload: CreateBookingLinkRequest) {
  const { calendarId, ...body } = payload;
  return fetchAppointmentsJson<AppointmentBookingLink>(
    `/calendars/${calendarId}/booking-links`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function fetchBookingLink(token: string) {
  return fetchAppointmentsJson<AppointmentBookingLink>(`/booking-links/${token}`);
}

export async function createBookingLinkRequest(
  token: string,
  payload: Record<string, unknown>,
) {
  return fetchAppointmentsJson<unknown>(`/booking-links/${token}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Request operations
export async function acceptRequest(requestId: string) {
  return fetchAppointmentsJson<unknown>(`/requests/${requestId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function rejectRequest(requestId: string) {
  return fetchAppointmentsJson<unknown>(`/requests/${requestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function cancelRequest(requestId: string) {
  return fetchAppointmentsJson<unknown>(`/requests/${requestId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function fetchCalendarRequests(
  calendarId: string,
  status = "REQUESTED",
) {
  return fetchAppointmentsJson<unknown[]>(
    `/calendars/${calendarId}/requests?status=${status}`,
  );
}

// Google Calendar integration
export async function connectGoogleCalendar(calendarId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/google/connect`, {
    method: "POST",
  });
}

export async function getGoogleStatus(calendarId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/google/status`);
}

export async function resyncGoogleCalendar(calendarId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/google/resync`, {
    method: "POST",
  });
}

export async function updateGoogleIntegration(
  calendarId: string,
  payload: Record<string, unknown>,
) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/google/integration`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getGoogleDiagnostics(calendarId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/google/diagnostics`);
}

// Appointments
export async function createAppointment(
  calendarId: string,
  payload: Record<string, unknown>,
) {
  return fetchAppointmentsJson<unknown>("/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, calendarId }),
  });
}

export async function updateAppointment(
  appointmentId: string,
  payload: Record<string, unknown>,
) {
  return fetchAppointmentsJson<unknown>(`/appointments/${appointmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function cancelAppointment(appointmentId: string) {
  return fetchAppointmentsJson<unknown>(`/appointments/${appointmentId}`, {
    method: "DELETE",
  });
}

export async function listAppointments(params?: {
  status?: string;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  return fetchAppointmentsJson<unknown[]>(
    `/appointments${qs ? `?${qs}` : ""}`,
  );
}

// Requests (direct, without booking link)
export async function createCalendarRequest(
  calendarId: string,
  payload: Record<string, unknown>,
) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Calendar views
export async function getWeekView(calendarId: string, weekStart: string) {
  return fetchAppointmentsJson<unknown>(
    `/calendars/${calendarId}/view/week?weekStart=${weekStart}`,
  );
}

export async function getDayView(calendarId: string, date: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/view/day?date=${date}`);
}

// Availability
export async function updateAvailabilityRules(
  calendarId: string,
  payload: { rules?: unknown[]; weeklyRules?: unknown[] },
) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/availability/rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchAvailabilityRules(calendarId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/availability/rules`);
}

export async function createAvailabilityBlock(
  calendarId: string,
  payload: { title?: string; startAt: string; endAt: string },
) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}/availability/blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchAvailabilityBlocks(
  calendarId: string,
  from: string,
  to: string,
) {
  return fetchAppointmentsJson<unknown[]>(
    `/calendars/${calendarId}/availability/blocks?from=${from}&to=${to}`,
  );
}

export async function deleteAvailabilityBlock(blockId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/availability/blocks/${blockId}`, {
    method: "DELETE",
  });
}

// Calendar management
export async function fetchCalendar(calendarId: string) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}`);
}

export async function updateCalendar(
  calendarId: string,
  payload: Record<string, unknown>,
) {
  return fetchAppointmentsJson<unknown>(`/calendars/${calendarId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Slots
export async function fetchCalendarSlots(
  calendarId: string,
  from: string,
  to: string,
  durationMin = 30,
) {
  return fetchAppointmentsJson<unknown[]>(
    `/calendars/${calendarId}/slots?from=${from}&to=${to}&durationMin=${durationMin}`,
  );
}
