"use client";

import { useState } from "react";
import {
  Target,
  Users,
  HelpCircle,
  ShieldCheck,
  HeartPulse,
  X,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  FileCheck,
  Database,
  ArrowRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type AboutSectionTab =
  | "objetivos"
  | "equipo"
  | "faq"
  | "seguridad"
  | "salud";

interface AboutNutriNetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AboutSectionTab;
}

const TABS: Array<{
  id: AboutSectionTab;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
}> = [
  {
    id: "objetivos",
    title: "Objetivos y Dirección",
    subtitle: "Nuestra visión para la nutrición en Chile",
    icon: Target,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    id: "equipo",
    title: "Equipo Detrás de NutriNet",
    subtitle: "Nutricionistas e ingenieros locales",
    icon: Users,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    id: "faq",
    title: "Preguntas Frecuentes",
    subtitle: "Dudas resueltas sobre la plataforma",
    icon: HelpCircle,
    color: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    id: "seguridad",
    title: "Seguridad de los Datos",
    subtitle: "Privacidad clínica y Ley 19.628",
    icon: ShieldCheck,
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    id: "salud",
    title: "Salud y Cuidado Clínico",
    subtitle: "Respaldo y precisión nutricional",
    icon: HeartPulse,
    color: "text-rose-600 bg-rose-50 border-rose-100",
  },
];

