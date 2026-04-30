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
          "w-full h-11 flex items-center justify-between rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/65 text-emerald-50"
            : "border-slate-200 bg-white text-slate-900",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-left",
            !value
              ? "text-slate-400 font-normal"
              : isDarkMode
                ? "text-emerald-50 font-bold"
                : "text-slate-900 font-bold",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 mt-1 w-full overflow-auto overscroll-contain rounded-xl py-1 text-base shadow-lg ring-1 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100",
          isDarkMode ? "bg-slate-950 ring-emerald-400/10" : "bg-white ring-black/5",
        )}
        style={{ maxHeight: "min(18rem, calc(100vh - 14rem))" }}>
          <div className={cn(
            "sticky top-0 z-10 px-2 py-1.5 border-b border-slate-100",
            isDarkMode ? "bg-slate-950 border-emerald-400/10" : "bg-white",
          )}>
            <div className="relative">
              <Search className={cn("absolute left-2 top-2 h-3.5 w-3.5 text-slate-400", isDarkMode && "text-emerald-100/45")} />
              <input
                type="text"
                className={cn(
                  "w-full rounded-md border py-1.5 pl-8 pr-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
                  isDarkMode
                    ? "border-emerald-400/12 bg-slate-900 text-emerald-50"
                    : "border-slate-200 bg-slate-50 text-slate-900",
                )}
                placeholder="Buscar..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {isLoading ? (
            <div className={cn("relative cursor-default select-none px-4 py-2 text-xs text-center italic", isDarkMode ? "text-emerald-100/60" : "text-slate-500")}>
              Cargando...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className={cn("relative cursor-default select-none px-4 py-2 text-xs text-center italic", isDarkMode ? "text-emerald-100/60" : "text-slate-500")}>
              {search.length === 0 && onSearch
                ? "Escribe para buscar..."
                : "No encontrado."}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "relative cursor-pointer select-none py-2.5 pl-3 pr-9 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-sm",
                  value === option.value
                    ? isDarkMode
                      ? "bg-emerald-500/12 text-emerald-200 font-bold"
                      : "bg-emerald-50 text-emerald-700 font-bold"
                    : isDarkMode
                      ? "text-emerald-50 hover:bg-emerald-500/8 hover:text-emerald-200"
                      : "text-slate-900",
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  // Keep search or reset? Clearing it is usually better for next open
                  // setSearch("");
                }}
              >
                <span className="block truncate">{option.label}</span>
                {value === option.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
