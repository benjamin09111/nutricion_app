"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  Trash2,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Clock,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { cn } from "@/lib/utils";

type LeadItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  practiceArea: string;
  status: "NUEVO" | "CONTACTADO" | "CONVERTIDO" | "DESCARTADO";
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

type MetricsData = {
  periodDays: number;
  overview: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalHeroCtaClicks: number;
    ctr: number;
    totalLeads: number;
    conversionRate: number;
  };
  practiceAreas: Array<{
    key: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  statuses: Array<{
    status: string;
    count: number;
  }>;
  dailyTimeline: Array<{
    date: string;
    views: number;
    ctaClicks: number;
    leads: number;
  }>;
  recentLeads: LeadItem[];
  recentEvents: Array<{
    id: string;
    eventType: string;
    pagePath: string;
    createdAt: string;
  }>;
};

const AREA_LABELS: Record<string, string> = {
  CONSULTA_PRIVADA: "Consulta Privada",
  CLINICA: "Clínica / Hospital",
  DEPORTIVO: "Nutrición Deportiva",
  ESTUDIANTE: "Estudiante de Nutrición",
  DOCENCIA: "Docencia / Investigación",
  OTRO: "Otro",
};

const STATUS_LABELS: Record<LeadItem["status"], string> = {
  NUEVO: "Nuevo Lead",
  CONTACTADO: "Contactado",
  CONVERTIDO: "Convertido (Beta)",
  DESCARTADO: "Descartado",
};

