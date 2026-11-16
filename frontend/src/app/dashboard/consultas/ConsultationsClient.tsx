"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  FileText,
  Users,
  BarChart2,
  Activity,
  User,
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
import { Modal } from "@/components/ui/Modal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { UsageLimitBadge } from "@/components/shared/UsageLimitBadge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Pagination } from "@/components/ui/Pagination";
import { fetchApi } from "@/lib/api-base";
import { useSubscription } from "@/context/SubscriptionContext";
import { isGuestMode } from "@/lib/demo-local-api";
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
  const isGuest = isGuestMode();
  const [previewConsultation, setPreviewConsultation] = useState<Consultation | null>(null);
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {!isGuest && consultationsUsed !== undefined && !isRefreshingUsage && !isSubscriptionLoading && (
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <UsageLimitBadge
                label="Consultas"
                usage={consultationsUsed}
                limit={consultationLimit}
              />
            </div>
          )}

          {isGuest ? (
            <button
              type="button"
              disabled
              className="h-11 px-5 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shrink-0 cursor-not-allowed opacity-60 select-none w-full sm:w-auto"
              title="Inhabilitado para la demo"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Nueva Consulta</span>
            </button>
          ) : (
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
              className="h-11 px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-[#86A83C]/20 w-full sm:w-auto"
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
          )}
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

      <div className="space-y-4 sm:space-y-6">
        {/* Resumen simple y compacto (reemplaza banner masivo para móviles) */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-6 bg-white border border-[#E9E5E7] rounded-xl px-4 py-2.5 shadow-2xs text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#86A83C]" />
            <span className="text-[#626573] font-medium">Consultas:</span>
            <strong className="text-[#20212B] font-bold">{meta.total}</strong>
          </div>
          <div className="h-3.5 w-px bg-[#E9E5E7]" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#668E20]" />
            <span className="text-[#626573] font-medium">Pacientes atendidos:</span>
            <strong className="text-[#20212B] font-bold">{new Set(consultations.map((c) => c.patientId)).size || meta.total}</strong>
          </div>
          <div className="hidden sm:block h-3.5 w-px bg-[#E9E5E7]" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[#626573] font-medium">Historial:</span>
            <strong className="text-[#20212B] font-bold">100% archivadas</strong>
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
                className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#86A83C]/15 focus:border-[#86A83C] transition-all shadow-2xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto">
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
          onViewConsultation={(id) => {
            const found = consultations.find((c) => c.id === id);
            if (found) {
              setPreviewConsultation(found);
            } else {
              router.push(`/dashboard/consultas/${id}/view`);
            }
          }}
          onViewPatient={(patientId) => router.push(`/dashboard/pacientes/${patientId}`)}
          onDelete={
            isGuest
              ? undefined
              : (id) => {
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
                }
          }
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

      {/* Modal de Vista Previa Rápida de Consulta */}
      <Modal
        isOpen={Boolean(previewConsultation)}
        onClose={() => setPreviewConsultation(null)}
        title="Vista Previa de la Consulta"
        description="Resumen clínico y evolución registrado en la sesión"
        className="max-w-2xl"
      >
        {previewConsultation && (
          <div className="space-y-4 sm:space-y-5">
            {/* Cabecera del paciente y fecha */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#F0F5DF]/60 border border-[#DDE7B8]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center text-[#668E20] font-extrabold text-sm sm:text-base shrink-0 shadow-2xs">
                  {previewConsultation.patientName?.charAt(0) || "P"}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-[#20212B] text-sm sm:text-base leading-snug truncate">
                    {previewConsultation.patientName || "Paciente"}
                  </h4>
                  <p className="text-xs font-semibold text-[#668E20]">
                    Paciente en control
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-[#DDE7B8] self-start sm:self-auto shrink-0 shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#86A83C] shrink-0" />
                <span>
                  {new Date(previewConsultation.date).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Título de la sesión */}
            {previewConsultation.title && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Motivo / Título de Consulta
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
                  {previewConsultation.title}
                </p>
              </div>
            )}

            {/* Observaciones clínicas */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-[#86A83C]" />
                <span>Observaciones Clínicas y Evolución</span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8F9FB] border border-slate-200/70 text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                {previewConsultation.description || (previewConsultation as any).notes || "Sin observaciones registradas para esta sesión."}
              </div>
            </div>

            {/* Métricas registradas */}
            {Array.isArray(previewConsultation.metrics) && previewConsultation.metrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-[#86A83C]" />
                  <span>Métricas y Antropometría ({previewConsultation.metrics.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {previewConsultation.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        {m.label || m.key}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-extrabold text-[#20212B] tabular-nums">
                          {m.value}
                        </span>
                        {m.unit && (
                          <span className="text-xs font-bold text-slate-400">
                            {m.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción del modal */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const patId = previewConsultation.patientId;
                  setPreviewConsultation(null);
                  router.push(`/dashboard/pacientes/${patId}`);
                }}
                className="h-10 px-4 rounded-xl bg-[#F0F5DF] hover:bg-[#E5ECCB] text-[#668E20] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#DDE7B8] transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Ver Ficha del Paciente</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewConsultation(null)}
                className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ModuleLayout>
  );
}
