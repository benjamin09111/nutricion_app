"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Loader2, MapPin, Mail, Phone, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  AppointmentSlot,
  createBookingLinkRequest,
  fetchAppointmentsJson,
  fetchBookingLink,
} from "@/lib/appointments";
import { cn } from "@/lib/utils";

type BookingPreview = {
  token?: string;
  calendarId?: string;
  nutritionistId?: string;
  nutritionistName?: string;
  title?: string;
  description?: string;
  timeZone?: string;
  timezone?: string;
  metadata?: Record<string, unknown> | null;
};

type BookingFormState = {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  notes: string;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const extractArray = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.results, record.slots];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const normalizeBookingPreview = (payload: unknown): BookingPreview | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const source =
    (record.bookingLink && typeof record.bookingLink === "object" ? record.bookingLink : null) ||
    (record.data && typeof record.data === "object" && !Array.isArray(record.data) ? record.data : null) ||
    payload;

  if (!source || typeof source !== "object") return null;

  const booking = source as Record<string, unknown>;
  return {
    token: normalizeText(booking.token),
    calendarId:
      normalizeText(booking.calendarId) ||
      normalizeText((booking.calendar as Record<string, unknown> | undefined)?.id) ||
      normalizeText((booking.calendar as Record<string, unknown> | undefined)?.calendarId),
    nutritionistId: normalizeText(booking.nutritionistId) || normalizeText(booking.nutriId),
    nutritionistName:
      normalizeText(booking.nutritionistName) ||
      normalizeText((booking.calendar as Record<string, unknown> | undefined)?.name) ||
      normalizeText((booking.calendar as Record<string, unknown> | undefined)?.title),
    title: normalizeText(booking.title),
    description: normalizeText(booking.description),
    timeZone:
      normalizeText(booking.timeZone) ||
      normalizeText(booking.timezone) ||
      normalizeText((booking.calendar as Record<string, unknown> | undefined)?.timeZone) ||
      normalizeText((booking.calendar as Record<string, unknown> | undefined)?.timezone),
    timezone: normalizeText(booking.timezone),
    metadata:
      booking.metadata && typeof booking.metadata === "object" && !Array.isArray(booking.metadata)
        ? (booking.metadata as Record<string, unknown>)
        : null,
  };
};

const normalizeSlots = (payload: unknown): AppointmentSlot[] =>
  extractArray(payload)
    .map((item): AppointmentSlot | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        start: normalizeText(record.start || record.startAt),
        end: normalizeText(record.end || record.endAt),
        available:
          typeof record.available === "boolean"
            ? record.available
            : typeof record.isAvailable === "boolean"
              ? record.isAvailable
              : normalizeText(record.status).toUpperCase() === "AVAILABLE",
        status: normalizeText(record.status),
        title: normalizeText(record.title),
        label: normalizeText(record.label),
        patientName: normalizeText(record.patientName),
        notes: normalizeText(record.notes),
      };
    })
    .filter((item): item is AppointmentSlot => item !== null);

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

