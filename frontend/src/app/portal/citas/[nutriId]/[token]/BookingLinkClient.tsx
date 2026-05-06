"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2 } from "lucide-react";

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

const formatDateKey = (date: Date, timeZone?: string) => {
  if (timeZone) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch (e) {
      console.warn("Invalid timezone for formatDateKey", timeZone);
    }
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

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
    return 60;
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

  const loadSlots = useCallback(async (cancelled = false) => {
    if (!calendarId) return;
    setIsLoadingSlots(true);
    try {
      const from = `${formatDateKey(weekStart, timeZone)}T00:00:00.000Z`;
      const to = `${formatDateKey(weekEnd, timeZone)}T23:59:59.999Z`;
      const payload = await fetchAppointmentsJson<unknown>(
        `/availability/free-slots?calendarId=${calendarId}&from=${from}&to=${to}&durationMin=${slotDurationMin}`,
      );
      const nextSlots = normalizeSlots(payload);
      if (!cancelled) {
        setSlots(nextSlots);
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Error loading booking slots", error);
        setSlots([]);
      }
    } finally {
      if (!cancelled) {
        setIsLoadingSlots(false);
      }
    }
  }, [calendarId, slotDurationMin, timeZone, weekEnd, weekStart]);

  useEffect(() => {
    let cancelled = false;
    void loadSlots(cancelled);

    const interval = setInterval(() => {
      void loadSlots(cancelled);
    }, 60000); // Sincronizar cada 60 segundos

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadSlots]);

  useEffect(() => {
    if (availableSlots.length === 0) {
      setSelectedSlot(null);
      return;
    }

    setSelectedSlot((current) => {
      if (!current) return null; // No seleccionar automáticamente
      const stillVisible = availableSlots.some(
        (slot) => slot.start === current.start && slot.end === current.end,
      );
      return stillVisible ? current : null;
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
        guestName: form.fullName.trim(),
        guestEmail: form.email.trim(),
        guestPhone: form.phone.trim() || undefined,
        startAt: selectedSlot.start,
        endAt: selectedSlot.end,
        message: form.reason.trim(),
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
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
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
        <Card className="rounded-[2rem] border-white/70 bg-white/90 shadow-xl shadow-sky-100/20 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">
                Reserva pública
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                ID nutricionista: {nutriId}
              </span>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                  {preview.nutritionistName || "Tu nutricionista"} comparte su horario
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
                  Selecciona un espacio libre, completa tus datos y registra la cita en pocos pasos. El horario mostrado
                  corresponde a la agenda actual del profesional.
                </CardDescription>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm font-medium text-sky-900">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">Zona horaria</p>
                <p className="mt-1 text-base font-bold">{timeZone}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="w-full">
          <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="space-y-3 bg-white p-6 pb-4 border-b border-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Calendario de Citas</CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                      Semana del {weekStart.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })} al{" "}
                      {weekEnd.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4 font-bold"
                      onClick={() => setWeekAnchor((current) => addDays(current, -7))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4 font-bold"
                      onClick={() => setWeekAnchor((current) => addDays(current, 7))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center bg-slate-50 px-6 py-20">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-sky-600" />
                    <span className="text-sm font-semibold text-slate-600">Actualizando horarios...</span>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-100 bg-white">
                      <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Hora
                      </div>
                      {weekDays.map((day, index) => {
                        const dayKey = formatDateKey(day, timeZone);
                        const daySlots = groupedSlots.get(dayKey) || [];
                        return (
                          <div key={index} className="border-l border-slate-100 px-3 py-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {formatDayLabel(day, timeZone)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-900">
                              {day.toLocaleDateString("es-CL", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-sky-600">
                              {daySlots.length} libres
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col bg-slate-50/50">
                      {Array.from({ length: 22 - 8 + 1 }, (_, hourIndex) => {
                        const hour = 8 + hourIndex;
                        return (
                          <div key={hour} className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-100">
                            {/* Hour Label */}
                              <div className="flex h-16 items-start justify-end border-r border-slate-100 bg-white p-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {hour.toString().padStart(2, "0")}:00
                            </div>

                            {/* Day cells */}
                            {weekDays.map((day) => {
                              const dayKey = formatDateKey(day, timeZone);
                              const daySlots = groupedSlots.get(dayKey) || [];
                              const slot = daySlots.find((s) => {
                                const d = parseDateSafe(s.start);
                                return d && d.getHours() === hour && d.getMinutes() === 0;
                              });

                              return (
                                <div key={day.toISOString()} className="relative h-16 border-l border-slate-100 bg-white p-1 flex items-center justify-center">
                                  {slot ? (
                                    <button
                                      onClick={() => setSelectedSlot(slot)}
                                      className="w-full h-full rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border bg-sky-50 text-sky-800 border-sky-100 hover:bg-sky-600 hover:text-white hover:border-sky-500 shadow-sm"
                                    >
                                      Disponible
                                    </button>
                                  ) : (
                                    <div className="h-full w-full rounded-xl bg-slate-50/10" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Modal para Registrar Cita */}
        <Modal
          isOpen={!!selectedSlot && !submitSuccess}
          onClose={() => setSelectedSlot(null)}
          title="Registrar cita"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">Horario elegido</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {selectedDayLabel}
              </p>
              <p className="text-sm font-medium text-slate-600">
                {selectedSlot && parseDateSafe(selectedSlot.start)?.toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {selectedSlot && parseDateSafe(selectedSlot.end)?.toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre completo</label>
                <Input
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Tu nombre"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Correo</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Teléfono (opcional)</label>
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+56 9 1234 5678"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Descripción de consulta
                </label>
                <Input
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  placeholder="Motivo de la consulta"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-100 hover:bg-sky-500 font-bold"
                isLoading={isSubmitting}
                disabled={!selectedSlot}
              >
                Mandar petición de consulta
              </Button>
            </form>
          </div>
        </Modal>

        {/* Modal de Éxito */}
        <Modal
          isOpen={submitSuccess}
          onClose={() => {
            setSubmitSuccess(false);
            setSelectedSlot(null);
          }}
          title="¡Petición enviada!"
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Cita solicitada con éxito</h3>
            <p className="text-sm text-slate-600 font-medium">
              Recibirás una confirmación por correo electrónico o el profesional te contactará directamente.
            </p>
            <Button
              onClick={() => {
                setSubmitSuccess(false);
                setSelectedSlot(null);
              }}
              className="w-full mt-4 h-12 rounded-xl"
            >
              Cerrar y volver al calendario
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
