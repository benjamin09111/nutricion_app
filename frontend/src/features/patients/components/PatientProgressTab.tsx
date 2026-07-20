import React, { useState } from "react";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Activity,
  History as HistoryIcon,
  Trash2 as TrashIcon,
  AlertCircle,
  Globe,
  Save,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { MetricTagInput } from "@/components/ui/metric-tag-input";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Patient } from "@/features/patients";
import { Consultation, Metric } from "@/features/consultations";
import { buildMetricSeriesForKey, cn, normalizeMetricKey, toDateOnly } from "../utils/patient-helpers";

interface PatientProgressTabProps {
  patient: Patient;
  consultations: Consultation[];
  chartData: any[];
  registeredMetricKeys: string[];
  getAllMetricKeys: () => string[];
  getMetricInfo: (key: string) => { label: string; unit: string; color: string; icon: any };
  prepareChartData: () => any[];
  availableMetricSuggestions: any[];
  metricHistory: any[];

  // Modal controls
  isMetricModalOpen: boolean;
  setIsMetricModalOpen: (open: boolean) => void;
  isAddMetricModalOpen: boolean;
  setIsAddMetricModalOpen: (open: boolean) => void;
  isEditMetricHistoryModalOpen: boolean;
  setIsEditMetricHistoryModalOpen: (open: boolean) => void;
  isDeleteEntireMetricConfirmOpen: boolean;
  setIsDeleteEntireMetricConfirmOpen: (open: boolean) => void;
  isOverwriteConfirmOpen: boolean;
  setIsOverwriteConfirmOpen: (open: boolean) => void;
  isExporting: boolean;
  isSavingMetrics: boolean;

  // Form states and actions
  metricForm: { date: string; metrics: Metric[] };
  setMetricForm: React.Dispatch<React.SetStateAction<{ date: string; metrics: Metric[] }>>;
  newMetric: { name: string; unit: string; key: string; icon: string; color: string };
  setNewMetric: React.Dispatch<React.SetStateAction<{ name: string; unit: string; key: string; icon: string; color: string }>>;
  editingMetricKey: string | null;
  setEditingMetricKey: (key: string | null) => void;
  metricKeyToDelete: string | null;
  setMetricKeyToDelete: (key: string | null) => void;

  // Function handlers
  openMetricLogger: (metricKey?: string) => void;
  closeMetricLogger: () => void;
  handleSaveMetricsClick: () => void;
  confirmSaveMetrics: () => void;
  handleCreateGlobalMetric: () => void;
  onDeleteMetricRecord: (record: any) => Promise<void>;
  onSaveMetricEdit: (record: any, newValue: string, newDate: string) => Promise<void>;
  addMetricToForm: () => void;
  addSmartMetricToForm: (metric: any) => void;
  updateMetricInForm: (index: number, field: keyof Metric, value: string) => void;
  removeMetricFromForm: (index: number) => void;
  handleDeleteEntireMetric: () => Promise<void>;
  handleExportPDF: () => Promise<void>;
  handleExportProgressExcel: () => Promise<void>;
}

