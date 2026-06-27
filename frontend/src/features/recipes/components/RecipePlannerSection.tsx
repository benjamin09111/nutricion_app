import React from "react";
import {
  Clock,
  Moon,
  Coffee,
  Sun,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Lock,
  Dumbbell,
  Flame,
  Layers,
  Droplet,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  cn,
  Recipe,
  MealSlot,
  SubstituteMealSection,
  SubstituteRecipeItem,
  NutritionGoals,
} from "../utils/recipe-helpers";

interface RecipePlannerSectionProps {
  plannerView: "daily" | "weekly";
  setPlannerView: (view: "daily" | "weekly") => void;
  cycleDayCount: number;
  setCycleDayCount: (count: number) => void;
  days: string[];
  currentDay: string;
  setCurrentDay: (day: string) => void;
  weekSlots: Record<string, MealSlot[]>;
  currentSlots: MealSlot[];
  canUseAiAutofill: boolean;
  isGenerating: boolean;
  handleQuickGenerateAI: () => Promise<void>;
  fillCurrentDayWithMyRecipes: () => void;
  recipeTabCounts: { mine: number; community: number; app: number };
  wakeUpTime: string;
  sleepTime: string;
  draggedSlotId: string | null;
  setDraggedSlotId: (id: string | null) => void;
  draggedRecipeId: string | null;
  draggedRecipe: Recipe | null;
  dropTargetKey: string | null;
  setDropTargetKey: (key: string | null) => void;
  isRecipeMealSectionCompatible: (recipe?: Pick<Recipe, "mealSection"> | null, slot?: Pick<MealSlot, "mealSection" | "type"> | null) => boolean;
  handleSlotDrop: (targetSlotId: string, dayContext: string) => void;
  slotTimeDrafts: Record<string, string>;
  handleSlotTimeDraftChange: (id: string, newTime: string) => void;
  commitSlotTimeChange: (id: string) => void;
  handleOpenEditMealBlockModal: (slotId: string, dayContext?: string) => void;
  handleRemoveMealBlock: (slotId: string, dayContext?: string) => void;
  openQuickMealModal: (day: string, slotId: string) => void;
  openSlotEditor: (day: string, slotId: string) => void;
  clearRecipeFromSlot: (day: string, slotId: string) => void;
  handleSlotPortionChange: (day: string, slotId: string, recommendedPortion: string) => void;
  getRecipeImage: (recipe?: Recipe, mealSection?: string) => string;
  truncateText: (value: string | undefined, maxLength: number) => string;
  getSlotLabelFromMealSection: (mealSection: string) => string;
  handleOpenAddBlockModal: () => void;

  // Totals & Metas
  dayTotalsWithSupplement: { calories: number; protein: number; carbs: number; fats: number };
  targetProtein: number;
  targetCalories: number;
  targetCarbs: number;
  targetFats: number;
  setTargetCalories: (calories: number) => void;
  setTargetProtein: (protein: number) => void;
  selectedPatient: any;
  patientNutritionGoals: NutritionGoals | null;
  isEditingPatientGoals: boolean;
  setIsEditingPatientGoals: (editing: boolean) => void;
  assignPatientGoalsFromCurrentTargets: () => Promise<void>;
  dayTotals: { calories: number; protein: number; carbs: number; fats: number };
  weekTotalsWithSupplement: { calories: number; protein: number; carbs: number; fats: number };
  recommendedProteinRange: { min: number; max: number } | null;
  selectedPatientActivityLevel: string | undefined;
  proteinSupplementPerDay: number;
  plannerSectionRef: React.RefObject<HTMLDivElement | null>;
}

