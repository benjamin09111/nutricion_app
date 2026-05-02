"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  Loader2,
  ChefHat,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

const quickAccessCards = [
  {
    title: "Entregable rápido",
    description: "Arma un resumen express para una consulta corta.",
    href: "/dashboard/rapido",
    icon: Zap,
    accent: "bg-amber-50 border-amber-100 text-amber-700",
  },
  {
    title: "Recetas rápidas",
    description: "Genera platos reutilizables en minutos.",
    href: "/dashboard/rapido/recetas",
    icon: ChefHat,
    accent: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  {
    title: "Entregable personalizado",
    description: "Compila el paquete final para entregar al paciente.",
    href: "/dashboard/entregable",
    icon: ClipboardCheck,
    accent: "bg-indigo-50 border-indigo-100 text-indigo-700",
  },
];

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
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Inicio
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Centro de trabajo clínico
              </h1>
              <p className="max-w-3xl text-sm font-medium text-slate-500">
                Entra rápido a lo que más usas, revisa tu carga actual y retoma
                proyectos sin perder tiempo.
              </p>
            </div>

          </div>
        </section>

                <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Atajos rápidos</h2>
              <p className="text-sm font-medium text-slate-500">
                Solo accesos útiles para trabajar más rápido.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {quickAccessCards.map((module) => (
              <Card
                key={module.title}
                className="rounded-[1.75rem] border-slate-200 shadow-sm"
              >
                <CardHeader className="space-y-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${module.accent}`}
                  >
                    <module.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-black text-slate-900">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="h-10 w-full rounded-xl font-black"
                    onClick={() => router.push(module.href)}
                  >
                    Abrir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[1.75rem] border-slate-200 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-black text-slate-900">
                  Pacientes registrados
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Total de pacientes disponibles en tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-black tracking-tight text-slate-900">
                    {patientCount}
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Pacientes activos en el sistema
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl px-5 font-black"
                  onClick={() => router.push("/dashboard/pacientes")}
                >
                  Ver
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-[1.75rem] border-slate-200 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-black text-slate-900">
                  Citas pendientes
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Vista visual del bloque de agenda que agregaremos después.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-black tracking-tight text-slate-900">
                    {pendingAppointmentsCount}
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Pendientes por revisar
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl px-5 font-black"
                  onClick={() => setIsAppointmentsPreviewOpen(true)}
                >
                  Ver
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Proyectos recientes
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Retoma flujos reales y continúa el trabajo desde la dieta.
              </p>
            </div>
            <Button
              variant="ghost"
              className="h-10 rounded-xl font-black"
              onClick={loadDashboardData}
            >
              Actualizar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm font-bold text-slate-500">
                Todavía no hay proyectos creados.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="rounded-[1.5rem] border-slate-200 shadow-sm"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                        {project.mode === "CLINICAL" ? "Clínico" : "General"}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        {project.status}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm font-medium text-slate-500">
                        {project.patient?.fullName
                          ? `Paciente: ${project.patient.fullName}`
                          : "Proyecto sin paciente vinculado"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        Dieta: {project.activeDietCreation ? "OK" : "Pendiente"}
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        Recetas: {project.activeRecipeCreation ? "OK" : "Pendiente"}
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        Carrito: {project.activeCartCreation ? "OK" : "Pendiente"}
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        Entregable: {project.activeDeliverableCreation ? "OK" : "Pendiente"}
                      </div>
                    </div>

                                        <div className="flex flex-wrap gap-2">
                      <Button
                        className="h-10 rounded-xl bg-emerald-600 px-4 font-black text-white"
                        onClick={() => openProject(project, "/dashboard/dieta")}
                      >
                        Continuar proyecto
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={isAppointmentsPreviewOpen}
        onClose={() => setIsAppointmentsPreviewOpen(false)}
        title="Citas pendientes"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-600">
            Este bloque quedará conectado a la gestión de citas en el siguiente paso.
            Por ahora funciona como vista rápida.
          </p>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
            No hay agenda activa todavía.
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="h-10 rounded-xl px-5 font-black"
              onClick={() => setIsAppointmentsPreviewOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          projectMode === "CLINICAL"
            ? "Nuevo proyecto clínico"
            : "Nuevo proyecto general"
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Nombre del proyecto
            </label>
            <Input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Ej: Plan antiinflamatorio María"
              className="h-12 rounded-xl"
            />
          </div>

          {projectMode === "CLINICAL" && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Paciente
              </label>
              <select
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
              >
                <option value="">Sin seleccionar</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
              {selectedPatient ? (
                <p className="text-xs font-medium text-emerald-700">
                  Se vinculará con {selectedPatient.fullName}.
                </p>
              ) : null}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              className="h-11 flex-1 rounded-xl bg-emerald-600 font-black text-white"
              onClick={handleCreateProject}
              isLoading={isSubmitting}
            >
              Crear y abrir Dieta
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl px-4 font-black"
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

