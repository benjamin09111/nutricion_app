"use client";

import React from "react";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Users,
  Apple,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ModuleLayout } from "@/components/shared/ModuleLayout";

export default function UsoRecomendadoPage() {
  const router = useRouter();

  return (
    <ModuleLayout
      title="Uso Recomendado de NutriNet"
      description={
        <p className="text-sm text-slate-500">
          Guía práctica y documentación paso a paso para maximizar el rendimiento clínico de tu consulta nutricional.
        </p>
      }
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Banner Hero */}
        <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-emerald-900 text-white shadow-xl">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              Guía Oficial de Inicio
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Bienvenido a NutriNet: Tu Asistente Clínico Inteligente
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed font-medium">
              Diseñado para nutricionistas en Chile. Aprende cómo configurar tu cuenta, gestionar pacientes, crear dietas y automatizar entregables en minutos.
            </p>
          </div>
        </div>

        {/* Index Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="#planes"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">1. Planes y Límites</h3>
              <p className="text-[11px] text-slate-500">Freemium vs Pro y activaciones</p>
            </div>
          </a>

          <a
            href="#pacientes"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">2. Pacientes & Fichas</h3>
              <p className="text-[11px] text-slate-500">Importación y ficha clínica</p>
            </div>
          </a>

          <a
            href="#dietas"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">3. Módulo Dietas</h3>
              <p className="text-[11px] text-slate-500">Plantillas por categorías</p>
            </div>
          </a>

          <a
            href="#entregables"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">4. Entregables Personalizados</h3>
              <p className="text-[11px] text-slate-500">Flujo completo Dieta &rarr; PDF</p>
            </div>
          </a>

          <a
            href="#naty"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">5. Copiloto Naty</h3>
              <p className="text-[11px] text-slate-500">Asistencia clínica en tiempo real</p>
            </div>
          </a>

          <a
            href="#configuracion"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">6. Configuración Técnica</h3>
              <p className="text-[11px] text-slate-500">Recursos y personalización</p>
            </div>
          </a>
        </div>

        {/* Section 1: Planes */}
        <section id="planes" className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-lg">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            1. Gestión de Planes y Membresías
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            NutriNet cuenta con una modalidad **Freemium** para comenzar a trabajar de inmediato y planes **PRO / ENTERPRISE** para nutricionistas que requieren creaciones ilimitadas, automatizaciones con IA y sincronización de agenda.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Plan Freemium (Gratuito)
              </span>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Hasta 3 pacientes activos en sistema.</li>
                <li>• Creación de hasta 6 pautas / recetas guardadas.</li>
                <li>• 4 llamadas de prueba al copiloto de IA.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Planes Pagados (PRO / Enterprise)
              </span>
              <ul className="text-xs text-emerald-700 space-y-1 font-medium">
                <li>• Pacientes y creaciones clínicas ILIMITADAS.</li>
                <li>• Acceso ilimitado al Copiloto Naty.</li>
                <li>• Exportación de PDFs profesionales con tu marca.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Pacientes */}
        <section id="pacientes" className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-lg">
            <Users className="h-5 w-5 text-indigo-600" />
            2. Ficha Clínica y Registro de Pacientes
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            En la sección **Pacientes** (`/dashboard/pacientes`), puedes registrar nuevos perfiles con sus datos antropométricos (edad, peso, estatura, IMC, GET) y agregar sus restricciones alimenticias (gluten, lactosa) o clínicas (Diabetes, Hipertensión).
          </p>
        </section>

        {/* Section 3: Dietas */}
        <section id="dietas" className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-lg">
            <Apple className="h-5 w-5 text-indigo-600" />
            3. Módulo Dietas: Plantillas por Categorías
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Utiliza el módulo **Dietas** (`/dashboard/dietas`) para crear estructuras alimenticias generales (clasificadas por lácteos, cereales, carnes, frutas, etc.) **sin necesidad de asignar a un paciente específico**. Guarda estas dietas como plantillas para reutilizarlas en entregables de múltiples pacientes.
          </p>
        </section>

        {/* Section 4: Entregables */}
        <section id="entregables" className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
            4. Entregables Personalizados (Flujo Integrado)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            El módulo **Entregables personalizados** (`/dashboard/dieta`) es la herramienta estrella para construir planes integrales. Sigue el flujo paso a paso:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
              <span className="text-xs font-black text-indigo-700 block">Paso 1: Dieta</span>
              <span className="text-[10px] text-slate-500">Importa o crea la dieta</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-xs font-black text-emerald-700 block">Paso 2: Recetas</span>
              <span className="text-[10px] text-slate-500">Distribuye platos por bloques</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <span className="text-xs font-black text-amber-700 block">Paso 3: Carrito</span>
              <span className="text-[10px] text-slate-500">Genera lista de compras</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
              <span className="text-xs font-black text-purple-700 block">Paso 4: Exportación</span>
              <span className="text-[10px] text-slate-500">Descarga PDF final</span>
            </div>
          </div>
        </section>

        {/* Section 5: Naty AI */}
        <section id="naty" className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-lg">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            5. Copiloto Clínico Naty
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Naty la Nutria es tu asistente virtual clínica. Al interactuar con el chat de Naty o presionar el botón de generación asistida, el sistema considera automáticamente las restricciones clínicas y el contexto del paciente seleccionado.
          </p>
        </section>

        {/* CTA Bottom */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">¿Listo para comenzar a trabajar?</h3>
            <p className="text-xs text-slate-400 mt-1">Dirígete al panel principal para iniciar tu primera consulta.</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-6 py-2.5 flex items-center gap-2"
          >
            Ir al Dashboard &rarr;
          </Button>
        </div>
      </div>
    </ModuleLayout>
  );
}