export function AboutNutriNetModal({
  isOpen,
  onClose,
  initialTab = "objetivos",
}: AboutNutriNetModalProps) {
  const [activeTab, setActiveTab] = useState<AboutSectionTab>(initialTab);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-0 overflow-hidden rounded-3xl">
      <div className="flex flex-col md:flex-row min-h-[520px] max-h-[85vh]">
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-72 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0 border-r border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#a88aed]/20 text-[#a88aed]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Sobre NutriNet</h3>
                  <p className="text-[11px] text-slate-400">Plataforma Clínica</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1.5 pt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group text-xs font-bold",
                      isActive
                        ? "bg-[#a88aed] text-white shadow-lg shadow-[#a88aed]/20"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                      <span className="truncate">{tab.title}</span>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-70 transition-transform", isActive && "translate-x-0.5")} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800/80 space-y-3">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Cifrado en Chile
              </div>
              <p className="text-slate-400 leading-tight">Cumple con la normativa clínica y protección de datos profesionales.</p>
            </div>
            <Link href="/login" onClick={onClose}>
              <Button className="w-full h-10 bg-[#a88aed] hover:bg-[#8f70d8] text-white font-bold text-xs rounded-xl gap-2 justify-center shadow-md">
                Empieza Gratis Hoy <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white p-6 md:p-8 overflow-y-auto max-h-[75vh] md:max-h-[85vh] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#a88aed]">NutriNet Chile</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                {TABS.find((t) => t.id === activeTab)?.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* TAB 1: Por qué existe NutriNet */}
          {activeTab === "objetivos" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 space-y-2">
                <h3 className="font-black text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Por qué existe NutriNet
                </h3>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Si eres nutricionista en Chile, sabes lo que es sentarte a las 22:00 a calcular macros a mano, armar la lista de supermercado paciente por paciente y después perder otra hora dejando el PDF &quot;presentable&quot;. Eso no es atención clínica, es pega administrativa que nadie te enseñó a evitar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 w-fit">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">De 45 minutos a 5 por plan</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    NutriNet calcula el GET, distribuye los macros y arma el PDF automáticamente. Lo que te demorabas una tarde entera, ahora te toma minutos — y el tiempo que te devuelve es para lo que realmente importa: la consulta, el seguimiento, la adherencia del paciente.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 w-fit">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Tú decides, la IA solo te ayuda</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Naty la Nutria, tu asistente arma propuestas, no indicaciones. Cada plan pasa por tu criterio clínico antes de llegar al paciente. La responsabilidad profesional sigue siendo 100% tuya — nosotros solo te sacamos el trabajo repetitivo de encima.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Lo que hace distinto a NutriNet</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Datos chilenos, no genéricos:</strong> usamos la Tabla de Composición de Alimentos de Chile y productos que realmente se compran en el súper acá, no promedios internacionales que no aplican.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>PDFs que el paciente sí abre:</strong> entregables ordenados y fáciles de seguir, pensados para que el paciente vuelva, no para que abandone en la segunda semana.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Seguimiento sin planillas paralelas:</strong> antropometría, exámenes y registro alimentario, todo en un solo lugar.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Equipo Detrás de NutriNet */}
          {activeTab === "equipo" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 space-y-3">
                <h3 className="font-black text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Equipo detrás de NutriNet
                </h3>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  Nutrinet nace de un equipo de programadores y estudiantes en distintas universidades. Siendo expertos en el área de proyectos, apoyados por estudiantes de nutrición o ya egresados.
                </p>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  Hemos trabajado con nutricionistas, en la creación de planes de alimentación, les hemos dado uso a distintos tipos de pacientes, como: personas con diabetes, polialergias, deportistas, etc. Para de esta forma, tener diferentes perspectivas de cómo se puede mejorar la experiencia del nutricionista y del paciente.
                </p>
                <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                  Distintos puntos de vista para formar esta aplicación, con el único objetivo de ahorrar tiempo y mejorar la vida de los nutricionistas, dando una plataforma única y especializada.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Preguntas Frecuentes */}
          {activeTab === "faq" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#a88aed]" />
                    ¿Cómo funciona la asistencia de Naty la Nutria, tu asistente?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Naty la Nutria, tu asistente es tu herramienta interna. Te ayuda a redactar pautas, estructurar recetas y validar restricciones médicas según los datos de tu paciente. <strong>El paciente nunca interactúa directamente con la IA</strong>; el entregable que recibe es 100% firmado y personalizado por ti.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#a88aed]" />
                    ¿Puedo exportar e imprimir los planes?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ¡Por supuesto! NutriNet genera archivos PDF vectoriales de alta definición listos para imprimir en tu consulta o enviar directamente por WhatsApp y correo electrónico a tu paciente.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#a88aed]" />
                    ¿Puedo utilizar mis propios alimentos y recetas?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sí. Además de la tabla estandarizada chilena, cuentas con un espacio de <strong>Creaciones y Alimentos Personalizados</strong> donde puedes registrar preparaciones propias, marcas comerciales locales y guardarlas como plantillas reutilizables.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#a88aed]" />
                    ¿Necesito instalar software en mi computador?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    No. NutriNet es 100% basado en la nube. Puedes acceder de forma segura desde tu computador de consulta, laptop personal, tablet o teléfono móvil sin instalar nada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Seguridad de los Datos */}
          {activeTab === "seguridad" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-950 space-y-2">
                <h3 className="font-black text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Privacidad Absoluta y Protección Ficha Clínica
                </h3>
                <p className="text-xs text-blue-900/80 leading-relaxed">
                  Sabemos que la información médica y nutricional de tus pacientes es sagrada. En NutriNet garantizamos el estricto cumplimiento de las leyes chilenas de protección de datos personales (Ley N° 19.628 y regulación de datos sensibles en salud).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 w-fit">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Aislamiento por Nutricionista</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tus fichas de pacientes están cifradas internamente. Únicamente tu cuenta tiene la clave de descifrado. Ni administradores del sistema ni terceros tienen visibilidad sobre tus pacientes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 w-fit">
                    <Database className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Cifrado de Grado Bancario</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toda la comunicación transita mediante protocolos SSL/TLS 1.3 y los servidores están respaldados automáticamente día a día en centros de datos con certificación ISO 27001.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Compromisos de Seguridad NutriNet</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Sin venta de datos ni publicidad a terceros</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Derecho de eliminación y exportación de fichas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Autenticación segura de dos factores con Google</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Auditoría de seguridad y respaldos constantes</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: Salud y Cuidado */}
          {activeTab === "salud" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-rose-950 space-y-2">
                <h3 className="font-black text-base flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-600" />
                  Rigor Científico y Cuidado Nutricional
                </h3>
                <p className="text-xs text-rose-900/80 leading-relaxed">
                  NutriNet está construido sobre ecuaciones validadas por organismos internacionales (FAO, OMS, Nestlé Health Sciences) y la Tabla de Composición Química de Alimentos de Chile.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verificación de Restricciones y Alergias Alimentos
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Al ingresar diagnósticos o restricciones (Celíacos, APLV, Diabetes, Hipertensión, Insuficiencia Renal), el sistema alerta si algún alimento de la pauta entra en conflicto clínico con la condición del paciente.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Cálculo Automático de Macronutrientes y Micronutrientes
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Elimina los errores de tipeo y redondeo. El motor nutricional calcula al instante gramos de proteína por kilo de peso corporal, porcentaje de macronutrientes y distribución calórica exacta por tiempo de comida.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
