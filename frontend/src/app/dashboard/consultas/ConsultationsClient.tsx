"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  CalendarDays,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filtros_B } from "@/components/ui/Filtros_B";
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

  /** Lee el token en el momento de la peticion para evitar valores obsoletos */
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
      // Solo apagar el spinner tras exito o error HTTP controlado
      setIsLoading(false);
    } catch (e) {
      if (retries > 0) {
        // Reintentar sin apagar el spinner todavia
        setTimeout(() => fetchConsultations(retries - 1), 2000);
      } else {
        toast.error("Error de conexion");
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
      toast.error("Error de conexion");
    }
  };

  return (
    <ModuleLayout
      title="Mis Consultas"
      description="Espacio con todas tus consultas realizadas, puedes filtrar por pacientes y ver el detalle de cada consulta que has realizado. Todas se conectan con tus pacientes."
      className="pb-8"
    >
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar consulta?"
        description="Esta accion no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

<div className="space-y-6 relative animate-in fade-in duration-700">
        <Filtros_B
          searchValue={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          searchPlaceholder="Buscar por nombre del paciente..."
          rightContent={
            <>
              <div className="hidden md:flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                Limite mensual: {Number.isFinite(consultationLimit) ? consultationLimit : "Ilimitado"}
              </div>
              <button
                onClick={() => router.push("/dashboard/consultas/nueva")}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Nueva Consulta
              </button>
            </>
          }
        />

        {/* Consultations Table */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-tight">Paciente</th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-tight">Fecha</th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-tight">Sesion</th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-tight">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <TableLoadingRows columns={4} rows={5} />
                ) : (
                  consultations.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/dashboard/consultas/${item.id}/view`)}
                    className="hover:bg-indigo-50/40 hover:shadow-sm transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-indigo-500"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/pacientes/${item.patientId}`);
                          }}
                          className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                        >
                          {item.patientName}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/pacientes/${item.patientId}`);
                          }}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver Paciente"
                        >
                          <User className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/consultas/${item.id}/view`);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver Consulta"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConsultationToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
                {!isLoading && consultations.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-32 text-center text-slate-400 font-semibold uppercase tracking-tight text-xs"
                    >
                      No hay consultas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta.lastPage > 1 && (
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                Pagina {meta.page} de {meta.lastPage}
              </p>
              <div className="flex gap-2">
                <Pagination
                  currentPage={page}
                  totalPages={meta.lastPage}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
