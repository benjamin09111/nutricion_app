import { AppointmentCalendar, AppointmentEvent, AppointmentRequest, AppointmentSlot } from "@/lib/appointments";

export type WeekRule = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type WorkHoursGridDraft = Record<string, boolean[]>;

export const WEEK_DAYS = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "MiÃ©" },
  { key: "thursday", label: "Jue" },
  { key: "friday", label: "Vie" },
  { key: "saturday", label: "SÃ¡b" },
  { key: "sunday", label: "Dom" },
];

export const DEFAULT_WEEK_RULES = (): WeekRule[] =>
  WEEK_DAYS.map((day, index) => ({
    day: day.key,
    enabled: index < 5,
    start: "09:00",
    end: "18:00",
  }));

export const DAY_INDEX_BY_KEY: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

export const DAY_OF_WEEK_BY_KEY: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const HOUR_START = 8;
export const HOUR_END = 22;
export const ROW_HEIGHT = 64;

export const HOUR_BLOCKS = Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index);

export const createEmptyWorkHoursGrid = (): WorkHoursGridDraft =>
  Object.fromEntries(
    WEEK_DAYS.map((day) => [day.key, Array.from({ length: HOUR_END - HOUR_START }, () => false)]),
  ) as WorkHoursGridDraft;

export const formatHourBlockLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const parseDateSafe = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeWeekDayKey = (value: unknown) => {
  const day = normalizeText(value).toLowerCase();
  const aliases: Record<string, string> = {
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday",
    lunes: "monday",
    martes: "tuesday",
    miercoles: "wednesday",
    miércoles: "wednesday",
    jueves: "thursday",
    viernes: "friday",
    sabado: "saturday",
    sábado: "saturday",
    domingo: "sunday",
  };

  return aliases[day] || day;
};

export const normalizeWeekDayFromIndex = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.trunc(value);
    // Backend: 0=Sun, 1=Mon, ..., 6=Sat
    // UI: Mon=0, ..., Sat=5, Sun=6
    const mapping: Record<number, number> = {
      0: 6, // Sun -> Index 6
      1: 0, // Mon -> Index 0
      2: 1, // Tue -> Index 1
      3: 2, // Wed -> Index 2
      4: 3, // Thu -> Index 3
      5: 4, // Fri -> Index 4
      6: 5, // Sat -> Index 5
    };
    const index = mapping[normalized] ?? null;
    if (index === null) return "";
    return WEEK_DAYS[index]?.key || "";
  }

  const parsed = Number(normalizeText(value));
  if (!Number.isNaN(parsed)) {
    return normalizeWeekDayFromIndex(parsed);
  }

  return normalizeWeekDayKey(value);
};

export const normalizeTimeValue = (value: unknown, fallback: string) => {
  const text = normalizeText(value);
  if (!text) return fallback;
  return text.slice(0, 5);
};

export const extractAvailabilityRules = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.data,
    record.items,
    record.results,
    record.weeklyRules,
    record.rules,
    record.availabilityRules,
    record.availability_rules,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export const parseAvailabilityRuleItem = (item: unknown): WeekRule | null => {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const dayValue =
    record.day ||
    record.weekDay ||
    record.weekday ||
    record.dayOfWeek ||
    record.day_of_week ||
    record.dayOfWeekKey;
  const day = normalizeWeekDayFromIndex(dayValue);
  if (!day) return null;

  const enabled =
    typeof record.enabled === "boolean"
      ? record.enabled
      : typeof record.available === "boolean"
        ? record.available
        : typeof record.isWorking === "boolean"
          ? record.isWorking
          : typeof record.active === "boolean"
            ? record.active
            : true;

  return {
    day,
    enabled,
    start: normalizeTimeValue(
      record.start || record.from || record.begin || record.startTime || record.startTimeLocal,
      "09:00",
    ),
    end: normalizeTimeValue(
      record.end || record.to || record.finish || record.endTime || record.endTimeLocal,
      "18:00",
    ),
  };
};

export const extractCalendarCandidate = (payload: unknown): Record<string, unknown> | null => {
  const visit = (value: unknown): Record<string, unknown> | null => {
    if (!value) return null;

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }

    if (typeof value !== "object") return null;

    const record = value as Record<string, unknown>;
    if (normalizeText(record.id) || normalizeText(record.calendarId) || normalizeText(record.calendar_id)) {
      return record;
    }

    const candidates = [
      record.calendar,
      record.data,
      record.item,
      record.items,
      record.result,
      record.results,
      record.payload,
    ];

    for (const candidate of candidates) {
      const found = visit(candidate);
      if (found) return found;
    }

    for (const nested of Object.values(record)) {
      const found = visit(nested);
      if (found) return found;
    }

    return null;
  };

  return visit(payload);
};

