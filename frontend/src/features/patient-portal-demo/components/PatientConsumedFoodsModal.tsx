"use client";

import React, { useState, useEffect } from "react";
import { UtensilsCrossed, X, ChevronDown, Trash2 } from "lucide-react";
import { PatientConsumedFood } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientConsumedFoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: PatientConsumedFood[];
  onAddFood: (food: { name: string; time: string; portion?: string }) => void;
  onDeleteFood: (id: string) => void;
  nutriName?: string;
}

export function PatientConsumedFoodsModal({
  isOpen,
  onClose,
  foods,
  onAddFood,
  onDeleteFood,
}: PatientConsumedFoodsModalProps) {
  const [foodText, setFoodText] = useState("");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Bloquear scroll al abrir modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = foodText.trim();
    if (!trimmed) {
      toast.error("Escribe el alimento que consumiste");
      return;
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;

    onAddFood({
      name: trimmed,
      time: currentTime,
    });

    setFoodText("");
    setIsAccordionOpen(true);
    toast.success("Alimento registrado");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Amplio, minimalista, sin degradados) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consumed-foods-title"
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 overflow-hidden z-10 h-[82vh] sm:h-[620px] flex flex-col animate-sheet-up pb-safe space-y-3"
      >
        {/* Drag handle móvil */}
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto -mt-1 mb-1 shrink-0 sm:hidden" />

        {/* Header Minimalista */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0F5DF] flex items-center justify-center text-[#5A781E]">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2
              id="consumed-foods-title"
              className="text-lg font-bold text-[#20212B]"
            >
              Alimentos Consumidos
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diario para escribir: limpio, directo y espacioso */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-3">
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              value={foodText}
              onChange={(e) => setFoodText(e.target.value)}
              placeholder="Escribe aquí lo que consumiste hoy fuera de tu pauta..."
              className="w-full flex-1 p-4 rounded-2xl border border-slate-200 bg-slate-50 text-base text-[#20212B] placeholder:text-slate-400 focus:outline-none focus:border-[#86A83C] focus:bg-white transition-all resize-none leading-relaxed"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!foodText.trim()}
            className="w-full h-12 min-h-[44px] rounded-xl bg-[#86A83C] hover:bg-[#78A82F] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-[#86A83C]/30 shrink-0"
          >
            Guardar en el registro
          </button>
        </form>

        {/* Acordeón: Ver registrados de hoy */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-700 hover:text-[#5A781E] transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span>Ver registrados de hoy</span>
              <span className="text-xs font-bold text-[#5A781E] bg-[#F0F5DF] px-2 py-0.5 rounded-full">
                {foods.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                isAccordionOpen && "rotate-180 text-[#5A781E]"
              )}
            />
          </button>

          {isAccordionOpen && (
            <div className="max-h-[170px] overflow-y-auto space-y-2 pt-2 pb-1 no-scrollbar animate-in fade-in duration-150">
              {foods.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No hay alimentos registrados hoy.
                </p>
              ) : (
                foods.map((food) => (
                  <div
                    key={food.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-[#5A781E]">
                        {food.time} hrs
                      </span>
                      <p className="text-sm font-medium text-[#20212B] leading-snug break-words mt-0.5">
                        {food.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteFood(food.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition-all cursor-pointer shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
