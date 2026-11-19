"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

interface NatyLoadingOverlayProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
  isDemo?: boolean;
}

const DEFAULT_CLINICAL_STEPS = [
  "1. Analizando perfil clínico, GET y requerimientos...",
  "2. Filtrando restricciones médicas, alergias y gustos...",
  "3. Equilibrando porciones del Sistema de Intercambio chileno...",
  "4. Auditando seguridad de combinaciones y macronutrientes...",
];

export function NatyLoadingOverlay({
  title = "Naty está preparando...",
  subtitle = "Agente Clínico NutriNet razonando la pauta personalizada",
  steps = DEFAULT_CLINICAL_STEPS,
  isDemo = false,
}: NatyLoadingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1600);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="mx-4 flex max-w-md w-full flex-col items-center rounded-3xl bg-white p-7 text-center shadow-2xl border border-slate-100">
        <div className="relative">
          <Image
            src="/cooking.png"
            alt="Naty cocinera"
            width={104}
            height={104}
            className="h-26 w-26 object-contain"
          />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#86A83C] text-white shadow-sm ring-2 ring-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        </div>

        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.25em] text-[#668E20]">
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
        )}

        {isDemo && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 animate-in fade-in">
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Modo Demostración — Simulación de Copiloto IA Clínico</span>
          </div>
        )}

        {/* Pasos agénticos visibles */}
        <div className="mt-4 w-full rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-100 space-y-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                  isCurrent
                    ? "font-bold text-[#668E20]"
                    : isCompleted
                    ? "text-slate-400 line-through opacity-70"
                    : "text-slate-400 opacity-40"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#86A83C] shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#86A83C] shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-[#F0F5DF] px-4 py-1.5 text-xs font-bold text-[#668E20] border border-[#DDE7B8]">
          <ShieldCheck className="h-4 w-4" />
          <span>Garantía de Seguridad Clínica Naty</span>
        </div>
      </div>
    </div>
  );
}
