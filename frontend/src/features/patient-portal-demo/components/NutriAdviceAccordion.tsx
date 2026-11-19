"use client";

import React, { useState } from "react";
import { Quote, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NutriAdviceAccordionProps {
  nutriName?: string;
  nutriSpecialty?: string;
  dateStr?: string;
  adviceText?: string;
}

export function NutriAdviceAccordion({
  nutriName = "Valentina Soto",
  dateStr = "14 Nov",
  adviceText = "Excelente ritmo esta semana Camila. Para los días de caminata o entrenamiento por la tarde, recuerda tomar tu colación de avena y yogurt al menos 40 minutos antes. ¡Vas por gran camino!",
}: NutriAdviceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHasInteracted(true);
  };

  return (
    <div className="w-full bg-[#F8FAF2] border border-[#E2EBC8] rounded-2xl overflow-hidden shadow-2xs transition-all">
      {/* Header simple: solo icono, título y flecha */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] transition-transform select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center text-[#5A781E]">
            <Quote className="w-4 h-4 fill-[#86A83C]/20" />
            {!hasInteracted && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-[#20212B]">
            Consejo de tu Nutri
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#5A781E] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Contenido directo: solo el texto y fecha/firma simplificada */}
      {isOpen && (
        <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-[#E8F0D0] animate-in fade-in-50 duration-150">
          <p className="text-[13px] font-normal text-[#20212B] leading-relaxed">
            &ldquo;{adviceText}&rdquo;
          </p>
          <p className="text-[11px] text-[#626573]">
            {dateStr} · {nutriName}
          </p>
        </div>
      )}
    </div>
  );
}
