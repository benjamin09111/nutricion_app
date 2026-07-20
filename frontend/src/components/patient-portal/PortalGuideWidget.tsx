"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen, CheckCircle2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const GUIDE_STEPS = [
  {
    title: "Comparte cómo vas",
    description:
      "En Diario puedes escribir qué comiste, cómo te sentiste y cualquier cambio importante de tu día.",
  },
  {
    title: "Haz tus preguntas",
    description:
      "En Consultas puedes dejar dudas sobre tu plan, tus comidas o lo que necesites revisar con tu nutricionista.",
  },
  {
    title: "Revisa tus entregables",
    description:
      "En Planes verás tus dietas, recetas y documentos para descargarlos cuando los necesites.",
  },
  {
    title: "Mira avisos y citas",
    description:
      "Notificaciones y Citas te muestran recordatorios, mensajes importantes y tus próximos controles.",
  },
];

export function PortalGuideWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div
          className={cn(
            "pointer-events-auto fixed inset-3 top-16 flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] sm:absolute sm:inset-auto sm:bottom-20 sm:right-0 sm:w-[min(24rem,calc(100vw-1.5rem))] sm:max-h-[min(38rem,calc(100vh-7rem))]",
          )}
        >
          <div className="bg-gradient-to-br from-indigo-600 via-emerald-600 to-emerald-500 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-white/10">
                  <Image src="/nutria.webp" alt="Nutria guía" fill sizes="48px" className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-wide">Nutria guía</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                    Guía para pacientes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Cerrar guía"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#fbfcfa] px-5 py-5">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]">Qué es este portal</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Este es tu espacio de seguimiento con tu nutricionista. Aquí puedes registrar tu progreso,
                  ver tus materiales y mantenerte al día con lo que necesitas hacer.
                </p>
              </div>

              <div className="space-y-3">
                {GUIDE_STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-[1.4rem] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        {index === 0 ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-black text-slate-900">Recomendación rápida</p>
                <p className="mt-2">
                  Empieza por <span className="font-semibold text-indigo-700">Diario</span>, revisa los mensajes de
                  tu nutricionista y vuelve aquí cuando necesites recordar qué hacer.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="pointer-events-auto inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-emerald-600 to-emerald-500 text-white shadow-[0_22px_40px_-20px_rgba(16,185,129,0.7)] transition-transform hover:scale-[1.04] active:scale-95"
          aria-label="Abrir guía"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white/10">
             <Image src="/nutria.webp" alt="Nutria guía" fill sizes="40px" className="object-cover" />
          </div>
          <span className="sr-only">Guía para pacientes</span>
        </button>
      ) : null}
    </div>
  );
}
