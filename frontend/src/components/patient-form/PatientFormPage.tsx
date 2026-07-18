"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Activity, AlertCircle, Ruler, Target, Activity as ActivityIcon, HeartPulse, Dumbbell, Calculator, FileText, ChevronRight, Lock, RotateCcw } from "lucide-react";
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
import { buildClinicalRecordFromPatientDraft } from "@/features/patients/clinical-record";
import { cn, sanitizePhone } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { calculateBMI, calculateGET, getIdealWeightRange, calculateAge } from "@/lib/nutrition-formulas";
import { formatRut, validateRut } from "@/lib/rut-utils";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";

const STEPS = [
  "Identificación",
  "Antropometría",
  "Objetivos",
  "Anamnesis General",
  "Anamnesis Nutricional",
  "Resumen final",
];

const SECTIONS = [
  { id: "identificacion", label: "Identificación" },
  { id: "antropometria", label: "Antropometría" },
  { id: "objetivos", label: "Objetivos" },
  { id: "anamnesis-general", label: "Anamnesis General" },
  { id: "anamnesis-nutricional", label: "Anamnesis Nutricional" },
  { id: "resumen-final", label: "Resumen final" },
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
}

export function PatientFormPage({ onBack }: PatientFormPageProps) {
  const router = useRouter();
  const { draft, updateDraft, clearDraft, isLoaded } = usePatientDraft();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [conditionTags, setConditionTags] = useState<string[]>([]);

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

  useEffect(() => {
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    if (!token) return;
    fetchApi("/tags?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: any[]) => {
        const names = Array.isArray(data)
          ? data.map((t: any) => (typeof t === "string" ? t : t.name))
          : [];
        setConditionTags(names);
      })
      .catch(() => setConditionTags([]));
  }, []);

  const conditionOptions = useMemo(() => {
    const defaults = DEFAULT_CONSTRAINTS.map((c) => c.id);
    return [...new Set([...defaults, ...conditionTags])];
  }, [conditionTags]);

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

  async function handleSave() {
    const errors = validateCurrentStep();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!draft.fullName?.trim() || !draft.email?.trim()) {
      toast.error("Por favor completa Nombre y Email.");
      goToStep(0);
      return;
    }

    if (draft.documentId && !validateRut(draft.documentId)) {
      toast.error("El RUT ingresado no es válido.");
      goToStep(0);
      return;
    }

    setIsSaving(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const payload: Record<string, unknown> = {
        fullName: draft.fullName,
        email: draft.email || undefined,
        phone: draft.phone || undefined,
        documentId: draft.documentId || undefined,
        birthDate: draft.birthDate ? new Date(draft.birthDate).toISOString() : undefined,
        age: calculatedAge ?? undefined,
        gender: draft.gender || undefined,
        height: draft.height ? Number(String(draft.height).replace(",", ".")) : undefined,
        weight: draft.weight ? Number(String(draft.weight).replace(",", ".")) : undefined,
        dietRestrictions: draft.dietRestrictions || [],
        primaryCondition: draft.primaryCondition || undefined,
        clinicalSummary: draft.clinicalSummary || undefined,
        nutritionalFocus: draft.nutritionalFocus || undefined,
        fitnessGoals: draft.fitnessGoals || undefined,
        likes: draft.likes || undefined,
        activityLevel: (draft.activityLevel as string) || "sedentario",
        clinicalRecord: buildClinicalRecordFromPatientDraft(draft),
        recalculateNutrition: true,
      };

      const response = await fetchApi("/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error al guardar el paciente");
      }

      const savedPatient = await response.json();
      clearDraft();
      toast.success("Paciente registrado con éxito.");
      router.push(`/dashboard/pacientes/${savedPatient.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error de conexión con el servidor");
    } finally {
      setIsSaving(false);
    }
  }

  const goNext = useCallback(() => {
    if (currentStep === STEPS.length - 1) {
      void handleSave();
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
  }, [currentStep, handleSave, validateCurrentStep]);

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

  const handleReset = () => {
    clearDraft();
    setQuickName("");
    setQuickEmail("");
    setQuickPhone("+56");
    setQuickRut("");
    setQuickBirth("");
    setQuickGender("");
    setQuickMotivo("");
    setQuickPeso("");
    setQuickAltura("");
    setCurrentStep(0);
    setCompletedSteps([]);
    setValidationErrors([]);
    setShowResetConfirm(false);
    toast.info("Formulario reiniciado.");
  };

  const [showQuick, setShowQuick] = useState(true);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickPhone, setQuickPhone] = useState("+56");
  const [quickRut, setQuickRut] = useState("");
  const [quickBirth, setQuickBirth] = useState("");
  const [quickGender, setQuickGender] = useState("");
  const [quickMotivo, setQuickMotivo] = useState("");
  const [quickPeso, setQuickPeso] = useState("");
  const [quickAltura, setQuickAltura] = useState("");

  const quickAge = useMemo(() => {
    if (!quickBirth) return null;
    const age = calculateAge(quickBirth);
    return age !== undefined ? age : null;
  }, [quickBirth]);

  if (!isLoaded) return null;

  const handleQuickCreate = async () => {
    if (!quickName || quickName.length < 2) { toast.error("Nombre requerido"); return; }
    if (!quickEmail || !quickEmail.includes("@")) { toast.error("Email válido requerido"); return; }
    if (quickRut && !validateRut(quickRut)) { toast.error("El RUT ingresado no es válido."); return; }
    if (!quickGender) { toast.error("Sexo biológico requerido"); return; }
    setIsSaving(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const vars: any[] = [{ key: "evaluationDate", label: "Fecha de evaluación", value: new Date().toISOString().split("T")[0] }];
      if (quickMotivo) vars.push({ key: "motivoConsulta", label: "Motivo de consulta", value: quickMotivo });
      const r = await fetchApi("/patients", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ fullName: quickName, email: quickEmail || undefined, phone: quickPhone || undefined, documentId: quickRut || undefined, birthDate: quickBirth ? new Date(quickBirth).toISOString() : undefined, gender: quickGender, weight: quickPeso ? parseFloat(quickPeso) : undefined, height: quickAltura ? parseFloat(quickAltura) : undefined, activityLevel: "sedentario", recalculateNutrition: true, customVariables: vars }) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Error"); }
      const p = await r.json();
      toast.success("Paciente creado");
      router.push(`/dashboard/pacientes/${p.id}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setIsSaving(false); }
  };

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
                          setCustomVariableValue(key, label, val ? parseFloat(val) : undefined, "mm");
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Mediciones Complementarias (Chumlea / Perímetros)" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "alturaRodilla", label: "Altura de rodilla", unit: "cm" },
                    { key: "circunferenciaPantorrilla", label: "Circ. pantorrilla", unit: "cm" },
                    { key: "circunferenciaBraquial", label: "Circ. braquial", unit: "cm" },
                    { key: "circunferenciaCintura", label: "Circ. cintura (cardio)", unit: "cm" },
                    { key: "circunferenciaCadera", label: "Circ. cadera (cardio)", unit: "cm" },
                  ].map(({ key, label, unit }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">
                        {label} ({unit})
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="--"
                        className="h-10 rounded-xl bg-slate-50 border-transparent text-center font-semibold text-sm"
                        value={getCustomVariableValue(key) ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          setCustomVariableValue(key, label, val ? parseFloat(val) : undefined, unit);
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
                <label className="text-xs font-medium text-slate-500">Condición clínica principal</label>
                <select
                  value={draft.primaryCondition || ""}
                  onChange={(e) => updateDraft({ primaryCondition: e.target.value || undefined })}
                  className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  {conditionOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
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

      case 5:
        return (
          <FormStepCard
            icon={<FileText className="w-4 h-4 text-indigo-600" />}
            title="Resumen final"
            description="Revisa los datos antes de guardar"
          >
            <div className="grid gap-4">
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Identificación</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-slate-400">Nombre: <span className="font-semibold text-slate-700">{draft.fullName || "—"}</span></p>
                  <p className="text-slate-400">Email: <span className="font-semibold text-slate-700">{draft.email || "—"}</span></p>
                  <p className="text-slate-400">Teléfono: <span className="font-semibold text-slate-700">{draft.phone || "—"}</span></p>
                  <p className="text-slate-400">Nacimiento: <span className="font-semibold text-slate-700">{draft.birthDate ? new Date(draft.birthDate).toLocaleDateString("es-ES") : "—"}</span></p>
                  <p className="text-slate-400">Sexo: <span className="font-semibold text-slate-700">{draft.gender || "—"}</span></p>
                  <p className="text-slate-400">RUT: <span className="font-semibold text-slate-700">{draft.documentId || "—"}</span></p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Antropometría</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-slate-400">Peso: <span className="font-semibold text-slate-700">{draft.weight ? `${draft.weight} kg` : "—"}</span></p>
                  <p className="text-slate-400">Altura: <span className="font-semibold text-slate-700">{draft.height ? `${draft.height} cm` : "—"}</span></p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Objetivos</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-slate-400">Enfoque: <span className="font-semibold text-slate-700">{draft.nutritionalFocus || "—"}</span></p>
                  <p className="text-slate-400">Meta: <span className="font-semibold text-slate-700">{draft.fitnessGoals || "—"}</span></p>
                  <p className="text-slate-400">Actividad: <span className="font-semibold text-slate-700">{draft.activityLevel || "—"}</span></p>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">Puedes volver a cualquier paso para editar. Los datos se guardarán al finalizar.</p>
            </div>
          </FormStepCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200/60 shadow-sm">
          <button type="button" onClick={() => setShowQuick(true)} className={cn("px-5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider", showQuick ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}>Creación rápida</button>
          <button type="button" onClick={() => setShowQuick(false)} className={cn("px-5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider", !showQuick ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}>Creación detallada</button>
          <div className="relative group px-5 py-2 text-xs font-black rounded-xl uppercase tracking-wider text-slate-400 cursor-not-allowed flex items-center gap-1.5" title="">
            <Lock className="w-3 h-3" />
            Formulario creación
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-800 text-white text-[11px] font-medium px-3 py-2 text-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Próximamente: comparte un formulario para que tu paciente complete sus datos antes de la primera consulta.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          </div>
        </div>
      </div>

      {showQuick ? (
        <div className="max-w-2xl mx-auto">
          <FormStepCard icon={<User className="w-4 h-4 text-indigo-600" />} title="Datos del Paciente" description="Información básica de identificación">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nombre Completo *</label>
                <Input placeholder="Valentina Morales Lagos" className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickName} onChange={e => setQuickName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="email" placeholder="valen@email.com" className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickEmail} onChange={e => setQuickEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="+56 9 1234 5678" className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickPhone} onChange={e => setQuickPhone(sanitizePhone(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">RUT <span className="text-slate-400">(opcional)</span></label>
                <Input placeholder="12.345.678-9" className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickRut} onChange={e => setQuickRut(formatRut(e.target.value))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Fecha de nacimiento</label>
                  <Input type="date" className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickBirth} onChange={e => setQuickBirth(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Edad</label>
                  <div className="h-10 flex items-center text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl px-3">{quickAge !== null ? `${quickAge} años` : "—"}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Sexo biológico</label>
                  <select value={quickGender} onChange={e => setQuickGender(e.target.value)} className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer appearance-none">
                    <option value="">—</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Motivo de consulta</label>
                  <Input placeholder="Ej: Baja de peso, control..." className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickMotivo} onChange={e => setQuickMotivo(e.target.value)} />
                </div>
                <div />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Peso (kg)</label>
                  <Input type="number" step="0.1" placeholder="65.0" className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickPeso} onChange={e => setQuickPeso(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Estatura (cm)</label>
                  <Input type="number" step="0.1" placeholder="170" className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold" value={quickAltura} onChange={e => setQuickAltura(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" onClick={() => setShowResetConfirm(true)} variant="ghost" className="rounded-xl px-4 text-rose-500 font-bold hover:bg-rose-50">
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Reiniciar
                </Button>
                <Button type="button" onClick={handleQuickCreate} disabled={isSaving} className="rounded-xl px-6 bg-indigo-600 text-white font-bold">{isSaving ? "Guardando..." : "Crear Paciente"}</Button>
              </div>
            </div>
          </FormStepCard>
        </div>
      ) : (
    <div className="flex gap-8 max-w-6xl mx-auto">
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
          onStepClick={goToStep}
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
        <div className="flex items-center justify-between max-w-2xl mt-4">
          <FormNavigationFooter
            onBack={goBack}
            onNext={goNext}
            isFirstStep={currentStep === 0}
            nextDisabled={isSaving}
            nextLabel={currentStep === STEPS.length - 1 ? (isSaving ? "Guardando..." : "Guardar") : "Continuar"}
            className="mt-0 flex-1 max-w-none"
          />
          <Button type="button" onClick={() => setShowResetConfirm(true)} variant="ghost" className="rounded-xl px-4 text-rose-500 font-bold hover:bg-rose-50 ml-3">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reiniciar
          </Button>
        </div>
      </div>
    </div>
      )}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="¿Reiniciar Formulario?"
        description="Toda la información ingresada se eliminará permanentemente. ¿Deseas continuar?"
        confirmText="Vaciar Todo"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
