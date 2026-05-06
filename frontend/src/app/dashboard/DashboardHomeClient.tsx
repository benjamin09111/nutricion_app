"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChefHat,
  Users,
  CalendarDays,
  Folder,
  Loader2,
  Zap,
  ClipboardCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  buildProjectAwarePath,
  createProject,
  fetchProject,
  getWorkflowApiUrl,
  getWorkflowAuthHeaders,
  WorkflowProject,
} from "@/lib/workflow";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardHomeClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectMode, setProjectMode] = useState<"CLINICAL" | "GENERAL">(
    "CLINICAL",
  );
  const [patientId, setPatientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppointmentsPreviewOpen, setIsAppointmentsPreviewOpen] =
    useState(false);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === patientId) || null,
    [patients, patientId],
  );
  const patientCount = patients.length;
  const pendingAppointmentsCount = 0;
  const recentProjectsCount = projects.length;

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [projectsResponse, patientsResponse] = await Promise.all([
        fetch(`${getWorkflowApiUrl()}/projects`, {
          headers: getWorkflowAuthHeaders(),
        }),
        fetch(`${getWorkflowApiUrl()}/patients?limit=50`, {
          headers: getWorkflowAuthHeaders(),
        }),
      ]);

      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        setProjects(data || []);
      }

      if (patientsResponse.ok) {
        const data = await patientsResponse.json();
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error("Error loading dashboard home", error);
      toast.error("No se pudo cargar la pantalla principal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const openProject = (project: WorkflowProject, modulePath = "/dashboard/dieta") => {
    router.push(buildProjectAwarePath(modulePath, project.id));
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error("Escribe un nombre para el proyecto.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createProject({
        name: projectName.trim(),
        mode: projectMode,
        patientId: projectMode === "CLINICAL" ? patientId || undefined : undefined,
        metadata: {
          sourceModule: "dashboard-home",
        },
      });

      toast.success("Proyecto creado correctamente.");
      setIsCreateModalOpen(false);
      setProjectName("");
      setPatientId("");
      await loadDashboardData();
      router.push(buildProjectAwarePath("/dashboard/dieta", created.id));
    } catch (error: any) {
      console.error("Error creating project", error);
      toast.error(error?.message || "No se pudo crear el proyecto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6">
        {/* Header Section */}
        <header className="pt-4">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Panel de Control
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Centro de Trabajo Clínico
            </h1>
            <p className="max-w-2xl text-base text-slate-500 font-normal">
              Gestiona tus pacientes, citas y proyectos nutricionales desde un solo lugar con eficiencia y profesionalismo.
            </p>
          </div>
        </header>

        {/* Key Metrics - 3 Columns */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Patients Metric */}
          <Card className="group overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pacientes totales</p>
                    <h3 className="mt-1 text-4xl font-semibold text-slate-900">{patientCount}</h3>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-slate-400 hover:bg-slate-50"
                  onClick={() => router.push("/dashboard/pacientes")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Metric */}
          <Card className="group overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Siguiente cita</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {pendingAppointmentsCount > 0 ? "Hoy, 16:30" : "Sin citas hoy"}
                    </h3>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-slate-400 hover:bg-slate-50"
                  onClick={() => setIsAppointmentsPreviewOpen(true)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Projects Metric */}
          <Card className="group overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Proyectos activos</p>
                    <h3 className="mt-1 text-4xl font-semibold text-slate-900">{recentProjectsCount}</h3>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-slate-400 hover:bg-slate-50"
                  onClick={() => router.push("/dashboard/creaciones")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Activity / Projects List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Proyectos Recientes</h2>
            <Button
              variant="link"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              onClick={() => router.push("/dashboard/creaciones")}
            >
              Ver todos los proyectos
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-[2rem] border border-slate-100 bg-slate-50/30">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Folder className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-medium text-slate-900">No hay proyectos activos</h3>
              <p className="mt-1 text-sm text-slate-500">Comienza creando un nuevo plan nutricional para tus pacientes.</p>
              <Button 
                className="mt-6 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Crear primer proyecto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {projects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md cursor-pointer"
                  onClick={() => openProject(project)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                      {project.mode === "CLINICAL" ? <Users className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{project.name}</h4>
                      <p className="text-xs font-medium text-slate-500">
                        {project.patient?.fullName || "Proyecto General"} • {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      project.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {project.status === "ACTIVE" ? "Activo" : "Borrador"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals remain with similar logic but improved styling */}
      <Modal
        isOpen={isAppointmentsPreviewOpen}
        onClose={() => setIsAppointmentsPreviewOpen(false)}
        title="Citas Pendientes"
      >
        <div className="space-y-6 py-2">
          <p className="text-sm font-normal text-slate-500">
            Esta sección estará conectada a tu agenda profesional próximamente.
          </p>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-400">Sin agenda configurada</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-xl font-semibold text-slate-500"
              onClick={() => setIsAppointmentsPreviewOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={projectMode === "CLINICAL" ? "Nuevo Proyecto Clínico" : "Nuevo Proyecto General"}
      >
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Nombre del Proyecto
            </label>
            <Input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Ej: Plan Antiinflamatorio María"
              className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
            />
          </div>

          {projectMode === "CLINICAL" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Paciente Vinculado
              </label>
              <select
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Seleccionar paciente...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              className="h-12 flex-1 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
              onClick={handleCreateProject}
              isLoading={isSubmitting}
            >
              Comenzar Planificación
            </Button>
            <Button
              variant="ghost"
              className="h-12 rounded-xl px-6 font-semibold text-slate-500"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
