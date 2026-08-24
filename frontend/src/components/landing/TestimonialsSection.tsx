"use client";

import { useEffect, useState } from "react";
import { Star, Quote, Sparkles, Building2, UserCheck } from "lucide-react";
import { fetchApi } from "@/lib/api-base";

interface Testimonial {
  id?: string;
  name: string;
  role?: string | null;
  clinic?: string | null;
  city?: string | null;
  timeSaved?: string | null;
  avatarText?: string | null;
  avatarBg?: string | null;
  quote: string;
  highlight?: string | null;
  rating?: number;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Dra. Camila Morales",
    role: "Nutricionista Clínica & Deportiva",
    clinic: "Consulta Particular / Centro Deportivo",
    city: "Santiago",
    timeSaved: "Ahorra 3.5 horas al día",
    avatarText: "CM",
    avatarBg: "from-purple-500 to-indigo-600",
    quote: "Antes tardaba hasta 45 minutos armando cada pauta de alimentación en Excel y pasando los datos a Word para que quedara presentable. Con NutriNet, en 5 minutos tengo la dieta calculada, las recetas estructuradas y el carrito de supermercado listo en un PDF hermoso.",
    highlight: "Pasé de 45 min a 5 min por pauta",
    rating: 5,
  },
  {
    name: "Nut. Felipe Contreras",
    role: "Especialista en Nutrición Bariátrica & Metabolic",
    clinic: "Red de Salud / Consulta Privada",
    city: "Concepción",
    timeSaved: "100% de adherencia en pacientes",
    avatarText: "FC",
    avatarBg: "from-emerald-500 to-teal-600",
    quote: "Lo que más valoro es la seguridad clínica y el respaldo con alimentos de Chile. Mis pacientes aman el formato del entregable; les queda tan claro el carrito de compras que las dudas en WhatsApp disminuyeron un 80%. Es la mejor inversión de mi consulta.",
    highlight: "Las dudas por WhatsApp bajaron 80%",
    rating: 5,
  },
  {
    name: "Nut. Valentina Silva",
    role: "Nutricionista Pediátrica & Materno Infantil",
    clinic: "Centro Médico de la Mujer",
    city: "Viña del Mar",
    timeSaved: "Aumento del 40% en pacientes mensuales",
    avatarText: "VS",
    avatarBg: "from-amber-500 to-rose-600",
    quote: "Naty la Nutria, tu asistente me ayuda muchísimo a buscar recetas alternativas para pacientes con APLV o restricciones complejas en segundos. Me dio el impulso para atender más pacientes al día sin terminar agotada en la noche.",
    highlight: "Atiendo más pacientes sin agotarme",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    let isMounted = true;
    const loadPublicTestimonials = async () => {
      try {
        const response = await fetchApi("/testimonials/public");
        if (response.ok) {
          const data = (await response.json()) as Testimonial[];
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setTestimonials(data);
          }
        }
      } catch (err) {
        console.error("Error loading public testimonials:", err);
      }
    };
    loadPublicTestimonials();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="testimonios" className="relative overflow-hidden py-20 bg-slate-900 text-white">
      {/* Background Glow Highlights */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#a88aed]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#a88aed]/30 bg-[#a88aed]/10 px-4 py-1.5 text-xs font-bold text-[#a88aed]">
            <Sparkles className="h-4 w-4" />
            Nutricionistas Reales en Chile
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-white">
            La herramienta preferida por quienes buscan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a88aed] to-emerald-400">
              excelencia clínica y más tiempo libre
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Más de <strong className="text-white">500+ nutricionistas chilenos</strong> confían en NutriNet para automatizar sus cálculos, elevar la calidad de sus entregables y hacer crecer su consulta privada.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={t.id || t.name + idx}
              className="relative rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between hover:border-[#a88aed]/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="space-y-4">
                {/* Header: Stars & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-slate-700 group-hover:text-[#a88aed]/40 transition-colors" />
                </div>

                {/* Highlight Badge */}
                {t.highlight && (
                  <div className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                    ⚡ {t.highlight}
                  </div>
                )}

                {/* Quote Body */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${t.avatarBg || "from-purple-500 to-indigo-600"} text-white font-bold text-sm flex items-center justify-center shadow-md shrink-0`}>
                  {t.avatarText || "TN"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate">{t.name}</h4>
                  {t.role && <p className="text-[11px] text-slate-400 truncate">{t.role}</p>}
                  <p className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                    <UserCheck className="h-3 w-3" /> {[t.city || "Chile", t.clinic].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Banner */}
        <div className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <Building2 className="h-5 w-5 text-[#a88aed]" />
              ¿Trabajas en consulta privada o centro médico?
            </h3>
            <p className="text-xs text-slate-300">
              Prueba NutriNet gratis hoy sin tarjeta de crédito. Configuración en menos de 2 minutos.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 shrink-0">
            <a href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#a88aed] hover:bg-[#8f70d8] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-transform active:scale-95">
              Probar Gratis Ahora <Sparkles className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
