"use client";

import React from "react";
import {
  TrendingDown,
  Droplets,
  CheckCircle2,
  Plus,
  Award,
} from "lucide-react";
import { PatientProfileState, PatientMeal } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientSummaryTabProps {
  profile: PatientProfileState;
  meals: PatientMeal[];
  onAddWater: (amountMl: number) => void;
  onNavigateToMeals: () => void;
}

export function PatientSummaryTab({
  profile,
  meals,
  onAddWater,
  onNavigateToMeals,
}: PatientSummaryTabProps) {
  const consumedMealsCount = meals.filter((m) => m.isConsumed).length;
  const totalMealsCount = meals.length;
  const mealsAdherencePercent = Math.round((consumedMealsCount / (totalMealsCount || 1)) * 100);
  const pendingMealsCount = Math.max(0, totalMealsCount - consumedMealsCount);

  const waterPercent = Math.min(100, Math.round((profile.waterIntakeMl / profile.waterGoalMl) * 100));
  const currentGlasses = Math.round(profile.waterIntakeMl / 250);
  const totalGlasses = Math.round(profile.waterGoalMl / 250);
  const weightLost = (profile.startingWeightKg - profile.currentWeightKg).toFixed(1);

  // SVG Progress Ring calculations (radius = 26, perimeter = 2 * PI * 26 ≈ 163.36)
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (mealsAdherencePercent / 100) * ringCircumference;

  const daysOfWeek = [
    { day: "L", full: "Lun", done: true },
    { day: "M", full: "Mar", done: true },
    { day: "M", full: "Mié", done: true },
    { day: "J", full: "Jue", done: true },
    { day: "V", full: "Vie", done: true },
    { day: "S", full: "Sáb", done: true },
    { day: "D", full: "Dom", done: false, isToday: true },
  ];

  const handleAddGlass = () => {
    // Soft haptic feedback
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    onAddWater(250);
    toast.success("Vaso de agua registrado (+5 puntos)");
  };

  return (
    <div className="space-y-4">
      {/* 
        1. GRID DE MÉTRICAS REDUCIDO A 2 TARJETAS (Sin duplicados de agua ni racha)
        Prioriza lo que cambia cada día. Padding 16-20px, gap 16px.
        Tipografía estricta: títulos 16px/600, números grandes 28-32px/700 tabular-nums whitespace-nowrap, secundario 13px/400.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta 1: Comidas de hoy (con anillo de progreso) */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#20212B]">Comidas de hoy</h2>
              <p className="text-[13px] font-normal text-[#626573] leading-relaxed mt-0.5 whitespace-nowrap">
                {consumedMealsCount} de {totalMealsCount} comidas listas
              </p>
            </div>

            {/* Anillo de Progreso Circular */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke="#F0ECEE"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke="#86A83C"
                  strokeWidth="5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-xs font-bold text-[#20212B] tabular-nums">
                {mealsAdherencePercent}%
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 pt-1 border-t border-[#F0ECEE]">
            <span className="text-[28px] sm:text-[32px] font-bold text-[#20212B] tabular-nums whitespace-nowrap leading-none">
              {mealsAdherencePercent}%
            </span>
            <span className="text-[13px] font-normal text-[#626573] whitespace-nowrap">
              adherencia diaria
            </span>
          </div>

          {/* Objetivo Diario Explícito con retroalimentación al tocar */}
          <div className="pt-0.5">
            <span
              onClick={onNavigateToMeals}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95",
                pendingMealsCount === 0
                  ? "bg-[#F0F5DF] text-[#5A781E]"
                  : "bg-[#F0F5DF] text-[#5A781E] hover:bg-[#E5ECCF]"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#86A83C]" />
              <span>
                {pendingMealsCount === 0
                  ? "¡Completaste todas tus comidas hoy!"
                  : `Te faltan ${pendingMealsCount} comida${pendingMealsCount > 1 ? "s" : ""} hoy`}
              </span>
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Evolución Peso (Limpia y sin saltos de línea) */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#20212B]">Evolución Peso</h2>
              <p className="text-[13px] font-normal text-[#626573] leading-relaxed mt-0.5 whitespace-nowrap">
                Actual: {profile.currentWeightKg} kg · Meta: {profile.goalWeightKg} kg
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0F5DF] text-[#668E20] flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 pt-1 border-t border-[#F0ECEE]">
            <span className="text-[28px] sm:text-[32px] font-bold text-[#20212B] tabular-nums whitespace-nowrap leading-none">
              -{weightLost} kg
            </span>
            <span className="text-[13px] font-normal text-[#626573] whitespace-nowrap">
              desde el inicio
            </span>
          </div>

          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A781E] bg-[#F0F5DF] px-2.5 py-1 rounded-lg">
              <span>Ritmo saludable (-0.4 kg/sem)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 
        2. CONSTANCIA SEMANAL Y CONTROL DE AGUA (Separación 16px, padding 16-20px)
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Constancia Semanal (Tira de 7 días limpia) */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#20212B]">Constancia Semanal</h2>
              <p className="text-[13px] font-normal text-[#626573] leading-relaxed mt-0.5">
                6 de 7 días cumplidos con tu pauta
              </p>
            </div>
            <Award className="w-5 h-5 text-[#86A83C]" />
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {daysOfWeek.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center py-2 min-h-[44px] rounded-xl text-center transition-all hover:scale-105 active:scale-95 select-none",
                  d.done
                    ? "bg-[#F0F5DF] text-[#5A781E]"
                    : d.isToday
                    ? "bg-slate-100 text-slate-800"
                    : "bg-slate-50 text-slate-400"
                )}
              >
                <span className="text-[10px] uppercase font-semibold text-slate-400">{d.full}</span>
                <span className="text-xs font-bold my-0.5">{d.day}</span>
                {d.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#668E20]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Control de Agua (Única tarjeta de agua, interactiva y con touch target >= 44px) */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#20212B]">Control de Agua</h2>
              <p className="text-[13px] font-normal text-[#626573] leading-relaxed mt-0.5">
                Meta: {totalGlasses} vasos al día ({(profile.waterGoalMl / 1000).toFixed(1)} L)
              </p>
            </div>
            <Droplets className="w-5 h-5 text-sky-500" />
          </div>

          <div className="space-y-2 pt-0.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-[28px] sm:text-[32px] font-bold text-[#20212B] tabular-nums whitespace-nowrap leading-none">
                {(profile.waterIntakeMl / 1000).toFixed(2)} L
              </span>
              <span className="text-[13px] font-normal text-[#626573] whitespace-nowrap">
                {currentGlasses} de {totalGlasses} vasos ({waterPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-3">
            <span className="text-[13px] font-normal text-[#626573]">
              {profile.waterIntakeMl >= profile.waterGoalMl
                ? "¡Meta de hidratación alcanzada!"
                : `Faltan ${Math.max(0, totalGlasses - currentGlasses)} vasos para tu meta`}
            </span>
            <button
              type="button"
              onClick={handleAddGlass}
              className="h-11 min-h-[44px] px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+1 Vaso (250 ml)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
