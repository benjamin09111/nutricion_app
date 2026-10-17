"use client";

import { Star, Quote, BookOpen, Users, TrendingUp } from "lucide-react";

export function ValidationSocialProofSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Header con estándar visual NutriNet */}
        <div className="text-center space-y-3 mb-14">
          <span
            className="block text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl"
            style={{
              WebkitTextStroke: "3px #a6c261",
              color: "transparent",
              fontWeight: 900,
            }}
          >
            VALIDACIÓN
          </span>
          <span className="block text-xl font-bold text-[#a88aed] sm:text-2xl lg:text-4xl">
            Respaldado por nutricionistas en Chile
          </span>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto pt-2">
            Métricas de tracción y pruebas tempranas con profesionales de la salud.
          </p>
        </div>

        {/* Traction Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-2 hover:border-[#a88aed]/40 transition-colors shadow-2xs">
            <div className="h-10 w-10 mx-auto rounded-2xl bg-[#a88aed]/10 text-[#8f70d8] flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight block">
              +300
            </span>
            <span className="text-sm font-bold text-slate-800 block">
              Alimentos Chilenos Validados
            </span>
            <p className="text-xs text-slate-500">
              Integrados directamente con la tabla oficial INTA 2018 de la Universidad de Chile.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-2 hover:border-[#a88aed]/40 transition-colors shadow-2xs">
            <div className="h-10 w-10 mx-auto rounded-2xl bg-[#a88aed]/10 text-[#8f70d8] flex items-center justify-center mb-3">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight block">
              3+
            </span>
            <span className="text-sm font-bold text-slate-800 block">
              Nutricionistas en Testeo Activo
            </span>
            <p className="text-xs text-slate-500">
              Validando casos clínicos reales en consulta privada y nutrición deportiva.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-2 hover:border-[#a88aed]/40 transition-colors shadow-2xs">
            <div className="h-10 w-10 mx-auto rounded-2xl bg-[#a88aed]/10 text-[#8f70d8] flex items-center justify-center mb-3">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight block">
              88%
            </span>
            <span className="text-sm font-bold text-slate-800 block">
              Reducción en Tiempo de Diseño
            </span>
            <p className="text-xs text-slate-500">
              De 45 minutos por pauta en Excel a menos de 5 minutos promedio con NutriNet.
            </p>
          </div>
        </div>

        {/* Featured Validation Quote Minimalista */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-8 sm:p-10 text-center relative max-w-4xl mx-auto shadow-2xs space-y-4">
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>

          <blockquote className="text-base sm:text-xl font-bold leading-relaxed text-slate-800 italic">
            "Como nutricionista, pasaba horas cuadrando porciones en Excel. NutriNet me devolvió mis noches y mis pacientes están felices con su portal interactivo."
          </blockquote>

          <div className="pt-2">
            <span className="font-extrabold text-slate-900 text-sm block">
              Nutricionista del Equipo Clínico de NutriNet
            </span>
            <span className="text-xs text-[#8f70d8] font-semibold">
              Validación y Rigor Metodológico
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
