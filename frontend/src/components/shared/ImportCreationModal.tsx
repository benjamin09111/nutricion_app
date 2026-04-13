"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Loader2, Search, Library, Tag as TagIcon, X } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";

interface Creation {
    id: string;
    name: string;
    type: string;
    content: any;
    metadata?: any;
    tags: string[];
    createdAt: string;
}

interface ImportCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (creation: Creation) => void;
    defaultType?: string; // DIET, SHOPPING_LIST, RECIPE
    allowedTypes?: string[];
}

const CREATION_TYPE_OPTIONS = [
    { value: "ALL", label: "Todos" },
    { value: "DIET", label: "Dietas" },
    { value: "SHOPPING_LIST", label: "Carrito" },
    { value: "RECIPE", label: "Recetas" },
    { value: "FAST_DELIVERABLE", label: "Entregable rápido" },
] as const;

export function ImportCreationModal({
    isOpen,
    onClose,
    onImport,
    defaultType,
    allowedTypes,
}: ImportCreationModalProps) {
    const [creations, setCreations] = useState<Creation[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>(["ALL"]);

    useEffect(() => {
        if (isOpen) {
            fetchCreations();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        setSelectedTypes(["ALL"]);
    }, [isOpen, defaultType]);

    const fetchCreations = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

            const response = await fetchApi("/creations", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const orderedCreations = [...data].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
                setCreations(orderedCreations);
            }
        } catch (e) {
            console.error("Error fetching creations", e);
            toast.error("No se pudieron cargar las creaciones");
        } finally {
            setLoading(false);
        }
    };

    const visibleTypeOptions = CREATION_TYPE_OPTIONS.filter(
        (option) => option.value === "ALL" || !allowedTypes || allowedTypes.includes(option.value),
    );

    const effectiveSelectedTypes = selectedTypes.filter(
        (type) => type === "ALL" || !allowedTypes || allowedTypes.includes(type),
    );

    const filteredCreations = creations.filter((c) => {
        const isAllowedType = !allowedTypes || allowedTypes.includes(c.type);
        if (!isAllowedType) return false;
        const matchesType =
            effectiveSelectedTypes.includes("ALL") || effectiveSelectedTypes.includes(c.type);
        const matchesSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
        return matchesType && matchesSearch;
    });

    const toggleType = (type: string) => {
        setSelectedTypes((current) => {
            if (type === "ALL") {
                return ["ALL"];
            }

            const withoutAll = current.filter((item) => item !== "ALL");
            const next = withoutAll.includes(type)
                ? withoutAll.filter((item) => item !== type)
                : [...withoutAll, type];

            return next.length > 0 ? next : ["ALL"];
        });
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "DIET": return "Dieta";
            case "SHOPPING_LIST": return "Carrito";
            case "RECIPE": return "Receta";
            case "FAST_DELIVERABLE": return "Entregable rápido";
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "DIET": return "bg-indigo-100 text-indigo-700";
            case "SHOPPING_LIST": return "bg-emerald-100 text-emerald-700";
            case "RECIPE": return "bg-amber-100 text-amber-700";
            case "FAST_DELIVERABLE": return "bg-fuchsia-100 text-fuchsia-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Importar Creación"
            className="max-w-2xl"
        >
            <div className="space-y-4 pt-2">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nombre o etiquetas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {visibleTypeOptions.map((option) => {
                        const checked = selectedTypes.includes(option.value);
                        return (
                            <label
                                key={option.value}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wide transition-all cursor-pointer",
                                    checked
                                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleType(option.value)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : filteredCreations.length === 0 ? (
                        <div className="py-12 text-center">
                            <Library className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">No se encontraron creaciones</p>
                        </div>
                    ) : (
                        filteredCreations.map((creation) => (
                            <div
                                key={creation.id}
                                onClick={() => {
                                    onImport(creation);
                                    onClose();
                                }}
                                className="group p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-slate-900 text-sm">{creation.name}</h3>
                                            <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter", getTypeColor(creation.type))}>
                                                {getTypeLabel(creation.type)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {new Date(creation.createdAt).toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric"
                                            })}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-lg">
                                            Seleccionar
                                        </span>
                                    </div>
                                </div>

                                {creation.tags && creation.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {creation.tags.map((tag, idx) => (
                                            <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[9px] font-black uppercase">
                                                <TagIcon className="h-2.5 w-2.5" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}
