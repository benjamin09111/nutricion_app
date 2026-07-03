"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
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
  const [filterUsed, setFilterUsed] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [updatingCodeId, setUpdatingCodeId] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<DiscountCodeAdmin | null>(null);
  const [statusCode, setStatusCode] = useState<DiscountCodeAdmin | null>(null);

  const clampCount = (value: number) => Math.min(100, Math.max(1, value));

  const loadCodes = useCallback(async (pageArg = currentPage) => {
    setIsLoading(true);
    try {
      const result = await membershipService.listDiscountCodes({
        status:
          filterUsed === "shared"
            ? "SHARED"
            : filterUsed === "expired"
              ? "EXPIRED"
              : filterUsed === "active"
                ? "ACTIVE"
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
  }, [currentPage, filterUsed, showArchived]);

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

  const getCodeStatus = (code: DiscountCodeAdmin) =>
    code.archivedAt ? "ARCHIVED" : code.status || (code.isUsed ? "EXPIRED" : "ACTIVE");

  const truncateLabel = (value?: string | null) => {
    const text = value || "—";
    if (text === "—") return text;
    return text.length > 9 ? `${text.slice(0, 9)}...` : text;
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

  const handleSetCodeStatus = async (codeId: string, status: "SHARED" | "EXPIRED") => {
    setUpdatingCodeId(codeId);
    try {
      await membershipService.setDiscountCodeStatus(codeId, status);
      setStatusCode(null);
      await loadCodes(currentPage);
      toast.success(status === "SHARED" ? "Cupón marcado como compartido" : "Cupón expirado correctamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar cupón");
    } finally {
      setUpdatingCodeId(null);
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
          value={filterUsed}
          onChange={(e) => handleFilterUsedChange(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="shared">Compartido</option>
          <option value="expired">Expirado</option>
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
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                    Cargando codigos...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                    <td
                      colSpan={7}
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
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {c.discountPercent}%
                    </td>
                    <td className="px-4 py-3">
                      {getCodeStatus(c) === "ARCHIVED" ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Archivado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatusCode(c)}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer",
                            getCodeStatus(c) === "SHARED"
                              ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
                              : getCodeStatus(c) === "EXPIRED"
                                ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                          )}
                          title="Cambiar estado"
                        >
                          {updatingCodeId === c.id
                            ? "Guardando..."
                            : getCodeStatus(c) === "SHARED"
                              ? "Compartido"
                              : getCodeStatus(c) === "EXPIRED"
                                ? "Expirado"
                                : "Activo"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span title={c.createdBy?.email || "—"}>
                        {truncateLabel(c.createdBy?.email)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span title={c.usedBy?.email || "—"}>
                        {truncateLabel(c.usedBy?.email)}
                      </span>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                          aria-label="Copiar cupón"
                          title="Copiar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedCode(c)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                          aria-label="Ver detalle"
                          title="Ver detalle"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
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

      <Modal
        isOpen={!!selectedCode}
        onClose={() => setSelectedCode(null)}
        title="Detalle del cupón"
        className="max-w-2xl"
      >
        {selectedCode && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{selectedCode.code}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descuento</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{selectedCode.discountPercent}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {getCodeStatus(selectedCode) === "ARCHIVED"
                  ? "Archivado"
                  : getCodeStatus(selectedCode) === "SHARED"
                    ? "Compartido"
                    : getCodeStatus(selectedCode) === "EXPIRED"
                      ? "Expirado"
                      : "Activo"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{selectedCode.type}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Creado por</p>
              <p className="mt-1 text-sm font-bold text-slate-900 break-all">{selectedCode.createdBy?.email || "—"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usado por</p>
              <p className="mt-1 text-sm font-bold text-slate-900 break-all">{selectedCode.usedBy?.email || "—"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha uso</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {selectedCode.usedAt
                  ? new Date(selectedCode.usedAt).toLocaleString("es-CL")
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archivado</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {selectedCode.archivedAt ? new Date(selectedCode.archivedAt).toLocaleString("es-CL") : "—"}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!statusCode}
        onClose={() => setStatusCode(null)}
        title="Cambiar estado"
        className="max-w-md"
      >
        {statusCode && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {statusCode.code}
            </p>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => void handleSetCodeStatus(statusCode.id, "SHARED")}
                disabled={updatingCodeId === statusCode.id}
                className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm font-bold text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Compartido
              </button>
              <button
                type="button"
                onClick={() => void handleSetCodeStatus(statusCode.id, "EXPIRED")}
                disabled={updatingCodeId === statusCode.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Expirado
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
