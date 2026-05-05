"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  Info,
  Trash2,
  Edit,
  FileText,
  ShoppingCart,
  ChefHat,
  Folder,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  NotebookText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Creation, CreationType } from "@/features/creations";
import { Pagination } from "@/components/ui/Pagination";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchApi } from "@/lib/api-base";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CreationsClientProps {
  initialData?: Creation[];
  fixedPatientName?: string;
  isInsidePatientDetail?: boolean;
}

export default function CreationsClient({ 
  initialData = [], 
  fixedPatientName = "", 
  isInsidePatientDetail = false 
}: CreationsClientProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CreationType | "Todos">("Todos");
  const [selectedTag, setSelectedTag] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientFilter, setPatientFilter] = useState(fixedPatientName);
  const [currentPage, setCurrentPage] = useState(1);
  const [localCreations, setLocalCreations] = useState<Creation[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  const itemsPerPage = 7;

  const mapBackendTypeToFrontend = (type: string): CreationType => {
    switch (type) {
      case "DIET":
        return CreationType.DIET;
      case "SHOPPING_LIST":
        return CreationType.SHOPPING_LIST;
      case "RECIPE":
        return CreationType.RECIPE;
      case "FAST_DELIVERABLE":
        return CreationType.FAST_DELIVERABLE;
      default:
        return CreationType.OTHER;
    }
  };

  // Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Creation | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [fullCreationData, setFullCreationData] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // -- Fetch full creation data (shared by view and export) --
  const fetchFullData = async (id: string): Promise<any | null> => {
    try {
      const token = Cookies.get("auth_token");
      const response = await fetchApi(`/creations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) return await response.json();
    } catch (e) {
      console.error("Error fetching creation:", e);
    }
    return null;
  };

  // -- Build DietPdfData from full API response --
  const buildDietData = (raw: any) => {
    const foods: any[] = [];

    // From foodSummary in metadata (new format)
    if (raw.metadata?.foodSummary?.length) {
      raw.metadata.foodSummary.forEach((f: any) => {
        foods.push({
          producto: f.name,
          grupo: f.group || "Varios",
          unidad: f.unit,
          calorias: f.calories,
          proteinas: f.proteins,
          lipidos: f.lipids,
          carbohidratos: f.carbs,
        });
      });
    }
    // Fallback: from content.manualAdditions
    else if (raw.content?.manualAdditions?.length) {
      raw.content.manualAdditions.forEach((f: any) => {
        foods.push({
          producto: f.producto,
          grupo: f.grupo || "Varios",
          unidad: f.unidad,
          calorias: f.calorias,
          proteinas: f.proteinas,
          lipidos: f.lipidos,
          carbohidratos: f.carbohidratos,
        });
      });
    }

    return {
      dietName: raw.name,
      dietTags: raw.tags || [],
      activeConstraints: raw.content?.activeConstraints || [],
      patientName: raw.metadata?.patientName || raw.content?.patientMeta?.fullName,
      foods,
    };
  };

  const buildFastDeliverableData = (raw: {
    name?: string;
    content?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) => ({
    name:
      typeof raw.content?.title === "string"
        ? raw.content.title
        : typeof raw.name === "string" && raw.name.trim()
          ? raw.name
          : "Entregable",
    patientName:
      typeof raw.metadata?.patientName === "string"
        ? raw.metadata.patientName
        : null,
    meals: Array.isArray(raw.content?.meals) ? raw.content.meals : [],
    avoidFoods: Array.isArray(raw.content?.avoidFoods) ? raw.content.avoidFoods : [],
    resources: Array.isArray(raw.content?.resources) ? raw.content.resources : [],
    portionGuide: Array.isArray(raw.content?.portionGuide) ? raw.content.portionGuide : [],
    generatedAt: typeof raw.content?.updatedAt === "string"
      ? new Date(raw.content.updatedAt).toLocaleDateString("es-CL")
      : new Date().toLocaleDateString("es-CL"),
  });

  const buildQuickRecipesData = (raw: any) => ({
    title: typeof raw.content?.title === "string" ? raw.content.title : raw.name || "Recetas",
    patientName: typeof raw.metadata?.patientName === "string" ? raw.metadata.patientName : null,
    nutritionistNotes: typeof raw.content?.nutritionistNotes === "string" ? raw.content.nutritionistNotes : undefined,
    dishes: Array.isArray(raw.content?.dishes) ? raw.content.dishes : [],
    generatedAt: typeof raw.content?.updatedAt === "string"
      ? new Date(raw.content.updatedAt).toLocaleDateString("es-CL")
      : new Date().toLocaleDateString("es-CL"),
  });

  const handleDownloadClick = async (item: Creation) => {
    setSelectedItem(item);
    setIsExportingPdf(true);
    try {
      const raw = await fetchFullData(item.id);
      if (!raw) { toast.error("No se pudo obtener los datos de la creación."); return; }
      if (item.type === CreationType.DIET) {
        const { downloadDietPdf } = await import("@/features/pdf/pdfExport");
        await downloadDietPdf(buildDietData(raw));
        toast.success("PDF descargado correctamente.");
      } else if (item.type === CreationType.FAST_DELIVERABLE) {
        const { downloadFastDeliverablePdf } = await import("@/features/pdf/fastDeliverablePdfExport");
        await downloadFastDeliverablePdf(buildFastDeliverableData(raw));
        toast.success("PDF descargado correctamente.");
      } else if (item.type === CreationType.RECIPE && (item.tags || []).includes("rapido")) {
        const { downloadQuickRecipesPdf } = await import("@/features/pdf/quickRecipesPdfExport");
        await downloadQuickRecipesPdf(buildQuickRecipesData(raw));
        toast.success("PDF de recetas descargado correctamente.");
      } else {
        toast.info("Exportación PDF para este tipo próximamente.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al generar el PDF.");
    } finally {
      setIsExportingPdf(false);
      setSelectedItem(null);
    }
  };

  const handleInfoClick = (item: Creation) => {
    setSelectedItem(item);
    setInfoModalOpen(true);
  };

  const handleViewClick = async (item: Creation) => {
    setSelectedItem(item);
    setViewModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const token = Cookies.get("auth_token");
      const response = await fetchApi(`/creations/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFullCreationData(data);
      }
    } catch (error) {
      console.error("Error fetching creation details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchCreations = async () => {
      setIsLoading(true);
      try {
        const token = Cookies.get("auth_token");
        const response = await fetchApi("/creations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const mappedData = data.map((item: any) => {
            const contentConstraints = Array.isArray(item.content?.activeConstraints)
              ? item.content.activeConstraints
              : [];
            const allFilterTags = Array.from(
              new Set([...(item.tags || []), ...contentConstraints]),
            );
            return {
              id: item.id,
              name: item.name,
              type: mapBackendTypeToFrontend(item.type),
              createdAt: new Date(item.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              size: "N/A",
              format: item.format === "NATIVE" ? "JSON" : "PDF",
              tags: item.tags || [],
              filterTags: allFilterTags,
              isPublic: item.isPublic || false,
              patientName: item.metadata?.patientName || item.content?.patientMeta?.fullName || null,
              description:
                typeof item.metadata?.description === "string"
                  ? item.metadata.description
                  : "",
            };
          });
          setLocalCreations(mappedData);
        }
      } catch (error) {
        console.error("Error fetching creations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreations();
  }, []);

  const allData = useMemo(() => localCreations, [localCreations]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allData.forEach((item) =>
      (item.filterTags || item.tags || []).forEach((tag) => tags.add(tag)),
    );
    return Array.from(tags);
  }, [allData]);

  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "Todos" || item.type === selectedType;
      const matchesTag =
        selectedTag === "Todos" ||
        ((item.filterTags || item.tags || []).includes(selectedTag));
      const matchesPatient = !patientFilter.trim() ||
        ((item as any).patientName?.toLowerCase() ?? "").includes(patientFilter.toLowerCase());
      return matchesSearch && matchesType && matchesTag && matchesPatient;
    });
  }, [allData, searchTerm, selectedType, selectedTag, patientFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedTag, patientFilter]);

  const getTypeIcon = (type: CreationType) => {
    switch (type) {
      case CreationType.DIET:
        return <FileText className="w-4 h-4 text-blue-500" />;
      case CreationType.SHOPPING_LIST:
        return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
      case CreationType.RECIPE:
        return <ChefHat className="w-4 h-4 text-amber-500" />;
      case CreationType.FAST_DELIVERABLE:
        return <NotebookText className="w-4 h-4 text-fuchsia-500" />;
      default:
        return <Folder className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeStyles = (type: CreationType) => {
    switch (type) {
      case CreationType.DIET:
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case CreationType.SHOPPING_LIST:
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case CreationType.RECIPE:
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case CreationType.FAST_DELIVERABLE:
        return "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20";
      default:
        return "bg-slate-50 text-slate-600 ring-slate-500/10";
    }
  };

  const handleEdit = (item: Creation) => {
    switch (item.type) {
      case CreationType.DIET:
        localStorage.setItem("currentDietEditId", item.id);
        router.push("/dashboard/dieta");
        break;
      case CreationType.SHOPPING_LIST:
        router.push("/dashboard/lista-compras");
        break;
      case CreationType.RECIPE: {
        const isQuick = (item.tags || []).includes("rapido");
        if (isQuick) {
          router.push(`/dashboard/rapido/recetas?creationId=${item.id}`);
        } else {
          router.push("/dashboard/recetas");
        }
        break;
      }
      case CreationType.FAST_DELIVERABLE:
        router.push(`/dashboard/rapido?creationId=${item.id}`);
        break;
      default:
        console.warn("Edit not implemented for type", item.type);
    }
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const token = Cookies.get("auth_token");
      const response = await fetchApi(`/creations/${itemToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setLocalCreations((prev) => prev.filter((c) => c.id !== itemToDelete));
        toast.success("Creación eliminada correctamente");
      } else {
        toast.error("No se pudo eliminar la creación");
      }
    } catch (error) {
      console.error("Error deleting creation:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {!isInsidePatientDetail && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-[2rem] bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
          <span>
            <strong>Recomendación de uso:</strong> crear plantillas generales para simplemente re utilizarlas.
          </span>
        </div>
      )}

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto flex-1">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <Input
              type="search"
              placeholder="Buscar por nombre..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!isInsidePatientDetail && (
            <div className="relative w-full md:w-52">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <Input
                type="search"
                placeholder="Filtrar por paciente..."
                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full font-semibold"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
              />
              {patientFilter && (
                <button
                  onClick={() => setPatientFilter("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="w-full md:w-48 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
            >
              <option value="Todos">Todos los Tipos</option>
              <option value={CreationType.DIET}>Dietas</option>
              <option value={CreationType.SHOPPING_LIST}>
                Listas de Compra
              </option>
              <option value={CreationType.RECIPE}>Recetas</option>
              <option value={CreationType.FAST_DELIVERABLE}>
                Entregables Rápidos
              </option>
            </select>
          </div>

          <div className="w-full md:w-64 relative">
            <SearchableSelect
              options={[
                { value: "Todos", label: "Todas las etiquetas y restricciones" },
                ...allTags.map((tag) => ({ value: tag, label: tag })),
              ]}
              value={selectedTag}
              onChange={setSelectedTag}
              placeholder="Buscar tag o restricción..."
              triggerClassName="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white pl-10 font-semibold"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
              <Folder className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50 text-shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  Paciente
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  Etiquetas
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-4 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                      <p className="text-sm font-semibold text-slate-500">
                        Cargando tus creaciones...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg bg-slate-50 border border-slate-100",
                          item.type === CreationType.DIET && "group-hover:bg-blue-50 group-hover:border-blue-100",
                          item.type === CreationType.SHOPPING_LIST && "group-hover:bg-emerald-50 group-hover:border-emerald-100",
                          item.type === CreationType.RECIPE && "group-hover:bg-amber-50 group-hover:border-amber-100",
                        )}>
                          {getTypeIcon(item.type)}
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(item as any).patientName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {(item as any).patientName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin paciente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.length > 0 ? (
                          item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin etiquetas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                          getTypeStyles(item.type),
                        )}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                        {item.createdAt}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleInfoClick(item)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Más info"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        {item.type !== CreationType.FAST_DELIVERABLE && (
                          <button
                            onClick={() => handleViewClick(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            title="Previsualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadClick(item)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                          title="Descargar / Exportar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Folder className="h-8 w-8 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-slate-600">
                          No se encontraron creaciones
                        </p>
                        <p className="text-sm text-slate-400">
                          Intenta ajustar los filtros de búsqueda.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            Mostrando{" "}
            <span className="text-slate-900">{paginatedData.length}</span> de{" "}
            <span className="text-slate-900">{filteredData.length}</span>{" "}
            resultados
          </p>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={infoModalOpen}
        onClose={() => {
          setInfoModalOpen(false);
          setSelectedItem(null);
        }}
        title="Información de la creación"
      >
        <div className="space-y-4">
          {selectedItem ? (
            <>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  {selectedItem.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                      getTypeStyles(selectedItem.type),
                    )}
                  >
                    {selectedItem.type}
                  </span>
                  {selectedItem.patientName ? (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                      {selectedItem.patientName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Descripción
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedItem.description?.trim() ||
                    "Esta creación no tiene descripción guardada."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Fecha
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {selectedItem.createdAt}
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 text-slate-600"
                  onClick={() => setInfoModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setFullCreationData(null);
        }}
        title="Detalles de la Creación"
      >
        <div className="space-y-6">
          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
              <p className="text-sm font-bold text-slate-500">
                Cargando detalles...
              </p>
            </div>
          ) : fullCreationData ? (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div
                  className={cn(
                    "p-3 rounded-xl bg-white shadow-sm border border-slate-200",
                    getTypeStyles(
                      mapBackendTypeToFrontend(fullCreationData.type),
                    ),
                  )}
                >
                  {getTypeIcon(mapBackendTypeToFrontend(fullCreationData.type))}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {fullCreationData.name}
                  </h3>
                  {typeof fullCreationData.metadata?.description === "string" &&
                  fullCreationData.metadata.description.trim() ? (
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      {fullCreationData.metadata.description}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fullCreationData.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-white text-slate-500 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Alimentos Incluidos
                  </h4>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight">
                    {fullCreationData.metadata?.foodCount || 0} ITEMS
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {fullCreationData.type === "DIET" && (
                    <div className="space-y-4">
                      {(() => {
                        const foodMap: Record<string, string[]> = {};
                        if (fullCreationData.metadata?.foodSummary) {
                          fullCreationData.metadata.foodSummary.forEach(
                            (f: any) => {
                              if (!foodMap[f.group]) foodMap[f.group] = [];
                              foodMap[f.group].push(f.name);
                            },
                          );
                        } else if (fullCreationData.content?.manualAdditions) {
                          fullCreationData.content.manualAdditions.forEach(
                            (ma: any) => {
                              if (!foodMap[ma.grupo]) foodMap[ma.grupo] = [];
                              foodMap[ma.grupo].push(ma.producto);
                            },
                          );
                        }

                        if (Object.keys(foodMap).length === 0) {
                          return (
                            <div className="py-4 text-center">
                              <p className="text-sm text-slate-400 italic">
                                No hay detalles específicos guardados para los
                                alimentos en este resumen.
                              </p>
                            </div>
                          );
                        }

                        return Object.entries(foodMap).map(
                          ([group, products]) => (
                            <div key={group} className="space-y-2">
                              <h5 className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded inline-block">
                                {group}
                              </h5>
                              <ul className="grid grid-cols-1 gap-1 pl-1">
                                {products.map((p, idx) => (
                                  <li
                                    key={idx}
                                    className="text-sm font-medium text-slate-700 flex items-center gap-2"
                                  >
                                    <div className="h-1 w-1 bg-emerald-400 rounded-full" />
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ),
                        );
                      })()}
                    </div>
                  )}

                  {fullCreationData.type !== "DIET" && (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">
                        Resumen detallado próximamente para este tipo de
                        creación.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <Button
                  className="flex-1 bg-slate-900 hover:bg-slate-800 h-11 text-white font-black rounded-xl"
                  onClick={() => handleEdit(selectedItem!)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Cargar en Diseñador
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-slate-200 text-slate-600 font-bold px-4 rounded-xl"
                  onClick={() => setViewModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium text-sm">
                No se pudieron cargar los datos de la creación.
              </p>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Creación"
        description="¿Estás seguro de que deseas eliminar esta creación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
