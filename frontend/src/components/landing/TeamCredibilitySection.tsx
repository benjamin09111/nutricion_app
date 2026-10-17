"use client";

import { Code2, HeartPulse, Briefcase, CheckCircle } from "lucide-react";

export function TeamCredibilitySection() {
  const members = [
    {
      role: "Líder de Desarrollo e IA",
      tagline: "Arquitectura SaaS & Modelos Clínicos",
      description: "Experiencia en ingeniería de software, arquitectura modular en la nube y copilotos de Inteligencia Artificial que respetan la privacidad clínica.",
      icon: Code2,
      initials: "IA",
    },
    {
      role: "Líder Clínico (Nutricionista)",
      tagline: "Especialista en Nutrición & Normas INTA",
      description: "Especialista en nutrición clínica, encargada de la rigurosidad biomatemática, las guías MINSAL y la validación de alimentos chilenos.",
      icon: HeartPulse,
      initials: "NC",
    },
    {
      role: "Líder de Negocios y Estrategia",
      tagline: "Metodología Lean Startup & Alianzas",
      description: "Enfocado en el modelo B2B, levantamiento de capital, validación con centros de salud y escalabilidad del ecosistema NutriNet.",
      icon: Briefcase,
      initials: "BS",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-100">
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
            EQUIPO
          </span>
          <span className="block text-xl font-bold text-[#a88aed] sm:text-2xl lg:text-4xl">
            Quiénes construimos NutriNet
          </span>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto pt-2">
            Unimos la precisión de la nutrición científica con la velocidad del software moderno en Chile.
          </p>
        </div>

        {/* 3 Founder Cards Minimalistas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {members.map((member, idx) => {
            return (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:border-[#a88aed]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#a88aed]/10 text-[#8f70d8] font-bold text-base flex items-center justify-center border border-[#a88aed]/20">
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {member.role}
                      </h3>
                      <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                        {member.tagline}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                    {member.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Equipo Fundador NutriNet Chile</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
