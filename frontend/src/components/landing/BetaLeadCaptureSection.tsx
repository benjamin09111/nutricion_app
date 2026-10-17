"use client";

import { useState } from "react";
import { Check, Sparkles, ShieldCheck, User, Mail, Briefcase, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchApi } from "@/lib/api-base";

interface BetaLeadCaptureSectionProps {
  sessionId?: string;
  onLeadSubmitted?: (leadData: { fullName: string; email: string; practiceArea: string }) => void;
}

export function BetaLeadCaptureSection({ sessionId, onLeadSubmitted }: BetaLeadCaptureSectionProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [practiceArea, setPracticeArea] = useState("CONSULTA_PRIVADA");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage("Por favor ingresa tu nombre completo y correo electrónico.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Por favor ingresa un correo electrónico profesional válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetchApi("/landing/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          practiceArea,
          phone: phone.trim() || undefined,
          source: "jump_chile",
          sessionId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Error al procesar la reserva. Intenta nuevamente.");
      }

      setIsSuccess(true);
      onLeadSubmitted?.({ fullName, email, practiceArea });
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="registro" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header con estándar visual NutriNet */}
        <div className="text-center space-y-3 mb-10">
          <span
            className="block text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl"
            style={{
              WebkitTextStroke: "3px #a6c261",
              color: "transparent",
              fontWeight: 900,
            }}
          >
            ACCESO BETA
          </span>
          <span className="block text-xl font-bold text-[#a88aed] sm:text-2xl lg:text-4xl">
            50% de Descuento Permanente para Jump Chile
          </span>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto pt-1">
            Déjanos tus datos profesionales para enviarte tu cuenta con descuento exclusivo a cambio de tu feedback de uso.
          </p>
        </div>

        {/* Card Container Minimalista */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 shadow-sm">
          
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a88aed]/10 text-[#a88aed] text-xs font-bold uppercase tracking-wider border border-[#a88aed]/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Convocatoria Jump Chile 2026</span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Cupos limitados para los primeros 50 nutricionistas
            </div>
          </div>

          {!isSuccess ? (
            <div className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre Completo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Nombre Completo *
                    </label>
                    <input
                      id="lead-fullname"
                      type="text"
                      required
                      placeholder="Ej: Constanza Morales"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a88aed]/20 focus:border-[#a88aed] transition-all"
                    />
                  </div>

                  {/* Correo Electrónico Profesional */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Correo Electrónico Profesional *
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      placeholder="nutricionista@ejemplo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a88aed]/20 focus:border-[#a88aed] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Área de Ejercicio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      Área de Ejercicio *
                    </label>
                    <select
                      id="lead-area"
                      value={practiceArea}
                      onChange={(e) => setPracticeArea(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#a88aed]/20 focus:border-[#a88aed] transition-all cursor-pointer font-medium"
                    >
                      <option value="CONSULTA_PRIVADA">Consulta Privada</option>
                      <option value="CLINICA">Área Clínica / Hospital</option>
                      <option value="DEPORTIVO">Nutrición Deportiva</option>
                      <option value="ESTUDIANTE">Estudiante de Nutrición</option>
                      <option value="DOCENCIA">Docencia / Investigación</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  {/* Teléfono Opcional */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Teléfono / WhatsApp <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      id="lead-phone"
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a88aed]/20 focus:border-[#a88aed] transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button en estilo NutriNet */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full h-13 text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-300 hover:scale-[1.01] hover:shadow-lg shadow-indigo-100 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Reservando tu cupo...
                      </span>
                    ) : (
                      "Reservar Mi Cupo Beta con 50% Dcto."
                    )}
                  </Button>
                </div>

                {/* Privacy & Trust text */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Sin tarjeta de crédito
                  </span>
                  <span>•</span>
                  <span>Datos cifrados (Ley 19.628)</span>
                  <span>•</span>
                  <span>Acceso anticipado garantizado</span>
                </div>
              </form>
            </div>
          ) : (
            /* Celebration Success State */
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-400">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Check className="h-7 w-7 stroke-[2.5]" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  ¡Cupo reservado con éxito!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ¡Gracias, <strong className="text-slate-900">{fullName}</strong>! Te contactaremos a{" "}
                  <strong className="text-[#8f70d8]">{email}</strong> para enviarte tu acceso exclusivo al Beta de NutriNet con 50% de descuento permanente.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#a88aed]/10 text-xs font-bold text-[#8f70d8] max-w-md mx-auto flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#a88aed]" />
                <span>Estás formando parte del futuro de la nutrición clínica basada en evidencia en Chile.</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
