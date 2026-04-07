"use client";

import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Download,
  Eye,
  CheckCircle2,
  QrCode,
  Sparkles,
  FileText,
  ShoppingCart,
  Clock,
  User,
  Activity,
  Brain,
  Apple,
  HelpCircle,
  Info,
  Save,
  Image as ImageIcon,
  Pencil,
  Layout,
  Palette,
  X,
  ChevronLeft,
  Search,
  UserPlus,
  AlertCircle,
  Loader2,
  FileUp,
  RotateCcw,
  Library,
  GripVertical,
  Plus,
} from "lucide-react";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { PremiumGuard } from "@/components/common/PremiumGuard";
import { useAdmin } from "@/context/AdminContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import Cookies from "js-cookie";
import { fetchApi } from "@/lib/api-base";
import {
  fetchCreation,
  fetchProject,
  saveCreation,
  updateProject,
} from "@/lib/workflow";

interface ExportPackage {
  id: string;
  name: string;
  sections: string[];
  exportAs: "single" | "grouped";
}

interface ResourceTemplate {
  id: string;
  title: string;
  content: string;
  variablePlaceholders?: string[];
}

interface ResolvedResourcePage {
  resourceId: string;
  title: string;
  content: string;
  variables: Record<string, string>;
}

interface SectionItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  defaultSelected: boolean;
  category: "core" | "info";
  contentType: "practical" | "theory";
  editable?: boolean;
}

