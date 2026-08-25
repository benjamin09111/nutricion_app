"use client";

import React from "react";
import {
  BookOpen,
  Sparkles,
  Users,
  Utensils,
  Apple,
  FileText,
  BookmarkCheck,
  Settings,
  HelpCircle,
  ArrowRight,
  Rocket,
  MessageSquareHeart,
  Layers,
  Crown,
  Monitor,
  Smartphone,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ModuleLayout } from "@/components/shared/ModuleLayout";

export default function UsoRecomendadoPage() {
  const router = useRouter();

  return (
    <ModuleLayout
      title="Guía de Uso Recomendado"
      description="Guía práctica recomendada para estructurar tu consulta diaria, automatizar procesos clínicos y maximizar tu tiempo profesional."
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Banner Hero */}
        <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Herramienta Diaria para Nutricionistas
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Bienvenido a NutriNet
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              NutriNet es una plataforma enfocada completamente en los nutricionistas, destacando por la automatización de procesos diarios. Por eso, se recomienda que esta sea tu herramienta diaria y lleves todo el registro de tus actividades y acciones.
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs leading-relaxed font-medium">
              ⭐ <strong>Recordatorio importante:</strong> NutriNet se disfruta y aprovecha al máximo diariamente con el plan de pago.
            </div>
          </div>
        </div>

        {/* Informes de Dispositivo y Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Monitor className="h-5 w-5 text-indigo-600" />
              Diseñado para Notebooks y Computadores
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              NutriNet está pensado y optimizado principalmente para notebooks y computadores de escritorio, facilitando la edición fluida de dietas y recetas. Sin embargo, también puedes ingresar desde celulares mediante el menú y la barra de navegación móvil inferior.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Activity className="h-5 w-5 text-amber-600" />
              Consulta de Límites y Plan Actual
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si cuentas con el plan gratuito (Freemium), puedes revisar en cualquier momento tus límites disponibles ingresando al menú desplegable de <strong className="text-slate-900">"Perfil y Configuración"</strong> ubicado arriba a la derecha en la barra superior.
            </p>
          </div>
        </div>

        {/* 1. Paso Recomendado: Administración */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-lg">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users className="h-5 w-5" />
            </div>
            1. Primer Paso Recomendado: Módulo de Administración
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            NutriNet cuenta con la creación de planes, dietas, recetas y entregables personalizados para pacientes. Puedes crear tus pacientes en el módulo de <strong className="text-indigo-700">"ADMINISTRACIÓN"</strong> (sección Pacientes), que es el primer paso recomendado para asociar luego tus entregables a cada paciente.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => router.push("/dashboard/pacientes")}
              variant="outline"
              className="rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs flex items-center gap-2"
            >
              Ir a Administración de Pacientes &rarr;
            </Button>
          </div>
        </section>

        {/* 2. Módulo Principal */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-lg">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Layers className="h-5 w-5" />
            </div>
            2. Módulo Principal: Creaciones Clínicas
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dentro del módulo <strong className="text-slate-900">"PRINCIPAL"</strong>, puedes crear distintas herramientas adaptadas a la consulta:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Utensils className="h-4 w-4 text-emerald-600" />
                Recetas
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Puedes crear recetas personalizadas para tus pacientes. Puedes agregar ingredientes, instrucciones y fotos.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Apple className="h-4 w-4 text-amber-600" />
                Dietas
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Puedes crear dietas personalizadas para tus pacientes. Puedes agregar alimentos, cantidades, horarios y fotos.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="h-4 w-4 text-indigo-600" />
                Planes / Entregables
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Puedes crear planes personalizados para tus pacientes. Puedes agregar dietas, recetas, horarios y fotos para generar el documento PDF final.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Reutilización & Herramientas */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-lg">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            3. Módulo Herramientas: Reutilización y Recursos Educativos
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Todo es reutilizable: puedes guardar tus creaciones y las puedes ver y organizar dentro de <strong className="text-slate-900">"Creaciones"</strong> en el módulo de <strong className="text-purple-700">"HERRAMIENTAS"</strong>. Así evitas rehacer trabajo desde cero en cada consulta.
          </p>
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
              <BookOpen className="h-4 w-4 text-purple-600" />
              Recursos Informativos para Pacientes
            </div>
            <p className="text-xs text-purple-800/90 leading-relaxed">
              En la sección <strong className="text-purple-950">"Recursos"</strong> (`/dashboard/recursos`), tienes disponible material educacional, infografías e información útil para complementar la entrega de tus planes y educar a tus pacientes de forma clara y profesional.
            </p>
          </div>
        </section>

        {/* 4. Configuraciones Clínicas */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-lg">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
              <Settings className="h-5 w-5" />
            </div>
            4. Configuraciones Clínicas Personalizadas
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Además, tienes las <strong className="text-slate-900">configuraciones clínicas</strong> para ajustar tus preferencias (unidades de medida, fórmulas de cálculo, encabezados de entregables) y que la plataforma se adapte a tus necesidades específicas.
          </p>
        </section>

        {/* 5. Asistente IA */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-lg">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <Sparkles className="h-5 w-5" />
            </div>
            5. Asistente Inteligente (Copiloto Clínico)
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            NutriNet también destaca por el uso de un asistente inteligente, que irá mejorando con el desarrollo, pero te acompaña en todo lo relacionado a creaciones de planes para agilizar el uso del tiempo.
          </p>
        </section>

        {/* 6. Futuras Funcionalidades & Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Rocket className="h-5 w-5 text-indigo-600" />
              Futuras Funcionalidades y Actualizaciones
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Puedes explorar y ver todas las funcionalidades de esta plataforma, las cuales han sido pensadas para optimizar el uso de tu tiempo, y algunos detalles que te facilitarán el trabajo.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Se vendrán muchas actualizaciones y futuras funcionalidades, desde la gestión de citas, hasta plataformas para tus pacientes. Puedes revisar en el <strong className="text-indigo-600">menú lateral izquierdo</strong> dentro de la sección <strong className="text-indigo-600">"AYUDA"</strong> cliqueando <strong className="text-indigo-600">"Futuras funciones"</strong>.
            </p>
          </div>

          <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-base">
              <MessageSquareHeart className="h-5 w-5 text-emerald-600" />
              Tu Feedback Nos Hace Crecer
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              Si quieres enviar un mensaje o sugerencia al equipo de NutriNet, puedes hacerlo desde la barra lateral dentro del módulo <strong className="text-emerald-950 font-bold">"AJUSTES"</strong> cliqueando en <strong className="text-emerald-950 font-bold">"Feedback & Soporte"</strong>. ¡Tu experiencia diaria nos orienta para agregar las mejores funciones!
            </p>
            <div className="pt-2">
              <Button
                onClick={() => router.push("/dashboard/feedback")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 flex items-center gap-2 cursor-pointer"
              >
                Enviar Feedback &rarr;
              </Button>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">¿Listo para optimizar tu consulta?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Comienza registrando tus pacientes o creando tus primeras recetas y dietas.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-6 py-3 flex items-center gap-2 cursor-pointer shrink-0"
          >
            Ir al Dashboard &rarr;
          </Button>
        </div>
      </div>
    </ModuleLayout>
  );
}
