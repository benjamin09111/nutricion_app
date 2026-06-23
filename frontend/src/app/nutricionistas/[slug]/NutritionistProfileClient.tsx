"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Video,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  CheckCircle2,
  Instagram,
  Star,
  Clock,
  DollarSign,
  CreditCard,
  Shield,
  User,
  Stethoscope,
  Users,
  MapPinOff,
  ChevronDown,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PublicNutritionist } from "@/lib/public-nutritionists";
import {
  usePublicNutritionistProfile,
  type Slot,
} from "./hooks/usePublicNutritionistProfile";
import { JsonLd } from "@/components/seo/JsonLd";
import { PUBLIC_PROFILE_UNAVAILABLE_MESSAGE } from "./hooks/usePublicNutritionistProfile";
import {
  createDateFromDateKey,
  formatDateKeyInTimeZone,
  addDaysToDateKey,
  getTomorrowDateKeyInTimeZone,
  isDateKeyBefore,
  normalizePublicCalendarTimeZone,
} from "./timezone";

interface NutritionistProfileClientProps {
  slug: string;
  initialNutritionist: PublicNutritionist;
}

export default function NutritionistProfileClient({
  slug,
  initialNutritionist,
}: NutritionistProfileClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showMorePrices, setShowMorePrices] = useState(false);

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    message: "",
  });

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [calendarWeekSynced, setCalendarWeekSynced] = useState(false);
  const [currentWeekStartKey, setCurrentWeekStartKey] = useState(() =>
    getTomorrowDateKeyInTimeZone(
      new Date(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  );

  const {
    nutritionistQuery,
    availabilityQuery,
    slotsQuery,
    requestAppointment,
  } = usePublicNutritionistProfile(slug, currentWeekStartKey);

  const nutritionist = nutritionistQuery.data ?? initialNutritionist;
  const availability = availabilityQuery.data ?? null;
  const slots = slotsQuery.data?.slots ?? [];
  const isLoading =
    !nutritionist &&
    (nutritionistQuery.isLoading || nutritionistQuery.isFetching);
  const isLoadingSlots = slotsQuery.isLoading || slotsQuery.isFetching;
  const profileUnavailable =
    nutritionistQuery.error instanceof Error &&
    nutritionistQuery.error.message === PUBLIC_PROFILE_UNAVAILABLE_MESSAGE;

  const availabilityTimeZone = availability?.timeZone ?? null;
  const calendarTimeZone = normalizePublicCalendarTimeZone(
    availabilityTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const weekDays = useMemo(() => {
    const days = [];
    const todayKey = formatDateKeyInTimeZone(new Date(), calendarTimeZone);
    for (let i = 0; i < 7; i++) {
      const fullDate = addDaysToDateKey(currentWeekStartKey, i);
      const day = createDateFromDateKey(fullDate);
      days.push({
        date: day,
        label: new Intl.DateTimeFormat("es-CL", {
          timeZone: calendarTimeZone,
          weekday: "short",
        })
          .format(day)
          .replace(".", ""),
        day: Number(
          new Intl.DateTimeFormat("es-CL", {
            timeZone: calendarTimeZone,
            day: "2-digit",
          }).format(day),
        ),
        month: new Intl.DateTimeFormat("es-CL", {
          timeZone: calendarTimeZone,
          month: "short",
        }).format(day),
        fullDate,
        isPast: isDateKeyBefore(fullDate, todayKey),
      });
    }
    return days;
  }, [calendarTimeZone, currentWeekStartKey]);

  const availableSlots = useMemo(
    () => slots.filter((s) => s.available),
    [slots],
  );

  useEffect(() => {
    if (!availabilityTimeZone || calendarWeekSynced) return;
    setSelectedSlot(null);
    setCurrentWeekStartKey(
      getTomorrowDateKeyInTimeZone(new Date(), calendarTimeZone),
    );
    setCalendarWeekSynced(true);
  }, [availabilityTimeZone, calendarTimeZone, calendarWeekSynced]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    weekDays.forEach((day) => map.set(day.fullDate, []));

    for (const slot of availableSlots) {
      const slotDateKey = formatDateKeyInTimeZone(new Date(slot.start), calendarTimeZone);
      if (isDateKeyBefore(slotDateKey, formatDateKeyInTimeZone(new Date(), calendarTimeZone))) {
        continue;
      }
      const key = new Intl.DateTimeFormat("en-CA", {
        timeZone: calendarTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(slot.start));
      const current = map.get(key);
      if (current) current.push(slot);
    }

    for (const value of map.values()) {
      value.sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
    }

    return map;
  }, [availableSlots, calendarTimeZone, weekDays]);

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setFormData((prev) => ({ ...prev, startAt: slot.start, endAt: slot.end }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.guestName.trim() ||
      !formData.guestEmail.trim() ||
      !selectedSlot
    ) {
      toast.error("Completa tu nombre, email y selecciona un horario");
      return;
    }
    setIsSubmitting(true);
    try {
      await requestAppointment.mutateAsync({
        slug,
        guestName: formData.guestName.trim(),
        guestEmail: formData.guestEmail.trim(),
        guestPhone: formData.guestPhone.trim() || undefined,
        message: formData.message.trim(),
        startAt: selectedSlot.start,
        endAt: selectedSlot.end,
      });
      setSubmitSuccess(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al solicitar cita",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPrevWeek = () => {
    const prevKey = addDaysToDateKey(currentWeekStartKey, -7);
    const minimumKey = getTomorrowDateKeyInTimeZone(new Date(), calendarTimeZone);
    if (prevKey < minimumKey) return;
    setSelectedSlot(null);
    setCurrentWeekStartKey(prevKey);
  };

  const goToNextWeek = () => {
    setSelectedSlot(null);
    setCurrentWeekStartKey(addDaysToDateKey(currentWeekStartKey, 7));
  };

  const openGoogleMaps = () => {
    if (nutritionist.officeAddress) {
      const query = encodeURIComponent(nutritionist.officeAddress);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const modeLabels: Record<string, string> = {
    online: "Online",
    presencial: "Presencial",
    both: "Online y presencial",
  };

  const hasContactInfo =
    nutritionist.publicPhone ||
    nutritionist.publicEmail ||
    nutritionist.instagram ||
    nutritionist.linkedin;
  const hasAdditionalInfo =
    nutritionist.conditionsTreated ||
    nutritionist.patientTypes ||
    nutritionist.prices ||
    nutritionist.officeAddress ||
    nutritionist.paymentMethods ||
    nutritionist.acceptedInsurance;
  const showBookingSection =
    nutritionist.bookingEnabled &&
    nutritionist.showSchedule &&
    availability?.hasCalendar;
  const hasCalendarToShow = showBookingSection;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (profileUnavailable) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <span className="text-2xl font-black">!</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Este perfil ya no es público
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            El nutricionista ocultó su perfil del portal público. Refresca la
            página si quieres confirmar el estado.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#a88aed]" />
      </div>
    );
  }

  if (!nutritionist) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Nutricionista no encontrado
          </h2>
          <p className="text-slate-500 mb-6">
            El perfil que buscas no existe o fue removido.
          </p>
          <Link href="/nutricionistas">
            <Button className="cursor-pointer">Volver al directorio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center">
            <Link
              href="/nutricionistas"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#a88aed] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Link>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            ¡Solicitud enviada!
          </h2>
          <p className="text-slate-600 mb-6">
            Tu solicitud de cita con <strong>{nutritionist.fullName}</strong> ha
            sido enviada. El nutricionista te contactará pronto.
          </p>
          <Link href="/nutricionistas">
            <Button className="cursor-pointer">Volver al directorio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: nutritionist.fullName,
            jobTitle: "Nutricionista",
            description: nutritionist.headline || nutritionist.bio || undefined,
            image: nutritionist.avatarUrl || "https://nutrinet.cl/logo_2.webp",
            url: `https://nutrinet.cl/nutricionistas/${slug}`,
            ...(nutritionist.location && {
              address: {
                "@type": "PostalAddress",
                addressLocality: nutritionist.location,
                addressCountry: "CL",
              },
            }),
            ...(nutritionist.publicPhone && {
              telephone: nutritionist.publicPhone,
            }),
            ...(nutritionist.publicEmail && {
              email: nutritionist.publicEmail,
            }),
            ...(nutritionist.consultationMode && {
              availableService: {
                "@type": "Service",
                serviceType:
                  nutritionist.consultationMode === "online"
                    ? "Online Consultation"
                    : nutritionist.consultationMode === "presencial"
                      ? "In-Person Consultation"
                      : "Online and In-Person Consultation",
              },
            }),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: "https://nutrinet.cl",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Nutricionistas",
                item: "https://nutrinet.cl/nutricionistas",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: nutritionist.fullName,
                item: `https://nutrinet.cl/nutricionistas/${slug}`,
              },
            ],
          },
        ]}
      />

      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/nutricionistas"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#a88aed] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al directorio</span>
            <span className="sm:hidden">Volver</span>
          </Link>
          <div className="text-xs sm:text-sm font-medium text-[#a88aed]">
            Perfil NutriNet
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile Hero Card */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="h-20 sm:h-28 bg-gradient-to-br from-[#a88aed]/15 via-[#a88aed]/10 to-emerald-100/30 relative">
            <div className="absolute -bottom-10 sm:-bottom-12 left-5 sm:left-8">
              <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-2xl sm:text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {nutritionist.avatarUrl ? (
                  <img
                    src={nutritionist.avatarUrl}
                    alt={nutritionist.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  nutritionist.fullName.charAt(0)
                )}
              </div>
            </div>
          </div>

          <div className="pt-12 sm:pt-16 px-5 sm:px-8 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                    {nutritionist.fullName}
                  </h1>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-[#a88aed] uppercase tracking-widest mb-1.5">
                  Nutricionista
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 text-amber-400 fill-amber-400"
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-0.5">5.0</span>
                </div>

                {nutritionist.specialty && (
                  <p className="text-sm sm:text-base text-slate-600 mb-1">
                    {nutritionist.specialty}
                  </p>
                )}
                {nutritionist.professionalId && (
                  <p className="text-[10px] text-slate-400 mb-2">
                    Reg. SIS: {nutritionist.professionalId}
                  </p>
                )}
                {nutritionist.headline && (
                  <p className="text-xs sm:text-sm text-slate-500 mb-3">
                    {nutritionist.headline}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-[#a88aed]/10 text-[#a88aed] text-[10px] sm:text-xs font-medium">
                    {nutritionist.consultationMode === "online" && (
                      <Video className="h-2.5 w-2.5" />
                    )}
                    {nutritionist.consultationMode === "presencial" && (
                      <MapPin className="h-2.5 w-2.5" />
                    )}
                    {nutritionist.consultationMode === "both" && (
                      <>
                        <MapPin className="h-2.5 w-2.5" />
                        <Video className="h-2.5 w-2.5" />
                      </>
                    )}
                    {modeLabels[nutritionist.consultationMode] ||
                      nutritionist.consultationMode}
                  </span>
                  {nutritionist.location && nutritionist.location.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-medium">
                      <MapPin className="h-2.5 w-2.5" />
                      {nutritionist.location.trim()}
                      {nutritionist.country ? `, ${nutritionist.country}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Button */}
        {(hasCalendarToShow ||
          (nutritionist.bookingEnabled && !nutritionist.showSchedule)) && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() =>
                scrollToSection(
                  hasCalendarToShow ? "booking-section" : "contact-section",
                )
              }
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#a88aed] text-white font-bold text-sm shadow-lg hover:bg-[#8f70d8] transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              {hasCalendarToShow ? "Agendar cita" : "Contactar"}
            </button>
          </div>
        )}

        {showBookingSection && (
          <section
            id="booking-section"
            className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">
                  Agenda disponible
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                  Solicita tu cita
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  El nutricionista revisará tu solicitud y la confirmará por correo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="h-10 rounded-full border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.16em] text-slate-600 cursor-pointer" onClick={goToPrevWeek}>
                  Semana anterior
                </Button>
                <Button type="button" variant="outline" className="h-10 rounded-full border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.16em] text-slate-600 cursor-pointer" onClick={goToNextWeek}>
                  Siguiente semana
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-7">
              {weekDays.map((day) => {
                const daySlots = slotsByDay.get(day.fullDate) ?? [];
                return (
                  <div key={day.fullDate} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="mb-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {day.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {day.day} {day.month}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {day.isPast ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-[10px] font-medium text-slate-400">
                          Fecha pasada
                        </div>
                      ) : daySlots.length > 0 ? (
                        daySlots.map((slot) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => handleSlotClick(slot)}
                              className={cn(
                                "w-full rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer",
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700",
                              )}
                            >
                              {new Date(slot.start).toLocaleTimeString("es-CL", {
                                timeZone: calendarTimeZone,
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-[10px] font-medium text-slate-400">
                          Sin horarios
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="Tu nombre"
                  required
                  className="h-11 rounded-2xl border-slate-200 bg-white text-sm"
                />
                <Input
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  className="h-11 rounded-2xl border-slate-200 bg-white text-sm"
                />
              </div>
              <Input
                value={formData.guestPhone}
                onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                placeholder="Teléfono (opcional)"
                className="h-11 rounded-2xl border-slate-200 bg-white text-sm"
              />
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Cuéntale al nutricionista por qué deseas la cita"
                rows={4}
                className="rounded-2xl border-slate-200 bg-white text-sm"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  {selectedSlot
                    ? `Horario seleccionado: ${new Date(selectedSlot.start).toLocaleString("es-CL", {
                        timeZone: calendarTimeZone,
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}`
                    : "Selecciona un horario para continuar"}
                </p>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="h-11 rounded-full bg-indigo-600 px-5 text-xs font-black uppercase tracking-[0.18em] text-white cursor-pointer"
                >
                  Solicitar cita
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Section Navbar */}
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {nutritionist.bio && (
            <button
              onClick={() => scrollToSection("sobre-mi")}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-[#a88aed] hover:text-[#a88aed] transition-colors cursor-pointer"
            >
              Sobre mí
            </button>
          )}
          {nutritionist.specialties.length > 0 && (
            <button
              onClick={() => scrollToSection("especialidades")}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-[#a88aed] hover:text-[#a88aed] transition-colors cursor-pointer"
            >
              Especialidades
            </button>
          )}
          {nutritionist.prices && (
            <button
              onClick={() => scrollToSection("precios")}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-[#a88aed] hover:text-[#a88aed] transition-colors cursor-pointer"
            >
              Precios
            </button>
          )}
          {hasContactInfo && (
            <button
              onClick={() => scrollToSection("contacto")}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-[#a88aed] hover:text-[#a88aed] transition-colors cursor-pointer"
            >
              Contacto
            </button>
          )}
          {hasAdditionalInfo && (
            <button
              onClick={() => scrollToSection("mas-info")}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-[#a88aed] hover:text-[#a88aed] transition-colors cursor-pointer"
            >
              Más información
            </button>
          )}
          {(hasCalendarToShow ||
            (nutritionist.bookingEnabled && !nutritionist.showSchedule)) && (
            <button
              onClick={() =>
                scrollToSection(
                  hasCalendarToShow ? "booking-section" : "contact-section",
                )
              }
              className="whitespace-nowrap px-4 py-2 rounded-full bg-[#a88aed] text-white border border-[#a88aed] text-xs font-medium hover:bg-[#8f70d8] transition-colors cursor-pointer"
            >
              {hasCalendarToShow ? "Agendar" : "Contactar"}
            </button>
          )}
        </nav>

        {/* Two Column Layout */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          style={{ gridAutoRows: "min-content" }}
        >
          {/* Left Column */}
          <div className="space-y-6">
            {/* Bio */}
            {nutritionist.bio && (
              <section
                id="sobre-mi"
                className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6"
              >
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#a88aed]/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-[#a88aed]" />
                  </span>
                  Sobre mí
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {nutritionist.bio}
                </p>
              </section>
            )}

            {/* Message only (no schedule) */}
            {nutritionist.bookingEnabled && !nutritionist.showSchedule && (
              <section
                id="contact-section"
                className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6"
              >
                <h2 className="text-base font-bold text-slate-900 mb-4">
                  Enviar mensaje
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Nombre
                      </label>
                      <Input
                        value={formData.guestName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guestName: e.target.value,
                          })
                        }
                        placeholder="Tu nombre"
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guestEmail: e.target.value,
                          })
                        }
                        placeholder="tu@email.com"
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Mensaje
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="¿En qué puedo ayudarte?"
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full rounded-xl bg-[#a88aed] hover:bg-[#8f70d8] font-bold cursor-pointer h-10 text-sm"
                  >
                    Enviar mensaje
                  </Button>
                </form>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact Section */}
            {hasContactInfo && (
              <section
                id="contacto"
                className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6"
              >
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#a88aed]/10 flex items-center justify-center">
                    <Phone className="h-3.5 w-3.5 text-[#a88aed]" />
                  </span>
                  Información de contacto
                </h2>
                <div className="space-y-2">
                  {nutritionist.publicPhone && (
                    <a
                      href={`tel:${nutritionist.publicPhone}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#a88aed]/10 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-[#a88aed]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                          Teléfono
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {nutritionist.publicPhone}
                        </p>
                      </div>
                    </a>
                  )}
                  {nutritionist.publicEmail && (
                    <a
                      href={`mailto:${nutritionist.publicEmail}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#a88aed]/10 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-[#a88aed]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                          Correo
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {nutritionist.publicEmail}
                        </p>
                      </div>
                    </a>
                  )}
                  {nutritionist.instagram && (
                    <a
                      href={`https://instagram.com/${nutritionist.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#a88aed]/10 flex items-center justify-center shrink-0">
                        <Instagram className="h-4 w-4 text-[#a88aed]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                          Instagram
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {nutritionist.instagram}
                        </p>
                      </div>
                    </a>
                  )}
                  {nutritionist.linkedin && (
                    <a
                      href={
                        nutritionist.linkedin.startsWith("http")
                          ? nutritionist.linkedin
                          : `https://${nutritionist.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#a88aed]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#a88aed]">
                          in
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                          LinkedIn
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          Perfil profesional
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Additional Info */}
            {hasAdditionalInfo && (
              <section
                id="mas-info"
                className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6"
              >
                <h2 className="text-base font-bold text-slate-900 mb-4">
                  Más información
                </h2>
                <div className="space-y-4">
                  {nutritionist.conditionsTreated && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                        <Stethoscope className="h-4 w-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Enfermedades o temas tratados
                        </p>
                        <p className="text-sm text-slate-700">
                          {nutritionist.conditionsTreated}
                        </p>
                      </div>
                    </div>
                  )}
                  {nutritionist.patientTypes && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Tipos de pacientes
                        </p>
                        <p className="text-sm text-slate-700">
                          {nutritionist.patientTypes}
                        </p>
                      </div>
                    </div>
                  )}
                  {nutritionist.officeAddress && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#a88aed]/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-[#a88aed]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Dirección del consultorio
                        </p>
                        <p className="text-sm text-slate-700 mb-2">
                          {nutritionist.officeAddress}
                        </p>
                        <button
                          onClick={openGoogleMaps}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a88aed] hover:text-[#8f70d8] transition-colors"
                        >
                          <MapPin className="h-3 w-3" />
                          Ver en Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  {nutritionist.paymentMethods && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Formas de pago
                        </p>
                        <p className="text-sm text-slate-700">
                          {nutritionist.paymentMethods}
                        </p>
                      </div>
                    </div>
                  )}
                  {nutritionist.acceptedInsurance && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Seguros aceptados
                        </p>
                        <p className="text-sm text-slate-700">
                          {nutritionist.acceptedInsurance}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Empty state - no info configured */}
            {!hasContactInfo && !hasAdditionalInfo && !showBookingSection && (
              <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Perfil en preparación
                </h3>
                <p className="text-sm text-slate-500">
                  Este nutricionista aún está completando su perfil público.
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Reviews Section - Full Width */}
        <section className="mt-6 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-amber-500" />
            </span>
            Comentarios de pacientes
          </h2>
          <div className="text-center py-8 bg-slate-50 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              Aún no hay comentarios publicados
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Los comentarios aparecerán después de tu primera consulta
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 mt-6">
          <p className="text-xs text-slate-400">
            © 2026 NutriNet. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}
