"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  NotebookText,
  Plus,
  ChefHat,
  Sparkles,
  Search,
  Filter,
  RotateCcw,
  Save,
  Trash2,
  User,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { Textarea } from "@/components/ui/Textarea";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { SectionProgressNav, type SectionProgressStatus } from "@/components/shared/SectionProgressNav";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { type ActionDockItem } from "@/components/ui/ActionDock";
import { fetchApi } from "@/lib/api-base";
import exchangePortionGuide from "@/content/exchange-portions.json";
import { cn } from "@/lib/utils";
import { fetchCreation, fetchProject, saveCreation } from "@/lib/workflow";
import { downloadFastDeliverablePdf } from "@/features/pdf/fastDeliverablePdfExport";
import { useDashboardShell } from "@/context/DashboardShellContext";

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
  section: QuickSection | "";
  time: string;
  mealText: string;
  portion: string;
  weeklyMealTexts?: Partial<Record<QuickWeekDay, string>>;
};

type QuickWeekDay =
  | "Lunes"
  | "Martes"
  | "Miercoles"
  | "Jueves"
  | "Viernes"
  | "Sabado"
  | "Domingo";

type QuickPlanMode = "single" | "weekly";

type QuickAiMode = "ai" | "library";

type QuickGuideSectionId =
  | "general"
  | "meals"
  | "avoidFoods"
  | "resources"
  | "portions"
  | "summary";

type QuickAvoidFoodRow = {
  id: string;
  value: string;
};

type QuickPortionGuideRow = {
  id: string;
  category: string;
  portion: string;
};

type ResourceTemplate = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  variablePlaceholders?: string[];
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
  ageYears?: number | null;
  gender?: string | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  restrictions?: string[];
  likes?: string | null;
  source?: "manual" | "imported";
};

type ImportedCreation = {
  id: string;
  name: string;
  type: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type CreatedRecipeSummary = {
  id: string;
  name: string;
  description?: string | null;
  preparation?: string | null;
  mealSection?: string | null;
  calories?: number;
  proteins?: number;
  carbs?: number;
  lipids?: number;
  isMine?: boolean;
  metadata?: {
    mealSection?: string | null;
    source?: string | null;
    ingredients?: string[];
    customIngredientNames?: string[];
    customIngredients?: Array<{ name?: string }>;
  } | null;
};

type RecipeApiResponseItem = {
  id: string;
  name: string;
  description?: string | null;
  preparation?: string | null;
  mealSection?: string | null;
  calories?: number;
  proteins?: number;
  carbs?: number;
  lipids?: number;
  isMine?: boolean;
  metadata?: CreatedRecipeSummary["metadata"];
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

const QUICK_WEEK_DAYS: QuickWeekDay[] = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

const QUICK_PORTION_GUIDE = [
  ...((Array.isArray(exchangePortionGuide) ? exchangePortionGuide : []) as Array<{ category: string; portion: string }>),
];

const DEFAULT_TITLE = "Entregable rápido";

const createMeal = (section: QuickSection | "" = ""): QuickMeal => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  section,
  time: "",
  mealText: "",
  portion: "",
  weeklyMealTexts: {},
});

const createAvoidFoodRow = (value = ""): QuickAvoidFoodRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  value,
});

const createPortionGuideRow = (
  row: Partial<QuickPortionGuideRow> = {},
): QuickPortionGuideRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  category: "",
  portion: "",
  ...row,
});

const createEmptyQuickPatient = (): QuickPatient => ({
  fullName: "",
  email: null,
  ageYears: null,
  gender: "",
  nutritionalFocus: "",
  fitnessGoals: "",
  restrictions: [],
  likes: "",
  source: "manual",
});

const normalizeQuickText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

