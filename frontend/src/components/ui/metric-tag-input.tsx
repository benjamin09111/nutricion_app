import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Search, Globe, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./Input";
import Cookies from "js-cookie";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { DEFAULT_METRICS } from "@/lib/constants";
import { fetchApi } from "@/lib/api-base";

interface Metric {
  key: string;
  name: string;
  unit: string;
  id?: string;
  isSystem?: boolean;
}

interface MetricTagInputProps {
  value: Array<{ key?: string; label: string; unit?: string; value?: string | number }>;
  onChange: (metrics: Array<{ key?: string; label: string; unit?: string; value?: string | number }>) => void;
  registeredKeys?: string[];
  mandatoryKeys?: string[];
  placeholder?: string;
  className?: string;
}

export function MetricTagInput({
  value = [],
  onChange,
  registeredKeys = [],
  mandatoryKeys = [],
  placeholder = "Buscar o agregar métrica...",
  className,
}: MetricTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchedMetrics, setFetchedMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<Metric | null>(null);

  const token = typeof window !== "undefined" ? (Cookies.get("auth_token") || localStorage.getItem("auth_token")) : "";

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!token) {
        setFetchedMetrics([]);
        return;
      }

      setIsLoading(true);
      try {
        const url =
          inputValue.trim() === ""
            ? `/metrics?limit=10`
            : `/metrics?search=${encodeURIComponent(inputValue)}`;

        const response = await fetchApi(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setFetchedMetrics(data);
        }
      } catch (error) {
        console.error("Error fetching metric suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchMetrics, 300);
    return () => clearTimeout(timer);
  }, [inputValue, token]);

  const addMetric = (metric: Metric) => {
    const isDuplicate = value.some((m) => m.key === metric.key);
    if (!isDuplicate) {
      onChange([...value, { key: metric.key, label: metric.name, unit: metric.unit, value: "" }]);
      setInputValue("");
      setShowSuggestions(false);
    } else {
      setInputValue("");
    }
  };

  const removeMetric = (key: string) => {
    if (!key) return;
    if (mandatoryKeys.includes(key)) {
      toast.error("Esta métrica es obligatoria");
      return;
    }
    onChange(value.filter((m) => !m.key || m.key !== key));
  };

  const handleDeleteGlobalMetric = async (metric: Metric) => {
    try {
      const response = await fetchApi(`/metrics/${metric.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        onChange(value.filter((m) => m.key !== metric.key));
        setFetchedMetrics((prev) => prev.filter((m) => m.id !== metric.id));
        toast.success(`Métrica "${metric.name}" eliminada del sistema`);
      } else {
        const err = await response.json();
        toast.error(err.message || "No tienes permisos para eliminar esta métrica");
      }
    } catch (error) {
      console.error("Error deleting global metric:", error);
      toast.error("Error de conexión al eliminar métrica");
    }
  };

  const allMatchingMetrics = [
    ...DEFAULT_METRICS.map((metric) => ({ ...metric, isSystem: true })),
    ...fetchedMetrics.map((metric) => ({ ...metric, isSystem: false })),
  ].filter((metric, index, self) => {
    const isFirstAppearance = index === self.findIndex((item) => item.key === metric.key);
    if (!isFirstAppearance) return false;

    return metric.name.toLowerCase().includes(inputValue.toLowerCase());
  });

  const suggestions =
    inputValue.trim() === "" ? allMatchingMetrics : allMatchingMetrics.slice(0, 15);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-3", className)} ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="h-11 pl-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-72 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Métricas Disponibles
              </p>
            </div>
            {suggestions.map((metric) => {
              const isSelected = value.some((item) => item.key === metric.key);
              const isRegistered = registeredKeys.includes(metric.key);

              return (
                <div
                  key={metric.key}
                  className={cn(
                    "w-full transition-colors border-b border-slate-100 last:border-0 flex items-center group/item hover:bg-slate-50",
                    isSelected ? "bg-emerald-50/30 text-emerald-700" : "text-slate-700",
                    isRegistered && !isSelected && "bg-blue-50/10",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      isSelected ? removeMetric(metric.key) : addMetric(metric)
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm font-semibold cursor-pointer"
                    title={metric.isSystem ? "Métrica del sistema" : "Métrica creada por nutri"}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        metric.isSystem
                          ? "border-blue-100 bg-blue-50 text-blue-500"
                          : "border-emerald-100 bg-emerald-50 text-emerald-500",
                      )}
                    >
                      {metric.isSystem ? (
                        <Globe className="w-3.5 h-3.5" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full transition-all",
                            isSelected
                              ? "bg-emerald-500 scale-110"
                              : isRegistered
                                ? "bg-blue-400"
                                : "bg-slate-200 scale-75",
                          )}
                        />
                        <span className="truncate text-slate-700">
                          {metric.name} {metric.unit ? `(${metric.unit})` : ""}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                        {isSelected ? (
                          <span className="text-emerald-600">Seleccionada</span>
                        ) : isRegistered ? (
                          <span className="text-blue-600">En historial</span>
                        ) : null}

                        <span className="inline-flex items-center gap-1">
                          {metric.isSystem ? (
                            <>
                              <Globe className="h-3 w-3" />
                              <span>Sistema</span>
                            </>
                          ) : (
                            <>
                              <UserIcon className="h-3 w-3" />
                              <span>Nutri</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>

                  {!metric.isSystem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMetricToDelete(metric);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer"
                      title="Eliminar métrica"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 min-h-[20px] px-1">
        {value
          .filter((metric) => !!metric.key)
          .map((metric, idx) => (
            <span
              key={metric.key || `idx-${idx}`}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-200"
            >
              {metric.label} {metric.unit ? `(${metric.unit})` : ""}
              {!mandatoryKeys.includes(metric.key || "") && (
                <button
                  type="button"
                  onClick={() => removeMetric(metric.key || "")}
                  className="ml-2 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
      </div>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setMetricToDelete(null);
        }}
        onConfirm={() => {
          if (metricToDelete) handleDeleteGlobalMetric(metricToDelete);
          setIsDeleteConfirmOpen(false);
          setMetricToDelete(null);
        }}
        title="¿Eliminar métrica permanente?"
        description={`¿Estás seguro de que deseas eliminar permanentemente la métrica "${metricToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </div>
  );
}
