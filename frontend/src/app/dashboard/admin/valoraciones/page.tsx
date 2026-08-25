"use client";

import React, { useEffect, useState } from "react";
import {
  Star,
  Sparkles,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingStats {
  totalCount: number;
  averageStars: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  ratings: Array<{
    id: string;
    stars: number;
    comment: string | null;
    createdAt: string;
  }>;
}

export default function AdminValoracionesPage() {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/ratings/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("No se pudieron cargar las estadísticas de valoración.");
      }
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats?.totalCount || 0;
  const avg = stats?.averageStars || 0;
  const dist = stats?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const positiveCount = dist[4] + dist[5];
  const positivePercentage = total > 0 ? Math.round((positiveCount / total) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              Gestión Admin CSAT
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Valoraciones de Usuarios
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Métricas consolidadas e historial anónimo de calificaciones recibidas en NutriNet.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent("open-app-rating"))}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Star className="h-4 w-4 fill-white" />
              Probar Popover Valoración
            </Button>
            <Button
              onClick={fetchStats}
              disabled={isLoading}
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Actualizar datos
            </Button>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Promedio General */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Promedio General
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-slate-900">{avg}</span>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-4 w-4",
                    s <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-slate-200",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Total Respuestas */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total de Valoraciones
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{total}</span>
              <span className="text-xs text-slate-500 font-bold">respuestas</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">1 valoración por usuario</p>
          </div>

          {/* Satisfacción Positiva */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Satisfacción Positiva
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-600">{positivePercentage}%</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium pt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Nutricionistas conformes (4-5★)
            </p>
          </div>
        </div>

        {/* Desglose por Estrellas */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            Distribución de Estrellas
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = dist[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={starNum} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-16 shrink-0 font-bold text-slate-700">
                    <span>{starNum}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        starNum >= 4
                          ? "bg-emerald-500"
                          : starNum === 3
                          ? "bg-amber-400"
                          : "bg-rose-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="w-20 text-right font-bold text-slate-600 shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Historial de Opiniones Anónimas */}
        <section className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Historial de Opiniones Anónimas
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Privacidad garantizada
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Cargando valoraciones...
            </div>
          ) : !stats?.ratings || stats.ratings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Aún no hay valoraciones registradas por usuarios.
            </div>
          ) : (
            <div className="space-y-4">
              {stats.ratings.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= r.stars ? "fill-amber-400 text-amber-400" : "text-slate-200",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Intl.DateTimeFormat("es-CL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(r.createdAt))}
                    </span>
                  </div>

                  {r.comment ? (
                    <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic pt-0.5">
                      Sin comentario de texto.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
