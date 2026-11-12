"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  BarChart2,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TagInput } from "@/components/ui/TagInput";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { useAdmin } from "@/context/AdminContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
import { useResources } from "@/features/resources";

import sectionCoverImages from "./section-cover-images.json";
import systemResources from "./data/system-resources.json";

type MainTab = "library" | "coverIntro" | "mine" | "restrictions";
type LibrarySource = "system" | "community";

const RESOURCE_TABS = [
  { id: "library", label: "Biblioteca", icon: BookOpen },
  { id: "mine", label: "Mis recursos", icon: UserIcon },
  { id: "coverIntro", label: "Portada e introducción", icon: BookOpen },
  { id: "restrictions", label: "Restricciones alimenticias", icon: ShieldCheck },
];

interface Resource {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sources?: string;
  nutritionistId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isMine?: boolean;
  isPublic?: boolean;
  format?: string;
  fileUrl?: string;
}

const CATEGORIES = [
  { id: "all", label: "Todas las secciones" },
  { id: "portada", label: "Portada e introducción" },
  { id: "restricciones", label: "Restricciones alimenticias" },
  { id: "mitos", label: "Mitos vs realidad" },
  { id: "habitos", label: "Hábitos y rutinas" },
  { id: "salud-mental", label: "Salud mental" },
  { id: "salud-intestinal", label: "Salud intestinal" },
  { id: "deporte", label: "Nutrición deportiva" },
  { id: "maternidad", label: "Maternidad y lactancia" },
  { id: "rendimiento", label: "Rendimiento y foco" },
  { id: "consejos", label: "Consejos prácticos" },
  { id: "faq", label: "Preguntas frecuentes" },
  { id: "otro", label: "Otro" },
];
const LIBRARY_CATEGORIES = CATEGORIES.filter(
  (c) => c.id !== "portada" && c.id !== "restricciones",
);

const DEFAULT_SYSTEM_RESOURCES: Resource[] = systemResources as Resource[];

const unescapeHtml = (str: string) =>
  str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const plain = (html: string) => unescapeHtml(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const short = (text: string, max = 150) => (text.length <= max ? text : `${text.slice(0, max)}...`);
const fmtDate = (v?: string) => v ? new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v)) : "-";
type CoverConfig = { label: string; imageUrl: string; gradientFrom: string; gradientTo: string };
const coverCfg = (id: string) =>
  (sectionCoverImages as Record<string, CoverConfig>)[id] ||
  (sectionCoverImages as Record<string, CoverConfig>).default;
const introType = (r: Resource) => (norm(`${r.title} ${r.tags.join(" ")}`).includes("portada") ? "cover" : "intro");

