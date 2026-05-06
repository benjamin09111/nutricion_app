"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { NutriDocsEditor } from "@/components/ui/NutriDocsEditor";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
const CATEGORIES = [
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

const VARIABLE_SUGGESTIONS = [
  "NOMBRE_PACIENTE",
  "EDAD_PACIENTE",
  "OBJETIVO_PRINCIPAL",
  "FECHA_CONSULTA",
  "NOMBRE_NUTRICIONISTA",
];

type ResourceFormat = "HTML" | "PDF";

interface ResourceEditorProps {
  initialData?: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    sources?: string;
    isPublic?: boolean;
    fileUrl?: string;
    format?: ResourceFormat;
  };
  editingId?: string | null;
}

export function ResourceEditor({ initialData, editingId }: ResourceEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formatChoice, setFormatChoice] = useState<ResourceFormat>(
    initialData?.format || "HTML"
  );

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    category: initialData?.category || "consejos",
    tags: initialData?.tags || [],
    sources: initialData?.sources || "",
    isPublic: initialData?.isPublic || false,
    fileUrl: initialData?.fileUrl || "",
  });

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi(`/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setAvailableTags(
        Array.from(
          new Set(
            data
              .map((x: string | { name?: string }) =>
                typeof x === "string" ? x : x.name
              )
              .filter(Boolean)
          )
        ) as string[]
      );
    } catch { }
  }

  async function uploadPdf(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi(`/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json();
      setFormData((prev) => ({ ...prev, fileUrl: json.url }));
      toast.success("Archivo subido correctamente.");
    } catch {
      toast.error("Error al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function extractPdf() {
    if (!formData.fileUrl) return toast.error("Sube primero un PDF.");
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi(`/resources/extract-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl: formData.fileUrl }),
      });
      const json = await res.json();
      setFormData((prev) => ({ ...prev, content: json.html }));
      setFormatChoice("HTML");
      toast.success("Contenido extraído correctamente.");
    } catch {
      toast.error("No se pudo digitalizar el PDF.");
    }
  }

  async function handleSave() {
    if (!formData.title.trim()) return toast.error("El título es obligatorio.");
    if (formatChoice === "HTML" && !formData.content.trim())
      return toast.error("El contenido es obligatorio.");
    if (formatChoice === "PDF" && !formData.fileUrl.trim())
      return toast.error("La URL o carga del PDF es obligatoria.");

    setIsSaving(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/resources/${editingId}`
        : `/resources`;

      const res = await fetchApi(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, format: formatChoice }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        editingId ? "Recurso actualizado con éxito." : "Recurso creado con éxito."
      );
      router.push("/dashboard/recursos");
    } catch {
      toast.error("No se pudo guardar el recurso.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModuleLayout
      title={editingId ? "Editar Recurso" : "Nuevo Recurso"}
      description={
        editingId
          ? "Actualiza el contenido de tu recurso educativo."
          : "Crea una nueva pieza de contenido para tus pacientes."
      }
    >
      <div className="max-w-6xl mx-auto pb-20">
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 p-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">
                  {editingId ? "Edición de Contenido" : "Detalles del Recurso"}
                </h3>
                <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setFormatChoice("HTML")}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                      formatChoice === "HTML"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Editor HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatChoice("PDF")}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                      formatChoice === "PDF"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Archivo PDF
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Título
                  </label>
                  <Input
                    placeholder="Ej. Guía de Hidratación"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                    className="h-12 rounded-2xl border-slate-200 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Sección / Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, category: e.target.value }))
                    }
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Hashtags (Tags)
                </label>
                <TagInput
                  value={formData.tags}
                  onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                  suggestions={availableTags}
                  placeholder="Ej. deporte, hidratacion..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Fuentes de referencia
                </label>
                <Input
                  placeholder="URL o nombre del autor/estudio..."
                  value={formData.sources}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, sources: e.target.value }))
                  }
                  className="h-12 rounded-2xl border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
              {formatChoice === "HTML" ? (
                <div className="p-1">
                  <NutriDocsEditor
                    value={formData.content}
                    onChange={(value) =>
                      setFormData((p) => ({ ...p, content: value }))
                    }
                  />
                </div>
              ) : (
                <div className="p-12 text-center space-y-6">
                  <div className="mx-auto w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                    <FileText className="h-10 w-10 text-slate-300" />
                  </div>
                  <div className="max-w-md mx-auto space-y-3">
                    <h4 className="text-xl font-black text-slate-900">
                      Carga tu documento PDF
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Sube un archivo (una sola página) para traspasar el contenido a un recurso y poder utilizarlo en tus entregables.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <Input
                      placeholder="URL del archivo PDF..."
                      value={formData.fileUrl}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, fileUrl: e.target.value }))
                      }
                      className="h-12 rounded-2xl text-center"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={uploadPdf}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="rounded-2xl h-12 font-bold"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? "Subiendo..." : "Subir PDF"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-2xl h-12 font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        onClick={extractPdf}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Digitalizar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                    formData.isPublic
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-slate-50 text-slate-400 border border-slate-100"
                  )}
                >
                  <Plus className={cn("h-6 w-6", formData.isPublic && "rotate-45")} />
                </div>
                <div>
                  <p className="font-black text-slate-900">
                    {formData.isPublic ? "Recurso Público" : "Recurso Privado"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formData.isPublic
                      ? "Visible para otros nutricionistas en la Comunidad."
                      : "Solo tú podrás verlo y usarlo en tus planes."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, isPublic: !p.isPublic }))
                  }
                  className={cn(
                    "relative inline-flex h-7 w-14 rounded-full transition-colors ml-4",
                    formData.isPublic ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                      formData.isPublic ? "left-8" : "left-1"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                  variant="ghost"
                  className="rounded-2xl h-12 px-6 font-bold flex-1 md:flex-none"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  className="rounded-2xl h-12 px-8 font-black bg-slate-900 flex-1 md:flex-none shadow-xl hover:shadow-2xl transition-all"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <Sparkles className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Variables Dinámicas
                </p>
              </div>
              <p className="text-xs leading-5 text-slate-500 mb-5">
                Haz click para copiar una variable y luego pégala en tu
                contenido con Ctrl + V. Se reemplazará automáticamente con los
                datos reales de cada paciente.
              </p>
              <div className="grid gap-2">
                {VARIABLE_SUGGESTIONS.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={async () => { try { await navigator.clipboard.writeText(`{${variable}}`); toast.success(`Variable ${variable} copiada`); } catch { toast.error("No se pudo copiar la variable"); } }}
                    className="flex items-center justify-between group rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition-all hover:bg-white hover:border-emerald-200"
                  >
                    <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">
                      {variable}
                    </span>
                    <Copy className="h-3 w-3 text-slate-300 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2.25rem] border border-slate-200 bg-slate-900 p-6 shadow-lg text-white">
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <FileText className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Consejo de NutriNet
                </p>
              </div>
              <p className="text-xs leading-6 text-slate-300 italic">
                &quot;Un recurso bien estructurado ahorra hasta 15 minutos de charla
                repetitiva en cada consulta. Usa fotos o tablas para mejorar la
                comprensión visual.&quot;
              </p>
            </section>
          </aside>
        </div>
      </div>
    </ModuleLayout>
  );
}

