"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  GraduationCap,
  Zap,
  ArrowRight,
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  GripVertical,
  RotateCcw,
  Loader2,
  Dumbbell,
  Flame,
  Pencil,
  Settings2,
  CheckCircle2,
  Info,
  Eye,
  Lock,
  Search,
  Filter,
  ArrowUpDown,
  ChefHat,
  Coffee,
  Sun,
  Moon,
  X,
  Trash2,
  Target,
  Droplet,
  Layers,
  Save,
  FileCode,
  Library,
  User,
  UserPlus,
  AlertCircle,
  FileUp,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { useAdmin } from "@/context/AdminContext";
import { DraftRestoreModal } from "@/components/shared/DraftRestoreModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import mealSectionsData from "@/content/meal-sections.json";
import {
  buildProjectAwarePath,
  fetchCreation,
  fetchProject,
  saveCreation,
  updateProject,
} from "@/lib/workflow";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { useDashboardShell } from "@/context/DashboardShellContext";

// -- Types --

type RecipeCatalogTab = "mine" | "community" | "app";

type RecipeMetadata = {
  tags?: string[];
  mealSection?: string;
  customIngredientNames?: string[];
  customIngredients?: string[];
};

type RecipeApiSummary = {
  id: string;
  name: string;
  description?: string;
  preparation?: string;
  portions: number;
  proteins: number;
  carbs: number;
  lipids: number;
  calories: number;
  isPublic: boolean;
  isMine?: boolean;
  nutritionist?: { fullName?: string | null } | null;
  metadata?: RecipeMetadata | null;
  ingredients?: { isMain: boolean; ingredient: { name: string } }[];
  matchPercentage?: number;
  matchCount?: number;
  totalMain?: number;
};

interface Recipe {
  id: string;
  title: string;
  description: string;
  preparation?: string;
  recommendedPortion?: string;
  complexity: "simple" | "elaborada";
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  extraIngredients?: string[];
  image?: string;
  source: RecipeCatalogTab;
  authorLabel?: string;
  mainIngredients: string[];
  mealSection?: string;
  matchPercentage?: number;
  matchCount?: number;
  totalMain?: number;
}

interface MealSlot {
  id: string;
  time: string;
  type: "desayuno" | "almuerzo" | "merienda" | "cena" | "extra";
  label: string;
  mealSection?: string;
  isUserAdded?: boolean;
  recipe?: Recipe;
}

interface AiRecipeOutput {
  slotId: string;
  mealSection: string;
  title: string;
  description: string;
  preparation: string;
  recommendedPortion: string;
  complexity: "simple" | "elaborada";
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  mainIngredients: string[];
  extraIngredients?: string[];
}

interface AiReplacementGuide {
  mealSection: string;
  suggestions: string[];
}

interface AiMetaResponse {
  note: string;
  replacementGuide: AiReplacementGuide[];
}

interface AiDayResponse {
  recipes: AiRecipeOutput[];
  meta: AiMetaResponse;
}

interface AiWeekResponse {
  days: Array<{
    day: string;
    recipes: AiRecipeOutput[];
  }>;
  meta: AiMetaResponse;
}

type AiFillScope = "day" | "week";
type AiRecipeStyle = "very-simple" | "simple" | "varied";
type AiTimeStyle = "quick" | "normal";
type SubstituteMealSection = "desayuno" | "almuerzo";

type SubstituteRecipeItem = {
  id: string;
  title: string;
  mealSection?: string;
};

type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type ActivityLevel = "sedentario" | "deportista";

type ProteinSupplement = {
  enabled: boolean;
  gramsPerDay: number;
};

const CHILE_EXCHANGE_PORTION_GUIDE = [
  "Cereales/tuberculos: 1/2 taza cocida o 1 rebanada de pan.",
  "Legumbres: 3/4 taza cocida.",
  "Proteinas: 90-120 g cocidos (tamano palma).",
  "Frutas: 1 unidad mediana o 1 taza picada.",
  "Verduras: 2 tazas crudas o 1 taza cocida.",
  "Grasas: 1 cucharada de aceite o 1/4 palta.",
  "Lacteos: 1 taza leche/yogur o 1 lamina de queso fresco.",
];

const calculateAgeYears = (birthDate?: string) => {
  if (!birthDate) return undefined;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
};

const sanitizeNutritionGoals = (value: any): NutritionGoals | null => {
  if (!value || typeof value !== "object") return null;

  const calories = Number(value.calories);
  const protein = Number(value.protein);
  const carbs = Number(value.carbs);
  const fats = Number(value.fats);

  if ([calories, protein, carbs, fats].some((item) => !Number.isFinite(item) || item <= 0)) {
    return null;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
};

const normalizeString = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getCustomVariablesArray = (patient: any): any[] =>
  Array.isArray(patient?.customVariables) ? patient.customVariables : [];

const findCustomVariable = (customVariables: any[], key: string) => {
  const wantedKey = normalizeString(key);
  return customVariables.find((item) => normalizeString(item?.key || "") === wantedKey);
};

const readCustomVariableNumber = (customVariables: any[], key: string): number | null => {
  const item = findCustomVariable(customVariables, key);
  const parsed = Number(item?.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const readCustomVariableText = (customVariables: any[], key: string): string | null => {
  const item = findCustomVariable(customVariables, key);
  const value = String(item?.value || "").trim();
  return value ? value : null;
};

const getActivityLevel = (patient: any): ActivityLevel | undefined => {
  const customVariables = getCustomVariablesArray(patient);
  const raw = normalizeString(readCustomVariableText(customVariables, "activityLevel") || "");
  if (raw === "sedentario") return "sedentario";
  if (raw === "deportista") return "deportista";
  return undefined;
};

const getGoalsFromPatient = (patient: any): NutritionGoals | null => {
  const customVariables = getCustomVariablesArray(patient);
  const goals = {
    calories: readCustomVariableNumber(customVariables, "targetCalories"),
    protein: readCustomVariableNumber(customVariables, "targetProtein"),
    carbs: readCustomVariableNumber(customVariables, "targetCarbs"),
    fats: readCustomVariableNumber(customVariables, "targetFats"),
  };

  if (!goals.calories || !goals.protein || !goals.carbs || !goals.fats) {
    return sanitizeNutritionGoals(patient?.nutritionGoals);
  }

  return {
    calories: Math.round(goals.calories),
    protein: Math.round(goals.protein),
    carbs: Math.round(goals.carbs),
    fats: Math.round(goals.fats),
  };
};

const getRecommendedProteinRange = (
  weightKg: number | undefined,
  activityLevel: ActivityLevel | undefined,
) => {
  if (!weightKg || weightKg <= 0 || !activityLevel) return null;

  const minMultiplier = activityLevel === "deportista" ? 1.5 : 0.8;
  const maxMultiplier = activityLevel === "deportista" ? 2.5 : 1.0;

  return {
    min: Math.round(weightKg * minMultiplier),
    max: Math.round(weightKg * maxMultiplier),
  };
};

type PlannerView = "daily" | "weekly";

const MOCK_RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Bowl de Pollo y Arroz Primavera",
    description: "Pollo a la plancha con arroz integral y vegetales salteados.",
    complexity: "simple",
    protein: 35,
    calories: 450,
    carbs: 45,
    fats: 12,
    ingredients: ["Pechuga de Pollo", "Arroz", "Zanahoria", "Arvejas"],
    source: "app",
    mainIngredients: ["Pechuga de Pollo", "Arroz"],
    mealSection: "almuerzo",
  },
  {
    id: "r2",
    title: "Risotto de Champi�ones Proteico",
    description: "Arroz cremoso con champi�ones y trozos de pollo marinado.",
    complexity: "elaborada",
    protein: 38,
    calories: 520,
    carbs: 55,
    fats: 15,
    source: "app",
    mainIngredients: ["Arroz", "Pollo"],
    mealSection: "cena",
    ingredients: ["Arroz", "Pollo", "Champi�ones", "Cebolla", "Vino Blanco"],
  },
  {
    id: "r3",
    title: "Tostadas con Huevo y Palta",
    description: "Pan integral tostado con huevo y palta machacada.",
    complexity: "simple",
    protein: 15,
    calories: 320,
    carbs: 25,
    fats: 18,
    ingredients: ["Pan", "Huevo", "Palta"],
    source: "app",
    mainIngredients: ["Pan", "Huevo"],
    mealSection: "desayuno",
  },
];

const SLOT_LIBRARY: Record<number, Omit<MealSlot, "recipe">[]> = {
  3: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-lunch", time: "13:00", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-dinner", time: "21:00", type: "cena", label: "Cena", mealSection: "cena" },
  ],
  4: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-lunch", time: "13:00", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-snack-1", time: "17:00", type: "merienda", label: "Merienda", mealSection: "merienda" },
    { id: "slot-dinner", time: "21:00", type: "cena", label: "Cena", mealSection: "cena" },
  ],
  5: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-snack-1", time: "11:00", type: "merienda", label: "Merienda AM", mealSection: "merienda" },
    { id: "slot-lunch", time: "13:30", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-snack-2", time: "17:30", type: "merienda", label: "Merienda PM", mealSection: "merienda" },
    { id: "slot-dinner", time: "21:00", type: "cena", label: "Cena", mealSection: "cena" },
  ],
  6: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-snack-1", time: "10:30", type: "merienda", label: "Merienda 1", mealSection: "merienda" },
    { id: "slot-lunch", time: "13:30", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-snack-2", time: "16:30", type: "merienda", label: "Merienda 2", mealSection: "merienda" },
    { id: "slot-snack-3", time: "19:00", type: "merienda", label: "Merienda 3", mealSection: "merienda" },
    { id: "slot-dinner", time: "21:30", type: "cena", label: "Cena", mealSection: "cena" },
  ],
};

const DEFAULT_MEAL_COUNT = 3;

const DEFAULT_SLOTS: MealSlot[] = SLOT_LIBRARY[DEFAULT_MEAL_COUNT].map((slot) => ({
  ...slot,
  recipe: undefined,
}));

const RECIPE_MEAL_SECTIONS = [
  { value: "", label: "Todos" },
  ...mealSectionsData,
];

const UNIQUE_MEAL_SECTIONS = new Set(["desayuno", "almuerzo", "once", "cena"]);
const MANUAL_SLOT_ID_PATTERN = /^slot-[a-z-]+-\d+$/;
const DEFAULT_RECIPE_IMAGES: Record<string, string> = {
  desayuno:
    "https://www.paulinacocina.net/wp-content/uploads/2025/07/desayuno-americano-con-hot-cakes-1753957224.jpg",
  almuerzo:
    "https://aratiendas.com/wp-content/uploads/2024/02/shutterstock_1178196637-1024x683.webp",
  cena:
    "https://www.recetasnestle.cl/sites/default/files/2022-09/enrollado-de-vegetales-idea-de-cena-rapida.jpg",
  once:
    "https://cloudfront-us-east-1.images.arcpublishing.com/copesa/PQ5OFRF55NDKHIHKZ3M7KVEWTQ.jpg",
  merienda:
    "https://saposyprincesas.elmundo.es/assets/2019/05/merienda-saludable-destacada.jpg",
  otro: "https://www.ecured.cu/images/3/39/Alimento.jpg",
};

const WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Mi�rcoles",
  "Jueves",
  "Viernes",
  "S�bado",
  "Domingo",
];

const createCycleDayLabels = (count: number) => {
  const safeCount = Math.max(1, Math.min(7, count));
  if (safeCount === 7) return [...WEEKDAY_LABELS];
  return Array.from({ length: safeCount }, (_, i) => `D�a ${i + 1}`);
};

