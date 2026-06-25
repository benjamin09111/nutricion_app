"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ClipboardCopy,
  Share2,
  Loader2,
  Plus,
  RefreshCcw,
  Settings2,
  BadgeInfo,
  Search,
  ChevronRight,
  X,
  CalendarCheck2,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
import { QRCodeSVG } from "qrcode.react";
import { type Patient } from "@/features/patients";
import {
  AppointmentCalendar,
  AppointmentEvent,
  createBookingLink,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  resyncGoogleCalendar,
  AppointmentRequest,
  AppointmentSlot,
  fetchAppointmentsApi,
} from "@/lib/appointments";
import { getAuthToken } from "@/lib/auth-token";
import { FeatureGate } from "@/components/memberships/FeatureGate";
import {
  useAppointmentPatients,
  useAppointmentPatientPortalStatus,
} from "./hooks/useAppointmentsPeople";
import {
  useCalendarMe,
  useAvailabilityRules,
  useWeekView,
  useCalendarRequests,
} from "./hooks/useAppointmentsData";
import {
  approveAppointment,
  createAppointment,
  cancelAppointment,
  rejectAppointment,
} from "./hooks/useAppointmentActions";

type WeekRule = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

type WorkHoursGridDraft = Record<string, boolean[]>;

type ScheduleTabKey = "schedule" | "upcoming" | "citas";
type CitasTabKey = "accepted" | "pending" | "rejected";

const SCHEDULE_TABS: Array<{ key: ScheduleTabKey; label: string }> = [
  { key: "schedule", label: "Mi horario" },
  { key: "upcoming", label: "Próximas citas" },
  { key: "citas", label: "Citas" },
];

const CITAS_TABS: Array<{ key: CitasTabKey; label: string }> = [
  { key: "accepted", label: "Aceptadas" },
  { key: "pending", label: "Pendientes" },
  { key: "rejected", label: "Rechazadas" },
];

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
    start: "08:00",
    end: "16:00",
  }));

const DAY_OF_WEEK_BY_KEY: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const HOUR_START = 8;
const HOUR_END = 23;
const ROW_HEIGHT = 64;

const createEmptyWorkHoursGrid = (): WorkHoursGridDraft =>
  Object.fromEntries(
    WEEK_DAYS.map((day) => [day.key, Array.from({ length: HOUR_END - HOUR_START + 1 }, () => false)]),
  ) as WorkHoursGridDraft;

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

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

