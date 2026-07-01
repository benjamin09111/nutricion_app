"use client";

import { useState, useCallback, useMemo } from "react";
import { User, Mail, Phone, Calendar, Activity, AlertCircle, Ruler, Target, Activity as ActivityIcon, HeartPulse, Dumbbell, Calculator, FileText, ChevronRight } from "lucide-react";
import { FormStepCard } from "@/components/patient-form/FormStepCard";
import { FormNavigationFooter } from "@/components/patient-form/FormNavigationFooter";
import { WizardStepper } from "@/components/patient-form/WizardStepper";
import { SidebarQuickNav } from "@/components/patient-form/SidebarQuickNav";
import { CollapsibleSection } from "@/components/patient-form/CollapsibleSection";
import { CalculatedMetricsPanel } from "@/components/patient-form/CalculatedMetricsPanel";
import { MacroGrid } from "@/components/patient-form/MacroGrid";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { usePatientDraft } from "@/features/patients/hooks/usePatientDraft";
import { cn } from "@/lib/utils";
import { calculateBMI, calculateGET, getIdealWeightRange, calculateAge } from "@/lib/nutrition-formulas";
import { formatRut } from "@/lib/rut-utils";
import { getApiUrl } from "@/lib/api-base";

const STEPS = [
  "Identificación",
  "Antropometría",
  "Objetivos",
  "Anamnesis General",
  "Anamnesis Nutricional",
];

