"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  CalendarDays,
  User,
  X,
  Plus,
  RotateCcw,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Consultation,
  Metric,
  ConsultationsResponse,
} from "@/features/consultations";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useScrollLock } from "@/hooks/useScrollLock";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ActionDockItem } from "@/components/ui/ActionDock";
import Cookies from "js-cookie";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ConsultationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromQuery = searchParams.get("patientId");

  const [searchTerm, setSearchTerm] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, lastPage: 1 });

  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<
    string | null
  >(null);


  const isAnyModalOpen = !!selectedConsultation || isDeleteModalOpen;
  useScrollLock(isAnyModalOpen);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const getAuthHeaders = () => {
    const token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token");
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
        ...(searchTerm && { search: searchTerm }),
        ...(patientIdFromQuery && { patientId: patientIdFromQuery }),
      });

      const response = await fetch(`${apiUrl}/consultations?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result: ConsultationsResponse = await response.json();
        setConsultations(result.data);
        setMeta(result.meta);
      } else {
        toast.error("Error al cargar consultas");
      }
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => fetchConsultations(retries - 1), 2000);
      } else {
        toast.error("Error de conexión");
      }
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchConsultations();
  }, [page, searchTerm, patientIdFromQuery]);

  // We don't auto-fill the search term anymore as it's confusing
  // when we are opening the creation modal directly.

  // Create/Update functions removed (moved to dedicated page)

  const handleDelete = async () => {
    if (!consultationToDelete) return;

    try {
      const response = await fetch(
        `${apiUrl}/consultations/${consultationToDelete}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

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

  // Form helper functions removed (moved to dedicated page)

  const actionDockItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "refresh",
        icon: RotateCcw,
        label: "Refrescar",
        variant: "rose",
        onClick: () => fetchConsultations(),
      },
    ],
    [],
  );

  return (
    <ModuleLayout
      title="Mis Consultas"
      description="Sistema centralizado de seguimiento y evolución clínica de pacientes."
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

      <div className="space-y-6 relative animate-in fade-in duration-700">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <Input
              type="search"
              placeholder="Buscar por nombre del paciente..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => router.push("/dashboard/consultas/nueva")}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Nueva Consulta
            </button>
          </div>
        </div>

        {/* Consultations Table */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-tight">
                    Paciente
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-tight">
                    Fecha
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-tight">
                    Sesión
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-tight">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {consultations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/pacientes/${item.patientId}`,
                            )
                          }
                          className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors text-left cursor-pointer"
                        >
                          {item.patientName}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                        <CalendarDays className="w-4 h-4 text-emerald-500" />
                        {new Date(item.date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800 tracking-tight block max-w-xs truncate">
                        {item.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => setSelectedConsultation(item)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/consultas/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConsultationToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

          {/* Pagination */}
          {meta.lastPage > 1 && (
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                Página {meta.page} de {meta.lastPage}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                  disabled={page === meta.lastPage}
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>


        {/* View Details Modal */}
        {selectedConsultation && !isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold uppercase tracking-tight border border-emerald-100">
                        {new Date(selectedConsultation.date).toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                      {selectedConsultation.title}
                    </h2>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/pacientes/${selectedConsultation.patientId}`,
                        )
                      }
                      className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-xs tracking-tight hover:text-emerald-600 transition-colors cursor-pointer group"
                    >
                      <User className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      {selectedConsultation.patientName}
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedConsultation(null)}
                    className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-tight ml-1">
                    Observaciones Clínicas
                  </h4>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium leading-relaxed">
                    {selectedConsultation.description ||
                      "Sin notas registradas."}
                  </div>
                </div>

                {selectedConsultation.metrics &&
                  selectedConsultation.metrics.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-tight ml-1">
                        Métricas Clave
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedConsultation.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                              {m.label}
                            </p>
                            <p className="text-2xl font-semibold text-slate-900">
                              {m.value}{" "}
                              <span className="text-xs text-slate-400 uppercase tracking-tight ml-1">
                                {m.unit}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="pt-6">
                  <Button
                    onClick={() => setSelectedConsultation(null)}
                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all text-xs tracking-tight uppercase"
                  >
                    Cerrar Expediente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
