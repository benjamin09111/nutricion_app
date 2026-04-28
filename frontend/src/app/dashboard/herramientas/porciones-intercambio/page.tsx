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
        color: "text-emerald-600",
      }}
      footer={
        <ModuleFooter>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              JSON oficial
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">
              <Table2 className="h-4 w-4 text-slate-400" />
              {rows.length} filas cargadas
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleInspectJson} className="h-12 rounded-2xl border-slate-200">
              <Download className="mr-2 h-4 w-4" />
              Copiar JSON
            </Button>
          </div>
        </ModuleFooter>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Herramienta oficial</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Tabla de porciones de intercambio</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Este módulo te permite verificar el JSON fuente antes de usarlo en el entregable principal o en los bloques de recetas.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Filas</p>
              <p className="text-3xl font-black text-emerald-600">{rows.length}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Categoria</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Porción</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Notas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-4 align-top">
                      <p className="font-black text-slate-900">{row.category}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm text-slate-700">{row.portion}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm text-slate-500">{row.notes || "Verificar con fuente oficial"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">Checklist</p>
            <h3 className="mt-2 text-xl font-black">Antes de usarla en el entregable</h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">1. Verificar</p>
              <p className="mt-1 text-sm text-slate-200">Revisa que cada categoría tenga una porción clara y sin ambigüedades.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">2. Mantener</p>
              <p className="mt-1 text-sm text-slate-200">Si actualizas el JSON, el entregable principal lo leerá desde la misma fuente.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">3. Reusar</p>
              <p className="mt-1 text-sm text-slate-200">Esta tabla también sirve como referencia para Rápido - Entregable y el bloque de porciones del PDF.</p>
            </div>
          </div>
        </aside>
      </div>
    </ModuleLayout>
  );
}
