import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { SectionProgressStatus } from "@/components/shared/SectionProgressNav";
import { useAdmin } from "@/context/AdminContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useDashboardShell } from "@/context/DashboardShellContext";
import mealSectionsData from "@/content/meal-sections.json";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { buildExchangeGuideForAi } from "@/lib/exchange-portions";
import { downloadQuickRecipesPdf } from "@/features/pdf/quickRecipesPdfExport";
import { getCurrentUser } from "@/lib/current-user";
import {
  fetchProject,
  fetchCreation,
  saveCreation,
  updateProject,
} from "@/lib/workflow";
import {
  // Types
  Recipe,
  MealSlot,
  RecipeCatalogTab,
  RecipeApiSummary,
  QuickIngredient,
  QuickGeneratedDish,
  MealSectionTarget,
  SubstituteMealSection,
  SubstituteRecipeItem,
  NutritionGoals,
  ActivityLevel,
  PatientContext,
  ProteinSupplement,
  PlannerView,
  RecipesGuideSectionId,
  // Helper Functions
  calculateAgeYears,
  sanitizeNutritionGoals,
  normalizeString,
  getCustomVariablesArray,
  findCustomVariable,
  readCustomVariableNumber,
  readCustomVariableText,
  getActivityLevel,
  getGoalsFromPatient,
  getRecommendedProteinRange,
  parseDelimitedList,
  createEmptyPatientContext,
  normalizePatientContext,
  buildRecipeIngredientHints,
  buildExtraIngredientsFromAi,
  normalizeMealSlot,
  normalizeWeekSlots,
  getStructureTemplate,
  classifyRecipeSource,
  mapRecipeSummaryToRecipe,
  createCycleDayLabels,
  // Constants
  MOCK_RECIPES,
  SLOT_LIBRARY,
  DEFAULT_MEAL_COUNT,
  DEFAULT_SLOTS,
  RECIPE_MEAL_SECTIONS,
  UNIQUE_MEAL_SECTIONS,
  MANUAL_SLOT_ID_PATTERN,
  DEFAULT_RECIPE_IMAGES,
} from "../utils/recipe-helpers";

interface UseRecipesStateProps {
  id?: string;
}