export const RecipePlannerSection: React.FC<RecipePlannerSectionProps> = ({
  plannerView,
  setPlannerView,
  cycleDayCount,
  setCycleDayCount,
  days,
  currentDay,
  setCurrentDay,
  weekSlots,
  currentSlots,
  canUseAiAutofill,
  isGenerating,
  handleQuickGenerateAI,
  fillCurrentDayWithMyRecipes,
  recipeTabCounts,
  wakeUpTime,
  sleepTime,
  draggedSlotId,
  setDraggedSlotId,
  draggedRecipeId,
  draggedRecipe,
  dropTargetKey,
  setDropTargetKey,
  isRecipeMealSectionCompatible,
  handleSlotDrop,
  slotTimeDrafts,
  handleSlotTimeDraftChange,
  commitSlotTimeChange,
  handleOpenEditMealBlockModal,
  handleRemoveMealBlock,
  openQuickMealModal,
  openSlotEditor,
  clearRecipeFromSlot,
  handleSlotPortionChange,
  getRecipeImage,
  truncateText,
  getSlotLabelFromMealSection,
  handleOpenAddBlockModal,

  dayTotalsWithSupplement,
  targetProtein,
  targetCalories,
  targetCarbs,
  targetFats,
  setTargetCalories,
  setTargetProtein,
  selectedPatient,
  patientNutritionGoals,
  isEditingPatientGoals,
  setIsEditingPatientGoals,
  assignPatientGoalsFromCurrentTargets,
  dayTotals,
  weekTotalsWithSupplement,
  recommendedProteinRange,
  selectedPatientActivityLevel,
  proteinSupplementPerDay,
  plannerSectionRef,
}) => {
  return (
    <>
      {/* Center Panel: Planner */}
      <div ref={plannerSectionRef} className="lg:col-span-6 space-y-6">
        {plannerView === "daily" && (
          <>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm animate-in fade-in duration-300">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Repeticiones del ciclo
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCycleDayCount(num)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                      cycleDayCount === num
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {num} día{num > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4 xl:grid-cols-7 animate-in fade-in duration-300">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setCurrentDay(day)}
                  className={cn(
                    "rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                    currentDay === day
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!canUseAiAutofill) {
                      return;
                    }
                    void handleQuickGenerateAI();
                  }}
                  disabled={isGenerating || !canUseAiAutofill}
                  className="rounded-2xl font-bold flex items-center gap-2 border-slate-200"
                >
                  <Zap className="h-4 w-4" />
                  {isGenerating
                    ? "Generando..."
                    : canUseAiAutofill
                      ? "Generar platos con IA"
                      : "IA Pro"}
                </Button>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Despierta · {wakeUpTime}
                </p>
              </div>
              {currentSlots.map((slot) => {
                const isDropTarget = dropTargetKey === `${currentDay}-${slot.id}`;
                const isDropBlocked =
                  isDropTarget &&
                  !!draggedRecipe &&
                  !isRecipeMealSectionCompatible(draggedRecipe, slot);

                return (
                  <div
                    key={slot.id}
                    className="group relative flex gap-6"
                    draggable
                    onDragStart={() => setDraggedSlotId(slot.id)}
                    onDragEnd={() => setDraggedSlotId(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTargetKey(`${currentDay}-${slot.id}`);
                    }}
                    onDragLeave={() => {
                      if (dropTargetKey === `${currentDay}-${slot.id}`) {
                        setDropTargetKey(null);
                      }
                    }}
                    onDrop={() => handleSlotDrop(slot.id, currentDay)}
                  >
                    {/* Time marker */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
                        <input
                          type="text"
                          value={slotTimeDrafts[slot.id] ?? slot.time}
                          onChange={(e) =>
                            handleSlotTimeDraftChange(slot.id, e.target.value)
                          }
                          onBlur={() => commitSlotTimeChange(slot.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                            if (e.key === "Escape") {
                              handleSlotTimeDraftChange(slot.id, "");
                              e.currentTarget.blur();
                            }
                          }}
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="HH:MM"
                          aria-label={`Editar hora de ${slot.label}`}
                          className="h-5 w-[78px] border-0 bg-transparent p-0 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none"
                        />
                        <Pencil className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="w-[2px] h-full bg-slate-100 group-last:bg-transparent" />
                    </div>

                    {/* Slot Card */}
                    <div
                      className={cn(
                        "flex-1 p-6 rounded-[2.5rem] border transition-all relative overflow-hidden",
                        isDropTarget &&
                          (isDropBlocked
                            ? "ring-2 ring-rose-300 border-rose-300 bg-rose-50/30"
                            : "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/30"),
                        draggedSlotId === slot.id && "ring-2 ring-emerald-300",
                        slot.recipe
                          ? "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300"
                          : "bg-slate-50 border-dashed border-slate-300",
                      )}
                    >
                      {isDropBlocked ? (
                        <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                          <Lock className="h-3 w-3" />
                          Bloqueado
                        </div>
                      ) : null}
                      {slot.isUserAdded ? (
                        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMealBlockModal(slot.id)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Editar tipo de bloque"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMealBlock(slot.id)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            title="Eliminar bloque"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                      {!slot.recipe ? (
                        <div className="flex items-center justify-between h-20">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                              {slot.type === "desayuno" ? (
                                <Coffee className="h-6 w-6 text-slate-300" />
                              ) : (
                                <Sun className="h-6 w-6 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs leading-none mb-1">
                                {slot.label}
                              </h4>
                              <p className="text-sm font-medium text-slate-300 italic">
                                Pendiente por generar...
                              </p>
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <GripVertical className="h-3 w-3" />
                                Arr樂trar
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              className="text-slate-600 hover:bg-slate-100 rounded-xl font-black text-xs uppercase"
                              onClick={() => openQuickMealModal(currentDay, slot.id)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Crear comida rápida
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-emerald-600 hover:bg-emerald-50 rounded-xl font-black text-xs uppercase"
                              onClick={() => openSlotEditor(currentDay, slot.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Filtrar platos
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="h-32 w-full md:w-32 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 text-[0px] shadow-inner relative group-hover:scale-105 transition-transform shrink-0">
                            <img
                              src={getRecipeImage(slot.recipe, slot.mealSection || slot.type)}
                              alt={slot.recipe.title}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>

                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <GripVertical className="h-3 w-3" />
                                    Arrastrar
                                  </span>
                                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em]">
                                    {slot.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                      slot.recipe.complexity === "simple"
                                        ? "bg-blue-50 text-blue-600 border-blue-100"
                                        : "bg-purple-50 text-purple-600 border-purple-100",
                                    )}
                                  >
                                    {slot.recipe.complexity}
                                  </span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 leading-tight truncate">
                                  {slot.recipe.title}
                                </h4>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => clearRecipeFromSlot(currentDay, slot.id)}
                                  className="p-2.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                  title="Quitar plato de este bloque"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                              {truncateText(slot.recipe.description, 160)}
                            </p>
                            {slot.recipe.extraIngredients?.length ? (
                              <p className="text-xs font-black text-amber-700">
                                Ingredientes añadidos: {slot.recipe.extraIngredients.join(", ")}
                              </p>
                            ) : null}
                            <div className="space-y-1">
                              {slot.recipe.recommendedPortion ? (
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                                  Porción: {slot.recipe.recommendedPortion}
                                </p>
                              ) : null}
                              <Input
                                value={slot.recipe.recommendedPortion || ""}
                                onChange={(e) =>
                                  handleSlotPortionChange(
                                    currentDay,
                                    slot.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Porción (opcional)"
                                className="h-9 rounded-xl border-slate-200 bg-white text-xs"
                              />
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                              <div className="flex items-center gap-1.5 transition-all">
                                <Dumbbell className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                  {slot.recipe.protein}g Prot
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 transition-all">
                                <Flame className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                  {slot.recipe.calories} kcal
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 transition-all">
                                <Layers className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                  {slot.recipe.carbs}g Cho
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 transition-all">
                                <Droplet className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                  {slot.recipe.fats}g Lip
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pl-2">
                <Moon className="h-4 w-4 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Duerme · {sleepTime}
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleOpenAddBlockModal}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition-all hover:bg-amber-100"
                >
                  + Agregar bloque de comida
                </button>
              </div>
            </div>
          </>
        )}

        {plannerView === "weekly" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {days.map((day) => (
              <div
                key={day}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Día
                    </p>
                    <h4 className="text-lg font-black text-slate-900">{day}</h4>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentDay(day);
                      setPlannerView("daily");
                    }}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Abrir
                  </button>
                </div>

                <div className="space-y-3">
                  {(weekSlots[day] || []).map((slot) => {
                    const isDropTarget = dropTargetKey === `${day}-${slot.id}`;
                    const isDropBlocked =
                      isDropTarget &&
                      !!draggedRecipe &&
                      !isRecipeMealSectionCompatible(draggedRecipe, slot);

                    return (
                      <div
                        key={`${day}-${slot.id}`}
                        draggable
                        onDragStart={() => {
                          setCurrentDay(day);
                          setDraggedSlotId(slot.id);
                        }}
                        onDragEnd={() => setDraggedSlotId(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDropTargetKey(`${day}-${slot.id}`);
                        }}
                        onDragLeave={() => {
                          if (dropTargetKey === `${day}-${slot.id}`) {
                            setDropTargetKey(null);
                          }
                        }}
                        onDrop={() => {
                          handleSlotDrop(slot.id, day);
                        }}
                        className={cn(
                          "rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden",
                          isDropTarget &&
                            (isDropBlocked
                              ? "ring-2 ring-rose-300 border-rose-300 bg-rose-50/30"
                              : "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/30"),
                          slot.recipe
                            ? "border-slate-200 bg-slate-50"
                            : "border-dashed border-slate-300 bg-white",
                        )}
                        onClick={() => openSlotEditor(day, slot.id)}
                      >
                        {isDropBlocked ? (
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {slot.recipe ? (
                              <img
                                src={getRecipeImage(slot.recipe, slot.mealSection || slot.type)}
                                alt={slot.recipe.title}
                                className="mt-0.5 h-12 w-12 shrink-0 rounded-2xl border border-slate-200 object-cover"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {slot.time} · {slot.label}
                              </p>
                              <p className="mt-1 text-sm font-black text-slate-900 truncate">
                                {slot.recipe?.title || "Sin alimento asignado"}
                              </p>
                              {slot.recipe?.description ? (
                                <p className="mt-1 text-xs font-medium text-slate-500 truncate">
                                  {truncateText(slot.recipe.description, 90)}
                                </p>
                              ) : null}
                              {slot.recipe?.extraIngredients?.length ? (
                                <p className="mt-1 text-[11px] font-black text-amber-700 truncate">
                                  Ingredientes añadidos: {slot.recipe.extraIngredients.join(", ")}
                                </p>
                              ) : null}
                              {slot.recipe?.recommendedPortion ? (
                                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                  Porción: {slot.recipe.recommendedPortion}
                                </p>
                              ) : null}
                              {slot.recipe ? (
                                <Input
                                  value={slot.recipe.recommendedPortion || ""}
                                  onChange={(e) =>
                                    handleSlotPortionChange(day, slot.id, e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Porción (opcional)"
                                  className="mt-2 h-8 rounded-xl border-slate-200 bg-white text-xs"
                                />
                              ) : null}
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <GripVertical className="h-3 w-3" />
                                Arrastrar
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {slot.isUserAdded ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditMealBlockModal(slot.id, day);
                                }}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                                title="Editar tipo de bloque"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                            {slot.isUserAdded ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMealBlock(slot.id, day);
                                }}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                title="Eliminar bloque"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                            {slot.recipe ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearRecipeFromSlot(day, slot.id);
                                }}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                title="Quitar plato"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openQuickMealModal(day, slot.id);
                              }}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                              title="Crear comida rápida"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Configuration / Sidebar */}
      <div className="lg:col-span-3 space-y-6 sticky top-24">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Balance del día ({currentDay})
              </p>
              <h3 className="text-3xl font-black text-slate-900 leading-none">
                {dayTotalsWithSupplement.calories}
                <span className="text-sm text-slate-400 font-bold ml-1 uppercase tracking-widest">
                  kcal
                </span>
              </h3>
            </div>

            <div className="space-y-4">
              {/* Protein Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Proteína</span>
                  <span className="text-emerald-600">
                    {Math.round(dayTotalsWithSupplement.protein)}g / {targetProtein}g
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 bg-emerald-500"
                    style={{
                      width: `${Math.min(100, (dayTotalsWithSupplement.protein / Math.max(targetProtein, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {selectedPatient ? (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Metas del paciente
                  </p>
                  {patientNutritionGoals ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Objetivos editables
                          </p>
                          {isEditingPatientGoals ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                className="h-7 rounded-lg px-2.5 text-[9px] font-black uppercase border-slate-200"
                                onClick={() => {
                                  setTargetCalories(patientNutritionGoals.calories);
                                  setTargetProtein(patientNutritionGoals.protein);
                                  setIsEditingPatientGoals(false);
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                className="h-7 rounded-lg bg-emerald-600 px-2.5 text-[9px] font-black uppercase text-white hover:bg-emerald-700"
                                onClick={assignPatientGoalsFromCurrentTargets}
                              >
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="h-7 rounded-lg px-2.5 text-[9px] font-black uppercase border-slate-200"
                              onClick={() => {
                                setTargetCalories(patientNutritionGoals.calories);
                                setTargetProtein(patientNutritionGoals.protein);
                                setIsEditingPatientGoals(true);
                              }}
                            >
                              Editar metas
                            </Button>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={targetCalories}
                            disabled={!isEditingPatientGoals}
                            onChange={(e) => setTargetCalories(Math.max(0, Number(e.target.value) || 0))}
                            placeholder="kcal"
                            className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                          />
                          <Input
                            type="number"
                            value={targetProtein}
                            disabled={!isEditingPatientGoals}
                            onChange={(e) => setTargetProtein(Math.max(0, Number(e.target.value) || 0))}
                            placeholder="prot"
                            className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Cumplimiento diario ({currentDay})
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
                          <span className={dayTotalsWithSupplement.calories >= patientNutritionGoals.calories ? "text-emerald-600" : "text-slate-500"}>
                            kcal {dayTotalsWithSupplement.calories}/{patientNutritionGoals.calories}
                          </span>
                          <span className={dayTotalsWithSupplement.protein >= patientNutritionGoals.protein ? "text-emerald-600" : "text-slate-500"}>
                            prot {Math.round(dayTotalsWithSupplement.protein)}/{patientNutritionGoals.protein}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Cumplimiento semanal
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
                          <span className={weekTotalsWithSupplement.calories >= patientNutritionGoals.calories * 7 ? "text-emerald-600" : "text-slate-500"}>
                            kcal {weekTotalsWithSupplement.calories}/{patientNutritionGoals.calories * 7}
                          </span>
                          <span className={weekTotalsWithSupplement.protein >= patientNutritionGoals.protein * 7 ? "text-emerald-600" : "text-slate-500"}>
                            prot {Math.round(weekTotalsWithSupplement.protein)}/{patientNutritionGoals.protein * 7}
                          </span>
                        </div>
                      </div>

                      {recommendedProteinRange ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                            Referencia proteína por peso
                          </p>
                          <p className="mt-1 text-xs font-bold text-emerald-900">
                            {selectedPatientActivityLevel === "deportista" ? "Deportista" : "Sedentario"}: {recommendedProteinRange.min}g - {recommendedProteinRange.max}g/día
                          </p>
                          {proteinSupplementPerDay > 0 ? (
                            <p className="mt-1 text-[11px] font-bold text-emerald-700">
                              Incluye suplemento: +{proteinSupplementPerDay}g/día.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                      <p className="text-xs font-bold text-amber-900">
                        El paciente no tiene registradas metas de proteína y calorías. La IA no las considerará.
                      </p>
                      <Button
                        onClick={assignPatientGoalsFromCurrentTargets}
                        disabled={!selectedPatient}
                        className="w-full h-9 rounded-xl bg-amber-600 text-white hover:bg-amber-700 font-bold"
                      >
                        Asignar
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
