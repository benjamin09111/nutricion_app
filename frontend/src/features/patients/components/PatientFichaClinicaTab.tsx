import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Target,
  Activity as ActivityIcon,
  Ruler,
  HeartPulse,
  Dumbbell,
  Stethoscope,
  Apple,
  Zap,
  Baby,
  Edit2,
  Save,
  X,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormStepCard } from "@/components/patient-form/FormStepCard";
import { CollapsibleSection } from "@/components/patient-form/CollapsibleSection";
import { CalculatedMetricsPanel } from "@/components/patient-form/CalculatedMetricsPanel";
import { MacroGrid } from "@/components/patient-form/MacroGrid";
import { GestationalPanel } from "@/components/patient-form/GestationalPanel";
import { Patient, ActivityLevel } from "@/features/patients";
import { ClinicalRecordDraft } from "@/features/patients/clinical-record";
import { formatRut } from "@/lib/rut-utils";
import { calculateBMI, calculateGET, calculateAge, getIdealWeightRange } from "@/lib/nutrition-formulas";
import { calculateGestationalData } from "@/lib/gestational-calculations";
import { cn, toDateOnly, formatDateOnlyForLocale } from "../utils/patient-helpers";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { WEEKLY_EXERCISE_OPTIONS } from "@/lib/schemas/patient-form";
import { fetchApi } from "@/lib/api-base";

const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; icon: any }[] = [
  { key: "sedentario", label: "Sed.", icon: ActivityIcon },
  { key: "ligero", label: "Lig.", icon: HeartPulse },
  { key: "moderado", label: "Mod.", icon: Dumbbell },
  { key: "activo", label: "Act.", icon: Dumbbell },
  { key: "muy_activo", label: "M.Act.", icon: Zap },
];

export const ACTIVITY_LEVEL_OPTIONS: { key: ActivityLevel; label: string; icon: any }[] = [
  { key: "sedentario", label: "Sedentario", icon: ActivityIcon },
  { key: "ligero", label: "Ligero", icon: HeartPulse },
  { key: "moderado", label: "Moderado", icon: Dumbbell },
  { key: "activo", label: "Activo", icon: Dumbbell },
  { key: "muy_activo", label: "Muy activo", icon: Zap },
];

const SKINFOLD_FIELDS = [
  { key: "tricipital", label: "Pliegue tricipital" },
  { key: "bicipital", label: "Pliegue bicipital" },
  { key: "subescapular", label: "Pliegue subescapular" },
  { key: "suprailiac", label: "Pliegue suprailiaco" },
];

const CIRCUMFERENCE_FIELDS = [
  { key: "kneeHeight", label: "Altura de rodilla", unit: "cm" },
  { key: "calfCircumference", label: "Circ. pantorrilla", unit: "cm" },
  { key: "armCircumference", label: "Circ. braquial", unit: "cm" },
  { key: "waistCircumference", label: "Circ. cintura (cardio)", unit: "cm" },
  { key: "hipCircumference", label: "Circ. cadera (cardio)", unit: "cm" },
];

const NUTRITIONAL_FOCUS_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "Mantener peso", label: "Mantener peso" },
  { value: "Bajar de peso", label: "Bajar de peso" },
  { value: "Subir de peso", label: "Subir de peso" },
  { value: "Mejorar composición corporal", label: "Mejorar composición corporal" },
  { value: "Control metabólico", label: "Control metabólico" },
  { value: "Alimentación saludable general", label: "Alimentación saludable general" },
  { value: "Rendimiento deportivo", label: "Rendimiento deportivo" },
  { value: "Patología/condición clínica", label: "Patología/condición clínica" },
  { value: "Control gestacional", label: "Control gestacional" },
];

const FITNESS_GOALS_OPTIONS = [
  { value: "", label: "No aplica" },
  { value: "Salud general", label: "Salud general" },
  { value: "Pérdida de grasa", label: "Pérdida de grasa" },
  { value: "Ganancia muscular", label: "Ganancia muscular" },
  { value: "Resistencia", label: "Resistencia" },
  { value: "Fuerza", label: "Fuerza" },
  { value: "Rendimiento deportivo", label: "Rendimiento deportivo" },
  { value: "Rehabilitación / movilidad", label: "Rehabilitación / movilidad" },
];

