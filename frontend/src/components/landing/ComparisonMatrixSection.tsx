"use client";

import { useState } from "react";
import {
  Sparkles,
  Check,
  XCircle,
  Clock,
  Target,
  Zap,
  BookOpen,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  HeartPulse,
  ArrowRight,
  Layers,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryFilter = "ALL" | "MARKETING" | "AUTOMATION" | "CLINICAL" | "PATIENT";

interface ComparisonRow {
  id: string;
  category: "MARKETING" | "AUTOMATION" | "CLINICAL" | "PATIENT";
  categoryLabel: string;
  title: string;
  icon: any;
  traditional: string;
  foreign: string;
  nutrinet: string;
  nutrinetHighlight?: string;
  impact: string;
}

export function ComparisonMatrixSection() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("ALL");

  const rows: ComparisonRow[] = [
    // 1. MARKETING Y CLIENTES
    {
      id: "matchmaking",
      category: "MARKETING",
      categoryLabel: "Marketing & Clientes",
      title: "Adquisición de Pacientes (Matchmaking)",
      icon: Target,
      traditional: "Boca a boca informal y batallas constantes contra el algoritmo de Instagram sin conversión.",
      foreign: "Sin herramientas de captación ni derivación de pacientes.",
      nutrinet: "Matchmaking Inteligente B2B2C: derivación de pacientes listos por objetivo y presupuesto.",
      nutrinetHighlight: "Pacientes calificados directo a tu agenda",
      impact: "Aumento de ingresos mensuales sin gastar en agencias ni publicidad.",
    },
    {
      id: "seo",
      category: "MARKETING",
      categoryLabel: "Marketing & Clientes",
      title: "Presencia Web & Posicionamiento SEO",
      icon: Users,
      traditional: "Inexistente o perfiles en redes sociales que no posicionan en Google.",
      foreign: "Directorios cerrados en inglés sin indexación en Chile.",
      nutrinet: "Perfil Profesional SEO verificado (/nutricionistas/[slug]) con agenda y reservas.",
      nutrinetHighlight: "Directorio Público Nacional",
      impact: "Pacientes de tu ciudad te encuentran directamente en los primeros resultados de Google.",
    },

    // 2. AUTOMATIZACIÓN Y TIEMPO
    {
      id: "tiempo-pauta",
      category: "AUTOMATION",
      categoryLabel: "Automatización & Tiempo",
      title: "Tiempo por Pauta Nutricional",
      icon: Clock,
      traditional: "45 a 60 minutos calculando TMB, GET y cuadrando porciones a mano en Excel.",
      foreign: "20 a 30 minutos con fórmulas rígidas y sin porciones chilenas.",
      nutrinet: "5 minutos con cálculo bio-matemático instantáneo y autocompletado asistido por IA.",
      nutrinetHighlight: "5 Minutos / Pauta",
      impact: "Ahorro del 88% del tiempo (recupera tus tardes, noches y fines de semana).",
    },
    {
      id: "modulo-rapido",
      category: "AUTOMATION",
      categoryLabel: "Automatización & Tiempo",
      title: "Prescripción Express (Alto Flujo)",
      icon: Zap,
      traditional: "Imposible. Requiere citar a segunda sesión o enviar el plan días después por correo.",
      foreign: "Rígido. Exige armar minutas complejas antes de poder exportar.",
      nutrinet: "Módulo Rápido (3 min): Genera y entrega pauta de 1 página descargable durante la consulta.",
      nutrinetHighlight: "Entregable en 3 minutos",
      impact: "Entregable inmediato que impresiona al paciente y cierra el servicio en la misma sesión.",
    },
    {
      id: "lista-compras",
      category: "AUTOMATION",
      categoryLabel: "Automatización & Tiempo",
      title: "Lista de Compras Automatizada",
      icon: ShoppingBag,
      traditional: "Manual y confusa. El paciente debe calcular y sumar gramos por su cuenta.",
      foreign: "No incluye o lista desordenada sin categorías de supermercado.",
      nutrinet: "Carrito Automático en 1 Clic: Consolidación semanal organizada por pasillos de supermercado.",
      nutrinetHighlight: "Organizado por Pasillos",
      impact: "Facilita la compra del paciente, evita compras innecesarias y asegura adherencia.",
    },

    // 3. RIGOR CLÍNICO Y CREACIÓN DE PAUTAS
    {
      id: "base-alimentos",
      category: "CLINICAL",
      categoryLabel: "Rigor Clínico & Pautas",
      title: "Base de Datos de Alimentos",
      icon: BookOpen,
      traditional: "Bases desactualizadas o USDA (EE.UU.) con ingredientes que no existen en Chile.",
      foreign: "Catálogos extranjeros en inglés sin marcas ni porciones nacionales.",
      nutrinet: "Tabla Oficial INTA 2018 (U. de Chile), precios ODEPA y marcas locales (Jumbo, Líder, Unimarc).",
      nutrinetHighlight: "Tabla Oficial INTA 2018",
      impact: "Cero alucinaciones: 100% rigor científico con ingredientes reales del supermercado chileno.",
    },
    {
      id: "ia-clinica",
      category: "CLINICAL",
      categoryLabel: "Rigor Clínico & Pautas",
      title: "Soporte de Inteligencia Artificial",
      icon: Sparkles,
      traditional: "Sin IA o uso de ChatGPT genérico que inventa porciones y alucina alimentos.",
      foreign: "Sin IA clínica o automatismos desconectados del contexto médico.",
      nutrinet: "Copiloto Clínico Naty IA (Human-in-the-Loop): Asistencia invisible 24/7 donde tú apruebas todo.",
      nutrinetHighlight: "Human-in-the-Loop",
      impact: "Multiplica tu capacidad clínica manteniendo el 100% del criterio y control profesional.",
    },
    {
      id: "antropometria",
      category: "CLINICAL",
      categoryLabel: "Rigor Clínico & Pautas",
      title: "Antropometría & Tamizajes Clínicos",
      icon: HeartPulse,
      traditional: "Fórmulas en celdas de Excel propensas a errores de tipeo y desconfiguración.",
      foreign: "Formularios básicos sin tamizajes clínicos validados.",
      nutrinet: "Ficha 360°, antropometría evolutiva e instrumentos integrados (MNA, MUST, NRS-2002).",
      nutrinetHighlight: "Ficha 360° + Historial SOAP",
      impact: "Trazabilidad longitudinal completa para auditorías y evolución cronológica.",
    },

    // 4. SEGUIMIENTO PRIVADO Y ADHERENCIA
    {
      id: "portal-pwa",
      category: "PATIENT",
      categoryLabel: "Seguimiento & Pacientes",
      title: "Portal Interactivo del Paciente",
      icon: Smartphone,
      traditional: "PDFs fríos en Word o Canva que el paciente traspapela o pierde en chats de WhatsApp.",
      foreign: "PDFs rígidos con marca de agua y sin interactividad.",
      nutrinet: "Portal PWA Móvil interactivo (sin contraseñas) + PDF editorial de alta calidad.",
      nutrinetHighlight: "PWA Móvil Instalable",
      impact: "Experiencia moderna y accesible desde cualquier celular sin ocupar memoria.",
    },
    {
      id: "checkins",
      category: "PATIENT",
      categoryLabel: "Seguimiento & Pacientes",
      title: "Acompañamiento Interconsulta Privado",
      icon: TrendingUp,
      traditional: "A ciegas. WhatsApp disperso o cero contacto durante los 30 días entre citas.",
      foreign: "Sin canal diario de interacción con el paciente.",
      nutrinet: "Check-ins diarios en PWA: Registro de agua, ánimo, fotos de platos y alertas tempranas.",
      nutrinetHighlight: "Alertas de Deserción",
      impact: "Visibilidad total: detecta a tiempo cuando el paciente pierde motivación antes de que abandone.",
    },
    {
      id: "retencion",
      category: "PATIENT",
      categoryLabel: "Seguimiento & Pacientes",
      title: "Tasa de Adherencia & Retención",
      icon: TrendingUp,
      traditional: "86% de deserción de pacientes antes del año (estadística DIPRES Chile).",
      foreign: "Alta deserción tras el primer mes por falta de conexión diaria.",
      nutrinet: "Reducción de deserción a menos del 30% mediante acompañamiento continuo y pautas dinámicas.",
      nutrinetHighlight: "<30% Deserción",
      impact: "Pacientes fieles que renuevan controles mensuales y recomiendan tu consulta.",
    },
    {
      id: "privacidad",
      category: "PATIENT",
      categoryLabel: "Seguimiento & Pacientes",
      title: "Seguridad de Datos y Normativa Médica",
      icon: ShieldCheck,
      traditional: "Riesgo normativo alto por usar Google Drive o Excel sin encriptación médica.",
      foreign: "Servidores en el extranjero sin cumplimiento de la normativa chilena.",
      nutrinet: "Cumplimiento estricto Leyes 19.628, 21.719 y 20.584 con cifrado clínico AES-256.",
      nutrinetHighlight: "Cifrado Clínico AES-256",
      impact: "Tranquilidad jurídica total: solo el nutricionista titular tiene acceso a los datos de sus pacientes.",
    },
  ];

  const filteredRows =
    activeFilter === "ALL"
      ? rows
      : rows.filter((r) => r.category === activeFilter);

  return (
    <section id="comparativa" className="py-16 sm:py-24 bg-white scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header con estándar visual NutriNet */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <span
            className="block text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl"
            style={{
              WebkitTextStroke: "3px #a6c261",
              color: "transparent",
              fontWeight: 900,
            }}
          >
            COMPARATIVA COMPLETA
          </span>
          <span className="block text-xl font-bold text-[#a88aed] sm:text-2xl lg:text-4xl">
            Tu método actual vs. NutriNet
          </span>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mx-auto pt-1 leading-relaxed">
            Resolvemos los 4 mayores dolores del nutricionista: <strong>marketing para captar pacientes</strong>, <strong>diseño rápido de pautas con base INTA</strong>, <strong>automatización de procesos manuales</strong> y <strong>seguimiento privado para evitar la deserción</strong>.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
              activeFilter === "ALL"
                ? "bg-[#a88aed] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Todas las Funcionalidades ({rows.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("MARKETING")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
              activeFilter === "MARKETING"
                ? "bg-[#a88aed] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
            )}
          >
            <Target className="h-3.5 w-3.5 text-rose-500" />
            <span>Marketing & Captación</span>
          </button>

          <button
            onClick={() => setActiveFilter("AUTOMATION")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
              activeFilter === "AUTOMATION"
                ? "bg-[#a88aed] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
            )}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Automatización & Tiempo</span>
          </button>

          <button
            onClick={() => setActiveFilter("CLINICAL")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
              activeFilter === "CLINICAL"
                ? "bg-[#a88aed] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
            )}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            <span>Rigor Clínico & INTA</span>
          </button>

          <button
            onClick={() => setActiveFilter("PATIENT")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
              activeFilter === "PATIENT"
                ? "bg-[#a88aed] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
            )}
          >
            <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
            <span>Seguimiento PWA & Privacidad</span>
          </button>
        </div>

        {/* Indicador de scroll para dispositivos móviles */}
        <div className="block lg:hidden text-center text-[11px] font-semibold text-slate-400 mb-3">
          ← Desliza horizontalmente para ver la tabla completa →
        </div>

        {/* Tabla Comparativa Exhaustiva */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full min-w-[920px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="p-4 sm:p-5 font-bold text-slate-900 w-[24%]">
                  Dimensión de la Consulta
                </th>
                <th className="p-4 sm:p-5 font-semibold text-slate-500 text-center w-[22%]">
                  Método Tradicional (Excel / Canva)
                </th>
                <th className="p-4 sm:p-5 font-semibold text-slate-500 text-center w-[20%]">
                  Softwares Extranjeros
                </th>
                <th className="p-4 sm:p-5 font-black text-[#8f70d8] text-center w-[24%] bg-[#a88aed]/10 border-x-2 border-t-2 border-[#a88aed]/40 rounded-t-2xl">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#a88aed]" />
                    <span>Con NutriNet SaaS + IA</span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 font-bold text-slate-700 text-center w-[20%]">
                  Beneficio Clave
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((item) => {
                const IconComponent = item.icon;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Dimension / Title */}
                    <td className="p-4 sm:p-5 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 mt-0.5 shrink-0">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <strong className="font-bold text-slate-900 block leading-snug">
                            {item.title}
                          </strong>
                          <span className="text-[10px] font-semibold text-[#8f70d8] uppercase tracking-wider block mt-0.5">
                            {item.categoryLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Traditional Method */}
                    <td className="p-4 sm:p-5 align-top text-slate-500 text-xs leading-relaxed">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>{item.traditional}</span>
                      </div>
                    </td>

                    {/* Foreign Softwares */}
                    <td className="p-4 sm:p-5 align-top text-slate-500 text-xs leading-relaxed">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>{item.foreign}</span>
                      </div>
                    </td>

                    {/* NutriNet Column (Highlighted) */}
                    <td className="p-4 sm:p-5 align-top bg-[#a88aed]/5 border-x-2 border-[#a88aed]/40">
                      <div className="space-y-1.5">
                        {item.nutrinetHighlight && (
                          <div className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-extrabold shadow-2xs">
                            <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                            <span>{item.nutrinetHighlight}</span>
                          </div>
                        )}
                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                          {item.nutrinet}
                        </p>
                      </div>
                    </td>

                    {/* Impact / Key Benefit */}
                    <td className="p-4 sm:p-5 align-top">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 leading-snug">
                        {item.impact}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA within Comparativa */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl border border-slate-200 bg-slate-50/70 text-center max-w-3xl mx-auto space-y-3">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            ¿Listo para dejar las planillas de Excel y modernizar tu consulta?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Prueba NutriNet sin compromiso. Diseña tu primera pauta en menos de 5 minutos y obtén acceso preferencial como early adopter.
          </p>
          <div className="pt-2">
            <a
              href="#registro"
              className="inline-flex items-center gap-2 rounded-full h-11 px-6 text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <span>Reservar Acceso Beta con 50% Dcto.</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
