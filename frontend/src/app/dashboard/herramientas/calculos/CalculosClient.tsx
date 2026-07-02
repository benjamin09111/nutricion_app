"use client";

import { useState, useEffect } from "react";
import {
  Calculator,
  Activity,
  Target,
  Scale,
  Zap,
  ChevronDown,
  Ruler,
  Percent,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/memberships/FeatureGate";
import { api } from "@/lib/api";

const FORMULA_OPTIONS = [
  { value: "mifflin-st-jeor", label: "Mifflin-St Jeor (1990)", desc: "Más preciso en adultos. Gold standard actual." },
  { value: "harris-benedict", label: "Harris-Benedict (1919)", desc: "Clásico. Puede sobreestimar en obesidad." },
  { value: "oms-fao", label: "OMS/FAO (2004)", desc: "Estándar internacional. Ajustado por rangos de edad." },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentario", label: "Sedentario", factor: 1.2, desc: "Poco o ningún ejercicio, trabajo de escritorio" },
  { value: "ligero", label: "Ligero", factor: 1.375, desc: "Ejercicio ligero 1-3 días a la semana" },
  { value: "moderado", label: "Moderado", factor: 1.55, desc: "Ejercicio moderado 3-5 días a la semana" },
  { value: "activo", label: "Activo", factor: 1.725, desc: "Ejercicio fuerte 6-7 días a la semana" },
  { value: "muy_activo", label: "Muy Activo", factor: 1.9, desc: "Ejercicio muy fuerte o trabajo físico intenso" },
];

interface CalculationResult {
  inputs: {
    gender: string;
    age: number | null;
    weight: number | null;
    height: number | null;
    activityLevel: string;
    kneeHeight: number | null;
    calfCircumference: number | null;
    armCircumference: number | null;
    waistCircumference: number | null;
    hipCircumference: number | null;
    folds: {
      tricipital: number | null;
      subescapular: number | null;
      bicipital: number | null;
      suprailiaco: number | null;
    };
  };
  estimatedHeight: number | null;
  estimatedWeight: number | null;
  bmi: {
    bmi: number;
    classification: string;
    color: string;
    isPediatric: boolean;
    percentile?: number;
    percentileCategory?: string;
    reference?: string;
    note?: string;
  } | null;
  idealWeight: {
    min: number;
    max: number;
    reference: string;
    note?: string;
    supported: boolean;
  } | null;
  adjustedWeight: number | null;
  armComposition: {
    cmbMm: number;
    atbMm2: number;
    ambMm2: number;
    agbMm2: number;
    fatPercentage: number;
  } | null;
  cardiovascularRisk: {
    waistCircumference: number;
    hipCircumference: number | null;
    icc: number | null;
    iccRisk: string;
    waistRiskNcep: string;
    waistRiskIdf: string;
  } | null;
  energy: {
    tmb: number;
    formula: string;
    get: number;
    activityFactor: number;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      proteinPercent: number;
      carbsPercent: number;
      fatsPercent: number;
    };
  } | null;
  exchangePortions: {
    category: string;
    amount: string;
    portions: number;
    cho: number;
    protein: number;
    fat: number;
    kcal: number;
    profileId: string;
  }[];
}

