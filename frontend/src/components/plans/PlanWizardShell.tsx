"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";
import { WizardStepper } from "@/components/patient-form/WizardStepper";
import { FormNavigationFooter } from "@/components/patient-form/FormNavigationFooter";
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
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      onStepClick(targetStep);
      return;
    }

    if (nextDisabled) {
      toast.error("Por favor completa los campos requeridos de la fase actual antes de continuar.");
      return;
    }

    const isNextImmediate = targetStep === currentStep + 1;
    const isAccessible = isNextImmediate || completedSteps.includes(targetStep);

    if (!isAccessible) {
      toast.error("Debes completar la fase actual para desbloquear este paso.");
      return;
    }

    onStepClick(targetStep);
  };

  const handleNext = () => {
    if (nextDisabled) {
      toast.error("Por favor completa los campos requeridos de la fase actual antes de continuar.");
      return;
    }
    onNext();
  };

  return (
    <div className={cn("space-y-6 flex-1", className)}>
      {/* Control Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pb-4 border-b border-slate-100">
        <WizardStepper
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          nextDisabled={nextDisabled}
          className="mb-0 pb-0"
        />
        <FormNavigationFooter
          onBack={onBack}
          onNext={handleNext}
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
          onNext={handleNext}
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

