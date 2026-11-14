"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Clock, CheckCircle2, ChevronRight, Flame, Sparkles } from "lucide-react";
import { PatientMeal } from "../types";
import { NutriAdviceAccordion } from "./NutriAdviceAccordion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NatyWelcomeBannerProps {
  patientName: string;
  nextMeal?: PatientMeal;
  currentStreakDays: number;
  totalStars?: number;
  completedMealsCount: number;
  totalMealsCount: number;
  nutriName?: string;
  nutriSpecialty?: string;
  onConsumeMeal: (mealId: string) => void;
  onViewMealsTab: () => void;
}

export function NatyWelcomeBanner({
  patientName,
  nextMeal,
  currentStreakDays,
  totalStars = 240,
  completedMealsCount,
  totalMealsCount,
  nutriName = "Valentina Soto",
  nutriSpecialty = "Nutricionista Clínica",
  onConsumeMeal,
  onViewMealsTab,
}: NatyWelcomeBannerProps) {
  const firstName = patientName.split(" ")[0] || "Camila";
  const [isBouncing, setIsBouncing] = useState(false);
  const [showPointsPop, setShowPointsPop] = useState(false);

  // Gamification: Level 3 XP progress calculation (e.g. 200 - 300 pts)
  const currentLevelXp = Math.max(0, totalStars % 100);
  const nextLevelGoalXp = 100;
  const xpPercent = Math.min(100, Math.round((currentLevelXp / nextLevelGoalXp) * 100));

  // Mensaje ultra-corto de Naty (conciso, positivo y sin cortes en mobile)
  const getContextualMessage = () => {
    if (completedMealsCount === totalMealsCount && totalMealsCount > 0) {
      return "¡Todo listo por hoy!";
    }
    return "¡Vas con muy buen ritmo!";
  };

  const handleMarkAsDone = () => {
    if (!nextMeal) return;

    // Haptic feedback (supported mobile browsers)
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([15, 50, 15]);
      } catch {
        // Fallback silently if vibrating not supported or denied
      }
    }

    // Trigger visual animations
    setIsBouncing(true);
    setShowPointsPop(true);
    setTimeout(() => setIsBouncing(false), 700);
    setTimeout(() => setShowPointsPop(false), 1400);

    onConsumeMeal(nextMeal.id);
    toast.success("¡Comida registrada! +10 puntos para tu nivel");
  };

  const pendingMealsCount = Math.max(0, totalMealsCount - completedMealsCount);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 
        1. SALUDO COMPACTO (1-2 Líneas) + BARRA DE XP DE NIVEL
        Tipografía estricta: 22px/700 saludo, 13px/400 texto secundario, 600 etiquetas
      */}
      <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          {/* Avatar de Naty reactivo y saludo */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => {
                setIsBouncing(true);
                setTimeout(() => setIsBouncing(false), 700);
              }}
              className={cn(
                "relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-[#E9E5E7] bg-[#F0F5DF] transition-transform duration-300 cursor-pointer hover:scale-105 active:scale-90",
                isBouncing && "scale-110 -rotate-6 animate-pulse"
              )}
              title="¡Hola! Soy Naty"
            >
              <Image
                src="/circle_logo.webp"
                alt="Naty Nutria"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-bold text-[#20212B] leading-tight tracking-tight">
                  ¡Hola, {firstName}!
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A781E] bg-[#F0F5DF] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 text-[#86A83C]" />
                  <span>{currentStreakDays} días en racha</span>
                </span>
              </div>
              <p className="text-[13px] font-normal text-[#626573] leading-snug mt-0.5 whitespace-nowrap">
                {getContextualMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de XP visible en Home hacia el siguiente nivel */}
        <div className="pt-1 border-t border-[#F0ECEE] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#626573] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#86A83C]" />
              Nivel 3 · Hábito de Oro
            </span>
            <span className="font-bold text-[#20212B] tabular-nums whitespace-nowrap">
              {totalStars} / 300 pts
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#F0ECEE] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#86A83C] transition-all duration-500 ease-out"
              style={{ width: `${Math.max(15, xpPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 
        2. CONSEJO DE TU NUTRI (Acordeón desplegable justo abajo de ¡Hola, Camila! y arriba de Completa tu...)
      */}
      <NutriAdviceAccordion
        nutriName={nutriName}
        nutriSpecialty={nutriSpecialty}
      />

      {/* 
        3. ESTADO DE RACHA EN RIESGO (Acento suave, tono positivo y motivacional)
        Se muestra si quedan comidas pendientes en el día
      */}
      {pendingMealsCount > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/70 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[13px] font-normal text-amber-900 leading-snug">
              Completa tu próxima comida para asegurar tu racha de{" "}
              <span className="font-semibold text-amber-950 whitespace-nowrap">
                {currentStreakDays} días
              </span>{" "}
              hoy.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
            En juego
          </span>
        </div>
      )}

      {/* 
        3. TARJETA HERO: PRÓXIMA COMIDA (Elemento Principal de Jerarquía)
        Más grande, comida en 18px/600, hora clara y botón prominente (área táctil >= 44px)
      */}
      {nextMeal ? (
        <div className="relative bg-[#F8FAF2] border border-[#E2EBC8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          {/* Float visual de +10 pts al tocar "Listo" */}
          {showPointsPop && (
            <div className="absolute top-3 right-5 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
              <span className="inline-flex items-center gap-1 text-sm font-bold text-white bg-[#668E20] px-3 py-1 rounded-full shadow-md">
                +10 pts ⭐
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5A781E] uppercase tracking-wider">
                  Próxima comida
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A781E] bg-white border border-[#D5E3B3] px-2 py-0.5 rounded-md whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-[#86A83C]" />
                  <span>{nextMeal.time} hrs</span>
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#20212B] leading-snug">
                {nextMeal.name}
              </h2>
            </div>
          </div>

          {/* Detalle o ingredientes principales */}
          <p className="text-[13px] font-normal text-[#626573] leading-relaxed line-clamp-2">
            {nextMeal.foods.length > 0
              ? nextMeal.foods.join(" · ")
              : nextMeal.subtitle || "Porción balanceada según tu pauta nutricional"}
          </p>

          {/* Botones de acción con touch targets >= 44px y animaciones táctiles */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleMarkAsDone}
              className="flex-1 h-12 min-h-[44px] px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] hover:scale-[1.01] active:scale-95 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Listo (+10 pts)</span>
            </button>

            <button
              type="button"
              onClick={onViewMealsTab}
              className="h-12 w-12 min-h-[44px] min-w-[44px] rounded-xl border border-[#D5E3B3] bg-white hover:bg-[#F0F5DF] hover:scale-105 active:scale-90 flex items-center justify-center text-[#5A781E] transition-all cursor-pointer shrink-0"
              title="Ver horario completo de comidas"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#F0F5DF] border border-[#DCE8BF] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#668E20] flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#20212B]">
                ¡Completaste todas tus comidas de hoy!
              </h2>
              <p className="text-[13px] font-normal text-[#5A781E] leading-relaxed mt-0.5">
                Ganaste tus 50 puntos de constancia diaria. ¡Gran trabajo!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewMealsTab}
            className="h-11 px-3.5 min-h-[44px] rounded-xl bg-white border border-[#D5E3B3] text-[#5A781E] text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            Ver pauta
          </button>
        </div>
      )}
    </div>
  );
}
