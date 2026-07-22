"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface NatyButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  loadingLabel?: string;
  variant?: "emerald" | "indigo" | "amber";
  size?: "sm" | "md";
  className?: string;
}

export function NatyButton({
  onClick,
  isLoading = false,
  disabled = false,
  label = "Generar con Naty",
  loadingLabel = "Naty est\u00e1 preparando...",
  variant = "emerald",
  size = "md",
  className,
}: NatyButtonProps) {
  const isDisabled = disabled || isLoading;

  const variantStyles = {
    emerald: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white",
    indigo: "border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white",
    amber: "border-amber-200 text-amber-700 hover:bg-amber-50 bg-white",
  };

  const sizeStyles = {
    sm: "h-9 text-xs gap-1.5 px-3",
    md: "h-10 text-sm gap-2 px-4",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center rounded-xl border font-semibold transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {isLoading ? (
        <>
          <Image
            src="/nutria.webp"
            alt="Naty"
            width={20}
            height={20}
            className="h-5 w-5 animate-pulse rounded-full object-cover"
          />
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
