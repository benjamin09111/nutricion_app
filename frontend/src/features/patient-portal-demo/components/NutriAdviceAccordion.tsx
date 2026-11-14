"use client";

import React, { useState } from "react";
import { Quote, ChevronDown, Sparkles, Calendar, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface NutriAdviceAccordionProps {
  nutriName?: string;
  nutriSpecialty?: string;
  dateStr?: string;
  adviceText?: string;
}

export function NutriAdviceAccordion({
  nutriName = "Valentina Soto",
  nutriSpecialty = "Nutricionista Clínica",
  dateStr = "Hoy, 14 de Noviembre",
  adviceText = "Excelente ritmo esta semana Camila. Para los días de caminata o entrenamiento por la tarde, recuerda tomar tu colación de avena y yogurt al menos 40 minutos antes. ¡Vas por gran camino!",
}: NutriAdviceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHasInteracted(true);
  };

  return (
    <div className="w-full bg-[#F8FAF2] border border-[#DCE8BF] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
      {/* Botón Accordeon Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] transition-transform select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Icono con badge de notificación pulsante */}
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#D5E3B3] text-[#5A781E] flex items-center justify-center shrink-0 shadow-2xs">
            <Quote className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-[#86A83C]/20 text-[#5A781E]" />
            {/* Señal de Notificación Nueva */}
            {!hasInteracted && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white shadow-xs" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-[#20212B] truncate">
                Consejo de tu Nutri ({nutriName})
              </span>
              {!hasInteracted ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A781E] bg-[#EAF2D3] px-2 py-0.5 rounded-full whitespace-nowrap">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Nuevo mensaje</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-normal">
                  {isOpen ? "Toca para ocultar" : "Toca para leer"}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#626573] truncate mt-0.5">
              {isOpen ? "Recomendación personalizada para tu plan" : `"${adviceText.slice(0, 52)}..."`}
            </p>
          </div>
        </div>

        {/* Chevron Animado */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400 hover:text-slate-600">
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform duration-200 text-[#5A781E]",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Contenido Desplegable (Animación fluida al abrir) */}
      {isOpen && (
        <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 border-t border-[#E8F0D0] animate-in fade-in-50 slide-in-from-top-1 duration-200 space-y-2.5">
          <p className="text-[13px] font-normal text-[#455A1A] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#E2EBC8]">
            &ldquo;{adviceText}&rdquo;
          </p>

          {/* Fecha y firma abajito como solicitó el usuario */}
          <div className="flex items-center justify-between text-[11px] text-[#626573] pt-0.5 px-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#86A83C]" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1 text-[#5A781E] font-semibold">
              <Stethoscope className="w-3 h-3" />
              <span>{nutriName} · {nutriSpecialty}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
