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
    <div className={cn("flex justify-end items-center gap-3 mt-4 max-w-2xl w-full", className)}>
      {onBack && (
        <button
          onClick={onBack}
          disabled={isFirstStep}
          type="button"
          className={cn(
            "border rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors flex-1 sm:flex-initial text-center justify-center",
            isFirstStep
              ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95"
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
          "rounded-xl px-5 py-2.5 text-sm font-bold transition-colors flex-1 sm:flex-initial text-center justify-center",
          nextDisabled
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm"
        )}
      >
        {nextLabel}
      </button>
    </div>
  );
}
