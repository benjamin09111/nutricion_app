"use client";

import Link from "next/link";
import {
  Sparkles,
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  MapPin,
  ArrowRight,
  RotateCcw,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MatchedNutritionistItem } from "@/lib/public-nutritionists";

interface TopMatchCardsProps {
  matches: MatchedNutritionistItem[];
  onResetMatch: () => void;
}

export default function TopMatchCards({
  matches,
  onResetMatch,
}: TopMatchCardsProps) {
  if (!matches || matches.length === 0) return null;

  const modeLabels: Record<string, string> = {
    online: "100% Online",
    presencial: "Presencial",
    both: "Online y Presencial",
  };

  return (
    <section className="py-6 sm:py-10 bg-gradient-to-b from-indigo-50/70 via-purple-50/40 to-white border-b border-indigo-100/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Match Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a88aed]/20 text-[#7f5fd6] text-xs font-black uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#a88aed]" />
              NutriMatch · Top 3 Perfiles
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Los 3 nutricionistas con mayor afinidad para ti
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ponderados según tus respuestas de objetivo, modalidad y
              disponibilidad horaria.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onResetMatch}
            className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar Match
          </Button>
        </div>

        {/* The 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {matches.map((item, idx) => {
            const nutri = item.nutritionist;
            const isFirst = idx === 0;

            const whatsappMessage = encodeURIComponent(
              `Hola ${nutri.fullName}, te encontré a través de NutriMatch en NutriNet y me gustaría consultar por tus horas de atención disponibles.`,
            );
            const whatsappUrl = nutri.publicPhone
              ? `https://wa.me/${nutri.publicPhone.replace(/\D/g, "")}?text=${whatsappMessage}`
              : null;

            return (
              <div
                key={nutri.id}
                className={`group relative rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isFirst
                    ? "border-[#a88aed] shadow-lg shadow-[#a88aed]/15 ring-2 ring-[#a88aed]/20"
                    : "border-slate-200 hover:border-[#a88aed]/50 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Header Badge */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-slate-50 to-white">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      isFirst
                        ? "bg-gradient-to-r from-[#a88aed] to-[#8f70d8] text-white shadow-xs"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {item.matchPercentage}% MATCH
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Opción #{idx + 1}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#a88aed]/20 to-[#8f70d8]/30 flex items-center justify-center text-[#8f70d8] text-xl font-black overflow-hidden shrink-0 border border-[#a88aed]/20">
                      {nutri.avatarUrl ? (
                        <img
                          src={nutri.avatarUrl}
                          alt={nutri.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        nutri.fullName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-[#a88aed] transition-colors truncate">
                        {nutri.fullName}
                      </h3>
                      <p className="text-[11px] font-bold text-[#8f70d8] uppercase tracking-wider">
                        {nutri.specialty || "Nutricionista"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 text-amber-400 fill-amber-400"
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 font-bold ml-1">
                          Verificado
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Why it matched badge */}
                  <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 text-xs text-violet-900 font-semibold flex items-start gap-1.5 leading-snug">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#a88aed] shrink-0 mt-0.5" />
                    <span>{item.matchReason}</span>
                  </div>

                  {nutri.headline && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {nutri.headline}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                      {modeLabels[nutri.consultationMode] ||
                        nutri.consultationMode}
                    </span>
                    {nutri.location && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {nutri.location}
                      </span>
                    )}
                    {nutri.prices && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
                        {nutri.prices}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions & Quick Contact */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Contacto rápido:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition cursor-pointer"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {nutri.publicPhone && (
                        <a
                          href={`tel:${nutri.publicPhone}`}
                          className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                          title="Llamar"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {nutri.publicEmail && (
                        <a
                          href={`mailto:${nutri.publicEmail}`}
                          className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                          title="Enviar correo"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {nutri.instagram && (
                        <a
                          href={
                            nutri.instagram.startsWith("http")
                              ? nutri.instagram
                              : `https://instagram.com/${nutri.instagram.replace("@", "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title="Instagram"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Primary CTA: TOMAR HORA */}
                  <Link
                    href={`/nutricionistas/${nutri.slug}#agenda`}
                    className="block"
                  >
                    <Button className="w-full h-10 rounded-xl bg-gradient-to-r from-[#a88aed] to-[#8f70d8] hover:from-[#9b78ea] hover:to-[#7f5fd6] text-white font-extrabold text-xs shadow-md shadow-[#a88aed]/25 transition cursor-pointer flex items-center justify-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>TOMAR HORA CON {nutri.fullName.split(" ")[0]}</span>
                    </Button>
                  </Link>

                  <Link href={`/nutricionistas/${nutri.slug}`} className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer"
                    >
                      <span>Ver perfil y disponibilidad completa</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