export function PatientProgressTab({
  consultations,
  getAllMetricKeys,
  getMetricInfo,
  availableMetricSuggestions,
  metricHistory,

  // Modals
  isMetricModalOpen,
  isAddMetricModalOpen,
  setIsAddMetricModalOpen,
  isEditMetricHistoryModalOpen,
  setIsEditMetricHistoryModalOpen,
  isDeleteEntireMetricConfirmOpen,
  setIsDeleteEntireMetricConfirmOpen,
  isOverwriteConfirmOpen,
  setIsOverwriteConfirmOpen,
  isSavingMetrics,

  // States
  metricForm,
  setMetricForm,
  newMetric,
  setNewMetric,
  editingMetricKey,
  setEditingMetricKey,
  metricKeyToDelete,
  setMetricKeyToDelete,

  // Handlers
  openMetricLogger,
  closeMetricLogger,
  handleSaveMetricsClick,
  confirmSaveMetrics,
  handleCreateGlobalMetric,
  onDeleteMetricRecord,
  onSaveMetricEdit,
  addMetricToForm,
  updateMetricInForm,
  removeMetricFromForm,
  handleDeleteEntireMetric,
  handleExportPDF,
  handleExportProgressExcel,
  registeredMetricKeys,
}: PatientProgressTabProps) {
  return (
    <div className="space-y-10 animate-in zoom-in-95 duration-500">
      {/* Metrics Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Seguimiento Biométrico
          </h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
            Gestiona la evolución física del paciente
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-600 font-black rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-all cursor-pointer group/pdf shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest">
              Exportar PDF
            </span>
          </button>
          <button
            onClick={handleExportProgressExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-600 font-black rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-all cursor-pointer group/pdf shadow-sm hover:shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest">
              Exportar Excel
            </span>
          </button>
          <button
            onClick={() => openMetricLogger()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-emerald-400" />
            Registrar Métrica
          </button>
        </div>
      </div>

      {/* Last Values Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 px-2">
        {getAllMetricKeys().map((key) => {
          const info = getMetricInfo(key);
          const metricSeries = buildMetricSeriesForKey(consultations, key);
          const lastPoint =
            metricSeries.length > 0
              ? metricSeries[metricSeries.length - 1]
              : null;

          return (
            <div
              key={`summary-${key}`}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-emerald-200 hover:shadow-md transition-all cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <info.icon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                </div>
                {lastPoint && (
                  <div className="text-[9px] font-bold text-slate-300 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                    {lastPoint.date}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
                  {info.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {lastPoint ? lastPoint[key] : "---"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {info.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {getAllMetricKeys().map((key) => {
          const info = getMetricInfo(key);
          const seriesData = buildMetricSeriesForKey(consultations, key);
          const consultationPoints = seriesData;
          const hasEnoughPointsForChart = consultationPoints.length >= 2;
          const firstPoint = seriesData.length > 0 ? seriesData[0] : null;
          const latestPoint =
            seriesData.length > 0 ? seriesData[seriesData.length - 1] : null;

          const firstValueRaw = firstPoint ? Number(firstPoint[key]) : null;
          const latestValueRaw = latestPoint ? Number(latestPoint[key]) : null;
          const hasValidFirst =
            firstValueRaw !== null && Number.isFinite(firstValueRaw);
          const hasValidLast =
            latestValueRaw !== null && Number.isFinite(latestValueRaw);
          const diffRaw =
            hasValidFirst && hasValidLast
              ? latestValueRaw - firstValueRaw
              : null;

          const formatMetricValue = (value: number | null) => {
            if (value === null || !Number.isFinite(value)) return "---";
            if (Number.isInteger(value)) return value.toString();
            return value.toFixed(2).replace(/\.?0+$/, "");
          };

          const diffDisplay =
            diffRaw === null || !Number.isFinite(diffRaw)
              ? "---"
              : `${diffRaw > 0 ? "+" : ""}${formatMetricValue(diffRaw)}`;

          return (
            <div
              key={key}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm group"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <info.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      info.color === "#3b82f6"
                        ? "text-indigo-500"
                        : info.color === "#10b981"
                          ? "text-emerald-500"
                          : "text-slate-400",
                    )}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {info.label}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {info.unit}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => openMetricLogger(key)}
                    data-no-export="true"
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-all active:scale-95 cursor-pointer border border-emerald-100"
                    title={`Registrar ${info.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingMetricKey(key);
                      setIsEditMetricHistoryModalOpen(true);
                    }}
                    data-no-export="true"
                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-95 cursor-pointer border border-transparent hover:border-emerald-100"
                    title={`Editar historial de ${info.label}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setMetricKeyToDelete(key);
                      setIsDeleteEntireMetricConfirmOpen(true);
                    }}
                    data-no-export="true"
                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95 cursor-pointer border border-transparent hover:border-indigo-100"
                    title={`Eliminar métrica ${info.label}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chart — only this zone is captured for PDF */}
              <div
                id={`export-chart-${key}`}
                className="h-[260px] w-full bg-white [&_*:focus]:outline-none [&_svg]:outline-none [&_.recharts-surface]:outline-none"
              >
                {(() => {
                  if (hasEnoughPointsForChart) {
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={seriesData}
                            margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                          >
                          <defs>
                            <linearGradient
                              id={`grad-${key}`}
                              x1="0" y1="0" x2="0" y2="1"
                            >
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }}
                            domain={["auto", "auto"]}
                            width={40}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              padding: "10px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={key}
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={`url(#grad-${key})`}
                            animationDuration={1500}
                            connectNulls
                          />
                          {seriesData.length > 6 && (
                            <Brush dataKey="date" height={20} stroke="#cbd5e1" fill="#f8fafc" />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  }

                  return (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 gap-2 mx-5">
                      {latestPoint ? (
                        <>
                          <span className="text-2xl font-black text-slate-900">
                            {latestPoint[key]}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {info.unit}
                          </span>
                          <p className="text-[10px] font-semibold text-slate-400">
                            Se necesitan 2 registros para la curva.
                          </p>
                        </>
                      ) : (
                        <>
                          <info.icon className="w-7 h-7 opacity-20 text-slate-400" />
                          <p className="text-[10px] font-semibold text-slate-400 text-center px-4">
                            Sin datos para {info.label.toLowerCase()}.
                          </p>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Stats below chart — not captured for export */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                <div className="px-4 py-3 text-center">
                  <p className="text-xl font-black text-slate-800 leading-tight">
                    {formatMetricValue(firstValueRaw)}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                    INICIAL
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xl font-black text-slate-800 leading-tight">
                    {formatMetricValue(latestValueRaw)}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                    ACTUAL
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p
                    className={cn(
                      "text-xl font-black leading-tight",
                      diffRaw === null || !Number.isFinite(diffRaw)
                        ? "text-slate-500"
                        : diffRaw > 0
                          ? "text-emerald-600"
                          : diffRaw < 0
                            ? "text-indigo-600"
                            : "text-slate-700",
                    )}
                  >
                    {diffDisplay}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                    CAMBIO
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Independent Metric Logging Modal */}
      {isMetricModalOpen && (
        <div
          onClick={closeMetricLogger}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                  Registrar Evolución
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Añade datos biométricos fuera de consulta
                </p>
              </div>
              <button
                onClick={closeMetricLogger}
                className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm cursor-pointer"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left column — selected metrics + date */}
              <div className="w-full lg:w-1/2 lg:border-r border-slate-100 flex flex-col">
                <div className="p-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Fecha del Registro
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                        <input
                          type="date"
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-semibold text-sm text-slate-700 cursor-pointer"
                          value={metricForm.date}
                          onChange={(e) =>
                            setMetricForm({ ...metricForm, date: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 flex items-center justify-between shrink-0">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Métricas seleccionadas
                  </h4>
                  <button
                    onClick={() =>
                      setMetricForm({ ...metricForm, metrics: [] })
                    }
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    Limpiar todo
                  </button>
                </div>

                <div className="max-h-[35vh] lg:max-h-[45vh] overflow-y-auto px-5 pb-5 custom-scrollbar space-y-3">
                  {metricForm.metrics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                      <Activity className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-sm font-semibold text-slate-400">
                        Sin métricas seleccionadas
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Usa el panel derecho para buscar y agregar métricas
                      </p>
                    </div>
                  ) : (
                    metricForm.metrics.map((m, idx) => {
                      const known = availableMetricSuggestions.find(
                        (s) =>
                          s.label.toLowerCase() === m.label.toLowerCase() ||
                          s.key === normalizeMetricKey(m.label, m.key),
                      );
                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            {!!m.key ? (
                              <span className="text-xs font-bold text-slate-700">
                                {m.label || "Métrica sin nombre"}
                              </span>
                            ) : (
                              <Input
                                placeholder="Nombre de la métrica"
                                value={m.label}
                                onChange={(e) =>
                                  updateMetricInForm(idx, "label", e.target.value)
                                }
                                className="h-8 text-xs font-semibold bg-white"
                              />
                            )}
                            {known && (
                              <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                Oficial
                              </span>
                            )}
                            <button
                              onClick={() => removeMetricFromForm(idx)}
                              className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Valor"
                                value={m.value}
                                onChange={(e) =>
                                  updateMetricInForm(idx, "value", e.target.value)
                                }
                                className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                              />
                            </div>
                            <div className="w-28">
                              {!!m.key ? (
                                <Select
                                  disabled={!!known}
                                  value={m.unit ?? ""}
                                  onChange={(val) =>
                                    updateMetricInForm(idx, "unit", val)
                                  }
                                  options={[
                                    { value: "", label: "Und." },
                                    { value: "kg", label: "kg" },
                                    { value: "g", label: "g" },
                                    { value: "cm", label: "cm" },
                                    { value: "mm", label: "mm" },
                                    { value: "%", label: "%" },
                                    { value: "mg/dL", label: "mg/dL" },
                                    { value: "mmol/L", label: "mmol/L" },
                                    { value: "kcal", label: "kcal" },
                                    { value: "latidos/min", label: "lat/min" },
                                    { value: "hrs", label: "hrs" },
                                    { value: "mins", label: "mins" },
                                    { value: "niveles", label: "niveles" },
                                    { value: "unidades", label: "unid." },
                                  ]}
                                  placeholder="Und."
                                  className="h-9"
                                />
                              ) : (
                                <Input
                                  placeholder="Unidad"
                                  value={m.unit ?? ""}
                                  onChange={(e) =>
                                    updateMetricInForm(idx, "unit", e.target.value)
                                  }
                                  className="h-9 text-xs font-semibold bg-white"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right column — metric search and selection */}
              <div className="w-full lg:w-1/2 flex flex-col max-h-[70vh] lg:max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-5 pb-3 shrink-0">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Selector de métricas
                  </label>
                  <MetricTagInput
                    value={metricForm.metrics}
                    registeredKeys={registeredMetricKeys}
                    onChange={(newMetrics) => {
                      const updatedMetrics = newMetrics.map((m) => ({
                        ...m,
                        value: m.value || "",
                      }));
                      setMetricForm({ ...metricForm, metrics: updatedMetrics });
                    }}
                    placeholder="Buscar métricas (ej: Peso, Cintura...)"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={addMetricToForm}
                      className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar manual
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={closeMetricLogger}
                disabled={isSavingMetrics}
                className="px-5 py-2.5 bg-white text-slate-500 font-semibold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSaveMetricsClick}
                disabled={isSavingMetrics}
                className="px-8 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingMetrics && (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nueva Métrica (Global) */}
      <Modal
        isOpen={isAddMetricModalOpen}
        onClose={() => setIsAddMetricModalOpen(false)}
        title="Crear Nueva Métrica"
      >
        <div className="space-y-6 py-4 px-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nombre de la Métrica
              </label>
              <div className="relative">
                <Input
                  placeholder="Ej: Circunferencia de Brazo, Pliegue Cutáneo..."
                  value={newMetric.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const known = availableMetricSuggestions.find(
                      (s) => s.label.toLowerCase() === val.toLowerCase(),
                    );
                    if (known) {
                      setNewMetric({
                        ...newMetric,
                        name: val,
                        unit: known.unit,
                      });
                    } else {
                      setNewMetric({ ...newMetric, name: val });
                    }
                  }}
                  className="rounded-xl border-slate-200 h-11 text-slate-900 pr-10"
                />
                {(() => {
                  const known = availableMetricSuggestions.find(
                    (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
                  );
                  return known ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div
                        className="h-5 w-5 rounded-full bg-[#fffeec] flex items-center justify-center border border-[#cbd83b]/25"
                        title="Esta métrica ya existe"
                      >
                        <AlertCircle className="w-3 h-3 text-indigo-600" />
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              {(() => {
                const known = availableMetricSuggestions.find(
                  (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
                );
                return known ? (
                  <p className="text-[10px] font-bold text-indigo-600 animate-in fade-in slide-in-from-top-1">
                    Esta métrica ya está registrada en el sistema.
                  </p>
                ) : null;
              })()}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unidad{" "}
                {(() => {
                  const known = availableMetricSuggestions.find(
                    (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
                  );
                  return known ? "(Bloqueada)" : "(Opcional)";
                })()}
              </label>
              <div className="relative">
                <select
                  value={newMetric.unit}
                  disabled={
                    !!availableMetricSuggestions.find(
                      (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
                    )
                  }
                  onChange={(e) =>
                    setNewMetric({ ...newMetric, unit: e.target.value })
                  }
                  className={cn(
                    "w-full rounded-xl border h-11 text-slate-900 bg-white px-3 py-2 text-sm focus:ring-2 transition-all font-medium",
                    !!availableMetricSuggestions.find(
                      (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
                    )
                      ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-300",
                  )}
                >
                  <option value="" disabled>
                    Selecciona una unidad...
                  </option>
                  <option value="kg">kg (Kilogramos)</option>
                  <option value="g">g (Gramos)</option>
                  <option value="cm">cm (Centímetros)</option>
                  <option value="mm">mm (Milímetros)</option>
                  <option value="%">% (Porcentaje)</option>
                  <option value="mg/dL">mg/dL</option>
                  <option value="mmol/L">mmol/L</option>
                  <option value="kcal">kcal</option>
                  <option value="latidos/min">latidos/min</option>
                  <option value="hrs">hrs</option>
                  <option value="mins">mins</option>
                  <option value="niveles">niveles (1-10)</option>
                  <option value="unidades">unidades</option>
                </select>
                {!!availableMetricSuggestions.find(
                  (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
                ) && (
                  <span className="absolute -top-6 right-0 text-[8px] font-black uppercase text-indigo-600 bg-[#fffeec] px-2 py-0.5 rounded border border-[#cbd83b]/25">
                    Utilizar unidad existente
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              <Globe className="w-3 h-3 inline mr-1 text-emerald-500" />
              Esta métrica será{" "}
              <span className="text-emerald-600 font-bold">Global</span>. Otros
              nutricionistas podrán verla y reutilizarla. Solo tú podrás
              eliminarla.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              className="rounded-xl font-bold text-slate-400"
              onClick={() => setIsAddMetricModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-slate-900 text-white rounded-xl font-black px-8 shadow-lg shadow-slate-200"
              onClick={handleCreateGlobalMetric}
            >
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación Sobreescribir Métrica */}
      <ConfirmationModal
        isOpen={isOverwriteConfirmOpen}
        onClose={() => setIsOverwriteConfirmOpen(false)}
        onConfirm={confirmSaveMetrics}
        title="¿Sobreescribir Valores?"
        description="Ya existe un registro con esta fecha. Los valores nuevos reemplazarán a los existentes para las métricas que coincidan. Las demás métricas de esa fecha se mantendrán intactas."
        confirmText="Sí, sobreescribir"
        cancelText="Cancelar"
      />

      {/* Modal Confirmación Borrar Métrica Completa */}
      <ConfirmationModal
        isOpen={isDeleteEntireMetricConfirmOpen}
        onClose={() => {
          setIsDeleteEntireMetricConfirmOpen(false);
          setMetricKeyToDelete(null);
        }}
        onConfirm={handleDeleteEntireMetric}
        title={`¿Eliminar Historial de ${metricKeyToDelete ? getMetricInfo(metricKeyToDelete).label : ""}?`}
        description="Esta acción eliminará TODOS los registros históricos de esta métrica para este paciente (incluyendo el valor inicial si aplica). Esta acción no se puede deshacer."
        confirmText="Sí, eliminar todo"
        cancelText="Cancelar"
        variant="destructive"
      />

      {/* Modal de edición de historial detallado */}
      {isEditMetricHistoryModalOpen && editingMetricKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <HistoryIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Historial de Registros
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {getMetricInfo(editingMetricKey).label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditMetricHistoryModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {metricHistory.length > 0 ? (
                metricHistory.map((record, idx) => (
                  <MetricRecordRow
                    key={`${record.id}-${idx}`}
                    record={record}
                    onSave={onSaveMetricEdit}
                    onDelete={onDeleteMetricRecord}
                  />
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <FileText className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No hay registros para esta métrica
                  </p>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex shrink-0 justify-end">
              <button
                onClick={() => setIsEditMetricHistoryModalOpen(false)}
                className="px-10 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                CERRAR HISTORIAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRecordRow({
  record,
  onSave,
  onDelete,
}: {
  record: any;
  onSave: (rec: any, val: string, date: string) => Promise<void>;
  onDelete: (rec: any) => Promise<void>;
}) {
  const [val, setVal] = useState(record.value);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const normalizeDate = (d: string) => {
    return toDateOnly(d);
  };

  const [date, setDate] = useState(normalizeDate(record.date));
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    val !== record.value || date !== normalizeDate(record.date);

  const handleSave = async () => {
    setIsSaving(true);
    let newDateStr = new Date().toISOString();
    if (date) {
      newDateStr = new Date(`${date}T12:00:00Z`).toISOString();
    }
    await onSave(record, val, newDateStr);
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await onDelete(record);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-wrap md:flex-nowrap items-end gap-4 hover:border-emerald-200 hover:shadow-sm transition-all group relative">
      <div className="flex-1 min-w-[140px] space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Calendar className="w-3 h-3 text-emerald-500" /> Fecha
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 bg-slate-50/50 border border-slate-200 focus:bg-white font-bold"
        />
      </div>

      <div className="flex-1 min-w-[100px] space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-500" /> Valor
        </label>
        <div className="relative">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="h-12 bg-slate-50/50 border border-slate-200 focus:bg-white font-bold pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
            {record.unit.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex items-center pb-1 h-full gap-3">
        <button
          onClick={() => setIsDeleteConfirmOpen(true)}
          className={cn(
            "p-3 rounded-xl transition-all cursor-pointer group/trash",
            "bg-slate-50 text-slate-400 hover:bg-indigo-500 hover:text-white shadow-sm",
          )}
          title="Eliminar este registro"
        >
          <TrashIcon className="w-5 h-5" />
        </button>

        <button
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
          className={cn(
            "p-3 rounded-xl transition-all cursor-pointer",
            hasChanges
              ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 active:scale-95"
              : "bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed",
          )}
        >
          {isSaving ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <Save className="w-5 h-5" />
          )}
        </button>
      </div>

      {record.consultationTitle && (
        <div className="w-full md:w-auto md:absolute md:top-2 md:right-4 pt-2 md:pt-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            {record.consultationTitle}
          </span>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar registro?"
        description="Esta acción eliminará permanentemente este valor de métrica del historial del paciente. ¿Deseas continuar?"
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        variant="destructive"
      />
    </div>
  );
}
