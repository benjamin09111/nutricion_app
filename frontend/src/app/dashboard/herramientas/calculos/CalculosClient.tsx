"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calculator,
  Activity,
  Scale,
  Zap,
  ChevronDown,
  Ruler,
  Percent,
  Loader2,
  FileText,
  TrendingDown,
  Plus,
  X,
  Droplets,
  Heart,
  Award,
  ShieldAlert,
  AlertTriangle,
  UserRound,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useSubscription } from "@/context/SubscriptionContext";
import { PatientSelectionModal } from "@/components/patients/PatientSelectionModal";

import { CalculationResult, MNAData } from "./types";
import { ClinicalAlerts } from "./components/ClinicalAlerts";
import { WeightLossPanel } from "./components/WeightLossPanel";
import { ProteinPanel } from "./components/ProteinPanel";
import { HydrationCard } from "./components/HydrationCard";
import { DryWeightSelector } from "./components/DryWeightSelector";
import { MNAModal } from "./components/MNAModal";
import { TestSelectorPanel } from "@/features/screening-tests/components/TestSelectorPanel";
import { ScreeningTestModal } from "@/features/screening-tests/components/ScreeningTestModal";
import { suggestTestType } from "@/features/screening-tests";
import type { ScreeningTestType, PatientAutoFillData } from "@/features/screening-tests";

