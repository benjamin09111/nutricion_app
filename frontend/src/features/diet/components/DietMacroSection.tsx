import React from "react";
import {
  Beef,
  Droplets,
  Scale,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MacroSettings, MacroTargetsSummary } from "../hooks/useDietState";

interface DietMacroSectionProps {
  macroSettings: MacroSettings;
  macroTargets: MacroTargetsSummary;
  setMacroSettings: React.Dispatch<React.SetStateAction<MacroSettings>>;
  saveDraft: (overrides?: any) => void;
}

const MACRO_KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
} as const;

const clampNumber = (value: number) => (Number.isFinite(value) ? value : 0);

export const DietMacroSection: React.FC<DietMacroSectionProps> = ({
  macroSettings,
  macroTargets,
  setMacroSettings,
  saveDraft,
}) => {
  const persistSettings = (next: MacroSettings) => {
    setMacroSettings(next);
    saveDraft({ macroSettings: next });
  };

  const updateField = <K extends keyof MacroSettings>(
    key: K,
    value: MacroSettings[K],
  ) => {
    persistSettings({ ...macroSettings, [key]: value });
  };

  const updateMacroFromKg = (
    key: "protein" | "carbs" | "fats",
    gPerKg: number,
  ) => {
    const next = {
      ...macroSettings,
      [`${key}GPerKg`]: clampNumber(gPerKg),
      calorieAdjustment: macroSettings.calorieAdjustment,
    } as MacroSettings;
    persistSettings(next);
  };

  const updateMacroFromGrams = (
    key: "protein" | "carbs" | "fats",
    grams: number,
  ) => {
    const normalizedWeight = Math.max(macroSettings.referenceWeightKg || 0, 0);
    const next = {
      ...macroSettings,
      [`${key}GPerKg`]: normalizedWeight > 0 ? clampNumber(grams) / normalizedWeight : 0,
      calorieAdjustment: macroSettings.calorieAdjustment,
    } as MacroSettings;
    persistSettings(next);
  };

  const updateDeficit = (value: number) => {
    updateField("calorieAdjustment", clampNumber(value));
  };

  const quickAdjustments = [
    { label: "Mantenimiento", mode: "kcal" as const, value: 0 },
    { label: "-250 kcal", mode: "kcal" as const, value: -250 },
    { label: "-500 kcal", mode: "kcal" as const, value: -500 },
    { label: "-10%", mode: "percent" as const, value: 10 },
  ];

  const macroCards = [
    {
      key: "protein" as const,
      label: "Proteína",
      icon: Beef,
      accent: "blue",
      grams: macroTargets.protein,
      gPerKg: macroSettings.proteinGPerKg,
      percent: macroTargets.proteinPercent,
      kcalPerGram: MACRO_KCAL_PER_GRAM.protein,
    },
    {
      key: "carbs" as const,
      label: "Carbohidratos",
      icon: Wheat,
      accent: "emerald",
      grams: macroTargets.carbs,
      gPerKg: macroSettings.carbsGPerKg,
      percent: macroTargets.carbsPercent,
      kcalPerGram: MACRO_KCAL_PER_GRAM.carbs,
    },
    {
      key: "fats" as const,
      label: "Grasas",
      icon: Droplets,
      accent: "amber",
      grams: macroTargets.fats,
      gPerKg: macroSettings.fatsGPerKg,
      percent: macroTargets.fatsPercent,
      kcalPerGram: MACRO_KCAL_PER_GRAM.fats,
    },
  ] as const;

  return (
    <div className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
            Objetivos energéticos
          </p>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Scale className="h-5 w-5 text-indigo-500" />
            Macros y déficit clínico
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickAdjustments.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="outline"
              className="h-10 cursor-pointer rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => {
                updateField("calorieAdjustmentMode", item.mode);
                updateDeficit(item.value);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
            Peso de referencia
          </label>
          <Input
            type="number"
            min={0}
            step="0.1"
            value={macroSettings.referenceWeightKg}
            onChange={(e) =>
              updateField("referenceWeightKg", clampNumber(Number(e.target.value)))
            }
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 shadow-sm"
            placeholder="kg"
          />
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
            Modo de ajuste
          </label>
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => updateField("calorieAdjustmentMode", "kcal")}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                macroSettings.calorieAdjustmentMode === "kcal"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              kcal
            </button>
            <button
              type="button"
              onClick={() => updateField("calorieAdjustmentMode", "percent")}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                macroSettings.calorieAdjustmentMode === "percent"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              %
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
            {macroSettings.calorieAdjustmentMode === "percent"
              ? "Déficit (%)"
              : "Ajuste (kcal)"}
          </label>
          <Input
            type="number"
            step={macroSettings.calorieAdjustmentMode === "percent" ? "1" : "10"}
            value={macroSettings.calorieAdjustment}
            onChange={(e) => updateDeficit(Number(e.target.value))}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 shadow-sm"
            placeholder={macroSettings.calorieAdjustmentMode === "percent" ? "%" : "kcal"}
          />
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
            Base estimada
          </label>
          <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-black text-slate-900 shadow-sm">
            {macroTargets.baseCalories} kcal
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">
            Objetivo final
          </label>
          <div className="flex h-12 items-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-900 shadow-sm">
            {macroTargets.calories} kcal
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {macroCards.map((macro) => {
          const Icon = macro.icon;
          return (
            <div
              key={macro.key}
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${
                      macro.accent === "blue"
                        ? "text-blue-600"
                        : macro.accent === "emerald"
                          ? "text-emerald-600"
                          : "text-amber-600"
                    }`}
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {macro.label}
                  </span>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                  {macro.percent}%
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    g/kg
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={macro.gPerKg}
                    onChange={(e) =>
                      updateMacroFromKg(macro.key, Number(e.target.value) || 0)
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-white shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    g totales
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={macro.grams}
                    onChange={(e) =>
                      updateMacroFromGrams(macro.key, Number(e.target.value) || 0)
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-white shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-black uppercase tracking-widest">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500">
                  <p className="text-[10px] text-slate-400">% energía</p>
                  <p className="mt-1 text-sm text-slate-900">{macro.percent}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500">
                  <p className="text-[10px] text-slate-400">Aporte</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {macro.grams * macro.kcalPerGram} kcal
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Los macronutrientes se sincronizan con el peso de referencia y el ajuste
        calórico. Si cambias los gramos totales, el g/kg se recalcula automáticamente
        y viceversa.
      </p>
    </div>
  );
};
