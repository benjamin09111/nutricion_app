"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertCircle,
  Plus,
  ChefHat,
  Trash2,
  User,
  X,
  Check,
  Search,
  Sparkles,
  Loader2,
  FileText,
  Download,
  Save,
  RotateCcw,
  ChevronDown,
  Filter,
} from "lucide-react";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TagInput } from "@/components/ui/TagInput";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { NatyLoadingOverlay, NatyButton, PlanWizardShell, PromptPreviewButton } from "@/components/plans";
import { fetchApi } from "@/lib/api-base";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { fetchCreation, fetchProject, saveCreation } from "@/lib/workflow";
import { downloadPautaAlimentacionPdf } from "@/features/pdf/pautaAlimentacionPdfExport";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { cn } from "@/lib/utils";
import { ActionDockItem } from "@/components/ui/ActionDock";

type PautaPatient = {
  id?: string;
  fullName: string;
  email?: string | null;
  ageYears?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string | null;
  clinicalSummary?: string | null;
  likes?: string | null;
  dislikedFoods?: string[];
  restrictions?: string[];
  primaryCondition?: string | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  get?: number | null;
  source?: "manual" | "imported";
};

type PautaFoodItem = {
  id: string;
  portion: string;
  food: string;
};

type PautaParagraph = {
  id: string;
  category: string;
  categoryOptional: string;
  portionsPerDay: string;
  foods: PautaFoodItem[];
  imagePath: string | null;
};

type PautaEditorMode = "paragraphs" | "table";

type PautaMeal = {
  id: string;
  section: string;
  time: string;
  mealText: string;
  portion: string;
};

type EducationalResource = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  tags?: string[];
  sources?: string | null;
  nutritionistId?: string | null;
  isMine?: boolean;
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "Lácteos": "/imag_categories/1.webp",
  "Huevos": "/imag_categories/2.webp",
  "Carnes y Vísceras": "/imag_categories/3.webp",
  "Pescados y Mariscos": "/imag_categories/4.webp",
  "Semillas y Nueces": "/imag_categories/5.webp",
  "Cereales y Derivados": "/imag_categories/6.webp",
  "Papas": "/imag_categories/7.webp",
  "Grasas y Aceites": "/imag_categories/8.webp",
  "Verduras": "/imag_categories/9.webp",
  "Frutas": "/imag_categories/10.webp",
  "Azúcares y Miel": "/imag_categories/11.webp",
  "Alimentos Dulces": "/imag_categories/11.webp",
  "Postres de Leche": "/imag_categories/1.webp",
  "Jugos y Néctares": "/imag_categories/10.webp",
  "Refrescos en Polvo": "/imag_categories/11.webp",
  "Bebidas": "/imag_categories/10.webp",
  "Bebidas Alcohólicas": "/imag_categories/11.webp",
  "Productos Salados": "/imag_categories/3.webp",
  "Salsas": "/imag_categories/8.webp",
  "Especias": "/imag_categories/9.webp",
  "Endulzantes": "/imag_categories/11.webp",
  "Platos Preparados": "/imag_categories/6.webp",
};

type ImportedCreation = {
  id: string;
  name: string;
  type: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type ServerTag = {
  id: string;
  name: string;
};

type ImportedPatient = {
  id: string;
  fullName: string;
  email?: string | null;
  ageYears?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string | null;
  dietRestrictions?: string[];
  primaryCondition?: string | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  likes?: string | null;
  dislikedFoods?: string[];
};

const DEFAULT_TITLE = "Pauta de alimentación";
const createEmptyPatient = (): PautaPatient => ({
  fullName: "",
  email: null,
  ageYears: null,
  weight: null,
  height: null,
  source: "manual",
});

const createFoodItem = (): PautaFoodItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  portion: "",
  food: "",
});

const createParagraph = (): PautaParagraph => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  category: "",
  categoryOptional: "",
  portionsPerDay: "",
  foods: [createFoodItem()],
  imagePath: null,
});

const createPautaMeal = (section = ""): PautaMeal => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  section,
  time: "",
  mealText: "",
  portion: "",
});

const WIZARD_STEPS = ["Contenido educativo", "Pauta alimentaria", "Resumen"];

const PAUTA_MEAL_SECTIONS = [
  "Desayuno",
  "Colación AM",
  "Almuerzo",
  "Colación PM",
  "Once",
  "Cena",
  "Post entreno",
];

const SYSTEM_RESTRICTION_RESOURCES: Record<string, { resourceId: string; aliases: string[] }> = {
  diabetico: {
    resourceId: "sys-restricciones-diabetico-01",
    aliases: ["diabetico", "diabetes", "glicemia"],
  },
  hipertension: {
    resourceId: "sys-restricciones-hipertension-01",
    aliases: ["hipertension", "hipertenso", "presion arterial"],
  },
  vegetariano: {
    resourceId: "sys-restricciones-vegetariano-01",
    aliases: ["vegetariano"],
  },
  celiaco: {
    resourceId: "sys-restricciones-celiaco-01",
    aliases: ["celiaco", "celiaquia"],
  },
  "sin gluten": {
    resourceId: "sys-restricciones-sin-gluten-01",
    aliases: ["sin gluten", "libre de gluten"],
  },
};

const normalizeClinicalText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatPautaFoodLabel = (portion: string, food: string) => {
  const cleanFood = food.trim();
  const cleanPortion = portion.trim();

  if (!cleanFood) return "";
  if (!cleanPortion) return cleanFood;

  if (/^\d+(?:[.,]\d+)?$/.test(cleanPortion)) {
    const numericPortion = cleanPortion.replace(",", ".");
    return `${numericPortion} porción${Number(numericPortion) === 1 ? "" : "es"} de ${cleanFood}`;
  }

  return `${cleanPortion} de ${cleanFood}`;
};

