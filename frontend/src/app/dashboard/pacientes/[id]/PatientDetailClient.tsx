"use client";

import { useState } from "react";
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
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Copy,
  ExternalLink,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  User,
  MoreHorizontal,
  TrendingUp,
  Flame,
  Apple,
  PauseCircle,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { fetchApi } from "@/lib/api-base";
import {
  calculateBMI,
  calculateGET,
  calculateAge,
  isPediatric,
} from "@/lib/nutrition-formulas";

import { Patient } from "@/features/patients";
import { usePatientDetailState, TabType } from "@/features/patients/hooks/usePatientDetailState";
import { PatientFichaClinicaTab, ACTIVITY_LEVEL_OPTIONS } from "@/features/patients/components/PatientFichaClinicaTab";
import { PatientConsultationsTab } from "@/features/patients/components/PatientConsultationsTab";
import { PatientProgressTab } from "@/features/patients/components/PatientProgressTab";
import { PatientAcompanamientoTab } from "@/features/patients/components/PatientAcompanamientoTab";
import { PatientCreationsTab } from "@/features/patients/components/PatientCreationsTab";
import { cn } from "@/features/patients/utils/patient-helpers";
import { formatPhone } from "@/lib/utils";

interface PatientDetailClientProps {
  id: string;
}

function getValidationAlerts(
  patient: Patient,
  bmi: any,
  get: any,
  motivoConsulta: string,
  diagnosticoNutricional: string,
  clinicalRecordDraft: any,
): Array<{ type: "warning" | "danger" | "info"; message: string }> {
  const alerts: Array<{ type: "warning" | "danger" | "info"; message: string }> = [];

  if (!motivoConsulta) {
    alerts.push({ type: "info", message: "Pendiente: motivo de consulta" });
  }
  if (!diagnosticoNutricional) {
    alerts.push({ type: "info", message: "Pendiente: diagnóstico nutricional" });
  }
  if (!patient.nutritionalFocus) {
    alerts.push({ type: "info", message: "Pendiente: enfoque nutricional" });
  }

  const w = patient.weight;
  const h = patient.height;
  if (w && (w < 20 || w > 500)) {
    alerts.push({ type: "danger", message: `Revisar: peso improbable (${w} kg)` });
  }
  if (h && (h < 50 || h > 260)) {
    alerts.push({ type: "danger", message: `Revisar: altura improbable (${h} cm)` });
  }

  const skf = clinicalRecordDraft?.anthropometry?.skinfolds;
  const circ = clinicalRecordDraft?.anthropometry?.circumferences;

  if (skf) {
    const folds = [
      { key: "tricipital", label: "pliegue tricipital" },
      { key: "bicipital", label: "pliegue bicipital" },
      { key: "subescapular", label: "pliegue subescapular" },
      { key: "suprailiac", label: "pliegue suprailíaco" },
    ];
    folds.forEach((f) => {
      const v = parseFloat(skf[f.key]);
      if (!isNaN(v) && (v < 2 || v > 80)) {
        alerts.push({ type: "warning", message: `Revisar: ${f.label} con valor improbable (${v} mm)` });
      }
    });
  }

  if (circ) {
    const circs = [
      { key: "kneeHeight", label: "altura rodilla", min: 35, max: 70 },
      { key: "calfCircumference", label: "circ. pantorrilla", min: 20, max: 70 },
      { key: "armCircumference", label: "circ. braquial", min: 15, max: 60 },
      { key: "waistCircumference", label: "circ. cintura", min: 40, max: 200 },
      { key: "hipCircumference", label: "circ. cadera", min: 50, max: 200 },
    ];
    circs.forEach((c) => {
      const v = parseFloat(circ[c.key]);
      if (!isNaN(v) && (v < c.min || v > c.max)) {
        alerts.push({ type: "warning", message: `Revisar: ${c.label} con valor improbable (${v} cm)` });
      }
    });
  }

  const isGestante = clinicalRecordDraft?.gynecoObstetric?.isPregnant;
  if (isGestante) {
    const weeks = parseInt(clinicalRecordDraft?.gynecoObstetric?.pregnancyWeeks || "0");
    if (!weeks || weeks <= 0 || weeks > 42) {
      alerts.push({ type: "warning", message: "Semanas gestacionales dudosas o no registradas" });
    }
    if (!clinicalRecordDraft?.gynecoObstetric?.pregestationalWeight) {
      alerts.push({ type: "info", message: "Pendiente: peso pregestacional" });
    }
    if (clinicalRecordDraft?.gynecoObstetric?.pregnancyType === "multiple") {
      alerts.push({ type: "warning", message: "Embarazo múltiple: requiere validación clínica" });
    }
  }

  return alerts;
}

