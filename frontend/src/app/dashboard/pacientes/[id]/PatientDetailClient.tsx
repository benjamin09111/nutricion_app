"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ShieldCheck,
  Bell,
  Lock,
  Link2,
  FileText,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Copy,
  ExternalLink,
  Send,
  CheckCircle2,
  X as CloseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { fetchApi } from "@/lib/api-base";
import { formatRut } from "@/lib/rut-utils";
import {
  calculateBMI,
  calculateGET,
  getIdealWeightRange,
  calculateAge,
  isPediatric,
} from "@/lib/nutrition-formulas";

// Custom Hook & Components
import { Patient } from "@/features/patients";
import { usePatientDetailState, TabType } from "@/features/patients/hooks/usePatientDetailState";
import { PatientGeneralTab, ACTIVITY_LEVEL_OPTIONS } from "@/features/patients/components/PatientGeneralTab";
import { PatientConsultationsTab } from "@/features/patients/components/PatientConsultationsTab";
import { PatientProgressTab } from "@/features/patients/components/PatientProgressTab";
import { PatientAcompanamientoTab } from "@/features/patients/components/PatientAcompanamientoTab";
import { PatientCreationsTab } from "@/features/patients/components/PatientCreationsTab";
import { cn } from "@/features/patients/utils/patient-helpers";

interface PatientDetailClientProps {
  id: string;
}

