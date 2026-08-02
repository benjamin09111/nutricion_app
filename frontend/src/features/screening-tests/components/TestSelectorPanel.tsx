"use client";

import { Lock, FileText, Stethoscope, ClipboardCheck, Baby, Heart } from "lucide-react";
import { ALL_SCREENING_TESTS } from "../definitions";
import type { ScreeningTestType } from "../types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Stethoscope,
  ClipboardCheck,
  Baby,
  Heart,
};

interface TestSelectorPanelProps {
  onSelect: (type: ScreeningTestType) => void;
  locked?: boolean;
  suggestedTest?: string | null;
}

export function TestSelectorPanel({ onSelect, locked, suggestedTest }: TestSelectorPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
        Tests de Tamizaje Nutricional
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_SCREENING_TESTS.map((test) => {
          const Icon = ICON_MAP[test.icon] || FileText;
          const isSuggested = suggestedTest === test.type;

          return (
            <button
              key={test.type}
              type="button"
              onClick={() => {
                if (locked) {
                  window.dispatchEvent(
                    new CustomEvent("show-freemium-upgrade", {
                      detail: { feature: "Tests de tamizaje nutricional" },
                    }),
                  );
                  return;
                }
                onSelect(test.type);
              }}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 group",
                locked
                  ? "bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed"
                  : isSuggested
                    ? "bg-indigo-50/80 border-indigo-200 hover:border-indigo-400 hover:shadow-md cursor-pointer"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-xl shrink-0 transition-colors",
                  locked
                    ? "bg-slate-100 text-slate-400"
                    : isSuggested
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600",
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-800 truncate">
                    {test.shortName}
                  </span>
                  {isSuggested && (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shrink-0">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                  {test.description}
                </p>
                <span className="inline-block mt-1 text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {test.targetAge}
                </span>
              </div>

              {locked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
