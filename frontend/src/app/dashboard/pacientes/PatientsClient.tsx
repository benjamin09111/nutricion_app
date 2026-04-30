"use client";

import { useState, useEffect } from "react";
import {
  Search,
  User,
  Calendar,
  Mail,
  Heart,
  Plus,
  RotateCcw,
  ArrowRight,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Ban,
  CheckCircle2,
  X,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Patient, PatientsResponse } from "@/features/patients";
import { TagInput } from "@/components/ui/TagInput";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import Cookies from "js-cookie";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { formatRut } from "@/lib/rut-utils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatRestrictions(restrictions?: string[]) {
  if (!Array.isArray(restrictions) || restrictions.length === 0) {
    return [];
  }

  return restrictions
    .map((restriction) => restriction.trim())
    .filter(Boolean);
}

type PatientTab = "Todos" | "Activos" | "Inactivos";

export default function PatientsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [documentIdFilter, setDocumentIdFilter] = useState("");
  const [classificationTags, setClassificationTags] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    filteredTotal: 0,
    activeCount: 0,
    inactiveCount: 0,
    lastPage: 1,
  });
  const [activeTab, setActiveTab] = useState<PatientTab>("Activos");
  const router = useRouter();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [patientPreview, setPatientPreview] = useState<Patient | null>(null);

  const handleDeleteConfirmed = async () => {
    if (!patientToDelete) return;
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/patients/${patientToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Paciente eliminado");
        fetchPatients(0);
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de de red");
    } finally {
      setIsDeleteConfirmOpen(false);
      setPatientToDelete(null);
    }
  };

  const togglePatientStatus = async (patient: Patient) => {
    const newStatus = patient.status === "Active" ? "Inactive" : "Active";
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/patients/${patient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        toast.success(`Estado actualizado a ${newStatus === "Active" ? "Activo" : "Inactivo"}`);
        fetchPatients(0);
      }
    } catch (e) {
      toast.error("Error al actualizar estado");
    }
  };

  const fetchPatients = async (retries = 3) => {
    setIsLoading(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(activeTab !== "Todos" && { status: activeTab }),
        ...(documentIdFilter && { documentId: documentIdFilter }),
        ...(classificationTags.length > 0 && {
          tags: classificationTags.join(","),
        }),
        ...(startDateFilter && { startDate: startDateFilter }),
      });

      const response = await fetchApi(`/patients?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result: PatientsResponse = await response.json();
        setPatients(result.data);
        setMeta(result.meta);
      }
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => fetchPatients(retries - 1), 2000);
      } else {
        console.warn("Backend no disponible para cargar pacientes.");
        toast.error("Error al conectar con el servidor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchPatients();
      },
      searchTerm ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    documentIdFilter,
    classificationTags,
    startDateFilter,
    page,
    activeTab,
  ]);

  const printJson = () => {
    console.group("📊 PATIENTS DATA");
    console.log("Pacientes:", patients);
    console.groupEnd();
    toast.info("JSON de pacientes impreso en consola.");
  };

  const filteredPatients = patients;

  const tabs: PatientTab[] = ["Todos", "Activos", "Inactivos"];

  const resetPatients = () => {
    setSearchTerm("");
    setShowFilters(false);
    setDocumentIdFilter("");
    setClassificationTags([]);
    setStartDateFilter("");
    setActiveTab("Activos");
    setPage(1);
    toast.info("Lista de pacientes reiniciada.");
  };

  const openPatientPreview = (patient: Patient) => {
    setPatientPreview(patient);
  };

  return (
    <ModuleLayout
      title="Mis Pacientes"
      description="Gestiona los expedientes y progreso de tus pacientes de forma profesional."
      className="pb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex p-1 bg-slate-100/80 rounded-2xl w-full lg:w-fit border border-slate-200/50 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={cn(
                "px-4 py-2 text-sm transition-all duration-200 cursor-pointer whitespace-nowrap flex-1 lg:flex-none font-bold",
                activeTab === tab
                  ? "text-emerald-700"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab === "Todos" && `Todos (${meta.total})`}
              {tab === "Activos" && `Activos (${meta.activeCount})`}
              {tab === "Inactivos" && `Inactivos (${meta.inactiveCount})`}
            </button>
          ))}
        </div>

        <Button
          onClick={() => router.push("/dashboard/pacientes/new")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-12 lg:h-10 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 w-full lg:w-fit group"
        >
          <Plus className="h-5 w-5 lg:h-4 lg:w-4 group-hover:rotate-90 transition-transform" aria-hidden="true" />
          <span className="text-sm">Nuevo Paciente</span>
        </Button>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 to-blue-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-white p-3 lg:p-4 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="pl-2">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="search"
                placeholder="Buscar por nombre, correo o documento..."
                className="h-10 text-sm border border-slate-200 bg-white focus-visible:border-emerald-500 placeholder:text-slate-400 font-medium"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              {isLoading && (
                <div className="pr-2">
                  <RotateCcw className="h-4 w-4 text-emerald-500 animate-spin" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters((current) => !current)}
                className="h-10 shrink-0 rounded-xl border-slate-200 px-4 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
              >
                {showFilters ? "Cerrar filtros" : "Abrir filtros"}
                {showFilters ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                  Rut / ID
                </label>
                <Input
                  type="text"
                  placeholder="Ej: 12.345.678-9"
                  value={documentIdFilter}
                  onChange={(e) => {
                    setDocumentIdFilter(formatRut(e.target.value));
                    setPage(1);
                  }}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                  Fecha Desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 pl-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                  Clasificación
                </label>
                <TagInput
                  value={classificationTags}
                  onChange={(tags) => {
                    setClassificationTags(tags);
                    setPage(1);
                  }}
                  fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                  placeholder="Etiquetas..."
                  className="rounded-xl bg-slate-50 border-slate-200 h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1 mb-2">
                  Mostrar Inhabilitados
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newStatus = activeTab === "Inactivos" ? "Activos" : "Inactivos";
                      setActiveTab(newStatus);
                      setPage(1);
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                      activeTab === "Inactivos" ? "bg-rose-500" : "bg-slate-300"
                    )}
                    role="switch"
                    aria-checked={activeTab === "Inactivos"}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      activeTab === "Inactivos" ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                  <span className={cn("text-xs font-bold", activeTab === "Inactivos" ? "text-rose-600" : "text-slate-500")}>
                    {activeTab === "Inactivos" ? "Inhabilitados" : "Solo Habilitados"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {(searchTerm || documentIdFilter || startDateFilter || classificationTags.length > 0) && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={resetPatients}
                className="h-8 px-3 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold uppercase tracking-wider"
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <User className="h-4 w-4" />
            Total:{" "}
            <span className="text-emerald-600 font-semibold">{meta.total}</span>{" "}
            pacientes registrados
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white shadow-xl shadow-slate-200/50 border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-380px)] custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Identidad del Paciente</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento / Id</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Restricciones Médicas</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50 last:border-0">
                      <td className="px-6 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-100 rounded-full" /><div className="space-y-2"><div className="h-4 w-32 bg-slate-100 rounded" /><div className="h-3 w-48 bg-slate-50 rounded" /></div></div></td>
                      <td className="px-6 py-6"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-6"><div className="h-10 w-44 bg-slate-100 rounded-2xl" /></td>
                      <td className="px-6 py-6"><div className="h-6 w-20 bg-slate-100 rounded-full mx-auto" /></td>
                      <td className="px-6 py-6"><div className="h-8 w-8 bg-slate-100 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => {
                    const restrictions = formatRestrictions(patient.dietRestrictions);
                    const visibleRestrictions = restrictions.slice(0, 2);
                    const remainingRestrictions = restrictions.length - visibleRestrictions.length;

                    return (
                    <tr 
                      key={patient.id} 
                      onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold border border-emerald-100 shadow-sm">
                              {patient.fullName.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900 leading-none mb-1">{patient.fullName}</div>
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{patient.email || "Sin correo"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center text-sm font-medium text-slate-600">{patient.documentId || "---"}</span>
                      </td>
                      <td className="px-6 py-4">
                        {restrictions.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 max-w-[280px]">
                            {visibleRestrictions.map((restriction) => (
                              <span
                                key={restriction}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
                              >
                                <Heart className="h-3 w-3" />
                                <span className="truncate max-w-[180px]">{restriction}</span>
                              </span>
                            ))}
                            {remainingRestrictions > 0 && (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                +{remainingRestrictions}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Sin restricciones</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => togglePatientStatus(patient)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                              patient.status !== "Inactive" ? "bg-emerald-500" : "bg-slate-300"
                            )}
                            role="switch"
                            aria-checked={patient.status !== "Inactive"}
                          >
                            <span className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                              patient.status !== "Inactive" ? "translate-x-4" : "translate-x-0"
                            )} />
                          </button>
                          <span className={cn("text-xs font-medium w-12 text-left", patient.status !== "Inactive" ? "text-emerald-700" : "text-slate-500")}>
                            {patient.status !== "Inactive" ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPatientPreview(patient)}
                            className="group relative p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Ver"
                          >
                            <Eye className="w-4.5 h-4.5" />
                            <span className="pointer-events-none absolute bottom-full right-0 mb-2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                              Ver
                            </span>
                          </button>
                          <button
                            onClick={() => togglePatientStatus(patient)}
                            className="group relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                            title={patient.status === "Active" ? "Inhabilitar" : "Habilitar"}
                          >
                            {patient.status === "Active" ? (
                              <Ban className="w-4.5 h-4.5 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                            )}
                            <span className="pointer-events-none absolute bottom-full right-0 mb-2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                              {patient.status === "Active" ? "Inhabilitar" : "Habilitar"}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled
                            className="group relative p-2.5 text-slate-300 bg-slate-50 rounded-xl transition-all cursor-not-allowed"
                            title="Descargar ficha"
                          >
                            <Download className="w-4.5 h-4.5" />
                            <span className="pointer-events-none absolute bottom-full right-0 mb-2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                              Descargar ficha
                            </span>
                          </button>
                          <button
                            onClick={() => { setPatientToDelete(patient.id); setIsDeleteConfirmOpen(true); }}
                            className="group relative p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                            <span className="pointer-events-none absolute bottom-full right-0 mb-2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                              Eliminar
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr><td colSpan={5} className="text-center py-20"><div className="flex flex-col items-center gap-4"><div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100"><User className="h-8 w-8 text-slate-300" /></div><p className="text-slate-500 font-medium">Sin pacientes registrados</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    <div className="h-3 w-1/2 bg-slate-50 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              const restrictions = formatRestrictions(patient.dietRestrictions);
              const visibleRestrictions = restrictions.slice(0, 2);
              const remainingRestrictions = restrictions.length - visibleRestrictions.length;

              return (
              <div 
                key={patient.id} 
                onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100">
                      {patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">{patient.fullName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {patient.email || "Sin correo"}
                      </p>
                    </div>
                  </div>
                  <div 
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                      patient.status !== "Inactive" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
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
                          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
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
                    <p className="text-xs font-medium text-slate-400">Sin restricciones</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="text-xs font-semibold text-slate-400">
                    ID: <span className="text-slate-600 ml-1">{patient.documentId || "---"}</span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openPatientPreview(patient)} className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg" title="Ver">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => togglePatientStatus(patient)}
                      className="p-2 bg-slate-50 rounded-lg"
                      title={patient.status === "Active" ? "Inhabilitar" : "Habilitar"}
                    >
                      {patient.status === "Active" ? (
                        <Ban className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                    <button type="button" disabled className="p-2 text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed" title="Descargar ficha">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setPatientToDelete(patient.id); setIsDeleteConfirmOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg ml-1 font-bold text-[10px] px-3 flex items-center gap-1 shadow-sm border border-emerald-100">
                      VER FICHA <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )})
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No se encontraron pacientes</p>
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

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleDeleteConfirmed}
        title="¿Eliminar paciente?"
        description="¿Estás seguro de que deseas eliminar este paciente? Todo su historial clínico será borrado."
        confirmText="Eliminar permanentemente"
        variant="destructive"
      />

      {patientPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-lg font-bold text-emerald-600">
                  {patientPreview.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{patientPreview.fullName}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold",
                      patientPreview.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                    )}>
                      {patientPreview.status === "Active" ? "Activo" : "Inactivo"}
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
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contacto</p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{patientPreview.email || "Sin correo"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{patientPreview.phone || "Sin telefono"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Perfil</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Genero</p>
                    <p className="mt-1 font-semibold">{patientPreview.gender || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Nacimiento</p>
                    <p className="mt-1 font-semibold">
                      {patientPreview.birthDate ? new Date(patientPreview.birthDate).toLocaleDateString("es-CL") : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Altura</p>
                    <p className="mt-1 font-semibold">{patientPreview.height ? `${patientPreview.height} cm` : "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Peso</p>
                    <p className="mt-1 font-semibold">{patientPreview.weight ? `${patientPreview.weight} kg` : "No registrado"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Restricciones</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formatRestrictions(patientPreview.dietRestrictions).length > 0 ? (
                    formatRestrictions(patientPreview.dietRestrictions).map((restriction) => (
                      <span
                        key={restriction}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
                      >
                        <Heart className="h-3 w-3" />
                        {restriction}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Sin restricciones registradas.</p>
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
                className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
              >
                Ver ficha
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
