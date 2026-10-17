"use client";

import { Sparkles, ShieldCheck, Zap, Check, ArrowRight, Clock, Quote } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeroSectionProps {
  onCtaClick: () => void;
  onExploreFeaturesClick: () => void;
}

export function HeroSection({ onCtaClick, onExploreFeaturesClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* Badge Oficial */}
          <div className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-semibold sm:px-5 sm:text-sm bg-[#a88aed]/10 text-[#a88aed] border-[#a88aed]/30 transition-all duration-300 hover:scale-105">
            <Sparkles className="h-4 w-4" />
            <span>Creado con la Tabla Oficial INTA 2018 de la Universidad de Chile</span>
          </div>

          {/* Títulos con el estándar visual original de NutriNet */}
          <div className="space-y-3">
            <h1
              className="text-3xl font-black leading-none tracking-tight sm:text-5xl lg:text-7xl xl:text-8xl min-h-[1.1em] flex items-center justify-center overflow-visible px-2 text-center"
              style={{
                WebkitTextStroke: "3px #a6c261",
                color: "transparent",
                fontWeight: 900,
              }}
            >
              DEJA EL EXCEL
            </h1>
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <span className="text-2xl font-bold tracking-tight text-[#a88aed] sm:text-3xl lg:text-5xl">
                Pautas clínicas perfectas en 5 minutos
              </span>
            </div>
          </div>

          {/* Subtítulo Clínico */}
          <p className="mx-auto max-w-3xl text-base text-slate-600 sm:text-lg lg:text-xl leading-relaxed">
            El copiloto con Inteligencia Artificial que automatiza tus cálculos metabólicos, genera listas de compras automáticas y evita que el 86% de tus pacientes abandone el tratamiento.
          </p>

          {/* Hook Testimonial de Colega Nutricionista */}
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:border-[#a88aed]/40 hover:shadow-xs text-left">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#a88aed]/10 text-[#a88aed] mt-0.5">
                <Quote className="h-4 w-4 sm:h-5 sm:w-5 fill-[#a88aed]/20" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <blockquote className="text-xs sm:text-sm lg:text-base font-medium italic text-slate-700 leading-relaxed">
                  &ldquo;NutriNet nos ayuda a ofrecer un servicio más completo y a defender nuestra labor frente a aplicaciones que pretenden reemplazar al nutricionista.&rdquo;
                </blockquote>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    — Abilene, Nutricionista Clínica
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Nutricionista en Chile
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción Minimalistas NutriNet */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              onClick={onCtaClick}
              className="w-full sm:w-auto rounded-full h-14 px-8 text-sm font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-indigo-100"
            >
              Obtener Acceso Beta con 50% Dcto.
            </Button>

            <Button
              variant="outline"
              onClick={onExploreFeaturesClick}
              className="w-full sm:w-auto rounded-full h-14 px-8 text-sm font-bold text-[#a88aed] border-2 border-[#a88aed]/30 hover:border-[#a88aed] hover:bg-[#a88aed]/10 transition-all duration-300"
            >
              Conocer Funcionalidades
            </Button>
          </div>

          {/* Micro-copy de Confianza */}
          <p className="text-xs sm:text-sm font-semibold text-slate-500 pt-1">
            Sin tarjeta de crédito • Registro en 30 segundos • Válido para los primeros 50 nutricionistas
          </p>

          {/* Badges de Confianza */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Fichas 100% Cifradas (Ley 19.628)
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" /> Ahorro de 3+ Horas Diarias
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-indigo-600" /> Basado en Alimentos de Chile
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
