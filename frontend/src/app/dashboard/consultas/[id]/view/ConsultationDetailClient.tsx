"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  CalendarDays,
  FileText,
  Activity,
  Weight,
  Edit2,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Zap,
  Target,
  Mail,
  Phone,
  Tag,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Consultation, Metric } from "@/features/consultations";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { fetchApi } from "@/lib/api-base";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatRut = (rut: string) => {
  if (!rut) return "";
  const actual = rut.replace(/^0+|[^0-9kK]/g, "");
  if (actual.length <= 1) return actual;
  let result = actual.slice(-1);
  for (let i = 1; i < actual.length; i++) {
    result = actual.slice(-i - 1, -i) + (i % 3 === 0 ? "." : "") + result;
  }
  return result.includes("-") ? result : result.slice(0, -1) + "-" + result.slice(-1);
};

const toDateOnly = (value?: string | Date | null) => {
  if (!value) return "";
  if (typeof value === "string") {
    const isoLike = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoLike?.[1]) return isoLike[1];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (value?: string | Date | null) => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return "—";
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return "—";
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return stableDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Maps metric keys to display info
const METRIC_PRESETS: Record<string, { color: string; icon: any }> = {
  weight: { color: "text-blue-600 bg-blue-50 border-blue-100", icon: Weight },
  body_fat: { color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: Activity },
  muscle_mass: { color: "text-amber-600 bg-amber-50 border-amber-100", icon: Dumbbell },
  visceral_fat: { color: "text-red-600 bg-red-50 border-red-100", icon: Zap },
  waist: { color: "text-pink-600 bg-pink-50 border-pink-100", icon: Target },
};

function getMetricStyle(metric: Metric) {
  const key = metric.key?.toLowerCase() || "";
  return METRIC_PRESETS[key] || { color: "text-slate-600 bg-slate-50 border-slate-100", icon: Activity };
}

interface Props {
  id: string;
}

export default function ConsultationDetailClient({ id }: Props) {
  const router = useRouter();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [isPatientPanelOpen, setIsPatientPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const token = typeof window !== "undefined"
    ? (Cookies.get("auth_token") || localStorage.getItem("auth_token"))
    : "";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const cResponse = await fetchApi(`/consultations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cResponse.ok) {
          const cData = await cResponse.json();
          setConsultation(cData);

          // Fetch patient data
          const pResponse = await fetchApi(`/patients/${cData.patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pResponse.ok) {
            const pData = await pResponse.json();
            setPatientData(pData);
          }
        } else {
          toast.error("Consulta no encontrada");
          router.push("/dashboard/consultas");
        }
      } catch {
        toast.error("Error al cargar datos");
        router.push("/dashboard/consultas");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <ModuleLayout title="Consulta" description="Cargando..." className="pb-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      </ModuleLayout>
    );
  }

  if (!consultation) return null;

  const metrics = Array.isArray(consultation.metrics) ? consultation.metrics : [];
  const hasMetrics = metrics.length > 0;

  return (
    <ModuleLayout title="Consulta" description="Detalle clínico" className="pb-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

        {/* Header nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-widest mb-0.5">
                <span>Consulta</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-emerald-600">{consultation.title}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                {formatDateDisplay(consultation.date)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/dashboard/pacientes/${consultation.patientId}`)}
              className="flex items-center gap-2 h-10 px-5 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              <User className="w-4 h-4" />
              {consultation.patientName}
            </button>
            <button
              onClick={() => router.push(`/dashboard/consultas/${id}`)}
              className="flex items-center gap-2 h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-2xl transition-all cursor-pointer shadow-md"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        {/* Main 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Left: main info - 3 cols */}
          <div className="lg:col-span-3 space-y-6">

            {/* Session header card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                      {consultation.title}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      {formatDateDisplay(consultation.date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description / clinical notes */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <ClipboardList className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    Observaciones Clínicas
                  </h3>
                </div>
                <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 min-h-[120px]">
                  {consultation.description ? (
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm">
                      {consultation.description}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-300">
                      <FileText className="w-8 h-8 opacity-30" />
                      <p className="text-xs font-bold">Sin observaciones registradas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right: metrics - 2 cols */}
          <div className="lg:col-span-2 space-y-6">

            {/* Metrics card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Métricas Clave
                </h3>
                {hasMetrics && (
                  <span className="ml-auto px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
                    {metrics.length}
                  </span>
                )}
              </div>
              <div className="p-4">
                {hasMetrics ? (
                  <div className="grid grid-cols-1 gap-3">
                    {metrics.map((m, i) => {
                      const style = getMetricStyle(m);
                      const Icon = style.icon;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border",
                            style.color,
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold">{m.label}</span>
                          </div>
                          <span className="text-xl font-black tabular-nums">
                            {m.value}
                            {m.unit && (
                              <span className="text-xs font-semibold opacity-60 ml-1">
                                {m.unit}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
                    <Activity className="w-8 h-8 opacity-30" />
                    <p className="text-xs font-bold">Sin métricas registradas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info Accordion */}
        {patientData && (
          <details
            open={isPatientPanelOpen}
            onToggle={(e) => setIsPatientPanelOpen(e.currentTarget.open)}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
          >
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none p-5 lg:p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                    {patientData.fullName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">Ficha del Paciente</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <ChevronDown className={cn("w-6 h-6 text-slate-400 transition-transform duration-300", isPatientPanelOpen && "rotate-180")} />
              </div>
            </summary>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Información Personal</p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600 truncate">{patientData.email || "No registrado"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">{patientData.phone || "No registrado"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">
                      {formatRut(patientData.documentId || "") || "RUT no registrado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Estado Físico</p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatura</p>
                    <p className="text-sm font-black text-slate-700">{patientData.height ? `${patientData.height} cm` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso</p>
                    <p className="text-sm font-black text-slate-700">{patientData.weight ? `${patientData.weight} kg` : "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Género</p>
                    <p className="text-sm font-black text-slate-700">{patientData.gender || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Restricciones</p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 min-h-[80px]">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(patientData.dietRestrictions) && patientData.dietRestrictions.length > 0 ? (
                      patientData.dietRestrictions.map((r: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100 uppercase tracking-tighter">
                          {r}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-300">Sin restricciones registradas</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Full width summary if exists */}
              {patientData.clinicalSummary && (
                <div className="md:col-span-3 space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileSearch className="w-3.5 h-3.5 text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Resumen Clínico</p>
                  </div>
                  <div className="bg-blue-50/30 rounded-2xl p-5 border border-blue-100/50">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                      "{patientData.clinicalSummary}"
                    </p>
                  </div>
                </div>
              )}

              {/* Action: Go to patient profile */}
              <div className="md:col-span-3 pt-2">
                <Button
                  onClick={() => router.push(`/dashboard/pacientes/${patientData.id}`)}
                  variant="ghost"
                  className="w-full h-12 rounded-2xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 font-bold transition-all flex items-center justify-center gap-3 group"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Ver perfil completo del paciente</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </details>
        )}
      </div>
    </ModuleLayout>
  );
}
