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
import { Select } from "@/components/ui/Select";
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
      description={
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
            <Scale className="w-4 h-4 text-[#86A83C]" />
            <span className="tracking-wider uppercase text-[10px] font-bold">Sistema de Porciones Clínicas</span>
          </div>
          <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
            Conoce cómo NutriNet calcula y opera distintos valores clínicos, macronutrientes y bloques de intercambio nutricional unificados.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#F0F5DF] p-3 text-[#668E20] shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#20212B] leading-snug">Cómo usamos los intercambios en NutriNet</h2>
                <p className="text-xs sm:text-sm font-medium text-[#626573] mt-0.5">
                  La idea es que la misma porción valga lo mismo en cálculos, recetas, carrito y PDF.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 grid-cols-1 md:grid-cols-2">
              {HOW_TO_USE.map((item, index) => (
                <div key={item} className="rounded-xl border border-[#E9E5E7] bg-[#F8F9FB] p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#668E20]">
                    Paso {index + 1}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-[#20212B]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF]/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {FLOW_LABELS.map((label, index) => (
                  <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="rounded-full bg-white px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#668E20] shadow-2xs border border-[#DDE7B8]">
                      {label}
                    </span>
                    {index < FLOW_LABELS.length - 1 ? (
                      <span className="text-xs sm:text-sm font-bold text-[#86A83C]">→</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-3 text-[#7842D4] shrink-0">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#20212B] leading-snug">Mini calculadora clínica</h2>
                <p className="text-xs sm:text-sm font-medium text-[#626573] mt-0.5">
                  Sirve para validar rápido cuántos intercambios representa un alimento real.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#848792]">
                  Perfil de intercambio
                </label>
                <Select
                  value={selectedProfileId}
                  onChange={(val) => setSelectedProfileId(val)}
                  options={EXCHANGE_PORTION_PROFILES.map((p) => ({
                    value: p.id,
                    label: p.label,
                  }))}
                  triggerClassName="h-11 rounded-xl border-[#E9E5E7] bg-white text-xs sm:text-sm font-medium text-[#20212B] shadow-2xs"
                />
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#848792]">
                    Gramaje
                  </label>
                  <Input value={grams} onChange={(event) => setGrams(event.target.value)} type="number" className="h-11 rounded-xl text-xs sm:text-sm font-medium border-[#E9E5E7] shadow-2xs" />
                </div>
                <div className="rounded-xl border border-[#E9E5E7] bg-[#F8F9FB] px-3.5 py-2 flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#848792]">Porción casera</p>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[#20212B]">{selectedProfile.householdPortion}</p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#848792] sm:hidden">CHO / 100g</label>
                  <Input value={carbsPer100g} onChange={(event) => setCarbsPer100g(event.target.value)} type="number" className="h-11 rounded-xl text-xs sm:text-sm font-medium border-[#E9E5E7] shadow-2xs" placeholder="CHO / 100g" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#848792] sm:hidden">Prot / 100g</label>
                  <Input value={proteinPer100g} onChange={(event) => setProteinPer100g(event.target.value)} type="number" className="h-11 rounded-xl text-xs sm:text-sm font-medium border-[#E9E5E7] shadow-2xs" placeholder="Prot / 100g" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#848792] sm:hidden">Grasas / 100g</label>
                  <Input value={fatPer100g} onChange={(event) => setFatPer100g(event.target.value)} type="number" className="h-11 rounded-xl text-xs sm:text-sm font-medium border-[#E9E5E7] shadow-2xs" placeholder="Grasas / 100g" />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#668E20]">Intercambios calculados</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#668E20]">{calculatorResult.displayPortions}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#668E20]">{calculatorResult.basisLabel}</p>
                </div>
                <div className="rounded-xl border border-[#E9E5E7] bg-[#F8F9FB] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#848792]">Lectura clínica</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-[#20212B]">{calculatorResult.profile.label}</p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#626573]">{calculatorResult.note}</p>
                </div>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7842D4]">Resultado para paciente</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-[#20212B] leading-relaxed">
                  {grams || "0"} g de este alimento equivalen a <strong className="text-[#7842D4]">{calculatorResult.displayPortions}</strong> intercambio(s) del perfil{" "}
                  <strong>{calculatorResult.profile.label}</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl bg-[#F0F5DF] p-3 text-[#668E20] shrink-0">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#20212B]">Tabla clínica de intercambios</h2>
              <p className="text-xs sm:text-sm font-medium text-[#626573]">
                Fuente única de verdad para intercambios y porciones caseras.
              </p>
            </div>
          </div>

          {/* Tarjetas Móviles (Pantallas pequeñas < 768px) */}
          <div className="block md:hidden space-y-3">
            {coverageRows.map((row) => {
              const profile = EXCHANGE_PORTION_PROFILES.find((item) => item.id === row.profileId) as ExchangePortionProfile;
              return (
                <div key={row.profileId} className="rounded-2xl border border-[#E9E5E7] bg-[#F8F9FB]/60 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#20212B] text-sm">{row.label}</p>
                      <span className={cn("inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", row.isClinicalExchange ? "bg-[#F0F5DF] text-[#668E20] border-[#DDE7B8]" : "bg-amber-50 text-amber-700 border-amber-200")}>
                        {row.isClinicalExchange ? "Intercambio clínico" : "Referencia / revisión"}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#20212B] bg-white px-2.5 py-1 rounded-xl border border-[#E9E5E7] shadow-2xs">
                      {profile.kcal} kcal
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center bg-white p-2.5 rounded-xl border border-[#E9E5E7]">
                    <div>
                      <span className="text-[9px] font-bold text-[#848792] block uppercase">Porción</span>
                      <span className="text-xs font-bold text-[#20212B] truncate block">{row.householdPortion}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 block uppercase">CHO</span>
                      <span className="text-xs font-bold text-emerald-700">{profile.cho}g</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 block uppercase">Prot</span>
                      <span className="text-xs font-bold text-blue-700">{profile.protein}g</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-rose-600 block uppercase">Grasas</span>
                      <span className="text-xs font-bold text-rose-700">{profile.fat}g</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-[#626573]">
                    <p><strong className="text-[#20212B]">Cobertura:</strong> {row.categoriesCovered}</p>
                    <p><strong className="text-[#20212B]">Nota:</strong> {row.clinicalNote}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla Desktop (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E9E5E7] shadow-2xs">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#F8F9FB] border-b border-[#E8EBF0]">
                <tr>
                  {["Perfil", "Porción casera", "CHO", "Prot", "Grasas", "kcal", "Cobertura", "Nota"].map((header) => (
                    <th key={header} className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECEE] bg-white">
                {coverageRows.map((row) => {
                  const profile = EXCHANGE_PORTION_PROFILES.find((item) => item.id === row.profileId) as ExchangePortionProfile;
                  return (
                    <tr key={row.profileId} className="align-top hover:bg-[#F8F9FB] transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#20212B]">{row.label}</p>
                        <p className={cn("mt-1 text-[10px] font-bold uppercase tracking-wider", row.isClinicalExchange ? "text-[#668E20]" : "text-amber-600")}>
                          {row.isClinicalExchange ? "Intercambio clínico" : "Referencia / revisión"}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-medium text-[#20212B]">{row.householdPortion}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-700">{profile.cho} g</td>
                      <td className="px-3 py-3 font-semibold text-blue-700">{profile.protein} g</td>
                      <td className="px-3 py-3 font-semibold text-rose-700">{profile.fat} g</td>
                      <td className="px-3 py-3 font-bold text-[#20212B]">{profile.kcal}</td>
                      <td className="px-3 py-3 text-xs font-medium leading-relaxed text-[#626573]">{row.categoriesCovered}</td>
                      <td className="px-3 py-3 text-xs font-medium leading-relaxed text-[#626573]">{row.clinicalNote}</td>
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
