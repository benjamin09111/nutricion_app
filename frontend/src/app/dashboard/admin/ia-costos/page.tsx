"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cpu,
  DollarSign,
  Layers,
  RefreshCw,
  Trash2,
  Filter,
  Calendar,
  User,
  Zap,
  TrendingUp,
} from "lucide-react";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";

interface AiStats {
  summary: {
    totalCalls: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCostCents: number;
    totalCostUSD: number;
    totalCostCLP: number;
  };
  byModel: Record<string, { calls: number; tokens: number; costCents: number }>;
  byFeature: Record<string, { calls: number; tokens: number; costCents: number }>;
}

interface LogItem {
  id: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
  createdAt: string;
  account?: {
    email: string;
    nutritionist?: {
      fullName: string;
    };
  };
}

interface LogsResponse {
  items: LogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminIaCostosPage() {
  const queryClient = useQueryClient();
  const [userFilter, setUserFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (userFilter) queryParams.set("userSearch", userFilter);
  if (modelFilter) queryParams.set("model", modelFilter);
  if (featureFilter) queryParams.set("feature", featureFilter);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  queryParams.set("page", page.toString());
  queryParams.set("limit", "15");

  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<AiStats>({
    queryKey: ["adminAiStats", userFilter, modelFilter, featureFilter, startDate, endDate],
    queryFn: async () => {
      const res = await fetchApi(`/admin/ai-usage/stats?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Error al cargar estadísticas de IA");
      return res.json();
    },
  });

  const { data: logsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery<LogsResponse>({
    queryKey: ["adminAiLogs", userFilter, modelFilter, featureFilter, startDate, endDate, page],
    queryFn: async () => {
      const res = await fetchApi(`/admin/ai-usage/logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Error al cargar historial de IA");
      return res.json();
    },
  });

  const cleanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchApi("/admin/ai-usage/cleanup", { method: "POST" });
      if (!res.ok) throw new Error("Error al limpiar registros de IA");
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Se eliminaron ${data.deletedCount} registros antiguos (>60 días).`);
      queryClient.invalidateQueries({ queryKey: ["adminAiStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminAiLogs"] });
    },
    onError: (err: any) => {
      alert(`Error: ${err.message}`);
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  const handleCleanLogs = () => {
    if (confirm("¿Deseas eliminar todos los registros de uso de IA mayores a 60 días?")) {
      cleanMutation.mutate();
    }
  };

  const summary = statsData?.summary || {
    totalCalls: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalCostCents: 0,
    totalCostUSD: 0,
    totalCostCLP: 0,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-7 w-7 text-indigo-600" />
            Gestión y Costos de IA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoreo en tiempo real de llamadas a LLM, consumo de tokens y estimación de costos en centavos (USD/CLP).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button
            onClick={handleCleanLogs}
            disabled={cleanMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar &gt;60 días
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="h-4 w-4 text-indigo-600" />
          Filtros:
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Usuario / Email:</label>
          <input
            type="text"
            placeholder="Buscar correo o nombre"
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Modelo:</label>
          <input
            type="text"
            placeholder="Ej: gpt-4o-mini, gemini"
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Módulo:</label>
          <input
            type="text"
            placeholder="Ej: recetas, copilot, rapido"
            value={featureFilter}
            onChange={(e) => {
              setFeatureFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Desde:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Hasta:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {(userFilter || modelFilter || featureFilter || startDate || endDate) && (
          <Button
            variant="ghost"
            onClick={() => {
              setUserFilter("");
              setModelFilter("");
              setFeatureFilter("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Llamadas Totales
            </span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {isLoadingStats ? "..." : summary.totalCalls.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">Peticiones registradas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tokens Totales
            </span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {isLoadingStats ? "..." : summary.totalTokens.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">
            Prompt: {summary.totalPromptTokens.toLocaleString()} | Comp: {summary.totalCompletionTokens.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Costo Est. (USD)
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {isLoadingStats ? "..." : `$${summary.totalCostUSD.toFixed(4)}`}
          </p>
          <p className="text-xs text-slate-400">
            {summary.totalCostCents.toFixed(2)} centavos de dólar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Costo Est. (CLP)
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {isLoadingStats ? "..." : `$${summary.totalCostCLP.toLocaleString('es-CL')}`}
          </p>
          <p className="text-xs text-slate-400">Tasa est. ~950 CLP/USD</p>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Model */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            Desglose por Modelo
          </h3>
          <div className="space-y-3">
            {statsData?.byModel && Object.keys(statsData.byModel).length > 0 ? (
              Object.entries(statsData.byModel).map(([model, data]) => (
                <div
                  key={model}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">
                      {model}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {data.calls} llamadas | {data.tokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-emerald-600 block">
                      ${(data.costCents / 100).toFixed(4)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {data.costCents.toFixed(2)} ¢
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No hay datos registrados aún.</p>
            )}
          </div>
        </div>

        {/* By Feature */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Desglose por Módulo
          </h3>
          <div className="space-y-3">
            {statsData?.byFeature && Object.keys(statsData.byFeature).length > 0 ? (
              Object.entries(statsData.byFeature).map(([feature, data]) => (
                <div
                  key={feature}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-800 capitalize block">
                      {feature}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {data.calls} llamadas | {data.tokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-emerald-600 block">
                      ${(data.costCents / 100).toFixed(4)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {data.costCents.toFixed(2)} ¢
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No hay datos registrados aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Historial Detallado de Peticiones
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Total: {logsData?.total || 0} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Fecha</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Módulo</th>
                <th className="p-3">Modelo</th>
                <th className="p-3">Prompt / Comp</th>
                <th className="p-3">Total Tokens</th>
                <th className="p-3 text-right">Costo (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Cargando historial...
                  </td>
                </tr>
              ) : logsData?.items && logsData.items.length > 0 ? (
                logsData.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("es-CL")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {item.account?.nutritionist?.fullName || item.account?.email || "Anónimo"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium text-[10px]">
                        {item.feature}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {item.model}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {item.promptTokens} / {item.completionTokens}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 font-mono">
                      {item.totalTokens.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 font-mono">
                      ${(item.estimatedCostCents / 100).toFixed(5)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                    Sin registros de llamadas de IA aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {logsData && logsData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Página {logsData.page} de {logsData.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-xs rounded-xl"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={page >= logsData.totalPages}
                onClick={() => setPage((p) => Math.min(logsData.totalPages, p + 1))}
                className="px-3 py-1 text-xs rounded-xl"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