const DELIVERABLE_SECTIONS: SectionItem[] = [
  {
    id: "cover",
    label: "Portada del Entregable",
    description: "Personaliza la primera página del mini-libro.",
    icon: Layout,
    defaultSelected: true,
    category: "core",
    contentType: "practical",
    editable: true,
  },
  {
    id: "shoppingList",
    label: "Lista de Supermercado",
    description: "Listado completo de alimentos y cantidades.",
    icon: ShoppingCart,
    defaultSelected: true,
    category: "core",
    contentType: "practical",
  },
  {
    id: "patientInfo",
    label: "Información sobre el Paciente",
    description: "Datos clave, objetivos y medidas actuales.",
    icon: User,
    defaultSelected: true,
    category: "core",
    contentType: "practical",
  },
  {
    id: "qrCode",
    label: "QR Lista de Compras",
    description: "Acceso rápido para cargar el carrito en retail.",
    icon: QrCode,
    defaultSelected: true,
    category: "core",
    contentType: "practical",
  },
  {
    id: "recipes",
    label: "Recetas, Horarios y Platos",
    description: "Distribución diaria y preparación de comidas.",
    icon: Clock,
    defaultSelected: true,
    category: "core",
    contentType: "practical",
  },
  {
    id: "hormonalIntel",
    label: "Inteligencia Hormonal",
    description: "Ajustes según fase del ciclo menstrual.",
    icon: Sparkles,
    defaultSelected: true,
    category: "core",
    contentType: "practical",
  },
  {
    id: "pathologyInfo",
    label: "Información sobre Patologías",
    description: "Guía específica sobre restricciones seleccionadas.",
    icon: Info,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
  {
    id: "exercises",
    label: "Ejercicios Sugeridos",
    description: "Rutina complementaria para el plan.",
    icon: Activity,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
  {
    id: "myths",
    label: "Mitos vs Realidad",
    description: "Aclaración de conceptos nutricionales comunes.",
    icon: HelpCircle,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
  {
    id: "faq",
    label: "Preguntas Frecuentes",
    description: "Respuestas a dudas habituales del paciente.",
    icon: HelpCircle,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
  {
    id: "substitutes",
    label: "Sustitutos Comunes",
    description: "Opciones para variar el plan sin comprometerlo.",
    icon: Apple,
    defaultSelected: false,
    category: "info",
    contentType: "practical",
  },
  {
    id: "psychology",
    label: "Aspectos Psicológicos",
    description: "Manejo de la relación con la comida.",
    icon: Brain,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
  {
    id: "habits",
    label: "Checklist de Hábitos",
    description: "Seguimiento diario de rutinas saludables.",
    icon: ClipboardCheck,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
  {
    id: "hungerReal",
    label: "Hambre Real vs Capricho",
    description: "Guía para identificar hambre emocional.",
    icon: Brain,
    defaultSelected: false,
    category: "info",
    contentType: "theory",
  },
];

const getBlankDeliverableSections = () =>
  DELIVERABLE_SECTIONS.filter(
    (section) =>
      section.defaultSelected &&
      !["shoppingList", "qrCode", "recipes", "patientInfo", "hormonalIntel"].includes(
        section.id,
      ),
  ).map((section) => section.id);

export default function DeliverableClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const { role } = useAdmin();
  const [selectedSections, setSelectedSections] = useState<string[]>(
    DELIVERABLE_SECTIONS.filter((s) => s.defaultSelected).map((s) => s.id),
  );
  const [includeLogo, setIncludeLogo] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Track available modules
  const [hasCart, setHasCart] = useState(false);
  const [hasRecipes, setHasRecipes] = useState(false);

  // Flow Entry Modal
  const [showInitModal, setShowInitModal] = useState(false);
  const [hasDraftMemory, setHasDraftMemory] = useState(false);

  const [isImportPatientModalOpen, setIsImportPatientModalOpen] =
    useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [resources, setResources] = useState<ResourceTemplate[]>([]);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [resourceVariables, setResourceVariables] = useState<Record<string, string>>({});
  const [resolvedResourcePages, setResolvedResourcePages] = useState<ResolvedResourcePage[]>([]);

  // Export Wizard State
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"single" | "advanced">("single");
  const [exportPackages, setExportPackages] = useState<ExportPackage[]>([]);
  const [contentFilter, setContentFilter] = useState<"all" | "practical" | "theory">("all");
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    projectIdFromUrl,
  );
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(
    null,
  );
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setCurrentProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  // Load project draft on mount
  useEffect(() => {
    if (projectIdFromUrl) {
      const loadProjectContext = async () => {
        try {
          const project = await fetchProject(projectIdFromUrl);
          setCurrentProjectId(project.id);
          setCurrentProjectName(project.name);
          setCurrentProjectMode(project.mode);
          setShowInitModal(false);

          const draft: Record<string, any> = {};

          if (project.patient) {
            setSelectedPatient(project.patient);
            localStorage.setItem("nutri_patient", JSON.stringify(project.patient));
            draft.patientMeta = {
              id: project.patient.id,
              fullName: project.patient.fullName,
              restrictions: project.patient.dietRestrictions || [],
              weight: project.patient.weight,
              height: project.patient.height,
              updatedAt: new Date().toISOString(),
            };
          }

          if (project.activeDietCreationId) {
            const creation = await fetchCreation(project.activeDietCreationId);
            draft.diet = creation.content;
          }

          if (project.activeCartCreationId) {
            const creation = await fetchCreation(project.activeCartCreationId);
            draft.cart = creation.content;
            setHasCart(true);
          }

          if (project.activeRecipeCreationId) {
            const creation = await fetchCreation(project.activeRecipeCreationId);
            draft.recipes = creation.content;
            setHasRecipes(true);
          }

          if (project.activeDeliverableCreationId) {
            const creation = await fetchCreation(
              project.activeDeliverableCreationId,
            );
            const deliverableContent = creation.content || {};
            setSelectedSections(
              deliverableContent.selectedSections ||
                DELIVERABLE_SECTIONS.filter((s) => s.defaultSelected).map(
                  (s) => s.id,
                ),
            );
            setIncludeLogo(deliverableContent.includeLogo ?? true);
            setExportPackages(deliverableContent.exportPackages || []);
            setResolvedResourcePages(deliverableContent.resourcePages || []);
            draft.deliverable = deliverableContent;
          }

          localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        } catch (error) {
          console.error("Error loading project deliverable context", error);
          toast.error("No se pudo cargar el proyecto en Entregable.");
        }
      };

      loadProjectContext();
      return;
    }

    let internalHasCart = false;
    let internalHasRecipes = false;

    const storedDraft = localStorage.getItem("nutri_active_draft");
    const storedPatient = localStorage.getItem("nutri_patient");

    // Revisar si hay estado en memoria para el pop-up de bienvenida
    const isFlow = window.location.search.includes("flow=continue");
    if (!isFlow && (storedDraft || storedPatient)) {
      setHasDraftMemory(true);
      setShowInitModal(true);
    }

    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        if (draft.deliverable) {
          if (draft.deliverable.selectedSections) {
            setSelectedSections(draft.deliverable.selectedSections);
          }
          if (draft.deliverable.includeLogo !== undefined) {
            setIncludeLogo(draft.deliverable.includeLogo);
          }
          if (Array.isArray(draft.deliverable.resourcePages)) {
            setResolvedResourcePages(draft.deliverable.resourcePages);
          }
          if (Array.isArray(draft.deliverable.exportPackages)) {
            setExportPackages(
              draft.deliverable.exportPackages.map((pkg: ExportPackage) => ({
                ...pkg,
                exportAs: pkg.exportAs || "single",
              }))
            );
          }
        } else {
          // Defaults
          const availableDefaults = DELIVERABLE_SECTIONS.filter((s) => {
            if (!s.defaultSelected) return false;
            // Disabled sections shouldn't be selected by default
            if ((s.id === "shoppingList" || s.id === "qrCode") && !draft.cart) return false;
            if (s.id === "recipes" && !draft.recipes) return false;
            if ((s.id === "patientInfo" || s.id === "hormonalIntel") && !storedPatient) return false;
            return true;
          }).map((s) => s.id);
          setSelectedSections(availableDefaults);
        }

        internalHasCart = !!draft.cart;
        internalHasRecipes = !!draft.recipes;
      } catch (e) {
        console.error("Error loading project draft", e);
      }
    }

    setHasCart(internalHasCart);
    setHasRecipes(internalHasRecipes);
  }, [projectIdFromUrl]);

  // Auto-save deliverable config to draft
  useEffect(() => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    let draft = storedDraft ? JSON.parse(storedDraft) : {};

    draft.deliverable = {
      selectedSections,
      includeLogo,
      exportPackages,
      resourcePages: resolvedResourcePages,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
  }, [selectedSections, includeLogo, exportPackages, resolvedResourcePages]);

  // Load stored patient
  useEffect(() => {
    const storedPatient = localStorage.getItem("nutri_patient");
    if (storedPatient) {
      try {
        setSelectedPatient(JSON.parse(storedPatient));
      } catch (e) {
        console.error("Failed to parse stored patient", e);
      }
    }
  }, []);

  const toggleSection = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const availableSections = DELIVERABLE_SECTIONS.map((section) => {
    let disabled = false;
    let finalDescription = section.description;

    if (section.id === "shoppingList" || section.id === "qrCode") {
      if (!hasCart) {
        disabled = true;
        finalDescription = "⚠️ Requiere carrito cargado o paciente asociado.";
      }
    }
    if (section.id === "recipes") {
      if (!hasRecipes) {
        disabled = true;
        finalDescription = "⚠️ Requiere recetario cargado o paciente asociado.";
      }
    }
    if (section.id === "patientInfo" || section.id === "hormonalIntel") {
      if (!selectedPatient) {
        disabled = true;
        finalDescription = "⚠️ Requiere asignar paciente o cargar métricas.";
      }
    }

    return { ...section, disabled, description: finalDescription };
  });

  const selectedSectionItems = selectedSections
    .map((id) => availableSections.find((section) => section.id === id))
    .filter(Boolean) as (SectionItem & { disabled?: boolean })[];

  const moveSelectedSection = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = selectedSections.indexOf(sourceId);
    const targetIndex = selectedSections.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const next = [...selectedSections];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setSelectedSections(next);
  };

  const handleExportSingle = async () => {
    setIsExporting(true);

    try {
      toast.loading("Compilando PDF nativo en el navegador...", {
        id: "pdf-toast",
      });

      const { pdf } = await import("@react-pdf/renderer");
      const { StandardTemplate } =
        await import("@/features/deliverable/components/StandardTemplate");

      const storedDraft = localStorage.getItem("nutri_active_draft");
      const draftData = storedDraft ? JSON.parse(storedDraft) : {};

      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const brandSettings = userObj?.nutritionist?.settings || {};

      const config = {
        includeLogo,
        selectedSections,
        brandSettings,
      };

      const blob = await pdf(
        <StandardTemplate data={draftData} config={config} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Plan_Nutricional_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("¡PDF generado y descargado exitosamente!", {
        id: "pdf-toast",
      });
      setIsExportWizardOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Ocurrió un error al generar de PDF. Revisa la consola.", {
        id: "pdf-toast",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAdvanced = async () => {
    setIsExporting(true);
    try {
      toast.loading("Generando paquetes PDF separados...", {
        id: "pdf-toast",
      });

      const { pdf } = await import("@react-pdf/renderer");
      const { StandardTemplate } =
        await import("@/features/deliverable/components/StandardTemplate");

      const storedDraft = localStorage.getItem("nutri_active_draft");
      const draftData = storedDraft ? JSON.parse(storedDraft) : {};

      // Filter out empty packages
      const validPackages = exportPackages.filter(p => p.sections.length > 0 && p.name.trim() !== "");

      if (validPackages.length === 0) {
        toast.error("Debes tener al menos un paquete con módulos seleccionados", { id: "pdf-toast" });
        setIsExporting(false);
        return;
      }

      const tasks: { pkgName: string; sections: string[] }[] = [];
      validPackages.forEach((pkg) => {
        if (pkg.exportAs === "single") {
          tasks.push({ pkgName: pkg.name, sections: pkg.sections });
          return;
        }
        pkg.sections.forEach((sectionId) => {
          const section = DELIVERABLE_SECTIONS.find((s) => s.id === sectionId);
          tasks.push({
            pkgName: `${pkg.name} - ${section?.label || sectionId}`,
            sections: [sectionId],
          });
        });
      });

      await Promise.all(
        tasks.map(async (task, index) => {
          const userStr = localStorage.getItem("user");
          const userObj = userStr ? JSON.parse(userStr) : null;
          const brandSettings = userObj?.nutritionist?.settings || {};

          const config = {
            includeLogo,
            selectedSections: task.sections,
            brandSettings,
          };

          const blob = await pdf(
            <StandardTemplate data={draftData} config={config} />,
          ).toBlob();

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${task.pkgName.replace(/ /g, "_")}_${Date.now()}.pdf`;
          document.body.appendChild(a);

          setTimeout(() => {
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, index * 800);
        })
      );

      toast.success("¡Paquetes PDF generados y descargados!", {
        id: "pdf-toast",
      });
      setIsExportWizardOpen(false);
    } catch (error) {
      console.error("Error generating advanced PDFs:", error);
      toast.error("Ocurrió un error al generar los PDF separados.", {
        id: "pdf-toast",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openExportWizard = () => {
    // Inicializar paquetes avanzados por defecto
    const coreSections = selectedSections.filter(id => DELIVERABLE_SECTIONS.find(s => s.id === id)?.category === "core");
    const infoSections = selectedSections.filter(id => DELIVERABLE_SECTIONS.find(s => s.id === id)?.category === "info");

    const defaultPackages: ExportPackage[] = [];

    if (coreSections.length > 0) {
      defaultPackages.push({ id: crypto.randomUUID(), name: "Plan Práctico", sections: coreSections, exportAs: "single" });
    }
    if (infoSections.length > 0) {
      defaultPackages.push({ id: crypto.randomUUID(), name: "Material Teórico", sections: infoSections, exportAs: "single" });
    }

    if (defaultPackages.length === 0) {
      defaultPackages.push({ id: crypto.randomUUID(), name: "Documento en Blanco", sections: [], exportAs: "single" });
    }

    setExportPackages(defaultPackages);
    setIsExportWizardOpen(true);
  };

  const setSplitQuickPreset = () => {
    const listSections = selectedSections.filter(id => ['shoppingList', 'qrCode', 'substitutes'].includes(id));
    const recipeSections = selectedSections.filter(id => ['recipes', 'hormonalIntel'].includes(id));
    const remainingSections = selectedSections.filter(id => !listSections.includes(id) && !recipeSections.includes(id));

    const presets: ExportPackage[] = [];
    if (remainingSections.length > 0) presets.push({ id: crypto.randomUUID(), name: "Plan Clínico General", sections: remainingSections, exportAs: "single" });
    if (recipeSections.length > 0) presets.push({ id: crypto.randomUUID(), name: "Recetario y Minuta", sections: recipeSections, exportAs: "single" });
    if (listSections.length > 0) presets.push({ id: crypto.randomUUID(), name: "Lista del Supermercado", sections: listSections, exportAs: "single" });

    setExportPackages(presets);
  };

  const handleSaveToCreations = async (description?: string) => {
    setIsSaving(true);
    try {
      const storedDraft = localStorage.getItem("nutri_active_draft");
      const draftData = storedDraft ? JSON.parse(storedDraft) : {};

      const savedCreation = await saveCreation({
        name:
          selectedPatient?.fullName
            ? `Entregable ${selectedPatient.fullName}`
            : `Entregable ${new Date().toLocaleDateString("es-CL")}`,
        type: "DELIVERABLE",
        content: {
          selectedSections,
          includeLogo,
          exportPackages,
          resourcePages: resolvedResourcePages,
          draftData,
          updatedAt: new Date().toISOString(),
        },
        metadata: {
          ...(description?.trim()
            ? { description: description.trim() }
            : {}),
          sectionCount: selectedSections.length,
          hasCart,
          hasRecipes,
          ...(selectedPatient
            ? {
                patientId: selectedPatient.id,
                patientName: selectedPatient.fullName,
              }
            : {}),
        },
        tags: [],
      });

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          activeDeliverableCreationId: savedCreation.id,
          patientId: selectedPatient?.id,
          metadata: {
            sourceModule: "deliverable",
            selectedSections,
          },
        });
      }

      toast.success("Guardado en mis creaciones correctamente.");
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: any) {
      console.error("Error saving deliverable creation", error);
      toast.error(
        error?.message || "No se pudo guardar el entregable.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const extractVariablesFromContent = (content: string): string[] => {
    const regex = /\^([a-zA-Z0-9_\- ]+)\^/g;
    const variables = new Set<string>();
    let match = regex.exec(content || "");
    while (match) {
      variables.add(match[1].trim());
      match = regex.exec(content || "");
    }
    return Array.from(variables);
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
      const page: ResolvedResourcePage = {
        resourceId: resource.id,
        title: resource.title,
        content: data.resolvedContent || resource.content,
        variables: resourceVariables,
      };
      setResolvedResourcePages((prev) => [...prev, page]);
      setIsResourceModalOpen(false);
      toast.success("Página extra agregada al entregable.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo resolver variables del recurso.");
    }
  };

  const handleEditSection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toast.info(`Abriendo editor de ${id}...`);
  };

  const printJson = () => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    console.group("📊 PROJECT DRAFT JSON (STAGE 1-4)");
    console.log(storedDraft ? JSON.parse(storedDraft) : "No draft found");
    console.groupEnd();
    toast.info("JSON completo del proyecto impreso en consola.");
  };

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching patients", e);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    localStorage.setItem("nutri_patient", JSON.stringify(patient));

    // Sync metadata to global draft
    const storedDraft = localStorage.getItem("nutri_active_draft");
    let draft = storedDraft ? JSON.parse(storedDraft) : {};

    const restrictions = Array.isArray(patient.dietRestrictions)
      ? patient.dietRestrictions
      : [];
    const validRestrictions = restrictions.filter(
      (r: string) => r && r.trim() !== "",
    );

    draft.patientMeta = {
      id: patient.id,
      fullName: patient.fullName,
      restrictions: validRestrictions,
      nutritionalFocus: patient.nutritionalFocus,
      fitnessGoals: patient.fitnessGoals,
      birthDate: patient.birthDate,
      weight: patient.weight,
      height: patient.height,
      gender: patient.gender,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

    toast.success(`Paciente vinculado: ${patient.fullName}`);
    setIsImportPatientModalOpen(false);
    setPatientSearchQuery("");
  };

  const handlePatientLoad = () => {
    setIsImportPatientModalOpen(true);
    fetchPatients();
  };

  const handleUnlinkPatient = () => {
    setSelectedPatient(null);
    localStorage.removeItem("nutri_patient");
    toast.info("Paciente desvinculado de esta sesión");
  };

  const resetDeliverable = () => {
    setSelectedSections(getBlankDeliverableSections());
    setIncludeLogo(true);
    setResolvedResourcePages([]);
    setExportPackages([]);
    toast.info("Configuración del entregable reiniciada.");
  };

  const handleStartBlank = () => {
    localStorage.removeItem("nutri_active_draft");
    localStorage.removeItem("nutri_patient");
    setHasCart(false);
    setHasRecipes(false);
    setHasDraftMemory(false);
    setSelectedPatient(null);
    setSelectedSections(getBlankDeliverableSections());
    setIncludeLogo(true);
    setResolvedResourcePages([]);
    setExportPackages([]);
    setSelectedResourceId("");
    setResourceVariables({});
    setIsImportPatientModalOpen(false);
    setIsImportCreationModalOpen(false);
    setIsResourceModalOpen(false);
    setIsExportWizardOpen(false);
    setShowInitModal(false);
    toast.success("Proyecto en blanco iniciado.");
  };

  const actionDockItems: ActionDockItem[] = [
    {
      id: "import-creation",
      icon: Library,
      label: "Importar Creación",
      variant: "indigo",
      onClick: () => {
        setIsImportCreationModalOpen(true);
      },
    },
    {
      id: "link-patient",
      icon: User,
      label: selectedPatient ? "Cambiar Paciente" : "Importar Paciente",
      variant: "emerald",
      onClick: () => {
        setIsImportPatientModalOpen(true);
        fetchPatients();
      },
    },
    {
      id: "preview",
      icon: Eye,
      label: "Vista Previa",
      variant: "slate",
      onClick: () => toast.info("Generando vista previa temporal..."),
    },
    {
      id: "save-creations",
      icon: Save,
      label: "Guardar Creación",
      variant: "slate",
      onClick: () => setIsSaveCreationModalOpen(true),
    },
    {
      id: "print-json",
      icon: FileText,
      label: "Imprimir JSON",
      variant: "slate",
      onClick: printJson,
    },
    {
      id: "export-pdf",
      icon: Download,
      label: "Exportar PDF",
      variant: "slate",
      onClick: openExportWizard,
    },
    {
      id: "upload-pdf",
      icon: FileUp,
      label: "Subir PDF",
      variant: "slate",
      onClick: () => toast.info("Módulo de escaneo de PDF próximamente... 📄"),
    },
    {
      id: "attach-resource-page",
      icon: Plus,
      label: "Agregar Recurso",
      variant: "slate",
      onClick: openResourceModal,
    },
    {
      id: "reset",
      icon: RotateCcw,
      label: "Reiniciar Todo",
      variant: "rose",
      onClick: resetDeliverable,
    },
  ];

  const handleImportCreation = (creation: any) => {
    try {
      const { type, content } = creation;
      const storedDraft = localStorage.getItem("nutri_active_draft");
      const draft = storedDraft ? JSON.parse(storedDraft) : {};

      if (type === "DIET") {
        draft.diet = content;
        setHasDraftMemory(true);
        toast.success(`Dieta "${creation.name}" importada al borrador.`);
      } else if (type === "SHOPPING_LIST") {
        draft.cart = content;
        setHasCart(true);
        toast.success(`Carrito "${creation.name}" importado al borrador.`);
      } else if (type === "RECIPE") {
        draft.recipes = content;
        setHasRecipes(true);
        toast.success(`Plan de recetas "${creation.name}" importado al borrador.`);
      } else {
        toast.error("Tipo de creación no reconocido para importar.");
        return;
      }

      localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
      // Trigger a light reload or state update if needed
      window.location.reload(); // Simple way to ensure all sections re-check draft
    } catch (e) {
      console.error("Error importing creation", e);
      toast.error("Error al importar la creación.");
    }
  };

  return (
    <>
      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={handleImportCreation}
      />
      {/* Entry config modal */}
      <Modal
        isOpen={showInitModal}
        onClose={() => setShowInitModal(false)}
        title="Configuración Inicial del Entregable"
        className="max-w-2xl"
      >
        <div className="p-4 pb-8 space-y-6">
          <p className="text-slate-500 text-sm font-medium">
            Si procedes de las etapas anteriores tu borrador se cargará automáticamente. De lo contrario, ¿Qué tipo de PDF te gustaría construir hoy?
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setShowInitModal(false);
                toast.success("Borrador o progreso de paciente reanudado.");
              }}
              className="flex flex-col text-left p-6 border-2 border-indigo-500 bg-indigo-50/50 rounded-3xl hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer"
            >
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <RotateCcw className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-black text-indigo-900 text-lg">Retomar Progreso</h4>
              <p className="text-xs text-indigo-700/70 mt-2 font-medium">
                Reanuda tu sesión o datos en tu Navegador.
              </p>
            </button>

            <button
              onClick={handleStartBlank}
              className="flex flex-col text-left p-6 border-2 border-slate-200 bg-white rounded-3xl hover:border-slate-300 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="h-12 w-12 bg-slate-100 group-hover:bg-slate-200 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Layout className="h-6 w-6 text-slate-600" />
              </div>
              <h4 className="font-black text-slate-900 text-lg">Independiente</h4>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Limpia la base. Genial para ensamblar PDFs genéricos o importar.
              </p>
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Wizard Modal */}
      <Modal
        isOpen={isExportWizardOpen}
        onClose={() => setIsExportWizardOpen(false)}
        title="Opciones de Exportación PDF"
        className="max-w-4xl"
      >
        <div className="p-4 pb-8 space-y-6">
          <p className="text-slate-500 text-sm font-medium">
            ¿Cómo te gustaría entregarle el material a tu paciente?
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setExportMode("single")}
              className={cn(
                "flex flex-col text-left p-4 border-2 rounded-2xl transition-all cursor-pointer",
                exportMode === "single"
                  ? "bg-indigo-50/50 border-indigo-500 shadow-sm"
                  : "bg-white border-slate-200 hover:border-indigo-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className={cn("h-5 w-5", exportMode === "single" ? "text-indigo-600" : "text-slate-400")} />
                <h4 className={cn("font-black text-sm", exportMode === "single" ? "text-indigo-900" : "text-slate-700")}>Documento Único</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Genera 1 solo PDF largo que contiene todos los módulos seleccionados ({selectedSections.length}).
              </p>
            </button>

            <button
              onClick={() => {
                setExportMode("advanced");
                setSplitQuickPreset(); // Auto-fill on first switch
              }}
              className={cn(
                "flex flex-col text-left p-4 border-2 rounded-2xl transition-all cursor-pointer",
                exportMode === "advanced"
                  ? "bg-emerald-50/50 border-emerald-500 shadow-sm"
                  : "bg-white border-slate-200 hover:border-emerald-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Layout className={cn("h-5 w-5", exportMode === "advanced" ? "text-emerald-600" : "text-slate-400")} />
                <h4 className={cn("font-black text-sm", exportMode === "advanced" ? "text-emerald-900" : "text-slate-700")}>Paquetes Separados</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Genera múltiples archivos PDF separados por temática (Ej: Recetario y Plan por separado).
              </p>
            </button>
          </div>

          <div className="h-px bg-slate-100 my-6" />

          {/* SINGLE MODE CONTENT */}
          {exportMode === "single" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <h4 className="font-bold text-slate-800 text-sm mb-2">Se incluirán {selectedSections.length} módulos:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSections.map(sid => {
                    const moduleMatch = DELIVERABLE_SECTIONS.find(s => s.id === sid);
                    if (!moduleMatch) return null;
                    return (
                      <div key={sid} className="px-3 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 uppercase">
                        {moduleMatch.label}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleExportSingle} disabled={isExporting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-black">
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Exportar Documento Único
                </Button>
              </div>
            </div>
          )}

          {/* ADVANCED MODE CONTENT */}
          {exportMode === "advanced" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Organiza tus Archivos:</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={setSplitQuickPreset} className="text-xs h-8">Auto-Organizar</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportPackages([...exportPackages, { id: crypto.randomUUID(), name: `Nuevo PDF ${exportPackages.length + 1}`, sections: [], exportAs: "single" }])}
                    className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    + Nuevo Archivo
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {exportPackages.map((pkg, pkgIndex) => (
                  <div key={pkg.id} className="p-4 border-2 border-slate-200 rounded-2xl bg-white space-y-3 relative group">
                    <button
                      onClick={() => setExportPackages(exportPackages.filter(p => p.id !== pkg.id))}
                      className="absolute -top-3 -right-3 bg-red-100 text-red-600 h-6 w-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <Input
                      value={pkg.name}
                      onChange={(e) => {
                        const newPkgs = [...exportPackages];
                        newPkgs[pkgIndex].name = e.target.value;
                        setExportPackages(newPkgs);
                      }}
                      className="font-black text-emerald-900 border-slate-200 bg-slate-50 focus:bg-white"
                      placeholder="Nombre del archivo (Ej. Plan Clínico)"
                    />
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Modo de exportación</p>
                      <select
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white text-slate-600 cursor-pointer"
                        value={pkg.exportAs}
                        onChange={(e) => {
                          const newPkgs = [...exportPackages];
                          newPkgs[pkgIndex].exportAs = e.target.value as "single" | "grouped";
                          setExportPackages(newPkgs);
                        }}
                      >
                        <option value="single">Un PDF para este grupo</option>
                        <option value="grouped">Un PDF por cada módulo</option>
                      </select>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-[80px]">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Módulos en este archivo:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.sections.map(sid => {
                          const moduleMatch = DELIVERABLE_SECTIONS.find(s => s.id === sid);
                          if (!moduleMatch) return null;
                          return (
                            <div key={sid} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">
                              {moduleMatch.label}
                              <X
                                className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100"
                                onClick={() => {
                                  const newPkgs = [...exportPackages];
                                  newPkgs[pkgIndex].sections = newPkgs[pkgIndex].sections.filter(s => s !== sid);
                                  setExportPackages(newPkgs);
                                }}
                              />
                            </div>
                          );
                        })}
                        {pkg.sections.length === 0 && <span className="text-xs text-slate-400 font-medium">Carpeta vacía</span>}
                      </div>
                    </div>

                    {/* Add section dropdown */}
                    <select
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white text-slate-600 cursor-pointer"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        if (pkg.sections.includes(e.target.value)) return;
                        const newPkgs = [...exportPackages];
                        newPkgs[pkgIndex].sections.push(e.target.value);
                        setExportPackages(newPkgs);
                        e.target.value = "";
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Añadir módulo a este archivo...</option>
                      {selectedSections.map(sid => {
                        if (pkg.sections.includes(sid)) return null;
                        const moduleMatch = DELIVERABLE_SECTIONS.find(s => s.id === sid);
                        return <option key={`opt-${sid}`} value={sid}>{moduleMatch?.label}</option>
                      })}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                <span className="text-xs text-slate-500 font-bold">Descargarás {exportPackages.length} archivos separados.</span>
                <Button onClick={handleExportAdvanced} disabled={isExporting || exportPackages.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-black">
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Exportar Paquetes
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Agregar Recurso Personalizable"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Recurso
            </p>
            <select
              value={selectedResourceId}
              onChange={(e) => {
                const resourceId = e.target.value;
                setSelectedResourceId(resourceId);
                const selectedResource = resources.find((item) => item.id === resourceId);
                const variables = extractVariablesFromContent(selectedResource?.content || "");
                const initialInputs: Record<string, string> = {};
                variables.forEach((variableKey) => {
                  initialInputs[variableKey] = "";
                });
                setResourceVariables(initialInputs);
              }}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Selecciona recurso</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title}
                </option>
              ))}
            </select>
          </div>

          {Object.keys(resourceVariables).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Variables
              </p>
              {Object.keys(resourceVariables).map((variableKey) => (
                <Input
                  key={variableKey}
                  placeholder={variableKey}
                  value={resourceVariables[variableKey] || ""}
                  onChange={(e) =>
                    setResourceVariables((prev) => ({
                      ...prev,
                      [variableKey]: e.target.value,
                    }))
                  }
                />
              ))}
            </div>
          )}

          <Button className="w-full bg-emerald-600 text-white h-11" onClick={addResolvedResourcePage}>
            Guardar Página Extra
          </Button>
        </div>
      </Modal>

      <ModuleLayout
        title="Personalización & Entrega"
        description="Configura el entregable final para tu paciente."
        step={{
          number: 4,
          label: "Entregable PDF",
          icon: ClipboardCheck,
          color: "text-slate-600",
        }}
        rightNavItems={actionDockItems}
        className="max-w-5xl"
        footer={
          <ModuleFooter>
            <div className="flex items-center gap-3">
              <Button
                className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs flex items-center gap-2"
                onClick={openExportWizard}
                disabled={isExporting}
              >
                {isExporting ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                EXPORTAR PDF
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={currentProjectName}
          patientName={selectedPatient?.fullName || null}
          mode={currentProjectMode}
          moduleLabel="Entregable"
        />
        <div className="space-y-12 mt-8">
          {/* Custom Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer",
                    includeLogo
                      ? "bg-white border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10"
                      : "bg-slate-50 border-slate-200 text-slate-400",
                  )}
                  onClick={() => setIncludeLogo(!includeLogo)}
                >
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">
                    Logo del Nutricionista
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Incluir marca personal
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase text-slate-900">
                    Plantilla Visual
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Standard NutriSaaS
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-[10px] font-black text-violet-600 uppercase hover:bg-violet-50 px-3 h-8"
                >
                  Cambiar
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Páginas Extra desde Recursos
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Agrega contenido reutilizable con variables personalizadas para este paciente.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-9 text-xs font-black uppercase"
                onClick={openResourceModal}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>

            {resolvedResourcePages.length > 0 ? (
              <div className="space-y-2">
                {resolvedResourcePages.map((page, index) => (
                  <div
                    key={`${page.resourceId}-${index}`}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900">{page.title}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Variables: {Object.keys(page.variables || {}).length}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setResolvedResourcePages((prev) =>
                          prev.filter((_, row) => row !== index),
                        )
                      }
                      className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                No has agregado páginas extra todavía.
              </p>
            )}
          </div>

          {/* Main Selection Grid */}
          <div className="space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Layout className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  Orden del Entregable (Arrastra como Playlist)
                </h3>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                {selectedSectionItems.length === 0 && (
                  <p className="text-xs text-slate-500 font-medium">
                    Selecciona módulos para ordenar el entregable.
                  </p>
                )}
                {selectedSectionItems.map((section) => (
                  <div
                    key={`order-${section.id}`}
                    draggable
                    onDragStart={() => setDraggingSectionId(section.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggingSectionId) return;
                      moveSelectedSection(draggingSectionId, section.id);
                      setDraggingSectionId(null);
                    }}
                    onDragEnd={() => setDraggingSectionId(null)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-slate-50/50"
                  >
                    <GripVertical className="h-4 w-4 text-slate-400" />
                    <section.icon className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800 flex-1">{section.label}</span>
                    <span className={cn(
                      "text-[10px] uppercase font-black px-2 py-1 rounded-md",
                      section.contentType === "practical" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {section.contentType === "practical" ? "Práctica" : "Teoría"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Core Modules (Checked by default) */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  Contenido Esencial
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {availableSections
                  .filter((s) => s.category === "core")
                  .filter((s) => contentFilter === "all" || s.contentType === contentFilter)
                  .map((section) => (
                    <div
                      key={section.id}
                      onClick={() =>
                        toggleSection(section.id, section.disabled)
                      }
                      className={cn(
                        "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                        section.disabled
                          ? "opacity-30 cursor-not-allowed bg-slate-50 border-slate-100"
                          : selectedSections.includes(section.id)
                            ? "bg-white border-emerald-500 shadow-lg shadow-emerald-500/5"
                            : "bg-slate-50 border-slate-100 hover:border-slate-200 opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          section.disabled
                            ? "bg-slate-200 text-slate-400"
                            : selectedSections.includes(section.id)
                              ? "bg-emerald-500 text-white"
                              : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm",
                        )}
                      >
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">
                          {section.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                          {section.description}
                        </p>
                        <span className={cn(
                          "inline-flex mt-2 text-[9px] uppercase font-black px-2 py-0.5 rounded",
                          section.contentType === "practical" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {section.contentType === "practical" ? "Práctica" : "Teoría"}
                        </span>
                      </div>

                      {section.editable &&
                        selectedSections.includes(section.id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleEditSection(e, section.id)}
                            className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-[10px] uppercase flex items-center gap-2"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </Button>
                        )}

                      <div
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedSections.includes(section.id)
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200",
                        )}
                      >
                        {selectedSections.includes(section.id) && (
                          <CheckCircle2 className="h-4 w-4 fill-white" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Info / Resource Modules (Unchecked by default) */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  Educación & Recursos Sugeridos
                </h3>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant={contentFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 text-[10px] uppercase font-black"
                    onClick={() => setContentFilter("all")}
                  >
                    Todo
                  </Button>
                  <Button
                    variant={contentFilter === "practical" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 text-[10px] uppercase font-black"
                    onClick={() => setContentFilter("practical")}
                  >
                    Práctica
                  </Button>
                  <Button
                    variant={contentFilter === "theory" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 text-[10px] uppercase font-black"
                    onClick={() => setContentFilter("theory")}
                  >
                    Teoría
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {availableSections
                  .filter((s) => s.category === "info")
                  .filter((s) => contentFilter === "all" || s.contentType === contentFilter)
                  .map((section) => (
                    <div
                      key={section.id}
                      onClick={() =>
                        toggleSection(section.id, section.disabled)
                      }
                      className={cn(
                        "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                        section.disabled
                          ? "opacity-30 cursor-not-allowed bg-slate-50 border-slate-100"
                          : selectedSections.includes(section.id)
                            ? "bg-white border-blue-500 shadow-lg shadow-blue-500/5"
                            : "bg-slate-50 border-slate-100 hover:border-slate-200 opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          section.disabled
                            ? "bg-slate-200 text-slate-400"
                            : selectedSections.includes(section.id)
                              ? "bg-blue-500 text-white"
                              : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm border border-slate-100",
                        )}
                      >
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                          {section.label}
                        </h4>
                        <p
                          className={cn(
                            "text-[10px] font-medium leading-tight mt-1",
                            section.disabled
                              ? "text-rose-500 font-bold"
                              : "text-slate-500",
                          )}
                        >
                          {section.description}
                        </p>
                        <span className={cn(
                          "inline-flex mt-2 text-[9px] uppercase font-black px-2 py-0.5 rounded",
                          section.contentType === "practical" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {section.contentType === "practical" ? "Práctica" : "Teoría"}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedSections.includes(section.id)
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-200",
                        )}
                      >
                        {selectedSections.includes(section.id) && (
                          <CheckCircle2 className="h-4 w-4 fill-white" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Floating indicator for 'Manual preview' - subtle */}
          <div className="mt-20 flex justify-center pb-12">
            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-700">
              <Sparkles className="h-4 w-4 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest text-center">
                El PDF se generará con la plantilla oficial de NutriSaaS usando los widgets seleccionados.
              </span>
            </div>
          </div>
        </div>
      </ModuleLayout>

      {/* Import Patient Modal */}
      <Modal
        isOpen={isImportPatientModalOpen}
        onClose={() => {
          setIsImportPatientModalOpen(false);
          setPatientSearchQuery("");
        }}
        title="Vincular Paciente"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-slate-200 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {isLoadingPatients && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-left">
            {patients
              .filter(
                (patient) =>
                  patient.fullName
                    .toLowerCase()
                    .includes(patientSearchQuery.toLowerCase()) ||
                  (patient.email &&
                    patient.email
                      .toLowerCase()
                      .includes(patientSearchQuery.toLowerCase())),
              )
              .map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="p-4 border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors">
                      <User className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        {patient.fullName}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        {patient.email || "Sin email"} •{" "}
                        {patient.weight
                          ? `${patient.weight}kg`
                          : "Peso no reg."}
                      </p>
                    </div>
                  </div>
                  {patient.dietRestrictions &&
                    Array.isArray(patient.dietRestrictions) &&
                    patient.dietRestrictions.length > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-rose-400" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                          {patient.dietRestrictions.length}
                        </span>
                      </div>
                    )}
                </div>
              ))}

            {!isLoadingPatients && patients.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 font-bold">
                  No se encontraron pacientes registrados.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal >
      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={() => handleSaveToCreations(creationDescription)}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title="Guardar entregable"
        subtitle="Añade una breve descripción para identificar este entregable dentro de Mis creaciones."
        isSaving={isSaving}
      />
    </>
  );
}
