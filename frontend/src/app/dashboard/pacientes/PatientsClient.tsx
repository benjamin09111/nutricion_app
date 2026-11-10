"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Patient } from "@/features/patients";
import { buildClinicalRecordDraft } from "@/features/patients/clinical-record";
import { TagInput } from "@/components/ui/TagInput";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { UsageLimitBadge } from "@/components/shared/UsageLimitBadge";
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

  return (
    <ModuleLayout
      title="Mis Pacientes"
      description="Gestiona a tus pacientes: puedes crear, ver su progreso a través del tiempo, crear un espacio de comunicación privado y mucho más."
      rightContent={
        <div className="flex flex-wrap items-center gap-2">
          {patientsUsed !== undefined ? (
            <UsageLimitBadge
              label="Pacientes"
              usage={patientsUsed}
              limit={patientLimit}
            />
          ) : (
            <span className="text-xs font-semibold text-slate-400">Verificando uso...</span>
          )}
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            title="Protección y privacidad"
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-purple-200/90 text-[#7c3aed] bg-white hover:bg-purple-50/70 font-semibold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer shadow-xs"
            aria-label="Ver información de protección y privacidad"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#7c3aed]" />
            <span className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Protección y privacidad</span>
              <span className="sm:hidden">Privacidad</span>
            </span>
          </button>
          <Button
            variant="outline"
            disabled={isExporting || patientDataPending}
            onClick={handleExportPatientsExcel}
            className="h-9 sm:h-10 px-3 sm:px-5 rounded-xl border border-purple-200/90 text-[#7c3aed] bg-white hover:bg-purple-50/70 font-semibold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#7c3aed]" />
            )}
            <span className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </span>
          </Button>
        </div>
      }
      className="pb-8"
    >
      <div className="space-y-5 mb-6">
        {/* Metric Cards Row (Clean Pastel Minimalist matching the uploaded design) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Activos Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-[#f5effe] p-4 sm:p-5 transition-all">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 text-[#7c3aed] shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">Activos</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {meta.activeCount}
              </h3>
            </div>
          </div>

          {/* Inactivos Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-[#f8fafc] p-4 sm:p-5 transition-all">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 text-slate-400 shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Inactivos</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {meta.inactiveCount}
              </h3>
            </div>
          </div>

          {/* Total Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-[#f0f9f1] p-4 sm:p-5 transition-all">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 text-emerald-600 shadow-xs">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800/70">Total</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {meta.total}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Buscar por nombre, rut o correo..."
              className="h-10 border border-slate-200 bg-white pl-10 text-sm font-medium placeholder:text-slate-400 focus-visible:border-[#7c3aed] focus-visible:ring-[#7c3aed]/20 rounded-xl"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="min-w-0">
              <div className="relative">
                <TagInput
                  value={classificationTags}
                  onChange={(tags) => {
                    setClassificationTags(tags);
                    setPage(1);
                  }}
                  fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                  placeholder="Etiquetas"
                  className="h-10 rounded-xl bg-white border border-slate-200 text-sm"
                  singleSelect
                  tagsAbsolute
                  helperText=""
                />
                {patientDataPending && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 border-2 border-purple-200 border-t-[#7c3aed] rounded-full animate-spin" />
                  </div>
                )}
              </div>
          </div>

            <div className="flex w-full items-center gap-2 lg:w-auto lg:justify-end">
              <Button
                variant="outline"
                disabled
                onClick={() => setIsShareModalOpen(true)}
                className="h-10 px-3 sm:px-5 flex-1 sm:flex-initial justify-center rounded-xl border-slate-200 text-slate-400 bg-white font-medium transition-all gap-1.5 sm:gap-2 cursor-not-allowed hover:bg-slate-50"
              >
                <Lock className="h-4 w-4 shrink-0 text-slate-300" />
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  <span className="hidden sm:inline">Compartir formulario</span>
                  <span className="sm:hidden">Compartir</span>
                </span>
              </Button>

              <Button
                onClick={() => {
                   if (patientCreationBlocked) {
                     toast.info("Estamos verificando el uso de tu plan. Intenta nuevamente en unos segundos.");
                     return;
                   }
                   if (isPatientLimitReached) {
                    toast.error(
                      "Has alcanzado el límite de pacientes activos de tu plan.",
                    );
                    return;
                  }
                  router.push("/dashboard/pacientes/new");
                }}
                 disabled={patientCreationBlocked || isPatientLimitReached}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-4 sm:px-6 flex-1 sm:flex-initial justify-center rounded-xl shadow-xs transition-all gap-1.5 sm:gap-2 active:scale-95"
              >
                <Plus
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm whitespace-nowrap">
                   {isSubscriptionLoading || !hasAuthoritativePatientCount
                     ? "Verificando límite..."
                     : isPatientLimitReached
                       ? "Límite alcanzado"
                       : "Crear paciente"}
                </span>
              </Button>
            </div>
        </div>

         <div className="flex flex-col items-start justify-between gap-3 px-1 py-1 sm:flex-row sm:items-center sm:gap-4 sm:px-2">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 min-w-0 flex-wrap">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              <strong className="text-[#7c3aed] font-semibold">{meta.activeCount}</strong> activos,{" "}
              <strong className="text-[#7c3aed] font-semibold">{meta.inactiveCount}</strong> inactivos.{" "}
              <span className="text-slate-400 font-normal">Total: </span>
              <strong className="text-slate-900 font-bold">{meta.total}</strong>
            </span>
          </p>

          <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[#7c3aed] focus:ring-[#7c3aed]"
            />
            <span>Mostrar inactivos</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80">
                <th
                  scope="col"
                  className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  Identidad del Paciente
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  Documento / Id
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  Restricciones Médicas
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientDataPending ? (
                <TableLoadingRows columns={5} rows={5} />
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const restrictions = formatRestrictions(
                    patient.dietRestrictions,
                    patient.primaryCondition,
                  );
                  const visibleRestrictions = restrictions.slice(0, 2);
                  const remainingRestrictions =
                    restrictions.length - visibleRestrictions.length;

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => {
                        if (!patientDataPending) {
                          router.push(`/dashboard/pacientes/${patient.id}`);
                        }
                      }}
                      className={cn(
                        "transition-colors group",
                        patientDataPending
                          ? "cursor-wait opacity-70"
                          : "cursor-pointer hover:bg-slate-50/60",
                      )}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#7c3aed] font-bold text-sm shrink-0">
                            {patient.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 leading-tight mb-0.5 truncate group-hover:text-[#7c3aed] transition-colors">
                              {patient.fullName}
                            </div>
                            <div className="text-xs text-slate-400 font-normal flex items-center gap-1.5 min-w-0">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {patient.email || "Sin correo"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-medium text-slate-700">
                          {patient.documentId || "---"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {restrictions.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {visibleRestrictions.map((restriction) => (
                              <span
                                key={restriction}
                                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-[#fef9c3] px-3 py-0.5 text-xs font-medium text-amber-900"
                              >
                                <span className="text-amber-700 text-xs font-normal">♡</span>
                                <span>{restriction}</span>
                              </span>
                            ))}
                            {remainingRestrictions > 0 && (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                                +{remainingRestrictions}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-normal text-slate-400">
                            Sin restricciones
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            type="button"
                            disabled={patientDataPending}
                            onClick={() => handleTogglePatientStatus(patient)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                              patient.status !== "Inactive"
                                ? "bg-[#7c3aed]"
                                : "bg-slate-300",
                            )}
                            role="switch"
                            aria-checked={patient.status !== "Inactive"}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                patient.status !== "Inactive"
                                  ? "translate-x-4"
                                  : "translate-x-0",
                              )}
                            />
                          </button>
                          <span
                            className={cn(
                              "text-xs font-semibold w-12 text-left",
                              patient.status !== "Inactive"
                                ? "text-[#7c3aed]"
                                : "text-slate-400",
                            )}
                          >
                            {patient.status !== "Inactive"
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            onClick={() => openPatientPreview(patient)}
                            disabled={patientDataPending}
                            className="p-1.5 text-slate-400 hover:text-[#7c3aed] hover:bg-purple-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportClinicalRecord(patient)}
                            className="p-1.5 text-slate-400 hover:text-[#7c3aed] hover:bg-purple-50 rounded-lg transition-colors"
                            title="Descargar ficha clínica PDF"
                            disabled={isExporting || patientDataPending}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePatientStatus(patient)}
                            disabled={patientDataPending}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={patient.status === "Active" ? "Inhabilitar paciente" : "Habilitar paciente"}
                          >
                            {patient.status === "Active" ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-[#7c3aed]" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (patientDataPending) return;
                              setPatientToDelete(patient);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar paciente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                        <User className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">
                        Sin pacientes registrados
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {patientDataPending ? (
            <MobileCardLoadingList rows={3} />
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              const restrictions = formatRestrictions(patient.dietRestrictions, patient.primaryCondition);
              const visibleRestrictions = restrictions.slice(0, 2);
              const remainingRestrictions =
                restrictions.length - visibleRestrictions.length;

              return (
                <div
                  key={patient.id}
                  onClick={() =>
                    router.push(`/dashboard/pacientes/${patient.id}`)
                  }
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 line-clamp-1">
                          {patient.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 min-w-0">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="break-all">
                            {patient.email || "Sin correo"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        patient.status !== "Inactive"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {patient.status !== "Inactive" ? "Activo" : "Inactivo"}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Restricciones Médicas
                    </p>
                    {restrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {visibleRestrictions.map((restriction) => (
                          <span
                            key={restriction}
                            className="inline-flex items-center gap-1 rounded-full border border-[#cbd83b]/25 bg-[#fffeec] px-2.5 py-1 text-[11px] font-semibold text-indigo-700"
                          >
                            <Heart className="h-3 w-3" />
                            {restriction}
                          </span>
                        ))}
                        {remainingRestrictions > 0 && (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            +{remainingRestrictions}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-400">
                        Sin restricciones
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-400">
                      ID:{" "}
                      <span className="text-slate-600 ml-1">
                        {patient.documentId || "---"}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between sm:justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openPatientPreview(patient)}
                          className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportClinicalRecord(patient)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 bg-slate-50 rounded-xl transition-all"
                          title="Descargar ficha clínica PDF"
                          disabled={isExporting}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePatientStatus(patient)}
                          className="p-2 text-slate-400 hover:bg-slate-100 bg-slate-50 rounded-xl transition-all"
                          title={
                            patient.status === "Active"
                              ? "Inhabilitar"
                              : "Habilitar"
                          }
                        >
                          {patient.status === "Active" ? (
                            <Ban className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setPatientToDelete(patient);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                          title="Eliminar paciente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/pacientes/${patient.id}`)
                        }
                        className="py-2 px-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm border border-indigo-100 cursor-pointer"
                      >
                        VER FICHA <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                No se encontraron pacientes
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

