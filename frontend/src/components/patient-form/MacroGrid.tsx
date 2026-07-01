import React from "react";
import { cn } from "@/lib/utils";

interface MacroItem {
  label: string;
  value: number | string;
  unit: string;
  color: string;
}

interface MacroGridProps {
  macros: MacroItem[];
  className?: string;
}

export function MacroGrid({ macros, className }: MacroGridProps) {
  if (!macros || macros.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Los objetivos diarios aparecerán automáticamente cuando haya datos antropométricos.
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2", className)}>
      {macros.map((macro, index) => (
        <div
          key={index}
          className={cn("rounded-xl p-3 text-center", macro.color)}
        >
          <p className="text-[9px] font-black uppercase tracking-wider opacity-70">
            {macro.label}
          </p>
          <p className="text-lg font-black">{macro.value}</p>
          <p className="text-[8px] opacity-60">{macro.unit}</p>
        </div>
      ))}
    </div>
  );
}
