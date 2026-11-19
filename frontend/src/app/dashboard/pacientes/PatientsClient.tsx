"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  User,
  Mail,
  Heart,
  Plus,
  ArrowRight,
  Eye,
  Trash2,
  Ban,
  CheckCircle2,
  X,
  Phone,
  Lock,
  FileSpreadsheet,
  ShieldCheck,
  Download,
  Sprout,
  Users,
  HeartPulse,
  UserX,
  Apple,
  AlertCircle,
  BarChart2,
  Tag,
  Edit3,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Patient } from "@/features/patients";
import { buildClinicalRecordDraft } from "@/features/patients/clinical-record";
import { TagInput } from "@/components/ui/TagInput";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
import { TableLoadingRows } from "@/components/ui/TableLoadingRows";
import { MobileCardLoadingList } from "@/components/ui/MobileCardLoadingList";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { exportPatientsToExcel } from "@/features/pdf/patientsExcelExport";
import { useSubscription } from "@/context/SubscriptionContext";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ShareFormModal } from "@/features/patients-intake/components/ShareFormModal";
import { PrivacyInfoModal } from "@/features/patients/components/PrivacyInfoModal";
import { ClinicalRecordPreviewModal } from "@/features/patients/components/ClinicalRecordPreviewModal";
import { buildClinicalRecordPdfData } from "@/features/patients/utils/clinical-record-export";
import { isGuestMode } from "@/lib/demo-local-api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatRestrictions(restrictions?: string[], primaryCondition?: string) {
  if (!Array.isArray(restrictions) || restrictions.length === 0) {
    return [];
  }

  const trimmed = restrictions.map((restriction) => restriction.trim()).filter(Boolean);
  if (primaryCondition) {
    return trimmed.filter((r) => r.toLowerCase() !== primaryCondition.toLowerCase());
  }
  return trimmed;
}