export function ResourcesClient() {
  useAdmin();
  const { can, isLoading: isSubscriptionLoading } = useSubscription();
  const router = useRouter();
  const resourcesLocked = !isSubscriptionLoading && !can("resources.create.access");
  const canEditResources = can("resources.edit.access");
  const { resources: queryResources, isLoading: isQueryLoading, deleteResource: deleteResourceMutation } = useResources();
  const resources: Resource[] = useMemo(() => {
    return queryResources.length > 0 ? (queryResources as Resource[]) : DEFAULT_SYSTEM_RESOURCES;
  }, [queryResources]);
  const isLoading = isQueryLoading && queryResources.length === 0;

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>("library");
  const [librarySource, setLibrarySource] = useState<LibrarySource>("system");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryTags, setLibraryTags] = useState<string[]>([]);
  const [mineSearch, setMineSearch] = useState("");
  const [mineTags, setMineTags] = useState<string[]>([]);
  const [mineSection, setMineSection] = useState("all");
  const [mineFormat, setMineFormat] = useState("all");
  const [restrictionSearch, setRestrictionSearch] = useState("");
  const [restrictionTags, setRestrictionTags] = useState<string[]>([]);
  const [restrictionSource, setRestrictionSource] = useState<"system" | "mine">("system");
  const [onlyMineCovers, setOnlyMineCovers] = useState(false);
  const [onlyMineIntros, setOnlyMineIntros] = useState(false);
  const [resourceToPreview, setResourceToPreview] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  const resourceTabs = RESOURCE_TABS.map((tab) =>
    tab.id === "mine" && resourcesLocked ? { ...tab, icon: Lock } : tab,
  );

  const showResourcesUpgrade = (description: string) => {
    window.dispatchEvent(
      new CustomEvent("show-freemium-upgrade", { detail: { description } }),
    );
  };

  async function fetchTags() {
    try {
      const res = await fetchApi("/tags");
      const data = res.ok ? await res.json() : [];
      setAvailableTags(
        Array.from(
          new Set(
            data
              .map((x: string | { name?: string }) => (typeof x === "string" ? x : x.name))
              .filter(Boolean),
          ),
        ) as string[],
      );
    } catch { }
  }

  useEffect(() => {
    fetchTags();
  }, []);

  const myResources = useMemo(() => resources.filter((r) => r.isMine), [resources]);
  const systemResources = useMemo(() => resources.filter((r) => r.nutritionistId === null), [resources]);
  const communityResources = useMemo(() => resources.filter((r) => r.nutritionistId !== null && r.isPublic), [resources]);
  const libraryBase = (librarySource === "system" ? systemResources : communityResources).filter(
    (resource) => resource.category !== "restricciones",
  );

  const filteredLibrary = useMemo(() => {
    const q = norm(librarySearch);
    return libraryBase.filter((r) => {
      const txt = norm(`${r.title} ${plain(r.content)} ${r.tags.join(" ")}`);
      return (!q || txt.includes(q)) && (sectionFilter === "all" || r.category === sectionFilter) && (libraryTags.length === 0 || libraryTags.every((tag) => r.tags.some((x) => norm(x) === norm(tag))));
    });
  }, [libraryBase, librarySearch, sectionFilter, libraryTags]);

  const groupedLibrary = useMemo(() => LIBRARY_CATEGORIES.filter((c) => c.id !== "all").map((category) => ({ category, resources: filteredLibrary.filter((r) => r.category === category.id).slice(0, 12) })).filter((x) => x.resources.length), [filteredLibrary]);

  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  const hasInitializedAccordionRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedAccordionRef.current && groupedLibrary.length > 0) {
      setOpenCategoryIds([groupedLibrary[0].category.id]);
      hasInitializedAccordionRef.current = true;
    }
  }, [groupedLibrary]);

  const toggleCategory = (catId: string) => {
    setOpenCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const toggleAllCategories = () => {
    if (openCategoryIds.length === groupedLibrary.length) {
      setOpenCategoryIds([]);
    } else {
      setOpenCategoryIds(groupedLibrary.map((g) => g.category.id));
    }
  };
  const filteredMine = useMemo(() => {
    const q = norm(mineSearch);
    return myResources.filter((r) => {
      const txt = norm(`${r.title} ${plain(r.content)} ${r.tags.join(" ")} ${r.sources || ""}`);
      return (!q || txt.includes(q)) && (mineSection === "all" || r.category === mineSection) && (mineFormat === "all" || (r.format || "HTML") === mineFormat) && (mineTags.length === 0 || mineTags.every((tag) => r.tags.some((x) => norm(x) === norm(tag))));
    });
  }, [mineFormat, mineSearch, mineSection, mineTags, myResources]);

  const filteredRestrictionResources = useMemo(() => {
    const query = norm(restrictionSearch);
    const base = restrictionSource === "system" ? systemResources : myResources;
    return base.filter((resource) => {
      const text = norm(`${resource.title} ${plain(resource.content)} ${resource.tags.join(" ")}`);
      return (
        resource.category === "restricciones" &&
        (!query || text.includes(query)) &&
        (restrictionTags.length === 0 ||
          restrictionTags.every((tag) =>
            resource.tags.some((resourceTag) => norm(resourceTag) === norm(tag)),
          ))
      );
    });
  }, [resources, restrictionSearch, restrictionTags, restrictionSource, systemResources, myResources]);

  const coverResources = useMemo(() => resources.filter((r) => r.category === "portada" && introType(r) === "cover" && (!onlyMineCovers || r.isMine)), [resources, onlyMineCovers]);
  const introResources = useMemo(() => resources.filter((r) => r.category === "portada" && introType(r) !== "cover" && (!onlyMineIntros || r.isMine)), [resources, onlyMineIntros]);




  function openCreate(kind: "general" | "cover" | "intro" | "restriction" = "general") {
    if (resourcesLocked) {
      showResourcesUpgrade("Crear recursos propios está disponible en los planes de pago.");
      return;
    }
    if (kind === "general") {
      router.push("/dashboard/recursos/nuevo");
    } else if (kind === "restriction") {
      router.push("/dashboard/recursos/nuevo?category=restricciones");
    } else {
      router.push(`/dashboard/recursos/nuevo?type=${kind}`);
    }
  }

  function openEdit(resource: Resource) {
    if (!canEditResources) {
      showResourcesUpgrade("Editar recursos propios está disponible en los planes de pago.");
      return;
    }
    router.push(`/dashboard/recursos/editar/${resource.id}`);
  }

  async function deleteResource() {
    if (!resourceToDelete) return;
    try {
      await deleteResourceMutation(resourceToDelete.id);
      toast.success("Recurso eliminado.");
      setResourceToDelete(null);
    } catch {
      toast.error("No se pudo eliminar.");
    }
  }

  const Card = ({ resource }: { resource: Resource }) => {
    const cover = coverCfg(resource.category);
    return (
      <article className="border border-[#E9E5E7] bg-white hover:border-[#7842D4]/40 hover:shadow-md transition-all group flex flex-col h-full overflow-hidden rounded-2xl shadow-2xs">
        <div className="h-1 w-full" style={{ background: `linear-gradient(135deg, ${cover.gradientFrom}, ${cover.gradientTo})` }} />
        <div className="p-4 sm:p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="rounded-full bg-[#F8F9FB] px-2.5 py-0.5 text-[10px] font-semibold text-[#626573] border border-[#E9E5E7]">
                  {CATEGORIES.find((x) => x.id === resource.category)?.label || "Otro"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    resource.isMine
                      ? "bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]"
                      : resource.nutritionistId === null
                      ? "bg-[#F3ECFC] text-[#7842D4] border border-[#E4D5FA]"
                      : "bg-blue-50 text-blue-700 border border-blue-100",
                  )}
                >
                  {resource.isMine ? "Mi recurso" : resource.nutritionistId === null ? "Sistema" : "Comunidad"}
                </span>
              </div>
              <h3 className="line-clamp-1 text-sm sm:text-[15px] font-semibold text-[#20212B] group-hover:text-[#7842D4] transition-colors">
                {resource.title}
              </h3>
            </div>
            {resource.isMine && canEditResources && (
              <button
                type="button"
                className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-[#848792] hover:text-[#7842D4] hover:bg-purple-50 transition-colors cursor-pointer"
                onClick={() => openEdit(resource)}
                title="Editar recurso"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs leading-relaxed text-[#626573] line-clamp-2 flex-grow font-normal">
            {short(plain(resource.content || ""), 120)}
          </p>

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {resource.tags.slice(0, 3).map((tag) => {
                const cleanTag = tag.replace(/^#+/, "");
                return (
                  <span key={tag} className="inline-flex items-center text-[11px] font-medium text-[#7842D4]">
                    #{cleanTag}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto border-t border-[#F0ECEE]">
            <span className="text-[11px] font-medium text-[#848792]">{fmtDate(resource.updatedAt || resource.createdAt)}</span>
            <button
              type="button"
              className="text-xs font-semibold text-[#7842D4] hover:bg-[#F3ECFC] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              onClick={() => setResourceToPreview(resource)}
            >
              Ver recurso
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <ModuleLayout
      title="Biblioteca de Recursos"
      description={
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
            <BookOpen className="w-4 h-4 text-[#86A83C]" />
            <span className="tracking-wider uppercase text-[10px] font-bold">Material Educativo y Entregable</span>
          </div>
          <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
            Gestiona los contenidos educativos para tus pacientes. Explora recursos del sistema, la comunidad y crea tus propios contenidos para entregables.
          </p>
        </div>
      }
      rightContent={
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => openCreate("general")}
            disabled={resourcesLocked}
            className="h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Nuevo Recurso</span>
          </button>
        </div>
      }
      className="pb-16 relative"
    >
      <div className="space-y-6">
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
            {/* 1. Biblioteca base */}
            <div className="flex items-center justify-between sm:px-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Biblioteca base</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {systemResources.length}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-pulse" />
                <span>Oficiales</span>
              </span>
            </div>

            {/* 2. Mis recursos */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7842D4]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Mis recursos</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {myResources.length}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-[#7842D4] border border-purple-200">
                Personalizados
              </span>
            </div>

            {/* 3. Total disponibles */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3ECFC] text-[#7842D4]">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Total disponibles</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {resources.length}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3ECFC] text-[#7842D4] border border-[#E4D5FA]">
                100% disponibles
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación — Minimalistas y unificadas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {resourceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === "mine" && resourcesLocked) {
                  showResourcesUpgrade("La gestión de recursos propios está disponible en los planes de pago.");
                  return;
                }
                setMainTab(tab.id as MainTab);
              }}
              className={cn(
                "h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0",
                mainTab === tab.id
                  ? "bg-[#7842D4] text-white shadow-2xs"
                  : "bg-white text-[#626573] border border-[#E9E5E7] hover:bg-slate-50"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === "mine" && resourcesLocked && (
                <Lock className="h-3 w-3 text-amber-500" />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-[#E9E5E7] bg-white shadow-2xs">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#7842D4]" />
            <p className="text-sm font-medium text-[#626573]">Cargando recursos...</p>
          </div>
        ) : (
          <>
            {mainTab === "library" && (
              <>
                {/* Filtros Biblioteca */}
                <div className="space-y-2">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                    <div className="inline-flex items-center rounded-xl bg-[#F0ECEE] p-1 shrink-0 h-11">
                      <button
                        type="button"
                        onClick={() => setLibrarySource("system")}
                        className={cn(
                          "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer h-9 flex items-center",
                          librarySource === "system"
                            ? "bg-white text-[#7842D4] shadow-2xs font-bold"
                            : "text-[#626573] hover:text-[#20212B]"
                        )}
                      >
                        Sistema
                      </button>
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-lg px-3 py-1.5 text-xs font-medium text-[#848792] flex items-center gap-1.5 h-9"
                      >
                        <Lock className="h-3 w-3" />
                        Comunidad
                      </button>
                    </div>

                    <div className="relative flex-1 min-w-0">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
                      <input
                        type="search"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="Buscar por nombre, contenido o hashtag..."
                        className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      <div className="w-full sm:w-48">
                        <TagInput
                          value={libraryTags}
                          onChange={setLibraryTags}
                          suggestions={availableTags}
                          placeholder="Hashtags"
                          className="h-11"
                        />
                      </div>
                      <div className="w-full sm:w-56">
                        <Select
                          value={sectionFilter}
                          onChange={setSectionFilter}
                          options={LIBRARY_CATEGORIES.map((c) => ({
                            value: c.id,
                            label: c.label,
                          }))}
                          triggerClassName="h-11 rounded-xl border-[#E9E5E7] bg-white text-sm font-medium text-[#20212B] shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {sectionFilter === "all" && !librarySearch.trim() && libraryTags.length === 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-end pb-1">
                      <button
                        type="button"
                        onClick={toggleAllCategories}
                        className="text-xs font-semibold text-[#7842D4] hover:text-[#6936C8] transition-colors cursor-pointer"
                      >
                        {openCategoryIds.length === groupedLibrary.length
                          ? "Contraer todas las secciones"
                          : "Expandir todas las secciones"}
                      </button>
                    </div>
                    {groupedLibrary.map(({ category, resources }) => {
                      const isOpen = openCategoryIds.includes(category.id);
                      const cover = coverCfg(category.id);

                      return (
                        <div
                          key={category.id}
                          className="rounded-2xl border border-[#E9E5E7] bg-white shadow-2xs overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-[#F8F9FB] transition-colors cursor-pointer select-none group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="h-6 w-1.5 rounded-full shrink-0"
                                style={{
                                  background: `linear-gradient(135deg, ${cover.gradientFrom}, ${cover.gradientTo})`,
                                }}
                              />
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-[#20212B] group-hover:text-[#7842D4] transition-colors">
                                  {category.label}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="rounded-full bg-[#F0ECEE] px-2.5 py-0.5 text-xs font-semibold text-[#626573]">
                                {resources.length} {resources.length === 1 ? "recurso" : "recursos"}
                              </span>
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#848792] group-hover:bg-purple-50 group-hover:text-[#7842D4] transition-colors">
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform duration-300",
                                    isOpen && "rotate-180",
                                  )}
                                />
                              </div>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-[#F0ECEE] p-4 sm:p-5 bg-[#F8F9FB]/40 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {resources.map((resource) => (
                                  <Card key={resource.id} resource={resource} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredLibrary.length ? (
                      filteredLibrary.map((resource) => (
                        <Card key={resource.id} resource={resource} />
                      ))
                    ) : (
                      <div className="col-span-full rounded-2xl border border-dashed border-[#E9E5E7] bg-white py-20 text-center shadow-2xs">
                        <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-[#626573] font-medium text-sm">No encontramos recursos con esos filtros.</p>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {mainTab === "coverIntro" && (
              <div className="space-y-8">
                {[{ title: "Portadas", list: coverResources, kind: "cover" as const }, { title: "Introducciones", list: introResources, kind: "intro" as const }].map((block) => (
                  <div key={block.title}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-[#20212B]">{block.title}</h3>
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-xl bg-white border border-[#E9E5E7] px-3 py-1.5 text-xs font-semibold text-[#626573] shadow-2xs hover:border-[#7842D4]/40 transition-all">
                          <input
                            type="checkbox"
                            checked={block.kind === "cover" ? onlyMineCovers : onlyMineIntros}
                            onChange={(e) =>
                              block.kind === "cover"
                                ? setOnlyMineCovers(e.target.checked)
                                : setOnlyMineIntros(e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#7842D4] focus:ring-[#7842D4] accent-[#7842D4] cursor-pointer"
                          />
                          <span>Ver solo creados por mí</span>
                        </label>
                      </div>
                      {block.kind === "cover" ? (
                        <div className="relative group">
                          <button
                            type="button"
                            disabled
                            className="h-10 px-4 rounded-xl border border-[#E9E5E7] bg-slate-50 text-slate-400 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Crear portada</span>
                          </button>
                          <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl animate-in fade-in zoom-in-95">
                            Vendrá en futuras actualizaciones
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="h-10 px-4 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          onClick={() => openCreate(block.kind)}
                          disabled={resourcesLocked}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Crear introducción</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {block.list.length ? block.list.map((resource) => (
                        <article
                          key={resource.id}
                          className={cn(
                            "flex h-full flex-col rounded-2xl bg-white p-5 transition-all hover:shadow-md shadow-2xs",
                            resource.isMine
                              ? "border-2 border-[#7842D4]"
                              : "border border-[#E9E5E7]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                                    resource.isMine
                                      ? "bg-[#F3ECFC] text-[#7842D4] border border-[#E4D5FA]"
                                      : "bg-[#F8F9FB] text-[#626573] border border-[#E9E5E7]"
                                  )}
                                >
                                  {resource.isMine ? "Creado por mí" : "Base plataforma"}
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-semibold text-[#20212B]">{resource.title}</h4>
                            </div>
                          </div>
                          <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#626573] font-normal">{short(plain(resource.content || ""), 150)}</p>
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#F0ECEE]">
                            <button
                              type="button"
                              className="text-xs font-semibold text-[#7842D4] hover:bg-[#F3ECFC] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                              onClick={() => setResourceToPreview(resource)}
                            >
                              Ver recurso
                            </button>
                            {resource.isMine && canEditResources && (
                              <button
                                type="button"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-[#848792] hover:text-[#7842D4] hover:bg-purple-50 transition-colors cursor-pointer"
                                onClick={() => openEdit(resource)}
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </article>
                      )) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-[#E9E5E7] bg-white p-10 text-center text-sm font-medium text-[#626573] shadow-2xs">
                          No hay recursos cargados todavía.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mainTab === "restrictions" && (
              <>
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                  <div className="inline-flex items-center rounded-xl bg-[#F0ECEE] p-1 shrink-0 h-11">
                    <button
                      type="button"
                      onClick={() => setRestrictionSource("system")}
                      className={cn(
                        "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer h-9 flex items-center",
                        restrictionSource === "system"
                          ? "bg-white text-[#7842D4] shadow-2xs font-bold"
                          : "text-[#626573] hover:text-[#20212B]"
                      )}
                    >
                      Sistema
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (resourcesLocked) {
                          showResourcesUpgrade("La gestión de recursos propios está disponible en los planes de pago.");
                          return;
                        }
                        setRestrictionSource("mine");
                      }}
                      disabled={resourcesLocked}
                      className={cn(
                        "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer h-9 flex items-center",
                        restrictionSource === "mine"
                          ? "bg-white text-[#7842D4] shadow-2xs font-bold"
                          : "text-[#626573] hover:text-[#20212B]"
                      )}
                    >
                      Mis recursos
                    </button>
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
                    <input
                      type="search"
                      value={restrictionSearch}
                      onChange={(e) => setRestrictionSearch(e.target.value)}
                      placeholder="Buscar por nombre, contenido o hashtag..."
                      className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <div className="w-full sm:w-48">
                      <TagInput
                        value={restrictionTags}
                        onChange={setRestrictionTags}
                        suggestions={availableTags}
                        placeholder="Hashtags"
                        className="h-11"
                      />
                    </div>
                    {restrictionSource === "mine" && (
                      <button
                        type="button"
                        className="h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs cursor-pointer"
                        onClick={() => openCreate("restriction")}
                        disabled={resourcesLocked}
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>Nuevo recurso</span>
                      </button>
                    )}
                  </div>
                </div>

                {filteredRestrictionResources.length > 0 ? (
                  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRestrictionResources.map((resource) => (
                      <Card key={resource.id} resource={resource} />
                    ))}
                  </section>
                ) : (
                  <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E5E7] bg-white px-6 text-center shadow-2xs">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F5DF] text-[#668E20]">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-[#20212B]">No hay recursos para estos filtros</p>
                    <p className="mt-1 max-w-sm text-sm text-[#626573]">
                      {restrictionSource === "system"
                        ? "No hay recursos de sistema para esta búsqueda."
                        : "Crea un recurso para una restricción alimenticia o ajusta la búsqueda."}
                    </p>
                    {restrictionSource === "mine" && (
                      <button
                        type="button"
                        className="mt-5 h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs cursor-pointer"
                        onClick={() => openCreate("restriction")}
                        disabled={resourcesLocked}
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>Crear recurso</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {mainTab === "mine" && (
              <>
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
                    <input
                      type="search"
                      value={mineSearch}
                      onChange={(e) => setMineSearch(e.target.value)}
                      placeholder="Buscar por título, contenido o fuente..."
                      className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <div className="w-full sm:w-48">
                      <TagInput
                        value={mineTags}
                        onChange={setMineTags}
                        suggestions={availableTags}
                        placeholder="Hashtags"
                        className="h-11"
                      />
                    </div>
                    <div className="w-full sm:w-56">
                      <Select
                        value={mineSection}
                        onChange={setMineSection}
                        options={CATEGORIES.map((c) => ({
                          value: c.id,
                          label: c.label,
                        }))}
                        triggerClassName="h-11 rounded-xl border-[#E9E5E7] bg-white text-sm font-medium text-[#20212B] shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      className="h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs cursor-pointer"
                      onClick={() => openCreate("general")}
                      disabled={resourcesLocked}
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span>Nuevo</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMine.length > 0 ? (
                    filteredMine.map((resource) => (
                      <Card key={resource.id} resource={resource} />
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-[#E9E5E7] bg-white shadow-2xs">
                      <div className="rounded-2xl bg-purple-50 p-5 mb-4 text-[#7842D4]">
                        <FileText className="h-10 w-10" />
                      </div>
                      <p className="text-base font-semibold text-[#20212B]">No tienes recursos todavía</p>
                      <p className="mt-1 text-sm text-[#626573] max-w-xs">
                        Crea tu primer recurso para comenzar a construir tu biblioteca personal.
                      </p>
                      <button
                        type="button"
                        className="mt-5 h-11 px-6 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                        onClick={() => openCreate("general")}
                        disabled={resourcesLocked}
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>Crear recurso</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal isOpen={!!resourceToPreview} onClose={() => setResourceToPreview(null)} title={resourceToPreview?.title || "Vista previa"} className="max-w-4xl"><div className="space-y-6">{resourceToPreview?.tags?.length ? <div className="flex flex-wrap gap-2">{resourceToPreview.tags.map((tag) => <span key={tag} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500"><Hash className="mr-1 h-3 w-3" />{tag}</span>)}</div> : null}{resourceToPreview?.format === "PDF" ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center"><FileText className="mx-auto mb-4 h-16 w-16 text-slate-200" />{resourceToPreview.fileUrl ? <a href={resourceToPreview.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors">Abrir PDF<ExternalLink className="ml-2 h-4 w-4" /></a> : null}</div> : <div className="prose prose-slate max-w-none text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl" dangerouslySetInnerHTML={{ __html: resourceToPreview?.content || "" }} />}</div></Modal>
      <ConfirmationModal isOpen={!!resourceToDelete} onClose={() => setResourceToDelete(null)} onConfirm={deleteResource} title="Eliminar recurso" description="Esta acción quitará el recurso de tu biblioteca personal. No se puede deshacer." confirmText="Eliminar" variant="destructive" />
    </ModuleLayout>
  );
}
