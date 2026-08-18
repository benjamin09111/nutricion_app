"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  ChefHat,
  Plus,
  Trash2,
  Sparkles,
  Utensils,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Filter,
  Pencil,
  Scale,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { buildExchangeGuideForPatient } from "@/lib/exchange-portions";
import { AiValidationModal } from "@/features/recipes/components/AiValidationModal";

export interface DietMealBlock {
  id: string;
  section: string;
  time: string;
  name: string;
  ingredients: string;
  instructions: string;
  portion: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fats?: string;
}

const DEFAULT_MEAL_SECTIONS = [
  { section: "Desayuno", time: "08:00" },
  { section: "Colación AM", time: "11:00" },
  { section: "Almuerzo", time: "13:30" },
  { section: "Colación PM", time: "17:00" },
  { section: "Cena", time: "20:30" },
];

const MEAL_SECTION_TABS = [
  "Todos",
  "Desayuno",
  "Colación AM",
  "Almuerzo",
  "Colación PM",
  "Cena",
];

const DISHES_PER_PAGE = 5;
const createMealId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

interface DietRecipesSectionProps {
  meals: DietMealBlock[];
  setMeals: React.Dispatch<React.SetStateAction<DietMealBlock[]>>;
  patientName?: string | null;
  onOpenAdvancedRecipes: () => void;
  onImportRecipe?: () => void;
  isGeneratingAiDishes?: boolean;
  onQuickGenerateAiDishes?: (categoryTargets?: Record<string, number>) => void;
  isAiValidationModalOpen?: boolean;
  setIsAiValidationModalOpen?: (open: boolean) => void;
  pendingAiDishes?: any[];
  onConfirmAiDishes?: (dishes: any[]) => void;
  patient?: any;
}

