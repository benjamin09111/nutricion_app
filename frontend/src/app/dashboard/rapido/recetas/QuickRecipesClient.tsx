"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateBMI,
  calculateGET,
  calculateAge,
  type ActivityLevel as NutritionActivityLevel,
} from "@/lib/nutrition-formulas";
import {
  ChefHat,
  Download,
  FileText,
  Library,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Save,
  Sparkles,
  Trash2,
  User,
  X,
  Apple,
  Pencil,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TagInput } from "@/components/ui/TagInput";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { useSubscription } from "@/context/SubscriptionContext";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleUsageBadges } from "@/components/shared/ModuleUsageBadges";
import { NatyLoadingOverlay, PlanWizardShell } from "@/components/plans";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { fetchCreation, saveCreation } from "@/lib/workflow";
import { getAuthToken } from "@/lib/auth-token";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { FeatureGate } from "@/components/memberships/FeatureGate";
import { cn } from "@/lib/utils";
import { FoodReferenceBook } from "@/components/foods/FoodReferenceBook";
import { getTodayDateInputValue } from "@/features/patients/utils/patient-helpers";

type QuickIngredient = {
  id: string;
  name: string;
  quantity: string;
  amount?: string;
  unit?: string;
};

type QuickDish = {
  id: string;
  title: string;
  mealSection: string;
  description: string;
  preparation: string;
  imageUrl?: string;
  recommendedPortion: string;
  portions: string;
  protein: string;
  calories: string;
  carbs: string;
  fats: string;
  ingredients: QuickIngredient[];
};

type QuickPatient = {
  id?: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentId?: string | null;
  dietRestrictions?: string[];
  dislikedFoods?: string[];
  likes?: string;
  tags?: string[];
  clinicalSummary?: string;
  weight?: number;
  height?: number;
  ageYears?: number | null;
  gender?: string;
  birthDate?: string;
  nutritionalFocus?: string;
  fitnessGoals?: string;
};

type QuickNutritionalTargets = {
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFats?: number;
  tmb?: number;
  get?: number;
  activityLevel?: string;
  bmi?: number;
  bmiClassification?: string;
  ageYears?: number;
};

