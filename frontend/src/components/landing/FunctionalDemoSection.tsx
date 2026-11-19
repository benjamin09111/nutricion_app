"use client";

import { useState } from "react";
import { Calculator, Sparkles, ShoppingBag, Smartphone, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunctionalDemoSectionProps {
  onTabChange?: (tabIndex: number) => void;
}

export function FunctionalDemoSection({ onTabChange }: FunctionalDemoSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  const stages = [
    {
      id: "dieta",
      step: "Etapa 1",
      title: "Dieta: Precisión en Segundos",
      shortTitle: "1. Dieta & Metas",
      icon: Calculator,
      headline: "Cálculos biomatemáticos exactos con la Tabla INTA 2018",
      description: "Fórmulas Mifflin-St Jeor, Harris-Benedict y FAO/OMS con distribución automática de porciones de intercambio chilenas.",
      bullets: [
        "Cálculo instantáneo de TMB y Gasto Energético Total (GET)",
        "Distribución por porciones (Lácteos, Carnes, Cereales, Frutas, Verduras, Aceites)",
        "Detección de superávit o déficit calórico según el objetivo del paciente",
      ],
      previewBadge: "Cálculo instantáneo",
      previewItems: [
        { label: "GET Objetivo", value: "2.150 kcal" },
        { label: "Macros Cuadrados", value: "135g Proteína (25%)" },
        { label: "Base Chilena", value: "Tabla INTA 2018" },
      ],
    },
    {
      id: "recetas",
      step: "Etapa 2",
      title: "Recetas & IA: Naty la Nutria",
      shortTitle: "2. Naty IA (Recetas)",
      icon: Sparkles,
      headline: "Autocompletado inteligente de minutas respetando restricciones",
      description: "Naty sugiere recetas clínicas adaptadas a alergias e intolerancias (Celiaquía, APLV, Diabetes) y gustos del paciente.",
      bullets: [
        "Filtro estricto por alérgenos y restricciones clínicas",
        "Minutas variadas para evitar el aburrimiento del paciente",
        "Enfoque Human-in-the-Loop: la nutricionista siempre valida y decide",
      ],
      previewBadge: "IA Clínica Human-in-Loop",
      previewItems: [
        { label: "Filtros Activos", value: "Sin Gluten / APLV" },
        { label: "Minutas", value: "14 Opciones Variadas" },
        { label: "Rigor Clínico", value: "0 Alucinaciones" },
      ],
    },
    {
      id: "carrito",
      step: "Etapa 3",
      title: "Carrito: Compras Inteligentes",
      shortTitle: "3. Carrito Supermercado",
      icon: ShoppingBag,
      headline: "Suma matemática semanal organizada por pasillos",
      description: "Transforma la pauta nutricional en una lista de compras consolidada organizada por góndolas de supermercado en Chile.",
      bullets: [
        "Suma automática de gramos y unidades para toda la semana",
        "Organización por pasillos: Verdulería, Carnicería, Lácteos, Despensa",
        "Evita el desperdicio de alimentos y simplifica la vida del paciente",
      ],
      previewBadge: "Lista en 1 Clic",
      previewItems: [
        { label: "Porción Semanal", value: "1.2 kg Pechuga" },
        { label: "Pasillos", value: "Verdulería, Carnes, Lácteos" },
        { label: "Ahorro", value: "0 Desperdicio de comida" },
      ],
    },
    {
      id: "portal",
      step: "Etapa 4",
      title: "Portal del Paciente: PWA Móvil",
      shortTitle: "4. Portal PWA Paciente",
      icon: Smartphone,
      headline: "Acompañamiento interactivo que asegura la reconsulta",
      description: "Tu paciente instala la PWA en su celular sin ocupar memoria. Registra agua, ánimo y visualiza su plan sin PDFs confusos.",
      bullets: [
        "Diario de hidratación y registro de ánimo en tiempo real",
        "Visualización interactiva y lista de supermercado en el bolsillo",
        "Canal directo y seguro con su profesional de salud",
      ],
      previewBadge: "PWA Móvil Instalable",
      previewItems: [
        { label: "Agua Registrada", value: "2.4 L / día" },
        { label: "Adherencia Pauta", value: "94% de cumplimiento" },
        { label: "Compatibilidad", value: "iOS y Android" },
      ],
    },
  ];

  const current = stages[activeTab];

  const handleSelectTab = (idx: number) => {
    setActiveTab(idx);
    onTabChange?.(idx);
  };

  return (
    <section id="funcionalidades" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Header con estándar visual NutriNet */}
        <div className="text-center space-y-3 mb-12">
          <span
            className="block text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl"
            style={{
              WebkitTextStroke: "3px #a6c261",
              color: "transparent",
              fontWeight: 900,
            }}
          >
            ETAPAS MVP
          </span>
          <span className="block text-xl font-bold text-[#a88aed] sm:text-2xl lg:text-4xl">
            Las 4 etapas de tu consulta clínica
          </span>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto pt-2">
            Desde el cálculo antropométrico inicial hasta la lista de supermercado del paciente.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {stages.map((st, idx) => {
            const Icon = st.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={st.id}
                onClick={() => handleSelectTab(idx)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-[#a88aed] text-white shadow-md shadow-[#a88aed]/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-[#a88aed]/40 hover:bg-[#a88aed]/5",
                )}
              >
                <Icon className={cn("h-4 w-4", isSelected ? "text-white" : "text-[#a88aed]")} />
                <span>{st.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Stage Presentation Card Minimalista */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a88aed]/10 text-[#8f70d8] text-xs font-bold uppercase tracking-wider border border-[#a88aed]/20">
                <current.icon className="h-3.5 w-3.5" />
                <span>{current.step}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {current.headline}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {current.description}
              </p>

              <ul className="space-y-2 pt-2">
                {current.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                    <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Preview Minimalista */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8f70d8]">
                  {current.previewBadge}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>

              <div className="space-y-3">
                {current.previewItems.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 block">{item.label}</span>
                    <span className="text-base font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
