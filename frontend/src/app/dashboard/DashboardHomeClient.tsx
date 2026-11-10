"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  Users,
  Stethoscope,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import { getWorkflowAuthHeaders } from "@/lib/workflow";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface DashboardStats {
  patients: { total: number; active: number; inactive: number };
  consultations: { total: number };
  pdfs: { rapido: number; pautas: number; dietas: number; recetas: number };
  planUsage: {
    planKey: string;
    isFree: boolean;
    percent: number;
    limits: { patients: number; consultations: number; pdfs: number };
    usage: { patients: number; consultations: number; pdfs: number };
  };
  recentPatients: { id: string; fullName: string; updatedAt: string; email: string }[];
  recentConsultations: { id: string; title: string; date: string; patient: { id: string; fullName: string } | null }[];
}

export interface RecentCreation {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  patientName?: string | null;
}

function PlanUsageRing({ percent, limits, usage }: { percent: number; limits: DashboardStats["planUsage"]["limits"]; usage: DashboardStats["planUsage"]["usage"] }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
      <div className="relative flex-shrink-0">
        <svg width="112" height="112" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="6"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="url(#planGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 56 56)"
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="planGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{percent}%</span>
        </div>
      </div>
      <div className="w-full space-y-2 text-xs text-slate-500">
        <div className="flex items-center justify-between gap-4">
          <span>Pacientes</span>
          <span className={cn("font-semibold", limits.patients > 0 && usage.patients >= limits.patients ? "text-amber-600 font-bold" : "text-slate-700")}>
            {usage.patients}/{limits.patients > 0 ? limits.patients : "∞"}
            {limits.patients > 0 && usage.patients >= limits.patients && " (Límite)"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Consultas</span>
          <span className={cn("font-semibold", limits.consultations > 0 && usage.consultations >= limits.consultations ? "text-amber-600 font-bold" : "text-slate-700")}>
            {usage.consultations}/{limits.consultations > 0 ? limits.consultations : "∞"}
            {limits.consultations > 0 && usage.consultations >= limits.consultations && " (Límite)"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>PDFs</span>
          <span className={cn("font-semibold", limits.pdfs > 0 && usage.pdfs >= limits.pdfs ? "text-rose-600 font-bold" : "text-slate-700")}>
            {usage.pdfs}/{limits.pdfs > 0 ? limits.pdfs : "∞"}
            {limits.pdfs > 0 && usage.pdfs >= limits.pdfs && " (Agotado)"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHomeClient({
  initialStats,
  initialCreations,
  isDemo,
}: {
  initialStats?: DashboardStats;
  initialCreations?: RecentCreation[];
  isDemo?: boolean;
} = {}) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(initialStats ?? null);
  const [recentCreations, setRecentCreations] = useState<RecentCreation[]>(initialCreations ?? []);
  const [isLoading, setIsLoading] = useState(!initialStats);

  const loadDashboardData = useCallback(async () => {
    if (initialStats) return;
    setIsLoading(true);
    try {
      const res = await fetchApi("/dashboard/stats", {
        headers: getWorkflowAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("No se pudo cargar la pantalla principal.");
      }
      const creationsResponse = await fetchApi("/creations", {
        headers: getWorkflowAuthHeaders(),
      });
      if (creationsResponse.ok) {
        const creations = await creationsResponse.json();
        setRecentCreations(
          (Array.isArray(creations) ? creations : []).slice(0, 3).map((creation: any) => ({
            id: creation.id,
            name: creation.name,
            type: creation.type,
            createdAt: creation.createdAt,
            patientName: creation.metadata?.patientName || creation.content?.patientMeta?.fullName || null,
          })),
        );
      }
    } catch (error) {
      console.error("Error loading dashboard stats", error);
      toast.error("No se pudo cargar la pantalla principal.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
        <p className="text-slate-500">No se pudieron cargar los datos del panel.</p>
      </div>
    );
  }

  const { patients, consultations, pdfs, planUsage, recentPatients, recentConsultations } = stats;

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-3 sm:gap-4 lg:gap-5 min-h-0 lg:overflow-hidden">
      {/* Row 1: Welcome Header + Plan Usage */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 pt-1">
        <div>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-purple-200/60 bg-[#f5effe] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#7c3aed]">
            Panel de Control
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-800 leading-tight">
            Centro de Trabajo Clínico
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Gestiona tus pacientes, consultas y entregables desde un solo lugar con máxima fluidez.
          </p>
        </div>

        {planUsage.isFree && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-[#fef9c3]/60 px-3 py-1.5 shrink-0 shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-amber-800">Plan Gratuito</span>
              <span className="text-xs font-semibold text-slate-700">{planUsage.percent}% en uso</span>
            </div>
            <div className="h-6 w-px bg-amber-300/60" />
            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-normal">
              <span>Pacientes: <strong className="font-semibold">{planUsage.usage.patients}/{planUsage.limits.patients > 0 ? planUsage.limits.patients : "∞"}</strong></span>
              <span>•</span>
              <span>PDFs: <strong className="font-semibold">{planUsage.usage.pdfs}/{planUsage.limits.pdfs > 0 ? planUsage.limits.pdfs : "∞"}</strong></span>
            </div>
          </div>
        )}
      </header>

      {/* Row 2: Stats Cards */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3 shrink-0">
        {/* Patients Card */}
        <div
          className="group cursor-pointer rounded-2xl bg-[#f5effe] p-3 sm:p-3.5 transition-all hover:bg-[#ede3fc] active:scale-[0.99] flex items-center justify-between"
          onClick={() => router.push("/dashboard/pacientes")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-[#7c3aed] shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pacientes totales</p>
              <h3 className="text-2xl font-semibold text-slate-800 leading-tight">{patients.total}</h3>
              <p className="text-[11px] font-normal text-slate-500">
                <span className="text-[#7c3aed] font-medium">{patients.active}</span> activos · <span className="text-slate-400">{patients.inactive}</span> inactivos
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#7c3aed] transition-colors shrink-0 mr-1" />
        </div>

        {/* Consultations Card */}
        <div
          className="group cursor-pointer rounded-2xl bg-[#f8fafc] border border-slate-100 p-3 sm:p-3.5 transition-all hover:bg-slate-100/70 active:scale-[0.99] flex items-center justify-between"
          onClick={() => router.push("/dashboard/consultas")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-slate-600 shadow-xs">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Consultas totales</p>
              <h3 className="text-2xl font-semibold text-slate-800 leading-tight">{consultations.total}</h3>
              <p className="text-[11px] font-normal text-slate-400">registradas a la fecha</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 mr-1" />
        </div>

        {/* PDFs Card */}
        <div
          className="group rounded-2xl bg-[#f0f9f1] p-3 sm:p-3.5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-emerald-600 shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">PDFs creados</p>
              <h3 className="text-2xl font-semibold text-slate-800 leading-tight">
                {pdfs.rapido + pdfs.pautas + pdfs.dietas + pdfs.recetas}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-normal text-slate-500 truncate">
                <span>{pdfs.rapido} rápido</span>
                <span>•</span>
                <span>{pdfs.pautas} pautas</span>
                <span>•</span>
                <span>{pdfs.dietas} dietas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Recent Sections */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1 min-h-0">
        {/* Recent Creations */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-1.5 shrink-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mis creaciones</h2>
            <button
              type="button"
              className="text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] cursor-pointer"
              onClick={() => router.push("/dashboard/creaciones")}
            >
              Ver todas
            </button>
          </div>

          {recentCreations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-center my-auto">
              <FileText className="mx-auto h-5 w-5 text-slate-300" />
              <p className="mt-1 text-xs font-medium text-slate-400">Sin creaciones recientes</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {recentCreations.slice(0, 3).map((creation) => (
                <div
                  key={creation.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-xs transition-all hover:border-purple-200 hover:shadow-sm cursor-pointer"
                  onClick={() => router.push("/dashboard/creaciones")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[#7c3aed]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-medium text-slate-800">{creation.name}</h4>
                      <p suppressHydrationWarning className="truncate text-[10px] font-normal text-slate-400">
                        {creation.patientName || creation.type} · {formatDateOnlyForLocale(creation.createdAt, { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-1.5 shrink-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pacientes recientes</h2>
            <button
              type="button"
              className="text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] cursor-pointer"
              onClick={() => router.push("/dashboard/pacientes")}
            >
              Ver todos
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-center my-auto">
              <Users className="mx-auto h-5 w-5 text-slate-300" />
              <p className="mt-1 text-xs font-medium text-slate-400">Sin pacientes registrados</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {recentPatients.slice(0, 3).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-xs transition-all hover:border-purple-200 hover:shadow-sm cursor-pointer"
                  onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[#7c3aed] font-medium text-xs">
                      {patient.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-medium text-slate-800">{patient.fullName}</h4>
                      <p suppressHydrationWarning className="truncate text-[10px] font-normal text-slate-400">
                        {formatDateOnlyForLocale(patient.updatedAt, { day: "2-digit", month: "short" })} · {patient.email || "Sin correo"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Consultations */}
        <div className="flex flex-col min-h-0 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between pb-1.5 shrink-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Consultas recientes</h2>
            <button
              type="button"
              className="text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] cursor-pointer"
              onClick={() => router.push("/dashboard/consultas")}
            >
              Ver todas
            </button>
          </div>

          {recentConsultations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-center my-auto">
              <Stethoscope className="mx-auto h-5 w-5 text-slate-300" />
              <p className="mt-1 text-xs font-medium text-slate-400">Sin consultas recientes</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {recentConsultations.slice(0, 3).map((consultation) => (
                <div
                  key={consultation.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-xs transition-all hover:border-emerald-200 hover:shadow-sm cursor-pointer"
                  onClick={() => router.push(`/dashboard/consultas/${consultation.id}`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-medium text-slate-800">{consultation.title}</h4>
                      <p suppressHydrationWarning className="truncate text-[10px] font-normal text-slate-400">
                        {consultation.patient?.fullName || "Sin paciente"} · {formatDateOnlyForLocale(consultation.date, { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
