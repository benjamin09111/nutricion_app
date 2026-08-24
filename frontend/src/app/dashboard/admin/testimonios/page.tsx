"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Globe,
  EyeOff,
  CheckCircle2,
  Star,
  Quote,
  Clock,
  Filter,
  UserCheck,
  Building2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { useAdmin } from "@/context/AdminContext";
import {
  TestimonialFormModal,
  TestimonialItem,
} from "./TestimonialFormModal";

type FilterTab = "all" | "unreviewed" | "published";

export default function TestimoniosAdminPage() {
  const { role } = useAdmin();
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("unreviewed");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testimonialToEdit, setTestimonialToEdit] = useState<TestimonialItem | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetchApi("/testimonials/admin", { headers });
      if (!response.ok) throw new Error("Error al obtener testimonios.");

      const data = await response.json();
      setTestimonials(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error("No se pudieron cargar los testimonios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const notifySidebarUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("admin-testimonials-updated"));
    }
  };

  const unreviewedCount = useMemo(
    () => testimonials.filter((t) => !t.isReviewed).length,
    [testimonials]
  );
  const publishedCount = useMemo(
    () => testimonials.filter((t) => t.isPublished).length,
    [testimonials]
  );

  const filteredTestimonials = useMemo(() => {
    if (activeTab === "unreviewed") {
      return testimonials.filter((t) => !t.isReviewed);
    }
    if (activeTab === "published") {
      return testimonials.filter((t) => t.isPublished);
    }
    return testimonials;
  }, [testimonials, activeTab]);

  const handleTogglePublish = async (item: TestimonialItem) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetchApi(
        `/testimonials/admin/${item.id}/toggle-publish`,
        { method: "PATCH", headers }
      );

      if (!response.ok) throw new Error("No se pudo cambiar el estado de publicación.");

      toast.success(
        item.isPublished
          ? "Testimonio removido de la landing page."
          : "Testimonio publicado exitosamente en la landing page!"
      );
      fetchTestimonials();
      notifySidebarUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al actualizar estado.");
    }
  };

  const handleMarkAsReviewed = async (item: TestimonialItem) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetchApi(
        `/testimonials/admin/${item.id}/review`,
        { method: "PATCH", headers }
      );

      if (!response.ok) throw new Error("No se pudo marcar como revisado.");

      toast.success("Testimonio marcado como revisado.");
      fetchTestimonials();
      notifySidebarUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al revisar testimonio.");
    }
  };

  const handleDelete = async (item: TestimonialItem) => {
    if (!confirm(`¿Seguro que deseas eliminar el testimonio de "${item.name}"?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetchApi(`/testimonials/admin/${item.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("No se pudo eliminar el testimonio.");

      toast.success("Testimonio eliminado.");
      fetchTestimonials();
      notifySidebarUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al eliminar.");
    }
  };

  const handleOpenCreate = () => {
    setTestimonialToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TestimonialItem) => {
    setTestimonialToEdit(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              Gestión de Testimonios Landing
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Testimonios de Nutricionistas
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Revisa, edita y publica los comentarios recibidos de usuarios o crea testimonios destacados para mostrar en la Landing Page.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-transform active:scale-95 hover:bg-indigo-700 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo Testimonio
          </button>
        </div>

        {/* Filters and Counters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-200/60 p-1.5">
            <button
              onClick={() => setActiveTab("unreviewed")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "unreviewed"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Sin Revisar
              {unreviewedCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                  {unreviewedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("published")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "published"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Publicados en Landing ({publishedCount})
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos ({testimonials.length})
            </button>
          </div>
        </div>

        {/* Testimonials List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
              />
            ))}
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-base font-bold text-slate-900">
              No hay testimonios en esta categoría
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === "unreviewed"
                ? "No tienes comentarios de nutricionistas pendientes de revisión."
                : activeTab === "published"
                ? "Aún no has publicado ningún testimonio en la landing page."
                : "Aún no se registran testimonios."}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Crear primer testimonio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((t) => (
              <div
                key={t.id}
                className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition-all hover:shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!t.isReviewed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Nuevo
                        </span>
                      )}
                      {t.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                          <Globe className="h-3 w-3" /> En Landing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                          <EyeOff className="h-3 w-3" /> Oculto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlight pill if present */}
                  {t.highlight && (
                    <div className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-600">
                      ⚡ {t.highlight}
                    </div>
                  )}

                  {/* Quote Body */}
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{t.quote}&quot;
                  </p>
                </div>

                {/* Author Details & Actions Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${
                        t.avatarBg || "from-purple-500 to-indigo-600"
                      } text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0`}
                    >
                      {t.avatarText || "TN"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {t.name}
                      </h4>
                      {t.role && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {t.role}
                        </p>
                      )}
                      {(t.clinic || t.city) && (
                        <p className="text-[10px] text-emerald-600 font-semibold truncate mt-0.5">
                          {[t.clinic, t.city].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => handleTogglePublish(t)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        t.isPublished
                          ? "border border-slate-200 text-slate-700 hover:bg-slate-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                      }`}
                    >
                      {t.isPublished ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Despublicar
                        </>
                      ) : (
                        <>
                          <Globe className="h-3.5 w-3.5" />
                          Subir a Landing
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                      title="Editar testimonio"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {!t.isReviewed && (
                      <button
                        onClick={() => handleMarkAsReviewed(t)}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 cursor-pointer"
                        title="Marcar como revisado"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(t)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      title="Eliminar testimonio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimonial Modal */}
      <TestimonialFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchTestimonials();
          notifySidebarUpdate();
        }}
        testimonialToEdit={testimonialToEdit}
      />
    </div>
  );
}
