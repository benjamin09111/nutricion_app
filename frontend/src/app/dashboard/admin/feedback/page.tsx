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

interface Feedback {
  id: string;
  email: string;
  message: string;
  type:
    | "PASSWORD_RESET"
    | "CONTACT"
    | "OTHER"
    | "FEEDBACK"
    | "COMPLAINT"
    | "IDEA";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeedbackPage() {
  const { isAdmin } = useAdmin();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Error al cargar feedback");

      const data = await response.json();
      setFeedbackList(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los mensajes de feedback");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFeedback();
    }
  }, [isAdmin]);

  const handleResolve = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/${id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Error al resolver feedback");

      toast.success("Feedback marcado como resuelto");
      fetchFeedback(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este mensaje?")) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Error al eliminar feedback");

      toast.success("Feedback eliminado");
      // Remove from state immediately to feel snappy
      setFeedbackList((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
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
        <button
          onClick={fetchFeedback}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors self-start md:self-center"
          title="Recargar"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
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
                className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group"
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
                        onClick={() => handleResolve(item.id)}
                        className="text-xs font-medium bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-1"
                        title="Marcar como resuelto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Resolver</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-medium bg-white border border-slate-200 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm flex items-center gap-1"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
