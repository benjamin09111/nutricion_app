"use client";

import {
  Calculator,
  Utensils,
  ChefHat,
  ShoppingBag,
  BookOpen,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FeaturesSectionProps {
  onProbarNutriNetClick?: () => void;
}

const FEATURES = [
  {
    icon: Calculator,
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    badge: "Paso 1 y 2",
    title: "Pauta Rápida & Metas Clínicas",
    description:
      "Cálculo automático de TMB y Gasto Energético Total (GET) con fórmulas validadas (Mifflin, Harris-Benedict) y distribución de porciones oficiales INTA 2018.",
    bullets: [
      "Cuadratura calórica y de macronutrientes",
      "Tabla oficial chilena de alimentos y porciones",
      "Ajuste por nivel de actividad y objetivo clínico",
    ],
  },
  {
    icon: ChefHat,
    iconBg: "bg-amber-50 text-amber-700 border-amber-200/70",
    badge: "Paso 3",
    title: "Platos & Recetas Autocompletables",
    description:
      "Crea o autocompleta preparaciones con ingredientes reales. Naty IA te sugiere alternativas respetando las restricciones del paciente.",
    bullets: [
      "Recetas con ingredientes y cantidades gramadas",
      "Respeto estricto a alergias e intolerancias",
      "Autocompletado de minutas en un solo clic",
    ],
  },
  {
    icon: Utensils,
    iconBg: "bg-blue-50 text-blue-700 border-blue-200/70",
    badge: "Paso 4",
    title: "Tabla de Comidas & Horarios",
    description:
      "Estructura la jornada del paciente por horarios: Desayuno, Colación AM, Almuerzo, Once y Cena, con porciones e indicaciones claras.",
    bullets: [
      "Horarios sugeridos e indicaciones por comida",
      "Modo tabla simple o alternativas por opción",
      "Visualización amigable y fácil de seguir",
    ],
  },
  {
    icon: ShoppingBag,
    iconBg: "bg-purple-50 text-purple-700 border-purple-200/70",
    badge: "Paso 5",
    title: "Lista de Compras Inteligente",
    description:
      "Transforma automáticamente la pauta en una lista consolidada semanal organizada por pasillos de supermercado para evitar compras innecesarias.",
    bullets: [
      "Suma de cantidades exactas para la semana",
      "Organizada por Verdulería, Carnicería y Despensa",
      "Evita el desperdicio de comida y ahorra dinero",
    ],
  },
  {
    icon: BookOpen,
    iconBg: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    badge: "Recursos",
    title: "Biblioteca de Educación Nutricional",
    description:
      "Más de 40 recursos ilustrados y guías clínicas listas para adjuntar al paciente: hábitos, mitos desmentidos, salud intestinal y porciones visuales.",
    bullets: [
      "Mitos vs Realidad de la nutrición moderna",
      "Guías de porciones de intercambio prácticas",
      "Salud digestiva, mental y nutrición deportiva",
    ],
  },
  {
    icon: FileText,
    iconBg: "bg-rose-50 text-rose-700 border-rose-200/70",
    badge: "Entregables",
    title: "Entregables Clínicos en PDF",
    description:
      "Genera documentos con diseño editorial moderno y tipografía cuidada. Listos para descargar, imprimir o compartir por WhatsApp con tu paciente.",
    bullets: [
      "Formato multi-página ordenado y legible",
      "Sin tablas técnicas internas que confundan al paciente",
      "Personalizable con tu nombre y firma profesional",
    ],
  },
];

export function FeaturesSection({ onProbarNutriNetClick }: FeaturesSectionProps) {
  return (
    <section id="funcionalidades" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Encabezado con estándar visual NutriNet */}
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-semibold sm:px-5 sm:text-sm bg-[#a88aed]/10 text-[#a88aed] border-[#a88aed]/30 transition-all duration-300 hover:scale-105">
            <Sparkles className="h-4 w-4" />
            <span>Todo lo que viste en la demo · En un solo lugar</span>
          </div>

          <div className="space-y-3">
            <h2 className="space-y-2 sm:space-y-3">
              <span
                className="block text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-6xl uppercase text-center"
                style={{
                  WebkitTextStroke: "2.5px #a6c261",
                  color: "transparent",
                  fontWeight: 900,
                }}
              >
                FUNCIONALIDADES
              </span>
              <span className="block text-xl font-bold tracking-tight text-[#a88aed] sm:text-2xl lg:text-4xl text-center">
                Todo lo que necesitas para tu consulta clínica
              </span>
            </h2>
          </div>

          <p className="mx-auto max-w-3xl text-sm sm:text-base text-slate-600 leading-relaxed">
            Menos tiempo en cálculos manuales y planillas de cálculo, más tiempo de calidad
            atendiendo y fidelizando a tus pacientes.
          </p>
        </div>

        {/* Grid de 6 funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs hover:shadow-xl hover:border-[#86A83C]/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.iconBg} shadow-2xs transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-950 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  {item.bullets.map((bullet, bulletIdx) => (
                    <div
                      key={bulletIdx}
                      className="flex items-start gap-2 text-xs text-slate-700 font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón CTA simple al pie de funcionalidades */}
        {onProbarNutriNetClick && (
          <div className="mt-12 text-center">
            <Button
              onClick={onProbarNutriNetClick}
              className="rounded-full h-13 px-8 text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#86A83C] hover:bg-[#78A82F] text-white transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-[#86A83C]/20 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explorar estas funciones en la Demo</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
