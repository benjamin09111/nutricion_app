"use client";

import React from "react";
import { Check, Lock } from "lucide-react";
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
        "flex w-full items-center justify-center gap-x-2.5 pb-2 overflow-x-auto select-none",
        className,
      )}
    >
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
                "flex shrink-0 items-center gap-2 transition-all",
                isClickable ? "cursor-pointer hover:opacity-90" : "cursor-default",
                isLocked && "opacity-40 cursor-not-allowed",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all shrink-0",
                  isCompleted && !isActive && "bg-indigo-600 text-white shadow-sm shadow-indigo-100",
                  isActive && "border-2 border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-sm shadow-indigo-50",
                  !isCompleted && !isActive && "border border-slate-200 text-slate-400 bg-white",
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold whitespace-nowrap hidden sm:block",
                  isActive && "text-indigo-600 font-bold",
                  isCompleted && !isActive && "text-indigo-600 font-semibold",
                  !isCompleted && !isActive && "text-slate-400",
                )}
              >
                {stepLabel}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 min-w-[1rem] max-w-[2rem] rounded-full transition-colors",
                  isCompleted ? "bg-indigo-600" : "bg-slate-100",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
