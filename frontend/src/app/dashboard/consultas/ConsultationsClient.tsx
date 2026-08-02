"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  FileText,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Consultation,
  ConsultationsResponse,
  ConsultationsTableView,
} from "@/features/consultations";
import { useScrollLock } from "@/hooks/useScrollLock";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { UsageLimitBadge } from "@/components/shared/UsageLimitBadge";
import { DatePicker } from "@/components/ui/DatePicker";
import Cookies from "js-cookie";
import { Pagination } from "@/components/ui/Pagination";
import { fetchApi } from "@/lib/api-base";
import { useSubscription } from "@/context/SubscriptionContext";
import { Input } from "@/components/ui/Input";

export default function ConsultationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromQuery = searchParams.get("patientId");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, lastPage: 1 });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  const { usage, currentPlan } = useSubscription();

  const rawConsultationLimit = currentPlan?.entitlements?.["consultations.saved.limit"] ?? currentPlan?.entitlements?.["consultations.monthly.limit"];
  const consultationLimit = typeof rawConsultationLimit === "number" ? rawConsultationLimit : undefined;
  const consultationsUsed = usage?.consultationsUsed ?? meta.total ?? 0;

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
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
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
  }, [page, debouncedSearchTerm, patientIdFromQuery, dateFrom, dateTo]);

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
      rightContent={
        <UsageLimitBadge
          label="Consultas"
          usage={consultationsUsed}
          limit={consultationLimit}
        />
      }
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
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <div className="pl-2 shrink-0">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="search"
              placeholder="Buscar por RUT o nombre del paciente..."
              className="h-10 text-sm border border-slate-200 bg-white focus-visible:border-indigo-500 placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:justify-end">
            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:flex sm:items-center w-full sm:w-auto">
              <DatePicker
                value={dateFrom}
                onChange={(val) => { setDateFrom(val); setPage(1); }}
                placeholder="Desde..."
                className="w-full sm:w-36"
              />
              <DatePicker
                value={dateTo}
                onChange={(val) => { setDateTo(val); setPage(1); }}
                placeholder="Hasta..."
                className="w-full sm:w-36"
              />
            </div>
            <button
              onClick={() => router.push("/dashboard/consultas/nueva")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nueva Consulta</span>
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

      <ConsultationsTableView
        consultations={consultations}
        isLoading={isLoading}
        onViewConsultation={(id) => router.push(`/dashboard/consultas/${id}/view`)}
        onViewPatient={(patientId) => router.push(`/dashboard/pacientes/${patientId}`)}
        onDelete={(id) => {
          setConsultationToDelete(id);
          setIsDeleteModalOpen(true);
        }}
        footer={
          meta.lastPage > 1 ? (
            <Pagination
              currentPage={page}
              totalPages={meta.lastPage}
              onPageChange={setPage}
            />
          ) : undefined
        }
      />
    </ModuleLayout>
  );
}
