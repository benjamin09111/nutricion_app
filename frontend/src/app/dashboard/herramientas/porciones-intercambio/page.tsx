"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Calculator,
  CheckCircle2,
  Info,
  Scale,
} from "lucide-react";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  buildExchangeGuideForAi,
  calculateFoodExchange,
  EXCHANGE_PORTION_PROFILES,
  getExchangeCoverageRows,
  type ExchangePortionProfile,
} from "@/lib/exchange-portions";

const DEFAULT_PROFILE_ID = "cereales_tuberculos";

const HOW_TO_USE = [
  "Paciente: definimos objetivos, restricciones y nivel de actividad.",
  "GET y macros: estimamos calorias, proteinas, carbohidratos y grasas del dia.",
  "Porciones de intercambio: traducimos esas metas a bloques clinicos comparables.",
  "Recetas y porciones: elegimos platos y porcion casera coherente con esos bloques.",
  "Carrito: convertimos porciones a gramos y luego a compra semanal/mensual.",
  "Entregable: mostramos una version resumida y entendible para el paciente.",
];

const FLOW_LABELS = [
  "Paciente",
  "GET / Macros",
  "Intercambios",
  "Recetas",
  "Carrito",
  "Entregable",
];

export default function ExchangePortionsPage() {
  const [selectedProfileId, setSelectedProfileId] = useState(DEFAULT_PROFILE_ID);
  const [grams, setGrams] = useState("100");
  const [carbsPer100g, setCarbsPer100g] = useState("28");
  const [proteinPer100g, setProteinPer100g] = useState("2.7");
  const [fatPer100g, setFatPer100g] = useState("0.3");

  const selectedProfile =
    EXCHANGE_PORTION_PROFILES.find((profile) => profile.id === selectedProfileId) ||
    EXCHANGE_PORTION_PROFILES[0];

  const calculatorResult = useMemo(
    () =>
      calculateFoodExchange({
        grams: Number(grams) || 0,
        macrosPer100g: {
          carbs: Number(carbsPer100g) || 0,
          protein: Number(proteinPer100g) || 0,
          fat: Number(fatPer100g) || 0,
        },
        profile: selectedProfile,
      }),
    [carbsPer100g, fatPer100g, grams, proteinPer100g, selectedProfile],
  );

  const coverageRows = useMemo(() => getExchangeCoverageRows(), []);
  const aiGuidePreview = useMemo(() => buildExchangeGuideForAi().slice(0, 4), []);

  return (
    <ModuleLayout
      title="Porciones de Intercambio"
      description="Aquí puedes conocer e informarte de cómo esta plataforma calcula y opera distintos valores. Si ves algún error, por favor, envía feedback en la sección de ajustes en tu barra de navegacíon lateral izquierda."
      step={{ number: 4, label: "Herramientas", icon: BookOpen, color: "text-emerald-600" }}
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Como usamos los intercambios en NutriNet</h2>
                <p className="text-sm font-medium text-slate-500">
                  La idea es que la misma porcion valga lo mismo en calculos, recetas, carrito y PDF.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {HOW_TO_USE.map((item, index) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    Paso {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {FLOW_LABELS.map((label, index) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 shadow-sm">
                      {label}
                    </span>
                    {index < FLOW_LABELS.length - 1 ? (
                      <span className="text-sm font-black text-emerald-300">→</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Mini calculadora clinica</h2>
                <p className="text-sm font-medium text-slate-500">
                  Sirve para validar rapido cuantos intercambios representa un alimento real.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Perfil de intercambio
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(event) => setSelectedProfileId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  {EXCHANGE_PORTION_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Gramaje
                  </label>
                  <Input value={grams} onChange={(event) => setGrams(event.target.value)} type="number" className="h-11 rounded-2xl" />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Porcion casera</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{selectedProfile.householdPortion}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Input value={carbsPer100g} onChange={(event) => setCarbsPer100g(event.target.value)} type="number" className="h-11 rounded-2xl" placeholder="CHO / 100g" />
                <Input value={proteinPer100g} onChange={(event) => setProteinPer100g(event.target.value)} type="number" className="h-11 rounded-2xl" placeholder="Prot / 100g" />
                <Input value={fatPer100g} onChange={(event) => setFatPer100g(event.target.value)} type="number" className="h-11 rounded-2xl" placeholder="Grasas / 100g" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Intercambios calculados</p>
                  <p className="mt-1 text-3xl font-black text-emerald-800">{calculatorResult.displayPortions}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">{calculatorResult.basisLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Lectura clinica</p>
                  <p className="mt-1 text-sm font-black text-slate-800">{calculatorResult.profile.label}</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{calculatorResult.note}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Resultado para paciente</p>
                <p className="mt-1 text-sm font-semibold text-blue-900">
                  {grams || "0"} g de este alimento equivalen a {calculatorResult.displayPortions} intercambio(s) del perfil{" "}
                  <strong>{calculatorResult.profile.label}</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Tabla clinica V1</h2>
              <p className="text-sm font-medium text-slate-500">
                Fuente unica de verdad para intercambios y porciones caseras.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["Perfil", "Porcion casera", "CHO", "Prot", "Grasas", "kcal", "Cobertura", "Nota"].map((header) => (
                    <th key={header} className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {coverageRows.map((row) => {
                  const profile = EXCHANGE_PORTION_PROFILES.find((item) => item.id === row.profileId) as ExchangePortionProfile;
                  return (
                    <tr key={row.profileId} className="align-top">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{row.label}</p>
                        <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.18em]", row.isClinicalExchange ? "text-emerald-600" : "text-amber-600")}>
                          {row.isClinicalExchange ? "Intercambio clinico" : "Referencia / revision"}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{row.householdPortion}</td>
                      <td className="px-3 py-3 font-bold text-amber-700">{profile.cho} g</td>
                      <td className="px-3 py-3 font-bold text-blue-700">{profile.protein} g</td>
                      <td className="px-3 py-3 font-bold text-rose-700">{profile.fat} g</td>
                      <td className="px-3 py-3 font-bold text-slate-700">{profile.kcal}</td>
                      <td className="px-3 py-3 text-xs font-medium leading-relaxed text-slate-500">{row.categoriesCovered}</td>
                      <td className="px-3 py-3 text-xs font-medium leading-relaxed text-slate-500">{row.clinicalNote}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Cobertura real de categorias</h2>
                <p className="text-sm font-medium text-slate-500">
                  Las categorias de ingredientes ya no quedan sueltas; se agrupan por perfil clinico.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {coverageRows.map((row) => (
                <div key={row.profileId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-sm font-black text-slate-900">{row.label}</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{row.categoriesCovered}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Guia que recibe la IA</h2>
                <p className="text-sm font-medium text-slate-500">
                  La misma referencia compartida ahora puede viajar a Recetas y Porciones.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {aiGuidePreview.map((item) => (
                <div key={item} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                  <p className="text-xs font-semibold leading-relaxed text-indigo-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ModuleLayout>
  );
}
