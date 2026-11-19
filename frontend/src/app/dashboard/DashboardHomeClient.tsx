"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  Users,
  FileText,
  Plus,
  CalendarDays,
  Utensils,
  Apple,
  BarChart2,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import { getWorkflowAuthHeaders } from "@/lib/workflow";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ModuleLayout } from "@/components/shared/ModuleLayout";

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
          (Array.isArray(creations) ? creations : []).slice(0, 4).map((creation: any) => ({
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
  }, [initialStats]);

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
  const totalPdfs = pdfs.rapido + pdfs.pautas + pdfs.dietas + pdfs.recetas;

  return (
    <ModuleLayout
      title="Panel de Control"
      description="Centro de trabajo clínico para gestionar a tus pacientes, consultas y pautas nutricionales."
      rightContent={
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {planUsage.isFree && (
            <div className="h-11 px-3.5 rounded-xl border border-[#E9E5E7] bg-white text-xs font-medium text-[#626573] flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#B0C76F]" />
              <span className="font-semibold text-[#20212B]">Plan Gratuito</span>
              <span className="text-[#848792]">({planUsage.percent}% uso)</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/dashboard/consultas/nueva")}
            className="h-11 px-4 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] hover:bg-[#FDFBFA] text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs"
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-[#626573]" />
            <span className="hidden sm:inline">Nueva Consulta</span>
            <span className="sm:hidden">Consulta</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/pacientes/new")}
            className="h-11 px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] cursor-pointer shadow-sm shadow-[#86A83C]/20"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Crear paciente</span>
          </button>
        </div>
      }
      className="pb-16 relative"
    >
      <div className="space-y-6">
        {/* Barra de Indicadores KPI — Idéntica a Pacientes y Consultas */}
        <div className="relative overflow-hidden bg-white border border-[#E9E5E7] rounded-[18px] p-5 sm:p-6 min-h-[110px] shadow-2xs">
          {/* Decoración vegetal tenue en el extremo izquierdo mediante SVG */}
          <svg
            className="absolute left-0 top-0 h-full w-36 text-[#B0C76F] pointer-events-none select-none opacity-15"
            viewBox="0 0 120 100"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0 0 C 45 15, 65 55, 25 100 L 0 100 Z" />
            <path d="M0 20 C 35 35, 45 75, 10 100 L 0 100 Z" opacity="0.6" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#F0ECEE] relative z-10">
            {/* 1. Pacientes activos */}
            <div className="flex items-center justify-between sm:px-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Pacientes activos</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {patients.active}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-pulse" />
                <span>En seguimiento</span>
              </span>
            </div>

            {/* 2. Consultas clínicas */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#626573]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Consultas clínicas</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {consultations.total}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-[#626573] border border-slate-200">
                Historial clínico
              </span>
            </div>

            {/* 3. Documentos y Entregables */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Documentos generados</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {totalPdfs}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                100% disponibles
              </span>
            </div>
          </div>
        </div>

        {/* Accesos directos rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/pacientes")}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] hover:border-[#86A83C] transition-all shadow-2xs text-left cursor-pointer group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20] group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">Mis Pacientes</p>
              <p className="text-[11px] text-[#626573] truncate">{patients.total} registrados</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/consultas")}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] hover:border-[#86A83C] transition-all shadow-2xs text-left cursor-pointer group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20] group-hover:scale-105 transition-transform">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">Consultas</p>
              <p className="text-[11px] text-[#626573] truncate">{consultations.total} sesiones</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/rapido")}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] hover:border-[#86A83C] transition-all shadow-2xs text-left cursor-pointer group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20] group-hover:scale-105 transition-transform">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">Rápido</p>
              <p className="text-[11px] text-[#626573] truncate">Pautas y minutas</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/alimentos")}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] hover:border-[#86A83C] transition-all shadow-2xs text-left cursor-pointer group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20] group-hover:scale-105 transition-transform">
              <Apple className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">Composición</p>
              <p className="text-[11px] text-[#626573] truncate">Catálogo oficial</p>
            </div>
          </button>
        </div>

        {/* 3 Columnas de Actividad Reciente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Columna 1: Creaciones recientes */}
          <div className="bg-white rounded-2xl border border-[#E9E5E7] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECEE]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0F5DF] text-[#668E20]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-[#20212B]">Creaciones recientes</h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/creaciones")}
                  className="text-xs font-semibold text-[#668E20] hover:underline cursor-pointer"
                >
                  Ver todas
                </button>
              </div>

              {recentCreations.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-[#626573]">Sin creaciones recientes</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0ECEE] mt-1">
                  {recentCreations.map((creation) => (
                    <div
                      key={creation.id}
                      onClick={() => router.push("/dashboard/creaciones")}
                      className="py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">
                          {creation.name}
                        </h4>
                        <p className="text-[11px] text-[#626573] truncate mt-0.5">
                          {creation.patientName || creation.type} · {formatDateOnlyForLocale(creation.createdAt, { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#848792] group-hover:text-[#668E20] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard/rapido")}
              className="mt-4 w-full h-9 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] text-xs font-semibold text-[#20212B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#626573]" />
              <span>Nueva minuta rápida</span>
            </button>
          </div>

          {/* Columna 2: Pacientes recientes */}
          <div className="bg-white rounded-2xl border border-[#E9E5E7] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECEE]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0F5DF] text-[#668E20]">
                    <Users className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-[#20212B]">Pacientes recientes</h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/pacientes")}
                  className="text-xs font-semibold text-[#668E20] hover:underline cursor-pointer"
                >
                  Ver todos
                </button>
              </div>

              {recentPatients.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-[#626573]">Sin pacientes registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0ECEE] mt-1">
                  {recentPatients.slice(0, 4).map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                      className="py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20] font-bold text-xs border border-[#DDE7B8]">
                          {patient.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">
                            {patient.fullName}
                          </h4>
                          <p className="text-[11px] text-[#626573] truncate mt-0.5">
                            {patient.email || "Sin correo"} · {formatDateOnlyForLocale(patient.updatedAt, { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#848792] group-hover:text-[#668E20] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard/pacientes/new")}
              className="mt-4 w-full h-9 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] text-xs font-semibold text-[#20212B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#626573]" />
              <span>Crear nuevo paciente</span>
            </button>
          </div>

          {/* Columna 3: Consultas recientes */}
          <div className="bg-white rounded-2xl border border-[#E9E5E7] p-5 shadow-2xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECEE]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#626573]">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-[#20212B]">Consultas recientes</h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/consultas")}
                  className="text-xs font-semibold text-[#668E20] hover:underline cursor-pointer"
                >
                  Ver todas
                </button>
              </div>

              {recentConsultations.length === 0 ? (
                <div className="py-10 text-center">
                  <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-[#626573]">Sin consultas recientes</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0ECEE] mt-1">
                  {recentConsultations.slice(0, 4).map((consultation) => (
                    <div
                      key={consultation.id}
                      onClick={() => router.push(`/dashboard/consultas/${consultation.id}`)}
                      className="py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-semibold text-[#20212B] truncate group-hover:text-[#668E20] transition-colors">
                          {consultation.title}
                        </h4>
                        <p className="text-[11px] text-[#626573] truncate mt-0.5">
                          {consultation.patient?.fullName || "Paciente general"} · {formatDateOnlyForLocale(consultation.date, { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#848792] group-hover:text-[#668E20] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard/consultas/nueva")}
              className="mt-4 w-full h-9 rounded-xl border border-[#E9E5E7] bg-white hover:bg-[#FDFBFA] text-xs font-semibold text-[#20212B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#626573]" />
              <span>Registrar consulta</span>
            </button>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
