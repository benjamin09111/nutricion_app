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
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import { getWorkflowAuthHeaders } from "@/lib/workflow";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardStats {
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

interface RecentCreation {
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
    <div className="flex items-center gap-6">
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
      <div className="space-y-2 text-xs text-slate-500">
        <div className="flex items-center justify-between gap-4">
          <span>Pacientes</span>
          <span className="font-semibold text-slate-700">
            {usage.patients}/{limits.patients > 0 ? limits.patients : "∞"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Consultas</span>
          <span className="font-semibold text-slate-700">
            {usage.consultations}/{limits.consultations > 0 ? limits.consultations : "∞"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>PDFs</span>
          <span className="font-semibold text-slate-700">
            {usage.pdfs}/{limits.pdfs > 0 ? limits.pdfs : "∞"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHomeClient() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCreations, setRecentCreations] = useState<RecentCreation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
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
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
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
    <>
      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 sm:px-6">
        {/* Row 1: Welcome + Plan Usage */}
        <div
          className={cn(
            "grid grid-cols-1 gap-6 pt-4",
            planUsage.isFree && "lg:grid-cols-2",
          )}
        >
          {/* Col 1: Welcome */}
          <header className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Panel de Control
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Centro de Trabajo Clínico
            </h1>
            <p className="mt-2 max-w-xl text-base text-slate-500">
              Gestiona tus pacientes, citas y proyectos nutricionales desde un solo lugar con eficiencia y profesionalismo.
            </p>
          </header>

          {/* Col 2: Plan Usage - only for FREE plan */}
          {planUsage.isFree && (
            <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Plan Gratuito
                  </span>
                </div>
                <PlanUsageRing percent={planUsage.percent} limits={planUsage.limits} usage={planUsage.usage} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Row 2: Stats Cards */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Patients Card */}
          <Card
            className="group cursor-pointer overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            onClick={() => router.push("/dashboard/pacientes")}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pacientes totales</p>
                    <h3 className="mt-1 text-4xl font-semibold text-slate-900">{patients.total}</h3>
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {patients.active} activos
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        {patients.inactive} inactivos
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          {/* Consultations Card */}
          <Card
            className="group cursor-pointer overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            onClick={() => router.push("/dashboard/consultas")}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Consultas totales</p>
                    <h3 className="mt-1 text-4xl font-semibold text-slate-900">{consultations.total}</h3>
                    <p className="mt-2 text-xs font-medium text-slate-400">hasta la fecha</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          {/* PDFs Card */}
          <Card className="group overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">PDFs creados</p>
                    <h3 className="mt-1 text-4xl font-semibold text-slate-900">
                      {pdfs.rapido + pdfs.pautas + pdfs.dietas + pdfs.recetas}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium text-violet-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        {pdfs.rapido} rápido
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-sky-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        {pdfs.pautas} pautas
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {pdfs.dietas} dietas
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        {pdfs.recetas} recetas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Row 3: Recent Sections */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Creations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Mis creaciones</h2>
              <Button
                variant="link"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                onClick={() => router.push("/dashboard/creaciones")}
              >
                Ver todos
              </Button>
            </div>

            {recentCreations.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <FileText className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">Sin creaciones</p>
                <Button
                  className="mt-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  size="sm"
                  onClick={() => router.push("/dashboard/creaciones")}
                >
                  Ver creaciones
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCreations.map((creation) => (
                  <div
                    key={creation.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md cursor-pointer"
                    onClick={() => router.push("/dashboard/creaciones")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-900">{creation.name}</h4>
                        <p className="truncate text-xs font-medium text-slate-500">
                          {creation.patientName || creation.type} · {formatDateOnlyForLocale(creation.createdAt, { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0 text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Patients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Pacientes recientes</h2>
              <Button
                variant="link"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                onClick={() => router.push("/dashboard/pacientes")}
              >
                Ver todos
              </Button>
            </div>

            {recentPatients.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <Users className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">Sin pacientes</p>
                <Button
                  className="mt-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  size="sm"
                  onClick={() => router.push("/dashboard/pacientes/new")}
                >
                  Agregar paciente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md cursor-pointer"
                    onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-900">{patient.fullName}</h4>
                      <p className="text-xs text-slate-400">{formatDateOnlyForLocale(patient.updatedAt, { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Consultations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Consultas recientes</h2>
              <Button
                variant="link"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                onClick={() => router.push("/dashboard/consultas")}
              >
                Ver todos
              </Button>
            </div>

            {recentConsultations.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <Stethoscope className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">Sin consultas</p>
                <Button
                  className="mt-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  size="sm"
                  onClick={() => router.push("/dashboard/consultas/nueva")}
                >
                  Nueva consulta
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md cursor-pointer"
                    onClick={() => router.push(`/dashboard/consultas/${consultation.id}`)}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-900">{consultation.title}</h4>
                      <p className="truncate text-xs text-slate-400">
                        {consultation.patient?.fullName || "Sin paciente"} · {formatDateOnlyForLocale(consultation.date, { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

    </>
  );
}
