"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  CalendarDays,
  User,
  Plus,
  Trash2,
  Search,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Consultation,
  ConsultationsResponse,
} from "@/features/consultations";
import { useScrollLock } from "@/hooks/useScrollLock";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import Cookies from "js-cookie";
import { Pagination } from "@/components/ui/Pagination";
import { fetchApi } from "@/lib/api-base";
import { useSubscription } from "@/context/SubscriptionContext";
import { TableLoadingRows } from "@/components/ui/TableLoadingRows";
import { MobileCardLoadingList } from "@/components/ui/MobileCardLoadingList";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function ConsultationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromQuery = searchParams.get("patientId");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, lastPage: 1 });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  const { limit } = useSubscription();
  const consultationLimit = limit("consultations.monthly.limit");

  useScrollLock(isDeleteModalOpen);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      searchTerm ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /** Lee el token en el momento de la petición para evitar valores obsoletos */
  const getAuthHeaders = () => {
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchConsultations = async (retries = 3) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        type: "CLINICAL",
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(patientIdFromQuery && { patientId: patientIdFromQuery }),
      });

      const response = await fetchApi(`/consultations?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result: ConsultationsResponse = await response.json();
        setConsultations(result.data);
        setMeta(result.meta);
      } else {
        toast.error("Error al cargar consultas");
      }
      setIsLoading(false);
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => fetchConsultations(retries - 1), 2000);
      } else {
        toast.error("Error de conexión");
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [page, debouncedSearchTerm, patientIdFromQuery]);

  const handleDelete = async () => {
    if (!consultationToDelete) return;

    try {
      const response = await fetchApi(`/consultations/${consultationToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("Consulta eliminada");
        setIsDeleteModalOpen(false);
        setConsultationToDelete(null);
        fetchConsultations();
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  return (
    <ModuleLayout
      title="Mis Consultas"
      description="Espacio con todas tus consultas realizadas. Puedes filtrar por paciente y ver el detalle de cada sesión. Todas se conectan con tus pacientes."
      className="pb-8"
    >
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar consulta?"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

      <div className="space-y-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <div className="pl-2 shrink-0">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="search"
              placeholder="Buscar por nombre del paciente..."
              className="h-10 text-sm border border-slate-200 bg-white focus-visible:border-indigo-500 placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="hidden md:flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
              Límite mensual: {Number.isFinite(consultationLimit) ? consultationLimit : "Ilimitado"}
            </div>
            <button
              onClick={() => router.push("/dashboard/consultas/nueva")}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Nueva Consulta
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-1 py-2 sm:px-3">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 min-w-0 flex-wrap">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <strong className="text-indigo-600 font-semibold">{meta.total}</strong> consultas registradas
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white shadow-xl shadow-slate-200/50 border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-380px)] custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Paciente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Sesión
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {isLoading ? (
                  <TableLoadingRows columns={4} rows={5} />
                ) : consultations.length > 0 ? (
                  consultations.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/dashboard/consultas/${item.id}/view`)}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-100 shadow-sm">
                              {item.patientName?.charAt(0) || "P"}
                            </div>
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-none mb-1 truncate">
                              {item.patientName}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/pacientes/${item.patientId}`);
                              }}
                              className="text-xs text-slate-500 font-medium hover:text-indigo-600 transition-colors text-left cursor-pointer"
                            >
                              Ver ficha del paciente
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                          <CalendarDays className="w-4 h-4 text-indigo-400" />
                          {new Date(item.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-800 tracking-tight block max-w-xs truncate">
                          {item.title}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/pacientes/${item.patientId}`)}
                            className="group relative p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                            title="Ver Paciente"
                          >
                            <User className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/consultas/${item.id}/view`)}
                            className="group relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Ver Consulta"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConsultationToDelete(item.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="group relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4.5 h-4.5 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                          <FileText className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">
                          Sin consultas registradas
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {isLoading ? (
            <MobileCardLoadingList rows={3} />
          ) : consultations.length > 0 ? (
            consultations.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/dashboard/consultas/${item.id}/view`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                      {item.patientName?.charAt(0) || "P"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 line-clamp-1">
                        {item.patientName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 min-w-0">
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        <span>
                          {new Date(item.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Sesión
                  </p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                    {item.title}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/pacientes/${item.patientId}`);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Ver paciente
                  </button>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/dashboard/consultas/${item.id}/view`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg"
                      title="Ver consulta"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setConsultationToDelete(item.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 bg-slate-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/consultas/${item.id}/view`)
                      }
                      className="p-2 text-indigo-600 bg-indigo-50 rounded-lg ml-1 font-bold text-[10px] px-3 flex items-center gap-1 shadow-sm border border-indigo-100"
                    >
                      VER <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                Sin consultas registradas
              </p>
            </div>
          )}
        </div>

        {meta.lastPage > 1 && (
          <Pagination
            currentPage={page}
            totalPages={meta.lastPage}
            onPageChange={setPage}
          />
        )}
      </div>
    </ModuleLayout>
  );
}