const FORMULA_OPTIONS = [
  { value: "mifflin-st-jeor", label: "Mifflin-St Jeor (1990)" },
  { value: "harris-benedict", label: "Harris-Benedict (original, 1919)" },
  { value: "oms-fao", label: "OMS/FAO (2004)" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentario", label: "Sedentario (×1.2)" },
  { value: "ligero", label: "Ligero (×1.375)" },
  { value: "moderado", label: "Moderado (×1.55)" },
  { value: "activo", label: "Activo (×1.725)" },
  { value: "muy_activo", label: "Muy Activo (×1.9)" },
];

type CalculatorPatient = {
  id?: string;
  fullName?: string;
  name?: string;
  weight?: number | string | null;
  height?: number | string | null;
  age?: number | null;
  ageYears?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  activityLevel?: string | null;
};

const getPatientAge = (patient: CalculatorPatient): number | null => {
  if (typeof patient.ageYears === "number") return patient.ageYears;
  if (typeof patient.age === "number") return patient.age;
  if (!patient.birthDate) return null;

  const birthDate = new Date(patient.birthDate);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (hasNotHadBirthday) years -= 1;

  return years >= 0 ? years : null;
};

export default function CalculosClient() {
  const { can, isLoading: isSubscriptionLoading } = useSubscription();
  const calculatorLocked =
    isSubscriptionLoading || !can("clinical_calculator.use.access");
  const screeningTestsLocked =
    isSubscriptionLoading || !can("screening_tests.access");
  // 1. PASO ESENCIAL (Siempre visible)
  const [gender, setGender] = useState<"Masculino" | "Femenino">("Femenino");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [targetBmi, setTargetBmi] = useState("22.0");
  const [isTargetBmiCustom, setIsTargetBmiCustom] = useState(false);
  const [activityLevel, setActivityLevel] = useState("sedentario");
  const [tmbFormula, setTmbFormula] = useState("mifflin-st-jeor");
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnancyWeek, setPregnancyWeek] = useState("");
  const [isLactating, setIsLactating] = useState(false);
  const [lactationType, setLactationType] = useState<"exclusive" | "partial">("exclusive");

  // Macro distribution default
  const [carbPct] = useState(55);
  const [proteinPct] = useState(20);
  const [fatPct] = useState(25);

  // 2. MÓDULOS OPCIONALES (Bajo demanda)
  const [activeModules, setActiveModules] = useState<{
    edema: boolean;
    blackburn: boolean;
    protein: boolean;
    chumlea: boolean;
    frisancho: boolean;
    icc: boolean;
  }>({
    edema: false,
    blackburn: false,
    protein: false,
    chumlea: false,
    frisancho: false,
    icc: false,
  });

  // Clinical inputs
  const [edemaPercent, setEdemaPercent] = useState("0");
  const [usualWeight, setUsualWeight] = useState("");
  const [weightLossPeriodWeeks, setWeightLossPeriodWeeks] = useState("4");
  const [proteinProfile, setProteinProfile] = useState("adulto_sano");
  const [useUsualWeightForRequirements, setUseUsualWeightForRequirements] = useState(false);

  // Advanced essential inputs (subescapularFold SHARED between Chumlea & Frisancho)
  const [kneeHeight, setKneeHeight] = useState("");
  const [calfCircumference, setCalfCircumference] = useState("");
  const [armCircumference, setArmCircumference] = useState("");
  const [subescapularFold, setSubescapularFold] = useState("");
  const [tricipitalFold, setTricipitalFold] = useState("");
  const [waistCircumference, setWaistCircumference] = useState("");
  const [hipCircumference, setHipCircumference] = useState("");

  // MNA modal & state
  const [mnaResult, setMnaResult] = useState<MNAData | null>(null);
  const [isMNAModalOpen, setIsMNAModalOpen] = useState(false);

  // Screening Tests state
  const [activeScreeningTest, setActiveScreeningTest] = useState<ScreeningTestType | null>(null);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [isTestSelectorModalOpen, setIsTestSelectorModalOpen] = useState(false);

  const handleSelectScreeningTest = (type: ScreeningTestType) => {
    setActiveScreeningTest(type);
    setIsScreeningModalOpen(true);
    setIsTestSelectorModalOpen(false);
  };

  // UI state
  const [showGlossary, setShowGlossary] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<CalculatorPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<CalculatorPatient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  const screeningAutoFillData: PatientAutoFillData = useMemo(() => {
    const w = parseNum(weight);
    const h = parseNum(height);
    const a = parseNum(age);
    const bmiVal = result?.bmi?.bmi || (w && h ? w / Math.pow(h / 100, 2) : null);

    return {
      id: selectedPatient?.id,
      fullName: selectedPatient?.fullName || selectedPatient?.name || undefined,
      weight: w,
      height: h,
      age: a,
      gender: gender === "Masculino" ? "MALE" : "FEMALE",
      bmi: bmiVal,
      isPregnant,
      pregnancyWeek: parseNum(pregnancyWeek),
      calfCircumference: parseNum(calfCircumference),
      armCircumference: parseNum(armCircumference),
      tricipitalFold: parseNum(tricipitalFold),
    };
  }, [weight, height, age, result, selectedPatient, gender, isPregnant, pregnancyWeek, calfCircumference, armCircumference, tricipitalFold]);

  const suggestedTest = useMemo(() => suggestTestType(screeningAutoFillData), [screeningAutoFillData]);

  const parseNum = (val: string | number | null | undefined): number | null => {
    if (val === null || val === undefined) return null;
    const clean = String(val).trim().replace(",", ".");
    if (!clean) return null;
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  };

  // Auto-calculate Target BMI based on weight, height and age (OMS vs Lipschitz normopeso)
  useEffect(() => {
    if (isTargetBmiCustom) return;

    const w = parseNum(weight);
    const h = parseNum(height);
    const a = parseNum(age);

    if (w && h && w > 0 && h > 0) {
      const hM = h / 100;
      const currentBmi = w / (hM * hM);
      const isSenior = (a || 0) >= 65;

      let computedTarget = 22.0;

      if (isSenior) {
        if (currentBmi >= 23.0 && currentBmi <= 28.0) {
          computedTarget = parseFloat(currentBmi.toFixed(1));
        } else {
          computedTarget = 24.5;
        }
      } else {
        if (currentBmi >= 18.5 && currentBmi <= 24.9) {
          computedTarget = parseFloat(currentBmi.toFixed(1));
        } else {
          computedTarget = 22.0;
        }
      }

      setTargetBmi(computedTarget.toFixed(1));
    }
  }, [weight, height, age, isTargetBmiCustom]);

  // Execution function triggered ONLY by clicking "Calcular"
  const executeCalculation = useCallback(async () => {
    if (calculatorLocked) {
      window.dispatchEvent(
        new CustomEvent("show-freemium-upgrade", {
          detail: {
            description:
              "La Calculadora Clínica es una característica exclusiva de NutriNet Plus.",
          },
        }),
      );
      return;
    }
    const w = parseNum(weight);
    const h = parseNum(height);
    const a = parseNum(age);
    const kw = parseNum(kneeHeight);
    const uw = parseNum(usualWeight);

    const hasBasicInfo = (w && h) || a || uw;
    const hasChumleaInfo = kw && a && gender;
    if (!hasBasicInfo && !hasChumleaInfo) {
      return;
    }

    setLoading(true);
    try {
      const body = {
        gender,
        weight: w,
        height: h,
        ageYears: a,
        targetBmi: parseNum(targetBmi) || 22.0,
        activityLevel,
        tmbFormula,
        isPregnant,
        pregnancyWeek: isPregnant ? parseNum(pregnancyWeek) : null,
        isLactating,
        lactationType: isLactating ? lactationType : null,
        carbPct,
        proteinPct,
        fatPct,
        usualWeight: activeModules.blackburn ? parseNum(usualWeight) : null,
        weightLossPeriodWeeks: parseNum(weightLossPeriodWeeks) || 4,
        proteinProfile,
        edemaPercent: activeModules.edema ? (parseNum(edemaPercent) || 0) : 0,
        kneeHeight: activeModules.chumlea ? parseNum(kneeHeight) : null,
        calfCircumference: activeModules.chumlea ? parseNum(calfCircumference) : null,
        armCircumference: (activeModules.chumlea || activeModules.frisancho) ? parseNum(armCircumference) : null,
        waistCircumference: activeModules.icc ? parseNum(waistCircumference) : null,
        hipCircumference: activeModules.icc ? parseNum(hipCircumference) : null,
        tricipitalFold: activeModules.frisancho ? parseNum(tricipitalFold) : null,
        // SHARED subescapularFold
        subescapularFold: (activeModules.chumlea || activeModules.frisancho) ? parseNum(subescapularFold) : null,
        useUsualWeightForRequirements: activeModules.blackburn ? useUsualWeightForRequirements : false,
      };

      const response = await api.post("/calculations/calculate", body);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      const data = (await response.json()) as CalculationResult;
      setResult(data);
      if (data.inputs && typeof data.inputs.useUsualWeightForRequirements === "boolean") {
        setUseUsualWeightForRequirements(data.inputs.useUsualWeightForRequirements);
      }
    } catch (error) {
      console.error("Error calculating:", error);
    } finally {
      setLoading(false);
    }
  }, [
    gender,
    weight,
    height,
    age,
    targetBmi,
    activityLevel,
    tmbFormula,
    isPregnant,
    pregnancyWeek,
    isLactating,
    lactationType,
    carbPct,
    proteinPct,
    fatPct,
    usualWeight,
    weightLossPeriodWeeks,
    proteinProfile,
    edemaPercent,
    kneeHeight,
    calfCircumference,
    armCircumference,
    waistCircumference,
    hipCircumference,
    tricipitalFold,
    subescapularFold,
    activeModules,
    useUsualWeightForRequirements,
    calculatorLocked,
  ]);

  const toggleModule = (modKey: keyof typeof activeModules) => {
    setActiveModules((prev) => ({ ...prev, [modKey]: !prev[modKey] }));
  };

  const handleQuickValues = () => {
    setActiveModules({
      edema: true,
      blackburn: true,
      protein: true,
      chumlea: true,
      frisancho: true,
      icc: true,
    });
    setIsTargetBmiCustom(false);
    setGender("Masculino");
    setAge("68");
    setKneeHeight("50");
    setCalfCircumference("35");
    setArmCircumference("25");
    setSubescapularFold("15");
    setUsualWeight("76");
    setWeight("68");
    setHeight("165");
    setWeightLossPeriodWeeks("4");
    setProteinProfile("adulto_mayor");
  };

  const openPatientImportModal = async () => {
    setIsPatientModalOpen(true);
    setIsLoadingPatients(true);
    setPatientsError(null);

    try {
      const response = await api.get("/patients?status=Activos&limit=100");
      if (!response.ok) throw new Error("No se pudieron cargar los pacientes.");

      const data = await response.json();
      setPatients(Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error loading patients for calculator:", error);
      setPatients([]);
      setPatientsError("No se pudieron cargar los pacientes. Inténtalo nuevamente.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const importPatient = (patient: CalculatorPatient) => {
    const patientAge = getPatientAge(patient);
    const importedGender =
      patient.gender === "Masculino" || patient.gender === "Femenino"
        ? patient.gender
        : null;
    const importedActivityLevel = ACTIVITY_OPTIONS.some(
      (option) => option.value === patient.activityLevel,
    )
      ? patient.activityLevel
      : null;

    setSelectedPatient(patient);
    if (patient.weight !== null && patient.weight !== undefined) setWeight(String(patient.weight));
    if (patient.height !== null && patient.height !== undefined) setHeight(String(patient.height));
    if (patientAge !== null) setAge(String(patientAge));
    if (importedGender) setGender(importedGender);
    if (importedActivityLevel) setActivityLevel(importedActivityLevel);
    setResult(null);
  };

  const isSevereWeightLoss = result?.weightLoss?.severity === "grave";
  const isSignificantWeightLoss = result?.weightLoss?.severity === "significativa";
  const isMalnourishedMna = mnaResult !== null && mnaResult.score < 17;
  const isRiskMna = mnaResult !== null && mnaResult.score >= 17 && mnaResult.score <= 23.5;

  const isCriticalAlert = isSevereWeightLoss || isMalnourishedMna;
  const isModerateAlert = !isCriticalAlert && (isSignificantWeightLoss || isRiskMna);

  return (
    <div className="relative max-w-7xl mx-auto pb-24 px-4 sm:px-6">

      {/* Encabezado Limpio */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Calculator className="w-5 h-5" />
            </span>
            Calculadora Clínica NutriNet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación nutricional rápida y módulos avanzados a pantalla completa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void openPatientImportModal()}
            className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold h-8 rounded-xl flex-1 sm:flex-none justify-center"
          >
            <UserRound className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
            <span>{selectedPatient ? "Cambiar paciente" : "Importar paciente"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (screeningTestsLocked) {
                window.dispatchEvent(
                  new CustomEvent("show-freemium-upgrade", {
                    detail: { feature: "Tests de tamizaje nutricional" },
                  }),
                );
                return;
              }
              setIsTestSelectorModalOpen(true);
            }}
            className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold h-8 rounded-xl flex-1 sm:flex-none justify-center gap-1"
          >
            {screeningTestsLocked ? (
              <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}
            <span>Tests de Tamizaje</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickValues}
            className="text-xs border-slate-200 text-slate-600 bg-white hover:bg-slate-50 h-8 rounded-xl flex-1 sm:flex-none justify-center"
          >
            <span>Cargar Caso Ejemplo</span>
          </Button>
        </div>
      </div>

      {/* Glosario Clínico Toggle */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowGlossary(!showGlossary)}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer text-left"
        >
          <span>ℹ️ Normas clínicas aplicadas (OMS 2006/2007, Lipschitz, MINSAL, Blackburn, Chumlea)</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", showGlossary && "rotate-180")} />
        </button>
        {showGlossary && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <strong className="text-slate-800">IMC Adultos & Adulto Mayor:</strong> OMS 18.5-24.9 kg/m² | Lipschitz 23-28 kg/m² (&ge;65 años).
            </div>
            <div>
              <strong className="text-slate-800">Peso Ideal:</strong> Configurable (default 22.0) | Ajuste por edema y peso seco metabólico.
            </div>
            <div>
              <strong className="text-slate-800">Módulos:</strong> Blackburn (Pérdida peso) | Proteínas g/kg | Chumlea & Frisancho (Dato compartido PSE).
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HERO RESULT BANNER CON OVERRIDE CLÍNICO DE RIESGO DE PACIENTE             */}
      {/* ========================================================================= */}
      {result && (
        <div
          className={cn(
            "text-white rounded-2xl p-5 mb-6 shadow-md space-y-4 animate-in fade-in duration-200 border",
            isCriticalAlert
              ? "bg-rose-950 border-rose-800"
              : isModerateAlert
                ? "bg-amber-950 border-amber-800"
                : "bg-slate-900 border-slate-800"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "p-2 rounded-xl border shrink-0",
                  isCriticalAlert
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : isModerateAlert
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                )}
              >
                {isCriticalAlert ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : isModerateAlert ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-400" />
                )}
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide leading-tight">
                  {isCriticalAlert
                    ? "🚨 RIESGO NUTRICIONAL ALTO — PÉRDIDA AGUDA GRAVE / DESNUTRICIÓN"
                    : isModerateAlert
                      ? "⚠️ RIESGO NUTRICIONAL MODERADO — SEGUIMIENTO REQUERIDO"
                      : "Diagnóstico Nutricional Principal"}
                </h2>
                <p className="text-[11px] text-slate-300">
                  {isSevereWeightLoss
                    ? `Pérdida catabólica involuntaria de ${result.weightLoss?.percentLoss}% (${result.weightLoss?.lossKg} kg) en ${result.weightLoss?.periodLabel}.`
                    : isMalnourishedMna
                      ? `Evaluación MNA® (${mnaResult?.score}/30 pts) confirma Desnutrición Pediátrica/Geriátrica.`
                      : `Fórmula TMB: ${result.energy?.formula || "Mifflin-St Jeor (1990)"}`}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={executeCalculation}
              disabled={loading}
              className={cn(
                "font-bold rounded-xl text-xs h-8 px-4 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto text-white",
                isCriticalAlert
                  ? "bg-rose-600 hover:bg-rose-500"
                  : isModerateAlert
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
              )}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : calculatorLocked ? (
                <Lock className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Calculator className="w-3.5 h-3.5" />
              )}
              <span>Recalcular</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* GET */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Gasto Energético Total (GET)
              </span>
              {result.energy ? (
                <div>
                  <p className="text-2xl font-black text-amber-400 tracking-tight">
                    {result.energy.get} <span className="text-xs font-semibold text-slate-300">kcal/día</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    TMB: {result.energy.tmb} kcal/día
                  </p>
                  {result.inputs.useUsualWeightForRequirements && (
                    <p className="text-[9px] font-bold text-amber-300 mt-1 leading-tight">
                      *Calculado sobre peso habitual ({result.inputs.usualWeight} kg)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sin datos de peso/talla</p>
              )}
            </div>

            {/* IMC */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Estado Nutricional (IMC)
              </span>
              {result.bmi ? (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-white tracking-tight">
                      {result.bmi.bmi} <span className="text-xs font-semibold text-slate-400">kg/m²</span>
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-xs"
                      style={{ backgroundColor: result.bmi.color }}
                    >
                      {result.bmi.classification}
                    </span>
                  </div>
                  {isCriticalAlert && result.bmi.classification.includes("Normopeso") && (
                    <p className="text-[9.5px] font-bold text-rose-300 mt-1 leading-tight">
                      ⚠️ IMC estático opacado por catabolismo/pérdida aguda grave
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sin IMC disponible</p>
              )}
            </div>

            {/* PRIORIDAD CLÍNICA (REEMPLAZA A PESO IDEAL EN CASOS DE RIESGO) */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/10">
              {isCriticalAlert ? (
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-300 tracking-wider block mb-1">
                    Prioridad Asistencial Inmediata
                  </span>
                  <p className="text-sm font-black text-rose-200 tracking-tight leading-snug">
                    Frenar Catabolismo y Estabilizar Peso
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Peso Habitual: <strong>{result.weightLoss?.usualWeight ?? "--"} kg</strong> (Ref. inmediata)
                  </p>
                </div>
              ) : isModerateAlert ? (
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block mb-1">
                    Enfoque Asistencial
                  </span>
                  <p className="text-sm font-black text-amber-200 tracking-tight leading-snug">
                    Monitorear Ingesta Proteico-Calórica
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Peso Habitual: <strong>{result.weightLoss?.usualWeight ?? "--"} kg</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Rango Peso Ideal Recomendado
                  </span>
                  {result.idealWeight && result.idealWeight.supported ? (
                    <div>
                      <p className="text-xl font-black text-emerald-400 tracking-tight">
                        {result.idealWeight.min} – {result.idealWeight.max} <span className="text-xs text-slate-300">kg</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{result.idealWeight.reference}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Normopeso estándar</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN A: DATOS ESENCIALES (IZQ) vs DIAGNÓSTICOS SECUNDARIOS (DER)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
        {/* PASO 1: DATOS ESENCIALES */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Paso 1: Datos Esenciales
              </h2>
              <Button
                type="button"
                size="sm"
                onClick={executeCalculation}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-8 px-3.5 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    {calculatorLocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Calculator className="w-3.5 h-3.5" />
                    )}
                    <span>Calcular</span>
                  </>
                )}
              </Button>
            </div>

            {selectedPatient && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Paciente importado</p>
                  <p className="truncate text-xs font-bold text-slate-800">
                    {selectedPatient.fullName || selectedPatient.name || "Paciente sin nombre"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="shrink-0 text-[10px] font-bold text-emerald-700 hover:text-emerald-900"
                >
                  Quitar
                </button>
              </div>
            )}

            {/* Sexo & Actividad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Sexo Biológico</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  {(["Masculino", "Femenino"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold transition-colors cursor-pointer",
                        gender === g ? "bg-indigo-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Nivel de Actividad</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {ACTIVITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Peso, Talla, Edad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase truncate">Peso (kg)</label>
                <Input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  type="number"
                  min="0"
                  step="0.1"
                  className="h-9 rounded-xl text-xs font-semibold px-2 sm:px-3"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase truncate">Talla (cm)</label>
                <Input
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="165"
                  type="number"
                  min="0"
                  step="0.1"
                  className="h-9 rounded-xl text-xs font-semibold px-2 sm:px-3"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase truncate">Edad (años)</label>
                <Input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  type="number"
                  min="0"
                  max="120"
                  className="h-9 rounded-xl text-xs font-semibold px-2 sm:px-3"
                />
              </div>
            </div>

            {/* Fórmula TMB & IMC Objetivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Fórmula TMB</label>
                <select
                  value={tmbFormula}
                  onChange={(e) => setTmbFormula(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none"
                >
                  {FORMULA_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    IMC Objetivo (Peso Ideal)
                  </label>
                  {isTargetBmiCustom ? (
                    <button
                      type="button"
                      onClick={() => setIsTargetBmiCustom(false)}
                      className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      title="Restablecer IMC objetivo según criterio clínico OMS/Lipschitz"
                    >
                      Auto ✨
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Auto
                    </span>
                  )}
                </div>
                <Input
                  value={targetBmi}
                  onChange={(e) => {
                    setTargetBmi(e.target.value);
                    setIsTargetBmiCustom(true);
                  }}
                  placeholder="22.0"
                  type="number"
                  min="18"
                  max="30"
                  step="0.1"
                  className="h-9 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Condición fisiológica
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(event) => setIsPregnant(event.target.checked)}
                    className="accent-emerald-600"
                  />
                  Embarazo
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isLactating}
                    onChange={(event) => setIsLactating(event.target.checked)}
                    className="accent-emerald-600"
                  />
                  Lactancia
                </label>
              </div>
              {isPregnant ? (
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 mb-1 uppercase">
                    Semana gestacional
                  </label>
                  <Input
                    value={pregnancyWeek}
                    onChange={(event) => setPregnancyWeek(event.target.value)}
                    type="number"
                    min="1"
                    max="42"
                    step="1"
                    placeholder="24"
                    className="h-9 rounded-xl text-xs font-semibold px-3"
                  />
                </div>
              ) : null}
              {isLactating ? (
                <select
                  value={lactationType}
                  onChange={(event) => setLactationType(event.target.value as "exclusive" | "partial")}
                  className="w-full h-9 rounded-xl border border-emerald-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
                >
                  <option value="exclusive">Lactancia exclusiva (+500 kcal)</option>
                  <option value="partial">Lactancia parcial (+300 kcal)</option>
                </select>
              ) : null}
              <p className="text-[10px] text-emerald-800">
                Ajuste orientativo. Confirmar semana, tipo de lactancia y condición clínica antes de indicar un plan.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: DIAGNÓSTICOS SECUNDARIOS / ALERTAS CLÍNICAS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                Evaluaciones Específicas
              </h2>
              <span className="text-[10px] font-bold text-slate-400">
                {result ? "Calculado" : "Esperando cálculo"}
              </span>
            </div>

            {!result && !loading && (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <Calculator className="w-9 h-9 text-slate-300" />
                <p className="text-xs font-medium text-slate-500 max-w-xs">
                  Ingresa datos a la izquierda y presiona <strong>&quot;Calcular&quot;</strong> para desplegar las evaluaciones específicas.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* ALERTAS CLÍNICAS AUTOMÁTICAS */}
                <ClinicalAlerts result={result} mnaResult={mnaResult} />

                {/* Blackburn (Compacto) */}
                {activeModules.blackburn && result.weightLoss && (
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Historial de Peso (Blackburn):</span>
                    <span className="font-bold text-slate-700">
                      -{result.weightLoss.lossKg} kg ({result.weightLoss.percentLoss}%) en {result.weightLoss.periodWeeks} sem.
                    </span>
                  </div>
                )}

                {/* Proteínas */}
                {result.proteinRequirement && (
                  <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>Requerimiento Proteico:</span>
                      <span className="text-amber-800 font-black">
                        {result.proteinRequirement.minGrams}–{result.proteinRequirement.maxGrams} g/día ({result.proteinRequirement.minPerKg}–{result.proteinRequirement.maxPerKg} g/kg)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Perfil: {result.proteinRequirement.profileLabel}
                    </p>
                  </div>
                )}

                {/* Hidratación */}
                <HydrationCard result={result} />

                {/* Antropometría Chumlea / Frisancho / ICC */}
                {(result.estimatedHeight || result.estimatedWeight || result.armComposition || result.cardiovascularRisk) && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Antropometría & Composición
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {result.estimatedHeight && (
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Talla Est. Chumlea</span>
                          <span className="font-bold text-slate-800">{result.estimatedHeight} cm</span>
                        </div>
                      )}
                      {result.estimatedWeight && (
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Peso Est. Chumlea</span>
                          <span className="font-bold text-slate-800">{result.estimatedWeight} kg</span>
                        </div>
                      )}
                      {result.armComposition && (
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Área Muscular Brazo (AMB)</span>
                          <span className="font-bold text-slate-800">{(result.armComposition.ambMm2 / 100).toFixed(1)} cm²</span>
                        </div>
                      )}
                      {result.cardiovascularRisk?.icc && (
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Índice Cintura/Cadera</span>
                          <span className="font-bold text-slate-800">{result.cardiovascularRisk.icc} ({result.cardiovascularRisk.iccRisk})</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN B: MÓDULOS ADICIONALES A ANCHO COMPLETO DEL VIEWPORT (2 COLUMNAS) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-indigo-600" />
              Módulos Adicionales
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluaciones avanzadas desplegadas a 2 columnas en todo el ancho del contenedor.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Activa solo los que requiere tu paciente
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. EDEMA */}
          <div className={cn(activeModules.edema ? "col-span-1 md:col-span-2" : "col-span-1")}>
            {activeModules.edema ? (
              <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                  <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Edema / Descuento de Agua
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule("edema")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <DryWeightSelector
                  edemaPercent={edemaPercent}
                  setEdemaPercent={setEdemaPercent}
                  weight={weight}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleModule("edema")}
                className="w-full h-full flex items-center justify-between p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-700 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm gap-3"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Droplets className="w-4 h-4" />
                  </span>
                  + Agregar Evaluación de Edema / Retención de Líquidos
                </span>
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>

          {/* 2. BLACKBURN */}
          <div className={cn(activeModules.blackburn ? "col-span-1 md:col-span-2" : "col-span-1")}>
            {activeModules.blackburn ? (
              <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                  <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    Pérdida Involuntaria de Peso (Blackburn)
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule("blackburn")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <WeightLossPanel
                  usualWeight={usualWeight}
                  setUsualWeight={setUsualWeight}
                  weightLossPeriodWeeks={weightLossPeriodWeeks}
                  setWeightLossPeriodWeeks={setWeightLossPeriodWeeks}
                  result={result}
                />

                {usualWeight && (isSevereWeightLoss || isSignificantWeightLoss) && (
                  <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex items-start gap-2.5 mt-2 animate-in fade-in duration-200">
                    <input
                      type="checkbox"
                      id="useUsualWeight"
                      checked={useUsualWeightForRequirements}
                      onChange={(e) => setUseUsualWeightForRequirements(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="useUsualWeight" className="text-xs font-semibold text-indigo-950 cursor-pointer select-none leading-normal">
                      Calcular requerimientos (GET, proteínas, agua) sobre el peso habitual ({usualWeight} kg)
                      <span className="block text-[10px] font-normal text-indigo-700 mt-0.5">
                        💡 Recomendado clínicamente para evitar subestimar necesidades calórico-proteicas en fase de desnutrición/pérdida aguda.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleModule("blackburn")}
                className="w-full h-full flex items-center justify-between p-4 bg-white hover:bg-rose-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-rose-300 text-xs font-bold text-slate-700 hover:text-rose-700 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm gap-3"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <TrendingDown className="w-4 h-4" />
                  </span>
                  + Agregar Pérdida de Peso Involuntaria (Blackburn)
                </span>
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>

          {/* 3. REQUERIMIENTO PROTEICO ESPECÍFICO */}
          <div className={cn(activeModules.protein ? "col-span-1 md:col-span-2" : "col-span-1")}>
            {activeModules.protein ? (
              <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-amber-50 pb-2">
                  <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase">
                    <Award className="w-4 h-4 text-amber-500" />
                    Requerimiento Proteico según Perfil Clínico
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule("protein")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <ProteinPanel
                  proteinProfile={proteinProfile}
                  setProteinProfile={setProteinProfile}
                  result={result}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleModule("protein")}
                className="w-full h-full flex items-center justify-between p-4 bg-white hover:bg-amber-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-amber-300 text-xs font-bold text-slate-700 hover:text-amber-700 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm gap-3"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Award className="w-4 h-4" />
                  </span>
                  + Agregar Perfil Proteico Específico (Deportista, Renal, Oncología, Adulto Mayor)
                </span>
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>

          {/* 4. CHUMLEA */}
          <div className={cn(activeModules.chumlea ? "col-span-1 md:col-span-2" : "col-span-1")}>
            {activeModules.chumlea ? (
              <div className="bg-white rounded-2xl border border-sky-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-sky-50 pb-2">
                  <h3 className="text-xs font-bold text-sky-900 flex items-center gap-1.5 uppercase">
                    <Ruler className="w-4 h-4 text-sky-500" />
                    Estimación Antropométrica Chumlea
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule("chumlea")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Altura Rodilla AR (cm)</label>
                    <Input
                      value={kneeHeight}
                      onChange={(e) => setKneeHeight(e.target.value)}
                      placeholder="Ej: 50"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Pantorrilla CP (cm)</label>
                    <Input
                      value={calfCircumference}
                      onChange={(e) => setCalfCircumference(e.target.value)}
                      placeholder="Ej: 34"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Braquial CB (cm)</label>
                    <Input
                      value={armCircumference}
                      onChange={(e) => setArmCircumference(e.target.value)}
                      placeholder="Ej: 28"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Pliegue Subescapular PSE (mm) <span className="text-indigo-600 font-normal">(Compartido)</span>
                    </label>
                    <Input
                      value={subescapularFold}
                      onChange={(e) => setSubescapularFold(e.target.value)}
                      placeholder="Ej: 15"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleModule("chumlea")}
                className="w-full h-full flex items-center justify-between p-4 bg-white hover:bg-sky-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-700 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm gap-3"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <Ruler className="w-4 h-4" />
                  </span>
                  + Agregar Estimación de Talla/Peso por Chumlea
                </span>
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>

          {/* 5. FRISANCHO (Solo pliegues esenciales: Tricipital + Subescapular compartido) */}
          <div className={cn(activeModules.frisancho ? "col-span-1 md:col-span-2" : "col-span-1")}>
            {activeModules.frisancho ? (
              <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                  <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase">
                    <Percent className="w-4 h-4 text-purple-500" />
                    Pliegues Cutáneos & Composición (Frisancho)
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule("frisancho")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pliegue Tricipital (mm)</label>
                    <Input
                      value={tricipitalFold}
                      onChange={(e) => setTricipitalFold(e.target.value)}
                      placeholder="Ej: 12.5"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Pliegue Subescapular (mm) <span className="text-indigo-600 font-normal">(Compartido)</span>
                    </label>
                    <Input
                      value={subescapularFold}
                      onChange={(e) => setSubescapularFold(e.target.value)}
                      placeholder="Ej: 15.0"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleModule("frisancho")}
                className="w-full h-full flex items-center justify-between p-4 bg-white hover:bg-purple-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-purple-300 text-xs font-bold text-slate-700 hover:text-purple-700 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm gap-3"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Percent className="w-4 h-4" />
                  </span>
                  + Agregar Pliegues Cutáneos (AMB/AGB Frisancho)
                </span>
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>

          {/* 6. RIESGO CARDIO (ICC) */}
          <div className={cn(activeModules.icc ? "col-span-1 md:col-span-2" : "col-span-1")}>
            {activeModules.icc ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                  <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase">
                    <Heart className="w-4 h-4 text-emerald-500" />
                    Riesgo Cardiovascular (Cintura/Cadera ICC)
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule("icc")}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Cintura (cm)</label>
                    <Input
                      value={waistCircumference}
                      onChange={(e) => setWaistCircumference(e.target.value)}
                      placeholder="Cintura"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Cadera (cm)</label>
                    <Input
                      value={hipCircumference}
                      onChange={(e) => setHipCircumference(e.target.value)}
                      placeholder="Cadera"
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-8 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleModule("icc")}
                className="w-full h-full flex items-center justify-between p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:border-emerald-700 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm gap-3"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Heart className="w-4 h-4" />
                  </span>
                  + Agregar Riesgo Cardiovascular (Cintura / Cadera)
                </span>
                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      <PatientSelectionModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patients={patients}
        onSelectPatient={importPatient}
        isLoading={isLoadingPatients}
        selectedPatientId={selectedPatient?.id}
        error={patientsError}
        title="Importar paciente"
      />

      {/* Modal MNA */}
      <MNAModal
        isOpen={isMNAModalOpen}
        onClose={() => setIsMNAModalOpen(false)}
        onApplyMNA={(mnaData) => setMnaResult(mnaData)}
      />

      {/* Modal de Selección de Tests */}
      {isTestSelectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Tests de Tamizaje Nutricional
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona una herramienta validada para evaluar el riesgo nutricional del paciente.
                </p>
              </div>
              <button
                onClick={() => setIsTestSelectorModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <TestSelectorPanel
              onSelect={handleSelectScreeningTest}
              locked={screeningTestsLocked}
              suggestedTest={suggestedTest}
            />
          </div>
        </div>
      )}

      {/* Modal del Test Seleccionado */}
      {activeScreeningTest && (
        <ScreeningTestModal
          isOpen={isScreeningModalOpen}
          testType={activeScreeningTest}
          onClose={() => {
            setIsScreeningModalOpen(false);
            setActiveScreeningTest(null);
          }}
          patientData={screeningAutoFillData}
        />
      )}
    </div>
  );
}