export default function RecipesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const { role } = useAdmin();
  const { setSidebarCollapsed, flashSidebarToggle, isSidebarCollapsed } =
    useDashboardShell();
  const hasCollapsedSidebarForRecipesRef = useRef(false);

  // -- State --
  const [mealCount, setMealCount] = useState(DEFAULT_MEAL_COUNT);
  const [plannerView, setPlannerView] = useState<PlannerView>("daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [draggedRecipeId, setDraggedRecipeId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [slotTimeDrafts, setSlotTimeDrafts] = useState<Record<string, string>>(
    {},
  );
  const [sourceFoods, setSourceFoods] = useState<string[]>([]);
  const [recipeLibrary, setRecipeLibrary] = useState<Recipe[]>([]);
  const [compatibleRecipeIds, setCompatibleRecipeIds] = useState<string[]>([]);
  const [recipeModalTab, setRecipeModalTab] = useState<RecipeCatalogTab>("mine");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeMealSectionFilter, setRecipeMealSectionFilter] = useState("");
  const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false);
  const [showMatchingOnly, setShowMatchingOnly] = useState(true);
  const [showOnlyAddedRecipes, setShowOnlyAddedRecipes] = useState(false);
  const [recipeLibraryPage, setRecipeLibraryPage] = useState(1);
  const [isLoadingRecipeLibrary, setIsLoadingRecipeLibrary] = useState(false);

  // Day Management
  const [cycleDayCount, setCycleDayCount] = useState(7);
  const days = useMemo(() => createCycleDayLabels(cycleDayCount), [cycleDayCount]);
  const [currentDay, setCurrentDay] = useState(createCycleDayLabels(7)[0]);

  // Week Slots State: Stores slots for each day independently
  const [weekSlots, setWeekSlots] = useState<Record<string, MealSlot[]>>(() => {
    const initial: Record<string, MealSlot[]> = {};
    createCycleDayLabels(7).forEach((day) => {
      // Clone default slots to avoid reference issues
      initial[day] = JSON.parse(JSON.stringify(DEFAULT_SLOTS));
    });
    return initial;
  });

  // Helper to get current slots
  const currentSlots = weekSlots[currentDay] || [];

  // Setter wrapper
  const setCurrentSlots = (
    newSlots: MealSlot[] | ((prev: MealSlot[]) => MealSlot[]),
  ) => {
    setWeekSlots((prev) => ({
      ...prev,
      [currentDay]:
        typeof newSlots === "function" ? newSlots(prev[currentDay]) : newSlots,
    }));
  };

  // Chronobiology State
  const [wakeUpTime, setWakeUpTime] = useState("07:30");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [patientInfo, setPatientInfo] = useState<any>({ name: "Juan P�rez" });

  // Nutritional Targets (Editable)
  const [targetProtein, setTargetProtein] = useState(180);
  const [targetCalories, setTargetCalories] = useState(2400);
  const [targetCarbs, setTargetCarbs] = useState(250);
  const [targetFats, setTargetFats] = useState(70);
  const [proteinSupplement, setProteinSupplement] = useState<ProteinSupplement>({
    enabled: false,
    gramsPerDay: 25,
  });

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showQuickMealModal, setShowQuickMealModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [editingMealBlockId, setEditingMealBlockId] = useState<string | null>(null);
  const [previewRecipeId, setPreviewRecipeId] = useState<string | null>(null);
  const [showAiFillModal, setShowAiFillModal] = useState(false);
  const [aiFillScope, setAiFillScope] = useState<AiFillScope>("day");
  const [aiNutritionistNotes, setAiNutritionistNotes] = useState("");
  const [aiRecipeStyle, setAiRecipeStyle] = useState<AiRecipeStyle>("very-simple");
  const [aiTimeStyle, setAiTimeStyle] = useState<AiTimeStyle>("quick");
  const [aiSnackFlexAllowed, setAiSnackFlexAllowed] = useState(true);
  const [recipeGuideNote, setRecipeGuideNote] = useState("");
  const [replacementGuide, setReplacementGuide] = useState<AiReplacementGuide[]>([]);
  const [adviseMealRepetition, setAdviseMealRepetition] = useState(false);
  const [enableSubstituteRecipes, setEnableSubstituteRecipes] = useState(false);
  const [substituteRecipesBySection, setSubstituteRecipesBySection] = useState<
    Record<SubstituteMealSection, SubstituteRecipeItem[]>
  >({
    desayuno: [],
    almuerzo: [],
  });
  const [activeSwapSlot, setActiveSwapSlot] = useState<string | null>(null);
  const [activeSlotDay, setActiveSlotDay] = useState<string | null>(null);
  const [quickMealTarget, setQuickMealTarget] = useState<{
    day: string;
    slotId: string;
  } | null>(null);
  const [quickMealDraft, setQuickMealDraft] = useState({
    title: "",
    description: "",
    recommendedPortion: "",
    preparation: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // -- Import Patient Modal State --
  const [isImportPatientModalOpen, setIsImportPatientModalOpen] =
    useState(false);
  const [isEditingPatientGoals, setIsEditingPatientGoals] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  // -- Source and AI Generation Specs --
  const [hasSourceData, setHasSourceData] = useState(false);
  const [sourceModules, setSourceModules] = useState({
    diet: false,
    cart: false,
  });
  const isRecipesLocked = !hasSourceData;

  // -- Draft Restore Modal --
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftMeta, setDraftMeta] = useState<{ label: string; date?: string }>({ label: "" });

  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    projectIdFromUrl,
  );
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(
    null,
  );
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(
    null,
  );
  const [isRecipesHydrated, setIsRecipesHydrated] = useState(false);

  useEffect(() => {
    setCurrentProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (hasCollapsedSidebarForRecipesRef.current) {
      return;
    }

    hasCollapsedSidebarForRecipesRef.current = true;
    if (!isSidebarCollapsed) {
      setSidebarCollapsed(true);
    }
    flashSidebarToggle();
  }, [
    flashSidebarToggle,
    isSidebarCollapsed,
    setSidebarCollapsed,
  ]);

  const buildRecipeIngredientHints = (
    slotsByDay: Record<string, MealSlot[]>,
  ): Array<{ name: string; weeklyHits: number }> => {
    const counter = new Map<string, number>();
    Object.values(slotsByDay).forEach((slots) => {
      slots.forEach((slot) => {
        slot.recipe?.ingredients?.forEach((ingredientName) => {
          const key = ingredientName.toLowerCase().trim();
          counter.set(key, (counter.get(key) || 0) + 1);
        });
      });
    });
    return Array.from(counter.entries()).map(([name, weeklyHits]) => ({
      name,
      weeklyHits,
    }));
  };

  const buildExtraIngredientsFromAi = (
    slotsByDay: Record<string, MealSlot[]>,
  ): Array<{ name: string; weeklyHits: number }> => {
    const counter = new Map<string, number>();
    Object.values(slotsByDay).forEach((slots) => {
      slots.forEach((slot) => {
        (slot.recipe?.extraIngredients || []).forEach((ingredientName) => {
          const key = ingredientName.trim();
          if (!key) return;
          counter.set(key, (counter.get(key) || 0) + 1);
        });
      });
    });
    return Array.from(counter.entries()).map(([name, weeklyHits]) => ({
      name,
      weeklyHits,
    }));
  };

  const normalizeMealSlot = (slot: MealSlot): MealSlot => ({
    ...slot,
    isUserAdded:
      typeof slot.isUserAdded === "boolean"
        ? slot.isUserAdded
        : MANUAL_SLOT_ID_PATTERN.test(slot.id),
  });

  const normalizeWeekSlots = (
    slotsByDay: Record<string, MealSlot[]>,
    dayLabels: string[],
  ) => {
    const normalized: Record<string, MealSlot[]> = {};

    dayLabels.forEach((day) => {
      normalized[day] = (slotsByDay[day] || []).map(normalizeMealSlot);
    });

    return normalized;
  };

  const getStructureTemplate = (slots: MealSlot[]) =>
    slots.map(({ id, time, type, label, mealSection, isUserAdded }) => ({
      id,
      time,
      type,
      label,
      mealSection,
      isUserAdded,
    }));

  const classifyRecipeSource = (recipe: RecipeApiSummary): RecipeCatalogTab => {
    if (recipe.isMine) {
      return "mine";
    }

    return recipe.nutritionist?.fullName ? "community" : "app";
  };

  const mapRecipeSummaryToRecipe = (recipe: RecipeApiSummary): Recipe => {
    const ingredientNames = (recipe.ingredients || []).map(
      (item) => item.ingredient.name,
    );
    const mainIngredients = (recipe.ingredients || [])
      .filter((item) => item.isMain)
      .map((item) => item.ingredient.name);

    return {
      id: recipe.id,
      title: recipe.name,
      description:
        recipe.description ||
        recipe.preparation ||
        "Plato disponible para asignar a este bloque.",
      preparation: recipe.preparation || undefined,
      complexity:
        ingredientNames.length > 6 || (recipe.preparation || "").length > 180
          ? "elaborada"
          : "simple",
      protein: recipe.proteins || 0,
      calories: recipe.calories || 0,
      carbs: recipe.carbs || 0,
      fats: recipe.lipids || 0,
      ingredients: ingredientNames,
      source: classifyRecipeSource(recipe),
      authorLabel: recipe.nutritionist?.fullName || undefined,
      mainIngredients,
      mealSection: recipe.metadata?.mealSection || undefined,
      matchPercentage: recipe.matchPercentage,
      matchCount: recipe.matchCount,
      totalMain: recipe.totalMain,
    };
  };

  const applyStructureToWeek = (
    structure: Omit<MealSlot, "recipe">[],
    previousWeek: Record<string, MealSlot[]>,
  ) => {
    const nextWeek: Record<string, MealSlot[]> = {};

    days.forEach((day) => {
      const previousById = new Map(
        (previousWeek[day] || []).map((slot) => [slot.id, slot]),
      );

      nextWeek[day] = structure.map((slot) => ({
        ...slot,
        recipe: previousById.get(slot.id)?.recipe,
      }));
    });

    return nextWeek;
  };

  const extractSourceFoods = (draft: Record<string, any>) => {
    const collected = new Set<string>();

    const visit = (value: any) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      if (typeof value === "object") {
        if (typeof value.producto === "string") {
          collected.add(value.producto);
        }
        if (typeof value.name === "string") {
          collected.add(value.name);
        }
        Object.values(value).forEach(visit);
      }
    };

    visit(draft.diet);

    return Array.from(collected);
  };

  const getSourceModules = (draft: Record<string, any>) => ({
    diet: Boolean(draft?.diet),
    cart: false,
  });

  const syncSourceFoods = (draft: Record<string, any>) => {
    const nextSourceModules = getSourceModules(draft);
    const nextSourceFoods = extractSourceFoods(draft);
    setHasSourceData(nextSourceModules.diet && nextSourceFoods.length > 0);
    setSourceModules(nextSourceModules);
    setSourceFoods(nextSourceFoods);
  };

  const loadRecipeLibrary = async () => {
    if (!hasSourceData) {
      setRecipeLibrary([]);
      setCompatibleRecipeIds([]);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setRecipeLibrary([]);
      setCompatibleRecipeIds([]);
      return;
    }

    setIsLoadingRecipeLibrary(true);
    try {
      const recipesRequest = fetchApi("/recipes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const compatibleRequest =
        sourceFoods.length > 0
          ? fetchApi("/recipes/compatible", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ingredientNames: sourceFoods }),
          })
          : null;

      const [recipesResponse, compatibleResponse] = await Promise.all([
        recipesRequest,
        compatibleRequest,
      ]);

      const allRecipes = recipesResponse.ok
        ? ((await recipesResponse.json()) as RecipeApiSummary[])
        : [];
      const compatibleRecipes =
        compatibleResponse && compatibleResponse.ok
          ? ((await compatibleResponse.json()) as RecipeApiSummary[])
          : [];

      setRecipeLibrary(allRecipes.map(mapRecipeSummaryToRecipe));
      setCompatibleRecipeIds(compatibleRecipes.map((recipe) => recipe.id));
    } catch (error) {
      console.error("Error loading recipe library", error);
      toast.error("No se pudieron cargar los platos disponibles.");
    } finally {
      setIsLoadingRecipeLibrary(false);
    }
  };

  const filteredRecipeLibrary = useMemo(() => {
    const normalizedSearch = recipeSearch.trim().toLowerCase();
    const addedRecipeIds = new Set(
      days.flatMap((day) =>
        (weekSlots[day] || [])
          .map((slot) => slot.recipe?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    return recipeLibrary.filter((recipe) => {
      if (showOnlyMyRecipes && recipe.source !== "mine") {
        return false;
      }
      if (showOnlyAddedRecipes && !addedRecipeIds.has(recipe.id)) {
        return false;
      }

      if (
        recipeMealSectionFilter &&
        recipe.mealSection !== recipeMealSectionFilter
      ) {
        return false;
      }

      if (showMatchingOnly && !compatibleRecipeIds.includes(recipe.id)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        recipe.title,
        recipe.description,
        ...recipe.ingredients,
        ...recipe.mainIngredients,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [
    compatibleRecipeIds,
    days,
    recipeLibrary,
    recipeMealSectionFilter,
    recipeSearch,
    showOnlyMyRecipes,
    showOnlyAddedRecipes,
    showMatchingOnly,
    weekSlots,
  ]);

  const RECIPE_LIBRARY_PAGE_SIZE = 2;

  const recipeLibraryTotalPages = Math.max(
    1,
    Math.ceil(filteredRecipeLibrary.length / RECIPE_LIBRARY_PAGE_SIZE),
  );

  const paginatedRecipeLibrary = useMemo(() => {
    const start = (recipeLibraryPage - 1) * RECIPE_LIBRARY_PAGE_SIZE;
    return filteredRecipeLibrary.slice(
      start,
      start + RECIPE_LIBRARY_PAGE_SIZE,
    );
  }, [filteredRecipeLibrary, recipeLibraryPage]);

  useEffect(() => {
    setRecipeLibraryPage(1);
  }, [recipeSearch, recipeMealSectionFilter, showOnlyMyRecipes, showOnlyAddedRecipes, showMatchingOnly]);

  useEffect(() => {
    if (recipeLibraryPage > recipeLibraryTotalPages) {
      setRecipeLibraryPage(recipeLibraryTotalPages);
    }
  }, [recipeLibraryPage, recipeLibraryTotalPages]);

  const recipeTabCounts = useMemo(
    () => ({
      mine: recipeLibrary.filter((recipe) => recipe.source === "mine").length,
      community: recipeLibrary.filter((recipe) => recipe.source === "community")
        .length,
      app: recipeLibrary.filter((recipe) => recipe.source === "app").length,
    }),
    [recipeLibrary],
  );

  useEffect(() => {
    if (!hasSourceData) {
      setRecipeLibrary([]);
      setCompatibleRecipeIds([]);
      return;
    }

    loadRecipeLibrary();
  }, [hasSourceData, sourceFoods]);

  useEffect(() => {
    if (recipeLibrary.length === 0) {
      return;
    }

    const hasCurrentTabRecipes = recipeLibrary.some(
      (recipe) => recipe.source === recipeModalTab,
    );

    if (hasCurrentTabRecipes) {
      return;
    }

    const nextTab =
      (["mine", "community", "app"] as RecipeCatalogTab[]).find((tab) =>
        recipeLibrary.some((recipe) => recipe.source === tab),
      ) || "mine";

    setRecipeModalTab(nextTab);
  }, [recipeLibrary, recipeModalTab]);

  const readWorkflowDraft = () => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (!storedDraft) return {} as Record<string, any>;

    try {
      return JSON.parse(storedDraft);
    } catch (error) {
      console.error("Error parsing workflow draft", error);
      return {} as Record<string, any>;
    }
  };

  const buildPatientMeta = (patient: any) =>
    patient
      ? {
        id: patient.id,
        fullName: patient.fullName,
        restrictions: patient.dietRestrictions || [],
        weight: patient.weight,
        height: patient.height,
        gender: patient.gender,
        birthDate: patient.birthDate,
        nutritionalFocus: patient.nutritionalFocus,
        fitnessGoals: patient.fitnessGoals,
        activityLevel: getActivityLevel(patient),
        nutritionGoals: getGoalsFromPatient(patient),
        patientData: patient,
        updatedAt: new Date().toISOString(),
      }
      : undefined;

  const buildRecipesModule = () => ({
    plannerView,
    cycleDayCount,
    mealCount,
    weekSlots,
    targets: {
      protein: targetProtein,
      calories: targetCalories,
      carbs: targetCarbs,
      fats: targetFats,
    },
    chronobiology: {
      wakeUpTime,
      sleepTime,
    },
    aiGuidance: {
      note: recipeGuideNote,
      replacementGuide,
    },
    patientAdvisories: {
      allowMealRepetition: adviseMealRepetition,
    },
    substituteRecipes: {
      enabled: enableSubstituteRecipes,
      bySection: substituteRecipesBySection,
    },
    proteinSupplement,
    ingredientHints: buildRecipeIngredientHints(weekSlots),
    extraIngredientsFromAI: buildExtraIngredientsFromAi(weekSlots),
    updatedAt: new Date().toISOString(),
  });

  const applyRecipesContent = (content: any) => {
    if (!content) return;

    const resolvedCycleDayCount = (() => {
      if (typeof content.cycleDayCount === "number") {
        return Math.max(1, Math.min(7, Math.round(content.cycleDayCount)));
      }
      if (content.weekSlots && typeof content.weekSlots === "object") {
        const inferredCount = Object.keys(content.weekSlots).length;
        if (inferredCount > 0) {
          return Math.max(1, Math.min(7, inferredCount));
        }
      }
      return cycleDayCount;
    })();
    const resolvedDayLabels = createCycleDayLabels(resolvedCycleDayCount);
    const nextCurrentDay = resolvedDayLabels.includes(currentDay)
      ? currentDay
      : resolvedDayLabels[0];

    if (content.plannerView === "daily" || content.plannerView === "weekly") {
      setPlannerView(content.plannerView);
    }
    setCycleDayCount(resolvedCycleDayCount);
    setCurrentDay(nextCurrentDay);
    if (typeof content.mealCount === "number") {
      setMealCount(content.mealCount);
    }
    if (content.weekSlots) {
      const normalizedWeekSlots = normalizeWeekSlots(
        content.weekSlots,
        resolvedDayLabels,
      );
      setWeekSlots(normalizedWeekSlots);
      const firstDaySlots = normalizedWeekSlots[resolvedDayLabels[0]];
      if (Array.isArray(firstDaySlots) && firstDaySlots.length >= 3) {
        setMealCount(firstDaySlots.length);
      }
    }
    if (content.targets) {
      setTargetProtein(content.targets.protein || 0);
      setTargetCalories(content.targets.calories || 0);
      setTargetCarbs(content.targets.carbs || 0);
      setTargetFats(content.targets.fats || 0);
    }
    if (content.chronobiology) {
      setWakeUpTime(content.chronobiology.wakeUpTime);
      setSleepTime(content.chronobiology.sleepTime);
    }
    if (content.aiGuidance) {
      setRecipeGuideNote(content.aiGuidance.note || "");
      setReplacementGuide(content.aiGuidance.replacementGuide || []);
    }
    if (content.patientAdvisories) {
      setAdviseMealRepetition(Boolean(content.patientAdvisories.allowMealRepetition));
    }
    if (content.substituteRecipes) {
      setEnableSubstituteRecipes(Boolean(content.substituteRecipes.enabled));
      const incoming = content.substituteRecipes.bySection || {};
      setSubstituteRecipesBySection({
        desayuno: Array.isArray(incoming.desayuno) ? incoming.desayuno : [],
        almuerzo: Array.isArray(incoming.almuerzo) ? incoming.almuerzo : [],
      });
    }
    if (content.proteinSupplement) {
      setProteinSupplement({
        enabled: Boolean(content.proteinSupplement.enabled),
        gramsPerDay: Math.max(0, Math.round(Number(content.proteinSupplement.gramsPerDay) || 0)),
      });
    }
  };

  // -- Persistence: Draft Load/Save --
  useEffect(() => {
    if (projectIdFromUrl) {
      return;
    }

    const storedDraft = localStorage.getItem("nutri_active_draft");
    const alreadyDecided = sessionStorage.getItem("nutri_recipes_draft_decided");

    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        // Check if we have a diet to work with
        if (draft.diet) {
          syncSourceFoods(draft);
        }

        if (draft.recipes && draft.recipes.weekSlots && !alreadyDecided) {
          setDraftMeta({
            label: `Recetas: plan semanal guardado`,
            date: draft.recipes.updatedAt,
          });
          setShowDraftModal(true);
          // Load patient anyway
          const storedPatient = localStorage.getItem("nutri_patient");
          if (storedPatient) {
            try { setSelectedPatient(JSON.parse(storedPatient)); } catch (_) { }
          }
          setIsRecipesHydrated(true);
          return;
        }

        if (draft.recipes) {
          applyRecipesContent(draft.recipes);
        }
      } catch (e) {
        console.error("Error loading recipes draft", e);
      }
    }

    // Load stored patient
    const storedPatient = localStorage.getItem("nutri_patient");
    if (storedPatient) {
      try {
        setSelectedPatient(JSON.parse(storedPatient));
      } catch (e) {
        console.error("Failed to parse stored patient", e);
      }
    }
    setIsRecipesHydrated(true);
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (!projectIdFromUrl) return;

    const loadProjectContext = async () => {
      try {
        const project = await fetchProject(projectIdFromUrl);
        setCurrentProjectId(project.id);
        setCurrentProjectName(project.name);
        setCurrentProjectMode(project.mode);

        if (project.patient) {
          setSelectedPatient(project.patient);
          localStorage.setItem("nutri_patient", JSON.stringify(project.patient));
        }

        const nextDraft = readWorkflowDraft();

        if (project.patient) {
          nextDraft.patientMeta = buildPatientMeta(project.patient);
        }

        const [dietCreation, cartCreation, recipeCreation] = await Promise.all([
          project.activeDietCreationId
            ? fetchCreation(project.activeDietCreationId)
            : Promise.resolve(null),
          project.activeCartCreationId
            ? fetchCreation(project.activeCartCreationId)
            : Promise.resolve(null),
          project.activeRecipeCreationId
            ? fetchCreation(project.activeRecipeCreationId)
            : Promise.resolve(null),
        ]);

        const hasLocalDietDraft = Boolean(nextDraft?.diet);
        const hasLocalCartDraft = Boolean(nextDraft?.cart);
        const hasLocalRecipesDraft = Boolean(
          nextDraft?.recipes?.updatedAt ||
          nextDraft?.recipes?.weekSlots ||
          nextDraft?.recipes?.mealCount,
        );

        if (dietCreation?.content && !hasLocalDietDraft) {
          nextDraft.diet = dietCreation.content;
        }

        if (cartCreation?.content && !hasLocalCartDraft) {
          nextDraft.cart = cartCreation.content;
        }

        if (hasLocalRecipesDraft && nextDraft?.recipes) {
          applyRecipesContent(nextDraft.recipes);
        } else if (recipeCreation?.content && !hasLocalRecipesDraft) {
          nextDraft.recipes = recipeCreation.content;
          applyRecipesContent(recipeCreation.content);
        }

        localStorage.setItem("nutri_active_draft", JSON.stringify(nextDraft));
        syncSourceFoods(nextDraft);
      } catch (error) {
        console.error("Error loading project recipes context", error);
        toast.error("No se pudo cargar el proyecto en Recetas.");
      } finally {
        setIsRecipesHydrated(true);
      }
    };

    loadProjectContext();
  }, [projectIdFromUrl]);

  // Auto-save to draft on changes
  useEffect(() => {
    if (!isRecipesHydrated) return;
    const draft = readWorkflowDraft();
    draft.recipes = buildRecipesModule();

    if (selectedPatient) {
      draft.patientMeta = buildPatientMeta(selectedPatient);
    }

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
  }, [
    isRecipesHydrated,
    plannerView,
    cycleDayCount,
    mealCount,
    weekSlots,
    targetProtein,
    targetCalories,
    targetCarbs,
    targetFats,
    wakeUpTime,
    sleepTime,
    recipeGuideNote,
    replacementGuide,
    adviseMealRepetition,
    enableSubstituteRecipes,
    substituteRecipesBySection,
    proteinSupplement,
    selectedPatient,
  ]);

  useEffect(() => {
    redistributeMealTimes();
  }, [wakeUpTime, sleepTime, mealCount]);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const token = getAuthToken();
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
    const patientGoals = getGoalsFromPatient(patient);
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
      activityLevel: getActivityLevel(patient),
      nutritionGoals: getGoalsFromPatient(patient),
      patientData: patient,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

    if (patientGoals) {
      setTargetCalories(patientGoals.calories);
      setTargetProtein(patientGoals.protein);
      setTargetCarbs(patientGoals.carbs);
      setTargetFats(patientGoals.fats);
    }

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
    toast.info("Paciente desvinculado de esta sesi�n");
  };

  const normalizeAiValue = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const extractAllowedFoodsByDiet = (draft: Record<string, any>) => {
    const dietFoods = [
      ...(Array.isArray(draft.diet?.includedFoods) ? draft.diet.includedFoods : []),
      ...(Array.isArray(draft.diet?.foods) ? draft.diet.foods : []),
    ];

    const names = dietFoods
      .map((food: any) => food?.producto || food?.name || "")
      .filter(Boolean);

    return Array.from(new Set(names.length > 0 ? names : sourceFoods));
  };

  const extractFavoriteFoodsFromDraft = (draft: Record<string, any>) =>
    Object.entries(draft.diet?.foodStatus || {})
      .filter(([, status]) => status === "favorite")
      .map(([foodName]) => foodName);

  const getEmptySlotsForScope = (scope: AiFillScope) => {
    if (scope === "day") {
      return (weekSlots[currentDay] || []).filter((slot) => !slot.recipe);
    }

    return days.flatMap((day) =>
      (weekSlots[day] || [])
        .filter((slot) => !slot.recipe)
        .map((slot) => ({ ...slot, __day: day })),
    );
  };

  const buildExistingAssignments = (scope: AiFillScope) =>
    days.flatMap((day) =>
      (weekSlots[day] || [])
        .filter((slot) => slot.recipe)
        .filter((slot) => (scope === "day" ? day === currentDay : true))
        .map((slot) => ({
          day,
          slotId: slot.id,
          mealSection: slot.mealSection || slot.type,
          title: slot.recipe?.title || "",
          mainIngredients: slot.recipe?.mainIngredients || [],
        })),
    );

  const mapAiRecipeToRecipe = (recipe: AiRecipeOutput): Recipe => ({
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `ai-${recipe.slotId}-${crypto.randomUUID()}`
        : `ai-${recipe.slotId}-${Date.now()}`,
    title: recipe.title,
    description: recipe.description,
    preparation: recipe.preparation,
    recommendedPortion: recipe.recommendedPortion,
    complexity: recipe.complexity,
    protein: recipe.protein,
    calories: recipe.calories,
    carbs: recipe.carbs,
    fats: recipe.fats,
    ingredients: recipe.ingredients,
    mainIngredients: recipe.mainIngredients,
    extraIngredients: recipe.extraIngredients || [],
    mealSection: recipe.mealSection,
    source: "app",
  });

  const applyAiFillResponse = (
    scope: AiFillScope,
    response: AiDayResponse | AiWeekResponse,
  ) => {
    setRecipeGuideNote(response.meta?.note || "");
    setReplacementGuide(response.meta?.replacementGuide || []);

    setWeekSlots((prev) => {
      const next = { ...prev };

      if (scope === "day" && "recipes" in response) {
        next[currentDay] = (next[currentDay] || []).map((slot) => {
          const incomingRecipe = response.recipes.find(
            (recipe) => recipe.slotId === slot.id,
          );
          if (!incomingRecipe || slot.recipe) return slot;

          return { ...slot, recipe: mapAiRecipeToRecipe(incomingRecipe) };
        });
        return next;
      }

      if ("days" in response) {
        response.days.forEach((dayBlock) => {
          next[dayBlock.day] = (next[dayBlock.day] || []).map((slot) => {
            const incomingRecipe = dayBlock.recipes.find(
              (recipe) => recipe.slotId === slot.id,
            );
            if (!incomingRecipe || slot.recipe) return slot;

            return { ...slot, recipe: mapAiRecipeToRecipe(incomingRecipe) };
          });
        });
      }

      return next;
    });
  };

  const buildAiFillPayload = (scope: AiFillScope) => {
    const draft = readWorkflowDraft();
    const patientMeta = draft.patientMeta || {};
    const patientRestrictions = Array.isArray(draft.patientMeta?.restrictions)
      ? draft.patientMeta.restrictions
      : [];
    const dietRestrictions = Array.isArray(draft.diet?.activeConstraints)
      ? draft.diet.activeConstraints
      : [];
    const restrictions = Array.from(
      new Set([...patientRestrictions, ...dietRestrictions].filter(Boolean)),
    );

    const supplementProtein = proteinSupplement.enabled
      ? Math.max(0, Math.round(proteinSupplement.gramsPerDay || 0))
      : 0;
    const adjustedTargetProtein = Math.max(
      0,
      Math.round((targetProtein || 0) - supplementProtein),
    );
    const draftPatientGoals = sanitizeNutritionGoals(patientMeta?.nutritionGoals);
    const resolvedPatientGoals = getGoalsFromPatient(selectedPatient) || draftPatientGoals;
    const adjustedPatientGoals = resolvedPatientGoals
      ? {
        ...resolvedPatientGoals,
        protein: Math.max(0, resolvedPatientGoals.protein - supplementProtein),
      }
      : undefined;

    return {
      scope,
      payload: {
        scope,
        targets: {
          calories: Math.round(targetCalories || 0),
          protein: adjustedTargetProtein,
          carbs: Math.round(targetCarbs || 0),
          fats: Math.round(targetFats || 0),
        },
        dietRestrictions: restrictions,
        preferredFoods: extractFavoriteFoodsFromDraft(draft),
        allowedFoodsByDiet: extractAllowedFoodsByDiet(draft),
        chileExchangePortionGuide: CHILE_EXCHANGE_PORTION_GUIDE,
        patientProfile: patientMeta?.fullName
          ? {
            fullName: patientMeta.fullName,
            ageYears: calculateAgeYears(patientMeta.birthDate),
            gender: patientMeta.gender || undefined,
            weightKg:
              typeof patientMeta.weight === "number" ? patientMeta.weight : undefined,
            heightCm:
              typeof patientMeta.height === "number" ? patientMeta.height : undefined,
            nutritionalFocus: patientMeta.nutritionalFocus || undefined,
            fitnessGoals: patientMeta.fitnessGoals || undefined,
            activityLevel:
              patientMeta.activityLevel === "sedentario" ||
                patientMeta.activityLevel === "deportista"
                ? patientMeta.activityLevel
                : undefined,
            restrictions: Array.isArray(patientMeta.restrictions)
              ? patientMeta.restrictions.filter(Boolean)
              : [],
          }
          : undefined,
        patientGoals: adjustedPatientGoals,
        proteinSupplement: {
          enabled: proteinSupplement.enabled,
          gramsPerDay: supplementProtein,
        },
        generalSnackFlexAllowed: aiSnackFlexAllowed,
        rules: {
          strictDietFoodsForMainMeals: true,
          allowSimpleSnackProductsOutsideDiet: aiSnackFlexAllowed,
          maxMainIngredients:
            aiRecipeStyle === "very-simple" ? 3 : aiRecipeStyle === "simple" ? 4 : 5,
          preferSimpleRecipes: aiRecipeStyle !== "varied",
          preferCommonHouseholdMeals: true,
          fillOnlyEmptySlots: true,
        },
        ...(scope === "day"
          ? {
            day: currentDay,
            slots: (weekSlots[currentDay] || [])
              .filter((slot) => !slot.recipe)
              .map((slot) => ({
                slotId: slot.id,
                time: slot.time,
                mealSection: slot.mealSection || slot.type,
                label: slot.label,
                isEmpty: !slot.recipe,
              })),
          }
          : {
            days: days.map((day) => ({
              day,
              slots: (weekSlots[day] || [])
                .filter((slot) => !slot.recipe)
                .map((slot) => ({
                  slotId: slot.id,
                  time: slot.time,
                  mealSection: slot.mealSection || slot.type,
                  label: slot.label,
                  isEmpty: !slot.recipe,
                })),
            })),
          }),
        existingAssignments: buildExistingAssignments(scope),
        recipeStyle: aiRecipeStyle,
        timeStyle: aiTimeStyle,
      },
    };
  };

  const handleSubmitAiFillLegacy = async () => {
    const payload = buildAiFillPayload(aiFillScope);
    const systemPrompt = [
      "Tu tarea: completar bloques de comida faltantes.",
      "Usa solo alimentos de DIETA para desayuno, almuerzo, once y cena.",
      "Para bloques variables como merienda o extra puedes usar opciones simples fuera de DIETA si la regla lo permite.",
      "No cuentes sal, condimentos ni b�sicos de cocci�n.",
      "Toma como base principal allowedFoodsByDiet y nutritionistNotes.",
      "Usa chileExchangePortionGuide como referencia para porciones de intercambio en Chile.",
      "Si existe patientProfile, ajusta porciones y complejidad seg�n edad y caracter�sticas del paciente.",
      "Si existe patientGoals, prioriza cumplir metas de calorias/macros para el alcance solicitado (dia o semana).",
      "Prioriza alimentos y combinaciones comunes y faciles de conseguir en Chile (ferias y supermercados).",
      "Respeta restricciones alimentarias.",
      "Prefiere platos comunes, caseros, realistas, simples y con pocos ingredientes.",
      "Evita repetir platos ya usados o muy parecidos.",
      "Devuelve solo JSON v�lido. Sin explicaci�n.",
      "Cada receta debe incluir: slotId, mealSection, title, description, preparation, recommendedPortion, complexity, protein, calories, carbs, fats, ingredients, mainIngredients, extraIngredients.",
      "extraIngredients: ingredientes fuera de allowedFoodsByDiet. Si no hay, [].",
      "description: 1 frase.",
      "preparation: breve, clara, 2 a 4 pasos.",
      "complexity: simple o elaborada.",
      "Agrega tambi�n meta.note y meta.replacementGuide.",
    ].join("\n");

    const scopePrompt =
      aiFillScope === "day"
        ? [
          "Completa solo los bloques vac�os del d�a indicado.",
          "No modifiques bloques ya completos.",
          'Devuelve JSON con forma {"recipes":[...],"meta":{"note":"string","replacementGuide":[{"mealSection":"string","suggestions":["string"]}]}}',
        ].join("\n")
        : [
          "Completa solo los bloques vac�os de la semana.",
          "No modifiques bloques ya completos.",
          "Mant�n variedad durante la semana.",
          "Evita repetir el mismo plato en d�as consecutivos.",
          'Devuelve JSON con forma {"days":[{"day":"string","recipes":[...]}],"meta":{"note":"string","replacementGuide":[{"mealSection":"string","suggestions":["string"]}]}}',
        ].join("\n");

    const userPrompt = `${scopePrompt}\n${JSON.stringify(payload.payload)}`;

    console.group("AI FILL PROMPT PREVIEW");
    console.log("SYSTEM PROMPT");
    console.log(systemPrompt);
    console.log("USER PROMPT");
    console.log(userPrompt);
    console.log("REQUEST PAYLOAD");
    console.log(payload);
    console.groupEnd();

    toast.info("Prompt de IA impreso en consola.", {
      description: "Revisa SYSTEM PROMPT y USER PROMPT en las herramientas de desarrollador.",
    });

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowAiFillModal(false);
    }, 1000);
  };

  // AI Generation Simulation
  const handleGenerateAILegacy = (mode: "day" | "week" = "day") => {
    if (!hasSourceData) {
      toast.error("Falta una dieta base", {
        description: "Debes importar una dieta con alimentos antes de usar Recetas y porciones.",
      });
      return;
    }

    if (getEmptySlotsForScope(mode).length === 0) {
      toast.info("No hay bloques vac�os para rellenar.");
      return;
    }

    setAiFillScope(mode);
    setShowAiFillModal(true);
    return;

    if (!hasSourceData) {
      toast.error("Falta una dieta base", {
        description: "Debes importar una dieta con alimentos antes de usar Recetas y porciones.",
      });
      return;
    }

    const candidateRecipes = (recipeLibrary.length > 0
      ? recipeLibrary
      : MOCK_RECIPES
    ).filter((recipe) =>
      compatibleRecipeIds.length > 0
        ? compatibleRecipeIds.includes(recipe.id)
        : true,
    );

    if (candidateRecipes.length === 0) {
      toast.error("No hay platos compatibles todav�a.", {
        description:
          "Primero crea o comparte platos con ingredientes principales que coincidan con tu dieta.",
      });
      return;
    }

    setIsGenerating(true);
    const targetDayLabel = mode === "day" ? currentDay : "toda la semana";

    toast.success(`Generando plan para ${targetDayLabel}...`, {
      description: `Usando ingredientes de tu ${localStorage.getItem("nutri_active_draft")?.includes("cart") ? "Carrito" : "Dieta"}.`,
      duration: 4000,
    });

    setTimeout(() => {
      if (mode === "day") {
        const newSlots = currentSlots.map((slot) => ({
          ...slot,
          recipe:
            candidateRecipes[
            Math.floor(Math.random() * candidateRecipes.length)
            ],
        }));
        setCurrentSlots(newSlots);
        toast.success(`�D�a ${currentDay} generado con �xito!`);
      } else {
        const newWeekSlots = { ...weekSlots };
        days.forEach(day => {
          newWeekSlots[day] = newWeekSlots[day].map(slot => ({
            ...slot,
            recipe:
              candidateRecipes[
              Math.floor(Math.random() * candidateRecipes.length)
              ],
          }));
        });
        setWeekSlots(newWeekSlots);
        toast.success(`�Plan semanal completo generado!`);
      }
      setIsGenerating(false);
    }, 3000);
  };

  const isStrictMealSection = (mealSection?: string) => {
    const normalized = normalizeAiValue(mealSection || "");
    return ["desayuno", "almuerzo", "once", "cena"].includes(normalized);
  };

  const buildAiPromptPreview = (payload: ReturnType<typeof buildAiFillPayload>) => {
    const systemPrompt = [
      "Tu tarea: completar bloques de comida faltantes.",
      "Usa solo alimentos de DIETA para desayuno, almuerzo, once y cena.",
      "Para bloques variables como merienda o extra puedes usar opciones simples fuera de DIETA si la regla lo permite.",
      "No cuentes sal, condimentos ni b�sicos de cocci�n.",
      "Toma como base principal allowedFoodsByDiet.",
      "Usa chileExchangePortionGuide como referencia para porciones de intercambio en Chile.",
      "Si existe patientProfile, ajusta porciones y complejidad seg�n edad y caracter�sticas del paciente.",
      "Si existe patientGoals, prioriza cumplir metas de calor�as/macros para el alcance solicitado (d�a o semana).",
      "Si existe proteinSupplement, considera esos gramos diarios como prote�na ya cubierta.",
      "Prioriza alimentos y combinaciones comunes y f�ciles de conseguir en Chile (ferias y supermercados).",
      "Respeta restricciones alimentarias.",
      "Prefiere platos comunes, caseros, realistas, simples y con pocos ingredientes.",
      "Evita repetir platos ya usados o muy parecidos.",
      "Devuelve solo JSON v�lido. Sin explicaci�n.",
      "Cada receta debe incluir: slotId, mealSection, title, description, preparation, recommendedPortion, complexity, protein, calories, carbs, fats, ingredients, mainIngredients, extraIngredients.",
      "extraIngredients: ingredientes fuera de allowedFoodsByDiet. Si no hay, [].",
      "description: 1 frase.",
      "preparation: breve, clara, 2 a 4 pasos.",
      "complexity: simple o elaborada.",
      "Agrega tambi�n meta.note y meta.replacementGuide.",
    ].join("\n");

    const scopePrompt =
      payload.scope === "day"
        ? [
          "Completa solo los bloques vac�os del d�a indicado.",
          "No modifiques bloques ya completos.",
          'Devuelve JSON con forma {"recipes":[...],"meta":{"note":"string","replacementGuide":[{"mealSection":"string","suggestions":["string"]}]}}',
        ].join("\n")
        : [
          "Completa solo los bloques vac�os de la semana.",
          "No modifiques bloques ya completos.",
          "Mant�n variedad durante la semana.",
          "Evita repetir el mismo plato en d�as consecutivos.",
          'Devuelve JSON con forma {"days":[{"day":"string","recipes":[...]}],"meta":{"note":"string","replacementGuide":[{"mealSection":"string","suggestions":["string"]}]}}',
        ].join("\n");

    const userPrompt = `${scopePrompt}\n${JSON.stringify(payload.payload)}`;
    return { systemPrompt, userPrompt };
  };

  const printAiPromptPreview = (scope: AiFillScope = aiFillScope) => {
    const payload = buildAiFillPayload(scope);
    const { systemPrompt, userPrompt } = buildAiPromptPreview(payload);

    console.group("AI FILL PROMPT PREVIEW");
    console.log("SYSTEM PROMPT");
    console.log(systemPrompt);
    console.log("USER PROMPT");
    console.log(userPrompt);
    console.log("REQUEST PAYLOAD");
    console.log(payload);
    console.groupEnd();

    toast.info("Prompt de IA impreso en consola.", {
      description: "Revisa SYSTEM PROMPT y USER PROMPT en las herramientas de desarrollador.",
    });
  };

  const validateAiResponseClient = (
    scope: AiFillScope,
    payload: ReturnType<typeof buildAiFillPayload>,
    response: AiDayResponse | AiWeekResponse,
  ) => {
    const payloadData = payload.payload as any;
    const allowedFoods = new Set(
      (payloadData.allowedFoodsByDiet || []).map((item: string) => normalizeAiValue(item)),
    );

    const validateRecipe = (recipe: AiRecipeOutput, slotMealSection: string) => {
      if (!recipe.slotId) throw new Error("Respuesta IA sin slotId.");

      const normalizedSlot = normalizeAiValue(slotMealSection || "");
      const normalizedRecipe = normalizeAiValue(recipe.mealSection || "");
      if (!normalizedRecipe || normalizedRecipe !== normalizedSlot) {
        throw new Error(`Secci�n incompatible en ${recipe.slotId}.`);
      }

      const allIngredients = [...(recipe.ingredients || []), ...(recipe.mainIngredients || [])]
        .map((item) => ({ raw: item, normalized: normalizeAiValue(item) }))
        .filter((item) => Boolean(item.normalized));

      if (isStrictMealSection(recipe.mealSection) || !payloadData.generalSnackFlexAllowed) {
        const extraIngredients = Array.from(
          new Set(
            allIngredients
              .filter((ingredient) => !allowedFoods.has(ingredient.normalized))
              .map((ingredient) => ingredient.raw),
          ),
        );
        recipe.extraIngredients = extraIngredients;
      }
    };

    if (scope === "day" && "recipes" in response) {
      const slotMap = new Map<string, string>(
        (payloadData.slots || []).map((slot: any) => [slot.slotId, slot.mealSection]),
      );

      response.recipes.forEach((recipe) => {
        const slotMealSection = slotMap.get(recipe.slotId);
        if (!slotMealSection) throw new Error(`Slot desconocido: ${recipe.slotId}.`);
        validateRecipe(recipe, slotMealSection);
      });
      return;
    }

    if ("days" in response) {
      const slotMap = new Map<string, string>();
      (payloadData.days || []).forEach((dayBlock: any) => {
        dayBlock.slots.forEach((slot: any) => {
          slotMap.set(`${dayBlock.day}:${slot.slotId}`, slot.mealSection);
        });
      });

      response.days.forEach((dayBlock) => {
        dayBlock.recipes.forEach((recipe) => {
          const slotMealSection = slotMap.get(`${dayBlock.day}:${recipe.slotId}`);
          if (!slotMealSection) throw new Error(`Slot desconocido: ${dayBlock.day}/${recipe.slotId}.`);
          validateRecipe(recipe, slotMealSection);
        });
      });
    }
  };

  const handleSubmitAiFill = async () => {
    const payload = buildAiFillPayload(aiFillScope);
    const token = getAuthToken();
    if (!token) {
      toast.error("No se encontr� sesi�n activa.");
      return;
    }

    printAiPromptPreview(aiFillScope);
    setShowAiFillModal(false);
    setIsGenerating(true);

    try {
      const response = await fetchApi("/recipes/ai-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "No se pudo completar con IA.");
      }

      const result = (await response.json()) as AiDayResponse | AiWeekResponse;
      validateAiResponseClient(aiFillScope, payload, result);
      applyAiFillResponse(aiFillScope, result);
      setShowAiFillModal(false);
      toast.success(
        aiFillScope === "day"
          ? `IA complet� los bloques vac�os de ${currentDay}.`
          : "IA complet� los bloques vac�os de la semana.",
      );
    } catch (error: any) {
      console.error("AI FILL ERROR", error);
      const message = String(error?.message || "");
      const normalized = message.toLowerCase();

      if (
        normalized.includes("l�mite de tokens") ||
        normalized.includes("limite de tokens") ||
        normalized.includes("context length") ||
        normalized.includes("context_length_exceeded") ||
        normalized.includes("too many tokens")
      ) {
        toast.error("La IA excedi� el l�mite de tokens/contexto.", {
          description:
            "Prueba rellenar menos bloques, o usa primero el modo diario y luego semanal.",
        });
      } else if (
        normalized.includes("cuota") ||
        normalized.includes("quota") ||
        normalized.includes("rate limit") ||
        normalized.includes("resource_exhausted") ||
        normalized.includes("429")
      ) {
        toast.error("Se alcanzó la cuota de la IA.", {
          description:
            "Espera un momento y vuelve a intentar. Si persiste, revisa tu plan o límites de Gemini.",
        });
      } else {
        toast.error(message || "Error al completar con IA.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAI = (mode: "day" | "week" = "day") => {
    if (!hasSourceData) {
      toast.error("Falta una dieta base", {
        description: "Debes importar una dieta con alimentos antes de usar Recetas y porciones.",
      });
      return;
    }

    if (getEmptySlotsForScope(mode).length === 0) {
      toast.info("No hay bloques vac�os para rellenar.");
      return;
    }

    setAiFillScope(mode);
    setShowAiFillModal(true);
  };

  const handleMealCountChange = (count: number) => {
    const nextStructure = SLOT_LIBRARY[count] || SLOT_LIBRARY[DEFAULT_MEAL_COUNT];
    setMealCount(count);
    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
  };

  const getSlotTypeFromMealSection = (
    mealSection: string,
  ): MealSlot["type"] => {
    if (mealSection === "desayuno") return "desayuno";
    if (mealSection === "almuerzo") return "almuerzo";
    if (mealSection === "cena") return "cena";
    if (mealSection === "merienda") return "merienda";
    return "extra";
  };

  const getSlotLabelFromMealSection = (mealSection: string) =>
    RECIPE_MEAL_SECTIONS.find((section) => section.value === mealSection)?.label ||
    mealSection;

  const truncateText = (value: string | undefined, maxLength: number) => {
    if (!value) return "";
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trimEnd()}...`;
  };

  const getRecipeImage = (recipe?: Recipe, mealSection?: string) => {
    if (recipe?.image?.trim()) return recipe.image;

    const sectionKey = recipe?.mealSection || mealSection || "otro";
    return DEFAULT_RECIPE_IMAGES[sectionKey] || DEFAULT_RECIPE_IMAGES.otro;
  };

  const normalizeMealTimeInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 4);

    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const isCompleteMealTime = (value: string) =>
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

  const handleSlotTimeDraftChange = (id: string, newTime: string) => {
    setSlotTimeDrafts((prev) => ({
      ...prev,
      [id]: normalizeMealTimeInput(newTime),
    }));
  };

  const commitSlotTimeChange = (id: string) => {
    const draftTime = slotTimeDrafts[id];
    if (!draftTime) {
      return;
    }

    if (!isCompleteMealTime(draftTime)) {
      setSlotTimeDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setWeekSlots((prev) => {
      const currentStructure = getStructureTemplate(prev[currentDay] || []);
      const nextStructure = currentStructure.map((slot) =>
        slot.id === id ? { ...slot, time: draftTime } : slot,
      );
      return applyStructureToWeek(nextStructure, prev);
    });

    setSlotTimeDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const openSlotEditor = (day: string, slotId: string) => {
    const slot = (weekSlots[day] || []).find((item) => item.id === slotId);

    setCurrentDay(day);
    setActiveSlotDay(day);
    setActiveSwapSlot(slotId);
    setRecipeSearch("");
    setShowMatchingOnly(true);
    setRecipeModalTab("mine");
    setRecipeMealSectionFilter(
      slot?.mealSection || (slot?.type && slot.type !== "extra" ? slot.type : ""),
    );
    setDropTargetKey(`${day}-${slotId}`);
  };

  const openQuickMealModal = (day: string, slotId: string) => {
    setQuickMealTarget({ day, slotId });
    setQuickMealDraft({
      title: "",
      description: "",
      recommendedPortion: "",
      preparation: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    });
    setShowQuickMealModal(true);
  };

  const isRecipeMealSectionCompatible = (
    recipe?: Pick<Recipe, "mealSection"> | null,
    slot?: Pick<MealSlot, "mealSection" | "type"> | null,
  ) => {
    const recipeSection = normalizeAiValue(recipe?.mealSection || "");
    const slotSection = normalizeAiValue(slot?.mealSection || slot?.type || "");

    if (!recipeSection || !slotSection) return true;
    if (recipeSection === "almuerzo" && slotSection === "cena") return true;
    return recipeSection === slotSection;
  };

  const assignRecipeToSlot = (
    day: string,
    slotId: string,
    recipe: Recipe,
  ) => {
    const targetSlot = (weekSlots[day] || []).find((slot) => slot.id === slotId);
    if (!isRecipeMealSectionCompatible(recipe, targetSlot)) {
      const slotLabel = targetSlot?.label || "este bloque";
      toast.error(`No puedes agregar ${recipe.mealSection || "ese plato"} en ${slotLabel}.`);
      return;
    }

    setWeekSlots((prev) => ({
      ...prev,
      [day]: prev[day].map((slot) =>
        slot.id === slotId ? { ...slot, recipe } : slot,
      ),
    }));
    setDropTargetKey(null);
  };

  const clearRecipeFromSlot = (day: string, slotId: string) => {
    setWeekSlots((prev) => ({
      ...prev,
      [day]: prev[day].map((slot) =>
        slot.id === slotId ? { ...slot, recipe: undefined } : slot,
      ),
    }));
    setDropTargetKey(null);
  };

  const submitQuickMeal = () => {
    if (!quickMealTarget) return;

    const daySlots = weekSlots[quickMealTarget.day] || [];
    const targetSlot = daySlots.find((slot) => slot.id === quickMealTarget.slotId);
    if (!targetSlot) {
      toast.error("No se encontr� el bloque para crear la comida r�pida.");
      return;
    }

    const title = quickMealDraft.title.trim();
    if (!title) {
      toast.error("El nombre de la comida es obligatorio.");
      return;
    }

    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const quickRecipe: Recipe = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `quick-${crypto.randomUUID()}`
          : `quick-${Date.now()}`,
      title,
      description: quickMealDraft.description.trim() || "Comida r�pida creada manualmente.",
      preparation: quickMealDraft.preparation.trim() || undefined,
      recommendedPortion: quickMealDraft.recommendedPortion.trim() || undefined,
      complexity: "simple",
      protein: toNumber(quickMealDraft.protein),
      calories: toNumber(quickMealDraft.calories),
      carbs: toNumber(quickMealDraft.carbs),
      fats: toNumber(quickMealDraft.fats),
      ingredients: [],
      mainIngredients: [],
      source: "mine",
      mealSection: targetSlot.mealSection || targetSlot.type,
    };

    assignRecipeToSlot(quickMealTarget.day, quickMealTarget.slotId, quickRecipe);
    setShowQuickMealModal(false);
    setQuickMealTarget(null);
    toast.success("Comida r�pida creada y asignada al bloque.");
  };

  const handleSlotPortionChange = (
    day: string,
    slotId: string,
    recommendedPortion: string,
  ) => {
    setWeekSlots((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((slot) => {
        if (slot.id !== slotId || !slot.recipe) return slot;
        return {
          ...slot,
          recipe: {
            ...slot.recipe,
            recommendedPortion,
          },
        };
      }),
    }));
  };

  useEffect(() => {
    setWeekSlots((prev) => {
      const next: Record<string, MealSlot[]> = {};
      const referenceDay =
        days.find((day) => Array.isArray(prev[day]) && prev[day].length > 0) ||
        Object.keys(prev)[0];
      const fallbackTemplate = getStructureTemplate(
        (referenceDay && prev[referenceDay]) ||
          SLOT_LIBRARY[mealCount] ||
          SLOT_LIBRARY[DEFAULT_MEAL_COUNT],
      );
      days.forEach((day) => {
        next[day] = prev[day]
          ? prev[day]
          : fallbackTemplate.map((slot) => ({ ...slot }));
      });
      return next;
    });

    setCurrentDay((prev) => (days.includes(prev) ? prev : days[0]));
  }, [days, mealCount]);

  const assignRecipeToActiveSlot = (recipe: Recipe) => {
    if (!activeSlotDay || !activeSwapSlot) return;
    assignRecipeToSlot(activeSlotDay, activeSwapSlot, recipe);
    setShowSwapModal(false);
    toast.success(`Bloque actualizado con ${recipe.title}`);
  };

  const availableMealSectionsToAdd = useMemo(() => {
    const currentSections = new Set(
      getStructureTemplate(currentSlots).map(
        (slot) => slot.mealSection || slot.type,
      ),
    );

    return mealSectionsData.filter((section) => {
      if (
        UNIQUE_MEAL_SECTIONS.has(section.value) &&
        currentSections.has(section.value)
      ) {
        return false;
      }

      return true;
    });
  }, [currentSlots]);

  const availableMealSectionsForEditing = useMemo(() => {
    const editingSlot = currentSlots.find((slot) => slot.id === editingMealBlockId);
    const currentSections = new Set(
      getStructureTemplate(currentSlots)
        .filter((slot) => slot.id !== editingMealBlockId)
        .map((slot) => slot.mealSection || slot.type),
    );

    return mealSectionsData.filter((section) => {
      if (
        UNIQUE_MEAL_SECTIONS.has(section.value) &&
        currentSections.has(section.value)
      ) {
        return false;
      }

      return true;
    }).map((section) => ({
      ...section,
      isCurrent: section.value === (editingSlot?.mealSection || editingSlot?.type),
    }));
  }, [currentSlots, editingMealBlockId]);

  const handleOpenAddBlockModal = () => {
    if (currentSlots.length >= 6) {
      toast.info("Ya alcanzaste el m�ximo de 6 bloques.");
      return;
    }

    setEditingMealBlockId(null);
    setShowAddBlockModal(true);
  };

  const handleOpenEditMealBlockModal = (
    slotId: string,
    dayContext: string = currentDay,
  ) => {
    const slot = (weekSlots[dayContext] || []).find((item) => item.id === slotId);
    if (!slot?.isUserAdded) return;

    setCurrentDay(dayContext);
    setEditingMealBlockId(slotId);
    setShowAddBlockModal(true);
  };

  const handleAddMealBlock = (mealSection: string) => {
    if (currentSlots.length >= 6) {
      toast.info("Ya alcanzaste el m�ximo de 6 bloques.");
      return;
    }

    const currentStructure = getStructureTemplate(currentSlots);
    if (
      UNIQUE_MEAL_SECTIONS.has(mealSection) &&
      currentStructure.some(
        (slot) => (slot.mealSection || slot.type) === mealSection,
      )
    ) {
      toast.info("Ese bloque principal ya existe en este d�a.");
      return;
    }

    const nextSlot = {
      id: `slot-${mealSection}-${Date.now()}`,
      time: "00:00",
      type: getSlotTypeFromMealSection(mealSection),
      label: getSlotLabelFromMealSection(mealSection),
      mealSection,
      isUserAdded: true,
    };

    const dinnerIndex = currentStructure.findIndex(
      (slot) => (slot.mealSection || slot.type) === "cena",
    );
    const nextStructure = [...currentStructure];

    if (dinnerIndex >= 0) {
      nextStructure.splice(dinnerIndex, 0, nextSlot);
    } else {
      nextStructure.push(nextSlot);
    }

    setMealCount(nextStructure.length);
    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
    setShowAddBlockModal(false);
    toast.success(
      `Se agreg� ${getSlotLabelFromMealSection(mealSection)} a toda la semana.`,
    );
  };

  const handleUpdateMealBlock = (mealSection: string) => {
    if (!editingMealBlockId) return;

    const currentStructure = getStructureTemplate(currentSlots);
    const editingSlot = currentStructure.find((slot) => slot.id === editingMealBlockId);

    if (!editingSlot?.isUserAdded) {
      setEditingMealBlockId(null);
      setShowAddBlockModal(false);
      return;
    }

    if (
      UNIQUE_MEAL_SECTIONS.has(mealSection) &&
      currentStructure.some(
        (slot) =>
          slot.id !== editingMealBlockId &&
          (slot.mealSection || slot.type) === mealSection,
      )
    ) {
      toast.info("Ese bloque principal ya existe en este día.");
      return;
    }

    const nextStructure = currentStructure.map((slot) =>
      slot.id === editingMealBlockId
        ? {
          ...slot,
          type: getSlotTypeFromMealSection(mealSection),
          label: getSlotLabelFromMealSection(mealSection),
          mealSection,
          isUserAdded: true,
        }
        : slot,
    );

    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
    setEditingMealBlockId(null);
    setShowAddBlockModal(false);
    toast.success(
      `Bloque actualizado a ${getSlotLabelFromMealSection(mealSection)} en toda la semana.`,
    );
  };

  const handleRemoveMealBlock = (
    slotId: string,
    dayContext: string = currentDay,
  ) => {
    const daySlots = weekSlots[dayContext] || [];
    const slot = daySlots.find((item) => item.id === slotId);
    if (!slot?.isUserAdded) {
      toast.info("Ese bloque forma parte de la estructura base y no se puede eliminar.");
      return;
    }

    setCurrentDay(dayContext);

    const nextStructure = getStructureTemplate(daySlots).filter(
      (item) => item.id !== slotId,
    );

    setMealCount(nextStructure.length);
    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
    toast.success(`Se eliminó ${slot.label} de toda la semana.`);
  };

  const handleAddMeriendaSection = () => {
    if (mealCount >= 6) {
      toast.info("Ya alcanzaste el m�ximo de 6 comidas.");
      return;
    }

    handleMealCountChange(mealCount + 1);
    toast.success("Se agreg� una nueva merienda a toda la semana.");
  };

  const reorderStructure = (
    fromSlotId: string,
    toSlotId: string,
    dayContext: string = currentDay,
  ) => {
    if (fromSlotId === toSlotId) return;

    setWeekSlots((prev) => {
      const currentStructure = [...getStructureTemplate(prev[dayContext] || [])];
      const fixedTimes = currentStructure.map((slot) => slot.time);
      const fromIndex = currentStructure.findIndex((slot) => slot.id === fromSlotId);
      const toIndex = currentStructure.findIndex((slot) => slot.id === toSlotId);

      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }

      const [movedSlot] = currentStructure.splice(fromIndex, 1);
      currentStructure.splice(toIndex, 0, movedSlot);

      const structureWithFixedTimes = currentStructure.map((slot, index) => ({
        ...slot,
        time: fixedTimes[index] || slot.time,
      }));

      return applyStructureToWeek(structureWithFixedTimes, prev);
    });
  };

  const handleSlotDrop = (targetSlotId: string, dayContext: string = currentDay) => {
    if (draggedRecipeId) {
      const recipe = recipeLibrary.find((item) => item.id === draggedRecipeId);
      const targetSlot = (weekSlots[dayContext] || []).find(
        (slot) => slot.id === targetSlotId,
      );
      if (recipe) {
        if (!isRecipeMealSectionCompatible(recipe, targetSlot)) {
          toast.error(
            `Bloqueado: "${targetSlot?.label || "Bloque"}" solo acepta platos de ${targetSlot?.mealSection || targetSlot?.type || "su categor�a"}.`,
          );
          setDraggedRecipeId(null);
          setDropTargetKey(null);
          return;
        }
        assignRecipeToSlot(dayContext, targetSlotId, recipe);
        toast.success(`Plato agregado a ${dayContext}.`);
      }
      setDraggedRecipeId(null);
      setDropTargetKey(null);
      return;
    }

    if (!draggedSlotId) return;
    reorderStructure(draggedSlotId, targetSlotId, dayContext);
    setDraggedSlotId(null);
    setDropTargetKey(null);
  };

  const isRecipeCompatibleForSubstitute = (
    recipe: Pick<Recipe, "mealSection">,
    section: SubstituteMealSection,
  ) => normalizeAiValue(recipe.mealSection || "") === section;

  const getSubstituteSectionForRecipe = (
    recipe: Pick<Recipe, "mealSection">,
  ): SubstituteMealSection | null => {
    const normalized = normalizeAiValue(recipe.mealSection || "");
    if (normalized === "desayuno") return "desayuno";
    if (normalized === "almuerzo") return "almuerzo";
    return null;
  };

  const isRecipeMarkedAsSubstitute = (
    recipe: Pick<Recipe, "id" | "mealSection">,
  ) => {
    const section = getSubstituteSectionForRecipe(recipe);
    if (!section) return false;
    return substituteRecipesBySection[section].some((item) => item.id === recipe.id);
  };

  const addSubstituteRecipe = (
    section: SubstituteMealSection,
    recipe: Recipe,
  ) => {
    if (!isRecipeCompatibleForSubstitute(recipe, section)) {
      toast.error(`Solo puedes agregar platos de ${section} en esta lista.`);
      return;
    }

    setSubstituteRecipesBySection((prev) => {
      if (prev[section].some((item) => item.id === recipe.id)) {
        return prev;
      }
      return {
        ...prev,
        [section]: [
          ...prev[section],
          { id: recipe.id, title: recipe.title, mealSection: recipe.mealSection },
        ],
      };
    });
  };

  const removeSubstituteRecipe = (section: SubstituteMealSection, id: string) => {
    setSubstituteRecipesBySection((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }));
  };

  const toggleSubstituteRecipe = (recipe: Recipe, checked: boolean) => {
    const section = getSubstituteSectionForRecipe(recipe);
    if (!section) {
      toast.info("Solo puedes marcar sustitutos para desayuno o almuerzo.");
      return;
    }

    if (checked) {
      addSubstituteRecipe(section, recipe);
      return;
    }

    removeSubstituteRecipe(section, recipe.id);
  };

  const draggedRecipe = useMemo(
    () =>
      draggedRecipeId
        ? recipeLibrary.find((item) => item.id === draggedRecipeId) || null
        : null,
    [draggedRecipeId, recipeLibrary],
  );

  const calculateDayTotals = (slots: MealSlot[]) =>
    slots.reduce(
      (acc, slot) => ({
        protein: acc.protein + (slot.recipe?.protein || 0),
        calories: acc.calories + (slot.recipe?.calories || 0),
        carbs: acc.carbs + (slot.recipe?.carbs || 0),
        fats: acc.fats + (slot.recipe?.fats || 0),
      }),
      { protein: 0, calories: 0, carbs: 0, fats: 0 },
    );

  const proteinSupplementPerDay =
    proteinSupplement.enabled && proteinSupplement.gramsPerDay > 0
      ? proteinSupplement.gramsPerDay
      : 0;

  // Suma todos los bloques/alimentos asignados al d�a activo.
  const dayTotals = useMemo(
    () => calculateDayTotals(weekSlots[currentDay] || []),
    [currentDay, weekSlots],
  );

  const dayTotalsWithSupplement = useMemo(
    () => ({
      ...dayTotals,
      protein: dayTotals.protein + proteinSupplementPerDay,
    }),
    [dayTotals, proteinSupplementPerDay],
  );

  const weekTotals = useMemo(
    () =>
      days.reduce(
        (acc, day) => {
          const totals = calculateDayTotals(weekSlots[day] || []);
          return {
            protein: acc.protein + totals.protein,
            calories: acc.calories + totals.calories,
            carbs: acc.carbs + totals.carbs,
            fats: acc.fats + totals.fats,
          };
        },
        { protein: 0, calories: 0, carbs: 0, fats: 0 },
      ),
    [weekSlots],
  );

  const weekTotalsWithSupplement = useMemo(
    () => ({
      ...weekTotals,
      protein: weekTotals.protein + proteinSupplementPerDay * 7,
    }),
    [weekTotals, proteinSupplementPerDay],
  );

  const patientNutritionGoals = useMemo(() => {
    const selectedGoals = getGoalsFromPatient(selectedPatient);
    if (selectedGoals) return selectedGoals;

    const draft = readWorkflowDraft();
    return sanitizeNutritionGoals(draft.patientMeta?.nutritionGoals) || null;
  }, [selectedPatient]);

  useEffect(() => {
    if (!selectedPatient || !patientNutritionGoals || isEditingPatientGoals) {
      return;
    }

    setTargetCalories(patientNutritionGoals.calories);
    setTargetProtein(patientNutritionGoals.protein);
    setTargetCarbs(patientNutritionGoals.carbs);
    setTargetFats(patientNutritionGoals.fats);
  }, [
    selectedPatient,
    patientNutritionGoals?.calories,
    patientNutritionGoals?.protein,
    patientNutritionGoals?.carbs,
    patientNutritionGoals?.fats,
    isEditingPatientGoals,
  ]);

  useEffect(() => {
    setIsEditingPatientGoals(false);
  }, [selectedPatient?.id]);

  const selectedPatientActivityLevel = useMemo(
    () => getActivityLevel(selectedPatient),
    [selectedPatient],
  );

  const recommendedProteinRange = useMemo(
    () => getRecommendedProteinRange(selectedPatient?.weight, selectedPatientActivityLevel),
    [selectedPatient, selectedPatientActivityLevel],
  );

  const assignPatientGoalsFromCurrentTargets = async () => {
    if (!selectedPatient) {
      toast.info("Primero vincula un paciente para asignar metas.");
      return;
    }

    const goals: NutritionGoals = {
      calories: Math.max(1, Math.round(targetCalories || 0)),
      protein: Math.max(1, Math.round(targetProtein || 0)),
      carbs: Math.max(1, Math.round(targetCarbs || 0)),
      fats: Math.max(1, Math.round(targetFats || 0)),
    };

    const currentCustomVariables = getCustomVariablesArray(selectedPatient);
    const upsertCustomVariable = (
      list: any[],
      key: string,
      label: string,
      value: string,
      unit: string,
    ) => {
      const next = [...list];
      const index = next.findIndex((item) => normalizeString(item?.key || "") === normalizeString(key));
      const payload = { key, label, value, unit };
      if (index >= 0) {
        next[index] = payload;
      } else {
        next.push(payload);
      }
      return next;
    };

    let nextCustomVariables = [...currentCustomVariables];
    nextCustomVariables = upsertCustomVariable(
      nextCustomVariables,
      "targetCalories",
      "Calor�as Meta",
      String(goals.calories),
      "kcal",
    );
    nextCustomVariables = upsertCustomVariable(
      nextCustomVariables,
      "targetProtein",
      "Prote�na Meta",
      String(goals.protein),
      "g",
    );
    nextCustomVariables = upsertCustomVariable(
      nextCustomVariables,
      "targetCarbs",
      "Carbohidratos Meta",
      String(goals.carbs),
      "g",
    );
    nextCustomVariables = upsertCustomVariable(
      nextCustomVariables,
      "targetFats",
      "Grasas Meta",
      String(goals.fats),
      "g",
    );
    nextCustomVariables = upsertCustomVariable(
      nextCustomVariables,
      "targetTimeframe",
      "Temporalidad",
      "dia",
      "",
    );

    try {
      const token = getAuthToken();
      const response = await fetchApi(`/patients/${selectedPatient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customVariables: nextCustomVariables,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || "No se pudo guardar metas en el paciente.");
      }

      const updatedPatient = await response.json();
      setSelectedPatient(updatedPatient);
      localStorage.setItem("nutri_patient", JSON.stringify(updatedPatient));
    } catch (error: any) {
      toast.error(error?.message || "No se pudieron asignar metas al paciente.");
      return;
    }

    const draft = readWorkflowDraft();
    draft.patientMeta = {
      ...(draft.patientMeta || buildPatientMeta(selectedPatient) || {}),
      nutritionGoals: goals,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

    toast.success("Metas del paciente actualizadas.");
    setIsEditingPatientGoals(false);
  };

  const getEmptyMealBlocks = () => {
    const emptyBlocks: Array<{ day: string; label: string; time: string }> = [];

    days.forEach((day) => {
      (weekSlots[day] || []).forEach((slot) => {
        if (!slot.recipe) {
          emptyBlocks.push({
            day,
            label: slot.label,
            time: slot.time,
          });
        }
      });
    });

    return emptyBlocks;
  };

  // Distribuye horarios autom�ticamente dejando la �ltima comida 2h antes de dormir.
  const redistributeMealTimes = () => {
    const [wakeH, wakeM] = wakeUpTime.split(":").map(Number);
    const [sleepH, sleepM] = sleepTime.split(":").map(Number);
    const wakeMinutes = wakeH * 60 + wakeM;
    const sleepMinutes = sleepH * 60 + sleepM;
    const slotCount = currentSlots.length;
    const lastMealMinutes = Math.max(wakeMinutes + 120, sleepMinutes - 120);

    if (slotCount === 0 || lastMealMinutes <= wakeMinutes) {
      return;
    }

    const firstMealMinutes = wakeMinutes + 30;
    const availableWindow = Math.max(0, lastMealMinutes - firstMealMinutes);
    const interval =
      slotCount > 1 ? Math.floor(availableWindow / (slotCount - 1)) : 0;

    const nextStructure = currentSlots.map((slot, i) => {
      const slotMin =
        slotCount === 1 ? lastMealMinutes : firstMealMinutes + interval * i;
      const h = Math.floor(slotMin / 60);
      const m = slotMin % 60;

      return {
        ...slot,
        time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      };
    });

    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
  };

  const printJson = () => {
    const storedDraft = readWorkflowDraft();
    const workflowJson = {
      patientMeta:
        storedDraft.patientMeta || buildPatientMeta(selectedPatient) || null,
      modules: {
        diet: storedDraft.diet || null,
        recipes: buildRecipesModule(),
        cart: storedDraft.cart || null,
        deliverable: storedDraft.deliverable || null,
      },
    };

    console.group("PROJECT WORKFLOW JSON");
    console.log(workflowJson);
    console.groupEnd();
    toast.info("JSON acumulado del proyecto impreso en consola.");
  };

  const resetRecipes = () => {
    const initial: Record<string, MealSlot[]> = {};
    const baseStructure = SLOT_LIBRARY[mealCount] || SLOT_LIBRARY[DEFAULT_MEAL_COUNT];
    days.forEach((day) => {
      initial[day] = baseStructure.map((slot) => ({ ...slot }));
    });

    const draft = readWorkflowDraft();
    delete draft.diet;
    delete draft.recipes;
    delete draft.cart;
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

    setWeekSlots(initial);
    setSourceFoods([]);
    setSourceModules({ diet: false, cart: false });
    setHasSourceData(false);
    toast.info("Recetas y porciones reiniciado por completo.");
  };

  const buildRecipesPayload = (description?: string) => ({
    name:
      selectedPatient?.fullName
        ? `Recetas ${selectedPatient.fullName}`
        : `Recetas ${new Date().toLocaleDateString("es-CL")}`,
    type: "RECIPE" as const,
    content: buildRecipesModule(),
    metadata: {
      ...(description?.trim()
        ? { description: description.trim() }
        : {}),
      dayCount: Object.keys(weekSlots || {}).length,
      ...(selectedPatient
        ? {
          patientId: selectedPatient.id,
          patientName: selectedPatient.fullName,
        }
        : {}),
    },
    tags: [],
  });

  const persistRecipesCreation = async (description?: string) => {
    const savedCreation = await saveCreation(buildRecipesPayload(description));

    if (currentProjectId) {
      await updateProject(currentProjectId, {
        activeRecipeCreationId: savedCreation.id,
        patientId: selectedPatient?.id,
        metadata: {
          sourceModule: "recipes",
          recipeDays: Object.keys(weekSlots || {}).length,
        },
      });
    }

    return savedCreation;
  };

  const actionDockItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "import-creation",
        icon: Library,
        label: "Importar Creaci�n",
        variant: "indigo",
        onClick: () => {
          setIsImportCreationModalOpen(true);
        },
      },
      !selectedPatient && {
        id: "link-patient",
        icon: User,
        label: "Importar Paciente",
        variant: "emerald",
        onClick: () => {
          setIsImportPatientModalOpen(true);
          fetchPatients();
        },
      },
      {
        id: "export-json",
        icon: FileCode,
        label: "Imprimir JSON",
        variant: "slate",
        onClick: printJson,
        disabled: isRecipesLocked,
      },
      {
        id: "export-pdf",
        icon: Download,
        label: "Exportar PDF",
        variant: "slate",
        onClick: () => toast.info("PDF de recetas disponible en la etapa Entregable."),
        disabled: isRecipesLocked,
      },
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar Todo",
        variant: "rose",
        onClick: resetRecipes,
        disabled: isRecipesLocked,
      },
    ].filter(Boolean) as ActionDockItem[],
    [aiFillScope, isRecipesLocked, printAiPromptPreview, printJson, resetRecipes, selectedPatient, sleepTime, targetCalories, targetCarbs, targetFats, targetProtein, wakeUpTime, weekSlots],
  );

  const assignedSourceSummary = useMemo(() => {
    if (sourceModules.diet) return "Dieta asignada";
    return "Sin dieta asignada";
  }, [sourceModules]);

  const handleKeepDraft = () => {
    sessionStorage.setItem("nutri_recipes_draft_decided", "keep");
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        if (draft.recipes) {
          applyRecipesContent(draft.recipes);
        }
      } catch (_) { }
    }
    setShowDraftModal(false);
  };

  const handleDiscardDraft = () => {
    sessionStorage.setItem("nutri_recipes_draft_decided", "discard");
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        delete draft.recipes;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
      } catch (_) { }
    }
    resetRecipes();
    setShowDraftModal(false);
  };

  const handleImportCreation = (creation: any) => {
    try {
      const { type, content } = creation;
      const draft = readWorkflowDraft();

      // Automatically link patient if present in creation
      if (creation.patient) {
        handleSelectPatient(creation.patient);
      }

      // Full RECIPE import
      if (type === "RECIPE") {
        if (!draft.diet) {
          toast.error("Primero importa una dieta", {
            description: "Recetas y porciones necesita una dieta base antes de cargar una planificaci�n.",
          });
          return;
        }
        draft.recipes = content;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        applyRecipesContent(content);
        toast.success(`Plan de recetas "${creation.name}" importado.`);
      }
      // Diet import is required to enable this module
      else if (type === "DIET") {
        draft.diet = content;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        syncSourceFoods(draft);

        const targets = content.targets || content.nutritionalTargets || {};

        // Try to find targets in content or handle calculated ones if available
        const calories = targets.calories || targets.targetCalories || 0;
        const protein = targets.protein || targets.targetProtein || 0;
        const carbs = targets.carbs || targets.targetCarbs || 0;
        const fats = targets.fats || targets.targetFats || 0;

        if (calories > 0) setTargetCalories(calories);
        if (protein > 0) setTargetProtein(protein);
        if (carbs > 0) setTargetCarbs(carbs);
        if (fats > 0) setTargetFats(fats);

        toast.success(`Metas sincronizadas desde ${type === "DIET" ? "Dieta" : "Carrito"}: "${creation.name}"`);
      } else if (type === "SHOPPING_LIST") {
        toast.info("Este m�dulo depende de una dieta", {
          description: "Importa una dieta para habilitar Recetas y porciones.",
        });
      }
    } catch (e) {
      console.error("Error importing creation", e);
      toast.error("Error al importar la creaci�n.");
    }
  };

  return (
    <>
      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={handleImportCreation}
        defaultType="DIET"
      />
      <DraftRestoreModal
        isOpen={showDraftModal}
        moduleName="Recetas"
        draftLabel={draftMeta.label}
        draftDate={draftMeta.date}
        onKeep={handleKeepDraft}
        onDiscard={handleDiscardDraft}
      />
      {isGenerating ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
          <div className="flex flex-col items-center rounded-3xl border border-amber-200 bg-white px-10 py-8 shadow-2xl">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <ChefHat className="h-10 w-10 animate-pulse text-amber-600" />
            </div>
            <p className="mt-5 text-lg font-black text-slate-900">
              La IA est� cocinando...
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Preparando tus platos y porciones.
            </p>
          </div>
        </div>
      ) : null}
      <ModuleLayout
        title="Recetas y Porciones"
        description="En este apartado modificar�s, en base a los alimentos anteriores, las cantidades de cada uno de forma diaria, semanal o mensual, y sus porciones en base a la documentaci�n oficial."
        step={{
          number: 3,
          label: "Planes & Recetas (AI)",
          icon: GraduationCap,
          color: "text-emerald-600",
        }}
        className="max-w-none"
        rightNavItems={actionDockItems}
        footer={
          <ModuleFooter>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Status del Plan
                </p>
                <p className="text-xs font-bold text-slate-600">
                  Estructura semanal alineada con Dieta y lista para seguir creciendo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">

              <Button
                className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                disabled={isRecipesLocked}
                onClick={async () => {
                  try {
                    if (isRecipesLocked) {
                      toast.error("Importa una dieta primero.");
                      return;
                    }
                    await persistRecipesCreation();
                    toast.success("Creaci�n guardada exitosamente");
                  } catch (error: any) {
                    toast.error(error?.message || "No se pudieron guardar las recetas.");
                  }
                }}
              >
                Guardar Creaci�n
              </Button>

              <Button
                disabled={isRecipesLocked}
                onClick={async () => {
                  try {
                    if (isRecipesLocked) {
                      toast.error("Importa una dieta primero.");
                      return;
                    }
                    const emptyBlocks = getEmptyMealBlocks();
                    if (emptyBlocks.length > 0) {
                      const firstEmpty = emptyBlocks[0];
                      toast.error("A�n hay bloques de comida vac�os.", {
                        description: `${firstEmpty.day}: ${firstEmpty.label} (${firstEmpty.time}). Completa todos los bloques antes de continuar.`,
                      });
                      setCurrentDay(firstEmpty.day);
                      setPlannerView("daily");
                      return;
                    }

                    await persistRecipesCreation();
                    router.push(
                      buildProjectAwarePath(
                        "/dashboard/carrito?flow=continue",
                        currentProjectId,
                      ),
                    );
                  } catch (error: any) {
                    toast.error(error?.message || "No se pudieron guardar las recetas.");
                  }
                }}
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center gap-3 uppercase tracking-widest text-xs"
              >
                CONTINUAR
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={currentProjectName}
          patientName={selectedPatient?.fullName || null}
          mode={currentProjectMode}
          moduleLabel="Recetas"
        />
        <div className="mb-6 animate-in slide-in-from-top duration-300 mx-auto w-full">
          <div
            className={cn(
              "rounded-[2.5rem] border p-6 shadow-sm",
              hasSourceData
                ? "border-emerald-100 bg-emerald-50"
                : "border-amber-100 bg-amber-50",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border",
                    hasSourceData
                      ? "border-emerald-200 bg-emerald-100"
                      : "border-amber-200 bg-amber-100",
                  )}
                >
                  {hasSourceData ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "mb-1 text-[10px] font-black uppercase tracking-widest leading-none",
                      hasSourceData ? "text-emerald-600" : "text-amber-600",
                    )}
                  >
                    Estado de base alimentaria
                  </p>
                  <h3 className="text-xl font-black text-slate-900 leading-none flex items-center gap-3">
                    {assignedSourceSummary}
                    {selectedPatient && (
                      <span className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200">
                        <User className="h-3.5 w-3.5 text-emerald-400" />
                        {selectedPatient.fullName || selectedPatient.name}
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {hasSourceData
                      ? `Esta etapa ya est� conectada con ${assignedSourceSummary.toLowerCase()}. Puedes seguir construyendo sobre esa base o importar otra creaci�n.`
                      : "A�n no tienes una dieta o carrito asignado en esta etapa. Si quieres continuar con progreso previo, importa una creaci�n antes de seguir."}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">
                    {selectedPatient
                      ? `Paciente asignado desde dieta: ${selectedPatient.fullName || selectedPatient.name}`
                      : "Paciente asignado desde dieta: no"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Alimentos disponibles
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {sourceFoods.length}
                </p>
              </div>
            </div>
          </div>
        </div>
        {selectedPatient && (
          <div className="mb-6 animate-in slide-in-from-top duration-300 mx-auto w-full">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
                    Paciente Vinculado
                  </p>
                  <h3 className="text-xl font-black text-slate-900 italic leading-none">
                    {selectedPatient.fullName || selectedPatient.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleUnlinkPatient}
                className="bg-white/50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50 hover:border-rose-200 transition-all cursor-pointer"
              >
                Cambiar o Desvincular
              </button>
            </div>
          </div>
        )}

        {!hasSourceData ? (
          <div className="mb-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
                  Dieta requerida
                </p>
                <p className="text-sm font-medium text-amber-900">
                  Recetas y porciones necesita una dieta importada con alimentos para habilitar la IA y la planificaci�n.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsImportCreationModalOpen(true)}
                  className="rounded-2xl border-amber-200 bg-white font-bold text-amber-900"
                >
                  <Library className="mr-2 h-4 w-4" />
                  Importar dieta
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      buildProjectAwarePath("/dashboard/dieta", currentProjectId),
                    )
                  }
                  className="rounded-2xl border-amber-200 bg-white font-bold text-amber-900"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Ir a Dieta
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className={cn("space-y-8 mt-6", isRecipesLocked && "pointer-events-none opacity-55 select-none")}>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Configuraci�n de estructura
                  </p>
                  <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
                    Usa IA para proponer platos realistas seg�n restricciones y alimentos disponibles, o completa la estructura manualmente.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      onClick={() => setPlannerView("daily")}
                      className={cn(
                        "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                        plannerView === "daily"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      Vista diaria
                    </button>
                    <button
                      onClick={() => setPlannerView("weekly")}
                      className={cn(
                        "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                        plannerView === "weekly"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      Vista semanal
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        buildProjectAwarePath("/dashboard/dieta", currentProjectId),
                      )
                    }
                    className="rounded-2xl font-bold flex items-center gap-2 border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Ajustar Dieta
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleGenerateAI("week")}
                    disabled={isGenerating}
                    className="rounded-2xl font-bold flex items-center gap-2 border-slate-200"
                  >
                    <Zap className="h-4 w-4" />
                    {isGenerating && aiFillScope === "week"
                      ? "Generando semana..."
                      : "Rellenar semana con IA"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Cantidad de comidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleMealCountChange(num)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-black transition-all",
                        mealCount === num
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Cronobiolog�a
                </p>
                <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">
                      Despierta
                    </label>
                    <Input
                      type="time"
                      value={wakeUpTime}
                      onChange={(e) => setWakeUpTime(e.target.value)}
                      className="h-12 rounded-2xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">
                      Duerme
                    </label>
                    <Input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="h-12 rounded-2xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-3 px-5 w-fit animate-in fade-in slide-in-from-left duration-500">
              <div className="flex items-center gap-3 pr-5 border-r border-slate-200">
                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-center">
                  <Dumbbell className="h-4 w-4 text-emerald-500 mx-auto" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">
                    Suplementaci�n
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={proteinSupplement.enabled}
                      onChange={(e) =>
                        setProteinSupplement((prev) => ({
                          ...prev,
                          enabled: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                    />
                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-700 group-hover:text-emerald-700 transition-colors">
                      Prote�na Diaria
                    </span>
                  </label>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-4 transition-all duration-300",
                !proteinSupplement.enabled && "opacity-30 grayscale pointer-events-none scale-95"
              )}>
                <div className="flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">
                    Gramos asegurados
                  </p>
                  <div className="relative group/input">
                    <Input
                      type="number"
                      min={0}
                      value={proteinSupplement.gramsPerDay}
                      onChange={(e) =>
                        setProteinSupplement((prev) => ({
                          ...prev,
                          gramsPerDay: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="h-10 w-24 rounded-xl text-xs font-bold bg-white text-center shadow-sm border-slate-200 focus:border-emerald-400 transition-all"
                    />
                    <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                      g
                    </span>
                  </div>
                </div>
                <div className="max-w-[140px]">
                  <p className="text-[9px] font-bold text-slate-500 leading-tight italic">
                    Este valor se restar� del total diario de comidas.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-[2rem] border border-slate-200 bg-white p-4">
              <label className="inline-flex items-center gap-3 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={adviseMealRepetition}
                  onChange={(e) => setAdviseMealRepetition(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                Avisar al paciente que puede repetir alimentos durante su ciclo semanal.
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="inline-flex items-center gap-3 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enableSubstituteRecipes}
                    onChange={(e) => setEnableSubstituteRecipes(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  Activar platos sustitutos
                </label>

                {enableSubstituteRecipes ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {(["desayuno", "almuerzo"] as SubstituteMealSection[]).map((section) => (
                      <div
                        key={section}
                        className="rounded-xl border border-slate-300 bg-white p-3"
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Platos sustitutos � {section}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                          Marca como sustitutos en la biblioteca algunos platos de {section}.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {substituteRecipesBySection[section].map((item) => (
                            <span
                              key={`${section}-${item.id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700"
                            >
                              {item.title}
                              <button
                                type="button"
                                className="text-slate-400 hover:text-rose-600"
                                onClick={() => removeSubstituteRecipe(section, item.id)}
                                title="Quitar sustituto"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {substituteRecipesBySection[section].length === 0 ? (
                            <span className="text-[11px] font-medium text-slate-400">
                              Sin platos sustitutos a�n.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              {hasSourceData ? (
                <>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                    Alimentos base considerados: {sourceFoods.length}
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                    La informaci�n anterior se conserva y este m�dulo solo suma estructura, porciones y distribuci�n.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
                  Sin dieta asignada. Importa una dieta para habilitar esta etapa.
                </div>
              )}
            </div>
          </div>

          <div className="relative grid lg:grid-cols-12 gap-8 items-start">
            <div className="hidden lg:col-span-3 lg:block lg:self-start lg:sticky lg:top-24">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Biblioteca de platos
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      Arrastra un plato hacia el bloque que quieras completar
                    </h3>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <Input
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      placeholder="Buscar plato o ingrediente principal..."
                      className="pl-12 h-12 rounded-2xl border-slate-200 font-bold"
                    />
                  </div>

                  <div className="hidden rounded-3xl bg-slate-100 p-2 grid grid-cols-3 gap-2">
                    {[
                      { id: "mine", label: "M�os", count: recipeTabCounts.mine },
                      { id: "community", label: "Comunidad", count: recipeTabCounts.community },
                      { id: "app", label: "App", count: recipeTabCounts.app },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRecipeModalTab(tab.id as RecipeCatalogTab)}
                        className={cn(
                          "rounded-[1.15rem] px-3 py-2 text-[11px] font-black transition-all",
                          recipeModalTab === tab.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-5 whitespace-nowrap flex-wrap">
                    <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700">
                      <input
                        type="checkbox"
                        checked={showMatchingOnly}
                        onChange={(e) => setShowMatchingOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      Coincidencias de alimentos CON DIETA
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700">
                      <input
                        type="checkbox"
                        checked={showOnlyMyRecipes}
                        onChange={(e) => setShowOnlyMyRecipes(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      Mis alimentos
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700">
                      <input
                        type="checkbox"
                        checked={showOnlyAddedRecipes}
                        onChange={(e) => setShowOnlyAddedRecipes(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      Ya a�adidos
                    </label>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Tipo de comida
                    </p>
                    <div className="hidden flex flex-wrap gap-2">
                      {RECIPE_MEAL_SECTIONS.map((section) => (
                        <button
                          key={section.value || "all"}
                          type="button"
                          onClick={() => setRecipeMealSectionFilter(section.value)}
                          className={cn(
                            "rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            recipeMealSectionFilter === section.value
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                          )}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                    <select
                      value={recipeMealSectionFilter}
                      onChange={(e) => setRecipeMealSectionFilter(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
                    >
                      {RECIPE_MEAL_SECTIONS.map((section) => (
                        <option key={section.value || "all"} value={section.value}>
                          {section.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredRecipeLibrary.length > 0 ? (
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setRecipeLibraryPage((prev) => Math.max(1, prev - 1))}
                        disabled={recipeLibraryPage === 1}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Atr�s
                      </button>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {recipeLibraryPage} / {recipeLibraryTotalPages}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setRecipeLibraryPage((prev) =>
                            Math.min(recipeLibraryTotalPages, prev + 1),
                          )
                        }
                        disabled={recipeLibraryPage === recipeLibraryTotalPages}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Siguiente
                      </button>
                    </div>
                  ) : null}
                  <div className="grid gap-3 lg:grid-cols-1">
                    {isLoadingRecipeLibrary ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      </div>
                    ) : filteredRecipeLibrary.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                        <p className="text-sm font-black text-slate-700">
                          No hay platos para este filtro.
                        </p>
                      </div>
                    ) : (
                      paginatedRecipeLibrary.map((recipe) => (
                        <div
                          key={recipe.id}
                          draggable
                          onDragStart={() => {
                            setDraggedRecipeId(recipe.id);
                            setDraggedSlotId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedRecipeId(null);
                            setDropTargetKey(null);
                          }}
                          className={cn(
                            "relative rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 transition-all cursor-grab active:cursor-grabbing",
                            draggedRecipeId === recipe.id && "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={getRecipeImage(recipe)}
                                alt={recipe.title}
                                className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover"
                              />
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                    Arrastra
                                  </span>
                                  {recipe.mealSection ? (
                                    <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                      {getSlotLabelFromMealSection(recipe.mealSection)}
                                    </span>
                                  ) : null}
                                  <span className={cn(
                                    "rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500",
                                    showOnlyMyRecipes && "hidden",
                                  )}>
                                    {recipe.source === "mine"
                                      ? "M�o"
                                      : recipe.source === "community"
                                        ? "Comunidad"
                                        : "App"}
                                  </span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900">
                                  {recipe.title}
                                </h4>
                                <p className="text-xs font-medium text-slate-500">
                                  {(recipe.mainIngredients.length > 0
                                    ? recipe.mainIngredients
                                    : recipe.ingredients
                                  )
                                    .slice(0, 4)
                                    .join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewRecipeId((prev) => (prev === recipe.id ? null : recipe.id));
                                }}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                                title="Ver informaci�n del plato"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <Plus className="h-4 w-4 text-emerald-600 shrink-0" />
                            </div>
                          </div>
                          {enableSubstituteRecipes ? (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
                              <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={isRecipeMarkedAsSubstitute(recipe)}
                                  disabled={!getSubstituteSectionForRecipe(recipe)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSubstituteRecipe(recipe, e.target.checked);
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-40"
                                />
                                Sustituto
                                <span className="text-slate-400 normal-case tracking-normal font-medium">
                                  {getSubstituteSectionForRecipe(recipe)
                                    ? `(${getSubstituteSectionForRecipe(recipe)})`
                                    : "(solo desayuno/almuerzo)"}
                                </span>
                              </label>
                            </div>
                          ) : null}
                          {previewRecipeId === recipe.id ? (
                            <div className="mt-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    Vista r�pida
                                  </p>
                                  <p className="mt-1 text-sm font-black text-slate-900">
                                    {recipe.title}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewRecipeId(null);
                                  }}
                                  className="rounded-xl p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                                  title="Cerrar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="mt-3 text-xs font-medium leading-relaxed text-slate-600">
                                {truncateText(recipe.description, 220) || "Sin descripci�n disponible."}
                              </p>
                              {recipe.preparation ? (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Preparaci�n
                                  </p>
                                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                                    {truncateText(recipe.preparation, 260)}
                                  </p>
                                </div>
                              ) : null}
                              {recipe.recommendedPortion ? (
                                <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    Porcion recomendada
                                  </p>
                                  <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800">
                                    {recipe.recommendedPortion}
                                  </p>
                                </div>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {recipe.calories} kcal
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {recipe.protein}g prot
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {recipe.carbs}g cho
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {recipe.fats}g lip
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Panel: Daily Schedule / Calendar */}
            <div className="lg:col-span-6 space-y-6">
              {plannerView === "daily" && (
                <>
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Repeticiones del ciclo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCycleDayCount(num)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                            cycleDayCount === num
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                          )}
                        >
                          {num} d�a{num > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4 xl:grid-cols-7">
                    {days.map((day) => (
                      <button
                        key={day}
                        onClick={() => setCurrentDay(day)}
                        className={cn(
                          "rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                          currentDay === day
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateAI("day")}
                        disabled={isGenerating}
                        className="rounded-2xl font-bold flex items-center gap-2 border-slate-200"
                      >
                        <Zap className="h-4 w-4" />
                        {isGenerating && aiFillScope === "day"
                          ? "Generando d�a..."
                          : "Rellenar d�a con IA"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Despierta � {wakeUpTime}
                      </p>
                    </div>
                    {currentSlots.map((slot) => {
                      const isDropTarget = dropTargetKey === `${currentDay}-${slot.id}`;
                      const isDropBlocked =
                        isDropTarget &&
                        !!draggedRecipe &&
                        !isRecipeMealSectionCompatible(draggedRecipe, slot);

                      return (
                        <div
                          key={slot.id}
                          className="group relative flex gap-6"
                          draggable
                          onDragStart={() => setDraggedSlotId(slot.id)}
                          onDragEnd={() => setDraggedSlotId(null)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTargetKey(`${currentDay}-${slot.id}`);
                          }}
                          onDragLeave={() => {
                            if (dropTargetKey === `${currentDay}-${slot.id}`) {
                              setDropTargetKey(null);
                            }
                          }}
                          onDrop={() => handleSlotDrop(slot.id, currentDay)}
                        >
                          {/* Time marker */}
                          <div className="flex flex-col items-center gap-2 pt-2">
                            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
                              <input
                                type="text"
                                value={slotTimeDrafts[slot.id] ?? slot.time}
                                onChange={(e) =>
                                  handleSlotTimeDraftChange(slot.id, e.target.value)
                                }
                                onBlur={() => commitSlotTimeChange(slot.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
                                  if (e.key === "Escape") {
                                    setSlotTimeDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[slot.id];
                                      return next;
                                    });
                                    e.currentTarget.blur();
                                  }
                                }}
                                inputMode="numeric"
                                maxLength={5}
                                placeholder="HH:MM"
                                aria-label={`Editar hora de ${slot.label}`}
                                className="h-5 w-[78px] border-0 bg-transparent p-0 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none"
                              />
                              <Pencil className="h-3 w-3 text-slate-400" />
                            </div>
                            <div className="w-[2px] h-full bg-slate-100 group-last:bg-transparent" />
                          </div>

                          {/* Slot Card */}
                          <div
                            className={cn(
                              "flex-1 p-6 rounded-[2.5rem] border transition-all relative overflow-hidden",
                              isDropTarget &&
                              (isDropBlocked
                                ? "ring-2 ring-rose-300 border-rose-300 bg-rose-50/30"
                                : "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/30"),
                              draggedSlotId === slot.id && "ring-2 ring-emerald-300",
                              slot.recipe
                                ? "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300"
                                : "bg-slate-50 border-dashed border-slate-300",
                            )}
                          >
                            {isDropBlocked ? (
                              <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                                <Lock className="h-3 w-3" />
                                Bloqueado
                              </div>
                            ) : null}
                            {slot.isUserAdded ? (
                              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMealBlockModal(slot.id)}
                                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                                  title="Editar tipo de bloque"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMealBlock(slot.id)}
                                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                  title="Eliminar bloque"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : null}
                            {!slot.recipe ? (
                              <div className="flex items-center justify-between h-20">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                                    {slot.type === "desayuno" ? (
                                      <Coffee className="h-6 w-6 text-slate-300" />
                                    ) : (
                                      <Sun className="h-6 w-6 text-slate-300" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs leading-none mb-1">
                                      {slot.label}
                                    </h4>
                                    <p className="text-sm font-medium text-slate-300 italic">
                                      Pendiente por generar...
                                    </p>
                                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      <GripVertical className="h-3 w-3" />
                                      Arrastrar
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    className="text-slate-600 hover:bg-slate-100 rounded-xl font-black text-xs uppercase"
                                    onClick={() => openQuickMealModal(currentDay, slot.id)}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Crear comida r�pida
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="text-emerald-600 hover:bg-emerald-50 rounded-xl font-black text-xs uppercase"
                                    onClick={() => openSlotEditor(currentDay, slot.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Filtrar platos
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="h-32 w-full md:w-32 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 text-[0px] shadow-inner relative group-hover:scale-105 transition-transform">
                                  <img
                                    src={getRecipeImage(slot.recipe, slot.mealSection || slot.type)}
                                    alt={slot.recipe.title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                  {slot.type === "desayuno" ? "??" : "??"}
                                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                          <GripVertical className="h-3 w-3" />
                                          Arrastrar
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em]">
                                          {slot.label}
                                        </span>
                                        <span
                                          className={cn(
                                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                            slot.recipe.complexity === "simple"
                                              ? "bg-blue-50 text-blue-600 border-blue-100"
                                              : "bg-purple-50 text-purple-600 border-purple-100",
                                          )}
                                        >
                                          {slot.recipe.complexity}
                                        </span>
                                      </div>
                                      <h4 className="text-xl font-black text-slate-900 leading-tight">
                                        {slot.recipe.title}
                                      </h4>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => clearRecipeFromSlot(currentDay, slot.id)}
                                        className="p-2.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                        title="Quitar plato de este bloque"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    {truncateText(slot.recipe.description, 160)}
                                  </p>
                                  {slot.recipe.extraIngredients?.length ? (
                                    <p className="text-xs font-black text-amber-700">
                                      Ingredientes a�adidos: {slot.recipe.extraIngredients.join(", ")}
                                    </p>
                                  ) : null}
                                  <div className="space-y-1">
                                    {slot.recipe.recommendedPortion ? (
                                      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                                        Porcion: {slot.recipe.recommendedPortion}
                                      </p>
                                    ) : null}
                                    <Input
                                      value={slot.recipe.recommendedPortion || ""}
                                      onChange={(e) =>
                                        handleSlotPortionChange(
                                          currentDay,
                                          slot.id,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Porciones (opcional)"
                                      className="h-9 rounded-xl border-slate-200 bg-white text-xs"
                                    />
                                  </div>

                                  <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 transition-all">
                                      <Dumbbell className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        {slot.recipe.protein}g Prot
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-all">
                                      <Flame className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        {slot.recipe.calories} kcal
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-all">
                                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        {slot.recipe.carbs}g Cho
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-all">
                                      <Droplet className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        {slot.recipe.fats}g Lip
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2 pl-2">
                      <Moon className="h-4 w-4 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Duerme � {sleepTime}
                      </p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={handleOpenAddBlockModal}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition-all hover:bg-amber-100"
                      >
                        + Agregar bloque de comida
                      </button>
                    </div>
                  </div>
                </>
              )}

              {plannerView === "weekly" && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {days.map((day) => (
                    <div
                      key={day}
                      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                            D�a
                          </p>
                          <h4 className="text-lg font-black text-slate-900">{day}</h4>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentDay(day);
                            setPlannerView("daily");
                          }}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200"
                        >
                          Abrir
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(weekSlots[day] || []).map((slot) => {
                          const isDropTarget = dropTargetKey === `${day}-${slot.id}`;
                          const isDropBlocked =
                            isDropTarget &&
                            !!draggedRecipe &&
                            !isRecipeMealSectionCompatible(draggedRecipe, slot);

                          return (
                            <div
                              key={`${day}-${slot.id}`}
                              draggable
                              onDragStart={() => {
                                setCurrentDay(day);
                                setDraggedSlotId(slot.id);
                              }}
                              onDragEnd={() => setDraggedSlotId(null)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDropTargetKey(`${day}-${slot.id}`);
                              }}
                              onDragLeave={() => {
                                if (dropTargetKey === `${day}-${slot.id}`) {
                                  setDropTargetKey(null);
                                }
                              }}
                              onDrop={() => {
                                handleSlotDrop(slot.id, day);
                              }}
                              className={cn(
                                "rounded-2xl border p-4 transition-all cursor-pointer",
                                isDropTarget &&
                                (isDropBlocked
                                  ? "ring-2 ring-rose-300 border-rose-300 bg-rose-50/30"
                                  : "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/30"),
                                slot.recipe
                                  ? "border-slate-200 bg-slate-50"
                                  : "border-dashed border-slate-300 bg-white",
                              )}
                              onClick={() => openSlotEditor(day, slot.id)}
                            >
                              {isDropBlocked ? (
                                <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                                  <Lock className="h-3 w-3" />
                                  Bloqueado
                                </div>
                              ) : null}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {slot.recipe ? (
                                    <img
                                      src={getRecipeImage(slot.recipe, slot.mealSection || slot.type)}
                                      alt={slot.recipe.title}
                                      className="mt-0.5 h-12 w-12 shrink-0 rounded-2xl border border-slate-200 object-cover"
                                    />
                                  ) : null}
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      {slot.time} � {slot.label}
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                      {slot.recipe?.title || "Sin alimento asignado"}
                                    </p>
                                    {slot.recipe?.description ? (
                                      <p className="mt-1 text-xs font-medium text-slate-500">
                                        {truncateText(slot.recipe.description, 90)}
                                      </p>
                                    ) : null}
                                    {slot.recipe?.extraIngredients?.length ? (
                                      <p className="mt-1 text-[11px] font-black text-amber-700">
                                        Ingredientes a�adidos: {slot.recipe.extraIngredients.join(", ")}
                                      </p>
                                    ) : null}
                                    {slot.recipe?.recommendedPortion ? (
                                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                        Porcion: {slot.recipe.recommendedPortion}
                                      </p>
                                    ) : null}
                                    {slot.recipe ? (
                                      <Input
                                        value={slot.recipe.recommendedPortion || ""}
                                        onChange={(e) =>
                                          handleSlotPortionChange(day, slot.id, e.target.value)
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="Porciones (opcional)"
                                        className="mt-2 h-8 rounded-xl border-slate-200 bg-white text-xs"
                                      />
                                    ) : null}
                                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      <GripVertical className="h-3 w-3" />
                                      Arrastrar
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {slot.isUserAdded ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditMealBlockModal(slot.id, day);
                                      }}
                                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                                      title="Editar tipo de bloque"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                  {slot.isUserAdded ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveMealBlock(slot.id, day);
                                      }}
                                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                      title="Eliminar bloque"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                  {slot.recipe ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearRecipeFromSlot(day, slot.id);
                                      }}
                                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                      title="Quitar plato"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openQuickMealModal(day, slot.id);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                    title="Crear comida r�pida"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: Configuration / Sidebar */}
            <div className="lg:col-span-3 space-y-6 sticky top-24">
              {/* Summary Card - Standardized Sidebar Summary */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Balance del d�a ({currentDay})
                    </p>
                    <h3 className="text-3xl font-black text-slate-900">
                      {dayTotalsWithSupplement.calories}
                      <span className="text-sm text-slate-400 font-bold ml-1 uppercase tracking-widest">
                        kcal
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Protein Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Prote�na</span>
                        <span className="text-emerald-600">
                          {Math.round(dayTotalsWithSupplement.protein)}g / {targetProtein}g
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000 bg-emerald-500",
                          )}
                          style={{
                            width: `${Math.min(100, (dayTotalsWithSupplement.protein / Math.max(targetProtein, 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Carbs Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Carbohidratos</span>
                        <span className="text-blue-600">
                          {dayTotals.carbs}g / {targetCarbs}g
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, (dayTotals.carbs / targetCarbs) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Fats Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Grasas</span>
                        <span className="text-purple-600">
                          {dayTotals.fats}g / {targetFats}g
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, (dayTotals.fats / targetFats) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {selectedPatient ? (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Metas del paciente
                        </p>
                        {patientNutritionGoals ? (
                          <div className="mt-3 space-y-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  Objetivos editables
                                </p>
                                {isEditingPatientGoals ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      className="h-8 rounded-xl px-3 text-[10px] font-black uppercase"
                                      onClick={() => {
                                        setTargetCalories(patientNutritionGoals.calories);
                                        setTargetProtein(patientNutritionGoals.protein);
                                        setTargetCarbs(patientNutritionGoals.carbs);
                                        setTargetFats(patientNutritionGoals.fats);
                                        setIsEditingPatientGoals(false);
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      className="h-8 rounded-xl bg-emerald-600 px-3 text-[10px] font-black uppercase text-white hover:bg-emerald-700"
                                      onClick={assignPatientGoalsFromCurrentTargets}
                                    >
                                      Guardar
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="h-8 rounded-xl px-3 text-[10px] font-black uppercase"
                                    onClick={() => {
                                      setTargetCalories(patientNutritionGoals.calories);
                                      setTargetProtein(patientNutritionGoals.protein);
                                      setTargetCarbs(patientNutritionGoals.carbs);
                                      setTargetFats(patientNutritionGoals.fats);
                                      setIsEditingPatientGoals(true);
                                    }}
                                  >
                                    Editar metas
                                  </Button>
                                )}
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  value={targetCalories}
                                  disabled={!isEditingPatientGoals}
                                  onChange={(e) => setTargetCalories(Math.max(0, Number(e.target.value) || 0))}
                                  placeholder="kcal"
                                  className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                                />
                                <Input
                                  type="number"
                                  value={targetProtein}
                                  disabled={!isEditingPatientGoals}
                                  onChange={(e) => setTargetProtein(Math.max(0, Number(e.target.value) || 0))}
                                  placeholder="prot"
                                  className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                                />
                                <Input
                                  type="number"
                                  value={targetCarbs}
                                  disabled={!isEditingPatientGoals}
                                  onChange={(e) => setTargetCarbs(Math.max(0, Number(e.target.value) || 0))}
                                  placeholder="cho"
                                  className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                                />
                                <Input
                                  type="number"
                                  value={targetFats}
                                  disabled={!isEditingPatientGoals}
                                  onChange={(e) => setTargetFats(Math.max(0, Number(e.target.value) || 0))}
                                  placeholder="lip"
                                  className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                                />
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Cumplimiento diario ({currentDay})
                              </p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
                                <span className={dayTotalsWithSupplement.calories >= patientNutritionGoals.calories ? "text-emerald-600" : "text-slate-500"}>
                                  kcal {dayTotalsWithSupplement.calories}/{patientNutritionGoals.calories}
                                </span>
                                <span className={dayTotalsWithSupplement.protein >= patientNutritionGoals.protein ? "text-emerald-600" : "text-slate-500"}>
                                  prot {Math.round(dayTotalsWithSupplement.protein)}/{patientNutritionGoals.protein}
                                </span>
                                <span className={dayTotals.carbs >= patientNutritionGoals.carbs ? "text-emerald-600" : "text-slate-500"}>
                                  cho {Math.round(dayTotals.carbs)}/{patientNutritionGoals.carbs}
                                </span>
                                <span className={dayTotals.fats >= patientNutritionGoals.fats ? "text-emerald-600" : "text-slate-500"}>
                                  lip {Math.round(dayTotals.fats)}/{patientNutritionGoals.fats}
                                </span>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Cumplimiento semanal
                              </p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
                                <span className={weekTotalsWithSupplement.calories >= patientNutritionGoals.calories * 7 ? "text-emerald-600" : "text-slate-500"}>
                                  kcal {weekTotalsWithSupplement.calories}/{patientNutritionGoals.calories * 7}
                                </span>
                                <span className={weekTotalsWithSupplement.protein >= patientNutritionGoals.protein * 7 ? "text-emerald-600" : "text-slate-500"}>
                                  prot {Math.round(weekTotalsWithSupplement.protein)}/{patientNutritionGoals.protein * 7}
                                </span>
                                <span className={weekTotals.carbs >= patientNutritionGoals.carbs * 7 ? "text-emerald-600" : "text-slate-500"}>
                                  cho {Math.round(weekTotals.carbs)}/{patientNutritionGoals.carbs * 7}
                                </span>
                                <span className={weekTotals.fats >= patientNutritionGoals.fats * 7 ? "text-emerald-600" : "text-slate-500"}>
                                  lip {Math.round(weekTotals.fats)}/{patientNutritionGoals.fats * 7}
                                </span>
                              </div>
                            </div>
                            {recommendedProteinRange ? (
                              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                  Referencia prote�na por peso
                                </p>
                                <p className="mt-1 text-xs font-bold text-emerald-900">
                                  {selectedPatientActivityLevel === "deportista"
                                    ? "Deportista"
                                    : "Sedentario"}: {recommendedProteinRange.min}g - {recommendedProteinRange.max}g/d�a
                                </p>
                                {proteinSupplementPerDay > 0 ? (
                                  <p className="mt-1 text-[11px] font-bold text-emerald-700">
                                    Incluye suplemento: +{proteinSupplementPerDay}g/d�a.
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-bold text-amber-900">
                              El paciente no tiene registradas metas de proteina, calorias, carbohidratos y grasas. La IA no las considerara.
                            </p>
                            <Button
                              onClick={assignPatientGoalsFromCurrentTargets}
                              disabled={!selectedPatient}
                              className="mt-3 h-9 rounded-xl bg-amber-600 px-4 text-white hover:bg-amber-700"
                            >
                              Asignar
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Biblioteca de platos
                    </p>
                    <h4 className="mt-1 text-base font-black text-slate-900">
                      Arrastra un plato al bloque que quieras completar
                    </h4>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      placeholder="Buscar plato..."
                      className="pl-10 h-11 rounded-2xl border-slate-200 font-bold"
                    />
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-1.5 grid grid-cols-3 gap-1.5">
                    {[
                      { id: "mine", label: "M�os", count: recipeTabCounts.mine },
                      { id: "community", label: "Com.", count: recipeTabCounts.community },
                      { id: "app", label: "App", count: recipeTabCounts.app },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRecipeModalTab(tab.id as RecipeCatalogTab)}
                        className={cn(
                          "rounded-xl px-2 py-2 text-[10px] font-black transition-all",
                          recipeModalTab === tab.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    <input
                      type="checkbox"
                      checked={showMatchingOnly}
                      onChange={(e) => setShowMatchingOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
                    />
                    Coincidencias
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {RECIPE_MEAL_SECTIONS.map((section) => (
                      <button
                        key={section.value || "all"}
                        type="button"
                        onClick={() => setRecipeMealSectionFilter(section.value)}
                        className={cn(
                          "rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all",
                          recipeMealSectionFilter === section.value
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        )}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                    {isLoadingRecipeLibrary ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      </div>
                    ) : filteredRecipeLibrary.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs font-black text-slate-500">
                        No hay platos con estos filtros.
                      </div>
                    ) : (
                      filteredRecipeLibrary.map((recipe) => (
                        <div
                          key={`sidebar-${recipe.id}`}
                          draggable
                          onDragStart={() => {
                            setDraggedRecipeId(recipe.id);
                            setDraggedSlotId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedRecipeId(null);
                            setDropTargetKey(null);
                          }}
                          className={cn(
                            "rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all cursor-grab active:cursor-grabbing",
                            draggedRecipeId === recipe.id &&
                            "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                Arrastra
                              </p>
                              <h5 className="mt-1 text-xs font-black text-slate-900">
                                {recipe.title}
                              </h5>
                            </div>
                            <Plus className="h-4 w-4 text-emerald-600 shrink-0" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Modals moved inside main container for proper layout context */}
        {showSwapModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowSwapModal(false)}
          >
            <div
              className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <RotateCcw className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Ajustar bloque
                    </h3>
                    <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">
                      Agrega o cambia alimentos dentro de este bloque del d�a.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSwapModal(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <Input
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Buscar plato o ingrediente principal..."
                    className="pl-12 h-14 rounded-3xl border-slate-200 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="rounded-3xl bg-slate-100 p-2 grid grid-cols-3 gap-2 flex-1">
                    {[
                      { id: "mine", label: "M�os", count: recipeTabCounts.mine },
                      {
                        id: "community",
                        label: "Comunidad",
                        count: recipeTabCounts.community,
                      },
                      { id: "app", label: "Aplicaci�n", count: recipeTabCounts.app },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRecipeModalTab(tab.id as RecipeCatalogTab)}
                        className={cn(
                          "rounded-[1.35rem] px-4 py-3 text-sm font-black transition-all",
                          recipeModalTab === tab.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
                    <input
                      type="checkbox"
                      checked={showMatchingOnly}
                      onChange={(e) => setShowMatchingOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
                    />
                    Coincidencias de alimentos
                  </label>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500">
                  {showMatchingOnly
                    ? sourceFoods.length > 0
                      ? "Mostrando solo platos cuyos ingredientes principales coinciden con los alimentos cargados en la dieta."
                      : "Activa la dieta o el carrito primero para detectar coincidencias por ingredientes principales."
                    : "Viendo todos los platos disponibles en esta pesta�a."}
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Tipo de comida
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RECIPE_MEAL_SECTIONS.map((section) => (
                      <button
                        key={section.value || "all"}
                        type="button"
                        onClick={() => setRecipeMealSectionFilter(section.value)}
                        className={cn(
                          "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                          recipeMealSectionFilter === section.value
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        )}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingRecipeLibrary ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                ) : filteredRecipeLibrary.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <p className="text-base font-black text-slate-700">
                      No encontramos platos en esta vista.
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Ajusta la b�squeda, cambia de pesta�a o desactiva el filtro de coincidencias.
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {filteredRecipeLibrary.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 border border-slate-100 bg-slate-50 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer flex items-center justify-between"
                      onClick={() => assignRecipeToActiveSlot(r)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                          ??
                        </div>
                        <div>
                          <h5 className="font-black text-slate-900 leading-none mb-1">
                            {r.title}
                          </h5>
                          <div className="flex gap-2">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                              {r.protein}g Prote�na
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                              �
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                              {r.complexity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  className="font-bold text-slate-500 rounded-2xl hover:bg-white"
                  onClick={() => setShowSwapModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        <Modal
          isOpen={showQuickMealModal}
          onClose={() => {
            setShowQuickMealModal(false);
            setQuickMealTarget(null);
          }}
          title="Crear comida r�pida"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
              Completa lo m�nimo para asignar una comida al bloque actual.
            </div>

            {isGenerating ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                    <ChefHat className="h-5 w-5 animate-pulse text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-800">
                      La IA est� cocinando tus platos...
                    </p>
                    <p className="text-xs font-medium text-amber-700">
                      Esto puede tardar unos segundos seg�n la cantidad de bloques.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Nombre *
              </label>
              <Input
                value={quickMealDraft.title}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ej: Arroz con pollo"
                className="h-11 rounded-2xl border-slate-200 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Descripci�n
              </label>
              <Textarea
                value={quickMealDraft.description}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Descripci�n breve (opcional)"
                className="min-h-[84px] rounded-2xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                value={quickMealDraft.recommendedPortion}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({
                    ...prev,
                    recommendedPortion: e.target.value,
                  }))
                }
                placeholder="Porci�n (opcional)"
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
              <Input
                value={quickMealDraft.preparation}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, preparation: e.target.value }))
                }
                placeholder="Preparaci�n (opcional)"
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min={0}
                value={quickMealDraft.calories}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, calories: e.target.value }))
                }
                placeholder="kcal"
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
              <Input
                type="number"
                min={0}
                value={quickMealDraft.protein}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, protein: e.target.value }))
                }
                placeholder="prot (g)"
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
              <Input
                type="number"
                min={0}
                value={quickMealDraft.carbs}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, carbs: e.target.value }))
                }
                placeholder="cho (g)"
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
              <Input
                type="number"
                min={0}
                value={quickMealDraft.fats}
                onChange={(e) =>
                  setQuickMealDraft((prev) => ({ ...prev, fats: e.target.value }))
                }
                placeholder="lip (g)"
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                className="rounded-2xl font-bold"
                onClick={() => {
                  setShowQuickMealModal(false);
                  setQuickMealTarget(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                onClick={submitQuickMeal}
              >
                Guardar comida r�pida
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showAiFillModal}
          onClose={() => {
            if (isGenerating) return;
            setShowAiFillModal(false);
          }}
          title={aiFillScope === "day" ? "Rellenar d�a con IA" : "Rellenar semana con IA"}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700">
              <p className="font-black text-slate-900">
                {aiFillScope === "day"
                  ? `Se completar�n los bloques vac�os de ${currentDay}.`
                  : "Se completar�n los bloques vac�os de toda la semana."}
              </p>
              <p className="mt-2">
                Bloques pendientes: {getEmptySlotsForScope(aiFillScope).length} � Alimentos base detectados: {sourceFoods.length}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Preferencia del nutri
              </label>
              <Textarea
                value={aiNutritionistNotes}
                onChange={(e) => setAiNutritionistNotes(e.target.value)}
                placeholder="Ej: m�s desayunos salados, evitar huevo de noche..."
                className="min-h-[96px] rounded-2xl border-slate-200"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Estilo de recetas
                </label>
                <select
                  value={aiRecipeStyle}
                  onChange={(e) => setAiRecipeStyle(e.target.value as AiRecipeStyle)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="very-simple">Muy simples</option>
                  <option value="simple">Simples</option>
                  <option value="varied">M�s variadas</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Tiempo
                </label>
                <select
                  value={aiTimeStyle}
                  onChange={(e) => setAiTimeStyle(e.target.value as AiTimeStyle)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="quick">R�pidas</option>
                  <option value="normal">Normales</option>
                </select>
              </div>
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={aiSnackFlexAllowed}
                onChange={(e) => setAiSnackFlexAllowed(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Permitir snacks fuera de dieta en bloques variables
            </label>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                className="rounded-2xl font-bold"
                onClick={() => setShowAiFillModal(false)}
                disabled={isGenerating}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void handleSubmitAiFill()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cocinando...
                  </>
                ) : (
                  "Generar con IA"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showAddBlockModal}
          onClose={() => {
            setShowAddBlockModal(false);
            setEditingMealBlockId(null);
          }}
          title={editingMealBlockId ? "Editar bloque de comida" : "Agregar bloque de comida"}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Elige qu� tipo de bloque quieres sumar a toda la semana.
            </p>

            <div className="grid gap-3">
              {(editingMealBlockId
                ? availableMealSectionsForEditing
                : availableMealSectionsToAdd
              ).map((section) => (
                <button
                  key={section.value}
                  type="button"
                  onClick={() =>
                    editingMealBlockId
                      ? handleUpdateMealBlock(section.value)
                      : handleAddMealBlock(section.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left font-black text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{section.label}</span>
                    {"isCurrent" in section && section.isCurrent ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Actual
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            {(editingMealBlockId
              ? availableMealSectionsForEditing.length === 0
              : availableMealSectionsToAdd.length === 0) ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500">
                No hay m�s tipos disponibles para agregar con la estructura actual.
              </div>
            ) : null}
          </div>
        </Modal>
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
                        {patient.email || "Sin email"} �{" "}
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
      </Modal>

      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={async () => {
          const draft = readWorkflowDraft();
          draft.recipes = buildRecipesModule();
          if (selectedPatient) {
            draft.patientMeta = buildPatientMeta(selectedPatient);
          }
          localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
          try {
            await persistRecipesCreation(creationDescription);
            toast.success("Recetas guardadas correctamente.");
            setIsSaveCreationModalOpen(false);
            setCreationDescription("");
          } catch (error: any) {
            toast.error(error?.message || "No se pudieron guardar las recetas.");
          }
        }}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title="Guardar recetas"
        subtitle="A�ade una breve descripci�n para reconocer estas recetas m�s tarde."
      />
    </>
  );
}
