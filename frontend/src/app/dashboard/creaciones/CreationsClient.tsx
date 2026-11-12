"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Download,
  Eye,
  Info,
  Trash2,
  Edit,
  FileText,
  ShoppingCart,
  ChefHat,
  Folder,
  X,
  Loader2,
  NotebookText,
  Search,
  Share2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { UsageLimitBadge } from "@/components/shared/UsageLimitBadge";
import { useSubscription } from "@/context/SubscriptionContext";
import { Creation, CreationType, useCreations } from "@/features/creations";
import { Pagination } from "@/components/ui/Pagination";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Select } from "@/components/ui/Select";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import { MobileCardLoadingList } from "@/components/ui/MobileCardLoadingList";
import { getFastDeliverableTableMode, normalizeFastDeliverableMeals } from "@/features/pdf/fastDeliverableMeals";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CreationsClientProps {
  initialData?: Creation[];
  fixedPatientName?: string;
  patientId?: string;
  isInsidePatientDetail?: boolean;
  sharedCreationIds?: string[];
  onUpdate?: () => void;
}

export default function CreationsClient({ 
  initialData = [], 
  fixedPatientName = "", 
  patientId = "",
  isInsidePatientDetail = false,
  sharedCreationIds = [],
  onUpdate
}: CreationsClientProps) {
  const router = useRouter();
  const { usage, currentPlan, can, isLoading: isSubscriptionLoading } = useSubscription();
  const [selectedType, setSelectedType] = useState<CreationType | "Todos">("Todos");
  const canDeleteScreeningTests = can("screening_tests.delete.access");

  const [selectedTag, setSelectedTag] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientFilter, setPatientFilter] = useState(fixedPatientName);
  const [currentPage, setCurrentPage] = useState(1);
  const { creations: queryCreations, isLoading: isCreationsLoading, deleteCreation } = useCreations(initialData);
  const localCreations = queryCreations.length > 0 ? queryCreations : initialData;
  const isLoading = isCreationsLoading && localCreations.length === 0;
  const itemsPerPage = 7;

  const rawCreationsLimit = currentPlan?.entitlements?.["creations.save.limit"];
  const creationsLimit = typeof rawCreationsLimit === "number" ? rawCreationsLimit : undefined;
  const creationsUsed = usage?.creationsUsed ?? localCreations.filter(
    (creation) => creation.type !== CreationType.SCREENING_TEST,
  ).length;
  const hasResolvedCreationUsage = !isSubscriptionLoading &&
    currentPlan !== null &&
    typeof rawCreationsLimit === "number" &&
    typeof usage?.creationsUsed === "number";

  const mapBackendTypeToFrontend = (type: string): CreationType => {
    switch (type) {
      case "DIET":
        return CreationType.DIET;
      case "SHOPPING_LIST":
        return CreationType.SHOPPING_LIST;
      case "RECIPE":
      case "RECETARIO":
        return CreationType.RECIPE;
      case "FAST_DELIVERABLE":
      case "DELIVERABLE":
        return CreationType.FAST_DELIVERABLE;
      case "PAUTAS":
        return CreationType.PAUTAS;
      case "SCREENING_TEST":
        return CreationType.SCREENING_TEST;
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
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const sharedCreationIdSet = useMemo(() => new Set(sharedCreationIds), [sharedCreationIds]);

  // -- Fetch full creation data (shared by view and export) --
  const fetchFullData = async (id: string): Promise<any | null> => {
    try {
      const token = getAuthToken();
      const response = await fetchApi(`/creations/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
          producto: f.name || f.producto,
          grupo: f.group || f.grupo || "Varios",
          unidad: f.unit || f.unidad,
          calorias: f.calories ?? f.calorias,
          proteinas: f.proteins ?? f.proteinas,
          lipidos: f.lipids ?? f.lipidos,
          carbohidratos: f.carbs ?? f.carbohidratos,
        });
      });
    }
    // Fallback: from content.manualAdditions
    else if (raw.content?.manualAdditions?.length) {
      raw.content.manualAdditions.forEach((f: any) => {
        foods.push({
          producto: f.producto || f.name,
          grupo: f.grupo || f.group || "Varios",
          unidad: f.unidad || f.unit,
          calorias: f.calorias ?? f.calories,
          proteinas: f.proteinas ?? f.proteins,
          lipidos: f.lipidos ?? f.lipids,
          carbohidratos: f.carbohidratos ?? f.carbs,
        });
      });
    }
    // Fallback: from content.groups (standard from /dashboard/dietas and seed)
    else if (raw.content?.groups && typeof raw.content.groups === "object") {
      Object.entries(raw.content.groups).forEach(([groupName, groupFoods]: [string, any]) => {
        if (Array.isArray(groupFoods)) {
          groupFoods.forEach((f: any) => {
            foods.push({
              producto: f.producto || f.name,
              grupo: f.grupo || groupName || "Varios",
              unidad: f.unidad || f.unit || "porción",
              calorias: f.calorias ?? f.calories,
              proteinas: f.proteinas ?? f.proteins,
              lipidos: f.lipidos ?? f.lipids,
              carbohidratos: f.carbohidratos ?? f.carbs,
            });
          });
        }
      });
    }
    // Fallback: from content.foods (flat array)
    else if (Array.isArray(raw.content?.foods)) {
      raw.content.foods.forEach((f: any) => {
        foods.push({
          producto: f.producto || f.name,
          grupo: f.grupo || f.group || "Varios",
          unidad: f.unidad || f.unit,
          calorias: f.calorias ?? f.calories,
          proteinas: f.proteinas ?? f.proteins,
          lipidos: f.lipidos ?? f.lipids,
          carbohidratos: f.carbohidratos ?? f.carbs,
        });
      });
    }

    return {
      dietName: raw.name || "Dieta Base",
      dietTags: raw.tags || raw.content?.dietTags || [],
      planObjective: typeof raw.content?.planObjective === "string" ? raw.content.planObjective : undefined,
      showPlanObjectiveInPdf: raw.content?.showPlanObjectiveInPdf === true,
      activeConstraints: raw.content?.activeConstraints || [],
      patientName: raw.metadata?.patientName || raw.content?.patientMeta?.fullName || raw.content?.patientName,
      foods,
    };
  };

  const buildFastDeliverableData = (raw: {
    name?: string;
    content?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) => {
    const rawContent = raw.content || {};
    const paragraphsRaw = Array.isArray(rawContent.paragraphs) ? rawContent.paragraphs : [];
    const paragraphsFormatted = paragraphsRaw.map((p: any) => ({
      title: typeof p.title === "string" ? p.title : (p.categoryOptional ? `${p.category} (${p.categoryOptional})` : p.category || "Pauta"),
      subtitle: typeof p.subtitle === "string" ? p.subtitle : (p.portionsPerDay ? `${p.portionsPerDay} porciones al día` : undefined),
      foods: Array.isArray(p.foods)
        ? p.foods.map((f: any) => typeof f === "string" ? f : `${f.food || ""}${f.portion ? ` (${f.portion})` : ""}`)
        : [],
      imagePath: p.imagePath || null,
    }));

    const rawResource = rawContent.resource as { title?: string; content?: string } | undefined;
    const resourcesList = Array.isArray(rawContent.resources)
      ? rawContent.resources
      : (rawResource && rawResource.title ? [{ resourceId: "hist", title: rawResource.title, content: rawResource.content || "" }] : []);

    const rawMeals = Array.isArray(rawContent.meals) ? rawContent.meals : [];
    const normalizedMeals = rawMeals.map((m: any, index: number) => ({
      id: m.id || `meal-${index}`,
      section: m.section || m.name || `Comida ${index + 1}`,
      time: m.time || "",
      mealText: m.mealText || m.description || m.details || "",
      portion: m.portion || "",
      optionTexts: Array.isArray(m.optionTexts) ? m.optionTexts : [],
    }));

    return {
      name:
        typeof rawContent.title === "string"
          ? rawContent.title
          : typeof raw.name === "string" && raw.name.trim()
            ? raw.name
            : "Entregable",
      patientName:
        typeof raw.metadata?.patientName === "string"
          ? raw.metadata.patientName
          : (rawContent.patient as any)?.name || (typeof rawContent.patientName === "string" ? rawContent.patientName : null),
      clinicalRestriction:
        typeof rawContent.clinicalRestriction === "string"
          ? rawContent.clinicalRestriction
            : (typeof rawContent.restriction === "string" ? rawContent.restriction : null),
      planObjective: typeof rawContent.planObjective === "string" ? rawContent.planObjective : undefined,
      showPlanObjectiveInPdf: rawContent.showPlanObjectiveInPdf === true,
      contentMode:
        (rawContent.contentMode as any) ||
        (rawContent.pautaEditorMode as any) ||
        (paragraphsFormatted.length > 0 ? "paragraphs" : "table"),
      paragraphs: paragraphsFormatted,
      tableMode: getFastDeliverableTableMode(rawContent.tableMode),
      meals: normalizedMeals.length > 0
        ? normalizeFastDeliverableMeals(normalizedMeals, getFastDeliverableTableMode(rawContent.tableMode), rawContent.planMode)
        : [],
      avoidFoods: Array.isArray(rawContent.avoidFoods)
        ? rawContent.avoidFoods
        : (Array.isArray(rawContent.recommendations) ? rawContent.recommendations : []),
      resources: resourcesList,
      portionGuide: Array.isArray(rawContent.portionGuide)
        ? rawContent.portionGuide
        : (Array.isArray(rawContent.portionGuideRows) ? rawContent.portionGuideRows : []),
      generatedAt: typeof rawContent.updatedAt === "string"
        ? new Date(rawContent.updatedAt).toLocaleDateString("es-CL")
        : new Date().toLocaleDateString("es-CL"),
    };
  };

  const buildQuickRecipesData = (raw: any) => ({
    title: typeof raw.content?.title === "string" ? raw.content.title : raw.name || "Recetas",
    patientName: typeof raw.metadata?.patientName === "string" ? raw.metadata.patientName : null,
    nutritionistNotes: typeof raw.content?.nutritionistNotes === "string" ? raw.content.nutritionistNotes : undefined,
    planObjective: typeof raw.content?.planObjective === "string" ? raw.content.planObjective : undefined,
    showPlanObjectiveInPdf: raw.content?.showPlanObjectiveInPdf === true,
    dishes: Array.isArray(raw.content?.dishes) ? raw.content.dishes : (Array.isArray(raw.dishes) ? raw.dishes : []),
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
        await downloadDietPdf(buildDietData(raw), false);
        toast.success("PDF descargado correctamente.");
      } else if (
        item.type === CreationType.FAST_DELIVERABLE ||
        item.type === CreationType.PAUTAS
      ) {
        const { downloadFastDeliverablePdf } = await import("@/features/pdf/fastDeliverablePdfExport");
        await downloadFastDeliverablePdf(buildFastDeliverableData(raw), false);
        toast.success("PDF descargado correctamente.");
      } else if (item.type === CreationType.RECIPE) {
        const { downloadQuickRecipesPdf } = await import("@/features/pdf/quickRecipesPdfExport");
        await downloadQuickRecipesPdf(buildQuickRecipesData(raw), false);
        toast.success("PDF de recetas descargado correctamente.");
      } else if (item.type === CreationType.SCREENING_TEST) {
        const { downloadScreeningTestPdf } = await import("@/features/pdf/screeningTestPdfExport");
        await downloadScreeningTestPdf(raw, false);
        toast.success("PDF del test descargado correctamente.");
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

  const handleShareClick = async (item: Creation) => {
    if (!patientId) {
      toast.error("No se ha identificado un paciente para compartir esta creación.");
      return;
    }

    setIsSharing(item.id);
    try {
      const token = getAuthToken();
      const response = await fetchApi(`/creations/${item.id}/share`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ patientId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Creación compartida con el paciente");
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || "No se pudo compartir la creación");
      }
    } catch (error) {
      console.error("Error sharing creation:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsSharing(null);
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
      const token = getAuthToken();
      const response = await fetchApi(`/creations/${item.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
        return <NotebookText className="w-4 h-4 text-[#7842D4]" />;
      case CreationType.PAUTAS:
        return <NotebookText className="w-4 h-4 text-[#668E20]" />;
      default:
        return <Folder className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeStyles = (type: CreationType) => {
    switch (type) {
      case CreationType.DIET:
        return "bg-blue-50 text-blue-700 border border-blue-200/80";
      case CreationType.SHOPPING_LIST:
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      case CreationType.RECIPE:
        return "bg-amber-50 text-amber-700 border border-amber-200/80";
      case CreationType.FAST_DELIVERABLE:
        return "bg-purple-50 text-[#7842D4] border border-purple-200/80";
      case CreationType.PAUTAS:
        return "bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200/80";
    }
  };

  const handleEdit = (item: Creation) => {
    if (!can("creations.edit.access")) {
      window.dispatchEvent(
        new CustomEvent("show-freemium-upgrade", {
          detail: {
            description:
              "Editar creaciones guardadas es una característica exclusiva de los planes de pago. Mejora tu plan para modificar tus creaciones.",
          },
        })
      );
      return;
    }
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
      case CreationType.PAUTAS:
        router.push(`/dashboard/rapido?creationId=${item.id}`);
        break;
      default:
        console.warn("Edit not implemented for type", item.type);
    }
  };

  const handleDelete = async (id: string) => {
    if (!can("creations.delete.access") && !can("creations.edit.access")) {
      window.dispatchEvent(
        new CustomEvent("show-freemium-upgrade", {
          detail: {
            description:
              "Eliminar creaciones guardadas es una característica exclusiva de los planes de pago. En el plan Freemium tus creaciones quedan conservadas para que puedas volver a descargarlas cuando las necesites.",
          },
        })
      );
      return;
    }
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteCreation(itemToDelete);
      toast.success("Creación eliminada correctamente");
    } catch (error) {
      console.error("Error deleting creation:", error);
      toast.error("Error al eliminar la creación");
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const creationColumns: Column<Creation>[] = [
    {
      header: "Nombre",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl bg-slate-50 border border-[#E9E5E7]",
            item.type === CreationType.DIET && "group-hover:bg-blue-50/60",
            item.type === CreationType.SHOPPING_LIST && "group-hover:bg-emerald-50/60",
            item.type === CreationType.RECIPE && "group-hover:bg-amber-50/60",
            item.type === CreationType.FAST_DELIVERABLE && "group-hover:bg-purple-50/60",
          )}>
            {getTypeIcon(item.type)}
          </div>
          <span className="text-sm font-semibold text-[#20212B] group-hover:text-[#7842D4] transition-colors">
            {item.name}
          </span>
        </div>
      ),
    },
    {
      header: "Paciente",
      render: (item) => (
        (item as any).patientName ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7842D4] text-xs font-semibold border border-purple-200/80">
            <User className="w-3 h-3" />
            {(item as any).patientName}
          </span>
        ) : (
          <span className="text-xs text-[#848792] italic">Sin paciente</span>
        )
      ),
    },
    {
      header: "Etiquetas",
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.tags && item.tags.length > 0 ? (
            item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-[#626573]"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#848792] italic">
              Sin etiquetas
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Tipo",
      render: (item) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            getTypeStyles(item.type),
          )}
        >
          {item.type}
        </span>
      ),
    },
    {
      header: "Fecha",
      render: (item) => (
        <span className="text-xs text-[#626573] font-medium whitespace-nowrap">
          {item.createdAt}
        </span>
      ),
    },
    {
      header: "Acciones",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleInfoClick(item)}
            className="p-1.5 text-[#848792] hover:text-[#7842D4] hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
            title="Más info"
          >
            <Info className="h-4 w-4" />
          </button>
          {item.type !== CreationType.FAST_DELIVERABLE && (
            <button
              onClick={() => handleViewClick(item)}
              className="p-1.5 text-[#848792] hover:text-[#7842D4] hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
              title="Previsualizar"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(item)}
            className="p-1.5 text-[#848792] hover:text-[#7842D4] hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDownloadClick(item)}
            className="p-1.5 text-[#848792] hover:text-[#668E20] hover:bg-[#F0F5DF] rounded-lg transition-all cursor-pointer"
            title="Descargar / Exportar"
          >
            <Download className="h-4 w-4" />
          </button>
          {isInsidePatientDetail && (
            <button
              onClick={() => handleShareClick(item)}
              disabled={isSharing === item.id}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                sharedCreationIdSet.has(item.id)
                  ? "text-[#668E20] bg-[#F0F5DF] animate-pulse hover:bg-[#E4ECC8]"
                  : "text-[#848792] hover:text-[#7842D4] hover:bg-purple-50",
                isSharing === item.id && "cursor-not-allowed"
              )}
              title="Compartir con el paciente"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          {(item.type !== CreationType.SCREENING_TEST || canDeleteScreeningTests) && (
            <>
              <div className="w-px h-3.5 bg-[#E9E5E7] mx-0.5" />
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-[#848792] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const content = (
    <div className="space-y-6">
      {!isInsidePatientDetail && (
        <>
          {/* Barra de Indicadores — Idéntica a Pacientes, Consultas y Alimentos con 3 columnas */}
          <div className="relative overflow-hidden bg-white border border-[#E9E5E7] rounded-[18px] p-5 sm:p-6 min-h-[110px] shadow-2xs">
            <svg
              className="absolute left-0 top-0 h-full w-36 text-[#B0C76F] pointer-events-none select-none opacity-15"
              viewBox="0 0 120 100"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0 0 C 45 15, 65 55, 25 100 L 0 100 Z" />
              <path d="M0 20 C 35 35, 45 75, 10 100 L 0 100 Z" opacity="0.6" />
            </svg>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#F0ECEE] relative z-10">
              {/* 1. Creaciones totales */}
              <div className="flex items-center justify-between sm:px-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#626573]">Total creaciones</p>
                    <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                      {localCreations.length}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-pulse" />
                  <span>Historial</span>
                </span>
              </div>

              {/* 2. Pacientes con pautas */}
              <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7842D4]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#626573]">Pacientes con pautas</p>
                    <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                      {new Set(localCreations.map((c: any) => c.patientName).filter(Boolean)).size}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-[#7842D4] border border-purple-200">
                  En seguimiento
                </span>
              </div>

              {/* 3. Módulo Rápido */}
              <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3ECFC] text-[#7842D4]">
                    <NotebookText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#626573]">Módulo Rápido</p>
                    <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                      {localCreations.filter((c) => c.type === CreationType.FAST_DELIVERABLE || c.type === CreationType.PAUTAS).length}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3ECFC] text-[#7842D4] border border-[#E4D5FA]">
                  100% disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Recomendación de uso */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#F8F9FB] border border-[#E9E5E7] text-[#626573] text-xs font-medium">
            <Info className="w-4 h-4 text-[#7842D4] shrink-0" />
            <span>
              <strong className="text-[#20212B]">Recomendación de uso:</strong> puedes crear plantillas generales en el módulo Rápido para reutilizarlas con tus pacientes.
            </span>
          </div>
        </>
      )}

      {/* Buscador y Filtros — Una única fila horizontal uniforme de 44px */}
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
            <input
              type="search"
              placeholder="Buscar por nombre..."
              className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {!isInsidePatientDetail && (
              <div className="relative w-full sm:w-52">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-[#848792]" />
                </div>
                <input
                  type="search"
                  placeholder="Filtrar por paciente..."
                  className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-8 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
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

            <div className="w-full sm:w-52">
              <Select
                value={selectedType}
                onChange={(val) => setSelectedType(val as any)}
                options={[
                  { value: "Todos", label: "Todos los Tipos" },
                  { value: CreationType.DIET, label: "Dietas" },
                  { value: CreationType.SHOPPING_LIST, label: "Listas de Compra" },
                  { value: CreationType.RECIPE, label: "Recetas" },
                  { value: CreationType.FAST_DELIVERABLE, label: "Rápido" },
                ]}
                triggerClassName="h-11 rounded-xl border-[#E9E5E7] bg-white text-sm font-medium text-[#20212B] shadow-2xs"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchableSelect
                options={[
                  { value: "Todos", label: "Todas las etiquetas" },
                  ...allTags.map((tag) => ({ value: tag, label: tag })),
                ]}
                value={selectedTag}
                onChange={setSelectedTag}
                placeholder="Etiquetas..."
                triggerClassName="h-11 rounded-xl border border-[#E9E5E7] bg-white pl-4 pr-10 font-medium text-sm text-[#20212B] shadow-2xs"
              />
            </div>
          </div>
        </div>

        <div className="px-1 pt-1">
          <p className="text-xs font-semibold text-[#626573]">
            <span className="font-bold text-[#7842D4]">{filteredData.length}</span> creaciones encontradas
          </p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-[#E9E5E7] shadow-2xs overflow-hidden">
        <RecordsTable
          columns={creationColumns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          loadingRows={5}
          loadingColumns={6}
          emptyState={
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
          }
          rowClassName="hover:bg-[#F8F9FB] transition-colors group cursor-pointer"
          footer={
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8EBF0]">
              <p className="text-xs font-semibold text-[#626573]">
                Mostrando{" "}
                <span className="font-bold text-[#20212B]">{paginatedData.length}</span> de{" "}
                <span className="font-bold text-[#20212B]">{filteredData.length}</span>{" "}
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
          }
        />
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <MobileCardLoadingList rows={3} />
        ) : paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <div
              key={item.id}
              onClick={() => handleInfoClick(item)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                      getTypeStyles(item.type),
                    )}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">{item.createdAt}</span>
                      <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset", getTypeStyles(item.type))}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {((item as any).patientName || (item.tags && item.tags.length > 0)) && (
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
                  {(item as any).patientName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      <User className="w-3 h-3" />
                      {(item as any).patientName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin paciente</span>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {item.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleInfoClick(item)}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Más info"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  {item.type !== CreationType.FAST_DELIVERABLE && (
                    <button
                      onClick={() => handleViewClick(item)}
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Previsualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadClick(item)}
                    className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Descargar / Exportar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {isInsidePatientDetail && (
                    <button
                      onClick={() => handleShareClick(item)}
                      disabled={isSharing === item.id}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        sharedCreationIdSet.has(item.id)
                          ? "text-emerald-600 bg-emerald-50 animate-pulse"
                          : "text-slate-400 hover:text-indigo-600 bg-slate-50",
                      )}
                      title="Compartir con paciente"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">No se encontraron creaciones</p>
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs font-bold text-slate-500">
            <span className="text-slate-900">{paginatedData.length}</span> de <span className="text-slate-900">{filteredData.length}</span>
          </p>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
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

  if (!isInsidePatientDetail) {
    return (
      <ModuleLayout
        title="Mis Creaciones"
        description={
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
              <Folder className="w-4 h-4 text-[#86A83C]" />
              <span className="tracking-wider uppercase text-[10px] font-bold">Documentos y Pautas Clínicas</span>
            </div>
            <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
              Consulta, gestiona y vuelve a descargar todas las pautas, dietas y recetas creadas para tus pacientes.
            </p>
          </div>
        }
        rightContent={
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {hasResolvedCreationUsage ? (
              <UsageLimitBadge
                label="Creaciones"
                usage={creationsUsed}
                limit={creationsLimit}
              />
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/dashboard/rapido")}
              className="h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <NotebookText className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Nuevo en Rápido</span>
            </button>
          </div>
        }
        className="pb-16 relative"
      >
        {content}
      </ModuleLayout>
    );
  }

  return content;
}
