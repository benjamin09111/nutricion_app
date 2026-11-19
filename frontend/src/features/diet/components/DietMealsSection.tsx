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
  Ban,
  X,
  ArrowLeftRight,
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
  avoidFoods?: string[];
  addAvoidFood?: (food: string) => void;
  removeAvoidFood?: (food: string) => void;
  includeAvoidFoodsInPdf?: boolean;
  setIncludeAvoidFoodsInPdf?: React.Dispatch<React.SetStateAction<boolean>>;
}

// Declarado a nivel de módulo: `Date.now` y `Math.random` son impuras y el
// React Compiler no permite invocarlas dentro del cuerpo de un componente.
const createMealRowId = () =>
  `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const createSubstituteRowId = () =>
  `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function DietMealsSection({
  includeMealsSection,
  setIncludeMealsSection,
  dietMealsTableData,
  setDietMealsTableData,
  dishes,
  patientName,
  includeExchangeGuideInPdf = true,
  setIncludeExchangeGuideInPdf,
  avoidFoods = [],
  addAvoidFood,
  removeAvoidFood,
  includeAvoidFoodsInPdf = true,
  setIncludeAvoidFoodsInPdf,
}: DietMealsSectionProps) {
  const [showPortionGuide, setShowPortionGuide] = useState(true);
  const [avoidFoodInput, setAvoidFoodInput] = useState("");
  const [substituteRows, setSubstituteRows] = useState<Array<{ id: string; original: string; substitutes: string[]; draft: string }>>([]);

  const submitAvoidFood = () => {
    if (!addAvoidFood) return;
    const value = avoidFoodInput.trim();
    if (!value) return;
    addAvoidFood(value);
    setAvoidFoodInput("");
  };

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
      id: createMealRowId(),
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

  const addSubstituteRow = () => {
    setSubstituteRows((current) => [
      ...current,
      { id: createSubstituteRowId(), original: "", substitutes: [], draft: "" },
    ]);
  };

  const updateSubstituteRow = (id: string, field: "original" | "draft", value: string) => {
    setSubstituteRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addSubstitute = (id: string) => {
    setSubstituteRows((current) => current.map((row) => {
      if (row.id !== id || !row.draft.trim()) return row;
      return { ...row, substitutes: [...row.substitutes, row.draft.trim()], draft: "" };
    }));
  };

  const removeSubstitute = (id: string, index: number) => {
    setSubstituteRows((current) => current.map((row) => row.id === id ? { ...row, substitutes: row.substitutes.filter((_, itemIndex) => itemIndex !== index) } : row));
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
    toast.success(`Plato "${dish.name}" asignado a la comida.`);
  };

  const autoFillAllMealsFromDishes = () => {
    if (dishes.length === 0) {
      toast.error("No tienes platos creados en el Paso 3.");
      return;
    }
    setDietMealsTableData((prev) =>
      prev.map((row) => {
        const match = dishes.find(
          (d) => d.section.toLowerCase() === row.section.toLowerCase()
        );
        if (match) {
          return {
            ...row,
            dishId: match.id,
            mealText: match.name,
            portion: match.portion || row.portion,
            time: match.time || row.time,
          };
        }
        return row;
      })
    );
    toast.success("Comidas autocompletadas con los platos del Paso 3.");
  };

  return (
    <div className="space-y-6">
      {/* Contenedor Principal de la Tabla de Comidas */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <h3 className="text-base sm:text-lg font-bold text-[#20212B]">
                Tabla de comidas <span className="text-rose-500">*</span>
              </h3>
              <button
                type="button"
                onClick={() => setIncludeMealsSection((current) => !current)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-colors w-fit cursor-pointer",
                  includeMealsSection
                    ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20]"
                    : "border-[#E9E5E7] bg-white text-slate-500"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    includeMealsSection ? "bg-[#86A83C]" : "bg-slate-300"
                  )}
                />
                {includeMealsSection ? "Ocultar sección" : "Incluir sección"}
              </button>

              {includeMealsSection && dishes.length > 0 && (
                <button
                  type="button"
                  onClick={autoFillAllMealsFromDishes}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-3 py-1 text-xs font-semibold text-[#668E20] hover:bg-[#E8EFCB] transition-colors cursor-pointer"
                  title="Autocompletar cada comida con su plato correspondiente del Paso 3"
                >
                  <Utensils className="h-3.5 w-3.5 text-[#86A83C]" />
                  Autocompletar con platos del Paso 3
                </button>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#626573]">
              Completa hora, indicación y porción para cada tiempo de comida.
            </p>
          </div>
        </div>

        {/* Tabla Desktop y Móvil */}
        {!includeMealsSection ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E5E7] bg-slate-50/50 py-10 text-center">
            <Utensils className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-500">La sección de Tabla de Comidas está oculta en el entregable.</p>
            <button
              type="button"
              onClick={() => setIncludeMealsSection(true)}
              className="mt-3 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-3.5 py-1.5 text-xs font-semibold text-[#668E20] hover:bg-[#E8EFCB] transition-colors cursor-pointer"
            >
              Hacer visible la sección
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabla en vista Desktop */}
            <div className="overflow-visible rounded-2xl border border-[#E9E5E7] bg-white shadow-2xs">
              <table className="w-full bg-white text-left text-xs">
                <thead className="bg-[#FAF9F9] text-xs font-semibold text-[#626573] border-b border-[#E9E5E7]">
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
                    const categoryDishes = dishes.filter(
                      (d) => d.section.toLowerCase() === row.section.toLowerCase()
                    );

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 align-top">
                          <select
                            value={row.section}
                            onChange={(e) => updateMealRow(row.id, "section", e.target.value)}
                            className="h-10 w-full rounded-xl border border-[#E9E5E7] bg-white px-3 text-xs font-normal text-[#20212B]"
                          >
                            {QUICK_SECTIONS.map((sec) => (
                              <option key={sec} value={sec}>
                                {sec}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2.5 align-top">
                          <div className="flex items-center gap-2">
                            <Input
                              value={row.mealText}
                              onChange={(e) => updateMealRow(row.id, "mealText", e.target.value)}
                              placeholder={`Escribe la comida de ${row.section}...`}
                              className="h-10 flex-1 rounded-xl border border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
                            />

                            {dishes.length > 0 && (
                              <select
                                value={row.dishId || ""}
                                onChange={(e) => {
                                  const selected = dishes.find((d) => d.id === e.target.value);
                                  if (selected) {
                                    selectDishForMealRow(row.id, selected);
                                  }
                                }}
                                className="h-10 max-w-[200px] shrink-0 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-2.5 text-xs font-medium text-[#668E20] hover:bg-[#E8EFCB] transition-colors cursor-pointer"
                                title="Seleccionar plato del Paso 3"
                              >
                                <option value="" className="text-slate-500 bg-white">
                                  {selectedDish ? `✓ ${selectedDish.name.slice(0, 16)}...` : "Platos Paso 3..."}
                                </option>
                                {categoryDishes.length > 0 && (
                                  <optgroup label={`De ${row.section}`} className="text-[#20212B] bg-white font-semibold">
                                    {categoryDishes.map((d) => (
                                      <option key={d.id} value={d.id} className="text-[#20212B] font-normal">
                                        {d.name} ({d.portion || "1 porción"})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {dishes.filter((d) => d.section.toLowerCase() !== row.section.toLowerCase()).length > 0 && (
                                  <optgroup label="Otras categorías" className="text-slate-500 bg-white font-semibold">
                                    {dishes
                                      .filter((d) => d.section.toLowerCase() !== row.section.toLowerCase())
                                      .map((d) => (
                                        <option key={d.id} value={d.id} className="text-[#20212B] font-normal">
                                          {d.name} ({d.section})
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                              </select>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <Input
                            value={row.time}
                            onChange={(e) => updateMealRow(row.id, "time", e.target.value)}
                            placeholder="08:30"
                            className="h-10 rounded-xl border border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
                          />
                        </td>

                        <td className="px-4 py-3 align-top">
                          <Input
                            value={row.portion}
                            onChange={(e) => updateMealRow(row.id, "portion", e.target.value)}
                            placeholder="1 porción"
                            className="h-10 rounded-xl border border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
                          />
                        </td>

                        <td className="px-4 py-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => removeMealRow(row.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9E5E7] text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar fila"
                            aria-label="Eliminar fila"
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
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573] mr-1">Añadir comida:</span>
                {QUICK_SECTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => addMealRow(sec)}
                    className="rounded-xl border border-[#E9E5E7] bg-white px-2.5 py-1 text-xs font-medium text-[#626573] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] cursor-pointer transition-all"
                  >
                    + {sec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alimentos a evitar (con toggle de inclusión en PDF) */}
      <div className="space-y-4 rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#20212B]">Alimentos a evitar</h3>
              <p className="text-xs text-[#626573]">
                Agrega los alimentos que {patientName || "el paciente"} debe evitar en este plan.
              </p>
            </div>
          </div>

          {setIncludeAvoidFoodsInPdf && (
            <label className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-900 cursor-pointer hover:bg-rose-100/70 transition-colors">
              <input
                type="checkbox"
                checked={includeAvoidFoodsInPdf}
                onChange={(e) => setIncludeAvoidFoodsInPdf(e.target.checked)}
                className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              Incluir en el PDF final
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Input
            value={avoidFoodInput}
            onChange={(e) => setAvoidFoodInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitAvoidFood();
              }
            }}
            placeholder="Ej: Maní, Lácteos, Mariscos..."
            className="h-10 max-w-xs rounded-xl border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={submitAvoidFood}
            className="rounded-xl border-[#E9E5E7] text-xs font-semibold text-[#20212B] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] cursor-pointer"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Agregar
          </Button>
        </div>

        {avoidFoods.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {avoidFoods.map((food) => (
              <span
                key={food}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800"
              >
                {food}
                <button
                  type="button"
                  onClick={() => removeAvoidFood?.(food)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                  title="Quitar"
                  aria-label="Quitar"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No has agregado alimentos a evitar.</p>
        )}
      </div>

      {/* Sustitutos */}
      <div className="space-y-4 rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#20212B]">Sustitutos</h3>
              <p className="text-xs text-[#626573]">Define alternativas prácticas para cada alimento o plato.</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={addSubstituteRow}
            className="h-9 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-3.5 text-xs font-semibold text-[#668E20] hover:bg-[#E8EFCB] shadow-2xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Agregar fila
          </Button>
        </div>

        {substituteRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E9E5E7] bg-slate-50/60 px-4 py-4 text-xs text-[#626573]">Agrega un alimento o plato original y una o más alternativas.</p>
        ) : (
          <div className="space-y-3">
            {substituteRows.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-xl border border-[#E9E5E7] bg-slate-50/50 p-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Original</label>
                  <Input
                    value={row.original}
                    onChange={(event) => updateSubstituteRow(row.id, "original", event.target.value)}
                    placeholder="Ej: arroz blanco"
                    className="h-10 rounded-xl border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Alternativas</label>
                  <div className="flex gap-2">
                    <Input
                      value={row.draft}
                      onChange={(event) => updateSubstituteRow(row.id, "draft", event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubstitute(row.id); } }}
                      placeholder="Ej: quinoa, papa cocida"
                      className="h-10 flex-1 rounded-xl border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
                    />
                    <Button
                      type="button"
                      onClick={() => addSubstitute(row.id)}
                      className="h-10 w-10 shrink-0 rounded-xl bg-[#86A83C] p-0 text-white hover:bg-[#78A82F] cursor-pointer"
                      title="Agregar alternativa"
                      aria-label="Agregar alternativa"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {row.substitutes.map((substitute, index) => (
                      <span key={`${row.id}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-[#DDE7B8] bg-[#F0F5DF] px-2.5 py-1 text-xs font-medium text-[#668E20]">
                        {substitute}
                        <button
                          type="button"
                          onClick={() => removeSubstitute(row.id, index)}
                          className="cursor-pointer text-[#668E20] hover:text-rose-600"
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guía de Porciones de Intercambio (Collapsible con Toggle para PDF) */}
      <div className="space-y-4 rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#20212B]">Guía de Porciones de Intercambio</h3>
              <p className="text-xs text-[#626573]">
                Resumen de equivalencias y porciones para orientar al paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {setIncludeExchangeGuideInPdf && (
              <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-semibold text-amber-900 cursor-pointer hover:bg-amber-100/70 transition-colors">
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
                  className="rounded-xl border border-[#E9E5E7] bg-slate-50/60 p-3.5 transition-all hover:bg-slate-50"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">
                    {item.category}
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-[#20212B]">{item.portion}</p>
                  <p className="mt-1 text-xs font-normal text-[#626573]">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
