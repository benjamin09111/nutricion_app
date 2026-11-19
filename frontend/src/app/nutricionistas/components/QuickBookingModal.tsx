"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import type { PublicNutritionist } from "@/lib/public-nutritionists";

interface QuickBookingModalProps {
  nutritionist: PublicNutritionist;
  calendarId: string | null;
  onClose: () => void;
}

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export default function QuickBookingModal({
  nutritionist,
  calendarId: propCalendarId,
  onClose,
}: QuickBookingModalProps) {
  const [calendarId, setCalendarId] = useState<string | null>(propCalendarId);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCalendarAndSlots() {
      setLoadingSlots(true);
      try {
        let activeCalId = calendarId;

        // If calendarId wasn't passed directly, fetch availability
        if (!activeCalId) {
          const availRes = await fetchApi(
            `/public/nutritionists/${nutritionist.slug}/availability`,
          );
          if (availRes.ok) {
            const availData = await availRes.json();
            activeCalId = availData.calendarId || null;
            if (isMounted) setCalendarId(activeCalId);
          }
        }

        if (activeCalId) {
          const now = new Date();
          const from = now.toISOString();
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const to = nextWeek.toISOString();

          const slotsRes = await fetchApi(
            `/availability/free-slots?calendarId=${activeCalId}&from=${from}&to=${to}&durationMin=60`,
          );
          if (slotsRes.ok && isMounted) {
            const data = await slotsRes.json();
            setSlots((data.slots || []).filter((s: Slot) => s.available));
          }
        }
      } catch (err) {
        console.error("Error loading availability slots", err);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    }

    loadCalendarAndSlots();
    return () => {
      isMounted = false;
    };
  }, [nutritionist.slug, calendarId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Por favor selecciona una hora de atención");
      return;
    }
    if (!formData.guestName.trim() || !formData.guestEmail.trim()) {
      toast.error("Por favor ingresa tu nombre y correo electrónico");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchApi(
        `/public/nutritionists/${nutritionist.slug}/appointments/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: formData.guestName.trim(),
            guestEmail: formData.guestEmail.trim(),
            guestPhone: formData.guestPhone.trim() || undefined,
            message: formData.message.trim() || undefined,
            startAt: selectedSlot.start,
            endAt: selectedSlot.end,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo agendar la cita");
      }

      setIsSuccess(true);
      toast.success("¡Solicitud enviada con éxito!");
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar la hora");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlotLabel = (slot: Slot) => {
    const start = new Date(slot.start);
    const dayName = new Intl.DateTimeFormat("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(start);
    const timeStr = new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(start);
    return { dayName, timeStr };
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#a88aed] to-[#7f5fd6] text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
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
            <div>
              <p className="text-[11px] font-bold text-[#8f70d8] uppercase tracking-wider">
                Tomar Hora
              </p>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {nutritionist.fullName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                ¡Solicitud de Hora Enviada!
              </h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Hemos notificado a <strong>{nutritionist.fullName}</strong>. Te
                llegará un correo de confirmación con los detalles de tu
                consulta.
              </p>
              {selectedSlot && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                  📅 {formatSlotLabel(selectedSlot).dayName} a las{" "}
                  {formatSlotLabel(selectedSlot).timeStr} hrs
                </div>
              )}
              <Button
                onClick={onClose}
                className="rounded-xl px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
              >
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Horarios Disponibles */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Calendar className="h-4 w-4 text-[#a88aed]" />
                  Selecciona una fecha y hora:
                </label>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#a88aed]" />
                    Cargando horarios de atención...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      El profesional no tiene horas libres próximas publicadas en
                      su calendario web. Puedes escribirle directamente por sus
                      medios de contacto o solicitar hora tentativa dejando un
                      mensaje.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                    {slots.slice(0, 12).map((slot, idx) => {
                      const { dayName, timeStr } = formatSlotLabel(slot);
                      const isSelected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#a88aed] text-white border-[#8f70d8] shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase truncate">
                            {dayName}
                          </p>
                          <p className="text-xs font-extrabold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeStr}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Patient Form Fields */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tu nombre completo *
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      required
                      placeholder="Ej. Constanza Silva"
                      value={formData.guestName}
                      onChange={(e) =>
                        setFormData({ ...formData, guestName: e.target.value })
                      }
                      className="pl-9 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Correo electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        required
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.guestEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guestEmail: e.target.value,
                          })
                        }
                        className="pl-9 h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        value={formData.guestPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guestPhone: e.target.value,
                          })
                        }
                        className="pl-9 h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Motivo de consulta (opcional)
                  </label>
                  <Textarea
                    placeholder="Cuéntale brevemente qué buscas o tu objetivo nutricional..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="rounded-xl text-sm h-20 resize-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || (slots.length > 0 && !selectedSlot)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#a88aed] to-[#8f70d8] hover:from-[#9c78ea] hover:to-[#7e58cb] text-white font-extrabold text-sm shadow-md shadow-[#a88aed]/20 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando solicitud...
                    </span>
                  ) : (
                    "Confirmar y Tomar Hora"
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  No se cobrará nada por solicitar tu cita. El nutricionista
                  revisará y confirmará tu consulta.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