const DIET_RESTRICTION_OPTIONS = [
  "Vegetariano", "Vegano", "Sin gluten", "Sin lactosa",
  "Sin azúcar", "Bajo en sodio", "Keto", "Paleo",
  "Ayuno intermitente", "Alergia a frutos secos",
];

interface PatientFichaClinicaTabProps {
  patient: Patient;
  isEditing: boolean;
  editForm: Partial<Patient>;
  updateField: (field: keyof Patient, value: any) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getCurrentActivityLevel: () => ActivityLevel;
  updateActivityLevel: (value: ActivityLevel) => void;
  automaticNutritionCalculations?: any;
  clinicalRecordDraft: ClinicalRecordDraft;
  setClinicalRecordDraft: React.Dispatch<React.SetStateAction<ClinicalRecordDraft>>;
  isClinicalRecordLoading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function FieldLabel({
  children,
  isEditable,
  isCalculated,
}: {
  children: React.ReactNode;
  isEditable?: boolean;
  isCalculated?: boolean;
}) {
  return (
    <label className="text-xs font-semibold text-slate-600 flex items-center justify-between gap-1">
      <span>{children}</span>
      {isEditable && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
          <Edit2 className="w-2.5 h-2.5" />
          Editable
        </span>
      )}
      {isCalculated && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
          <Lock className="w-2.5 h-2.5" />
          Auto
        </span>
      )}
    </label>
  );
}

function ReadOnlyField({ value, placeholder }: { value?: string | number | null; placeholder?: string }) {
  return (
    <div className="flex min-h-10 min-w-0 max-w-full items-center break-words px-1 py-2 text-sm font-semibold text-slate-700">
      {value || <span className="text-slate-300">{placeholder || "—"}</span>}
    </div>
  );
}

