"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardCheck,
  Download,
  Eye,
  CheckCircle2,
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
  Pencil,
  Layout,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Search,
  UserPlus,
  AlertCircle,
  Loader2,
  FileUp,
  RotateCcw,
  Library,
  Lock,
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
  category?: string;
  tags?: string[];
  isMine?: boolean;
  isPublic?: boolean;
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

type PreviousStageSummary = {
  diet: {
    hasData: boolean;
    name: string | null;
    foodCount: number;
    restrictions: string[];
  };
  recipes: {
    hasData: boolean;
    recipeCount: number;
  };
  patient: {
    hasData: boolean;
    name: string | null;
    description: string | null;
  };
  cart: {
    hasData: boolean;
    foodCount: number;
  };
};

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
    defaultSelected: false,
    category: "info",
    contentType: "theory",
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
      !["shoppingList", "recipes", "patientInfo"].includes(
        section.id,
      ),
  ).map((section) => section.id);

const VALID_SECTION_IDS = new Set(DELIVERABLE_SECTIONS.map((section) => section.id));

const sanitizeSectionIds = (sectionIds: string[] = []) =>
  sectionIds.filter((id) => VALID_SECTION_IDS.has(id));

const EMPTY_STAGE_SUMMARY: PreviousStageSummary = {
  diet: { hasData: false, name: null, foodCount: 0, restrictions: [] },
  recipes: { hasData: false, recipeCount: 0 },
  patient: { hasData: false, name: null, description: null },
  cart: { hasData: false, foodCount: 0 },
};

const safeString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const next = value
    .map((item) => safeString(item))
    .filter(Boolean);
  return Array.from(new Set(next));
};

const normalizeWelcomeTemplates = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  value.forEach((item) => {
    const text = safeString(item).replace(/\s+/g, " ").trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(text);
  });
  return normalized;
};

const isCoverResource = (resource: ResourceTemplate | undefined | null): boolean => {
  if (!resource) return false;
  return /portada|cover|introducci/i.test(
    `${resource.title || ""} ${resource.content || ""}`,
  );
};

const getRecipeDayCount = (recipes: any): number => {
  const weekSlots = recipes?.weekSlots;
  if (!weekSlots || typeof weekSlots !== "object") return 0;
  return Object.values(weekSlots).filter((slots) => Array.isArray(slots) && slots.length > 0)
    .length;
};

const hasObjectContent = (value: unknown): boolean =>
  Boolean(value && typeof value === "object" && Object.keys(value as Record<string, unknown>).length > 0);

const getRecipeCountFromDraft = (draftRecipes: any): number => {
  if (!draftRecipes || typeof draftRecipes !== "object") return 0;

  if (Array.isArray(draftRecipes.dishes)) {
    return draftRecipes.dishes.filter((dish: any) => safeString(dish?.title)).length;
  }

  if (Array.isArray(draftRecipes.weekSlots)) {
    return draftRecipes.weekSlots.filter((slot: any) => safeString(slot?.recipe?.title)).length;
  }

  if (draftRecipes.weekSlots && typeof draftRecipes.weekSlots === "object") {
    return Object.values(draftRecipes.weekSlots).reduce<number>((total, slots: unknown) => {
      if (!Array.isArray(slots)) return total;
      return total + slots.filter((slot: any) => safeString(slot?.recipe?.title)).length;
    }, 0);
  }

  if (Array.isArray(draftRecipes.days)) {
    return draftRecipes.days.reduce((total: number, day: any) => {
      if (!Array.isArray(day?.recipes)) return total;
      return total + day.recipes.filter((recipe: any) => safeString(recipe?.title)).length;
    }, 0);
  }

  return 0;
};

const buildPreviousStageSummary = (
  draft: any,
  selectedPatient: any,
): PreviousStageSummary => {
  const diet = draft?.diet || {};
  const recipes = draft?.recipes || {};
  const cart = draft?.cart || {};
  const patientMeta = draft?.patientMeta || {};

  const dietFoods = Array.isArray(diet?.includedFoods)
    ? diet.includedFoods
    : Array.isArray(diet?.foods)
      ? diet.foods
      : [];

  const dietRestrictions = normalizeStringList(
    Array.isArray(diet?.activeConstraints) ? diet.activeConstraints : patientMeta?.restrictions,
  );

  const patientName =
    safeString(selectedPatient?.fullName) ||
    safeString(selectedPatient?.name) ||
    safeString(patientMeta?.fullName) ||
    null;

  const patientDescription =
    safeString(selectedPatient?.description) ||
    safeString(selectedPatient?.nutritionalFocus) ||
    safeString(selectedPatient?.fitnessGoals) ||
    safeString(patientMeta?.nutritionalFocus) ||
    safeString(patientMeta?.fitnessGoals) ||
    null;

  const cartItems = Array.isArray(cart?.items) ? cart.items : [];
  const recipeCount = getRecipeCountFromDraft(recipes);

  return {
    diet: {
      hasData: dietFoods.length > 0 || Boolean(safeString(diet?.dietName)),
      name: safeString(diet?.dietName) || safeString(diet?.name) || null,
      foodCount: dietFoods.length,
      restrictions: dietRestrictions,
    },
    recipes: {
      hasData: recipeCount > 0,
      recipeCount,
    },
    patient: {
      hasData: Boolean(patientName),
      name: patientName,
      description: patientDescription,
    },
    cart: {
      hasData: cartItems.length > 0,
      foodCount: cartItems.length,
    },
  };
};

