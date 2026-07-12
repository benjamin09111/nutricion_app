"use client";

import { useState } from "react";
import { ShieldAlert, CheckSquare, Sparkles, Bot, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useScrollLock } from "@/hooks/useScrollLock";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeContext";

export interface PendingAiDish {
  id: string;
  title: string;
  mealSection: string;
  description: string;
  preparation: string;
  recommendedPortion: string;
  portions: number;
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  ingredientDetails: any[];
}

interface AiValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (validatedDishes: PendingAiDish[]) => void;
  dishes: PendingAiDish[];
  patient: {
    fullName: string;
    restrictions?: string[];
    nutritionalFocus?: string;
  } | null;
  dayLabel: string;
}

export function AiValidationModal({
  isOpen,
  onClose,
  onConfirm,
  dishes,
  patient,
  dayLabel,
}: AiValidationModalProps) {
  useScrollLock(isOpen);
  const { isDarkMode } = useTheme();
  const [editedDishes, setEditedDishes] = useState<PendingAiDish[]>([]);
  const [isChecked, setIsChecked] = useState(false);

  // Initialize edited dishes when modal opens
  useState(() => {
    setEditedDishes(JSON.parse(JSON.stringify(dishes)));
  });

  if (!isOpen) return null;

  const handleFieldChange = (index: number, field: keyof PendingAiDish, value: any) => {
    setEditedDishes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleApprove = () => {
    if (!isChecked) return;
    onConfirm(editedDishes);
  };

  const restrictions = patient?.restrictions ?? [];
  const focus = patient?.nutritionalFocus ?? "";

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 min-h-screen">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col ${
          isDarkMode ? "dashboard-surface-strong text-slate-100" : "text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Bot className="h-5 w-5 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-1.5">
                Validación de Sugerencias de IA
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700">
                  {dayLabel}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Revisa y edita las sugerencias para el paciente <span className="font-bold text-slate-700">{patient?.fullName || "General"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Details & Warnings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Información Clínica del Paciente
              </h4>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                <span className="font-bold text-slate-800">Enfoque:</span> {focus || "Sin especificar"}
              </p>
              <div>
                <span className="text-xs font-bold text-slate-800">Restricciones:</span>{" "}
                {restrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {restrictions.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 uppercase"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Ninguna</span>
                )}
              </div>
            </div>

            {/* General AI Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Disclaimer Clínico Obligatorio
                </h4>
                <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                  Las sugerencias son generadas automáticamente por una Inteligencia Artificial.
                  La responsabilidad final de la adecuación clínica (calorías, alérgenos,
                  consistencia clínica) recae exclusivamente en ti como profesional a cargo.
                </p>
              </div>
            </div>
          </div>

          {/* Dishes List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Platos Sugeridos (Haz clic para editar campos)
            </h4>
            {editedDishes.map((dish, idx) => (
              <div
                key={dish.id}
                className="p-5 border border-slate-200/60 rounded-3xl space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow relative text-slate-900"
              >
                <div className="absolute top-4 right-4">
                  <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {dish.mealSection}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Nombre del Plato</label>
                    <Input
                      value={dish.title}
                      onChange={(e) => handleFieldChange(idx, "title", e.target.value)}
                      className="h-9 font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Descripción / Porción</label>
                    <Textarea
                      value={dish.description}
                      onChange={(e) => handleFieldChange(idx, "description", e.target.value)}
                      rows={2}
                      className="text-xs text-slate-600 leading-relaxed font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Calorías</label>
                      <Input
                        type="number"
                        value={dish.calories}
                        onChange={(e) => handleFieldChange(idx, "calories", Number(e.target.value) || 0)}
                        className="h-8 font-mono text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Proteína (g)</label>
                      <Input
                        type="number"
                        value={dish.protein}
                        onChange={(e) => handleFieldChange(idx, "protein", Number(e.target.value) || 0)}
                        className="h-8 font-mono text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Carbs (g)</label>
                      <Input
                        type="number"
                        value={dish.carbs}
                        onChange={(e) => handleFieldChange(idx, "carbs", Number(e.target.value) || 0)}
                        className="h-8 font-mono text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Grasas (g)</label>
                      <Input
                        type="number"
                        value={dish.fats}
                        onChange={(e) => handleFieldChange(idx, "fats", Number(e.target.value) || 0)}
                        className="h-8 font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Affirmation Checkbox */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <label className="flex items-start gap-2.5 cursor-pointer max-w-xl">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-600 leading-snug">
              Certifico que he revisado clínicamente cada una de las pautas sugeridas, los macros son los correctos y apruebo agregarlos a la planificación del paciente.
            </span>
          </label>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!isChecked}
              className="h-10 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 flex items-center gap-1.5"
            >
              <CheckSquare className="h-4 w-4" />
              Aprobar y Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}
