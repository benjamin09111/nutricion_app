"use client";

import exchangePortionGuide from "@/content/exchange-portions.json";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { Button } from "@/components/ui/Button";
import { ClipboardCheck, Download, ShieldCheck, Table2 } from "lucide-react";
import { toast } from "sonner";

type ExchangePortionRow = {
  category: string;
  portion: string;
  notes?: string;
};

const rows = Array.isArray(exchangePortionGuide)
  ? (exchangePortionGuide as ExchangePortionRow[])
  : [];

export default function ExchangePortionsPage() {
  const handleInspectJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
      toast.success("JSON oficial copiado al portapapeles.");
    } catch {
      toast.info("No se pudo copiar el JSON, pero la tabla sigue visible.");
    }
  };

  return (
    <ModuleLayout
      title="Porciones de Intercambio"
      description="Fuente oficial para revisar equivalencias, validar porciones y alimentar el entregable principal."
      step={{
        number: 4,
        label: "Herramientas",
        icon: ClipboardCheck,
        color: "text-indigo-600",
      }}
      footer={
        <ModuleFooter>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              JSON oficial
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
              <Table2 className="h-4 w-4 text-slate-400" />
              {rows.length} filas cargadas
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleInspectJson} className="h-12 rounded-[2rem] border-slate-200 font-semibold">
              <Download className="mr-2 h-4 w-4" />
              Copiar JSON
            </Button>
          </div>
        </ModuleFooter>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-600">Herramienta oficial</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Tabla de porciones de intercambio</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
                Este módulo te permite verificar el JSON fuente antes de usarlo en el entregable principal o en los bloques de recetas.
              </p>
            </div>
            <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50 px-6 py-4 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-700">Filas</p>
              <p className="text-3xl font-semibold text-indigo-600">{rows.length}</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Categoria</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Porción</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Notas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <p className="font-semibold text-slate-700">{row.category}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm font-medium text-slate-600">{row.portion}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm font-medium text-slate-400 italic">{row.notes || "Verificar con fuente oficial"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-8 rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">Checklist</p>
            <h3 className="mt-2 text-xl font-semibold">Antes de usarla en el entregable</h3>
          </div>
          <div className="space-y-4">
            <div className="rounded-[2rem] bg-white/5 p-6 border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">1. Verificar</p>
              <p className="mt-1 text-sm text-slate-300 font-medium">Revisa que cada categoría tenga una porción clara y sin ambigüedades.</p>
            </div>
            <div className="rounded-[2rem] bg-white/5 p-6 border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">2. Mantener</p>
              <p className="mt-1 text-sm text-slate-300 font-medium">Si actualizas el JSON, el entregable principal lo leerá desde la misma fuente.</p>
            </div>
            <div className="rounded-[2rem] bg-white/5 p-6 border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">3. Reusar</p>
              <p className="mt-1 text-sm text-slate-300 font-medium">Esta tabla también sirve como referencia para Rápido - Entregable y el bloque de porciones del PDF.</p>
            </div>
          </div>
        </aside>
      </div>
    </ModuleLayout>
  );
}
