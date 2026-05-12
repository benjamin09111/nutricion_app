"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Calendar, Video, Users, ArrowLeft, Loader2, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";

interface Nutritionist {
  id: string;
  slug: string;
  fullName: string;
  specialty: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  consultationMode: string;
  location: string | null;
  avatarUrl: string | null;
  bookingEnabled: boolean;
  publicPhone: string | null;
  publicEmail: string | null;
  instagram: string | null;
}

interface Availability {
  hasCalendar: boolean;
  calendarId?: string;
  timeZone?: string;
  schedule?: Record<string, Record<number, { available: boolean }>>;
}

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

interface FreeSlotResponse {
  slots: Slot[];
}

export default function NutritionistProfileClient({ slugPromise }: { slugPromise: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    message: "",
    startAt: "",
    endAt: "",
  });

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });

  useEffect(() => {
    slugPromise.then((params) => {
      setSlug(params.slug);
      loadNutritionist(params.slug);
    });
  }, [slugPromise]);

  const loadNutritionist = async (nutriSlug: string) => {
    setIsLoading(true);
    try {
      const response = await fetchApi(`/public/nutritionists/${nutriSlug}`);
      if (response.ok) {
        const data = await response.json();
        setNutritionist(data);
        
        if (data.bookingEnabled) {
          loadAvailability(data.id);
        }
      } else {
        toast.error("Nutricionista no encontrado");
      }
    } catch (error) {
      console.error("Error loading nutritionist", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailability = async (nutriId: string) => {
    try {
      const response = await fetchApi(`/public/nutritionists/${slug}/availability`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error("Error loading availability", error);
    }
  };

  const loadSlots = async () => {
    if (!availability?.calendarId) return;
    
    setIsLoadingSlots(true);
    const from = currentWeekStart.toISOString();
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const to = nextWeek.toISOString();

    try {
      const response = await fetchApi(
        `/availability/free-slots?calendarId=${availability.calendarId}&from=${from}&to=${to}&durationMin=60`
      );
      if (response.ok) {
        const data: FreeSlotResponse = await response.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Error loading slots", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (availability?.calendarId) {
      loadSlots();
    }
  }, [availability?.calendarId, currentWeekStart]);

  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push({
        date: day,
        label: dayNames[i],
        day: day.getDate(),
        month: day.toLocaleDateString("es-CL", { month: "short" }),
        fullDate: day.toISOString().split("T")[0],
      });
    }
    return days;
  }, [currentWeekStart]);

  const availableSlots = useMemo(() => {
    return slots.filter((s) => s.available);
  }, [slots]);

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setFormData((prev) => ({
      ...prev,
      startAt: slot.start,
      endAt: slot.end,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName.trim() || !formData.guestEmail.trim() || !selectedSlot) {
      toast.error("Por favor completa tu nombre, email y selecciona un horario");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchApi(`/public/nutritionists/${slug}/appointments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: formData.guestName.trim(),
          guestEmail: formData.guestEmail.trim(),
          guestPhone: formData.guestPhone.trim() || undefined,
          message: formData.message.trim(),
          startAt: selectedSlot.start,
          endAt: selectedSlot.end,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Error al solicitar cita");
      }
    } catch (error) {
      console.error("Error submitting request", error);
      toast.error(error instanceof Error ? error.message : "Error al solicitar cita");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    if (prev < new Date()) return;
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#a88aed]" />
      </div>
    );
  }

  if (!nutritionist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Nutricionista no encontrado</h2>
          <p className="text-slate-500 mb-4">El perfil que buscas no existe o fue removido.</p>
          <Link href="/nutricionistas">
            <Button className="cursor-pointer">Volver al directorio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
            <Link href="/nutricionistas" className="flex items-center gap-2 text-slate-600 hover:text-[#a88aed] cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            ¡Solicitud enviada!
          </h2>
          <p className="text-slate-600 mb-6">
            Tu solicitud de cita con <strong>{nutritionist.fullName}</strong> ha sido enviada. 
            El nutricionista la revisará pronto y te contactará al correo proporcionado.
          </p>
          <Link href="/nutricionistas">
            <Button className="cursor-pointer">Volver al directorio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const modeLabels: Record<string, string> = {
    online: "Online",
    presencial: "Presencial",
    both: "Online y Presencial",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <Link href="/nutricionistas" className="flex items-center gap-2 text-slate-600 hover:text-[#a88aed] cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Volver al directorio
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Profile Hero */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="shrink-0">
            <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 text-4xl font-bold overflow-hidden">
              {nutritionist.avatarUrl ? (
                <img src={nutritionist.avatarUrl} alt={nutritionist.fullName} className="w-full h-full object-cover" />
              ) : (
                nutritionist.fullName.charAt(0)
              )}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {nutritionist.fullName}
            </h1>
            {nutritionist.specialty && (
              <p className="text-lg text-slate-600 mb-3">{nutritionist.specialty}</p>
            )}
            {nutritionist.headline && (
              <p className="text-slate-600 mb-4">{nutritionist.headline}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#a88aed]/10 text-[#a88aed] text-sm font-medium">
                {modeLabels[nutritionist.consultationMode] || nutritionist.consultationMode}
              </span>
              {nutritionist.location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                  <MapPin className="h-3 w-3" />
                  {nutritionist.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {nutritionist.bio && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Sobre mí</h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 whitespace-pre-wrap">{nutritionist.bio}</p>
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(nutritionist.publicPhone || nutritionist.publicEmail || nutritionist.instagram) && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Contacto</h2>
            <div className="flex flex-wrap gap-4">
              {nutritionist.publicPhone && (
                <a href={`tel:${nutritionist.publicPhone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Phone className="h-4 w-4 text-[#a88aed]" />
                  {nutritionist.publicPhone}
                </a>
              )}
              {nutritionist.publicEmail && (
                <a href={`mailto:${nutritionist.publicEmail}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Mail className="h-4 w-4 text-[#a88aed]" />
                  {nutritionist.publicEmail}
                </a>
              )}
              {nutritionist.instagram && (
                <a href={`https://instagram.com/${nutritionist.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                  <span className="text-lg">📷</span>
                  {nutritionist.instagram}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Booking Section */}
        {nutritionist.bookingEnabled && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#a88aed]" />
              Solicitar cita
            </h2>

            {availability?.hasCalendar ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={goToPrevWeek} className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer disabled:opacity-30" disabled={currentWeekStart <= new Date()}>
                    ←
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    {currentWeekStart.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                  </span>
                  <button onClick={goToNextWeek} className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer">
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-6">
                  {weekDays.map((day) => (
                    <div key={day.fullDate} className="text-center">
                      <div className="text-xs font-medium text-slate-500 mb-1">{day.label}</div>
                      <div className="text-sm font-bold text-slate-700">{day.day}</div>
                    </div>
                  ))}
                </div>

                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-[#a88aed]" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No hay horarios disponibles esta semana
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                    {availableSlots.slice(0, 12).map((slot, idx) => {
                      const slotDate = new Date(slot.start);
                      const hour = slotDate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
                      const isSelected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSlotClick(slot)}
                          className={`py-2 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#a88aed] text-white"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-[#a88aed]"
                          }`}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedSlot && (
                  <form onSubmit={handleSubmit} className="space-y-4 mt-6 pt-6 border-t border-slate-200">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                        <Input
                          value={formData.guestName}
                          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <Input
                          type="email"
                          value={formData.guestEmail}
                          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                          placeholder="tu@email.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
                        <Input
                          type="tel"
                          value={formData.guestPhone}
                          onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="text-sm text-slate-600">
                          Horario seleccionado: <strong>{new Date(selectedSlot.start).toLocaleString("es-CL", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de la consulta</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="¿En qué puedo ayudarte?"
                        rows={3}
                      />
                    </div>
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className="w-full rounded-2xl bg-[#a88aed] hover:bg-[#8f70d8] font-bold cursor-pointer"
                    >
                      Solicitar cita
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-slate-600 mb-4">
                  Este nutricionista no tiene agenda online disponible. Puedes enviarle un mensaje directamente.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                    <Input
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Cuéntale sobre tu situación..."
                    rows={4}
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full rounded-2xl bg-[#a88aed] hover:bg-[#8f70d8] font-bold cursor-pointer"
                >
                  Enviar mensaje
                </Button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}