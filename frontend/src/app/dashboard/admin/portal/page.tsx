"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  Globe2,
  Search,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

export default function AdminPortalPage() {
  const [nutritionists, setNutritionists] = useState<PortalNutritionist[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void loadNutritionists();
  }, []);

  const loadNutritionists = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const params = new URLSearchParams({ role: "NUTRITIONIST" });
      if (search.trim()) params.set("search", search.trim());

      const response = await fetchApi(`/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("No se pudieron cargar los perfiles");

      const data = await response.json();
      setNutritionists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el portal publico");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const publicCount = nutritionists.filter((n) => n.publicProfileEnabled).length;
    return {
      total: nutritionists.length,
      publicCount,
      hiddenCount: nutritionists.length - publicCount,
    };
  }, [nutritionists]);

  const filteredNutritionists = nutritionists.filter((nutritionist) => {
    if (filter === "public") return nutritionist.publicProfileEnabled;
    if (filter === "hidden") return !nutritionist.publicProfileEnabled;
    return true;
  });

  const toggleVisibility = async (nutritionist: PortalNutritionist) => {
    setIsUpdatingId(nutritionist.id);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/${nutritionist.id}/public-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          publicProfileEnabled: !nutritionist.publicProfileEnabled,
        }),
      });

      if (!response.ok) throw new Error("No se pudo actualizar el estado");

      const updated = await response.json();
      setNutritionists((prev) =>
        prev.map((item) =>
          item.id === nutritionist.id
            ? {
                ...item,
                publicProfileEnabled: Boolean(updated.publicProfileEnabled),
                publicSlug: updated.publicSlug ?? item.publicSlug,
              }
            : item,
        ),
      );

      toast.success(
        nutritionist.publicProfileEnabled
          ? "Perfil ocultado del portal publico"
          : "Perfil publicado nuevamente",
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cambiar la visibilidad");
    } finally {
      setIsUpdatingId(null);
    }
  };

  const onSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadNutritionists();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            <Globe2 className="h-3.5 w-3.5" />
            Portal publico
          </div>
          <h1 className="text-2xl font-black tracking-tight text-indigo-950">
            Publicacion de nutricionistas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Activa o oculta perfiles del directorio publico sin afectar el acceso privado del profesional.
          </p>
        </div>

        <form onSubmit={onSearchSubmit} className="flex w-full max-w-xl gap-3 lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="h-11 pl-10"
            />
          </div>
          <Button type="submit" className="h-11 px-5">
            Buscar
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <div className="text-sm text-emerald-700">Publicos</div>
          <div className="mt-1 text-2xl font-black text-emerald-900">{stats.publicCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="text-sm text-slate-500">Ocultos</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{stats.hiddenCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "public", "hidden"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === item
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item === "all" ? "Todos" : item === "public" ? "Publicos" : "Ocultos"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Cargando perfiles...
          </div>
        ) : filteredNutritionists.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
            No hay perfiles para mostrar.
          </div>
        ) : (
          filteredNutritionists.map((nutritionist) => {
            const isUpdating = isUpdatingId === nutritionist.id;

            return (
              <div
                key={nutritionist.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{nutritionist.fullName}</h2>
                    {nutritionist.publicProfileEnabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        <XCircle className="h-3.5 w-3.5" /> Oculto
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>{nutritionist.email}</span>
                    <span>{nutritionist.specialty || "Sin especialidad"}</span>
                    <span>{nutritionist.consultationMode || "online"}</span>
                    <span>{nutritionist.patientCount} pacientes</span>
                  </div>

                  {nutritionist.publicSlug && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span className="truncate">/nutricionistas/{nutritionist.publicSlug}</span>
                      <Link
                        href={`/nutricionistas/${nutritionist.publicSlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Ver publico
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}

                  <div className="text-sm text-slate-500">
                    {nutritionist.location || "Sin ubicacion"}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant={nutritionist.publicProfileEnabled ? "outline" : "default"}
                    onClick={() => toggleVisibility(nutritionist)}
                    disabled={isUpdating}
                    className="min-w-[190px]"
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : nutritionist.publicProfileEnabled ? (
                      <EyeOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    {nutritionist.publicProfileEnabled ? "Ocultar perfil" : "Publicar perfil"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
