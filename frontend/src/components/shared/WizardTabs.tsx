import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardTabItem {
  label: string;
  description?: string;
}

interface WizardTabsProps {
  steps: WizardTabItem[];
  currentStep: number;
  onStepChange: (step: number) => void;
  className?: string;
}

export function WizardTabs({ steps, currentStep, onStepChange, className }: WizardTabsProps) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-3 shadow-sm", className)}>
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <button
              key={step.label}
              type="button"
              onClick={() => onStepChange(index)}
              className={cn(
                "flex min-w-0 flex-1 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer",
                isActive && "border-indigo-200 bg-indigo-50 shadow-sm",
                !isActive &&
                  isCompleted &&
                  "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50",
                !isActive &&
                  !isCompleted &&
                  "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors",
                  isActive && "bg-indigo-600 text-white",
                  !isActive && isCompleted && "bg-emerald-600 text-white",
                  !isActive && !isCompleted && "bg-slate-100 text-slate-500",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-semibold leading-5",
                    isActive && "text-indigo-700",
                    !isActive && isCompleted && "text-slate-700",
                    !isActive && !isCompleted && "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                    {step.description}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-3">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
          Paso {currentStep + 1} de {steps.length}
        </p>

        <p className="text-xs font-medium text-slate-500">
          Navega por etapas sin perder contexto.
        </p>
      </div>
    </div>
  );
}