export function PatientFichaClinicaTab({
  patient,
  isEditing,
  editForm,
  updateField,
  handlePhoneChange,
  getCurrentActivityLevel,
  updateActivityLevel,
  automaticNutritionCalculations,
  clinicalRecordDraft,
  setClinicalRecordDraft,
  isClinicalRecordLoading,
  onEdit,
  onSave,
  onCancel,
}: PatientFichaClinicaTabProps) {
  const rec = clinicalRecordDraft;

  const updateClinical = (
    section: keyof ClinicalRecordDraft,
    field: string,
    value: any,
    subSection?: string,
    subField?: string,
  ) => {
    setClinicalRecordDraft((prev) => {
      if (subSection && subField) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [subSection]: { ...(prev[section] as any)[subSection], [subField]: value },
          },
        };
      }
      return { ...prev, [section]: { ...prev[section], [field]: value } };
    });
  };

  const getCV = (key: string, src?: any): string => {
    const vars = Array.isArray(src) ? src as any[] : [];
    return vars.find((v) => v.key === key)?.value ?? "";
  };

  const updateCV = (key: string, label: string, value: any, unit = "") => {
    if (!isEditing) return;
    const prev = Array.isArray(editForm.customVariables) ? [...(editForm.customVariables as any[])] : [];
    const idx = prev.findIndex((v) => v.key === key);
    if (idx >= 0) {
      if (value === "" || value === undefined) prev.splice(idx, 1);
      else prev[idx] = { key, label, value, unit };
    } else if (value !== "" && value !== undefined) {
      prev.push({ key, label, value, unit });
    }
    updateField("customVariables", prev);
  };

  // Computed values
  const w = isEditing ? (Number(editForm.weight) || patient.weight) : patient.weight;
  const h = isEditing ? (Number(editForm.height) || patient.height) : patient.height;
  const g = isEditing ? (editForm.gender || patient.gender) : patient.gender;
  const bd = isEditing ? (editForm.birthDate || patient.birthDate) : patient.birthDate;
  const al = getCurrentActivityLevel();
  const ageYears = calculateAge(bd);
  const bmi = w && h
    ? calculateBMI(w, h, { gender: g === "Masculino" || g === "Femenino" ? g : null, ageYears, birthDate: bd })
    : null;
  const idealWeight = h
    ? getIdealWeightRange(h, { gender: g === "Masculino" || g === "Femenino" ? g : null, ageYears: ageYears ?? undefined })
    : null;
  const tmbFormula = ageYears !== undefined && ageYears < 18 ? "oms-fao" : "mifflin-st-jeor";
  const get = w && h && ageYears && (g === "Masculino" || g === "Femenino")
    ? calculateGET(g, w, h, ageYears, al, tmbFormula)
    : null;

  const isGestante = rec.gynecoObstetric.isPregnant;
  const gestWeek = parseInt(rec.gynecoObstetric.pregnancyWeeks || "0") || 0;
  const preGestWeight = rec.gynecoObstetric.pregestationalWeight
    ? parseFloat(rec.gynecoObstetric.pregestationalWeight)
    : undefined;
  const gestationalData =
    isGestante && w && h && preGestWeight && gestWeek > 0
      ? calculateGestationalData(gestWeek, w, h, preGestWeight)
      : null;

  const primaryCondition = isEditing
    ? (editForm.primaryCondition ?? patient.primaryCondition)
    : patient.primaryCondition;

  const dietRestrictions: string[] = (isEditing ? editForm.dietRestrictions : patient.dietRestrictions) ?? [];
  const displayedDietRestrictions = dietRestrictions.filter(
    (r) => r.toLowerCase() !== (primaryCondition || "").toLowerCase()
  );
  const likes = isEditing ? (editForm.likes ?? patient.likes) : patient.likes;
  const clinicalSummary = isEditing ? (editForm.clinicalSummary ?? patient.clinicalSummary) : patient.clinicalSummary;
  const nutritionalFocus = isEditing ? (editForm.nutritionalFocus ?? patient.nutritionalFocus) : patient.nutritionalFocus;
  const fitnessGoals = isEditing ? (editForm.fitnessGoals ?? patient.fitnessGoals) : patient.fitnessGoals;
  const rejectedFoods = getCV("rejectedFoods", isEditing ? editForm.customVariables : patient.customVariables);
  const motivoConsulta = getCV("motivoConsulta", isEditing ? editForm.customVariables : patient.customVariables);
  const diagnosticoNutricional = getCV("diagnosticoNutricional", isEditing ? editForm.customVariables : patient.customVariables);
  const pesoHabitual = getCV("pesoHabitual", isEditing ? editForm.customVariables : patient.customVariables);

  const macros = get ? [
    { label: "Proteína", value: get.macros.protein, unit: "g", color: "bg-blue-50 text-blue-700" },
    { label: "Carbohidratos", value: get.macros.carbs, unit: "g", color: "bg-amber-50 text-amber-700" },
    { label: "Grasas", value: get.macros.fats, unit: "g", color: "bg-rose-50 text-rose-700" },
    { label: "Calorías", value: get.macros.calories, unit: "kcal", color: "bg-indigo-50 text-indigo-700" },
  ] : [];

  const toggleRestriction = (r: string) => {
    if (!isEditing) return;
    const current = [...(editForm.dietRestrictions || patient.dietRestrictions || [])];
    const idx = current.indexOf(r);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(r);
    updateField("dietRestrictions", current);
  };

  const [selectedSection, setSelectedSection] = useState<string | null>("identificacion");
  const [conditionTags, setConditionTags] = useState<string[]>([]);

  useEffect(() => {
    fetchApi("/tags?limit=50")
      .then((res) => res.json())
      .then((data: any[]) => {
        const names = Array.isArray(data)
          ? data.map((t: any) => (typeof t === "string" ? t : t.name))
          : [];
        setConditionTags(names);
      })
      .catch(() => setConditionTags([]));
  }, []);

  const conditionOptions = React.useMemo(() => {
    const defaults = DEFAULT_CONSTRAINTS.map((c) => c.id);
    return [...new Set([...defaults, ...conditionTags])];
  }, [conditionTags]);

  const isFemale = g === "Femenino";

  const sections = [
    { id: "identificacion", label: "Datos del Paciente" },
    { id: "objetivos", label: "Objetivos y actividad" },
    { id: "antropometria", label: "Antropometría y cálculos" },
    { id: "anamnesis-general", label: "Anamnesis general" },
    { id: "anamnesis-nutricional", label: "Anamnesis nutricional" },
    ...(isFemale ? [{ id: "gestante", label: "Modo gestante" }] : []),
  ];

  const showSection = (id: string) => selectedSection === null || selectedSection === id;

  const editableInputClasses = "h-10 rounded-xl bg-amber-50/40 border-2 border-amber-300/90 text-slate-900 text-sm font-semibold shadow-2xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30 transition-all";
  const editableSelectClasses = "w-full h-10 rounded-xl bg-amber-50/40 border-2 border-amber-300/90 text-slate-900 px-3 text-sm font-semibold cursor-pointer shadow-2xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30 transition-all appearance-none";
  const editableTextareaClasses = "w-full rounded-xl bg-amber-50/40 border-2 border-amber-300/90 text-slate-900 text-sm font-semibold px-3 py-2 resize-none shadow-2xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30 transition-all";

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 animate-in fade-in duration-400 lg:flex-row">
      <div className="flex-1 space-y-5 w-full min-w-0 max-w-full lg:max-w-4xl">
        {isEditing && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 gap-3 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                <Edit2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Modo Edición Activo</p>
                <p className="text-xs text-amber-800 font-medium">
                  Los campos editables están destacados con borde ámbar y la etiqueta <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-800 bg-amber-200/80 border border-amber-300 px-1.5 py-0.5 rounded-md">Editable ✏️</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                onClick={onCancel}
                className="h-9 px-4 rounded-xl border border-amber-300 bg-white text-amber-800 hover:bg-amber-100 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        )}

        {/* ── 1. Datos del Paciente ──────────────────────────────────────── */}
        {showSection("identificacion") && (
          <FormStepCard
            icon={<User className="w-4 h-4 text-indigo-600" />}
            title="Datos del Paciente"
            description="Información básica de identificación"
          >
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Nombre Completo</FieldLabel>
                {isEditing ? (
                  <Input
                    value={editForm.fullName || ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={editableInputClasses}
                  />
                ) : (
                  <ReadOnlyField value={patient.fullName} />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    {isEditing ? (
                      <Input
                        placeholder="valen@email.com"
                        value={editForm.email || ""}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={cn(editableInputClasses, "pl-10")}
                      />
                    ) : (
                      <div className="flex min-h-10 min-w-0 max-w-full items-center break-all py-2 pl-10 text-sm font-semibold text-slate-700">
                        {patient.email || <span className="text-slate-300">Sin email</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Teléfono</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    {isEditing ? (
                      <Input
                        placeholder="+56 9 1234 5678"
                        value={editForm.phone || ""}
                        onChange={handlePhoneChange}
                        className={cn(editableInputClasses, "pl-10")}
                      />
                    ) : (
                      <div className="h-10 pl-10 flex items-center text-sm font-semibold text-slate-700">
                        {patient.phone || <span className="text-slate-300">No registrado</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Fecha de nacimiento</FieldLabel>
                  {isEditing ? (
                    <DatePicker
                      value={toDateOnly(editForm.birthDate)}
                      onChange={(date) => updateField("birthDate", date)}
                      placeholder="Seleccionar fecha..."
                      mode="birthDate"
                    />
                  ) : (
                    <ReadOnlyField
                      value={
                        patient.birthDate
                          ? formatDateOnlyForLocale(patient.birthDate, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : undefined
                      }
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isCalculated={isEditing}>Edad</FieldLabel>
                  <div className="h-10 flex items-center justify-between text-sm font-semibold text-slate-500 bg-slate-100/70 border border-slate-200/60 rounded-xl px-3 cursor-not-allowed">
                    <span>{ageYears !== undefined ? `${ageYears} años` : "—"}</span>
                    {isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Sexo biológico</FieldLabel>
                  {isEditing ? (
                    <select
                      value={editForm.gender || ""}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className={editableSelectClasses}
                    >
                      <option value="">—</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  ) : (
                    <ReadOnlyField value={patient.gender} placeholder="No def." />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>RUT</FieldLabel>
                {isEditing ? (
                  <Input
                    placeholder="12.345.678-9"
                    value={editForm.documentId || ""}
                    onChange={(e) => updateField("documentId", formatRut(e.target.value))}
                    className={editableInputClasses}
                  />
                ) : (
                  <ReadOnlyField value={patient.documentId} placeholder="Sin identificador" />
                )}
              </div>

              {g === "Femenino" && (
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Condición femenina
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rec.gynecoObstetric.isPregnant}
                      onChange={(e) =>
                        updateClinical("gynecoObstetric", "isPregnant", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">¿Está embarazada?</span>
                    {isEditing && (
                      <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md ml-auto">
                        Editable
                      </span>
                    )}
                  </label>
                  {rec.gynecoObstetric.isPregnant && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <FieldLabel isEditable={isEditing}>Semanas gestación</FieldLabel>
                        <Input
                          type="number"
                          min="1"
                          max="42"
                          value={rec.gynecoObstetric.pregnancyWeeks}
                          onChange={(e) =>
                            updateClinical("gynecoObstetric", "pregnancyWeeks", e.target.value)
                          }
                          className={editableInputClasses}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel isEditable={isEditing}>Peso pre-gestacional (kg)</FieldLabel>
                        <Input
                          type="number"
                          step="0.1"
                          value={rec.gynecoObstetric.pregestationalWeight}
                          onChange={(e) =>
                            updateClinical("gynecoObstetric", "pregestationalWeight", e.target.value)
                          }
                          className={editableInputClasses}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel isEditable={isEditing}>Tipo de embarazo</FieldLabel>
                        <select
                          value={rec.gynecoObstetric.pregnancyType || "único"}
                          onChange={(e) =>
                            updateClinical("gynecoObstetric", "pregnancyType", e.target.value)
                          }
                          className={editableSelectClasses}
                        >
                          <option value="único">Único</option>
                          <option value="múltiple">Múltiple</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormStepCard>
        )}

        {/* ── 2. Objetivos y Actividad ────────────────────────────────────── */}
        {showSection("objetivos") && (
          <FormStepCard
            icon={<Target className="w-4 h-4 text-indigo-600" />}
            title="Objetivos y Actividad"
            description="Motivo de consulta, enfoque nutricional y nivel de actividad"
          >
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Motivo de consulta</FieldLabel>
                {isEditing ? (
                  <Input
                    placeholder="Ej: Pérdida de peso, mejora hábitos..."
                    value={motivoConsulta}
                    onChange={(e) =>
                      updateCV("motivoConsulta", "Motivo de consulta", e.target.value)
                    }
                    className={editableInputClasses}
                  />
                ) : (
                  <ReadOnlyField value={motivoConsulta} placeholder="No registrado" />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Enfoque nutricional</FieldLabel>
                  {isEditing ? (
                    <select
                      value={nutritionalFocus || ""}
                      onChange={(e) => updateField("nutritionalFocus", e.target.value)}
                      className={editableSelectClasses}
                    >
                      {NUTRITIONAL_FOCUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ReadOnlyField value={nutritionalFocus} placeholder="—" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Meta personal (fitness)</FieldLabel>
                  {isEditing ? (
                    <select
                      value={fitnessGoals || ""}
                      onChange={(e) => updateField("fitnessGoals", e.target.value)}
                      className={editableSelectClasses}
                    >
                      {FITNESS_GOALS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ReadOnlyField value={fitnessGoals} placeholder="—" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Nivel de actividad</FieldLabel>
                {isEditing ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-2 rounded-2xl bg-amber-50/30 border-2 border-amber-200/80">
                    {ACTIVITY_LEVELS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = al === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => updateActivityLevel(item.key)}
                          className={cn(
                            "h-10 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 px-2",
                            isSelected
                              ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                              : "border-amber-300/80 bg-white text-slate-700 hover:bg-amber-100/50",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-10 flex items-center text-sm font-semibold text-slate-700 bg-slate-50 rounded-xl px-3">
                    {ACTIVITY_LEVELS.find((i) => i.key === al)?.label || "Sed."}
                  </div>
                )}
              </div>
            </div>
          </FormStepCard>
        )}

        {/* ── 3. Antropometría y Cálculos ─────────────────────────────────── */}
        {showSection("antropometria") && (
          <FormStepCard
            icon={<Ruler className="w-4 h-4 text-indigo-600" />}
            title="Antropometría y Cálculos"
            description="Peso, talla y mediciones avanzadas"
          >
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Peso (kg)</FieldLabel>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.weight !== undefined ? editForm.weight : (patient.weight ?? "")}
                      onChange={(e) =>
                        updateField("weight", e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className={cn(editableInputClasses, "text-center")}
                    />
                  ) : (
                    <ReadOnlyField value={patient.weight ? `${patient.weight} kg` : undefined} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Altura (cm)</FieldLabel>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.height !== undefined ? editForm.height : (patient.height ?? "")}
                      onChange={(e) =>
                        updateField("height", e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className={cn(editableInputClasses, "text-center")}
                    />
                  ) : (
                    <ReadOnlyField value={patient.height ? `${patient.height} cm` : undefined} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Peso habitual (kg)</FieldLabel>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={pesoHabitual}
                      onChange={(e) =>
                        updateCV(
                          "pesoHabitual",
                          "Peso habitual",
                          e.target.value ? parseFloat(e.target.value) : "",
                          "kg",
                        )
                      }
                      className={cn(editableInputClasses, "text-center")}
                    />
                  ) : (
                    <ReadOnlyField value={pesoHabitual ? `${pesoHabitual} kg` : undefined} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Peso objetivo prof. (kg)</FieldLabel>
                  <Input
                    type="number"
                    step="0.1"
                    value={rec.vitalHistory.pesoObjetivoProf}
                    onChange={(e) =>
                      updateClinical("vitalHistory", "pesoObjetivoProf", e.target.value)
                    }
                    className={cn(editableInputClasses, "text-center")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Ajuste calórico (kcal)</FieldLabel>
                  <Input
                    type="number"
                    value={rec.vitalHistory.manualCaloriesAdjustment || "0"}
                    onChange={(e) =>
                      updateClinical("vitalHistory", "manualCaloriesAdjustment", e.target.value)
                    }
                    className={cn(editableInputClasses, "text-center")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isCalculated={isEditing}>Fórmula TMB</FieldLabel>
                  <div className="h-10 flex items-center justify-between text-sm font-semibold text-slate-600 bg-slate-100/70 border border-slate-200/60 rounded-xl px-3 cursor-not-allowed">
                    <span>{tmbFormula === "mifflin-st-jeor" ? "Mifflin-St Jeor" : "OMS/FAO"}</span>
                    {isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                  </div>
                </div>
              </div>

              <CalculatedMetricsPanel
                imc={bmi ? { value: bmi.bmi, classification: bmi.classification, color: bmi.color } : undefined}
                get={get ? { value: get.get } : undefined}
                idealWeight={
                  idealWeight && idealWeight.min > 0
                    ? { min: idealWeight.min, max: idealWeight.max, reference: idealWeight.reference }
                    : undefined
                }
              />

              <div className="space-y-1.5">
                <FieldLabel>Distribución de Macronutrientes</FieldLabel>
                <MacroGrid macros={macros} />
              </div>

              <CollapsibleSection title="Mediciones Avanzadas (Pliegues y Perímetros)">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Pliegues Cutáneos (mm)
                    </p>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      {SKINFOLD_FIELDS.map((f) => (
                        <div key={f.key} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                            <span>{f.label}</span>
                            {isEditing && <span className="text-[8px] text-amber-700 font-extrabold">✏️</span>}
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            value={
                              rec.anthropometry.skinfolds[
                                f.key as keyof typeof rec.anthropometry.skinfolds
                              ]
                            }
                            onChange={(e) =>
                              updateClinical("anthropometry", "", e.target.value, "skinfolds", f.key)
                            }
                            className={cn(editableInputClasses, "h-9 text-xs text-center")}
                            placeholder="—"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Perímetros (cm)
                    </p>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      {CIRCUMFERENCE_FIELDS.map((f) => (
                        <div key={f.key} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                            <span>{f.label}</span>
                            {isEditing && <span className="text-[8px] text-amber-700 font-extrabold">✏️</span>}
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            value={
                              rec.anthropometry.circumferences[
                                f.key as keyof typeof rec.anthropometry.circumferences
                              ]
                            }
                            onChange={(e) =>
                              updateClinical(
                                "anthropometry",
                                "",
                                e.target.value,
                                "circumferences",
                                f.key,
                              )
                            }
                            className={cn(editableInputClasses, "h-9 text-xs text-center")}
                            placeholder="—"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </FormStepCard>
        )}

        {/* ── 4. Anamnesis General ────────────────────────────────────────── */}
        {showSection("anamnesis-general") && (
          <FormStepCard
            icon={<Stethoscope className="w-4 h-4 text-indigo-600" />}
            title="Anamnesis General"
            description="Antecedentes clínicos relevantes"
          >
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Ocupación</FieldLabel>
                  <Input
                    value={rec.vitalHistory.occupation}
                    onChange={(e) => updateClinical("vitalHistory", "occupation", e.target.value)}
                    className={editableInputClasses}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Horario laboral</FieldLabel>
                  <Input
                    value={rec.vitalHistory.workSchedule}
                    onChange={(e) => updateClinical("vitalHistory", "workSchedule", e.target.value)}
                    className={editableInputClasses}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Medicamentos</FieldLabel>
                <textarea
                  value={rec.vitalHistory.medications}
                  onChange={(e) => updateClinical("vitalHistory", "medications", e.target.value)}
                  rows={2}
                  className={editableTextareaClasses}
                  placeholder="Fármacos, dosis, frecuencia..."
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Suplementos / drogas</FieldLabel>
                <textarea
                  value={rec.vitalHistory.supplementsOrDrugs}
                  onChange={(e) =>
                    updateClinical("vitalHistory", "supplementsOrDrugs", e.target.value)
                  }
                  rows={2}
                  className={editableTextareaClasses}
                  placeholder="Suplementos, drogas recreativas..."
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Condición clínica principal</FieldLabel>
                {isEditing ? (
                  <select
                    value={primaryCondition || ""}
                    onChange={(e) => updateField("primaryCondition", e.target.value || undefined)}
                    className={editableSelectClasses}
                  >
                    <option value="">Seleccionar...</option>
                    {conditionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <ReadOnlyField value={primaryCondition} placeholder="No registrado" />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Calidad de sueño</FieldLabel>
                  <Input
                    value={rec.vitalHistory.sleepQuality}
                    onChange={(e) => updateClinical("vitalHistory", "sleepQuality", e.target.value)}
                    className={editableInputClasses}
                    placeholder="Buena / Mala..."
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Estrés percibido</FieldLabel>
                  <Input
                    value={rec.vitalHistory.perceivedStress}
                    onChange={(e) =>
                      updateClinical("vitalHistory", "perceivedStress", e.target.value)
                    }
                    className={editableInputClasses}
                    placeholder="Bajo / Medio / Alto"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel isEditable={isEditing}>Ejercicio semanal</FieldLabel>
                  {isEditing ? (
                    <select
                      value={rec.vitalHistory.weeklyExercise || ""}
                      onChange={(e) =>
                        updateClinical("vitalHistory", "weeklyExercise", e.target.value)
                      }
                      className={editableSelectClasses}
                    >
                      {WEEKLY_EXERCISE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ReadOnlyField value={rec.vitalHistory.weeklyExercise} placeholder="No registrado" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Antecedentes familiares</FieldLabel>
                <textarea
                  value={rec.vitalHistory.familyHistory}
                  onChange={(e) => updateClinical("vitalHistory", "familyHistory", e.target.value)}
                  rows={2}
                  className={editableTextareaClasses}
                  placeholder="Antecedentes familiares relevantes..."
                />
              </div>
            </div>
          </FormStepCard>
        )}

        {/* ── 5. Anamnesis Nutricional ────────────────────────────────────── */}
        {showSection("anamnesis-nutricional") && (
          <FormStepCard
            icon={<Apple className="w-4 h-4 text-indigo-600" />}
            title="Anamnesis Nutricional"
            description="Preferencias, restricciones y observaciones"
          >
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Restricciones dietéticas</FieldLabel>
                {isEditing ? (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-amber-50/30 border-2 border-amber-200/80">
                    {DIET_RESTRICTION_OPTIONS.filter(
                      (r) => r.toLowerCase() !== (primaryCondition || "").toLowerCase(),
                    ).map((r) => {
                      const active = dietRestrictions.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRestriction(r)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer",
                            active
                              ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                              : "bg-white text-slate-600 border-amber-300/80 hover:border-amber-400 hover:bg-amber-50/50",
                          )}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  displayedDietRestrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {displayedDietRestrictions.map((r) => (
                        <span
                          key={r}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center text-sm text-slate-300 font-semibold">
                      Sin restricciones
                    </div>
                  )
                )}
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Gustos y preferencias</FieldLabel>
                {isEditing ? (
                  <textarea
                    value={likes || ""}
                    onChange={(e) => updateField("likes", e.target.value)}
                    rows={2}
                    className={editableTextareaClasses}
                    placeholder="Alimentos que le gustan..."
                  />
                ) : (
                  <ReadOnlyField value={likes} placeholder="—" />
                )}
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Alimentos rechazados</FieldLabel>
                {isEditing ? (
                  <textarea
                    value={rejectedFoods}
                    onChange={(e) =>
                      updateCV("rejectedFoods", "Alimentos rechazados", e.target.value)
                    }
                    rows={2}
                    className={editableTextareaClasses}
                    placeholder="Alimentos que no tolera..."
                  />
                ) : (
                  <ReadOnlyField value={rejectedFoods} placeholder="—" />
                )}
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Síntesis clínica</FieldLabel>
                {isEditing ? (
                  <textarea
                    value={clinicalSummary || ""}
                    onChange={(e) => updateField("clinicalSummary", e.target.value)}
                    rows={3}
                    className={editableTextareaClasses}
                    placeholder="Observaciones clínicas generales..."
                  />
                ) : (
                  <ReadOnlyField value={clinicalSummary} placeholder="—" />
                )}
              </div>
              <div className="space-y-1.5">
                <FieldLabel isEditable={isEditing}>Diagnóstico nutricional profesional</FieldLabel>
                {isEditing ? (
                  <Input
                    value={diagnosticoNutricional}
                    onChange={(e) =>
                      updateCV("diagnosticoNutricional", "Diagnóstico nutricional", e.target.value)
                    }
                    className={editableInputClasses}
                    placeholder="Ej: Obesidad grado I, desnutrición leve..."
                  />
                ) : (
                  <ReadOnlyField value={diagnosticoNutricional} placeholder="No registrado" />
                )}
              </div>
            </div>
          </FormStepCard>
        )}

        {/* ── Gestational Panel ──────────────────────────────────────────── */}
        {showSection("gestante") && (
          <>
            {isGestante && gestationalData ? (
              <GestationalPanel
                currentBMI={bmi?.bmi ?? 0}
                gestationalWeek={gestWeek}
                classification={gestationalData.bmi.classification}
                preGestationalWeight={gestationalData.weightGain.preGestationalWeight}
                currentWeight={w ?? 0}
                gainedKg={gestationalData.weightGain.gainedKg}
                preGestationalIMC={gestationalData.weightGain.preGestationalIMC}
                preGestationalStatus={gestationalData.weightGain.preGestationalStatus}
                recommendedTotalMin={gestationalData.weightGain.recommendedTotalMin}
                recommendedTotalMax={gestationalData.weightGain.recommendedTotalMax}
                weeklyGainMin={gestationalData.weightGain.weeklyGainMin}
                weeklyGainMax={gestationalData.weightGain.weeklyGainMax}
                weeklyGainNote={gestationalData.weightGain.weeklyGainNote}
                trimesterLabel={gestationalData.trimester.label}
                extraKcalMin={gestationalData.trimester.extraKcalMin}
                extraKcalMax={gestationalData.trimester.extraKcalMax}
                getBaseKcal={get?.get ?? 0}
                finalCalories={(get?.get ?? 0) + gestationalData.trimester.extraKcalMin}
                macros={macros}
                pregnancyType={rec.gynecoObstetric.pregnancyType}
              />
            ) : (
              <FormStepCard
                icon={<Baby className="w-4 h-4 text-indigo-600" />}
                title="Modo Gestante"
                description="Activa el checkbox de embarazo en Datos del Paciente para ver el panel gestacional."
              >
                <></>
              </FormStepCard>
            )}
          </>
        )}
      </div>

      <nav className="w-48 shrink-0 border-l border-slate-100 pl-4 hidden lg:block">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase">Acceso rápido</p>
          <button
            onClick={onEdit}
            disabled={isEditing}
            className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0",
              isEditing
                ? "text-slate-200 cursor-not-allowed"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50",
            )}
            title={isEditing ? "Modo edición activo" : "Editar paciente"}
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setSelectedSection(s.id === selectedSection ? null : s.id)}
                type="button"
                className={cn(
                  "w-full text-left text-sm rounded-lg px-3 py-2 transition-colors",
                  selectedSection === s.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
