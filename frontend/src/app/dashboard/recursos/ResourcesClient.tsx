"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText, Plus, Search, Filter, Pencil, Trash2, CheckCircle2,
  Sparkles, Brain, Activity, Lightbulb, HelpCircle, X, Save,
  Layout, ExternalLink, ChevronDown, MoreVertical, Upload, Globe,
  User as UserIcon, Loader2, Image as ImageIcon, Bold, Italic, Palette, Copy, Hash
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
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";

import { Modal } from "@/components/ui/Modal";
const CONSTRAINT_IDS = DEFAULT_CONSTRAINTS.map(c => c.id);

const RichEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, activeTab]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatDoc = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
    handleInput();
  };

  return (
    <div className="border border-slate-200 rounded-4xl overflow-hidden shadow-xl shadow-slate-200/50 bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all border-slate-100 flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">
        <div className="flex p-1 bg-slate-200/50 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "write" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "preview" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Vista Previa
          </button>
        </div>

        {activeTab === "write" && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => formatDoc('bold')} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all cursor-pointer group" title="Negrita"><Bold className="w-4 h-4 group-hover:scale-110 transition-transform" /></button>
            <button type="button" onClick={() => formatDoc('italic')} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all cursor-pointer group" title="Cursiva"><Italic className="w-4 h-4 group-hover:scale-110 transition-transform" /></button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button type="button" onClick={() => formatDoc('insertUnorderedList')} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all cursor-pointer group" title="Lista"><Layout className="w-4 h-4 group-hover:scale-110 transition-transform" /></button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <div className="flex items-center">
              <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase tracking-widest">Color</span>
              <div className="flex gap-1.5">
                {["#0f172a", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"].map(c => (
                  <button key={c} type="button" onClick={() => formatDoc('foreColor', c)} className="w-[14px] h-[14px] rounded-full shadow-sm hover:scale-125 transition-transform border border-slate-200 cursor-pointer" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "write" ? (
        <div
          ref={editorRef}
          contentEditable
          data-text={placeholder || "Escribe el contenido del recurso aquí..."}
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full min-h-[400px] p-8 outline-none text-slate-700 text-[15px] leading-relaxed bg-transparent font-medium empty:before:content-[attr(data-text)] empty:before:text-slate-400 empty:before:italic"
        />
      ) : (
        <div
          className="w-full min-h-[400px] p-8 text-slate-700 text-[15px] leading-relaxed overflow-y-auto bg-slate-50/30 prose prose-slate max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">Nada que previsualizar aún...</p>' }}
        />
      )}

      <div className="px-6 py-2 border-t border-slate-50 bg-slate-50/30">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Editor Visual
        </p>
      </div>
    </div>
  );
};

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
}

const CATEGORIES = [
  { id: "all", label: "Todos", icon: Layout },
  { id: "mitos", label: "Mitos vs Realidad", icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "habitos", label: "Checklist de Hábitos", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "emocional", label: "Nutrición Emocional", icon: Brain, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "consejos", label: "Consejos Prácticos", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "ejercicios", label: "Actividad Física", icon: Activity, color: "text-violet-500", bg: "bg-violet-50" },
];

interface ResourceBlock {
  id: string;
  text: string;
  bold: boolean;
  italic: boolean;
  color: string;
}

