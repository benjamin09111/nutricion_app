"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { WizardStepper } from "@/components/patient-form/WizardStepper";
import { FormNavigationFooter } from "@/components/patient-form/FormNavigationFooter";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlanWizardShellProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  onBack: () => void;
  onNext: () => void;
  isLastStep: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PlanWizardShell({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  onBack,
  onNext,
  isLastStep,
  nextLabel,
  nextDisabled = false,
  onReset,
  children,
  className,
}: PlanWizardShellProps) {
  return (
    <div className={cn("space-y-6 flex-1", className)}>
      {/* Control Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pb-4 border-b border-slate-100">
        <WizardStepper
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={onStepClick}
          className="mb-0 pb-0"
        />
        <FormNavigationFooter
          onBack={onBack}
          onNext={onNext}
          isFirstStep={currentStep === 0}
          nextDisabled={nextDisabled}
          nextLabel={
            nextLabel ||
            (isLastStep ? "Finalizar" : "Continuar")
          }
          className="mt-0 flex-1 max-w-none justify-end gap-3"
        />
      </div>

      {children}

      {/* Control Inferior */}
      <div className="flex justify-center pt-4 border-t border-slate-100 w-full">
        <FormNavigationFooter
          onBack={onBack}
          onNext={onNext}
          isFirstStep={currentStep === 0}
          nextDisabled={nextDisabled}
          nextLabel={
            nextLabel ||
            (isLastStep ? "Finalizar" : "Continuar")
          }
          className="mt-0 flex-1 max-w-none justify-center gap-3"
        />
      </div>
    </div>
  );
}
