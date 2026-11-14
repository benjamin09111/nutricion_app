"use client";

import React, { useState } from "react";
import {
  Utensils,
  GlassWater,
  Scale,
  CheckCircle2,
  Award,
  ChevronRight,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { PatientProfileState, PatientMeal } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientSummaryTabProps {
  profile: PatientProfileState;
  meals: PatientMeal[];
  onAddWater: (amountMl: number) => void;
  onNavigateToMeals: () => void;
  onNavigateToGoals?: () => void;
}

// Mitos y realidades nutricionales verificados que rotan diariamente
const NUTRITION_MYTHS = [
  {
    myth: "Comer carbohidratos de noche engorda más que de día.",
    fact: "El cuerpo aprovecha la energía según tus necesidades totales, sin importar la hora del reloj. Lo determinante es el balance calórico del día.",
  },
  {
    myth: "Tomar agua tibia con limón en ayunas quema grasa corporal.",
    fact: "El limón aporta vitamina C y antioxidantes, pero ningún alimento por sí solo quema o disuelve grasa de forma mágica.",
  },
  {
    myth: "Para perder peso hay que eliminar todas las grasas de la dieta.",
    fact: "Las grasas saludables (palta, oliva, frutos secos) son indispensables para tus hormonas, absorción de vitaminas y saciedad.",
  },
  {
    myth: "Comer fruta como postre después del almuerzo fermenta y engorda.",
    fact: "La fruta aporta exactamente las mismas calorías y fibra consumida antes, durante o después de tu plato principal.",
  },
  {
    myth: "El huevo entero eleva peligrosamente el colesterol en sangre.",
    fact: "Es rico en colina y proteína de alta biodisponibilidad. En la gran mayoría de personas, el colesterol dietético tiene un impacto mínimo.",
  },
  {
    myth: "Saltarse comidas ayuda a acelerar la pérdida de peso.",
    fact: "Provoca acumulación de hambre para la siguiente comida, mayor ansiedad y puede comprometer tu masa muscular activa.",
  },
  {
    myth: "Los productos 'light' o 'sin azúcar' se pueden consumir sin límite.",
    fact: "'Light' solo significa una reducción frente al original, pero igualmente aportan calorías y requieren moderación.",
  },
];

export function PatientSummaryTab({
  profile,
  meals,
  onAddWater,
  onNavigateToMeals,
  onNavigateToGoals,
}: PatientSummaryTabProps) {
  const consumedMealsCount = meals.filter((m) => m.isConsumed).length;
  const totalMealsCount = meals.length;
  const currentGlasses = Math.round(profile.waterIntakeMl / 250);
  const totalGlasses = Math.round(profile.waterGoalMl / 250);
  const weightLost = (profile.startingWeightKg - profile.currentWeightKg).toFixed(1);

  // Mito nutricional diario rotativo según el día del año (o seleccionable con botón)
  const [currentMythIndex, setCurrentMythIndex] = useState(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(today.getFullYear(), 0, 0)) /
        (24 * 60 * 60 * 1000)
    );
    return Math.abs(dayOfYear) % NUTRITION_MYTHS.length;
  });
  const activeMyth = NUTRITION_MYTHS[currentMythIndex];

  const daysOfWeek = [
    { day: "L", full: "Lun", done: true },
    { day: "M", full: "Mar", done: true },
    { day: "M", full: "Mié", done: true },
    { day: "J", full: "Jue", done: true },
    { day: "V", full: "Vie", done: true },
    { day: "S", full: "Sáb", done: true },
    { day: "D", full: "Dom", done: false, isToday: true },
  ];

  const handleAddGlass = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        1. TIRA DE 3 COLUMNAS SIN BORDES NI CARDS (Cero ruido visual, información directa)
        Columna 1: Comidas de hoy
        Columna 2: Vasos de agua
        Columna 3: Evolución de peso
      */}
      <div className="py-1">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 divide-x divide-slate-200/80 py-1">
          {/* Columna 1: Comidas (Servicios) */}
          <div
            onClick={onNavigateToMeals}
            className="flex flex-col items-center justify-center text-center px-1 sm:px-3 cursor-pointer group active:scale-95 transition-transform"
            title="Comidas de hoy"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F0F5DF] text-[#5A781E] flex items-center justify-center shrink-0 mb-1.5 group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[22px] sm:text-[28px] font-bold text-[#20212B] tabular-nums whitespace-nowrap leading-none">
              {consumedMealsCount}/{totalMealsCount}
            </span>
          </div>

          {/* Columna 2: Vaso de agua (Interactivo al tocar) */}
          <div
            onClick={handleAddGlass}
            className="flex flex-col items-center justify-center text-center px-1 sm:px-3 cursor-pointer group active:scale-95 transition-transform"
            title="Toca para registrar +1 vaso de agua"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 mb-1.5 group-hover:scale-105 transition-transform relative">
              <GlassWater className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-sky-500 text-white items-center justify-center text-[10px] font-bold">
                +
              </span>
            </div>
            <span className="text-[22px] sm:text-[28px] font-bold text-[#20212B] tabular-nums whitespace-nowrap leading-none">
              {currentGlasses}/{totalGlasses}
            </span>
          </div>

          {/* Columna 3: Peso / Evolución (Báscula de peso) */}
          <div
            onClick={onNavigateToGoals}
            className="flex flex-col items-center justify-center text-center px-1 sm:px-3 cursor-pointer group active:scale-95 transition-transform"
            title="Evolución de peso"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#668E20] flex items-center justify-center shrink-0 mb-1.5 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[22px] sm:text-[28px] font-bold text-[#20212B] tabular-nums whitespace-nowrap leading-none">
              -{weightLost} kg
            </span>
          </div>
        </div>

        {/* Enlace sutil Ver más detalles */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Progreso general de tu tratamiento</span>
          {onNavigateToGoals && (
            <button
              type="button"
              onClick={onNavigateToGoals}
              className="font-semibold text-[#5A781E] hover:underline flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <span>Ver más detalles</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 
        2. CONSTANCIA SEMANAL (Se mantiene igual a petición del usuario)
      */}
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

      {/* 
        3. DATO CURIOSO / MITO DEL DÍA (Sin border, sin card - 100% minimalista)
      */}
      <div className="pt-1 pb-2 space-y-1.5 select-none px-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#5A781E] font-semibold">
            <Lightbulb className="w-4 h-4 text-[#86A83C]" />
            <span>Mito Nutricional del Día</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentMythIndex((prev) => (prev + 1) % NUTRITION_MYTHS.length)}
            className="text-[11px] text-slate-400 hover:text-[#5A781E] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            title="Ver otro mito nutricional"
          >
            <span>Ver otro</span>
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#20212B] leading-snug">
            &ldquo;{activeMyth.myth}&rdquo;
          </p>
          <p className="text-[13px] font-normal text-[#626573] leading-relaxed">
            <span className="font-semibold text-[#5A781E]">Realidad: </span>
            {activeMyth.fact}
          </p>
        </div>
      </div>
    </div>
  );
}
