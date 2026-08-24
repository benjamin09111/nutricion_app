"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Target,
  Users,
  HelpCircle,
  ShieldCheck,
  HeartPulse,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  FileCheck,
  Database,
  ArrowRight,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CookieBanner } from "@/components/landing/CookieBanner";

export type AboutTab = "objetivos" | "equipo" | "faq" | "seguridad" | "salud";

const TABS: Array<{
  id: AboutTab;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  activeColor: string;
}> = [
  {
    id: "objetivos",
    title: "Objetivos y dirección",
    subtitle: "Misión clínica y visión país",
    icon: Target,
    color: "text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/60",
    activeColor: "bg-indigo-600 text-white shadow-lg shadow-indigo-200 border-indigo-600",
  },
  {
    id: "equipo",
    title: "Equipo detrás de nutrinet",
    subtitle: "Nutricionistas e ingenieros en Chile",
    icon: Users,
    color: "text-emerald-600 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/60",
    activeColor: "bg-emerald-600 text-white shadow-lg shadow-emerald-200 border-emerald-600",
  },
  {
    id: "faq",
    title: "Preguntas frecuentes",
    subtitle: "Dudas sobre pautas, IA y PDF",
    icon: HelpCircle,
    color: "text-amber-600 border-amber-100 bg-amber-50/50 hover:bg-amber-100/60",
    activeColor: "bg-amber-600 text-white shadow-lg shadow-amber-200 border-amber-600",
  },
  {
    id: "seguridad",
    title: "Seguridad de los datos",
    subtitle: "Ley 19.628 / Ficha clínica cifrada",
    icon: ShieldCheck,
    color: "text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100/60",
    activeColor: "bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600",
  },
  {
    id: "salud",
    title: "Salud y cuidado",
    subtitle: "Respaldo y precisión nutricional",
    icon: HeartPulse,
    color: "text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-100/60",
    activeColor: "bg-rose-600 text-white shadow-lg shadow-rose-200 border-rose-600",
  },
];

function SobreNutriNetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramTab = (searchParams.get("tab") as AboutTab) || "objetivos";

  const [activeTab, setActiveTab] = useState<AboutTab>(
    ["objetivos", "equipo", "faq", "seguridad", "salud"].includes(paramTab)
      ? paramTab
      : "objetivos"
  );

  useEffect(() => {
    if (paramTab && paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleSelectTab = (tab: AboutTab) => {
    setActiveTab(tab);
    router.push(`/sobre-nutrinet?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col justify-between">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-indigo-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo_2.webp"
                alt="nutrinet"
                width={140}
                height={45}
                className="h-auto w-[118px] object-contain transition-transform duration-300 hover:scale-105 sm:w-[140px]"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </Link>
            <span className="hidden md:inline-block h-5 w-px bg-slate-200" />
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#a88aed] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a la portada
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-xs font-bold text-[#a88aed] hover:text-[#8f70d8]">
                Inicia Sesión
              </Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full h-10 px-5 text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all shadow-md">
                Empieza Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {/* Page Hero Header */}
        <section className="bg-gradient-to-b from-white via-indigo-50/30 to-slate-50/60 border-b border-indigo-100/60 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#a88aed]/30 bg-[#a88aed]/10 px-4 py-1.5 text-xs font-bold text-[#a88aed]">
              <Sparkles className="h-4 w-4" />
              Plataforma Clínica NutriNet Chile
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Conoce todo sobre <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a88aed] to-indigo-700">NutriNet</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Diseñado en Chile para empoderar la consulta nutricional privada e institucional con automatización, precisión y seguridad clínica.
            </p>
          </div>
        </section>

        {/* Tab Selection Bar & Main Section View */}
        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
            {/* Horizontal Tabs Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 border cursor-pointer active:scale-95",
                      isActive
                        ? tab.activeColor
                        : `${tab.color} text-slate-700`
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "")} />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Detailed Content Container */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-xl space-y-8">
              {/* TAB 1: Por qué existe NutriNet */}
              {activeTab === "objetivos" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="p-6 rounded-3xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
                      <Target className="h-4 w-4" /> Por qué existe NutriNet
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Por qué existe NutriNet
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                      Si eres nutricionista en Chile, sabes lo que es sentarte a las 22:00 a calcular macros a mano, armar la lista de supermercado paciente por paciente y después perder otra hora dejando el PDF &quot;presentable&quot;. Eso no es atención clínica, es pega administrativa que nadie te enseñó a evitar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 w-fit">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">De 45 minutos a 5 por plan</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        NutriNet calcula el GET, distribuye los macros y arma el PDF automáticamente. Lo que te demorabas una tarde entera, ahora te toma minutos — y el tiempo que te devuelve es para lo que realmente importa: la consulta, el seguimiento, la adherencia del paciente.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700 w-fit">
                        <FileCheck className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">Tú decides, la IA solo te ayuda</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Naty la Nutria, tu asistente arma propuestas, no indicaciones. Cada plan pasa por tu criterio clínico antes de llegar al paciente. La responsabilidad profesional sigue siendo 100% tuya — nosotros solo te sacamos el trabajo repetitivo de encima.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h3 className="font-bold text-lg text-slate-900">Lo que hace distinto a NutriNet</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600">
                      <li className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Datos chilenos, no genéricos
                        </span>
                        <p className="text-slate-600">Usamos la Tabla de Composición de Alimentos de Chile y productos que realmente se compran en el súper acá, no promedios internacionales que no aplican.</p>
                      </li>
                      <li className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> PDFs que el paciente sí abre
                        </span>
                        <p className="text-slate-600">Entregables ordenados y fáciles de seguir, pensados para que el paciente vuelva, no para que abandone en la segunda semana.</p>
                      </li>
                      <li className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Seguimiento sin planillas paralelas
                        </span>
                        <p className="text-slate-600">Antropometría, exámenes y registro alimentario, todo en un solo lugar.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: Equipo detrás de NutriNet */}
              {activeTab === "equipo" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                      <Users className="h-4 w-4" /> Equipo detrás de NutriNet
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Equipo detrás de NutriNet
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                      Nutrinet nace de un equipo de programadores y estudiantes en distintas universidades. Siendo expertos en el área de proyectos, apoyados por estudiantes de nutrición o ya egresados.
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                      Hemos trabajado con nutricionistas, en la creación de planes de alimentación, les hemos dado uso a distintos tipos de pacientes, como: personas con diabetes, polialergias, deportistas, etc. Para de esta forma, tener diferentes perspectivas de cómo se puede mejorar la experiencia del nutricionista y del paciente.
                    </p>
                    <p className="text-sm font-semibold text-emerald-900 leading-relaxed max-w-4xl">
                      Distintos puntos de vista para formar esta aplicación, con el único objetivo de ahorrar tiempo y mejorar la vida de los nutricionistas, dando una plataforma única y especializada.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Preguntas Frecuentes */}
              {activeTab === "faq" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-100 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-bold">
                      <HelpCircle className="h-4 w-4" /> Preguntas Frecuentes
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Respuesta a las dudas más comunes de nuestros profesionales
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-[#a88aed]" />
                        ¿El paciente interactúa directamente con la IA?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <strong>No, nunca.</strong> Naty la Nutria, tu asistente es tu herramienta interna de trabajo. Tú eres quien revisa, edita y entrega la pauta final firmada a tu paciente.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-[#a88aed]" />
                        ¿Puedo exportar e imprimir los planes?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        ¡Por supuesto! NutriNet genera archivos PDF vectoriales de alta definición listos para imprimir en tu consulta o enviar directamente por WhatsApp y correo electrónico a tu paciente.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-[#a88aed]" />
                        ¿Puedo utilizar mis propios alimentos y recetas?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Sí. Además de la tabla estandarizada chilena, cuentas con un espacio de <strong>Creaciones y Alimentos Personalizados</strong> donde puedes registrar preparaciones propias, marcas comerciales locales y guardarlas como plantillas reutilizables.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-[#a88aed]" />
                        ¿Necesito instalar software en mi computador?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        No. NutriNet es 100% basado en la nube. Puedes acceder de forma segura desde tu computador de consulta, laptop personal, tablet o teléfono móvil sin instalar nada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Seguridad de los Datos */}
              {activeTab === "seguridad" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="p-6 rounded-3xl bg-blue-50/60 border border-blue-100 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                      <ShieldCheck className="h-4 w-4" /> Cumplimiento Ley 19.628 Chile
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Privacidad Absoluta y Protección de la Ficha Clínica
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                      Sabemos que la información médica y nutricional de tus pacientes es sagrada. En NutriNet garantizamos el estricto cumplimiento de las leyes chilenas de protección de datos personales (Ley N° 19.628 y regulación de datos sensibles en salud).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-sm">
                      <div className="p-3 rounded-2xl bg-blue-100 text-blue-700 w-fit">
                        <Lock className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">Aislamiento por Nutricionista</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Tus fichas de pacientes están cifradas internamente. Únicamente tu cuenta tiene la clave de descifrado. Ni administradores del sistema ni terceros tienen visibilidad sobre tus pacientes.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-sm">
                      <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 w-fit">
                        <Database className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">Cifrado de Grado Bancario</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Toda la comunicación transita mediante protocolos SSL/TLS 1.3 y los servidores están respaldados automáticamente día a día en centros de datos con certificación ISO 27001.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-sm">
                      <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700 w-fit">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">Sin Venta de Datos</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Jamás comercializamos información clínica ni exponemos los datos de tus pacientes a publicidad de terceros.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Salud y Cuidado */}
              {activeTab === "salud" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="p-6 rounded-3xl bg-rose-50/60 border border-rose-100 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">
                      <HeartPulse className="h-4 w-4" /> Precisión Nutricional
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Rigor Científico y Cuidado Nutricional del Paciente
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                      NutriNet está construido sobre ecuaciones validadas por organismos internacionales (FAO, OMS, Nestlé Health Sciences) y la Tabla de Composición Química de Alimentos de Chile.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-sm">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Verificación de Restricciones y Alergias
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Al ingresar diagnósticos o restricciones (Celíacos, APLV, Diabetes, Hipertensión, Insuficiencia Renal), el sistema alerta si algún alimento de la pauta entra en conflicto clínico con la condición del paciente.
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-sm">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Cálculo Automático de Macronutrientes
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Elimina los errores de tipeo y redondeo. El motor nutricional calcula al instante gramos de proteína por kilo de peso corporal, porcentaje de macronutrientes y distribución calórica exacta por tiempo de comida.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-900 text-white border-t border-slate-800">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              ¿Lista para transformar tu consulta clínica?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Únete a más de 500+ nutricionistas en Chile que ahorran horas al día con NutriNet.
            </p>
            <div>
              <Link href="/login">
                <Button className="rounded-full h-14 px-8 text-sm font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white shadow-xl hover:scale-105 transition-all">
                  Empieza Gratis Hoy <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 text-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={120}
              height={40}
              className="h-auto w-[110px] object-contain brightness-0 invert"
            />
            <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
              NutriNet Chile
            </span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NutriNet Chile. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}

export default function SobreNutriNetClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Cargando...</div>}>
      <SobreNutriNetContent />
    </Suspense>
  );
}
