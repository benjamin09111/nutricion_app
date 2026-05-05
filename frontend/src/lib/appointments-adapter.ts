// UI adapter types for appointments module
// Normalizes backend DTOs into a single contract for frontend consumption

export type UiCalendar = {
  id: string;
  name: string;
  timeZone: string;
  googleConnected: boolean;
  googleSyncEnabled: boolean;
  metadata: Record<string, unknown> | null;
};

export type UiSlot = {
  start: string;
  end: string;
  available: boolean;
  status: string | null;
  label: string | null;
  notes: string | null;
};

export type UiAppointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
  color: string | null;
  allDay: boolean;
  calendarId: string;
};

export type UiRequest = {
  id: string;
  title: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  message: string | null;
  start: string;
  end: string;
  requestedAt: string;
  status: string;
  calendarId: string;
};

export type UiScheduleRule = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type UiBlock = {
  id: string;
  title: string | null;
  start: string;
  end: string;
  calendarId: string;
};

export type UiGoogleStatus = {
  connected: boolean;
  syncStatus: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  watchExpiresAt: string | null;
};

export type UiBookingLink = {
  token: string;
  url: string;
  calendarId: string;
  nutritionistName: string;
  title: string | null;
  description: string | null;
  timeZone: string;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
};

export type UiExternalBusy = {
  start: string;
  end: string;
  title: string | null;
  source: "google" | "external";
};

export type UiWeekView = {
  appointments: UiAppointment[];
  requests: UiRequest[];
  blocks: UiBlock[];
  externalBusy: UiExternalBusy[];
  weekStart: string;
  weekEnd: string;
  timeZone: string;
};

// Normalizers

type AnyObj = Record<string, unknown>;

const pickString = (obj: AnyObj, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const pickBool = (obj: AnyObj, ...keys: string[]): boolean => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
  }
  return false;
};

export function normalizeCalendar(raw: unknown): UiCalendar | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const id = pickString(obj, "id");
  if (!id) return null;

  return {
    id,
    name: pickString(obj, "name", "title") || "Agenda de citas",
    timeZone: pickString(obj, "timeZone", "timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone,
    googleConnected: pickBool(obj, "googleCalendarConnected", "googleSyncEnabled", "isGoogleConnected", "googleConnected"),
    googleSyncEnabled: pickBool(obj, "googleSyncEnabled", "googleCalendarConnected"),
    metadata: (obj.metadata as Record<string, unknown>) || null,
  };
}

export function normalizeSlot(raw: unknown): UiSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const start = pickString(obj, "startAt", "start");
  const end = pickString(obj, "endAt", "end");
  if (!start || !end) return null;

  return {
    start,
    end,
    available: obj.available !== false,
    status: pickString(obj, "status"),
    label: pickString(obj, "label", "title"),
    notes: pickString(obj, "notes"),
  };
}

export function normalizeAppointment(raw: unknown): UiAppointment | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const id = pickString(obj, "id");
  const start = pickString(obj, "startAt", "start");
  const end = pickString(obj, "endAt", "end");
  if (!id || !start || !end) return null;

  const patientObj = obj.patient as AnyObj | undefined;

  return {
    id,
    title: pickString(obj, "title", "name", "label") || "Cita",
    start,
    end,
    status: pickString(obj, "status") || "confirmed",
    guestName: pickString(obj, "guestName", "patientName") || patientObj?.fullName as string || patientObj?.name as string || null,
    guestEmail: pickString(obj, "guestEmail", "patientEmail") || null,
    guestPhone: pickString(obj, "guestPhone", "patientPhone") || null,
    notes: pickString(obj, "notes", "description", "message"),
    color: pickString(obj, "color"),
    allDay: obj.allDay === true,
    calendarId: pickString(obj, "calendarId") || "",
  };
}

