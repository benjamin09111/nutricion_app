"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Clock3, Eye, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";

type CountItem = { key: string; count: number };
type AnalyticsResponse = {
  range: { days: number; since: string };
  overview: { totalEvents: number; activeUsers: number; guestSessions: number; averageSessionMs: number };
  topRoutes: CountItem[];
  topEvents: CountItem[];
  dailyActivity: CountItem[];
  featureUsage: CountItem[];
  unusedFeatures: { key: string; label: string }[];
  recentActivity: {
    id: string;
    eventName: string;
    path: string | null;
    actor: { name: string; email: string | null; role: string | null };
    createdAt: string;
  }[];
};

async function getAnalytics() {
  const response = await fetchApi("/metrics/admin/product-analytics?days=30");
  if (!response.ok) throw new Error("No se pudo cargar la analítica");
  return (await response.json()) as AnalyticsResponse;
}

function CountList({ title, items }: { title: string; items: CountItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin actividad todavía.</p>
        ) : items.slice(0, 8).map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate text-slate-600">{item.key}</span>
            <span className="font-bold text-indigo-700">{item.count.toLocaleString("es-CL")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProductAnalyticsClient() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-product-analytics"],
    queryFn: getAnalytics,
    staleTime: 60_000,
  });

  return (
    <ModuleLayout
      title="Analítica de uso"
      description="Control operativo de la demo y de las cuentas autenticadas, sin enviar datos clínicos a herramientas de producto."
      rightContent={<Button variant="outline" size="sm" onClick={() => void refetch()}>Actualizar</Button>}
    >
      {isLoading && <p className="text-sm text-slate-500">Cargando métricas…</p>}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          No se pudo cargar la analítica. Revisa permisos y vuelve a intentar.
        </div>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { label: "Eventos registrados", value: data.overview.totalEvents, icon: Activity },
              { label: "Usuarios activos", value: data.overview.activeUsers, icon: Users },
              { label: "Sesiones invitadas", value: data.overview.guestSessions, icon: Eye },
              { label: "Tiempo medio", value: `${Math.round(data.overview.averageSessionMs / 1000)} s`, icon: Clock3 },
            ] satisfies { label: string; value: string | number; icon: LucideIcon }[]).map(({ label, value, icon: MetricIcon }) => {
              return (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <MetricIcon className="h-5 w-5 text-indigo-600" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <CountList title="Rutas más utilizadas" items={data.topRoutes} />
            <CountList title="Funciones y eventos" items={data.topEvents} />
            <CountList title="Actividad diaria" items={data.dailyActivity} />
            <CountList title="Uso por módulo" items={data.featureUsage} />
          </div>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base sm:text-lg font-extrabold text-amber-950">Funciones sin actividad</h2>
            <p className="mt-1 text-sm text-amber-800">Útil para detectar módulos que necesitan mejoras o mejor visibilidad.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.unusedFeatures.length ? data.unusedFeatures.map((feature) => (
                <span key={feature.key} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm">{feature.label}</span>
              )) : <span className="text-sm text-amber-800">Todas las funciones registradas tuvieron actividad.</span>}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base sm:text-lg font-extrabold text-slate-900">Actividad reciente</h2></div>
            <div className="divide-y divide-slate-100">
              {data.recentActivity.map((event) => (
                <div key={event.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div><span className="font-semibold text-slate-900">{event.actor.name}</span><span className="ml-2 text-slate-500">{event.eventName} · {event.path}</span></div>
                  <time className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString("es-CL")}</time>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </ModuleLayout>
  );
}
