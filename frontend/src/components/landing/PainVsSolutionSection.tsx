"use client";

import { Clock, FileText, TrendingDown, Moon, Zap, Smartphone, TrendingUp, Smile, XCircle, CheckCircle2 } from "lucide-react";

export function PainVsSolutionSection() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50/70 border-y border-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Section Header con estándar NutriNet */}
        <div className="text-center space-y-3 mb-14">
          <span
            className="block text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl"
            style={{
              WebkitTextStroke: "3px #a6c261",
              color: "transparent",
              fontWeight: 900,
            }}
          >
            EL CAMBIO
          </span>
          <span className="block text-xl font-bold text-[#a88aed] sm:text-2xl lg:text-4xl">
            El método tradicional vs. Tu nueva consulta
          </span>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto pt-2">
            Comparamos la sobrecarga manual de la consulta tradicional con la eficiencia de NutriNet.
          </p>
        </div>

        {/* 2 Tarjetas Minimalistas Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Bloque Izquierdo: Tradicional */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Método Tradicional</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">Excel, Word y Canva</h3>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">45 minutos calculando TMB y macros a mano</strong>
                    <span className="text-xs text-slate-500">Ajustar gramos, calorías y macronutrientes celda por celda es agotador e ineficiente.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">PDFs estáticos que el paciente olvida o pierde</strong>
                    <span className="text-xs text-slate-500">Documentos que quedan sepultados en chats sin interacción ni lista de compras.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">86% de deserción de pacientes antes del año (DIPRES)</strong>
                    <span className="text-xs text-slate-500">Sin seguimiento diario, la mayoría de los pacientes abandona tras las primeras consultas.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">El "Síndrome de las 22:00 hrs"</strong>
                    <span className="text-xs text-slate-500">Terminar el día laboral redactando minutas en vez de descansar con tu familia.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Sobrecarga administrativa nocturna y límite en tu volumen de pacientes.
            </div>
          </div>

          {/* Bloque Derecho: Con NutriNet */}
          <div className="rounded-3xl border-2 border-[#a88aed]/40 bg-white p-7 sm:p-9 shadow-lg shadow-[#a88aed]/5 flex flex-col justify-between relative">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a88aed]">Con NutriNet SaaS</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">Copiloto Clínico Automatizado</h3>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-[#a88aed]/10 flex items-center justify-center text-[#a88aed]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">5 minutos por pauta con cálculo biomatemático</strong>
                    <span className="text-xs text-slate-500">Fórmulas clínicas automáticas (Mifflin, Harris, FAO/OMS) y porciones chilenas exactas.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">Portal Interactivo PWA para el paciente</strong>
                    <span className="text-xs text-slate-500">Lista de compras automática en 1 clic organizada por pasillos de supermercado.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">Alertas tempranas de adherencia</strong>
                    <span className="text-xs text-slate-500">Seguimiento de agua, ánimo y adherencia diaria para prevenir deserciones a tiempo.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="mt-1 p-1 rounded-lg bg-[#a88aed]/15 text-[#a88aed] shrink-0">
                    <Smile className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">Recupera tu tiempo libre</strong>
                    <span className="text-xs text-slate-500">Entrega la pauta al cerrar la consulta y escala el volumen de tu consulta profesional.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-[#8f70d8] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Mayor adherencia de tus pacientes y 3+ horas de descanso recuperadas al día.</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
