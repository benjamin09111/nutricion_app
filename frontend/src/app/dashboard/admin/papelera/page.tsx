"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, Search, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";

interface TrashAccount {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  nutritionist?: {
    id: string;
    fullName: string;
  } | null;
}

const PAGE_SIZE = 10;

export default function AdminPapeleraPage() {
  const [accounts, setAccounts] = useState<TrashAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);

  const [purgingAccountId, setPurgingAccountId] = useState<string | null>(null);
  const [selectedPurgeAccount, setSelectedPurgeAccount] = useState<TrashAccount | null>(null);

  const [restoringAccountId, setRestoringAccountId] = useState<string | null>(null);
  const [selectedRestoreAccount, setSelectedRestoreAccount] = useState<TrashAccount | null>(null);

  const loadTrashAccounts = useCallback(
    async (pageArg = currentPage, searchArg = searchQuery) => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const query = new URLSearchParams({
          page: String(pageArg),
          limit: String(PAGE_SIZE),
        });
        if (searchArg.trim()) {
          query.set("search", searchArg.trim());
        }

        const res = await fetchApi(`/users/trash?${query.toString()}`, { headers });
        if (!res.ok) {
          throw new Error("No se pudieron cargar los elementos de la papelera");
        }

        const data = await res.json();
        setAccounts(Array.isArray(data.data) ? data.data : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (e: any) {
        toast.error(e?.message || "Error al cargar papelera");
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, searchQuery],
  );

  useEffect(() => {
    loadTrashAccounts();
  }, [loadTrashAccounts]);

  const notifySidebarUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("admin-trash-updated"));
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchApi("/users/trash/empty", {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al vaciar papelera");
      }

      const data = await res.json();
      setIsEmptyModalOpen(false);
      await loadTrashAccounts(1);
      notifySidebarUpdate();
      toast.success(data.message || "Papelera vaciada correctamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo vaciar la papelera");
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const handlePurgeAccount = async () => {
    if (!selectedPurgeAccount) return;
    setPurgingAccountId(selectedPurgeAccount.id);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchApi(`/users/trash/${selectedPurgeAccount.id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al eliminar usuario permanentemente");
      }

      setSelectedPurgeAccount(null);
      await loadTrashAccounts(currentPage);
      notifySidebarUpdate();
      toast.success("Cuenta eliminada permanentemente de la base de datos");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo eliminar la cuenta");
    } finally {
      setPurgingAccountId(null);
    }
  };

  const handleRestoreAccount = async () => {
    if (!selectedRestoreAccount) return;
    setRestoringAccountId(selectedRestoreAccount.id);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetchApi(`/users/trash/${selectedRestoreAccount.id}/restore`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al restaurar cuenta");
      }

      setSelectedRestoreAccount(null);
      await loadTrashAccounts(currentPage);
      notifySidebarUpdate();
      toast.success("Cuenta restaurada exitosamente");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo restaurar la cuenta");
    } finally {
      setRestoringAccountId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTrashAccounts(1, searchQuery);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(total, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-rose-600" />
            Papelera de Reciclaje
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? "elemento eliminado" : "elementos eliminados"} en total
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setIsEmptyModalOpen(true)}
          disabled={total === 0 || isLoading}
          className="inline-flex h-11 items-center gap-2 rounded-xl border-rose-200 bg-rose-50 px-4 text-xs font-black uppercase tracking-widest text-rose-700 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          Vaciar papelera
        </Button>
      </div>

      {/* Alert note */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">Información sobre elementos eliminados</p>
          <p className="leading-relaxed text-amber-900/90">
            Las cuentas en la papelera están desactivadas y sus RUTs han sido liberados de inmediato. Puedes{" "}
            <span className="font-bold text-emerald-800">Restaurarlas</span> o{" "}
            <span className="font-bold text-rose-800">Vaciar la papelera</span> para borrarlas permanentemente de PostgreSQL sin dejar rastro.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por correo o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </form>
        <span className="text-xs text-slate-400">
          Mostrando {startItem}-{endItem} de {total}
        </span>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Usuario
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Nombre
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Rol
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Fecha Registro
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Cargando papelera...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Trash2 className="h-8 w-8 text-slate-300" />
                      <p className="font-bold text-slate-600">La papelera está vacía</p>
                      <p className="text-xs text-slate-400">No hay cuentas eliminadas actualmente.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {acc.email}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {acc.nutritionist?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {acc.createdAt
                        ? new Date(acc.createdAt).toLocaleDateString("es-CL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRestoreAccount(acc)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer"
                          title="Restaurar cuenta"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPurgeAccount(acc)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Purga final
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

      {/* Confirmation Modal - Vaciar Papelera */}
      <ConfirmationModal
        isOpen={isEmptyModalOpen}
        onClose={() => setIsEmptyModalOpen(false)}
        onConfirm={handleEmptyTrash}
        title="¿Vaciar la papelera de reciclaje?"
        description="Esta acción eliminará PERMANENTEMENTE de la base de datos todas las cuentas eliminadas y sus registros vinculados. Esta acción no se puede deshacer."
        confirmText={isEmptyingTrash ? "Vaciando..." : "Sí, vaciar papelera"}
        cancelText="Cancelar"
        variant="danger"
        isLoading={isEmptyingTrash}
      />

      {/* Confirmation Modal - Purga individual */}
      <ConfirmationModal
        isOpen={!!selectedPurgeAccount}
        onClose={() => setSelectedPurgeAccount(null)}
        onConfirm={handlePurgeAccount}
        title="¿Eliminar permanentemente esta cuenta?"
        description={`Se borrarán de forma irrecuperable todos los datos vinculados a ${selectedPurgeAccount?.email || "este usuario"}.`}
        confirmText={purgingAccountId ? "Eliminando..." : "Eliminar permanentemente"}
        cancelText="Cancelar"
        variant="danger"
        isLoading={!!purgingAccountId}
      />

      {/* Confirmation Modal - Restaurar individual */}
      <ConfirmationModal
        isOpen={!!selectedRestoreAccount}
        onClose={() => setSelectedRestoreAccount(null)}
        onConfirm={handleRestoreAccount}
        title="¿Restaurar esta cuenta?"
        description={`La cuenta de ${selectedRestoreAccount?.email || "este usuario"} volverá a estar ACTIVA y podrá iniciar sesión.`}
        confirmText={restoringAccountId ? "Restaurando..." : "Sí, restaurar cuenta"}
        cancelText="Cancelar"
        variant="success"
        isLoading={!!restoringAccountId}
      />
    </div>
  );
}