export default function CalculosClient() {
  const [gender, setGender] = useState<"Masculino" | "Femenino">("Femenino");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState("sedentario");
  const [tmbFormula, setTmbFormula] = useState("mifflin-st-jeor");
  const [carbPct, setCarbPct] = useState(55);
  const [proteinPct, setProteinPct] = useState(20);
  const [fatPct, setFatPct] = useState(25);

  // Advanced inputs
  const [kneeHeight, setKneeHeight] = useState("");
  const [calfCircumference, setCalfCircumference] = useState("");
  const [armCircumference, setArmCircumference] = useState("");
  const [waistCircumference, setWaistCircumference] = useState("");
  const [hipCircumference, setHipCircumference] = useState("");
  const [tricipitalFold, setTricipitalFold] = useState("");
  const [bicipitalFold, setBicipitalFold] = useState("");
  const [subescapularFold, setSubescapularFold] = useState("");
  const [suprailiacoFold, setSuprailiacoFold] = useState("");

  // UI state
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Trigger calculations on backend with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      // We need at least basic info or kneeHeight to run calculations
      const hasBasicInfo = (weight && height) || age;
      const hasChumleaInfo = kneeHeight && age && gender;
      if (!hasBasicInfo && !hasChumleaInfo) {
        setResult(null);
        return;
      }

      setLoading(true);
      try {
        const body = {
          gender,
          weight: parseFloat(weight) || null,
          height: parseFloat(height) || null,
          ageYears: parseInt(age) || null,
          activityLevel,
          tmbFormula,
          carbPct,
          proteinPct,
          fatPct,
          kneeHeight: parseFloat(kneeHeight) || null,
          calfCircumference: parseFloat(calfCircumference) || null,
          armCircumference: parseFloat(armCircumference) || null,
          waistCircumference: parseFloat(waistCircumference) || null,
          hipCircumference: parseFloat(hipCircumference) || null,
          tricipitalFold: parseFloat(tricipitalFold) || null,
          bicipitalFold: parseFloat(bicipitalFold) || null,
          subescapularFold: parseFloat(subescapularFold) || null,
          suprailiacoFold: parseFloat(suprailiacoFold) || null,
        };

        const response = await api.post("/calculations/calculate", body);
        setResult(response as unknown as CalculationResult);
      } catch (error) {
        console.error("Error calculating:", error);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [
    gender,
    weight,
    height,
    age,
    activityLevel,
    tmbFormula,
    carbPct,
    proteinPct,
    fatPct,
    kneeHeight,
    calfCircumference,
    armCircumference,
    waistCircumference,
    hipCircumference,
    tricipitalFold,
    bicipitalFold,
    subescapularFold,
    suprailiacoFold,
  ]);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleQuickValues = () => {
    // Fill test inputs for validation
    setGender("Masculino");
    setAge("65");
    setKneeHeight("50");
    setCalfCircumference("35");
    setArmCircumference("25");
    setSubescapularFold("15");
    // Clear basic weight and height to test estimation
    setWeight("");
    setHeight("");
  };

  return (
    <FeatureGate
      feature="clinical_calculator.access"
      message="La calculadora clínica está disponible desde Iniciante."
    >
      <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
                <Calculator className="w-6 h-6" />
              </span>
              Calculadora Clínica Rápida
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              Motor centralizado para cálculos antropométricos avanzados, curvas pediátricas MINSAL, Lipschitz y composición corporal corporal total.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickValues}
              className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            >
              Cargar Caso Ejemplo (Adulto Mayor)
            </Button>
          </div>
        </div>

        {/* Glossary */}
        <div className="mb-6 bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowGlossary(!showGlossary)}
            className="flex items-center justify-between w-full text-sm font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-indigo-500">❖</span>
              ¿Qué formulas y criterios se aplican en esta herramienta?
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showGlossary && "rotate-180")} />
          </button>
          {showGlossary && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="font-bold text-slate-800 uppercase tracking-wide">1. Diagnóstico de IMC</p>
                <ul className="mt-1 space-y-1 list-disc pl-3 text-[11px]">
                  <li><strong>Pediátrico (&lt;18 años):</strong> Curvas LMS MINSAL (Chile).</li>
                  <li><strong>Adulto (18-64 años):</strong> Estándar OMS (18.5 - 24.9).</li>
                  <li><strong>Geriátrico (&ge;65 años):</strong> Criterio Lipschitz / OPS (23.0 - 27.9).</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="font-bold text-slate-800 uppercase tracking-wide">2. Peso Ideal y Ajustado</p>
                <ul className="mt-1 space-y-1 list-disc pl-3 text-[11px]">
                  <li><strong>Adultos:</strong> IMC objetivo 22.5 (hombres) / 21.5 (mujeres).</li>
                  <li><strong>Adulto Mayor:</strong> IMC objetivo 25.5.</li>
                  <li><strong>Niños:</strong> Percentil 50 de la curva LMS.</li>
                  <li><strong>Ajustado:</strong> Clínico metabólico para desvíos.</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="font-bold text-slate-800 uppercase tracking-wide">3. Estimaciones Especiales</p>
                <ul className="mt-1 space-y-1 list-disc pl-3 text-[11px]">
                  <li><strong>Chumlea:</strong> Estatura y peso estimados si no se puede parar al paciente.</li>
                  <li><strong>Frisancho (1990):</strong> Composición muscular (AMB) y grasa (AGB) de brazo.</li>
                  <li><strong>Cardiovascular:</strong> Riesgo por índice cintura/cadera (ICC).</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-5 items-start">
          {/* Inputs Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Panel 1: Datos Básicos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Datos Básicos de Entrada
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                          gender === g ? "bg-indigo-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50",
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Actividad</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {ACTIVITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label} (×{o.factor})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Peso (kg)</label>
                  <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej: 70" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Talla (cm)</label>
                  <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ej: 165" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Edad (años)</label>
                  <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ej: 30" type="number" min="0" max="120" className="h-9 rounded-xl text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Fórmula de Tasa Basal</label>
                <select
                  value={tmbFormula}
                  onChange={(e) => setTmbFormula(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {FORMULA_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Panel 2: Chumlea & Composición (Colapsables) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Sección Chumlea */}
              <div className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleSection("chumlea")}
                  className="flex items-center justify-between w-full px-5 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-sky-500" />
                    Mediciones Chumlea (Est. Talla/Peso)
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform text-slate-400", openSection === "chumlea" && "rotate-180")} />
                </button>
                {openSection === "chumlea" && (
                  <div className="p-5 bg-slate-50/50 space-y-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Altura Rodilla (cm)</label>
                        <Input value={kneeHeight} onChange={(e) => setKneeHeight(e.target.value)} placeholder="AR (cm)" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Pantorrilla (cm)</label>
                        <Input value={calfCircumference} onChange={(e) => setCalfCircumference(e.target.value)} placeholder="CP (cm)" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Braquial (cm)</label>
                        <Input value={armCircumference} onChange={(e) => setArmCircumference(e.target.value)} placeholder="CB (cm)" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pliegue Subescapular (mm)</label>
                        <Input value={subescapularFold} onChange={(e) => setSubescapularFold(e.target.value)} placeholder="PSE (mm)" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección Pliegues Cutáneos */}
              <div className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleSection("pliegues")}
                  className="flex items-center justify-between w-full px-5 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-rose-500" />
                    Pliegues Cutáneos Completos
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform text-slate-400", openSection === "pliegues" && "rotate-180")} />
                </button>
                {openSection === "pliegues" && (
                  <div className="p-5 bg-slate-50/50 space-y-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pliegue Tricipital (mm)</label>
                        <Input value={tricipitalFold} onChange={(e) => setTricipitalFold(e.target.value)} placeholder="Tricipital" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pliegue Bicipital (mm)</label>
                        <Input value={bicipitalFold} onChange={(e) => setBicipitalFold(e.target.value)} placeholder="Bicipital" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pliegue Subescapular (mm)</label>
                        <Input value={subescapularFold} onChange={(e) => setSubescapularFold(e.target.value)} placeholder="Subescapular" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pliegue Suprailíaco (mm)</label>
                        <Input value={suprailiacoFold} onChange={(e) => setSuprailiacoFold(e.target.value)} placeholder="Suprailíaco" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección Circunferencias */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("circunferencias")}
                  className="flex items-center justify-between w-full px-5 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Riesgo Cardio (Cintura/Cadera)
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform text-slate-400", openSection === "circunferencias" && "rotate-180")} />
                </button>
                {openSection === "circunferencias" && (
                  <div className="p-5 bg-slate-50/50 space-y-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Cintura (cm)</label>
                        <Input value={waistCircumference} onChange={(e) => setWaistCircumference(e.target.value)} placeholder="Cintura" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Circ. Cadera (cm)</label>
                        <Input value={hipCircumference} onChange={(e) => setHipCircumference(e.target.value)} placeholder="Cadera" type="number" min="0" step="0.1" className="h-9 rounded-xl text-xs bg-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="bg-white/80 rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm min-h-[300px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Calculando métricas clínicas...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
                <Calculator className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-400">
                  Ingresa peso, altura, edad o los datos complementarios para desplegar el análisis clínico nutricional automático.
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4">
                {/* IMC & Ideal Weight Section */}
                {result.bmi && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-blue-500" />
                        ESTADO NUTRICIONAL E IMC
                      </h3>
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm"
                        style={{ backgroundColor: result.bmi.color }}
                      >
                        {result.bmi.classification}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div className="text-center sm:text-left bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400">IMC Calculado</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">
                          {result.bmi.bmi} <span className="text-[10px] font-normal text-slate-400">kg/m²</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-wide">{result.bmi.reference}</p>
                      </div>

                      {result.bmi.percentile !== undefined && (
                        <div className="text-center sm:text-left bg-indigo-50/50 rounded-xl p-3.5 border border-indigo-100">
                          <p className="text-[10px] font-black uppercase text-indigo-500">Percentil (MINSAL)</p>
                          <p className="text-3xl font-black text-indigo-800 mt-1">
                            p{result.bmi.percentile}
                          </p>
                          <p className="text-[9px] text-indigo-500 font-bold mt-1 tracking-wide">Categoría: {result.bmi.percentileCategory}</p>
                        </div>
                      )}

                      {result.idealWeight && result.idealWeight.supported && (
                        <div className="text-center sm:text-left bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 col-span-1">
                          <p className="text-[10px] font-black uppercase text-emerald-600">Rango Normopeso</p>
                          <p className="text-2xl font-black text-emerald-800 mt-1">
                            {result.idealWeight.min} – {result.idealWeight.max} <span className="text-xs font-normal">kg</span>
                          </p>
                          <p className="text-[9px] text-emerald-500 font-bold mt-1 tracking-wide">Ref: {result.idealWeight.reference}</p>
                        </div>
                      )}
                    </div>

                    {result.bmi.note && (
                      <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Observación Clínica:</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">{result.bmi.note}</p>
                        </div>
                      </div>
                    )}

                    {result.adjustedWeight && (
                      <div className="bg-sky-50/50 rounded-xl p-3 text-xs text-sky-800 border border-sky-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold uppercase text-[9px] text-sky-600 tracking-wider">Peso Ajustado Metabólico</p>
                          <p className="text-[11px] text-sky-700 mt-0.5">Utilizado para calcular requerimientos energéticos en desvíos severos.</p>
                        </div>
                        <p className="text-xl font-black text-sky-800">{result.adjustedWeight} <span className="text-xs font-semibold">kg</span></p>
                      </div>
                    )}
                  </div>
                )}

                {/* Estimation Chumlea Stature & Weight */}
                {(result.estimatedHeight || result.estimatedWeight) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                      <Ruler className="w-4 h-4 text-sky-500" />
                      Estimaciones Antropométricas (Chumlea)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {result.estimatedHeight && (
                        <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100 text-center">
                          <p className="text-[10px] font-black uppercase text-sky-600">Estatura Estimada (Chumlea)</p>
                          <p className="text-2xl font-black text-sky-900 mt-1">{result.estimatedHeight} <span className="text-xs font-normal">cm</span></p>
                          <p className="text-[9px] text-sky-500 mt-0.5">({(result.estimatedHeight / 100).toFixed(2)} m)</p>
                        </div>
                      )}
                      {result.estimatedWeight && (
                        <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100 text-center">
                          <p className="text-[10px] font-black uppercase text-sky-600">Peso Estimado (Chumlea)</p>
                          <p className="text-2xl font-black text-sky-900 mt-1">{result.estimatedWeight} <span className="text-xs font-normal">kg</span></p>
                          <p className="text-[9px] text-sky-500 mt-0.5">Calculado con pliegues y perímetros.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Composición Corporal Brazo (Frisancho) */}
                {result.armComposition && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                      <Percent className="w-4 h-4 text-rose-500" />
                      Composición Corporal del Brazo (Frisancho, 1990)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">CMB (Perímetro Músculo)</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{result.armComposition.cmbMm} <span className="text-[10px] font-normal text-slate-400">mm</span></p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">AMB (Área Muscular)</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{result.armComposition.ambMm2} <span className="text-[10px] font-normal text-slate-400">mm²</span></p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">AGB (Área Grasa)</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{result.armComposition.agbMm2} <span className="text-[10px] font-normal text-slate-400">mm²</span></p>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
                        <p className="text-[9px] font-bold text-rose-600 uppercase">Grasa Brazo Estimada</p>
                        <p className="text-lg font-black text-rose-700 mt-1">{result.armComposition.fatPercentage}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cardiovascular Risk (ICC) */}
                {result.cardiovascularRisk && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Riesgo Cardiovascular y Distribución de Grasa
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {result.cardiovascularRisk.icc !== null && (
                        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Índice Cintura/Cadera (ICC)</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{result.cardiovascularRisk.icc}</p>
                          <span className={cn(
                            "inline-block mx-auto mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white",
                            result.cardiovascularRisk.iccRisk === "Elevado" ? "bg-rose-500" : "bg-emerald-500"
                          )}>
                            Riesgo: {result.cardiovascularRisk.iccRisk}
                          </span>
                        </div>
                      )}
                      <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Criterio NCEP ATP III</p>
                        <p className="text-xs font-bold text-slate-700 mt-1.5 leading-relaxed">Riesgo por Cintura:</p>
                        <span className={cn(
                          "inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white",
                          result.cardiovascularRisk.waistRiskNcep === "Aumentado" ? "bg-rose-500" : "bg-emerald-500"
                        )}>
                          {result.cardiovascularRisk.waistRiskNcep}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Criterio IDF Latino</p>
                        <p className="text-xs font-bold text-slate-700 mt-1.5 leading-relaxed">Riesgo por Cintura:</p>
                        <span className={cn(
                          "inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white",
                          result.cardiovascularRisk.waistRiskIdf === "Aumentado" ? "bg-rose-500" : "bg-emerald-500"
                        )}>
                          {result.cardiovascularRisk.waistRiskIdf}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Energy & GET Section */}
                {result.energy && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Gasto Energético y Requerimientos
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">TMB Basal</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{result.energy.tmb}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">kcal/día</p>
                      </div>
                      <div className="bg-indigo-500 rounded-xl p-3 text-center text-white shadow-md shadow-indigo-500/25">
                        <p className="text-[9px] font-black uppercase text-indigo-100">GET (Con Actividad)</p>
                        <p className="text-xl font-black mt-1">{result.energy.get}</p>
                        <p className="text-[9px] text-indigo-200 mt-0.5">kcal/día</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">Factor Actividad</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">×{result.energy.activityFactor}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{result.energy.formula}</p>
                      </div>
                    </div>

                    {/* Macros breakdown */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-500" />
                          Distribución de Macronutrientes sugerida
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowDetails(!showDetails)}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {showDetails ? "Ocultar Tabla de Porciones" : "Mostrar Tabla de Porciones"}
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showDetails && "rotate-180")} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Carbohidratos ({carbPct}%)
                          </label>
                          <input
                            type="range"
                            min={40}
                            max={65}
                            value={carbPct}
                            onChange={(e) => {
                              const newCarb = Number(e.target.value);
                              setCarbPct(newCarb);
                              setProteinPct(100 - newCarb - fatPct);
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Proteínas ({proteinPct}%)
                          </label>
                          <input
                            type="range"
                            min={10}
                            max={35}
                            value={proteinPct}
                            onChange={(e) => {
                              const newProt = Number(e.target.value);
                              setProteinPct(newProt);
                              setCarbPct(100 - newProt - fatPct);
                            }}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Grasas ({fatPct}%)
                          </label>
                          <input
                            type="range"
                            min={15}
                            max={40}
                            value={fatPct}
                            onChange={(e) => {
                              const newFat = Number(e.target.value);
                              setFatPct(newFat);
                              setCarbPct(100 - proteinPct - newFat);
                            }}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-amber-50/50 rounded-xl p-3 text-center border border-amber-100">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Carbohidratos</p>
                          <p className="text-xl font-black text-amber-800 mt-1">{result.energy.macros.carbs} <span className="text-xs font-normal">g</span></p>
                          <p className="text-[10px] text-amber-500 font-bold mt-0.5">{result.energy.macros.carbs * 4} kcal</p>
                        </div>
                        <div className="bg-blue-50/50 rounded-xl p-3 text-center border border-blue-100">
                          <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Proteínas</p>
                          <p className="text-xl font-black text-blue-800 mt-1">{result.energy.macros.protein} <span className="text-xs font-normal">g</span></p>
                          <p className="text-[10px] text-blue-500 font-bold mt-0.5">{result.energy.macros.protein * 4} kcal</p>
                        </div>
                        <div className="bg-rose-50/50 rounded-xl p-3 text-center border border-rose-100">
                          <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Grasas</p>
                          <p className="text-xl font-black text-rose-800 mt-1">{result.energy.macros.fats} <span className="text-xs font-normal">g</span></p>
                          <p className="text-[10px] text-rose-500 font-bold mt-0.5">{result.energy.macros.fats * 9} kcal</p>
                        </div>
                      </div>
                    </div>

                    {/* Exchange Portions Table */}
                    {showDetails && result.exchangePortions && result.exchangePortions.length > 0 && (
                      <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                          Porciones de Intercambio Clínicas Equivalentes
                        </h4>
                        <div className="overflow-hidden border border-slate-150 rounded-xl">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-150">
                              <tr>
                                <th className="text-left px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">Categoría de Alimento</th>
                                <th className="text-center px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">Porciones (Ejemplo Práctico)</th>
                                <th className="text-center px-2 py-2 font-bold text-slate-500 uppercase tracking-wide">CHO</th>
                                <th className="text-center px-2 py-2 font-bold text-slate-500 uppercase tracking-wide">Prot</th>
                                <th className="text-center px-2 py-2 font-bold text-slate-500 uppercase tracking-wide">Grasa</th>
                                <th className="text-center px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">Energía</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {result.exchangePortions.map((p) => (
                                <tr key={p.profileId} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-2 font-semibold text-slate-700">{p.category}</td>
                                  <td className="px-4 py-2 text-center">
                                    <span className="font-bold text-slate-900">{p.portions}</span>{" "}
                                    <span className="text-[10px] text-slate-400">({p.amount})</span>
                                  </td>
                                  <td className="px-2 py-2 text-center text-amber-600 font-medium">{p.cho}g</td>
                                  <td className="px-2 py-2 text-center text-blue-600 font-medium">{p.protein}g</td>
                                  <td className="px-2 py-2 text-center text-rose-600 font-medium">{p.fat}g</td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-700">{p.kcal} kcal</td>
                                </tr>
                              ))}
                              <tr className="bg-indigo-50/30 font-bold border-t border-slate-200">
                                  <td className="px-4 py-2.5 text-indigo-900 font-black">Totales Acumulados</td>
                                  <td className="px-4 py-2.5 text-center text-indigo-900 font-black">
                                    {result.exchangePortions.reduce((s, p) => s + p.portions, 0)} porciones
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-amber-700 font-black">{result.exchangePortions.reduce((s, p) => s + p.cho, 0)}g</td>
                                  <td className="px-2 py-2.5 text-center text-blue-700 font-black">{result.exchangePortions.reduce((s, p) => s + p.protein, 0)}g</td>
                                  <td className="px-2 py-2.5 text-center text-rose-700 font-black">{result.exchangePortions.reduce((s, p) => s + p.fat, 0)}g</td>
                                  <td className="px-4 py-2.5 text-center text-indigo-800 font-black">{result.exchangePortions.reduce((s, p) => s + p.kcal, 0)} kcal</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
