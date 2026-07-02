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
  backLabel = "Volver",
  className,
}: FormNavigationFooterProps) {
  return (
    <div className={cn("flex justify-between mt-4 max-w-2xl", className)}>
      {!isFirstStep ? (
        <button
          onClick={onBack}
          type="button"
          className="border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {backLabel}
        </button>
      ) : (
        <span />
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
