"use client";

import {
  Sparkles,
  Bot,
  Dumbbell,
  ReceiptText,
  ShoppingCart,
  Pill,
  CalendarClock,
  Users,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const updates = [
  {
    title: "Portal de nutricionistas",
    description:
      "Un espacio dedicado para gestionar pacientes, seguimiento y trabajo diario con más velocidad.",
    icon: Users,
    tone: "indigo",
  },
  {
    title: "Boletas SII",
    description:
      "Emisión y orden tributario desde el flujo profesional, sin salir del dashboard.",
    icon: ReceiptText,
    tone: "emerald",
  },
  {
    title: "Deporte y ejercicio",
    description:
      "Rutinas, recomendaciones y apoyo para integrar actividad física al plan nutricional.",
    icon: Dumbbell,
    tone: "rose",
  },
  {
    title: "Pagos por consultas",
    description: "Cobros y pagos a nutricionistas más claros, simples y trazables.",
    icon: Wallet,
    tone: "amber",
  },
  {
    title: "Chatbot para pacientes",
    description:
      "Respuestas rápidas para dudas frecuentes y acompañamiento entre consultas.",
    icon: Bot,
    tone: "violet",
  },
  {
    title: "Integración con supermercados",
    description:
      "Precios, stock y lista de compras conectados con supermercados aliados.",
    icon: ShoppingCart,
    tone: "teal",
  },
  {
    title: "Suplementos de salud y fitness",
    description:
      "Catálogo curado para recomendar suplementos con foco clínico y deportivo.",
    icon: Pill,
    tone: "sky",
  },
  {
    title: "Citas con Google Calendar",
    description:
      "Agenda coordinada para organizar controles y recordatorios automáticamente.",
    icon: CalendarClock,
    tone: "slate",
  },
] as const;

const toneStyles: Record<string, { bg: string; icon: string; ring: string }> = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    ring: "border-indigo-100 hover:border-indigo-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    ring: "border-emerald-100 hover:border-emerald-200",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    ring: "border-rose-100 hover:border-rose-200",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    ring: "border-amber-100 hover:border-amber-200",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    ring: "border-violet-100 hover:border-violet-200",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "text-teal-600",
    ring: "border-teal-100 hover:border-teal-200",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "text-sky-600",
    ring: "border-sky-100 hover:border-sky-200",
  },
  slate: {
    bg: "bg-slate-50",
    icon: "text-slate-600",
    ring: "border-slate-200 hover:border-slate-300",
  },
};

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <section className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto max-w-7xl px-3 py-12 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Futuras funciones y actualizaciones
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Lo que viene para tu flujo clínico
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Estamos construyendo nuevas herramientas para ahorrar tiempo, automatizar tareas y hacer tu trabajo diario más fluido.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-3 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {updates.map((item) => {
            const styles = toneStyles[item.tone];

            return (
              <article
                key={item.title}
                className={cn(
                  "group rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                  styles.ring,
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      styles.bg,
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", styles.icon)} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <h2 className="min-w-0 text-sm font-semibold leading-6 text-slate-900">
                        {item.title}
                      </h2>
                      <span className="inline-flex w-fit shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Próximo
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500">
                Priorización continua
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Tus ideas ayudan a definir lo siguiente
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Si quieres sugerir una función nueva, déjala en feedback y la priorizamos con el equipo.
              </p>
            </div>

            <Link
              href="/dashboard/feedback"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Enviar sugerencia
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
