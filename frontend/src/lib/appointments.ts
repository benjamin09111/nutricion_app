import { getAuthToken } from "@/lib/auth-token";

export const APPOINTMENTS_PROXY_BASE = "/api/appointments";

const getAppointmentsAuthMode = () =>
  (
    process.env.NEXT_PUBLIC_APPOINTMENTS_AUTH_MODE ||
    process.env.APPOINTMENTS_AUTH_MODE ||
    "public"
  ).toLowerCase();

export type AppointmentCalendar = {
  id: string;
  name?: string | null;
  title?: string | null;
  timeZone?: string | null;
  timezone?: string | null;
  googleCalendarConnected?: boolean;
  googleSyncEnabled?: boolean;
  isGoogleConnected?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type AppointmentSlot = {
  start?: string;
  end?: string;
  startAt?: string;
  endAt?: string;
  available?: boolean;
  status?: string;
  title?: string;
  label?: string;
  patientName?: string;
  patient?: { fullName?: string | null; name?: string | null } | null;
  notes?: string | null;
};

export type AppointmentEvent = {
  id?: string;
  title?: string;
  name?: string;
  label?: string;
  start?: string;
  startAt?: string;
  end?: string;
  endAt?: string;
  status?: string;
  patientName?: string;
  patient?: { fullName?: string | null; name?: string | null } | null;
  notes?: string | null;
  color?: string;
  allDay?: boolean;
};

export type AppointmentRequest = {
  id?: string;
  title?: string;
  patientName?: string;
  patient?: { fullName?: string | null; name?: string | null } | null;
  start?: string;
  startAt?: string;
  end?: string;
  endAt?: string;
  requestedAt?: string;
  status?: string;
  notes?: string | null;
};
export type AppointmentBookingLink = {
  token?: string;
  url?: string;
  calendarId?: string;
  nutritionistId?: string;
  nutritionistName?: string;
  title?: string;
  description?: string;
  timeZone?: string;
  timezone?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown> | null;
};

export type CreateBookingLinkRequest = {
  calendarId: string;
  nutritionistId?: string;
  nutritionistName?: string;
  title?: string;
  description?: string;
  timeZone?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
};

const buildHeaders = (init?: RequestInit) => {
  const headers = new Headers(init?.headers || {});
  const authMode = getAppointmentsAuthMode();
  const token = getAuthToken();

  if (authMode === "jwt" && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
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
  return fetchAppointmentsJson<AppointmentBookingLink>(`/calendars/${payload.calendarId}/booking-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchBookingLink(token: string) {
  return fetchAppointmentsJson<AppointmentBookingLink>(`/booking-links/${token}`);
}

export async function createBookingLinkRequest(token: string, payload: Record<string, unknown>) {
  return fetchAppointmentsJson<unknown>(`/booking-links/${token}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
