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
import { UsageLimitBadge } from "@/components/shared/UsageLimitBadge";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
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
import { buildClinicalRecordPdfData } from "@/features/patients/utils/clinical-record-export";

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

  const [patientPreview, setPatientPreview] = useState<Patient | null>(null);
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
          <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#7c3aed] font-bold text-sm shrink-0">
            {patient.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 leading-tight mb-0.5 truncate group-hover:text-[#7c3aed] transition-colors">
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
            onClick={() => openPatientPreview(patient)}
            disabled={patientDataPending}
            className="p-1.5 text-slate-400 hover:text-[#7c3aed] hover:bg-purple-50/70 rounded-lg transition-colors cursor-pointer"
            title="Ver paciente"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExportClinicalRecord(patient)}
            className="p-1.5 text-slate-400 hover:text-[#668E20] hover:bg-[#F0F5DF] rounded-lg transition-colors cursor-pointer"
            title="Descargar ficha clínica PDF"
            disabled={isExporting || patientDataPending}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
            className="p-1.5 text-slate-400 hover:text-[#7c3aed] hover:bg-purple-50/70 rounded-lg transition-colors cursor-pointer"
            title="Editar / Ficha"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (patientDataPending) return;
              setPatientToDelete(patient);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg transition-colors cursor-pointer"
            title="Eliminar paciente"
          >
            <Trash2 className="w-4 h-4" />
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
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {patientsUsed !== undefined && (
            <UsageLimitBadge
              label="Pacientes"
              usage={patientsUsed}
              limit={patientLimit}
            />
          )}

          {/* Protección y privacidad */}
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            title="Protección y privacidad de datos clínicos"
            className="h-11 px-4 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] hover:bg-[#FDFBFA] text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs"
            aria-label="Ver información de protección y privacidad"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#626573]" />
            <span className="hidden sm:inline">Protección y privacidad</span>
            <span className="sm:hidden">Privacidad</span>
          </button>

          {/* Separador vertical */}
          <div className="hidden sm:block w-px h-6 bg-[#E9E5E7] shrink-0" />

          {/* Exportar Excel */}
          <button
            type="button"
            disabled={isExporting || patientDataPending}
            onClick={handleExportPatientsExcel}
            className="h-11 px-4 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] hover:bg-[#FDFBFA] text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-slate-300 border-t-[#20212B] rounded-full animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#626573]" />
            )}
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>

          {/* Botón principal Crear paciente */}
          <button
            type="button"
            onClick={() => {
              if (patientCreationBlocked) {
                toast.info("Estamos verificando el uso de tu plan. Intenta nuevamente en unos segundos.");
                return;
              }
              if (isPatientLimitReached) {
                toast.error("Has alcanzado el límite de pacientes activos de tu plan.");
                return;
              }
              router.push("/dashboard/pacientes/new");
            }}
            disabled={patientCreationBlocked || isPatientLimitReached}
            className="h-11 px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-[#86A83C]/20"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isSubscriptionLoading || !hasAuthoritativePatientCount
                ? "Verificando..."
                : isPatientLimitReached
                  ? "Límite alcanzado"
                  : "Crear paciente"}
            </span>
          </button>
        </div>
      }
      className="pb-16 relative"
    >
      <div className="space-y-6">
        {/* Barra de Indicadores (Section 6) — Superficie horizontal única con 3 columnas interiores */}
        <div className="relative overflow-hidden bg-white border border-[#E9E5E7] rounded-[18px] p-5 sm:p-6 min-h-[110px] shadow-2xs">
          {/* Decoración vegetal tenue en el extremo izquierdo mediante SVG */}
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
            {/* Activos */}
            <div className="flex items-center justify-between sm:px-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Activos</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {meta.activeCount}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-pulse" />
                <span>En seguimiento</span>
              </span>
            </div>

            {/* Inactivos */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Inactivos</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {meta.inactiveCount}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-[#626573] border border-slate-200">
                Pausados
              </span>
            </div>

            {/* Total registrados */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Total registrados</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {meta.total}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                100% cartera
              </span>
            </div>
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
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#7c3aed] font-bold border border-purple-200 shrink-0">
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
                      className="flex items-center justify-between pt-2 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-mono text-slate-500">
                        {patient.documentId || "---"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openPatientPreview(patient)}
                          className="p-2 text-slate-400 hover:text-[#7c3aed] bg-slate-50 hover:bg-purple-50 rounded-xl transition-all"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportClinicalRecord(patient)}
                          className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                          className="p-2 text-slate-400 hover:text-[#7c3aed] bg-slate-50 hover:bg-purple-50 rounded-xl transition-all"
                          title="Ficha"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPatientToDelete(patient);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
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



      {patientPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-lg font-bold text-indigo-600">
                  {patientPreview.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {patientPreview.fullName}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold",
                        patientPreview.status === "Active"
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                      )}
                    >
                      {patientPreview.status === "Active"
                        ? "Activo"
                        : "Inactivo"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {patientPreview.documentId || "Sin documento"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientPreview(null)}
                className="rounded-2xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Contacto
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="break-all">
                      {patientPreview.email || "Sin correo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{patientPreview.phone || "Sin teléfono"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Perfil
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Género
                    </p>
                    <p className="mt-1 font-semibold">
                      {patientPreview.gender || "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Nacimiento
                    </p>
                    <p className="mt-1 font-semibold">
                      {patientPreview.birthDate
                        ? formatDateOnlyForLocale(patientPreview.birthDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Edad
                    </p>
                    <p className="mt-1 font-semibold">
                      {patientPreview.age
                        ? `${patientPreview.age} años`
                        : "No registrada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Altura
                    </p>
                    <p className="mt-1 font-semibold">
                      {patientPreview.height
                        ? `${patientPreview.height} cm`
                        : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Peso
                    </p>
                    <p className="mt-1 font-semibold">
                      {patientPreview.weight
                        ? `${patientPreview.weight} kg`
                        : "No registrado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Restricciones
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(() => {
                    const restrictions = formatRestrictions(patientPreview.dietRestrictions, patientPreview.primaryCondition);
                    return restrictions.length > 0 ? (
                      restrictions.map(
                        (restriction) => (
                        <span
                          key={restriction}
                          className="inline-flex items-center gap-1 rounded-full border border-[#cbd83b]/25 bg-[#fffeec] px-2.5 py-1 text-[11px] font-semibold text-indigo-700"
                        >
                          <Heart className="h-3 w-3" />
                          {restriction}
                        </span>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-slate-400">
                      Sin restricciones registradas.
                    </p>
                  )
                })()}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
              <Button
                variant="ghost"
                onClick={() => setPatientPreview(null)}
                className="rounded-2xl px-5"
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setPatientPreview(null);
                  router.push(`/dashboard/pacientes/${patientPreview.id}`);
                }}
                className="rounded-2xl bg-indigo-600 px-5 text-white hover:bg-indigo-700"
              >
                Ver ficha
              </Button>
            </div>
          </div>
        </div>
      )}

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

