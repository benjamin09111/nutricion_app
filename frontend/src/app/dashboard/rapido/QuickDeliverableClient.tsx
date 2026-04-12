"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  FileCode,
  GripVertical,
  Library,
  NotebookText,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  User,
} from "lucide-react";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { type ActionDockItem } from "@/components/ui/ActionDock";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { fetchCreation, fetchProject, saveCreation } from "@/lib/workflow";
import { downloadFastDeliverablePdf } from "@/features/pdf/fastDeliverablePdfExport";

type QuickSection =
  | "Desayuno"
  | "Colación AM"
  | "Almuerzo"
  | "Colación PM"
  | "Once"
  | "Cena"
  | "Post entreno";

type QuickMeal = {
  id: string;
  section: QuickSection;
  time: string;
  mealText: string;
  portion: string;
};

type ResourceTemplate = {
  id: string;
  title: string;
  content: string;
};

type ResolvedResourcePage = {
  resourceId: string;
  title: string;
  content: string;
  variables: Record<string, string>;
};

type QuickPatient = {
  id?: string;
  fullName: string;
  email?: string | null;
};

const QUICK_SECTIONS: QuickSection[] = [
  "Desayuno",
  "Colación AM",
  "Almuerzo",
  "Colación PM",
  "Once",
  "Cena",
  "Post entreno",
];

const QUICK_PORTION_GUIDE = [
  { category: "Verduras y ensaladas", portion: "2 tazas crudas o 1 taza cocida por comida principal." },
  { category: "Frutas", portion: "1 unidad mediana o 1 taza picada." },
  { category: "Cereales y tubérculos", portion: "1/2 a 1 taza cocida, según hambre y objetivo." },
  { category: "Legumbres", portion: "3/4 taza cocida como porción base." },
  { category: "Proteínas", portion: "90 a 120 g cocidos, equivalente a la palma de la mano." },
  { category: "Lácteos o equivalentes", portion: "1 taza de leche o yogur, o 1 lámina de queso fresco." },
  { category: "Grasas saludables", portion: "1 cda de aceite o 1/4 de palta." },
];

const DEFAULT_TITLE = "Entregable rápido";

const createMeal = (section: QuickSection = "Desayuno"): QuickMeal => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  section,
  time: "",
  mealText: "",
  portion: "",
});

function extractVariablesFromContent(content: string): string[] {
  const regex = /\^([a-zA-Z0-9_\- ]+)\^/g;
  const variables = new Set<string>();
  let match = regex.exec(content || "");
  while (match) {
    variables.add(match[1].trim());
    match = regex.exec(content || "");
  }
  return Array.from(variables);
}

