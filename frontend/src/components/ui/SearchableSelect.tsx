import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
          "w-full h-11 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-left",
            !value ? "text-slate-400 font-normal" : "text-slate-900 font-bold",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-[220px] w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100">
          <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {isLoading ? (
            <div className="relative cursor-default select-none px-4 py-2 text-slate-500 text-xs text-center italic">
              Cargando...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="relative cursor-default select-none px-4 py-2 text-slate-500 text-xs text-center italic">
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
                    ? "bg-emerald-50 text-emerald-700 font-bold"
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
