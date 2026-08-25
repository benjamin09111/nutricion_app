"use client";

import React from "react";
import { Check, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  label: string;
  description?: string;
}

export interface WizardStepperProps {
  steps: (string | StepItem)[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
  lockFutureSteps?: boolean;
  className?: string;
}

export function WizardStepper({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  lockFutureSteps = false,
  className,
}: WizardStepperProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2.5 sm:p-3 mb-6 select-none shadow-xs",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 w-full">
        {steps.map((step, index) => {
          const stepLabel = typeof step === "string" ? step : step.label;
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isActive = currentStep === index;
          const isLocked = lockFutureSteps && !isCompleted && !isActive;

          const isClickable = Boolean(onStepClick && !isLocked);

          return (
            <React.Fragment key={index}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(index)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  isActive && "bg-indigo-600 text-white shadow-md shadow-indigo-200/50 ring-2 ring-indigo-600/30 scale-[1.02]",
                  isCompleted && !isActive && "bg-white border border-indigo-200 text-indigo-700 shadow-xs hover:bg-indigo-50/60",
                  !isCompleted && !isActive && "bg-white/80 border border-slate-200 text-slate-400 hover:bg-slate-100/80 hover:text-slate-600",
                  isClickable ? "cursor-pointer" : "cursor-default",
                  isLocked && "opacity-40 cursor-not-allowed",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all shrink-0",
                    isActive && "bg-white text-indigo-700",
                    isCompleted && !isActive && "bg-indigo-100 text-indigo-700",
                    !isCompleted && !isActive && "bg-slate-100 text-slate-400",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : isLocked ? (
                    <Lock className="w-2.5 h-2.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="truncate">{stepLabel}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden md:block shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
