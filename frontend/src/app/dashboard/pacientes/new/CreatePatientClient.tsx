"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  RotateCcw,
  AlertCircle,
  Flame,
  Dumbbell,
  HeartPulse,
  Activity,
  Calculator,
  Target,
  Edit3,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { MetricTagInput } from "@/components/ui/metric-tag-input";
import { Patient } from "@/features/patients";
import { usePatientDraft } from "@/features/patients/hooks/usePatientDraft";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { validateRut, formatRut } from "@/lib/rut-utils";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { calculateBMI, calculateGET, getIdealWeightRange, calculateAge, type ActivityLevel as NutritionActivityLevel, type GetResult } from "@/lib/nutrition-formulas";

const normalizeActivityLevel = (value?: string | null): Patient["activityLevel"] => {
  const raw = String(value || "").toLowerCase();
  if (["sedentario", "ligero", "moderado", "activo", "muy_activo"].includes(raw)) {
    return raw as Patient["activityLevel"];
  }
  return raw === "deportista" ? "activo" : "sedentario";
};

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

const GENDER_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "Masculino", label: "Masculino" },
  { value: "Femenino", label: "Femenino" },
  { value: "Otro", label: "Otro" },
];

const validateHeightInput = (value: string): string | null => {
  if (!value.trim()) return null;
  const cleaned = value.replace(",", ".").replace(/\s+/g, "");
  const num = Number(cleaned);
  if (Number.isNaN(num)) return "Ingresa un número válido en cm (ej: 170)";
  if (num <= 0 || num > 300) return "La altura debe estar entre 1 y 300 cm";
  if (cleaned.includes(".") && !cleaned.match(/^\d+\.\d*$/)) return "Usa punto para decimales (ej: 170.5)";
  return null;
};

const validateWeightInput = (value: string): string | null => {
  if (!value.trim()) return null;
  const cleaned = value.replace(",", ".").replace(/\s+/g, "");
  const num = Number(cleaned);
  if (Number.isNaN(num)) return "Ingresa un número válido en kg (ej: 70.5)";
  if (num <= 0 || num > 700) return "El peso debe estar entre 0 y 700 kg";
  return null;
};

type SuggestionCard = {
  get: GetResult | null;
  bmi: { bmi: number; classification: string; color: string } | null;
  idealWeight: { min: number; max: number } | null;
  age: number | undefined;
  category: { id: string; label: string; strategy: string } | null;
  dailyTargets: { calories: number; protein: number; carbs: number; fats: number; description: string } | null;
};

function resolveSuggestionCategory(input: {
  bmi: { bmi: number; classification: string; color: string } | null;
  nf: string | null;
  fg: string | null;
  al: string;
}) {
  const focus = String(input.nf || "").toLowerCase();
  const fitness = String(input.fg || "").toLowerCase();
  const bmiVal = input.bmi?.bmi ?? 22;
  const classification = input.bmi?.classification ?? "Normal";
  const isWeightLoss = focus.includes("bajar");
  const isWeightGain = focus.includes("subir");
  const isMuscle = fitness.includes("muscular") || focus.includes("muscular");
  const isPerformance = fitness.includes("rendimiento") || fitness.includes("deportivo");
  const isRehab = fitness.includes("rehabilitación") || fitness.includes("rehabilitacion") || fitness.includes("movilidad");
  const isMetabolic = focus.includes("metabólico") || focus.includes("metabolico") || focus.includes("patología") || focus.includes("patologia");
  const isActive = ["activo", "muy_activo"].includes(input.al);
  const isBajoPeso = bmiVal < 18.5 || classification === "Bajo peso";

  if (isBajoPeso) return { id: "clinical_review_required", label: "Revisión clínica previa", strategy: "Evaluación profesional requerida antes de asignar objetivos automáticos." };
  if (isMetabolic) return { id: "metabolic_care", label: "Cuidado metabólico", strategy: "Estabilidad glucémica, perfil lipídico y control de comorbilidades." };
  if (bmiVal >= 30 && isWeightLoss) return { id: "weight_loss_controlled", label: "Baja de peso controlada", strategy: "Déficit ≈20%, alta proteína, control de CHO concentrados." };
  if (isWeightLoss) return { id: "weight_loss_moderate", label: "Baja de peso moderada", strategy: "Déficit ≈12%, priorizando proteína y fibra." };
  if (isMuscle) return { id: "muscle_gain", label: "Ganancia muscular", strategy: "Superávit ≈10%, proteína alta, 4-5 comidas." };
  if (isPerformance || (isActive && !isWeightLoss && !isWeightGain)) return { id: "high_energy_active", label: "Alta demanda energética", strategy: "CHO para rendimiento, proteína para recuperación." };
  if (isWeightGain) return { id: "weight_gain_supervised", label: "Aumento de peso supervisado", strategy: "Superávit progresivo, alimentos densos en nutrientes." };
  if (isRehab) return { id: "rehabilitation", label: "Rehabilitación / movilidad", strategy: "Antiinflamatorios naturales, proteína para reparación tisular." };
  return { id: "standard_maintenance", label: "Mantenimiento estándar", strategy: "Distribución balanceada AMDR, ajustable según evolución." };
}

