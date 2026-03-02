"use client";

import {
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import Cookies from "js-cookie";
import { useEffect } from "react";

// API Fetcher
const fetchStats = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token =
    Cookies.get("auth_token") ||
    (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

  console.log(
    "[Dashboard] Fetching stats from:",
    `${API_URL}/metrics/admin/dashboard`,
  );
  console.log("[Dashboard] Token detected:", !!token);

  if (!token) {
    console.error("[Dashboard] No auth_token found");
    throw new Error("No se encontró sesión activa");
  }

  try {
    const res = await fetch(`${API_URL}/metrics/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("FetchStats Error Response:", res.status, errorData);
      throw new Error(errorData.message || "Error al obtener estadísticas");
    }

    return res.json();
  } catch (error) {
    console.error("FetchStats Network/Server Error:", error);
    throw error;
  }
};

function StatCard({ title, value, change, trend, icon: Icon, isLoading }: any) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="rounded-full bg-indigo-50 p-2 text-indigo-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
        ) : (
          <span className="text-2xl font-bold text-slate-900">{value}</span>
        )}

        <div className="mt-1 flex items-center text-xs">
          {trend === "up" ? (
            <span className="flex items-center text-emerald-600 font-medium my-1">
              {change ? (
                <>
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  {change}%
                </>
              ) : (
                <span className="text-slate-400 font-normal">
                  Sin datos previos
                </span>
              )}
            </span>
          ) : change ? (
            <span className="flex items-center text-red-600 font-medium my-1">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              {change}%
            </span>
          ) : (
            <span className="text-slate-400 font-normal my-1">
              Sin datos previos
            </span>
          )}
          {change && <span className="ml-1 text-slate-400">vs ayer</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  // React Query for Caching & State Management
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: fetchStats,
    refetchOnWindowFocus: false,
    staleTime: 60000 * 5, // 5 minutes cache (Client Side) matches Server Side
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const triggerCalculation = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      await fetch(`${API_URL}/metrics/force-calculate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  if (isError) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-slate-700">
          Error cargando métricas
        </h2>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const { overview, activeSubscriptions, recentUsers } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-500">
            Resumen en tiempo real (Cacheado 5min).
          </p>
        </div>
        {/* DEV ONLY BUTTON */}
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerCalculation}
          className="text-xs text-indigo-300"
        >
          <Loader2 className="h-3 w-3 mr-1" /> Actualizar (Force)
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos Totales (Hoy)"
          value={
            overview
              ? `$${Number(overview.totalRevenue).toLocaleString("es-CL")}`
              : "$0"
          }
          change={overview?.revenueGrowth?.toFixed(1)}
          trend={overview?.revenueGrowth >= 0 ? "up" : "down"}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatCard
          title="Nutricionistas Totales"
          value={overview?.totalUsers || 0}
          change={null} // TODO: Add User Growth
          trend="up"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Suscripciones Activas"
          value={activeSubscriptions || 0}
          change={null}
          trend="up"
          icon={CreditCard}
          isLoading={isLoading}
        />
        <StatCard
          title="Nuevos (24h)"
          value={overview?.newUsers || 0}
          change={null}
          trend="up"
          icon={Activity}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity / Signups */}
        <div className="col-span-4 rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-indigo-100 px-6 py-4 bg-indigo-50/30">
            <h3 className="font-semibold text-slate-900">Últimos Registros</h3>
          </div>
          <div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentUsers?.length > 0 ? (
                  recentUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
                          {user.name.charAt(0)}
                          {user.name.split(" ")[1]?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(user.joinedAt).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No hay registros recientes
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-3 rounded-xl border border-indigo-100 bg-white shadow-sm h-fit">
          <div className="border-b border-indigo-100 px-6 py-4 bg-indigo-50/30">
            <h3 className="font-semibold text-slate-900">Acciones Rapidas</h3>
          </div>
          <div className="p-6 grid gap-3">
            <button className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group bg-slate-50/50">
              <span className="font-medium text-slate-700 group-hover:text-indigo-700">
                Crear Nutricionista
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform group-hover:text-indigo-500" />
            </button>
            <button className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group bg-slate-50/50">
              <span className="font-medium text-slate-700 group-hover:text-indigo-700">
                Ver Pagos
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform group-hover:text-indigo-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