function stripHtml(content: string): string {
  return (content || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function getResolvedResourceKey(resource: ResolvedResourcePage, index: number): string {
  return `${resource.resourceId}-${index}`;
}

export default function QuickDeliverableClient() {
  const { setSidebarCollapsed } = useDashboardShell();
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");
  const projectId = searchParams.get("project");

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [planMode, setPlanMode] = useState<QuickPlanMode>("single");
  const [meals, setMeals] = useState<QuickMeal[]>([
    createMeal("Desayuno"),
    createMeal("Almuerzo"),
    createMeal("Cena"),
  ]);
  const [avoidFoods, setAvoidFoods] = useState<QuickAvoidFoodRow[]>([
    createAvoidFoodRow(),
  ]);
  const [isManualPatientExpanded, setIsManualPatientExpanded] = useState(false);
  const [includeMeals, setIncludeMeals] = useState(true);
  const [includeAvoidFoods, setIncludeAvoidFoods] = useState(true);
  const [includeResources, setIncludeResources] = useState(true);
  const [includePortionGuide, setIncludePortionGuide] = useState(true);
  const [portionGuideRows, setPortionGuideRows] = useState<QuickPortionGuideRow[]>(
    QUICK_PORTION_GUIDE.map((row) => createPortionGuideRow(row)),
  );
  const [resources, setResources] = useState<ResourceTemplate[]>([]);
  const [resolvedResourcePages, setResolvedResourcePages] = useState<ResolvedResourcePage[]>([]);
  const [selectedResourceKeys, setSelectedResourceKeys] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("Todas");
  const [patients, setPatients] = useState<QuickPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient>(createEmptyQuickPatient());
  const [patientSearch, setPatientSearch] = useState("");
  const [creationDescription, setCreationDescription] = useState("");
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isCreatedRecipesModalOpen, setIsCreatedRecipesModalOpen] = useState(false);
  const [isLoadingCreatedRecipes, setIsLoadingCreatedRecipes] = useState(false);
  const [createdRecipes, setCreatedRecipes] = useState<CreatedRecipeSummary[]>([]);
  const [createdRecipesSearch, setCreatedRecipesSearch] = useState("");
  const [createdRecipesOnlyMine, setCreatedRecipesOnlyMine] = useState(true);
  const [createdRecipesAllowMismatch, setCreatedRecipesAllowMismatch] = useState(false);
  const [quickAiMode, setQuickAiMode] = useState<QuickAiMode>("ai");
  const [isGeneratingQuickAi, setIsGeneratingQuickAi] = useState(false);
  const [aiAllowedFoods, setAiAllowedFoods] = useState("");
  const [aiRestrictedFoods, setAiRestrictedFoods] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showValidationHighlights, setShowValidationHighlights] = useState(false);
  const [activeGuideSection, setActiveGuideSection] = useState<QuickGuideSectionId>("general");
  const identitySectionRef = useRef<HTMLElement | null>(null);
  const mealsSectionRef = useRef<HTMLElement | null>(null);
  const avoidFoodsSectionRef = useRef<HTMLElement | null>(null);
  const resourcesSectionRef = useRef<HTMLElement | null>(null);
  const portionsSectionRef = useRef<HTMLElement | null>(null);
  const summarySectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const draft = localStorage.getItem("nutri_quick_deliverable_draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title || DEFAULT_TITLE);
      setPlanMode(parsed.planMode === "weekly" ? "weekly" : "single");
      setMeals(Array.isArray(parsed.meals) && parsed.meals.length > 0 ? parsed.meals : [createMeal("Desayuno")]);
      setAvoidFoods(
        Array.isArray(parsed.avoidFoods) && parsed.avoidFoods.length > 0
          ? parsed.avoidFoods.map((item: string | QuickAvoidFoodRow) =>
              typeof item === "string" ? createAvoidFoodRow(item) : item,
            )
          : [createAvoidFoodRow()],
      );
      setResolvedResourcePages(
        Array.isArray(parsed.resources)
          ? parsed.resources.map((resource: ResolvedResourcePage) => ({
              ...resource,
              content: stripHtml(resource.content || ""),
            }))
          : [],
      );
      setSelectedResourceKeys(
        Array.isArray(parsed.selectedResourceKeys) ? parsed.selectedResourceKeys : [],
      );
      setIncludeMeals(parsed.includeMeals !== false);
      setIncludeAvoidFoods(parsed.includeAvoidFoods !== false);
      setIncludeResources(parsed.includeResources !== false);
      setIncludePortionGuide(parsed.includePortionGuide !== false);
      setPortionGuideRows(
        Array.isArray(parsed.portionGuideRows) && parsed.portionGuideRows.length > 0
          ? parsed.portionGuideRows
          : QUICK_PORTION_GUIDE.map((row) => createPortionGuideRow(row)),
      );
      setSelectedPatient(parsed.selectedPatient || createEmptyQuickPatient());
      setIsManualPatientExpanded(parsed.isManualPatientExpanded === true);
    } catch (error) {
      console.error("Error loading quick draft", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "nutri_quick_deliverable_draft",
      JSON.stringify({
        title,
        planMode,
        meals,
        avoidFoods,
        resources: resolvedResourcePages,
        selectedResourceKeys,
        includeMeals,
        includeAvoidFoods,
        includeResources,
        includePortionGuide,
        portionGuideRows,
        selectedPatient,
        isManualPatientExpanded,
      }),
    );
  }, [
    title,
    planMode,
    meals,
    avoidFoods,
    resolvedResourcePages,
    selectedResourceKeys,
    includeMeals,
    includeAvoidFoods,
    includeResources,
    includePortionGuide,
    portionGuideRows,
    selectedPatient,
    isManualPatientExpanded,
  ]);

  useEffect(() => {
    const loadCreation = async () => {
      if (!creationId) return;
      try {
        setSelectedPatient(createEmptyQuickPatient());
        const creation = await fetchCreation(creationId);
        const content = creation.content || {};
        setTitle(content.title || creation.name || DEFAULT_TITLE);
        setPlanMode(content.planMode === "weekly" ? "weekly" : "single");
        setMeals(Array.isArray(content.meals) && content.meals.length > 0 ? content.meals : [createMeal("Desayuno")]);
        setAvoidFoods(
          Array.isArray(content.avoidFoods) && content.avoidFoods.length > 0
            ? content.avoidFoods.map((item: string | QuickAvoidFoodRow) =>
                typeof item === "string" ? createAvoidFoodRow(item) : item,
              )
            : [createAvoidFoodRow()],
        );
        setResolvedResourcePages(
          Array.isArray(content.resources)
            ? content.resources.map((resource: ResolvedResourcePage) => ({
                ...resource,
                content: stripHtml(resource.content || ""),
              }))
            : [],
        );
        setSelectedResourceKeys(
          Array.isArray(content.selectedResourceKeys) ? content.selectedResourceKeys : [],
        );
        setIncludeMeals(content.includeMeals !== false);
        setIncludeAvoidFoods(content.includeAvoidFoods !== false);
        setIncludeResources(content.includeResources !== false);
        setIncludePortionGuide(content.includePortionGuide !== false);
        setPortionGuideRows(
          Array.isArray(content.portionGuideRows) && content.portionGuideRows.length > 0
            ? content.portionGuideRows
            : QUICK_PORTION_GUIDE.map((row) => createPortionGuideRow(row)),
        );
        if (creation.metadata?.patientName) {
          setSelectedPatient({
            id: creation.metadata?.patientId,
            fullName: creation.metadata.patientName,
            source: creation.metadata?.patientId ? "imported" : "manual",
          });
        }
        setIsManualPatientExpanded(false);
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
        setSelectedPatient(createEmptyQuickPatient());
        const project = await fetchProject(projectId);
        setCurrentProjectName(project.name || null);
        setCurrentProjectMode(project.mode || null);
        if (project.patient) {
          setSelectedPatient((current) =>
            current.fullName?.trim()
              ? current
              : { ...(project.patient as QuickPatient), source: "imported" },
          );
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
    () => avoidFoods.map((food) => food.value.trim()).filter(Boolean),
    [avoidFoods],
  );

  const simpleResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          !extractVariablesFromContent(resource.content || "").length &&
          !(resource.variablePlaceholders?.length || 0),
      ),
    [resources],
  );

  const resourceCategories = useMemo(() => {
    const categories = simpleResources
      .map((resource) => resource.category?.trim())
      .filter(Boolean) as string[];
    return ["Todas", ...Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b))];
  }, [simpleResources]);

  const filteredSimpleResources = useMemo(() => {
    const search = resourceSearch.trim().toLowerCase();
    return simpleResources.filter((resource) => {
      const matchesCategory =
        resourceCategoryFilter === "Todas" ||
        (resource.category || "").trim() === resourceCategoryFilter;
      const matchesSearch =
        !search ||
        (resource.title || "").toLowerCase().includes(search) ||
        (resource.content || "").toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [simpleResources, resourceCategoryFilter, resourceSearch]);

  const selectedResolvedResources = useMemo(
    () =>
      resolvedResourcePages.filter((resource, index) =>
        selectedResourceKeys.includes(getResolvedResourceKey(resource, index)),
      ),
    [resolvedResourcePages, selectedResourceKeys],
  );

  const missingRequirements = useMemo(() => {
    const missing: Array<{ id: string; label: string; ref: React.RefObject<HTMLElement | null> }> = [];
    if (!includeMeals && !includeAvoidFoods) {
      missing.push({
        id: "meals",
        label: "Activa comidas o alimentos a evitar *",
        ref: mealsSectionRef,
      });
      return missing;
    }
    if (
      includeMeals &&
      !(
        planMode === "single"
          ? meals.some((m) => m.mealText.trim().length > 0)
          : meals.some((meal) =>
              QUICK_WEEK_DAYS.some((day) => (meal.weeklyMealTexts?.[day] || "").trim().length > 0),
            )
      )
    ) {
      missing.push({ id: "meals", label: "Tabla de comidas *", ref: mealsSectionRef });
    }
    if (includeAvoidFoods && validAvoidFoods.length === 0) {
      missing.push({ id: "avoidFoods", label: "Alimentos a evitar *", ref: avoidFoodsSectionRef });
    }
    return missing;
  }, [includeMeals, meals, planMode, includeAvoidFoods, validAvoidFoods.length]);

  const scrollToRequirement = (requirementId?: string) => {
    const target =
      requirementId === "meals"
          ? mealsSectionRef.current
          : requirementId === "avoidFoods"
            ? avoidFoodsSectionRef.current
            : missingRequirements[0]?.ref.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const missingRequirementIds = useMemo(
    () => new Set(missingRequirements.map((item) => item.id)),
    [missingRequirements],
  );

  const shouldHighlightMealsSection =
    showValidationHighlights && missingRequirementIds.has("meals");

  const shouldHighlightAvoidFoodsSection =
    showValidationHighlights && missingRequirementIds.has("avoidFoods");

  const validateRequiredSections = () => {
    if (missingRequirements.length === 0) {
      setShowValidationHighlights(false);
      return true;
    }

    setShowValidationHighlights(true);
    scrollToRequirement(missingRequirements[0]?.id);
    return false;
  };

  const portionGuideCount = useMemo(
    () =>
      portionGuideRows.filter(
        (row) => row.category.trim() || row.portion.trim(),
      ).length,
    [portionGuideRows],
  );

  const hasMealsContent = useMemo(
    () =>
      planMode === "single"
        ? meals.some((meal) => meal.mealText.trim().length > 0)
        : meals.some((meal) =>
            QUICK_WEEK_DAYS.some(
              (day) => (meal.weeklyMealTexts?.[day] || "").trim().length > 0,
            ),
          ),
    [meals, planMode],
  );

  const getSectionStatus = (
    isVisible: boolean,
    isComplete: boolean,
  ): SectionProgressStatus => {
    if (!isVisible) return "hidden";
    return isComplete ? "complete" : "pending";
  };

  const quickGuideSections = useMemo(
    () => [
      {
        id: "general" as QuickGuideSectionId,
        label: "Informacion general",
        status: getSectionStatus(true, title.trim().length > 0),
        ref: identitySectionRef,
      },
      {
        id: "meals" as QuickGuideSectionId,
        label: "Tabla de comidas",
        status: getSectionStatus(includeMeals, hasMealsContent),
        ref: mealsSectionRef,
      },
      {
        id: "avoidFoods" as QuickGuideSectionId,
        label: "Alimentos a evitar",
        status: getSectionStatus(includeAvoidFoods, validAvoidFoods.length > 0),
        ref: avoidFoodsSectionRef,
      },
      {
        id: "resources" as QuickGuideSectionId,
        label: "Recursos",
        status: getSectionStatus(includeResources, selectedResolvedResources.length > 0),
        ref: resourcesSectionRef,
      },
      {
        id: "portions" as QuickGuideSectionId,
        label: "Porciones",
        status: getSectionStatus(includePortionGuide, portionGuideCount > 0),
        ref: portionsSectionRef,
      },
      {
        id: "summary" as QuickGuideSectionId,
        label: "Resumen",
        status: getSectionStatus(
          true,
          hasMealsContent ||
            validAvoidFoods.length > 0 ||
            selectedResolvedResources.length > 0 ||
            (includePortionGuide && portionGuideCount > 0),
        ),
        ref: summarySectionRef,
      },
    ],
    [
      title,
      includeMeals,
      hasMealsContent,
      includeAvoidFoods,
      validAvoidFoods.length,
      includeResources,
      selectedResolvedResources.length,
      includePortionGuide,
      portionGuideCount,
    ],
  );

  const scrollToGuideSection = (sectionId: QuickGuideSectionId) => {
    const targetSection = quickGuideSections.find((section) => section.id === sectionId);
    targetSection?.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const updateActiveSection = () => {
      const viewportOffset = 180;
      let nextSection = quickGuideSections[0]?.id ?? "general";

      quickGuideSections.forEach((section) => {
        const top = section.ref.current?.getBoundingClientRect().top;
        if (typeof top === "number" && top - viewportOffset <= 0) {
          nextSection = section.id;
        }
      });

      setActiveGuideSection(nextSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [quickGuideSections]);

  const quickAiMealTargets = useMemo(() => {
    const counts = new Map<string, number>();
    if (planMode === "single") {
      meals.forEach((meal) => {
        const key = meal.section.trim();
        if (!key || meal.mealText.trim()) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    } else {
      meals.forEach((meal) => {
        const key = meal.section.trim();
        if (!key) return;
        QUICK_WEEK_DAYS.forEach((day) => {
          const value = meal.weeklyMealTexts?.[day] || "";
          if (!value.trim()) {
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        });
      });
    }

    return Array.from(counts.entries()).map(([mealSection, count]) => ({
      mealSection,
      count,
    }));
  }, [meals, planMode]);

  const filteredCreatedRecipes = useMemo(() => {
    const search = createdRecipesSearch.trim().toLowerCase();
    return createdRecipes.filter((recipe) => {
      if (createdRecipesOnlyMine && recipe.isMine === false) {
        return false;
      }
      if (!search) return true;
      const haystack = [
        recipe.name,
        recipe.description || "",
        recipe.preparation || "",
        recipe.mealSection || "",
        ...(recipe.metadata?.ingredients || []),
        ...(recipe.metadata?.customIngredientNames || []),
        ...(recipe.metadata?.customIngredients || []).map((item) => item?.name || ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [createdRecipes, createdRecipesOnlyMine, createdRecipesSearch]);

  function getCreatedRecipeMatchScore(recipe: CreatedRecipeSummary, section: QuickSection) {
    const normalizedSection = normalizeQuickText(section);
    const recipeSection = normalizeQuickText(recipe.mealSection || "");
    if (recipeSection && recipeSection === normalizedSection) return 100;
    if (recipeSection && recipeSection.includes(normalizedSection)) return 80;
    if (normalizedSection.includes(recipeSection)) return 60;
    return 0;
  }

  const createdRecipeMatches = useMemo(() => {
    return meals.reduce((total, meal) => {
      const hasMatch = filteredCreatedRecipes.some(
        (recipe) => getCreatedRecipeMatchScore(recipe, meal.section) >= 80,
      );
      return total + (hasMatch ? 1 : 0);
    }, 0);
  }, [filteredCreatedRecipes, meals]);

  const applyImportedQuickCreation = (creation: ImportedCreation) => {
    if (creation.type !== "FAST_DELIVERABLE") {
      toast.error("Solo puedes importar entregables rápidos en este módulo.");
      return;
    }

    const content = creation.content || {};
    const importedMeals = Array.isArray(content.meals)
      ? (content.meals as QuickMeal[])
      : [];
    const importedAvoidFoods = Array.isArray(content.avoidFoods)
      ? content.avoidFoods
      : [];
    const importedResources = Array.isArray(content.resources)
      ? (content.resources as ResolvedResourcePage[])
      : [];
    const importedPortionRows = Array.isArray(content.portionGuideRows)
      ? (content.portionGuideRows as QuickPortionGuideRow[])
      : Array.isArray(content.portionGuide)
        ? (content.portionGuide as Array<{ category?: string; portion?: string }>).map((row) =>
            createPortionGuideRow({
              category: row.category || "",
              portion: row.portion || "",
            }),
          )
        : [];

    setTitle(
      typeof content.title === "string" && content.title.trim()
        ? content.title
        : creation.name || DEFAULT_TITLE,
    );
    setPlanMode(content.planMode === "weekly" ? "weekly" : "single");
    setMeals(importedMeals.length > 0 ? importedMeals : [createMeal("Desayuno")]);
    setAvoidFoods(
      importedAvoidFoods.length > 0
        ? importedAvoidFoods.map((item) =>
            typeof item === "string"
              ? createAvoidFoodRow(item)
              : createAvoidFoodRow((item as QuickAvoidFoodRow).value || ""),
          )
        : [createAvoidFoodRow()],
    );
    setResolvedResourcePages(
      importedResources.map((resource) => ({
        ...resource,
        content: stripHtml(resource.content || ""),
      })),
    );
    setSelectedResourceKeys(
      Array.isArray(content.selectedResourceKeys)
        ? (content.selectedResourceKeys as string[])
        : importedResources.map((resource, index) =>
            getResolvedResourceKey(resource, index),
          ),
    );
    setIncludeMeals(content.includeMeals !== false);
    setIncludeAvoidFoods(content.includeAvoidFoods !== false);
    setIncludeResources(content.includeResources !== false);
    setIncludePortionGuide(content.includePortionGuide !== false);
    setPortionGuideRows(
      importedPortionRows.length > 0
        ? importedPortionRows.map((row) => createPortionGuideRow(row))
        : QUICK_PORTION_GUIDE.map((row) => createPortionGuideRow(row)),
    );

    const patientName =
      typeof creation.metadata?.patientName === "string"
        ? creation.metadata.patientName
        : null;
    const patientId =
      typeof creation.metadata?.patientId === "string"
        ? creation.metadata.patientId
        : undefined;

    setSelectedPatient(
      patientName
        ? {
            id: patientId,
            fullName: patientName,
            source: patientId ? "imported" : "manual",
          }
        : createEmptyQuickPatient(),
    );
    setIsManualPatientExpanded(false);

    setIsImportCreationModalOpen(false);
    toast.success("Entregable rápido importado al borrador actual.");
  };

  const loadCreatedRecipes = async () => {
    setIsLoadingCreatedRecipes(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi("/recipes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los platos creados.");
      }

      const data = await response.json();
      const normalized: CreatedRecipeSummary[] = Array.isArray(data)
        ? (data as RecipeApiResponseItem[]).map((recipe) => ({
            id: recipe.id,
            name: recipe.name,
            description: recipe.description || null,
            preparation: recipe.preparation || null,
            mealSection: recipe.metadata?.mealSection || recipe.mealSection || null,
            calories: recipe.calories || 0,
            proteins: recipe.proteins || 0,
            carbs: recipe.carbs || 0,
            lipids: recipe.lipids || 0,
            isMine: Boolean(recipe.isMine),
            metadata: recipe.metadata || null,
          }))
        : [];

      setCreatedRecipes(normalized);
    } catch (error) {
      console.error("Error loading created recipes", error);
      toast.error("No se pudieron cargar los platos creados.");
    } finally {
      setIsLoadingCreatedRecipes(false);
    }
  };

  const fillMealsWithCreatedRecipes = () => {
    const pool = createdRecipes
      .filter((recipe) => (createdRecipesOnlyMine ? recipe.isMine !== false : true))
      .filter((recipe) => {
        const search = createdRecipesSearch.trim().toLowerCase();
        if (!search) return true;
        const haystack = [
          recipe.name,
          recipe.description || "",
          recipe.preparation || "",
          recipe.mealSection || "",
          ...(recipe.metadata?.ingredients || []),
          ...(recipe.metadata?.customIngredientNames || []),
          ...(recipe.metadata?.customIngredients || []).map((item) => item?.name || ""),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });

    if (pool.length === 0) {
      toast.error("No encontramos platos creados para rellenar.");
      return;
    }

    const sortedPool = [...pool];

    setMeals((current) => {
      const usedIds = new Set<string>();
      const nextMeals = current.map((meal) => {
        if (!meal.section.trim()) return meal;

        if (planMode === "single") {
          const exactMatch = sortedPool.find(
            (recipe) =>
              !usedIds.has(recipe.id) &&
              getCreatedRecipeMatchScore(recipe, meal.section as QuickSection) >= 80,
          );

          const fallbackMatch = createdRecipesAllowMismatch
            ? sortedPool.find((recipe) => !usedIds.has(recipe.id))
            : undefined;

          const selectedRecipe = exactMatch || fallbackMatch;
          if (!selectedRecipe || meal.mealText.trim()) {
            return meal;
          }

          usedIds.add(selectedRecipe.id);
          return {
            ...meal,
            mealText: selectedRecipe.name,
          };
        }

        const nextWeeklyTexts = { ...(meal.weeklyMealTexts || {}) };
        QUICK_WEEK_DAYS.forEach((day) => {
          if ((nextWeeklyTexts[day] || "").trim()) return;
          const exactMatch = sortedPool.find(
            (recipe) =>
              !usedIds.has(recipe.id) &&
              getCreatedRecipeMatchScore(recipe, meal.section as QuickSection) >= 80,
          );
          const fallbackMatch = createdRecipesAllowMismatch
            ? sortedPool.find((recipe) => !usedIds.has(recipe.id))
            : undefined;
          const selectedRecipe = exactMatch || fallbackMatch;
          if (!selectedRecipe) return;
          usedIds.add(selectedRecipe.id);
          nextWeeklyTexts[day] = selectedRecipe.name;
        });

        return {
          ...meal,
          weeklyMealTexts: nextWeeklyTexts,
        };
      });

      return nextMeals;
    });

    setIsCreatedRecipesModalOpen(false);
    toast.success("Tus platos creados se usaron para rellenar la tabla.");
  };

  const generateMealsWithAi = async () => {
    if (quickAiMealTargets.length === 0) {
      toast.error("No hay espacios vacios con categoria para rellenar.");
      return;
    }

    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    if (!token) {
      toast.error("No se encontro una sesion activa.");
      return;
    }

    const pendingRows = meals.map((meal) => ({
      id: meal.id,
      section: meal.section,
      mealText: meal.mealText,
      weeklyMealTexts: { ...(meal.weeklyMealTexts || {}) },
    }));

    setIsCreatedRecipesModalOpen(false);
    setIsGeneratingQuickAi(true);
    toast.info("La IA esta generando opciones. Puedes seguir editando mientras tanto.");

    try {
      const response = await fetchApi("/recipes/quick-ai-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payload: {
            notes: aiNotes,
            allowedFoodsMain: aiAllowedFoods
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            restrictedFoods: aiRestrictedFoods
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            mealSectionTargets: quickAiMealTargets,
            generationMode: planMode,
            patient: {
              fullName: selectedPatient.fullName || "",
              gender: selectedPatient.gender || "",
              ageYears: selectedPatient.ageYears ?? undefined,
              restrictions: selectedPatient.restrictions || [],
              likes: selectedPatient.likes || "",
              fitnessGoals: selectedPatient.fitnessGoals || "",
              clinicalSummary: selectedPatient.nutritionalFocus || "",
            },
            existingDishes: meals
              .flatMap((meal) => {
                if (!meal.section.trim()) return [];
                if (planMode === "single") {
                  return meal.mealText.trim()
                    ? [{ title: meal.mealText.trim(), mealSection: meal.section }]
                    : [];
                }
                return QUICK_WEEK_DAYS
                  .map((day) => (meal.weeklyMealTexts?.[day] || "").trim())
                  .filter(Boolean)
                  .map((title) => ({ title, mealSection: meal.section }));
              }),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "No se pudo generar con IA.");
      }

      const result = await response.json();
      const dishes = Array.isArray(result?.dishes)
        ? result.dishes
            .map((dish: { title?: string; mealSection?: string }) => ({
              title: String(dish?.title || "").trim(),
              mealSection: String(dish?.mealSection || "").trim(),
            }))
            .filter((dish: { title: string; mealSection: string }) => dish.title && dish.mealSection)
        : [];

      setMeals((current) => {
        const remaining = [...dishes];
        return current.map((meal) => {
          const original = pendingRows.find((row) => row.id === meal.id);
          if (!meal.section.trim()) return meal;

          if (planMode === "single") {
            const targetDishIndex = remaining.findIndex(
              (dish) => getCreatedRecipeMatchScore({ id: "", name: dish.title, mealSection: dish.mealSection }, meal.section as QuickSection) >= 80,
            );
            if (
              targetDishIndex === -1 ||
              meal.mealText.trim() ||
              (original?.mealText || "").trim()
            ) {
              return meal;
            }
            const [selectedDish] = remaining.splice(targetDishIndex, 1);
            return {
              ...meal,
              mealText: selectedDish.title,
            };
          }

          const nextWeeklyTexts = { ...(meal.weeklyMealTexts || {}) };
          QUICK_WEEK_DAYS.forEach((day) => {
            const originalText = original?.weeklyMealTexts?.[day] || "";
            const currentText = nextWeeklyTexts[day] || "";
            if (originalText.trim() || currentText.trim()) return;
            const targetDishIndex = remaining.findIndex(
              (dish) => getCreatedRecipeMatchScore({ id: "", name: dish.title, mealSection: dish.mealSection }, meal.section as QuickSection) >= 80,
            );
            if (targetDishIndex === -1) return;
            const [selectedDish] = remaining.splice(targetDishIndex, 1);
            nextWeeklyTexts[day] = selectedDish.title;
          });

          return {
            ...meal,
            weeklyMealTexts: nextWeeklyTexts,
          };
        });
      });

      toast.success("La IA relleno los espacios vacios de alimentos.");
    } catch (error) {
      console.error("Error generating meals with AI", error);
      toast.error(error instanceof Error ? error.message : "No se pudo generar con IA.");
    } finally {
      setIsGeneratingQuickAi(false);
    }
  };

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

  const startManualPatientEntry = () => {
    setIsManualPatientExpanded(true);
    identitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(createEmptyQuickPatient());
    setIsManualPatientExpanded(false);
    toast.info("Paciente quitado del entregable.");
  };

  useEffect(() => {
    if (isCreatedRecipesModalOpen) {
      void loadCreatedRecipes();
    }
  }, [isCreatedRecipesModalOpen]);

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
    setSelectedResourceIds([]);
    setResourceSearch("");
    setResourceCategoryFilter("Todas");
    setIsResourceModalOpen(true);
  };

  const addResolvedResourcePage = async () => {
    if (selectedResourceIds.length === 0) {
      toast.error("Selecciona al menos un recurso.");
      return;
    }

    try {
      const nextResources: ResolvedResourcePage[] = [];

      for (const resourceId of selectedResourceIds) {
        const resource = simpleResources.find((item) => item.id === resourceId);
        if (!resource) continue;
        nextResources.push({
          resourceId: resource.id,
          title: resource.title,
          content: stripHtml(resource.content),
          variables: {},
        });
      }
      setResolvedResourcePages((prev) => {
        const next = [...prev, ...nextResources];
        setSelectedResourceKeys((current) => [
          ...current,
          ...nextResources.map((resource, index) =>
            getResolvedResourceKey(resource, prev.length + index),
          ),
        ]);
        return next;
      });
      setSelectedResourceIds([]);
      setIsResourceModalOpen(false);
      toast.success("Recursos agregados al entregable rápido.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo agregar el recurso.");
    }
  };

  const updateMeal = (
    mealId: string,
    field: "section" | "time" | "mealText" | "portion",
    value: string,
  ) => {
    setMeals((current) =>
      current.map((meal) => (meal.id === mealId ? { ...meal, [field]: value } : meal)),
    );
  };

  const updateWeeklyMealText = (mealId: string, day: QuickWeekDay, value: string) => {
    setMeals((current) =>
      current.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              weeklyMealTexts: {
                ...(meal.weeklyMealTexts || {}),
                [day]: value,
              },
            }
          : meal,
      ),
    );
  };

  const addMeal = () => {
    setMeals((current) => [...current, createMeal()]);
  };

  const removeMeal = (mealId: string) => {
    setMeals((current) => current.filter((meal) => meal.id !== mealId));
  };

  const updateAvoidFood = (rowId: string, value: string) => {
    setAvoidFoods((current) =>
      current.map((item) => (item.id === rowId ? { ...item, value } : item)),
    );
  };

  const addAvoidFoodRow = () => {
    setAvoidFoods((current) => [...current, createAvoidFoodRow()]);
  };

  const removeAvoidFood = (rowId: string) => {
    setAvoidFoods((current) =>
      current.length === 1
        ? current
        : current.filter((item) => item.id !== rowId),
    );
  };

  const updatePortionGuideRow = (
    rowId: string,
    field: "category" | "portion",
    value: string,
  ) => {
    setPortionGuideRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const addPortionGuideRow = () => {
    setPortionGuideRows((current) => [...current, createPortionGuideRow()]);
  };

  const removePortionGuideRow = (rowId: string) => {
    setPortionGuideRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== rowId),
    );
  };

  const getProteinSupplementNote = () => {
    try {
      const workflowDraft = JSON.parse(localStorage.getItem("nutri_active_draft") || "{}");
      const supplement = workflowDraft?.recipes?.proteinSupplement;
      const enabled = Boolean(supplement?.enabled);
      const gramsPerDay = Math.max(0, Number(supplement?.gramsPerDay) || 0);
      if (!enabled || gramsPerDay <= 0) return "";
      return `Incluye suplemento de proteína: ${gramsPerDay} g diarios.`;
    } catch {
      return "";
    }
  };

  const buildPdfPayload = () => ({
    name: title.trim() || DEFAULT_TITLE,
    patientName: selectedPatient?.fullName || null,
    planMode,
    meals: includeMeals
      ? planMode === "single"
        ? meals
        : meals.flatMap((meal) =>
            QUICK_WEEK_DAYS.map((day) => ({
              ...meal,
              section: `${day} - ${meal.section || "Sin categoria"}`,
              mealText: meal.weeklyMealTexts?.[day] || "",
            })),
          )
      : [],
    avoidFoods: includeAvoidFoods ? validAvoidFoods : [],
    resources: includeResources
      ? selectedResolvedResources.map((resource) => ({
          ...resource,
          content: stripHtml(resource.content || ""),
        }))
      : [],
    portionGuide: includePortionGuide
      ? portionGuideRows
          .map((row) => ({
            category: row.category.trim(),
            portion: row.portion.trim(),
          }))
          .filter((row) => row.category || row.portion)
      : [],
    supplementNote: getProteinSupplementNote(),
    generatedAt: new Date().toLocaleDateString("es-CL"),
    ...(selectedPatient.fullName.trim() ||
    selectedPatient.ageYears !== null ||
    Boolean(selectedPatient.gender) ||
    Boolean(selectedPatient.nutritionalFocus) ||
    Boolean(selectedPatient.fitnessGoals) ||
    (selectedPatient.restrictions || []).length > 0 ||
    Boolean(selectedPatient.likes)
      ? {
          patient: {
            name: selectedPatient.fullName || null,
            ageYears: selectedPatient.ageYears ?? null,
            gender: selectedPatient.gender || null,
            nutritionalFocus: selectedPatient.nutritionalFocus || null,
            fitnessGoals: selectedPatient.fitnessGoals || null,
            restrictions: selectedPatient.restrictions || [],
            likes: selectedPatient.likes || null,
            source: selectedPatient.source || "manual",
          },
        }
      : {}),
  });

  const handleExportPdf = async () => {
    if (!validateRequiredSections()) {
      toast.error("Completa las secciones marcadas para generar el PDF.");
      return;
    }
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
    if (!validateRequiredSections()) {
      toast.error("Completa las secciones marcadas antes de guardar la creación.");
      return;
    }

    setIsSaving(true);
    try {
      await saveCreation({
        name: title.trim() || DEFAULT_TITLE,
        type: "FAST_DELIVERABLE",
        content: {
          title,
          planMode,
          meals,
          avoidFoods: validAvoidFoods,
          resources: resolvedResourcePages,
          selectedResourceKeys,
          includeMeals,
          includeAvoidFoods,
          includeResources,
          includePortionGuide,
          portionGuide: portionGuideRows
            .map((row) => ({
              category: row.category.trim(),
              portion: row.portion.trim(),
            }))
            .filter((row) => row.category || row.portion),
          portionGuideRows,
          supplementNote: getProteinSupplementNote(),
          updatedAt: new Date().toISOString(),
        },
        metadata: {
          ...(creationDescription.trim() ? { description: creationDescription.trim() } : {}),
          ...(selectedPatient.fullName
            ? { patientId: selectedPatient.id, patientName: selectedPatient.fullName }
            : {}),
          mealCount: includeMeals ? meals.length : 0,
          avoidFoodsCount: includeAvoidFoods ? validAvoidFoods.length : 0,
          resourceCount: includeResources ? selectedResolvedResources.length : 0,
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
    setPlanMode("single");
    setMeals([createMeal("Desayuno"), createMeal("Almuerzo"), createMeal("Cena")]);
    setAvoidFoods([createAvoidFoodRow()]);
    setSelectedPatient(createEmptyQuickPatient());
    setIsManualPatientExpanded(false);
    setResolvedResourcePages([]);
    setSelectedResourceKeys([]);
    setIncludeMeals(true);
    setIncludeAvoidFoods(true);
    setIncludeResources(true);
    setIncludePortionGuide(true);
    setPortionGuideRows(QUICK_PORTION_GUIDE.map((row) => createPortionGuideRow(row)));
    localStorage.removeItem("nutri_quick_deliverable_draft");
    toast.success("Entregable rápido reiniciado.");
  };

  const actionDockItems: ActionDockItem[] = [
    {
      id: "created-recipes",
      icon: ChefHat,
      label: "Platos creados",
      variant: "emerald",
      onClick: () => setIsCreatedRecipesModalOpen(true),
    },
    {
      id: "save",
      icon: Save,
      label: "Guardar creación",
      variant: "slate",
      onClick: () => setIsSaveCreationModalOpen(true),
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
        className="max-w-[68rem]"
        footer={
          <ModuleFooter>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Formato resumido para consulta única
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
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

        <div className="mt-10 space-y-8 xl:px-4">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Este módulo está pensado para consultas express: se guarda como <strong>entregable rápido</strong> y el PDF sale en una sola hoja, sin portada.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-medium text-slate-600 shadow-sm">
            Los campos con <strong>*</strong> son obligatorios para generar el PDF. El paciente es opcional en este modo.
          </div>

          <div className="relative">
            <div className="fixed left-[max(6rem,calc(50%-48rem))] top-28 z-20 hidden xl:block">
              <div>
                <SectionProgressNav
                  items={quickGuideSections.map((section) => ({
                    id: section.id,
                    label: section.label,
                    status: section.status,
                    active: activeGuideSection === section.id,
                    onClick: () => scrollToGuideSection(section.id),
                  }))}
                />
              </div>
            </div>

          <div className="grid gap-7 xl:grid-cols-[1.35fr,0.8fr]">
            <div className="space-y-8">
              <section
                ref={identitySectionRef}
                className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm"
              >
                <div className="flex flex-col gap-6">
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
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openPatientModal}
                      className={cn(
                        "rounded-2xl border font-bold",
                        selectedPatient.fullName?.trim()
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700",
                      )}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {selectedPatient.fullName?.trim()
                        ? `Paciente: ${selectedPatient.fullName}`
                        : "Sin paciente asignado"}
                    </Button>
                    {selectedPatient.fullName?.trim() && (
                      <button
                        type="button"
                        onClick={clearSelectedPatient}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                        title="Quitar paciente"
                        aria-label="Quitar paciente"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={startManualPatientEntry}
                      className="text-left text-xs font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
                    >
                      O completa manualmente sin reutilizar uno existente.
                    </button>
                  </div>
                </div>

                {isManualPatientExpanded && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Nombre
                    </p>
                    <Input
                      value={selectedPatient.fullName}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          fullName: e.target.value,
                          source: current.source || "manual",
                        }))
                      }
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Edad
                    </p>
                    <Input
                      type="number"
                      min={0}
                      value={selectedPatient.ageYears ?? ""}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          ageYears:
                            e.target.value === ""
                              ? null
                              : Math.max(0, Math.round(Number(e.target.value) || 0)),
                          source: current.source || "manual",
                        }))
                      }
                      placeholder="Ej: 42"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Sexo
                    </p>
                    <select
                      value={selectedPatient.gender || ""}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          gender: e.target.value,
                          source: current.source || "manual",
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Objetivo / enfoque
                    </p>
                    <Input
                      value={selectedPatient.nutritionalFocus || ""}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          nutritionalFocus: e.target.value,
                          source: current.source || "manual",
                        }))
                      }
                      placeholder="Ej: mejorar energía, ordenar horarios..."
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Metas
                    </p>
                    <Input
                      value={selectedPatient.fitnessGoals || ""}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          fitnessGoals: e.target.value,
                          source: current.source || "manual",
                        }))
                      }
                      placeholder="Ej: bajar grasa, ganar masa muscular..."
                    />
                  </div>
                </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Restricciones
                    </p>
                    <Input
                      value={(selectedPatient.restrictions || []).join(", ")}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          restrictions: e.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                          source: current.source || "manual",
                        }))
                      }
                      placeholder="Ej: sin gluten, evitar lactosa"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Gustos
                    </p>
                    <Input
                      value={selectedPatient.likes || ""}
                      onChange={(e) =>
                        setSelectedPatient((current) => ({
                          ...current,
                          likes: e.target.value,
                          source: current.source || "manual",
                        }))
                      }
                      placeholder="Ej: preparaciones saladas, frutas, yogurt..."
                    />
                    </div>
                  </div>
                </div>
                )}
                </div>
              </section>

              <section
                ref={mealsSectionRef}
                className={cn(
                  "rounded-3xl border border-slate-200 bg-white p-10 shadow-sm",
                  shouldHighlightMealsSection && "border-rose-400 ring-4 ring-rose-100",
                  !includeMeals && "opacity-55",
                )}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <h2 className="text-xl font-black text-slate-900">
                        Tabla de comidas <span className="text-rose-600">*</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIncludeMeals((current) => !current)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors",
                          includeMeals
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500",
                        )}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            includeMeals ? "bg-emerald-500" : "bg-slate-300",
                          )}
                        />
                        {includeMeals ? "Ocultar seccion" : "Incluir seccion"}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Arrastra los bloques para ordenar el día y completa hora,
                      indicación y porción.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200 px-4 text-slate-700 md:self-start"
                    onClick={() => setIsCreatedRecipesModalOpen(true)}
                    title="Rellenar con platos creados"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
                    Rellenar con IA / platos creados
                  </Button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="hidden flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIncludeMeals((current) => !current)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors",
                          includeMeals
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500",
                        )}
                      >
                        <span className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          includeMeals ? "bg-emerald-500" : "bg-slate-300",
                        )} />
                        {includeMeals ? "Seccion visible" : "Seccion oculta"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanMode((current) => (current === "single" ? "weekly" : "single"))}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors",
                          planMode === "weekly"
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-600",
                        )}
                      >
                        {planMode === "weekly" ? "Vista semanal activa" : "Cambiar a semanal"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {planMode === "weekly"
                        ? "Categoria, hora y porcion se editan una vez; alimentos cambian por dia."
                        : "Agrega filas vacias y completa categoria, alimentos, hora y porciones."}
                    </p>
                  </div>
                </div>

                <div className={cn(
                  "overflow-x-auto rounded-3xl border border-slate-200",
                  planMode === "weekly" && "hidden",
                )}>
                  <table className="w-full min-w-[860px] bg-white">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          <div className="flex items-center gap-2">
                            <span>Alimentos</span>
                            <button
                              type="button"
                              onClick={() => setIsCreatedRecipesModalOpen(true)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                              title="Rellenar con IA / platos creados"
                              aria-label="Rellenar con IA / platos creados"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-36">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-44">
                          Porciones
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-20">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {meals.map((meal) => (
                        <tr key={meal.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-4 py-3 align-top">
                            <select
                              value={meal.section}
                              onChange={(e) =>
                                updateMeal(meal.id, "section", e.target.value)
                              }
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
                              disabled={!includeMeals}
                            >
                              <option value="">Seleccionar</option>
                              {QUICK_SECTIONS.map((section) => (
                                <option key={section} value={section}>
                                  {section}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Input
                              value={meal.mealText}
                              onChange={(e) =>
                                updateMeal(meal.id, "mealText", e.target.value)
                              }
                              className="h-11 rounded-2xl border-slate-200 bg-white"
                                placeholder="Nombre del plato o preparacion"
                              disabled={!includeMeals}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Input
                              value={meal.time}
                              onChange={(e) =>
                                updateMeal(meal.id, "time", e.target.value)
                              }
                              className="h-11 rounded-2xl border-slate-200 bg-white"
                              placeholder="07:30"
                              disabled={!includeMeals}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Input
                              value={meal.portion}
                              onChange={(e) =>
                                updateMeal(meal.id, "portion", e.target.value)
                              }
                              className="h-11 rounded-2xl border-slate-200 bg-white"
                              placeholder="2 porciones"
                              disabled={!includeMeals}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button
                              type="button"
                              onClick={() => removeMeal(meal.id)}
                              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              disabled={!includeMeals}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={5} className="px-4 py-4">
                          <button
                            type="button"
                            onClick={addMeal}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            disabled={!includeMeals}
                          >
                            <Plus className="h-4 w-4" />
                            Agregar fila
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {planMode === "weekly" && (
                  <div className="overflow-x-auto rounded-3xl border border-slate-200">
                    <table className="w-full min-w-[1500px] bg-white">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Categoria</th>
                          {QUICK_WEEK_DAYS.map((day) => (
                            <th key={day} className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                              {day}
                            </th>
                          ))}
                          <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-28">Hora</th>
                          <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-36">Porciones</th>
                          <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-20">Accion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meals.map((meal) => (
                          <tr key={`weekly-${meal.id}`} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-3 py-3 align-top">
                              <select
                                value={meal.section}
                                onChange={(e) => updateMeal(meal.id, "section", e.target.value)}
                                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900"
                                disabled={!includeMeals}
                              >
                                <option value="">Seleccionar</option>
                                {QUICK_SECTIONS.map((section) => (
                                  <option key={`weekly-${meal.id}-${section}`} value={section}>
                                    {section}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {QUICK_WEEK_DAYS.map((day) => (
                              <td key={`${meal.id}-${day}`} className="px-3 py-3 align-top">
                                <Input
                                  value={meal.weeklyMealTexts?.[day] || ""}
                                  onChange={(e) => updateWeeklyMealText(meal.id, day, e.target.value)}
                                  className="h-10 rounded-2xl border-slate-200 bg-white text-xs"
                                  placeholder="Alimento"
                                  disabled={!includeMeals}
                                />
                              </td>
                            ))}
                            <td className="px-3 py-3 align-top">
                              <Input
                                value={meal.time}
                                onChange={(e) => updateMeal(meal.id, "time", e.target.value)}
                                className="h-10 rounded-2xl border-slate-200 bg-white text-xs"
                                placeholder="07:30"
                                disabled={!includeMeals}
                              />
                            </td>
                            <td className="px-3 py-3 align-top">
                              <Input
                                value={meal.portion}
                                onChange={(e) => updateMeal(meal.id, "portion", e.target.value)}
                                className="h-10 rounded-2xl border-slate-200 bg-white text-xs"
                                placeholder="2 porciones"
                                disabled={!includeMeals}
                              />
                            </td>
                            <td className="px-3 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => removeMeal(meal.id)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                disabled={!includeMeals}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={10} className="px-4 py-4">
                            <button
                              type="button"
                              onClick={addMeal}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              disabled={!includeMeals}
                            >
                              <Plus className="h-4 w-4" />
                              Agregar fila semanal
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                </div>
              </section>

              <section
                ref={avoidFoodsSectionRef}
                className={cn(
                  "rounded-3xl border border-slate-200 bg-white p-10 shadow-sm",
                  shouldHighlightAvoidFoodsSection && "border-rose-400 ring-4 ring-rose-100",
                  !includeAvoidFoods && "opacity-55",
                )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Alimentos a evitar <span className="text-rose-600">*</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIncludeAvoidFoods((current) => !current)}
                      className={cn(
                        "mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors",
                        includeAvoidFoods
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          includeAvoidFoods ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      />
                      {includeAvoidFoods ? "Ocultar seccion" : "Incluir seccion"}
                    </button>
                    <p className="mt-1 text-sm text-slate-500">
                      Agrega filas simples para dejar restricciones o
                      recordatorios rápidos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="hidden items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={includeAvoidFoods}
                        onChange={(e) => setIncludeAvoidFoods(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      Incluir seccion
                    </label>
                    <Button
                      variant="outline"
                      className="h-11 rounded-2xl border-slate-200"
                      onClick={addAvoidFoodRow}
                      disabled={!includeAvoidFoods}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar fila
                    </Button>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="w-full min-w-[620px] bg-white">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Alimento / restricción
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-20">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {avoidFoods.map((food) => (
                        <tr key={food.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-4 py-3">
                            <Input
                              value={food.value}
                              onChange={(e) =>
                                updateAvoidFood(food.id, e.target.value)
                              }
                              className="h-11 rounded-2xl border-slate-200 bg-white"
                              placeholder="Ej: bebidas azucaradas, frituras, alcohol..."
                              disabled={!includeAvoidFoods}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeAvoidFood(food.id)}
                              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              disabled={!includeAvoidFoods}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section
                ref={resourcesSectionRef}
                className={cn(
                  "rounded-3xl border border-slate-200 bg-white p-10 shadow-sm",
                  !includeResources && "opacity-55",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Recursos específicos
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIncludeResources((current) => !current)}
                      className={cn(
                        "mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors",
                        includeResources
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          includeResources ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      />
                      {includeResources ? "Ocultar seccion" : "Incluir seccion"}
                    </button>
                    <p className="mt-1 text-sm text-slate-500">
                      Puedes sumar material breve adaptado al paciente.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="hidden items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={includeResources}
                        onChange={(e) => setIncludeResources(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      Incluir seccion
                    </label>
                    <Button
                      variant="outline"
                      className="h-10 rounded-2xl border-slate-200"
                      onClick={openResourceModal}
                      disabled={!includeResources}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="w-full min-w-[760px] bg-white">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-20">
                          Incluir
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Recurso
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Vista previa
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-20">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedResourcePages.length > 0 ? (
                        resolvedResourcePages.map((resource, index) => {
                          const resourceKey = getResolvedResourceKey(resource, index);
                          const isSelected = selectedResourceKeys.includes(resourceKey);

                          return (
                            <tr key={`selected-${resourceKey}`} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-3 align-top">
                                <button
                                  type="button"
                                  onClick={() =>
                                    includeResources &&
                                    setSelectedResourceKeys((current) =>
                                      current.includes(resourceKey)
                                        ? current.filter((key) => key !== resourceKey)
                                        : [...current, resourceKey],
                                    )
                                  }
                                  className={cn(
                                    "h-6 w-6 rounded-md border flex items-center justify-center transition-colors",
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-slate-300 bg-white text-transparent",
                                  )}
                                  disabled={!includeResources}
                                >
                                  <AlertCircle className="h-3.5 w-3.5" />
                                </button>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="font-bold text-slate-800">{resource.title}</p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  {Object.keys(resource.variables || {}).length} variables resueltas
                                </p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {resource.content}
                                </p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!includeResources) return;
                                    setResolvedResourcePages((current) =>
                                      current.filter((_, itemIndex) => itemIndex !== index),
                                    );
                                    setSelectedResourceKeys((current) =>
                                      current.filter((key) => key !== resourceKey),
                                    );
                                  }}
                                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  disabled={!includeResources}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                            Todavía no agregas recursos para este entregable.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="hidden mt-5 space-y-3">
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

              <section ref={portionsSectionRef} className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Guía resumida de porciones
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIncludePortionGuide((current) => !current)}
                      className={cn(
                        "mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors",
                        includePortionGuide
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          includePortionGuide ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      />
                      {includePortionGuide ? "Ocultar seccion" : "Incluir seccion"}
                    </button>
                    <p className="mt-1 text-sm text-slate-500">
                      Resumen profesional simple para que el paciente entienda
                      referencias base.
                    </p>
                  </div>
                  <label className="hidden items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={includePortionGuide}
                      onChange={(e) =>
                        setIncludePortionGuide(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Incluir seccion
                  </label>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200"
                    onClick={addPortionGuideRow}
                    disabled={!includePortionGuide}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar fila
                  </Button>
                </div>

                <div
                  className={cn(
                    "mt-4 overflow-x-auto rounded-2xl border border-slate-200",
                    !includePortionGuide && "opacity-45",
                  )}
                >
                  <table className="w-full min-w-[720px] bg-white">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Porción
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 w-20">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {portionGuideRows.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-4 py-3">
                            <Input
                              value={row.category}
                              onChange={(e) =>
                                updatePortionGuideRow(row.id, "category", e.target.value)
                              }
                              className="h-11 rounded-2xl border-slate-200 bg-white"
                              placeholder="Categoría"
                              disabled={!includePortionGuide}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={row.portion}
                              onChange={(e) =>
                                updatePortionGuideRow(row.id, "portion", e.target.value)
                              }
                              className="h-11 rounded-2xl border-slate-200 bg-white"
                              placeholder="Detalle de porción"
                              disabled={!includePortionGuide}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removePortionGuideRow(row.id)}
                              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              disabled={!includePortionGuide || portionGuideRows.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section ref={summarySectionRef} className="rounded-3xl border border-slate-200 bg-slate-900 p-10 text-white shadow-sm">
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
                      {includePortionGuide ? portionGuideCount : 0}
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
                    setIsManualPatientExpanded(false);
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
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder="Buscar por nombre del recurso..."
              className="h-11 rounded-xl border-slate-200 bg-slate-50"
            />
            <select
              value={resourceCategoryFilter}
              onChange={(e) => setResourceCategoryFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
            >
              {resourceCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Solo recursos simples, sin variables
            </p>
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredSimpleResources.length > 0 ? filteredSimpleResources.map((resource) => {
                const isSelected = selectedResourceIds.includes(resource.id);
                const preview = stripHtml(resource.content || "").replace(/\s+/g, " ").trim();

                return (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => {
                      setSelectedResourceIds((current) =>
                        current.includes(resource.id)
                          ? current.filter((id) => id !== resource.id)
                          : [...current, resource.id],
                      );
                    }}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                      isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">{resource.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {preview || "Sin descripción disponible."}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-black",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white text-transparent",
                          )}
                        >
                          ✓
                        </div>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {resource.category || "General"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No hay recursos simples para este filtro.
                </div>
              )}
            </div>
          </div>

          <Button
            className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={addResolvedResourcePage}
          >
            Agregar seleccionados
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isCreatedRecipesModalOpen}
        onClose={() => setIsCreatedRecipesModalOpen(false)}
        title="Platos creados"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setQuickAiMode("ai")}
              className={cn(
                "rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors",
                quickAiMode === "ai" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              Utilizar IA para generar
            </button>
            <button
              type="button"
              onClick={() => setQuickAiMode("library")}
              className={cn(
                "rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors",
                quickAiMode === "library" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              Usar mis platos para rellenar
            </button>
          </div>
          {quickAiMode === "ai" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700">
                <p className="font-black text-slate-900">Generacion asistida</p>
                <p className="mt-1 text-xs text-slate-600">
                  La IA recibe categorias, espacios vacios y tus notas para completar solo la columna de alimentos.
                  Puedes seguir editando mientras trabaja.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Alimentos a considerar
                  </label>
                  <Textarea
                    value={aiAllowedFoods}
                    onChange={(e) => setAiAllowedFoods(e.target.value)}
                    placeholder="Ej: avena, pollo, frutas, legumbres..."
                    className="min-h-[96px] rounded-2xl border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Restricciones para la IA
                  </label>
                  <Textarea
                    value={aiRestrictedFoods}
                    onChange={(e) => setAiRestrictedFoods(e.target.value)}
                    placeholder="Ej: sin lactosa, evitar frituras..."
                    className="min-h-[96px] rounded-2xl border-slate-200 bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Notas adicionales
                </label>
                <Textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Ej: opciones rapidas, mas salado, snacks simples..."
                  className="min-h-[96px] rounded-2xl border-slate-200 bg-white"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Se detectaron <strong>{quickAiMealTargets.reduce((total, item) => total + item.count, 0)}</strong> espacios vacios
                para rellenar {planMode === "weekly" ? "en la vista semanal" : "en la tabla actual"}.
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="rounded-2xl border-slate-200"
                  onClick={() => setIsCreatedRecipesModalOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cerrar
                </Button>
                <Button
                  className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => void generateMealsWithAi()}
                  disabled={isGeneratingQuickAi || quickAiMealTargets.length === 0}
                >
                  {isGeneratingQuickAi ? "Generando..." : "Generar con IA"}
                </Button>
              </div>
            </div>
          )}
          {quickAiMode === "library" && (
          <>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-700">
            <p className="font-black text-slate-900">Rellenado rápido</p>
            <p className="mt-1 text-xs text-slate-500">
              Usamos tus platos creados o guardados para completar solo la columna
              de alimentos con el nombre del plato.{" "}
              {createdRecipeMatches > 0
                ? `Hay ${createdRecipeMatches} coincidencias directas con las categorías actuales.`
                : "Si no hay coincidencias exactas, puedes permitir rellenar igual."}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={createdRecipesSearch}
                onChange={(e) => setCreatedRecipesSearch(e.target.value)}
                placeholder="Buscar por nombre, sección o ingrediente..."
                className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
              />
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={createdRecipesOnlyMine}
                onChange={(e) => setCreatedRecipesOnlyMine(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Solo mis platos
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={createdRecipesAllowMismatch}
                onChange={(e) => setCreatedRecipesAllowMismatch(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Elegir platos aunque no coincidan todos sus ingredientes
            </label>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-emerald-700">
              <Filter className="h-3.5 w-3.5" />
              {filteredCreatedRecipes.length} platos disponibles
            </div>
          </div>

          <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
            {isLoadingCreatedRecipes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
            ) : filteredCreatedRecipes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Todavía no tienes platos creados visibles para este filtro.
              </div>
            ) : (
              filteredCreatedRecipes.map((recipe) => {
                const matchScore = getCreatedRecipeMatchScore(recipe, meals[0]?.section || "Desayuno");
                return (
                  <div
                    key={recipe.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900">{recipe.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {recipe.mealSection || "Sin categoría"} · {Math.round(recipe.calories || 0)} kcal
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                            matchScore >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {matchScore >= 80 ? "Coincide" : "Manual"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {recipe.description || recipe.preparation || "Plato creado en tu perfil."}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200"
              onClick={() => setIsCreatedRecipesModalOpen(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
            <Button
              className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={fillMealsWithCreatedRecipes}
              disabled={isLoadingCreatedRecipes || filteredCreatedRecipes.length === 0}
            >
              Rellenar tabla
            </Button>
          </div>
          </>
          )}
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
      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={applyImportedQuickCreation}
        allowedTypes={["FAST_DELIVERABLE"]}
      />
    </>
  );
}