export default function PatientsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [classificationTags, setClassificationTags] = useState<string[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const isGuest = isGuestMode();
  const [patientPreview, setPatientPreview] = useState<Patient | null>(null);
  const [clinicalRecordPatient, setClinicalRecordPatient] = useState<Patient | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const { currentPlan, entitlements, usage, isLoading: isSubscriptionLoading, isDeveloper, refreshSubscription } = useSubscription();

  const rawPatientLimit = currentPlan?.entitlements?.["patients.total.limit"] ??
    currentPlan?.entitlements?.["patients.active.limit"] ??
    entitlements["patients.total.limit"] ?? entitlements["patients.active.limit"];
  const patientLimit = typeof rawPatientLimit === "number" ? rawPatientLimit : undefined;
  useScrollLock(isDeleteModalOpen);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDebouncedSearchTerm(searchTerm);
      },
      searchTerm ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    void refreshSubscription({ silent: true });
  }, [refreshSubscription]);

  const { patients, meta, isLoading, isFetching, togglePatientStatus, deletePatient, isDeleting } =
    usePatients({
      page,
      searchTerm: debouncedSearchTerm,
      activeTab: showInactive ? "Todos" : "Activos",
      classificationTags,
      startDateFilter: "",
    });
  const patientDataPending = isLoading || isFetching;

  const availableTagSuggestions = useMemo(() => {
    const tagSet = new Set<string>();
    DEFAULT_CONSTRAINTS.forEach((c) => tagSet.add(c.label));
    patients.forEach((p) => {
      p.tags?.forEach((t) => tagSet.add(t));
      p.dietRestrictions?.forEach((r) => tagSet.add(r));
    });
    return Array.from(tagSet);
  }, [patients]);
  const isDefaultView = !showInactive && !debouncedSearchTerm && classificationTags.length === 0;
  const authoritativePatientCount = isDefaultView && !isLoading && !isFetching ? meta.total : undefined;
  const hasAuthoritativePatientCount =
    authoritativePatientCount !== undefined || typeof usage?.patientsActive === "number";
  const patientsUsed = authoritativePatientCount ?? usage?.patientsActive ?? meta.total;

  const handleTogglePatientStatus = async (patient: Patient) => {
    const newStatus = patient.status === "Active" ? "Inactive" : "Active";
    try {
      await togglePatientStatus(patient.id, newStatus);
      toast.success(
        `Estado actualizado a ${newStatus === "Active" ? "Activo" : "Inactivo"}`,
      );
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      await deletePatient(patientToDelete.id);
      toast.success("Paciente eliminado correctamente");
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    } catch {
      toast.error("Error al eliminar el paciente");
    }
  };

  const handleExportPatientsExcel = async () => {
    if (patients.length === 0) {
      toast.error("No hay pacientes para exportar");
      return;
    }
    setIsExporting(true);
    try {
      await exportPatientsToExcel(patients);
      toast.success("Excel de pacientes descargado");
    } catch {
      toast.error("Error al exportar pacientes");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClinicalRecord = async (patient: Patient) => {
    setIsExporting(true);
    try {
      const response = await fetchApi(`/patients/${patient.id}/clinical-record`);
      const clinicalRecord = response.ok ? await response.json() : null;
      const clinicalRecordDraft = buildClinicalRecordDraft(patient, clinicalRecord);
      const { downloadClinicalRecordPdf } = await import("@/features/pdf/clinicalRecordPdfExport");
      await downloadClinicalRecordPdf(buildClinicalRecordPdfData(patient, clinicalRecordDraft));
      toast.success("Ficha clínica descargada");
    } catch (error) {
      console.error("Clinical Record PDF Error:", error);
      toast.error("Error al generar la ficha clínica");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenClinicalRecordPreview = (patient: Patient) => {
    setClinicalRecordPatient(patient);
  };

  const closeClinicalRecordModal = () => {
    setClinicalRecordPatient(null);
  };

  const filteredPatients = patients;
  const rawActivePatientLimit = currentPlan?.entitlements?.["patients.total.limit"] ??
    currentPlan?.entitlements?.["patients.active.limit"];
  const activePatientLimit = isDeveloper
    ? Number.POSITIVE_INFINITY
    : typeof rawActivePatientLimit === "number"
      ? (rawActivePatientLimit < 0 ? Number.POSITIVE_INFINITY : rawActivePatientLimit)
      : undefined;
  const patientCreationBlocked =
    isSubscriptionLoading || !hasAuthoritativePatientCount || activePatientLimit === undefined;
  const isPatientLimitReached =
    !patientCreationBlocked &&
    Number.isFinite(activePatientLimit) &&
    typeof patientsUsed === "number" &&
    patientsUsed >= activePatientLimit;

  const openPatientPreview = (patient: Patient) => {
    setPatientPreview(patient);
  };

  const columns: Column<Patient>[] = [
    {
      header: "Identidad del paciente",
      render: (patient: Patient) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#F0F5DF] flex items-center justify-center text-[#668E20] font-bold text-sm shrink-0 border border-[#DDE7B8]">
            {patient.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 leading-tight mb-0.5 truncate group-hover:text-[#668E20] transition-colors">
              {patient.fullName}
            </div>
            <div className="text-xs text-slate-500 font-normal truncate">
              {patient.email || "Sin correo registrado"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Documento / ID",
      render: (patient: Patient) => (
        <span className="text-sm font-medium text-slate-700">
          {patient.documentId || "---"}
        </span>
      ),
    },
    {
      header: "Restricciones médicas",
      render: (patient: Patient) => {
        const restrictions = formatRestrictions(
          patient.dietRestrictions,
          patient.primaryCondition,
        );
        const visibleRestrictions = restrictions.slice(0, 2);
        const remainingRestrictions = restrictions.length - visibleRestrictions.length;

        return restrictions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleRestrictions.map((restriction) => (
              <span
                key={restriction}
                className="inline-flex items-center gap-1 rounded-md bg-[#FEFCE8] border border-[#FEF08A] px-2 py-0.5 text-xs font-medium text-[#854D0E]"
              >
                <Tag className="w-3 h-3 text-[#A16207] shrink-0" />
                <span>{restriction}</span>
              </span>
            ))}
            {remainingRestrictions > 0 && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                +{remainingRestrictions}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs font-normal text-slate-400 italic">
            Sin restricciones
          </span>
        );
      },
    },
    {
      header: "Estado",
      render: (patient: Patient) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={patientDataPending}
            onClick={() => handleTogglePatientStatus(patient)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
              patient.status !== "Inactive"
                ? "bg-[#F0F5DF] text-[#668E20] border-[#DDE7B8] hover:bg-[#E8EFCB]"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80",
            )}
            title={patient.status !== "Inactive" ? "Clic para pausar paciente" : "Clic para activar paciente"}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                patient.status !== "Inactive" ? "bg-[#86A83C]" : "bg-slate-400",
              )}
            />
            <span>{patient.status !== "Inactive" ? "Activo" : "Inactivo"}</span>
          </button>
        </div>
      ),
    },
    {
      header: "Acciones",
      className: "text-right",
      render: (patient: Patient) => (
        <div
          className="flex items-center justify-end gap-1.5 text-slate-400"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleOpenClinicalRecordPreview(patient)}
            className="p-1.5 text-slate-400 hover:text-[#668E20] hover:bg-[#F0F5DF] rounded-lg transition-colors cursor-pointer"
            title="Vista previa de ficha clínica (PDF)"
          >
            <FileText className="w-4 h-4 text-[#86A83C]" />
          </button>
          <button
            onClick={() => openPatientPreview(patient)}
            disabled={patientDataPending}
            className="p-1.5 text-slate-400 hover:text-[#668E20] hover:bg-[#F0F5DF] rounded-lg transition-colors cursor-pointer"
            title="Ver paciente"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout
      title="Mis Pacientes"
      description={
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
            <Sprout className="w-4 h-4 text-[#86A83C]" />
            <span className="tracking-wider uppercase text-[10px] font-bold">Gestión Clínica Nutricional</span>
          </div>
          <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
            Gestiona a tus pacientes: consulta su progreso clínico, asigna pautas nutricionales y administra su información médica.
          </p>
        </div>
      }
      rightContent={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Fila secundaria: Datos y Privacidad + Excel */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Datos y privacidad */}
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              title="Protección y privacidad de datos clínicos"
              className="flex-1 sm:flex-initial h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              aria-label="Ver información de protección y privacidad"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#626573]" />
              <span className="hidden sm:inline">Datos y privacidad</span>
              <span className="sm:hidden">Privacidad</span>
            </button>

            {/* Separador vertical en desktop */}
            <div className="hidden sm:block w-px h-6 bg-[#E9E5E7] shrink-0" />

            {/* Exportar Excel */}
            <button
              type="button"
              disabled={isExporting || patientDataPending}
              onClick={handleExportPatientsExcel}
              className="flex-1 sm:flex-initial h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="h-4 w-4 border-2 border-slate-300 border-t-[#20212B] rounded-full animate-spin shrink-0" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#626573]" />
              )}
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>

          {/* Botón principal Crear paciente (centrado y full-width en móvil) */}
          <button
            type="button"
            onClick={() => {
              if (!isGuest) {
                if (patientCreationBlocked) {
                  toast.info("Estamos verificando el uso de tu plan. Intenta nuevamente en unos segundos.");
                  return;
                }
                if (isPatientLimitReached) {
                  toast.error("Has alcanzado el límite de pacientes activos de tu plan.");
                  return;
                }
              }
              router.push("/dashboard/pacientes/new");
            }}
            disabled={!isGuest && (patientCreationBlocked || isPatientLimitReached)}
            className="h-11 px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-[#86A83C]/20 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {!isGuest && (isSubscriptionLoading || !hasAuthoritativePatientCount)
                ? "Verificando..."
                : !isGuest && isPatientLimitReached
                  ? "Límite alcanzado"
                  : "Crear paciente"}
            </span>
          </button>
        </div>
      }
      className="pb-16 relative"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Resumen simple y compacto (reemplaza banner masivo para móviles) */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-6 bg-white border border-[#E9E5E7] rounded-xl px-4 py-2.5 shadow-2xs text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#86A83C]" />
            <span className="text-[#626573] font-medium">Activos:</span>
            <strong className="text-[#20212B] font-bold">{meta.activeCount}</strong>
          </div>
          <div className="h-3.5 w-px bg-[#E9E5E7]" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[#626573] font-medium">Inactivos:</span>
            <strong className="text-[#20212B] font-bold">{meta.inactiveCount}</strong>
          </div>
          <div className="hidden sm:block h-3.5 w-px bg-[#E9E5E7]" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[#626573] font-medium">Total registrados:</span>
            <strong className="text-[#20212B] font-bold">{meta.total}</strong>
          </div>
        </div>

        {/* Buscador y Filtros (Section 7) — Una única fila horizontal bajo los indicadores */}
        <div className="space-y-2">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Buscador ancho (~50% del espacio, 44px de alto) */}
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
              <input
                type="search"
                placeholder="Buscar por nombre, RUT o correo electrónico..."
                className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-4 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#86A83C]/15 focus:border-[#86A83C] transition-all shadow-2xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filtros a la derecha: Etiquetas, Compartir y Mostrar inactivos */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="w-full sm:w-56">
                <TagInput
                  value={classificationTags}
                  onChange={(tags) => {
                    setClassificationTags(tags);
                    setPage(1);
                  }}
                  suggestions={availableTagSuggestions}
                  placeholder="Filtrar por etiqueta..."
                  className="h-11 rounded-xl bg-white border border-[#E9E5E7] text-sm text-[#20212B] shadow-2xs"
                  singleSelect
                  tagsAbsolute
                  helperText=""
                />
              </div>

              <button
                type="button"
                disabled
                onClick={() => setIsShareModalOpen(true)}
                className="h-11 px-4 rounded-xl border border-[#E9E5E7] bg-white text-xs sm:text-sm font-medium text-[#626573] hover:bg-[#FDFBFA] transition-colors flex items-center justify-center gap-2 shrink-0 cursor-not-allowed shadow-2xs"
                title="Próximamente disponible"
              >
                <Lock className="h-4 w-4 text-[#848792]" />
                <span className="whitespace-nowrap">Compartir formulario</span>
              </button>

              <label className="h-11 px-4 rounded-xl border border-[#E9E5E7] bg-white text-xs sm:text-sm font-medium text-[#626573] hover:bg-[#FDFBFA] transition-colors flex items-center gap-2.5 cursor-pointer select-none shrink-0 shadow-2xs">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => {
                    setShowInactive(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-[#86A83C] focus:ring-[#86A83C] accent-[#86A83C]"
                />
                <span className="whitespace-nowrap">Mostrar inactivos</span>
              </label>
            </div>
          </div>

          {/* Resumen pequeño de resultados debajo de los filtros */}
          <div className="px-1 text-xs text-[#626573] flex items-center gap-1.5">
            <span>
              Mostrando <strong className="font-semibold text-[#20212B]">{filteredPatients.length}</strong> de{" "}
              <strong className="font-semibold text-[#20212B]">{meta.total}</strong> pacientes (
              <span className="text-[#668E20] font-medium">{meta.activeCount} activos</span>,{" "}
              <span>{meta.inactiveCount} inactivos</span>)
            </span>
          </div>
        </div>

        {/* Tabla de Pacientes — Mismo componente RecordsTable y estilo que Consultas */}
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <RecordsTable
              columns={columns}
              data={filteredPatients}
              keyExtractor={(patient) => patient.id}
              isLoading={patientDataPending}
              loadingColumns={columns.length}
              onRowClick={(patient) => {
                if (!patientDataPending) {
                  router.push(`/dashboard/pacientes/${patient.id}`);
                }
              }}
              rowClassName="hover:bg-slate-50 transition-colors group cursor-pointer"
              emptyState={
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    Sin pacientes registrados
                  </p>
                </div>
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

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {patientDataPending ? (
              <MobileCardLoadingList rows={3} />
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => {
                const restrictions = formatRestrictions(
                  patient.dietRestrictions,
                  patient.primaryCondition,
                );
                return (
                  <div
                    key={patient.id}
                    onClick={() => {
                      if (!patientDataPending) {
                        router.push(`/dashboard/pacientes/${patient.id}`);
                      }
                    }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs active:scale-[0.99] transition-all space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-[#F0F5DF] flex items-center justify-center text-[#668E20] font-bold border border-[#DDE7B8] shrink-0">
                          {patient.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {patient.fullName}
                          </h3>
                          <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {patient.email || "Sin correo"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0",
                          patient.status !== "Inactive"
                            ? "bg-[#F0F5DF] text-[#668E20] border-[#DDE7B8]"
                            : "bg-slate-100 text-slate-600 border-slate-200",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            patient.status !== "Inactive" ? "bg-[#86A83C]" : "bg-slate-400",
                          )}
                        />
                        <span>{patient.status !== "Inactive" ? "Activo" : "Inactivo"}</span>
                      </span>
                    </div>

                    {restrictions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {restrictions.slice(0, 3).map((restriction) => (
                          <span
                            key={restriction}
                            className="inline-flex items-center gap-1 rounded-md bg-[#FEFCE8] border border-[#FEF08A] px-2 py-0.5 text-xs font-medium text-[#854D0E]"
                          >
                            <Tag className="w-3 h-3 text-[#A16207] shrink-0" />
                            <span>{restriction}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      className="flex items-center justify-between pt-2.5 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] font-semibold text-slate-400">
                        Acciones rápidas
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenClinicalRecordPreview(patient)}
                          className="p-2 text-slate-500 hover:text-[#668E20] bg-slate-50 hover:bg-[#F0F5DF] rounded-xl transition-all cursor-pointer"
                          title="Vista previa de ficha clínica (PDF)"
                          aria-label="Vista previa de ficha clínica (PDF)"
                        >
                          <FileText className="w-4 h-4 text-[#86A83C]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openPatientPreview(patient)}
                          className="p-2 text-slate-500 hover:text-[#668E20] bg-slate-50 hover:bg-[#F0F5DF] rounded-xl transition-all cursor-pointer"
                          title="Vista previa de paciente"
                          aria-label="Vista previa de paciente"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">Sin pacientes registrados</p>
              </div>
            )}

            {meta.lastPage > 1 && (
              <div className="pt-2 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={meta.lastPage}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decoración inferior (Section 9) — Formas orgánicas verdes suaves en la esquina inferior derecha */}
      <div className="pointer-events-none fixed bottom-0 right-0 -z-0 overflow-hidden w-96 h-96 opacity-35 select-none">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-[#B0C76F]">
          <path d="M400 180 C 280 210, 200 300, 180 400 L 400 400 Z" fill="currentColor" fillOpacity="0.14" />
          <path d="M400 100 C 240 140, 140 260, 100 400 L 400 400 Z" fill="currentColor" fillOpacity="0.08" />
        </svg>
      </div>



      {/* Modal: Ver Paciente (Minimalista) */}
      <Modal
        isOpen={Boolean(patientPreview)}
        onClose={() => setPatientPreview(null)}
        title="Información del Paciente"
        description="Ficha de datos básicos y contacto"
        className="max-w-md"
      >
        {patientPreview && (
          <div className="space-y-4">
            {/* Cabecera del paciente */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F0F5DF]/60 border border-[#DDE7B8]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center text-[#668E20] font-extrabold text-base shrink-0 shadow-2xs">
                  {patientPreview.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-[#20212B] text-base leading-snug truncate">
                    {patientPreview.fullName}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 font-mono">
                    {patientPreview.documentId || "Sin documento"}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0",
                  patientPreview.status !== "Inactive"
                    ? "bg-[#F0F5DF] text-[#668E20] border-[#DDE7B8]"
                    : "bg-slate-100 text-slate-600 border-slate-200",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    patientPreview.status !== "Inactive" ? "bg-[#86A83C]" : "bg-slate-400",
                  )}
                />
                <span>{patientPreview.status !== "Inactive" ? "Activo" : "Inactivo"}</span>
              </span>
            </div>

            {/* Datos de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 min-w-0">
                <Mail className="w-4 h-4 text-[#86A83C] shrink-0" />
                <span className="truncate">{patientPreview.email || "Sin correo"}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <Phone className="w-4 h-4 text-[#86A83C] shrink-0" />
                <span>{patientPreview.phone || "Sin teléfono"}</span>
              </div>
            </div>

            {/* Métricas Corporales */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Edad</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {patientPreview.age ? `${patientPreview.age}a` : "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Sexo</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {patientPreview.gender || "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Altura</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {patientPreview.height ? `${patientPreview.height}cm` : "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Peso</span>
                <span className="text-sm font-extrabold text-[#668E20] mt-0.5 block">
                  {patientPreview.weight ? `${patientPreview.weight}kg` : "—"}
                </span>
              </div>
            </div>

            {/* Diagnóstico / Objetivo Clínico */}
            {(patientPreview.clinicalSummary || patientPreview.nutritionalFocus || patientPreview.primaryCondition) && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Diagnóstico / Objetivo
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {patientPreview.clinicalSummary || patientPreview.nutritionalFocus || patientPreview.primaryCondition}
                </p>
              </div>
            )}

            {/* Restricciones médicas */}
            {(() => {
              const restrictions = formatRestrictions(patientPreview.dietRestrictions, patientPreview.primaryCondition);
              if (restrictions.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Restricciones Alimentarias
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {restrictions.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#FEFCE8] border border-[#FEF08A] px-2 py-0.5 text-xs font-semibold text-[#854D0E]"
                      >
                        <Tag className="w-3 h-3 text-[#A16207]" />
                        <span>{r}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setPatientPreview(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pat = patientPreview;
                    setPatientPreview(null);
                    handleOpenClinicalRecordPreview(pat);
                  }}
                  className="h-10 px-3.5 rounded-xl bg-[#F0F5DF] hover:bg-[#E5ECCB] text-[#668E20] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#DDE7B8] transition-colors cursor-pointer"
                  title="Vista previa de ficha clínica (PDF)"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ficha clínica</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = patientPreview.id;
                    setPatientPreview(null);
                    router.push(`/dashboard/pacientes/${id}`);
                  }}
                  className="h-10 px-4 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#86A83C]/20 cursor-pointer"
                >
                  <span>Ver paciente completo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Vista Previa de Ficha Clínica (con PDF) */}
      <ClinicalRecordPreviewModal
        isOpen={Boolean(clinicalRecordPatient)}
        onClose={closeClinicalRecordModal}
        patient={clinicalRecordPatient}
        onNavigateToPatient={(patientId) => router.push(`/dashboard/pacientes/${patientId}`)}
      />

      {isShareModalOpen && (
        <ShareFormModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleDeletePatient}
        title="¿Eliminar paciente?"
        description={`¿Estás seguro de que deseas eliminar a ${patientToDelete?.fullName || "este paciente"}? Se eliminarán también todas sus consultas y no podrás recuperar esta información.`}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        variant="destructive"
      />

      <PrivacyInfoModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </ModuleLayout>

  );
}

