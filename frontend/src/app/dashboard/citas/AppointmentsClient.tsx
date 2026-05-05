"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  ClipboardCopy,
  Share2,
  Loader2,
  Plus,
  RefreshCcw,
  Settings2,
  Link2,
  AlarmClock,
  BadgeInfo,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
import { type Patient, type PatientsResponse } from "@/features/patients";
import {
  AppointmentCalendar,
  AppointmentEvent,
  createBookingLink,
  AppointmentRequest,
  AppointmentSlot,
  fetchAppointmentsApi,
  fetchAppointmentsJson,
  getAppointmentDisplayName,
} from "@/lib/appointments";

type TabKey = "calendar" | "upcoming" | "past" | "requests";
type WeekRule = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

type WorkHoursGridDraft = Record<string, boolean[]>;

type AvailabilityRulesResponse =
  | {
    weeklyRules?: unknown;
    rules?: unknown;
    data?: unknown;
    timeZone?: string;
    timezone?: string;
  }
  | Array<unknown>;

const WEEK_DAYS = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "Mié" },
  { key: "thursday", label: "Jue" },
  { key: "friday", label: "Vie" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
];

const DEFAULT_WEEK_RULES = (): WeekRule[] =>
  WEEK_DAYS.map((day, index) => ({
    day: day.key,
    enabled: index < 5,
    start: "09:00",
    end: "18:00",
  }));

const DAY_INDEX_BY_KEY: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_OF_WEEK_BY_KEY: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const HOUR_START = 8;
const HOUR_END = 20;
const ROW_HEIGHT = 64;

const HOUR_BLOCKS = Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index);

const createEmptyWorkHoursGrid = (): WorkHoursGridDraft =>
  Object.fromEntries(
    WEEK_DAYS.map((day) => [day.key, Array.from({ length: HOUR_END - HOUR_START }, () => false)]),
  ) as WorkHoursGridDraft;

const formatHourBlockLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const parseDateSafe = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeWeekDayKey = (value: unknown) => {
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

const normalizeWeekDayFromIndex = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.trunc(value);
    const index =
      normalized === 7 ? 0 : normalized >= 0 && normalized <= 6 ? normalized : normalized - 1 >= 0 && normalized - 1 <= 6 ? normalized - 1 : null;
    if (index === null) return "";
    return WEEK_DAYS[index]?.key || "";
  }

  const parsed = Number(normalizeText(value));
  if (!Number.isNaN(parsed)) {
    return normalizeWeekDayFromIndex(parsed);
  }

  return normalizeWeekDayKey(value);
};

const normalizeTimeValue = (value: unknown, fallback: string) => {
  const text = normalizeText(value);
  if (!text) return fallback;
  return text.slice(0, 5);
};

const extractAvailabilityRules = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.results, record.weeklyRules, record.rules];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const parseAvailabilityRuleItem = (item: unknown): WeekRule | null => {
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
    start: normalizeTimeValue(record.start || record.from || record.begin || record.startTime, "09:00"),
    end: normalizeTimeValue(record.end || record.to || record.finish || record.endTime, "18:00"),
  };
};

