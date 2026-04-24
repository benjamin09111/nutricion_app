"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Library, Tag as TagIcon } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
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
  defaultType?: string;
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
    if (!isOpen) return;
    void fetchCreations();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const normalizedDefaultType =
      defaultType && defaultType !== "ALL" && (!allowedTypes || allowedTypes.includes(defaultType))
        ? defaultType
        : "ALL";
    setSelectedTypes([normalizedDefaultType]);
  }, [isOpen, defaultType, allowedTypes]);

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
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setCreations(orderedCreations);
      }
    } catch (error) {
      console.error("Error fetching creations", error);
      toast.error("No se pudieron cargar las creaciones");
    } finally {
      setLoading(false);
    }
  };

  const visibleTypeOptions = CREATION_TYPE_OPTIONS.filter(
    (option) =>
      option.value === "ALL" || !allowedTypes || allowedTypes.includes(option.value),
  );

  const effectiveSelectedTypes = selectedTypes.filter(
    (type) => type === "ALL" || !allowedTypes || allowedTypes.includes(type),
  );

  const filteredCreations = creations.filter((creation) => {
    const isAllowedType = !allowedTypes || allowedTypes.includes(creation.type);
    if (!isAllowedType) return false;
    const matchesType =
      effectiveSelectedTypes.includes("ALL") ||
      effectiveSelectedTypes.includes(creation.type);
    const matchesSearch =
      creation.name.toLowerCase().includes(search.toLowerCase()) ||
      creation.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const toggleType = (type: string) => {
    setSelectedTypes((current) => {
      if (type === "ALL") return ["ALL"];
      const withoutAll = current.filter((item) => item !== "ALL");
      const next = withoutAll.includes(type)
        ? withoutAll.filter((item) => item !== type)
        : [...withoutAll, type];
      return next.length > 0 ? next : ["ALL"];
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "DIET":
        return "Dieta";
      case "SHOPPING_LIST":
        return "Carrito";
      case "RECIPE":
        return "Receta";
      case "FAST_DELIVERABLE":
        return "Entregable rápido";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "DIET":
        return "bg-indigo-100 text-indigo-700";
      case "SHOPPING_LIST":
        return "bg-emerald-100 text-emerald-700";
      case "RECIPE":
        return "bg-amber-100 text-amber-700";
      case "FAST_DELIVERABLE":
        return "bg-fuchsia-100 text-fuchsia-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar creación" className="max-w-2xl">
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o etiquetas..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-xl pl-10"
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
                  "cursor-pointer rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wide transition-all",
                  checked
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleType(option.value)}
                  className="mr-2 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>

        <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredCreations.length === 0 ? (
            <div className="py-12 text-center">
              <Library className="mx-auto mb-3 h-12 w-12 text-slate-200" />
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
                className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-100 p-4 transition-all hover:border-indigo-400 hover:bg-slate-50"
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">{creation.name}</h3>
                      <span
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
                          getTypeColor(creation.type),
                        )}
                      >
                        {getTypeLabel(creation.type)}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {new Date(creation.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-600">
                      Seleccionar
                    </span>
                  </div>
                </div>

                {creation.tags && creation.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {creation.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase text-slate-500"
                      >
                        <TagIcon className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
