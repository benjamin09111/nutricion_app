import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

export function WizardStepper({
  steps,
  currentStep,
  completedSteps,
  className,
}: WizardStepperProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-3 mb-6 pb-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isActive = currentStep === index;
        const isPending = !isCompleted && !isActive;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted &&
                    "bg-emerald-100 text-emerald-700 border border-emerald-200",
                  isActive &&
                    "border-2 border-indigo-600 bg-indigo-50 text-indigo-600",
                  isPending &&
                    "border-2 border-slate-200 text-slate-400 bg-slate-50"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap hidden sm:block",
                  isActive && "text-indigo-600 font-semibold",
                  isCompleted && "text-slate-500",
                  isPending && "text-slate-400"
                )}
              >
                {step}
              </span>
            </div>
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