export const normalizeAvailabilityRules = (payload: unknown): WeekRule[] => {
  const items = extractAvailabilityRules(payload);
  console.log("[appointments] normalizeAvailabilityRules raw items:", items);
  if (!items.length) {
    return [];
  }

  const parsed = items
    .map(parseAvailabilityRuleItem)
    .filter((item): item is WeekRule => item !== null);
  console.log("[appointments] normalizeAvailabilityRules parsed:", parsed);

  if (!parsed.length) {
    return [];
  }

  return parsed;
};

export const parseWeekRulesPayload = (payload: unknown): WeekRule[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return normalizeAvailabilityRules(payload);
  if (typeof payload !== "object") return [];
  return normalizeAvailabilityRules(payload);
};

export const getWeekDayIndex = (date: Date) => (date.getDay() + 6) % 7;

export const isHourWithinRule = (day: Date, hour: number, rule: WeekRule | undefined) => {
  if (!rule?.enabled) return false;
  const startHour = Number(rule.start.slice(0, 2));
  const endHour = Number(rule.end.slice(0, 2));
  const currentIndex = getWeekDayIndex(day);
  const ruleIndex = DAY_INDEX_BY_KEY[rule.day] ?? currentIndex;
  if (currentIndex !== ruleIndex) return false;
  return hour >= startHour && hour < endHour;
};

export const isDefined = <T,>(value: T | null): value is T => value !== null;

export const extractList = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.data,
    record.items,
    record.results,
    record.events,
    record.appointments,
    record.requests,
    record.slots,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export const normalizeCalendar = (payload: unknown): AppointmentCalendar | null => {
  const cal = extractCalendarCandidate(payload);
  if (!cal) return null;
  const id = normalizeText(cal.id) || normalizeText(cal.calendarId) || normalizeText(cal.calendar_id);
  if (!id) return null;
  return {
    id,
    name: normalizeText(cal.name),
    title: normalizeText(cal.title),
    timeZone: normalizeText(cal.timeZone) || normalizeText(cal.timezone),
    timezone: normalizeText(cal.timezone),
    googleCalendarConnected:
      typeof cal.googleCalendarConnected === "boolean"
        ? cal.googleCalendarConnected
        : typeof cal.googleSyncEnabled === "boolean"
          ? cal.googleSyncEnabled
          : typeof cal.isGoogleConnected === "boolean"
            ? cal.isGoogleConnected
            : undefined,
    metadata:
      cal.metadata && typeof cal.metadata === "object" && !Array.isArray(cal.metadata)
        ? (cal.metadata as Record<string, unknown>)
        : null,
  };
};

export const normalizeEvents = (payload: unknown): AppointmentEvent[] =>
  extractList(payload)
    .map((item): AppointmentEvent | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const start = normalizeText(record.start || record.startAt || record.beginAt || record.from);
      const end = normalizeText(record.end || record.endAt || record.to);
      const title =
        normalizeText(record.title) ||
        normalizeText(record.name) ||
        normalizeText(record.label) ||
        normalizeText(record.patientName) ||
        normalizeText((record.patient as Record<string, unknown> | undefined)?.fullName) ||
        normalizeText((record.patient as Record<string, unknown> | undefined)?.name) ||
        "Cita";
      if (!start) return null;
      return {
        id: normalizeText(record.id) || `${start}-${title}`,
        title,
        start,
        end,
        status: normalizeText(record.status) || "confirmed",
        patientName:
          normalizeText(record.patientName) ||
          normalizeText((record.patient as Record<string, unknown> | undefined)?.fullName) ||
          normalizeText((record.patient as Record<string, unknown> | undefined)?.name),
        notes: normalizeText(record.notes),
        color: normalizeText(record.color),
        allDay: typeof record.allDay === "boolean" ? record.allDay : false,
      };
    })
    .filter(isDefined);

export const normalizeRequests = (payload: unknown): AppointmentRequest[] =>
  extractList(payload)
    .map((item): AppointmentRequest | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const start = normalizeText(record.start || record.startAt || record.requestedAt);
      return {
        id: normalizeText(record.id) || start || `request-${Math.random().toString(36).slice(2, 8)}`,
        title:
          normalizeText(record.title) ||
          normalizeText((record.patient as Record<string, unknown> | undefined)?.fullName) ||
          normalizeText(record.patientName) ||
          "Solicitud de cita",
        patientName:
          normalizeText(record.patientName) ||
          normalizeText((record.patient as Record<string, unknown> | undefined)?.fullName) ||
          normalizeText((record.patient as Record<string, unknown> | undefined)?.name),
        start,
        end: normalizeText(record.end || record.endAt),
        requestedAt: normalizeText(record.requestedAt) || start,
        status: normalizeText(record.status) || "REQUESTED",
        notes: normalizeText(record.notes),
      };
    })
    .filter(isDefined);

