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
  { key: "once", label: "Once" },
  { key: "cena", label: "Cena" },
  { key: "post entreno", label: "Post entreno" },
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
    "colación am": 0,
    almuerzo: 1,
    "colación pm": 0,
    once: 0,
    cena: 1,
    "post entreno": 0,
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
        <div className="p-5 bg-[#F0F5DF] border-b border-[#DDE7B8] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E8EFCB] text-[#668E20] rounded-2xl shadow-2xs">
              <Sparkles className="h-5 w-5 text-[#668E20]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#20212B] flex items-center gap-2">
                Generar Platos con Naty IA
              </h3>
              <p className="text-xs text-[#626573] font-normal mt-0.5">
                Configura los parámetros para crear preparaciones personalizadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-[#20212B] bg-white rounded-xl border border-[#E9E5E7] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Option: Consider Base Diet from Previous Step */}
          <div className="p-4 rounded-2xl border border-[#DDE7B8] bg-[#F0F5DF]/60 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useBaseDiet}
                onChange={(e) => setUseBaseDiet(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#DDE7B8] text-[#86A83C] focus:ring-[#86A83C] accent-[#86A83C] cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#20212B] flex items-center gap-1.5">
                    <Apple className="h-4 w-4 text-[#86A83C]" />
                    Considerar dieta base seleccionada (Paso anterior)
                  </span>
                  {baseDietFoodsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8EFCB] text-[#668E20]">
                      {baseDietFoodsCount} alimentos
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#626573] font-normal leading-relaxed">
                  {useBaseDiet
                    ? "Naty usará de forma prioritaria los alimentos definidos en la dieta base para armar los platos."
                    : "Naty podrá proponer combinaciones libres sin restringirse a los alimentos de la dieta base previa."}
                </p>
              </div>
            </label>
          </div>

          {/* Dish Counts per Meal Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#626573] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-[#86A83C]" />
                Cantidad de platos por tiempo de comida
              </span>
              <span className="text-[#668E20] font-semibold">{totalDishesRequested} platos en total</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_SECTIONS.map(({ key, label }) => {
                const count = targets[key] || 0;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-2xl border border-[#E9E5E7] bg-slate-50/50"
                  >
                    <span className="text-xs font-semibold text-[#20212B]">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTargetChange(key, -1)}
                        disabled={count <= 0}
                        className="h-7 w-7 rounded-lg border border-[#E9E5E7] bg-white flex items-center justify-center text-[#20212B] hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-semibold text-[#20212B]">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTargetChange(key, 1)}
                        disabled={count >= 3}
                        className="h-7 w-7 rounded-lg border border-[#E9E5E7] bg-white flex items-center justify-center text-[#20212B] hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
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
            <label className="text-xs font-semibold uppercase tracking-wider text-[#626573] flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#86A83C]" />
              Instrucciones especiales para Naty
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: Preparaciones rápidas de menos de 15 minutos, ricas en fibra y adaptadas para trasladar al trabajo..."
              rows={3}
              className="w-full p-3.5 bg-white border border-[#E9E5E7] rounded-2xl text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C] transition-all outline-none resize-none shadow-2xs"
            />

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_INSTRUCTION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.text)}
                  className="px-2.5 py-1 bg-white hover:bg-[#F0F5DF] text-[#626573] hover:text-[#668E20] border border-[#E9E5E7] hover:border-[#DDE7B8] rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-[#E9E5E7] flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-5 border-[#E9E5E7] text-[#626573] font-semibold rounded-xl text-xs cursor-pointer hover:bg-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={totalDishesRequested === 0 || isGenerating}
            className="h-10 px-6 bg-[#86A83C] hover:bg-[#78A82F] text-white font-semibold rounded-xl gap-2 text-xs shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-emerald-100" />
            Generar Platos con Naty
          </Button>
        </div>
      </div>
    </div>
  );
};
