"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";

export interface TestimonialItem {
  id?: string;
  name: string;
  role?: string | null;
  clinic?: string | null;
  city?: string | null;
  timeSaved?: string | null;
  quote: string;
  highlight?: string | null;
  avatarText?: string | null;
  avatarBg?: string | null;
  rating?: number;
  isPublished?: boolean;
  isReviewed?: boolean;
  displayOrder?: number;
}

interface TestimonialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testimonialToEdit?: TestimonialItem | null;
}

const AVATAR_BG_OPTIONS = [
  { label: "Púrpura - Índigo", value: "from-purple-500 to-indigo-600" },
  { label: "Esmeralda - Teal", value: "from-emerald-500 to-teal-600" },
  { label: "Ámbar - Rosa", value: "from-amber-500 to-rose-600" },
  { label: "Azul - Cian", value: "from-blue-500 to-cyan-600" },
  { label: "Fucsia - Violeta", value: "from-fuchsia-500 to-violet-600" },
  { label: "Naranja - Rojo", value: "from-orange-500 to-red-600" },
];

export function TestimonialFormModal({
  isOpen,
  onClose,
  onSuccess,
  testimonialToEdit,
}: TestimonialFormModalProps) {
  const isEditing = Boolean(testimonialToEdit?.id);

  const [formData, setFormData] = useState<Partial<TestimonialItem>>({
    name: "",
    role: "",
    clinic: "",
    city: "",
    timeSaved: "",
    quote: "",
    highlight: "",
    avatarText: "",
    avatarBg: "from-purple-500 to-indigo-600",
    rating: 5,
    isPublished: false,
    displayOrder: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (testimonialToEdit) {
      setFormData({
        name: testimonialToEdit.name || "",
        role: testimonialToEdit.role || "",
        clinic: testimonialToEdit.clinic || "",
        city: testimonialToEdit.city || "",
        timeSaved: testimonialToEdit.timeSaved || "",
        quote: testimonialToEdit.quote || "",
        highlight: testimonialToEdit.highlight || "",
        avatarText: testimonialToEdit.avatarText || "",
        avatarBg: testimonialToEdit.avatarBg || "from-purple-500 to-indigo-600",
        rating: testimonialToEdit.rating || 5,
        isPublished: testimonialToEdit.isPublished ?? false,
        displayOrder: testimonialToEdit.displayOrder ?? 0,
      });
    } else {
      setFormData({
        name: "",
        role: "",
        clinic: "",
        city: "",
        timeSaved: "",
        quote: "",
        highlight: "",
        avatarText: "",
        avatarBg: "from-purple-500 to-indigo-600",
        rating: 5,
        isPublished: false,
        displayOrder: 0,
      });
    }
  }, [testimonialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("El nombre del autor es obligatorio.");
      return;
    }
    if (!formData.quote?.trim()) {
      toast.error("La cita / testimonio es obligatorio.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        ...formData,
        isReviewed: true, // Any manual creation or edit marks as reviewed
      };

      const url = isEditing
        ? `/testimonials/admin/${testimonialToEdit!.id}`
        : "/testimonials/admin";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetchApi(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el testimonio");
      }

      toast.success(
        isEditing
          ? "Testimonio actualizado correctamente."
          : "Testimonio creado exitosamente."
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar el testimonio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar Testimonio" : "Crear Nuevo Testimonio"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Modifica la información antes de publicarlo en la landing page."
                  : "Agrega un testimonio manualmente para ser mostrado a los visitantes."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Dra. Camila Morales"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                required
              />
            </div>

            {/* Cargo / Rol */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cargo o Especialidad
              </label>
              <input
                type="text"
                value={formData.role || ""}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Ej: Nutricionista Clínica & Deportiva"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Clínica / Centro */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lugar de trabajo / Clínica
              </label>
              <input
                type="text"
                value={formData.clinic || ""}
                onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                placeholder="Ej: Consulta Particular / Centro Deportivo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ciudad / Región
              </label>
              <input
                type="text"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ej: Santiago, Concepción, Viña del Mar"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Highlight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destacado (Pill Verde)
              </label>
              <input
                type="text"
                value={formData.highlight || ""}
                onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                placeholder="Ej: Pasé de 45 min a 5 min por pauta"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Tiempo / Métrica Ahorrada */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subtítulo de tiempo / impacto
              </label>
              <input
                type="text"
                value={formData.timeSaved || ""}
                onChange={(e) => setFormData({ ...formData, timeSaved: e.target.value })}
                placeholder="Ej: Ahorra 3.5 horas al día"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Testimonio / Cita */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cita / Comentario del testimonio *
            </label>
            <textarea
              rows={4}
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="Escribe el testimonio completo aquí..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Iniciales / Avatar Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Iniciales Avatar
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.avatarText || ""}
                onChange={(e) => setFormData({ ...formData, avatarText: e.target.value.toUpperCase() })}
                placeholder="Ej: CM"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Estilo Avatar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color de Fondo Avatar
              </label>
              <select
                value={formData.avatarBg || "from-purple-500 to-indigo-600"}
                onChange={(e) => setFormData({ ...formData, avatarBg: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                {AVATAR_BG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Calificación Estrellas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estrellas (1 - 5)
              </label>
              <div className="flex items-center gap-1 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= (formData.rating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle Publicar en Landing */}
          <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Publicar directamente en la Landing Page
              </span>
              <p className="text-[11px] text-indigo-800/80">
                Al activar esta opción, el testimonio será visible de inmediato en la sección principal de NutriNet.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={Boolean(formData.isPublished)}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Testimonio" : "Crear Testimonio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
