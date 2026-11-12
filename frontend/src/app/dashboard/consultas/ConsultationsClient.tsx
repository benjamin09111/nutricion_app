"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  FileText,
  Users,
  BarChart2,
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
import { Pagination } from "@/components/ui/Pagination";
import { fetchApi } from "@/lib/api-base";
import { useSubscription } from "@/context/SubscriptionContext";
import { Input } from "@/components/ui/Input";
import { useConsultations } from "@/features/consultations";

export default function ConsultationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromQuery = searchParams.get("patientId");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);

  const { consultations, meta, isLoading, deleteConsultation } = useConsultations({
    page,
    searchTerm: debouncedSearchTerm,
    patientId: patientIdFromQuery,
    dateFrom,
    dateTo,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  const {
    usage,
    currentPlan,
    entitlements,
    isLoading: isSubscriptionLoading,
    refreshSubscription,
    can,
  } = useSubscription();
  const canDeleteConsultations = can("consultations.delete.access");
  const [fallbackUsage, setFallbackUsage] = useState<number | undefined>(undefined);
  const [isFallbackUsageLoading, setIsFallbackUsageLoading] = useState(true);
  const [isRefreshingUsage, setIsRefreshingUsage] = useState(true);

  const rawConsultationLimit = currentPlan?.entitlements?.["consultations.saved.limit"] ??
    currentPlan?.entitlements?.["consultations.monthly.limit"] ??
    entitlements["consultations.saved.limit"] ?? entitlements["consultations.monthly.limit"];
  const consultationLimit = typeof rawConsultationLimit === "number" ? rawConsultationLimit : undefined;
  const consultationsUsed = usage?.consultationsUsed ?? fallbackUsage;
  const consultationCreationBlocked =
    isSubscriptionLoading ||
    isRefreshingUsage ||
    isFallbackUsageLoading ||
    consultationsUsed === undefined ||
    consultationLimit === undefined;
  const isConsultationLimitReached =
    !consultationCreationBlocked && Number.isFinite(consultationLimit) && consultationsUsed >= consultationLimit;

  useScrollLock(isDeleteModalOpen);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      searchTerm ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    let cancelled = false;
    setIsRefreshingUsage(true);
    void refreshSubscription({ silent: true }).finally(() => {
      if (!cancelled) setIsRefreshingUsage(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshSubscription]);

  useEffect(() => {
    if (usage?.consultationsUsed !== undefined) {
      setIsFallbackUsageLoading(false);
      return;
    }
    let cancelled = false;
    setIsFallbackUsageLoading(true);
    fetchApi("/consultations?page=1&limit=1&type=CLINICAL", { headers: getAuthHeaders() })
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const result: ConsultationsResponse = await response.json();
        setFallbackUsage(result.meta.total);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsFallbackUsageLoading(false);
      });
    return () => { cancelled = true; };
  }, [usage?.consultationsUsed]);

  const handleDelete = async () => {
    if (!canDeleteConsultations) {
      window.dispatchEvent(
        new CustomEvent("show-freemium-upgrade", {
          detail: {
            description: "Eliminar consultas está disponible en los planes de pago.",
          },
        }),
      );
      return;
    }
    if (!consultationToDelete) return;

    try {
      await deleteConsultation(consultationToDelete);
      toast.success("Consulta eliminada");
      setIsDeleteModalOpen(false);
      setConsultationToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <ModuleLayout
      title="Mis Consultas"
      description={
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
            <CalendarDays className="w-4 h-4 text-[#86A83C]" />
            <span className="tracking-wider uppercase text-[10px] font-bold">Seguimiento y Evolución Clínica</span>
          </div>
          <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
            Espacio con todas tus consultas realizadas. Puedes filtrar por paciente y ver el detalle de cada sesión. Todas se conectan con tus pacientes.
          </p>
        </div>
      }
      rightContent={
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {consultationsUsed !== undefined && !isRefreshingUsage && !isSubscriptionLoading && (
            <UsageLimitBadge
              label="Consultas"
              usage={consultationsUsed}
              limit={consultationLimit}
            />
          )}

          <button
            type="button"
            onClick={() => {
              if (consultationCreationBlocked) {
                toast.info("Estamos verificando el uso de tu plan. Intenta nuevamente en unos segundos.");
                return;
              }
              if (isConsultationLimitReached) {
                toast.error("Has alcanzado el límite de consultas de tu plan.");
                return;
              }
              router.push("/dashboard/consultas/nueva");
            }}
            disabled={consultationCreationBlocked || isConsultationLimitReached}
            className="h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {consultationCreationBlocked
                ? "Verificando..."
                : isConsultationLimitReached
                  ? "Límite alcanzado"
                  : "Nueva Consulta"}
            </span>
          </button>
        </div>
      }
      className="pb-16 relative"
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

      <div className="space-y-6">
        {/* Barra de Indicadores — Idéntica a Pacientes con 3 columnas interiores */}
        <div className="relative overflow-hidden bg-white border border-[#E9E5E7] rounded-[18px] p-5 sm:p-6 min-h-[110px] shadow-2xs">
          <svg
            className="absolute left-0 top-0 h-full w-36 text-[#B0C76F] pointer-events-none select-none opacity-15"
            viewBox="0 0 120 100"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0 0 C 45 15, 65 55, 25 100 L 0 100 Z" />
            <path d="M0 20 C 35 35, 45 75, 10 100 L 0 100 Z" opacity="0.6" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#F0ECEE] relative z-10">
            {/* 1. Consultas totales */}
            <div className="flex items-center justify-between sm:px-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Consultas</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {meta.total}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-pulse" />
                <span>Historial clínico</span>
              </span>
            </div>

            {/* 2. Pacientes únicos atendidos */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Pacientes en registro</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {new Set(consultations.map((c) => c.patientId)).size || meta.total}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-[#626573] border border-slate-200">
                Seguimiento activo
              </span>
            </div>

            {/* 3. Total registradas */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3ECFC] text-[#7842D4]">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Total registradas</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {meta.total}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3ECFC] text-[#7842D4] border border-[#E4D5FA]">
                100% archivadas
              </span>
            </div>
          </div>
        </div>

        {/* Buscador y Filtros — Una única fila horizontal uniforme de 44px */}
        <div className="space-y-2">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
              <input
                type="search"
                placeholder="Buscar por RUT o nombre del paciente..."
                className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="w-full sm:w-40">
                <DatePicker
                  value={dateFrom}
                  onChange={(val) => { setDateFrom(val); setPage(1); }}
                  placeholder="Desde..."
                  className="w-full h-11"
                />
              </div>
              <div className="w-full sm:w-40">
                <DatePicker
                  value={dateTo}
                  onChange={(val) => { setDateTo(val); setPage(1); }}
                  placeholder="Hasta..."
                  className="w-full h-11"
                />
              </div>
            </div>
          </div>

          <div className="px-1 text-xs text-[#626573] flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#848792]" />
            <span>
              Mostrando <strong className="font-semibold text-[#20212B]">{consultations.length}</strong> de{" "}
              <strong className="font-semibold text-[#20212B]">{meta.total}</strong> consultas registradas
            </span>
          </div>
        </div>

        {/* Tabla de Consultas (RecordsTable compartida) */}
        <ConsultationsTableView
          consultations={consultations}
          isLoading={isLoading}
          onViewConsultation={(id) => router.push(`/dashboard/consultas/${id}/view`)}
          onViewPatient={(patientId) => router.push(`/dashboard/pacientes/${patientId}`)}
          onDelete={(id) => {
            if (!canDeleteConsultations) {
              window.dispatchEvent(
                new CustomEvent("show-freemium-upgrade", {
                  detail: {
                    description: "Eliminar consultas está disponible en los planes de pago.",
                  },
                }),
              );
              return;
            }
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
      </div>
    </ModuleLayout>
  );
}
