import React from "react";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  badge?: string;
  badgeTone?: "success" | "warning" | "danger";
  note?: string;
  unit?: string;
}

function MetricCard({
  label,
  value,
  badge,
  badgeTone = "success",
  note,
  unit,
}: MetricCardProps) {
  return (
    <div className="bg-white/80 rounded-lg p-2 text-center">
      <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
      <p className="text-sm font-black text-slate-900">
        {value}
        {unit && <span className="text-[8px] text-slate-400 ml-0.5">{unit}</span>}
      </p>
      {badge && (
        <p
          className={cn(
            "text-[8px] font-bold",
            badgeTone === "success" && "text-emerald-600",
            badgeTone === "warning" && "text-amber-600",
            badgeTone === "danger" && "text-rose-600"
          )}
        >
          {badge}
        </p>
      )}
      {note && <p className="text-[8px] text-slate-400">{note}</p>}
    </div>
  );
}

interface CalculatedMetricsPanelProps {
  imc?: { value: number; classification: string; color: string };
  get?: { value: number };
  idealWeight?: { min: number; max: number; reference: string };
  pesoIdealNote?: string;
  className?: string;
}

export function CalculatedMetricsPanel({
  imc,
  get,
  idealWeight,
  pesoIdealNote,
  className,
}: CalculatedMetricsPanelProps) {
  if (!imc && !get && !idealWeight) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 border-dashed text-center">
        <p className="text-xs text-slate-400 font-medium">
          Ingresa peso, altura, fecha de nacimiento y sexo para ver los cálculos automáticos.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-indigo-50/50 rounded-lg p-4 border border-indigo-100", className)}>
      <p className="text-xs text-indigo-700 font-medium mb-2 flex items-center gap-1">
        <Calculator className="w-3.5 h-3.5" />
        Calculado automáticamente
      </p>
      <div className="grid grid-cols-3 gap-3">
        {imc && (
          <MetricCard
            label="IMC"
            value={imc.value}
            badge={imc.classification}
            badgeTone={
              imc.classification.includes("Obesidad")
                ? "danger"
                : imc.classification === "Normopeso"
                  ? "success"
                  : "warning"
            }
          />
        )}
        {get && (
          <MetricCard
            label="GET"
            value={get.value}
            unit="kcal/día"
          />
        )}
        {idealWeight && idealWeight.min > 0 ? (
          <MetricCard
            label="Normopeso"
            value={`${idealWeight.min}–${idealWeight.max}`}
            note={`kg · ${idealWeight.reference}`}
          />
        ) : pesoIdealNote ? (
          <div className="bg-white/80 rounded-lg p-2 text-center">
            <p className="text-[9px] font-black uppercase text-slate-400">Normopeso</p>
            <p className="text-[8px] text-slate-500">{pesoIdealNote}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
