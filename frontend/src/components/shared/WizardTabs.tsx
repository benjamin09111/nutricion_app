"use client";

import React from "react";
import { WizardStepper } from "./WizardStepper";
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
  const stepLabels = steps.map((s) => ({ label: s.label, description: s.description }));

  return (
    <div className={cn("w-full pb-4 border-b border-[#E9E5E7]/70 space-y-3", className)}>
      <WizardStepper
        steps={stepLabels}
        currentStep={currentStep}
        onStepClick={onStepChange}
        className="w-full"
      />
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-xs text-[#626573] font-medium">
          Paso {currentStep + 1} de {steps.length}:{" "}
          <strong className="text-[#20212B] font-semibold">{steps[currentStep]?.label}</strong>
        </span>
        {steps[currentStep]?.description && (
          <span className="text-xs text-slate-400 hidden sm:inline">
            {steps[currentStep].description}
          </span>
        )}
      </div>
    </div>
  );
}