export default function PatientDetailClient({ id }: PatientDetailClientProps) {
  const router = useRouter();
  const state = usePatientDetailState({ id });
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  if (state.isLoading && !state.patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase">
          Cargando expediente...
        </p>
      </div>
    );
  }

  if (!state.patient) return null;

  const { patient, isEditing, editForm } = state;

  const w = patient.weight;
  const h = patient.height;
  const g = patient.gender;
  const bd = patient.birthDate;
  const ageYears = calculateAge(bd);
  const al = state.getCurrentActivityLevel();
  const bmi = w && h
    ? calculateBMI(w, h, { gender: g === "Masculino" || g === "Femenino" ? g : null, ageYears, birthDate: bd })
    : null;
  const tmbFormula = ageYears !== undefined && ageYears < 18 ? "oms-fao" : "mifflin-st-jeor";
  const get = w && h && ageYears && (g === "Masculino" || g === "Femenino")
    ? calculateGET(g, w, h, ageYears, al, tmbFormula)
    : null;
  const isKid = isPediatric(bd);
  const activityLabel = ACTIVITY_LEVEL_OPTIONS.find((o) => o.key === al)?.label || "Sedentario";

  const getCV = (key: string): string => {
    const vars = Array.isArray(patient.customVariables) ? patient.customVariables as any[] : [];
    return vars.find((v) => v.key === key)?.value ?? "";
  };
  const motivoConsulta = getCV("motivoConsulta");
  const diagnosticoNutricional = getCV("diagnosticoNutricional");

  const autoCalc = state.automaticNutritionCalculations;
  const isGestante = state.clinicalRecordDraft?.gynecoObstetric?.isPregnant || false;

  const validationAlerts = getValidationAlerts(
    patient, bmi, get, motivoConsulta, diagnosticoNutricional, state.clinicalRecordDraft,
  );

  const tabs: Array<{ label: TabType; disabled: boolean }> = [
    { label: "Ficha clínica", disabled: false },
    { label: "Progreso", disabled: false },
    { label: "Seguimiento", disabled: false },
    { label: "Consultas", disabled: false },
    { label: "Planes", disabled: false },
    { label: "Exámenes", disabled: true },
  ];

  const latestConsultation = state.consultations.length > 0
    ? state.consultations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">

      {/* ── EXPORT LOADING OVERLAY ─────────────────────────────────────────── */}
      {state.isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-700">Preparando ficha clínica</p>
              <p className="text-xs text-slate-400 mt-1">Generando PDF profesional...</p>
            </div>
          </div>
        </div>
      )}

      {/* ── PATIENT HERO ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Top bar: back + actions */}
          <div className="flex items-center justify-between h-14 gap-3">
            <button
              onClick={() => router.push("/dashboard/pacientes")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer group shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Pacientes</span>
            </button>

            <div className="flex items-center gap-2 flex-1">
              <div
                onClick={state.toggleStatus}
                title={patient.status !== "Inactive" ? "Activo — clic para desactivar" : "Inactivo — clic para activar"}
                className={cn(
                  "w-2 h-2 rounded-full cursor-pointer transition-all border-2 shrink-0",
                  patient.status !== "Inactive"
                    ? "bg-emerald-500 border-emerald-200 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                    : "bg-slate-300 border-slate-200",
                )}
              />
              {patient.status === "Inactive" && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Inactivo
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <>
                <button
                  onClick={() => router.push("/dashboard/consultas/nueva?patientId=" + patient.id)}
                    className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Nueva consulta</span>
                  </button>

                  <button
                    onClick={state.handleEdit}
                    className="h-8 w-8 rounded-xl border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center"
                    title="Editar paciente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative group">
                    <button className="h-8 w-8 rounded-xl border border-slate-200 text-slate-400 bg-white hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer flex items-center justify-center">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-100 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 py-1">
                      <div className="px-3 py-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Exportar ficha</p>
                      </div>
                      <button
                        onClick={state.handleExportClinicalRecordPDF}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        Ficha clínica PDF
                      </button>
                      <button
                        onClick={state.handleExportClinicalRecordExcel}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        Ficha clínica Excel
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => setShowStatusConfirm(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        {patient.status === "Active" ? "Marcar inactivo" : "Reactivar"}
                      </button>
                    </div>
                  </div>
                </>
            </div>
          </div>

          {/* Patient identity row */}
          <div className="pb-4 space-y-2">
            {isEditing ? (
              <Input
                value={editForm.fullName || ""}
                onChange={(e) => state.updateField("fullName", e.target.value)}
                className="bg-slate-50 border-none font-bold text-xl h-10 w-full max-w-md"
                placeholder="Nombre completo"
              />
            ) : (
              <h1 className={cn(
                "text-xl font-black tracking-tight",
                patient.status === "Inactive" ? "text-slate-400" : "text-slate-900"
              )}>
                {patient.fullName}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
              {patient.gender && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {patient.gender}
                </span>
              )}
              {ageYears !== undefined && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {ageYears} años
                  {isKid && (
                    <span className="ml-1 text-amber-600 font-bold text-[10px] bg-amber-50 px-1.5 rounded-full">
                      Pediátrico
                    </span>
                  )}
                </span>
              )}
              {patient.documentId && (
                <span className="text-slate-400">
                  RUT <span className="text-slate-600 font-bold">{patient.documentId}</span>
                </span>
              )}
              {latestConsultation && (
                <span className="flex items-center gap-1 text-slate-400">
                  Última evaluación: {new Date(latestConsultation.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {patient.email}
                </span>
              )}
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {formatPhone(patient.phone)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {bmi && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: bmi.color }}
                >
                  IMC {bmi.bmi} · {bmi.classification}
                </span>
              )}
              {get && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                  GET {get.get} kcal
                </span>
              )}
              {w && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
                  {w} kg{h ? ` · ${h} cm` : ""}
                </span>
              )}
              {al && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
                  {activityLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARDS ─────────────────────────────────────────────────── */}
      {!isGestante && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Estado nutricional */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Estado nutricional</h3>
              </div>
              {bmi ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Peso</p>
                      <p className="text-sm font-black text-slate-800">{w} kg</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Altura</p>
                      <p className="text-sm font-black text-slate-800">{h} cm</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">IMC</span>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">{bmi.bmi}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5">kg/m²</span>
                    </div>
                  </div>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white w-full text-center"
                    style={{ backgroundColor: bmi.color }}
                  >
                    {bmi.classification}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Ingresa peso y talla para ver estado nutricional.</p>
              )}
            </div>

            {/* Card 2: Requerimiento energético */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-50 rounded-lg">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Requerimiento energético</h3>
              </div>
              {get ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-amber-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-amber-600 uppercase">GET estimado</p>
                      <p className="text-sm font-black text-amber-700">{get.get} kcal/día</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Actividad</p>
                      <p className="text-sm font-black text-slate-800">{activityLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ajuste profesional</span>
                    <span className="font-bold text-slate-700">
                      {state.clinicalRecordDraft?.vitalHistory?.manualCaloriesAdjustment || 0} kcal
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Calorías finales</p>
                    <p className="text-sm font-black text-slate-800">
                      {get.get + parseInt(state.clinicalRecordDraft?.vitalHistory?.manualCaloriesAdjustment || "0")} kcal/día
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-1 space-y-0.5">
                  <p className="font-semibold">Faltan datos para calcular GET:</p>
                  {!w && <p className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" /> Peso</p>}
                  {!h && <p className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" /> Estatura</p>}
                  {!patient.birthDate && <p className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" /> Fecha de nacimiento</p>}
                  {(!g || (g !== "Masculino" && g !== "Femenino")) && <p className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" /> Sexo biológico</p>}
                </div>
              )}
            </div>

            {/* Card 3: Macronutrientes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Apple className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Macronutrientes</h3>
              </div>
              {get ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-blue-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-blue-600 uppercase">Prot.</p>
                      <p className="text-sm font-black text-blue-700">{get.macros.protein} g</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-amber-600 uppercase">CHO</p>
                      <p className="text-sm font-black text-amber-700">{get.macros.carbs} g</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-2">
                      <p className="text-[9px] font-bold text-rose-600 uppercase">Grasas</p>
                      <p className="text-sm font-black text-rose-700">{get.macros.fats} g</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                    <span>{get.macros.carbsPercent}% CHO</span>
                    <span>·</span>
                    <span>{get.macros.proteinPercent}% Prot</span>
                    <span>·</span>
                    <span>{get.macros.fatsPercent}% Grasas</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Requiere GET calculado.</p>
              )}
            </div>

            {/* Card 4: Alertas y pendientes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-rose-50 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Alertas y pendientes</h3>
              </div>
              {validationAlerts.length > 0 ? (
                <div className="space-y-1.5">
                  {validationAlerts.slice(0, 4).map((alert, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-1.5 text-[10px] font-semibold rounded-lg px-2 py-1.5",
                        alert.type === "danger"
                          ? "bg-rose-50 text-rose-700"
                          : alert.type === "warning"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-600",
                      )}
                    >
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                      {alert.message}
                    </div>
                  ))}
                  {validationAlerts.length > 4 && (
                    <p className="text-[10px] text-slate-400 font-medium pl-5">
                      +{validationAlerts.length - 4} más
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Sin alertas pendientes
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TABS NAVBAR ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="flex gap-0 border-b border-slate-100 overflow-x-auto overflow-y-hidden no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.disabled) return;
                if (isEditing && tab.label !== "Ficha clínica") {
                  toast.info("Cancela el modo edición antes de cambiar de pestaña.");
                  return;
                }
                state.setActiveTab(tab.label as TabType);
              }}
              disabled={tab.disabled}
              className={cn(
                "px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap border-b-2 -mb-px shrink-0",
                tab.disabled || (isEditing && tab.label !== "Ficha clínica")
                  ? "text-slate-300 border-transparent cursor-not-allowed"
                  : state.activeTab === tab.label
                  ? "text-emerald-700 border-emerald-600 cursor-pointer"
                  : "text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-200 cursor-pointer",
              )}
            >
              <span className="inline-flex items-center gap-1.5 relative">
                {tab.label}
                {tab.label === "Seguimiento" && (state.portalOverview?.summary?.pendingQuestions ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white animate-pulse" />
                )}
                {tab.disabled && <Lock className="h-2.5 w-2.5" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {state.activeTab === "Ficha clínica" && (
          <PatientFichaClinicaTab
            patient={patient}
            isEditing={isEditing}
            editForm={editForm}
            updateField={state.updateField}
            handlePhoneChange={state.handlePhoneChange}
            getCurrentActivityLevel={state.getCurrentActivityLevel}
            updateActivityLevel={state.updateActivityLevel}
            automaticNutritionCalculations={state.automaticNutritionCalculations}
            clinicalRecordDraft={state.clinicalRecordDraft}
            setClinicalRecordDraft={state.setClinicalRecordDraft}
            isClinicalRecordLoading={state.isClinicalRecordLoading}
            onEdit={state.handleEdit}
            onSave={state.handleSaveClick}
            onCancel={() => { state.setIsEditing(false); state.setEditForm({ ...patient }); }}
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
            isExporting={state.isExporting}
            isSavingMetrics={state.isSavingMetrics}
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
            handleExportProgressExcel={state.handleExportProgressExcel}
          />
        )}

        {state.activeTab === "Planes" && (
          <PatientCreationsTab
            patient={patient}
            portalOverview={state.portalOverview}
            fetchPortalOverview={state.fetchPortalOverview}
          />
        )}

        {state.activeTab === "Seguimiento" && (
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
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
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
                Deberás compartir el enlace manualmente. El link expira en 7 días.
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
                <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => state.handleCopyPortalLink()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button type="button" className="flex-1 rounded-2xl" onClick={() => window.open(state.generatedPortalLink, "_blank", "noopener,noreferrer")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => state.setIsPortalInviteModalOpen(false)} className="rounded-2xl px-5 cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={state.handleCreatePortalInvite} isLoading={state.isCreatingPortalInvite} className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-700 cursor-pointer">
              <Send className="mr-2 h-4 w-4" />
              Generar link
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={state.showRecalculateSaveConfirm}
        onClose={() => { state.setShowRecalculateSaveConfirm(false); void state.handleSave(false); }}
        onConfirm={() => { state.setShowRecalculateSaveConfirm(false); void state.handleSave(true); }}
        title="¿Recalcular valores automáticamente?"
        description="Cambiaste datos usados por IMC, TMB, GET, macros o perfil de porciones. Puedes recalcularlos al guardar o conservar los valores anteriores."
        confirmText="Guardar y recalcular"
        cancelText="Guardar sin recalcular"
        variant="primary"
      />

      <ConfirmationModal
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={async () => {
          setIsTogglingStatus(true);
          try {
            await (state.toggleStatus as any)();
          } finally {
            setIsTogglingStatus(false);
            setShowStatusConfirm(false);
          }
        }}
        title={patient.status === "Active" ? "¿Marcar como inactivo?" : "¿Reactivar paciente?"}
        description={patient.status === "Active"
          ? "El paciente no será eliminado. Su historial clínico se conservará, pero no aparecerá en la lista activa."
          : "El paciente volverá a aparecer en la lista activa y podrás continuar con su seguimiento."}
        confirmText={patient.status === "Active" ? "Marcar inactivo" : "Reactivar"}
        variant="primary"
        isLoading={isTogglingStatus}
      />

      <ConfirmationModal
        isOpen={state.isDeletePatientConfirmOpen}
        onClose={() => state.setIsDeletePatientConfirmOpen(false)}
        onConfirm={state.handleDelete}
        title="¿Eliminar paciente?"
        description="¿Estás seguro? Se eliminarán también todas sus consultas y no podrás recuperar esta información."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={state.isDeleteConsultationConfirmOpen}
        onClose={() => { state.setIsDeleteConsultationConfirmOpen(false); state.setConsultationToDelete(null); }}
        onConfirm={async () => {
          if (!state.consultationToDelete) return;
          try {
            const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
            const response = await fetchApi(`/consultations/${state.consultationToDelete}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
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
        description="¿Estás seguro de que deseas eliminar esta consulta? Se eliminarán también las métricas asociadas."
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </div>
  );
}