const DEFAULT_COLORS = ["#0f172a", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

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

  // Tabs: 'library' | 'create'
  const [activeTab, setActiveTab] = useState<"library" | "create">("library");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  const [resourceToView, setResourceToView] = useState<Resource | null>(null);

  const DEFAULT_CONSTRAINTS = ["Diabético", "Hipertensión", "Vegetariano", "Celiaco", "Sin Gluten"];

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "consejos",
    tags: [] as string[],
    sources: "",
    isGlobal: false,
    isPublic: false,
  });

  // Repositorio mixto antiguo-nuevo
  const [rawContent, setRawContent] = useState("");

  const DEFAULT_SYSTEM_RESOURCES: Resource[] = [
    {
      id: "sys-1",
      title: "La verdad sobre el ayuno intermitente",
      content: "El ayuno intermitente no es una dieta, sino un patrón alimentario. Sus beneficios incluyen mejor sensibilidad a la insulina y reducción de la inflamación. Sin embargo, no es mágico ni apto para todos (ej. embarazadas, personas con TCA). Lo más importante sigue siendo la calidad de los alimentos en la ventana de ingesta.",
      category: "mitos",
      tags: ["Ayuno Intermitente", "Mitos"],
      isDefault: true,
      nutritionistId: null,
      isMine: false,
      isPublic: true
    },
    {
      id: "sys-2",
      title: "Checklist: Preparación para la semana (Meal Prep)",
      content: "1. Define 2-3 fuentes de proteína (ej. pollo, huevos, tofu).\n2. Cocina una olla grande de carbohidratos complejos (ej. arroz integral, quinoa).\n3. Lava y pica vegetales para tener listos en el refrigerador.\n4. Organiza envases de vidrio herméticos.\n\nTener comida lista reduce la ansiedad y evita que pidas comida rápida.",
      category: "habitos",
      tags: ["Meal Prep", "Organización", "Hábitos"],
      isDefault: true,
      nutritionistId: null,
      isMine: false,
      isPublic: true
    },
    {
      id: "sys-3",
      title: "Cómo identificar el hambre real vs. hambre emocional",
      content: "**Hambre Fisiológica:**\n- Aparece gradualmente.\n- Sientes un vacío en el estómago o ruidos.\n- Cualquier comida, incluso una manzana, te parece una buena opción.\n- Al comer te sientes satisfecho y puedes detenerte.\n\n**Hambre Emocional:**\n- Aparece de repente y se siente como una urgencia.\n- Deseas un alimento específico (normalmente dulce, salado crujiente o alto en grasas).\n- Sientes que el hambre está en la mente, no en el estómago.\n- A menudo lleva a comer en exceso y luego sentir culpa.",
      category: "emocional",
      tags: ["Hambre Emocional", "Mindful Eating", "Ansiedad"],
      isDefault: true,
      nutritionistId: null,
      isMine: false,
      isPublic: true
    },
    {
      id: "sys-4",
      title: "Guía de iniciación al entrenamiento de fuerza",
      content: "El entrenamiento de fuerza es no negociable para una salud metabólica óptima a largo plazo.\n\n*Consejos para iniciar:*\n- Prioriza ejercicios multiarticulares (sentadillas, peso muerto, flexiones, remos).\n- Aprende bien la técnica antes de subir el peso.\n- Descansa 1-2 días entre sesiones del mismo grupo muscular.\n- Enfócate en la constancia, 2 a 3 días a la semana es un excelente comienzo.",
      category: "ejercicios",
      tags: ["Entrenamiento", "Fuerza", "Músculo", "Principiantes"],
      isDefault: true,
      nutritionistId: null,
      isMine: false,
      isPublic: true
    },
    {
      id: "sys-5",
      title: "Estrategias prácticas para consumir más vegetales",
      content: "- **En el desayuno:** Agrega espinacas o champiñones a tus huevos revueltos.\n- **Salsas:** Licúa verduras (zanahoria, calabacín, cebolla) en la salsa de tomate de tus pastas.\n- **Snacks:** Palitos de zanahoria, apio o pepino con hummus.\n- **Sopas o cremas:** Excelente manera de incluir variedad de vegetales en invierno.",
      category: "consejos",
      tags: ["Vegetales", "NutriciónPráctica", "Ideas"],
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
        if (data.length === 0) {
          setResources(DEFAULT_SYSTEM_RESOURCES);
        } else {
          setResources(data);
        }
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    }

    if (retries > 0) {
      setTimeout(() => fetchResources(retries - 1), 1000);
    } else {
      setResources(DEFAULT_SYSTEM_RESOURCES); // Fallback to defaults on complete failure to test UI
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
          icon: Layout, // We can map dynamically if needed, fallback to Layout
          color: s.color || "text-indigo-500",
          bg: s.bg || "bg-indigo-50"
        }));

        // Merge with defaults, ensuring we don't repeat slugs
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
      } else {
        toast.error("Error al crear la sección");
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
        setAvailableTags(Array.from(new Set([...DEFAULT_CONSTRAINTS, ...backendTags])));
      } else {
        setAvailableTags(DEFAULT_CONSTRAINTS);
      }
    } catch (error) {
      setAvailableTags(DEFAULT_CONSTRAINTS);
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
    setFormData({
      title: resource.title,
      category: resource.category,
      tags: resource.tags || [],
      sources: resource.sources || "",
      isGlobal: resource.nutritionistId === null,
      isPublic: resource.isPublic || false,
      content: resource.content || "",
    });

    setActiveTab("create");
  };

  const handleClone = (resource: Resource) => {
    setEditingId(null);
    setFormData({
      title: `[Copia] ${resource.title}`,
      category: resource.category,
      tags: resource.tags || [],
      sources: resource.sources || "",
      isGlobal: false,
      isPublic: false,
      content: resource.content || "",
    });

    setActiveTab("create");
    toast.info("Recurso copiado. Puedes editarlo y guardarlo en tus Creaciones.");
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      category: "consejos",
      tags: [],
      sources: "",
      isGlobal: isAdmin,
      isPublic: false,
      content: "",
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content.trim()) {
      toast.error("Por favor completa el título y el texto del recurso");
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
      } else {
        const errText = await response.text();
        toast.error(`Error al guardar: ${errText}`);
      }
    } catch (error) {
      toast.error(`Error de red al guardar: ${error}`);
    }
  };

  const confirmDelete = (id: string) => {
    setResourceToDelete(id);
    setIsDeleteConfirmOpen(true);
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
      toast.error("Error al eliminar el recurso");
    } finally {
      setIsDeleteConfirmOpen(false);
      setResourceToDelete(null);
    }
  };

  // Extra state for switch
  const [viewFilter, setViewFilter] = useState<"system" | "mine">("system");

  const filteredLibraryResources = useMemo(() => {
    let list = filteredResources;
    if (viewFilter === "system") {
      list = list.filter((r: Resource) => !r.isMine || r.isPublic);
    } else {
      list = list.filter((r: Resource) => r.isMine);
    }

    // Sort logic: Global (system) resources first, then by date descending
    return list.sort((a: Resource, b: Resource) => {
      const aIsGlobal = a.nutritionistId === null;
      const bIsGlobal = b.nutritionistId === null;

      if (aIsGlobal && !bIsGlobal) return -1;
      if (!aIsGlobal && bIsGlobal) return 1;

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Descending
    });
  }, [filteredResources, viewFilter]);

  return (
    <ModuleLayout
      title="Biblioteca de Recursos"
      description="Gestiona los contenidos educativos para tus pacientes."
      rightNavItems={[
        {
          id: "add",
          icon: activeTab === "library" ? Plus : Layout,
          label: activeTab === "library" ? "Crear Nuevo" : "Ver Biblioteca",
          variant: activeTab === "library" ? "emerald" : "slate",
          onClick: () => {
            if (activeTab === "library") {
              resetForm();
              setActiveTab("create");
            } else {
              setActiveTab("library");
            }
          },
        },
      ]}
    >
      <Modal
        isOpen={!!resourceToView}
        onClose={() => setResourceToView(null)}
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
            className="prose prose-slate max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg text-slate-700 leading-relaxed custom-formatting"
            dangerouslySetInnerHTML={{ __html: resourceToView?.content || "" }}
          />

          <style dangerouslySetInnerHTML={{
            __html: `
            .custom-formatting font { font-size: inherit; }
            .custom-formatting h1, .custom-formatting h2, .custom-formatting h3 { font-weight: 900; color: #0f172a; margin-bottom: 1rem; margin-top: 2rem; }
            .custom-formatting ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
            .custom-formatting li { margin-bottom: 0.25rem; }
            .custom-formatting ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
          `}} />
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar recurso?"
        description="¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer y retirará el contenido de la biblioteca."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

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
        <button
          onClick={() => {
            if (activeTab !== "create") {
              resetForm();
              setActiveTab("create");
            }
          }}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 -mb-px",
            activeTab === "create" ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-t-xl"
          )}
        >
          <Plus className="h-4 w-4" />
          Crear Nuevo
        </button>
      </div>

      <div className="space-y-6 pb-20">
        {activeTab === "library" && (
          <>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Buscar recursos..."
                  className="h-12 pl-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center mr-4">
                  <button
                    onClick={() => setViewFilter("system")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      viewFilter === "system" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Sistema y Comunidad
                  </button>
                  <button
                    onClick={() => setViewFilter("mine")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      viewFilter === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Mis Recursos
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-48 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />)}
              </div>
            ) : filteredLibraryResources.length > 0 ? (
              <div className="space-y-8">
                {categories.filter(c => c.id !== "all").map(catInfo => {
                  const items = filteredLibraryResources.filter(r => r.category === catInfo.id).slice(0, 5);
                  if (items.length === 0) return null;

                  return (
                    <div key={catInfo.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-xl", catInfo.bg)}>
                          <catInfo.icon className={cn("h-4 w-4", catInfo.color)} />
                        </div>
                        <h3 className="font-black text-slate-900 tracking-tight text-lg">{catInfo.label}</h3>
                      </div>

                      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
                        {items.map((resource) => {
                          const isGlobal = resource.nutritionistId === null;
                          const isMine = resource.isMine;
                          const isCommunity = !isGlobal && !isMine && resource.isPublic;

                          return (
                            <div key={resource.id} className="group min-w-[300px] w-[300px] sm:min-w-[350px] sm:w-[350px] relative bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full snap-start shrink-0">
                              <div className="p-6 flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    {isGlobal && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded"><Globe className="h-2 w-2" /> Global</span>}
                                    {isCommunity && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-fuchsia-500 bg-fuchsia-50 px-1.5 py-0.5 rounded"><Globe className="h-2 w-2" /> Comunidad</span>}
                                    {isMine && resource.isPublic && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded"><CheckCircle2 className="h-2 w-2" /> Público</span>}
                                  </div>
                                  <div className="flex gap-1">
                                    {isMine ? (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(resource)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer" title="Editar"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={() => confirmDelete(resource.id)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleClone(resource)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" title="Añadir a Mis Creaciones"><Copy className="h-4 w-4" /></button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h3 className="font-black text-slate-900 leading-tight">{resource.title}</h3>
                                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{resource.content.replace(/[#*`]|<br\s*\/?>/g, " ").replace(/<[^>]*>?/gm, '')}</p>
                                </div>
                                <div className="pt-4 flex flex-wrap gap-2">
                                  {resource.tags?.slice(0, 3).map((tag) => <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">#{tag}</span>)}
                                  {resource.tags?.length > 3 && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">+{resource.tags.length - 3}</span>}
                                </div>
                              </div>
                              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between mt-auto">
                                <button onClick={() => setResourceToView(resource)} className="cursor-pointer text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline">Ver Recurso Completo <ExternalLink className="h-3 w-3" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center"><FileText className="h-10 w-10 text-slate-300" /></div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900">
                    {viewFilter === "system" ? "No hay recursos del sistema" : "No has creado recursos aún"}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-xs">Intenta cambiar de filtro o añade un recurso nuevo al sistema.</p>
                </div>
                {(viewFilter === "system" || searchQuery !== "") && (
                  <Button variant="outline" className="rounded-2xl font-bold border-slate-200" onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}>Limpiar filtros de búsqueda</Button>
                )}
                {viewFilter === "mine" && (
                  <Button className="rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { resetForm(); setActiveTab("create"); }}><Plus className="h-4 w-4 mr-2" />Crear mi primer recurso</Button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "create" && (
          <div className="max-w-4xl mx-auto space-y-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">{editingId ? "Editar Recurso" : "Crear Nuevo Recurso"}</h2>
              <p className="text-slate-500 text-sm">Diseña contenido educativo y asócialo a restricciones para que se agregue automáticamente al Entregable de tus pacientes.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Recurso</label>
                <Input
                  placeholder="Ej: La verdad sobre el ayuno intermitente"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl border-slate-200 h-12 text-slate-900 bg-slate-50/50 focus:bg-white transition-colors text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temática / Categoría</label>
                  <button type="button" onClick={() => setIsSectionModalOpen(true)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1"><Plus className="w-3 h-3" /> Nueva Sección</button>
                </div>
                <div className="relative">
                  <select
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pb-2 border-b border-slate-100">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiqueta de Búsqueda (Global)</label>
                  <p className="text-[10px] text-slate-400 font-medium">Ayuda a encontrar el recurso internamente.</p>
                </div>
                <TagInput
                  value={formData.tags.filter(t => !CONSTRAINT_IDS.includes(t))}
                  onChange={(newTags) => {
                    const constraints = formData.tags.filter(t => CONSTRAINT_IDS.includes(t));
                    setFormData({ ...formData, tags: [...constraints, ...newTags] });
                  }}
                  fetchSuggestionsUrl={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/tags`}
                  hideTags={true}
                  placeholder="Buscar o crear etiqueta..."
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    Asociar a Restricción Específica
                    <Sparkles className="h-3 w-3" />
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">Si enlazas una restricción, se adjuntará al PDF entregable.</p>
                </div>
                <TagInput
                  value={formData.tags.filter(t => CONSTRAINT_IDS.includes(t))}
                  onChange={(newConstraints) => {
                    const generalTags = formData.tags.filter(t => !CONSTRAINT_IDS.includes(t));
                    setFormData({ ...formData, tags: [...generalTags, ...newConstraints] });
                  }}
                  suggestions={CONSTRAINT_IDS}
                  hideTags={true}
                  placeholder="Buscar o crear restricción..."
                  className="w-full"
                />
              </div>

              {formData.tags?.length > 0 && (
                <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                  {formData.tags.map((tag, index) => {
                    const isConstraint = CONSTRAINT_IDS.includes(tag);
                    return (
                      <span key={index} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 border shadow-sm animate-in zoom-in duration-200", isConstraint ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100")}>
                        {tag}
                        <X className={cn("h-3 w-3 cursor-pointer transition-colors", isConstraint ? "hover:text-amber-900" : "hover:text-emerald-900")} onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) })} />
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuentes / Bibliografía (Opcional)</label>
              <Input
                placeholder="Añade referencias o enlaces para respaldar el recurso..."
                value={formData.sources}
                onChange={(e) => setFormData({ ...formData, sources: e.target.value })}
                className="rounded-xl border-slate-200 h-11 text-slate-900 bg-slate-50/50 focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Contenido Educativo</label>
              <RichEditor
                value={formData.content}
                onChange={(val) => setFormData({ ...formData, content: val })}
              />
            </div>

            <div className="flex items-center gap-3 py-4 border-t border-slate-100">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">Compartir con la comunidad</h4>
                <p className="text-xs text-slate-500">Haz que este recurso aparezca en la bilbioteca global. Podrá ser visto y copiado por otros nutricionistas de NutriSaaS.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input type="checkbox" className="sr-only peer" checked={formData.isPublic} onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
              <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:bg-slate-100" onClick={() => setActiveTab("library")}>
                Cancelar
              </Button>
              <Button className="bg-slate-900 text-white rounded-xl font-black px-8 py-6 gap-2 shadow-lg shadow-slate-900/10 hover:scale-[1.02] transition-transform" onClick={handleSave}>
                <Save className="h-5 w-5" />
                {editingId ? "Actualizar Recurso" : "Guardar Recurso"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Nueva Sección de Recursos"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Crea una nueva categoría para organizar tus recursos. Esta sección estará disponible para elegir en tus próximos recursos.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Sección</label>
            <Input
              placeholder="Ej: Protocolo de Suplementación"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsSectionModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreateSection} disabled={!newSectionName.trim() || isSavingSection} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {isSavingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Sección
            </Button>
          </div>
        </div>
      </Modal>
    </ModuleLayout>
  );
}
