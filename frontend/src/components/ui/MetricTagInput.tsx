import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Search, Globe, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./Input";
import Cookies from "js-cookie";
import { DEFAULT_METRICS } from "@/lib/constants";

interface Metric {
    key: string;
    name: string;
    unit: string;
}

interface MetricTagInputProps {
    value: any[];
    onChange: (metrics: any[]) => void;
    registeredKeys?: string[]; // Keys of metrics already present in patient history
    placeholder?: string;
    className?: string;
}

export function MetricTagInput({
    value = [],
    onChange,
    registeredKeys = [],
    placeholder = "Buscar o agregar métrica...",
    className,
}: MetricTagInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fetchedMetrics, setFetchedMetrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

    useEffect(() => {
        const fetchMetrics = async () => {
            setIsLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const url = inputValue.trim() === ""
                    ? `${apiUrl}/metrics?limit=10`
                    : `${apiUrl}/metrics?search=${encodeURIComponent(inputValue)}`;

                const response = await fetch(url, {
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

    const addMetric = (metric: any) => {
        const isDuplicate = value.some((m) => m.key === metric.key);
        if (!isDuplicate) {
            onChange([...value, { key: metric.key, label: metric.name, unit: metric.unit }]);
            setInputValue("");
            setShowSuggestions(false);
        } else {
            setInputValue("");
        }
    };

    const removeMetric = (key: string) => {
        if (!key) return; // Don't remove manual rows from the chips area
        onChange(value.filter((m) => !m.key || m.key !== key));
    };

    const handleDeleteGlobalMetric = async (metric: any) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${apiUrl}/metrics/${metric.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                // Remove from current selection if present
                onChange(value.filter((m) => m.key !== metric.key));
                // Remove from fetched metrics list
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

    // Combine fetched metrics with system defaults
    const allMatchingMetrics = [
        ...DEFAULT_METRICS.map(m => ({ ...m, isSystem: true })),
        ...fetchedMetrics.map(m => ({ ...m, isSystem: false }))
    ].filter((m, index, self) => {
        // Exclusion: "peso" is auto-added
        if (m.name.toLowerCase() === "peso") return false;

        // Remove duplicates by key (prioritize system)
        const isFirstAppearance = index === self.findIndex((t) => t.key === m.key);
        if (!isFirstAppearance) return false;

        // Filter by search query
        const matchesSearch = m.name.toLowerCase().includes(inputValue.toLowerCase());

        return matchesSearch;
    });

    const suggestions = inputValue.trim() === ""
        ? allMatchingMetrics
        : allMatchingMetrics.slice(0, 15);

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
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">
                                Métricas Disponibles
                            </p>
                        </div>
                        {suggestions.map((metric) => {
                            const isSelected = value.some(v => v.key === metric.key);
                            const isRegistered = registeredKeys.includes(metric.key);
                            return (
                                <div
                                    key={metric.key}
                                    className={cn(
                                        "w-full transition-all border-b border-slate-50 last:border-0 flex items-center group/item hover:bg-emerald-50",
                                        isSelected
                                            ? "bg-emerald-50/30 text-emerald-700"
                                            : "text-slate-700 hover:text-emerald-700",
                                        isRegistered && !isSelected && "bg-blue-50/10"
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => isSelected ? removeMetric(metric.key) : addMetric(metric)}
                                        className="flex-1 text-left px-5 py-3 text-sm font-semibold flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full transition-all",
                                                isSelected ? "bg-emerald-500 scale-110" : isRegistered ? "bg-blue-400" : "bg-slate-200 scale-75"
                                            )} />
                                            {metric.isSystem ? (
                                                <Globe className="w-3.5 h-3.5 text-blue-400 group-hover/item:text-blue-500" />
                                            ) : (
                                                <UserIcon className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-emerald-400" />
                                            )}
                                            {metric.name} {metric.unit ? `(${metric.unit})` : ""}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isSelected ? (
                                                <span className="text-[9px] font-black uppercase tracking-tight text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded-lg shadow-xs">
                                                    Seleccionada
                                                </span>
                                            ) : isRegistered ? (
                                                <span className="text-[9px] font-black uppercase tracking-tight text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-lg shadow-xs">
                                                    En Historial
                                                </span>
                                            ) : null}
                                            <span
                                                className={cn(
                                                    "text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-lg",
                                                    metric.isSystem
                                                        ? "text-blue-400 bg-blue-50 group-hover/item:text-blue-600 group-hover/item:bg-blue-100/50"
                                                        : "text-slate-300 bg-slate-50 group-hover/item:text-emerald-500 group-hover/item:bg-emerald-100/50",
                                                )}
                                            >
                                                {metric.isSystem ? "Sistema / Global" : "Creada por nutri"}
                                            </span>
                                        </div>
                                    </button>
                                    {!metric.isSystem && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`¿Eliminar permanently "${metric.name}"?`)) {
                                                    handleDeleteGlobalMetric(metric);
                                                }
                                            }}
                                            className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer"
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
                {value.filter(m => !!m.key).map((m, idx) => (
                    <span
                        key={m.key || `idx-${idx}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                        {m.label} {m.unit ? `(${m.unit})` : ""}
                        <button
                            type="button"
                            onClick={() => removeMetric(m.key)}
                            className="ml-2 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-900 transition-colors cursor-pointer"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}