const formatDateKey = (date: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatDayLabel = (date: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("es-CL", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);

const formatHourLabel = (date: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("es-CL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const getWeekDays = (anchor: Date) => {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
};

const getInitialForm = (): BookingFormState => ({
  fullName: "",
  email: "",
  phone: "",
  reason: "",
  notes: "",
});

export default function BookingLinkClient({
  nutriId,
  token,
}: {
  nutriId: string;
  token: string;
}) {
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [form, setForm] = useState<BookingFormState>(getInitialForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const calendarId = preview?.calendarId || "";
  const timeZone = preview?.timeZone || preview?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const slotDurationMin = useMemo(() => {
    const rawDuration = preview?.metadata ? preview.metadata["durationMin"] : undefined;
    if (typeof rawDuration === "number" || typeof rawDuration === "string") {
      const nextValue = Number(rawDuration);
      return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 30;
    }
    return 30;
  }, [preview]);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const groupedSlots = useMemo(() => {
    const map = new Map<string, AppointmentSlot[]>();
    weekDays.forEach((day) => map.set(formatDateKey(day, timeZone), []));

    slots.forEach((slot) => {
      const start = parseDateSafe(slot.start);
      if (!start) return;
      const key = formatDateKey(start, timeZone);
      const current = map.get(key);
      if (current) current.push(slot);
    });

    for (const value of map.values()) {
      value.sort((left, right) => {
        const leftStart = parseDateSafe(left.start)?.getTime() || 0;
        const rightStart = parseDateSafe(right.start)?.getTime() || 0;
        return leftStart - rightStart;
      });
    }

    return map;
  }, [slots, timeZone, weekDays]);

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.available !== false),
    [slots],
  );

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const payload = await fetchBookingLink(token);
        const nextPreview = normalizeBookingPreview(payload);
        if (!nextPreview?.calendarId) {
          throw new Error("No pudimos encontrar el calendario compartido.");
        }

        if (!cancelled) {
          setPreview(nextPreview);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "No pudimos abrir este horario.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!calendarId) return;

    let cancelled = false;

    const loadSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const from = `${formatDateKey(weekStart, timeZone)}T00:00:00.000Z`;
        const to = `${formatDateKey(weekEnd, timeZone)}T23:59:59.999Z`;
        const payload = await fetchAppointmentsJson<unknown>(
          `/calendars/${calendarId}/slots?from=${from}&to=${to}&durationMin=${slotDurationMin}`,
        );
        const nextSlots = normalizeSlots(payload);
        if (!cancelled) {
          setSlots(nextSlots);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading booking slots", error);
          toast.error(error instanceof Error ? error.message : "No pudimos cargar los horarios disponibles.");
          setSlots([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      }
    };

    void loadSlots();

    return () => {
      cancelled = true;
    };
  }, [calendarId, slotDurationMin, timeZone, weekEnd, weekStart]);

  useEffect(() => {
    if (availableSlots.length === 0) {
      setSelectedSlot(null);
      return;
    }

    setSelectedSlot((current) => {
      if (!current) return availableSlots[0];
      const stillVisible = availableSlots.some(
        (slot) => slot.start === current.start && slot.end === current.end,
      );
      return stillVisible ? current : availableSlots[0];
    });
  }, [availableSlots]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedSlot?.start || !selectedSlot?.end) {
      toast.error("Primero selecciona un horario libre.");
      return;
    }

    if (!form.fullName.trim() || !form.email.trim() || !form.reason.trim()) {
      toast.error("Completa nombre, correo y motivo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        calendarId,
        nutriId,
        nutritionistId: preview?.nutritionistId || nutriId,
        patientName: form.fullName.trim(),
        fullName: form.fullName.trim(),
        name: form.fullName.trim(),
        patientEmail: form.email.trim(),
        email: form.email.trim(),
        patientPhone: form.phone.trim() || undefined,
        phone: form.phone.trim() || undefined,
        reason: form.reason.trim(),
        title: form.reason.trim(),
        notes: form.notes.trim() || undefined,
        message: form.reason.trim(),
        start: selectedSlot.start,
        end: selectedSlot.end,
        timeZone,
        timezone: timeZone,
        notifyPatientByEmail: true,
        source: "booking-link",
      };

      await createBookingLinkRequest(token, payload);
      setSubmitSuccess(true);
      setForm(getInitialForm());
      toast.success("Tu cita quedó solicitada. El nutri la revisará.");
    } catch (error) {
      console.error("Error submitting booking request", error);
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/90 px-6 py-4 shadow-2xl shadow-sky-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
            <span className="text-sm font-semibold text-slate-700">Abriendo horario compartido...</span>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !preview?.calendarId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center">
          <Card className="w-full rounded-[2rem] border-slate-200 bg-white shadow-2xl shadow-sky-100/50">
            <CardHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-sky-700">
                <Sparkles className="h-4 w-4" />
                Horario compartido
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-slate-950">
                No pudimos abrir este enlace
              </CardTitle>
              <CardDescription className="text-base font-medium text-slate-500">
                {errorMessage || "El enlace no existe, expiró o todavía no tiene un calendario asociado."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                Revisa que el enlace esté completo y que el nutricionista lo haya compartido desde su módulo de citas.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedDayLabel = selectedSlot?.start
    ? formatDayLabel(parseDateSafe(selectedSlot.start) || new Date(selectedSlot.start), timeZone)
    : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="rounded-[2rem] border-white/70 bg-white/90 shadow-2xl shadow-sky-100/50 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                Reserva pública
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                ID nutricionista: {nutriId}
              </span>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <CardTitle className="text-4xl font-black tracking-tight text-slate-950">
                  {preview.nutritionistName || "Tu nutricionista"} comparte su horario
                </CardTitle>
                <CardDescription className="max-w-3xl text-base font-medium leading-7 text-slate-500">
                  Selecciona un espacio libre, completa tus datos y registra la cita en pocos pasos. El horario mostrado
                  corresponde a la agenda actual del profesional.
                </CardDescription>
              </div>
              <div className="rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Zona horaria</p>
                <p className="mt-1 text-base font-black">{timeZone}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-4">
            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-sky-600" />
                  <CardTitle className="text-2xl font-black text-slate-950">Calendario actual</CardTitle>
                </div>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Haz clic en un espacio libre para seleccionarlo. Luego completa el formulario de la derecha.
                </CardDescription>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Semana del {weekStart.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })} al{" "}
                      {weekEnd.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {availableSlots.length} horarios disponibles para esta semana.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4 font-black"
                      onClick={() => setWeekAnchor((current) => addDays(current, -7))}
                    >
                      Semana anterior
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4 font-black"
                      onClick={() => setWeekAnchor((current) => addDays(current, 7))}
                    >
                      Siguiente semana
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-sky-600" />
                    <span className="text-sm font-semibold text-slate-600">Actualizando horarios...</span>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {weekDays.map((day) => {
                      const dayKey = formatDateKey(day, timeZone);
                      const daySlots = groupedSlots.get(dayKey) || [];

                      return (
                        <div
                          key={dayKey}
                          className={cn(
                            "rounded-[1.6rem] border p-4",
                            daySlots.length > 0 ? "border-sky-200 bg-sky-50/40" : "border-slate-200 bg-slate-50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                                {formatDayLabel(day, timeZone)}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-700">
                                {daySlots.length} {daySlots.length === 1 ? "horario" : "horarios"}
                              </p>
                            </div>
                            <CalendarDays className="h-5 w-5 text-sky-500" />
                          </div>
                          <div className="mt-4 space-y-2">
                            {daySlots.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm font-medium text-slate-400">
                                Sin horarios libres.
                              </div>
                            ) : (
                              daySlots.map((slot) => {
                                const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                                const slotStart = parseDateSafe(slot.start);

                                return (
                                  <button
                                    key={`${slot.start}-${slot.end}`}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={cn(
                                      "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                                      isSelected
                                        ? "border-sky-300 bg-sky-600 text-white shadow-lg shadow-sky-200"
                                        : "border-white bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50",
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-sm font-black">
                                        {slotStart ? formatHourLabel(slotStart, timeZone) : "Horario libre"}
                                      </span>
                                      <Clock3 className={cn("h-4 w-4", isSelected ? "text-white" : "text-sky-500")} />
                                    </div>
                                    {slot.notes ? (
                                      <p className={cn("mt-1 text-xs font-medium", isSelected ? "text-white/80" : "text-slate-500")}>
                                        {slot.notes}
                                      </p>
                                    ) : null}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl font-black text-slate-950">Tu selección</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Confirma el espacio y completa tus datos para registrar la cita.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedSlot ? (
                  <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Horario elegido</p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {selectedDayLabel}
                    </p>
                    <p className="text-sm font-medium text-slate-600">
                      {parseDateSafe(selectedSlot.start)?.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {parseDateSafe(selectedSlot.end)?.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                    Selecciona primero un horario libre.
                  </div>
                )}
                {submitSuccess ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
                    Tu solicitud quedó enviada. El nutricionista la revisará y te responderá desde su módulo de citas.
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl font-black text-slate-950">Registrar cita</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Completa nombre, correo y motivo. El correo se usa como identificador y para notificaciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nombre completo</label>
                    <Input
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder="Tu nombre"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Correo</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="correo@ejemplo.com"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Teléfono</label>
                    <Input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="+56 9 1234 5678"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Motivo de la consulta
                    </label>
                    <Input
                      value={form.reason}
                      onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                      placeholder="Consulta nutricional"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Notas opcionales</label>
                    <Textarea
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Información adicional para el nutricionista..."
                      className="min-h-[120px] rounded-xl"
                    />
                  </div>
                  <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-900">
                    Al registrar la cita, el nutri podrá verla en su calendario. Si su Google Calendar está conectado,
                    también se sincronizará automáticamente.
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-200 hover:bg-sky-500"
                    isLoading={isSubmitting}
                    disabled={!selectedSlot}
                  >
                    <UserRound className="mr-2 h-4 w-4" />
                    Registrar cita
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-black text-slate-950">Recordatorio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm font-medium text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Mail className="mt-0.5 h-4 w-4 text-sky-600" />
                  <p>Usa un correo válido: será tu referencia de contacto y acceso.</p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Phone className="mt-0.5 h-4 w-4 text-sky-600" />
                  <p>El teléfono es opcional, pero ayuda si el profesional necesita contactarte rápido.</p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <MapPin className="mt-0.5 h-4 w-4 text-sky-600" />
                  <p>El horario visible corresponde a la agenda actual del nutricionista en su zona horaria.</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