export default function DeliverableClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const { role } = useAdmin();
  const [selectedSections, setSelectedSections] = useState<string[]>(
    sanitizeSectionIds(
      DELIVERABLE_SECTIONS.filter((s) => s.defaultSelected).map((s) => s.id),
    ),
  );
  const [includeLogo, setIncludeLogo] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [welcomeTemplateOptions, setWelcomeTemplateOptions] = useState<string[]>([]);
  const [selectedWelcomeTemplate, setSelectedWelcomeTemplate] = useState("");
  const [isSavingWelcomeTemplate, setIsSavingWelcomeTemplate] = useState(false);
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
  const [importCreationDefaultType, setImportCreationDefaultType] = useState<
    string | undefined
  >(undefined);
  const [importCreationAllowedTypes, setImportCreationAllowedTypes] = useState<
    string[] | undefined
  >(undefined);
  const [previousStagesSummary, setPreviousStagesSummary] =
    useState<PreviousStageSummary>(EMPTY_STAGE_SUMMARY);
  const [resources, setResources] = useState<ResourceTemplate[]>([]);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceModalMode, setResourceModalMode] = useState<"extra" | "cover">("extra");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [resourceVariables, setResourceVariables] = useState<Record<string, string>>({});
  const [resolvedResourcePages, setResolvedResourcePages] = useState<ResolvedResourcePage[]>([]);
  const [resourceSearchQuery, setResourceSearchQuery] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("Todas");
  const [resourceOwnerFilter, setResourceOwnerFilter] = useState<
    "all" | "mine" | "public"
  >("all");
  const [resourceHashtagQuery, setResourceHashtagQuery] = useState("");
  const [isFlowSummaryOpen, setIsFlowSummaryOpen] = useState(false);

  // Export Wizard State
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"single" | "advanced">("single");
  const [exportPackages, setExportPackages] = useState<ExportPackage[]>([]);
  const [contentFilter, setContentFilter] = useState<"all" | "practical" | "theory">("all");
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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      const fromSettings = normalizeWelcomeTemplates(
        parsedUser?.nutritionist?.settings?.deliverableWelcomeTemplates,
      );
      setWelcomeTemplateOptions(fromSettings);
    } catch (error) {
      console.error("Error loading welcome templates from settings", error);
    }
  }, []);

  useEffect(() => {
    const current = safeString(welcomeMessage).replace(/\s+/g, " ").trim();
    if (!current) {
      setSelectedWelcomeTemplate("");
      return;
    }
    const matched = welcomeTemplateOptions.find(
      (option) => option.toLowerCase() === current.toLowerCase(),
    );
    setSelectedWelcomeTemplate(matched || "");
  }, [welcomeMessage, welcomeTemplateOptions]);

  const refreshPreviousStagesSummary = (
    draftOverride?: any,
    patientOverride?: any,
  ) => {
    const draft = draftOverride
      ? draftOverride
      : (() => {
          try {
            const stored = localStorage.getItem("nutri_active_draft");
            return stored ? JSON.parse(stored) : {};
          } catch (_) {
            return {};
          }
        })();

    setPreviousStagesSummary(
      buildPreviousStageSummary(
        draft,
        patientOverride !== undefined ? patientOverride : selectedPatient,
      ),
    );
  };

  const persistDeliverableDraftNow = (
    resourcePagesOverride?: ResolvedResourcePage[],
  ) => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draft = storedDraft ? JSON.parse(storedDraft) : {};

    draft.deliverable = {
      selectedSections,
      includeLogo,
      welcomeMessage,
      exportPackages,
      resourcePages: resourcePagesOverride ?? resolvedResourcePages,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
    refreshPreviousStagesSummary(draft, selectedPatient);
    return draft;
  };

  const openFilteredCreationImport = (type: "DIET" | "SHOPPING_LIST" | "RECIPE") => {
    setImportCreationDefaultType(type);
    setImportCreationAllowedTypes([type]);
    setIsImportCreationModalOpen(true);
  };

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

          const existingDraft = (() => {
            try {
              const stored = localStorage.getItem("nutri_active_draft");
              return stored ? JSON.parse(stored) : {};
            } catch (_) {
              return {} as Record<string, any>;
            }
          })();
          const draft: Record<string, any> = { ...existingDraft };
          const hasLocalDiet = Boolean(existingDraft?.diet);
          const hasLocalCart = Boolean(existingDraft?.cart);
          const hasLocalRecipes = Boolean(existingDraft?.recipes);
          const hasLocalDeliverable = Boolean(
            existingDraft?.deliverable?.updatedAt ||
            existingDraft?.deliverable?.selectedSections ||
            existingDraft?.deliverable?.resourcePages ||
            existingDraft?.deliverable?.welcomeMessage,
          );

          if (project.patient) {
            const localPatient = localStorage.getItem("nutri_patient");
            if (!localPatient) {
              setSelectedPatient(project.patient);
              localStorage.setItem("nutri_patient", JSON.stringify(project.patient));
            }
            if (!draft.patientMeta) {
              draft.patientMeta = {
                id: project.patient.id,
                fullName: project.patient.fullName,
                restrictions: project.patient.dietRestrictions || [],
                weight: project.patient.weight,
                height: project.patient.height,
                updatedAt: new Date().toISOString(),
              };
            }
          }

          if (project.activeDietCreationId && !hasLocalDiet) {
            const creation = await fetchCreation(project.activeDietCreationId);
            draft.diet = creation.content;
          }

          if (project.activeCartCreationId && !hasLocalCart) {
            const creation = await fetchCreation(project.activeCartCreationId);
            draft.cart = creation.content;
          }

          if (project.activeRecipeCreationId && !hasLocalRecipes) {
            const creation = await fetchCreation(project.activeRecipeCreationId);
            draft.recipes = creation.content;
          }

          if (hasLocalDeliverable && draft.deliverable) {
            const deliverableContent = draft.deliverable || {};
            setSelectedSections(
              sanitizeSectionIds(
                deliverableContent.selectedSections ||
                DELIVERABLE_SECTIONS.filter((s) => s.defaultSelected).map((s) => s.id),
              ),
            );
            setIncludeLogo(deliverableContent.includeLogo ?? true);
            setWelcomeMessage(
              typeof deliverableContent.welcomeMessage === "string"
                ? deliverableContent.welcomeMessage
                : "",
            );
            setExportPackages(deliverableContent.exportPackages || []);
            setResolvedResourcePages(deliverableContent.resourcePages || []);
          } else if (project.activeDeliverableCreationId) {
            const creation = await fetchCreation(
              project.activeDeliverableCreationId,
            );
            const deliverableContent = creation.content || {};
            setSelectedSections(
              sanitizeSectionIds(
                deliverableContent.selectedSections ||
                  DELIVERABLE_SECTIONS.filter((s) => s.defaultSelected).map(
                    (s) => s.id,
                  ),
              ),
            );
            setIncludeLogo(deliverableContent.includeLogo ?? true);
            setWelcomeMessage(
              typeof deliverableContent.welcomeMessage === "string"
                ? deliverableContent.welcomeMessage
                : "",
            );
            setExportPackages(deliverableContent.exportPackages || []);
            setResolvedResourcePages(deliverableContent.resourcePages || []);
            draft.deliverable = deliverableContent;
          }

          setHasCart(Boolean(draft.cart));
          setHasRecipes(Boolean(draft.recipes));

          localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
          refreshPreviousStagesSummary(draft, project.patient || null);
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

    // Revisar si hay estado en memoria para el pop-up de bienvenida.
    // Si venimos desde "Continuar" en Carrito, omitir modal y tomar progreso actual.
    const isFlow = window.location.search.includes("flow=continue");
    const continueIntent =
      sessionStorage.getItem("nutri_deliverable_draft_decided") === "keep";
    if (!isFlow && !continueIntent && (storedDraft || storedPatient)) {
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
          if (typeof draft.deliverable.welcomeMessage === "string") {
            setWelcomeMessage(draft.deliverable.welcomeMessage);
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
            if (s.id === "shoppingList" && !draft.cart) return false;
            if (s.id === "recipes" && !draft.recipes) return false;
            if (s.id === "patientInfo" && !storedPatient) return false;
            return true;
          }).map((s) => s.id);
          setSelectedSections(availableDefaults);
        }

        internalHasCart = !!draft.cart;
        internalHasRecipes = !!draft.recipes;
        refreshPreviousStagesSummary(draft, null);
      } catch (e) {
        console.error("Error loading project draft", e);
        refreshPreviousStagesSummary({}, null);
      }
    } else {
      refreshPreviousStagesSummary({}, null);
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
      welcomeMessage,
      exportPackages,
      resourcePages: resolvedResourcePages,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
    refreshPreviousStagesSummary(draft, selectedPatient);
  }, [selectedSections, includeLogo, welcomeMessage, exportPackages, resolvedResourcePages, selectedPatient]);

  // Load stored patient
  useEffect(() => {
    const storedPatient = localStorage.getItem("nutri_patient");
    if (storedPatient) {
      try {
        const parsedPatient = JSON.parse(storedPatient);
        setSelectedPatient(parsedPatient);
        refreshPreviousStagesSummary(undefined, parsedPatient);
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

    if (section.id === "shoppingList") {
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
    if (section.id === "patientInfo") {
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

  const resolveExportDraftData = async () => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draftData = storedDraft ? JSON.parse(storedDraft) : {};
    const merged: any = { ...draftData };

    if (selectedPatient && !merged.patientMeta) {
      merged.patientMeta = {
        id: selectedPatient.id,
        fullName: selectedPatient.fullName,
        restrictions: Array.isArray(selectedPatient.dietRestrictions)
          ? selectedPatient.dietRestrictions
          : [],
        weight: selectedPatient.weight,
        height: selectedPatient.height,
        updatedAt: new Date().toISOString(),
      };
    }

    const projectId = currentProjectId || projectIdFromUrl;
    if (projectId) {
      try {
        const project = await fetchProject(projectId);

        if (project.patient && !merged.patientMeta) {
          merged.patientMeta = {
            id: project.patient.id,
            fullName: project.patient.fullName,
            restrictions: Array.isArray(project.patient.dietRestrictions)
              ? project.patient.dietRestrictions
              : [],
            weight: project.patient.weight,
            height: project.patient.height,
            updatedAt: new Date().toISOString(),
          };
        }

        const [dietCreation, cartCreation, recipesCreation, deliverableCreation] =
          await Promise.all([
            project.activeDietCreationId ? fetchCreation(project.activeDietCreationId) : null,
            project.activeCartCreationId ? fetchCreation(project.activeCartCreationId) : null,
            project.activeRecipeCreationId ? fetchCreation(project.activeRecipeCreationId) : null,
            project.activeDeliverableCreationId ? fetchCreation(project.activeDeliverableCreationId) : null,
          ]);

        if (
          dietCreation?.content &&
          typeof dietCreation.content === "object" &&
          !hasObjectContent(merged.diet)
        ) {
          merged.diet = dietCreation.content;
        }
        if (
          cartCreation?.content &&
          typeof cartCreation.content === "object" &&
          !hasObjectContent(merged.cart)
        ) {
          merged.cart = cartCreation.content;
        }
        if (
          recipesCreation?.content &&
          typeof recipesCreation.content === "object" &&
          !hasObjectContent(merged.recipes)
        ) {
          merged.recipes = recipesCreation.content;
        }
        if (
          deliverableCreation?.content &&
          typeof deliverableCreation.content === "object"
        ) {
          if (
            deliverableCreation.content?.draftData &&
            typeof deliverableCreation.content.draftData === "object"
          ) {
            const embedded = deliverableCreation.content.draftData;
            if (!hasObjectContent(merged.diet) && embedded.diet) merged.diet = embedded.diet;
            if (!hasObjectContent(merged.cart) && embedded.cart) merged.cart = embedded.cart;
            if (!hasObjectContent(merged.recipes) && embedded.recipes) merged.recipes = embedded.recipes;
            if (!hasObjectContent(merged.patientMeta) && embedded.patientMeta) {
              merged.patientMeta = embedded.patientMeta;
            }
          }
          if (!hasObjectContent(merged.deliverable)) {
            merged.deliverable = deliverableCreation.content;
          }
        }
      } catch (error) {
        console.error("Error resolving export data from project context", error);
      }
    }

    if (!hasObjectContent(merged.patientMeta)) {
      const fallbackPatient =
        merged?.cart?.selectedPatient ||
        merged?.recipes?.selectedPatient ||
        merged?.diet?.selectedPatient ||
        null;
      if (fallbackPatient) {
        merged.patientMeta = {
          id: fallbackPatient.id,
          fullName: fallbackPatient.fullName || fallbackPatient.name,
          restrictions: Array.isArray(fallbackPatient.dietRestrictions)
            ? fallbackPatient.dietRestrictions
            : [],
          weight: fallbackPatient.weight,
          height: fallbackPatient.height,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    merged.deliverable = {
      ...(merged.deliverable || {}),
      selectedSections,
      includeLogo,
      welcomeMessage,
      exportPackages,
      resourcePages: resolvedResourcePages,
      updatedAt: new Date().toISOString(),
    };

    return merged;
  };

  const getExportSections = (draftData: any): string[] => {
    const next = new Set<string>(selectedSections);
    next.add("cover");

    const hasPatient = Boolean(
      draftData?.patientMeta?.fullName ||
      draftData?.patientMeta?.weight ||
      draftData?.patientMeta?.height,
    );
    const hasCartData = Array.isArray(draftData?.cart?.items) && draftData.cart.items.length > 0;
    const hasRecipesData =
      getRecipeCountFromDraft(draftData?.recipes) > 0 || getRecipeDayCount(draftData?.recipes) > 0;

    if (hasPatient) next.add("patientInfo");
    if (hasCartData) next.add("shoppingList");
    if (hasRecipesData) next.add("recipes");

    return DELIVERABLE_SECTIONS
      .map((section) => section.id)
      .filter((id) => next.has(id));
  };

  const getExportStats = (draftData: any) => {
    const dietFoods = Array.isArray(draftData?.diet?.includedFoods)
      ? draftData.diet.includedFoods.length
      : Array.isArray(draftData?.diet?.foods)
        ? draftData.diet.foods.length
        : 0;
    const cartItems = Array.isArray(draftData?.cart?.items) ? draftData.cart.items.length : 0;
    const recipeCount = getRecipeCountFromDraft(draftData?.recipes);
    const hasPatient = Boolean(
      draftData?.patientMeta?.fullName ||
      draftData?.patientMeta?.weight ||
      draftData?.patientMeta?.height,
    );
    return {
      dietFoods,
      cartItems,
      recipeCount,
      hasPatient,
      hasAnyContent: dietFoods > 0 || cartItems > 0 || recipeCount > 0 || hasPatient,
    };
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

      const draftData = await resolveExportDraftData();
      const exportSections = getExportSections(draftData);
      const exportStats = getExportStats(draftData);

      if (!exportStats.hasAnyContent) {
        toast.error("El entregable está vacío. Importa Dieta/Carrito/Recetas antes de exportar.", {
          id: "pdf-toast",
        });
        setIsExporting(false);
        return;
      }

      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const brandSettings = userObj?.nutritionist?.settings || {};

      const config = {
        includeLogo,
        selectedSections: exportSections,
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
      toast.info(
        `Exportado con dieta ${exportStats.dietFoods}, carrito ${exportStats.cartItems}, recetas ${exportStats.recipeCount}.`,
      );
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

      const draftData = await resolveExportDraftData();
      const exportSections = getExportSections(draftData);
      const exportStats = getExportStats(draftData);

      if (!exportStats.hasAnyContent) {
        toast.error("El entregable está vacío. Importa Dieta/Carrito/Recetas antes de exportar.", {
          id: "pdf-toast",
        });
        setIsExporting(false);
        return;
      }

      // Filter out empty packages
      const validPackages = exportPackages.filter(
        (p) => p.sections.length > 0 && p.name.trim() !== "",
      );

      const packagesToUse: ExportPackage[] =
        validPackages.length > 0
          ? validPackages
          : [
              {
                id: crypto.randomUUID(),
                name: "Plan Completo",
                sections: exportSections,
                exportAs: "single",
              },
            ];

      if (packagesToUse.length === 0 || exportSections.length === 0) {
        toast.error("Debes tener al menos un paquete con módulos seleccionados", { id: "pdf-toast" });
        setIsExporting(false);
        return;
      }

      const tasks: { pkgName: string; sections: string[] }[] = [];
      packagesToUse.forEach((pkg) => {
        if (pkg.exportAs === "single") {
          tasks.push({
            pkgName: pkg.name,
            sections: pkg.sections.length > 0 ? pkg.sections : exportSections,
          });
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

    setExportMode("single");
    setExportPackages(defaultPackages);
    setIsExportWizardOpen(true);
  };

  const setSplitQuickPreset = () => {
    const listSections = selectedSections.filter(id => ['shoppingList', 'substitutes'].includes(id));
    const recipeSections = selectedSections.filter(id => ['recipes'].includes(id));
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
      const draftData = await resolveExportDraftData();

      const savedCreation = await saveCreation({
        name:
          selectedPatient?.fullName
            ? `Entregable ${selectedPatient.fullName}`
            : `Entregable ${new Date().toLocaleDateString("es-CL")}`,
        type: "DELIVERABLE",
        content: {
          selectedSections,
          includeLogo,
          welcomeMessage,
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

  const handleApplyWelcomeTemplate = (templateText: string) => {
    setSelectedWelcomeTemplate(templateText);
    if (!templateText) return;
    setWelcomeMessage(templateText);
  };

  const handleSaveWelcomeTemplate = async () => {
    const templateText = safeString(welcomeMessage).replace(/\s+/g, " ").trim();
    if (!templateText) {
      toast.error("Escribe un mensaje antes de guardarlo como plantilla.");
      return;
    }

    const existingTemplates = normalizeWelcomeTemplates(welcomeTemplateOptions);
    const duplicate = existingTemplates.some(
      (option) => option.toLowerCase() === templateText.toLowerCase(),
    );
    if (duplicate) {
      toast.info("Esta plantilla ya existe en tus detalles.");
      setSelectedWelcomeTemplate(
        existingTemplates.find(
          (option) => option.toLowerCase() === templateText.toLowerCase(),
        ) || "",
      );
      return;
    }

    const nextTemplates = [templateText, ...existingTemplates];
    setIsSavingWelcomeTemplate(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliverableWelcomeTemplates: nextTemplates,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la plantilla en detalles.");
      }

      setWelcomeTemplateOptions(nextTemplates);
      setSelectedWelcomeTemplate(templateText);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.nutritionist) {
          parsedUser.nutritionist.settings = {
            ...(parsedUser.nutritionist.settings || {}),
            deliverableWelcomeTemplates: nextTemplates,
          };
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
      }

      toast.success("Plantilla guardada y lista para reutilizar.");
    } catch (error: any) {
      console.error("Error saving welcome template", error);
      toast.error(error?.message || "No se pudo guardar la plantilla.");
    } finally {
      setIsSavingWelcomeTemplate(false);
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

  const openResourceModal = async (mode: "extra" | "cover" = "extra") => {
    await fetchResources();
    setResourceModalMode(mode);
    setSelectedResourceId("");
    setResourceVariables({});
    setResourceSearchQuery("");
    setResourceCategoryFilter("Todas");
    setResourceOwnerFilter("all");
    setResourceHashtagQuery("");
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
        title: resourceModalMode === "cover" ? `Portada · ${resource.title}` : resource.title,
        content: data.resolvedContent || resource.content,
        variables: resourceVariables,
      };
      const nextResourcePages =
        resourceModalMode === "cover"
          ? [
              page,
              ...resolvedResourcePages.filter(
                (item) => !/portada|cover|introducci/i.test(item.title || ""),
              ),
            ]
          : [...resolvedResourcePages, page];

      setResolvedResourcePages(nextResourcePages);
      persistDeliverableDraftNow(nextResourcePages);
      setIsResourceModalOpen(false);
      toast.success(
        resourceModalMode === "cover"
          ? "Portada importada desde recursos."
          : "Página extra agregada al entregable.",
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo resolver variables del recurso.");
    }
  };

  useEffect(() => {
    void fetchResources();
  }, []);

  const handleSelectResourceId = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    const selectedResource = filteredResourceOptions.find((item) => item.id === resourceId);
    const variables = extractVariablesFromContent(selectedResource?.content || "");
    const initialInputs: Record<string, string> = {};
    variables.forEach((variableKey) => {
      initialInputs[variableKey] = "";
    });
    setResourceVariables(initialInputs);
  };

  const handleEditSection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === "cover") {
      toast.info("Importar portada está bloqueado por ahora. Se usa portada base de NutriSaaS.");
      return;
    }
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
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draft = storedDraft ? JSON.parse(storedDraft) : {};
    delete draft.patientMeta;
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
    refreshPreviousStagesSummary(draft, null);
    toast.info("Paciente desvinculado de esta sesión");
  };

  const resetDeliverable = () => {
    setSelectedSections(sanitizeSectionIds(getBlankDeliverableSections()));
    setIncludeLogo(true);
    setWelcomeMessage("");
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
    setSelectedSections(sanitizeSectionIds(getBlankDeliverableSections()));
    setIncludeLogo(true);
    setWelcomeMessage("");
    setResolvedResourcePages([]);
    setExportPackages([]);
    setSelectedResourceId("");
    setResourceVariables({});
    setIsImportPatientModalOpen(false);
    setIsImportCreationModalOpen(false);
    setIsResourceModalOpen(false);
    setIsExportWizardOpen(false);
    setShowInitModal(false);
    refreshPreviousStagesSummary({}, null);
    toast.success("Proyecto en blanco iniciado.");
  };

  const actionDockItems: ActionDockItem[] = [
    {
      id: "save-creations",
      icon: Save,
      label: "Guardar Entregable",
      variant: "slate",
      onClick: () => setIsSaveCreationModalOpen(true),
    },
    {
      id: "export-pdf",
      icon: Download,
      label: "Descargar PDF",
      variant: "slate",
      onClick: openExportWizard,
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
        setHasDraftMemory(true);
        setHasCart(true);
        toast.success(`Carrito "${creation.name}" importado al borrador.`);
      } else if (type === "RECIPE") {
        draft.recipes = content;
        setHasDraftMemory(true);
        setHasRecipes(true);
        toast.success(`Plan de recetas "${creation.name}" importado al borrador.`);
      } else {
        toast.error("Tipo de creación no reconocido para importar.");
        return;
      }

      localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
      refreshPreviousStagesSummary(draft, selectedPatient);
      setImportCreationDefaultType(undefined);
      setImportCreationAllowedTypes(undefined);
    } catch (e) {
      console.error("Error importing creation", e);
      toast.error("Error al importar la creación.");
    }
  };

  const moduleChecklist = [
    {
      id: "diet",
      label: "Dieta",
      isDone: previousStagesSummary.diet.hasData,
      detail: previousStagesSummary.diet.hasData
        ? `${previousStagesSummary.diet.foodCount} alimento(s)`
        : "Faltante",
      actionLabel: "Importar dieta",
      onImport: () => openFilteredCreationImport("DIET"),
    },
    {
      id: "patient",
      label: "Paciente",
      isDone: previousStagesSummary.patient.hasData,
      detail: previousStagesSummary.patient.hasData
        ? previousStagesSummary.patient.name || "Paciente vinculado"
        : "Faltante",
      actionLabel: "Vincular paciente",
      onImport: handlePatientLoad,
    },
    {
      id: "recipes",
      label: "Recetas y porciones",
      isDone: previousStagesSummary.recipes.hasData,
      detail: previousStagesSummary.recipes.hasData
        ? `${previousStagesSummary.recipes.recipeCount} receta(s)`
        : "Faltante",
      actionLabel: "Importar recetas",
      onImport: () => openFilteredCreationImport("RECIPE"),
    },
    {
      id: "cart",
      label: "Carrito",
      isDone: previousStagesSummary.cart.hasData,
      detail: previousStagesSummary.cart.hasData
        ? `${previousStagesSummary.cart.foodCount} alimento(s)`
        : "Faltante",
      actionLabel: "Importar carrito",
      onImport: () => openFilteredCreationImport("SHOPPING_LIST"),
    },
  ];
  const baseResourceOptions =
    resourceModalMode === "cover"
      ? resources.filter((resource) => isCoverResource(resource))
      : resources.filter((resource) => !isCoverResource(resource));
  const resourceCategories = useMemo(() => {
    const categories = baseResourceOptions
      .map((resource) => safeString(resource.category))
      .filter(Boolean);
    return ["Todas", ...Array.from(new Set(categories))];
  }, [baseResourceOptions]);
  const resourceHashtags = useMemo(() => {
    const tags = baseResourceOptions.flatMap((resource) =>
      Array.isArray(resource.tags)
        ? resource.tags
            .map((tag) => safeString(tag).replace(/^#/, ""))
            .filter(Boolean)
        : [],
    );
    return Array.from(new Set(tags)).slice(0, 16);
  }, [baseResourceOptions]);
  const filteredResourceOptions = useMemo(() => {
    const textQuery = resourceSearchQuery.trim().toLowerCase();
    const tagQuery = resourceHashtagQuery.trim().replace(/^#/, "").toLowerCase();

    return baseResourceOptions.filter((resource) => {
      const category = safeString(resource.category);
      const title = safeString(resource.title).toLowerCase();
      const content = safeString(resource.content).toLowerCase();
      const tags = Array.isArray(resource.tags)
        ? resource.tags
            .map((tag) => safeString(tag).replace(/^#/, "").toLowerCase())
            .filter(Boolean)
        : [];

      if (resourceCategoryFilter !== "Todas" && category !== resourceCategoryFilter) {
        return false;
      }

      if (resourceOwnerFilter === "mine" && !resource.isMine) {
        return false;
      }

      if (resourceOwnerFilter === "public" && resource.isMine) {
        return false;
      }

      if (tagQuery && !tags.some((tag) => tag.includes(tagQuery))) {
        return false;
      }

      if (!textQuery) return true;

      return (
        title.includes(textQuery) ||
        content.includes(textQuery) ||
        category.toLowerCase().includes(textQuery) ||
        tags.some((tag) => tag.includes(textQuery))
      );
    });
  }, [
    baseResourceOptions,
    resourceCategoryFilter,
    resourceHashtagQuery,
    resourceOwnerFilter,
    resourceSearchQuery,
  ]);

  return (
    <>
      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => {
          setIsImportCreationModalOpen(false);
          setImportCreationDefaultType(undefined);
          setImportCreationAllowedTypes(undefined);
        }}
        onImport={handleImportCreation}
        defaultType={importCreationDefaultType}
        allowedTypes={importCreationAllowedTypes}
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Resumen de progreso actual
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Dieta
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  {previousStagesSummary.diet.hasData
                    ? `${previousStagesSummary.diet.foodCount} alimentos`
                    : "Sin datos"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Recetas
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  {hasRecipes ? "Plan cargado" : "Sin datos"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Carrito
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  {previousStagesSummary.cart.hasData
                    ? `${previousStagesSummary.cart.foodCount} items`
                    : "Sin datos"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Paciente
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700 truncate" title={previousStagesSummary.patient.name || ""}>
                  {previousStagesSummary.patient.name || "Sin asignar"}
                </p>
              </div>
            </div>
          </div>

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
              <h4 className="font-black text-indigo-900 text-lg">Retomar progreso</h4>
              <p className="text-xs text-indigo-700/70 mt-2 font-medium">
                Cargar el avance actual del proyecto y continuar.
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
              type="button"
              disabled
              className="flex flex-col text-left p-4 border-2 rounded-2xl transition-all cursor-not-allowed bg-slate-50 border-slate-200 opacity-70"
            >
              <div className="flex items-center gap-3 mb-2">
                <Lock className="h-5 w-5 text-slate-400" />
                <h4 className="font-black text-sm text-slate-700">Paquetes Separados</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Bloqueado por ahora. Próximamente podrás generar múltiples archivos PDF.
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
        title={
          resourceModalMode === "cover"
            ? "Importar Recurso de Portada"
            : "Agregar Recurso Personalizable"
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={resourceSearchQuery}
              onChange={(e) => setResourceSearchQuery(e.target.value)}
              placeholder="Buscar recurso, contenido o categoría..."
              className="h-10"
            />
            <Input
              value={resourceHashtagQuery}
              onChange={(e) => setResourceHashtagQuery(e.target.value)}
              placeholder="Filtrar por hashtag (ej: #diabetes)"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={resourceCategoryFilter}
              onChange={(e) => setResourceCategoryFilter(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              {resourceCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={resourceOwnerFilter}
              onChange={(e) =>
                setResourceOwnerFilter(e.target.value as "all" | "mine" | "public")
              }
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="all">Todos los recursos</option>
              <option value="mine">Mis recursos</option>
              <option value="public">Recursos públicos</option>
            </select>
          </div>
          {resourceHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resourceHashtags.map((tag) => {
                const isActive = resourceHashtagQuery.replace(/^#/, "").toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setResourceHashtagQuery(isActive ? "" : `#${tag}`)}
                    className={cn(
                      "px-2 py-1 rounded-lg border text-[10px] font-black uppercase",
                      isActive
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                    )}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {resourceModalMode === "cover" ? "Recurso de portada" : "Recurso"}
            </p>
            <select
              value={selectedResourceId}
              onChange={(e) => {
                const resourceId = e.target.value;
                setSelectedResourceId(resourceId);
                const selectedResource = filteredResourceOptions.find((item) => item.id === resourceId);
                const variables = extractVariablesFromContent(selectedResource?.content || "");
                const initialInputs: Record<string, string> = {};
                variables.forEach((variableKey) => {
                  initialInputs[variableKey] = "";
                });
                setResourceVariables(initialInputs);
              }}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">
                {resourceModalMode === "cover"
                  ? "Selecciona recurso de portada"
                  : "Selecciona recurso"}
              </option>
              {filteredResourceOptions.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title}
                </option>
              ))}
            </select>
            {filteredResourceOptions.length === 0 && (
              <p className="text-xs font-medium text-rose-600 mt-2">
                No se encontraron recursos con estos filtros.
              </p>
            )}
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
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Bienvenida opcional
            </p>
            <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-slate-900">
              Mensaje después de portada
            </h3>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Plantillas guardadas (detalles)
              </p>
              <select
                value={selectedWelcomeTemplate}
                onChange={(event) => handleApplyWelcomeTemplate(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none"
              >
                <option value="">Seleccionar mensaje guardado...</option>
                {welcomeTemplateOptions.map((template) => (
                  <option key={template} value={template}>
                    {template.length > 120 ? `${template.slice(0, 120)}...` : template}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={handleSaveWelcomeTemplate}
              isLoading={isSavingWelcomeTemplate}
              className="h-11 w-full md:w-auto bg-emerald-600 text-white"
            >
              Guardar plantilla
            </Button>
          </div>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Escribe un mensaje breve de bienvenida para tu paciente..."
            className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:bg-white focus:outline-none"
            maxLength={900}
          />
          <div className="flex justify-end">
            <span className="text-[11px] font-bold text-slate-400">
              {welcomeMessage.trim().length}/900
            </span>
          </div>
        </div>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <button
            type="button"
            onClick={() => setIsFlowSummaryOpen((prev) => !prev)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Resumen de etapas previas
            </p>
            <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-slate-900">
              Estado acumulado del flujo
            </h3>
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700">
              {isFlowSummaryOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <span>{isFlowSummaryOpen ? "Clic para ocultar" : "Clic para desplegar"}</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {isFlowSummaryOpen ? "Ocultar resumen" : "Ver resumen rápido"}
            </p>
          </button>

          {isFlowSummaryOpen && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Dieta
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {previousStagesSummary.diet.hasData
                    ? `${previousStagesSummary.diet.foodCount} alimento(s) · ${previousStagesSummary.diet.restrictions.length} restricción(es)`
                    : "Sin datos cargados"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Paciente
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {previousStagesSummary.patient.hasData
                    ? previousStagesSummary.patient.name
                    : "Sin paciente vinculado"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Recetas y porciones
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {previousStagesSummary.recipes.hasData
                    ? `${previousStagesSummary.recipes.recipeCount} receta(s)`
                    : "Sin recetas cargadas"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Carrito
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {previousStagesSummary.cart.hasData
                    ? `${previousStagesSummary.cart.foodCount} alimento(s)`
                    : "Sin carrito cargado"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Revisión de módulos
            </p>
            <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-slate-900">
              Módulos previos requeridos
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {moduleChecklist.map((module) => (
              <div
                key={module.id}
                className={cn(
                  "rounded-2xl border p-4",
                  module.isDone
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {module.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-bold",
                        module.isDone ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {module.detail}
                    </p>
                  </div>
                  {!module.isDone && (
                    <button
                      type="button"
                      onClick={module.onImport}
                      className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                      title={module.actionLabel}
                    >
                      <Plus className="mx-auto h-4 w-4" />
                    </button>
                  )}
                  {module.isDone && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Este módulo está hecho para completarse después de los demás módulos.
          </p>
        </div>
        <div className="space-y-12 mt-8">
          {/* Main Selection Grid */}
          <div className="space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Layout className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  Orden del Entregable
                </h3>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                {selectedSectionItems.length === 0 && (
                  <p className="text-xs text-slate-500 font-medium">
                    Selecciona módulos para incluir en el entregable.
                  </p>
                )}
                {selectedSectionItems.map((section) => (
                  <div
                    key={`order-${section.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-slate-50/50"
                  >
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
                            className={cn(
                              "h-8 px-3 rounded-lg font-bold text-[10px] uppercase flex items-center gap-2",
                              section.id === "cover"
                                ? "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
                            )}
                          >
                            {section.id === "cover" ? (
                              <>
                                <Lock className="h-3 w-3" />
                                Bloqueado
                              </>
                            ) : (
                              <>
                                <Pencil className="h-3 w-3" />
                                Editar
                              </>
                            )}
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

              <div className="min-h-[420px] max-h-[560px] overflow-y-auto pr-1">
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
