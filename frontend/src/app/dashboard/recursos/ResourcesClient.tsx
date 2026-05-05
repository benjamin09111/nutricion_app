"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Filter,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Star,
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
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";

import sectionCoverImages from "./section-cover-images.json";

type MainTab = "library" | "coverIntro" | "mine";
type LibrarySource = "system" | "community";

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

const FAVORITES_KEY = "resource-favorites-v1";
const CATEGORIES = [
  { id: "all", label: "Todas las secciones" },
  { id: "portada", label: "Portada e introduccion" },
  { id: "mitos", label: "Mitos vs realidad" },
  { id: "habitos", label: "Habitos y rutinas" },
  { id: "salud-mental", label: "Salud mental" },
  { id: "salud-intestinal", label: "Salud intestinal" },
  { id: "deporte", label: "Nutricion deportiva" },
  { id: "maternidad", label: "Maternidad y lactancia" },
  { id: "rendimiento", label: "Rendimiento y foco" },
  { id: "consejos", label: "Consejos practicos" },
  { id: "faq", label: "Preguntas frecuentes" },
  { id: "otro", label: "Otro" },
];
const LIBRARY_CATEGORIES = CATEGORIES.filter((c) => c.id !== "portada");

const DEFAULT_SYSTEM_RESOURCES: Resource[] = [
  {
    id: "sys-cover-intro",
    title: "Portada e introduccion base de la plataforma",
    content:
      "<h1>Bienvenida/o {NOMBRE_PACIENTE}</h1><p>Este entregable fue preparado para acompanarte de forma practica y cercana.</p><p><strong>Objetivo principal:</strong> {OBJETIVO_PRINCIPAL}</p>",
    category: "portada",
    tags: ["Portada", "Introduccion", "Plantilla"],
    nutritionistId: null,
    isMine: false,
    isPublic: true,
    format: "HTML",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("library");
  const [librarySource, setLibrarySource] = useState<LibrarySource>("system");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryTags, setLibraryTags] = useState<string[]>([]);
  const [mineSearch, setMineSearch] = useState("");
  const [mineTags, setMineTags] = useState<string[]>([]);
  const [mineSection, setMineSection] = useState("all");
  const [mineVisibility, setMineVisibility] = useState("all");
  const [mineFormat, setMineFormat] = useState("all");
  const [mineOnlyFavorites, setMineOnlyFavorites] = useState(false);
  const [resourceToPreview, setResourceToPreview] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")); } catch { }
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
      return (!q || txt.includes(q)) && (mineSection === "all" || r.category === mineSection) && (mineVisibility === "all" || (mineVisibility === "public" ? r.isPublic : !r.isPublic)) && (mineFormat === "all" || (r.format || "HTML") === mineFormat) && (!mineOnlyFavorites || favorites.includes(r.id)) && (mineTags.length === 0 || mineTags.every((tag) => r.tags.some((x) => norm(x) === norm(tag))));
    });
  }, [favorites, mineFormat, mineOnlyFavorites, mineSearch, mineSection, mineTags, mineVisibility, myResources]);

  const coverResources = useMemo(() => resources.filter((r) => r.category === "portada" && introType(r) === "cover"), [resources]);
  const introResources = useMemo(() => resources.filter((r) => r.category === "portada" && introType(r) !== "cover"), [resources]);

  async function fetchResources() {
    setIsLoading(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi("/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setResources(data.length ? data : DEFAULT_SYSTEM_RESOURCES);
    } catch {
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

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
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
      <article className="p-4 rounded-[2rem] border border-slate-100 bg-white hover:shadow-md transition-all group flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-100">
                {CATEGORIES.find((x) => x.id === resource.category)?.label || "Otro"}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                  resource.nutritionistId === null
                    ? "bg-slate-900 text-white"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-100",
                )}
              >
                {resource.nutritionistId === null ? "Sistema" : "Comunidad"}
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

        <div
          className="relative w-full h-32 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 mb-3"
          style={{
            backgroundImage: cover.imageUrl
              ? `linear-gradient(135deg, rgba(15,23,42,.1), rgba(15,23,42,.05)), url(${cover.imageUrl})`
              : `linear-gradient(135deg, ${cover.gradientFrom}, ${cover.gradientTo})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <p className="text-xs leading-5 text-slate-500 line-clamp-2 flex-grow">
          {short(plain(resource.content || ""), 120)}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {resource.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="inline-flex items-center text-[10px] font-medium text-indigo-500">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 mt-auto border-t border-slate-50">
          <span className="text-[10px] font-medium text-slate-400">{fmtDate(resource.updatedAt || resource.createdAt)}</span>
          <Button variant="ghost" size="sm" className="h-8 rounded-full px-4 text-xs font-semibold hover:bg-indigo-50 text-indigo-600" onClick={() => setResourceToPreview(resource)}>
            Ver recurso
          </Button>
        </div>
      </article>
    );
  };

  return (
    <ModuleLayout title="Biblioteca" description="Gestiona los contenidos educativos para tus pacientes. Por defecto, el Entregable usa recursos de la plataforma, pero aqui puedes explorar la comunidad, crear los tuyos y marcar favoritos para tu seleccion automatica." className="max-w-7xl">
      <div className="space-y-6 pb-20">
        <section className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-2 shadow-sm w-fit">
          <div className="flex items-center gap-1">
            {[
              { id: "library", label: "Biblioteca", icon: BookOpen },
              { id: "mine", label: "Mis recursos", icon: UserIcon },
              { id: "coverIntro", label: "Portada e introducción", icon: Lock }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMainTab(tab.id as MainTab)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all",
                  mainTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {mainTab === "library" && (
          <>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
                    Biblioteca general
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Recursos de plataforma y comunidad
                  </h2>
                </div>
                <div className="inline-flex items-center rounded-2xl bg-slate-50 p-1 border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLibrarySource("system")}
                    className={cn(
                      "rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wider",
                      librarySource === "system" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Sistema
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibrarySource("community")}
                    className={cn(
                      "rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wider",
                      librarySource === "community" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Comunidad
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr] items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    <Search className="h-3.5 w-3.5" />
                    Búsqueda
                  </div>
                  <div className="relative flex items-center group">
                    <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                    <Input
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Buscar por nombre, contenido o hashtag..."
                      className="pl-10 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:border-indigo-500 h-11 transition-all w-full font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    <Hash className="h-3.5 w-3.5" />
                    Hashtags
                  </div>
                  <TagInput
                    value={libraryTags}
                    onChange={setLibraryTags}
                    suggestions={availableTags}
                    placeholder="Filtrar hashtags..."
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    <Filter className="h-3.5 w-3.5" />
                    Sección
                  </div>
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 text-sm font-semibold text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {LIBRARY_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

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
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">Inicio del entregable</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Portadas e introducciones reutilizables</h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Puedes mantener la base de la plataforma, crear una portada propia o guardar introducciones alternativas para reutilizarlas y marcarlas como favoritas.
              </p>
            </section>
            {[{ title: "Portadas", list: coverResources, kind: "cover" as const }, { title: "Introducciones", list: introResources, kind: "intro" as const }].map((block) => (
              <section key={block.title} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {block.kind === "cover" ? "Crea una portada propia para reemplazar la de la plataforma." : "Guarda mensajes de bienvenida y contexto inicial."}
                    </p>
                  </div>
                  <Button className="rounded-full px-6 font-semibold" onClick={() => openCreate(block.kind)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {block.kind === "cover" ? "Crear portada" : "Crear introduccion"}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {block.list.length ? block.list.map((resource) => (
                    <article key={resource.id} className="flex h-full flex-col rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {resource.nutritionistId === null ? "Base plataforma" : "Personalizado"}
                          </p>
                          <h4 className="mt-2 text-base font-semibold text-slate-900">{resource.title}</h4>
                        </div>
                        <button type="button" onClick={() => toggleFavorite(resource.id)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors", favorites.includes(resource.id) ? "border-amber-200 bg-amber-50 text-amber-600" : "border-slate-100 bg-white text-slate-400 hover:text-indigo-600")}><Star className={cn("h-4 w-4", favorites.includes(resource.id) && "fill-current")} /></button>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500 font-medium">{short(plain(resource.content || ""), 150)}</p>
                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100/50">
                        <Button variant="ghost" className="rounded-full px-0 text-xs font-semibold text-indigo-600 hover:bg-transparent" onClick={() => setResourceToPreview(resource)}>Ver recurso</Button>
                        {resource.isMine && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600" onClick={() => openEdit(resource)}><Pencil className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </article>
                  )) : <div className="rounded-[2rem] border border-dashed border-slate-100 bg-slate-50/50 p-10 text-center text-sm font-medium text-slate-400">No hay recursos cargados todavia.</div>}
                </div>
              </section>
            ))}
          </div>
        )}

        {mainTab === "mine" && (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
                    Gestion personal
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Mis recursos</h2>
                </div>
                <Button className="rounded-full px-6 font-semibold" onClick={() => openCreate("general")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo recurso
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                <div className="relative flex items-center group">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                  <Input
                    value={mineSearch}
                    onChange={(e) => setMineSearch(e.target.value)}
                    placeholder="Buscar por titulo, contenido o fuente..."
                    className="pl-10 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:border-indigo-500 h-11 transition-all w-full font-medium text-sm"
                  />
                </div>

                <div className="w-[300px]">
                  <TagInput
                    value={mineTags}
                    onChange={setMineTags}
                    suggestions={availableTags}
                    placeholder="Filtrar hashtags..."
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <select
                  value={mineSection}
                  onChange={(e) => setMineSection(e.target.value)}
                  className="h-10 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <select
                  value={mineVisibility}
                  onChange={(e) => setMineVisibility(e.target.value)}
                  className="h-10 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="all">Publicos y privados</option>
                  <option value="public">Solo publicos</option>
                  <option value="private">Solo privados</option>
                </select>

                <select
                  value={mineFormat}
                  onChange={(e) => setMineFormat(e.target.value)}
                  className="h-10 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="all">Todos los formatos</option>
                  <option value="HTML">Editor HTML</option>
                  <option value="PDF">PDF</option>
                </select>

                <button
                  type="button"
                  onClick={() => setMineOnlyFavorites((p) => !p)}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-all",
                    mineOnlyFavorites
                      ? "border-amber-200 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                  )}
                >
                  <Star className={cn("h-3.5 w-3.5", mineOnlyFavorites && "fill-current")} />
                  Solo favoritos
                </button>
              </div>
            </section>

            <div className="hidden overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm md:block">
              <table className="min-w-full divide-y divide-slate-50">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">Recurso</th>
                    <th className="px-6 py-4">Seccion</th>
                    <th className="px-6 py-4">Hashtags</th>
                    <th className="px-6 py-4">Visibilidad</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMine.length ? (
                    filteredMine.map((resource) => (
                      <tr key={resource.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-700">{resource.title}</p>
                          <p className="mt-1 max-w-md text-xs font-medium leading-relaxed text-slate-400 line-clamp-1">
                            {short(plain(resource.content || ""), 80)}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {CATEGORIES.find((c) => c.id === resource.category)?.label || "Otro"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {resource.tags.length ? (
                              resource.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={`${resource.id}-${tag}`}
                                  className="text-[10px] font-semibold text-indigo-400"
                                >
                                  #{tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-300">Sin hashtags</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider",
                              resource.isPublic ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-slate-50 text-slate-500 border border-slate-100"
                            )}
                          >
                            {resource.isPublic ? "Publico" : "Privado"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => toggleFavorite(resource.id)}
                            >
                              <Star
                                className={cn(
                                  "h-3.5 w-3.5",
                                  favorites.includes(resource.id) ? "fill-current text-amber-500" : "text-slate-300"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => openEdit(resource)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => setResourceToPreview(resource)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => setResourceToDelete(resource)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <p className="text-sm font-medium text-slate-400">No tienes recursos propios que coincidan con esos filtros.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!resourceToPreview} onClose={() => setResourceToPreview(null)} title={resourceToPreview?.title || "Vista previa"} className="max-w-4xl"><div className="space-y-6">{resourceToPreview?.tags?.length ? <div className="flex flex-wrap gap-2">{resourceToPreview.tags.map((tag) => <span key={tag} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500"><Hash className="mr-1 h-3 w-3" />{tag}</span>)}</div> : null}{resourceToPreview?.format === "PDF" ? <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-12 text-center"><FileText className="mx-auto mb-4 h-16 w-16 text-slate-200" />{resourceToPreview.fileUrl ? <a href={resourceToPreview.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors">Abrir PDF<ExternalLink className="ml-2 h-4 w-4" /></a> : null}</div> : <div className="prose prose-slate max-w-none text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl" dangerouslySetInnerHTML={{ __html: resourceToPreview?.content || "" }} />}</div></Modal>
      <ConfirmationModal isOpen={!!resourceToDelete} onClose={() => setResourceToDelete(null)} onConfirm={deleteResource} title="Eliminar recurso" description="Esta accion quitara el recurso de tu biblioteca personal. No se puede deshacer." confirmText="Eliminar" variant="destructive" />
    </ModuleLayout>
  );
}