export function useRecipesState({ id }: UseRecipesStateProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const { role } = useAdmin();
  const { can } = useSubscription();
  const { setSidebarCollapsed, flashSidebarToggle, isSidebarCollapsed } =
    useDashboardShell();
  const hasCollapsedSidebarForRecipesRef = useRef(false);

  // Sections Refs
  const baseSectionRef = useRef<HTMLDivElement | null>(null);
  const patientSectionRef = useRef<HTMLDivElement | null>(null);
  const structureSectionRef = useRef<HTMLDivElement | null>(null);
  const librarySectionRef = useRef<HTMLDivElement | null>(null);
  const plannerSectionRef = useRef<HTMLDivElement | null>(null);

  // -- State --
  const [mealCount, setMealCount] = useState(DEFAULT_MEAL_COUNT);
  const [plannerView, setPlannerView] = useState<PlannerView>("daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [draggedRecipeId, setDraggedRecipeId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [slotTimeDrafts, setSlotTimeDrafts] = useState<Record<string, string>>({});
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
  const [patientInfo, setPatientInfo] = useState<any>({ name: "Juan Pérez" });

  // Nutritional Targets (Editable)
  const [targetProtein, setTargetProtein] = useState(180);
  const [targetCalories, setTargetCalories] = useState(2400);
  const [targetCarbs, setTargetCarbs] = useState(250);
  const [targetFats, setTargetFats] = useState(70);
  const [proteinSupplement, setProteinSupplement] = useState<ProteinSupplement>({
    enabled: false,
    gramsPerDay: 25,
  });
  const [pendingAiDishes, setPendingAiDishes] = useState<any[]>([]);
  const [isAiValidationModalOpen, setIsAiValidationModalOpen] = useState(false);
  const [aiDisabledSetting, setAiDisabledSetting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAiDisabledSetting(localStorage.getItem("nutri_ai_disabled") === "true");
    }
  }, []);

  const canUseAiAutofill = can("ai.autofill.access") && !aiDisabledSetting;

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showQuickMealModal, setShowQuickMealModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [editingMealBlockId, setEditingMealBlockId] = useState<string | null>(null);
  const [previewRecipeId, setPreviewRecipeId] = useState<string | null>(null);

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
  const [isImportPatientModalOpen, setIsImportPatientModalOpen] = useState(false);
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
  const [activeGuideSection, setActiveGuideSection] = useState<RecipesGuideSectionId>("base");
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectIdFromUrl);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(null);
  const [isRecipesHydrated, setIsRecipesHydrated] = useState(false);

  const updateSelectedPatientContext = (
    updater: (current: PatientContext) => PatientContext,
  ) => {
    setSelectedPatient((current: PatientContext | null) => {
      const base = normalizePatientContext(current) || createEmptyPatientContext();
      return {
        ...updater(base),
        updatedAt: new Date().toISOString(),
      };
    });
  };

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
  }, [flashSidebarToggle, isSidebarCollapsed, setSidebarCollapsed]);

  const getGuideSectionStatus = (
    enabled: boolean,
    isComplete: boolean,
  ): SectionProgressStatus => {
    if (!enabled) return "hidden";
    return isComplete ? "complete" : "pending";
  };

  const recipesGuideSections = useMemo(
    () => [
      {
        id: "base" as RecipesGuideSectionId,
        label: "Base alimentaria",
        status: getGuideSectionStatus(true, hasSourceData),
        ref: baseSectionRef,
      },
      {
        id: "patient" as RecipesGuideSectionId,
        label: "Paciente",
        status: getGuideSectionStatus(
          true,
          Boolean(selectedPatient?.fullName) &&
            selectedPatient?.ageYears !== null &&
            selectedPatient?.ageYears !== undefined &&
            Boolean(selectedPatient?.gender) &&
            (Boolean(selectedPatient?.noDietaryRestrictions) ||
              Boolean(selectedPatient?.restrictions?.length)),
        ),
        ref: patientSectionRef,
      },
      {
        id: "structure" as RecipesGuideSectionId,
        label: "Configuracion",
        status: getGuideSectionStatus(
          hasSourceData,
          mealCount > 0 && cycleDayCount > 0,
        ),
        ref: structureSectionRef,
      },
      {
        id: "library" as RecipesGuideSectionId,
        label: "Biblioteca",
        status: getGuideSectionStatus(
          hasSourceData,
          recipeLibrary.length > 0,
        ),
        ref: librarySectionRef,
      },
      {
        id: "planner" as RecipesGuideSectionId,
        label: "Planner",
        status: getGuideSectionStatus(
          hasSourceData,
          currentSlots.some((slot) => Boolean(slot.recipe)),
        ),
        ref: plannerSectionRef,
      },
    ],
    [
      cycleDayCount,
      currentSlots,
      hasSourceData,
      mealCount,
      recipeLibrary.length,
      selectedPatient?.ageYears,
      selectedPatient?.fullName,
      selectedPatient?.gender,
      selectedPatient?.noDietaryRestrictions,
      selectedPatient?.restrictions,
    ],
  );

  const scrollToGuideSection = (sectionId: RecipesGuideSectionId) => {
    const targetSection = recipesGuideSections.find(
      (section) => section.id === sectionId,
    );
    targetSection?.ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const updateActiveSection = () => {
      const viewportOffset = 180;
      let nextSection = recipesGuideSections[0]?.id ?? "base";

      recipesGuideSections.forEach((section) => {
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
  }, [recipesGuideSections]);

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
  }, [
    recipeSearch,
    recipeMealSectionFilter,
    showOnlyMyRecipes,
    showOnlyAddedRecipes,
    showMatchingOnly,
  ]);

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

  const buildPatientMeta = (patient: any) => normalizePatientContext(patient) || undefined;

  const applyDietMacroTargets = (draft: Record<string, any>) => {
    const source = draft?.diet?.macroTargets || draft?.diet?.targets;
    if (!source) return false;

    const calories = Number(source.calories || source.targetCalories || 0);
    const protein = Number(source.protein || source.targetProtein || 0);
    const carbs = Number(source.carbs || source.targetCarbs || 0);
    const fats = Number(source.fats || source.targetFats || 0);

    if (calories > 0) setTargetCalories(Math.round(calories));
    if (protein > 0) setTargetProtein(Math.round(protein));
    if (carbs > 0) setTargetCarbs(Math.round(carbs));
    if (fats > 0) setTargetFats(Math.round(fats));

    return calories > 0 || protein > 0 || carbs > 0 || fats > 0;
  };

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
      note: "",
      replacementGuide: [],
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
        if (draft.diet) {
          syncSourceFoods(draft);
          applyDietMacroTargets(draft);
        }

        if (draft.recipes && draft.recipes.weekSlots && !alreadyDecided) {
          setDraftMeta({
            label: `Recetas: plan semanal guardado`,
            date: draft.recipes.updatedAt,
          });
          setShowDraftModal(true);
          const storedPatient = localStorage.getItem("nutri_patient");
          if (storedPatient) {
            try {
              setSelectedPatient(normalizePatientContext(JSON.parse(storedPatient)));
            } catch (_) {}
          }
          setIsRecipesHydrated(true);
          return;
        }

        if (draft.recipes) {
          applyRecipesContent(draft.recipes);
        }

        if (draft.patientMeta) {
          setSelectedPatient(normalizePatientContext(draft.patientMeta));
        }
      } catch (e) {
        console.error("Error loading recipes draft", e);
      }
    }

    const storedPatient = localStorage.getItem("nutri_patient");
    if (storedPatient) {
      try {
        setSelectedPatient(normalizePatientContext(JSON.parse(storedPatient)));
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
          const normalizedProjectPatient = normalizePatientContext(project.patient);
          setSelectedPatient(normalizedProjectPatient);
          localStorage.setItem("nutri_patient", JSON.stringify(normalizedProjectPatient));
        }

        const nextDraft = readWorkflowDraft();

        if (project.patient) {
          nextDraft.patientMeta = buildPatientMeta(project.patient);
        } else if (nextDraft.patientMeta) {
          setSelectedPatient(normalizePatientContext(nextDraft.patientMeta));
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

        applyDietMacroTargets(nextDraft);

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
      localStorage.setItem("nutri_patient", JSON.stringify(buildPatientMeta(selectedPatient)));
    } else {
      delete draft.patientMeta;
      localStorage.removeItem("nutri_patient");
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
    const normalizedPatient = normalizePatientContext(patient);
    if (!normalizedPatient) {
      toast.error("No se pudo vincular el paciente.");
      return;
    }

    const patientGoals = normalizedPatient.nutritionGoals;
    setSelectedPatient(normalizedPatient);
    localStorage.setItem("nutri_patient", JSON.stringify(normalizedPatient));

    const storedDraft = localStorage.getItem("nutri_active_draft");
    let draft = storedDraft ? JSON.parse(storedDraft) : {};
    draft.patientMeta = normalizedPatient;
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

    if (patientGoals) {
      setTargetCalories(patientGoals.calories);
      setTargetProtein(patientGoals.protein);
      setTargetCarbs(patientGoals.carbs);
      setTargetFats(patientGoals.fats);
    }

    toast.success(`Paciente vinculado: ${normalizedPatient.fullName}`);
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

  const normalizeAiValue = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const validatePatientContextForAi = () => {
    if (!selectedPatient) {
      toast.error("Falta contexto del paciente.", {
        description: "Importa un paciente o completa los datos manuales antes de usar la IA.",
      });
      const section = document.getElementById("patient-context-section");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    const missing: { field: string; id: string }[] = [];
    if (!String(selectedPatient.fullName || "").trim()) {
      missing.push({ field: "Nombre", id: "patient-name-input" });
    }
    if (!Number.isFinite(Number(selectedPatient.ageYears)) || Number(selectedPatient.ageYears) < 0) {
      missing.push({ field: "Edad", id: "patient-age-input" });
    }
    if (!String(selectedPatient.gender || "").trim()) {
      missing.push({ field: "Sexo", id: "patient-gender-input" });
    }
    if (
      !selectedPatient.noDietaryRestrictions &&
      (!Array.isArray(selectedPatient.restrictions) || selectedPatient.restrictions.length === 0)
    ) {
      missing.push({ field: "Restricciones", id: "patient-restrictions-input" });
    }

    if (missing.length > 0) {
      toast.error("Faltan datos obligatorios del paciente.", {
        description: `Por favor completa: ${missing.map((m) => m.field).join(", ")}.`,
      });

      const firstMissing = missing[0];
      const element = document.getElementById(firstMissing.id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      } else {
        const section = document.getElementById("patient-context-section");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return false;
    }

    return true;
  };

  const isStrictMealSection = (mealSection?: string) => {
    const normalized = normalizeAiValue(mealSection || "");
    return ["desayuno", "almuerzo", "once", "cena"].includes(normalized);
  };

  const handleQuickGenerateAI = async () => {
    if (!validatePatientContextForAi()) return;

    const emptySlots = currentSlots.filter(
      (slot) => !slot.recipe && isStrictMealSection(slot.mealSection || slot.type),
    );
    if (emptySlots.length === 0) {
      toast.info(`No hay espacios vacíos para rellenar en ${currentDay}.`);
      return;
    }

    const validTargets = emptySlots.reduce<MealSectionTarget[]>((acc, slot) => {
      const mealSection = String(slot.mealSection || slot.type || "").toLowerCase();
      const existing = acc.find((target) => target.mealSection === mealSection);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ mealSection, count: 1 });
      }
      return acc;
    }, []);

    const token = getAuthToken();
    if (!token) {
      toast.error("No se encontró una sesión activa.");
      return;
    }

    setIsGenerating(true);

    try {
      const patient = selectedPatient;
      const payload = {
        payload: {
          notes: `Rellena automáticamente los espacios vacíos del día ${currentDay} respetando el tipo de comida de cada bloque.`,
          specialConsiderations:
            "Puedes crear platos con ingredientes fuera de la dieta base si aportan variedad. Esos ingredientes se agregarán después en el carrito si hace falta.",
          allowedFoodsMain: sourceFoods,
          exchangeGuide: buildExchangeGuideForAi(),
          mealSectionTargets: validTargets,
          generationMode: "single" as const,
          patient: {
            fullName: patient?.fullName ?? "",
            gender: patient?.gender ?? "",
            ageYears: patient?.ageYears ?? undefined,
            restrictions: patient?.restrictions ?? [],
            fitnessGoals: patient?.fitnessGoals ?? "",
            clinicalSummary: patient?.nutritionalFocus ?? "",
          },
          existingDishes: currentSlots
            .filter((s) => s.recipe)
            .map((s) => ({
              title: s.recipe?.title || "",
              mealSection: s.mealSection || "",
            })),
        },
      };

      const response = await fetchApi("/recipes/quick-ai-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "No se pudo generar con IA.");
      }

      const result = await response.json();
      const dishes: QuickGeneratedDish[] = (result?.dishes || []).map(
        (d: any) => ({
          id: crypto.randomUUID(),
          title: d.title || "",
          mealSection: d.mealSection || "otro",
          description: d.description || "",
          preparation: d.preparation || "",
          recommendedPortion: d.recommendedPortion || "",
          portions: d.portions != null ? Number(d.portions) : 1,
          protein: Number(d.protein) || 0,
          calories: Number(d.calories) || 0,
          carbs: Number(d.carbs) || 0,
          fats: Number(d.fats) || 0,
          ingredients: Array.isArray(d.ingredients)
            ? d.ingredients.map((ing: any) =>
                typeof ing === "string"
                  ? { name: ing, quantity: "" }
                  : {
                      name: String(ing?.name || ""),
                      quantity: String(ing?.quantity || ""),
                      amount: ing?.amount != null ? String(ing.amount) : undefined,
                      unit: ing?.unit ? String(ing.unit) : undefined,
                    },
              )
            : [],
          ingredientDetails: Array.isArray(d.ingredients)
            ? d.ingredients
                .map((ing: any) => {
                  if (typeof ing === "string") {
                    const name = ing.trim();
                    if (!name) return null;
                    return { name, quantity: "", amount: undefined, unit: undefined };
                  }
                  if (!ing || typeof ing !== "object") return null;
                  const name = String(ing.name || "").trim();
                  if (!name) return null;
                  return {
                    name,
                    quantity: String(ing.quantity || ""),
                    amount: ing.amount != null ? Number(ing.amount) : undefined,
                    unit: ing.unit ? String(ing.unit) : undefined,
                  };
                })
                .filter((item: any): item is any => !!item)
            : [],
        }),
      );

      setPendingAiDishes(dishes);
      setIsAiValidationModalOpen(true);
    } catch (error: any) {
      const message = String(error?.message || "");
      console.error("[RecipesClient] AI Generation Error:", error);
      toast.error(message || "Error al generar con IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAiValidation = (validatedDishes: any[]) => {
    setWeekSlots((prev) => {
      const next = { ...prev };
      const daySlots = [...(next[currentDay] || [])];

      validatedDishes.forEach((dish) => {
        const slotIndex = daySlots.findIndex(
          (s) => s.mealSection?.toLowerCase() === dish.mealSection.toLowerCase() && !s.recipe,
        );

        if (slotIndex !== -1) {
          daySlots[slotIndex] = {
            ...daySlots[slotIndex],
            recipe: {
              id: dish.id,
              title: dish.title,
              description: dish.description,
              preparation: dish.preparation,
              recommendedPortion: dish.recommendedPortion,
              portions: dish.portions,
              calories: dish.calories,
              protein: dish.protein,
              carbs: dish.carbs,
              fats: dish.fats,
              ingredients: dish.ingredients.map((ing: any) => typeof ing === "string" ? ing : ing.name),
              ingredientDetails: dish.ingredientDetails,
              mainIngredients: dish.ingredients.map((ing: any) => typeof ing === "string" ? ing : ing.name),
              complexity: "simple",
              source: "app",
            },
          };
        }
      });

      next[currentDay] = daySlots;
      return next;
    });

    // Write Audit Log to Local Storage for clinical traceability
    try {
      const existingLogsRaw = localStorage.getItem("nutri_ai_audit_logs");
      const logs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
      
      const newLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        clinicianEmail: getCurrentUser()?.email || "usuario@demo.com",
        patientName: selectedPatient?.fullName || "General",
        dayLabel: currentDay,
        action: "AI_RECIPE_GENERATION_VALIDATED",
        originalDishes: pendingAiDishes.map(d => ({
          title: d.title,
          calories: d.calories,
          protein: d.protein,
          carbs: d.carbs,
          fats: d.fats,
          mealSection: d.mealSection
        })),
        approvedDishes: validatedDishes.map(d => ({
          title: d.title,
          calories: d.calories,
          protein: d.protein,
          carbs: d.carbs,
          fats: d.fats,
          mealSection: d.mealSection
        }))
      };

      logs.unshift(newLog);
      localStorage.setItem("nutri_ai_audit_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save AI audit log", e);
    }

    toast.success(`Nati rellenó y validó clínicamente ${validatedDishes.length} espacios en ${currentDay}.`);
    setIsAiValidationModalOpen(false);
    setPendingAiDishes([]);
  };

  const handleMealCountChange = (count: number) => {
    const nextStructure = SLOT_LIBRARY[count] || SLOT_LIBRARY[DEFAULT_MEAL_COUNT];
    setMealCount(count);
    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
  };

  const getSlotTypeFromMealSection = (mealSection: string): MealSlot["type"] => {
    if (mealSection === "desayuno") return "desayuno";
    if (mealSection === "almuerzo") return "almuerzo";
    if (mealSection === "cena") return "cena";
    if (mealSection === "merienda") return "merienda";
    return "extra";
  };

  const getSlotLabelFromMealSection = (mealSection: string) =>
    RECIPE_MEAL_SECTIONS.find((section) => section.value === mealSection)?.label || mealSection;

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

  const isCompleteMealTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

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
    return true;
  };

  const assignRecipeToSlot = (day: string, slotId: string, recipe: Recipe) => {
    const targetSlot = (weekSlots[day] || []).find((slot) => slot.id === slotId);
    if (!isRecipeMealSectionCompatible(recipe, targetSlot)) {
      const slotLabel = targetSlot?.label || "este bloque";
      toast.error(`No puedes agregar ${recipe.mealSection || "ese plato"} en ${slotLabel}.`);
      return;
    }

    setWeekSlots((prev) => ({
      ...prev,
      [day]: prev[day].map((slot) => (slot.id === slotId ? { ...slot, recipe } : slot)),
    }));
    setDropTargetKey(null);
  };

  const clearRecipeFromSlot = (day: string, slotId: string) => {
    setWeekSlots((prev) => ({
      ...prev,
      [day]: prev[day].map((slot) => (slot.id === slotId ? { ...slot, recipe: undefined } : slot)),
    }));
    setDropTargetKey(null);
  };

  const submitQuickMeal = () => {
    if (!quickMealTarget) return;

    const daySlots = weekSlots[quickMealTarget.day] || [];
    const targetSlot = daySlots.find((slot) => slot.id === quickMealTarget.slotId);
    if (!targetSlot) {
      toast.error("No se encontró el bloque para crear la comida rápida.");
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
      description: quickMealDraft.description.trim() || "Comida rápida creada manualmente.",
      preparation: quickMealDraft.preparation.trim() || undefined,
      recommendedPortion: quickMealDraft.recommendedPortion.trim() || undefined,
      portions: 1,
      complexity: "simple",
      protein: toNumber(quickMealDraft.protein),
      calories: toNumber(quickMealDraft.calories),
      carbs: toNumber(quickMealDraft.carbs),
      fats: toNumber(quickMealDraft.fats),
      ingredients: [],
      ingredientDetails: [],
      mainIngredients: [],
      source: "mine",
      mealSection: targetSlot.mealSection || targetSlot.type,
    };

    assignRecipeToSlot(quickMealTarget.day, quickMealTarget.slotId, quickRecipe);
    setShowQuickMealModal(false);
    setQuickMealTarget(null);
    toast.success("Comida rápida creada y asignada al bloque.");
  };

  const handleSlotPortionChange = (day: string, slotId: string, recommendedPortion: string) => {
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
        days.find((day) => Array.isArray(prev[day]) && prev[day].length > 0) || Object.keys(prev)[0];
      const fallbackTemplate = getStructureTemplate(
        (referenceDay && prev[referenceDay]) ||
          SLOT_LIBRARY[mealCount] ||
          SLOT_LIBRARY[DEFAULT_MEAL_COUNT],
      );
      days.forEach((day) => {
        next[day] = prev[day] ? prev[day] : fallbackTemplate.map((slot) => ({ ...slot }));
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

  const fillCurrentDayWithMyRecipes = () => {
    const myRecipes = recipeLibrary.filter((recipe) => recipe.source === "mine");

    if (myRecipes.length === 0) {
      toast.error("Todavía no tienes platos creados para rellenar.");
      return;
    }

    let filledCount = 0;

    setWeekSlots((prev) => {
      const next = { ...prev };
      const daySlots = [...(next[currentDay] || [])];
      const usedIds = new Set<string>();

      const updatedSlots = daySlots.map((slot) => {
        if (slot.recipe) return slot;

        const selectedRecipe = myRecipes.find(
          (recipe) => !usedIds.has(recipe.id) && isRecipeMealSectionCompatible(recipe, slot),
        );

        if (!selectedRecipe) return slot;

        usedIds.add(selectedRecipe.id);
        filledCount += 1;
        return {
          ...slot,
          recipe: selectedRecipe,
        };
      });

      next[currentDay] = updatedSlots;
      return next;
    });

    if (filledCount === 0) {
      toast.info("No encontramos platos creados que coincidan con los bloques de hoy.");
      return;
    }

    toast.success(`Se rellenaron ${filledCount} bloques con tus platos creados.`);
  };

  const availableMealSectionsToAdd = useMemo(() => {
    const currentSections = new Set(
      getStructureTemplate(currentSlots).map((slot) => slot.mealSection || slot.type),
    );

    return mealSectionsData.filter((section) => {
      if (UNIQUE_MEAL_SECTIONS.has(section.value) && currentSections.has(section.value)) {
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

    return mealSectionsData
      .filter((section) => {
        if (UNIQUE_MEAL_SECTIONS.has(section.value) && currentSections.has(section.value)) {
          return false;
        }
        return true;
      })
      .map((section) => ({
        ...section,
        isCurrent: section.value === (editingSlot?.mealSection || editingSlot?.type),
      }));
  }, [currentSlots, editingMealBlockId]);

  const handleOpenAddBlockModal = () => {
    if (currentSlots.length >= 6) {
      toast.info("Ya alcanzaste el máximo de 6 bloques.");
      return;
    }

    setEditingMealBlockId(null);
    setShowAddBlockModal(true);
  };

  const handleOpenEditMealBlockModal = (slotId: string, dayContext: string = currentDay) => {
    const slot = (weekSlots[dayContext] || []).find((item) => item.id === slotId);
    if (!slot?.isUserAdded) return;

    setCurrentDay(dayContext);
    setEditingMealBlockId(slotId);
    setShowAddBlockModal(true);
  };

  const handleAddMealBlock = (mealSection: string) => {
    if (currentSlots.length >= 6) {
      toast.info("Ya alcanzaste el máximo de 6 bloques.");
      return;
    }

    const currentStructure = getStructureTemplate(currentSlots);
    if (
      UNIQUE_MEAL_SECTIONS.has(mealSection) &&
      currentStructure.some((slot) => (slot.mealSection || slot.type) === mealSection)
    ) {
      toast.info("Ese bloque principal ya existe en este día.");
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
    toast.success(`Se agregó ${getSlotLabelFromMealSection(mealSection)} a toda la semana.`);
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
        (slot) => slot.id !== editingMealBlockId && (slot.mealSection || slot.type) === mealSection,
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

  const handleRemoveMealBlock = (slotId: string, dayContext: string = currentDay) => {
    const daySlots = weekSlots[dayContext] || [];
    const slot = daySlots.find((item) => item.id === slotId);
    if (!slot?.isUserAdded) {
      toast.info("Ese bloque forma parte de la estructura base y no se puede eliminar.");
      return;
    }

    setCurrentDay(dayContext);

    const nextStructure = getStructureTemplate(daySlots).filter((item) => item.id !== slotId);

    setMealCount(nextStructure.length);
    setWeekSlots((prev) => applyStructureToWeek(nextStructure, prev));
    toast.success(`Se eliminó ${slot.label} de toda la semana.`);
  };

  const handleAddMeriendaSection = () => {
    if (mealCount >= 6) {
      toast.info("Ya alcanzaste el máximo de 6 comidas.");
      return;
    }

    handleMealCountChange(mealCount + 1);
    toast.success("Se agregó una nueva merienda a toda la semana.");
  };

  const reorderStructure = (fromSlotId: string, toSlotId: string, dayContext: string = currentDay) => {
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
      const targetSlot = (weekSlots[dayContext] || []).find((slot) => slot.id === targetSlotId);
      if (recipe) {
        if (!isRecipeMealSectionCompatible(recipe, targetSlot)) {
          toast.error(
            `Bloqueado: "${targetSlot?.label || "Bloque"}" solo acepta platos de ${targetSlot?.mealSection || targetSlot?.type || "su categoría"}.`,
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

  const redistributeMealTimes = () => {
    setWeekSlots((prev) => {
      const currentStructure = getStructureTemplate(prev[currentDay] || []);
      if (currentStructure.length === 0) return prev;

      const [wakeHour, wakeMinute] = wakeUpTime.split(":").map(Number);
      const [sleepHour, sleepMinute] = sleepTime.split(":").map(Number);
      const startMinutes = wakeHour * 60 + wakeMinute;
      const endMinutes = sleepHour * 60 + sleepMinute;

      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
        return prev;
      }

      const step = currentStructure.length > 1 ? (endMinutes - startMinutes) / (currentStructure.length - 1) : 0;
      const nextStructure = currentStructure.map((slot, index) => {
        const totalMinutes = Math.round(startMinutes + step * index);
        const hours = Math.floor(totalMinutes / 60)
          .toString()
          .padStart(2, "0");
        const minutes = (totalMinutes % 60).toString().padStart(2, "0");

        return {
          ...slot,
          time: `${hours}:${minutes}`,
        };
      });

      return applyStructureToWeek(nextStructure, prev);
    });
  };

  const isRecipeCompatibleForSubstitute = (
    recipe: Pick<Recipe, "mealSection">,
    section: SubstituteMealSection,
  ) => true;

  const getSubstituteSectionForRecipe = (
    recipe: Pick<Recipe, "mealSection">,
  ): SubstituteMealSection | null => {
    const normalized = normalizeAiValue(recipe.mealSection || "");
    if (normalized === "desayuno") return "desayuno";
    if (normalized === "almuerzo") return "almuerzo";
    return null;
  };

  const isRecipeMarkedAsSubstitute = (recipe: Pick<Recipe, "id" | "mealSection">) => {
    const section = getSubstituteSectionForRecipe(recipe);
    if (!section) return false;
    return substituteRecipesBySection[section].some((item) => item.id === recipe.id);
  };

  const addSubstituteRecipe = (section: SubstituteMealSection, recipe: Recipe) => {
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
    [weekSlots, days],
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
  }, [selectedPatient, patientNutritionGoals, isEditingPatientGoals]);

  useEffect(() => {
    setIsEditingPatientGoals(false);
  }, [selectedPatient?.id]);

  const selectedPatientActivityLevel = useMemo(() => {
    if (
      selectedPatient?.activityLevel === "sedentario" ||
      selectedPatient?.activityLevel === "deportista"
    ) {
      return selectedPatient.activityLevel;
    }
    return getActivityLevel(selectedPatient);
  }, [selectedPatient]);

  const recommendedProteinRange = useMemo(
    () => getRecommendedProteinRange(selectedPatient?.weight, selectedPatientActivityLevel),
    [selectedPatient, selectedPatientActivityLevel],
  );

  const assignPatientGoalsFromCurrentTargets = async () => {
    if (!selectedPatient) {
      toast.info("Primero completa o importa un paciente para asignar metas.");
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
      "Calorías Meta",
      String(goals.calories),
      "kcal",
    );
    nextCustomVariables = upsertCustomVariable(
      nextCustomVariables,
      "targetProtein",
      "Proteína Meta",
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

    const hasImportedPatient = Boolean(selectedPatient.importedPatientId || selectedPatient.id);

    if (hasImportedPatient) {
      try {
        const patientId = selectedPatient.importedPatientId || selectedPatient.id;
        const token = getAuthToken();
        const response = await fetchApi(`/patients/${patientId}`, {
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

        const updatedPatient = normalizePatientContext(await response.json());
        if (updatedPatient) {
          setSelectedPatient(updatedPatient);
          localStorage.setItem("nutri_patient", JSON.stringify(buildPatientMeta(updatedPatient)));
        }
      } catch (error: any) {
        toast.error(error?.message || "No se pudieron asignar metas al paciente.");
        return;
      }
    } else {
      updateSelectedPatientContext((current) => ({
        ...current,
        nutritionGoals: goals,
        updatedAt: new Date().toISOString(),
      }));
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
    name: selectedPatient?.fullName
      ? `Recetas ${selectedPatient.fullName}`
      : `Recetas ${new Date().toLocaleDateString("es-CL")}`,
    type: "RECIPE" as const,
    content: buildRecipesModule(),
    metadata: {
      ...(description?.trim() ? { description: description.trim() } : {}),
      dayCount: Object.keys(weekSlots || {}).length,
      ...(selectedPatient?.importedPatientId
        ? {
            patientId: selectedPatient.importedPatientId,
            patientName: selectedPatient.fullName,
          }
        : {}),
    },
    tags: [],
  });

  const persistRecipesCreation = async (description?: string) => {
    const savedCreation = await saveCreation(buildRecipesPayload(description));

    if (currentProjectId) {
      try {
        await updateProject(currentProjectId, {
          activeRecipeCreationId: savedCreation.id,
          patientId: selectedPatient?.importedPatientId || undefined,
          metadata: {
            sourceModule: "recipes",
            recipeDays: Object.keys(weekSlots || {}).length,
          },
        });
      } catch (error) {
        console.error("Error updating recipe project linkage", error);
        toast.warning(
          "Las recetas se guardaron, pero no se pudo actualizar el proyecto.",
        );
      }
    }

    return savedCreation;
  };

  const buildRecipesPdfData = () => {
    const pdfDishes = days.flatMap((day) =>
      (weekSlots[day] || [])
        .filter((slot) => slot.recipe)
        .map((slot) => ({
          title: slot.recipe!.title,
          mealSection: slot.recipe!.mealSection || slot.mealSection || slot.type,
          description: slot.recipe!.description || "",
          preparation: slot.recipe!.preparation || "",
          recommendedPortion: slot.recipe!.recommendedPortion || "",
          portions: slot.recipe!.portions,
          protein: slot.recipe!.protein,
          calories: slot.recipe!.calories,
          carbs: slot.recipe!.carbs,
          fats: slot.recipe!.fats,
          ingredients: Array.isArray(slot.recipe!.ingredients)
            ? slot.recipe!.ingredients.map((ingredient) => ({
                name: ingredient,
              }))
            : [],
        })),
    );

    return {
      title: "Recetas y porciones",
      dietName: currentProjectName?.trim() || "Recetas y porciones",
      patientName: selectedPatient?.fullName || null,
      specialConsiderations: selectedPatient
        ? [
            selectedPatient.nutritionalFocus ? `Foco: ${selectedPatient.nutritionalFocus}` : "",
            selectedPatient.fitnessGoals ? `Fitness: ${selectedPatient.fitnessGoals}` : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : undefined,
      restrictedFoods: selectedPatient?.restrictions?.length
        ? selectedPatient.restrictions
        : undefined,
      dishes: pdfDishes,
      generatedAt: new Date().toISOString(),
    };
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;

    const pdfDishes = days.flatMap((day) =>
      (weekSlots[day] || []).filter((slot) => slot.recipe),
    );

    if (pdfDishes.length === 0) {
      toast.error("Agrega al menos un plato antes de exportar.");
      return;
    }

    setIsExportingPdf(true);
    try {
      await downloadQuickRecipesPdf(buildRecipesPdfData());
      toast.success("PDF de recetas descargado correctamente.");
      setIsSaveCreationModalOpen(true);
    } catch (error) {
      console.error("Error exporting recipes PDF", error);
      toast.error("No se pudo generar el PDF de recetas.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleKeepDraft = () => {
    sessionStorage.setItem("nutri_recipes_draft_decided", "keep");
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        if (draft.recipes) {
          applyRecipesContent(draft.recipes);
        }
      } catch (_) {}
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
      } catch (_) {}
    }
    resetRecipes();
    setShowDraftModal(false);
  };

  const handleImportCreation = (creation: any) => {
    try {
      const { type, content } = creation;
      const draft = readWorkflowDraft();

      if (creation.patient) {
        handleSelectPatient(creation.patient);
      }

      if (type === "RECIPE") {
        if (!draft.diet) {
          toast.error("Primero importa una dieta", {
            description: "Recetas y porciones necesita una dieta base antes de cargar una planificación.",
          });
          return;
        }
        draft.recipes = content;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        applyRecipesContent(content);
        toast.success(`Plan de recetas "${creation.name}" importado.`);
      } else if (type === "DIET") {
        draft.diet = content;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        syncSourceFoods(draft);
        applyDietMacroTargets(draft);

        const targets = content.targets || content.nutritionalTargets || {};
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
        toast.info("Este módulo depende de una dieta", {
          description: "Importa una dieta para habilitar Recetas y porciones.",
        });
      }
    } catch (e) {
      console.error("Error importing creation", e);
      toast.error("Error al importar la creación.");
    }
  };

  const fetchPortalOverview = async () => {};

  return {
    // Refs
    baseSectionRef,
    patientSectionRef,
    structureSectionRef,
    librarySectionRef,
    plannerSectionRef,

    // State Variables
    mealCount,
    setMealCount,
    plannerView,
    setPlannerView,
    isGenerating,
    setIsGenerating,
    draggedSlotId,
    setDraggedSlotId,
    draggedRecipeId,
    setDraggedRecipeId,
    dropTargetKey,
    setDropTargetKey,
    slotTimeDrafts,
    setSlotTimeDrafts,
    sourceFoods,
    setSourceFoods,
    recipeLibrary,
    setRecipeLibrary,
    compatibleRecipeIds,
    setCompatibleRecipeIds,
    recipeModalTab,
    setRecipeModalTab,
    recipeSearch,
    setRecipeSearch,
    recipeMealSectionFilter,
    setRecipeMealSectionFilter,
    showOnlyMyRecipes,
    setShowOnlyMyRecipes,
    showMatchingOnly,
    setShowMatchingOnly,
    showOnlyAddedRecipes,
    setShowOnlyAddedRecipes,
    recipeLibraryPage,
    setRecipeLibraryPage,
    isLoadingRecipeLibrary,
    setIsLoadingRecipeLibrary,

    cycleDayCount,
    setCycleDayCount,
    days,
    currentDay,
    setCurrentDay,
    weekSlots,
    setWeekSlots,
    currentSlots,
    setCurrentSlots,

    wakeUpTime,
    setWakeUpTime,
    sleepTime,
    setSleepTime,
    patientInfo,
    setPatientInfo,

    targetProtein,
    setTargetProtein,
    targetCalories,
    setTargetCalories,
    targetCarbs,
    setTargetCarbs,
    targetFats,
    setTargetFats,
    proteinSupplement,
    setProteinSupplement,
    canUseAiAutofill,

    showSwapModal,
    setShowSwapModal,
    showQuickMealModal,
    setShowQuickMealModal,
    showAddBlockModal,
    setShowAddBlockModal,
    editingMealBlockId,
    setEditingMealBlockId,
    previewRecipeId,
    setPreviewRecipeId,

    adviseMealRepetition,
    setAdviseMealRepetition,
    enableSubstituteRecipes,
    setEnableSubstituteRecipes,
    substituteRecipesBySection,
    setSubstituteRecipesBySection,
    activeSwapSlot,
    setActiveSwapSlot,
    activeSlotDay,
    setActiveSlotDay,
    quickMealTarget,
    setQuickMealTarget,
    quickMealDraft,
    setQuickMealDraft,
    selectedPatient,
    setSelectedPatient,

    isImportPatientModalOpen,
    setIsImportPatientModalOpen,
    isEditingPatientGoals,
    setIsEditingPatientGoals,
    patients,
    setPatients,
    isLoadingPatients,
    setIsLoadingPatients,
    patientSearchQuery,
    setPatientSearchQuery,

    hasSourceData,
    setHasSourceData,
    sourceModules,
    setSourceModules,
    isRecipesLocked,

    showDraftModal,
    setShowDraftModal,
    draftMeta,
    setDraftMeta,

    isImportCreationModalOpen,
    setIsImportCreationModalOpen,
    activeGuideSection,
    setActiveGuideSection,
    isSaveCreationModalOpen,
    setIsSaveCreationModalOpen,
    creationDescription,
    setCreationDescription,
    isExportingPdf,
    setIsExportingPdf,
    currentProjectId,
    setCurrentProjectId,
    currentProjectName,
    setCurrentProjectName,
    currentProjectMode,
    setCurrentProjectMode,
    isRecipesHydrated,
    setIsRecipesHydrated,

    recipeTabCounts,
    filteredRecipeLibrary,
    paginatedRecipeLibrary,
    recipeLibraryTotalPages,
    RECIPE_LIBRARY_PAGE_SIZE,

    dayTotals,
    dayTotalsWithSupplement,
    weekTotals,
    weekTotalsWithSupplement,
    patientNutritionGoals,
    selectedPatientActivityLevel,
    recommendedProteinRange,

    // Handlers
    updateSelectedPatientContext,
    scrollToGuideSection,
    applyStructureToWeek,
    syncSourceFoods,
    loadRecipeLibrary,
    readWorkflowDraft,
    buildRecipesModule,
    applyRecipesContent,
    fetchPatients,
    handleSelectPatient,
    handlePatientLoad,
    handleUnlinkPatient,
    validatePatientContextForAi,
    handleQuickGenerateAI,
    handleMealCountChange,
    getSlotTypeFromMealSection,
    getSlotLabelFromMealSection,
    parseDelimitedList,
    isRecipeMealSectionCompatible,
    truncateText,
    getRecipeImage,
    handleSlotTimeDraftChange,
    commitSlotTimeChange,
    openSlotEditor,
    openQuickMealModal,
    assignRecipeToSlot,
    clearRecipeFromSlot,
    submitQuickMeal,
    handleSlotPortionChange,
    assignRecipeToActiveSlot,
    fillCurrentDayWithMyRecipes,
    availableMealSectionsToAdd,
    availableMealSectionsForEditing,
    handleOpenAddBlockModal,
    handleOpenEditMealBlockModal,
    handleAddMealBlock,
    handleUpdateMealBlock,
    handleRemoveMealBlock,
    handleAddMeriendaSection,
    reorderStructure,
    handleSlotDrop,
    isRecipeCompatibleForSubstitute,
    getSubstituteSectionForRecipe,
    isRecipeMarkedAsSubstitute,
    addSubstituteRecipe,
    removeSubstituteRecipe,
    toggleSubstituteRecipe,
    draggedRecipe,
    proteinSupplementPerDay,
    assignPatientGoalsFromCurrentTargets,
    getEmptyMealBlocks,
    redistributeMealTimes,
    resetRecipes,
    buildRecipesPayload,
    persistRecipesCreation,
    buildRecipesPdfData,
    handleExportPdf,
    handleKeepDraft,
    handleDiscardDraft,
    handleImportCreation,
    fetchPortalOverview,
    buildPatientMeta,

    // AI Validation
    isAiValidationModalOpen,
    setIsAiValidationModalOpen,
    pendingAiDishes,
    setPendingAiDishes,
    handleConfirmAiValidation,
  };
}
