"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: (Option | string)[];
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Seleccionar...",
  className,
  triggerClassName,
  isLoading,
  disabled,
}: SearchableSelectProps) {
  const { isDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabel =
    normalizedOptions.find((opt) => opt.value === value)?.label || value;

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

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-full h-11 flex items-center justify-between rounded-xl border border-[#E9E5E7] bg-white px-3.5 text-sm font-medium transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/65 text-emerald-50"
            : "border-[#E9E5E7] bg-white text-[#20212B]",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-left font-medium",
            !value
              ? "text-[#848792]"
              : isDarkMode
                ? "text-emerald-50"
                : "text-[#20212B]",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#848792] opacity-60" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-[100] left-0 w-full min-w-[200px] overflow-auto overscroll-contain rounded-2xl border border-[#E9E5E7] bg-white p-1.5 text-sm shadow-xl shadow-purple-950/5 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100",
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5",
            isDarkMode && "bg-slate-950 border-emerald-400/10 ring-emerald-400/10",
          )}
          style={{ maxHeight: "min(16rem, calc(100vh - 14rem))" }}
        >
          <div className="sticky top-0 z-10 px-1 pb-1.5 pt-0.5 bg-white border-b border-[#F0ECEE] mb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#848792]" />
              <input
                type="text"
                className="w-full rounded-lg border border-[#E9E5E7] bg-[#F8F9FB] py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#20212B] placeholder:text-[#848792] focus:border-[#7842D4] focus:outline-none focus:ring-1 focus:ring-[#7842D4]"
                placeholder="Buscar opción..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-3 px-3 text-xs text-center text-[#626573] italic">
              Buscando opciones...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-3 px-3 text-xs text-center text-[#848792]">
              {search.length === 0 && onSearch
                ? "Escribe para buscar..."
                : "No se encontraron resultados"}
            </div>
          ) : (
            filteredOptions.map((option) => {
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
            })
          )}
        </div>
      )}
    </div>
  );
}
