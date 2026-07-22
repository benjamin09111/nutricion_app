"use client";

import { Scale, AlertTriangle, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { CalculationResult } from "../types";

interface WeightLossPanelProps {
  usualWeight: string;
  setUsualWeight: (v: string) => void;
  weightLossPeriodWeeks: string;
  setWeightLossPeriodWeeks: (v: string) => void;
  result: CalculationResult | null;
}

export function WeightLossPanel({
  usualWeight,
  setUsualWeight,
  weightLossPeriodWeeks,
  setWeightLossPeriodWeeks,
  result,
}: WeightLossPanelProps) {
  const wl = result?.weightLoss;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <TrendingDown className="w-4 h-4 text-rose-500" />
          Pérdida de Peso Involuntaria (Criterio Blackburn)
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">
          Screening de Desnutrición
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
            Peso Habitual (kg)
          </label>
          <Input
            value={usualWeight}
            onChange={(e) => setUsualWeight(e.target.value)}
            placeholder="Ej: 75"
            type="number"
            min="0"
            step="0.1"
            className="h-9 rounded-xl text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
            Tiempo Transcurrido
          </label>
          <select
            value={weightLossPeriodWeeks}
            onChange={(e) => setWeightLossPeriodWeeks(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="1">1 semana</option>
            <option value="4">1 mes (4 semanas)</option>
            <option value="12">3 meses (12 semanas)</option>
            <option value="24">6 meses (24 semanas)</option>
          </select>
        </div>
      </div>

      {wl && (
        <div
          className={cn(
            "rounded-xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3",
            wl.severity === "grave"
              ? "bg-rose-50 border-rose-200"
              : wl.severity === "significativa"
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          )}
        >
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white",
                  wl.severity === "grave"
                    ? "bg-rose-600"
                    : wl.severity === "significativa"
                    ? "bg-amber-600"
                    : "bg-emerald-600"
                )}
              >
                Pérdida {wl.severity}
              </span>
              <span className="text-xs font-bold text-slate-700">
                ({wl.periodLabel})
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Pérdida de <strong className="text-slate-900">{wl.lossKg} kg</strong> (
              <strong className="text-slate-900">{wl.percentLoss}%</strong> del peso habitual)
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="text-2xl font-black text-slate-900">{wl.percentLoss}%</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Pérdida Ponderal</p>
          </div>
        </div>
      )}

      {/* Referencia tabla Blackburn */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-[11px] text-slate-600 space-y-1">
        <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">
          Tabla de Referencia Criterio Blackburn:
        </p>
        <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
          <div>
            <strong className="text-slate-700">1 semana:</strong> 1-2% sign. | &gt;2% grave
          </div>
          <div>
            <strong className="text-slate-700">1 mes:</strong> 5% sign. | &gt;5% grave
          </div>
          <div>
            <strong className="text-slate-700">3 meses:</strong> 7.5% sign. | &gt;7.5% grave
          </div>
        </div>
      </div>
    </div>
  );
}
