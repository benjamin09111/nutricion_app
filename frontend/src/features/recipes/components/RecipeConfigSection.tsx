import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Zap, ChefHat, Dumbbell, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildProjectAwarePath } from "@/lib/workflow";
import { cn, SubstituteMealSection, SubstituteRecipeItem } from "../utils/recipe-helpers";

interface RecipeConfigSectionProps {
  mealCount: number;
  handleMealCountChange: (count: number) => void;
  plannerView: "daily" | "weekly";
  setPlannerView: (view: "daily" | "weekly") => void;
  currentProjectId: string | null;
  isGenerating: boolean;
  canUseAiAutofill: boolean;
  handleQuickGenerateAI: () => Promise<void>;
  fillCurrentDayWithMyRecipes: () => void;
  recipeTabCounts: { mine: number; community: number; app: number };
  wakeUpTime: string;
  setWakeUpTime: (time: string) => void;
  sleepTime: string;
  setSleepTime: (time: string) => void;
  proteinSupplement: { enabled: boolean; gramsPerDay: number };
  setProteinSupplement: React.Dispatch<React.SetStateAction<{ enabled: boolean; gramsPerDay: number }>>;
  adviseMealRepetition: boolean;
  setAdviseMealRepetition: (advise: boolean) => void;
  enableSubstituteRecipes: boolean;
  setEnableSubstituteRecipes: (enable: boolean) => void;
  substituteRecipesBySection: Record<SubstituteMealSection, SubstituteRecipeItem[]>;
  removeSubstituteRecipe: (section: SubstituteMealSection, id: string) => void;
  hasSourceData: boolean;
  sourceFoods: string[];
  structureSectionRef: React.RefObject<HTMLDivElement | null>;
}

export const RecipeConfigSection: React.FC<RecipeConfigSectionProps> = ({
  mealCount,
  handleMealCountChange,
  plannerView,
  setPlannerView,
  currentProjectId,
  isGenerating,
  canUseAiAutofill,
  handleQuickGenerateAI,
  fillCurrentDayWithMyRecipes,
  recipeTabCounts,
  wakeUpTime,
  setWakeUpTime,
  sleepTime,
  setSleepTime,
  proteinSupplement,
  setProteinSupplement,
  adviseMealRepetition,
  setAdviseMealRepetition,
  enableSubstituteRecipes,
  setEnableSubstituteRecipes,
  substituteRecipesBySection,
  removeSubstituteRecipe,
  hasSourceData,
  sourceFoods,
  structureSectionRef,
}) => {
  const router = useRouter();

  return (
    <div
      ref={structureSectionRef}
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm mb-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Configuración de estructura
            </p>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
              Usa IA para proponer platos realistas según restricciones y alimentos disponibles, o completa la estructura manualmente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setPlannerView("daily")}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                  plannerView === "daily"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Vista diaria
              </button>
              <button
                onClick={() => setPlannerView("weekly")}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                  plannerView === "weekly"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Vista semanal
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  buildProjectAwarePath("/dashboard/dieta", currentProjectId),
                )
              }
              className="rounded-2xl font-bold flex items-center gap-2 border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Ajustar Dieta
            </Button>

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
                  ? "Generar con IA"
                  : "IA Pro"}
            </Button>

            <Button
              variant="outline"
              onClick={fillCurrentDayWithMyRecipes}
              disabled={isGenerating || recipeTabCounts.mine === 0}
              className="rounded-2xl font-bold flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <ChefHat className="h-4 w-4" />
              Rellenar con mis platos
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Cantidad de comidas
          </p>
          <div className="flex flex-wrap gap-2">
            {[3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => handleMealCountChange(num)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-black transition-all",
                  mealCount === num
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Cronobiología
          </p>
          <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">
                Despierta
              </label>
              <Input
                type="time"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="h-12 rounded-2xl text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">
                Duerme
              </label>
              <Input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="h-12 rounded-2xl text-xs font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-3 px-5 w-fit animate-in fade-in slide-in-from-left duration-500">
        <div className="flex items-center gap-3 pr-5 border-r border-slate-200">
          <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-center">
            <Dumbbell className="h-4 w-4 text-emerald-500 mx-auto" />
          </div>
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">
              Suplementación
            </p>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={proteinSupplement.enabled}
                onChange={(e) =>
                  setProteinSupplement((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
              />
              <span className="text-[11px] font-black uppercase tracking-tight text-slate-700 group-hover:text-emerald-700 transition-colors">
                Proteína Diaria
              </span>
            </label>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-4 transition-all duration-300",
          !proteinSupplement.enabled && "opacity-30 grayscale pointer-events-none scale-95"
        )}>
          <div className="flex flex-col">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">
              Gramos asegurados
            </p>
            <div className="relative group/input">
              <Input
                type="number"
                min={0}
                value={proteinSupplement.gramsPerDay}
                onChange={(e) =>
                  setProteinSupplement((prev) => ({
                    ...prev,
                    gramsPerDay: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="h-10 w-24 rounded-xl text-xs font-bold bg-white text-center shadow-sm border-slate-200 focus:border-emerald-400 transition-all"
              />
              <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                g
              </span>
            </div>
          </div>
          <div className="max-w-[140px]">
            <p className="text-[9px] font-bold text-slate-500 leading-tight italic">
              Este valor se restará del total diario de comidas.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-[2rem] border border-slate-200 bg-white p-4">
        <label className="inline-flex items-center gap-3 text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={adviseMealRepetition}
            onChange={(e) => setAdviseMealRepetition(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          Avisar al paciente que puede repetir alimentos durante su ciclo semanal.
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <label className="inline-flex items-center gap-3 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={enableSubstituteRecipes}
              onChange={(e) => setEnableSubstituteRecipes(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Activar platos sustitutos
          </label>

          {enableSubstituteRecipes ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(["desayuno", "almuerzo"] as SubstituteMealSection[]).map((section) => (
                <div
                  key={section}
                  className="rounded-xl border border-slate-300 bg-white p-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Platos sustitutos · {section}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    Marca como sustitutos en la biblioteca algunos platos de {section}.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {substituteRecipesBySection[section].map((item) => (
                      <span
                        key={`${section}-${item.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700"
                      >
                        {item.title}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-600"
                          onClick={() => removeSubstituteRecipe(section, item.id)}
                          title="Quitar sustituto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {substituteRecipesBySection[section].length === 0 ? (
                      <span className="text-[11px] font-medium text-slate-400">
                        Sin platos sustitutos aún.
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        {hasSourceData ? (
          <>
            <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              Alimentos base considerados: {sourceFoods.length}
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
              La información anterior se conserva y este módulo solo suma estructura, porciones y distribución.
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
            Sin dieta asignada. Importa una dieta para habilitar esta etapa.
          </div>
        )}
      </div>
    </div>
  );
};
