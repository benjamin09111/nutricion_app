"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  Circle,
  Info,
} from "lucide-react";
import { PatientMeal } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientMealsTabProps {
  meals: PatientMeal[];
  onToggleMeal: (mealId: string) => void;
}

export function PatientMealsTab({ meals, onToggleMeal }: PatientMealsTabProps) {
  const handleToggle = (meal: PatientMeal) => {
    onToggleMeal(meal.id);
    if (!meal.isConsumed) {
      toast.success(`¡${meal.name} completada! (+10 puntos)`);
    } else {
      toast.info(`Desmarcaste ${meal.name}`);
    }
  };

  const completedCount = meals.filter((m) => m.isConsumed).length;

  return (
    <div className="space-y-4">
      {/* Header Limpio del Módulo */}
      <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E5E7] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#20212B]">
            Pauta de Comidas & Horarios
          </h2>
          <p className="text-xs text-[#626573] mt-0.5">
            Menú personalizado diseñado por tu Nutri Valentina
          </p>
        </div>

        <div className="text-right">
          <span className="text-sm font-black text-[#20212B]">{completedCount} de {meals.length}</span>
          <span className="text-[11px] text-[#626573] block">comidas listas</span>
        </div>
      </div>

      {/* Lista de Comidas (Diseño suelto y limpio, sin cajas dentro de cajas) */}
      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className={cn(
              "rounded-2xl border transition-all p-4 sm:p-5 shadow-2xs",
              meal.isConsumed
                ? "bg-slate-50/60 border-slate-200"
                : "bg-white border-[#E9E5E7] hover:border-[#86A83C]"
            )}
          >
            {/* Cabecera de la Comida */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(meal)}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5",
                    meal.isConsumed
                      ? "bg-[#86A83C] text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-[#F0F5DF] text-slate-400 hover:text-[#5A781E]"
                  )}
                  aria-label={meal.isConsumed ? "Marcar como pendiente" : "Marcar como lista"}
                >
                  {meal.isConsumed ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Circle className="w-5 h-5 stroke-[2]" />
                  )}
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#668E20] bg-[#F0F5DF] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meal.time} hrs
                    </span>
                    <h3
                      className={cn(
                        "text-sm sm:text-base font-bold",
                        meal.isConsumed ? "text-slate-400 line-through" : "text-[#20212B]"
                      )}
                    >
                      {meal.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#626573] mt-0.5">{meal.subtitle}</p>
                </div>
              </div>

              <span className="text-xs font-semibold text-[#626573] shrink-0">
                ~{meal.caloriesApprox} kcal
              </span>
            </div>

            {/* Alimentos (Sueltos directamente en la tarjeta, sin caja gris anidada) */}
            <div className="pl-12 pt-3 space-y-1.5 text-xs text-slate-700">
              {meal.foods.map((food, fIdx) => (
                <div key={fIdx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] shrink-0 mt-1.5" />
                  <span className={cn(meal.isConsumed && "text-slate-400")}>{food}</span>
                </div>
              ))}
            </div>

            {/* Porciones y Nota al pie (Limpio y sutil) */}
            <div className="pl-12 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 mt-3 text-[11px] text-[#626573]">
              <div>
                <span className="font-semibold text-slate-500 mr-1">Porciones:</span>
                <span>
                  {meal.portions.map((p) => `${p.count} ${p.label}`).join(" • ")}
                </span>
              </div>

              {meal.nutriNote && (
                <span className="text-[#5A781E] flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>{meal.nutriNote}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
