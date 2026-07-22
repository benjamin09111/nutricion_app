"use client";

import { Dumbbell, Info } from "lucide-react";
import { CalculationResult } from "../types";

interface ProteinPanelProps {
  proteinProfile: string;
  setProteinProfile: (v: string) => void;
  result: CalculationResult | null;
}

const PROTEIN_PROFILES = [
  { key: "adulto_sano", label: "Adulto sano, mantención", range: "0.8 - 1.0 g/kg" },
  { key: "adulto_mayor", label: "Adulto mayor (prevención sarcopenia)", range: "1.2 - 1.5 g/kg" },
  { key: "deportista", label: "Deportista / hipertrofia", range: "1.6 - 2.2 g/kg" },
  { key: "renal_sin_dialisis", label: "Enfermedad renal crónica sin diálisis", range: "0.6 - 0.8 g/kg" },
  { key: "renal_dialisis", label: "Enfermedad renal en diálisis", range: "1.0 - 1.2 g/kg" },
  { key: "oncologico", label: "Paciente oncológico / desnutrido", range: "1.2 - 1.5 g/kg" },
];

export function ProteinPanel({
  proteinProfile,
  setProteinProfile,
  result,
}: ProteinPanelProps) {
  const pr = result?.proteinRequirement;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Dumbbell className="w-4 h-4 text-blue-500" />
          Requerimiento Proteico por Perfil Clínico
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">
          Ajuste g/kg/día
        </span>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
          Perfil Clínico del Paciente
        </label>
        <select
          value={proteinProfile}
          onChange={(e) => setProteinProfile(e.target.value)}
          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          {PROTEIN_PROFILES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} ({p.range})
            </option>
          ))}
        </select>
      </div>

      {pr && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-center">
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
              Rango Sugerido en Gramos
            </p>
            <p className="text-2xl font-black text-blue-900 mt-1">
              {pr.minGrams} – {pr.maxGrams} <span className="text-xs font-normal">g/día</span>
            </p>
            <p className="text-[10px] text-blue-600 font-bold mt-1">
              ({pr.minPerKg} – {pr.maxPerKg} g/kg/día)
            </p>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 text-center">
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
              Aporte del GET Calculado
            </p>
            <p className="text-2xl font-black text-indigo-900 mt-1">
              {pr.minPercentGet}% – {pr.maxPercentGet}%
            </p>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">
              del Gasto Energético Total
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>
          {result?.inputs.useUsualWeightForRequirements ? (
            <strong className="text-indigo-600">
              * Calculado sobre el peso habitual ({result.inputs.usualWeight} kg) para revertir el catabolismo agudo grave.
            </strong>
          ) : result?.inputs.dryWeight ? (
            `Calculado según peso seco (${result.inputs.dryWeight} kg) ajustado por edema (${result.inputs.edemaPercent}%).`
          ) : (
            `Calculado según peso actual (${result?.inputs.weight || "--"} kg).`
          )} El nutricionista puede ajustar los valores finales según criterio individual.
        </span>
      </div>
    </div>
  );
}