function buildSuggestionTargets(input: {
  get: GetResult | null;
  category: { id: string; label: string; strategy: string } | null;
}) {
  if (!input.get || !input.category) return null;
  const get = input.get.get;
  const cat = input.category;

  let adjustedCalories = get;
  if (cat.id === "weight_loss_controlled") adjustedCalories = Math.round(get * 0.8);
  else if (cat.id === "weight_loss_moderate") adjustedCalories = Math.round(get * 0.88);
  else if (cat.id === "muscle_gain") adjustedCalories = Math.round(get * 1.1);
  else if (cat.id === "weight_gain_supervised") adjustedCalories = Math.round(get * 1.12);

  const macros = input.get.macros;
  const protein = Math.round((adjustedCalories * (macros.proteinPercent / 100)) / 4);
  const carbs = Math.round((adjustedCalories * (macros.carbsPercent / 100)) / 4);
  const fats = Math.round((adjustedCalories * (macros.fatsPercent / 100)) / 9);

  return {
    calories: adjustedCalories,
    protein,
    carbs,
    fats,
    description: cat.strategy,
  };
}

export default function CreatePatientClient() {
  const router = useRouter();
  const { draft, updateDraft, clearDraft, isLoaded } = usePatientDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const selectedMetrics = (draft.customVariables || []).filter(
    (m) => m.key !== "activityLevel" && (typeof m.value !== "object" || m.value === null),
  ) as Array<{ key?: string; label: string; unit?: string; value?: string | number }>;
  const selectedActivityLevel = normalizeActivityLevel(draft.activityLevel);

  // Ensure weight is always in customVariables for new/existing patients in this form
  useEffect(() => {
    if (isLoaded) {
      const vars = draft.customVariables || [];
      const hasWeight = vars.some((v: any) => v.key === "weight");
      if (!hasWeight) {
        updateDraft({
          customVariables: [
            { key: "weight", label: "Peso", unit: "kg", value: draft.weight || "" },
            ...vars
          ]
        });
      }
    }
  }, [isLoaded]);

  const heightError = useMemo(() => validateHeightInput(String(draft.height || "")), [draft.height]);
  const weightError = useMemo(() => validateWeightInput(String(draft.weight || "")), [draft.weight]);

  const suggestionCard: SuggestionCard = useMemo(() => {
    const w = draft.weight ? Number(String(draft.weight).replace(",", ".")) : null;
    const h = draft.height ? Number(String(draft.height).replace(",", ".")) : null;
    const bd = draft.birthDate || null;
    const g = draft.gender || null;
    const al = (draft.activityLevel || "sedentario") as NutritionActivityLevel;
    const nf = draft.nutritionalFocus || null;
    const fg = draft.fitnessGoals || null;

    if (!w || !h || w <= 0 || h <= 0) return { get: null, bmi: null, idealWeight: null, age: undefined, category: null, dailyTargets: null };

    const bmi = calculateBMI(w, h);
    const idealWeight = getIdealWeightRange(h);
    const age = calculateAge(bd);
    const get = calculateGET(
      g === "Masculino" || g === "Femenino" ? g : "Femenino",
      w, h, age || 30, al,
    );
    const category = resolveSuggestionCategory({ bmi, nf, fg, al });
    const dailyTargets = buildSuggestionTargets({ get, category });

    return { get, bmi, idealWeight, age, category, dailyTargets };
  }, [draft.weight, draft.height, draft.birthDate, draft.gender, draft.activityLevel, draft.nutritionalFocus, draft.fitnessGoals]);

  if (!isLoaded) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+")) val = "+" + val.replace(/\+/g, "");
    const cleanVal = "+" + val.substring(1).replace(/\D/g, "");
    updateDraft({ phone: cleanVal });
  };

  const handleSaveClick = () => {
    if (!draft.fullName || !draft.email) {
      toast.error("Por favor completa los campos obligatorios (Nombre y Email).");
      return;
    }
    if (draft.documentId && !validateRut(draft.documentId)) {
      toast.error("El RUT ingresado no es válido.");
      return;
    }
    // Al crear un paciente nuevo, siempre recalculamos sin preguntar
    if (!draft.id) {
      handleConfirmSave(true);
      return;
    }
    // Al editar, preguntamos si desea recalcular
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async (recalculateNutrition = true) => {
    setIsSaving(true);
    setShowSaveConfirm(false);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const method = draft.id ? "PATCH" : "POST";
      const url = draft.id ? `/patients/${draft.id}` : "/patients";

      const payload: any = {
        fullName: draft.fullName,
        email: draft.email || undefined,
        phone: draft.phone || undefined,
        documentId: draft.documentId || undefined,
        birthDate: draft.birthDate ? new Date(draft.birthDate).toISOString() : undefined,
        gender: draft.gender || undefined,
        height: draft.height ? Number(draft.height.toString().replace(",", ".")) : undefined,
        weight: draft.weight ? Number(draft.weight.toString().replace(",", ".")) : undefined,
        dietRestrictions: draft.dietRestrictions || [],
        clinicalSummary: draft.clinicalSummary || undefined,
        nutritionalFocus: draft.nutritionalFocus || undefined,
        fitnessGoals: draft.fitnessGoals || undefined,
        likes: draft.likes || undefined,
        customVariables: draft.customVariables || [],
        activityLevel: selectedActivityLevel,
        recalculateNutrition,
      };

      const response = await fetchApi(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedPatient = await response.json();
        toast.success(draft.id ? "Expediente actualizado." : "Paciente registrado con éxito.");
        clearDraft();
        router.push(`/dashboard/pacientes/${savedPatient.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Error al guardar el paciente");
      }
    } catch (error) {
      console.error("Save Patient Error:", error);
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto pb-12 animate-in fade-in duration-700 px-2 sm:px-4">
      {/* Sidebar Actions Menu (Sticky Right) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-3xl border border-slate-200 shadow-2xl flex flex-col gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center group relative"
            title="Reiniciar Formulario"
          >
            <RotateCcw className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform duration-300" />
            <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap tracking-wider">
              Reiniciar
            </span>
          </button>

          <div className="h-px bg-slate-100 mx-2" />

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={cn(
              "w-14 h-14 rounded-2xl transition-all flex items-center justify-center group relative shadow-lg shadow-emerald-200/50",
              isSaving ? "bg-slate-100" : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            title={draft.id ? "Actualizar Ficha" : "Registrar Paciente"}
          >
            {isSaving ? (
              <span className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap tracking-wider">
              {draft.id ? "Guardar" : "Registrar"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Bottom Actions */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700/50">
          <Button
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 h-12 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/20"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {draft.id ? "Guardar Cambios" : "Registrar"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 lg:space-y-5">
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="group flex items-center gap-2 hover:bg-slate-100/50 rounded-xl px-4 py-2 transition-all w-fit">
            <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Volver</span>
          </Button>

          <div className="hidden xl:flex items-center gap-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Acceso Rápido Lateral Activo
            </div>
          </div>
        </div>

        {/* Main Branding Banner */}
        <div className="bg-slate-900 rounded-2xl p-4 lg:p-6 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[60px] translate-y-1/2 -translate-x-1/2 rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
              <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg border border-emerald-300/30">
                <User className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mb-1">
                  {draft.id ? "Editando Expediente" : "Nueva Ficha Clínica"}
                </h1>
                <p className="text-emerald-100/60 text-xs lg:text-sm max-w-xl font-medium">
                  Completa los datos base del paciente. NutriNet clasificará automáticamente el perfil y sugerirá objetivos diarios según IMC, gasto energético y composición. Los valores son editables y deben ser revisados por el nutricionista.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Layout for Primary Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: Identity & Contact */}
          <div className="flex flex-col">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex-1 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Identidad</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Nombre Completo *</label>
                  <Input
                    placeholder="Valentina Morales Lagos"
                    className="h-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    value={draft.fullName}
                    onChange={(e) => updateDraft({ fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="valen@email.com"
                      className="h-9 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      value={draft.email}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Edad</label>
                  <div className="relative">
                    <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="Ej: 28 años"
                      className="h-9 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      value={draft.age || ""}
                      onChange={(e) => updateDraft({ age: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="+56 9 1234 5678"
                      className="h-9 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      value={draft.phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">RUT</label>
                  <Input
                    placeholder="12.345.678-9"
                    className="h-9 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    value={draft.documentId || ""}
                    onChange={(e) => updateDraft({ documentId: formatRut(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Sexo biológico</label>
                  <select
                    value={draft.gender || ""}
                    onChange={(e) => updateDraft({ gender: e.target.value })}
                    className="w-full h-9 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all cursor-pointer appearance-none"
                  >
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Gustos / Preferencias</label>
                      <textarea
                        className="w-full h-16 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-medium text-slate-700 resize-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300"
                        placeholder="Ej: Prefiere comidas calientes, no tolera pescado..."
                        value={draft.likes || ""}
                        onChange={(e) => updateDraft({ likes: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-wider">Observaciones clínicas</label>
                      <textarea
                        className="w-full h-16 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-medium text-slate-700 resize-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300"
                        placeholder="Ej: Ansiedad por dulces, insomnio..."
                        value={draft.clinicalSummary || ""}
                        onChange={(e) => updateDraft({ clinicalSummary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Nutrition & Body */}
          <div className="space-y-4 flex flex-col">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3">Antropometría</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">Peso (kg) *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    className={cn(
                      "h-10 rounded-xl bg-slate-50 border-transparent text-center font-bold text-base",
                      weightError && "border-rose-300 bg-rose-50/50 ring-2 ring-rose-500/10"
                    )}
                    value={draft.weight ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      updateDraft({ weight: raw ? parseFloat(raw) : undefined });
                    }}
                    placeholder="70.5"
                  />
                  {weightError && <p className="text-[9px] font-medium text-rose-500">{weightError}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">Altura (cm) *</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className={cn(
                      "h-10 rounded-xl bg-slate-50 border-transparent text-center font-bold text-base",
                      heightError && "border-rose-300 bg-rose-50/50 ring-2 ring-rose-500/10"
                    )}
                    value={draft.height ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".").replace(/\D\./, "");
                      updateDraft({ height: raw ? Number(raw) : undefined });
                    }}
                    placeholder="170"
                  />
                  {heightError && <p className="text-[9px] font-medium text-rose-500">{heightError}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Fecha de nacimiento *</label>
                <Input
                  type="date"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white transition-all"
                  value={draft.birthDate || ""}
                  onChange={(e) => updateDraft({ birthDate: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-800">Cálculos automáticos</h2>
                </div>
                {suggestionCard.dailyTargets ? (
                  <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg uppercase tracking-widest">Calculado</span>
                ) : (
                  <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg uppercase tracking-widest">Faltan datos</span>
                )}
              </div>

              {suggestionCard.category && suggestionCard.bmi ? (
                <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-xl p-4 border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Clasificado como:</p>
                      <p className="text-sm font-bold text-amber-700">{suggestionCard.category.label}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{suggestionCard.category.strategy}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/80 rounded-lg p-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">IMC</p>
                      <p className="text-sm font-black text-slate-900">{suggestionCard.bmi.bmi}</p>
                      <p className="text-[8px] font-bold" style={{ color: suggestionCard.bmi.color }}>{suggestionCard.bmi.classification}</p>
                    </div>
                    {suggestionCard.get && (
                      <div className="bg-white/80 rounded-lg p-2">
                        <p className="text-[9px] font-black uppercase text-slate-400">GET</p>
                        <p className="text-sm font-black text-emerald-700">{suggestionCard.get.get}</p>
                        <p className="text-[8px] text-emerald-500">kcal/día</p>
                      </div>
                    )}
                    {suggestionCard.idealWeight && (
                      <div className="bg-white/80 rounded-lg p-2">
                        <p className="text-[9px] font-black uppercase text-slate-400">Peso ideal</p>
                        <p className="text-sm font-black text-blue-700">{suggestionCard.idealWeight.min}–{suggestionCard.idealWeight.max}</p>
                        <p className="text-[8px] text-blue-400">kg</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 border-dashed text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    Ingresa peso, altura, fecha de nacimiento y sexo para ver los cálculos automáticos en tiempo real.
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-700">Objetivos diarios sugeridos</h3>
                </div>
                {suggestionCard.dailyTargets ? (
                  <div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-indigo-50 rounded-xl p-2 text-center">
                        <p className="text-[9px] font-black uppercase text-indigo-400">Calorías</p>
                        <p className="text-lg font-black text-indigo-700">{suggestionCard.dailyTargets.calories}</p>
                        <p className="text-[8px] text-indigo-400">kcal/día</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-2 text-center">
                        <p className="text-[9px] font-black uppercase text-emerald-500">Proteína</p>
                        <p className="text-lg font-black text-emerald-700">{suggestionCard.dailyTargets.protein}</p>
                        <p className="text-[8px] text-emerald-500">g/día</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-2 text-center">
                        <p className="text-[9px] font-black uppercase text-amber-500">Carbohidratos</p>
                        <p className="text-lg font-black text-amber-700">{suggestionCard.dailyTargets.carbs}</p>
                        <p className="text-[8px] text-amber-500">g/día</p>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-2 text-center">
                        <p className="text-[9px] font-black uppercase text-rose-400">Grasas</p>
                        <p className="text-lg font-black text-rose-700">{suggestionCard.dailyTargets.fats}</p>
                        <p className="text-[8px] text-rose-400">g/día</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{suggestionCard.dailyTargets.description}</p>
                    <p className="text-[9px] text-indigo-500 font-medium mt-1 flex items-center gap-1">
                      <Edit3 className="h-3 w-3" />
                      Valores sugeridos. Podrás editarlos desde el perfil del paciente tras guardar.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Los objetivos diarios aparecerán automáticamente cuando haya datos antropométricos.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Lifestyle & Constraints */}
          <div className="space-y-4 flex flex-col">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
                <div className="p-1.5 bg-rose-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Restricciones</h2>
              </div>
              <TagInput value={draft.dietRestrictions || []} onChange={(tags) => updateDraft({ dietRestrictions: tags })} fetchSuggestionsUrl={`${getApiUrl()}/tags`} placeholder="Diabetes, Celiaco, Alergias..." className="mt-1" />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex-1 hover:shadow-md transition-shadow">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3">Foco & Fitness</h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Foco Nutricional</label>
                  <select
                    value={draft.nutritionalFocus || ""}
                    onChange={(e) => updateDraft({ nutritionalFocus: e.target.value || undefined })}
                    className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all cursor-pointer appearance-none"
                  >
                    {NUTRITIONAL_FOCUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Metas Fitness</label>
                  <select
                    value={draft.fitnessGoals || ""}
                    onChange={(e) => updateDraft({ fitnessGoals: e.target.value || undefined })}
                    className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all cursor-pointer appearance-none"
                  >
                    {FITNESS_GOALS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    <label className="text-[9px] font-black uppercase text-slate-400">Nivel de actividad (Opcional)</label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      { key: "sedentario", icon: Flame, label: "Sedentario" },
                      { key: "ligero", icon: Activity, label: "Ligero" },
                      { key: "moderado", icon: HeartPulse, label: "Moderado" },
                      { key: "activo", icon: Dumbbell, label: "Activo" },
                      { key: "muy_activo", icon: Dumbbell, label: "Muy activo" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          const cleanCustomVars = (draft.customVariables || []).filter(v => v.key !== "activityLevel");
                          updateDraft({
                            activityLevel: item.key as any,
                            customVariables: cleanCustomVars
                          });
                        }}
                        className={cn(
                          "h-10 rounded-xl border flex flex-row items-center justify-center gap-2 transition-all cursor-pointer",
                          selectedActivityLevel === item.key
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200"
                            : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100"
                        )}
                      >
                        <item.icon className={cn("w-3 h-3", selectedActivityLevel === item.key ? "text-white" : "text-slate-400")} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => handleConfirmSave(false)}
        onConfirm={() => handleConfirmSave(true)}
        title="¿Recalcular valores automáticamente?"
        description={`Se guardarán los cambios en la ficha de ${draft.fullName}. Como modificaste datos que afectan los cálculos (peso, altura, edad, etc.), puedes recalcular IMC, TMB, GET, macros y perfil de porciones, o conservar los valores anteriores.`}
        confirmText="Guardar y recalcular"
        cancelText="Guardar sin recalcular"
        variant="primary"
      />

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => { clearDraft(); toast.info("Formulario reiniciado."); setShowResetConfirm(false); }}
        title="¿Reiniciar Formulario?"
        description="Toda la información ingresada en este borrador se eliminará permanentemente. ¿Deseas continuar?"
        confirmText="Vaciar Todo"
        variant="destructive"
      />
    </div>
  );
}
