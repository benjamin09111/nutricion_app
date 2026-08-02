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
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">Cómo usamos los intercambios en NutriNet</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                  La idea es que la misma porción valga lo mismo en cálculos, recetas, carrito y PDF.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 grid-cols-1 md:grid-cols-2">
              {HOW_TO_USE.map((item, index) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    Paso {index + 1}
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm font-semibold leading-relaxed text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {FLOW_LABELS.map((label, index) => (
                  <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="rounded-full bg-white px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-700 shadow-xs">
                      {label}
                    </span>
                    {index < FLOW_LABELS.length - 1 ? (
                      <span className="text-xs sm:text-sm font-black text-emerald-400">→</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 shrink-0">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">Mini calculadora clínica</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                  Sirve para validar rápido cuántos intercambios representa un alimento real.
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
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {EXCHANGE_PORTION_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Gramaje
                  </label>
                  <Input value={grams} onChange={(event) => setGrams(event.target.value)} type="number" className="h-11 rounded-2xl text-xs font-semibold" />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Porción casera</p>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-700">{selectedProfile.householdPortion}</p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">CHO / 100g</label>
                  <Input value={carbsPer100g} onChange={(event) => setCarbsPer100g(event.target.value)} type="number" className="h-11 rounded-2xl text-xs font-semibold" placeholder="CHO / 100g" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">Prot / 100g</label>
                  <Input value={proteinPer100g} onChange={(event) => setProteinPer100g(event.target.value)} type="number" className="h-11 rounded-2xl text-xs font-semibold" placeholder="Prot / 100g" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">Grasas / 100g</label>
                  <Input value={fatPer100g} onChange={(event) => setFatPer100g(event.target.value)} type="number" className="h-11 rounded-2xl text-xs font-semibold" placeholder="Grasas / 100g" />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Intercambios calculados</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-800">{calculatorResult.displayPortions}</p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">{calculatorResult.basisLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Lectura clínica</p>
                  <p className="mt-1 text-xs sm:text-sm font-black text-slate-800">{calculatorResult.profile.label}</p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500">{calculatorResult.note}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Resultado para paciente</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-blue-900 leading-relaxed">
                  {grams || "0"} g de este alimento equivalen a <strong>{calculatorResult.displayPortions}</strong> intercambio(s) del perfil{" "}
                  <strong>{calculatorResult.profile.label}</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 shrink-0">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Tabla clínica V1</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Fuente única de verdad para intercambios y porciones caseras.
              </p>
            </div>
          </div>

          {/* Tarjetas Móviles (Pantallas pequeñas < 768px) */}
          <div className="block md:hidden space-y-3">
            {coverageRows.map((row) => {
              const profile = EXCHANGE_PORTION_PROFILES.find((item) => item.id === row.profileId) as ExchangePortionProfile;
              return (
                <div key={row.profileId} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{row.label}</p>
                      <span className={cn("inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", row.isClinicalExchange ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                        {row.isClinicalExchange ? "Intercambio clínico" : "Referencia / revisión"}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
                      {profile.kcal} kcal
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center bg-white p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Porción</span>
                      <span className="text-xs font-bold text-slate-700 truncate block">{row.householdPortion}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-amber-600 block uppercase">CHO</span>
                      <span className="text-xs font-black text-amber-700">{profile.cho}g</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 block uppercase">Prot</span>
                      <span className="text-xs font-black text-blue-700">{profile.protein}g</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-rose-600 block uppercase">Grasas</span>
                      <span className="text-xs font-black text-rose-700">{profile.fat}g</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <p><strong className="text-slate-800">Cobertura:</strong> {row.categoriesCovered}</p>
                    <p><strong className="text-slate-800">Nota:</strong> {row.clinicalNote}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla Desktop (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["Perfil", "Porción casera", "CHO", "Prot", "Grasas", "kcal", "Cobertura", "Nota"].map((header) => (
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
                          {row.isClinicalExchange ? "Intercambio clínico" : "Referencia / revisión"}
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

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Cobertura real de categorías</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  Las categorías de ingredientes ya no quedan sueltas; se agrupan por perfil clínico.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 grid-cols-1 md:grid-cols-2">
              {coverageRows.map((row) => (
                <div key={row.profileId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs sm:text-sm font-black text-slate-900">{row.label}</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{row.categoriesCovered}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 shrink-0">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Guía que recibe la IA</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500">
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
