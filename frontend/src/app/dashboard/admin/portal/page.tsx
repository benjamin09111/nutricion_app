"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  Globe2,
  Search,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchApi } from "@/lib/api-base";

type PortalNutritionist = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  patientCount: number;
  publicSlug: string | null;
  publicProfileEnabled: boolean;
  specialty: string | null;
  consultationMode: string | null;
  location: string | null;
  avatarUrl: string | null;
};

type VisibilityFilter = "all" | "public" | "hidden";

type PaginatedResponse = {
  items: PortalNutritionist[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type VisibilityAction = {
  nutritionist: PortalNutritionist;
  enabled: boolean;
};

const PAGE_SIZE = 10;

export default function AdminPortalPage() {
  const [nutritionists, setNutritionists] = useState<PortalNutritionist[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<VisibilityAction | null>(null);

  useEffect(() => {
    void loadNutritionists(1, "", "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeaders = () => {
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
  };

  const loadNutritionists = async (
    page = currentPage,
    searchValue = search,
    visibility = filter,
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        role: "NUTRITIONIST",
        page: String(page),
        limit: String(PAGE_SIZE),
        visibility,
      });

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      const response = await fetchApi(`/users?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los perfiles");
      }

      const data = (await response.json()) as PaginatedResponse | PortalNutritionist[];
      const items = Array.isArray(data) ? data : data.items || [];

      setNutritionists(items);
      setCurrentPage(Array.isArray(data) ? page : data.page || page);
      setTotal(Array.isArray(data) ? items.length : data.total || 0);
      setTotalPages(Array.isArray(data) ? 1 : data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el portal publico");
      setNutritionists([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchInput);
    await loadNutritionists(1, searchInput, filter);
  };

  const handleFilterChange = async (nextFilter: VisibilityFilter) => {
    setFilter(nextFilter);
    await loadNutritionists(1, search, nextFilter);
  };

  const openVisibilityModal = (nutritionist: PortalNutritionist) => {
    setPendingAction({
      nutritionist,
      enabled: !nutritionist.publicProfileEnabled,
    });
  };

  const confirmVisibilityChange = async () => {
    if (!pendingAction) return;

    setIsUpdatingId(pendingAction.nutritionist.id);
    try {
      const response = await fetchApi(`/users/${pendingAction.nutritionist.id}/public-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          publicProfileEnabled: pendingAction.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el estado");
      }

      toast.success(
        pendingAction.enabled ? "Perfil publicado" : "Perfil ocultado del portal",
      );
      setPendingAction(null);
      await loadNutritionists(currentPage, search, filter);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cambiar la visibilidad");
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await loadNutritionists(page, search, filter);
  };

  const pendingNutritionist = pendingAction?.nutritionist ?? null;
  const nextStateLabel = pendingAction?.enabled ? "publicar" : "despublicar";

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            <Globe2 className="h-3.5 w-3.5" />
            Portal publico
          </div>
          <h1 className="text-2xl font-black tracking-tight text-indigo-950">
            Publicacion de nutricionistas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Gestiona el acceso publico de cada nutricionista con confirmacion y aviso por correo.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl gap-3 lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="h-11 pl-10"
            />
          </div>
          <Button type="submit" className="h-11 px-5">
            Buscar
          </Button>
        </form>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {(["all", "public", "hidden"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => void handleFilterChange(item)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === item
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item === "all" ? "Todos" : item === "public" ? "Publicos" : "Ocultos"}
          </button>
        ))}
        <div className="ml-auto text-sm text-slate-500">
          {total} resultados
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nutricionista
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Especialidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Contacto
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando perfiles...
                    </span>
                  </td>
                </tr>
              ) : nutritionists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No hay perfiles para mostrar.
                  </td>
                </tr>
              ) : (
                nutritionists.map((nutritionist) => {
                  const isUpdating = isUpdatingId === nutritionist.id;

                  return (
                    <tr key={nutritionist.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{nutritionist.fullName}</div>
                          <div className="truncate text-sm text-slate-500">{nutritionist.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {nutritionist.specialty || "Sin especialidad"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            nutritionist.publicProfileEnabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {nutritionist.publicProfileEnabled ? "Publicado" : "Oculto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>{nutritionist.consultationMode || "online"}</div>
                        <div>{nutritionist.patientCount} pacientes</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openVisibilityModal(nutritionist)}
                            disabled={isUpdating}
                            title={nutritionist.publicProfileEnabled ? "Despublicar perfil" : "Publicar perfil"}
                            aria-label={nutritionist.publicProfileEnabled ? "Despublicar perfil" : "Publicar perfil"}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : nutritionist.publicProfileEnabled ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>

                          {nutritionist.publicSlug ? (
                            <Link
                              href={`/nutricionistas/${nutritionist.publicSlug}`}
                              target="_blank"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                              title="Ver perfil publico"
                              aria-label="Ver perfil publico"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span
                              className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-300"
                              title="Sin perfil publico"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            Mostrando {nutritionists.length} de {total} resultados
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => void handlePageChange(page)}
          />
        </div>
      </section>

      <ConfirmationModal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={() => void confirmVisibilityChange()}
        title={
          pendingAction?.enabled
            ? "Publicar perfil"
            : "Despublicar perfil"
        }
        description={
          pendingNutritionist
            ? `Vas a ${nextStateLabel} el perfil de ${pendingNutritionist.fullName}. Se enviara un correo al nutricionista avisando este cambio.`
            : ""}
        confirmText={pendingAction?.enabled ? "Publicar" : "Despublicar"}
        cancelText="Cancelar"
        variant={pendingAction?.enabled ? "primary" : "warning"}
        isLoading={Boolean(pendingAction && isUpdatingId === pendingAction.nutritionist.id)}
      />
    </main>
  );
}
