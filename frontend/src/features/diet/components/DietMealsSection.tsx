"use client";

import { useState } from "react";
import {
  ChefHat,
  Plus,
  Trash2,
  Sparkles,
  Utensils,
  Loader2,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { buildExchangeGuideForPatient } from "@/lib/exchange-portions";
import { DietMealBlock } from "./DietRecipesSection";
import { toast } from "sonner";

export interface DietMealTableRow {
  id: string;
  section: string;
  mealText: string;
  time: string;
  portion: string;
  dishId?: string;
}

const QUICK_SECTIONS = [
  "Desayuno",
  "Colación AM",
  "Almuerzo",
  "Colación PM",
  "Once",
  "Cena",
  "Post entreno",
];

interface DietMealsSectionProps {
  includeMealsSection: boolean;
  setIncludeMealsSection: React.Dispatch<React.SetStateAction<boolean>>;
  dietMealsTableData: DietMealTableRow[];
  setDietMealsTableData: React.Dispatch<React.SetStateAction<DietMealTableRow[]>>;
  dishes: DietMealBlock[];
  patientName?: string | null;
  includeExchangeGuideInPdf?: boolean;
  setIncludeExchangeGuideInPdf?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DietMealsSection({
  includeMealsSection,
  setIncludeMealsSection,
  dietMealsTableData,
  setDietMealsTableData,
  dishes,
  patientName,
  includeExchangeGuideInPdf = true,
  setIncludeExchangeGuideInPdf,
}: DietMealsSectionProps) {
  const [activeDishSelectorId, setActiveDishSelectorId] = useState<string | null>(null);
  const [showPortionGuide, setShowPortionGuide] = useState(true);

  const [portionGuide] = useState(() =>
    buildExchangeGuideForPatient().map((item, idx) => ({
      id: `portion-${idx}`,
      category: item.category,
      portion: item.portion,
      notes: item.notes,
    }))
  );

  const addMealRow = (defaultSection = "Almuerzo", defaultTime = "13:30") => {
    const newRow: DietMealTableRow = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      section: defaultSection,
      mealText: "",
      time: defaultTime,
      portion: "1 porción",
    };
    setDietMealsTableData((prev) => [...prev, newRow]);
  };

  const updateMealRow = (id: string, field: keyof DietMealTableRow, value: string) => {
    setDietMealsTableData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeMealRow = (id: string) => {
    setDietMealsTableData((prev) => prev.filter((row) => row.id !== id));
  };

  const selectDishForMealRow = (rowId: string, dish: DietMealBlock) => {
    setDietMealsTableData((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            dishId: dish.id,
            mealText: dish.name || row.mealText,
            section: dish.section || row.section,
            portion: dish.portion || row.portion,
            time: dish.time || row.time,
          };
        }
        return row;
      })
    );
    setActiveDishSelectorId(null);
    toast.success(`Plato "${dish.name}" asignado a la comida.`);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Encabezado */}
      <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Paso 4 de 6</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">Comidas & Horarios</span>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Tabla de Comidas y Porciones</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Estructura los tiempos de comida, asigna porciones y enlaza tus platos creados para {patientName || "el paciente"}.
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor Principal de la Tabla de Comidas */}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h3 className="text-lg font-black text-slate-900">
                Tabla de comidas <span className="text-rose-600">*</span>
              </h3>
              <button
                type="button"
                onClick={() => setIncludeMealsSection((current) => !current)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest transition-colors w-fit cursor-pointer",
                  includeMealsSection
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    includeMealsSection ? "bg-emerald-500" : "bg-slate-300"
                  )}
                />
                {includeMealsSection ? "Sección visible" : "Ocultar sección"}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Completa hora, indicación y porción para cada tiempo de comida.
            </p>
          </div>
        </div>

        {/* Tabla Desktop y Móvil */}
        {!includeMealsSection ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
            <Utensils className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-500">La sección de Tabla de Comidas está oculta en el entregable.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIncludeMealsSection(true)}
              className="mt-3 rounded-xl border-slate-200 text-xs font-bold text-slate-700"
            >
              Hacer visible la sección
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabla en vista Desktop */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[760px] bg-white text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-44">Categoría</th>
                    <th className="px-4 py-3">Alimentos / Seleccionar Plato</th>
                    <th className="px-4 py-3 w-32">Hora</th>
                    <th className="px-4 py-3 w-40">Porciones</th>
                    <th className="px-4 py-3 w-20 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dietMealsTableData.map((row) => {
                    const selectedDish = dishes.find((d) => d.id === row.dishId);
                    const isSelectorOpen = activeDishSelectorId === row.id;
                    const categoryDishes = dishes.filter(
                      (d) => d.section.toLowerCase() === row.section.toLowerCase()
                    );

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <select
                            value={row.section}
                            onChange={(e) => updateMealRow(row.id, "section", e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {QUICK_SECTIONS.map((sec) => (
                              <option key={sec} value={sec}>
                                {sec}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1.5 relative">
                            {/* Selector Principal de Plato Creado en Paso 3 */}
                            <button
                              type="button"
                              onClick={() => setActiveDishSelectorId(isSelectorOpen ? null : row.id)}
                              className={cn(
                                "flex h-10 w-full items-center justify-between rounded-xl border px-3 text-xs font-semibold transition-all cursor-pointer",
                                selectedDish || row.mealText
                                  ? "border-indigo-200 bg-indigo-50/60 text-indigo-950 hover:bg-indigo-50 shadow-2xs"
                                  : "border-amber-200 bg-amber-50/60 text-amber-900 hover:bg-amber-50"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <ChefHat className={cn("h-4 w-4 shrink-0", selectedDish ? "text-indigo-600" : "text-amber-600")} />
                                <span className="truncate font-bold">
                                  {selectedDish
                                    ? selectedDish.name
                                    : row.mealText || `Seleccionar plato de ${row.section}...`}
                                </span>
                              </div>
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            </button>

                            {/* Popover Selector de Platos Creados en Paso 3 */}
                            {isSelectorOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveDishSelectorId(null)}
                                />
                                <div className="absolute left-0 top-full z-30 mt-1 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-3 shadow-xl space-y-2">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Platos creados ({dishes.length})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveDishSelectorId(null)}
                                      className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      Cerrar
                                    </button>
                                  </div>

                                  {dishes.length === 0 ? (
                                    <div className="py-4 text-center space-y-1">
                                      <p className="text-xs text-amber-700 font-semibold">
                                        No has creado ningún plato en el Paso 3.
                                      </p>
                                      <p className="text-[11px] text-slate-400">
                                        Regresa al paso anterior ("Platos") para generar o crear tus preparaciones.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                      {(categoryDishes.length > 0 ? categoryDishes : dishes).map((dish) => (
                                        <button
                                          key={dish.id}
                                          type="button"
                                          onClick={() => selectDishForMealRow(row.id, dish)}
                                          className={`flex w-full items-center justify-between rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                                            row.dishId === dish.id
                                              ? "border-indigo-300 bg-indigo-50/80 text-indigo-900 font-bold"
                                              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                                          }`}
                                        >
                                          <div>
                                            <p className="font-bold">{dish.name || "Plato sin nombre"}</p>
                                            <span className="text-[10px] text-slate-400">
                                              {dish.section} · {dish.portion || "1 porción"}
                                            </span>
                                          </div>
                                          {row.dishId === dish.id && (
                                            <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                                          )}
                                        </button>
                                      ))}

                                      {categoryDishes.length > 0 && categoryDishes.length < dishes.length && (
                                        <div className="pt-2 border-t border-slate-100 mt-2">
                                          <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">OTRAS CATEGORÍAS</p>
                                          {dishes
                                            .filter((d) => d.section.toLowerCase() !== row.section.toLowerCase())
                                            .map((dish) => (
                                              <button
                                                key={dish.id}
                                                type="button"
                                                onClick={() => selectDishForMealRow(row.id, dish)}
                                                className={`flex w-full items-center justify-between rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                                                  row.dishId === dish.id
                                                    ? "border-indigo-300 bg-indigo-50/80 text-indigo-900 font-bold"
                                                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                                                }`}
                                              >
                                                <div>
                                                  <p className="font-bold">{dish.name || "Plato sin nombre"}</p>
                                                  <span className="text-[10px] text-slate-400">
                                                    {dish.section} · {dish.portion || "1 porción"}
                                                  </span>
                                                </div>
                                                {row.dishId === dish.id && (
                                                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                                                )}
                                              </button>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <Input
                            value={row.time}
                            onChange={(e) => updateMealRow(row.id, "time", e.target.value)}
                            placeholder="08:30"
                            className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold"
                          />
                        </td>

                        <td className="px-4 py-3 align-top">
                          <Input
                            value={row.portion}
                            onChange={(e) => updateMealRow(row.id, "portion", e.target.value)}
                            placeholder="1 porción"
                            className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold"
                          />
                        </td>

                        <td className="px-4 py-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => removeMealRow(row.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Agregar Fila Rápida por Categoría */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Añadir comida:</span>
                {QUICK_SECTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => addMealRow(sec)}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 cursor-pointer transition-all"
                  >
                    + {sec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guía de Porciones de Intercambio (Collapsible con Toggle para PDF) */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Guía de Porciones de Intercambio</h3>
              <p className="text-xs text-slate-500">
                Resumen de equivalencias y porciones para orientar al paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {setIncludeExchangeGuideInPdf && (
              <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-900 cursor-pointer hover:bg-amber-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={includeExchangeGuideInPdf}
                  onChange={(e) => setIncludeExchangeGuideInPdf(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                Incluir en el PDF final
              </label>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPortionGuide(!showPortionGuide)}
              className="rounded-xl cursor-pointer"
            >
              {showPortionGuide ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {showPortionGuide && (
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {portionGuide.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-all hover:bg-slate-50"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{item.portion}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
