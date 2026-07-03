"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  errored?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled,
  errored,
  className,
}: SelectProps) {
  const { isDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || undefined;

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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-full h-10 flex items-center justify-between rounded-lg border px-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          errored
            ? "border-red-300 bg-red-50 text-red-900 focus:ring-red-500/20"
            : isDarkMode
              ? "border-emerald-400/12 bg-slate-950/65 text-emerald-50"
              : "border-slate-200 bg-white text-slate-900",
          !errored && "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
          className,
        )}
      >
        <span
          className={cn(
            "truncate text-left",
            !selectedLabel && "text-slate-400",
            selectedLabel && isDarkMode && "text-emerald-50",
            selectedLabel && !isDarkMode && !errored && "text-slate-900",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 bottom-full left-0 mb-1 w-full overflow-auto rounded-lg py-1 text-sm shadow-lg ring-1 animate-in fade-in zoom-in-95 duration-100",
            isDarkMode ? "bg-slate-950 ring-emerald-400/10" : "bg-white ring-black/5",
          )}
          style={{ maxHeight: "min(14rem, calc(100vh - 14rem))" }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative cursor-pointer select-none py-2.5 pl-3 pr-9 text-sm transition-colors",
                value === option.value
                  ? isDarkMode
                    ? "bg-emerald-500/12 text-emerald-200"
                    : "bg-emerald-50 text-emerald-700"
                  : isDarkMode
                    ? "text-emerald-50 hover:bg-emerald-500/8 hover:text-emerald-200"
                    : "text-slate-900 hover:bg-emerald-50 hover:text-emerald-700",
              )}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="block truncate">{option.label}</span>
              {value === option.value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
