"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  FileText,
  Loader2,
  Lock,
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

const VARIABLE_SUGGESTIONS = [
  "NOMBRE_PACIENTE",
  "EDAD_PACIENTE",
  "OBJETIVO_PRINCIPAL",
  "NOMBRE_NUTRICIONISTA",
];

type ResourceFormat = "HTML" | "PDF";

interface ResourceEditorProps {
  initialData?: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    fileUrl?: string;
    format?: ResourceFormat;
  };
  editingId?: string | null;
}

export function ResourceEditor({ initialData, editingId }: ResourceEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIntro = !editingId && searchParams.get("type") === "intro";

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formatChoice, setFormatChoice] = useState<ResourceFormat>(
    initialData?.format || "HTML"
  );

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    category: initialData?.category || (isIntro ? "portada" : "consejos"),
    tags: initialData?.tags?.length ? initialData.tags : (isIntro ? ["Introducción"] : []),
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
    if (!formData.category) return toast.error("La categoría es obligatoria.");
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
      title={editingId ? "Editar Recurso" : isIntro ? "Nueva Introducción" : "Nuevo Recurso"}
      description={
        editingId
          ? "Actualiza el contenido de tu recurso educativo."
          : isIntro
          ? "Crea un texto de introducción reutilizable para tus entregables nutricionales."
          : "Crea una nueva pieza de contenido para tus pacientes. Todos los recursos son privados y solo tú podrás verlos."
      }
      rightContent={
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFormatChoice("HTML")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              formatChoice === "HTML"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Editor visual
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-400 flex items-center gap-1.5"
          >
            <Lock className="h-3 w-3" />
            Archivo PDF
          </button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto pb-20">
        <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
          <div className="space-y-6">

            {isIntro && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 border border-indigo-100">
                <span>Creando una introducción reutilizable. Se preseleccionó la categoría "Portada e introducción".</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Título <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder={isIntro ? "Ej. Introducción a tu plan personalizado" : "Ej. Guía de Hidratación"}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Sección / Categoría <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Hashtags (Tags)
                </label>
                <TagInput
                  value={formData.tags}
                  onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                  suggestions={availableTags}
                  placeholder="Ej. deporte, hidratacion..."
                />
              </div>
            </div>

            {formatChoice === "HTML" ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <NutriDocsEditor
                  value={formData.content}
                  onChange={(value) =>
                    setFormData((p) => ({ ...p, content: value }))
                  }
                />
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center space-y-6 bg-white">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-lg font-semibold text-slate-900">
                    Carga tu documento PDF
                  </h4>
                  <p className="text-sm text-slate-500">
                    Sube un archivo para traspasar el contenido a un recurso y poder用它 en tus entregables.
                  </p>
                </div>

                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <Input
                    placeholder="URL del archivo PDF..."
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, fileUrl: e.target.value }))
                    }
                    className="h-11 rounded-xl text-center"
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
                      className="rounded-xl h-11"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Subiendo..." : "Subir PDF"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-xl h-11"
                      onClick={extractPdf}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Digitalizar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="rounded-xl h-11 px-6"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  className="rounded-xl h-11 px-6 font-semibold"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? "Actualizar" : "Guardar recurso"}
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="p-5 bg-white border border-slate-100 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Variables Dinámicas
                </p>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Copia una variable y pégala en tu contenido. Se reemplazará con los datos del paciente.
              </p>
              <div className="grid gap-2">
                {VARIABLE_SUGGESTIONS.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`{${variable}}`);
                        toast.success(`Variable ${variable} copiada`);
                      } catch {
                        toast.error("No se pudo copiar la variable");
                      }
                    }}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-all hover:bg-slate-100"
                  >
                    <span className="text-xs font-medium text-slate-600">
                      {variable}
                    </span>
                    <Copy className="h-3 w-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-indigo-500" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Consejo de NutriNet
                </p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                &quot;Un recurso bien estructurado ahorra hasta 15 minutos de charla repetitiva en cada consulta. Se recomienda que los recursos no usen más de tres párrafos y sean pequeños, para no complejizar al lector.&quot;
              </p>
            </div>
          </aside>
        </div>
      </div>
    </ModuleLayout>
  );
}
