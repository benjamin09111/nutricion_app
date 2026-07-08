import React from "react";
import {
  User,
  Mail,
  Phone,
  Ruler,
  Activity,
  Target,
  Flame,
  Heart,
  Dumbbell,
  Zap,
  AlertCircle,
  Leaf,
  BookOpen,
  Star,
  Ban,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Patient, ActivityLevel } from "@/features/patients";
import { formatRut } from "@/lib/rut-utils";
import { calculateBMI, calculateGET, calculateAge, getIdealWeightRange } from "@/lib/nutrition-formulas";
import {
  cn,
  toDateOnly,
  formatDateOnlyForLocale,
} from "../utils/patient-helpers";

export const ACTIVITY_LEVEL_OPTIONS: {
  key: ActivityLevel;
  label: string;
  description: string;
  icon: any;
}[] = [
  { key: "sedentario", label: "Sedentario", description: "Poco o ningún ejercicio", icon: Flame },
  { key: "ligero", label: "Ligero", description: "Ejercicio 1-3 días/semana", icon: Activity },
  { key: "moderado", label: "Moderado", description: "Ejercicio 3-5 días/semana", icon: Heart },
  { key: "activo", label: "Activo", description: "Ejercicio 6-7 días/semana", icon: Dumbbell },
  { key: "muy_activo", label: "Muy activo", description: "Atleta o trabajo físico pesado", icon: Zap },
];

