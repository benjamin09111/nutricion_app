"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: (SelectOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  errored?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled,
  errored,
  className,
  triggerClassName,
}: SelectProps) {
  const { isDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  const selectedLabel =
    normalizedOptions.find((opt) => opt.value === value)?.label || undefined;

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 260 && spaceAbove > spaceBelow);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-full h-11 flex items-center justify-between rounded-xl border border-[#E9E5E7] bg-white px-3.5 text-sm font-medium transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          errored
            ? "border-red-300 bg-red-50 text-red-900 focus:ring-red-500/20"
            : isDarkMode
              ? "border-emerald-400/12 bg-slate-950/65 text-emerald-50"
              : "border-[#E9E5E7] bg-white text-[#20212B]",
          !errored && "focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4]",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "truncate text-left font-medium",
            !selectedLabel
              ? "text-[#848792]"
              : isDarkMode
                ? "text-emerald-50"
                : "text-[#20212B]",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-[#848792] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-[100] left-0 w-full min-w-[180px] overflow-auto rounded-2xl border border-[#E9E5E7] bg-white p-1.5 text-sm shadow-xl shadow-purple-950/5 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100",
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5",
            isDarkMode && "bg-slate-950 border-emerald-400/10 ring-emerald-400/10",
          )}
          style={{ maxHeight: "min(16rem, calc(100vh - 14rem))" }}
        >
          {normalizedOptions.map((option) => {
            const isSelected = value === option.value;
            return (
              <div
                key={option.value}
                className={cn(
                  "relative cursor-pointer select-none rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between",
                  isSelected
                    ? isDarkMode
                      ? "bg-emerald-500/12 text-emerald-200"
                      : "bg-[#F3ECFC] text-[#7842D4] font-semibold"
                    : isDarkMode
                      ? "text-emerald-50 hover:bg-emerald-500/8 hover:text-emerald-200"
                      : "text-[#20212B] hover:bg-[#F8F9FB] hover:text-[#7842D4]",
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="block truncate">{option.label}</span>
                {isSelected && (
                  <Check className="ml-2 h-4 w-4 shrink-0 text-[#7842D4]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
