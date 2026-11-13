"use client";

import React from "react";
import {
  TrendingDown,
  Droplets,
  Flame,
  CheckCircle2,
  Plus,
  Scale,
  Award,
  Quote,
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

  const waterPercent = Math.min(100, Math.round((profile.waterIntakeMl / profile.waterGoalMl) * 100));
  const weightLost = (profile.startingWeightKg - profile.currentWeightKg).toFixed(1);

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
    onAddWater(250);
    toast.success("Vaso de agua registrado (+5 puntos)");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 
        1. TIRA UNIFICADA DE INDICADORES KPI (Idéntica al Dashboard Nutricionista)
        Un solo contenedor con divisores sutiles, sin exceso de bordes
      */}
      <div className="bg-white border border-[#E9E5E7] rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0ECEE]">
          {/* KPI 1: Adherencia */}
          <div className="flex items-center gap-3 sm:px-3 pt-2 sm:pt-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F0F5DF] text-[#668E20] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#626573]">Adherencia Hoy</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#20212B]">{mealsAdherencePercent}%</span>
                <span className="text-[11px] text-[#626573] font-medium">{consumedMealsCount}/{totalMealsCount} comidas</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Agua */}
          <div className="flex items-center gap-3 sm:px-3 pt-3 sm:pt-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F0F5DF] text-[#668E20] flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#626573]">Agua Tomada</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#20212B]">{(profile.waterIntakeMl / 1000).toFixed(1)}L</span>
                <span className="text-[11px] text-[#626573] font-medium">Meta: {(profile.waterGoalMl / 1000).toFixed(1)}L</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Peso */}
          <div className="flex items-center gap-3 sm:px-3 pt-3 sm:pt-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F0F5DF] text-[#668E20] flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#626573]">Evolución Peso</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#20212B]">-{weightLost} kg</span>
                <span className="text-[11px] text-[#626573] font-medium">Actual: {profile.currentWeightKg} kg</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Racha */}
          <div className="flex items-center gap-3 sm:px-3 pt-3 sm:pt-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F0F5DF] text-[#668E20] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#626573]">Racha Activa</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#20212B]">{profile.currentStreakDays} días</span>
                <span className="text-[11px] text-[#626573] font-medium">{profile.totalStars} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sección de Dos Columnas Limpia (Sin bordes excesivos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Constancia Semanal */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#20212B]">Constancia Semanal</h3>
              <p className="text-xs text-[#626573] mt-0.5">6 de 7 días cumplidos con tu pauta</p>
            </div>
            <Award className="w-5 h-5 text-[#86A83C]" />
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {daysOfWeek.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all",
                  d.done
                    ? "bg-[#F0F5DF] text-[#5A781E]"
                    : d.isToday
                    ? "bg-slate-100 text-slate-800 font-bold"
                    : "bg-slate-50 text-slate-400"
                )}
              >
                <span className="text-[10px] uppercase font-bold text-slate-400">{d.full}</span>
                <span className="text-xs font-extrabold my-0.5">{d.day}</span>
                {d.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#668E20]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registro Rápido de Agua */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#20212B]">Control de Agua</h3>
              <p className="text-xs text-[#626573] mt-0.5">Meta: 8 vasos al día (2.000 ml)</p>
            </div>
            <Droplets className="w-5 h-5 text-sky-500" />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#626573]">Llevas {(profile.waterIntakeMl / 1000).toFixed(2)}L</span>
              <span className="font-bold text-[#20212B]">{waterPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-[#626573]">
              {profile.waterIntakeMl >= profile.waterGoalMl
                ? "Meta completada hoy"
                : `Faltan ${Math.max(0, Math.round((profile.waterGoalMl - profile.waterIntakeMl) / 250))} vasos`}
            </span>
            <button
              type="button"
              onClick={handleAddGlass}
              className="h-8 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+1 Vaso (250 ml)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Nota Clínica de la Nutricionista */}
      <div className="bg-[#F0F5DF]/50 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white text-[#5A781E] shrink-0 shadow-2xs">
          <Quote className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#20212B]">
            Consejo de tu Nutri (Valentina Soto)
          </p>
          <p className="text-xs text-[#527518] leading-relaxed">
            &ldquo;Excelente ritmo esta semana Camila. Para los días de caminata o entrenamiento por la tarde, recuerda tomar tu colación de avena y yogurt al menos 40 minutos antes. ¡Vas por gran camino!&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