interface PatientGeneralTabProps {
  patient: Patient;
  isEditing: boolean;
  editForm: Partial<Patient>;
  updateField: (field: keyof Patient, value: any) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getCurrentActivityLevel: () => ActivityLevel;
  updateActivityLevel: (value: ActivityLevel) => void;
  toggleStatus: () => void;
  automaticNutritionCalculations?: any;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children, className }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
        <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 w-28 shrink-0 mt-0.5">{label}</span>
      {children || (
        <span className={cn("text-xs font-semibold flex-1", value ? "text-slate-800" : "text-slate-300")}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

export function PatientGeneralTab({
  patient,
  isEditing,
  editForm,
  updateField,
  handlePhoneChange,
  getCurrentActivityLevel,
  updateActivityLevel,
  toggleStatus,
  automaticNutritionCalculations,
}: PatientGeneralTabProps) {
  // ── Custom variable helpers ────────────────────────────────────────────────
  const getCV = (key: string): string => {
    const src = isEditing ? editForm.customVariables : patient.customVariables;
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

  // ── Computed values ────────────────────────────────────────────────────────
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

  // Clinical data
  const motivoConsulta = getCV("motivoConsulta");
  const nutritionalFocus = isEditing ? (editForm.nutritionalFocus ?? patient.nutritionalFocus) : patient.nutritionalFocus;
  const fitnessGoals = isEditing ? (editForm.fitnessGoals ?? patient.fitnessGoals) : patient.fitnessGoals;
  const clinicalSummary = isEditing ? (editForm.clinicalSummary ?? patient.clinicalSummary) : patient.clinicalSummary;
  const likes = isEditing ? (editForm.likes ?? patient.likes) : patient.likes;
  const rejectedFoods = getCV("rejectedFoods");
  const dietRestrictions: string[] = (isEditing ? editForm.dietRestrictions : patient.dietRestrictions) ?? [];
  const gestationalSupplementation: string[] = (() => {
    const val = getCV("gestationalSupplementation");
    if (Array.isArray(val)) return val;
    return [];
  })();
  const diagnosticoNutricional = getCV("diagnosticoNutricional");
  const pesoHabitual = getCV("pesoHabitual");

  return (
    <div className="animate-in fade-in duration-400">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN: Clinical info ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Datos de identidad */}
          <SectionCard icon={<User className="w-4 h-4 text-emerald-600" />} title="Datos del paciente">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  {isEditing ? (
                    <Input
                      placeholder="valen@email.com"
                      className="h-9 pl-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                      value={editForm.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  ) : (
                    <div className="h-9 pl-9 flex items-center text-sm font-semibold text-slate-700">
                      {patient.email || <span className="text-slate-300">Sin email</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  {isEditing ? (
                    <Input
                      placeholder="+56 9 1234 5678"
                      className="h-9 pl-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                      value={editForm.phone || ""}
                      onChange={handlePhoneChange}
                    />
                  ) : (
                    <div className="h-9 pl-9 flex items-center text-sm font-semibold text-slate-700">
                      {patient.phone || <span className="text-slate-300">No registrado</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* RUT */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">RUT</label>
                {isEditing ? (
                  <Input
                    placeholder="12.345.678-9"
                    className="h-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                    value={editForm.documentId || ""}
                    onChange={(e) => updateField("documentId", formatRut(e.target.value))}
                  />
                ) : (
                  <div className="h-9 flex items-center text-sm font-semibold text-slate-700 px-1">
                    {patient.documentId || <span className="text-slate-300">Sin identificador</span>}
                  </div>
                )}
              </div>

              {/* Sexo */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sexo</label>
                {isEditing ? (
                  <select
                    value={editForm.gender || ""}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className="w-full h-9 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer appearance-none"
                  >
                    <option value="">—</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                ) : (
                  <div className="h-9 flex items-center text-sm font-semibold text-slate-700 px-1">
                    {patient.gender || <span className="text-slate-300">No def.</span>}
                  </div>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nacimiento</label>
                {isEditing ? (
                  <Input
                    type="date"
                    className="h-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                    value={toDateOnly(editForm.birthDate)}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                ) : (
                  <div className="h-9 flex items-center text-sm font-semibold text-slate-700 px-1">
                    {patient.birthDate
                      ? formatDateOnlyForLocale(patient.birthDate, { year: "numeric", month: "short", day: "numeric" })
                      : <span className="text-slate-300">—</span>}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Objetivos clínicos */}
          <SectionCard icon={<Target className="w-4 h-4 text-indigo-600" />} title="Objetivo clínico">
            <div className="space-y-3">
              <FieldRow label="Motivo" value={motivoConsulta || undefined} />
              <FieldRow label="Enfoque" >
                {isEditing ? (
                  <Input
                    className="h-8 rounded-lg bg-slate-50 border-transparent text-xs font-semibold flex-1"
                    placeholder="Ej: Pérdida de peso saludable"
                    value={nutritionalFocus || ""}
                    onChange={(e) => updateField("nutritionalFocus", e.target.value)}
                  />
                ) : (
                  <span className={cn("text-xs font-semibold flex-1", nutritionalFocus ? "text-slate-800" : "text-slate-300")}>
                    {nutritionalFocus || "—"}
                  </span>
                )}
              </FieldRow>
              <FieldRow label="Meta personal">
                {isEditing ? (
                  <Input
                    className="h-8 rounded-lg bg-slate-50 border-transparent text-xs font-semibold flex-1"
                    placeholder="Ej: Correr 5k en 3 meses"
                    value={fitnessGoals || ""}
                    onChange={(e) => updateField("fitnessGoals", e.target.value)}
                  />
                ) : (
                  <span className={cn("text-xs font-semibold flex-1", fitnessGoals ? "text-slate-800" : "text-slate-300")}>
                    {fitnessGoals || "—"}
                  </span>
                )}
              </FieldRow>
              {diagnosticoNutricional && (
                <FieldRow label="Dx. nutricional" value={diagnosticoNutricional} />
              )}
            </div>
          </SectionCard>

          {/* Preferencias alimentarias */}
          <SectionCard icon={<Leaf className="w-4 h-4 text-emerald-600" />} title="Preferencias alimentarias">
            <div className="space-y-3">
              {/* Restricciones */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Restricciones dietéticas</p>
                {dietRestrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {dietRestrictions.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                        <Ban className="w-2.5 h-2.5" />{r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 font-semibold">Sin restricciones</p>
                )}
              </div>

              <FieldRow label="Gustos">
                {isEditing ? (
                  <textarea
                    className="w-full rounded-lg bg-slate-50 border-transparent text-xs font-semibold px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 flex-1"
                    rows={2}
                    placeholder="Alimentos que le gustan..."
                    value={likes || ""}
                    onChange={(e) => updateField("likes", e.target.value)}
                  />
                ) : (
                  <span className={cn("text-xs font-semibold flex-1 leading-relaxed", likes ? "text-slate-800" : "text-slate-300")}>
                    {likes || "—"}
                  </span>
                )}
              </FieldRow>

              <FieldRow label="Rechazados">
                {isEditing ? (
                  <textarea
                    className="w-full rounded-lg bg-slate-50 border-transparent text-xs font-semibold px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 flex-1"
                    rows={2}
                    placeholder="Alimentos que no tolera..."
                    value={rejectedFoods}
                    onChange={(e) => updateCV("rejectedFoods", "Alimentos rechazados", e.target.value)}
                  />
                ) : (
                  <span className={cn("text-xs font-semibold flex-1 leading-relaxed", rejectedFoods ? "text-slate-800" : "text-slate-300")}>
                    {rejectedFoods || "—"}
                  </span>
                )}
              </FieldRow>
            </div>
          </SectionCard>

          {/* Observaciones clínicas */}
          {(clinicalSummary || isEditing) && (
            <SectionCard icon={<Stethoscope className="w-4 h-4 text-slate-600" />} title="Síntesis clínica">
              {isEditing ? (
                <textarea
                  className="w-full rounded-xl bg-slate-50 border-transparent text-xs font-semibold px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200"
                  rows={3}
                  placeholder="Observaciones clínicas generales..."
                  value={clinicalSummary || ""}
                  onChange={(e) => updateField("clinicalSummary", e.target.value)}
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">{clinicalSummary}</p>
              )}
            </SectionCard>
          )}

          {/* Suplementación gestacional */}
          {gestationalSupplementation.length > 0 && (
            <SectionCard icon={<Pill className="w-4 h-4 text-violet-600" />} title="Suplementación indicada">
              <div className="flex flex-wrap gap-1.5">
                {gestationalSupplementation.map((s) => (
                  <span key={s} className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Estado */}
          <div className={cn(
            "bg-white rounded-2xl border p-4 transition-all",
            patient.status === "Inactive" ? "border-slate-200 bg-slate-50/50" : "border-slate-100",
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {patient.status === "Active" ? "Paciente activo" : "Paciente inactivo"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {patient.status === "Active"
                    ? "En seguimiento activo."
                    : "Historial clínico conservado."}
                </p>
              </div>
              <Button
                onClick={toggleStatus}
                variant="outline"
                className={cn(
                  "h-8 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                  patient.status === "Active"
                    ? "border-slate-200 text-slate-400 hover:bg-slate-100"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white",
                )}
              >
                {patient.status === "Active" ? "Marcar inactivo" : "Reactivar"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Nutrition panel + anthropometry ─────────────── */}
        <div className="space-y-4">

          {/* Antropometría + actividad */}
          <SectionCard icon={<Ruler className="w-4 h-4 text-indigo-600" />} title="Antropometría">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Peso (kg)</label>
                  {isEditing ? (
                    <Input
                      type="number" step="0.1"
                      className="h-9 rounded-xl bg-slate-50 border-transparent text-center font-bold text-sm"
                      value={editForm.weight !== undefined ? editForm.weight : (patient.weight ?? "")}
                      onChange={(e) => updateField("weight", e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  ) : (
                    <div className="h-9 flex items-center justify-center bg-indigo-50 rounded-xl text-sm font-black text-indigo-700 border border-indigo-100">
                      {patient.weight ? `${patient.weight} kg` : "—"}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Talla (cm)</label>
                  {isEditing ? (
                    <Input
                      type="number" step="0.1"
                      className="h-9 rounded-xl bg-slate-50 border-transparent text-center font-bold text-sm"
                      value={editForm.height !== undefined ? editForm.height : (patient.height ?? "")}
                      onChange={(e) => updateField("height", e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  ) : (
                    <div className="h-9 flex items-center justify-center bg-emerald-50 rounded-xl text-sm font-black text-emerald-700 border border-emerald-100">
                      {patient.height ? `${patient.height} cm` : "—"}
                    </div>
                  )}
                </div>
              </div>

              {/* Peso habitual */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Peso habitual (kg)</label>
                {isEditing ? (
                  <Input
                    type="number" step="0.1"
                    className="h-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                    placeholder="—"
                    value={pesoHabitual}
                    onChange={(e) => updateCV("pesoHabitual", "Peso habitual", e.target.value ? parseFloat(e.target.value) : "", "kg")}
                  />
                ) : (
                  <div className="h-9 flex items-center text-sm font-semibold text-slate-700 px-1">
                    {pesoHabitual ? `${pesoHabitual} kg` : <span className="text-slate-300">—</span>}
                  </div>
                )}
              </div>

              {/* Actividad */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Nivel de actividad</label>
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-1">
                    {ACTIVITY_LEVEL_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = getCurrentActivityLevel() === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => updateActivityLevel(item.key)}
                          className={cn(
                            "h-9 rounded-xl border px-3 text-left transition-all cursor-pointer flex items-center gap-2",
                            isSelected
                              ? "border-emerald-500 bg-emerald-600 text-white"
                              : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 flex items-center gap-2">
                    {(() => {
                      const current = ACTIVITY_LEVEL_OPTIONS.find((i) => i.key === getCurrentActivityLevel()) || ACTIVITY_LEVEL_OPTIONS[0];
                      const Icon = current.icon;
                      return (
                        <>
                          <div className="h-7 w-7 rounded-lg bg-white text-emerald-600 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">{current.label}</p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* IMC + GET panel */}
          <SectionCard icon={<Activity className="w-4 h-4 text-blue-600" />} title="Evaluación nutricional">
            <div className="space-y-3">
              {bmi ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">IMC</span>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">{bmi.bmi}</span>
                      <span className="text-[10px] text-slate-400 ml-1">kg/m²</span>
                    </div>
                  </div>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white w-full text-center"
                    style={{ backgroundColor: bmi.color }}
                  >
                    {bmi.classification}
                  </span>
                  {idealWeight && idealWeight.supported !== false && (
                    <p className="text-[11px] text-slate-400 text-center">
                      Rango ideal: {idealWeight.min}–{idealWeight.max} kg
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">Ingresa peso y talla para calcular IMC.</p>
              )}

              <div className="border-t border-slate-50 pt-3">
                {get ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "TMB", value: get.tmb, unit: "kcal", color: "text-slate-700 bg-slate-50" },
                      { label: "GET", value: get.get, unit: "kcal", color: "text-emerald-700 bg-emerald-50" },
                      { label: "Proteína", value: get.macros.protein, unit: "g", color: "text-blue-700 bg-blue-50" },
                      { label: "CHO", value: get.macros.carbs, unit: "g", color: "text-amber-700 bg-amber-50" },
                    ].map((m) => (
                      <div key={m.label} className={cn("rounded-xl p-2.5 text-center", m.color)}>
                        <p className="text-[9px] font-black uppercase tracking-wider opacity-60 mb-0.5">{m.label}</p>
                        <p className="text-sm font-black">{m.value} <span className="text-[9px] opacity-50">{m.unit}</span></p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">Datos incompletos para calcular GET.</p>
                )}
              </div>

              {automaticNutritionCalculations?.cardiovascularRisk && (
                <div className="border-t border-slate-50 pt-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Riesgo cardiovascular</p>
                  <div className="space-y-1 text-xs">
                    {automaticNutritionCalculations.cardiovascularRisk.waistClassification && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cintura:</span>
                        <span className="font-bold text-slate-700">{automaticNutritionCalculations.cardiovascularRisk.waistClassification}</span>
                      </div>
                    )}
                    {automaticNutritionCalculations.cardiovascularRisk.riskLevel && (
                      <div className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 rounded border border-rose-100 w-full text-center">
                        Riesgo: {automaticNutritionCalculations.cardiovascularRisk.riskLevel}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Medidas complementarias */}
          <SectionCard icon={<Ruler className="w-4 h-4 text-blue-600" />} title="Medidas complementarias">
            {(() => {
              const fields = [
                { key: "alturaRodilla", label: "Altura rodilla", unit: "cm" },
                { key: "circunferenciaPantorrilla", label: "Circ. pantorrilla", unit: "cm" },
                { key: "circunferenciaBraquial", label: "Circ. braquial", unit: "cm" },
                { key: "circunferenciaCintura", label: "Circ. cintura", unit: "cm" },
                { key: "circunferenciaCadera", label: "Circ. cadera", unit: "cm" },
                { key: "pliegueTricipital", label: "P. tricipital", unit: "mm" },
                { key: "pliegueBicipital", label: "P. bicipital", unit: "mm" },
                { key: "pliegueSubescapular", label: "P. subescapular", unit: "mm" },
                { key: "pliegueSuprailiaco", label: "P. suprailíaco", unit: "mm" },
              ];
              return (
                <div className="grid grid-cols-2 gap-2">
                  {fields.map((f) => (
                    <div key={f.key} className="space-y-0.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{f.label}</label>
                      {isEditing ? (
                        <Input
                          type="number" step="0.1"
                          value={getCV(f.key)}
                          onChange={(e) => updateCV(f.key, f.label, e.target.value ? parseFloat(e.target.value) : "", f.unit)}
                          className="h-8 font-semibold bg-slate-50 rounded-lg text-xs border-transparent text-center"
                          placeholder="—"
                        />
                      ) : (
                        <div className="h-8 flex items-center justify-center rounded-lg font-bold text-xs bg-slate-50 text-slate-700">
                          {getCV(f.key) ? `${getCV(f.key)} ${f.unit}` : <span className="text-slate-300">—</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionCard>

          {/* Metas nutricionales (targets) */}
          <SectionCard icon={<Target className="w-4 h-4 text-emerald-500" />} title="Metas nutricionales">
            {(() => {
              const targets = [
                { id: "Calories", label: "Calorías", unit: "kcal", color: "text-indigo-600", bg: "bg-indigo-50" },
                { id: "Protein", label: "Proteína", unit: "g", color: "text-emerald-600", bg: "bg-emerald-50" },
              ];
              return (
                <div className="grid grid-cols-2 gap-2">
                  {targets.map((f) => (
                    <div key={f.id} className="space-y-0.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{f.label}</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={getCV(`target${f.id}`)}
                          onChange={(e) => updateCV(`target${f.id}`, `${f.label} Meta`, e.target.value, f.unit)}
                          className={cn("h-9 font-bold bg-white rounded-lg text-xs border-transparent", f.color)}
                          placeholder="0"
                        />
                      ) : (
                        <div className={cn("h-9 flex items-center justify-center rounded-lg font-bold text-xs border border-transparent", f.bg, f.color)}>
                          {getCV(`target${f.id}`) ? `${getCV(`target${f.id}`)} ${f.unit}` : <span className="opacity-40">—</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