export function normalizeRequest(raw: unknown): UiRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const id = pickString(obj, "id");
  if (!id) return null;

  const patientObj = obj.patient as AnyObj | undefined;

  return {
    id,
    title: pickString(obj, "title", "message", "reason", "description") || "Solicitud de cita",
    guestName: pickString(obj, "guestName", "patientName", "fullName", "name") || patientObj?.fullName as string || patientObj?.name as string || "Sin nombre",
    guestEmail: pickString(obj, "guestEmail", "patientEmail", "email") || "",
    guestPhone: pickString(obj, "guestPhone", "patientPhone", "phone"),
    message: pickString(obj, "message", "notes", "description", "reason"),
    start: pickString(obj, "startAt", "start") || "",
    end: pickString(obj, "endAt", "end") || "",
    requestedAt: pickString(obj, "requestedAt", "createdAt") || "",
    status: pickString(obj, "status") || "REQUESTED",
    calendarId: pickString(obj, "calendarId") || "",
  };
}

export function normalizeScheduleRule(raw: unknown): UiScheduleRule | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const day = pickString(obj, "day", "dayOfWeek");
  if (!day) return null;

  return {
    day,
    enabled: obj.enabled !== false,
    start: pickString(obj, "start", "startTime") || "09:00",
    end: pickString(obj, "end", "endTime") || "18:00",
  };
}

export function normalizeBlock(raw: unknown): UiBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const id = pickString(obj, "id");
  const start = pickString(obj, "startAt", "start");
  const end = pickString(obj, "endAt", "end");
  if (!id || !start || !end) return null;

  return {
    id,
    title: pickString(obj, "title", "label", "name"),
    start,
    end,
    calendarId: pickString(obj, "calendarId") || "",
  };
}

export function normalizeGoogleStatus(raw: unknown): UiGoogleStatus {
  if (!raw || typeof raw !== "object") return { connected: false, syncStatus: null, lastSyncedAt: null, lastSyncError: null, watchExpiresAt: null };
  const obj = raw as AnyObj;

  return {
    connected: pickBool(obj, "connected", "isConnected", "googleConnected"),
    syncStatus: pickString(obj, "syncStatus", "status"),
    lastSyncedAt: pickString(obj, "lastSyncedAt", "lastSync"),
    lastSyncError: pickString(obj, "lastSyncError", "lastError"),
    watchExpiresAt: pickString(obj, "watchExpiresAt", "watchExpiry"),
  };
}

export function normalizeExternalBusy(raw: unknown): UiExternalBusy | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const start = pickString(obj, "startAt", "start");
  const end = pickString(obj, "endAt", "end");
  if (!start || !end) return null;

  return {
    start,
    end,
    title: pickString(obj, "title", "label", "summary"),
    source: (pickString(obj, "source") as UiExternalBusy["source"]) || "external",
  };
}

export function normalizeBookingLink(raw: unknown): UiBookingLink | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;
  const token = pickString(obj, "token");
  if (!token) return null;

  return {
    token,
    url: pickString(obj, "url") || "",
    calendarId: pickString(obj, "calendarId") || "",
    nutritionistName: pickString(obj, "nutritionistName", "nutritionist_name") || "",
    title: pickString(obj, "title"),
    description: pickString(obj, "description"),
    timeZone: pickString(obj, "timeZone", "timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone,
    expiresAt: pickString(obj, "expiresAt"),
    metadata: (obj.metadata as Record<string, unknown>) || null,
  };
}

export function normalizeWeekView(raw: unknown, weekStart: string, weekEnd: string, timeZone: string): UiWeekView {
  const view: UiWeekView = {
    appointments: [],
    requests: [],
    blocks: [],
    externalBusy: [],
    weekStart,
    weekEnd,
    timeZone,
  };

  if (!raw || typeof raw !== "object") return view;
  const obj = raw as AnyObj;

  const appointments = Array.isArray(obj.appointments) ? obj.appointments : Array.isArray(obj.events) ? obj.events : [];
  const requests = Array.isArray(obj.requests) ? obj.requests : [];
  const blocks = Array.isArray(obj.blocks) ? obj.blocks : [];
  const externalBusy = Array.isArray(obj.externalBusy) ? obj.externalBusy : [];

  view.appointments = appointments.map(normalizeAppointment).filter((a): a is UiAppointment => a !== null);
  view.requests = requests.map(normalizeRequest).filter((r): r is UiRequest => r !== null);
  view.blocks = blocks.map(normalizeBlock).filter((b): b is UiBlock => b !== null);
  view.externalBusy = externalBusy.map(normalizeExternalBusy).filter((e): e is UiExternalBusy => e !== null);

  return view;
}