const SECTIONS = [
  { id: "identificacion", label: "Identificación" },
  { id: "antropometria", label: "Antropometría" },
  { id: "objetivos", label: "Objetivos" },
  { id: "anamnesis-general", label: "Anamnesis General" },
  { id: "anamnesis-nutricional", label: "Anamnesis Nutricional" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "Masculino", label: "Masculino" },
  { value: "Femenino", label: "Femenino" },
  { value: "Otro", label: "Otro" },
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

interface PatientFormPageProps {
  onBack?: () => void;
  onSave?: () => void;
}

export function PatientFormPage({ onBack, onSave }: PatientFormPageProps) {
  const { draft, updateDraft, isLoaded } = usePatientDraft();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const customVariableMap = useMemo(
    () => new Map((draft.customVariables || []).map((item) => [item.key, item])),
    [draft.customVariables],
  );

  const getCustomVariableValue = (key: string) => customVariableMap.get(key)?.value as string | undefined;

  const setCustomVariableValue = (
    key: string,
    label: string,
    value: string | number | boolean | Record<string, unknown> | undefined,
    unit = "",
  ) => {
    const next = (draft.customVariables || []).filter((item) => item.key !== key);
    const shouldKeep =
      typeof value === "boolean"
        ? value
        : value !== undefined && value !== null && !(typeof value === "string" && !value.trim());

    if (shouldKeep) {
      next.push({ key, label, unit, value });
    }

    updateDraft({ customVariables: next });
  };

  const calculatedAge = calculateAge(draft.birthDate || null);

  const bmi = draft.weight && draft.height
    ? calculateBMI(
        Number(draft.weight),
        Number(draft.height),
        { gender: draft.gender as "Masculino" | "Femenino" | null, ageYears: calculatedAge }
      )
    : null;

  const idealWeight = draft.height
    ? getIdealWeightRange(Number(draft.height), {
        gender: draft.gender as "Masculino" | "Femenino" | null,
        ageYears: calculatedAge ?? undefined,
      })
    : null;

  const get = bmi && draft.weight && draft.height && calculatedAge
    ? calculateGET(
        draft.gender === "Masculino" || draft.gender === "Femenino" ? draft.gender as "Masculino" | "Femenino" : "Femenino",
        Number(draft.weight),
        Number(draft.height),
        calculatedAge,
        (draft.activityLevel as any) || "sedentario"
      )
    : null;

  const macros = get
    ? [
        { label: "Calorías", value: get.get, unit: "kcal/día", color: "bg-indigo-50" },
        { label: "Proteína", value: Math.round((get.get * 0.2) / 4), unit: "g/día", color: "bg-emerald-50" },
        { label: "Carbohidratos", value: Math.round((get.get * 0.55) / 4), unit: "g/día", color: "bg-amber-50" },
        { label: "Grasas", value: Math.round((get.get * 0.25) / 9), unit: "g/día", color: "bg-rose-50" },
      ]
    : [];

  const goToStep = useCallback((step: number) => {
    setValidationErrors([]);
    setCurrentStep(step);
  }, []);

  const validateCurrentStep = useCallback((): string[] => {
    const errors: string[] = [];
    switch (currentStep) {
      case 0:
        if (!draft.fullName?.trim()) errors.push("Nombre completo");
        if (!draft.email?.trim()) errors.push("Email");
        if (!draft.birthDate) errors.push("Fecha de nacimiento");
        break;
      case 1:
        if (!draft.weight) errors.push("Peso");
        if (!draft.height) errors.push("Altura");
        break;
    }
    return errors;
  }, [currentStep, draft.fullName, draft.email, draft.birthDate, draft.weight, draft.height]);

  const goNext = useCallback(() => {
    if (currentStep === STEPS.length - 1) {
      const errors = validateCurrentStep();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      onSave?.();
    } else {
      const errors = validateCurrentStep();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, onSave, validateCurrentStep]);

  const goBack = useCallback(() => {
    setValidationErrors([]);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack?.();
    }
  }, [currentStep, onBack]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+")) val = "+" + val.replace(/\+/g, "");
    const cleanVal = "+" + val.substring(1).replace(/\D/g, "");
    updateDraft({ phone: cleanVal });
  };

  if (!isLoaded) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormStepCard
            icon={<User className="w-4 h-4 text-emerald-600" />}
            title="Datos del Paciente"
            description="Información básica de identificación"
          >
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nombre Completo *</label>
                <Input
                  placeholder="Valentina Morales Lagos"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                  value={draft.fullName}
                  onChange={(e) => updateDraft({ fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="valen@email.com"
                      className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                      value={draft.email}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="+56 9 1234 5678"
                      className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                      value={draft.phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Fecha de nacimiento *</label>
                  <Input
                    type="date"
                    className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                    value={draft.birthDate || ""}
                    onChange={(e) => updateDraft({ birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Edad</label>
                  <Input
                    type="number"
                    placeholder="--"
                    className="h-10 rounded-xl bg-slate-100 border-transparent text-sm font-semibold text-slate-500"
                    value={calculatedAge ?? ""}
                    readOnly
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Sexo biológico</label>
                  <select
                    value={draft.gender || ""}
                    onChange={(e) => updateDraft({ gender: e.target.value })}
                    className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">RUT</label>
                <Input
                  placeholder="12.345.678-9"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                  value={draft.documentId || ""}
                  onChange={(e) => updateDraft({ documentId: formatRut(e.target.value) })}
                />
              </div>

              {draft.gender === "Femenino" && (
                <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Condición femenina</p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={Boolean(getCustomVariableValue("pregnant"))}
                      onChange={(e) => setCustomVariableValue("pregnant", "Embarazo", e.target.checked)}
                    />
                    ¿Está embarazada?
                  </label>
                  {getCustomVariableValue("pregnant") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Semanas de gestación</label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Ej: 24"
                          className="h-10 rounded-xl bg-white border-emerald-200 text-sm font-semibold"
                          value={(getCustomVariableValue("pregnancyWeeks") as number | undefined) ?? ""}
                          onChange={(e) => setCustomVariableValue("pregnancyWeeks", "Semanas de gestación", e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Peso pre-gestacional (kg)</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ej: 62.5"
                          className="h-10 rounded-xl bg-white border-emerald-200 text-sm font-semibold"
                          value={(getCustomVariableValue("pregestationalWeight") as number | undefined) ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(",", ".");
                            setCustomVariableValue("pregestationalWeight", "Peso pre-gestacional", raw ? Number(raw) : undefined, "kg");
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormStepCard>
        );

      case 1:
        return (
          <FormStepCard
            icon={<Ruler className="w-4 h-4 text-emerald-600" />}
            title="Antropometría"
            description="Medidas corporales que alimentan los cálculos automáticos"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Peso (kg) *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="70.5"
                    className="h-10 rounded-xl bg-slate-50 border-transparent text-center font-bold text-base"
                    value={draft.weight ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      updateDraft({ weight: raw ? parseFloat(raw) : undefined });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Altura (cm) *</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="170"
                    className="h-10 rounded-xl bg-slate-50 border-transparent text-center font-bold text-base"
                    value={draft.height ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".").replace(/\D\./, "");
                      updateDraft({ height: raw ? Number(raw) : undefined });
                    }}
                  />
                </div>
              </div>

              <CalculatedMetricsPanel
                imc={bmi ? { value: bmi.bmi, classification: bmi.classification, color: bmi.color } : undefined}
                get={get ? { value: get.get } : undefined}
                idealWeight={idealWeight && idealWeight.supported !== false ? { min: idealWeight.min, max: idealWeight.max, reference: idealWeight.reference } : undefined}
                pesoIdealNote={idealWeight?.supported === false ? idealWeight.note : undefined}
              />

              <MacroGrid macros={macros} />

              <CollapsibleSection title="Pliegues cutáneos" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "pliegueTricipital", label: "Tricipital" },
                    { key: "pliegueBicipital", label: "Bicipital" },
                    { key: "pliegueSubescapular", label: "Subescapular" },
                    { key: "pliegueSuprailiaco", label: "Suprailiaco" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 capitalize">
                        {label} (mm)
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="12"
                        className="h-10 rounded-xl bg-slate-50 border-transparent text-center font-semibold text-sm"
                        value={getCustomVariableValue(key) ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          setCustomVariableValue(key, key, val ? parseFloat(val) : undefined, "mm");
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          </FormStepCard>
        );

      case 2:
        return (
          <FormStepCard
            icon={<Target className="w-4 h-4 text-emerald-600" />}
            title="Objetivos y Restricciones"
            description="Define el foco nutricional y las metas del paciente"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Foco Nutricional</label>
                <select
                  value={draft.nutritionalFocus || ""}
                  onChange={(e) => updateDraft({ nutritionalFocus: e.target.value || undefined })}
                  className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  {NUTRITIONAL_FOCUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Metas Fitness</label>
                <select
                  value={draft.fitnessGoals || ""}
                  onChange={(e) => updateDraft({ fitnessGoals: e.target.value || undefined })}
                  className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  {FITNESS_GOALS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Nivel de actividad</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: "sedentario", icon: ActivityIcon, label: "Sed." },
                    { key: "ligero", icon: HeartPulse, label: "Lig." },
                    { key: "moderado", icon: Dumbbell, label: "Mod." },
                    { key: "activo", icon: Dumbbell, label: "Act." },
                    { key: "muy_activo", icon: Dumbbell, label: "M.Act." },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateDraft({ activityLevel: item.key as any })}
                      className={cn(
                        "h-10 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-black uppercase tracking-wider",
                        draft.activityLevel === item.key
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100"
                      )}
                    >
                      <item.icon className="w-3 h-3" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Restricciones dietéticas</label>
                <TagInput
                  value={draft.dietRestrictions || []}
                  onChange={(tags) => updateDraft({ dietRestrictions: tags })}
                  fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                  placeholder="Diabetes, Celiaco, Alergias..."
                  className="rounded-xl bg-slate-50 border-transparent h-10 text-sm"
                />
              </div>
            </div>
          </FormStepCard>
        );

      case 3:
        return (
          <FormStepCard
            icon={<FileText className="w-4 h-4 text-emerald-600" />}
            title="Anamnesis General"
            description="Historia clínica y contexto del paciente"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Ocupación</label>
                  <Input
                    placeholder="Ej: Secretaria administrativa"
                    className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                    value={getCustomVariableValue("occupation") ?? ""}
                    onChange={(e) => setCustomVariableValue("occupation", "Ocupación", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Horario laboral</label>
                  <Input
                    placeholder="Ej: Mañana / tarde / rotativo"
                    className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                    value={getCustomVariableValue("workSchedule") ?? ""}
                    onChange={(e) => setCustomVariableValue("workSchedule", "Horario laboral", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Fármacos / Medicamentos</label>
                <textarea
                  placeholder="Ej: Metformina 850 mg, una vez al día"
                  className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={getCustomVariableValue("medications") ?? ""}
                  onChange={(e) => setCustomVariableValue("medications", "Medicamentos", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Suplementos / Drogas</label>
                <textarea
                  placeholder="Ej: Creatina, omega 3, alcohol social"
                  className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={getCustomVariableValue("drugsSupplements") ?? ""}
                  onChange={(e) => setCustomVariableValue("drugsSupplements", "Drogas y suplementos", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Patologías diagnosticadas</label>
                <textarea
                  placeholder="Ej: Hipotiroidismo, resistencia a la insulina"
                  className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={getCustomVariableValue("diagnosedPathologies") ?? ""}
                  onChange={(e) => setCustomVariableValue("diagnosedPathologies", "Patologías diagnosticadas", e.target.value)}
                />
              </div>
            </div>
          </FormStepCard>
        );

      case 4:
        return (
          <FormStepCard
            icon={<Calculator className="w-4 h-4 text-emerald-600" />}
            title="Anamnesis Nutricional"
            description="Patrones de consumo alimentario del paciente"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Frecuencia de consumo por grupos de alimentos</label>
                <textarea
                  placeholder="Ej: 1-2 porciones de lácteos al día, frutas 2-3 veces por semana..."
                  className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={getCustomVariableValue("foodFrequency") ?? ""}
                  onChange={(e) => setCustomVariableValue("foodFrequency", "Frecuencia alimentaria", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Recordatorio de 24 horas</label>
                <textarea
                  placeholder="Ej: 07:30 café con pan, 13:00 almuerzo completo, 18:00 once..."
                  className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={getCustomVariableValue("recall24h") ?? ""}
                  onChange={(e) => setCustomVariableValue("recall24h", "Recordatorio 24 horas", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Gustos / Preferencias</label>
                <textarea
                  placeholder="Ej: Prefiere comidas calientes, no tolera pescado..."
                  className="min-h-16 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={draft.likes || ""}
                  onChange={(e) => updateDraft({ likes: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Observaciones clínicas</label>
                <textarea
                  placeholder="Ej: Ansiedad por dulces, insomnio..."
                  className="min-h-16 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 resize-none"
                  value={draft.clinicalSummary || ""}
                  onChange={(e) => updateDraft({ clinicalSummary: e.target.value })}
                />
              </div>
            </div>
          </FormStepCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-8 max-w-6xl mx-auto py-6">
      <SidebarQuickNav
        sections={SECTIONS}
        activeSection={SECTIONS[currentStep].id}
        onSelect={(id) => {
          const index = SECTIONS.findIndex(s => s.id === id);
          if (index !== -1) goToStep(index);
        }}
      />
      <div className="flex-1">
        <WizardStepper
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Completa los campos requeridos:</p>
              <ul className="text-sm text-red-600 mt-1 space-y-0.5">
                {validationErrors.map((err) => (
                  <li key={err}>• {err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {renderStepContent()}
        <FormNavigationFooter
          onBack={goBack}
          onNext={goNext}
          isFirstStep={currentStep === 0}
          nextLabel={currentStep === STEPS.length - 1 ? "Guardar" : "Continuar"}
        />
      </div>
    </div>
  );
}