type ImportedCreation = {
  id: string;
  name: string;
  type: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type QuickAiDishResponse = {
  title?: string;
  mealSection?: string;
  description?: string;
  preparation?: string;
  imageUrl?: string;
  recommendedPortion?: string;
  portions?: number | string;
  protein?: number | string;
  calories?: number | string;
  carbs?: number | string;
  fats?: number | string;
  ingredients?: Array<
    | string
    | {
      name?: string;
      quantity?: string;
      amount?: number | string;
      unit?: string;
    }
  >;
};

const MEAL_SECTIONS = [
  "Desayuno",
  "Colación AM",
  "Almuerzo",
  "Colación PM",
  "Once",
  "Cena",
  "Post entreno",
];

const DEFAULT_TITLE = "Entregable rápido";
const DEFAULT_DIET_NAME = "Plan nutricional personalizado";
const DRAFT_KEY = "nutri_quick_recipes_draft";
const WIZARD_STEPS = ["Información general", "Instrucciones", "Generación", "Platos", "Resumen"];
const DISHES_PER_CATEGORY_PAGE = 4;
const WEEKLY_CORE_SECTIONS = ["Desayuno", "Almuerzo", "Once", "Cena"];
const DEFAULT_DISH_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#fde68a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="48" fill="url(#bg)"/>
      <circle cx="400" cy="260" r="128" fill="#ffffff" opacity="0.95"/>
      <circle cx="400" cy="260" r="84" fill="#f8fafc"/>
      <path d="M318 208c0-22 18-40 40-40 8 0 15 2 21 6 11-22 33-36 58-36 31 0 57 21 64 50 4-1 8-2 13-2 22 0 40 18 40 40v14H318v-32z" fill="#d97706"/>
      <rect x="340" y="240" width="120" height="72" rx="24" fill="#f59e0b"/>
      <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#92400e">Plato NutriNet</text>
    </svg>
  `);

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createEmptyQuickPatient = (): QuickPatient => ({
  fullName: "",
  ageYears: null,
  gender: "",
  weight: undefined,
  height: undefined,
  nutritionalFocus: "",
  fitnessGoals: "",
  dietRestrictions: [],
  likes: "",
  clinicalSummary: "",
});

const createIngredient = (): QuickIngredient => ({
  id: createId(),
  name: "",
  quantity: "",
});

const createDish = (): QuickDish => ({
  id: createId(),
  title: "",
  mealSection: "Almuerzo",
  description: "",
  preparation: "",
  imageUrl: "",
  recommendedPortion: "",
  portions: "1",
  protein: "",
  calories: "",
  carbs: "",
  fats: "",
  ingredients: [createIngredient()],
});

const parseLines = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const isDishMeaningful = (dish: QuickDish): boolean =>
  Boolean(
    dish.title.trim() ||
    dish.description.trim() ||
    dish.preparation.trim() ||
    dish.recommendedPortion.trim() ||
    dish.ingredients.some((ingredient) => ingredient.name.trim() || ingredient.quantity.trim()),
  );
const normalizeMealSectionKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

type MealGenerationTarget = {
  mealSection: string;
  enabled: boolean;
  count: number;
};

type QuickAiMealTargetPayload = {
  mealSection: string;
  count: number;
};

const QUICK_AI_MAX_DISHES_PER_BATCH = 4;
const QUICK_AI_MAX_SECTIONS_PER_BATCH = 2;

const buildQuickAiTargetBatches = (
  targets: QuickAiMealTargetPayload[],
): QuickAiMealTargetPayload[][] => {
  const expanded = targets.flatMap((target) =>
    Array.from({ length: Math.max(1, target.count) }, () => target.mealSection),
  );
  const batches: QuickAiMealTargetPayload[][] = [];
  let current = new Map<string, number>();

  const flushCurrent = () => {
    if (current.size === 0) return;
    batches.push(
      Array.from(current.entries()).map(([mealSection, count]) => ({
        mealSection,
        count,
      })),
    );
    current = new Map<string, number>();
  };

  for (const mealSection of expanded) {
    const currentDishCount = Array.from(current.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const currentSectionCount = current.size;
    const wouldAddNewSection = !current.has(mealSection);

    if (
      currentDishCount >= QUICK_AI_MAX_DISHES_PER_BATCH ||
      (wouldAddNewSection &&
        currentSectionCount >= QUICK_AI_MAX_SECTIONS_PER_BATCH)
    ) {
      flushCurrent();
    }

    current.set(mealSection, (current.get(mealSection) || 0) + 1);
  }

  flushCurrent();
  return batches;
};

const createDefaultGenerationTargets = (): MealGenerationTarget[] =>
  MEAL_SECTIONS.map((mealSection) => ({
    mealSection,
    enabled: WEEKLY_CORE_SECTIONS.includes(mealSection),
    count: WEEKLY_CORE_SECTIONS.includes(mealSection) ? 2 : 1,
  }));

const toTextAreaValue = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .join("\n");
};

const toTextAreaValueFromFoods = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const raw = item as Record<string, unknown>;
      if (typeof raw.producto === "string" && raw.producto.trim()) return raw.producto.trim();
      if (typeof raw.name === "string" && raw.name.trim()) return raw.name.trim();
      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const normalizeQuickPatientGender = (gender?: string): "Masculino" | "Femenino" | "Otro" => {
  if (gender === "Masculino" || gender === "Femenino" || gender === "Otro") {
    return gender;
  }

  return "Otro";
};

const buildQuickNutritionalTargets = (
  patient: QuickPatient | null,
): QuickNutritionalTargets | null => {
  if (!patient) return null;

  const weight = Number(patient.weight) || 0;
  const height = Number(patient.height) || 0;
  if (weight <= 0 || height <= 0) return null;

  const gender = normalizeQuickPatientGender(patient.gender);
  const ageYears = calculateAge(patient.birthDate) ?? patient.ageYears ?? 30;
  const activityLevel = "moderado" as NutritionActivityLevel;
  const get = calculateGET(
    gender,
    weight,
    height,
    ageYears,
    activityLevel,
    ageYears < 18 ? "oms-fao" : "mifflin-st-jeor",
  );
  if (!get) return null;

    const bmi = calculateBMI(weight, height, { gender, ageYears, birthDate: patient.birthDate });

  return {
    dailyCalories: Math.round(get.macros.calories),
    dailyProtein: Math.round(get.macros.protein),
    dailyCarbs: Math.round(get.macros.carbs),
    dailyFats: Math.round(get.macros.fats),
    tmb: Math.round(get.tmb),
    get: Math.round(get.get),
    activityLevel,
    bmi: bmi?.bmi,
    bmiClassification: bmi?.classification,
    ageYears,
  };
};

const extractApiErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message
        .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .join(" · ");
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  }

  const text = await response.text().catch(() => "");
  return text.trim() || fallback;
};

const normalizeImportedDishes = (value: unknown): QuickDish[] => {
  if (!Array.isArray(value) || value.length === 0) return [];

  const mapped = value
    .map((dish) => {
      if (!dish || typeof dish !== "object") return null;
      const item = dish as Record<string, unknown>;
      const ingredients = Array.isArray(item.ingredients)
        ? item.ingredients
          .map((ing) => {
            if (!ing || typeof ing !== "object") return null;
            const raw = ing as Record<string, unknown>;
            const name = typeof raw.name === "string" ? raw.name : "";
            const quantity = typeof raw.quantity === "string" ? raw.quantity : "";
            return { id: createId(), name, quantity };
          })
          .filter(Boolean) as QuickIngredient[]
        : [];

      return {
        id: createId(),
        title: typeof item.title === "string" ? item.title : "",
        mealSection:
          typeof item.mealSection === "string" && item.mealSection.trim()
            ? item.mealSection
            : "Almuerzo",
        description: typeof item.description === "string" ? item.description : "",
        preparation: typeof item.preparation === "string" ? item.preparation : "",
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
        recommendedPortion:
          typeof item.recommendedPortion === "string" ? item.recommendedPortion : "",
        portions:
          item.portions != null ? String(item.portions) : "1",
        protein: item.protein != null ? String(item.protein) : "",
        calories: item.calories != null ? String(item.calories) : "",
        carbs: item.carbs != null ? String(item.carbs) : "",
        fats: item.fats != null ? String(item.fats) : "",
        ingredients: ingredients.length > 0 ? ingredients : [createIngredient()],
      };
    })
    .filter(Boolean) as QuickDish[];

  return mapped.length > 0 ? mapped : [];
};

export default function QuickRecipesClient() {
  const { setSidebarCollapsed } = useDashboardShell();
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");
  const generalSectionRef = useRef<HTMLDivElement | null>(null);
  const instructionsSectionRef = useRef<HTMLDivElement | null>(null);
  const generationSectionRef = useRef<HTMLDivElement | null>(null);
  const dishesSectionRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [dietName, setDietName] = useState(DEFAULT_DIET_NAME);
  const [nutritionistNotes, setNutritionistNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(getTodayDateInputValue());
  const [quickHashtags, setQuickHashtags] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [planObjective, setPlanObjective] = useState("");
  const [showPlanObjectiveInPdf, setShowPlanObjectiveInPdf] = useState(false);
  const [allowedFoodsMainText, setAllowedFoodsMainText] = useState("");
  const [restrictedFoodsText, setRestrictedFoodsText] = useState("");
  const [specialConsiderations, setSpecialConsiderations] = useState("");
  const [dishes, setDishes] = useState<QuickDish[]>([]);
  const [mealGenerationTargets, setMealGenerationTargets] = useState<MealGenerationTarget[]>(
    createDefaultGenerationTargets(),
  );
  const [activeMealSectionFilter, setActiveMealSectionFilter] = useState("Todos");
  const [categoryPageMap, setCategoryPageMap] = useState<Record<string, number>>({});
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null);
  const [showDishesSection, setShowDishesSection] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);
  const [isManualPatientExpanded, setIsManualPatientExpanded] = useState(false);
  const [hasGeneratedDishes, setHasGeneratedDishes] = useState(false);
  const [skipInstructions, setSkipInstructions] = useState(false);
  const [allowExternalFoods, setAllowExternalFoods] = useState(false);

  const missingGenerationFields = {
    allowedFoodsMain: parseLines(allowedFoodsMainText).length === 0,
    restrictedFoods: parseLines(restrictedFoodsText).length === 0,
    specialConsiderations: specialConsiderations.trim().length === 0,
  };

  const isExportDisabled = useMemo(() => {
    const hasAtLeastOneDish = dishes.some(d => d.title.trim().length > 0);
    return !hasAtLeastOneDish || !selectedPatient?.fullName?.trim() || !hasGeneratedDishes;
  }, [dishes, hasGeneratedDishes, selectedPatient]);

  const meaningfulDishes = useMemo(
    () => dishes.filter((dish) => isDishMeaningful(dish)),
    [dishes],
  );
  const patientTargets = useMemo(
    () => buildQuickNutritionalTargets(selectedPatient),
    [selectedPatient],
  );

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");

  const { limit, usage, isDeveloper } = useSubscription();
  const pdfTotalLimit = limit("pdf.exports.total.limit");
  const pdfMonthlyLimit = limit("pdf.monthly.limit");
  const pdfLimit = Math.max(
    Number.isFinite(pdfTotalLimit) ? pdfTotalLimit : 0,
    Number.isFinite(pdfMonthlyLimit) ? pdfMonthlyLimit : 0,
  );
  const pdfUsed = usage?.pdfUsed ?? 0;
  const isPdfLimitReached = !isDeveloper && Number.isFinite(pdfLimit) && pdfLimit > 0 && pdfUsed >= pdfLimit;

  const creationsSaveLimit = limit("creations.save.limit");
  const creationsMonthlyLimit = limit("creations.monthly.limit");
  const creationsLimit = Math.max(
    Number.isFinite(creationsSaveLimit) ? creationsSaveLimit : 0,
    Number.isFinite(creationsMonthlyLimit) ? creationsMonthlyLimit : 0,
  );
  const creationsUsed = usage?.creationsUsed ?? 0;
  const isCreationsLimitReached = !isDeveloper && Number.isFinite(creationsLimit) && creationsLimit > 0 && creationsUsed >= creationsLimit;

  const [patients, setPatients] = useState<QuickPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFoodReferenceBookOpen, setIsFoodReferenceBookOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<QuickDish | null>(null);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editingDishForm, setEditingDishForm] = useState<QuickDish | null>(null);
  const [instructionsMode, setInstructionsMode] = useState<"manual" | "creation">("manual");
  const [selectedBaseCreation, setSelectedBaseCreation] = useState<ImportedCreation | null>(null);

  const extractFoodsFromCreation = (creation: any) => {
    const content = (creation.content || {}) as Record<string, any>;
    const foodsSet = new Set<string>();
    const restrictionsSet = new Set<string>();

    const dietObj = content.diet || content;

    const rawFoods =
      dietObj.includedFoods ||
      dietObj.allowedFoodsMain ||
      dietObj.foods ||
      content.includedFoods ||
      content.allowedFoodsMain ||
      content.foods;

    if (Array.isArray(rawFoods)) {
      rawFoods.forEach((item: any) => {
        if (typeof item === "string" && item.trim()) foodsSet.add(item.trim());
        else if (item && typeof item === "object" && item.name && typeof item.name === "string") {
          foodsSet.add(item.name.trim());
        }
      });
    } else if (typeof rawFoods === "string" && rawFoods.trim()) {
      rawFoods.split("\n").forEach((line: string) => {
        if (line.trim()) foodsSet.add(line.trim());
      });
    }

    const rawRestrictions =
      dietObj.restrictedFoods ||
      dietObj.activeConstraints ||
      dietObj.customConstraints ||
      content.restrictedFoods;

    if (Array.isArray(rawRestrictions)) {
      rawRestrictions.forEach((item: any) => {
        if (typeof item === "string" && item.trim()) restrictionsSet.add(item.trim());
        else if (item && typeof item === "object" && item.name && typeof item.name === "string") {
          restrictionsSet.add(item.name.trim());
        }
      });
    } else if (typeof rawRestrictions === "string" && rawRestrictions.trim()) {
      rawRestrictions.split("\n").forEach((line: string) => {
        if (line.trim()) restrictionsSet.add(line.trim());
      });
    }

    const dishes = content.dishes || content.recipes?.dishes || (Array.isArray(content.recipes) ? content.recipes : []);
    if (Array.isArray(dishes)) {
      dishes.forEach((dish: any) => {
        if (dish.title && typeof dish.title === "string") {
          foodsSet.add(dish.title.trim());
        }
        if (Array.isArray(dish.ingredients)) {
          dish.ingredients.forEach((ing: any) => {
            if (ing.name && typeof ing.name === "string") {
              foodsSet.add(ing.name.trim());
            }
          });
        }
      });
    }

    return {
      foods: Array.from(foodsSet),
      restrictions: Array.from(restrictionsSet),
      name: creation.name || "Creación base",
      type: creation.type,
    };
  };

  const renderFormattedText = (text?: string) => {
    if (!text?.trim()) return <span className="italic text-slate-400">Sin preparación especificada.</span>;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="rounded bg-amber-100/80 px-1 py-0.5 font-extrabold text-amber-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const startEditingDish = (dish: QuickDish) => {
    setEditingDishId(dish.id);
    setEditingDishForm({ ...dish });
  };

  const cancelEditingDish = () => {
    setEditingDishId(null);
    setEditingDishForm(null);
  };

  const saveEditingDish = () => {
    if (!editingDishForm || !editingDishId) return;
    setDishes((prev) =>
      prev.map((d) => (d.id === editingDishId ? { ...editingDishForm } : d)),
    );
    setEditingDishId(null);
    setEditingDishForm(null);
    toast.success("Plato actualizado.");
  };

  const addEditingIngredient = () => {
    setEditingDishForm((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ingredients: [
          ...(prev.ingredients || []),
          { id: createId(), name: "", quantity: "" },
        ],
      };
    });
  };

  const updateEditingIngredient = (
    ingredientId: string,
    field: "name" | "quantity",
    value: string,
  ) => {
    setEditingDishForm((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ingredients: (prev.ingredients || []).map((ing) =>
          ing.id === ingredientId ? { ...ing, [field]: value } : ing,
        ),
      };
    });
  };

  const removeEditingIngredient = (ingredientId: string) => {
    setEditingDishForm((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ingredients: (prev.ingredients || []).filter((ing) => ing.id !== ingredientId),
      };
    });
  };

  const hasEditingChanges = useMemo(() => {
    if (!editingDishForm || !editingDishId) return false;
    const original = dishes.find((d) => d.id === editingDishId);
    if (!original) return false;

    const ingredientsChanged =
      JSON.stringify(editingDishForm.ingredients || []) !==
      JSON.stringify(original.ingredients || []);

    return (
      editingDishForm.title !== original.title ||
      editingDishForm.mealSection !== original.mealSection ||
      editingDishForm.recommendedPortion !== original.recommendedPortion ||
      String(editingDishForm.calories || "") !== String(original.calories || "") ||
      String(editingDishForm.protein || "") !== String(original.protein || "") ||
      String(editingDishForm.fats || "") !== String(original.fats || "") ||
      editingDishForm.preparation !== original.preparation ||
      ingredientsChanged
    );
  }, [editingDishForm, editingDishId, dishes]);

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    if (creationId) return;
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) {
      setIsHydrating(false);
      return;
    }
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      setTitle(typeof parsed.title === "string" ? parsed.title : DEFAULT_TITLE);
      setDietName(
        typeof parsed.dietName === "string" && parsed.dietName.trim()
          ? parsed.dietName
          : DEFAULT_DIET_NAME,
      );
      setNutritionistNotes(
        typeof parsed.nutritionistNotes === "string" ? parsed.nutritionistNotes : "",
      );
      setDeliveryDate(
        typeof parsed.deliveryDate === "string" && parsed.deliveryDate
          ? parsed.deliveryDate
          : getTodayDateInputValue(),
      );
      setQuickHashtags(typeof parsed.quickHashtags === "string" ? parsed.quickHashtags : "");
      setQuickDescription(typeof parsed.quickDescription === "string" ? parsed.quickDescription : "");
      setPlanObjective(typeof parsed.planObjective === "string" ? parsed.planObjective : "");
      setShowPlanObjectiveInPdf(parsed.showPlanObjectiveInPdf === true);
      setAllowedFoodsMainText(toTextAreaValue(parsed.allowedFoodsMain));
      setRestrictedFoodsText(toTextAreaValue(parsed.restrictedFoods));
      setSpecialConsiderations(
        typeof parsed.specialConsiderations === "string"
          ? parsed.specialConsiderations
          : "",
      );
      setDishes(normalizeImportedDishes(parsed.dishes));
      setMealGenerationTargets(
        Array.isArray(parsed.mealGenerationTargets)
          ? (parsed.mealGenerationTargets as MealGenerationTarget[])
          : createDefaultGenerationTargets(),
      );
      setSelectedPatient(
        parsed.selectedPatient && typeof parsed.selectedPatient === "object"
          ? (parsed.selectedPatient as QuickPatient)
          : null,
      );
      setIsManualPatientExpanded(parsed.isManualPatientExpanded === true);
      setHasGeneratedDishes(parsed.hasGeneratedDishes === true);
      setSkipInstructions(parsed.skipInstructions === true);
      setAllowExternalFoods(parsed.allowExternalFoods === true);
    } catch (error) {
      console.error("Error loading quick recipes draft", error);
    } finally {
      setIsHydrating(false);
    }
  }, [creationId]);

  useEffect(() => {
    if (isHydrating) return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title,
        dietName,
        nutritionistNotes,
        deliveryDate,
        quickHashtags,
        quickDescription,
        planObjective,
        showPlanObjectiveInPdf,
        allowedFoodsMain: parseLines(allowedFoodsMainText),
        restrictedFoods: parseLines(restrictedFoodsText),
        specialConsiderations,
        dishes,
        mealGenerationTargets,
        activeMealSectionFilter,
        categoryPageMap,
        selectedPatient,
        isManualPatientExpanded,
        hasGeneratedDishes,
        skipInstructions,
        allowExternalFoods,
      }),
    );
  }, [
    title,
    dietName,
    nutritionistNotes,
    deliveryDate,
    quickHashtags,
    quickDescription,
    planObjective,
    showPlanObjectiveInPdf,
    allowedFoodsMainText,
    restrictedFoodsText,
    specialConsiderations,
    dishes,
    hasGeneratedDishes,
    mealGenerationTargets,
    activeMealSectionFilter,
    categoryPageMap,
    selectedPatient,
    isManualPatientExpanded,
    skipInstructions,
    allowExternalFoods,
    isHydrating,
  ]);

  useEffect(() => {
    if (meaningfulDishes.length > 0) {
      setShowDishesSection(true);
      setExpandedDishId((current) =>
        current && dishes.some((dish) => dish.id === current)
          ? current
          : meaningfulDishes[0]?.id || null,
      );
      return;
    }

    if (dishes.length === 0) {
      setShowDishesSection(false);
      setExpandedDishId(null);
    }
  }, [dishes, meaningfulDishes]);

  useEffect(() => {
    if (!creationId) return;
    const loadCreation = async () => {
      try {
        const creation = await fetchCreation(creationId);
        const content = (creation.content || {}) as Record<string, unknown>;
        setTitle(
          typeof content.title === "string" && content.title.trim()
            ? content.title
            : creation.name || DEFAULT_TITLE,
        );
        setDietName(
          typeof content.dietName === "string" && content.dietName.trim()
            ? content.dietName
            : DEFAULT_DIET_NAME,
        );
        setNutritionistNotes(
          typeof content.nutritionistNotes === "string" ? content.nutritionistNotes : "",
        );
        setDeliveryDate(
          typeof content.deliveryDate === "string" && content.deliveryDate
            ? content.deliveryDate
            : getTodayDateInputValue(),
        );
        setQuickHashtags(typeof content.quickHashtags === "string" ? content.quickHashtags : "");
        setQuickDescription(typeof content.quickDescription === "string" ? content.quickDescription : "");
        setPlanObjective(typeof content.planObjective === "string" ? content.planObjective : "");
        setShowPlanObjectiveInPdf(content.showPlanObjectiveInPdf === true);
        setAllowedFoodsMainText(toTextAreaValue(content.allowedFoodsMain));
        setRestrictedFoodsText(toTextAreaValue(content.restrictedFoods));
        setSpecialConsiderations(
          typeof content.specialConsiderations === "string"
            ? content.specialConsiderations
            : "",
        );
        setDishes(normalizeImportedDishes(content.dishes));
        setMealGenerationTargets(
          Array.isArray(content.mealGenerationTargets)
            ? (content.mealGenerationTargets as MealGenerationTarget[])
            : createDefaultGenerationTargets(),
        );

        if (content.selectedPatient && typeof content.selectedPatient === "object") {
          setSelectedPatient(content.selectedPatient as QuickPatient);
        } else if (creation.metadata?.patientName) {
          setSelectedPatient({
            id: creation.metadata.patientId as string | undefined,
            fullName: creation.metadata.patientName as string,
          });
        }
        setIsManualPatientExpanded(false);
        setHasGeneratedDishes(content.hasGeneratedDishes === true || normalizeImportedDishes(content.dishes).length > 0);
        setSkipInstructions(content.skipInstructions === true);
        setAllowExternalFoods(content.allowExternalFoods === true);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar la receta rápida.");
      } finally {
        setIsHydrating(false);
      }
    };
    void loadCreation();
  }, [creationId]);

  const openPatientModal = async () => {
    setIsLoadingPatients(true);
    setPatientSearch("");
    setIsPatientModalOpen(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
       const response = await fetchApi("/patients?status=Activos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("Error fetching patients", error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const startManualPatientEntry = () => {
    setSelectedPatient(createEmptyQuickPatient());
    setIsManualPatientExpanded(true);
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    return patients.filter((patient) =>
      (patient.fullName || "").toLowerCase().includes(patientSearch.toLowerCase()),
    );
  }, [patients, patientSearch]);

  const handleSelectPatient = (patient: QuickPatient) => {
    setSelectedPatient(patient);
    setIsManualPatientExpanded(false);
    setIsPatientModalOpen(false);
    toast.success(
      `Paciente "${patient.fullName}" vinculado. Naty considerará restricciones y características del paciente (edad, sexo, objetivos y contexto clínico).`,
    );
  };

  const addDish = () => {
    const newDish = createDish();
    setShowDishesSection(true);
    setExpandedDishId(newDish.id);
    setDishes((prev) => [...prev, newDish]);
  };

  const removeDish = (dishId: string) => {
    setDishes((prev) => {
      const next = prev.filter((dish) => dish.id !== dishId);
      if (expandedDishId === dishId) {
        setExpandedDishId(next[0]?.id || null);
      }
      if (next.length === 0) {
        setShowDishesSection(false);
        setHasGeneratedDishes(false);
      }
      return next;
    });
  };

  const updateDish = (dishId: string, field: keyof QuickDish, value: string) => {
    setDishes((prev) =>
      prev.map((dish) => (dish.id === dishId ? { ...dish, [field]: value } : dish)),
    );
  };

  const addIngredient = (dishId: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId
          ? { ...dish, ingredients: [...dish.ingredients, createIngredient()] }
          : dish,
      ),
    );
  };

  const updateIngredient = (
    dishId: string,
    ingredientId: string,
    field: keyof QuickIngredient,
    value: string,
  ) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId
          ? {
            ...dish,
            ingredients: dish.ingredients.map((ingredient) =>
              ingredient.id === ingredientId
                ? { ...ingredient, [field]: value }
                : ingredient,
            ),
          }
          : dish,
      ),
    );
  };

  const removeIngredient = (dishId: string, ingredientId: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId
          ? {
            ...dish,
            ingredients:
              dish.ingredients.length === 1
                ? dish.ingredients
                : dish.ingredients.filter((ingredient) => ingredient.id !== ingredientId),
          }
          : dish,
      ),
    );
  };
  const applyImportedCreation = (creation: ImportedCreation) => {
    if (isHydrating) return;
    const extracted = extractFoodsFromCreation(creation);
    const content = (creation.content || {}) as Record<string, unknown>;

    setSelectedBaseCreation(creation);
    setInstructionsMode("creation");

    setTitle(
      typeof content.title === "string" && content.title.trim()
        ? content.title
        : creation.name || DEFAULT_TITLE,
    );
    setDietName(
      typeof content.dietName === "string" && content.dietName.trim()
        ? content.dietName
        : DEFAULT_DIET_NAME,
    );
    setNutritionistNotes(
      typeof content.nutritionistNotes === "string" ? content.nutritionistNotes : "",
    );
    setDeliveryDate(getTodayDateInputValue());
    setPlanObjective(typeof content.planObjective === "string" ? content.planObjective : "");
    setShowPlanObjectiveInPdf(content.showPlanObjectiveInPdf === true);

    if (extracted.foods.length > 0) {
      setAllowedFoodsMainText(extracted.foods.join("\n"));
    }
    if (extracted.restrictions.length > 0) {
      setRestrictedFoodsText(extracted.restrictions.join("\n"));
    }
    setSpecialConsiderations(
      typeof content.specialConsiderations === "string" ? content.specialConsiderations : "",
    );
    setDishes([]);
    setHasGeneratedDishes(false);
    setSkipInstructions(false);

    const patientName =
      typeof creation.metadata?.patientName === "string" ? creation.metadata.patientName : null;
    const patientId =
      typeof creation.metadata?.patientId === "string" ? creation.metadata.patientId : undefined;
    if (patientName) {
      setSelectedPatient({ id: patientId, fullName: patientName });
    }
    setIsManualPatientExpanded(false);
    setIsImportCreationModalOpen(false);
    toast.success(
      `Creación "${creation.name}" importada. ${extracted.foods.length} alimentos listados para Naty.`,
    );
  };

  const updateGenerationTarget = (
    mealSection: string,
    field: "enabled" | "count",
    value: boolean | number,
  ) => {
    setMealGenerationTargets((prev) =>
      prev.map((target) => {
        if (target.mealSection !== mealSection) return target;
        if (field === "enabled") {
          return { ...target, enabled: Boolean(value) };
        }
        const nextCount = Number(value);
        return {
          ...target,
          count: Number.isFinite(nextCount) ? Math.max(0, Math.min(14, nextCount)) : 0,
        };
      }),
    );
  };

  const generateWithAi = async (mode: "single" | "weekly"): Promise<boolean> => {
    if (isHydrating) return false;
    if (mode === "single") {
      setIsGenerating(true);
    } else {
      setIsGeneratingWeekly(true);
    }

    try {
      const token = getAuthToken();
      const hasValidTarget = mealGenerationTargets.some(
        (target) => target.enabled && target.count > 0,
      );
      if (!hasValidTarget) {
        toast.error("Selecciona al menos una categoría y una cantidad mayor que cero.");
        return false;
      }

      const patientRestrictions = Array.isArray(selectedPatient?.dietRestrictions)
        ? selectedPatient?.dietRestrictions.filter(Boolean)
        : [];
      const patientHealthTags = Array.isArray(selectedPatient?.tags)
        ? selectedPatient?.tags.filter(Boolean)
        : [];
      const userRestricted = parseLines(restrictedFoodsText);
      const normalizedCore = new Set(WEEKLY_CORE_SECTIONS.map(normalizeMealSectionKey));
      const effectiveTargets = mealGenerationTargets.map((target) => {
        if (mode !== "weekly") return target;
        const isCore = normalizedCore.has(normalizeMealSectionKey(target.mealSection));
        if (!isCore) return target;
        return {
          ...target,
          enabled: true,
          count: Math.max(7, target.count || 1),
        };
      });

      const selectedTargets: QuickAiMealTargetPayload[] = effectiveTargets
        .filter((target) => target.enabled && target.count > 0)
        .map((target) => ({
          mealSection: target.mealSection,
          count: Math.min(14, target.count),
        }));

      if (selectedTargets.length === 0) {
        toast.error("Selecciona al menos una categoría y una cantidad mayor que cero.");
        return false;
      }

      const targetBatches = buildQuickAiTargetBatches(selectedTargets);
      const aiInstruction =
        mode === "weekly"
          ? "Generar plan semanal. Ser creativo para que no se aburran."
          : "Ser creativo para que no se aburran.";
      const nutritionalTargets = buildQuickNutritionalTargets(selectedPatient);
      const patientGender = selectedPatient?.gender
        ? normalizeQuickPatientGender(selectedPatient.gender)
        : undefined;
      const patientAge = selectedPatient?.birthDate
        ? calculateAge(selectedPatient.birthDate) || undefined
        : selectedPatient?.ageYears || undefined;
      const patientBmi =
        selectedPatient?.weight && selectedPatient?.height
          ? calculateBMI(Number(selectedPatient.weight) || 0, Number(selectedPatient.height) || 0, {
              gender: normalizeQuickPatientGender(selectedPatient.gender),
              ageYears: calculateAge(selectedPatient.birthDate) || undefined,
              birthDate: selectedPatient.birthDate,
            })
          : null;

      const baseExistingDishes = dishes
        .filter((dish) => dish.title.trim())
        .map((dish) => ({ title: dish.title.trim(), mealSection: dish.mealSection }));
      const aiDishes: QuickAiDishResponse[] = [];

      for (const batchTargets of targetBatches) {
        const response = await fetchApi("/recipes/quick-ai-fill", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: {
              dietName: dietName.trim() || DEFAULT_DIET_NAME,
              notes: aiInstruction,
              allowedFoodsMain: parseLines(allowedFoodsMainText),
              restrictedFoods: Array.from(
                new Set([...userRestricted, ...patientRestrictions, ...patientHealthTags]),
              ),
              specialConsiderations: specialConsiderations.trim(),
              allowExternalFoods,
              desiredDishCount: batchTargets.reduce((sum, target) => sum + target.count, 0),
              mealSectionTargets: batchTargets,
              generationMode: mode,
              nutritionalTargets,
              existingDishes: [
                ...baseExistingDishes,
                ...aiDishes.map((dish) => ({
                  title: String(dish.title || "").trim(),
                  mealSection: String(dish.mealSection || "").trim(),
                })),
              ],
              patient: selectedPatient
                ? {
                  fullName: selectedPatient.fullName,
            restrictions: patientRestrictions,
            dislikedFoods: selectedPatient.dislikedFoods || [],
                  likes: selectedPatient.likes || "",
                  healthTags: patientHealthTags,
                  clinicalSummary: selectedPatient.clinicalSummary || "",
                  nutritionalFocus: selectedPatient.nutritionalFocus || "",
                  fitnessGoals: selectedPatient.fitnessGoals || "",
                  weight: selectedPatient.weight,
                  height: selectedPatient.height,
                  gender: patientGender,
                  birthDate: selectedPatient.birthDate,
                  ageYears: patientAge,
                  bmi: patientBmi?.bmi,
                  bmiClassification: patientBmi?.classification,
                }
                : null,
              patientId: selectedPatient?.id || undefined,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(await extractApiErrorMessage(response, "No se pudo generar con IA."));
        }

        const data = await response.json();
        const batchDishes = Array.isArray(data?.dishes)
          ? (data.dishes as QuickAiDishResponse[])
          : [];
        aiDishes.push(...batchDishes);
      }
      if (aiDishes.length === 0) {
        throw new Error("La IA no devolvió platos.");
      }

      const mapped: QuickDish[] = aiDishes.map((dish) => {
        const ingredients: QuickIngredient[] = Array.isArray(dish.ingredients)
          ? (dish.ingredients
            .map((ingredient) => {
              if (typeof ingredient === "string") {
                const name = ingredient.trim();
                if (!name) return null;
                return { id: createId(), name, quantity: "" };
              }
              if (!ingredient || typeof ingredient !== "object") return null;
              const name =
                typeof ingredient.name === "string" ? ingredient.name.trim() : "";
              const quantity =
                typeof ingredient.quantity === "string"
                  ? ingredient.quantity.trim()
                  : "";
              const amount =
                ingredient.amount != null ? String(ingredient.amount).trim() : "";
              const unit =
                typeof ingredient.unit === "string" ? ingredient.unit.trim() : "";
              if (!name) return null;
              return { id: createId(), name, quantity, amount, unit };
            })
            .filter(Boolean) as QuickIngredient[])
          : [createIngredient()];

        return {
          id: createId(),
          title: dish.title || "",
          mealSection: dish.mealSection || "Almuerzo",
          description: dish.description || "",
          preparation: dish.preparation || "",
          imageUrl: dish.imageUrl || "",
          recommendedPortion: dish.recommendedPortion || "",
          portions: dish.portions != null ? String(dish.portions) : "1",
          protein: String(dish.protein ?? ""),
          calories: String(dish.calories ?? ""),
          carbs: String(dish.carbs ?? ""),
          fats: String(dish.fats ?? ""),
          ingredients,
        };
      });

      if (!mapped.some(isDishMeaningful)) {
        throw new Error("La IA no devolvió platos completos para la selección indicada.");
      }

      setDishes(mapped);
      setHasGeneratedDishes(true);
      setShowDishesSection(mapped.length > 0);
      setExpandedDishId(mapped[0]?.id || null);
      if (mode === "weekly") {
        setMealGenerationTargets(effectiveTargets);
      }
      setCategoryPageMap({});
      setActiveMealSectionFilter("Todos");
      toast.success(
        mode === "weekly"
          ? "Plan semanal generado con IA según categorías."
          : "Platos generados correctamente con IA.",
      );
      setCurrentStep(3);
      return true;
    } catch (error) {
      console.error("Quick AI generation error", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo generar con IA. Revisa la conexión o la configuración de la IA.",
      );
      return false;

    } finally {
      if (mode === "single") {
        setIsGenerating(false);
      } else {
        setIsGeneratingWeekly(false);
      }
    }
  };
  const buildContent = () => ({
    title,
    dietName,
    nutritionistNotes,
    deliveryDate,
    quickHashtags,
    quickDescription,
    planObjective,
    showPlanObjectiveInPdf,
    allowedFoodsMain: parseLines(allowedFoodsMainText),
    restrictedFoods: parseLines(restrictedFoodsText),
    specialConsiderations,
    dishes,
    hasGeneratedDishes,
    mealGenerationTargets,
    selectedPatient,
    isManualPatientExpanded,
    skipInstructions,
    allowExternalFoods,
    updatedAt: new Date().toISOString(),
  });

  const persistGeneratedDishesToProfile = async (savedCreationId?: string) => {
    const token = getAuthToken();
    if (!token || dishes.length === 0) return 0;

    let createdCount = 0;

    for (const dish of dishes) {
      if (!dish.title.trim()) continue;

      const response = await fetchApi("/recipes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: dish.title.trim(),
          description: dish.description?.trim() || undefined,
          preparation: dish.preparation?.trim() || undefined,
          portions: 1,
          portionSize: 100,
          calories: Number(dish.calories) || 0,
          proteins: Number(dish.protein) || 0,
          carbs: Number(dish.carbs) || 0,
          lipids: Number(dish.fats) || 0,
          isPublic: false,
          mealSection: dish.mealSection || undefined,
          tags: Array.from(
            new Set([
              "rapido",
              "plato-creado",
              savedCreationId ? "sincronizado-con-creacion" : "",
              dish.mealSection ? dish.mealSection : "",
            ].filter(Boolean)),
          ),
          customIngredientNames: Array.isArray(dish.ingredients)
            ? dish.ingredients
              .map((ingredient) => ingredient.name.trim())
              .filter(Boolean)
            : [],
          customIngredients: Array.isArray(dish.ingredients)
            ? dish.ingredients
              .map((ingredient) => {
                const name = ingredient.name.trim();
                if (!name) return null;
                return {
                  name,
                  amount: 1,
                  unit: "porción",
                };
              })
              .filter(
                (
                  item,
                ): item is { name: string; amount: number; unit: string } => Boolean(item),
              )
            : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo guardar un plato en el perfil.");
      }

      createdCount += 1;
    }

    return createdCount;
  };

  const handleSaveToCreations = async () => {
    if (isHydrating) return;
    if (isCreationsLimitReached) {
      toast.error("Has alcanzado el límite mensual de creaciones de tu plan. Actualiza tu membresía para guardar.");
      return;
    }
    if (!title.trim()) {
      toast.error("Por favor ingresa un título antes de guardar.");
      return;
    }
    if (!hasGeneratedDishes || meaningfulDishes.length === 0) {
      toast.error("Genera los platos con Naty antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
      const savedCreation = await saveCreation({
        name: title.trim(),
        type: "RECETARIO",
        content: buildContent(),
        metadata: {
          ...(creationDescription.trim() ? { description: creationDescription.trim() } : {}),
          ...(selectedPatient
            ? { patientId: selectedPatient.id, patientName: selectedPatient.fullName }
            : {}),
          dishCount: meaningfulDishes.length,
          source: "rapido",
        },
        tags: ["rapido", "recetario"],
      });

      const savedDishCount =
        savedCreation?.wasCreated === false
          ? 0
          : await persistGeneratedDishesToProfile(savedCreation.id);
      toast.success(
        savedCreation?.wasCreated === false
          ? "La receta rápida ya existía; reutilizamos la creación guardada."
          : savedDishCount > 0
            ? `Receta rápida guardada y ${savedDishCount} platos quedaron en tu perfil.`
            : "Receta rápida guardada en creaciones.",
      );
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la receta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (isHydrating) return;
    setTitle(DEFAULT_TITLE);
    setDietName(DEFAULT_DIET_NAME);
    setNutritionistNotes("");
    setDeliveryDate(getTodayDateInputValue());
    setQuickHashtags("");
    setQuickDescription("");
    setPlanObjective("");
    setShowPlanObjectiveInPdf(false);
    setAllowedFoodsMainText("");
    setRestrictedFoodsText("");
    setSpecialConsiderations("");
    setDishes([]);
    setMealGenerationTargets(createDefaultGenerationTargets());
    setActiveMealSectionFilter("Todos");
    setCategoryPageMap({});
    setExpandedDishId(null);
    setShowDishesSection(false);
    setSelectedPatient(null);
    setIsManualPatientExpanded(false);
    setHasGeneratedDishes(false);
    setSkipInstructions(false);
    setAllowExternalFoods(false);
    setCurrentStep(0);
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Borrador reiniciado.");
  };

  const buildPdfData = () => ({
    title: title.trim() || DEFAULT_TITLE,
    dietName: dietName.trim() || DEFAULT_DIET_NAME,
    patientName: selectedPatient?.fullName || null,
    nutritionistNotes: nutritionistNotes.trim() || undefined,
    planObjective: planObjective.trim() || undefined,
    showPlanObjectiveInPdf,
    allowedFoodsMain: parseLines(allowedFoodsMainText),
    restrictedFoods: parseLines(restrictedFoodsText),
    specialConsiderations: specialConsiderations.trim() || undefined,
    dishes: meaningfulDishes.map((dish) => ({
      title: dish.title,
      mealSection: dish.mealSection,
      description: dish.description,
      preparation: dish.preparation,
      imageUrl: dish.imageUrl || DEFAULT_DISH_IMAGE,
      recommendedPortion: dish.recommendedPortion,
      portions: dish.portions,
      protein: dish.protein,
      calories: dish.calories,
      carbs: dish.carbs,
      fats: dish.fats,
      ingredients: dish.ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          amount: ingredient.amount,
          unit: ingredient.unit,
        })),
    })),
    generatedAt: new Date().toLocaleDateString("es-CL"),
  });

  const handleExportPdf = async () => {
    if (isHydrating) return;
    if (isPdfLimitReached) {
      toast.error("Has alcanzado el límite mensual de PDFs generados de tu plan. Actualiza tu membresía para descargar más PDFs.");
      return;
    }
    if (!selectedPatient) {
      toast.error("Primero importa un paciente para exportar el PDF.");
      return;
    }
    setIsExportingPdf(true);
    try {
      await handleSaveToCreations();

      const { downloadQuickRecipesPdf } = await import(
        "@/features/pdf/quickRecipesPdfExport"
      );
      await downloadQuickRecipesPdf(buildPdfData());
      toast.success("PDF descargado y guardado en tus creaciones.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("membership-usage-updated"));
      }
    } catch (error: any) {
      console.error("PDF export error", error);
      const msg = error?.message || "No se pudo generar el PDF.";
      toast.error(msg);
    } finally {
      setIsExportingPdf(false);
    }
  };



  const mealSectionTabs = useMemo(() => {
    const ordered = MEAL_SECTIONS.filter((section) =>
      meaningfulDishes.some(
        (dish) => normalizeMealSectionKey(dish.mealSection) === normalizeMealSectionKey(section),
      ),
    );
    const custom = Array.from(
      new Set(
        meaningfulDishes
          .map((dish) => dish.mealSection.trim())
          .filter(
            (section) =>
              section.length > 0 &&
              !MEAL_SECTIONS.some(
                (known) => normalizeMealSectionKey(known) === normalizeMealSectionKey(section),
              ),
          ),
      ),
    );
    return ["Todos", ...ordered, ...custom];
  }, [meaningfulDishes]);

  const filteredDishesByCategory = useMemo(() => {
    if (activeMealSectionFilter === "Todos") return meaningfulDishes;
    return meaningfulDishes.filter(
      (dish) =>
        normalizeMealSectionKey(dish.mealSection) ===
        normalizeMealSectionKey(activeMealSectionFilter),
    );
  }, [activeMealSectionFilter, meaningfulDishes]);

  const currentCategoryPage = Math.max(
    1,
    categoryPageMap[activeMealSectionFilter] || 1,
  );
  const totalCategoryPages = Math.max(
    1,
    Math.ceil(filteredDishesByCategory.length / DISHES_PER_CATEGORY_PAGE),
  );
  const pagedDishes = filteredDishesByCategory.slice(
    (Math.min(currentCategoryPage, totalCategoryPages) - 1) * DISHES_PER_CATEGORY_PAGE,
    Math.min(currentCategoryPage, totalCategoryPages) * DISHES_PER_CATEGORY_PAGE,
  );
  const selectedGenerationTotal = mealGenerationTargets
    .filter((target) => target.enabled)
    .reduce((sum, target) => sum + Math.max(0, target.count || 0), 0);

  useEffect(() => {
    if (mealSectionTabs.includes(activeMealSectionFilter)) return;
    setActiveMealSectionFilter("Todos");
  }, [activeMealSectionFilter, mealSectionTabs]);

  useEffect(() => {
    setCategoryPageMap((prev) => {
      const current = prev[activeMealSectionFilter] || 1;
      const bounded = Math.max(1, Math.min(current, totalCategoryPages));
      if (bounded === current) return prev;
      return { ...prev, [activeMealSectionFilter]: bounded };
    });
  }, [activeMealSectionFilter, totalCategoryPages]);

  const completedSteps = Array.from({ length: currentStep }, (_, index) => index);
  const hasGenerationTarget = mealGenerationTargets.some(
    (target) => target.enabled && target.count > 0,
  );
  const goBack = () => {
    if (isHydrating) return;
    setCurrentStep((step) => Math.max(0, step - 1));
  };
  const goNext = () => {
    if (isHydrating) return;
    setCurrentStep((step) => Math.min(WIZARD_STEPS.length - 1, step + 1));
  };
  const handleWizardNext = async () => {
    if (isHydrating) return;
    if (currentStep === 2) {
      if (!hasGeneratedDishes || meaningfulDishes.length === 0) {
        await generateWithAi("single");
        return;
      }
      goNext();
      return;
    }
    if (currentStep === 3 && (!hasGeneratedDishes || meaningfulDishes.length === 0)) {
      toast.error("Genera los platos con Naty antes de continuar.");
      return;
    }
    goNext();
  };
  const handleStepClick = (step: number) => {
    if (isHydrating) return;
    if (
      step >= 2 &&
      !skipInstructions &&
      Object.values(missingGenerationFields).some(Boolean)
    ) {
      toast.error("Completa las instrucciones o selecciona el modo de omitirlas.");
      return;
    }
    if (step >= 3 && (!hasGeneratedDishes || meaningfulDishes.length === 0)) {
      toast.error("Genera los platos con Naty antes de avanzar a esta etapa.");
      return;
    }
    setCurrentStep(step);
  };

  const buildRecipesPromptPayload = () => ({
    payload: {
      dietName: dietName.trim() || DEFAULT_DIET_NAME,
      notes: skipInstructions ? "Naty debe completar las instrucciones con el contexto disponible." : "Ser creativo para que no se aburran.",
      allowedFoodsMain: parseLines(allowedFoodsMainText),
      restrictedFoods: Array.from(
        new Set([
          ...((selectedPatient?.dietRestrictions || []).filter(Boolean)),
          ...((selectedPatient?.tags || []).filter(Boolean)),
          ...parseLines(restrictedFoodsText),
        ]),
      ),
      specialConsiderations: specialConsiderations.trim(),
      allowExternalFoods,
      desiredDishCount: selectedGenerationTotal,
      mealSectionTargets: mealGenerationTargets
        .filter((target) => target.enabled && target.count > 0)
        .map((target) => ({ mealSection: target.mealSection, count: target.count })),
      generationMode: "single",
      nutritionalTargets: buildQuickNutritionalTargets(selectedPatient),
      patient: selectedPatient
        ? {
            fullName: selectedPatient.fullName,
            restrictions: selectedPatient.dietRestrictions || [],
            dislikedFoods: selectedPatient.dislikedFoods || [],
            likes: selectedPatient.likes || "",
            healthTags: selectedPatient.tags || [],
            clinicalSummary: selectedPatient.clinicalSummary || "",
            nutritionalFocus: selectedPatient.nutritionalFocus || "",
            fitnessGoals: selectedPatient.fitnessGoals || "",
            weight: selectedPatient.weight,
            height: selectedPatient.height,
            gender: selectedPatient.gender,
            birthDate: selectedPatient.birthDate,
            ageYears: selectedPatient.ageYears,
          }
        : null,
      patientId: selectedPatient?.id || undefined,
      existingDishes: dishes
        .filter((dish) => dish.title.trim())
        .map((dish) => ({ title: dish.title.trim(), mealSection: dish.mealSection })),
    },
  });

  const actionItems: ActionDockItem[] = [
    {
      id: "patient",
      icon: isLoadingPatients ? Loader2 : User,
      label: selectedPatient?.fullName || "Importar paciente",
      description: selectedPatient ? "Cambiar paciente" : "Importar paciente",
      variant: selectedPatient ? "emerald" : "slate",
      disabled: isLoadingPatients,
      onClick: () => void openPatientModal(),
    },
    {
      id: "import",
      icon: Library,
      label: "Importar dieta",
      variant: "indigo",
      onClick: () => setIsImportCreationModalOpen(true),
    },
    {
      id: "food-reference-book",
      icon: Apple,
      label: "Manual de alimentos",
      description: "Abrir manual de alimentos",
      variant: "amber",
      onClick: () => setIsFoodReferenceBookOpen(true),
    },
    { id: "separator", icon: ChefHat, label: "", isSeparator: true, onClick: () => undefined },
    {
      id: "pdf",
      icon: isExportingPdf ? Loader2 : Download,
      label: "Descargar y guardar PDF",
      description: isPdfLimitReached
        ? "Límite mensual de PDFs alcanzado"
        : isExportDisabled
          ? "Agrega un paciente y al menos un plato"
          : "Descargar y guardar PDF en Mis Creaciones",
      variant: "indigo",
      disabled: isExportingPdf || isExportDisabled || isPdfLimitReached,
      onClick: () => {
        if (isPdfLimitReached) {
          toast.error("Has alcanzado el límite mensual de PDFs generados de tu plan. Actualiza tu membresía para descargar más PDFs.");
          return;
        }
        void handleExportPdf();
      },
    },
    {
      id: "reset",
      icon: RotateCcw,
      label: "Reiniciar",
      variant: "rose",
      onClick: handleReset,
    },
  ];

  return (
    <FeatureGate
      feature="ai.autofill.access"
      message="Las recetas rápidas con Naty están disponibles desde Pro."
    >
      <>
        {(isGenerating || isGeneratingWeekly) && (
          <NatyLoadingOverlay title="Naty está cocinando..." subtitle="Generando recetas basadas en tus instrucciones y contexto del paciente" />
        )}
        <FoodReferenceBook isOpen={isFoodReferenceBookOpen} onClose={() => setIsFoodReferenceBookOpen(false)} />
      <ModuleLayout
        title="Recetas"
        description="Genera recetas rápidas reutilizando contexto clínico, restricciones y preferencias."
        step={{ number: "Express", label: "Receta rápida", icon: ChefHat, color: "text-amber-600" }}
        rightContent={<ModuleUsageBadges />}
         rightNavItems={isHydrating ? [] : actionItems}
        rightNavDesktopBreakpoint="lg"
        className="max-w-[68rem]"
      >
         {isHydrating ? (
           <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
               <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
               Preparando las recetas...
             </div>
           </div>
         ) : <PlanWizardShell
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          onBack={goBack}
          onNext={handleWizardNext}
          isLastStep={currentStep === WIZARD_STEPS.length - 1}
          nextDisabled={
            (currentStep === 0 && (!title.trim() || !dietName.trim())) ||
            (currentStep === 1 && (instructionsMode === "creation" ? !selectedBaseCreation : (!skipInstructions && Object.values(missingGenerationFields).some(Boolean)))) ||
            (currentStep === 2 && !hasGenerationTarget) ||
            (currentStep === 3 && (!hasGeneratedDishes || meaningfulDishes.length === 0))
          }
          lockFutureSteps
          onReset={handleReset}
        >
        <div className="space-y-6">
          {currentStep === 0 && <div ref={generalSectionRef} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_9rem_1fr]">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título <span className="text-rose-500">*</span></p>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Entregable rápido"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha</p>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="h-11 appearance-none rounded-xl border-slate-200 bg-slate-50 text-sm [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hashtags</p>
                <TagInput
                  value={quickHashtags.split(",").map((tag) => tag.trim()).filter(Boolean)}
                  onChange={(tags) => setQuickHashtags(tags.join(", "))}
                  fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                  helperText="Selecciona una sugerencia o presiona Enter para usar uno personalizado."
                  placeholder="Ej: keto, hipertrofia"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descripción</p>
              <Textarea
                value={quickDescription}
                onChange={(event) => setQuickDescription(event.target.value)}
                className="min-h-[72px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                placeholder="Notas internas sobre este entregable..."
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objetivo del plan <span className="normal-case font-medium text-slate-400">(opcional)</span></p>
              <Textarea
                value={planObjective}
                onChange={(event) => setPlanObjective(event.target.value)}
                className="min-h-[72px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                placeholder="Ej: Pérdida de grasa enfocada en alimentos simples"
              />
            </div>
            {selectedPatient?.fullName?.trim() ? (
              <details className="group mt-4 rounded-2xl border border-slate-200 bg-white" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900">{selectedPatient.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setSelectedPatient(null);
                        setIsManualPatientExpanded(false);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      Quitar
                    </button>
                    <span className="text-xs font-bold text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                  </div>
                </summary>
                <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Edad</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.birthDate ? `${calculateAge(selectedPatient.birthDate) || "—"} años` : selectedPatient.ageYears ? `${selectedPatient.ageYears} años` : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Sexo</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.gender || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Peso / altura</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} kg` : "—"} · {selectedPatient.height ? `${selectedPatient.height} cm` : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Objetivo</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.nutritionalFocus || selectedPatient.fitnessGoals || "Sin registro"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Calorías estimadas</p>
                      <p className="text-sm font-semibold text-slate-800">{patientTargets?.dailyCalories ? `${patientTargets.dailyCalories} kcal` : "Sin cálculo"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">IMC</p>
                      <p className="text-sm font-semibold text-slate-800">{patientTargets?.bmi ? `${patientTargets.bmi} · ${patientTargets.bmiClassification || ""}` : "Sin cálculo"}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Restricciones</p>
                      <p className="text-sm font-semibold text-slate-800">{(selectedPatient.dietRestrictions || selectedPatient.tags || []).join(", ") || "Sin registro"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Gustos</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.likes || "Sin registro"}</p>
                    </div>
                    {selectedPatient.clinicalSummary ? (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 md:col-span-2">
                        <p className="text-[10px] font-black uppercase text-slate-400">Contexto clínico</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedPatient.clinicalSummary}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </details>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-6">
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="max-w-2xl">
                    <p className="text-sm font-bold leading-6 text-amber-900">Puedes generar platos sin paciente o importar uno para personalizar mejor la IA.</p>
                    <p className="mt-2 text-xs leading-5 text-amber-800/80">
                      Si importas un paciente, Naty considerará sus restricciones, objetivos y contexto clínico. El PDF sigue requiriendo un paciente vinculado.
                    </p>
                  </div>
                  <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row flex-wrap">
                    <Button
                      variant="outline"
                      className="h-10 min-w-44 justify-center rounded-xl border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
                      onClick={openPatientModal}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Importar paciente
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 min-w-44 justify-center rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      onClick={startManualPatientEntry}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Rellenar manualmente
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 min-w-44 justify-center rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold"
                      onClick={() => {
                        setSelectedPatient({
                          ...createEmptyQuickPatient(),
                          fullName: "Paciente General",
                          nutritionalFocus: "General / Recetas Express",
                        });
                        toast.info("Modo recetas generales activado. Puedes continuar generando recetas sin seleccionar un paciente específico.");
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
                      Continuar sin paciente
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {isManualPatientExpanded && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre</p>
                    <Input
                      value={selectedPatient?.fullName || ""}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), fullName: event.target.value }))}
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edad</p>
                    <Input
                      type="number"
                      min={0}
                      value={selectedPatient?.ageYears ?? ""}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), ageYears: event.target.value === "" ? null : Math.max(0, Math.round(Number(event.target.value) || 0)) }))}
                      placeholder="Ej: 42"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sexo</p>
                    <select
                      value={selectedPatient?.gender || ""}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), gender: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objetivo / enfoque</p>
                    <Input
                      value={selectedPatient?.nutritionalFocus || ""}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), nutritionalFocus: event.target.value }))}
                      placeholder="Ej: mejorar energía, ordenar horarios..."
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Metas</p>
                    <Input
                      value={selectedPatient?.fitnessGoals || ""}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), fitnessGoals: event.target.value }))}
                      placeholder="Ej: bajar grasa, ganar masa muscular..."
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Restricciones</p>
                    <Input
                      value={(selectedPatient?.dietRestrictions || []).join(", ")}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), dietRestrictions: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                      placeholder="Ej: sin gluten, evitar lactosa"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gustos</p>
                    <Input
                      value={selectedPatient?.likes || ""}
                      onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), likes: event.target.value }))}
                      placeholder="Ej: preparaciones saladas, frutas, yogurt..."
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    type="number"
                    min={0}
                    value={selectedPatient?.weight ?? ""}
                    onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), weight: event.target.value === "" ? undefined : Number(event.target.value) }))}
                    placeholder="Peso (kg)"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={selectedPatient?.height ?? ""}
                    onChange={(event) => setSelectedPatient((current) => ({ ...(current || createEmptyQuickPatient()), height: event.target.value === "" ? undefined : Number(event.target.value) }))}
                    placeholder="Altura (cm)"
                  />
                </div>
              </div>
            )}
          </div>}

          {currentStep === 1 && <div
            ref={instructionsSectionRef}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
          >
            {/* Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setInstructionsMode("manual")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  instructionsMode === "manual"
                    ? "bg-amber-100 text-amber-900 shadow-2xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                Manual
              </button>
              <button
                type="button"
                onClick={() => setInstructionsMode("creation")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  instructionsMode === "creation"
                    ? "bg-indigo-100 text-indigo-900 shadow-2xs"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                )}
              >
                <Library className="h-3.5 w-3.5 text-indigo-600" />
                En base a una creación / dieta
              </button>
            </div>

            {/* Creation Mode Banner */}
            {instructionsMode === "creation" && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                {selectedBaseCreation ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-900">
                          {selectedBaseCreation.type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {selectedBaseCreation.name}
                        </h4>
                      </div>
                      <p className="text-xs font-medium text-indigo-950">
                        Alimentos extraídos automáticamente de esta creación para pasarle a Naty.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportCreationModalOpen(true)}
                        className="h-8 rounded-xl border-indigo-200 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        Cambiar creación
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBaseCreation(null);
                          setInstructionsMode("manual");
                        }}
                        className="h-8 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Library className="mb-2 h-8 w-8 text-indigo-400" />
                    <p className="text-sm font-bold text-indigo-900">
                      Importa una dieta o creación existente para ocupar sus alimentos como base
                    </p>
                    <p className="mt-1 text-xs font-medium text-indigo-950 max-w-md">
                      Naty tomará los alimentos de la dieta, entregable o recetario seleccionado para sugerirte nuevas recetas.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setIsImportCreationModalOpen(true)}
                      className="mt-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                    >
                      Seleccionar creación / dieta base
                    </Button>
                  </div>
                )}
              </div>
            )}
            {/* Mode Content */}
            {instructionsMode === "manual" ? (
              <>
                <div className={cn(
                  "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                  skipInstructions
                    ? "border-indigo-200 bg-indigo-50/70"
                    : "border-slate-200 bg-slate-50/80",
                )}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">¿Prefieres que Naty complete las instrucciones?</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Usará la información disponible, incluyendo el paciente seleccionado y el contexto de la receta.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSkipInstructions((current) => !current)}
                    className={cn(
                      "shrink-0 rounded-xl font-bold",
                      skipInstructions
                        ? "border-indigo-300 bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
                    )}
                  >
                    {skipInstructions ? "Naty completará esta etapa" : "Omitir y dejárselo a Naty"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className={`mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${missingGenerationFields.allowedFoodsMain
                          ? "text-rose-600"
                          : "text-slate-400"
                        }`}
                    >
                      Alimentos permitidos principales
                    </label>
                    <Textarea
                      value={allowedFoodsMainText}
                      onChange={(event) => setAllowedFoodsMainText(event.target.value)}
                      placeholder="Ej: pollo, huevo, yogurt griego, avena (uno por línea o separados por coma)"
                      className={`min-h-[96px] rounded-xl bg-slate-50 text-sm ${missingGenerationFields.allowedFoodsMain
                          ? "border-rose-300 ring-1 ring-rose-100 focus-visible:ring-rose-300"
                          : "border-slate-200"
                        }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${missingGenerationFields.restrictedFoods
                          ? "text-rose-600"
                          : "text-slate-400"
                        }`}
                    >
                      Restricciones de alimentos
                    </label>
                    <Textarea
                      value={restrictedFoodsText}
                      onChange={(event) => setRestrictedFoodsText(event.target.value)}
                      placeholder="Ej: mariscos, frituras, lactosa"
                      className={`min-h-[96px] rounded-xl bg-slate-50 text-sm ${missingGenerationFields.restrictedFoods
                          ? "border-rose-300 ring-1 ring-rose-100 focus-visible:ring-rose-300"
                          : "border-slate-200"
                        }`}
                    />
                  </div>
                </div>
              </>
            ) : selectedBaseCreation ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Alimentos cargados desde la creación ({parseLines(allowedFoodsMainText).length})
                  </label>
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 max-h-40 overflow-y-auto">
                    {parseLines(allowedFoodsMainText).length > 0 ? (
                      parseLines(allowedFoodsMainText).map((food, i) => (
                        <span
                          key={i}
                          className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 shadow-2xs"
                        >
                          {food}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs italic text-slate-400">No se detectaron alimentos estructurados en esta creación.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            <div>
              <label
                className={`mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${missingGenerationFields.specialConsiderations
                    ? "text-rose-600"
                    : "text-slate-400"
                  }`}
              >
                Consideraciones especiales
              </label>
              <Textarea
                value={specialConsiderations}
                onChange={(event) => setSpecialConsiderations(event.target.value)}
                placeholder="Ej: máximo 20 min por preparación, usar ingredientes de bajo costo..."
                className={`min-h-[80px] rounded-xl bg-slate-50 text-sm ${missingGenerationFields.specialConsiderations
                    ? "border-rose-300 ring-1 ring-rose-100 focus-visible:ring-rose-300"
                    : "border-slate-200"
                  }`}
                maxLength={700}
              />
            </div>
            <p className="text-xs text-slate-500">
              Las instrucciones de arriba se usan directamente para generar con IA.
            </p>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowExternalFoods}
                onChange={(event) => setAllowExternalFoods(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <span className="font-bold">Permitir alimentos fuera de la lista</span>
                <span className="mt-0.5 block text-xs text-slate-500">Los condimentos básicos podrán aparecer como opcionales.</span>
              </span>
            </label>
          </div>}

          {currentStep === 2 && <div ref={generationSectionRef} className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-700">
                  Generar con Naty según instrucciones
                </h3>
                <div className="text-xs font-semibold text-indigo-700">
                  Total a generar: {selectedGenerationTotal}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mealGenerationTargets.map((target) => (
                  <label
                    key={target.mealSection}
                    className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={target.enabled}
                        onChange={(event) =>
                          updateGenerationTarget(
                            target.mealSection,
                            "enabled",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{target.mealSection}</span>
                    </span>
                    <Input
                      type="number"
                       min="0"
                      max="14"
                      value={target.count}
                      disabled={!target.enabled}
                      onChange={(event) =>
                        updateGenerationTarget(
                          target.mealSection,
                          "count",
                          Number(event.target.value || "1"),
                        )
                      }
                      className="h-9 w-16 rounded-lg border-slate-200 bg-slate-50 px-2 text-center text-sm"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100/80 pt-3">
                <p className="text-xs font-semibold text-indigo-900">
                  {hasGeneratedDishes && meaningfulDishes.length > 0
                    ? `Ya tienes ${meaningfulDishes.length} plato(s) generado(s). Presiona 'Siguiente' para volver a la lista o vuelve a generar si cambiaste los parámetros.`
                    : "Configura las cantidades y haz clic en 'Siguiente' para generar los platos con Naty."}
                </p>
                {hasGeneratedDishes && meaningfulDishes.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateWithAi("single")}
                    disabled={isGenerating || isGeneratingWeekly}
                    className="rounded-xl border-indigo-200 bg-white font-bold text-indigo-700 hover:bg-indigo-50"
                  >
                    {isGenerating ? "Generando..." : "Regenerar platos con Naty"}
                  </Button>
                )}
              </div>
            </div>

          </div>}

          {currentStep === 3 && <div ref={dishesSectionRef} className="space-y-4">
            {showDishesSection && meaningfulDishes.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {mealSectionTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveMealSectionFilter(tab)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold ${activeMealSectionFilter === tab
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                    <ChefHat className="h-4 w-4 text-amber-500" />
                    Platos ({filteredDishesByCategory.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCategoryPageMap((prev) => ({
                          ...prev,
                          [activeMealSectionFilter]: Math.max(1, currentCategoryPage - 1),
                        }))
                      }
                      disabled={currentCategoryPage <= 1}
                      className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Anterior
                    </Button>
                    <span className="text-xs font-semibold text-slate-500">
                      Página {Math.min(currentCategoryPage, totalCategoryPages)} de {totalCategoryPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCategoryPageMap((prev) => ({
                          ...prev,
                          [activeMealSectionFilter]: Math.min(
                            totalCategoryPages,
                            currentCategoryPage + 1,
                          ),
                        }))
                      }
                      disabled={currentCategoryPage >= totalCategoryPages}
                      className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {pagedDishes.map((dish) => {
                    const isExpanded = expandedDishId === dish.id;
                    const isEditing = editingDishId === dish.id;

                    return (
                      <div
                        key={dish.id}
                        className={`overflow-hidden rounded-2xl border transition-all ${
                          isExpanded
                            ? "border-amber-300 bg-white shadow-sm ring-1 ring-amber-200/50"
                            : "border-slate-200 bg-white hover:border-amber-200 hover:shadow-xs"
                        }`}
                      >
                        {/* Vista Simple (Fila Clickeable Minimalista) */}
                        <div
                          onClick={() => {
                            if (isEditing) return;
                            setExpandedDishId(isExpanded ? null : dish.id);
                          }}
                          className="flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                              <ChefHat className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-800">
                                  {dish.mealSection || "Plato"}
                                </span>
                              </div>
                              <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">
                                {dish.title.trim() || "Plato sin nombre"}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Nutrientes: Solo Kcal, Proteínas, Grasas */}
                            <div className="flex items-center gap-2 text-xs">
                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center">
                                <span className="block font-black text-slate-800">{dish.calories || "0"}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Kcal</span>
                              </div>
                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center">
                                <span className="block font-black text-slate-800">{dish.protein || "0"}g</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Prot.</span>
                              </div>
                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-center">
                                <span className="block font-black text-slate-800">{dish.fats || "0"}g</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Grasas</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDishToDelete(dish);
                              }}
                              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              title="Eliminar plato"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Vista Detallada al desplegar */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-5" onClick={(e) => e.stopPropagation()}>
                            {!isEditing ? (
                              <div className="space-y-4">
                                {dish.recommendedPortion?.trim() ? (
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Porción recomendada
                                    </span>
                                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                      {dish.recommendedPortion}
                                    </p>
                                  </div>
                                ) : null}

                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Preparación
                                  </span>
                                  <div className="mt-1 rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-2xs">
                                    {renderFormattedText(dish.preparation)}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Ingredientes
                                  </span>
                                  {dish.ingredients && dish.ingredients.length > 0 ? (
                                    <div className="mt-1.5 flex flex-wrap gap-2">
                                      {dish.ingredients
                                        .filter((ing) => ing.name?.trim())
                                        .map((ing) => {
                                          const qtyText = [ing.quantity, ing.amount, ing.unit]
                                            .filter(Boolean)
                                            .join(" ");
                                          return (
                                            <div
                                              key={ing.id}
                                              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
                                            >
                                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                              <span>{ing.name}</span>
                                              {qtyText ? (
                                                <span className="text-slate-400 font-medium">({qtyText})</span>
                                              ) : null}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-xs italic text-slate-400">Sin ingredientes registrados.</p>
                                  )}
                                </div>

                                <div className="flex justify-end pt-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditingDish(dish)}
                                    className="rounded-xl border-amber-200 bg-white font-bold text-amber-800 hover:bg-amber-50"
                                  >
                                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                    Editar plato
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Modo Edición */
                              <div className="space-y-4 rounded-xl border border-amber-200 bg-white p-4 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                                    Editar plato
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                  <div className="sm:col-span-2">
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Nombre del plato (solo un alimento, sin slashes)
                                    </label>
                                    <Input
                                      value={editingDishForm?.title || ""}
                                      onChange={(e) =>
                                        setEditingDishForm((prev) =>
                                          prev ? { ...prev, title: e.target.value } : null
                                        )
                                      }
                                      placeholder="Ej: Pollo a la plancha con quinoa"
                                      className="h-10 rounded-xl border-slate-200 text-sm font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Tiempo de comida
                                    </label>
                                    <select
                                      value={editingDishForm?.mealSection || ""}
                                      onChange={(e) =>
                                        setEditingDishForm((prev) =>
                                          prev ? { ...prev, mealSection: e.target.value } : null
                                        )
                                      }
                                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    >
                                      {MEAL_SECTIONS.map((sec) => (
                                        <option key={sec} value={sec}>
                                          {sec}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Porción recomendada
                                    </label>
                                    <Input
                                      value={editingDishForm?.recommendedPortion || ""}
                                      onChange={(e) =>
                                        setEditingDishForm((prev) =>
                                          prev ? { ...prev, recommendedPortion: e.target.value } : null
                                        )
                                      }
                                      placeholder="Ej: 150g de pollo"
                                      className="h-10 rounded-xl border-slate-200 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Kcal
                                    </label>
                                    <Input
                                      type="number"
                                      value={editingDishForm?.calories || ""}
                                      onChange={(e) =>
                                        setEditingDishForm((prev) =>
                                          prev ? { ...prev, calories: e.target.value } : null
                                        )
                                      }
                                      className="h-10 rounded-xl border-slate-200 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Proteínas (g)
                                    </label>
                                    <Input
                                      type="number"
                                      value={editingDishForm?.protein || ""}
                                      onChange={(e) =>
                                        setEditingDishForm((prev) =>
                                          prev ? { ...prev, protein: e.target.value } : null
                                        )
                                      }
                                      className="h-10 rounded-xl border-slate-200 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Grasas (g)
                                    </label>
                                    <Input
                                      type="number"
                                      value={editingDishForm?.fats || ""}
                                      onChange={(e) =>
                                        setEditingDishForm((prev) =>
                                          prev ? { ...prev, fats: e.target.value } : null
                                        )
                                      }
                                      className="h-10 rounded-xl border-slate-200 text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Preparación
                                  </label>
                                  <Textarea
                                    value={editingDishForm?.preparation || ""}
                                    onChange={(e) =>
                                      setEditingDishForm((prev) =>
                                        prev ? { ...prev, preparation: e.target.value } : null
                                      )
                                    }
                                    className="min-h-[90px] rounded-xl border-slate-200 text-sm"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Ingredientes
                                    </label>
                                    <button
                                      type="button"
                                      onClick={addEditingIngredient}
                                      className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Agregar ingrediente
                                    </button>
                                  </div>
                                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {(editingDishForm?.ingredients || []).map((ing) => (
                                      <div key={ing.id} className="flex items-center gap-2">
                                        <Input
                                          value={ing.name}
                                          onChange={(e) =>
                                            updateEditingIngredient(ing.id, "name", e.target.value)
                                          }
                                          placeholder="Ingrediente (ej: Huevos)"
                                          className="h-9 flex-1 rounded-xl border-slate-200 bg-white text-xs font-semibold"
                                        />
                                        <Input
                                          value={ing.quantity}
                                          onChange={(e) =>
                                            updateEditingIngredient(ing.id, "quantity", e.target.value)
                                          }
                                          placeholder="Cantidad (ej: 2 u)"
                                          className="h-9 w-32 rounded-xl border-slate-200 bg-white text-xs"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeEditingIngredient(ing.id)}
                                          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditingDish}
                                    className="rounded-xl border-slate-200 text-slate-600"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={saveEditingDish}
                                    disabled={!hasEditingChanges}
                                    className="rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Guardar cambios
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center"
              >
                <ChefHat className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-400">Aún no hay platos generados</h3>
                <p className="mt-1 text-sm text-slate-400">Regresa a la etapa anterior para generar los platos con Naty.</p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-2xl border-slate-200"
                  onClick={addDish}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar plato manual
                </Button>
              </div>
            )}
          </div>}

          {currentStep === 4 && (
            <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Resumen del recetario</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">Revisa tu entrega antes de continuar</h2>
                <p className="mt-1 text-sm text-slate-500">Puedes volver a cualquier etapa desde el indicador superior.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Paciente</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selectedPatient?.fullName || "Sin paciente vinculado"}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Platos</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{meaningfulDishes.length} preparados</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Indicaciones</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {skipInstructions
                      ? "Naty completará las indicaciones con la información disponible."
                      : `${parseLines(allowedFoodsMainText).length} alimentos permitidos · ${parseLines(restrictedFoodsText).length} restricciones`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || isExportDisabled}
                  className="h-11 rounded-2xl bg-emerald-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isExportingPdf ? "Guardando y generando..." : "Descargar y guardar PDF"}
                </Button>
              </div>
            </section>
          )}
        </div>
      </PlanWizardShell>}
    </ModuleLayout>

      <Modal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        title="Importar paciente"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Al importar un paciente, Naty considera restricciones y características personales
            como edad, sexo, peso/talla, objetivos y resumen clínico.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente por nombre..."
              className="pl-9"
            />
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {isLoadingPatients ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{patient.fullName}</p>
                      <p className="text-xs text-slate-500">{patient.email || "Sin email"}</p>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-slate-300" />
                </button>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">No se encontraron pacientes.</p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(dishToDelete)}
        onClose={() => setDishToDelete(null)}
        title="Eliminar plato"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas eliminar el plato{" "}
            <strong className="font-bold text-slate-900">
              "{dishToDelete?.title}"
            </strong>
            ? Esta acción removerá el plato del borrador.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDishToDelete(null)}
              className="rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (dishToDelete) {
                  removeDish(dishToDelete.id);
                  setDishToDelete(null);
                  toast.success("Plato eliminado.");
                }
              }}
              className="rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={handleSaveToCreations}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title={`Guardar "${title.trim() || DEFAULT_TITLE}"`}
        subtitle="Añade una descripción para identificar esta receta más tarde. Se guardará en Mis Creaciones."
        isSaving={isSaving}
      />

      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={applyImportedCreation}
        allowedTypes={["DIET", "FAST_DELIVERABLE", "DELIVERABLE", "RECETARIO", "PAUTAS", "RECIPE"]}
      />

    </>
    </FeatureGate>
  );
}





