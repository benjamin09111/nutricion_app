"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Plus, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  membershipService,
  type DiscountCodeAdmin,
} from "@/features/memberships/services/membership.service";

function money(value: number) {
  return `$${value.toLocaleString("es-CL")} CLP`;
}

export default function AdminCuponesPage() {
  const [codes, setCodes] = useState<DiscountCodeAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genType, setGenType] = useState<"NUTRI" | "BETA">("NUTRI");
  const [genCount, setGenCount] = useState(1);
  const [filterType, setFilterType] = useState<string>("");
  const [filterUsed, setFilterUsed] = useState<string>("");

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await membershipService.listDiscountCodes({
        type: filterType || undefined,
        isUsed:
          filterUsed === "true"
            ? true
            : filterUsed === "false"
              ? false
              : undefined,
      });
      setCodes(Array.isArray(result.data) ? result.data : []);
      setTotal(typeof result.total === "number" ? result.total : 0);
    } catch {
      toast.error("Error al cargar codigos");
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterUsed]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newCodes = await membershipService.generateDiscountCodes(
        genType,
        genCount,
      );
      toast.success(`${newCodes.length} codigos generados`);
      setCodes((prev) => [...newCodes, ...prev]);
    } catch (e: any) {
      toast.error(e?.message || "Error al generar codigos");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Codigos de Descuento
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} codigos en total
        </p>
      </div>

      {/* Generate section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">
          Generar codigos
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Tipo
            </label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value as "NUTRI" | "BETA")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 cursor-pointer"
            >
              <option value="NUTRI">NUTRI (50% descuento)</option>
              <option value="BETA">BETA (90% descuento)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={(e) =>
                setGenCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 w-24"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 cursor-pointer"
          >
            {isGenerating ? "Generando..." : "Generar"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
        >
          <option value="">Todos los tipos</option>
          <option value="NUTRI">NUTRI (50%)</option>
          <option value="BETA">BETA (90%)</option>
        </select>
        <select
          value={filterUsed}
          onChange={(e) => setFilterUsed(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="false">Activo</option>
          <option value="true">Usado</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          Mostrando {codes.length} de {total}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Codigo
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Descuento
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Creado por
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Usado por
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Fecha uso
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Cargando codigos...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No hay codigos. Genera el primero arriba.
                  </td>
                </tr>
              ) : (
                codes.map((c) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "transition-colors hover:bg-slate-50",
                      c.isUsed && "opacity-50",
                    )}
                  >
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700">
                        {c.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          c.type === "NUTRI"
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-bold">
                      {c.discountPercent}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          c.isUsed
                            ? "bg-slate-100 text-slate-400"
                            : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {c.isUsed ? "Usado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {c.createdBy?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {c.usedBy?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {c.usedAt
                        ? new Date(c.usedAt).toLocaleDateString("es-CL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