export function DietRecipesSection({
  meals,
  setMeals,
  patientName,
  onOpenAdvancedRecipes,
  onImportRecipe,
  isGeneratingAiDishes = false,
  onQuickGenerateAiDishes,
  isAiValidationModalOpen = false,
  setIsAiValidationModalOpen,
  pendingAiDishes = [],
  onConfirmAiDishes,
  patient,
}: DietRecipesSectionProps) {
  const [activeTab, setActiveTab] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [showPortionGuide, setShowPortionGuide] = useState(true);

  const [portionGuide] = useState(() =>
    buildExchangeGuideForPatient().map((item, idx) => ({
      id: `portion-${idx}`,
      category: item.category,
      portion: item.portion,
      notes: item.notes,
    })),
  );

  const filteredMeals = useMemo(() => {
    if (activeTab === "Todos") return meals;
    return meals.filter(
      (m) => m.section.toLowerCase().trim() === activeTab.toLowerCase().trim(),
    );
  }, [meals, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredMeals.length / DISHES_PER_PAGE));
  const pagedMeals = useMemo(() => {
    const start = (currentPage - 1) * DISHES_PER_PAGE;
    return filteredMeals.slice(start, start + DISHES_PER_PAGE);
  }, [filteredMeals, currentPage]);

  const addMealBlock = (sectionName = "Almuerzo", defaultTime = "13:30") => {
    const newMeal: DietMealBlock = {
      id: createMealId(),
      section: sectionName,
      time: defaultTime,
      name: "",
      ingredients: "",
      instructions: "",
      portion: "1 porción estándar",
      calories: "350",
      protein: "25",
      carbs: "40",
      fats: "10",
    };
    setMeals((prev) => [...prev, newMeal]);
    setExpandedMealId(newMeal.id);
    setEditingMealId(newMeal.id);
  };

  const updateMealBlock = (id: string, field: keyof DietMealBlock, value: string) => {
    setMeals((prev) =>
      prev.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal)),
    );
  };

  const removeMealBlock = (id: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id));
    if (expandedMealId === id) setExpandedMealId(null);
    if (editingMealId === id) setEditingMealId(null);
  };

  const suggestRecipeWithAi = (id: string) => {
    const meal = meals.find((m) => m.id === id);
    if (!meal) return;
    const suggestions: Record<
      string,
      {
        name: string;
        ingredients: string;
        instructions: string;
        portion: string;
        calories: string;
        protein: string;
        carbs: string;
        fats: string;
      }
    > = {
      Desayuno: {
        name: "Omelette de claras con espinaca y tostadas integrales",
        ingredients:
          "3 claras de huevo, 1 taza de espinaca fresca, 2 rebanadas de pan integral, 1/2 palta.",
        instructions:
          "Batir las claras y cocinar en sartén antiadherente con espinacas. Servir sobre pan integral tostado con palta molida.",
        portion: "1 plato completo",
        calories: "320",
        protein: "24",
        carbs: "30",
        fats: "11",
      },
      "Colación AM": {
        name: "Yogurt griego con frutos rojos y almendras",
        ingredients:
          "150g yogurt griego descremado, 1/2 taza de arándanos, 15g almendras laminadas.",
        instructions:
          "Mezclar el yogurt con los arándanos frescos y coronar con las almendras laminadas.",
        portion: "1 bowl mediano",
        calories: "210",
        protein: "18",
        carbs: "19",
        fats: "6",
      },
      Almuerzo: {
        name: "Pechuga a la plancha con quinoa y ensalada de vegetales",
        ingredients:
          "150g pechuga de pollo, 3/4 taza de quinoa cocida, 1 taza de tomate y pepino con aderezo de limón y 1 cda de aceite de oliva.",
        instructions:
          "Sazonar el pollo y cocinar a la plancha. Acompañar con la quinoa tibia y la ensalada fresca aderezada.",
        portion: "1 plato principal",
        calories: "450",
        protein: "42",
        carbs: "38",
        fats: "14",
      },
      "Colación PM": {
        name: "Batido proteico de banana y mantequilla de maní",
        ingredients:
          "1 scoop proteína isolate, 1/2 banana, 1 cda mantequilla de maní, 250ml leche de almendras sin azúcar.",
        instructions: "Licuar todos los ingredientes a velocidad alta con hielo al gusto.",
        portion: "1 vaso grande",
        calories: "260",
        protein: "28",
        carbs: "20",
        fats: "8",
      },
      Cena: {
        name: "Filete de salmón al horno con espárragos y camote",
        ingredients:
          "140g filete de salmón, 100g camote asado en cubos, 6 espárragos verdes al vapor.",
        instructions:
          "Hornear el salmón a 180°C durante 15 minutos. Acompañar con camote dorado y espárragos tiernos.",
        portion: "1 plato cena",
        calories: "410",
        protein: "35",
        carbs: "25",
        fats: "18",
      },
    };

    const suggestion = suggestions[meal.section] || {
      name: `Preparación nutritiva de ${meal.section.toLowerCase()}`,
      ingredients:
        "Ingredientes seleccionados según la lista de alimentos permitidos.",
      instructions:
        "Cocinar a la plancha o al vapor con condimentos naturales.",
      portion: "1 porción estándar",
      calories: "380",
      protein: "30",
      carbs: "32",
      fats: "12",
    };

    setMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...suggestion } : m)),
    );
    setExpandedMealId(id);
  };

  return (
    <>
      {isGeneratingAiDishes ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
          <div className="mx-4 flex max-w-sm flex-col items-center rounded-3xl bg-white px-8 py-7 text-center shadow-2xl">
            <Image
              src="/nutria.webp"
              alt="Nati está cocinando"
              width={112}
              height={112}
              className="h-28 w-28 animate-pulse object-contain"
            />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">
              Nati está cocinando
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              Creando preparaciones con tu dieta
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Naty está diseñando platos personalizados basados en los alimentos de la pauta.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando platos
            </div>
          </div>
        </div>
      ) : null}

      {/* Sección Única: Estructura de Comidas y Platos (Estilo NutriNet / Entregables) */}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Subheader & Naty IA trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {MEAL_SECTION_TABS.map((tab) => {
              const count =
                tab === "Todos"
                  ? meals.length
                  : meals.filter(
                      (m) =>
                        m.section.toLowerCase().trim() ===
                        tab.toLowerCase().trim(),
                    ).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onQuickGenerateAiDishes && (
              <Button
                type="button"
                onClick={() => onQuickGenerateAiDishes()}
                disabled={isGeneratingAiDishes}
                className="h-9 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-all"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-200" />
                {isGeneratingAiDishes ? "Nati está cocinando..." : "Generar platos con Naty IA"}
              </Button>
            )}

            {onImportRecipe && (
              <Button
                type="button"
                onClick={onImportRecipe}
                variant="outline"
                className="h-9 rounded-xl border-indigo-200 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50 shadow-xs cursor-pointer"
              >
                <Filter className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                Importar receta
              </Button>
            )}
          </div>
        </div>

        {/* Control Bar & Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
            <ChefHat className="h-4 w-4 text-amber-500" />
            Platos ({filteredMeals.length})
          </h3>

          {filteredMeals.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Anterior
              </Button>
              <span className="text-xs font-semibold text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Platos (Cards Desplegables Minimalistas) */}
        {filteredMeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Utensils className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Aún no hay platos o preparaciones</p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Importa recetas o usa los botones (+ Desayuno, + Almuerzo...) para agregar platos a la pauta.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {onQuickGenerateAiDishes && (
                <Button
                  type="button"
                  onClick={() => onQuickGenerateAiDishes()}
                  disabled={isGeneratingAiDishes}
                  className="rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-200" />
                  Generar platos con Naty IA
                </Button>
              )}
              {onImportRecipe && (
                <Button
                  type="button"
                  onClick={onImportRecipe}
                  variant="outline"
                  className="rounded-xl border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                  Importar receta
                </Button>
              )}
              <Button
                type="button"
                onClick={() => addMealBlock("Almuerzo", "13:30")}
                className="rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Crear plato aquí
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pagedMeals.map((dish) => {
              const isExpanded = expandedMealId === dish.id;
              const isEditing = editingMealId === dish.id;

              return (
                <div
                  key={dish.id}
                  className={`overflow-hidden rounded-2xl border transition-all ${
                    isExpanded
                      ? "border-amber-300 bg-white shadow-sm ring-1 ring-amber-200/50"
                      : "border-slate-200 bg-white hover:border-amber-200 hover:shadow-xs"
                  }`}
                >
                  {/* Vista Simple Minimalista (Clickeable) */}
                  <div
                    onClick={() => {
                      if (isEditing) return;
                      setExpandedMealId(isExpanded ? null : dish.id);
                    }}
                    className="flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                        <ChefHat className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-800">
                            {dish.section || "Plato"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <Clock className="h-3 w-3" />
                            {dish.time}
                          </span>
                        </div>
                        <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">
                          {dish.name.trim() || "Plato sin nombre"}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {/* Nutrientes Badges: Kcal, Prot, Grasas, Carbos */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center">
                          <span className="block font-black text-slate-800">{dish.calories || "0"}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Kcal</span>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center">
                          <span className="block font-black text-slate-800">{dish.protein || "0"}g</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Prot.</span>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center">
                          <span className="block font-black text-slate-800">{dish.fats || "0"}g</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Grasas</span>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center hidden md:block">
                          <span className="block font-black text-slate-800">{dish.carbs || "0"}g</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Carbos</span>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMealId(isEditing ? null : dish.id);
                            if (!isExpanded) setExpandedMealId(dish.id);
                          }}
                          className="h-8 rounded-xl px-2.5 text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          {isEditing ? "Listo" : "Editar"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMealBlock(dish.id);
                          }}
                          className="h-8 w-8 rounded-xl p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMealId(isExpanded ? null : dish.id);
                          }}
                          className="h-8 w-8 rounded-xl p-0 text-slate-400 hover:bg-slate-100"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Vista Desplegada (Detalles del Plato e Instrucciones) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                      {/* Modo Edición Encabezado / Nutrientes */}
                      {isEditing ? (
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Sección / Tiempo
                            </label>
                            <Input
                              value={dish.section}
                              onChange={(e) => updateMealBlock(dish.id, "section", e.target.value)}
                              className="h-9 rounded-xl border-slate-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Horario
                            </label>
                            <Input
                              type="time"
                              value={dish.time}
                              onChange={(e) => updateMealBlock(dish.id, "time", e.target.value)}
                              className="h-9 rounded-xl border-slate-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Nombre del plato
                            </label>
                            <Input
                              value={dish.name}
                              onChange={(e) => updateMealBlock(dish.id, "name", e.target.value)}
                              placeholder="Nombre del plato"
                              className="h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Porción medida
                            </label>
                            <Input
                              value={dish.portion}
                              onChange={(e) => updateMealBlock(dish.id, "portion", e.target.value)}
                              placeholder="Ej: 1 plato chico"
                              className="h-9 rounded-xl border-slate-200 bg-white text-xs"
                            />
                          </div>
                        </div>
                      ) : null}

                      {/* Botón Sugerencia con IA */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Porción recomendada:</span>
                          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800">
                            {dish.portion || "1 porción estándar"}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => suggestRecipeWithAi(dish.id)}
                          className="h-8 rounded-xl border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Sugerir Receta con Nati
                        </Button>
                      </div>

                      {/* Formulario Ingredientes & Instrucciones */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Ingredientes y cantidades
                          </label>
                          <Textarea
                            value={dish.ingredients}
                            onChange={(e) => updateMealBlock(dish.id, "ingredients", e.target.value)}
                            placeholder="150g pechuga, 3/4 taza quinoa, vegetales al gusto..."
                            className="min-h-[90px] rounded-xl border-slate-200 bg-white text-xs text-slate-800 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Instrucciones de preparación / notas
                          </label>
                          <Textarea
                            value={dish.instructions}
                            onChange={(e) => updateMealBlock(dish.id, "instructions", e.target.value)}
                            placeholder="Cocinar a la plancha con gotas de aceite de oliva..."
                            className="min-h-[90px] rounded-xl border-slate-200 bg-white text-xs text-slate-800 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>



      {isAiValidationModalOpen && setIsAiValidationModalOpen && onConfirmAiDishes ? (
        <AiValidationModal
          isOpen={isAiValidationModalOpen}
          onClose={() => setIsAiValidationModalOpen(false)}
          onConfirm={onConfirmAiDishes}
          dishes={pendingAiDishes || []}
          patient={patient || null}
          dayLabel="Pauta Diaria"
        />
      ) : null}
    </>
  );
}
