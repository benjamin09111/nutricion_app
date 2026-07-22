import React from "react";
import { cn } from "@/lib/utils";

interface FormNavigationFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  isFirstStep?: boolean;
  nextLabel?: string;
  backLabel?: string;
  className?: string;
}

export function FormNavigationFooter({
  onBack,
  onNext,
  nextDisabled = false,
  isFirstStep = false,
  nextLabel = "Continuar",
  backLabel = "Anterior",
  className,
}: FormNavigationFooterProps) {
  return (
    <div className={cn("flex justify-end items-center gap-3 mt-4 max-w-2xl", className)}>
      {onBack && (
        <button
          onClick={onBack}
          disabled={isFirstStep}
          type="button"
          className={cn(
            "border rounded-lg px-4 py-2 text-sm transition-colors",
            isFirstStep
              ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          {backLabel}
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        type="button"
        className={cn(
          "rounded-lg px-4 py-2 text-sm transition-colors",
          nextDisabled
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        )}
      >
        {nextLabel}
      </button>
    </div>
  );
}
