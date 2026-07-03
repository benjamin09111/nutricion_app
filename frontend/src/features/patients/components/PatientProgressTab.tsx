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
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MetricTagInput } from "@/components/ui/metric-tag-input";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Patient } from "@/features/patients";
import { Consultation, Metric } from "@/features/consultations";
import { cn, normalizeMetricKey } from "../utils/patient-helpers";

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
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  exportIncludeClinicalRecord: boolean;
  setExportIncludeClinicalRecord: (open: boolean) => void;
  exportIncludeProgress: boolean;
  setExportIncludeProgress: (open: boolean) => void;
  isExporting: boolean;

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
  openProgressExportModal: () => void;
}

export function PatientProgressTab({
  patient,
  chartData,
  getAllMetricKeys,
  getMetricInfo,
  prepareChartData,
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
  isExportModalOpen,
  setIsExportModalOpen,
  exportIncludeClinicalRecord,
  setExportIncludeClinicalRecord,
  exportIncludeProgress,
  setExportIncludeProgress,
  isExporting,

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
  openProgressExportModal,
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
            onClick={openProgressExportModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-600 font-black rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-all cursor-pointer group/pdf shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest">
              Exportar PDF
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
          const filtered = chartData.filter((d) => d[key] !== undefined);
          const lastPoint =
            filtered.length > 0 ? filtered[filtered.length - 1] : null;

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {getAllMetricKeys().map((key) => {
          const info = getMetricInfo(key);
          const filteredData = chartData.filter((d) => d[key] !== undefined);
          const firstPoint = filteredData.length > 0 ? filteredData[0] : null;
          const latestPoint =
            filteredData.length > 0
              ? filteredData[filteredData.length - 1]
              : null;

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
              id={`export-chart-${key}`}
              className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="space-y-1">
                  <h3 className="text-base lg:text-lg font-semibold text-slate-900 flex items-center gap-3">
                    <info.icon
                      className={cn(
                        "w-6 h-6",
                        info.color === "#3b82f6"
                          ? "text-indigo-500"
                          : info.color === "#10b981"
                            ? "text-emerald-500"
                            : "text-slate-400",
                      )}
                    />
                    {info.label}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 opacity-80">
                    Tendencia histórica ({info.unit})
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-tight min-h-[18px]">
                        Primer valor
                      </p>
                      <div className="flex items-baseline gap-1 flex-wrap mt-2">
                        <span className="text-sm font-black text-slate-700 leading-none">
                          {formatMetricValue(firstValueRaw)}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-none">
                          {info.unit}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-tight min-h-[18px]">
                        Último valor
                      </p>
                      <div className="flex items-baseline gap-1 flex-wrap mt-2">
                        <span className="text-sm font-black text-slate-700 leading-none">
                          {formatMetricValue(latestValueRaw)}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-none">
                          {info.unit}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-tight min-h-[18px]">
                        Diferencia
                      </p>
                      <div className={cn("flex items-baseline gap-1 flex-wrap mt-2")}>
                        <span
                          className={cn(
                            "text-sm font-black leading-none",
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
                        </span>
                        <span className={cn("text-[10px] text-slate-400 leading-none")}>
                          {info.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openMetricLogger(key)}
                    data-no-export="true"
                    className="p-3 bg-emerald-50 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all active:scale-95 cursor-pointer border border-emerald-100"
                    title={`Registrar ${info.label} rápidamente`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingMetricKey(key);
                      setIsEditMetricHistoryModalOpen(true);
                    }}
                    data-no-export="true"
                    className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-emerald-100"
                    title={`Editar historial de ${info.label}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setMetricKeyToDelete(key);
                      setIsDeleteEntireMetricConfirmOpen(true);
                    }}
                    data-no-export="true"
                    className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-indigo-100"
                    title={`Eliminar toda la métrica ${info.label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="h-[300px] w-full">
                {(() => {
                  if (filteredData.length >= 2) {
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id={`color-${key}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#10b981"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#10b981"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 11,
                              fontWeight: 600,
                              fill: "#94a3b8",
                            }}
                            dy={15}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 11,
                              fontWeight: 600,
                              fill: "#94a3b8",
                            }}
                            domain={["auto", "auto"]}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "16px",
                              border: "none",
                              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              padding: "12px",
                            }}
                            itemStyle={{
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                            labelStyle={{
                              fontWeight: 700,
                              color: "#1e293b",
                              marginBottom: "4px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={key}
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#color-${key})`}
                            animationDuration={1500}
                            connectNulls
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  }

                  return (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 gap-4 group-hover:bg-slate-50 transition-colors">
                      <div className="w-20 h-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center animate-in zoom-in-50 duration-500">
                        {latestPoint ? (
                          <>
                            <span className="text-2xl font-black text-slate-900 leading-none">
                              {latestPoint[key]}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              {info.unit}
                            </span>
                          </>
                        ) : (
                          <info.icon className="w-8 h-8 opacity-20 text-slate-400" />
                        )}
                      </div>
                      <div className="text-center space-y-1 px-6">
                        <p className="text-xs font-bold text-slate-600">
                          {latestPoint
                            ? "Primer registro detectado"
                            : "Sin registros detectados"}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 leading-tight">
                          {latestPoint
                            ? "Se necesitan al menos 2 registros en fechas distintas para generar la curva de tendencia."
                            : `No hay datos históricos para ${info.label.toLowerCase()}.`}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Independent Metric Logging Modal */}
      {isMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Registrar Evolución
                </h3>
                <p className="text-slate-500 font-medium text-xs mt-1">
                  Añade datos biométricos fuera de consulta
                </p>
              </div>
              <button
                onClick={closeMetricLogger}
                className="p-3 bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-tight ml-1">
                  Fecha del Registro
                </label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                  <input
                    type="date"
                    className="w-full h-14 pl-14 pr-5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-semibold text-slate-700 cursor-pointer shadow-sm"
                    value={metricForm.date}
                    onChange={(e) =>
                      setMetricForm({ ...metricForm, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                    Seleccionar Métricas
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setMetricForm({
                          ...metricForm,
                          metrics: [],
                        })
                      }
                      className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest px-3 py-1 cursor-pointer"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={addMetricToForm}
                      className="text-xs font-semibold bg-slate-50 text-slate-500 px-4 py-2 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> FILA VACÍA
                    </button>
                  </div>
                </div>

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
                  placeholder="Busca por nombre (ej: Brazo, Cadera...)"
                  className="mt-2"
                />
              </div>

              <div className="space-y-4">
                {metricForm.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-2"
                  >
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                        Concepto
                      </label>
                      <Input
                        placeholder="Peso, Cintura..."
                        value={m.label}
                        onChange={(e) =>
                          updateMetricInForm(idx, "label", e.target.value)
                        }
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                        Valor
                      </label>
                      <Input
                        placeholder="70.5"
                        value={m.value}
                        onChange={(e) =>
                          updateMetricInForm(idx, "value", e.target.value)
                        }
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                        Unidad
                      </label>
                      {(() => {
                        const known = availableMetricSuggestions.find(
                          (s) =>
                            s.label.toLowerCase() === m.label.toLowerCase() ||
                            s.key === normalizeMetricKey(m.label, m.key),
                        );
                        return (
                          <div className="relative">
                            <select
                              value={m.unit}
                              disabled={!!known}
                              onChange={(e) =>
                                updateMetricInForm(idx, "unit", e.target.value)
                              }
                              className={cn(
                                "w-full rounded-xl border h-11 text-slate-900 bg-white px-4 py-2 text-sm focus:ring-4 outline-none font-bold cursor-pointer transition-shadow shadow-xs",
                                known
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500",
                              )}
                            >
                              <option value="" disabled>
                                Selecciona...
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
                            {known && (
                              <span className="absolute -top-6 right-0 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-in fade-in slide-in-from-right-2">
                                Unidad Oficial
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-span-1 pb-1">
                      <button
                        onClick={() => removeMetricFromForm(idx)}
                        className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
              <button
                onClick={closeMetricLogger}
                className="px-6 py-3 bg-white text-slate-500 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSaveMetricsClick}
                className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
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

      {/* Modal de Exportación PDF con aviso de IA */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => !isExporting && setIsExportModalOpen(false)}
        title="Exportar expediente"
      >
        <div className="space-y-6 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <p className="text-sm font-bold text-slate-900">Selecciona qué incluir</p>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={exportIncludeClinicalRecord}
                onChange={(e) => setExportIncludeClinicalRecord(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              Ficha clínica
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={exportIncludeProgress}
                onChange={(e) => setExportIncludeProgress(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              Progreso del paciente
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl">
              <FileText className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Nombre del Archivo
                </p>
                <p className="text-xs font-bold text-slate-700">
                  Evolucion_
                  {(patient?.fullName || "Paciente").replace(/\s+/g, "_")}.pdf
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Contenido
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {exportIncludeClinicalRecord && exportIncludeProgress
                    ? "Ficha clínica + evolución"
                    : exportIncludeClinicalRecord
                      ? "Ficha clínica"
                      : "Resumen textual + gráficos de tendencia"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-xl font-bold text-slate-400"
              onClick={() => setIsExportModalOpen(false)}
              disabled={isExporting}
            >
              CANCELAR
            </Button>
            <Button
              className="flex-2 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  GENERANDO...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  GENERAR INFORME PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

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
    try {
      const dateObj = new Date(d);
      return isNaN(dateObj.getTime())
        ? ""
        : dateObj.toISOString().split("T")[0];
    } catch {
      return "";
    }
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