const STATUS_BADGE_STYLES: Record<LeadItem["status"], string> = {
  NUEVO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CONTACTADO: "bg-blue-50 text-blue-700 border-blue-200",
  CONVERTIDO: "bg-purple-50 text-purple-700 border-purple-200",
  DESCARTADO: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function MetricasLandingPage() {
  const [periodDays, setPeriodDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  // Leads list management
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const getHeaders = useCallback(() => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const headers = getHeaders();
      const [metricsRes, leadsRes] = await Promise.all([
        fetchApi(`/landing/admin/metrics?days=${periodDays}`, { headers }),
        fetchApi(`/landing/admin/leads?limit=100`, { headers }),
      ]);

      if (!metricsRes.ok) throw new Error("Error al obtener métricas");
      if (!leadsRes.ok) throw new Error("Error al obtener leads");

      const metricsData = await metricsRes.json();
      const leadsData = await leadsRes.json();

      setMetrics(metricsData);
      setLeads(leadsData.leads || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al cargar datos");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [periodDays, getHeaders]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast.success("Métricas actualizadas");
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadItem["status"]) => {
    try {
      const headers = getHeaders();
      const res = await fetchApi(`/landing/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar el estado");

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead,
        ),
      );
      toast.success(`Estado actualizado a ${STATUS_LABELS[newStatus]}`);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado");
    }
  };

  const handleSaveNotes = async (leadId: string) => {
    try {
      const headers = getHeaders();
      const res = await fetchApi(`/landing/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesDraft }),
      });

      if (!res.ok) throw new Error("No se pudo guardar la nota");

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, notes: notesDraft } : lead,
        ),
      );
      setEditingNotesId(null);
      toast.success("Nota guardada correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar nota");
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este lead?")) return;

    try {
      const headers = getHeaders();
      const res = await fetchApi(`/landing/admin/leads/${leadId}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) throw new Error("No se pudo eliminar el lead");

      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      toast.success("Lead eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    if (!leads.length) {
      toast.error("No hay leads para exportar");
      return;
    }

    const headers = [
      "ID",
      "Nombre Completo",
      "Correo Electrónico",
      "Área de Ejercicio",
      "Teléfono",
      "Estado",
      "Notas",
      "Fecha de Registro",
    ];

    const rows = leads.map((l) => [
      l.id,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${(AREA_LABELS[l.practiceArea] || l.practiceArea).replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(STATUS_LABELS[l.status] || l.status).replace(/"/g, '""')}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      new Date(l.createdAt).toLocaleString("es-CL"),
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nutrinet_leads_jump_chile_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Archivo CSV generado exitosamente");
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.fullName.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        (item.phone && item.phone.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  const topArea = metrics?.practiceAreas?.[0];

  return (
    <ModuleLayout
      title="Métricas Landing Page"
      description="Validación Lean Startup y captación de nutricionistas interesadas para la postulación a Jump Chile."
      rightContent={
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setPeriodDays(d)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                  periodDays === d
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                )}
              >
                {d} días
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-xl gap-1.5 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Actualizar
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar Leads (CSV)
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Visitantes Únicos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Visitantes Únicos
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900 block tracking-tight">
                {isLoading ? "..." : metrics?.overview.uniqueVisitors || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {metrics?.overview.totalPageViews || 0} páginas vistas totales
              </span>
            </div>
          </div>

          {/* Interés Oferta (Clics CTA Hero) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clics en Oferta Beta
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <MousePointerClick className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900 block tracking-tight">
                {isLoading ? "..." : metrics?.overview.totalHeroCtaClicks || 0}
              </span>
              <span className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {metrics?.overview.ctr || 0}% de interés (CTR)
              </span>
            </div>
          </div>

          {/* Leads Cualificados */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Leads Capturados
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900 block tracking-tight">
                {isLoading ? "..." : metrics?.overview.totalLeads || 0}
              </span>
              <span className="text-xs text-purple-700 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {metrics?.overview.conversionRate || 0}% de conversión (Lead/Visita)
              </span>
            </div>
          </div>

          {/* Segmento Más Demandado */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Segmento Principal
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl font-black text-slate-900 block truncate">
                {isLoading ? "..." : topArea ? topArea.label : "Sin datos"}
              </span>
              <span className="text-xs text-blue-700 font-bold mt-1 block">
                {topArea ? `${topArea.percentage}% de los registros` : "A la espera de registros"}
              </span>
            </div>
          </div>
        </div>

        {/* Funnel & Audience Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Embudo de Conversión Jump Chile */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Embudo de Conversión (Lean Funnel)
                </h2>
                <p className="text-xs text-slate-500">
                  Validación de deseabilidad del software y la oferta de 50% descuento.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Jump Chile
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Paso 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>1. Visita la Landing Page</span>
                  <span>{metrics?.overview.uniqueVisitors || 0} visitantes (100%)</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-full" />
                </div>
              </div>

              {/* Paso 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>2. Interés en Oferta (Clics CTA)</span>
                  <span>
                    {metrics?.overview.totalHeroCtaClicks || 0} clics ({metrics?.overview.ctr || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(metrics?.overview.ctr || 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Paso 3 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>3. Envío de Formulario (Lead Calificado)</span>
                  <span>
                    {metrics?.overview.totalLeads || 0} registros ({metrics?.overview.conversionRate || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(metrics?.overview.conversionRate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed font-medium">
              💡 <strong>Insight Lean Startup:</strong> Una tasa de conversión &gt; 5% en registro B2B valida una alta intención de adopción y dolor agudo en la gestión con Excel.
            </div>
          </div>

          {/* Segmentación de Audiencia por Área de Ejercicio */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Segmentación de Audiencia
                </h2>
                <p className="text-xs text-slate-500">
                  ¿De qué áreas provienen las nutricionistas más interesadas?
                </p>
              </div>
              <Target className="h-4 w-4 text-slate-400" />
            </div>

            <div className="space-y-3 pt-2">
              {metrics?.practiceAreas?.length ? (
                metrics.practiceAreas.map((area) => (
                  <div key={area.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{area.label}</span>
                      <span>
                        {area.count} {area.count === 1 ? "lead" : "leads"} ({area.percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(area.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aún no hay registros para mostrar segmentación.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Leads Table Management */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          
          {/* Table Header & Controls */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Lista de Nutricionistas Registradas ({filteredLeads.length})
              </h2>
              <p className="text-xs text-slate-500">
                Gestiona el estado de contacto, notas y seguimiento para la fase Beta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                {(["ALL", "NUEVO", "CONTACTADO", "CONVERTIDO", "DESCARTADO"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                      statusFilter === st
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {st === "ALL" ? "Todos" : STATUS_LABELS[st]}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Nutricionista</th>
                  <th className="p-4">Área de Ejercicio</th>
                  <th className="p-4">Teléfono / WhatsApp</th>
                  <th className="p-4">Fecha Registro</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Notas / Seguimiento</th>
                  <th className="p-4 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nombre & Email */}
                      <td className="p-4 pl-6">
                        <strong className="text-sm font-bold text-slate-900 block">
                          {lead.fullName}
                        </strong>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {lead.email}
                        </span>
                      </td>

                      {/* Área */}
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200/80">
                          {AREA_LABELS[lead.practiceArea] || lead.practiceArea}
                        </span>
                      </td>

                      {/* Teléfono */}
                      <td className="p-4">
                        {lead.phone ? (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No proporcionado</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Estado Dropdown */}
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadItem["status"])
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer outline-none",
                            STATUS_BADGE_STYLES[lead.status],
                          )}
                        >
                          <option value="NUEVO">Nuevo Lead</option>
                          <option value="CONTACTADO">Contactado</option>
                          <option value="CONVERTIDO">Convertido (Beta)</option>
                          <option value="DESCARTADO">Descartado</option>
                        </select>
                      </td>

                      {/* Notas */}
                      <td className="p-4 min-w-[200px]">
                        {editingNotesId === lead.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              className="h-8 px-2 text-xs rounded-lg border border-slate-300 w-full"
                              placeholder="Escribe una nota..."
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(lead.id)}
                              className="h-8 px-2.5 text-[11px] rounded-lg bg-emerald-600 text-white"
                            >
                              OK
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(lead.id);
                              setNotesDraft(lead.notes || "");
                            }}
                            className="text-slate-600 cursor-pointer hover:text-slate-900 group flex items-center justify-between"
                            title="Haz clic para editar notas"
                          >
                            <span className="truncate max-w-[180px]">
                              {lead.notes || <span className="text-slate-400 italic">+ Añadir nota</span>}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`mailto:${lead.email}?subject=Bienvenida%20al%20Acceso%20Beta%20de%20NutriNet%20(50%25%20Dcto.)`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                            title="Enviar correo"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar lead"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No se encontraron nutricionistas registradas con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </ModuleLayout>
  );
}
