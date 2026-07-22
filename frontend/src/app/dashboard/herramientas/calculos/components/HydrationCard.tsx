"use client";

import { Droplets } from "lucide-react";
import { CalculationResult } from "../types";

interface HydrationCardProps {
  result: CalculationResult | null;
}

export function HydrationCard({ result }: HydrationCardProps) {
  const hyd = result?.hydration;
  if (!hyd) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Droplets className="w-4 h-4 text-sky-500" />
          Requerimiento Hídrico Basal
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">
          {hyd.method}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div className="bg-sky-50/50 rounded-xl p-3.5 border border-sky-100 text-center sm:text-left">
          <p className="text-[10px] font-black uppercase text-sky-600 tracking-wider">
            Volumen Estimado (mL/día)
          </p>
          <p className="text-2xl font-black text-sky-900 mt-1">
            {hyd.minMl === hyd.maxMl ? (
              `${hyd.minMl} mL`
            ) : (
              `${hyd.minMl} – ${hyd.maxMl} mL`
            )}
          </p>
        </div>

        <div className="bg-sky-50/50 rounded-xl p-3.5 border border-sky-100 text-center sm:text-left">
          <p className="text-[10px] font-black uppercase text-sky-600 tracking-wider">
            Equivalente en Litros
          </p>
          <p className="text-2xl font-black text-sky-900 mt-1">
            {hyd.minL === hyd.maxL ? (
              `${hyd.minL} L/día`
            ) : (
              `${hyd.minL} – ${hyd.maxL} L/día`
            )}
          </p>
        </div>
      </div>

      {hyd.note && (
        <p className="text-[10px] text-slate-400 leading-relaxed italic">
          * {hyd.note}
        </p>
      )}
    </div>
  );
}
