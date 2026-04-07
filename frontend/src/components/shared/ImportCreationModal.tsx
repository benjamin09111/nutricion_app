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
}

export function ImportCreationModal({
    isOpen,
    onClose,
    onImport,
    defaultType,
}: ImportCreationModalProps) {
    const [creations, setCreations] = useState<Creation[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>(defaultType || "ALL");

    useEffect(() => {
        if (isOpen) {
            fetchCreations();
        }
    }, [isOpen, filterType]);

    const fetchCreations = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

            let url = "/creations";
            if (filterType !== "ALL") {
                url += `?type=${filterType}`;
            }

            const response = await fetchApi(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCreations(data);
            }
        } catch (e) {
            console.error("Error fetching creations", e);
            toast.error("No se pudieron cargar las creaciones");
        } finally {
            setLoading(false);
        }
    };

    const filteredCreations = creations.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
        return matchesSearch;
    });

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "DIET": return "Dieta";
            case "SHOPPING_LIST": return "Carrito";
            case "RECIPE": return "Receta";
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "DIET": return "bg-indigo-100 text-indigo-700";
            case "SHOPPING_LIST": return "bg-emerald-100 text-emerald-700";
            case "RECIPE": return "bg-amber-100 text-amber-700";
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
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 px-3 min-w-[140px]"
                    >
                        <option value="ALL">Todos los tipos</option>
                        <option value="DIET">Dietas</option>
                        <option value="SHOPPING_LIST">Carrito</option>
                        <option value="RECIPE">Recetas</option>
                    </select>
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
