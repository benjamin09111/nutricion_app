import { Lock, Pill, Sparkles } from "lucide-react";

export default function SupplementsPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-700">
              <Lock className="h-4 w-4" />
              Fuera del MVP
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
                Suplementos
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Este módulo estará bloqueado durante el MVP. En una fase posterior
                podrá apoyar decisiones de suplementación con criterios seguros,
                evidencia y revisión profesional.
              </p>
            </div>
          </div>
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-indigo-100">
            <Pill className="h-12 w-12" />
          </div>
        </div>
        <div className="relative z-10 mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
          <Sparkles className="mr-2 inline h-4 w-4 text-indigo-500" />
          Próximamente: criterios, alertas y registro de suplementación.
        </div>
      </section>
    </main>
  );
}
