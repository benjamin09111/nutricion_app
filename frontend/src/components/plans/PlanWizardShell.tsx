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
      <WizardStepper
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick}
      />

      {children}

      <div className="flex items-center justify-between max-w-2xl pt-2">
        <FormNavigationFooter
          onBack={onBack}
          onNext={onNext}
          isFirstStep={currentStep === 0}
          nextDisabled={nextDisabled}
          nextLabel={
            nextLabel ||
            (isLastStep ? "Finalizar" : "Continuar")
          }
          className="mt-0 flex-1 max-w-none"
        />
        {onReset && (
          <Button
            type="button"
            onClick={onReset}
            variant="ghost"
            className="rounded-xl px-4 text-rose-500 font-bold hover:bg-rose-50 ml-3"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reiniciar
          </Button>
        )}
      </div>
    </div>
  );
}
