"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText, Plus, Search, Filter, Pencil, Trash2, CheckCircle2,
  Sparkles, Brain, Activity, Lightbulb, HelpCircle, X, Save,
  Layout, ExternalLink, ChevronDown, MoreVertical, Upload, Globe,
  User as UserIcon, Loader2, Image as ImageIcon, Bold, Italic, Palette, Copy, Hash, Braces
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { useAdmin } from "@/context/AdminContext";
import { TagInput } from "@/components/ui/TagInput";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import Cookies from "js-cookie";
import { DEFAULT_CONSTRAINTS as LIB_CONSTRAINTS } from "@/lib/constants";

import { Modal } from "@/components/ui/Modal";
import { NutriDocsEditor } from "@/components/ui/NutriDocsEditor";

const CONSTRAINT_IDS = LIB_CONSTRAINTS.map(c => c.id);

interface Resource {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sources?: string;
  isDefault?: boolean;
  nutritionistId?: string | null;
  createdAt?: string;
  isMine?: boolean;
  isPublic?: boolean;
  variablePlaceholders?: string[];
  format?: string;
  fileUrl?: string;
}

const CATEGORIES = [
  { id: "all", label: "Todos", icon: Layout },
  { id: "portada", label: "Portada e Introducción", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "mitos", label: "Mitos vs Realidad", icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "habitos", label: "Hábitos y Rutinas", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "salud-mental", label: "Salud Mental", icon: Brain, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "salud-intestinal", label: "Salud Intestinal", icon: Activity, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "deporte", label: "Nutrición Deportiva", icon: Activity, color: "text-violet-500", bg: "bg-violet-50" },
  { id: "maternidad", label: "Maternidad y Lactancia", icon: Sparkles, color: "text-pink-500", bg: "bg-pink-50" },
  { id: "rendimiento", label: "Rendimiento y Foco", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50" },
  { id: "consejos", label: "Consejos Prácticos", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "otro", label: "Otro", icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
];

const VARIABLE_SUGGESTIONS = [
  "NOMBRE_PACIENTE",
  "EDAD_PACIENTE",
  "OBJETIVO_PRINCIPAL",
  "FECHA_CONSULTA",
  "NOMBRE_NUTRICIONISTA",
];

export function ResourcesClient() {
  const { isAdmin } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [categories, setCategories] = useState<any[]>(CATEGORIES);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isSavingSection, setIsSavingSection] = useState(false);

  const [activeTab, setActiveTab] = useState<"library" | "create" | "cover">("library");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  const [resourceToView, setResourceToView] = useState<Resource | null>(null);

  const [resolvedContent, setResolvedContent] = useState<string>("");
  const [variableInputs, setVariableInputs] = useState<Record<string, string>>({});

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formatChoice, setFormatChoice] = useState<"HTML" | "PDF">("HTML");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "consejos",
    tags: [] as string[],
    sources: "",
    isGlobal: false,
    isPublic: true,
    format: "HTML",
    fileUrl: "",
  });

  const DEFAULT_SYSTEM_RESOURCES: Resource[] = [
    {
      id: "sys-0",
      title: "Portada e Introducción Base NutriSaaS",
      content: "<h1>Bienvenida/o {NOMBRE_PACIENTE}</h1><p>Este plan fue preparado para acompañarte de forma práctica y cercana durante las próximas semanas.</p><p><strong>Objetivo principal:</strong> {OBJETIVO_PRINCIPAL}</p><p><strong>Fecha de inicio:</strong> {FECHA_CONSULTA}</p>",
      category: "portada",
      tags: ["Portada", "Introducción", "Plantilla"],
      isDefault: true,
      nutritionistId: null,
      isMine: false,
      isPublic: true
    }
  ];

  const fetchResources = async (retries = 3) => {
    if (retries === 3) setIsLoading(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/resources`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setResources(data.length === 0 ? DEFAULT_SYSTEM_RESOURCES : data);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    }

    if (retries > 0) {
      setTimeout(() => fetchResources(retries - 1), 1000);
    } else {
      setResources(DEFAULT_SYSTEM_RESOURCES);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchTags();
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/resources/sections`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const sectionsData = await response.json();
        const mappedSections = sectionsData.map((s: any) => ({
          id: s.slug,
          label: s.name,
          icon: Layout,
          color: s.color || "text-indigo-500",
          bg: s.bg || "bg-indigo-50"
        }));

        const defaultSlugs = CATEGORIES.map(c => c.id);
        const customSections = mappedSections.filter((s: any) => !defaultSlugs.includes(s.id));
        setCategories([...CATEGORIES, ...customSections]);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    setIsSavingSection(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/resources/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSectionName, isGlobal: isAdmin }),
      });

      if (response.ok) {
        const newSection = await response.json();
        toast.success("Sección creada");
        setFormData({ ...formData, category: newSection.slug });
        setNewSectionName("");
        setIsSectionModalOpen(false);
        fetchSections();
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSavingSection(false);
    }
  };

  const fetchTags = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/tags`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const tagsData = await response.json();
        const backendTags = tagsData.map((t: any) => t.name);
        setAvailableTags(Array.from(new Set([...CONSTRAINT_IDS, ...backendTags])));
      } else {
        setAvailableTags(CONSTRAINT_IDS);
      }
    } catch (error) {
      setAvailableTags(CONSTRAINT_IDS);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || res.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchQuery, activeCategory]);

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setFormatChoice((resource.format as "HTML" | "PDF") || "HTML");
    setFormData({
      title: resource.title,
      category: resource.category,
      tags: resource.tags || [],
      sources: resource.sources || "",
      isGlobal: resource.nutritionistId === null,
      isPublic: resource.isPublic || false,
      content: resource.content || "",
      format: resource.format || "HTML",
      fileUrl: resource.fileUrl || "",
    });

    setActiveTab("create");
  };

  const resetForm = () => {
    setEditingId(null);
    setFormatChoice("HTML");
    setFormData({
      title: "",
      category: "consejos",
      tags: [],
      sources: "",
      isGlobal: false,
      isPublic: true,
      content: "",
      format: "HTML",
      fileUrl: "",
    });
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Por favor completa el título");
      return;
    }
    
    if (formatChoice === "HTML" && !formData.content.trim()) {
      toast.error("El contenido del editor no puede estar vacío");
      return;
    }

    if (formData.tags.length === 0) {
      toast.error("Debes añadir al menos una etiqueta/restricción");
      return;
    }

    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `${apiUrl}/resources/${editingId}` : `${apiUrl}/resources`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? "Recurso actualizado" : "Recurso creado exitosamente");
        fetchResources();
        resetForm();
        setActiveTab("library");
      }
    } catch (error) {
      toast.error(`Error de red: ${error}`);
    }
  };

  const insertVariable = (variableKey: string) => {
    const token = `{${variableKey}}`;
    setFormData((prev) => ({
      ...prev,
      content: `${prev.content || ""} ${token}`.trim(),
    }));
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/resources/${resourceToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Recurso eliminado");
        fetchResources();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setIsDeleteConfirmOpen(false);
      setResourceToDelete(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const response = await fetch(`${apiUrl}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, fileUrl: data.url }));
        toast.success("Recurso subido");
      }
    } catch (error) {
      toast.error("Error al subir");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMagicExtract = async () => {
    if (!formData.fileUrl) {
      toast.error("Sube primero un PDF");
      return;
    }

    toast.promise(
      async () => {
        const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const response = await fetch(`${apiUrl}/resources/extract-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileUrl: formData.fileUrl }),
        });

        if (!response.ok) throw new Error("Error en extracción");

        const data = await response.json();
        setFormData(prev => ({ ...prev, format: "HTML", content: data.html }));
        setFormatChoice("HTML");
        return data;
      },
      {
        loading: 'Digitalizando con IA...',
        success: '¡Contenido extraído!',
        error: 'No se pudo digitalizar.',
      }
    );
  };

  const [viewFilter, setViewFilter] = useState<"system" | "mine" | "cover">("system");

  const filteredLibraryResources = useMemo(() => {
    let list = filteredResources;
    if (viewFilter === "system") {
      list = list.filter((r: Resource) => !r.isMine || r.isPublic);
    } else if (viewFilter === "mine") {
      list = list.filter((r: Resource) => r.isMine);
    } else {
      list = list.filter((r: Resource) => r.category === "portada");
    }

    return list.sort((a: Resource, b: Resource) => {
      const aIsGlobal = a.nutritionistId === null;
      const bIsGlobal = b.nutritionistId === null;
      if (aIsGlobal && !bIsGlobal) return -1;
      if (!aIsGlobal && bIsGlobal) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [filteredResources, viewFilter]);

  return (
    <ModuleLayout
      title="Biblioteca de Recursos"
      description="Gestiona los contenidos educativos para tus pacientes."
      rightNavItems={activeTab === "create" ? [
        {
          id: "close",
          icon: Layout,
          label: "Cerrar Editor",
          variant: "slate",
          onClick: () => setActiveTab("library"),
        }
      ] : [
        {
          id: "import-pdf",
          icon: FileText,
          label: "Importar PDF",
          variant: "slate",
          onClick: () => {
            resetForm();
            setFormatChoice("PDF");
            setFormData(prev => ({ ...prev, format: "PDF" }));
            setActiveTab("create");
          },
        },
        {
          id: "add",
          icon: Plus,
          label: "Crear Nuevo",
          variant: "emerald",
          onClick: () => {
            resetForm();
            setFormatChoice("HTML");
            setFormData(prev => ({ ...prev, format: "HTML" }));
            setActiveTab("create");
          },
        },
      ]}
    >
      <Modal
        isOpen={!!resourceToView}
        onClose={() => {
          setResourceToView(null);
          setResolvedContent("");
          setVariableInputs({});
        }}
        title={resourceToView ? resourceToView.title : ""}
      >
        <div className="p-8 pb-12">
          {resourceToView?.tags && resourceToView.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {resourceToView.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 flex items-center px-2 py-1 rounded-md">
                  <Hash className="w-3 h-3 mr-1 text-slate-400" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            className={cn(
               "prose prose-slate max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg text-slate-900 leading-relaxed custom-formatting tiptap",
               resourceToView?.format === "PDF" && "flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300"
            )}
            dangerouslySetInnerHTML={resourceToView?.format === "PDF" ? undefined : { __html: resolvedContent || resourceToView?.content || "" }}
          >
            {resourceToView?.format === "PDF" && (
              <>
                 <FileText className="w-16 h-16 text-slate-300 mb-4" />
                 <p className="text-slate-500 mb-4 text-center">Este recurso es un archivo PDF importado externamente.</p>
                 <a href={resourceToView.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm">
                   Ver Documento PDF <ExternalLink className="w-4 h-4" />
                 </a>
              </>
            )}
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            .custom-formatting h1 { font-weight: 900; color: #0f172a; margin-bottom: 1rem; }
            .custom-formatting h2 { font-weight: 800; color: #1e293b; margin-top: 2.5rem; margin-bottom: 1rem; }
            .custom-formatting p { margin-bottom: 1.25rem; }
            .custom-formatting ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
            .custom-formatting li { margin-bottom: 0.25rem; }
            .custom-formatting ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
            .custom-formatting img { max-width: 100%; border-radius: 0.75rem; }
            .tiptap table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0; overflow: hidden; }
            .tiptap table td, .tiptap table th { min-width: 1em; border: 2px solid #ced4da; padding: 3px 5px; vertical-align: top; box-sizing: border-box; position: relative; }
          `}} />
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar recurso?"
        description="¿Estás seguro de que deseas eliminar este recurso?"
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      {activeTab !== "create" && (
        <div className="mt-6 flex border-b border-slate-200 mb-6 px-4">
          <button
            onClick={() => setActiveTab("library")}
            className={cn(
              "px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 -mb-px",
              activeTab === "library" ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-t-xl"
            )}
          >
            <Layout className="h-4 w-4" />
            Mi Biblioteca
          </button>
        </div>
      )}

      <div className="space-y-6 pb-20">
        {activeTab === "library" && (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Buscar recursos..."
                  className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setViewFilter("system")}
                  className={cn("px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all", viewFilter === "system" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Sistema
                </button>
                <button
                  onClick={() => setViewFilter("mine")}
                  className={cn("px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all", viewFilter === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Propios
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide py-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all border shadow-sm",
                    activeCategory === cat.id
                      ? "bg-slate-900 text-white border-slate-900 scale-105"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <cat.icon className={cn("h-3.5 w-3.5", activeCategory === cat.id ? "text-emerald-400" : cat.color)} />
                  {cat.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLibraryResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col h-full"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                      {resource.isMine && (
                         <Button  variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/90 shadow-sm" onClick={() => handleEdit(resource)}>
                           <Pencil className="h-3.5 w-3.5" />
                         </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={cn("p-2 rounded-xl", categories.find(c => c.id === resource.category)?.bg || "bg-slate-50")}>
                        {(() => {
                           const Icon = categories.find(c => c.id === resource.category)?.icon || FileText;
                           return <Icon className={cn("h-4 w-4", categories.find(c => c.id === resource.category)?.color || "text-slate-500")} />;
                        })()}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{categories.find(c => c.id === resource.category)?.label || "Otro"}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mb-3 leading-tight group-hover:text-emerald-600 transition-colors">{resource.title}</h3>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                      <Button variant="ghost" className="text-[10px] font-black uppercase text-emerald-600 p-0 h-auto gap-1" onClick={() => setResourceToView(resource)}>Ver <ExternalLink className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div key="create-resource-tab" className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1 pb-4">
              <h2 className="text-2xl font-black text-slate-900">{editingId ? "Editar Recurso" : "Crear Recurso"}</h2>
              <p className="text-slate-500 text-sm">Personaliza el contenido educativo para tus pacientes.</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-xs mb-8">
              <button type="button" onClick={() => { setFormatChoice("HTML"); setFormData(prev => ({ ...prev, format: "HTML" })); }} className={cn("flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all shadow-sm", formatChoice === "HTML" ? "bg-white text-slate-900" : "text-slate-500")}>Editor</button>
              <button type="button" onClick={() => { setFormatChoice("PDF"); setFormData(prev => ({ ...prev, format: "PDF", content: "" })); }} className={cn("flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all shadow-sm", formatChoice === "PDF" ? "bg-white text-slate-900" : "text-slate-500")}>PDF</button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título</label>
                <Input placeholder="Título del recurso..." value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categoría</label>
                <select className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {categories.filter(c => c.id !== "all").map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-1">Asociar Restricción</label>
                <TagInput value={formData.tags.filter(t => CONSTRAINT_IDS.includes(t))} onChange={(newC) => setFormData({ ...formData, tags: [...formData.tags.filter(t => !CONSTRAINT_IDS.includes(t)), ...newC] })} suggestions={CONSTRAINT_IDS} hideTags={true} className="w-full" />
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8 items-start">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                  {formatChoice === "HTML" ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Contenido</label>
                      <NutriDocsEditor value={formData.content} onChange={(val) => setFormData({ ...formData, content: val })} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                      <FileText className="w-16 h-16 text-slate-300" />
                      <Input placeholder="Pega la URL del PDF..." value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} className="max-w-md text-center" />
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl gap-2">
                        <Upload className="w-4 h-4" /> {isUploading ? "Subiendo..." : "Subir Archivo"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Visibilidad Pública</h4>
                    <p className="text-[10px] text-slate-500">Compartir con la comunidad NutriSaaS.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.isPublic} onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })} />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="ghost" onClick={() => setActiveTab("library")} className="rounded-xl">Cancelar</Button>
                  <Button onClick={handleSave} className="bg-slate-900 text-white rounded-2xl px-12 gap-2 shadow-xl hover:scale-105 transition-all">
                    <Save className="h-5 w-5" /> Guardar Recurso
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <button type="button" onClick={handleMagicExtract} className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl shadow-lg" title="IA Digitalizar">
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-6 pr-10">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Braces className="w-4 h-4" /></div>
                      <h4 className="font-black text-slate-900">Guía</h4>
                    </div>
                    <div className="space-y-6">
                      <p className="text-[11px] text-slate-600">Escribe entre llaves <span className="font-bold text-emerald-600">{"{...}"}</span> para crear variables dinámicas.</p>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sugerencias:</p>
                        <div className="flex flex-col gap-2">
                          {VARIABLE_SUGGESTIONS.map(v => (
                            <button key={v} type="button" onClick={() => insertVariable(v)} className="text-[11px] font-bold text-left px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100 transition-all flex items-center justify-between group">
                              <span>{v}</span>
                              <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Nueva Sección"
      >
        <div className="p-6 space-y-4">
          <Input placeholder="Nombre de la categoría..." value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsSectionModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSection} disabled={!newSectionName.trim() || isSavingSection} className="bg-emerald-600 text-white">
              Guardar Categoría
            </Button>
          </div>
        </div>
      </Modal>
    </ModuleLayout>
  );
}
