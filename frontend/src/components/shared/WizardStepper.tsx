"use client";

import React from "react";
import {
  Check,
  Lock,
  ArrowRight,
  Utensils,
  Ban,
  BookOpen,
  Scale,
  ClipboardCheck,
  ChefHat,
  Apple,
  FileText,
  User,
} from "lucide-react";
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

function getStepIcon(label: string, index: number) {
  const l = label.toLowerCase();
  if (l.includes("comida") || l.includes("menú") || l.includes("menu")) return Utensils;
  if (l.includes("ingrediente") || l.includes("alimento")) return Apple;
  if (l.includes("evitar") || l.includes("restricci") || l.includes("alergia")) return Ban;
  if (l.includes("recurso") || l.includes("guia") || l.includes("material") || l.includes("documento")) return BookOpen;
  if (l.includes("porcion") || l.includes("porción") || l.includes("equivalen") || l.includes("macro")) return Scale;
  if (l.includes("resumen") || l.includes("final") || l.includes("export") || l.includes("descarg")) return ClipboardCheck;
  if (l.includes("receta") || l.includes("preparaci")) return ChefHat;
  if (l.includes("paciente") || l.includes("datos")) return User;

  const fallbacks = [Utensils, Ban, BookOpen, Scale, ClipboardCheck];
  return fallbacks[index % fallbacks.length] || FileText;
}

export function WizardStepper({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  lockFutureSteps = false,
  className,
}: WizardStepperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeStepRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (activeStepRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeStepRef.current;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      const containerWidth = container.offsetWidth;

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentStep]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full select-none py-3 px-2 sm:px-4 overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain touch-pan-x",
        className,
      )}
    >
      <div className="flex w-max mx-auto items-start gap-1 sm:gap-2 md:gap-3 py-1 px-4 sm:px-6">
        {steps.map((step, index) => {
          const stepLabel = typeof step === "string" ? step : step.label;
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isActive = currentStep === index;
          const isLocked = lockFutureSteps && !isCompleted && !isActive;

          const isClickable = Boolean(onStepClick && !isLocked);
          const StepIcon = getStepIcon(stepLabel, index);

          return (
            <React.Fragment key={index}>
              <div className="flex items-start">
                <button
                  ref={isActive ? activeStepRef : undefined}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(index)}
                  className={cn(
                    "group flex flex-col items-center text-center transition-all focus:outline-hidden shrink-0",
                    isClickable ? "cursor-pointer" : "cursor-default",
                    isLocked && "opacity-45 cursor-not-allowed",
                  )}
                >
                  {/* Círculo con Icono (100% redondo simétrico, sin deformación ni halos cortados) */}
                  <div
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-full aspect-square flex items-center justify-center transition-all duration-200 shrink-0",
                      isActive && "bg-[#86A83C] text-white shadow-sm shadow-[#86A83C]/25 border border-[#78A82F]",
                      isCompleted && !isActive && "bg-[#F0F5DF] border border-[#DDE7B8] text-[#5A781E] group-hover:bg-[#E4ECC8]",
                      !isCompleted && !isActive && !isLocked && "bg-white border border-[#E9E5E7] text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600 shadow-2xs",
                      isLocked && "bg-slate-50 border border-slate-200 text-slate-300",
                    )}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                    ) : (
                      <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                    )}
                  </div>

                  {/* Texto centrado debajo */}
                  <div className="mt-2.5 flex flex-col items-center text-center max-w-[90px] sm:max-w-[120px]">
                    <span
                      className={cn(
                        "text-xs tracking-tight transition-colors line-clamp-1",
                        isActive ? "text-[#5A781E] font-bold" : isCompleted ? "text-[#20212B] font-semibold" : "text-slate-500 font-medium",
                      )}
                    >
                      {stepLabel}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] transition-colors mt-0.5",
                        isActive ? "text-[#86A83C] font-semibold" : "text-slate-400 font-medium",
                      )}
                    >
                      Paso {index + 1}
                    </span>
                  </div>
                </button>

                {/* Flecha conectora entre pasos (centrada matemáticamente con el círculo) */}
                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center text-slate-300 shrink-0 self-start mt-4 sm:mt-4.5 px-1.5 sm:px-3 md:px-4">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 stroke-[1.8]" />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
