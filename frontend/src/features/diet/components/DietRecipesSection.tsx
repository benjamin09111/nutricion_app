"use client";

import { useState } from "react";
import {
  ChefHat,
  Plus,
  Trash2,
  Sparkles,
  Utensils,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Scale,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { buildExchangeGuideForPatient } from "@/lib/exchange-portions";

export interface DietMealBlock {
  id: string;
  section: string;
  time: string;
  name: string;
  ingredients: string;
  instructions: string;
  portion: string;
}

const DEFAULT_MEAL_SECTIONS = [
  { section: "Desayuno", time: "08:00" },
  { section: "Colación AM", time: "11:00" },
  { section: "Almuerzo", time: "13:30" },
  { section: "Colación PM", time: "17:00" },
  { section: "Cena", time: "20:30" },
];

interface DietRecipesSectionProps {
  meals: DietMealBlock[];
  setMeals: React.Dispatch<React.SetStateAction<DietMealBlock[]>>;
  patientName?: string | null;
  onOpenAdvancedRecipes: () => void;
}

export function DietRecipesSection({
  meals,
  setMeals,
  patientName,
  onOpenAdvancedRecipes,
}: DietRecipesSectionProps) {
  const [showPortionGuide, setShowPortionGuide] = useState(true);
  const [portionGuide, setPortionGuide] = useState(() =>
    buildExchangeGuideForPatient().map((item, idx) => ({
      id: `portion-${idx}`,
      category: item.category,
      portion: item.portion,
      notes: item.notes,
    })),
  );

  const addMealBlock = (sectionName = "Comida nueva", defaultTime = "12:00") => {
    const newMeal: DietMealBlock = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      section: sectionName,
      time: defaultTime,
      name: "",
      ingredients: "",
      instructions: "",
      portion: "",
    };
    setMeals((prev) => [...prev, newMeal]);
  };

  const updateMealBlock = (id: string, field: keyof DietMealBlock, value: string) => {
    setMeals((prev) =>
      prev.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal)),
    );
  };

  const removeMealBlock = (id: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id));
  };

  const suggestRecipeWithAi = (id: string) => {
    const meal = meals.find((m) => m.id === id);
    if (!meal) return;
    const suggestions: Record<string, { name: string; ingredients: string; instructions: string; portion: string }> = {
      Desayuno: {
        name: "Omelette de claras con espinaca y tostadas integrales",
        ingredients: "3 claras de huevo, 1 taza de espinaca fresca, 2 rebanadas de pan integral, 1/2 palta.",
        instructions: "Batir las claras y cocinar en sartén antiadherente con espinacas. Servir sobre pan integral tostado con palta molida.",
        portion: "1 plato completo (aprox. 350 kcal)",
      },
      "Colación AM": {
        name: "Yogurt griego con frutos rojos y almendras",
        ingredients: "150g yogurt griego descremado, 1/2 taza de arándanos, 15g almendras laminadas.",
        instructions: "Mezclar el yogurt con los frutos rojos frescos y espolvorear las almendras por encima.",
        portion: "1 bowl mediano (aprox. 180 kcal)",
      },
      Almuerzo: {
        name: "Pechuga de pollo a la plancha con quinoa y vegetales salteados",
        ingredients: "150g pechuga de pollo, 3/4 taza de quinoa cocida, 1 taza de brócoli y zanahoria salteados.",
        instructions: "Sazonar el pollo con hierbas y dorar a la plancha. Acompañar con la quinoa tibia y vegetales al vapor.",
        portion: "1 plato principal (aprox. 480 kcal)",
      },
      "Colación PM": {
        name: "Manzana verde con mantequilla de maní natural",
        ingredients: "1 manzana verde mediana en rodajas, 1 cucharada (15g) de mantequilla de maní 100% natural.",
        instructions: "Lavar y cortar la manzana en gajos. Untar suavemente con la mantequilla de maní.",
        portion: "1 plato chico (aprox. 190 kcal)",
      },
      Cena: {
        name: "Filete de merluza al horno con ensalada mixta y camote cocido",
        ingredients: "180g filete de merluza u otro pescado blanco, 1/2 camote al horno, 2 tazas de lechuga, tomate y pepino.",
        instructions: "Hornear el pescado con limón y ajo durante 15 min. Acompañar de camote horneado y ensalada fresca.",
        portion: "1 plato principal (aprox. 390 kcal)",
      },
    };

    const suggestion = suggestions[meal.section] || {
      name: `Preparación nutritiva de ${meal.section.toLowerCase()}`,
      ingredients: "Ingredientes seleccionados según la lista de alimentos permitidos.",
      instructions: "Cocinar a la plancha o al vapor con condimentos naturales.",
      portion: "1 porción estándar",
    };

    setMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...suggestion } : m)),
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Paso 3 de 5</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">Recetas & Porciones</span>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Estructuración de Comidas y Recetas</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Transforma la dieta en preparaciones concretas por horario y establece la guía de porciones de intercambio.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onOpenAdvancedRecipes}
          variant="outline"
          className="h-11 shrink-0 rounded-xl border-indigo-200 bg-white font-bold text-indigo-700 hover:bg-indigo-50"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Planificador Avanzado
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Comidas por Horario */}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Planificador de Comidas por Horario</h3>
            <p className="text-xs text-slate-500">
              Define los bloques horarios de alimentación y añade recetas sugeridas para {patientName || "el paciente"}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {DEFAULT_MEAL_SECTIONS.map((item) => (
              <Button
                key={item.section}
                type="button"
                variant="outline"
                onClick={() => addMealBlock(item.section, item.time)}
                className="h-8 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <Plus className="mr-1 h-3 w-3" />
                {item.section}
              </Button>
            ))}
          </div>
        </div>

        {meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Utensils className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Aún no hay bloques de comida definidos</p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Haz clic en los botones superiores (Desayuno, Almuerzo, Cena...) para estructurar las comidas del paciente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-5 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      <Clock className="h-3.5 w-3.5" />
                      <Input
                        type="time"
                        value={meal.time}
                        onChange={(e) => updateMealBlock(meal.id, "time", e.target.value)}
                        className="h-6 w-20 border-0 bg-transparent p-0 text-xs font-bold text-indigo-700 focus-visible:ring-0"
                      />
                    </div>
                    <Input
                      value={meal.section}
                      onChange={(e) => updateMealBlock(meal.id, "section", e.target.value)}
                      placeholder="Nombre del bloque"
                      className="h-8 w-40 rounded-xl border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => suggestRecipeWithAi(meal.id)}
                      className="h-8 rounded-xl border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                      Sugerir Receta Nati
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeMealBlock(meal.id)}
                      className="h-8 w-8 rounded-xl p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Nombre del plato / preparación
                    </label>
                    <Input
                      value={meal.name}
                      onChange={(e) => updateMealBlock(meal.id, "name", e.target.value)}
                      placeholder="Ej: Pechuga a la plancha con quinoa"
                      className="h-10 rounded-xl text-sm font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Porción / Medida sugerida
                    </label>
                    <Input
                      value={meal.portion}
                      onChange={(e) => updateMealBlock(meal.id, "portion", e.target.value)}
                      placeholder="Ej: 1 plato chico (aprox 350 kcal)"
                      className="h-10 rounded-xl text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Ingredientes principales
                    </label>
                    <Textarea
                      value={meal.ingredients}
                      onChange={(e) => updateMealBlock(meal.id, "ingredients", e.target.value)}
                      placeholder="150g pechuga, 3/4 taza quinoa, vegetales al gusto..."
                      className="min-h-[70px] rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Instrucciones de preparación / notas
                    </label>
                    <Textarea
                      value={meal.instructions}
                      onChange={(e) => updateMealBlock(meal.id, "instructions", e.target.value)}
                      placeholder="Cocinar a la plancha con gotas de aceite de oliva..."
                      className="min-h-[70px] rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guía de Porciones de Intercambio */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div
          onClick={() => setShowPortionGuide(!showPortionGuide)}
          className="flex cursor-pointer items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Guía de Porciones de Intercambio Clínico</h3>
              <p className="text-xs text-slate-500">Porciones de referencia para reemplazos equivalentes entre alimentos</p>
            </div>
          </div>

          <Button type="button" variant="ghost" className="h-8 w-8 rounded-xl p-0 text-slate-500">
            {showPortionGuide ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {showPortionGuide && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Grupo / Categoría</th>
                  <th className="px-4 py-3">Porción de Referencia</th>
                  <th className="px-4 py-3">Notas Clínicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {portionGuide.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{row.category}</td>
                    <td className="px-4 py-2.5">
                      <Input
                        value={row.portion}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPortionGuide((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, portion: val } : r)),
                          );
                        }}
                        className="h-7 w-full rounded-lg border-slate-200 text-xs font-semibold text-slate-900"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
