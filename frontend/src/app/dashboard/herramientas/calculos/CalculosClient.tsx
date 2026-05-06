"use client";

import { useState } from "react";
import {
  Calculator,
  Activity,
  Target,
  Scale,
  Zap,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  calculateBMI,
  calculateGET,
  calculateMacros,
  getIdealWeightRange,
  calculateExchangePortions,
  ACTIVITY_FACTORS,
  BMI_CLASSIFICATIONS,
  MACRO_RANGES,
  EXCHANGE_PORTIONS,
  type TmbFormula,
  type ActivityLevel,
  type Gender,
} from "@/lib/nutrition-formulas";

const FORMULA_OPTIONS: { value: TmbFormula; label: string; desc: string }[] = [
  { value: "mifflin-st-jeor", label: "Mifflin-St Jeor (1990)", desc: "Más preciso en adultos. Gold standard actual." },
  { value: "harris-benedict", label: "Harris-Benedict (1919)", desc: "Clásico. Puede sobreestimar en obesidad." },
  { value: "oms-fao", label: "OMS/FAO (2004)", desc: "Estándar internacional. Ajustado por rangos de edad." },
];

export default function CalculosClient() {
  const [gender, setGender] = useState<Gender>("Femenino");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("sedentario");
  const [tmbFormula, setTmbFormula] = useState<TmbFormula>("mifflin-st-jeor");
  const [carbPct, setCarbPct] = useState(55);
  const [proteinPct, setProteinPct] = useState(20);
  const [fatPct, setFatPct] = useState(25);
  const [showDetails, setShowDetails] = useState(false);

  const [showGlossary, setShowGlossary] = useState(false);

  const weightNum = parseFloat(weight) || 0;
  const heightNum = parseFloat(height) || 0;
  const ageNum = parseInt(age) || 0;

  const bmi = calculateBMI(weightNum, heightNum);
  const idealWeight = getIdealWeightRange(heightNum);
  const get = calculateGET(gender, weightNum, heightNum, ageNum, activityLevel, tmbFormula);
  const macros = calculateMacros(get?.get || 0, carbPct / 100, proteinPct / 100, fatPct / 100);
  const portions = get ? calculateExchangePortions(get.macros) : [];

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Calculator className="w-7 h-7 text-emerald-500" />
          Calculadora Nutricional
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Calcula IMC, TMB, GET y distribución de macronutrientes usando fórmulas clínicas estándar internacional.
        </p>

        <div className="mt-4 bg-amber-50 rounded-2xl border border-amber-200 p-5">
          <button
            type="button"
            onClick={() => setShowGlossary(!showGlossary)}
            className="flex items-center gap-2 text-sm font-semibold text-amber-800 cursor-pointer"
          >
            <span>{showGlossary ? "▲" : "▼"}</span>
            {showGlossary ? "Ocultar guía de conceptos" : "¿Qué significa cada término? — Guía rápida"}
          </button>
          {showGlossary && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-amber-900">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="font-bold text-amber-800">Talla (Altura)</p>
                <p className="text-xs mt-0.5">Lo que mide la persona de pies a cabeza, en centímetros. Ej: 1.65 m = 165 cm.</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="font-bold text-amber-800">IMC (Índice de Masa Corporal)</p>
                <p className="text-xs mt-0.5">Relación entre peso y altura. Sirve para saber si alguien está en peso normal, bajo peso u obesidad.</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="font-bold text-amber-800">TMB (Tasa Metabólica Basal)</p>
                <p className="text-xs mt-0.5">Calorías que el cuerpo gasta en reposo absoluto, solo para mantener funciones vitales (respirar, pensar, latir el corazón).</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="font-bold text-amber-800">GET (Gasto Energético Total)</p>
                <p className="text-xs mt-0.5">Calorías reales que necesita la persona en su día a día: TMB × nivel de actividad (trabajo, ejercicio, vida diaria).</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="font-bold text-amber-800">Macronutrientes (Macros)</p>
                <p className="text-xs mt-0.5">Gramos diarios de proteínas (músculo), carbohidratos (energía) y grasas (reserva) que la persona debe consumir según su GET.</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="font-bold text-amber-800">Factor de Actividad</p>
                <p className="text-xs mt-0.5">Multiplicador que ajusta las calorías según el estilo de vida: ×1.2 (oficina) hasta ×1.9 (atleta).</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Datos del paciente
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Sexo</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                {(["Masculino", "Femenino"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                      gender === g ? "bg-emerald-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Actividad</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {Object.entries(ACTIVITY_FACTORS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label} (×{val.factor})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Peso (kg)</label>
              <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" type="number" min="0" step="0.1" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Talla (cm)</label>
              <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="165" type="number" min="0" step="0.1" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Edad</label>
              <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" type="number" min="0" max="120" className="h-11 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Fórmula TMB</label>
            <select
              value={tmbFormula}
              onChange={(e) => setTmbFormula(e.target.value as TmbFormula)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {FORMULA_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-400">{FORMULA_OPTIONS.find(f => f.value === tmbFormula)?.desc}</p>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* IMC Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                IMC
              </h2>
              {bmi && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: bmi.color }}>
                  {bmi.classification}
                </span>
              )}
            </div>
            {bmi ? (
              <div className="space-y-3">
                <p className="text-4xl font-bold text-slate-900">{bmi.bmi} <span className="text-base font-normal text-slate-400">kg/m²</span></p>
                {idealWeight && (
                  <p className="text-sm text-slate-500">Peso ideal estimado: <span className="font-semibold text-slate-700">{idealWeight.min} – {idealWeight.max} kg</span></p>
                )}
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                  {BMI_CLASSIFICATIONS.map((c, i) => (
                    <div
                      key={i}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${((c.max - c.min) / 40) * 100}%`,
                        backgroundColor: c.color,
                        opacity: bmi.bmi >= c.min && bmi.bmi < c.max ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                  <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Ingresa peso y talla para calcular.</p>
            )}
          </div>

          {/* GET Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-emerald-500" />
              Gasto Energético Total
            </h2>
            {get ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">TMB</p>
                    <p className="text-xl font-bold text-slate-900">{get.tmb}</p>
                    <p className="text-[10px] text-slate-400">kcal/día</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center ring-1 ring-emerald-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">GET</p>
                    <p className="text-xl font-bold text-emerald-700">{get.get}</p>
                    <p className="text-[10px] text-emerald-500">kcal/día</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Factor</p>
                    <p className="text-xl font-bold text-slate-900">×{get.activityFactor}</p>
                    <p className="text-[10px] text-slate-400">{get.formula}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Completa los datos para ver el GET.</p>
            )}
          </div>
        </div>
      </div>

      {/* Macro Distribution */}
      {get && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Distribución de Macronutrientes
            </h2>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              {showDetails ? "Ocultar porciones" : "Ver porciones de intercambio"}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Carbohidratos ({carbPct}%)
              </label>
              <input
                type="range"
                min={45}
                max={65}
                value={carbPct}
                onChange={(e) => { setCarbPct(Number(e.target.value)); setProteinPct(100 - Number(e.target.value) - fatPct); }}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Proteínas ({proteinPct}%)
              </label>
              <input
                type="range"
                min={10}
                max={35}
                value={proteinPct}
                onChange={(e) => { setProteinPct(Number(e.target.value)); setCarbPct(100 - Number(e.target.value) - fatPct); }}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Grasas ({fatPct}%)
              </label>
              <input
                type="range"
                min={20}
                max={35}
                value={fatPct}
                onChange={(e) => { setFatPct(Number(e.target.value)); setCarbPct(100 - proteinPct - Number(e.target.value)); }}
                className="w-full accent-rose-500"
              />
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Total</p>
              <p className="text-lg font-bold text-slate-900">{macros.calories} kcal</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Carbohidratos</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{macros.carbs} <span className="text-sm font-normal text-amber-500">g</span></p>
              <p className="text-xs text-amber-400 mt-1">{macros.carbs * 4} kcal</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Proteínas</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{macros.protein} <span className="text-sm font-normal text-blue-500">g</span></p>
              <p className="text-xs text-blue-400 mt-1">{macros.protein * 4} kcal</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-100">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Grasas</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{macros.fats} <span className="text-sm font-normal text-rose-500">g</span></p>
              <p className="text-xs text-rose-400 mt-1">{macros.fats * 9} kcal</p>
            </div>
          </div>

          {/* Exchange Portions */}
          {showDetails && portions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Porciones de intercambio sugeridas (diarias)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">Categoría</th>
                      <th className="text-center py-2 text-xs font-semibold text-slate-400 uppercase">Cantidad</th>
                      <th className="text-center py-2 text-xs font-semibold text-slate-400 uppercase">CHO</th>
                      <th className="text-center py-2 text-xs font-semibold text-slate-400 uppercase">Prot</th>
                      <th className="text-center py-2 text-xs font-semibold text-slate-400 uppercase">Grasas</th>
                      <th className="text-center py-2 text-xs font-semibold text-slate-400 uppercase">kcal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {portions.map((p) => (
                      <tr key={p.category}>
                        <td className="py-2 font-medium text-slate-700">{p.category}</td>
                        <td className="text-center font-bold text-slate-900">{p.portions} <span className="text-xs text-slate-400">{p.amount}</span></td>
                        <td className="text-center text-amber-600">{p.cho}g</td>
                        <td className="text-center text-blue-600">{p.protein}g</td>
                        <td className="text-center text-rose-600">{p.fat}g</td>
                        <td className="text-center text-slate-600">{p.kcal}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-2 text-slate-700">Totales</td>
                      <td className="text-center text-slate-900">{portions.reduce((s, p) => s + p.portions, 0)} porciones</td>
                      <td className="text-center text-amber-700">{portions.reduce((s, p) => s + p.cho, 0)}g</td>
                      <td className="text-center text-blue-700">{portions.reduce((s, p) => s + p.protein, 0)}g</td>
                      <td className="text-center text-rose-700">{portions.reduce((s, p) => s + p.fat, 0)}g</td>
                      <td className="text-center text-slate-700">{portions.reduce((s, p) => s + p.kcal, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
