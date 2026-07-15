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
  Link2,
  Lock,
  FileSpreadsheet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Patient } from "@/features/patients";
import { TagInput } from "@/components/ui/TagInput";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TableLoadingRows } from "@/components/ui/TableLoadingRows";
import { MobileCardLoadingList } from "@/components/ui/MobileCardLoadingList";
import { getApiUrl } from "@/lib/api-base";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { exportPatientsToExcel } from "@/features/pdf/patientsExcelExport";
import { useSubscription } from "@/context/SubscriptionContext";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ShareFormModal } from "@/features/patients-intake/components/ShareFormModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatRestrictions(restrictions?: string[]) {
  if (!Array.isArray(restrictions) || restrictions.length === 0) {
    return [];
  }

  return restrictions.map((restriction) => restriction.trim()).filter(Boolean);
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
  const { limit } = useSubscription();

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

  const { patients, meta, isLoading, togglePatientStatus, deletePatient, isDeleting } =
    usePatients({
      page,
      searchTerm: debouncedSearchTerm,
      activeTab: showInactive ? "Todos" : "Activos",
      classificationTags,
      startDateFilter: "",
    });

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
      exportPatientsToExcel(patients);
      toast.success("Excel de pacientes descargado");
    } catch {
      toast.error("Error al exportar pacientes");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPatients = patients;
  const activePatientLimit = limit("patients.active.limit");
  const isPatientLimitReached =
    Number.isFinite(activePatientLimit) &&
    meta.activeCount >= activePatientLimit;

  const openPatientPreview = (patient: Patient) => {
    setPatientPreview(patient);
  };

  return (
    <ModuleLayout
      title="Mis Pacientes"
      description="Gestiona a tus pacientes: puedes crear, ver su progreso a través del tiempo, crear un espacio de comunicación privado y mucho más."
      rightContent={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isExporting || isLoading}
            onClick={handleExportPatientsExcel}
            className="h-10 px-5 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium transition-all flex items-center gap-2"
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span className="text-sm whitespace-nowrap">Exportar Excel</span>
          </Button>
        </div>
      }
      className="pb-8"
    >
      <div className="space-y-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <div className="pl-2 shrink-0">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="search"
              placeholder="Buscar por nombre, rut o correo..."
              className="h-10 text-sm border border-slate-200 bg-white focus-visible:border-indigo-500 placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="w-full sm:w-[12rem] lg:w-[14rem]">
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
                />
                {isLoading && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              disabled
              onClick={() => setIsShareModalOpen(true)}
              className="h-10 px-5 rounded-xl border-indigo-200 text-indigo-400 bg-slate-50 font-medium transition-all gap-2 cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              <span className="text-sm whitespace-nowrap">Compartir formulario</span>
            </Button>

            <Button
              onClick={() => {
                if (isPatientLimitReached) {
                  toast.error(
                    "Has alcanzado el límite de pacientes activos de tu plan.",
                  );
                  return;
                }
                router.push("/dashboard/pacientes/new");
              }}
              disabled={isPatientLimitReached}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 px-6 rounded-xl shadow-sm transition-all gap-2"
            >
              <Plus
                className="h-4 w-4 group-hover:rotate-90 transition-transform"
                aria-hidden="true"
              />
              <span className="text-sm">
                {isPatientLimitReached ? "Límite alcanzado" : "Crear paciente"}
              </span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-1 py-2 sm:px-3">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 min-w-0 flex-wrap">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <strong className="text-indigo-600 font-semibold">{meta.activeCount}</strong> activos,{" "}
              <strong className="text-indigo-600 font-semibold">{meta.inactiveCount}</strong> inactivos.{" "}
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
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Mostrar inactivos</span>
          </label>
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
                    Identidad del Paciente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Documento / Id
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Restricciones Médicas
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Estado
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
                  <TableLoadingRows columns={5} rows={5} />
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => {
                    const restrictions = formatRestrictions(
                      patient.dietRestrictions,
                    );
                    const visibleRestrictions = restrictions.slice(0, 2);
                    const remainingRestrictions =
                      restrictions.length - visibleRestrictions.length;

                    return (
                      <tr
                        key={patient.id}
                        onClick={() =>
                          router.push(`/dashboard/pacientes/${patient.id}`)
                        }
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 shrink-0">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-100 shadow-sm">
                                {patient.fullName.charAt(0)}
                              </div>
                            </div>
                            <div className="ml-4 min-w-0">
                              <div className="text-sm font-semibold text-slate-900 leading-none mb-1 truncate">
                                {patient.fullName}
                              </div>
                              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 min-w-0">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">
                                  {patient.email || "Sin correo"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center text-sm font-medium text-slate-600">
                            {patient.documentId || "---"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {restrictions.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2 max-w-[280px]">
                              {visibleRestrictions.map((restriction) => (
                                <span
                                  key={restriction}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#cbd83b]/25 bg-[#fffeec] px-2.5 py-1 text-[11px] font-semibold text-indigo-700"
                                >
                                  <Heart className="h-3 w-3 text-emerald-600" />
                                  <span className="truncate max-w-[180px]">
                                    {restriction}
                                  </span>
                                </span>
                              ))}
                              {remainingRestrictions > 0 && (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                  +{remainingRestrictions}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              Sin restricciones
                            </span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePatientStatus(patient)}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                patient.status !== "Inactive"
                                  ? "bg-indigo-500"
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
                                "text-xs font-medium w-12 text-left",
                                patient.status !== "Inactive"
                                  ? "text-indigo-700"
                                  : "text-slate-500",
                              )}
                            >
                              {patient.status !== "Inactive"
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openPatientPreview(patient)}
                              className="group relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Ver detalles"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleTogglePatientStatus(patient)}
                              className="group relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                              title={patient.status === "Active" ? "Inhabilitar paciente" : "Habilitar paciente"}
                            >
                              {patient.status === "Active" ? (
                                <Ban className="w-4.5 h-4.5 text-emerald-600" />
                              ) : (
                                <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setPatientToDelete(patient);
                                setIsDeleteModalOpen(true);
                              }}
                              className="group relative p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Eliminar paciente"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
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
</div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {isLoading ? (
            <MobileCardLoadingList rows={3} />
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              const restrictions = formatRestrictions(patient.dietRestrictions);
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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="text-xs font-semibold text-slate-400">
                      ID:{" "}
                      <span className="text-slate-600 ml-1">
                        {patient.documentId || "---"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openPatientPreview(patient)}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePatientStatus(patient)}
                        className="p-2 bg-slate-50 rounded-lg"
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
                        className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg"
                        title="Eliminar paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/pacientes/${patient.id}`)
                        }
                        className="p-2 text-indigo-600 bg-indigo-50 rounded-lg ml-1 font-bold text-[10px] px-3 flex items-center gap-1 shadow-sm border border-indigo-100"
                      >
                        VER FICHA <ArrowRight className="w-3 h-3" />
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
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
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
                        ? new Date(patientPreview.birthDate).toLocaleDateString(
                            "es-CL",
                          )
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
                  {formatRestrictions(patientPreview.dietRestrictions).length >
                  0 ? (
                    formatRestrictions(patientPreview.dietRestrictions).map(
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
                  )}
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
    </ModuleLayout>
  );
}

