import React from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
  onStepClick?: (stepIndex: number) => void;
  nextDisabled?: boolean;
}

export function WizardStepper({
  steps,
  currentStep,
  completedSteps,
  className,
  onStepClick,
  nextDisabled = false,
}: WizardStepperProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-3 mb-6 pb-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isActive = currentStep === index;
        const isPrevious = index < currentStep;
        const isNextImmediate = index === currentStep + 1;

        // Accessible ONLY if reached/completed or next immediate when current step is valid
        const isAccessible = isPrevious || isActive || isCompleted || (isNextImmediate && !nextDisabled);
        const isLocked = !isAccessible;

        return (
          <React.Fragment key={index}>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (!isLocked) {
                  onStepClick?.(index);
                }
              }}
              className={cn(
                "flex items-center gap-2 transition-all",
                isLocked
                  ? "cursor-not-allowed opacity-45 select-none"
                  : onStepClick
                  ? "cursor-pointer hover:opacity-90"
                  : ""
              )}
              title={isLocked ? "Debes completar la fase actual antes de ver este paso" : step}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted &&
                    "bg-emerald-100 text-emerald-700 border border-emerald-200",
                  isActive &&
                    "border-2 border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-sm",
                  isLocked &&
                    "border border-slate-200 text-slate-300 bg-slate-100/70",
                  !isCompleted && !isActive && !isLocked &&
                    "border-2 border-slate-200 text-slate-400 bg-slate-50"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap hidden sm:block",
                  isActive && "text-indigo-600 font-semibold",
                  isCompleted && "text-slate-500",
                  isLocked && "text-slate-300",
                  !isActive && !isCompleted && !isLocked && "text-slate-400"
                )}
              >
                {step}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 min-w-[1rem] max-w-[2rem] rounded-full transition-colors",
                  completedSteps.includes(index)
                    ? "bg-emerald-200"
                    : "bg-slate-100"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