export default function QuickDeliverableClient() {
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");
  const projectId = searchParams.get("project");

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [meals, setMeals] = useState<QuickMeal[]>([
    createMeal("Desayuno"),
    createMeal("Almuerzo"),
    createMeal("Cena"),
  ]);
  const [sectionToAdd, setSectionToAdd] = useState<QuickSection>("Colación AM");
  const [avoidFoods, setAvoidFoods] = useState<string[]>([""]);
  const [includePortionGuide, setIncludePortionGuide] = useState(true);
  const [resources, setResources] = useState<ResourceTemplate[]>([]);
  const [resolvedResourcePages, setResolvedResourcePages] = useState<ResolvedResourcePage[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [resourceVariables, setResourceVariables] = useState<Record<string, string>>({});
  const [patients, setPatients] = useState<QuickPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [creationDescription, setCreationDescription] = useState("");
  const [draggedMealId, setDraggedMealId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem("nutri_quick_deliverable_draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title || DEFAULT_TITLE);
      setMeals(Array.isArray(parsed.meals) && parsed.meals.length > 0 ? parsed.meals : [createMeal("Desayuno")]);
      setAvoidFoods(Array.isArray(parsed.avoidFoods) && parsed.avoidFoods.length > 0 ? parsed.avoidFoods : [""]);
      setResolvedResourcePages(Array.isArray(parsed.resources) ? parsed.resources : []);
      setIncludePortionGuide(parsed.includePortionGuide !== false);
      setSelectedPatient(parsed.selectedPatient || null);
    } catch (error) {
      console.error("Error loading quick draft", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "nutri_quick_deliverable_draft",
      JSON.stringify({
        title,
        meals,
        avoidFoods,
        resources: resolvedResourcePages,
        includePortionGuide,
        selectedPatient,
      }),
    );
  }, [title, meals, avoidFoods, resolvedResourcePages, includePortionGuide, selectedPatient]);

  useEffect(() => {
    const loadCreation = async () => {
      if (!creationId) return;
      try {
        const creation = await fetchCreation(creationId);
        const content = creation.content || {};
        setTitle(content.title || creation.name || DEFAULT_TITLE);
        setMeals(Array.isArray(content.meals) && content.meals.length > 0 ? content.meals : [createMeal("Desayuno")]);
        setAvoidFoods(Array.isArray(content.avoidFoods) && content.avoidFoods.length > 0 ? content.avoidFoods : [""]);
        setResolvedResourcePages(Array.isArray(content.resources) ? content.resources : []);
        setIncludePortionGuide(content.includePortionGuide !== false);
        if (creation.metadata?.patientName) {
          setSelectedPatient({
            id: creation.metadata?.patientId,
            fullName: creation.metadata.patientName,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar el entregable rápido.");
      }
    };

    loadCreation();
  }, [creationId]);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const project = await fetchProject(projectId);
        setCurrentProjectName(project.name || null);
        setCurrentProjectMode(project.mode || null);
        if (project.patient) {
          setSelectedPatient((current) => current || (project.patient as QuickPatient));
        }
      } catch (error) {
        console.error("Error loading project", error);
      }
    };

    loadProject();
  }, [projectId]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    return patients.filter((patient) =>
      (patient.fullName || "").toLowerCase().includes(patientSearch.toLowerCase()),
    );
  }, [patients, patientSearch]);

  const validAvoidFoods = useMemo(
    () => avoidFoods.map((food) => food.trim()).filter(Boolean),
    [avoidFoods],
  );

  const openPatientModal = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching patients", error);
    }
    setPatientSearch("");
    setIsPatientModalOpen(true);
  };

  const fetchResources = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/resources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Error loading resources", error);
    }
  };

  const openResourceModal = async () => {
    await fetchResources();
    setSelectedResourceId("");
    setResourceVariables({});
    setIsResourceModalOpen(true);
  };

  const addResolvedResourcePage = async () => {
    if (!selectedResourceId) {
      toast.error("Selecciona un recurso.");
      return;
    }

    const resource = resources.find((item) => item.id === selectedResourceId);
    if (!resource) return;

    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/resources/resolve-variables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: resource.content,
          inputs: resourceVariables,
        }),
      });

      if (!response.ok) throw new Error("resolve failed");
      const data = await response.json();
      setResolvedResourcePages((prev) => [
        ...prev,
        {
          resourceId: resource.id,
          title: resource.title,
          content: data.resolvedContent || resource.content,
          variables: resourceVariables,
        },
      ]);
      setIsResourceModalOpen(false);
      toast.success("Recurso agregado al entregable rápido.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo agregar el recurso.");
    }
  };

  const updateMeal = (mealId: string, field: keyof QuickMeal, value: string) => {
    setMeals((current) =>
      current.map((meal) => (meal.id === mealId ? { ...meal, [field]: value } : meal)),
    );
  };

  const addMeal = () => {
    setMeals((current) => [...current, createMeal(sectionToAdd)]);
  };

  const removeMeal = (mealId: string) => {
    setMeals((current) => current.filter((meal) => meal.id !== mealId));
  };

  const moveMeal = (targetMealId: string) => {
    if (!draggedMealId || draggedMealId === targetMealId) return;
    setMeals((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((meal) => meal.id === draggedMealId);
      const toIndex = next.findIndex((meal) => meal.id === targetMealId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const updateAvoidFood = (index: number, value: string) => {
    setAvoidFoods((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addAvoidFoodRow = () => {
    setAvoidFoods((current) => [...current, ""]);
  };

  const removeAvoidFood = (index: number) => {
    setAvoidFoods((current) => (current.length === 1 ? [""] : current.filter((_, itemIndex) => itemIndex !== index)));
  };

  const buildPdfPayload = () => ({
    name: title.trim() || DEFAULT_TITLE,
    patientName: selectedPatient?.fullName || null,
    meals,
    avoidFoods: validAvoidFoods,
    resources: resolvedResourcePages,
    portionGuide: includePortionGuide ? QUICK_PORTION_GUIDE : [],
    generatedAt: new Date().toLocaleDateString("es-CL"),
  });

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadFastDeliverablePdf(buildPdfPayload());
      toast.success("PDF express descargado correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveToCreations = async () => {
    setIsSaving(true);
    try {
      await saveCreation({
        name: title.trim() || DEFAULT_TITLE,
        type: "FAST_DELIVERABLE",
        content: {
          title,
          meals,
          avoidFoods: validAvoidFoods,
          resources: resolvedResourcePages,
          includePortionGuide,
          portionGuide: QUICK_PORTION_GUIDE,
          updatedAt: new Date().toISOString(),
        },
        metadata: {
          ...(creationDescription.trim() ? { description: creationDescription.trim() } : {}),
          ...(selectedPatient
            ? { patientId: selectedPatient.id, patientName: selectedPatient.fullName }
            : {}),
          mealCount: meals.length,
          avoidFoodsCount: validAvoidFoods.length,
          resourceCount: resolvedResourcePages.length,
        },
        tags: ["rapido", "express"],
      });
      toast.success("Entregable rápido guardado en creaciones.");
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el entregable rápido.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetQuickDeliverable = () => {
    setTitle(DEFAULT_TITLE);
    setMeals([createMeal("Desayuno"), createMeal("Almuerzo"), createMeal("Cena")]);
    setAvoidFoods([""]);
    setResolvedResourcePages([]);
    setIncludePortionGuide(true);
    localStorage.removeItem("nutri_quick_deliverable_draft");
    toast.success("Entregable rápido reiniciado.");
  };

  const printJson = () => {
    console.group("quick-deliverable");
    console.log(buildPdfPayload());
    console.groupEnd();
    toast.info("JSON impreso en consola.");
  };

  const actionDockItems: ActionDockItem[] = [
    {
      id: "patient",
      icon: User,
      label: selectedPatient ? "Cambiar paciente" : "Asignar paciente",
      variant: "emerald",
      onClick: openPatientModal,
    },
    {
      id: "resource",
      icon: Library,
      label: "Agregar recurso",
      variant: "indigo",
      onClick: openResourceModal,
    },
    {
      id: "save",
      icon: Save,
      label: "Guardar creación",
      variant: "slate",
      onClick: () => setIsSaveCreationModalOpen(true),
    },
    {
      id: "json",
      icon: FileCode,
      label: "Imprimir JSON",
      variant: "slate",
      onClick: printJson,
    },
    {
      id: "reset",
      icon: RotateCcw,
      label: "Reiniciar",
      variant: "rose",
      onClick: resetQuickDeliverable,
    },
  ];

  return (
    <>
      <ModuleLayout
        title="Rápido"
        description="Crea un entregable express de una sola hoja con horarios, indicaciones, alimentos a evitar, recursos y una guía breve de porciones."
        step={{ number: "Express", label: "Entregable rápido", icon: NotebookText, color: "text-slate-600" }}
        rightNavItems={actionDockItems}
        className="max-w-6xl"
        footer={
          <ModuleFooter>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Formato resumido para consulta única
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-11 rounded-2xl border-slate-200" onClick={() => setIsSaveCreationModalOpen(true)}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button className="h-11 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800" onClick={handleExportPdf} disabled={isExportingPdf}>
                <Download className="mr-2 h-4 w-4" />
                {isExportingPdf ? "Generando..." : "Descargar PDF"}
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={currentProjectName}
          patientName={selectedPatient?.fullName || null}
          mode={currentProjectMode}
          moduleLabel="Rápido"
        />

        <div className="mt-6 space-y-8">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Este módulo está pensado para consultas express: se guarda como <strong>entregable rápido</strong> y el PDF sale en una sola hoja, sin portada.
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr,0.9fr]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Identidad del entregable
                    </p>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-base font-semibold"
                      placeholder={DEFAULT_TITLE}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {selectedPatient?.fullName
                      ? `Paciente: ${selectedPatient.fullName}`
                      : "Sin paciente asignado"}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Tabla de comidas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Arrastra los bloques para ordenar el día y completa hora,
                      indicación y porción.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sectionToAdd}
                      onChange={(e) =>
                        setSectionToAdd(e.target.value as QuickSection)
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      {QUICK_SECTIONS.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="h-11 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={addMeal}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {meals.map((meal, index) => (
                    <div
                      key={meal.id}
                      draggable
                      onDragStart={() => setDraggedMealId(meal.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => moveMeal(meal.id)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-3 xl:grid-cols-[40px,180px,140px,1fr,180px,44px] xl:items-start">
                        <div className="flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <select
                          value={meal.section}
                          onChange={(e) =>
                            updateMeal(meal.id, "section", e.target.value)
                          }
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                        >
                          {QUICK_SECTIONS.map((section) => (
                            <option key={section} value={section}>
                              {section}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="time"
                          value={meal.time}
                          onChange={(e) =>
                            updateMeal(meal.id, "time", e.target.value)
                          }
                          className="h-11 rounded-2xl border-slate-200 bg-white"
                        />
                        <Textarea
                          value={meal.mealText}
                          onChange={(e) =>
                            updateMeal(meal.id, "mealText", e.target.value)
                          }
                          className="min-h-[92px] rounded-2xl border-slate-200 bg-white"
                          placeholder={`Indicaciones para ${meal.section.toLowerCase()}...`}
                        />
                        <Input
                          value={meal.portion}
                          onChange={(e) =>
                            updateMeal(meal.id, "portion", e.target.value)
                          }
                          className="h-11 rounded-2xl border-slate-200 bg-white"
                          placeholder="Ej: 1 plato o 150 g"
                        />
                        <button
                          type="button"
                          onClick={() => removeMeal(meal.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Bloque {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Alimentos a evitar
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Agrega filas simples para dejar restricciones o
                      recordatorios rápidos.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200"
                    onClick={addAvoidFoodRow}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar fila
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  {avoidFoods.map((food, index) => (
                    <div key={`${index}-${food}`} className="flex gap-3">
                      <Input
                        value={food}
                        onChange={(e) =>
                          updateAvoidFood(index, e.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                        placeholder="Ej: bebidas azucaradas, frituras, alcohol..."
                      />
                      <button
                        type="button"
                        onClick={() => removeAvoidFood(index)}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Recursos específicos
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Puedes sumar material breve adaptado al paciente.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200"
                    onClick={openResourceModal}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  {resolvedResourcePages.length > 0 ? (
                    resolvedResourcePages.map((resource, index) => (
                      <div
                        key={`${resource.resourceId}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-slate-800">
                            {resource.title}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setResolvedResourcePages((current) =>
                                current.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {resource.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Todavía no agregas recursos para este entregable.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Guía resumida de porciones
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Resumen profesional simple para que el paciente entienda
                      referencias base.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={includePortionGuide}
                      onChange={(e) =>
                        setIncludePortionGuide(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Incluir
                  </label>
                </div>

                <div
                  className={cn(
                    "mt-5 overflow-hidden rounded-2xl border border-slate-200",
                    !includePortionGuide && "opacity-45",
                  )}
                >
                  {QUICK_PORTION_GUIDE.map((item) => (
                    <div
                      key={item.category}
                      className="grid grid-cols-[0.95fr,1.2fr] gap-4 border-b border-slate-200 px-4 py-3 last:border-b-0"
                    >
                      <p className="text-sm font-bold text-slate-800">
                        {item.category}
                      </p>
                      <p className="text-sm leading-6 text-slate-600">
                        {item.portion}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Resumen express
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-black">{meals.length}</p>
                    <p className="text-xs uppercase tracking-widest text-slate-300">
                      Bloques de comida
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-black">
                      {validAvoidFoods.length}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-300">
                      Alimentos a evitar
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-black">
                      {resolvedResourcePages.length}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-300">
                      Recursos
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-black">
                      {includePortionGuide ? QUICK_PORTION_GUIDE.length : 0}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-300">
                      Porciones visibles
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </ModuleLayout>

      <Modal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        title="Asignar paciente"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="h-11 rounded-xl border-slate-200 bg-slate-50"
          />
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setIsPatientModalOpen(false);
                    toast.success(`Paciente ${patient.fullName} asignado.`);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <p className="font-bold text-slate-800">
                    {patient.fullName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {patient.email || "Sin correo registrado"}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No hay pacientes disponibles para esta búsqueda.
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => setIsPatientModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Agregar recurso"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <select
            value={selectedResourceId}
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedResourceId(nextId);
              const selectedResource = resources.find(
                (item) => item.id === nextId,
              );
              const variables = extractVariablesFromContent(
                selectedResource?.content || "",
              );
              const initialInputs: Record<string, string> = {};
              variables.forEach((variableKey) => {
                initialInputs[variableKey] = "";
              });
              setResourceVariables(initialInputs);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Selecciona un recurso</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.title}
              </option>
            ))}
          </select>

          {Object.keys(resourceVariables).length > 0 ? (
            <div className="space-y-3">
              {Object.keys(resourceVariables).map((variableKey) => (
                <div key={variableKey} className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {variableKey}
                  </p>
                  <Input
                    value={resourceVariables[variableKey]}
                    onChange={(e) =>
                      setResourceVariables((current) => ({
                        ...current,
                        [variableKey]: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-slate-200 bg-slate-50"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <Button
            className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={addResolvedResourcePage}
          >
            Agregar al entregable
          </Button>
        </div>
      </Modal>

      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={handleSaveToCreations}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title="Guardar entregable rápido"
        subtitle="Añade una breve descripción para identificar esta versión express dentro de Mis creaciones."
        isSaving={isSaving}
      />
    </>
  );
}
