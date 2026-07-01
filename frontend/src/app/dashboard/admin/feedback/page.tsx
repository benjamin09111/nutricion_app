"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Mail,
  User,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { fetchApi } from "@/lib/api-base";

interface Feedback {
  id: string;
  email: string;
  message: string;
  type:
    | "PASSWORD_RESET"
    | "CONTACT"
    | "OTHER"
    | "FEEDBACK"
    | "TESTIMONIO"
    | "COMPLAINT"
    | "IDEA";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeedbackPage() {
  const { isAdminView } = useAdmin();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleteResolvedConfirmOpen, setIsDeleteResolvedConfirmOpen] =
    useState(false);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(`/support`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al cargar feedback");

      const data = await response.json();
      setFeedbackList(data.filter((item: Feedback) => item.type !== "CONTACT"));
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los mensajes de feedback");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminView) {
      fetchFeedback();
    }
  }, [isAdminView]);

  const handleResolve = async () => {
    if (!selectedFeedback) return;

    setIsResolving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(
        `/support/${selectedFeedback.id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminMessage: resolutionNote.trim() || undefined,
          }),
        },
      );

      if (!response.ok) throw new Error("Error al resolver feedback");

      toast.success("Feedback marcado como resuelto y correo enviado");
      setSelectedFeedback(null);
      setResolutionNote("");
      fetchFeedback();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado");
    } finally {
      setIsResolving(false);
    }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(`/support/${feedbackToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar feedback");

      toast.success("Feedback eliminado");
      // Remove from state immediately to feel snappy
      setFeedbackList((prev) =>
        prev.filter((item) => item.id !== feedbackToDelete),
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    } finally {
      setIsDeleteConfirmOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const handleDeleteResolved = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi("/support/resolved", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar feedback resueltos");

      const data = await response.json().catch(() => null);
      const deletedCount = data?.count ?? data?.deletedCount ?? 0;
      toast.success(
        deletedCount > 0
          ? `Se eliminaron ${deletedCount} feedback resueltos`
          : "No había feedback resueltos para eliminar",
      );
      fetchFeedback();
    } catch (error) {
      console.error(error);
      toast.error("Error al limpiar feedback resueltos");
    } finally {
      setIsDeleteResolvedConfirmOpen(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "FEEDBACK":
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case "COMPLAINT":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "IDEA":
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case "TESTIMONIO":
        return <CheckCircle2 className="w-4 h-4 text-sky-600" />;
      case "PASSWORD_RESET":
        return <User className="w-4 h-4 text-indigo-600" />;
      case "CONTACT":
        return <Mail className="w-4 h-4 text-blue-600" />;
      default:
        return <Inbox className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "FEEDBACK":
        return "Feedback";
      case "COMPLAINT":
        return "Problema";
      case "IDEA":
        return "Idea";
      case "TESTIMONIO":
        return "Testimonio";
      case "PASSWORD_RESET":
        return "Reset Pass";
      case "CONTACT":
        return "Contacto";
      default:
        return "Otro";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "FEEDBACK":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COMPLAINT":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "IDEA":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "TESTIMONIO":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "PASSWORD_RESET":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CONTACT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredFeedback = feedbackList.filter((item) => {
    const matchesType = filterType === "ALL" || item.type === filterType;
    const matchesSearch =
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.message || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const resolvedCount = feedbackList.filter(
    (item) => item.status === "RESOLVED",
  ).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Inbox size={24} />
            </div>
            Buzón de Feedback
          </h1>
          <p className="text-slate-500 mt-2">
            Gestiona las sugerencias, reportes y mensajes de los usuarios.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => setIsDeleteResolvedConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Eliminar feedback resueltos"
            disabled={resolvedCount === 0}
          >
            <Trash2 size={16} />
            Eliminar resueltos
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-rose-600">
              {resolvedCount}
            </span>
          </button>

          <button
            onClick={fetchFeedback}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
            title="Recargar"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por email o contenido..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            className="border border-slate-200 rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="FEEDBACK">Feedback</option>
            <option value="IDEA">Ideas</option>
            <option value="TESTIMONIO">Testimonios</option>
            <option value="COMPLAINT">Problemas</option>
            <option value="CONTACT">Contacto</option>
            <option value="PASSWORD_RESET">Reset Password</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && feedbackList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            Cargando mensajes...
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>No se encontraron mensajes con estos filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-6 transition-colors group ${item.status !== "RESOLVED" ? "hover:bg-slate-50 cursor-pointer" : ""}`}
                role={item.status !== "RESOLVED" ? "button" : undefined}
                tabIndex={item.status !== "RESOLVED" ? 0 : -1}
                onClick={
                  item.status !== "RESOLVED"
                    ? () => setSelectedFeedback(item)
                    : undefined
                }
                onKeyDown={
                  item.status !== "RESOLVED"
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedFeedback(item);
                        }
                      }
                    : undefined
                }
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                  <div className="flex gap-4 w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                        getTypeColor(item.type).split(" ")[0]
                      }`}
                    >
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTypeColor(item.type)}`}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        {item.status === "RESOLVED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resuelto
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">
                        {item.email}
                      </h3>
                      {item.type === "TESTIMONIO" && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
                          Posible testimonio público para la página
                        </p>
                      )}

                      <p className="text-slate-600 text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
                        {item.message || (
                          <span className="italic text-slate-400">
                            Sin mensaje
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0 ml-14 sm:ml-0">
                    {item.status !== "RESOLVED" && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedFeedback(item);
                        }}
                        className="text-xs font-medium bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        title="Responder feedback"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Responder</span>
                      </button>
                    )}

                    <div className="ml-2 pl-2 border-l border-slate-200">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setFeedbackToDelete(item.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={selectedFeedback !== null}
        onClose={() => {
          setSelectedFeedback(null);
          setResolutionNote("");
        }}
        onConfirm={handleResolve}
        title={
          selectedFeedback
            ? "Responder feedback y cerrar"
            : "Responder feedback y cerrar"
        }
        description="Revisa el comentario, agrega una respuesta opcional y envía el correo de cierre."
        confirmText="Marcar resuelto y enviar correo"
        variant="primary"
        isLoading={isResolving}
        size="xl"
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                  Tipo
                </p>
                <div
                  className={`inline-flex ${getTypeColor(selectedFeedback.type)} px-3 py-1 rounded-full text-xs font-bold border`}
                >
                  {getTypeLabel(selectedFeedback.type)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                  Estado
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedFeedback.status === "RESOLVED"
                    ? "Resuelto"
                    : "Pendiente"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                  Recibido
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {formatDistanceToNow(new Date(selectedFeedback.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div className="flex items-center gap-2 mb-3 text-indigo-700 font-semibold">
                <MessageSquare className="w-4 h-4" />
                Feedback recibido
              </div>
              <div className="rounded-2xl bg-white border border-indigo-100 p-4">
                <p className="text-sm font-medium text-slate-900 break-all">
                  {selectedFeedback.email}
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-700">
                  {selectedFeedback.message || (
                    <span className="italic text-slate-400">Sin mensaje</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Mensaje adicional para el correo (opcional)
              </label>
              <textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                rows={5}
                placeholder="Ej: Gracias por avisarnos. Ya ajustamos el comportamiento para que sea más claro."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
              <p className="text-xs text-slate-500">
                El correo saldrá desde{" "}
                <span className="font-semibold text-slate-700">
                  soporte@nutrinet.cl
                </span>{" "}
                y se enviará al marcarlo como resuelto.
              </p>
            </div>
          </div>
        )}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isDeleteResolvedConfirmOpen}
        onClose={() => setIsDeleteResolvedConfirmOpen(false)}
        onConfirm={handleDeleteResolved}
        title="¿Eliminar feedback resueltos?"
        description="Esta acción eliminará de la base de datos todos los feedback que ya estén marcados como resueltos."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setFeedbackToDelete(null);
        }}
        onConfirm={handleDelete}
        title="¿Eliminar feedback?"
        description="¿Estás seguro de eliminar este mensaje? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </div>
  );
}
