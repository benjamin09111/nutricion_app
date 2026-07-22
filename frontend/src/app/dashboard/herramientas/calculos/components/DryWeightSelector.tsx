"use client";

import { Droplet, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DryWeightSelectorProps {
  edemaPercent: string;
  setEdemaPercent: (v: string) => void;
  weight: string;
}

export function DryWeightSelector({
  edemaPercent,
  setEdemaPercent,
  weight,
}: DryWeightSelectorProps) {
  const currentWeightNum = parseFloat(weight) || 0;
  const edemaPctNum = parseFloat(edemaPercent) || 0;
  const dryWeight =
    currentWeightNum > 0 && edemaPctNum > 0
      ? (currentWeightNum * (1 - edemaPctNum / 100)).toFixed(1)
      : null;

  return (
    <div className="space-y-3 pt-2">
      <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase flex items-center justify-between">
          <span>Corrección por Edema / Retención Hídrica</span>
          {edemaPctNum > 0 && (
            <span className="text-amber-600 font-black">-{edemaPctNum}%</span>
          )}
        </label>
        <select
          value={edemaPercent}
          onChange={(e) => setEdemaPercent(e.target.value)}
          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="0">Sin edema (0%)</option>
          <option value="5">Edema Leve (-5%)</option>
          <option value="10">Edema Moderado (-10%)</option>
          <option value="15">Edema Severo (-15%)</option>
          <option value="20">Anasarca (-20%)</option>
        </select>
      </div>

      {dryWeight && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Peso Seco Estimado: <strong className="font-black text-amber-950">{dryWeight} kg</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-700 uppercase">
            Usado en cálculos
          </span>
        </div>
      )}
    </div>
  );
}
