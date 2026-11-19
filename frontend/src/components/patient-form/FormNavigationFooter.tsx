import React from "react";
import { cn } from "@/lib/utils";

interface FormNavigationFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  isFirstStep?: boolean;
  nextLabel?: string;
  backLabel?: string;
  hideNext?: boolean;
  className?: string;
}

export function FormNavigationFooter({
  onBack,
  onNext,
  nextDisabled = false,
  isFirstStep = false,
  nextLabel = "Continuar",
  backLabel = "Anterior",
  hideNext = false,
  className,
}: FormNavigationFooterProps) {
  return (
    <div className={cn("flex justify-end items-center gap-2.5", className)}>
      {onBack && (
        <button
          onClick={onBack}
          disabled={isFirstStep}
          type="button"
          className={cn(
            "h-10 border rounded-xl px-4 text-xs font-semibold transition-all flex items-center justify-center cursor-pointer",
            isFirstStep
              ? "border-[#E9E5E7] bg-slate-50 text-slate-300 cursor-not-allowed"
              : "border-[#E9E5E7] bg-white text-[#20212B] hover:bg-slate-50 active:scale-95"
          )}
        >
          {backLabel}
        </button>
      )}
      {!hideNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          type="button"
          className={cn(
            "h-10 rounded-xl px-5 text-xs font-semibold transition-all flex items-center justify-center cursor-pointer shadow-2xs",
            nextDisabled
              ? "bg-slate-100 text-slate-400 border border-[#E9E5E7] cursor-not-allowed"
              : "bg-[#86A83C] text-white hover:bg-[#78A82F] active:scale-95 shadow-sm shadow-[#86A83C]/20"
          )}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