export default function PautasAlimentacionClient() {
  const { setSidebarCollapsed } = useDashboardShell();
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");
  const projectId = searchParams.get("project");

  const [title, setTitle] = useState("");
  const [selectedRestriction, setSelectedRestriction] = useState<string>("");
  const [restrictions, setRestrictions] = useState<ServerTag[]>([]);
  const [restrictionSearch, setRestrictionSearch] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<PautaPatient>(createEmptyPatient());
  const [patients, setPatients] = useState<ImportedPatient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isManualPatientExpanded, setIsManualPatientExpanded] = useState(false);
  const [manualPatientData, setManualPatientData] = useState({
    ageYears: "",
    weight: "",
    height: "",
  });

  const [paragraphs, setParagraphs] = useState<PautaParagraph[]>([createParagraph()]);
  const [pautaEditorMode, setPautaEditorMode] = useState<PautaEditorMode>("paragraphs");
  const [meals, setMeals] = useState<PautaMeal[]>([
    createPautaMeal("Desayuno"),
    createPautaMeal("Almuerzo"),
    createPautaMeal("Cena"),
  ]);
  const [avoidFoods, setAvoidFoods] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<string | null>(null);
  const [educationalContent, setEducationalContent] = useState("");
  const [educationalMode, setEducationalMode] = useState<"auto" | "import" | "manual">("auto");
  const [educationalResources, setEducationalResources] = useState<EducationalResource[]>([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceSource, setResourceSource] = useState<"system" | "mine">("system");
  const [autoEducationalContent, setAutoEducationalContent] = useState<string>("");
  const [hasAutoMatch, setHasAutoMatch] = useState<boolean>(true);
  const [isSaveEducationalResourceModalOpen, setIsSaveEducationalResourceModalOpen] = useState(false);
  const [educationalResourceTitle, setEducationalResourceTitle] = useState("");
  const [educationalResourceTags, setEducationalResourceTags] = useState<string[]>([]);
  const [educationalResourceSource, setEducationalResourceSource] = useState("");
  const [isSavingEducationalResource, setIsSavingEducationalResource] = useState(false);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const completedSteps = useMemo(() => Array.from({ length: currentStep }, (_, i) => i), [currentStep]);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAllowedFoods, setAiAllowedFoods] = useState("");
  const [aiRestrictedFoods, setAiRestrictedFoods] = useState("");
  const [aiSelectedCategories, setAiSelectedCategories] = useState<string[]>([]);
  const [allowExternalFoods, setAllowExternalFoods] = useState(false);

  // Control de Cambios (Dirty Tracking)
  const [lastSavedState, setLastSavedState] = useState<string | null>(null);

  const validParagraphs = useMemo(
    () => paragraphs.filter((p) => p.category.trim() || p.foods.some((f) => f.food.trim())),
    [paragraphs],
  );
  const validMeals = useMemo(
    () => meals.filter((meal) => meal.section.trim() && meal.mealText.trim()),
    [meals],
  );

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, WIZARD_STEPS.length - 1)));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  }, []);

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCategoryDropdown && !(e.target as HTMLElement).closest(".category-dropdown")) {
        setShowCategoryDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showCategoryDropdown]);

  // Serializar estado actual para dirty tracking
  const getCurrentStateString = useCallback(() => {
    return JSON.stringify({
      title: title.trim(),
      selectedRestriction: selectedRestriction.trim(),
      paragraphs: paragraphs.map((p) => ({
        id: p.id,
        category: p.category,
        categoryOptional: p.categoryOptional,
        portionsPerDay: p.portionsPerDay,
        imagePath: p.imagePath,
        foods: p.foods.map((f) => ({
          id: f.id,
          portion: f.portion,
          food: f.food,
        })),
      })),
      pautaEditorMode,
      meals: meals.map((meal) => ({
        id: meal.id,
        section: meal.section,
        time: meal.time,
        mealText: meal.mealText,
        portion: meal.portion,
      })),
      avoidFoods: avoidFoods.trim(),
      educationalContent: educationalContent.trim(),
      educationalMode,
      patientId: selectedPatient.id || "",
      patientName: selectedPatient.fullName || "",
      manualPatientData: isManualPatientExpanded ? manualPatientData : null,
    });
  }, [
    title,
    selectedRestriction,
    paragraphs,
    pautaEditorMode,
    meals,
    avoidFoods,
    educationalContent,
    educationalMode,
    selectedPatient,
    isManualPatientExpanded,
    manualPatientData,
  ]);

  const hasChanges = useMemo(() => {
    if (lastSavedState === null) return true;
    return lastSavedState !== getCurrentStateString();
  }, [lastSavedState, getCurrentStateString]);

  // Cargar borrador inicial
  useEffect(() => {
    const draft = localStorage.getItem("nutri_pauta_alimentacion_draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title ?? "");
      setSelectedRestriction(parsed.selectedRestriction || "");
      setSelectedPatient(parsed.selectedPatient || createEmptyPatient());
      setIsManualPatientExpanded(parsed.isManualPatientExpanded === true);
      setEducationalMode(
        parsed.educationalMode === "manual" || parsed.educationalMode === "import"
          ? parsed.educationalMode
          : "auto",
      );
      setManualPatientData(
        parsed.manualPatientData || { ageYears: "", weight: "", height: "" },
      );
      setParagraphs(
        Array.isArray(parsed.paragraphs) && parsed.paragraphs.length > 0
          ? parsed.paragraphs
          : [createParagraph()],
      );
      setPautaEditorMode(parsed.pautaEditorMode === "table" ? "table" : "paragraphs");
      setMeals(
        Array.isArray(parsed.meals) && parsed.meals.length > 0
          ? parsed.meals
          : [createPautaMeal("Desayuno"), createPautaMeal("Almuerzo"), createPautaMeal("Cena")],
      );
      setAvoidFoods(parsed.avoidFoods || "");
      setEducationalContent(parsed.educationalContent || "");
    } catch (error) {
      console.error("Error loading draft", error);
    }
  }, []);

  // Guardar borrador al cambiar datos
  useEffect(() => {
    localStorage.setItem(
      "nutri_pauta_alimentacion_draft",
      JSON.stringify({
        title,
        selectedRestriction,
        selectedPatient,
        isManualPatientExpanded,
        manualPatientData,
        paragraphs,
        pautaEditorMode,
        meals,
        avoidFoods,
        educationalContent,
        educationalMode,
      }),
    );
  }, [
    title,
    selectedRestriction,
    selectedPatient,
    isManualPatientExpanded,
    manualPatientData,
    paragraphs,
    pautaEditorMode,
    meals,
    avoidFoods,
    educationalContent,
    educationalMode,
  ]);

  // Cargar creación desde base de datos
  useEffect(() => {
    if (!creationId) return;
    const loadCreation = async () => {
      try {
        setSelectedPatient(createEmptyPatient());
        const creation = await fetchCreation(creationId);
        const content = creation.content || {};
        setTitle(content.title || creation.name || DEFAULT_TITLE);
        setSelectedRestriction(content.selectedRestriction || "");
        setParagraphs(
          Array.isArray(content.paragraphs) && content.paragraphs.length > 0
            ? content.paragraphs
            : [createParagraph()],
        );
        setPautaEditorMode(content.pautaEditorMode === "table" ? "table" : "paragraphs");
        setMeals(
          Array.isArray(content.meals) && content.meals.length > 0
            ? content.meals
            : [createPautaMeal("Desayuno"), createPautaMeal("Almuerzo"), createPautaMeal("Cena")],
        );
        setAvoidFoods(content.avoidFoods || "");
        setEducationalContent(content.educationalContent || "");
        setEducationalMode(
          content.educationalMode === "manual" || content.educationalMode === "import"
            ? content.educationalMode
            : "auto",
        );
        const patientData: PautaPatient = creation.metadata?.patientName
          ? {
              id: creation.metadata?.patientId || "",
              fullName: creation.metadata.patientName || "",
              source: (creation.metadata?.patientId ? "imported" : "manual") as "imported" | "manual",
            }
          : createEmptyPatient();
        if (creation.metadata?.patientName) {
          setSelectedPatient(patientData);
        }
        setIsManualPatientExpanded(false);

        // Capturar estado inicial cargado para dirty tracking
        const serialized = JSON.stringify({
          title: (content.title || creation.name || DEFAULT_TITLE).trim(),
          selectedRestriction: (content.selectedRestriction || "").trim(),
          paragraphs: (
            Array.isArray(content.paragraphs) && content.paragraphs.length > 0
              ? content.paragraphs
              : [createParagraph()]
          ).map((p: any) => ({
            id: p.id,
            category: p.category,
            categoryOptional: p.categoryOptional,
            portionsPerDay: p.portionsPerDay,
            imagePath: p.imagePath,
            foods: (Array.isArray(p.foods) ? p.foods : []).map((f: any) => ({
              id: f.id,
              portion: f.portion,
              food: f.food,
            })),
          })),
          pautaEditorMode: content.pautaEditorMode === "table" ? "table" : "paragraphs",
          meals: (
            Array.isArray(content.meals) && content.meals.length > 0
              ? content.meals
              : [createPautaMeal("Desayuno"), createPautaMeal("Almuerzo"), createPautaMeal("Cena")]
          ).map((meal: any) => ({
            id: meal.id,
            section: meal.section,
            time: meal.time,
            mealText: meal.mealText,
            portion: meal.portion,
          })),
          avoidFoods: (content.avoidFoods || "").trim(),
          educationalContent: (content.educationalContent || "").trim(),
          educationalMode: content.educationalMode || "auto",
          patientId: patientData.id || "",
          patientName: patientData.fullName || "",
          manualPatientData: null,
        });
        setLastSavedState(serialized);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar las pautas.");
      }
    };
    loadCreation();
  }, [creationId]);

  // Cargar proyecto asociado
  useEffect(() => {
    if (!projectId) return;
    const loadProject = async () => {
      try {
        setSelectedPatient(createEmptyPatient());
        const project = await fetchProject(projectId);
        setCurrentProjectName(project.name || null);
        setCurrentProjectMode(project.mode || null);
        if (project.patient) {
          setSelectedPatient({
            fullName: (project.patient as ImportedPatient).fullName || "",
            email: (project.patient as ImportedPatient).email,
            ageYears: (project.patient as ImportedPatient).ageYears,
            weight: (project.patient as ImportedPatient).weight ?? null,
            height: (project.patient as ImportedPatient).height ?? null,
            source: "imported",
          });
        }
      } catch (error) {
        console.error("Error loading project", error);
      }
    };
    loadProject();
  }, [projectId]);

  // Cargar restricciones clínicas del servidor
  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
        const response = await fetchApi("/tags", { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) setRestrictions(await response.json());
      } catch (error) {
        console.error("Error fetching restrictions", error);
      }
    };
    fetchRestrictions();
  }, []);

  const fetchEducationalResources = useCallback(async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi("/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEducationalResources(await response.json());
      }
    } catch (error) {
      console.error("Error fetching educational resources", error);
    }
  }, []);

  // Cargar recursos educativos (para modo importación y automático)
  useEffect(() => {
    void fetchEducationalResources();
  }, [fetchEducationalResources]);

  const selectedSystemRestriction = useMemo(
    () => SYSTEM_RESTRICTION_RESOURCES[normalizeClinicalText(selectedRestriction)] || null,
    [selectedRestriction],
  );

  const restrictionResources = useMemo(
    () => educationalResources.filter((resource) => resource.category === "restricciones"),
    [educationalResources],
  );

  const autoEducationalResource = useMemo(() => {
    if (!selectedSystemRestriction) return null;

    const systemResources = restrictionResources.filter(
      (resource) => resource.nutritionistId === null,
    );
    const exactResource = systemResources.find(
      (resource) => resource.id === selectedSystemRestriction.resourceId,
    );
    if (exactResource) return exactResource;

    return systemResources.find((resource) => {
      const values = [resource.title, ...(resource.tags || [])].map(normalizeClinicalText);
      return selectedSystemRestriction.aliases.some((alias) => values.includes(alias));
    }) || null;
  }, [restrictionResources, selectedSystemRestriction]);

  // Solo las restricciones predefinidas pueden elegir un recurso automático del sistema.
  useEffect(() => {
    if (!selectedRestriction.trim()) {
      setAutoEducationalContent("");
      setHasAutoMatch(true);
      return;
    }
    if (!autoEducationalResource) {
      setAutoEducationalContent("");
      setHasAutoMatch(false);
      return;
    }
    setAutoEducationalContent(autoEducationalResource.content || "");
    setHasAutoMatch(true);
  }, [selectedRestriction, autoEducationalResource]);

  const allRestrictions = useMemo(() => {
    const defaultIds = DEFAULT_CONSTRAINTS.map((c) => c.id);
    const serverRestrictionNames = restrictions.map((r) => r.name);
    return Array.from(new Set([...defaultIds, ...serverRestrictionNames]));
  }, [restrictions]);

  const filteredRestrictions = useMemo(() => {
    if (!restrictionSearch.trim()) return allRestrictions;
    return allRestrictions.filter((r) => r.toLowerCase().includes(restrictionSearch.toLowerCase()));
  }, [allRestrictions, restrictionSearch]);

  const filteredEducationalResources = useMemo(() => {
    const query = normalizeClinicalText(resourceSearch);
    const sourceResources = resourceSource === "system"
      ? restrictionResources.filter((resource) => resource.nutritionistId === null)
      : restrictionResources.filter((resource) => resource.isMine === true);
    return sourceResources.filter((resource) => {
      const searchable = [resource.title, ...(resource.tags || [])]
        .map(normalizeClinicalText)
        .join(" ");
      return !query || searchable.includes(query);
    });
  }, [resourceSearch, resourceSource, restrictionResources]);

  const FOOD_CATEGORIES = [
    "Lácteos",
    "Huevos",
    "Carnes y Vísceras",
    "Pescados y Mariscos",
    "Semillas y Nueces",
    "Cereales y Derivados",
    "Papas",
    "Grasas y Aceites",
    "Verduras",
    "Frutas",
    "Azúcares y Miel",
    "Alimentos Dulces",
    "Postres de Leche",
    "Jugos y Néctares",
    "Refrescos en Polvo",
    "Bebidas",
    "Bebidas Alcohólicas",
    "Productos Salados",
    "Salsas",
    "Especias",
    "Endulzantes",
    "Platos Preparados",
  ];

  const exchangeCategories = FOOD_CATEGORIES;
  const usedCategories = useMemo(
    () => paragraphs.flatMap((p) => [p.category, p.categoryOptional]).filter((c) => c.trim()),
    [paragraphs],
  );
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return exchangeCategories;
    return exchangeCategories.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [exchangeCategories, categorySearch]);

  const calculatedBmi = useMemo(() => {
    const weight = Number(manualPatientData.weight) || selectedPatient.weight;
    const height = Number(manualPatientData.height) || selectedPatient.height;
    if (!weight || !height) return null;
    return Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10;
  }, [
    manualPatientData.weight,
    manualPatientData.height,
    selectedPatient.weight,
    selectedPatient.height,
  ]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    return patients.filter((p) => (p.fullName || "").toLowerCase().includes(patientSearch.toLowerCase()));
  }, [patients, patientSearch]);

  const openPatientModal = async () => {
    setIsLoadingPatients(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/patients?status=Activos&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      }
      setPatientSearch("");
      setIsPatientModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los pacientes.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSelectPatient = (patient: ImportedPatient) => {
    setSelectedPatient({
      id: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      ageYears: patient.ageYears ?? null,
      weight: patient.weight ?? null,
      height: patient.height ?? null,
      gender: patient.gender ?? null,
      restrictions: patient.dietRestrictions || [],
      primaryCondition: patient.primaryCondition,
      nutritionalFocus: patient.nutritionalFocus,
      fitnessGoals: patient.fitnessGoals,
      likes: patient.likes,
      dislikedFoods: patient.dislikedFoods || [],
      source: "imported",
    });
    setIsManualPatientExpanded(false);
    setIsPatientModalOpen(false);
    toast.success(`Paciente ${patient.fullName} seleccionado.`);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(createEmptyPatient());
    setIsManualPatientExpanded(false);
    setManualPatientData({ ageYears: "", weight: "", height: "" });
    toast.info("Paciente quitado.");
  };

  const updateParagraphImage = (id: string, imagePath: string | null) => {
    setParagraphs((current) => current.map((p) => (p.id === id ? { ...p, imagePath } : p)));
    setIsImageSelectorOpen(false);
  };

  const openImageSelector = (paragraphId: string) => {
    setSelectedParagraphId(paragraphId);
    setIsImageSelectorOpen(true);
  };

  const updateParagraph = (
    id: string,
    field: keyof PautaParagraph,
    value: string | boolean | null,
  ) => {
    setParagraphs((current) => current.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addParagraph = () => setParagraphs((current) => [...current, createParagraph()]);
  const removeParagraph = (id: string) =>
    setParagraphs((current) => (current.length === 1 ? current : current.filter((p) => p.id !== id)));
  const updateFoodItem = (
    paragraphId: string,
    foodId: string,
    field: keyof PautaFoodItem,
    value: string,
  ) => {
    setParagraphs((current) =>
      current.map((p) =>
        p.id === paragraphId
          ? {
              ...p,
              foods: p.foods.map((f) => (f.id === foodId ? { ...f, [field]: value } : f)),
            }
          : p,
      ),
    );
  };

  const addFoodItem = (paragraphId: string) =>
    setParagraphs((current) =>
      current.map((p) =>
        p.id === paragraphId ? { ...p, foods: [...p.foods, createFoodItem()] } : p,
      ),
    );

  const removeFoodItem = (paragraphId: string, foodId: string) =>
    setParagraphs((current) =>
      current.map((p) =>
        p.id === paragraphId
          ? {
              ...p,
              foods: p.foods.length === 1 ? p.foods : p.foods.filter((f) => f.id !== foodId),
            }
          : p,
      ),
    );

  const updateMeal = (mealId: string, field: keyof Omit<PautaMeal, "id">, value: string) => {
    setMeals((current) =>
      current.map((meal) => (meal.id === mealId ? { ...meal, [field]: value } : meal)),
    );
  };

  const addMeal = () => setMeals((current) => [...current, createPautaMeal()]);
  const removeMeal = (mealId: string) =>
    setMeals((current) => (current.length === 1 ? current : current.filter((meal) => meal.id !== mealId)));

  const applyImportedCreation = (creation: ImportedCreation) => {
    if (creation.type !== "PAUTAS") {
      toast.error("Solo pautas de alimentación.");
      return;
    }
    const content = creation.content as Record<string, unknown> || {};
    setTitle(String(content.title || creation.name || DEFAULT_TITLE));
    setSelectedRestriction(String(content.selectedRestriction || ""));
    setParagraphs(
      Array.isArray(content.paragraphs) && content.paragraphs.length > 0
        ? (content.paragraphs as PautaParagraph[])
      : [createParagraph()],
    );
    setPautaEditorMode(content.pautaEditorMode === "table" ? "table" : "paragraphs");
    setMeals(
      Array.isArray(content.meals) && content.meals.length > 0
        ? (content.meals as PautaMeal[])
        : [createPautaMeal("Desayuno"), createPautaMeal("Almuerzo"), createPautaMeal("Cena")],
    );
    setAvoidFoods(String(content.avoidFoods || ""));
    setEducationalContent(String(content.educationalContent || ""));
    setEducationalMode(
      content.educationalMode === "manual" || content.educationalMode === "import"
        ? content.educationalMode
        : "auto",
    );
    const patientName =
      typeof creation.metadata?.patientName === "string" ? creation.metadata.patientName : null;
    const patientId =
      typeof creation.metadata?.patientId === "string" ? creation.metadata.patientId : undefined;
    setSelectedPatient(
      patientName
        ? { id: patientId, fullName: patientName, source: patientId ? "imported" : "manual" }
        : createEmptyPatient(),
    );
    setIsManualPatientExpanded(false);
    setIsImportCreationModalOpen(false);
    toast.success("Pautas importadas.");

    // Guardar estado inicial para evitar marcar como sucio inmediatamente después de importar
    const serialized = JSON.stringify({
      title: String(content.title || creation.name || DEFAULT_TITLE).trim(),
      selectedRestriction: String(content.selectedRestriction || "").trim(),
      paragraphs: (
        Array.isArray(content.paragraphs) && content.paragraphs.length > 0
          ? content.paragraphs
          : [createParagraph()]
      ).map((p: any) => ({
        id: p.id,
        category: p.category,
        categoryOptional: p.categoryOptional,
        portionsPerDay: p.portionsPerDay,
        imagePath: p.imagePath,
        foods: (Array.isArray(p.foods) ? p.foods : []).map((f: any) => ({
          id: f.id,
          portion: f.portion,
          food: f.food,
        })),
      })),
      pautaEditorMode: content.pautaEditorMode === "table" ? "table" : "paragraphs",
      meals: (
        Array.isArray(content.meals) && content.meals.length > 0
          ? content.meals
          : [createPautaMeal("Desayuno"), createPautaMeal("Almuerzo"), createPautaMeal("Cena")]
      ).map((meal: any) => ({
        id: meal.id,
        section: meal.section,
        time: meal.time,
        mealText: meal.mealText,
        portion: meal.portion,
      })),
      avoidFoods: String(content.avoidFoods || "").trim(),
      educationalContent: String(content.educationalContent || "").trim(),
      educationalMode: content.educationalMode || "auto",
      patientId: patientId || "",
      patientName: patientName || "",
      manualPatientData: null,
    });
    setLastSavedState(serialized);
  };

  const missingRequirements = useMemo(() => {
    const list: string[] = [];
    if (!selectedRestriction.trim()) {
      list.push("Restricción clínica");
    }
    if (pautaEditorMode === "paragraphs" && validParagraphs.length === 0) {
      list.push("Párrafos de pauta");
    }
    if (pautaEditorMode === "table" && validMeals.length === 0) {
      list.push("Tabla de comidas");
    }
    return list;
  }, [selectedRestriction, pautaEditorMode, validParagraphs, validMeals]);

  const getSaveTooltipMessage = () => {
    if (missingRequirements.length > 0) {
      return `Completa los pendientes (${missingRequirements.join(", ")}) para guardar`;
    }
    if (!hasChanges) {
      return "No hay cambios pendientes por guardar";
    }
    return "";
  };

  const validateRequiredSections = () => {
    if (missingRequirements.length > 0) {
      toast.error(`Completa los requisitos: ${missingRequirements.join(", ")}`);
      return false;
    }
    return true;
  };

  const getCurrentUser = () => {
    const raw = Cookies.get("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const buildPdfPayload = () => {
    const patientAge = isManualPatientExpanded
      ? manualPatientData.ageYears
        ? Number(manualPatientData.ageYears)
        : null
      : selectedPatient.ageYears ?? null;
    const patientWeight = isManualPatientExpanded
      ? manualPatientData.weight
        ? Number(manualPatientData.weight)
        : null
      : selectedPatient.weight ?? null;
    const patientHeight = isManualPatientExpanded
      ? manualPatientData.height
        ? Number(manualPatientData.height)
        : null
      : selectedPatient.height ?? null;

    const user = getCurrentUser();
    const nutritionistName = user?.nutritionist?.fullName || user?.name || null;
    const nutritionistEmail = user?.email || null;

    return {
      name: title.trim() || DEFAULT_TITLE,
      restriction: selectedRestriction,
      pautaEditorMode,
      nutritionistName,
      nutritionistEmail,
      patient: selectedPatient.fullName.trim()
        ? {
            name: selectedPatient.fullName,
            ageYears: patientAge,
            weight: patientWeight,
            height: patientHeight,
            bmi: calculatedBmi,
            nextControl: null,
          }
        : null,
      paragraphs: pautaEditorMode === "paragraphs" ? validParagraphs.map((p) => ({
        title: p.portionsPerDay.trim()
          ? `Tiempo de alimentación: ${p.portionsPerDay.trim()}`
          : "Tiempo de alimentación",
        subtitle: [
          p.category.trim() ? `Grupo clínico: ${p.category.trim()}` : null,
          p.categoryOptional.trim() ? `Alternativa clínica: ${p.categoryOptional.trim()}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        foods: p.foods.map((f) => formatPautaFoodLabel(f.portion, f.food)).filter(Boolean),
        imagePath: p.imagePath,
      })) : [],
      meals: pautaEditorMode === "table" ? validMeals : [],
      avoidFoods: avoidFoods
        .split(",")
        .map((food) => food.trim())
        .filter(Boolean),
      resource:
        educationalMode === "auto"
          ? autoEducationalContent.trim()
            ? {
                title: `Información educativa - ${selectedRestriction}`,
                content: autoEducationalContent,
              }
            : null
          : educationalContent.trim()
            ? { title: `Información educativa - ${selectedRestriction}`, content: educationalContent }
            : null,
      generatedAt: new Date().toLocaleDateString("es-CL"),
    };
  };

  const handleExportPdf = async () => {
    if (!validateRequiredSections()) return;
    setIsExportingPdf(true);
    try {
      await downloadPautaAlimentacionPdf(buildPdfPayload());
      toast.success("PDF descargado correctamente.");
      setIsSaveCreationModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Error al generar PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const openSaveEducationalResourceModal = () => {
    if (!educationalContent.trim()) return;
    setEducationalResourceTitle(`Información educativa - ${selectedRestriction}`);
    setEducationalResourceTags([selectedRestriction, "Restricciones alimenticias"]);
    setEducationalResourceSource("");
    setIsSaveEducationalResourceModalOpen(true);
  };

  const handleSaveEducationalResource = async () => {
    if (!educationalResourceTitle.trim()) {
      toast.error("Ingresa un título para el recurso.");
      return;
    }
    if (!educationalContent.trim()) return;

    setIsSavingEducationalResource(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi("/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: educationalResourceTitle.trim(),
          content: educationalContent,
          category: "restricciones",
          tags: educationalResourceTags.filter(Boolean),
          sources: educationalResourceSource.trim() || undefined,
          format: "HTML",
        }),
      });
      if (!response.ok) throw new Error();

      await fetchEducationalResources();
      setIsSaveEducationalResourceModalOpen(false);
      toast.success("Recurso guardado en Mis recursos.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el recurso.");
    } finally {
      setIsSavingEducationalResource(false);
    }
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const handleWizardStepClick = (step: number) => {
    if (step > 0 && !selectedRestriction.trim()) {
      toast.error("Selecciona una restricción clínica en Información general para continuar.");
      return;
    }
    goToStep(step);
  };

  const handleWizardNext = () => {
    if (currentStep === 0 && !selectedRestriction.trim()) {
      toast.error("Selecciona una restricción clínica en Información general para continuar.");
      return;
    }
    if (isLastStep) {
      void handleExportPdf();
      return;
    }
    goNext();
  };

  const handleGenerateWithAi = async () => {
    if (aiSelectedCategories.length === 0) {
      toast.error("Selecciona al menos una categoría.");
      return;
    }
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    if (!token) {
      toast.error("No se encontró una sesión activa.");
      return;
    }
    setIsGeneratingAi(true);
    toast.info("Naty está generando las pautas. Puedes seguir editando mientras tanto.");
    try {
      const response = await fetchApi("/pautas/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restriction: selectedRestriction,
          allowedFoods: aiAllowedFoods
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          restrictedFoods: aiRestrictedFoods
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          allowExternalFoods,
          categories: aiSelectedCategories,
          patient: {
            fullName: selectedPatient.fullName || "",
            ageYears: selectedPatient.ageYears ?? undefined,
            weight: selectedPatient.weight ?? undefined,
              height: selectedPatient.height ?? undefined,
              gender: selectedPatient.gender || undefined,
              clinicalSummary: selectedPatient.clinicalSummary || undefined,
              likes: selectedPatient.likes || undefined,
              dislikedFoods: selectedPatient.dislikedFoods || [],
              restrictions: selectedPatient.restrictions || [],
              primaryCondition: selectedPatient.primaryCondition || undefined,
              nutritionalFocus: selectedPatient.nutritionalFocus || undefined,
              fitnessGoals: selectedPatient.fitnessGoals || undefined,
              get: selectedPatient.get ?? undefined,
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "No se pudo generar con IA.");
      }
      const result = await response.json();
      if (result.paragraphs && Array.isArray(result.paragraphs)) {
        const existingCategories = paragraphs.map((p) => p.category).filter(Boolean);
        const newParagraphs = result.paragraphs
          .map(
            (p: {
              category: string;
              categoryOptional?: string;
              portionsPerDay?: string;
              foods?: Array<{ portion: string; food: string }>;
            }) => ({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              category: p.category,
              categoryOptional: p.categoryOptional || "",
              portionsPerDay: p.portionsPerDay || "",
              foods:
                p.foods && p.foods.length > 0
                  ? p.foods.map((f: { portion: string; food: string }) => ({
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      portion: f.portion,
                      food: f.food,
                    }))
                  : [createFoodItem()],
              imagePath: CATEGORY_IMAGE_MAP[p.category] || null,
            }),
          )
          .filter((np: { category: string }) => !existingCategories.includes(np.category));
        if (newParagraphs.length > 0) {
          setParagraphs((prev) => [...prev, ...newParagraphs]);
          toast.success(`Naty generó ${newParagraphs.length} párrafos.`);
        } else {
          toast.warning("Las categorías seleccionadas ya existen en las pautas.");
        }
      } else {
        toast.error("La respuesta de la IA no fue válida.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al generar con IA.");
    } finally {
      setIsGeneratingAi(false);
      setIsAiModalOpen(false);
    }
  };

  const handleFillTableWithAi = async () => {
    const targets = meals
      .filter((meal) => meal.section.trim() && !meal.mealText.trim())
      .map((meal) => ({ mealSection: meal.section, count: 1 }));
    if (targets.length === 0) {
      toast.info("No hay espacios vacíos para rellenar.");
      return;
    }

    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    if (!token) {
      toast.error("No se encontró una sesión activa.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const response = await fetchApi("/recipes/quick-ai-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payload: {
            notes: `Pauta para ${selectedRestriction}.`,
            allowedFoodsMain: [],
            restrictedFoods: avoidFoods.split(",").map((food) => food.trim()).filter(Boolean),
            mealSectionTargets: targets,
            generationMode: "single",
            patient: {
              fullName: selectedPatient.fullName || "",
              ageYears: selectedPatient.ageYears ?? undefined,
              restrictions: [selectedRestriction],
            },
            patientId: selectedPatient.id || undefined,
            existingDishes: meals
              .filter((meal) => meal.section.trim() && meal.mealText.trim())
              .map((meal) => ({ title: meal.mealText, mealSection: meal.section })),
          },
        }),
      });
      if (!response.ok) throw new Error("No se pudo rellenar la tabla.");

      const result = await response.json();
      const dishes = Array.isArray(result?.dishes) ? result.dishes : [];
      setMeals((current) => {
        const remaining = [...dishes];
        return current.map((meal) => {
          if (meal.mealText.trim()) return meal;
          const dishIndex = remaining.findIndex(
            (dish: { mealSection?: string }) =>
              normalizeClinicalText(dish.mealSection || "") === normalizeClinicalText(meal.section),
          );
          if (dishIndex < 0) return meal;
          const [dish] = remaining.splice(dishIndex, 1);
          return { ...meal, mealText: String(dish.title || "").trim() };
        });
      });
      toast.success("Naty rellenó los espacios vacíos de la tabla.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "No se pudo rellenar la tabla.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveToCreations = async () => {
    if (!validateRequiredSections()) return;
    setIsSaving(true);
    try {
      await saveCreation({
        name: `${title.trim() || DEFAULT_TITLE} - ${selectedRestriction}`,
        type: "PAUTAS",
        content: {
          title,
          selectedRestriction,
          paragraphs,
          pautaEditorMode,
          meals,
          avoidFoods,
          educationalContent,
          educationalMode,
          manualPatientData: isManualPatientExpanded ? manualPatientData : null,
          updatedAt: new Date().toISOString(),
        },
        metadata: {
          ...(creationDescription.trim() ? { description: creationDescription.trim() } : {}),
          ...(selectedPatient.fullName
            ? { patientId: selectedPatient.id, patientName: selectedPatient.fullName }
            : {}),
          restriction: selectedRestriction,
          paragraphCount: validParagraphs.length,
        },
        tags: ["pautas", selectedRestriction.toLowerCase().replace(/\s+/g, "_")],
      });
      toast.success("Pautas guardadas.");
      const serialized = getCurrentStateString();
      setLastSavedState(serialized);
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetPauta = () => {
    setTitle("");
    setSelectedRestriction("");
    setSelectedPatient(createEmptyPatient());
    setIsManualPatientExpanded(false);
    setManualPatientData({ ageYears: "", weight: "", height: "" });
    setParagraphs([createParagraph()]);
    setPautaEditorMode("paragraphs");
    setMeals([createPautaMeal("Desayuno"), createPautaMeal("Almuerzo"), createPautaMeal("Cena")]);
    setAvoidFoods("");
    setEducationalContent("");
    setEducationalMode("auto");
    setResourceSearch("");
    setResourceSource("system");
    setLastSavedState(null);
    setCurrentStep(0);
    localStorage.removeItem("nutri_pauta_alimentacion_draft");
    toast.success("Pautas reiniciadas.");
  };

  const buildPautaPromptPayload = () => ({
    restriction: selectedRestriction,
    allowedFoods: aiAllowedFoods.split(",").map((item) => item.trim()).filter(Boolean),
    restrictedFoods: aiRestrictedFoods.split(",").map((item) => item.trim()).filter(Boolean),
    categories: aiSelectedCategories,
    allowExternalFoods,
    patient: {
      fullName: selectedPatient.fullName || "",
      ageYears: selectedPatient.ageYears ?? undefined,
      weight: selectedPatient.weight ?? undefined,
      height: selectedPatient.height ?? undefined,
    },
  });

  // Elementos de la barra de navegación flotante ActionDock
  const actionItems: ActionDockItem[] = [
      {
        id: "patient",
        icon: isLoadingPatients ? Loader2 : User,
        label: isLoadingPatients
          ? "Cargando..."
          : selectedPatient.fullName?.trim()
            ? selectedPatient.fullName
            : "Importar paciente",
        description: selectedPatient.fullName?.trim() ? "Cambiar paciente" : "Importar paciente",
        variant: selectedPatient.fullName?.trim() ? "emerald" : "slate",
        disabled: isLoadingPatients,
        onClick: async () => {
          await openPatientModal();
        },
      },
      {
        id: "import",
        icon: Filter,
        label: "Importar creación",
        variant: "indigo",
        onClick: () => setIsImportCreationModalOpen(true),
      },
      {
        id: "ai-nutri",
        icon: Sparkles,
        label: "Generar con Naty",
        variant: "emerald",
        onClick: () => setIsAiModalOpen(true),
      },
      {
        id: "pdf",
        icon: isExportingPdf ? Loader2 : Download,
        label: "Descargar PDF",
        description: isExportingPdf
          ? "Generando PDF..."
          : missingRequirements.length > 0
            ? "Completa los pendientes para descargar el PDF"
            : "Descargar PDF",
        variant: "indigo",
        disabled: isExportingPdf || missingRequirements.length > 0,
        onClick: async () => {
          if (isExportingPdf || missingRequirements.length > 0) return;
          await handleExportPdf();
        },
      },
      {
        id: "save",
        icon: Save,
        label: "Guardar",
        description: getSaveTooltipMessage() || "Guardar",
        variant: "slate",
        disabled: missingRequirements.length > 0 || !hasChanges,
        onClick: () => {
          if (missingRequirements.length > 0 || !hasChanges) return;
          setIsSaveCreationModalOpen(true);
        },
      },
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar",
        variant: "rose",
        onClick: resetPauta,
      },
    ];

  return (
    <>
      {isGeneratingAi && (
        <NatyLoadingOverlay
          title="Naty está preparando..."
          subtitle={pautaEditorMode === "table" ? "Rellenando la tabla de comidas" : "Generando los párrafos de pautas alimenticias"}
        />
      )}

      <ModuleLayout
        title="Pautas de Alimentación"
        description="Crea guías alimenticias para restricciones clínicas en una sola hoja bien distribuida."
        className="max-w-[68rem]"
        rightNavItems={actionItems}
        rightContent={
          <PromptPreviewButton
            moduleName="Pautas de Alimentación"
            endpoint="/pautas/ai-generate"
            buildPayload={buildPautaPromptPayload}
            expectedOutput="JSON con paragraphs, cada uno con categoría, alternativa, porciones y alimentos con porción."
          />
        }
      >
        <WorkflowContextBanner
          projectName={currentProjectName}
          patientName={selectedPatient?.fullName || null}
          mode={currentProjectMode}
          moduleLabel="Pautas"
        />

        <div className="mt-6 xl:px-4 space-y-6">
          {/* Acordeón 1: Información General */}
          <details className="group rounded-2xl border border-slate-200 bg-white [&[open]]:pb-6" open>
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 select-none">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Información general
              </p>
              <ChevronDown className="ml-auto h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título</p>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
                    placeholder={DEFAULT_TITLE}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Restricción clínica
                  </p>
                  {selectedRestriction ? (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 h-11">
                      <span className="flex-1 text-sm font-semibold text-emerald-900">
                        {selectedRestriction}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRestriction("");
                          setRestrictionSearch("");
                        }}
                        className="rounded-full p-1 text-emerald-600 hover:bg-emerald-100 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={restrictionSearch}
                          onChange={(e) => setRestrictionSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            const nextRestriction = restrictionSearch.trim();
                            if (!nextRestriction) return;
                            e.preventDefault();
                            setSelectedRestriction(nextRestriction);
                            setRestrictionSearch("");
                          }}
                          placeholder="Buscar o escribir una restricción"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Selecciona una sugerencia o presiona Enter para usar una restricción personalizada.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {restrictionSearch.trim() &&
                          !allRestrictions.some(
                            (r) => r.toLowerCase() === restrictionSearch.trim().toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRestriction(restrictionSearch.trim());
                                setRestrictionSearch("");
                              }}
                              className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-200"
                            >
                              Usar "{restrictionSearch.trim()}"
                            </button>
                          )}
                        {filteredRestrictions.slice(0, 6).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setSelectedRestriction(r);
                              setRestrictionSearch("");
                            }}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </details>

          {/* Acordeón 2: Paciente */}
          <details
            className="group rounded-2xl border border-slate-200 bg-white [&[open]]:pb-6"
            open={(!selectedPatient.fullName?.trim() || isManualPatientExpanded) ? true : undefined}
          >
            {!selectedPatient.fullName?.trim() || isManualPatientExpanded ? (
              <summary
                className="flex select-none px-6 py-6 pointer-events-none"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <div
                  className="flex w-full flex-col items-center gap-5 text-center pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="max-w-2xl">
                    <p className="text-sm font-bold leading-6 text-amber-900">Puedes crear tu pauta sin paciente o importar uno para personalizar mejor la atención.</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Si importas un paciente, Naty considerará sus restricciones, objetivos y contexto clínico. El PDF sigue requiriendo un paciente vinculado.</p>
                  </div>
                  <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void openPatientModal()}
                      disabled={isLoadingPatients}
                      className="h-10 min-w-48 justify-center rounded-xl border-emerald-200 bg-white px-4 text-sm text-emerald-700 font-semibold hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                    >
                      {isLoadingPatients ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
                      ) : (
                        <User className="mr-2 h-4 w-4" />
                      )}
                      Importar paciente
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedPatient(createEmptyPatient());
                        setIsManualPatientExpanded(true);
                      }}
                      disabled={isLoadingPatients}
                      className="h-10 min-w-48 justify-center rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Rellenar manualmente
                    </Button>
                  </div>
                </div>
              </summary>
            ) : (
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4 select-none">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full mr-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">PACIENTE</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                      <User className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-900">{selectedPatient.fullName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        void openPatientModal();
                      }}
                      disabled={isLoadingPatients}
                      className="h-9 rounded-xl border-emerald-200 bg-white px-3 text-sm text-emerald-700 font-semibold hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                    >
                      {isLoadingPatients ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
                      ) : null}
                      Cambiar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelectedPatient();
                      }}
                      disabled={isLoadingPatients}
                      className="h-9 rounded-xl border-rose-200 bg-white px-3 text-sm text-rose-700 font-semibold hover:bg-rose-50 hover:border-rose-300 transition-all"
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
              </summary>
            )}

            <div className="px-6 mt-4 space-y-4">
              {selectedPatient.fullName?.trim() && !isManualPatientExpanded && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Nombre</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.fullName}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Edad</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedPatient.ageYears ? `${selectedPatient.ageYears} años` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Peso</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedPatient.weight ? `${selectedPatient.weight} kg` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Altura</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedPatient.height ? `${selectedPatient.height} cm` : "—"}
                      </p>
                    </div>
                    {calculatedBmi !== null && (
                      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                        <p className="text-[10px] font-black uppercase text-slate-400">IMC</p>
                        <p className="text-sm font-bold text-emerald-800">{calculatedBmi}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isManualPatientExpanded && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre</p>
                      <Input
                        value={selectedPatient.fullName}
                        onChange={(e) => setSelectedPatient((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Nombre y apellido"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edad</p>
                      <Input
                        type="number"
                        min={0}
                        value={manualPatientData.ageYears}
                        onChange={(e) => setManualPatientData((d) => ({ ...d, ageYears: e.target.value }))}
                        placeholder="Ej: 42"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Peso (kg)</p>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={manualPatientData.weight}
                        onChange={(e) => setManualPatientData((d) => ({ ...d, weight: e.target.value }))}
                        placeholder="Ej: 70"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Talla (cm)</p>
                      <Input
                        type="number"
                        min={0}
                        value={manualPatientData.height}
                        onChange={(e) => setManualPatientData((d) => ({ ...d, height: e.target.value }))}
                        placeholder="Ej: 170"
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualPatientExpanded(false);
                        setSelectedPatient(createEmptyPatient());
                      }}
                      className="text-xs font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
                    >
                      Importar paciente
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectedPatient}
                      className="text-xs font-semibold text-rose-600 underline decoration-rose-300 underline-offset-4 hover:text-rose-700"
                    >
                      Quitar
                    </button>
                  </div>
                  {calculatedBmi !== null && (
                    <div className="mt-4 inline-block rounded-lg bg-emerald-50 px-4 py-2">
                      <span className="text-sm font-semibold text-emerald-700">IMC:</span>{" "}
                      <span className="text-base font-bold text-emerald-800">{calculatedBmi}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="mt-10 space-y-8 xl:px-4">
          <PlanWizardShell
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleWizardStepClick}
            onBack={goBack}
            onNext={handleWizardNext}
            isLastStep={isLastStep}
            onReset={resetPauta}
          >
            {currentStep === 0 && !selectedRestriction.trim() && (
              <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 shadow-sm">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Sin restricción clínica</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-400">
                      Selecciona una restricción en Información general para habilitar el recurso educativo.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {currentStep === 0 && selectedRestriction.trim() && (
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                      <FileText className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recurso educativo</h2>
                      <p className="mt-0.5 text-xs text-slate-400">Se adjunta al PDF de la pauta</p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setEducationalMode("auto")}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                        educationalMode === "auto"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      Automático
                    </button>
                    <button
                      type="button"
                      onClick={() => setEducationalMode("import")}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                        educationalMode === "import"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      Importar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEducationalMode("manual")}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                        educationalMode === "manual"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  {educationalMode === "manual" ? (
                    <div className="space-y-3">
                      <textarea
                        value={educationalContent}
                        onChange={(e) => setEducationalContent(e.target.value)}
                        placeholder="Escribe la información educativa..."
                        className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 placeholder:text-slate-400"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={openSaveEducationalResourceModal}
                        disabled={!educationalContent.trim()}
                        className="h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Guardar recurso
                      </Button>
                    </div>
                  ) : educationalMode === "import" ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setResourceSource("system")}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                            resourceSource === "system"
                              ? "bg-white text-emerald-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-700",
                          )}
                        >
                          Sistema
                        </button>
                        <button
                          type="button"
                          onClick={() => setResourceSource("mine")}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                            resourceSource === "mine"
                              ? "bg-white text-emerald-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-700",
                          )}
                        >
                          Mis recursos
                        </button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                          placeholder="Buscar recurso educativo..."
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200">
                        {filteredEducationalResources.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-slate-400">
                            {restrictionResources.length === 0
                              ? "Cargando recursos..."
                              : "Sin resultados."}
                          </p>
                        ) : (
                          filteredEducationalResources.map((resource) => (
                            <button
                              key={resource.id}
                              type="button"
                              onClick={() => {
                                setEducationalContent(resource.content || "");
                                setEducationalMode("manual");
                                setResourceSearch("");
                              }}
                              className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 transition-colors"
                            >
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700">
                                  {resource.title}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {resource.tags?.slice(0, 2).join(" · ") || "Restricciones alimenticias"}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                          {hasAutoMatch && autoEducationalContent ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {hasAutoMatch && autoEducationalContent
                              ? "Recurso encontrado"
                              : "Sin recurso automático"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {hasAutoMatch && autoEducationalContent
                              ? "El contenido se incluirá automáticamente en el PDF."
                              : "Cambia a modo manual para redactar el contenido educativo."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {currentStep === 1 && (
              <section className="relative rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                {!selectedRestriction.trim() && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/90 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700">
                        Selecciona una restricción clínica
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-slate-500">
                        Para crear los párrafos de pautas, primero debes seleccionar una restricción
                        clínica en la sección de Información general.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Pauta alimentaria <span className="text-rose-600">*</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Elige la forma de presentar las recomendaciones para esta restricción clínica.
                      </p>
                    </div>
                    <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setPautaEditorMode("paragraphs")}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                          pautaEditorMode === "paragraphs"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Párrafos de pauta
                      </button>
                      <button
                        type="button"
                        onClick={() => setPautaEditorMode("table")}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                          pautaEditorMode === "table"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Tabla de comidas
                      </button>
                    </div>
                  </div>
                  {pautaEditorMode === "paragraphs" && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Define categorías, porciones, alimentos e imagen para cada bloque.
                      </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={addParagraph}
                        disabled={!selectedRestriction.trim()}
                        className="h-10 rounded-2xl border-slate-200"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAiModalOpen(true)}
                        disabled={!selectedRestriction.trim()}
                        title={
                          !selectedRestriction.trim()
                            ? "Selecciona una restricción clínica primero"
                            : "Generar párrafos con Naty"
                        }
                        className="h-10 rounded-xl border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar con Naty
                      </Button>
                    </div>
                  </div>
                  )}
                  {pautaEditorMode === "paragraphs" && (
                  <div className="space-y-6">
                    {paragraphs.map((paragraph) => (
                      <div
                        key={paragraph.id}
                        className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6"
                      >
                        {paragraphs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeParagraph(paragraph.id)}
                            disabled={!selectedRestriction.trim()}
                            className="absolute right-4 top-4 rounded-full p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Categoría 1 <span className="text-rose-600">*</span>
                            </p>
                            <div className="relative category-dropdown">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                value={paragraph.category}
                                onChange={(e) => {
                                  updateParagraph(paragraph.id, "category", e.target.value);
                                  setShowCategoryDropdown(`${paragraph.id}-1`);
                                  setCategorySearch(e.target.value);
                                }}
                                onFocus={() => setShowCategoryDropdown(`${paragraph.id}-1`)}
                                placeholder="Buscar..."
                                disabled={!selectedRestriction.trim()}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              {showCategoryDropdown === `${paragraph.id}-1` && (
                                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg category-dropdown">
                                  {filteredCategories
                                    .filter(
                                      (c) =>
                                        !usedCategories.includes(c) ||
                                        c === paragraph.category ||
                                        c === paragraph.categoryOptional,
                                    )
                                    .map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                          updateParagraph(paragraph.id, "category", c);
                                          setShowCategoryDropdown(null);
                                        }}
                                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                                      >
                                        {c}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Categoría 2
                            </p>
                            <div className="relative category-dropdown">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                value={paragraph.categoryOptional}
                                onChange={(e) => {
                                  updateParagraph(paragraph.id, "categoryOptional", e.target.value);
                                  setShowCategoryDropdown(`${paragraph.id}-2`);
                                  setCategorySearch(e.target.value);
                                }}
                                onFocus={() => setShowCategoryDropdown(`${paragraph.id}-2`)}
                                placeholder="Buscar..."
                                disabled={!selectedRestriction.trim()}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              {showCategoryDropdown === `${paragraph.id}-2` && (
                                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg category-dropdown">
                                  {filteredCategories
                                    .filter(
                                      (c) =>
                                        !usedCategories.includes(c) ||
                                        c === paragraph.categoryOptional ||
                                        c === paragraph.category,
                                    )
                                    .map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                          updateParagraph(paragraph.id, "categoryOptional", c);
                                          setShowCategoryDropdown(null);
                                        }}
                                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                                      >
                                        {c}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Porciones al día
                            </p>
                            <Input
                              value={paragraph.portionsPerDay}
                              onChange={(e) => updateParagraph(paragraph.id, "portionsPerDay", e.target.value)}
                              placeholder="Ej: 2 porciones al día"
                              disabled={!selectedRestriction.trim()}
                              className="h-11 rounded-xl border-slate-200"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Alimentos
                            </p>
                            {paragraph.foods.map((food) => (
                              <div key={food.id} className="flex gap-2">
                                <Input
                                  value={food.portion}
                                  onChange={(e) => updateFoodItem(paragraph.id, food.id, "portion", e.target.value)}
                                  placeholder="Porción"
                                  disabled={!selectedRestriction.trim()}
                                  className="h-10 flex-1 rounded-lg border-slate-200"
                                />
                                <Input
                                  value={food.food}
                                  onChange={(e) => updateFoodItem(paragraph.id, food.id, "food", e.target.value)}
                                  placeholder="Alimento"
                                  disabled={!selectedRestriction.trim()}
                                  className="h-10 flex-[2] rounded-lg border-slate-200"
                                />
                                {paragraph.foods.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFoodItem(paragraph.id, food.id)}
                                    disabled={!selectedRestriction.trim()}
                                    className="rounded-full p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addFoodItem(paragraph.id)}
                              disabled={!selectedRestriction.trim()}
                              className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-slate-400"
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Agregar alimento
                            </Button>
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => selectedRestriction.trim() && openImageSelector(paragraph.id)}
                            onKeyDown={(event) => {
                              if (selectedRestriction.trim() && (event.key === "Enter" || event.key === " ")) {
                                event.preventDefault();
                                openImageSelector(paragraph.id);
                              }
                            }}
                            aria-disabled={!selectedRestriction.trim()}
                            className={cn(
                              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-2 py-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50",
                              !selectedRestriction.trim() && "cursor-not-allowed opacity-50",
                            )}
                          >
                            {paragraph.imagePath ? (
                              <div className="relative w-full">
                                <Image
                                  src={paragraph.imagePath}
                                  alt="Imagen de categoría"
                                  width={160}
                                  height={160}
                                  className="mx-auto h-20 w-auto rounded-lg object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateParagraphImage(paragraph.id, null);
                                  }}
                                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex h-20 w-full items-center justify-center">
                                <div className="text-center">
                                  <ChefHat className="mx-auto h-8 w-8 text-slate-300" />
                                  <p className="mt-1 text-xs text-slate-400">Seleccionar</p>
                                </div>
                              </div>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">
                              Click para {paragraph.imagePath ? "cambiar" : "agregar"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}

                  {pautaEditorMode === "table" && (
                    <div className="space-y-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-xl font-black text-slate-900">
                            Tabla de comidas <span className="text-rose-600">*</span>
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Completa categoría, alimentos, hora y porción para cada tiempo de comida.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-2xl border-purple-200 bg-purple-50 px-4 font-semibold text-purple-700 hover:border-purple-300 hover:bg-purple-100"
                          onClick={handleFillTableWithAi}
                          disabled={!selectedRestriction.trim()}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Rellenar con IA
                        </Button>
                      </div>

                      <div className="overflow-x-auto rounded-3xl border border-slate-200">
                        <table className="w-full min-w-[860px] bg-white">
                          <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Categoría</th>
                              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Alimentos</th>
                              <th className="w-36 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Hora</th>
                              <th className="w-44 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Porciones</th>
                              <th className="w-20 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meals.map((meal) => (
                              <tr key={meal.id} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-4 py-3 align-top">
                                  <select
                                    value={meal.section}
                                    onChange={(e) => updateMeal(meal.id, "section", e.target.value)}
                                    disabled={!selectedRestriction.trim()}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
                                  >
                                    <option value="">Seleccionar</option>
                                    {PAUTA_MEAL_SECTIONS.map((section) => (
                                      <option key={section} value={section}>{section}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <Input
                                    value={meal.mealText}
                                    onChange={(e) => updateMeal(meal.id, "mealText", e.target.value)}
                                    placeholder="Nombre del plato o preparación"
                                    disabled={!selectedRestriction.trim()}
                                    className="h-11 rounded-2xl border-slate-200 bg-white"
                                  />
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <Input
                                    value={meal.time}
                                    onChange={(e) => updateMeal(meal.id, "time", e.target.value)}
                                    placeholder="07:30"
                                    disabled={!selectedRestriction.trim()}
                                    className="h-11 rounded-2xl border-slate-200 bg-white"
                                  />
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <Input
                                    value={meal.portion}
                                    onChange={(e) => updateMeal(meal.id, "portion", e.target.value)}
                                    placeholder="2 porciones"
                                    disabled={!selectedRestriction.trim()}
                                    className="h-11 rounded-2xl border-slate-200 bg-white"
                                  />
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <button
                                    type="button"
                                    onClick={() => removeMeal(meal.id)}
                                    disabled={!selectedRestriction.trim() || meals.length === 1}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                                  disabled={!selectedRestriction.trim()}
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Plus className="h-4 w-4" />
                                  Agregar fila
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Alimentos a evitar
                        </label>
                        <Input
                          value={avoidFoods}
                          onChange={(e) => setAvoidFoods(e.target.value)}
                          placeholder="Ej: bebidas azucaradas, frituras, alcohol..."
                          disabled={!selectedRestriction.trim()}
                          className="h-11 rounded-xl border-slate-200"
                        />
                        <p className="text-xs text-slate-400">Separa varios alimentos con comas.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Resumen de la pauta</h2>
                  <p className="mt-1 text-sm text-slate-500">Revisa que todo esté listo antes de exportar.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Restricción clínica</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedRestriction || "Sin restricción seleccionada"}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Paciente</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPatient.fullName?.trim() || "Sin paciente asignado"}</p>
                    {selectedPatient.fullName?.trim() && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[
                          selectedPatient.ageYears && `${selectedPatient.ageYears} años`,
                          selectedPatient.weight && `${selectedPatient.weight} kg`,
                        ].filter(Boolean).join(" · ") || "Sin datos adicionales"}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                      {pautaEditorMode === "paragraphs" ? "Párrafos" : "Comidas"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {pautaEditorMode === "paragraphs"
                        ? `${validParagraphs.length} configurados`
                        : `${validMeals.length} configuradas`}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {pautaEditorMode === "paragraphs" ? `${paragraphs.length} en total` : `${meals.length} en total`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Recurso educativo</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {educationalMode === "auto"
                        ? hasAutoMatch && autoEducationalContent
                          ? "Automático vinculado"
                          : "Sin recurso automático"
                        : educationalContent.trim()
                          ? "Contenido redactado"
                          : "Sin contenido"}
                    </p>
                  </div>
                </div>

                {missingRequirements.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <p className="text-xs font-black text-rose-700 uppercase">Pendiente</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-rose-600">
                        {missingRequirements.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf || missingRequirements.length > 0}
                    title={missingRequirements.length > 0 ? "Completa los pendientes para descargar el PDF" : undefined}
                    className="h-11 rounded-2xl bg-emerald-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isExportingPdf ? "Generando..." : "Descargar PDF"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSaveCreationModalOpen(true)}
                    disabled={missingRequirements.length > 0 || !hasChanges}
                    title={getSaveTooltipMessage()}
                    className="h-11 rounded-2xl border-slate-200 font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Guardar
                  </Button>
                </div>
              </section>
            )}
          </PlanWizardShell>
        </div>
      </ModuleLayout>

      {/* Modales */}
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} className="max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Seleccionar paciente</h3>
          <div className="mb-4">
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="rounded-xl"
            />
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">No se encontraron pacientes.</p>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelectPatient(patient)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{patient.fullName}</p>
                    {patient.email && <p className="text-xs text-slate-500">{patient.email}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        onConfirm={handleSaveToCreations}
        isSaving={isSaving}
      />

      <Modal
        isOpen={isSaveEducationalResourceModalOpen}
        onClose={() => setIsSaveEducationalResourceModalOpen(false)}
        title="Guardar recurso reutilizable"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Se guardará en <span className="font-semibold text-slate-700">Restricciones alimenticias</span> para reutilizarlo cuando lo necesites.
          </p>
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-600">Título <span className="text-rose-600">*</span></label>
            <Input
              value={educationalResourceTitle}
              onChange={(e) => setEducationalResourceTitle(e.target.value)}
              placeholder="Ej: Recomendaciones para diabetes"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-600">Hashtags <span className="text-slate-400 font-normal normal-case">(opcional)</span></label>
            <TagInput
              value={educationalResourceTags}
              onChange={setEducationalResourceTags}
               suggestions={restrictions.map((tag) => tag.name)}
               helperText="Selecciona una sugerencia o presiona Enter para usar uno personalizado."
               placeholder="Ej: diabetes, glicemia"
            />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-600">Fuente <span className="text-slate-400 font-normal normal-case">(opcional)</span></label>
            <Input
              value={educationalResourceSource}
              onChange={(e) => setEducationalResourceSource(e.target.value)}
              placeholder="Ej: Guía clínica o fuente bibliográfica"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setIsSaveEducationalResourceModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEducationalResource}
              disabled={isSavingEducationalResource || !educationalResourceTitle.trim()}
              className="rounded-xl"
            >
              {isSavingEducationalResource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar recurso
            </Button>
          </div>
        </div>
      </Modal>

      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={applyImportedCreation}
        allowedTypes={["PAUTAS"]}
      />

      {/* Modal Generar con Naty */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} className="max-w-2xl">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Generar con Naty</h3>
                <p className="text-sm text-slate-500">Rellena los párrafos automáticamente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className="rounded-full p-2 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-sm font-medium text-amber-900">Restricción clínica actual:</p>
              <p className="mt-1 font-semibold text-amber-800">
                {selectedRestriction || "No seleccionada"}
              </p>
            </div>

            {selectedPatient.fullName && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Datos del paciente:</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPatient.fullName}
                  {selectedPatient.ageYears && ` • ${selectedPatient.ageYears} años`}
                  {selectedPatient.weight && ` • ${selectedPatient.weight} kg`}
                  {selectedPatient.height && ` • ${selectedPatient.height} cm`}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Categorías a generar *</label>
                <p className="text-xs text-slate-400 mb-2">
                  Selecciona las categorías que deseas añadir (se excluirán las ya configuradas)
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {exchangeCategories
                    .filter((cat) => !paragraphs.some((p) => p.category === cat || p.categoryOptional === cat))
                    .map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={aiSelectedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiSelectedCategories((prev) => [...prev, category]);
                            } else {
                              setAiSelectedCategories((prev) => prev.filter((c) => c !== category));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{category}</span>
                      </label>
                    ))}
                  {exchangeCategories.filter(
                    (cat) => !paragraphs.some((p) => p.category === cat || p.categoryOptional === cat),
                  ).length === 0 && (
                    <p className="col-span-2 text-center text-sm text-slate-500 py-4">
                      Todas las categorías ya están utilizadas
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Alimentos permitidos</label>
                <Input
                  value={aiAllowedFoods}
                  onChange={(e) => setAiAllowedFoods(e.target.value)}
                  placeholder="Ej: pollo, arroz integral, palta..."
                  className="mt-1 rounded-xl"
                />
                <p className="mt-1 text-xs text-slate-400">Separados por coma</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Alimentos no permitidos</label>
                <Input
                  value={aiRestrictedFoods}
                  onChange={(e) => setAiRestrictedFoods(e.target.value)}
                  placeholder="Ej: azúcar de mesa, frituras..."
                  className="mt-1 rounded-xl"
                />
                <p className="mt-1 text-xs text-slate-400">Separados por coma</p>
              </div>
              <label className="col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={allowExternalFoods}
                  onChange={(event) => setAllowExternalFoods(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  <span className="font-bold">Permitir alimentos fuera de la lista</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Los condimentos básicos podrán marcarse como opcionales.</span>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <NatyButton
              onClick={handleGenerateWithAi}
              isLoading={isGeneratingAi}
              disabled={aiSelectedCategories.length === 0}
              label="Generar con Naty"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Imagen */}
      <Modal
        isOpen={isImageSelectorOpen}
        onClose={() => setIsImageSelectorOpen(false)}
        className="max-w-3xl"
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Seleccionar imagen</h3>
              <p className="text-sm text-slate-500">Selecciona una imagen ilustrativa para este párrafo</p>
            </div>
            <button
              type="button"
              onClick={() => setIsImageSelectorOpen(false)}
              className="rounded-full p-2 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 max-h-96 overflow-y-auto pr-1">
            {(() => {
              const uniqueImages = Array.from(new Set(Object.values(CATEGORY_IMAGE_MAP)));
              return uniqueImages.map((imagePath, idx) => {
                const isSelected =
                  paragraphs.find((p) => p.id === selectedParagraphId)?.imagePath === imagePath;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      selectedParagraphId && updateParagraphImage(selectedParagraphId, imagePath)
                    }
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-200"
                        : "border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 hover:scale-[1.02]",
                    )}
                  >
                    <Image
                      src={imagePath}
                      alt={`Imagen ${idx + 1}`}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30 backdrop-blur-sm">
                        <Check className="h-8 w-8 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              });
            })()}
          </div>

          <div className="mt-6 flex justify-between border-t border-slate-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedParagraphId) updateParagraphImage(selectedParagraphId, null);
              }}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
            >
              <X className="mr-2 h-4 w-4" />
              Quitar imagen
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImageSelectorOpen(false)}
              className="rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
