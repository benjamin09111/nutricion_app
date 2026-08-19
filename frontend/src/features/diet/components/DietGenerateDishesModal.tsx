"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  ChefHat,
  Sliders,
  FileText,
  Apple,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DietGenerateDishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseDietFoodsCount?: number;
  isGenerating?: boolean;
  onGenerate: (options: {
    categoryTargets: Record<string, number>;
    instructions: string;
    useBaseDiet: boolean;
  }) => void;
}

const QUICK_INSTRUCTION_CHIPS = [
  { label: "⚡ Rápido (<15 min)", text: "Preparaciones muy sencillas y rápidas de menos de 15 minutos" },
  { label: "🍱 Para llevar al trabajo", text: "Preparaciones prácticas y transportables en contenedor" },
  { label: "🍳 Pocos ingredientes", text: "Recetas simples con 5 ingredientes o menos" },
  { label: "🍲 Meal Prep (Lotes)", text: "Ideal para cocinar en lote y almacenar para varios días" },
  { label: "❄️ Apto para congelar", text: "Preparaciones aptas para congelar y recalentar" },
];

const DEFAULT_SECTIONS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "colación am", label: "Colación AM" },
  { key: "almuerzo", label: "Almuerzo" },
  { key: "colación pm", label: "Colación PM" },
  { key: "cena", label: "Cena" },
];

export const DietGenerateDishesModal: React.FC<DietGenerateDishesModalProps> = ({
  isOpen,
  onClose,
  baseDietFoodsCount = 0,
  isGenerating = false,
  onGenerate,
}) => {
  const [useBaseDiet, setUseBaseDiet] = useState(true);
  const [instructions, setInstructions] = useState("");
  const [targets, setTargets] = useState<Record<string, number>>({
    desayuno: 1,
    "colación am": 1,
    almuerzo: 1,
    "colación pm": 1,
    cena: 1,
  });

  if (!isOpen) return null;

  const handleTargetChange = (key: string, delta: number) => {
    setTargets((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, Math.min(3, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const handleChipClick = (text: string) => {
    if (instructions.includes(text)) return;
    setInstructions((prev) => (prev ? `${prev}. ${text}` : text));
  };

  const handleSubmit = () => {
    onGenerate({
      categoryTargets: targets,
      instructions: instructions.trim(),
      useBaseDiet,
    });
    onClose();
  };

  const totalDishesRequested = Object.values(targets).reduce((acc, val) => acc + val, 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header (Clean Light Theme matching NutriNet) */}
        <div className="p-5 bg-emerald-50/70 border-b border-emerald-100/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-2xs">
              <Sparkles className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                Generar Platos con Naty IA
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configura los parámetros para crear preparaciones personalizadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Option: Consider Base Diet from Previous Step */}
          <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useBaseDiet}
                onChange={(e) => setUseBaseDiet(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Apple className="h-4 w-4 text-emerald-600" />
                    Considerar dieta base seleccionada (Paso anterior)
                  </span>
                  {baseDietFoodsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                      {baseDietFoodsCount} alimentos
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  {useBaseDiet
                    ? "Naty usará de forma prioritaria los alimentos definidos en la dieta base para armar los platos."
                    : "Naty podrá proponer combinaciones libres sin restringirse a los alimentos de la dieta base previa."}
                </p>
              </div>
            </label>
          </div>

          {/* Dish Counts per Meal Section */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Cantidad de platos por tiempo de comida
              </span>
              <span className="text-emerald-600 font-bold">{totalDishesRequested} platos en total</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_SECTIONS.map(({ key, label }) => {
                const count = targets[key] || 0;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50"
                  >
                    <span className="text-xs font-extrabold text-slate-800">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTargetChange(key, -1)}
                        disabled={count <= 0}
                        className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-black text-slate-900">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTargetChange(key, 1)}
                        disabled={count >= 3}
                        className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Instructions for Naty */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-600" />
              Instrucciones especiales para Naty
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: Preparaciones rápidas de menos de 15 minutos, ricas en fibra y adaptadas para trasladar al trabajo..."
              rows={3}
              className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"
            />

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_INSTRUCTION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.text)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-5 border-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={totalDishesRequested === 0 || isGenerating}
            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-emerald-200 fill-emerald-100" />
            Generar Platos con Naty
          </Button>
        </div>
      </div>
    </div>
  );
};
