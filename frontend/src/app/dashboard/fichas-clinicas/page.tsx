import Link from "next/link";
import { FileText, ArrowRight, Users } from "lucide-react";

export default function ClinicalRecordsPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">
                Fichas Clínicas
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Esta vista aún no tiene contenido operativo.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Para evitar una pantalla en blanco, dejamos una entrada clara mientras se integra el módulo completo de fichas clínicas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/pacientes"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ir a Pacientes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/consultas"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Users className="h-4 w-4" />
              Ver Consultas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