export default function PatientDetailClient({ id }: PatientDetailClientProps) {
  useEffect(() => {
    console.log("!!! PatientDetailClient LOADED - VERSION 3 MODULAR !!!");
  }, []);

  const router = useRouter();
  const state = usePatientDetailState({ id });

  if (state.isLoading && !state.patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-xs">
          Cargando expediente...
        </p>
      </div>
    );
  }

  if (!state.patient) return null;

  const { patient, isEditing, editForm } = state;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24 animate-in fade-in duration-700 relative">
      {/* Sticky Right Sidebar Actions */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4 animate-in slide-in-from-right-8 duration-500">
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/50 flex flex-col gap-3">
          {isEditing ? (
            <>
              <button
                onClick={state.handleSaveClick}
                className="group relative p-4 bg-emerald-600 text-white rounded-[24px] hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-emerald-200 cursor-pointer"
                title="Guardar Cambios"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Guardar cambios
                </span>
              </button>
              <button
                onClick={() => {
                  state.setIsEditing(false);
                  state.setEditForm({ ...patient });
                }}
                className="group relative p-4 bg-rose-50 text-rose-500 rounded-[24px] hover:bg-rose-100 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
                title="Cancelar Edición"
              >
                <CloseIcon className="w-6 h-6" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Cancelar
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  router.push(
                    "/dashboard/consultas/nueva?patientId=" + patient.id,
                  )
                }
                className="group relative p-4 bg-emerald-600 text-white rounded-[24px] hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-emerald-200 cursor-pointer"
                title="Nueva Consulta"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Nueva consulta
                </span>
              </button>
              <button
                onClick={() => state.setIsPortalNotificationModalOpen(true)}
                className="group relative p-4 bg-indigo-500 text-white rounded-[24px] hover:bg-indigo-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-200 cursor-pointer"
                title="Enviar Notificación"
              >
                <Bell className="w-6 h-6" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Enviar notificación
                </span>
              </button>
              <button
                disabled
                className="group relative p-4 bg-slate-50 text-slate-300 rounded-[24px] cursor-not-allowed border border-slate-100"
                title="Subir Examen (Próximamente)"
              >
                <FileText className="w-6 h-6" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Subir examen
                </span>
              </button>
              <button
                onClick={() => {
                  toast.info("Ficha clínica - Próximamente disponible");
                }}
                className="group relative p-4 bg-indigo-50 text-indigo-500 rounded-[24px] hover:bg-indigo-100 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
                title="Descargar Ficha Clínica"
              >
                <FileText className="w-6 h-6" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Ficha clínica
                </span>
              </button>
              <div className="h-px bg-slate-100 mx-2 my-1" />
              <button
                onClick={state.handleEdit}
                className="group relative p-4 bg-white text-slate-600 rounded-[24px] border border-slate-200 hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
                title="Editar Perfil"
              >
                <Edit2 className="w-6 h-6" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  Editar perfil
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header & Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1 lg:px-0">
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => router.push("/dashboard/pacientes")}
            className="group p-2.5 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            {patient.status === "Inactive" && (
              <div className="flex items-center gap-2 mb-1.5 px-3 py-0.5 bg-slate-100 text-slate-500 rounded-lg w-fit border border-slate-200 animate-in slide-in-from-left duration-300">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Paciente Inactivo
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-0.5">
              <div
                onClick={state.toggleStatus}
                className={cn(
                  "w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-125 border-2",
                  patient.status !== "Inactive"
                    ? "bg-emerald-500 border-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    : "bg-slate-300 border-slate-100",
                )}
                title={
                  patient.status !== "Inactive"
                    ? "Paciente Activo"
                    : "Paciente Inactivo"
                }
              />
              <h1
                className={cn(
                  "text-xl font-bold transition-all",
                  patient.status === "Inactive"
                    ? "text-slate-400"
                    : "text-slate-900",
                )}
              >
                {isEditing ? (
                  <Input
                    value={editForm.fullName || ""}
                    onChange={(e) => state.updateField("fullName", e.target.value)}
                    className="bg-slate-50 border-none font-bold text-xl h-10 p-0 focus:bg-transparent"
                  />
                ) : (
                  patient.fullName
                )}
              </h1>
            </div>
            <p className="text-slate-400 font-bold text-[10px] flex items-center gap-1.5">
              EXPEDIENTE INTEGRADO <ChevronRight className="w-3 h-3" />{" "}
              {patient.documentId || "SIN ID"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          {isEditing ? (
            <>
              <Button
                onClick={() => state.setIsEditing(false)}
                variant="ghost"
                className="flex-1 sm:flex-none rounded-2xl h-10 px-4 text-slate-400 font-semibold text-xs"
              >
                <CloseIcon className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={state.handleSaveClick}
                className="flex-2 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-6 rounded-2xl shadow-sm transition-all active:scale-95"
              >
                <Save className="w-4 h-4 mr-2" />
                GUARDAR
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={state.handleAutomaticNutritionRecalculation}
                disabled={state.isAutomaticNutritionLoading}
                variant="outline"
                className="h-9 px-4 rounded-2xl border-amber-100 text-amber-700 bg-amber-50/70 hover:bg-amber-50 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {state.isAutomaticNutritionLoading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-600/20 border-t-amber-600 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Cálculos automáticos
              </Button>

              <Button
                onClick={() => {
                  state.setGeneratedPortalLink("");
                  state.setGeneratedPortalCode("");
                  state.setIsPortalInviteModalOpen(true);
                }}
                variant="outline"
                data-tutorial-id="patient-portal-button"
                className="h-9 px-4 rounded-2xl border-emerald-100 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-50 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                Portal paciente
              </Button>

              <Button
                onClick={() => {
                  toast.info("Ficha clínica - Próximamente disponible");
                }}
                variant="outline"
                className="h-9 px-4 rounded-2xl border-indigo-100 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-50 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Ficha clínica
              </Button>

              {/* Visible on Mobile/Tablet only, hidden on XL where sidebar exists */}
              <div className="xl:hidden flex items-center gap-1.5">
                <Button
                  onClick={() =>
                    router.push(
                      "/dashboard/consultas/nueva?patientId=" + patient.id,
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 px-3 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  CONSULTA
                </Button>
                <Button
                  onClick={() => state.setIsPortalNotificationModalOpen(true)}
                  variant="outline"
                  className="h-9 px-3 rounded-2xl border-indigo-100 text-indigo-700 bg-[#fffeec]/80 hover:bg-[#fffeec] font-semibold transition-all active:scale-95 text-xs cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={state.handleEdit}
                  variant="outline"
                  className="h-9 px-3 rounded-2xl border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-semibold transition-all active:scale-95 text-xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Peso", value: patient.weight, unit: "kg", field: "weight" },
          {
            label: "Altura",
            value: patient.height,
            unit: "cm",
            field: "height",
          },
          {
            label: "Edad",
            value: patient.birthDate ? calculateAge(patient.birthDate) : "—",
            unit: "años",
            field: "age",
          },
          { label: "Sexo", value: patient.gender, field: "gender" },
          {
            label: "RUT",
            value: patient.documentId || "—",
            field: "documentId",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1.5 group hover:border-slate-200 transition-all"
          >
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {stat.label}
            </p>
            <div className="text-base font-bold text-slate-900 flex items-baseline gap-0.5">
              {isEditing && stat.field ? (
                stat.field === "gender" ? (
                  <select
                    value={editForm.gender || ""}
                    onChange={(e) => state.updateField("gender", e.target.value)}
                    className="w-full h-8 text-xs border-none bg-slate-50 font-semibold p-1 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:outline-none cursor-pointer"
                  >
                    <option value="">—</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                ) : (
                  <Input
                    type={
                      stat.field === "weight" || stat.field === "height"
                        ? "number"
                        : "text"
                    }
                    step="any"
                    value={
                      ((editForm as Record<string, any>)[stat.field] as
                        | string
                        | number) || ""
                    }
                    onChange={(e) => {
                      let val = e.target.value;
                      if (stat.field === "documentId") val = formatRut(val);
                      state.updateField(stat.field as keyof Patient, val);
                    }}
                    className="h-8 border-none bg-slate-50 font-semibold p-1 text-sm"
                  />
                )
              ) : (
                <>
                  {stat.value}
                  {stat.unit && (
                    <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                      {stat.unit}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Panel de Cálculo Nutricional Automático */}
      <div
        key={state.recalcKey}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {(() => {
          const w = isEditing
            ? Number(editForm.weight) || patient.weight
            : patient.weight;
          const h = isEditing
            ? Number(editForm.height) || patient.height
            : patient.height;
          const g = isEditing
            ? editForm.gender || patient.gender
            : patient.gender;
          const bd = isEditing
            ? editForm.birthDate || patient.birthDate
            : patient.birthDate;
          const al = state.getCurrentActivityLevel();
          const bmi = calculateBMI(w, h);
          const idealWeight = getIdealWeightRange(h);
          const get = calculateGET(
            g === "Masculino" || g === "Femenino" ? g : "Femenino",
            w || 0,
            h || 0,
            calculateAge(bd) || 30,
            al,
            "mifflin-st-jeor",
          );
          const isKid = isPediatric(bd);
          const factorLabel =
            ACTIVITY_LEVEL_OPTIONS.find((o) => o.key === al)?.label ||
            "Sedentario";

          return (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">IMC</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Índice de Masa Corporal
                  </p>
                </div>
                {bmi ? (
                  <div>
                    <p className="text-xl font-bold text-slate-900">
                      {bmi.bmi}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        kg/m²
                      </span>
                    </p>
                    <span
                      className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: bmi.color }}
                    >
                      {bmi.classification}
                    </span>
                    {idealWeight && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Rango ideal: {idealWeight.min} – {idealWeight.max} kg
                      </p>
                    )}
                    {isKid && (
                      <p className="mt-1 text-[11px] text-amber-600 font-medium">
                        Pediátrico — usar curvas OMS
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Ingresa peso y talla del paciente.
                  </p>
                )}
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sm:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600">
                      GET
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Gasto Energético Total
                  </p>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => state.setRecalcKey((k) => k + 1)}
                      className="ml-auto text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Recalcular
                    </button>
                  )}
                  <span className="text-[10px] font-medium text-slate-400 ml-auto">
                    Mifflin-St Jeor ·{" "}
                    {get ? `×${get.activityFactor} (${factorLabel})` : "—"}
                  </span>
                </div>
                {get ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        TMB
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {get.tmb}{" "}
                        <span className="text-[10px] font-normal text-slate-400">
                          kcal
                        </span>
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                        GET
                      </p>
                      <p className="text-base font-bold text-emerald-700">
                        {get.get}{" "}
                        <span className="text-[10px] font-normal text-emerald-500">
                          kcal
                        </span>
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
                        Proteínas
                      </p>
                      <p className="text-base font-bold text-blue-700">
                        {get.macros.protein}{" "}
                        <span className="text-[10px] font-normal text-blue-400">
                          g
                        </span>
                      </p>
                      <p className="text-[9px] text-blue-400">
                        {get.macros.proteinPercent}%
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">
                        Carbohidratos
                      </p>
                      <p className="text-base font-bold text-amber-700">
                        {get.macros.carbs}{" "}
                        <span className="text-[10px] font-normal text-amber-500">
                          g
                        </span>
                      </p>
                      <p className="text-[9px] text-amber-400">
                        {get.macros.carbsPercent}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Completa los datos del paciente para calcular
                    automáticamente.
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <p className="text-[10px] text-slate-400">
                    {get
                      ? `Distribución: ${get.macros.carbsPercent}% CHO · ${get.macros.proteinPercent}% Prot · ${get.macros.fatsPercent}% Grasas`
                      : "Fórmula Mifflin-St Jeor (1990) — estándar clínico internacional para adultos."}
                  </p>
                  {isKid && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Ajustar para pediatría
                    </span>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {state.automaticNutritionCalculations && (
        <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900">
                    Cálculos automáticos guardados
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-100">
                    Revisión profesional requerida
                  </span>
                </div>
                <p className="mt-0.5 max-w-3xl text-[11px] font-medium leading-relaxed text-slate-500">
                  Basado en IMC OMS, Mifflin-St Jeor y factores de actividad
                  estándar. Es una sugerencia de apoyo clínico, no reemplaza el
                  criterio del nutricionista.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:min-w-[480px]">
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  IMC
                </p>
                <p className="text-base font-black text-slate-900">
                  {state.automaticNutritionCalculations.bmi?.value ?? "-"}
                </p>
                <p className="text-[10px] font-bold text-slate-500">
                  {state.automaticNutritionCalculations.bmi?.classification ??
                    "Sin clasificar"}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  GET
                </p>
                <p className="text-base font-black text-emerald-700">
                  {state.automaticNutritionCalculations.energy?.get ?? "-"}
                </p>
                <p className="text-[10px] font-bold text-emerald-500">
                  kcal/día
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Proteína
                </p>
                <p className="text-base font-black text-blue-700">
                  {state.automaticNutritionCalculations.macros?.protein ?? "-"}
                </p>
                <p className="text-[10px] font-bold text-blue-500">g/día</p>
              </div>
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Porciones
                </p>
                <p className="text-xs font-black text-amber-700">
                  {state.automaticNutritionCalculations.portionProfile?.label ??
                    "Pendiente"}
                </p>
                <p className="text-[10px] font-bold text-amber-500">
                  perfil sugerido
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-slate-100/50 rounded-2xl w-full lg:w-fit border border-slate-200 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth">
        {(
          [
            { label: "General", disabled: false },
            { label: "Consultas", disabled: false },
            { label: "Creaciones", disabled: false },
            { label: "Progreso", disabled: false },
            {
              label: "Acompañamiento",
              disabled: !["ACTIVE", "PENDING"].includes(
                state.portalOverview?.status || "",
              ),
            },
            { label: "Exámenes", disabled: true },
          ] as Array<{ label: TabType | "Exámenes"; disabled: boolean }>
        ).map((tab) => (
          <button
            key={tab.label}
            data-tutorial-id={
              tab.label === "General"
                ? "patient-tab-general"
                : tab.label === "Consultas"
                  ? "patient-tab-consultations"
                  : tab.label === "Creaciones"
                    ? "patient-tab-creations"
                    : tab.label === "Progreso"
                      ? "patient-tab-progress"
                      : undefined
            }
            onClick={() => {
              if (!tab.disabled) state.setActiveTab(tab.label as TabType);
            }}
            disabled={tab.disabled}
            className={cn(
              "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap flex-1 lg:flex-none",
              tab.disabled
                ? "text-slate-300 bg-slate-100/80 cursor-not-allowed border-none"
                : state.activeTab === tab.label
                  ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50 border-none"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-none",
            )}
          >
            <span className="inline-flex items-center gap-1.5 relative">
              {tab.label}
              {tab.label === "Acompañamiento" &&
                (state.portalOverview?.summary?.pendingQuestions ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-3 w-2 h-2 bg-emerald-500 rounded-full border border-white animate-pulse" />
                )}
              {tab.disabled && <Lock className="h-3.5 w-3.5" />}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area: Renders the active Tab Component */}
      {state.activeTab === "General" && (
        <PatientGeneralTab
          patient={patient}
          isEditing={isEditing}
          editForm={editForm}
          updateField={state.updateField}
          handlePhoneChange={state.handlePhoneChange}
          getCurrentActivityLevel={state.getCurrentActivityLevel}
          updateActivityLevel={state.updateActivityLevel}
          toggleStatus={state.toggleStatus}
        />
      )}

      {state.activeTab === "Consultas" && (
        <PatientConsultationsTab
          patient={patient}
          clinicalConsultations={state.clinicalConsultations}
          isConsultationsLoading={state.isConsultationsLoading}
          setConsultationToDelete={state.setConsultationToDelete}
          setIsDeleteConsultationConfirmOpen={state.setIsDeleteConsultationConfirmOpen}
        />
      )}

      {state.activeTab === "Creaciones" && (
        <PatientCreationsTab
          patient={patient}
          portalOverview={state.portalOverview}
          fetchPortalOverview={state.fetchPortalOverview}
        />
      )}

      {state.activeTab === "Progreso" && (
        <PatientProgressTab
          patient={patient}
          consultations={state.consultations}
          chartData={state.prepareChartData()}
          registeredMetricKeys={state.registeredMetricKeys}
          getAllMetricKeys={state.getAllMetricKeys}
          getMetricInfo={state.getMetricInfo}
          prepareChartData={state.prepareChartData}
          availableMetricSuggestions={state.availableMetricSuggestions}
          metricHistory={state.metricHistory}
          isMetricModalOpen={state.isMetricModalOpen}
          setIsMetricModalOpen={state.setIsMetricModalOpen}
          isAddMetricModalOpen={state.isAddMetricModalOpen}
          setIsAddMetricModalOpen={state.setIsAddMetricModalOpen}
          isEditMetricHistoryModalOpen={state.isEditMetricHistoryModalOpen}
          setIsEditMetricHistoryModalOpen={state.setIsEditMetricHistoryModalOpen}
          isDeleteEntireMetricConfirmOpen={state.isDeleteEntireMetricConfirmOpen}
          setIsDeleteEntireMetricConfirmOpen={state.setIsDeleteEntireMetricConfirmOpen}
          isOverwriteConfirmOpen={state.isOverwriteConfirmOpen}
          setIsOverwriteConfirmOpen={state.setIsOverwriteConfirmOpen}
          isExportModalOpen={state.isExportModalOpen}
          setIsExportModalOpen={state.setIsExportModalOpen}
          isExporting={state.isExporting}
          metricForm={state.metricForm}
          setMetricForm={state.setMetricForm}
          newMetric={state.newMetric}
          setNewMetric={state.setNewMetric}
          editingMetricKey={state.editingMetricKey}
          setEditingMetricKey={state.setEditingMetricKey}
          metricKeyToDelete={state.metricKeyToDelete}
          setMetricKeyToDelete={state.setMetricKeyToDelete}
          openMetricLogger={state.openMetricLogger}
          closeMetricLogger={state.closeMetricLogger}
          handleSaveMetricsClick={state.handleSaveMetricsClick}
          confirmSaveMetrics={state.confirmSaveMetrics}
          handleCreateGlobalMetric={state.handleCreateGlobalMetric}
          onDeleteMetricRecord={state.onDeleteMetricRecord}
          onSaveMetricEdit={state.onSaveMetricEdit}
          addMetricToForm={state.addMetricToForm}
          addSmartMetricToForm={state.addSmartMetricToForm}
          updateMetricInForm={state.updateMetricInForm}
          removeMetricFromForm={state.removeMetricFromForm}
          handleDeleteEntireMetric={state.handleDeleteEntireMetric}
          handleExportPDF={state.handleExportPDF}
        />
      )}

      {state.activeTab === "Acompañamiento" && (
        <PatientAcompanamientoTab
          patient={patient}
          portalOverview={state.portalOverview}
          activeAcompTab={state.activeAcompTab}
          setActiveAcompTab={state.setActiveAcompTab}
          portalFilter={state.portalFilter}
          setPortalFilter={state.setPortalFilter}
          replyTarget={state.replyTarget}
          setReplyTarget={state.setReplyTarget}
          replyMessage={state.replyMessage}
          setReplyMessage={state.setReplyMessage}
          isSubmittingPortalReply={state.isSubmittingPortalReply}
          handleReplyPortalQuestion={state.handleReplyPortalQuestion}
          portalMessageText={state.portalMessageText}
          setPortalMessageText={state.setPortalMessageText}
          isCreatingPortalMessage={state.isCreatingPortalMessage}
          handleCreatePortalMessage={state.handleCreatePortalMessage}
          setActiveTab={state.setActiveTab}
          isPortalNotificationModalOpen={state.isPortalNotificationModalOpen}
          setIsPortalNotificationModalOpen={state.setIsPortalNotificationModalOpen}
          portalNotificationTitle={state.portalNotificationTitle}
          setPortalNotificationTitle={state.setPortalNotificationTitle}
          portalNotificationMessage={state.portalNotificationMessage}
          setPortalNotificationMessage={state.setPortalNotificationMessage}
          portalNotificationSendEmail={state.portalNotificationSendEmail}
          setPortalNotificationSendEmail={state.setPortalNotificationSendEmail}
          isCreatingPortalNotification={state.isCreatingPortalNotification}
          handleCreatePortalNotification={state.handleCreatePortalNotification}
        />
      )}

      {/* Modals rendered in Layout scope */}
      <Modal
        isOpen={state.isPortalInviteModalOpen}
        onClose={() => state.setIsPortalInviteModalOpen(false)}
        title="Invitar al portal del paciente"
      >
        <div className="space-y-5 py-2">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              Invita a {patient.fullName} a su portal privado.
            </p>
            <div className="mt-2 text-xs leading-6 text-emerald-900/75 space-y-2 font-medium">
              <p>
                Genera un link de acceso y un <b>código personal</b> para que el
                paciente ingrese a su portal privado. Este es un canal seguro
                para la comunicación, registro diario y seguimiento.
              </p>
              <p className="font-bold italic">
                Deberás compartir el enlace manualmente. El link expira en 7
                días.
              </p>
            </div>
          </div>

          {state.generatedPortalLink && (
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Último enlace generado
              </p>
              <p className="break-all text-sm font-semibold text-slate-800">
                {state.generatedPortalLink}
              </p>
              {state.portalAccessCode && (
                <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">
                    Código fijo
                  </p>
                  <p className="mt-1 text-lg font-black tracking-[0.28em] text-slate-900">
                    {state.portalAccessCode}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => state.handleCopyPortalLink()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-2xl"
                  onClick={() =>
                    window.open(
                      state.generatedPortalLink,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => state.setIsPortalInviteModalOpen(false)}
              className="rounded-2xl px-5 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={state.handleCreatePortalInvite}
              isLoading={state.isCreatingPortalInvite}
              className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Send className="mr-2 h-4 w-4" />
              Generar link
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={state.showRecalculateSaveConfirm}
        onClose={() => {
          state.setShowRecalculateSaveConfirm(false);
          void state.handleSave(false);
        }}
        onConfirm={() => {
          state.setShowRecalculateSaveConfirm(false);
          void state.handleSave(true);
        }}
        title="¿Recalcular valores automáticamente?"
        description="Cambiaste datos usados por IMC, TMB, GET, macros o perfil de porciones. Puedes recalcularlos al guardar o conservar los valores anteriores para revisión manual."
        confirmText="Guardar y recalcular"
        cancelText="Guardar sin recalcular"
        variant="primary"
      />

      <ConfirmationModal
        isOpen={state.isDeletePatientConfirmOpen}
        onClose={() => state.setIsDeletePatientConfirmOpen(false)}
        onConfirm={state.handleDelete}
        title="¿Eliminar paciente?"
        description="¿Estás seguro de que deseas eliminar este paciente? Se eliminarán también todas sus consultas y no podrás recuperar esta información. Te recomendamos guardar la ficha clínica del paciente antes de eliminarlo."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={state.isDeleteConsultationConfirmOpen}
        onClose={() => {
          state.setIsDeleteConsultationConfirmOpen(false);
          state.setConsultationToDelete(null);
        }}
        onConfirm={async () => {
          if (!state.consultationToDelete) return;
          try {
            const token =
              Cookies.get("auth_token") || localStorage.getItem("auth_token");
            const response = await fetchApi(
              `/consultations/${state.consultationToDelete}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (response.ok) {
              toast.success("Consulta eliminada");
              state.fetchConsultations();
            } else {
              toast.error("Error al eliminar consulta");
            }
          } catch {
            toast.error("Error de red");
          } finally {
            state.setIsDeleteConsultationConfirmOpen(false);
            state.setConsultationToDelete(null);
          }
        }}
        title="¿Eliminar consulta?"
        description="¿Estás seguro de que deseas eliminar esta consulta? Se eliminarán también las métricas asociadas a ella."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      {/* Footer / Danger Zone */}
      <div className="pt-24 border-t border-slate-200 mt-24 flex flex-col items-center gap-6">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          Ecosistema NutriNet v1.1
        </p>
        <button
          onClick={() => state.setIsDeletePatientConfirmOpen(true)}
          className="group flex items-center gap-3 px-8 py-3.5 text-slate-900 hover:text-indigo-700 hover:bg-indigo-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer font-black shadow-sm"
        >
          <Trash2 className="w-4.5 h-4.5 group-hover:scale-110 transition-transform text-slate-500 group-hover:text-indigo-600" />
          <span className="text-[11px] uppercase tracking-widest">
            Eliminar Paciente
          </span>
        </button>
      </div>
    </div>
  );
}
