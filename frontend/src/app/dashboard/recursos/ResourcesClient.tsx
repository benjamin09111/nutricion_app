"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Navbar_B, NavbarSection } from "@/components/ui/Navbar_B";
import { Filtros_B } from "@/components/ui/Filtros_B";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";

import sectionCoverImages from "./section-cover-images.json";
import systemResources from "./data/system-resources.json";

type MainTab = "library" | "coverIntro" | "mine";
type LibrarySource = "system" | "community";

const RESOURCE_TABS: NavbarSection[] = [
  { id: "library", label: "Biblioteca", icon: BookOpen },
  { id: "mine", label: "Mis recursos", icon: UserIcon },
  { id: "coverIntro", label: "Portada e introducción", icon: Lock },
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
const LIBRARY_CATEGORIES = CATEGORIES.filter((c) => c.id !== "portada");

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
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("library");
  const [librarySource, setLibrarySource] = useState<LibrarySource>("system");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryTags, setLibraryTags] = useState<string[]>([]);
  const [mineSearch, setMineSearch] = useState("");
  const [mineTags, setMineTags] = useState<string[]>([]);
  const [mineSection, setMineSection] = useState("all");
  const [mineFormat, setMineFormat] = useState("all");
  const [onlyMineCovers, setOnlyMineCovers] = useState(false);
  const [onlyMineIntros, setOnlyMineIntros] = useState(false);
  const [resourceToPreview, setResourceToPreview] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  useEffect(() => {
    fetchResources();
    fetchTags();
  }, []);

  const myResources = useMemo(() => resources.filter((r) => r.isMine), [resources]);
  const systemResources = useMemo(() => resources.filter((r) => r.nutritionistId === null), [resources]);
  const communityResources = useMemo(() => resources.filter((r) => r.nutritionistId !== null && r.isPublic), [resources]);
  const libraryBase = librarySource === "system" ? systemResources : communityResources;

  const filteredLibrary = useMemo(() => {
    const q = norm(librarySearch);
    return libraryBase.filter((r) => {
      const txt = norm(`${r.title} ${plain(r.content)} ${r.tags.join(" ")}`);
      return (!q || txt.includes(q)) && (sectionFilter === "all" || r.category === sectionFilter) && (libraryTags.length === 0 || libraryTags.every((tag) => r.tags.some((x) => norm(x) === norm(tag))));
    });
  }, [libraryBase, librarySearch, sectionFilter, libraryTags]);

  const groupedLibrary = useMemo(() => LIBRARY_CATEGORIES.filter((c) => c.id !== "all").map((category) => ({ category, resources: filteredLibrary.filter((r) => r.category === category.id).slice(0, 12) })).filter((x) => x.resources.length), [filteredLibrary]);
  const filteredMine = useMemo(() => {
    const q = norm(mineSearch);
    return myResources.filter((r) => {
      const txt = norm(`${r.title} ${plain(r.content)} ${r.tags.join(" ")} ${r.sources || ""}`);
      return (!q || txt.includes(q)) && (mineSection === "all" || r.category === mineSection) && (mineFormat === "all" || (r.format || "HTML") === mineFormat) && (mineTags.length === 0 || mineTags.every((tag) => r.tags.some((x) => norm(x) === norm(tag))));
    });
  }, [mineFormat, mineSearch, mineSection, mineTags, myResources]);

  const coverResources = useMemo(() => resources.filter((r) => r.category === "portada" && introType(r) === "cover" && (!onlyMineCovers || r.isMine)), [resources, onlyMineCovers]);
  const introResources = useMemo(() => resources.filter((r) => r.category === "portada" && introType(r) !== "cover" && (!onlyMineIntros || r.isMine)), [resources, onlyMineIntros]);

  async function fetchResources() {
    setIsLoading(true);
    try {
      // System resources come from local JSON (always loaded first)
      const systemOnly = DEFAULT_SYSTEM_RESOURCES;
      
      // User resources come from API
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi("/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.ok ? await res.json() : [];
      
      // Combine: system resources + user resources
      setResources([...systemOnly, ...userData]);
    } catch {
      // On error, only show system resources
      setResources(DEFAULT_SYSTEM_RESOURCES);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTags() {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi("/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  function openCreate(kind: "general" | "cover" | "intro" = "general") {
    if (kind === "general") {
      router.push("/dashboard/recursos/nuevo");
    } else {
      router.push(`/dashboard/recursos/nuevo?type=${kind}`);
    }
  }

  function openEdit(resource: Resource) {
    router.push(`/dashboard/recursos/editar/${resource.id}`);
  }

  async function deleteResource() {
    if (!resourceToDelete) return;
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      await fetchApi(`/resources/${resourceToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Recurso eliminado.");
      setResourceToDelete(null);
      fetchResources();
    } catch {
      toast.error("No se pudo eliminar.");
    }
  }

  const Card = ({ resource }: { resource: Resource }) => {
    const cover = coverCfg(resource.category);
    return (
      <article className="border border-slate-100 bg-slate-50 hover:shadow-md transition-all group flex flex-col h-full overflow-hidden">
        <div className="h-1 w-full" style={{ background: `linear-gradient(135deg, ${cover.gradientFrom}, ${cover.gradientTo})` }} />
        <div className="p-4 flex flex-col h-full bg-white">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-100">
                  {CATEGORIES.find((x) => x.id === resource.category)?.label || "Otro"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                    resource.isMine
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : resource.nutritionistId === null
                      ? "bg-slate-900 text-white"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-100",
                  )}
                >
                  {resource.isMine ? "Mi recurso" : resource.nutritionistId === null ? "Sistema" : "Comunidad"}
                </span>
              </div>
              <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
                {resource.title}
              </h3>
            </div>
            {resource.isMine && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => openEdit(resource)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <p className="text-xs leading-5 text-slate-500 line-clamp-2 flex-grow">
            {short(plain(resource.content || ""), 120)}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {resource.tags.slice(0, 2).map((tag) => {
              const cleanTag = tag.replace(/^#+/, "");
              return (
                <span key={tag} className="inline-flex items-center text-[10px] font-medium text-indigo-500">
                  #{cleanTag}
                </span>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 mt-auto border-t border-slate-50">
            <span className="text-[10px] font-medium text-slate-400">{fmtDate(resource.updatedAt || resource.createdAt)}</span>
            <Button variant="ghost" size="sm" className="h-8 rounded-full px-4 text-xs font-semibold hover:bg-indigo-50 text-indigo-600" onClick={() => setResourceToPreview(resource)}>
              Ver recurso
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <ModuleLayout
      title="Biblioteca"
      description="Gestiona los contenidos educativos para tus pacientes. Por defecto, el Entregable usa recursos de la plataforma, pero aquí puedes explorar la comunidad y crear los tuyos para tu selección automática."
      className="max-w-7xl"
      rightContent={
        <div className="relative group shrink-0">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] shadow-sm cursor-not-allowed transition-all opacity-95"
          >
            <span className="font-extrabold text-sm tracking-tighter leading-none italic font-serif">C</span>
            <span>Conectar con Canva</span>
            <Lock className="w-3.5 h-3.5 ml-0.5 text-white/80" />
          </button>
          <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl animate-in fade-in zoom-in-95">
            Vendrá en futuras actualizaciones
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        <Navbar_B
          sections={RESOURCE_TABS}
          activeTab={mainTab}
          onTabChange={(id) => setMainTab(id as MainTab)}
          activeColor="text-indigo-600"
        />

        {mainTab === "library" && (
          <>
            <Filtros_B
              searchValue={librarySearch}
              onSearchChange={setLibrarySearch}
              searchPlaceholder="Buscar por nombre, contenido o hashtag..."
              leftContent={
                <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLibrarySource("system")}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
                      librarySource === "system" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Sistema
                  </button>
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"
                  >
                    <Lock className="h-3 w-3" />
                    Comunidad
                  </button>
                </div>
              }
              rightContent={
                <>
                  <div className="w-full sm:w-[12rem] lg:w-[14rem]">
                    <TagInput
                      value={libraryTags}
                      onChange={setLibraryTags}
                      suggestions={availableTags}
                      placeholder="Hashtags"
                      className="h-10"
                    />
                  </div>
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {LIBRARY_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </>
              }
            />

              {isLoading ? (
              <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400">Cargando biblioteca...</p>
              </div>
            ) : sectionFilter === "all" && !librarySearch.trim() && libraryTags.length === 0 ? (
              <div className="space-y-10">
                {groupedLibrary.map(({ category, resources }) => (
                  <section key={category.id} className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xl font-semibold text-slate-800">{category.label}</h3>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                        {resources.length} recursos disponibles
                      </span>
                    </div>
                    <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {resources.map((resource) => (
                        <Card key={resource.id} resource={resource} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <section className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLibrary.length ? (
                  filteredLibrary.map((resource) => (
                    <Card key={resource.id} resource={resource} />
                  ))
                ) : (
                  <div className="col-span-full rounded-[2rem] border border-dashed border-slate-200 bg-white py-20 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No encontramos recursos con esos filtros.</p>
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
                    <h3 className="text-xl font-bold text-slate-900">{block.title}</h3>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-indigo-300 transition-all">
                      <input
                        type="checkbox"
                        checked={block.kind === "cover" ? onlyMineCovers : onlyMineIntros}
                        onChange={(e) =>
                          block.kind === "cover"
                            ? setOnlyMineCovers(e.target.checked)
                            : setOnlyMineIntros(e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                      />
                      <span>Ver solo creados por mí</span>
                    </label>
                  </div>
                  {block.kind === "cover" ? (
                    <div className="relative group">
                      <Button
                        disabled
                        className="rounded-xl px-4 h-10 font-semibold cursor-not-allowed opacity-75"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Crear portada
                      </Button>
                      <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl animate-in fade-in zoom-in-95">
                        Vendrá en futuras actualizaciones
                      </div>
                    </div>
                  ) : (
                    <Button className="rounded-xl px-4 h-10 font-semibold" onClick={() => openCreate(block.kind)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear introducción
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {block.list.length ? block.list.map((resource) => (
                    <article
                      key={resource.id}
                      className={cn(
                        "flex h-full flex-col rounded-[2rem] bg-white p-6 transition-all hover:shadow-md",
                        resource.isMine
                          ? "border-2 border-indigo-500 shadow-sm"
                          : "border border-slate-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                resource.isMine
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              )}
                            >
                              {resource.isMine ? "Creado por mí" : "Base plataforma"}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-slate-900">{resource.title}</h4>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500 font-medium">{short(plain(resource.content || ""), 150)}</p>
                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100/50">
                        <Button variant="ghost" className="rounded-full px-0 text-xs font-semibold text-indigo-600 hover:bg-transparent" onClick={() => setResourceToPreview(resource)}>Ver recurso</Button>
                        {resource.isMine && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/50" onClick={() => openEdit(resource)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </article>
                  )) : <div className="col-span-full rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-400">No hay recursos cargados todavía.</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {mainTab === "mine" && (
          <>
            <Filtros_B
              searchValue={mineSearch}
              onSearchChange={setMineSearch}
              searchPlaceholder="Buscar por título, contenido o fuente..."
              rightContent={
                <>
                  <div className="w-full sm:w-48">
                    <TagInput
                      value={mineTags}
                      onChange={setMineTags}
                      suggestions={availableTags}
                      placeholder="Hashtags"
                      className="h-10"
                    />
                  </div>
                  <select
                    value={mineSection}
                    onChange={(e) => setMineSection(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <Button className="rounded-xl px-4 h-10 font-semibold" onClick={() => openCreate("general")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo
                  </Button>
                </>
              }
            />

            <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMine.length > 0 ? filteredMine.map((resource) => (
                  <Card key={resource.id} resource={resource} />
                )) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-full bg-slate-100 p-6 mb-4">
                      <FileText className="h-12 w-12 text-slate-300" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600">No tienes recursos todavía</p>
                    <p className="mt-1 text-sm text-slate-400 max-w-xs">
                      Crea tu primer recurso para comenzar a construir tu biblioteca personal.
                    </p>
                    <Button className="mt-6 rounded-xl px-6 h-11 font-semibold" onClick={() => openCreate("general")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear recurso
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

      </div>

      <Modal isOpen={!!resourceToPreview} onClose={() => setResourceToPreview(null)} title={resourceToPreview?.title || "Vista previa"} className="max-w-4xl"><div className="space-y-6">{resourceToPreview?.tags?.length ? <div className="flex flex-wrap gap-2">{resourceToPreview.tags.map((tag) => <span key={tag} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500"><Hash className="mr-1 h-3 w-3" />{tag}</span>)}</div> : null}{resourceToPreview?.format === "PDF" ? <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-12 text-center"><FileText className="mx-auto mb-4 h-16 w-16 text-slate-200" />{resourceToPreview.fileUrl ? <a href={resourceToPreview.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors">Abrir PDF<ExternalLink className="ml-2 h-4 w-4" /></a> : null}</div> : <div className="prose prose-slate max-w-none text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl" dangerouslySetInnerHTML={{ __html: resourceToPreview?.content || "" }} />}</div></Modal>
      <ConfirmationModal isOpen={!!resourceToDelete} onClose={() => setResourceToDelete(null)} onConfirm={deleteResource} title="Eliminar recurso" description="Esta acción quitará el recurso de tu biblioteca personal. No se puede deshacer." confirmText="Eliminar" variant="destructive" />
    </ModuleLayout>
  );
}