const extractCalendarCandidate = (payload: unknown): Record<string, unknown> | null => {
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

const normalizeAvailabilityRules = (payload: unknown): WeekRule[] => {
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

const parseWeekRulesPayload = (payload: unknown): WeekRule[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return normalizeAvailabilityRules(payload);
  if (typeof payload !== "object") return [];
  return normalizeAvailabilityRules(payload);
};

const getWeekDayIndex = (date: Date) => (date.getDay() + 6) % 7;

const isHourWithinRule = (day: Date, hour: number, rule: WeekRule | undefined) => {
  if (!rule?.enabled) return false;
  const startHour = Number(rule.start.slice(0, 2));
  const endHour = Number(rule.end.slice(0, 2));
  const currentIndex = getWeekDayIndex(day);
  const ruleIndex = DAY_INDEX_BY_KEY[rule.day] ?? currentIndex;
  if (currentIndex !== ruleIndex) return false;
  return hour >= startHour && hour < endHour;
};

const isDefined = <T,>(value: T | null): value is T => value !== null;

const extractList = (payload: unknown) => {
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

const normalizeCalendar = (payload: unknown): AppointmentCalendar | null => {
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

const normalizeEvents = (payload: unknown): AppointmentEvent[] =>
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

const normalizeRequests = (payload: unknown): AppointmentRequest[] =>
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

const normalizeSlots = (payload: unknown): AppointmentSlot[] =>
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

const getWeekDays = (anchor: Date) => {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
};

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
  });

const formatHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const toMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

const sameDayKey = (left: Date, right: Date) => formatDateKey(left) === formatDateKey(right);

const createWorkHoursGridFromRules = (rules: WeekRule[]) => {
  const grid = createEmptyWorkHoursGrid();

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

const createRulesFromWorkHoursGrid = (grid: WorkHoursGridDraft): WeekRule[] => {
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

const createAppointmentDraft = () => ({
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

const formatTimeInput = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const getStoredNutritionistProfile = () => {
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

const TAB_ITEMS: Array<{ key: TabKey; label: string; description: string }> = [
  { key: "calendar", label: "Calendario", description: "Volver a la agenda." },
  { key: "upcoming", label: "Próximas citas", description: "Sesiones agendadas por venir." },
  { key: "past", label: "Citas pasadas", description: "Historial reciente de sesiones." },
  { key: "requests", label: "Peticiones de cita", description: "Solicitudes pendientes por revisar." },
];

export default function AppointmentsClient() {
  const [calendar, setCalendar] = useState<AppointmentCalendar | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [isEditingWorkHours, setIsEditingWorkHours] = useState(false);
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);
  const [createDraft, setCreateDraft] = useState(createAppointmentDraft());
  const [workHoursDraft, setWorkHoursDraft] = useState<WeekRule[]>(DEFAULT_WEEK_RULES);
  const [workHoursGridDraft, setWorkHoursGridDraft] = useState<WorkHoursGridDraft>(createEmptyWorkHoursGrid());
  const [availabilitySource, setAvailabilitySource] = useState<"service" | "default">("default");
  const [shareLinkUrl, setShareLinkUrl] = useState("");
  const [shareLinkToken, setShareLinkToken] = useState("");
  const [shareLinkNutritionistName, setShareLinkNutritionistName] = useState("");
  const [patientCandidates, setPatientCandidates] = useState<Patient[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const calendarSectionRef = useRef<HTMLDivElement | null>(null);

  const calendarId = calendar?.id || null;
  const calendarTimeZone =
    calendar?.timeZone || calendar?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const currentWeekStart = weekDays[0];
  const currentWeekEnd = weekDays[6];

  const upcomingEvents = useMemo(
    () =>
      events.filter((event) => {
        const start = parseDateSafe(event.start);
        return start ? start.getTime() >= Date.now() && event.status !== "cancelled" : false;
      }),
    [events],
  );

  const pastEvents = useMemo(
    () =>
      events.filter((event) => {
        const end = parseDateSafe(event.end || event.start);
        return end ? end.getTime() < Date.now() : false;
      }),
    [events],
  );

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.available !== false),
    [slots],
  );

  const occupiedSlots = useMemo(
    () => slots.filter((slot) => slot.available === false || normalizeText(slot.status).toUpperCase() === "BUSY"),
    [slots],
  );

  const patientCandidateOptions = useMemo(
    () =>
      patientCandidates.map((patient) => ({
        value: patient.id,
        label: `${patient.fullName}${patient.email ? ` · ${patient.email}` : ""}`,
      })),
    [patientCandidates],
  );

  const loadPatientCandidates = async (query = "") => {
    setIsLoadingPatients(true);
    try {
      const searchParams = new URLSearchParams({
        page: "1",
        limit: "20",
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      const response = await fetchApi(`/patients?${searchParams}`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los pacientes.");
      }

      const payload = (await response.json()) as PatientsResponse | { data?: Patient[] };
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setPatientCandidates(list);
    } catch (error) {
      console.error("Error loading patients for appointments", error);
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los pacientes.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const calendarPayload = await fetchAppointmentsJson<unknown>("/calendars/me");
      console.log("[appointments] /calendars/me payload", calendarPayload);
      const nextCalendar = normalizeCalendar(calendarPayload);
      console.log("[appointments] normalized calendar", nextCalendar);
      setCalendar(nextCalendar);

      if (!nextCalendar?.id) {
        setEvents([]);
        setSlots([]);
        setRequests([]);
        setWorkHoursDraft([]);
        setWorkHoursGridDraft(createEmptyWorkHoursGrid());
        setAvailabilitySource("default");
        setIsEditingWorkHours(false);
        return;
      }

      const weekStart = formatDateKey(currentWeekStart);
      const weekEnd = formatDateKey(currentWeekEnd);
      const from = `${weekStart}T00:00:00.000Z`;
      const to = `${weekEnd}T23:59:59.999Z`;

      try {
        const rulesResponse = await fetchAppointmentsApi(`/calendars/${nextCalendar.id}/availability/rules`);
        const rulesPayload = await rulesResponse.json().catch(() => ({}));
        console.log("[appointments] /availability/rules payload", rulesPayload);

        if (rulesResponse.ok) {
          const normalizedRules = parseWeekRulesPayload(rulesPayload);
          setWorkHoursDraft(normalizedRules);
          setWorkHoursGridDraft(createWorkHoursGridFromRules(normalizedRules));
          setAvailabilitySource("service");
        } else if (rulesResponse.status === 404 || rulesResponse.status === 405) {
          setWorkHoursDraft([]);
          setWorkHoursGridDraft(createEmptyWorkHoursGrid());
          setAvailabilitySource("default");
        } else {
          const message =
            typeof rulesPayload?.message === "string"
              ? rulesPayload.message
              : "No pudimos cargar tus horarios laborales.";
          console.warn("Availability rules could not be loaded", message);
          setWorkHoursDraft([]);
          setWorkHoursGridDraft(createEmptyWorkHoursGrid());
          setAvailabilitySource("default");
        }
      } catch (rulesError) {
        console.warn("Availability rules fetch failed", rulesError);
        setWorkHoursDraft([]);
        setWorkHoursGridDraft(createEmptyWorkHoursGrid());
        setAvailabilitySource("default");
      }

      let weekPayload: unknown = [];
      let slotPayload: unknown = [];
      let requestPayload: unknown = [];

      try {
        weekPayload = await fetchPathWithFallback([
          `/calendars/${nextCalendar.id}/view/week?weekStart=${weekStart}`,
          `/calendars/${nextCalendar.id}/appointments?from=${from}&to=${to}`,
          `/appointments?calendarId=${nextCalendar.id}&from=${from}&to=${to}`,
        ]);
      } catch (error) {
        console.warn("Weekly calendar could not be loaded", error);
      }

      try {
        slotPayload = await fetchPathWithFallback([
          `/availability/free-slots?calendarId=${nextCalendar.id}&from=${from}&to=${to}`,
          `/calendars/${nextCalendar.id}/availability/free-slots?from=${from}&to=${to}&durationMin=30`,
          `/calendars/${nextCalendar.id}/slots?from=${from}&to=${to}&durationMin=30`,
        ]);
      } catch (error) {
        console.warn("Free slots could not be loaded", error);
        slotPayload = [];
      }

      try {
        requestPayload = await fetchPathWithFallback([
          `/calendars/${nextCalendar.id}/requests?status=REQUESTED`,
          `/appointments?calendarId=${nextCalendar.id}&status=REQUESTED`,
        ]);
      } catch (error) {
        console.warn("Appointment requests could not be loaded", error);
        requestPayload = [];
      }

      setEvents(normalizeEvents(weekPayload));
      setSlots(normalizeSlots(slotPayload));
      setRequests(normalizeRequests(requestPayload));
      setIsEditingWorkHours(false);
    } catch (error) {
      console.error("Error loading appointments dashboard", error);
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el calendario.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart.getTime()]);

  useEffect(() => {
    if (activeTab === "calendar") {
      calendarSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isPatientPickerOpen) return;

    const timer = window.setTimeout(() => {
      void loadPatientCandidates(patientSearchQuery);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [isPatientPickerOpen, patientSearchQuery]);

  const fetchPathWithFallback = async (paths: string[]) => {
    let lastError: unknown = null;

    for (const path of paths) {
      try {
        console.log("[appointments] fetching", path);
        const response = await fetchAppointmentsApi(path);
        const payload = await response.json().catch(() => ({}));
        console.log("[appointments] response", path, response.status, payload);

        if (response.ok) {
          return payload;
        }

        if (response.status === 404 || response.status === 405) {
          lastError = new Error(`Not found for ${path}`);
          continue;
        }

        const message =
          typeof payload?.message === "string"
            ? payload.message
            : "No se pudo completar la consulta.";
        throw new Error(message);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error("No se pudo conectar con el servicio de citas.");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const handleImportPatient = (patientId: string) => {
    const patient = patientCandidates.find((item) => item.id === patientId);
    if (!patient) {
      return;
    }

    setCreateDraft((current) => ({
      ...current,
      patientId: patient.id,
      patientName: patient.fullName,
      patientEmail: patient.email || current.patientEmail,
    }));
    setIsPatientPickerOpen(false);
    toast.success("Paciente importado.");
  };

  const openCreateFromGrid = (date: Date, hour: number) => {
    const nextDate = new Date(date);
    nextDate.setHours(hour, 0, 0, 0);

    setCreateDraft((current) => ({
      ...current,
      date: formatDateKey(nextDate),
      time: formatTimeInput(nextDate),
    }));
    setIsCreateOpen(true);
  };

  const handleConnectGoogle = async () => {
    if (!calendarId) {
      toast.error("Primero carga tu calendario.");
      return;
    }

    setIsConnectingGoogle(true);
    try {
      const response = await fetchAppointmentsApi(`/calendars/${calendarId}/google-calendar/connect`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : "La ruta de conexión no respondió como se esperaba.",
        );
      }

      toast.success("Conexión con Google Calendar iniciada.");
      await loadData();
    } catch (error) {
      console.warn("Google Calendar connection not available yet", error);
      toast.info("La integración con Google Calendar quedó preparada para el servicio de citas.");
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleShareSchedule = async () => {
    if (!calendarId) {
      toast.error("Primero carga tu calendario.");
      return;
    }

    const profile = getStoredNutritionistProfile();
    if (!profile?.nutritionistId) {
      toast.error("No pudimos obtener tu identificador de nutricionista.");
      return;
    }

    setIsCreatingShareLink(true);
    try {
      const response = await createBookingLink({
        calendarId,
        nutritionistId: profile.nutritionistId,
        nutritionistName: profile.nutritionistName,
        title: `Horario de ${profile.nutritionistName}`,
        description:
          "Comparte este enlace para que tus pacientes reserven una cita sobre tu calendario actual.",
        timeZone: calendarTimeZone,
        metadata: {
          source: "NutriNet",
          module: "appointments",
        },
      });

      const responseRecord = response as unknown as Record<string, unknown>;
      const responseData =
        responseRecord.data && typeof responseRecord.data === "object" && !Array.isArray(responseRecord.data)
          ? (responseRecord.data as Record<string, unknown>)
          : null;
      const rawToken =
        normalizeText(response.token) ||
        normalizeText(responseData?.token) ||
        normalizeText(responseData?.bookingToken) ||
        normalizeText(response.url?.split("?")[0].split("/").filter(Boolean).pop()) ||
        normalizeText((responseData?.url as string | undefined) || "") ||
        normalizeText((responseData?.bookingUrl as string | undefined) || "") ||
        normalizeText((responseData?.metadata as Record<string, unknown> | undefined)?.token);

      if (!rawToken) {
        throw new Error("El servicio no devolvió un token válido para compartir el horario.");
      }

      const publicUrl = `${window.location.origin}/portal/citas/${encodeURIComponent(
        profile.nutritionistId,
      )}/${encodeURIComponent(rawToken)}`;

      setShareLinkToken(rawToken);
      setShareLinkUrl(publicUrl);
      setShareLinkNutritionistName(profile.nutritionistName);
      setIsShareLinkOpen(true);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      }

      toast.success("Horario compartido. El enlace quedó copiado.");
    } catch (error) {
      console.error("Error creating booking link", error);
      toast.error(error instanceof Error ? error.message : "No se pudo compartir el horario.");
    } finally {
      setIsCreatingShareLink(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareLinkUrl) {
      toast.error("Aún no hay un enlace para copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLinkUrl);
      toast.success("Enlace copiado.");
    } catch (error) {
      console.error("Error copying share link", error);
      toast.error("No pudimos copiar el enlace.");
    }
  };

  const handleSaveWorkHours = async () => {
    if (!calendarId) {
      toast.error("No hay calendario cargado.");
      console.warn("[appointments] save work hours without calendar", {
        calendar,
        calendarId,
        workHoursDraft,
        workHoursGridDraft,
      });
      return;
    }

    const nextRules = createRulesFromWorkHoursGrid(workHoursGridDraft);
    const mappedRules = nextRules.filter(r => r.enabled).map((rule) => ({
      dayOfWeek: DAY_OF_WEEK_BY_KEY[rule.day] ?? 1,
      startTime: rule.start,
      endTime: rule.end,
      slotIntervalMin: 15,
      isActive: true,
    }));

    setIsSavingHours(true);
    const payload = { rules: mappedRules };
    console.log("[appointments] save work hours calendarId:", calendarId);
    console.log("[appointments] save work hours payload exacto:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetchAppointmentsApi(`/calendars/${calendarId}/availability/rules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text().catch(() => "");
      const responsePayload = (() => {
        if (!responseText) return {};
        try {
          return JSON.parse(responseText) as Record<string, unknown>;
        } catch {
          return { raw: responseText };
        }
      })();
      console.log("[appointments] save availability response PUT:", response.status, responsePayload);

      if (response.ok) {
        toast.success("Horarios laborales actualizados.");
        setWorkHoursDraft(nextRules);
        setWorkHoursGridDraft(createWorkHoursGridFromRules(nextRules));
        setAvailabilitySource("service");
        setIsEditingWorkHours(false);
        await loadData();
        return;
      }

      const message =
        typeof responsePayload?.message === "string"
          ? responsePayload.message
          : typeof responsePayload?.error === "string"
            ? responsePayload.error
            : typeof responsePayload?.raw === "string" && responsePayload.raw.trim()
              ? responsePayload.raw
              : "No se pudieron guardar los horarios laborales.";
      throw new Error(message);
    } catch (error) {
      console.error("Error saving work hours", error);
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar los horarios.");
    } finally {
      setIsSavingHours(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!calendarId) {
      toast.error("Primero carga un calendario.");
      return;
    }

    const title = createDraft.title.trim();
    const patientName = createDraft.patientName.trim();
    const patientEmail = createDraft.patientEmail.trim();
    const notes = createDraft.notes.trim();

    if (!title || !patientName || !patientEmail) {
      toast.error("Completa paciente, correo y motivo de la cita.");
      return;
    }

    if (createDraft.notifyPatientByEmail && !patientEmail) {
      toast.error("Necesitas un correo válido para notificar al paciente.");
      return;
    }
    const startDate = parseDateSafe(`${createDraft.date}T${createDraft.time}:00`);
    if (!startDate) {
      toast.error("Selecciona una fecha válida.");
      return;
    }

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + Number(createDraft.durationMin || 30));

    try {
      const response = await fetchAppointmentsApi("/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendarId,
          title,
          patientName,
          patientEmail,
          patientId: createDraft.patientId || undefined,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          durationMin: Number(createDraft.durationMin || 30),
          notes: notes || undefined,
          status: "confirmed",
          timeZone: calendarTimeZone,
          notifyPatientByEmail: createDraft.notifyPatientByEmail,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload?.message === "string"
            ? payload.message
            : "No se pudo crear la cita en /appointments.";
        throw new Error(message);
      }

      toast.success("Cita creada correctamente.");
      setIsCreateOpen(false);
      setCreateDraft(createAppointmentDraft());
      await loadData();
    } catch (error) {
      console.error("Error creating appointment", error);
      toast.error(error instanceof Error ? error.message : "No se pudo crear la cita.");
    }
  };

  const eventBlocks = useMemo(() => {
    const blocks = new Map<string, AppointmentEvent[]>();

    weekDays.forEach((day) => {
      blocks.set(formatDateKey(day), []);
    });

    events.forEach((event) => {
      const start = parseDateSafe(event.start);
      if (!start) return;
      const key = formatDateKey(start);
      const list = blocks.get(key);
      if (list) list.push(event);
    });

    blocks.forEach((list, key) => {
      list.sort(
        (a, b) =>
          (parseDateSafe(a.start)?.getTime() || 0) - (parseDateSafe(b.start)?.getTime() || 0),
      );
      blocks.set(key, list);
    });

    return blocks;
  }, [events, weekDays]);

  const renderAppointmentBlock = (event: AppointmentEvent) => {
    const start = parseDateSafe(event.start);
    const end = parseDateSafe(event.end || event.start);
    if (!start || !end) return null;

    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    const top = Math.max(0, ((startMinutes / 60) - HOUR_START) * ROW_HEIGHT);
    const height = Math.max(52, ((endMinutes - startMinutes) / 60) * ROW_HEIGHT);
    const status = normalizeText(event.status).toLowerCase();
    const statusClass =
      status === "pending" || status === "requested"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status === "cancelled"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900";

    return (
      <div
        key={event.id || `${event.title}-${event.start}`}
        className={cn(
          "absolute left-2 right-2 rounded-2xl border px-3 py-2 shadow-sm",
          statusClass,
        )}
        style={{ top, height }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
              {formatTime(start)} - {formatTime(end)}
            </p>
            <p className="text-sm font-semibold leading-tight">{event.title}</p>
            <p className="mt-1 text-xs font-medium opacity-80">
              {event.patientName || "Paciente pendiente"}
            </p>
          </div>
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-widest">
            {normalizeText(event.status) || "CONFIRMADA"}
          </span>
        </div>
      </div>
    );
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <ModuleLayout
      title="Citas"
      description="Calendario clínico, próximas citas, citas pasadas y peticiones en una sola vista."
      className="max-w-7xl"
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div ref={calendarSectionRef}>
            <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="space-y-3 p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    Agenda viva
                  </span>
                  <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {calendar ? getAppointmentDisplayName(calendar) : "Sin calendario cargado"}
                  </span>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                      Calendario clínico
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm font-medium text-slate-500">
                      Gestiona disponibilidad, citas y peticiones en tiempo real.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm font-medium text-blue-800/90 shadow-sm">
                      Haz clic en cualquier espacio libre para crear una cita con fecha y hora prellenadas.
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      onClick={handleConnectGoogle}
                      disabled={isConnectingGoogle || isLoading}
                    >
                      <Link2 className="mr-2 h-4 w-4 text-indigo-500" />
                      {isConnectingGoogle ? "Conectando..." : "Google Calendar"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      onClick={() => void handleShareSchedule()}
                      disabled={isCreatingShareLink || isLoading}
                    >
                      <Share2 className="mr-2 h-4 w-4 text-indigo-500" />
                      Compartir horario
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      onClick={() => {
                        setWorkHoursGridDraft(createWorkHoursGridFromRules(workHoursDraft));
                        setIsEditingWorkHours(true);
                      }}
                    >
                      <Settings2 className="mr-2 h-4 w-4 text-slate-400" />
                      Horarios laborales
                    </Button>
                    <Button
                      className="h-10 rounded-xl bg-indigo-600 px-4 font-semibold text-white shadow-sm hover:bg-indigo-700"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear cita
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-10 rounded-xl px-4 font-semibold text-slate-500 hover:bg-slate-100"
                      onClick={() => void handleRefresh()}
                      disabled={isRefreshing}
                    >
                      <RefreshCcw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-8 pt-0">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Próximas</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{upcomingEvents.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Pasadas</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{pastEvents.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Disponibles</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{availableSlots.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Peticiones</p>
                    <p className="mt-2 text-3xl font-semibold text-amber-600">{requests.length}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Semana del {currentWeekStart.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })} al {currentWeekEnd.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Vista semanal de agenda.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl px-4 font-semibold text-slate-700"
                      onClick={() => setWeekAnchor((current) => addDays(current, -7))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl px-4 font-semibold text-slate-700"
                      onClick={() => setWeekAnchor(new Date())}
                    >
                      Hoy
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl px-4 font-semibold text-slate-700"
                      onClick={() => setWeekAnchor((current) => addDays(current, 7))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                  {isLoading ? (
                    <div className="flex h-[820px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[1024px]">
                        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white">
                          <div className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Hora
                          </div>
                          {weekDays.map((day, index) => {
                            const dayEvents = eventBlocks.get(formatDateKey(day)) || [];
                            return (
                              <div key={index} className="border-l border-slate-100 px-3 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {formatDayLabel(day)}
                                </p>
                                <p className="mt-1 text-xs font-bold text-slate-900">
                                  {day.toLocaleDateString("es-CL", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </p>
                                <p className="mt-1 text-[10px] font-medium text-slate-500">
                                  {dayEvents.length} eventos
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                          <div className="relative bg-white">
                            {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => {
                              const hour = HOUR_START + index;
                              return (
                                <div
                                  key={hour}
                                  className="flex h-16 items-start justify-end border-b border-slate-100 px-2 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                >
                                  {formatHourLabel(hour)}
                                </div>
                              );
                            })}
                          </div>

                          {weekDays.map((day) => {
                            const dayEvents = eventBlocks.get(formatDateKey(day)) || [];
                            const dayKey = WEEK_DAYS[getWeekDayIndex(day)].key;
                            const dayRule = workHoursDraft.find((rule) => rule.day === dayKey);
                            const dayHasWorkingWindow = Boolean(dayRule?.enabled);
                            const dayGrid = workHoursGridDraft[dayKey] || [];
                            return (
                              <div key={day.toISOString()} className="relative min-h-[832px] border-l border-slate-100 bg-white">
                                {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => {
                                  const hour = HOUR_START + index;
                                  const gridIndex = hour - HOUR_START;
                                  const isSelectedHour = Boolean(dayGrid[gridIndex]);
                                  const isWorkingHour = isEditingWorkHours ? isSelectedHour : isHourWithinRule(day, hour, dayRule);
                                  const isEditableHour = hour < HOUR_END;
                                  return (
                                    <button
                                      key={hour}
                                      type="button"
                                      onClick={() => {
                                        if (!isEditableHour) return;
                                        if (isEditingWorkHours) {
                                          setWorkHoursGridDraft((current) => {
                                            if (gridIndex < 0 || gridIndex >= (current[dayKey]?.length || 0)) {
                                              return current;
                                            }
                                            const next = { ...current };
                                            const nextDay = [...(next[dayKey] || [])];
                                            nextDay[gridIndex] = !nextDay[gridIndex];
                                            next[dayKey] = nextDay;
                                            return next;
                                          });
                                          return;
                                        }

                                        if (!isWorkingHour) return;
                                        openCreateFromGrid(day, hour);
                                      }}
                                      title={
                                        !isEditableHour
                                          ? isEditingWorkHours
                                            ? "Corte horario"
                                            : "Bloque horario"
                                          : isEditingWorkHours
                                            ? `${isSelectedHour ? "Desactivar" : "Activar"} ${formatHourLabel(hour)}`
                                            : isWorkingHour
                                              ? `Crear cita ${formatHourLabel(hour)} en ${day.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "short" })}`
                                              : "Fuera de horario"
                                      }
                                      className={cn(
                                        "h-16 w-full border-b border-slate-100 transition-colors",
                                        !isEditableHour
                                          ? isEditingWorkHours
                                            ? "cursor-pointer bg-slate-100/70 hover:bg-slate-200"
                                            : "cursor-default bg-white"
                                          : isEditingWorkHours
                                            ? isSelectedHour
                                              ? "cursor-pointer bg-emerald-500/85 hover:bg-emerald-600"
                                              : "cursor-pointer bg-slate-100/80 hover:bg-slate-200"
                                            : isWorkingHour
                                              ? "cursor-pointer hover:bg-emerald-50/70"
                                              : "cursor-default bg-slate-100/70",
                                      )}
                                    />
                                  );
                                })}
                                {!isEditingWorkHours && !dayHasWorkingWindow && (
                                  <div className="pointer-events-none absolute inset-0 bg-slate-100/35" />
                                )}
                                {!isEditingWorkHours && dayEvents.map(renderAppointmentBlock)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="space-y-2 p-8 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Navegación</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Listados de trabajo y calendario.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-8 pt-0">
                <div className="grid gap-2">
                  {TAB_ITEMS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                        activeTab === tab.key
                          ? "border-indigo-200 bg-indigo-50/50 text-indigo-900 shadow-sm"
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{tab.label}</span>
                        <span className="block text-[11px] font-medium opacity-60">{tab.description}</span>
                      </span>
                      {activeTab === tab.key && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="space-y-2 p-8 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  {calendar ? getAppointmentDisplayName(calendar) : "Sin calendario"}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Zona: {calendarTimeZone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-8 pt-0">
                {isEditingWorkHours ? (
                  <div className="space-y-4">
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-semibold"
                        onClick={async () => {
                          setWorkHoursGridDraft(createWorkHoursGridFromRules(workHoursDraft));
                          setIsEditingWorkHours(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="h-11 rounded-xl bg-indigo-600 px-5 font-semibold text-white"
                        onClick={() => void handleSaveWorkHours()}
                        isLoading={isSavingHours}
                      >
                        Guardar
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs font-medium text-indigo-900/80">
                      Selecciona bloques directamente en la grilla. Lo que marques se repetirá semanalmente.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/50 p-4">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm",
                        (calendar?.googleCalendarConnected || calendar?.googleSyncEnabled || calendar?.isGoogleConnected) ? "text-emerald-600" : "text-slate-400"
                      )}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {calendar?.googleCalendarConnected || calendar?.googleSyncEnabled || calendar?.isGoogleConnected
                            ? "Google conectado"
                            : "Google desconectado"}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">
                          Sincronización automática activa.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Libres</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{availableSlots.length}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Peticiones</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{requests.length}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      onClick={handleConnectGoogle}
                      disabled={isConnectingGoogle}
                    >
                      <Link2 className="mr-2 h-4 w-4 text-indigo-500" />
                      Google Calendar
                    </Button>
                    <Button
                      className="h-11 w-full rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva cita
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pt-1">
            {activeTab === "calendar" && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-emerald-500" />
                <h3 className="mt-4 text-lg font-black text-slate-900">Calendario</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Usa la agenda superior para ver bloques libres, ocupados y crear citas con un clic.
                </p>
                <Button
                  className="mt-5 rounded-xl bg-slate-900 px-5 font-black text-white"
                  onClick={() => calendarSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Volver al calendario
                </Button>
              </div>
            )}

            {activeTab === "upcoming" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcomingEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-sm font-semibold text-slate-400">
                    No hay citas próximas.
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <Card key={event.id} className="rounded-2xl border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                      <CardHeader className="space-y-2 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base font-semibold text-slate-900">
                            {event.title}
                          </CardTitle>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
                            {normalizeText(event.status) || "confirmada"}
                          </span>
                        </div>
                        <CardDescription className="text-sm font-medium text-slate-500">
                          {event.patientName || "Paciente pendiente"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-indigo-400" />
                          {parseDateSafe(event.start)?.toLocaleString("es-CL", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "past" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pastEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-sm font-semibold text-slate-400">
                    No hay historial registrado.
                  </div>
                ) : (
                  pastEvents.map((event) => (
                    <Card key={event.id} className="rounded-2xl border-slate-100 shadow-sm">
                      <CardHeader className="space-y-2 pb-3">
                        <CardTitle className="text-base font-semibold text-slate-900">{event.title}</CardTitle>
                        <CardDescription className="text-sm font-medium text-slate-500">
                          {event.patientName || "Paciente"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="h-4 w-4 text-slate-300" />
                          {parseDateSafe(event.start)?.toLocaleDateString("es-CL")}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-sm font-semibold text-slate-400">
                    No hay peticiones.
                  </div>
                ) : (
                  requests.map((request) => (
                    <Card key={request.id} className="rounded-2xl border-slate-100 shadow-sm border-l-4 border-l-amber-400">
                      <CardHeader className="space-y-2 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base font-semibold text-slate-900">
                            {request.title || "Solicitud"}
                          </CardTitle>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                            {normalizeText(request.status) || "PENDIENTE"}
                          </span>
                        </div>
                        <CardDescription className="text-sm font-medium text-slate-500">
                          {request.patientName || "Paciente pendiente"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <AlarmClock className="h-4 w-4 text-amber-400" />
                          {parseDateSafe(request.requestedAt)?.toLocaleString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={isPatientPickerOpen}
        onClose={() => setIsPatientPickerOpen(false)}
        title="Importar paciente"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500">
            Busca un paciente existente para importar su nombre y correo al crear la cita.
          </p>
          <SearchableSelect
            options={patientCandidateOptions}
            value={createDraft.patientId}
            onChange={handleImportPatient}
            onSearch={setPatientSearchQuery}
            placeholder="Buscar paciente"
            isLoading={isLoadingPatients}
          />
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
            El correo del paciente quedará cargado automáticamente y podrás decidir si notificarlo por correo.
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear cita">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">Paciente de la cita</p>
              <p className="text-xs font-medium text-slate-500">
                Debes indicar nombre y correo. El correo funciona como identificador y permite notificar al paciente.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-blue-200 bg-blue-50 px-4 font-black text-blue-700 hover:bg-blue-100"
              onClick={() => {
                setPatientSearchQuery("");
                setIsPatientPickerOpen(true);
              }}
            >
              Importar paciente
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Paciente</label>
              <Input
                value={createDraft.patientName}
                onChange={(event) => setCreateDraft((current) => ({ ...current, patientName: event.target.value }))}
                placeholder="Nombre del paciente"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Correo del paciente</label>
              <Input
                type="email"
                value={createDraft.patientEmail}
                onChange={(event) => setCreateDraft((current) => ({ ...current, patientEmail: event.target.value }))}
                placeholder="correo@ejemplo.com"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={createDraft.notifyPatientByEmail}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      notifyPatientByEmail: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  <span className="block text-sm font-black text-slate-900">Notificar al paciente por correo</span>
                  <span className="block text-xs font-medium text-slate-500">
                    Se enviará una notificación al correo del paciente si el calendario está conectado.
                  </span>
                </span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Motivo</label>
              <Input
                value={createDraft.title}
                onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Consulta nutricional"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Fecha</label>
              <Input
                type="date"
                value={createDraft.date}
                onChange={(event) => setCreateDraft((current) => ({ ...current, date: event.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Hora</label>
              <Input
                type="time"
                value={createDraft.time}
                onChange={(event) => setCreateDraft((current) => ({ ...current, time: event.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Duración (min)</label>
              <Input
                type="number"
                min={15}
                step={15}
                value={createDraft.durationMin}
                onChange={(event) => setCreateDraft((current) => ({ ...current, durationMin: Number(event.target.value) || 30 }))}
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Notas</label>
            <Textarea
              value={createDraft.notes}
              onChange={(event) => setCreateDraft((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-[120px] rounded-xl"
              placeholder="Observaciones de la cita..."
            />
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
            También puedes crear la cita haciendo clic en cualquier espacio libre del calendario. Si Google Calendar está conectado, la cita se sincronizará automáticamente al guardar.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="h-11 rounded-xl px-5 font-black" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl bg-emerald-600 px-5 font-black text-white" onClick={() => void handleCreateAppointment()}>
              Crear cita
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isShareLinkOpen} onClose={() => setIsShareLinkOpen(false)} title="Compartir mi horario">
        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-black text-sky-900">Comparte este enlace con tus pacientes</p>
            <p className="mt-1 text-sm font-medium text-sky-800/80">
              Podrán ver tu calendario público, elegir un bloque libre y registrar la cita con correo y motivo.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nutricionista</label>
            <Input value={shareLinkNutritionistName} readOnly className="h-12 rounded-xl bg-slate-50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Enlace público</label>
            <Input value={shareLinkUrl} readOnly className="h-12 rounded-xl bg-slate-50 font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Token del enlace</label>
            <Input value={shareLinkToken} readOnly className="h-12 rounded-xl bg-slate-50 font-mono text-xs" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="h-11 rounded-xl px-5 font-black" onClick={() => setIsShareLinkOpen(false)}>
              Cerrar
            </Button>
            <Button className="h-11 rounded-xl bg-sky-600 px-5 font-black text-white" onClick={() => void handleCopyShareLink()}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copiar enlace
            </Button>
          </div>
        </div>
      </Modal>

    </ModuleLayout>
  );
}