export const normalizeSlots = (payload: unknown): AppointmentSlot[] =>
  extractList(payload)
    .map((item): AppointmentSlot | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const start =
        normalizeText(record.start) ||
        normalizeText(record.startAt) ||
        normalizeText(record.from) ||
        normalizeText(record.begin) ||
        normalizeText(record.startTime) ||
        normalizeText(record.startDateTime);
      const end =
        normalizeText(record.end) ||
        normalizeText(record.endAt) ||
        normalizeText(record.to) ||
        normalizeText(record.finish) ||
        normalizeText(record.endTime) ||
        normalizeText(record.endDateTime);
      const available =
        typeof record.available === "boolean"
          ? record.available
          : typeof record.isAvailable === "boolean"
            ? record.isAvailable
            : typeof record.free === "boolean"
              ? record.free
              : typeof record.isFree === "boolean"
                ? record.isFree
                : typeof record.occupied === "boolean"
                  ? !record.occupied
                  : normalizeText(record.status).toUpperCase() === "AVAILABLE";
      return {
        start,
        end,
        available,
        status: normalizeText(record.status),
        title: normalizeText(record.title),
        label: normalizeText(record.label),
        patientName: normalizeText(record.patientName),
        notes: normalizeText(record.notes),
      };
    })
    .filter(isDefined);

export const getWeekDays = (anchor: Date) => {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
};

export const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
  });

export const formatHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export const toMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

export const sameDayKey = (left: Date, right: Date) => formatDateKey(left) === formatDateKey(right);

export const createWorkHoursGridFromRules = (rules: WeekRule[]) => {
  const grid = createEmptyWorkHoursGrid();
  if (!Array.isArray(rules)) return grid;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const dayBlocks = grid[rule.day];
    if (!dayBlocks) continue;

    const startHour = Number(rule.start.slice(0, 2));
    const endHour = Number(rule.end.slice(0, 2));

    for (let hour = startHour; hour < endHour; hour += 1) {
      const index = hour - HOUR_START;
      if (index >= 0 && index < dayBlocks.length) {
        dayBlocks[index] = true;
      }
    }
  }

  return grid;
};

export const createRulesFromWorkHoursGrid = (grid: WorkHoursGridDraft): WeekRule[] => {
  const rules: WeekRule[] = [];

  for (const day of WEEK_DAYS) {
    const dayBlocks = grid[day.key] || [];
    let segmentStart: number | null = null;

    for (let index = 0; index < dayBlocks.length; index += 1) {
      const isSelected = Boolean(dayBlocks[index]);
      if (isSelected && segmentStart === null) {
        segmentStart = HOUR_START + index;
      }

      const isClosingSegment = segmentStart !== null && (!isSelected || index === dayBlocks.length - 1);
      if (isClosingSegment) {
        const segmentEnd = isSelected && index === dayBlocks.length - 1 ? HOUR_START + index + 1 : HOUR_START + index;
        if (segmentStart !== null && segmentEnd > segmentStart) {
          rules.push({
            day: day.key,
            enabled: true,
            start: formatHourBlockLabel(segmentStart),
            end: formatHourBlockLabel(segmentEnd),
          });
        }
        segmentStart = isSelected ? HOUR_START + index : null;
      }
    }
  }

  return rules;
};

export const createAppointmentDraft = () => ({
  patientId: "",
  patientName: "",
  patientEmail: "",
  notifyPatientByEmail: true,
  title: "Consulta nutricional",
  date: formatDateKey(new Date()),
  time: "09:00",
  durationMin: 30,
  notes: "",
});

export const formatTimeInput = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export const getStoredNutritionistProfile = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    const user = JSON.parse(storedUser) as Record<string, unknown> & {
      id?: string;
      fullName?: string;
      name?: string;
      email?: string;
      nutritionist?: {
        id?: string;
        fullName?: string;
        name?: string;
      } | null;
    };

    const nutritionist = user.nutritionist || null;
    const nutritionistId =
      normalizeText(nutritionist?.id) || normalizeText(user.id) || "";
    const nutritionistName =
      normalizeText(nutritionist?.fullName) ||
      normalizeText(nutritionist?.name) ||
      normalizeText(user.fullName) ||
      normalizeText(user.name) ||
      normalizeText(user.email) ||
      "Nutricionista";

    return {
      nutritionistId,
      nutritionistName,
    };
  } catch (error) {
    console.error("Error reading stored user for appointments share link", error);
    return null;
  }
};
export type TabKey = "calendar" | "upcoming" | "past" | "requests";