const formatTimeInTimeZone = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("es-CL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

const formatDateInTimeZone = (
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat("es-CL", { timeZone, ...options }).format(date);

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
  const normalized = typeof value === "number" ? Math.trunc(value) : Number(normalizeText(value));
  if (Number.isNaN(normalized)) {
    return normalizeWeekDayKey(value);
  }

  const index = normalized === 7 ? 0 : normalized;
  const dayMap: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  return dayMap[index] || "";
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
            : typeof record.isActive === "boolean"
              ? record.isActive
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
  if (!items.length) {
    return [];
  }

  const parsed = items
    .map(parseAvailabilityRuleItem)
    .filter((item): item is WeekRule => item !== null);

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

const isHourWithinRule = (day: Date, hour: number, allRules: WeekRule[]) => {
  const dayIndex = getWeekDayIndex(day);
  const dayKey = WEEK_DAYS[dayIndex].key;
  
  return allRules
    .filter((r) => r.day === dayKey && r.enabled)
    .some((rule) => {
      const startHour = Number(rule.start.slice(0, 2));
      const endHour = Number(rule.end.slice(0, 2));
      return hour >= startHour && hour < endHour;
    });
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
    nutritionistId: normalizeText(cal.nutritionistId) || normalizeText(cal.nutritionist_id),
    name: normalizeText(cal.name),
    title: normalizeText(cal.title),
    description: normalizeText(cal.description),
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
    googleSyncEnabled:
      typeof cal.googleSyncEnabled === "boolean" ? cal.googleSyncEnabled : undefined,
    isGoogleConnected:
      typeof cal.isGoogleConnected === "boolean" ? cal.isGoogleConnected : undefined,
    googleCalendarEmail:
      typeof cal.googleCalendarEmail === "string" ? cal.googleCalendarEmail : null,
    googleCalendarStatus:
      cal.googleCalendarStatus && typeof cal.googleCalendarStatus === "object" && !Array.isArray(cal.googleCalendarStatus)
        ? (cal.googleCalendarStatus as Record<string, unknown>)
        : null,
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
            start: formatHourLabel(segmentStart),
            end: formatHourLabel(segmentEnd),
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
  description: "",
  notifyPatientByEmail: true,
  date: formatDateKey(new Date()),
  time: "09:00",
  durationMin: 30,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim().toLowerCase());

type AppointmentConfirmationState = {
  kind: "create" | "accept";
  appointmentId?: string;
  patientName: string;
  patientEmail: string;
  description: string;
  start: string;
  end: string;
  durationMin?: number;
  patientId?: string;
  notifyPatientByEmail: boolean;
  syncGoogleCalendar: boolean;
  canNotifyPatientByEmail: boolean;
  canSyncGoogleCalendar: boolean;
};

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
    const nutritionistId = normalizeText(nutritionist?.id) || "";
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

export default function AppointmentsClient() {
  const [calendar, setCalendar] = useState<AppointmentCalendar | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ScheduleTabKey>("schedule");
  const [activeCitasTab, setActiveCitasTab] = useState<CitasTabKey>("accepted");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [isEditingWorkHours, setIsEditingWorkHours] = useState(false);
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"manual" | "patient">("manual");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);
  const [showNonWorkingHours, setShowNonWorkingHours] = useState(false);
  const [createDraft, setCreateDraft] = useState(createAppointmentDraft());
  const [workHoursDraft, setWorkHoursDraft] = useState<WeekRule[]>(DEFAULT_WEEK_RULES);
  const [workHoursGridDraft, setWorkHoursGridDraft] = useState<WorkHoursGridDraft>(createEmptyWorkHoursGrid());
  const [, setAvailabilitySource] = useState<"service" | "default">("default");
const [shareLinkUrl, setShareLinkUrl] = useState("");
  const [shareLinkNutritionistName, setShareLinkNutritionistName] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [pendingAppointmentConfirmation, setPendingAppointmentConfirmation] = useState<AppointmentConfirmationState | null>(null);
  const [isSubmittingAppointmentConfirmation, setIsSubmittingAppointmentConfirmation] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentEvent | null>(null);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);
  const [isCancellingAppointment, setIsCancellingAppointment] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [isGoogleResyncing, setIsGoogleResyncing] = useState(false);
  const [isGoogleDisconnecting, setIsGoogleDisconnecting] = useState(false);
  const [isGoogleDisconnectConfirmOpen, setIsGoogleDisconnectConfirmOpen] = useState(false);
  const [mobileDayOffset, setMobileDayOffset] = useState(0);
  const [debouncedPatientSearchQuery, setDebouncedPatientSearchQuery] = useState("");
  const calendarSectionRef = useRef<HTMLDivElement | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const currentWeekStart = weekDays[0];

  const upcomingEvents = useMemo(
    () =>
      events.filter((event) => {
        const start = parseDateSafe(event.start);
        return start
          ? start.getTime() >= Date.now() &&
              ["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(event.status)
          : false;
      }),
    [events],
  );

  const calendarQuery = useCalendarMe();
  const calendarId = calendarQuery.data?.id ?? calendar?.id ?? null;
  const calendarTimeZone =
    calendarQuery.data?.timeZone ||
    calendarQuery.data?.timezone ||
    calendar?.timeZone ||
    calendar?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const availabilityRulesQuery = useAvailabilityRules(calendarId ?? undefined);
  const weekViewQuery = useWeekView(calendarId ?? undefined, currentWeekStart);
  const calendarRequestsQuery = useCalendarRequests(calendarId ?? undefined);

  const patientCandidatesQuery = useAppointmentPatients(
    debouncedPatientSearchQuery,
    isPatientPickerOpen || shareMode === "patient",
  );
  const patientCandidates = patientCandidatesQuery.data ?? [];
  const isLoadingPatients = patientCandidatesQuery.isFetching;

  const selectedPatientPortalStatusQuery = useAppointmentPatientPortalStatus(
    selectedPatient?.id ?? null,
    Boolean(selectedPatient?.id),
  );
  const selectedPatientPortalStatus = selectedPatientPortalStatusQuery.data ?? null;
  const isLoadingPatientPortalStatus = selectedPatientPortalStatusQuery.isFetching;

  const pendingRequestsCount = requests.length;

  const isLoading =
    calendarQuery.isLoading ||
    availabilityRulesQuery.isLoading ||
    weekViewQuery.isLoading ||
    calendarRequestsQuery.isLoading;
  const isRefreshing =
    calendarQuery.isFetching ||
    availabilityRulesQuery.isFetching ||
    weekViewQuery.isFetching ||
    calendarRequestsQuery.isFetching ||
    patientCandidatesQuery.isFetching;

  useEffect(() => {
    setCalendar(calendarQuery.data ?? null);
  }, [calendarQuery.data]);

  useEffect(() => {
    const rules = availabilityRulesQuery.data?.rules ?? [];
    setWorkHoursDraft(rules);
    setWorkHoursGridDraft(createWorkHoursGridFromRules(rules));
    setAvailabilitySource(availabilityRulesQuery.data?.source ?? "default");
  }, [availabilityRulesQuery.data]);

  useEffect(() => {
    setEvents(weekViewQuery.data?.events ?? []);
    setSlots(weekViewQuery.data?.slots ?? []);
  }, [weekViewQuery.data]);

  useEffect(() => {
    setRequests(calendarRequestsQuery.data ?? []);
  }, [calendarRequestsQuery.data]);

  const patientCandidateOptions = useMemo(
    () =>
      patientCandidates.map((patient) => ({
        value: patient.id,
        label: `${patient.fullName}${patient.email ? ` · ${patient.email}` : ""}`,
      })),
    [patientCandidates],
  );

  const hasWorkingHours = useMemo(
    () => workHoursDraft.some((rule) => rule.enabled),
    [workHoursDraft],
  );

  const showWorkHoursEmptyState = !isEditingWorkHours && !hasWorkingHours;

  const visibleHours = useMemo(() => {
    if (showNonWorkingHours) {
      return Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index);
    }

    const hours = new Set<number>();

    for (const rule of workHoursDraft) {
      if (!rule.enabled) continue;

      const startHour = Math.max(HOUR_START, Number(rule.start.slice(0, 2)) || HOUR_START);
      const endHour = Math.min(HOUR_END, Number(rule.end.slice(0, 2)) || HOUR_END);

      for (let hour = startHour; hour < endHour; hour += 1) {
        hours.add(hour);
      }
    }

    const sortedHours = Array.from(hours).sort((left, right) => left - right);

    return sortedHours.length > 0
      ? sortedHours
      : Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index);
  }, [showNonWorkingHours, workHoursDraft]);

  const visibleHourStart = visibleHours[0] ?? HOUR_START;
  const visibleHoursHeight = visibleHours.length * ROW_HEIGHT;

  const startEditingWorkHours = () => {
    setWorkHoursGridDraft(createWorkHoursGridFromRules(workHoursDraft));
    setIsEditingWorkHours(true);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isPatientPickerOpen && shareMode !== "patient") {
      setDebouncedPatientSearchQuery("");
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedPatientSearchQuery(patientSearchQuery.trim());
    }, 200);

    return () => window.clearTimeout(timer);
  }, [isPatientPickerOpen, patientSearchQuery, shareMode]);

  const handleRefresh = async () => {
    await Promise.all([
      calendarQuery.refetch(),
      availabilityRulesQuery.refetch(),
      weekViewQuery.refetch(),
      calendarRequestsQuery.refetch(),
      patientCandidatesQuery.refetch(),
    ]);
  };

  const handleGoogleConnect = async () => {
    if (!calendarId || isGoogleConnecting) return;
    setIsGoogleConnecting(true);
    try {
      const response = await connectGoogleCalendar(calendarId);
      const raw = response as Record<string, unknown>;
      const authUrl = typeof raw.authUrl === "string" ? raw.authUrl : null;
      if (!authUrl) {
        throw new Error("No pudimos iniciar la conexión con Google.");
      }
      window.location.href = authUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conectar Google Calendar.");
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  const handleGoogleResync = async () => {
    if (!calendarId || isGoogleResyncing) return;
    setIsGoogleResyncing(true);
    try {
      await resyncGoogleCalendar(calendarId);
      toast.success("Google Calendar sincronizado.");
      await handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo re-sincronizar Google Calendar.");
    } finally {
      setIsGoogleResyncing(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!calendarId || isGoogleDisconnecting) return;
    setIsGoogleDisconnecting(true);
    try {
      await disconnectGoogleCalendar(calendarId);
      toast.success("Google Calendar desconectado.");
      setIsGoogleDisconnectConfirmOpen(false);
      await handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desconectar Google Calendar.");
    } finally {
      setIsGoogleDisconnecting(false);
    }
  };

  const handleImportPatient = (patientId: string) => {
    const patient = patientCandidates.find((item) => item.id === patientId);
    if (!patient) {
      return;
    }

    if (!patient.email) {
      toast.error("El paciente necesita correo para poder agendarlo.");
      return;
    }

    const patientEmail = patient.email;

    setCreateDraft((current) => ({
      ...current,
      patientId: patient.id,
      patientName: patient.fullName,
      patientEmail,
    }));
    setSelectedPatient(patient);
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
        mode: "FLEXIBLE",
        allowedUses: 1000,
        expiresAt: "2026-12-31T23:59:59.000Z",
        metadata: {
          source: "dashboard",
          module: "appointments",
          nutritionistId: profile.nutritionistId,
          nutritionistName: profile.nutritionistName,
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

  // Load settings for public schedule
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = getAuthToken();
        const response = await fetchApi("/nutritionists/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings || {};
          if (settings.bookingUrl && !shareLinkUrl) {
            setShareLinkUrl(settings.bookingUrl);
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendEmail = async () => {
    if (!shareEmail.trim() || !shareEmail.includes("@")) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = getAuthToken();
      const response = await fetchApi("/nutritionists/share-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: shareEmail,
          bookingUrl: shareLinkUrl,
          nutritionistName: shareLinkNutritionistName,
        }),
      });

      if (response.ok) {
        toast.success(`Enlace enviado con éxito a ${shareEmail}`);
        setShareEmail("");
      } else {
        toast.error("No se pudo enviar el correo. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Error de conexión al enviar el correo.");
    } finally {
      setIsSendingEmail(false);
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

      if (response.ok) {
        toast.success("Horarios laborales actualizados.");
        setWorkHoursDraft(nextRules);
        setWorkHoursGridDraft(createWorkHoursGridFromRules(nextRules));
        setAvailabilitySource("service");
        setIsEditingWorkHours(false);
        await handleRefresh();
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

  const isGoogleCalendarConnected = Boolean(
    calendar?.googleCalendarConnected ?? calendar?.googleSyncEnabled ?? calendar?.isGoogleConnected,
  );

  const openCreateAppointmentConfirmation = () => {
    if (!calendarId) {
      toast.error("Primero carga un calendario.");
      return;
    }

    const description = createDraft.description.trim();
    const patientId = createDraft.patientId.trim();
    const patientName = createDraft.patientName.trim();
    const patientEmail = createDraft.patientEmail.trim();

    if (!patientName) {
      toast.error("Debes indicar el nombre del paciente.");
      return;
    }

    if (!description) {
      toast.error("Agrega la descripción de la cita.");
      return;
    }

    const startDate = parseDateSafe(`${createDraft.date}T${createDraft.time}:00`);
    if (!startDate) {
      toast.error("Selecciona una fecha válida.");
      return;
    }

    const minStart = Date.now() + 5 * 60 * 1000;
    if (startDate.getTime() < minStart) {
      toast.error("La cita debe empezar al menos 5 minutos en el futuro.");
      return;
    }

    const durationMin = Math.min(60, Math.max(5, Number(createDraft.durationMin || 30)));
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durationMin);

    const canNotifyPatientByEmail = Boolean(selectedPatient?.email) || isValidEmail(patientEmail);

    setPendingAppointmentConfirmation({
      kind: "create",
      patientId: patientId || undefined,
      patientName,
      patientEmail,
      description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      durationMin,
      notifyPatientByEmail: canNotifyPatientByEmail,
      syncGoogleCalendar: isGoogleCalendarConnected,
      canNotifyPatientByEmail,
      canSyncGoogleCalendar: isGoogleCalendarConnected,
    });

    console.log("[appointments][create] confirmation opened", {
      calendarId,
      patientId: patientId || null,
      patientName,
      patientEmail: patientEmail || null,
      canNotifyPatientByEmail,
      canSyncGoogleCalendar: isGoogleCalendarConnected,
    });
  };

  const openAcceptAppointmentConfirmation = (appointment: AppointmentRequest) => {
    const patientName = appointment.patientName?.trim() || "Paciente";
    const patientEmail = appointment.patientEmail?.trim() || "";
    const canNotifyPatientByEmail = isValidEmail(patientEmail);

    setPendingAppointmentConfirmation({
      kind: "accept",
      appointmentId: appointment.id,
      patientName,
      patientEmail,
      description: appointment.notes?.trim() || appointment.title || "Solicitud de cita",
      start: appointment.start,
      end: appointment.end,
      notifyPatientByEmail: canNotifyPatientByEmail,
      syncGoogleCalendar: isGoogleCalendarConnected,
      canNotifyPatientByEmail,
      canSyncGoogleCalendar: isGoogleCalendarConnected,
    });

    console.log("[appointments][accept] confirmation opened", {
      appointmentId: appointment.id,
      patientName,
      patientEmail: patientEmail || null,
      canNotifyPatientByEmail,
      canSyncGoogleCalendar: isGoogleCalendarConnected,
    });
  };

  const handleConfirmAppointmentAction = async () => {
    if (!pendingAppointmentConfirmation || isSubmittingAppointmentConfirmation) {
      return;
    }

    setIsSubmittingAppointmentConfirmation(true);

    try {
      if (!calendarId) {
        throw new Error("Primero carga un calendario.");
      }

      if (pendingAppointmentConfirmation.kind === "create") {
        console.log("[appointments][create] submitting", pendingAppointmentConfirmation);

        const createdAppointment = await createAppointment({
          calendarId,
          payload: {
            patientId: pendingAppointmentConfirmation.patientId || undefined,
            patientName: pendingAppointmentConfirmation.patientName,
            patientEmail: pendingAppointmentConfirmation.patientEmail || undefined,
            start: pendingAppointmentConfirmation.start,
            end: pendingAppointmentConfirmation.end,
            durationMin: pendingAppointmentConfirmation.durationMin ?? 30,
            title: pendingAppointmentConfirmation.description,
            description: pendingAppointmentConfirmation.description,
            notes: pendingAppointmentConfirmation.description || undefined,
            status: "CONFIRMED",
            timeZone: calendarTimeZone,
            notifyPatientByEmail: pendingAppointmentConfirmation.canNotifyPatientByEmail
              ? pendingAppointmentConfirmation.notifyPatientByEmail
              : false,
            syncGoogleCalendar: pendingAppointmentConfirmation.canSyncGoogleCalendar
              ? pendingAppointmentConfirmation.syncGoogleCalendar
              : false,
          },
        });

        const createdRecord = createdAppointment as Record<string, unknown>;
        const googleSyncedAt = normalizeText(createdRecord.googleCalendarSyncedAt);
        const googleError = normalizeText(createdRecord.googleCalendarSyncError);

        console.log("[appointments][create] completed", {
          googleSyncedAt: googleSyncedAt || null,
          googleError: googleError || null,
        });

        if (googleError) {
          toast.warning(`Cita creada, pero Google Calendar no la pudo sincronizar: ${googleError}`);
        } else if (googleSyncedAt) {
          toast.success("Cita creada y sincronizada con Google Calendar.");
        } else {
          toast.success("Cita creada correctamente.");
        }

        setIsCreateOpen(false);
        setCreateDraft(createAppointmentDraft());
        setSelectedPatient(null);
      } else {
        console.log("[appointments][accept] submitting", pendingAppointmentConfirmation);

        await approveAppointment(
          pendingAppointmentConfirmation.appointmentId || "",
          pendingAppointmentConfirmation.canNotifyPatientByEmail
            ? pendingAppointmentConfirmation.notifyPatientByEmail
            : false,
          pendingAppointmentConfirmation.canSyncGoogleCalendar
            ? pendingAppointmentConfirmation.syncGoogleCalendar
            : false,
        );

        toast.success("Cita aceptada");
      }

      setPendingAppointmentConfirmation(null);
      await handleRefresh();
    } catch (error) {
      console.error(
        pendingAppointmentConfirmation.kind === "create"
          ? "Error creating appointment"
          : "Error accepting appointment",
        error,
      );
      toast.error(
        error instanceof Error
          ? error.message
          : pendingAppointmentConfirmation.kind === "create"
            ? "No se pudo crear la cita."
            : "Error al aceptar la cita",
      );
    } finally {
      setIsSubmittingAppointmentConfirmation(false);
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await rejectAppointment(appointmentId);
      toast.success("Cita rechazada");
      await handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al rechazar la cita");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (isCancellingAppointment) return;
    setIsCancellingAppointment(true);
    try {
      await cancelAppointment(appointmentId);
      toast.success("Cita cancelada");
      setIsAppointmentDetailOpen(false);
      setSelectedAppointment(null);
      await handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cancelar la cita");
    } finally {
      setIsCancellingAppointment(false);
    }
  };

  const appointmentBlocks = useMemo(() => {
    const blocks = new Map<string, AppointmentEvent>();

    events.forEach((event) => {
      const start = parseDateSafe(event.start);
      if (!start) return;
      blocks.set(`${formatDateKey(start)}-${start.getHours()}`, event);
    });

    return blocks;
  }, [events]);

  const renderAppointmentCell = (event: AppointmentEvent) => {
    const start = parseDateSafe(event.start);
    const end = parseDateSafe(event.end || event.start);
    if (!start || !end) return null;
    const status = normalizeText(event.status).toLowerCase();
    const statusClass =
      status === "pending" || status === "requested"
        ? "border-amber-200 bg-amber-100 text-amber-950"
        : status === "cancelled" || status === "rejected"
          ? "border-rose-200 bg-rose-100 text-rose-950"
          : "border-emerald-200 bg-emerald-100 text-emerald-950";

    return (
      <button
        key={event.id || `${event.title}-${event.start}`}
        type="button"
        onClick={() => {
          setSelectedAppointment(event);
          setIsAppointmentDetailOpen(true);
        }}
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden rounded-none border px-2 text-center shadow-sm transition-colors hover:brightness-95",
          statusClass,
        )}
        title={`Cita: ${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}`}
      >
        <p className="truncate text-xs font-black uppercase tracking-[0.12em]">
          Cita: {formatTimeInTimeZone(start, calendarTimeZone)} - {formatTimeInTimeZone(end, calendarTimeZone)}
        </p>
      </button>
    );
  };

  const todayKey = formatDateKey(now);

  return (
    <FeatureGate
      feature="appointments.access"
      message="La gestión de citas está disponible desde Pro."
    >
      {isLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Cargando citas</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Preparando calendario, disponibilidad y solicitudes.</p>
            </div>
          </div>
        </div>
      ) : (
    <div className="space-y-6">
      <section className="flex flex-wrap gap-2">
        {SCHEDULE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all",
              activeTab === tab.key
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {tab.label}
            {tab.key === "citas" && pendingRequestsCount > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[9px] font-black text-white">
                {pendingRequestsCount}
              </span>
            ) : null}
          </button>
        ))}
      </section>

      {activeTab === "schedule" ? (
        <section ref={calendarSectionRef} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                title="Modificar mis horarios laborales"
                aria-label="Modificar mis horarios laborales"
                className="h-11 rounded-full border border-indigo-200 bg-indigo-50 px-4 text-xs font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm hover:bg-indigo-100"
                onClick={startEditingWorkHours}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Modificar mis horarios laborales
              </Button>
              {(hasWorkingHours || isEditingWorkHours) && (
                <>
                  <Button type="button" title="Crear cita" aria-label="Crear cita" className="h-11 w-11 rounded-full bg-indigo-600 p-0 text-white shadow-sm hover:bg-indigo-700" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" title="Actualizar" aria-label="Actualizar" className="h-11 w-11 rounded-full border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50" onClick={() => void handleRefresh()} disabled={isRefreshing}>
                    <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                  <Button type="button" variant="outline" title="Compartir horario" aria-label="Compartir horario" className="h-11 w-11 rounded-full border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50" onClick={() => void handleShareSchedule()} disabled={isCreatingShareLink || isLoading}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm">
                <input
                  type="checkbox"
                  checked={showNonWorkingHours}
                  onChange={(event) => setShowNonWorkingHours(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Mostrar horarios no laborales
              </label>
              <Button type="button" variant="outline" title="Semana anterior" aria-label="Semana anterior" className="h-11 w-11 rounded-full border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50" onClick={() => setWeekAnchor((current) => addDays(current, -7))}>
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button type="button" variant="outline" title="Ir a hoy" aria-label="Ir a hoy" className="h-11 w-11 rounded-full border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50" onClick={() => setWeekAnchor(new Date())}>
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" title="Siguiente semana" aria-label="Siguiente semana" className="h-11 w-11 rounded-full border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50" onClick={() => setWeekAnchor((current) => addDays(current, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Google Calendar</p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  {calendar?.googleCalendarConnected ? "Conectado y sincronizando disponibilidad" : "No conectado"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {calendar?.googleCalendarConnected
                    ? `Cuenta: ${calendar.googleCalendarEmail || "correo no disponible"}`
                    : "Conéctalo para bloquear horarios ocupados en Google y sincronizar citas automáticamente."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {calendar?.googleCalendarConnected ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-full border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.16em] text-slate-600"
                      onClick={() => void handleGoogleResync()}
                      disabled={isGoogleResyncing}
                    >
                      {isGoogleResyncing ? "Re-sincronizando..." : "Re-sincronizar"}
                    </Button>
                    <Button
                      type="button"
                      className="h-10 rounded-full bg-emerald-600 px-4 text-xs font-black uppercase tracking-[0.16em] text-white"
                      onClick={() => void handleRefresh()}
                    >
                      Actualizar estado
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-full border-rose-200 bg-rose-50 px-4 text-xs font-black uppercase tracking-[0.16em] text-rose-700 hover:bg-rose-100"
                      onClick={() => setIsGoogleDisconnectConfirmOpen(true)}
                      disabled={isGoogleDisconnecting}
                    >
                      Desconectar
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    className="h-10 rounded-full bg-indigo-600 px-4 text-xs font-black uppercase tracking-[0.16em] text-white"
                    onClick={() => void handleGoogleConnect()}
                    disabled={isGoogleConnecting}
                  >
                    {isGoogleConnecting ? "Conectando..." : "Conectar Google Calendar"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile day selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 shrink-0 rounded-full border-slate-200 bg-white p-0"
              onClick={() => setMobileDayOffset((c) => c - 1)}
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
            </Button>
            {weekDays.map((day, i) => {
              const isToday = formatDateKey(day) === todayKey;
              const isSelected = i === mobileDayOffset;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMobileDayOffset(i)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isToday
                        ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {day.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" })}
                </button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 shrink-0 rounded-full border-slate-200 bg-white p-0"
              onClick={() => setMobileDayOffset((c) => Math.min(c + 1, 6))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            {isEditingWorkHours && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-200">
                    Laboral
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                    No laboral
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Toca un bloque para activarlo o desactivarlo.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.18em] text-slate-600"
                    onClick={() => { setWorkHoursGridDraft(createWorkHoursGridFromRules(workHoursDraft)); setIsEditingWorkHours(false); }}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" className="h-10 rounded-full bg-slate-900 px-4 text-xs font-black uppercase tracking-[0.18em] text-white" onClick={() => void handleSaveWorkHours()} isLoading={isSavingHours}>
                    Guardar
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex h-[820px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : showWorkHoursEmptyState ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Settings2 className="h-7 w-7" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Horarios laborales
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  Aún no has configurado tus horarios
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Antes de mostrar el calendario, define qué bloques de tiempo son laborales.
                  Puedes comenzar con un horario vacío y activar solo los bloques que quieras.
                </p>
                <Button
                  type="button"
                  className="mt-6 h-11 rounded-full bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-sm hover:bg-slate-800"
                  onClick={startEditingWorkHours}
                >
                  Modificar mis horarios laborales
                </Button>
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  {(() => {
                    const mobileDay = weekDays[mobileDayOffset];
                    const mobileDayKey = WEEK_DAYS[getWeekDayIndex(mobileDay)].key;
                    const mobileIsToday = formatDateKey(mobileDay) === todayKey;
                    const mobileDayGrid = workHoursGridDraft[mobileDayKey] || [];

                    return (
                      <div className="divide-y divide-slate-100">
                        <div className={cn("px-4 py-3 flex items-center justify-between", mobileIsToday && "bg-emerald-50/60")}>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                              {mobileDay.toLocaleDateString("es-CL", { weekday: "long" })}
                            </p>
                            <p className="text-sm font-bold text-slate-900">
                              {mobileDay.toLocaleDateString("es-CL", { day: "2-digit", month: "long" })}
                            </p>
                          </div>
                          {mobileIsToday && (
                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                              Hoy
                            </span>
                          )}
                        </div>
                        {visibleHours.map((hour) => {
                          const gridIndex = hour - HOUR_START;
                          const isEditableHour = hour < HOUR_END;
                          const isWorkingHour = isEditingWorkHours
                            ? Boolean(mobileDayGrid[gridIndex])
                            : isHourWithinRule(mobileDay, hour, workHoursDraft);
                          const appointment = appointmentBlocks.get(`${formatDateKey(mobileDay)}-${hour}`);

                          return (
                            <div
                              key={hour}
                              className={cn("flex items-center gap-3 px-4 py-3", !isWorkingHour && !appointment && "opacity-40")}
                            >
                              <span className="w-12 shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {formatHourLabel(hour)}
                              </span>
                              {appointment ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsAppointmentDetailOpen(true);
                                  }}
                                  className="flex-1 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-left text-xs font-bold text-emerald-900"
                                >
                                  {appointment.title}
                                </button>
                              ) : isWorkingHour ? (
                                <button
                                  type="button"
                                  onClick={() => openCreateFromGrid(mobileDay, hour)}
                                  className={cn(
                                    "flex-1 rounded-xl border px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] transition-colors",
                                    isEditingWorkHours
                                      ? mobileDayGrid[gridIndex]
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-50 text-slate-500"
                                      : "border-dashed border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70",
                                  )}
                                >
                                  {isEditingWorkHours
                                    ? mobileDayGrid[gridIndex]
                                      ? "Laboral"
                                      : "No laboral"
                                    : "Laboral"}
                                </button>
                              ) : isEditableHour ? (
                                <span className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  No laboral
                                </span>
                              ) : (
                                <span className="flex-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <div className="min-w-[1024px]">
                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white">
                      <div className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Hora</div>
                      {weekDays.map((day) => {
                        const isToday = formatDateKey(day) === todayKey;
                        return (
                          <div key={day.toISOString()} className={cn("border-l border-slate-100 px-3 py-3 transition-colors", isToday && "border-emerald-200 bg-emerald-50/80")}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{formatDayLabel(day)}</p>
                            <p className="mt-1 text-xs font-bold text-slate-900">{day.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}</p>
                            {isToday && <span className="mt-2 inline-flex rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">Hoy</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                      <div className="relative bg-white">
                        {visibleHours.map((hour) => {
                          return (
                            <div key={hour} className="flex h-16 items-start justify-end border-b border-slate-100 px-2 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {formatHourLabel(hour)}
                            </div>
                          );
                        })}
                      </div>

                      {weekDays.map((day) => {
                        const dayKey = WEEK_DAYS[getWeekDayIndex(day)].key;
                        const dayHasWorkingWindow = workHoursDraft.some((rule) => rule.day === dayKey && rule.enabled);
                        const dayGrid = workHoursGridDraft[dayKey] || [];
                        const isToday = formatDateKey(day) === todayKey;
                        const currentMinutes = now.getHours() * 60 + now.getMinutes();
                        const currentLineTop = ((currentMinutes / 60) - visibleHourStart) * ROW_HEIGHT;
                        const showCurrentLine = isToday && currentLineTop >= 0 && currentLineTop <= visibleHoursHeight;

                        return (
                          <div key={day.toISOString()} className={cn("relative border-l border-slate-100 bg-white transition-colors", isToday && "bg-emerald-50/30 ring-1 ring-inset ring-emerald-200/70")} style={{ minHeight: visibleHoursHeight }}>
                            {visibleHours.map((hour) => {
                              const gridIndex = hour - HOUR_START;
                              const isSelectedHour = Boolean(dayGrid[gridIndex]);
                              const isWorkingHour = isEditingWorkHours ? isSelectedHour : isHourWithinRule(day, hour, workHoursDraft);
                              const isEditableHour = hour < HOUR_END;
                              const appointment = appointmentBlocks.get(`${formatDateKey(day)}-${hour}`);

                              return (
                                <div key={hour} className="h-16 w-full border-b border-slate-100">
                                  {!isEditingWorkHours && appointment ? (
                                    renderAppointmentCell(appointment)
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isEditableHour) return;
                                        if (isEditingWorkHours) {
                                          setWorkHoursGridDraft((current) => {
                                            if (gridIndex < 0 || gridIndex >= (current[dayKey]?.length || 0)) return current;
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
                                              : `No disponible (${formatHourLabel(hour)})`
                                      }
                                      className={cn(
                                        "flex h-full w-full items-center justify-center transition-colors",
                                        !isEditableHour
                                          ? isEditingWorkHours
                                            ? "cursor-pointer bg-slate-100/70 hover:bg-slate-200"
                                            : "cursor-default bg-white"
                                          : isEditingWorkHours
                                            ? isSelectedHour
                                              ? "cursor-pointer bg-emerald-50 hover:bg-emerald-100"
                                              : "cursor-pointer bg-slate-50/80 hover:bg-slate-100"
                                            : isWorkingHour
                                              ? isToday
                                                ? "cursor-pointer bg-emerald-50/70 hover:bg-emerald-100/70"
                                                : "cursor-pointer bg-emerald-50/40 hover:bg-emerald-100/60"
                                              : isToday
                                                ? "cursor-default bg-slate-50/30"
                                                : "cursor-default bg-slate-100/70",
                                      )}
                                    >
                                      {!isEditingWorkHours && isWorkingHour && isEditableHour && (
                                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                                          Laboral
                                        </span>
                                      )}
                                      {!isEditingWorkHours && !isWorkingHour && isEditableHour && (
                                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                          No laboral
                                        </span>
                                      )}
                                      {isEditingWorkHours && isEditableHour && (
                                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", isSelectedHour ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500")}>
                                          {isSelectedHour ? "Laboral" : "No laboral"}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            {showCurrentLine && !isEditingWorkHours && (
                              <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: currentLineTop }}>
                                <div className="relative h-0">
                                  <div className="absolute left-0 right-0 top-0 border-t-2 border-rose-500" />
                                  <span className="absolute -top-2 left-2 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
                                    Ahora
                                  </span>
                                </div>
                              </div>
                            )}
                            {!isEditingWorkHours && !dayHasWorkingWindow && <div className="pointer-events-none absolute inset-0 bg-slate-100/35" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
        </section>
) : activeTab === "upcoming" ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="p-3 sm:p-6">
            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <div className="min-w-[640px] overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Motivo</th>
                      <th className="py-3 px-4">Google Meet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingEvents.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-slate-400 text-center" colSpan={5}>
                          No hay próximas citas.
                        </td>
                      </tr>
                    ) : (
                      upcomingEvents.map((event) => {
                        const start = parseDateSafe(event.start);
                        const end = parseDateSafe(event.end || event.start);
                        return (
                          <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {start && end ? `${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}` : "--"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{event.patientName || "Paciente pendiente"}</td>
                            <td className="px-4 py-3 text-slate-600">{event.title}</td>
                            <td className="px-4 py-3 text-slate-400">---</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Mobile cards */}
            <div className="block sm:hidden space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No hay próximas citas.</p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const start = parseDateSafe(event.start);
                  const end = parseDateSafe(event.end || event.start);
                  return (
                    <div key={event.id} className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                          {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short" }) : "--"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {start && end ? `${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}` : "--"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{event.title}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{event.patientName || "Paciente pendiente"}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3 sm:p-4">
            {CITAS_TABS.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveCitasTab(tab.key)} className={cn("rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all", activeCitasTab === tab.key ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700")}>{tab.label}{tab.key === "pending" && pendingRequestsCount > 0 ? <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[9px] font-black text-white">{pendingRequestsCount}</span> : null}</button>
            ))}
          </div>

          <div className="p-3 sm:p-6">
            {activeCitasTab === "accepted" && (
              <>
                {/* Desktop table */}
                <div className="overflow-x-auto hidden sm:block">
                  <div className="min-w-[640px] overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Hora</th>
                          <th className="py-3 px-4">Paciente</th>
                          <th className="py-3 px-4">Motivo</th>
                          <th className="py-3 px-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.filter(e => ["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(e.status) && parseDateSafe(e.start) && parseDateSafe(e.start)!.getTime() >= Date.now()).length === 0 ? (
                          <tr>
                            <td className="px-4 py-8 text-slate-400 text-center" colSpan={5}>Sin citas aceptadas.</td>
                          </tr>
                        ) : (
                          events.filter(e => ["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(e.status) && parseDateSafe(e.start) && parseDateSafe(e.start)!.getTime() >= Date.now()).map((event) => {
                            const start = parseDateSafe(event.start);
                            const end = parseDateSafe(event.end || event.start);
                            return (
                              <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {start && end ? `${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}` : "--"}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{event.patientName || "--"}</td>
                                <td className="px-4 py-3 text-slate-600">
                                  <div className="flex flex-col gap-2">
                                    <span>{event.title}</span>
                                    {event.googleCalendarSyncError ? (
                                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700 ring-1 ring-rose-100">
                                        <TriangleAlert className="h-3 w-3" />
                                        Sync falló
                                      </span>
                                    ) : event.googleCalendarSyncedAt ? (
                                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
                                        <CalendarCheck2 className="h-3 w-3" />
                                        En Google Calendar
                                      </span>
                                    ) : null}
                                    {event.googleCalendarHtmlLink ? (
                                      <a
                                        href={event.googleCalendarHtmlLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                                      >
                                        Ver evento
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
                                    {["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(event.status) ? "Confirmada" : "Agendada"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Mobile cards */}
                <div className="block sm:hidden space-y-3">
                  {events.filter(e => ["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(e.status) && parseDateSafe(e.start) && parseDateSafe(e.start)!.getTime() >= Date.now()).length === 0 ? (
                    <div className="text-center py-10">
                      <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Sin citas aceptadas.</p>
                    </div>
                  ) : (
                    events.filter(e => ["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(e.status) && parseDateSafe(e.start) && parseDateSafe(e.start)!.getTime() >= Date.now()).map((event) => {
                      const start = parseDateSafe(event.start);
                      const end = parseDateSafe(event.end || event.start);
                      return (
                        <div key={event.id} className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short" }) : "--"}
                            </span>
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">
                              {["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(event.status) ? "Confirmada" : "Agendada"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-slate-900">{event.title}</p>
                            {event.googleCalendarSyncError ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700 ring-1 ring-rose-100">
                                <TriangleAlert className="h-3 w-3" />
                                Sync falló
                              </span>
                            ) : event.googleCalendarSyncedAt ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
                                <CalendarCheck2 className="h-3 w-3" />
                                Sincronizada
                              </span>
                            ) : null}
                          </div>
                          {event.googleCalendarHtmlLink ? (
                            <a
                              href={event.googleCalendarHtmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Ver en Google Calendar
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                          <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-slate-500">
                            <span>{start && end ? `${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}` : "--"}</span>
                            <span>·</span>
                            <span>{event.patientName || "--"}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {activeCitasTab === "pending" && (
              <>
                {calendarRequestsQuery.isFetching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="overflow-x-auto hidden sm:block">
                      <div className="min-w-[640px] overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <th className="py-3 px-4">Fecha</th>
                              <th className="py-3 px-4">Hora</th>
                              <th className="py-3 px-4">Paciente</th>
                              <th className="py-3 px-4">Motivo</th>
                              <th className="py-3 px-4 w-40">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {requests.length === 0 ? (
                              <tr>
                                <td className="px-4 py-8 text-slate-400 text-center" colSpan={5}>No hay citas pendientes.</td>
                              </tr>
                            ) : (
                              requests.map((apt: AppointmentRequest) => {
                                const start = parseDateSafe(apt.start);
                                const end = parseDateSafe(apt.end || apt.start);
                                return (
                                  <tr key={apt.id} className="border-b border-slate-100 last:border-b-0">
                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {start && end ? `${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}` : "--"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{apt.patientName || "--"}</td>
                                    <td className="px-4 py-3 text-slate-600">{apt.description || apt.title}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2">
                                         <Button size="sm" className="h-8 rounded-full bg-emerald-600 px-4 text-[9px] font-black uppercase tracking-widest text-white" onClick={() => openAcceptAppointmentConfirmation(apt)}>Aceptar</Button>
                                        <Button size="sm" variant="outline" className="h-8 rounded-full border-rose-200 px-4 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50" onClick={() => handleRejectAppointment(apt.id)}>Rechazar</Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Mobile cards */}
                    <div className="block sm:hidden space-y-3">
                      {requests.length === 0 ? (
                        <div className="text-center py-10">
                          <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-medium">No hay citas pendientes.</p>
                        </div>
                        ) : (
                            requests.map((apt: AppointmentRequest) => {
                            const start = parseDateSafe(apt.start);
                            const end = parseDateSafe(apt.end || apt.start);
                            return (
                              <div key={apt.id} className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                    Pendiente
                                  </span>
                                  {start && end ? (
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short" })} · {formatTimeInTimeZone(start, calendarTimeZone)} - {formatTimeInTimeZone(end, calendarTimeZone)}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm font-bold text-slate-900">{apt.description || apt.title}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">{apt.patientName || "Paciente"}</p>
                              <div className="flex gap-2 mt-3 pt-3 border-t border-amber-100">
                                <Button size="sm" className="flex-1 h-9 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white" onClick={() => openAcceptAppointmentConfirmation(apt)}>Aceptar</Button>
                                <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl border-rose-200 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50" onClick={() => handleRejectAppointment(apt.id)}>Rechazar</Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {activeCitasTab === "rejected" && (
              <>
                {/* Desktop table */}
                <div className="overflow-x-auto hidden sm:block">
                  <div className="min-w-[640px] overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Hora</th>
                          <th className="py-3 px-4">Paciente</th>
                          <th className="py-3 px-4">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.filter(e => e.status === "rejected" || e.status === "REJECTED").length === 0 ? (
                          <tr>
                            <td className="px-4 py-8 text-slate-400 text-center" colSpan={4}>Sin citas rechazadas.</td>
                          </tr>
                        ) : (
                          events.filter(e => e.status === "rejected" || e.status === "REJECTED").map((event) => {
                            const start = parseDateSafe(event.start);
                            const end = parseDateSafe(event.end || event.start);
                            return (
                              <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-4 py-3 font-medium text-slate-400">
                                  {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                                </td>
                                <td className="px-4 py-3 text-slate-400">
                                  {start && end ? `${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}` : "--"}
                                </td>
                                <td className="px-4 py-3 text-slate-400">{event.patientName || "--"}</td>
                                <td className="px-4 py-3 text-slate-400">{event.title}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Mobile cards */}
                <div className="block sm:hidden space-y-3">
                  {events.filter(e => e.status === "rejected" || e.status === "REJECTED").length === 0 ? (
                    <div className="text-center py-10">
                      <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Sin citas rechazadas.</p>
                    </div>
                  ) : (
                    events.filter(e => e.status === "rejected" || e.status === "REJECTED").map((event) => {
                      const start = parseDateSafe(event.start);
                      const end = parseDateSafe(event.end || event.start);
                      return (
                        <div key={event.id} className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm opacity-60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700">
                              Rechazada
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {start ? formatDateInTimeZone(start, calendarTimeZone, { day: "2-digit", month: "short" }) : "--"}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-500">{event.title}</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">{event.patientName || "--"}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}

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
              <p className="text-sm font-black text-slate-900">Paciente asociado</p>
              <p className="text-xs text-slate-500">Opcional. Puedes crear la cita solo con nombre.</p>
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

          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{selectedPatient.fullName}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{selectedPatient.email || "Sin correo"}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setCreateDraft((current) => ({ ...current, patientId: "", patientName: "", patientEmail: "" }));
                }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nombre del paciente</label>
              <Input
                value={createDraft.patientName}
                onChange={(event) => setCreateDraft((current) => ({ ...current, patientName: event.target.value }))}
                className="h-12 rounded-xl"
                placeholder="Nombre y apellido"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Correo (opcional)</label>
              <Input
                type="email"
                value={createDraft.patientEmail}
                onChange={(event) => setCreateDraft((current) => ({ ...current, patientEmail: event.target.value }))}
                className="h-12 rounded-xl"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {selectedPatientPortalStatus === "ACTIVE" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              El paciente podrá ver su cita en su portal
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Hora de la sesión</label>
              <Input
                type="time"
                value={createDraft.time}
                onChange={(event) => setCreateDraft((current) => ({ ...current, time: event.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Duración (min, máx. 60)</label>
              <Input
                type="number"
                min={5}
                max={60}
                step={5}
                value={createDraft.durationMin}
                onChange={(event) => setCreateDraft((current) => ({ ...current, durationMin: Number(event.target.value) || 30 }))}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Descripción de la cita</label>
              <Textarea
                value={createDraft.description}
                onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[120px] rounded-xl"
                placeholder="Describe la cita..."
              />
            </div>
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-black text-slate-900">Confirmación antes de guardar</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <span className={cn("rounded-full px-3 py-1", Boolean(selectedPatient?.email || isValidEmail(createDraft.patientEmail)) ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500")}>
                  Correo {Boolean(selectedPatient?.email || isValidEmail(createDraft.patientEmail)) ? "disponible" : "no disponible"}
                </span>
                <span className={cn("rounded-full px-3 py-1", isGoogleCalendarConnected ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500")}>
                  Google {isGoogleCalendarConnected ? "conectado" : "no conectado"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Al presionar <span className="font-bold">Crear cita</span> se abrirá una confirmación para decidir si se envía correo y si se sincroniza con Google Calendar.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="h-11 rounded-xl px-5 font-black" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="h-11 rounded-xl bg-emerald-600 px-5 font-black text-white"
              onClick={() => openCreateAppointmentConfirmation()}
              disabled={isLoadingPatientPortalStatus || !createDraft.patientName.trim() || !createDraft.description.trim()}
            >
              Crear cita
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(pendingAppointmentConfirmation)}
        onClose={() => setPendingAppointmentConfirmation(null)}
        onConfirm={() => void handleConfirmAppointmentAction()}
        title={
          pendingAppointmentConfirmation?.kind === "create"
            ? "Confirmar cita"
            : "Aceptar cita pendiente"
        }
        description={
          pendingAppointmentConfirmation?.kind === "create"
            ? "Revisa si quieres notificar al paciente por correo y sincronizar esta cita con Google Calendar."
            : "Revisa si quieres notificar al paciente y sincronizar la cita aceptada con Google Calendar."
        }
        confirmText={
          pendingAppointmentConfirmation?.kind === "create"
            ? "Crear cita"
            : "Aceptar cita"
        }
        isLoading={isSubmittingAppointmentConfirmation}
        size="lg"
      >
        {pendingAppointmentConfirmation ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resumen</p>
              <p className="mt-1 text-sm font-black text-slate-900 truncate">
                {pendingAppointmentConfirmation.patientName}
              </p>
              <p className="text-xs font-medium text-slate-500 truncate">
                {pendingAppointmentConfirmation.description}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                {(() => {
                  const start = parseDateSafe(pendingAppointmentConfirmation.start);
                  const end = parseDateSafe(pendingAppointmentConfirmation.end);
                  return start && end
                    ? `${formatDateInTimeZone(start, calendarTimeZone, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })} · ${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}`
                    : "Horario pendiente de validar";
                })()}
              </p>
            </div>

            {pendingAppointmentConfirmation.canNotifyPatientByEmail ? (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={pendingAppointmentConfirmation.notifyPatientByEmail}
                  onChange={(event) =>
                    setPendingAppointmentConfirmation((current) =>
                      current
                        ? { ...current, notifyPatientByEmail: event.target.checked }
                        : current,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <div>
                  <p className="text-sm font-black text-slate-900">Comunicar al paciente por correo</p>
                  <p className="text-xs font-medium text-slate-500">
                    {pendingAppointmentConfirmation.patientEmail
                      ? pendingAppointmentConfirmation.patientEmail
                      : "Se enviará usando el correo disponible del paciente."}
                  </p>
                </div>
              </label>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                No hay un correo válido para notificar al paciente.
              </div>
            )}

            {pendingAppointmentConfirmation.canSyncGoogleCalendar ? (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={pendingAppointmentConfirmation.syncGoogleCalendar}
                  onChange={(event) =>
                    setPendingAppointmentConfirmation((current) =>
                      current
                        ? { ...current, syncGoogleCalendar: event.target.checked }
                        : current,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <div>
                  <p className="text-sm font-black text-slate-900">Añadir a mi Google Calendar</p>
                  <p className="text-xs font-medium text-slate-500">
                    Solo está disponible porque tu calendario está sincronizado con Google.
                  </p>
                </div>
              </label>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                Google Calendar no está sincronizado, así que no se enviará ese evento.
              </div>
            )}
          </div>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isGoogleDisconnectConfirmOpen}
        onClose={() => setIsGoogleDisconnectConfirmOpen(false)}
        onConfirm={() => void handleGoogleDisconnect()}
        title="Desconectar Google Calendar"
        description="Se detendrá la sincronización con Google Calendar y las citas nuevas ya no se enviarán a esa cuenta hasta que vuelvas a conectar."
        confirmText="Desconectar"
        variant="warning"
        isLoading={isGoogleDisconnecting}
      />

      <Modal 
        isOpen={isShareLinkOpen} 
        onClose={() => setIsShareLinkOpen(false)} 
        title="Compartir mi horario"
        className="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna Izquierda: QR e Instrucciones */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
              <h4 className="text-sm font-black text-sky-900 flex items-center gap-2">
                <BadgeInfo className="h-4 w-4" />
                Instrucciones para pacientes
              </h4>
              <p className="mt-2 text-sm font-medium text-sky-800/80 leading-relaxed">
                Comparte este código o enlace. Tus pacientes podrán ver tu disponibilidad en tiempo real y agendar una cita directamente.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/30 p-6">
              {shareLinkUrl ? (
                <>
                  <div className="p-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50">
                    <QRCodeSVG value={shareLinkUrl} size={180} includeMargin={true} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Acceso Directo QR</p>
                    <p className="text-[9px] font-medium text-slate-300 mt-1">Escanea para reservar al instante</p>
                  </div>
                </>
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-3xl bg-white shadow-inner">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Enlaces y Email */}
          <div className="space-y-8 py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nutricionista</label>
                <Input value={shareLinkNutritionistName} readOnly className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold text-slate-600" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Enlace de reserva</label>
                <div className="flex gap-2">
                  <Input value={shareLinkUrl} readOnly className="h-12 rounded-2xl bg-white border-slate-100 font-mono text-[10px] focus:ring-indigo-500/10" />
                  <Button 
                    variant="outline" 
                    className="h-12 w-12 shrink-0 rounded-2xl border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(shareLinkUrl);
                      toast.success("Enlace copiado al portapapeles");
                    }}
                  >
                    <ClipboardCopy className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Enviar por correo</h4>
                  <p className="text-[11px] font-medium text-slate-400 px-1">
                    {shareMode === "manual" 
                      ? "Ingresa el correo del destinatario." 
                      : "Busca y selecciona un paciente."}
                  </p>
                </div>
                
                {/* Switch para modo de envío */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                  <button 
                    onClick={() => {
                      setShareMode("manual");
                      setSelectedPatient(null);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all",
                      shareMode === "manual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Manual
                  </button>
                  <button 
                    onClick={() => setShareMode("patient")}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all",
                      shareMode === "patient" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Paciente
                  </button>
                </div>
              </div>

              {shareMode === "manual" ? (
                <div className="flex gap-2">
                  <Input 
                    placeholder="paciente@correo.com" 
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="h-12 rounded-2xl border-slate-100 bg-white font-medium focus:ring-emerald-500/10" 
                  />
                  <Button 
                    className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      placeholder="Buscar por nombre o correo..." 
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="h-12 pl-11 rounded-2xl border-slate-100 bg-white font-medium focus:ring-indigo-500/10" 
                    />
                    {isLoadingPatients && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>

                  {patientCandidates.length > 0 && !selectedPatient && (
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {patientCandidates.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setShareEmail(p.email || "");
                            setPatientSearchQuery("");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] uppercase border border-indigo-100">
                              {p.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{p.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{p.email || "Sin correo"}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase shadow-md shadow-indigo-200">
                          {selectedPatient.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{selectedPatient.fullName}</p>
                          <p className="text-[10px] text-indigo-600 font-bold truncate">{selectedPatient.email || "Sin correo"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedPatient(null);
                            setShareEmail("");
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Button 
                          size="sm"
                          className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 transition-all active:scale-[0.95] shadow-lg shadow-indigo-100"
                          onClick={handleSendEmail}
                          disabled={isSendingEmail || !selectedPatient.email}
                        >
                          {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="ghost" className="h-12 rounded-2xl px-8 font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-50" onClick={() => setIsShareLinkOpen(false)}>
            Cerrar Ventana
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isAppointmentDetailOpen} onClose={() => setIsAppointmentDetailOpen(false)} title="Detalle de cita">
        {selectedAppointment ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Horario</p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {(() => {
                  const start = parseDateSafe(selectedAppointment.start);
                  const end = parseDateSafe(selectedAppointment.end || selectedAppointment.start);
                  return start && end
                    ? `${formatDateInTimeZone(start, calendarTimeZone, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} · ${formatTimeInTimeZone(start, calendarTimeZone)} - ${formatTimeInTimeZone(end, calendarTimeZone)}`
                    : "--";
                })()}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Título</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.title}</p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Paciente</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.patientName || "Paciente pendiente"}</p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Estado</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedAppointment.status}</p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Notas</p>
              <p className="mt-1 text-sm text-slate-600">{selectedAppointment.notes || "Sin notas."}</p>
            </div>

            {(["confirmed", "CONFIRMED", "scheduled", "SCHEDULED"].includes(selectedAppointment.status)) ? (
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-rose-200 px-4 text-xs font-black uppercase tracking-[0.18em] text-rose-600 hover:bg-rose-50"
                  disabled={isCancellingAppointment}
                  onClick={() => void handleCancelAppointment(selectedAppointment.id)}
                >
                  {isCancellingAppointment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCancellingAppointment ? "Cancelando..." : "Cancelar cita"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

    </div>
      )}
    </FeatureGate>

  );
}





