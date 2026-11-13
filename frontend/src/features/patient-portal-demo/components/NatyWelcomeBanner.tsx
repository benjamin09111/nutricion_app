"use client";

import React from "react";
import Image from "next/image";
import { Clock, CheckCircle2, ChevronRight, Flame } from "lucide-react";
import { PatientMeal } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NatyWelcomeBannerProps {
  patientName: string;
  nextMeal?: PatientMeal;
  currentStreakDays: number;
  onConsumeMeal: (mealId: string) => void;
  onViewMealsTab: () => void;
}

export function NatyWelcomeBanner({
  patientName,
  nextMeal,
  currentStreakDays,
  onConsumeMeal,
  onViewMealsTab,
}: NatyWelcomeBannerProps) {
  const firstName = patientName.split(" ")[0] || "Camila";

  const handleMarkAsDone = () => {
    if (!nextMeal) return;
    onConsumeMeal(nextMeal.id);
    toast.success("Comida registrada (+10 puntos)");
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Saludo con avatar de Naty */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-[#E9E5E7] bg-[#F0F5DF]">
            <Image
              src="/circle_logo.webp"
              alt="Naty"
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20212B]">
                ¡Hola, {firstName}!
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#668E20] bg-[#F0F5DF] px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-[#668E20]" />
                <span>{currentStreakDays} días en racha</span>
              </span>
            </div>
            <p className="text-xs text-[#626573] mt-0.5">
              Pauta activa: Recomposición corporal & hábitos saludables
            </p>
          </div>
        </div>

        {/* Recordatorio de Próxima Comida (Limpio y directo, sin cajas anidadas) */}
        {nextMeal ? (
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#F0ECEE]">
            <div className="text-left md:text-right">
              <div className="flex items-center md:justify-end gap-1.5 text-xs font-bold text-[#20212B]">
                <Clock className="w-3.5 h-3.5 text-[#668E20]" />
                <span>{nextMeal.name} ({nextMeal.time} hrs)</span>
              </div>
              <p className="text-[11px] text-[#626573] line-clamp-1 max-w-[220px]">
                {nextMeal.foods[0] || nextMeal.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleMarkAsDone}
                className="h-9 px-3.5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Listo (+10 pts)</span>
              </button>
              <button
                type="button"
                onClick={onViewMealsTab}
                className="h-9 w-9 rounded-xl border border-[#E9E5E7] hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                title="Ver horario"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A781E]">
            <CheckCircle2 className="w-4 h-4 text-[#86A83C]" />
            <span>Completaste todas tus comidas de hoy</span>
          </div>
        )}
      </div>
    </div>
  );
}
