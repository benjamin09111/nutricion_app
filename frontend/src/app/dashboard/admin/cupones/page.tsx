"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import {
  membershipService,
  type DiscountCodeAdmin,
} from "@/features/memberships/services/membership.service";
import { DISCOUNT_OPTIONS } from "@/features/memberships/constants/discount-options";

const PAGE_SIZE = 8;

export default function AdminCuponesPage() {
  const [codes, setCodes] = useState<DiscountCodeAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genType, setGenType] = useState<"NUTRI" | "BETA">("NUTRI");
  const [genCount, setGenCount] = useState(1);
  const [filterType, setFilterType] = useState<string>("");
  const [filterUsed, setFilterUsed] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const clampCount = (value: number) => Math.min(100, Math.max(1, value));

  const loadCodes = useCallback(async (pageArg = currentPage) => {
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
        start: (pageArg - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        includeArchived: showArchived,
      });

      setCodes(Array.isArray(result.data) ? result.data : []);
      setTotal(typeof result.total === "number" ? result.total : 0);
    } catch {
      toast.error("Error al cargar codigos");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterUsed, showArchived]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await membershipService.generateDiscountCodes(
        genType,
        genCount,
      );
      const newCodes = Array.isArray(result)
        ? result
        : Array.isArray((result as { data?: DiscountCodeAdmin[] })?.data)
          ? (result as { data: DiscountCodeAdmin[] }).data
          : [];

      if (currentPage === 1) {
        await loadCodes(1);
      } else {
        setCurrentPage(1);
      }
      toast.success(`${newCodes.length} codigos generados`);
    } catch (e: any) {
      toast.error(e?.message || "Error al generar codigos");
    } finally {
      setIsGenerating(false);
    }
  };

  const decrementCount = () => setGenCount((current) => clampCount(current - 1));
  const incrementCount = () => setGenCount((current) => clampCount(current + 1));

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleFilterUsedChange = (value: string) => {
    setFilterUsed(value);
    setCurrentPage(1);
  };

  const handleToggleArchived = () => {
    setShowArchived((current) => !current);
    setCurrentPage(1);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copiado al portapapeles");
  };

  const handleArchiveUsed = async () => {
    setIsArchiving(true);
    try {
      const result = await membershipService.archiveUsedDiscountCodes();
      setIsArchiveModalOpen(false);
      if (currentPage === 1) {
        await loadCodes(1);
      } else {
        setCurrentPage(1);
      }
      toast.success(`${result.archivedCount} cupones archivados`);
    } catch (e: any) {
      toast.error(e?.message || "Error al archivar cupones");
    } finally {
      setIsArchiving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(total, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <div className="shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Codigos de Descuento
        </h1>
        <p className="mt-1 text-sm text-slate-500">{total} codigos en total</p>
      </div>

      <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
          Generar codigos
        </h2>
        <div className="grid gap-4 md:grid-cols-[220px_170px_auto] md:items-end">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Tipo
            </label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value as "NUTRI" | "BETA")}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900"
            >
              {DISCOUNT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Cantidad
            </label>
            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={decrementCount}
                disabled={genCount <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                aria-label="Disminuir cantidad"
              >
                -
              </button>
              <span className="min-w-10 px-3 text-center text-sm font-black text-slate-900 tabular-nums">
                {genCount}
              </span>
              <button
                type="button"
                onClick={incrementCount}
                disabled={genCount >= 100}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-11 rounded-xl bg-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 cursor-pointer md:w-fit"
          >
            {isGenerating ? "Generando..." : "Generar"}
          </Button>
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => handleFilterTypeChange(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
        >
          <option value="">Todos los tipos</option>
          {DISCOUNT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.shortLabel}
            </option>
          ))}
        </select>
        <select
          value={filterUsed}
          onChange={(e) => handleFilterUsedChange(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
        >
          <option value="">Todos los estados</option>
          <option value="false">Activo</option>
          <option value="true">Usado</option>
        </select>
        <button
          type="button"
          onClick={handleToggleArchived}
          className={cn(
            "rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer",
            showArchived
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          Ver archivados
        </button>
        <span className="ml-auto text-xs text-slate-400">
          Mostrando {startItem}-{endItem} de {total}
        </span>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        <Button
          variant="outline"
          onClick={() => setIsArchiveModalOpen(true)}
          className="h-10 rounded-xl border-slate-200 px-4 text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer"
        >
          Archivar usados
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
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
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    Cargando codigos...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No hay codigos. Genera el primero arriba.
                  </td>
                </tr>
              ) : (
                codes.map((c) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "transition-colors hover:bg-slate-50",
                      c.archivedAt && "opacity-40",
                      !c.archivedAt && c.isUsed && "opacity-50",
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
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {c.discountPercent}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          c.archivedAt
                            ? "bg-slate-100 text-slate-500"
                            : c.isUsed
                              ? "bg-slate-100 text-slate-400"
                              : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {c.archivedAt ? "Archivado" : c.isUsed ? "Usado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.createdBy?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.usedBy?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
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
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
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

        <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveUsed}
        title="Archivar cupones usados"
        description="Los cupones usados se marcarán como archivados y dejarán de mostrarse por defecto. Seguirán disponibles para auditoría e historial."
        confirmText={isArchiving ? "Archivando..." : "Archivar"}
        cancelText="Cancelar"
        variant="warning"
        isLoading={isArchiving}
      />
    </div>
  );
}
