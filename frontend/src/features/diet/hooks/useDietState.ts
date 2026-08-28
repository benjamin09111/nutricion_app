import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { MarketPrice } from "@/features/foods";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { fetchApi } from "@/lib/api-base";
import { hasActiveSession } from "@/lib/auth-token";
import {
  buildProjectAwarePath,
  createProject,
  fetchCreation,
  fetchProject,
  saveCreation,
  updateProject,
} from "@/lib/workflow";
import {
  DietVerificationResult,
  DietPatient,
  normalizePatient,
  extractPatients,
  normalizeConstraintText,
  normalizeConstraintList,
  normalizeGroupName,
  mapIngredientToMarketPrice,
  getUserDraftKey,
} from "../utils/diet-helpers";
import { getMacroPctFromGrams } from "@/lib/nutrition-formulas";
import { getGoalsFromPatient } from "@/features/recipes/utils/recipe-helpers";
import { buildExchangeGuideForAi, buildExchangeGuideForPatient } from "@/lib/exchange-portions";
import { buildAutoCartItems } from "../utils/cartIngredients";
import { getCurrentUser } from "@/lib/current-user";
import {
  DEFAULT_INTRO_TEMPLATE,
  DEFAULT_CLOSING_TEMPLATE,
  resolveDeliverableCopyTemplate,
} from "../constants/defaultDeliverableCopy";

interface UseDietStateProps {
  initialFoods: MarketPrice[];
  startEmpty?: boolean;
}

export type DietFlowMode = "quick" | "full";

export type MacroSettings = {
  referenceWeightKg: number;
  proteinGPerKg: number;
  carbsGPerKg: number;
  fatsGPerKg: number;
  calorieAdjustmentMode: "kcal" | "percent";
  calorieAdjustment: number;
};

export type MacroTargetsSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
  baseCalories: number;
  calorieAdjustment: number;
  referenceWeightKg: number;
};

const createDefaultMacroSettings = (
  referenceWeightKg = 70,
): MacroSettings => ({
  referenceWeightKg,
  proteinGPerKg: 1.8,
  carbsGPerKg: 3.5,
  fatsGPerKg: 0.9,
  calorieAdjustmentMode: "kcal",
  calorieAdjustment: 0,
});

const buildMacroTargets = (settings: MacroSettings): MacroTargetsSummary => {
  const referenceWeightKg = Math.max(Number(settings.referenceWeightKg) || 0, 0);
  const protein = Math.max(
    0,
    Math.round(referenceWeightKg * (Number(settings.proteinGPerKg) || 0)),
  );
  const carbs = Math.max(
    0,
    Math.round(referenceWeightKg * (Number(settings.carbsGPerKg) || 0)),
  );
  const fats = Math.max(
    0,
    Math.round(referenceWeightKg * (Number(settings.fatsGPerKg) || 0)),
  );
  const baseCalories = protein * 4 + carbs * 4 + fats * 9;
  const adjustmentValue = Number(settings.calorieAdjustment) || 0;
  const calories =
    settings.calorieAdjustmentMode === "percent"
      ? Math.max(0, Math.round(baseCalories * (1 - Math.min(100, Math.max(-100, adjustmentValue)) / 100)))
      : Math.max(0, Math.round(baseCalories + adjustmentValue));
  const calorieScale = baseCalories > 0 ? calories / baseCalories : 0;
  const adjustedProtein = Math.round(protein * calorieScale);
  const adjustedCarbs = Math.round(carbs * calorieScale);
  const adjustedFats = Math.round(fats * calorieScale);
  const macroPercents = getMacroPctFromGrams(
    calories,
    adjustedProtein,
    adjustedCarbs,
    adjustedFats,
  );

  return {
    calories,
    protein: adjustedProtein,
    carbs: adjustedCarbs,
    fats: adjustedFats,
    proteinPercent: macroPercents.proteinPercent,
    carbsPercent: macroPercents.carbsPercent,
    fatsPercent: macroPercents.fatsPercent,
    baseCalories,
    calorieAdjustment: Number(settings.calorieAdjustment) || 0,
    referenceWeightKg,
  };
};

export function useDietState({ initialFoods, startEmpty = false }: UseDietStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const creationIdFromUrl = searchParams.get("creationId");
  const flowMode: DietFlowMode =
    searchParams.get("mode") === "quick" ? "quick" : "full";

  // -- State --
  const [dietName, setDietName] = useState("");
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [planObjective, setPlanObjective] = useState("");
  const [showPlanObjectiveInPdf, setShowPlanObjectiveInPdf] = useState(false);
  const [activeConstraints, setActiveConstraints] = useState<string[]>([]);
  const [macroSettings, setMacroSettings] = useState<MacroSettings>(
    createDefaultMacroSettings(),
  );
  const [foodStatus, setFoodStatus] = useState<
    Record<string, "base" | "favorite" | "removed" | "added">
  >({});
  const [manualAdditions, setManualAdditions] = useState<MarketPrice[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSupplementsDrawer, setShowSupplementsDrawer] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DietPatient | null>(null);
  const [customConstraints, setCustomConstraints] = useState<
    { id: string; label: string }[]
  >([]);
  const [newConstraintLabel, setNewConstraintLabel] = useState("");
  const [customGroups, setCustomGroups] = useState<string[]>([]);
  const [deletedBaseGroups, setDeletedBaseGroups] = useState<string[]>([]);
  const [dbCatalogFoods, setDbCatalogFoods] = useState<MarketPrice[]>([]);
  const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] =
    useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [activeGroupForAddition, setActiveGroupForAddition] = useState<
    string | null
  >(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState("");
  const [searchResultFoods, setSearchResultFoods] = useState<MarketPrice[]>([]);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [isCreatingManualFood, setIsCreatingManualFood] = useState(false);
  const [isApplyingPreferences, setIsApplyingPreferences] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [isDraftFoodEditorOpen, setIsDraftFoodEditorOpen] = useState(false);
  const [draftFoodToEdit, setDraftFoodToEdit] = useState<MarketPrice | null>(
    null,
  );
  const [draftFoodValues, setDraftFoodValues] = useState({
    amount: 100,
    unit: "g",
    calories: 0,
    proteins: 0,
    carbs: 0,
    lipids: 0,
    azucares: 0,
    fibra: 0,
    sodio: 0,
  });
  const [isSavingDraftFood, setIsSavingDraftFood] = useState(false);

  // Flow & Step 3/4 State
  const [currentStep, setCurrentStep] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const [includeMealsSection, setIncludeMealsSection] = useState(true);
  const [includeExchangeGuideInPdf, setIncludeExchangeGuideInPdf] = useState(true);
  const [includeCartSection, setIncludeCartSection] = useState(true);
  const [includeFoodTableSection, setIncludeFoodTableSection] = useState(true);
  const [includeResourcesSection, setIncludeResourcesSection] = useState(true);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([
    "labels",
    "hydration",
    "substitutes",
  ]);
  const [cartItemOverrides, setCartItemOverrides] = useState<Record<string, string>>({});
  const [removedCartItemIds, setRemovedCartItemIds] = useState<string[]>([]);

  const setCartItemOverride = (id: string, newName: string) => {
    setCartItemOverrides((prev) => ({
      ...prev,
      [id]: newName.trim(),
    }));
  };

  const removeCartItem = (id: string) => {
    setRemovedCartItemIds((prev) => [...prev, id]);
  };
  const [dietMealsTableData, setDietMealsTableData] = useState<any[]>([
    { id: "meal-1", section: "Desayuno", mealText: "", time: "08:30", portion: "1 porción" },
    { id: "meal-2", section: "Colación AM", mealText: "", time: "11:00", portion: "1 porción" },
    { id: "meal-3", section: "Almuerzo", mealText: "", time: "13:30", portion: "1 porción" },
    { id: "meal-4", section: "Colación PM", mealText: "", time: "17:00", portion: "1 porción" },
    { id: "meal-5", section: "Cena", mealText: "", time: "20:30", portion: "1 porción" },
  ]);

  // Alimentos a evitar (paso "Comidas")
  const [avoidFoods, setAvoidFoods] = useState<string[]>([]);
  const [includeAvoidFoodsInPdf, setIncludeAvoidFoodsInPdf] = useState(true);

  const addAvoidFood = (food: string) => {
    const cleaned = food.trim();
    if (!cleaned) return;
    setAvoidFoods((prev) =>
      prev.some((f) => f.toLowerCase() === cleaned.toLowerCase()) ? prev : [...prev, cleaned],
    );
  };
  const removeAvoidFood = (food: string) => {
    setAvoidFoods((prev) => prev.filter((f) => f !== food));
  };

  // Introducción y despedida del entregable
  const [introMessage, setIntroMessage] = useState("");
  const [includeIntroInPdf, setIncludeIntroInPdf] = useState(true);
  const [closingMessage, setClosingMessage] = useState("");
  const [includeClosingInPdf, setIncludeClosingInPdf] = useState(true);
  const [hasCustomIntroMessage, setHasCustomIntroMessage] = useState(false);
  const [hasCustomClosingMessage, setHasCustomClosingMessage] = useState(false);

  // Regenera el texto por defecto de intro/despedida cuando cambia el paciente,
  // salvo que el nutricionista ya lo haya editado manualmente.
  useEffect(() => {
    const name = selectedPatient?.fullName || null;
    if (!hasCustomIntroMessage) {
      setIntroMessage(resolveDeliverableCopyTemplate(DEFAULT_INTRO_TEMPLATE, name));
    }
    if (!hasCustomClosingMessage) {
      setClosingMessage(resolveDeliverableCopyTemplate(DEFAULT_CLOSING_TEMPLATE, name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.fullName]);

  const updateIntroMessage = (value: string) => {
    setIntroMessage(value);
    setHasCustomIntroMessage(true);
  };
  const updateClosingMessage = (value: string) => {
    setClosingMessage(value);
    setHasCustomClosingMessage(true);
  };

  // Fetch full database catalog of ingredients (/foods?limit=1000)
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetchApi("/foods?limit=1000");
        if (res.ok) {
          const raw = await res.json();
          const items = Array.isArray(raw) ? raw : raw.data || [];
          const mapped: MarketPrice[] = items.map((ing: any) => ({
            producto: ing.name,
            grupo: ing.category?.name || "Varios",
            unidad: ing.unit || "g",
            precioPromedio: ing.price || 0,
            calorias: ing.calories || 0,
            proteinas: ing.proteins || 0,
            carbohidratos: ing.carbs || 0,
            lipidos: ing.lipids || 0,
            azucares: ing.sugars || ing.azucares || 0,
            fibra: ing.fiber || ing.fibra || 0,
            sodio: ing.sodium || ing.sodio || 0,
            tags: ing.tags?.map((t: any) => (typeof t === "string" ? t : t.name)) || [],
            id: ing.id,
          }));
          if (mapped.length > 0) {
            setDbCatalogFoods(mapped);
          }
        }
      } catch (e) {
        console.error("Error loading DB food catalog", e);
      }
    };
    fetchCatalog();
  }, []);

  const fullCatalogFoods = useMemo(() => {
    const combinedMap = new Map<string, MarketPrice>();
    initialFoods.forEach((f) => combinedMap.set(f.producto.toLowerCase(), f));
    dbCatalogFoods.forEach((f) => {
      if (!combinedMap.has(f.producto.toLowerCase())) {
        combinedMap.set(f.producto.toLowerCase(), f);
      }
    });
    return Array.from(combinedMap.values());
  }, [initialFoods, dbCatalogFoods]);
  const [isContinueDraftWarningOpen, setIsContinueDraftWarningOpen] =
    useState(false);

  // -- Smart Add State --
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [smartAddTab, setSmartAddTab] = useState<
    "favorites" | "groups" | "myproducts" | "search"
  >("favorites");
  const [smartFavorites, setSmartFavorites] = useState<any[]>([]);
  const [smartGroups, setSmartGroups] = useState<any[]>([]);
  const [smartMyProducts, setSmartMyProducts] = useState<any[]>([]);
  const [smartSearchQuery, setSmartSearchQuery] = useState("");
  const [smartSearchResults, setSmartSearchResults] = useState<any[]>([]);
  const [isSearchingInSmart, setIsSearchingInSmart] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  const [isLoadingSmart, setIsLoadingSmart] = useState(false);
  const [smartInfoFood, setSmartInfoFood] = useState<MarketPrice | null>(null);

  // -- Food Info Modal State --
  const [isFoodInfoModalOpen, setIsFoodInfoModalOpen] = useState(false);
  const [selectedFoodForInfo, setSelectedFoodForInfo] =
    useState<MarketPrice | null>(null);

  // -- Naty IA Dish Generation State --
  const [isGeneratingAiDishes, setIsGeneratingAiDishes] = useState(false);
  const [pendingAiDishes, setPendingAiDishes] = useState<any[]>([]);
  const [isAiValidationModalOpen, setIsAiValidationModalOpen] = useState(false);

  // -- Import Creation Modal State --
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [isVerifyingRestrictions, setIsVerifyingRestrictions] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DietVerificationResult | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isLoadingDiets, setIsLoadingDiets] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [pendingTagCreation, setPendingTagCreation] = useState<{
    name: string;
    type: "classification" | "constraint";
  } | null>(null);
  const [dietSearchQuery, setDietSearchQuery] = useState("");

  // -- Import Patient Modal State --
  const [isImportPatientModalOpen, setIsImportPatientModalOpen] = useState(false);
  const [patients, setPatients] = useState<DietPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const filteredPatients = useMemo(() => patients, [patients]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    projectIdFromUrl,
  );
  const [isProjectLoading, setIsProjectLoading] = useState(
    Boolean(projectIdFromUrl),
  );
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(
    null,
  );
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(
    null,
  );
  const [editingCreationId, setEditingCreationId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Synchronize Step 4 meal table with Step 3 dishes
  useEffect(() => {
    if (isHydrating) return;

    setDietMealsTableData((prevRows) => {
      if (meals.length === 0) {
        if (prevRows.length === 0) {
          return [
            { id: "meal-1", section: "Desayuno", mealText: "", time: "08:30", portion: "1 porción" },
            { id: "meal-2", section: "Almuerzo", mealText: "", time: "13:30", portion: "1 porción" },
            { id: "meal-3", section: "Cena", mealText: "", time: "20:30", portion: "1 porción" },
          ];
        }
        return prevRows;
      }

      // Extract unique categories from Step 3 dishes in exact order
      const step3Sections: string[] = [];
      meals.forEach((m) => {
        if (m.section && !step3Sections.some((s) => s.toLowerCase() === m.section.toLowerCase())) {
          step3Sections.push(m.section);
        }
      });

      if (step3Sections.length === 0) return prevRows;

      // Build Step 4 rows using ONLY the Step 3 categories
      const syncRows = step3Sections.map((sec) => {
        const matchingDish = meals.find(
          (m) => m.section.toLowerCase() === sec.toLowerCase()
        );

        const existingRow = prevRows.find(
          (r) => r.section.toLowerCase() === sec.toLowerCase()
        );

        return {
          id: existingRow?.id || `meal-${sec.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          section: sec,
          mealText: matchingDish?.name || existingRow?.mealText || "",
          portion: matchingDish?.portion || existingRow?.portion || "1 porción",
          time: matchingDish?.time || existingRow?.time || (sec.toLowerCase() === "desayuno" ? "08:30" : sec.toLowerCase() === "almuerzo" ? "13:30" : sec.toLowerCase() === "cena" ? "20:30" : "12:00"),
          dishId: matchingDish?.id || existingRow?.dishId,
        };
      });

      const isIdentical =
        syncRows.length === prevRows.length &&
        syncRows.every((row, idx) => {
          const prev = prevRows[idx];
          return (
            prev &&
            prev.id === row.id &&
            prev.section === row.section &&
            prev.mealText === row.mealText &&
            prev.portion === row.portion &&
            prev.time === row.time &&
            prev.dishId === row.dishId
          );
        });

      if (isIdentical) {
        return prevRows;
      }

      return syncRows;
    });
  }, [meals, isHydrating]);

  const { isSidebarCollapsed } = useDashboardShell();

  const favoritesEnabled = true;

  const availableClassificationTags = useMemo(
    () => availableTags.filter((tag) => tag.startsWith("#")),
    [availableTags],
  );

  const availableConstraintTags = useMemo(
    () => availableTags.filter((tag) => !tag.startsWith("#")),
    [availableTags],
  );

  const selectedDefaultConstraintIds = useMemo(() => {
    return new Set(
      activeConstraints
        .map((constraint) => {
          const normalizedConstraint = normalizeConstraintText(constraint);
          const mapped = DEFAULT_CONSTRAINTS.find(
            (c) => normalizeConstraintText(c.id) === normalizedConstraint
          );
          return mapped ? mapped.id : constraint;
        })
        .filter((constraint) =>
          DEFAULT_CONSTRAINTS.some((item) => item.id === constraint),
        ),
    );
  }, [activeConstraints]);

  const macroTargets = useMemo(
    () => buildMacroTargets(macroSettings),
    [macroSettings],
  );

  useEffect(() => {
    setCurrentProjectId(projectIdFromUrl);
    setIsProjectLoading(Boolean(projectIdFromUrl));
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (!isSmartModalOpen) {
      setSmartInfoFood(null);
    }
  }, [isSmartModalOpen]);

  useEffect(() => {
    setSmartInfoFood(null);
  }, [smartAddTab, smartSearchQuery]);

  const fetchAvailableTags = async (retries = 3) => {
    try {
      const response = await fetchApi(`/tags`,);
      if (response.ok) {
        const tagsData = await response.json();
        const tags = tagsData.map((t: any) => t.name);
        setAvailableTags(tags);
      }
    } catch {
      if (retries > 0) {
        setTimeout(() => fetchAvailableTags(retries - 1), 2000);
      } else {
        console.warn("Backend no disponible para cargar tags aún.");
      }
    }
  };

  const createGlobalTag = async (tagName: string) => {
    try {
      const response = await fetchApi(`/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });
      if (response.ok) {
        fetchAvailableTags();
        toast.success(`"${tagName}" fue creado en Detalles.`);
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || "No se pudo crear el tag en Detalles.");
      }
    } catch (e) {
      console.error("Error creating global tag", e);
      toast.error("Error al crear el tag en Detalles.");
    }
  };

  const buildDietCreationPayloadWithoutId = (description?: string) => {
    const finalizedFoods = [...includedFoods];

    return {
      name: dietName,
      type: "DIET" as const,
      content: {
        dietName,
        dietTags,
        planObjective,
        showPlanObjectiveInPdf,
        activeConstraints,
        macroSettings,
        macroTargets,
        foodStatus,
        manualAdditions,
        customGroups,
        customConstraints,
        favoritesEnabled,
        timestamp: Date.now(),
        foods: finalizedFoods,
        includedFoods: finalizedFoods,
        meals,
        dietMealsTableData,
        includeMealsSection,
        includeExchangeGuideInPdf,
        avoidFoods,
        includeAvoidFoodsInPdf,
        includeCartSection,
        cartItemOverrides,
        removedCartItemIds,
        includeResourcesSection,
        selectedResourceIds,
        introMessage,
        includeIntroInPdf,
        hasCustomIntroMessage,
        closingMessage,
        includeClosingInPdf,
        hasCustomClosingMessage,
      },
      metadata: {
        flowMode,
        ...(description?.trim() ? { description: description.trim() } : {}),
        foodSummary: finalizedFoods.map((f) => ({
          name: f.producto,
          group: f.grupo,
        })),
        foodCount: finalizedFoods.length,
        ...(selectedPatient
          ? {
              patientName: selectedPatient.fullName,
              patientId: selectedPatient.id,
            }
          : {
              patientName: "tú persona",
            }),
      },
      tags: dietTags,
    };
  };

  const buildDietCreationPayload = (description?: string) => {
    const base = buildDietCreationPayloadWithoutId(description);
    return editingCreationId ? { ...base, id: editingCreationId } : base;
  };

  const ensureProjectForWorkflow = async (dietCreationId?: string) => {
    if (currentProjectId) {
      if (dietCreationId) {
        await updateProject(currentProjectId, {
          activeDietCreationId: dietCreationId,
          patientId: selectedPatient?.id,
          metadata: {
            sourceModule: "diet",
            lastDietName: dietName,
          },
        });
      }
      return currentProjectId;
    }

    const createdProject = await createProject({
      name:
        dietName?.trim() ||
        (selectedPatient
          ? `Plan de ${selectedPatient.fullName}`
          : "Proyecto nutricional"),
      patientId: selectedPatient?.id,
      mode: selectedPatient ? "CLINICAL" : "GENERAL",
      activeDietCreationId: dietCreationId,
      metadata: {
        sourceModule: "diet",
        createdFrom: "diet-continue",
      },
    });

    setCurrentProjectId(createdProject.id);
    router.replace(buildProjectAwarePath("/dashboard/dieta", createdProject.id));
    return createdProject.id as string;
  };

  const fetchPatientDetail = async (
    patientId: string,
  ): Promise<DietPatient | null> => {
    const response = await fetchApi(`/patients/${patientId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "No se pudo cargar el detalle completo del paciente.",
      );
    }

    const patient = await response.json();
    return normalizePatient(patient);
  };

  const hydratePatient = async (
    patient: DietPatient | null | undefined,
  ): Promise<DietPatient | null> => {
    if (!patient) return null;

    const normalizedPatient = normalizePatient(patient);
    if (!normalizedPatient.id) return normalizedPatient;

    try {
      return await fetchPatientDetail(normalizedPatient.id);
    } catch (error) {
      console.warn("No se pudo hidratar el paciente en Dieta.", error);
      return normalizedPatient;
    }
  };

  const applySelectedPatient = (
    patient: DietPatient,
    options?: { showToast?: boolean },
  ) => {
    const normalizedPatient = normalizePatient(patient);
    const shouldShowToast = options?.showToast ?? true;

    setSelectedPatient(normalizedPatient);
    localStorage.setItem("nutri_patient", JSON.stringify(normalizedPatient));
    const patientGoals = getGoalsFromPatient(normalizedPatient);
    const patientWeight = Number(normalizedPatient.weight) || 0;
    if (patientWeight > 0) {
      setMacroSettings((prev) => ({
        ...prev,
        referenceWeightKg: patientWeight,
        ...(patientGoals
          ? {
              proteinGPerKg: patientGoals.protein / patientWeight,
              carbsGPerKg: patientGoals.carbs / patientWeight,
              fatsGPerKg: patientGoals.fats / patientWeight,
            }
          : {}),
      }));
    }

    const restrictions = Array.isArray(normalizedPatient.dietRestrictions)
      ? normalizedPatient.dietRestrictions
      : [];
    const validRestrictions = normalizeConstraintList(restrictions);

    let finalConstraints: string[] = [];
    setActiveConstraints((prevConstraints) => {
      const mergedSet = new Set([...prevConstraints, ...validRestrictions]);
      if (
        mergedSet.size === prevConstraints.length &&
        prevConstraints.every((c) => mergedSet.has(c))
      ) {
        finalConstraints = prevConstraints;
        return prevConstraints;
      }
      finalConstraints = Array.from(mergedSet);
      return finalConstraints;
    });

    try {
      const storedDraft = localStorage.getItem("nutri_active_draft");
      let draft = storedDraft ? JSON.parse(storedDraft) : {};

      draft.patientMeta = {
        id: normalizedPatient.id,
        fullName: normalizedPatient.fullName,
        restrictions: validRestrictions,
        nutritionalFocus: normalizedPatient.nutritionalFocus,
        fitnessGoals: normalizedPatient.fitnessGoals,
        birthDate: normalizedPatient.birthDate,
        weight: normalizedPatient.weight,
        height: normalizedPatient.height,
        gender: normalizedPatient.gender,
        patientData: normalizedPatient,
        updatedAt: new Date().toISOString(),
      };

      draft.activeConstraints = finalConstraints;
      if (!draft.diet) draft.diet = {};
      draft.diet.activeConstraints = finalConstraints;
      draft.diet.macroSettings = {
        ...macroSettings,
        referenceWeightKg:
          normalizedPatient.weight || macroSettings.referenceWeightKg,
      };

      const serialized = JSON.stringify(draft);
      localStorage.setItem("nutri_active_draft", serialized);
      sessionStorage.setItem(getUserDraftKey(), serialized);
      localStorage.setItem(getUserDraftKey(), serialized);
    } catch (e) {
      console.error("Error updating draft in applySelectedPatient", e);
    }

    if (patient.weight) {
      setMacroSettings((prev) => ({
        ...prev,
        referenceWeightKg: patient.weight || prev.referenceWeightKg,
      }));
    }

    if (shouldShowToast) {
      if (validRestrictions.length > 0) {
        toast.success(`Paciente vinculado: ${normalizedPatient.fullName}`, {
          description: `${validRestrictions.length} restricciones sincronizadas automáticamente.`,
        });
      } else {
        toast.success(`Paciente vinculado: ${normalizedPatient.fullName}`);
      }
    }

    setIsImportPatientModalOpen(false);
    setPatientSearchQuery("");
    setPatientsError(null);
  };

  const fetchPatients = async (search = "", retries = 2) => {
    setIsLoadingPatients(true);
    setPatientsError(null);
    try {
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "1000",
        status: "Activos",
        ...(search.trim() && { search: search.trim() }),
      });

      const response = await fetchApi(`/patients?${queryParams}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "No se pudieron cargar los pacientes registrados.",
        );
      }

      const data = await response.json();
      setPatients(extractPatients(data));
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => {
          void fetchPatients(search, retries - 1);
        }, 1200);
        return;
      }

      console.error("Error fetching patients", e);
      setPatients([]);
      setPatientsError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar tus pacientes en este momento.",
      );
      toast.error("No se pudieron cargar tus pacientes.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSelectPatientLegacy = (patient: any) => {
    setSelectedPatient(patient);
    localStorage.setItem("nutri_patient", JSON.stringify(patient));

    const restrictions = Array.isArray(patient.dietRestrictions)
      ? patient.dietRestrictions
      : [];
    const validRestrictions = normalizeConstraintList(restrictions);

    let finalConstraints: string[] = [];
    setActiveConstraints((prevConstraints) => {
      const mergedSet = new Set([...prevConstraints, ...validRestrictions]);
      if (
        mergedSet.size === prevConstraints.length &&
        prevConstraints.every((c) => mergedSet.has(c))
      ) {
        finalConstraints = prevConstraints;
        return prevConstraints;
      }
      finalConstraints = Array.from(mergedSet);
      return finalConstraints;
    });

    try {
      const storedDraft = localStorage.getItem("nutri_active_draft");
      let draft = storedDraft ? JSON.parse(storedDraft) : {};

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
        patientData: patient,
        updatedAt: new Date().toISOString(),
      };

      draft.activeConstraints = finalConstraints;
      if (!draft.diet) draft.diet = {};
      draft.diet.activeConstraints = finalConstraints;
      draft.diet.macroSettings = {
        ...macroSettings,
        referenceWeightKg: patient.weight || macroSettings.referenceWeightKg,
      };

      const serialized = JSON.stringify(draft);
      localStorage.setItem("nutri_active_draft", serialized);
      sessionStorage.setItem(getUserDraftKey(), serialized);
      localStorage.setItem(getUserDraftKey(), serialized);
    } catch (e) {
      console.error("Error updating draft in handleSelectPatientLegacy", e);
    }

    if (validRestrictions.length > 0) {
      toast.success(`Paciente vinculado: ${patient.fullName}`, {
        description: `${validRestrictions.length} restricciones sincronizadas automáticamente.`,
      });
    } else {
      toast.success(`Paciente vinculado: ${patient.fullName}`);
    }

    setIsImportPatientModalOpen(false);
    setPatientSearchQuery("");
  };

  const handleSelectPatient = async (patient: DietPatient) => {
    setIsLoadingPatients(true);
    try {
      const hydratedPatient = await hydratePatient(patient);
      if (!hydratedPatient) {
        throw new Error("No se pudo preparar el paciente seleccionado.");
      }

      applySelectedPatient(hydratedPatient);
    } catch (error) {
      console.error("Error selecting patient", error);
      handleSelectPatientLegacy(normalizePatient(patient));
      toast.warning(
        "Se vinculó el paciente, pero no fue posible traer todo su expediente completo.",
      );
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleUnlinkPatient = () => {
    setSelectedPatient(null);
    setActiveConstraints([]);
    localStorage.removeItem("nutri_patient");

    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        delete draft.patientMeta;
        if (draft.diet) {
          draft.diet.activeConstraints = [];
        }
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
      } catch {}
    }

    saveDraft({ activeConstraints: [] });
    toast.info("Paciente desvinculado de esta sesión");
  };

  const handleImportCreation = (creation: any) => {
    try {
      const { type, content } = creation;
      if (!content) {
        toast.error("Esta creación no tiene contenido válido");
        return;
      }

      if (
        type === "DIET" ||
        type === "FAST_DELIVERABLE" ||
        type === "PAUTAS" ||
        type === "RECETARIO" ||
        type === "RECIPE"
      ) {
        setEditingCreationId(creation.id);
        if (creation.name) setDietName(creation.name);
        // Hashtags (tags) and restrictions (activeConstraints) are intentionally ignored on import
        // to preserve the active session/patient's constraints and avoid dirtying the current workspace.
        if (typeof content.planObjective === "string") setPlanObjective(content.planObjective);
        setShowPlanObjectiveInPdf(content.showPlanObjectiveInPdf === true);
        if (content.macroSettings) setMacroSettings(content.macroSettings);

        const recoveredManual: any[] = [];
        const recoveredGroupsSet = new Set<string>();
        const recoveredStatus: Record<string, "added"> = {};

        // 1. Recover from content.groups or content.categories
        const groupsData = content.groups || content.categories;
        if (groupsData && typeof groupsData === "object" && Object.keys(groupsData).length > 0) {
          Object.entries(groupsData).forEach(([groupName, foods]: [string, any]) => {
            if (Array.isArray(foods)) {
              recoveredGroupsSet.add(groupName);
              foods.forEach((f: any) => {
                const foodItem = { ...f, grupo: f.grupo || groupName, isManual: true };
                recoveredManual.push(foodItem);
                if (foodItem.producto) {
                  recoveredStatus[foodItem.producto] = "added";
                }
              });
            }
          });
        }

        // 2. Recover from content.manualAdditions or content.foods or content.items
        const rawFoods = content.manualAdditions || content.foods || content.items || [];
        if (Array.isArray(rawFoods) && rawFoods.length > 0) {
          rawFoods.forEach((f: any) => {
            const groupName = f.grupo || "Varios";
            recoveredGroupsSet.add(groupName);
            const foodItem = { ...f, grupo: groupName, isManual: true };
            if (!recoveredManual.some((existing) => existing.producto === foodItem.producto && existing.grupo === groupName)) {
              recoveredManual.push(foodItem);
            }
            if (foodItem.producto) {
              recoveredStatus[foodItem.producto] = "added";
            }
          });
        }

        // 3. Recover customGroups from creation
        if (Array.isArray(content.customGroups)) {
          content.customGroups.forEach((g: string) => recoveredGroupsSet.add(g));
        }

        // 4. Set state
        if (recoveredManual.length > 0) {
          setManualAdditions(recoveredManual);
        }
        if (recoveredGroupsSet.size > 0) {
          setCustomGroups(Array.from(recoveredGroupsSet));
        }
        if (Object.keys(recoveredStatus).length > 0) {
          setFoodStatus((prev) => ({ ...prev, ...recoveredStatus }));
        }

        toast.success(`Dieta "${creation.name}" importada correctamente.`);
      } else if (type === "SHOPPING_LIST") {
        if (content.items && Array.isArray(content.items)) {
          const newAdditions = content.items.map((item: any) => ({
            id: item.id || Math.random().toString(),
            producto: item.producto,
            grupo: item.grupo || "Varios",
            unidad: item.unidad || "kg",
            precioPromedio: item.precioPorUnidad || 0,
            calorias: item.caloriasPor100g || 0,
            proteinas: item.proteinaPor100g || 0,
            carbohidratos: item.carbohidratosPor100g || 0,
            lipidos: item.grasasPor100g || 0,
            isManual: true,
          }));

          setManualAdditions((prev) => [...prev, ...newAdditions]);

          const uniqueGroups = Array.from(new Set(newAdditions.map((a: any) => a.grupo))) as string[];
          setCustomGroups((prev) => Array.from(new Set([...prev, ...uniqueGroups])));

          const newStatus: Record<string, "added"> = {};
          newAdditions.forEach((a: any) => {
            if (a.producto) newStatus[a.producto] = "added";
          });
          setFoodStatus((prev) => ({ ...prev, ...newStatus }));

          toast.success(`Alimentos importados desde el Carrito: "${creation.name}"`);
        }
      }

      setIsImportCreationModalOpen(false);
      setDietSearchQuery("");
    } catch (e) {
      console.error("Error importing creation", e);
      toast.error("Error al importar la creación.");
    }
  };

  useEffect(() => {
    if (projectIdFromUrl) {
      fetchAvailableTags();
      return;
    }

    const storedPatient = localStorage.getItem("nutri_patient");
    if (storedPatient) {
      try {
        const parsedPatient = normalizePatient(JSON.parse(storedPatient));
        void hydratePatient(parsedPatient).then((hydratedPatient) => {
          if (!hydratedPatient) return;
          applySelectedPatient(hydratedPatient, { showToast: false });
        });
      } catch (e) {
        console.error("Failed to parse stored patient", e);
      }
    }

    fetchAvailableTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const statuses: Record<string, "base" | "favorite" | "removed" | "added"> =
      {};
    initialFoods.forEach((f) => {
      statuses[f.producto] = startEmpty ? "removed" : "base";
    });

    if (projectIdFromUrl) {
      setFoodStatus(statuses);
      return;
    }

    const loadFromBackend = async (id: string, retries = 3) => {
      if (!id || id === "undefined" || id === "null") {
        localStorage.removeItem("currentDietEditId");
        setIsHydrating(false);
        return;
      }

      try {
        const response = await fetchApi(`/creations/${id}`,);

        if (response.ok) {
          const text = await response.text();
          if (!text) {
            console.warn(
              "La respuesta del servidor está vacía para el ID:",
              id,
            );
            localStorage.removeItem("currentDietEditId");
            setIsHydrating(false);
            return;
          }

            try {
              const data = JSON.parse(text);
              handleImportCreation(data);
              // Restaurar los pasos 3-6 (Platos/Comidas/Carrito/Recursos + intro/despedida)
              // al reabrir una dieta propia guardada previamente, ya que
              // handleImportCreation solo restaura los alimentos base.
              if (data?.type === "DIET" && data?.content) {
                const c = data.content;
                if (Array.isArray(c.meals)) setMeals(c.meals);
                if (Array.isArray(c.dietMealsTableData)) setDietMealsTableData(c.dietMealsTableData);
                if (typeof c.includeMealsSection === "boolean") setIncludeMealsSection(c.includeMealsSection);
                if (typeof c.includeExchangeGuideInPdf === "boolean") setIncludeExchangeGuideInPdf(c.includeExchangeGuideInPdf);
                if (Array.isArray(c.avoidFoods)) setAvoidFoods(c.avoidFoods);
                if (typeof c.includeAvoidFoodsInPdf === "boolean") setIncludeAvoidFoodsInPdf(c.includeAvoidFoodsInPdf);
                if (typeof c.includeCartSection === "boolean") setIncludeCartSection(c.includeCartSection);
                if (c.cartItemOverrides && typeof c.cartItemOverrides === "object") setCartItemOverrides(c.cartItemOverrides);
                if (Array.isArray(c.removedCartItemIds)) setRemovedCartItemIds(c.removedCartItemIds);
                if (typeof c.includeResourcesSection === "boolean") setIncludeResourcesSection(c.includeResourcesSection);
                if (Array.isArray(c.selectedResourceIds)) setSelectedResourceIds(c.selectedResourceIds);
                if (typeof c.hasCustomIntroMessage === "boolean") setHasCustomIntroMessage(c.hasCustomIntroMessage);
                if (typeof c.introMessage === "string") setIntroMessage(c.introMessage);
                if (typeof c.includeIntroInPdf === "boolean") setIncludeIntroInPdf(c.includeIntroInPdf);
                if (typeof c.hasCustomClosingMessage === "boolean") setHasCustomClosingMessage(c.hasCustomClosingMessage);
                if (typeof c.closingMessage === "string") setClosingMessage(c.closingMessage);
                if (typeof c.includeClosingInPdf === "boolean") setIncludeClosingInPdf(c.includeClosingInPdf);
              }
              setIsHydrating(false);
            } catch (parseError) {
              console.error("Error parseando JSON de la creación:", parseError);
              setIsHydrating(false);
            }
          } else if (response.status === 404) {
            localStorage.removeItem("currentDietEditId");
            setIsHydrating(false);
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
      } catch {
        if (retries > 0) {
          setTimeout(() => loadFromBackend(id, retries - 1), 2000);
        } else {
          console.warn(
            "Error al cargar la creación para editar (backend no disponible)",
          );
          setIsHydrating(false);
        }
      } finally {
        if (retries === 0) localStorage.removeItem("currentDietEditId");
      }
    };

    const editId = creationIdFromUrl || localStorage.getItem("currentDietEditId");
    if (editId) {
      loadFromBackend(editId);
      return;
    }

    const savedDraft =
      sessionStorage.getItem(getUserDraftKey()) ||
      localStorage.getItem(getUserDraftKey()) ||
      localStorage.getItem("nutri_active_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.dietName) setDietName(draft.dietName);
        if (draft.dietTags) setDietTags(draft.dietTags);
        if (typeof draft.creationDescription === "string")
          setCreationDescription(draft.creationDescription);
        if (typeof draft.planObjective === "string")
          setPlanObjective(draft.planObjective);
        setShowPlanObjectiveInPdf(draft.showPlanObjectiveInPdf === true);
        if (Array.isArray(draft.activeConstraints))
          setActiveConstraints(draft.activeConstraints);
        if (draft.macroSettings)
          setMacroSettings(draft.macroSettings || createDefaultMacroSettings());
        if (draft.manualAdditions) setManualAdditions(draft.manualAdditions);
        if (draft.customGroups) setCustomGroups(draft.customGroups);
        if (draft.customConstraints)
          setCustomConstraints(draft.customConstraints);
        if (draft.selectedPatient) setSelectedPatient(draft.selectedPatient);
        if (draft.foodStatus) setFoodStatus({ ...statuses, ...draft.foodStatus });
        if (typeof draft.currentStep === "number") setCurrentStep(draft.currentStep);
        if (Array.isArray(draft.meals)) setMeals(draft.meals);
        if (Array.isArray(draft.dietMealsTableData)) setDietMealsTableData(draft.dietMealsTableData);
        if (typeof draft.includeMealsSection === "boolean") setIncludeMealsSection(draft.includeMealsSection);
        if (typeof draft.includeExchangeGuideInPdf === "boolean") setIncludeExchangeGuideInPdf(draft.includeExchangeGuideInPdf);
        if (typeof draft.includeCartSection === "boolean") setIncludeCartSection(draft.includeCartSection);
        if (typeof draft.includeFoodTableSection === "boolean") setIncludeFoodTableSection(draft.includeFoodTableSection);
        if (typeof draft.includeResourcesSection === "boolean") setIncludeResourcesSection(draft.includeResourcesSection);
        if (Array.isArray(draft.selectedResourceIds)) setSelectedResourceIds(draft.selectedResourceIds);
        if (draft.cartItemOverrides && typeof draft.cartItemOverrides === "object") setCartItemOverrides(draft.cartItemOverrides);
        if (Array.isArray(draft.removedCartItemIds)) setRemovedCartItemIds(draft.removedCartItemIds);
        if (Array.isArray(draft.avoidFoods)) setAvoidFoods(draft.avoidFoods);
        if (typeof draft.includeAvoidFoodsInPdf === "boolean") setIncludeAvoidFoodsInPdf(draft.includeAvoidFoodsInPdf);
        if (typeof draft.hasCustomIntroMessage === "boolean") setHasCustomIntroMessage(draft.hasCustomIntroMessage);
        if (typeof draft.introMessage === "string") setIntroMessage(draft.introMessage);
        if (typeof draft.includeIntroInPdf === "boolean") setIncludeIntroInPdf(draft.includeIntroInPdf);
        if (typeof draft.hasCustomClosingMessage === "boolean") setHasCustomClosingMessage(draft.hasCustomClosingMessage);
        if (typeof draft.closingMessage === "string") setClosingMessage(draft.closingMessage);
        if (typeof draft.includeClosingInPdf === "boolean") setIncludeClosingInPdf(draft.includeClosingInPdf);
        setIsHydrating(false);
        return;
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
    setFoodStatus(statuses);
    setIsHydrating(false);
  }, [initialFoods, projectIdFromUrl, creationIdFromUrl]);

  useEffect(() => {
    if (!projectIdFromUrl) return;

  const loadProjectContext = async () => {
      setIsProjectLoading(true);
      try {
        const project = await fetchProject(projectIdFromUrl);
        setCurrentProjectId(project.id);
        setCurrentProjectName(project.name);
        setCurrentProjectMode(project.mode);

        if (project.patient) {
          const hydratedPatient = await hydratePatient(
            normalizePatient(project.patient),
          );
          if (hydratedPatient) {
            applySelectedPatient(hydratedPatient, { showToast: false });
          }
        }

        if (project.activeDietCreationId) {
          const creation = await fetchCreation(project.activeDietCreationId);
          handleImportCreation(creation);
        }
      } catch (error) {
        console.error("Error loading project diet context", error);
        toast.error("No se pudo cargar el proyecto en Dieta.");
      } finally {
        setIsProjectLoading(false);
        setIsHydrating(false);
      }
    };

    loadProjectContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (!isImportPatientModalOpen) return;

    const timer = setTimeout(() => {
      void fetchPatients(patientSearchQuery);
    }, patientSearchQuery ? 250 : 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImportPatientModalOpen, patientSearchQuery]);

  const includedFoods = useMemo(() => {
    const allPotential = [...initialFoods, ...manualAdditions];

    return allPotential.filter((food, idx) => {
      if (idx < initialFoods.length) {
        const hasManualOverride = manualAdditions.some(
          (ma) => ma.producto === food.producto,
        );
        if (hasManualOverride) return false;
      }

      const status = foodStatus[food.producto];
      if (status === "removed") return false;

      if (manualAdditions.some((ma) => ma.producto === food.producto)) {
        return true;
      }

      if (status === "added" || status === "favorite") {
        return true;
      }

      if (!status || status === "base") {
        if (startEmpty) return false;
        const normalizedConstraints = activeConstraints.map((c) =>
            c.toLowerCase(),
          );

          if (
            normalizedConstraints.some(
              (c) => c === "vegetariano" || c === "vegano" || c === "vegan",
            )
          ) {
            const meatGroups = [
              "Carnes y Vísceras",
              "Pescados y Mariscos",
              "Huevos",
            ];
            if (meatGroups.includes(food.grupo)) return false;
          }
          if (
            normalizedConstraints.includes("diabético") ||
            normalizedConstraints.includes("diabetico")
          ) {
            if (food.azucares !== undefined && food.azucares > 10) return false;
            const sugarKeywords = [
              "azucar",
              "dulce",
              "chocolate",
              "galleta",
              "bebida",
              "nectar",
              "mermelada",
              "miel",
            ];
            if (
              sugarKeywords.some((k) => food.producto.toLowerCase().includes(k))
            )
              return false;
          }
          if (
            normalizedConstraints.includes("celiaco") ||
            normalizedConstraints.includes("celíaco") ||
            normalizedConstraints.includes("gluten") ||
            normalizedConstraints.includes("sin gluten")
          ) {
            const glutenGroups = ["Cereales y Derivados"];
            const glutenKeywords = [
              "trigo",
              "cebada",
              "centeno",
              "pan",
              "fideos",
              "galleta",
            ];
            if (
              glutenGroups.includes(food.grupo) &&
              glutenKeywords.some((k) =>
                food.producto.toLowerCase().includes(k),
              )
            )
              return false;
          }
          return true;
        }
        return false;
      });
  }, [initialFoods, manualAdditions, foodStatus, activeConstraints]);

  const autoCartItems = useMemo(() => {
    const base = buildAutoCartItems(includedFoods, meals);
    return base
      .filter((item) => !removedCartItemIds.includes(item.id))
      .map((item) => ({
        ...item,
        name: cartItemOverrides[item.id] || item.name,
      }));
  }, [includedFoods, meals, cartItemOverrides, removedCartItemIds]);

  const saveDraft = (overrides: any = {}) => {
    try {
      const currentDraftKey = getUserDraftKey();
      const draft = {
        dietName:
          overrides.dietName !== undefined ? overrides.dietName : dietName,
        dietTags:
          overrides.dietTags !== undefined ? overrides.dietTags : dietTags,
        creationDescription:
          overrides.creationDescription !== undefined
            ? overrides.creationDescription
            : creationDescription,
        planObjective:
          overrides.planObjective !== undefined
            ? overrides.planObjective
            : planObjective,
        showPlanObjectiveInPdf:
          overrides.showPlanObjectiveInPdf !== undefined
            ? overrides.showPlanObjectiveInPdf
            : showPlanObjectiveInPdf,
        activeConstraints:
          overrides.activeConstraints !== undefined
            ? overrides.activeConstraints
            : activeConstraints,
        selectedPatient:
          overrides.selectedPatient !== undefined
            ? overrides.selectedPatient
            : selectedPatient,
        foodStatus:
          overrides.foodStatus !== undefined
            ? overrides.foodStatus
            : foodStatus,
        manualAdditions:
          overrides.manualAdditions !== undefined
            ? overrides.manualAdditions
            : manualAdditions,
        customGroups:
          overrides.customGroups !== undefined
            ? overrides.customGroups
            : customGroups,
        customConstraints:
          overrides.customConstraints !== undefined
            ? overrides.customConstraints
            : customConstraints,
        macroSettings:
          overrides.macroSettings !== undefined
            ? overrides.macroSettings
            : macroSettings,
        currentStep:
          overrides.currentStep !== undefined ? overrides.currentStep : currentStep,
        meals:
          overrides.meals !== undefined ? overrides.meals : meals,
        dietMealsTableData:
          overrides.dietMealsTableData !== undefined ? overrides.dietMealsTableData : dietMealsTableData,
        includeMealsSection:
          overrides.includeMealsSection !== undefined ? overrides.includeMealsSection : includeMealsSection,
        includeExchangeGuideInPdf:
          overrides.includeExchangeGuideInPdf !== undefined ? overrides.includeExchangeGuideInPdf : includeExchangeGuideInPdf,
        includeCartSection:
          overrides.includeCartSection !== undefined ? overrides.includeCartSection : includeCartSection,
        includeFoodTableSection:
          overrides.includeFoodTableSection !== undefined ? overrides.includeFoodTableSection : includeFoodTableSection,
        includeResourcesSection:
          overrides.includeResourcesSection !== undefined ? overrides.includeResourcesSection : includeResourcesSection,
        selectedResourceIds:
          overrides.selectedResourceIds !== undefined ? overrides.selectedResourceIds : selectedResourceIds,
        cartItemOverrides:
          overrides.cartItemOverrides !== undefined ? overrides.cartItemOverrides : cartItemOverrides,
        removedCartItemIds:
          overrides.removedCartItemIds !== undefined ? overrides.removedCartItemIds : removedCartItemIds,
        avoidFoods:
          overrides.avoidFoods !== undefined ? overrides.avoidFoods : avoidFoods,
        includeAvoidFoodsInPdf:
          overrides.includeAvoidFoodsInPdf !== undefined ? overrides.includeAvoidFoodsInPdf : includeAvoidFoodsInPdf,
        introMessage:
          overrides.introMessage !== undefined ? overrides.introMessage : introMessage,
        includeIntroInPdf:
          overrides.includeIntroInPdf !== undefined ? overrides.includeIntroInPdf : includeIntroInPdf,
        hasCustomIntroMessage:
          overrides.hasCustomIntroMessage !== undefined ? overrides.hasCustomIntroMessage : hasCustomIntroMessage,
        closingMessage:
          overrides.closingMessage !== undefined ? overrides.closingMessage : closingMessage,
        includeClosingInPdf:
          overrides.includeClosingInPdf !== undefined ? overrides.includeClosingInPdf : includeClosingInPdf,
        hasCustomClosingMessage:
          overrides.hasCustomClosingMessage !== undefined ? overrides.hasCustomClosingMessage : hasCustomClosingMessage,
        favoritesEnabled,
        timestamp: Date.now(),
      };
      const serialized = JSON.stringify(draft);
      sessionStorage.setItem(currentDraftKey, serialized);
      localStorage.setItem(currentDraftKey, serialized);
      localStorage.setItem("nutri_active_draft", serialized);
    } catch (e) {
      console.error("Error saving draft", e);
    }
  };

  useEffect(() => {
    if (isHydrating) return;
    const timeout = setTimeout(() => {
      saveDraft();
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dietName,
    dietTags,
    planObjective,
    showPlanObjectiveInPdf,
    activeConstraints,
    customGroups,
    customConstraints,
    macroSettings,
    manualAdditions,
    foodStatus,
    currentStep,
    meals,
    dietMealsTableData,
    includeMealsSection,
    includeExchangeGuideInPdf,
    includeCartSection,
    includeFoodTableSection,
    includeResourcesSection,
    selectedResourceIds,
    cartItemOverrides,
    removedCartItemIds,
    avoidFoods,
    includeAvoidFoodsInPdf,
    introMessage,
    includeIntroInPdf,
    hasCustomIntroMessage,
    closingMessage,
    includeClosingInPdf,
    hasCustomClosingMessage,
    isHydrating,
  ]);

  const toggleConstraint = (id: string) => {
    const next = activeConstraints.includes(id)
      ? activeConstraints.filter((c) => c !== id)
      : [...activeConstraints, id];
    setActiveConstraints(next);
    saveDraft({ activeConstraints: next });
  };

  const removeFood = (productName: string) => {
    const nextStatus = { ...foodStatus, [productName]: "removed" as const };
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });

    toast("Alimento eliminado de la dieta", {
      action: {
        label: "Deshacer",
        onClick: () => {
          setFoodStatus((prev) => {
            const next = { ...prev };
            delete next[productName];
            saveDraft({ foodStatus: next });
            return next;
          });
        },
      },
    });
  };

  const toggleFavorite = async (food: MarketPrice) => {
    const productName = food.producto;
    const previousStatus = foodStatus[productName];
    const isCurrentlyFavorite = previousStatus === "favorite";
    const newStatus = isCurrentlyFavorite
      ? manualAdditions.some((ma) => ma.producto === productName)
        ? "added"
        : "base"
      : ("favorite" as const);

    if (!isCurrentlyFavorite) {
      toast.success(`${productName} guardado en favoritos ⭐️`);
    } else {
      toast.info(`${productName} eliminado de favoritos`);
    }

    const nextStatus: Record<string, "base" | "favorite" | "removed" | "added"> = { ...foodStatus, [productName]: newStatus as "base" | "favorite" | "removed" | "added" };
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });

    try {
      let targetId = food.id;

      if (food.id && food.id.startsWith("base-")) {
        const res = await fetchApi(
          `/foods?search=${encodeURIComponent(productName)}&limit=1`,
        );
        if (res.ok) {
          const results = await res.json();
          const matching = results.find(
            (r: any) => r.name.toLowerCase() === productName.toLowerCase(),
          );
          if (matching) targetId = matching.id;
        }
      }

      if (
        targetId &&
        !targetId.startsWith("base-") &&
        !targetId.startsWith("search-") &&
        !targetId.startsWith("manual-")
      ) {
        await fetchApi(`/foods/${targetId}/preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFavorite: !isCurrentlyFavorite }),
        });
      }
    } catch (e) {
      console.error("Error toggling favorite", e);
    }
  };

  const handleSave = async () => {
    if (isHydrating) return;
    if (!dietName.trim()) {
      toast.error("Por favor, asigna un nombre a la dieta.");
      return;
    }

    try {
      const savedCreation = await saveCreation(buildDietCreationPayload());

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          activeDietCreationId: savedCreation.id,
          patientId: selectedPatient?.id,
          metadata: {
            sourceModule: "diet",
            lastDietName: dietName,
          },
        });
      }

      if (savedCreation?.wasUpdated) {
        toast.success(`Dieta "${dietName}" actualizada correctamente en Mis Creaciones.`, {
          action: {
            label: "Ir a Creaciones",
            onClick: () => router.push("/dashboard/creaciones"),
          },
          duration: 5000,
        });
      } else if (savedCreation?.wasCreated === false) {
        toast.info(`La dieta "${dietName}" ya se encuentra guardada en Mis Creaciones sin cambios pendientes.`, {
          action: {
            label: "Ir a Creaciones",
            onClick: () => router.push("/dashboard/creaciones"),
          },
          duration: 5000,
        });
      } else {
        toast.success(
          `Dieta "${dietName}" guardada correctamente en Mis Creaciones.`,
          {
            description:
              "Las restricciones seleccionadas generarán contenido educativo automáticamente.",
            action: {
              label: "Ir a Creaciones",
              onClick: () => router.push("/dashboard/creaciones"),
            },
            duration: 5000,
          },
        );
      }
      fetchAvailableTags();
    } catch (error: any) {
      console.error("Error saving creation:", error);
      toast.error(
        error.message || "No se pudo guardar la creación en la base de datos.",
      );
    }
  };

  const handleSaveWithDescription = async () => {
    if (isHydrating) return;
    try {
      const savedCreation = await saveCreation(
        buildDietCreationPayload(creationDescription),
      );

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          activeDietCreationId: savedCreation.id,
          patientId: selectedPatient?.id,
          metadata: {
            sourceModule: "diet",
            lastDietName: dietName,
          },
        });
      }

      if (savedCreation?.wasUpdated) {
        toast.success(`Dieta "${dietName}" actualizada correctamente en Mis Creaciones.`);
      } else if (savedCreation?.wasCreated === false) {
        toast.info(`La dieta "${dietName}" ya se encuentra guardada en Mis Creaciones sin cambios pendientes.`);
      } else {
        toast.success(
          `Dieta "${dietName}" guardada correctamente en Mis Creaciones.`,
          {
            description:
              "Las restricciones seleccionadas generarán contenido educativo automáticamente.",
            action: {
              label: "Ir a Creaciones",
              onClick: () => router.push("/dashboard/creaciones"),
            },
            duration: 5000,
          },
        );
      }
      fetchAvailableTags();
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: any) {
      console.error("Error saving creation:", error);
      toast.error(
        error.message || "No se pudo guardar la creación en la base de datos.",
      );
    }
  };

  const hasIngredientInteraction = useMemo(() => {
    return (
      manualAdditions.length > 0 ||
      Object.values(foodStatus).some((status) => status !== "base")
    );
  }, [manualAdditions, foodStatus]);

  const performExportPdf = async () => {
    if (isHydrating) return;
    if (!includedFoods.length && !meals.length && !dietMealsTableData?.length) {
      toast.error("No hay datos en la dieta para exportar.");
      return;
    }
    if (!dietName.trim()) {
      toast.error("Asigna un nombre a la dieta antes de exportar.");
      return;
    }
    if (!selectedPatient) {
      toast.error(
        "Debes importar un paciente antes de generar el entregable personalizado.",
      );
      return;
    }
    setIsExportingPdf(true);
    const toastId = toast.loading("Generando PDF...");
    try {
      const { downloadFastDeliverablePdf } = await import(
        "@/features/pdf/fastDeliverablePdfExport"
      );
      const { DIET_RESOURCES_CATALOG } = await import(
        "@/features/diet/components/DietResourcesSection"
      );

      const patientDetails = selectedPatient
        ? {
            name: selectedPatient.fullName || null,
            ageYears: selectedPatient.age ? Number(selectedPatient.age) : null,
            weight: selectedPatient.weight ? Number(selectedPatient.weight) : null,
            height: selectedPatient.height ? Number(selectedPatient.height) : null,
            bmi:
              selectedPatient.weight && selectedPatient.height
                ? Number(
                    (
                      selectedPatient.weight /
                      Math.pow(selectedPatient.height / 100, 2)
                    ).toFixed(1)
                  )
                : null,
          }
        : null;

      const allRestrictionsList = Array.from(
        new Set([
          ...activeConstraints,
          ...(selectedPatient?.dietRestrictions || []),
          ...(selectedPatient?.tags || []),
        ].filter(Boolean))
      );
      const clinicalRestrictionStr =
        allRestrictionsList.length > 0 ? allRestrictionsList.join(", ") : null;

      const formattedMeals = (dietMealsTableData || [])
        .filter((m: any) => m.mealText || m.section)
        .map((m: any, idx: number) => ({
          id: m.id || `meal-${idx}`,
          section: m.section || `Comida ${idx + 1}`,
          time: m.time || "12:00",
          mealText: m.mealText || "Sin plato asignado",
          portion: m.portion || "1 porción",
        }));

      const resolvedResources = includeResourcesSection
        ? ((selectedResourceIds || [])
            .map((id) => {
              const item = DIET_RESOURCES_CATALOG.find((r) => r.id === id);
              if (!item) return null;
              return {
                resourceId: item.id,
                title: item.title,
                content: `
              <h2>${item.title}</h2>
              <p><strong>Categoría:</strong> ${item.category}</p>
              <p>${item.description}</p>
              ${
                item.recommendationReason
                  ? `<p><em>${item.recommendationReason}</em></p>`
                  : ""
              }
            `.trim(),
              };
            })
            .filter(Boolean) as any[])
        : [];

      const recipesForPdf = (meals || [])
        .filter((m: any) => m?.name?.trim())
        .map((m: any, idx: number) => {
          const ingredients =
            Array.isArray(m.ingredientDetails) && m.ingredientDetails.length > 0
              ? m.ingredientDetails
                  .map((ing: any) => (typeof ing?.name === "string" ? ing.name.trim() : ""))
                  .filter(Boolean)
              : typeof m.ingredients === "string" && m.ingredients.trim()
                ? m.ingredients
                    .split(/[\n,;]+/)
                    .map((i: string) => i.trim())
                    .filter(Boolean)
                : [];
          return {
            id: m.id || `recipe-${idx}`,
            name: m.name,
            section: m.section,
            time: m.time,
            portion: m.portion,
            ingredients,
            instructions: m.instructions,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fats: m.fats,
          };
        });

      const cartForPdf = includeCartSection
        ? autoCartItems.map((item) => ({
            name: item.name,
            category: item.category,
            sources: item.sources,
          }))
        : [];

      const currentUser = getCurrentUser();
      const nutritionistName =
        currentUser?.nutritionist?.fullName || currentUser?.name || null;
      const nutritionistEmail = currentUser?.email || null;

      // Guía de porciones de intercambio real (clínica), no un listado repetido
      // de los alimentos de la dieta. Respeta el toggle "Incluir en el PDF final"
      // de la sección "Guía de Porciones de Intercambio" del paso Comidas.
      const portionGuideRows = includeExchangeGuideInPdf
        ? buildExchangeGuideForPatient().map((row) => ({
            category: row.category,
            portion: row.portion,
          }))
        : [];

      await downloadFastDeliverablePdf({
        name: dietName,
        patientName: selectedPatient?.fullName || null,
        patient: patientDetails,
        clinicalRestriction: clinicalRestrictionStr,
        contentMode: "table",
        tableMode: "simple",
        planObjective: planObjective.trim() || undefined,
        showPlanObjectiveInPdf,
        nutritionistName,
        nutritionistEmail,
        intro:
          includeIntroInPdf && introMessage.trim()
            ? { greetingName: selectedPatient?.fullName || null, message: introMessage.trim() }
            : null,
        meals:
          formattedMeals.length > 0
            ? formattedMeals
            : [
                {
                  id: "1",
                  section: "Plan Alimentario",
                  time: "08:00",
                  mealText: dietName,
                  portion: "Ver guía de porciones",
                },
              ],
        avoidFoods: includeAvoidFoodsInPdf ? avoidFoods : [],
        recipes: recipesForPdf,
        cart: cartForPdf,
        resources: resolvedResources,
        portionGuide: portionGuideRows,
        closing:
          includeClosingInPdf && closingMessage.trim()
            ? { message: closingMessage.trim() }
            : null,
        generatedAt: new Date().toLocaleDateString("es-CL"),
      });

      toast.success("PDF exportado correctamente.", { id: toastId });
    } catch (e: any) {
      console.error("Error generando PDF:", e);
      const msg = (e?.message || "").toLowerCase();
      if (
        e?.status === 403 ||
        msg.includes("límite") ||
        msg.includes("cuota") ||
        msg.includes("plan") ||
        msg.includes("free")
      ) {
        toast.error(e?.message || "Has alcanzado el límite de exportaciones en PDF de tu plan.", { id: toastId });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("show-freemium-upgrade", {
              detail: {
                description: e?.message || "Has alcanzado el límite de exportaciones en PDF de tu plan.",
              },
            })
          );
        }
      } else {
        toast.error(e?.message || "Error al generar el PDF. Intenta de nuevo.", { id: toastId });
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPdf = async () => {
    if (!dietName.trim()) {
      toast.error("Asigna un nombre a la dieta antes de exportar.");
      return;
    }
    if (!includedFoods.length) {
      toast.error("No hay alimentos en la dieta para exportar.");
      return;
    }
    if (!hasIngredientInteraction) {
      setIsExportConfirmOpen(true);
      return;
    }
    await performExportPdf();
  };

  const handleVerifyRestrictions = async () => {
    toast.info("La validación de restricciones estará disponible próximamente.");
    return;
  };

  const draftFoodsPendingCompletion = useMemo(() => {
    return includedFoods.filter((food) => !!food.isDraft);
  }, [includedFoods]);

  const continueToRecipes = async () => {
    if (isHydrating) return;
    if (!dietName.trim()) {
      toast.error("Por favor, asigna un nombre a la dieta antes de continuar.");
      return;
    }
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draft = storedDraft ? JSON.parse(storedDraft) : {};
    draft.diet = {
      ...(draft.diet || {}),
      name: dietName,
      tags: dietTags,
      planObjective,
      showPlanObjectiveInPdf,
      activeConstraints,
      macroSettings,
      macroTargets,
      manualAdditions,
      customGroups,
      customConstraints,
      foodStatus,
      includedFoods,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

    try {
      const savedCreation = await saveCreation(buildDietCreationPayload());
      const projectId = await ensureProjectForWorkflow(savedCreation.id);
      sessionStorage.setItem("nutri_cart_draft_decided", "keep");
      setTimeout(
        () =>
          router.push(buildProjectAwarePath("/dashboard/recetas", projectId)),
        1000,
      );
    } catch (error: any) {
      console.error("Error continuing from diet", error);
      toast.error(
        error?.message || "No se pudo preparar el proyecto para continuar.",
      );
    }
  };

  const handleContinue = async () => {
    if (!dietName.trim()) {
      toast.error("Por favor, asigna un nombre a la dieta antes de continuar.");
      return;
    }

    if (draftFoodsPendingCompletion.length > 0) {
      setIsContinueDraftWarningOpen(true);
      return;
    }

    await continueToRecipes();
  };

  const handleQuickGenerateAiDishes = async (
    options?: {
      categoryTargets?: Record<string, number>;
      instructions?: string;
      useBaseDiet?: boolean;
    },
    setMeals?: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (!hasActiveSession()) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    const defaultTargets: Record<string, number> = {
      desayuno: 1,
      "colación am": 1,
      almuerzo: 1,
      "colación pm": 1,
      cena: 1,
    };

    const activeTargets = options?.categoryTargets || defaultTargets;

    const targetSections = Object.entries(activeTargets)
      .filter(([_, count]) => count > 0)
      .map(([section, count]) => ({
        mealSection: section.toLowerCase(),
        count: count,
      }));

    if (targetSections.length === 0) {
      toast.info("Selecciona al menos 1 plato en alguna categoría para generar con Naty.");
      return;
    }

    const useBaseDiet = options?.useBaseDiet !== false;
    const sourceFoodsList = useBaseDiet
      ? [
          ...includedFoods.map((f: any) => String(f.producto || f.name || "")),
          ...manualAdditions.map((f: any) => String(f.producto || f.name || "")),
        ].filter((name): name is string => typeof name === "string" && Boolean(name.trim()))
      : [];

    setIsGeneratingAiDishes(true);

    const totalCalories = includedFoods.reduce((acc, f: any) => acc + Number(f.energiaKcal || f.calorias || 0), 0);
    const totalProtein = includedFoods.reduce((acc, f: any) => acc + Number(f.proteinas || f.protein || 0), 0);
    const totalCarbs = includedFoods.reduce((acc, f: any) => acc + Number(f.carbohidratos || f.carbs || 0), 0);
    const totalFats = includedFoods.reduce((acc, f: any) => acc + Number(f.lipidos || f.fats || 0), 0);

    try {
      const patient = selectedPatient;
      const patientRestrictions = Array.isArray(patient?.dietRestrictions)
        ? patient.dietRestrictions
        : typeof patient?.dietRestrictions === "string"
        ? [patient.dietRestrictions]
        : [];

      const patientDislikes = Array.isArray(patient?.dislikedFoods)
        ? patient.dislikedFoods
        : typeof patient?.dislikedFoods === "string"
        ? [patient.dislikedFoods]
        : [];

      const activeConstraintsList = Array.isArray(activeConstraints)
        ? activeConstraints
        : typeof activeConstraints === "string"
        ? [activeConstraints]
        : [];

      const combinedRestrictions = Array.from(
        new Set([
          ...activeConstraintsList,
          ...patientRestrictions,
          ...patientDislikes,
        ])
      ).filter((r): r is string => typeof r === "string" && Boolean(r.trim()));

      const baseNotes = useBaseDiet
        ? "Distribuye de forma gastronómicamente lógica los alimentos de la dieta base. El yogurt/lácteos dulces va únicamente en desayuno/colación/once, NUNCA en almuerzo o cena. NUNCA combines 'Papa con Yogurt' ni yogurt en platos salados de almuerzo o cena. Si faltan alimentos para platos realistas, agrega libremente alimentos cotidianos de cocina (huevos, aceite, sal, cebolla, pollo, pan, tomate). Respetar todas las restricciones e intolerancias del paciente. Sin negritas ni asteriscos en los textos."
        : "Crea preparaciones variadas y deliciosas para el paciente respetando sus requerimientos nutricionales. Sin negritas ni asteriscos en los textos.";

      const customNotes = options?.instructions?.trim();
      const finalNotes = customNotes ? `${customNotes}\n\n${baseNotes}` : baseNotes;

      const payload = {
        payload: {
          notes: finalNotes,
          specialConsiderations: `RESTRICCIONES OBLIGATORIAS DEL PACIENTE: ${
            combinedRestrictions.length > 0 ? combinedRestrictions.join(", ") : "Sin restricciones declaradas"
          }. No incluyas bajo ninguna circunstancia ingredientes que violen estas restricciones.`,
          allowedFoodsMain: sourceFoodsList,
          allowExternalFoods: true,
          exchangeGuide: buildExchangeGuideForAi(),
          nutritionalTargets: {
            dailyCalories: totalCalories > 0 ? totalCalories : 2000,
            dailyProtein: totalProtein > 0 ? totalProtein : 100,
            dailyCarbs: totalCarbs > 0 ? totalCarbs : 250,
            dailyFats: totalFats > 0 ? totalFats : 60,
          },
          mealSectionTargets: targetSections,
          generationMode: "single" as const,
          patient: {
            fullName: patient?.fullName ?? "",
            gender: patient?.gender ?? "",
            ageYears: patient?.ageYears ?? undefined,
            restrictions: combinedRestrictions,
            fitnessGoals: patient?.fitnessGoals ?? "",
            clinicalSummary: patient?.nutritionalFocus ?? "",
          },
          patientId: patient?.id || undefined,
        },
      };

      const response = await fetchApi("/recipes/quick-ai-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "No se pudo generar platos con IA.");
      }

      const result = await response.json();
      const sanitizeText = (txt: any) =>
        typeof txt === "string" ? txt.replace(/\*\*/g, "").replace(/\*/g, "").trim() : txt;

      const dishes = (result?.dishes || []).map((d: any) => ({
        id: crypto.randomUUID(),
        title: sanitizeText(d.title) || "Preparación sugerida",
        mealSection: d.mealSection || "Almuerzo",
        description: sanitizeText(d.description) || "",
        preparation: sanitizeText(d.preparation || d.instructions) || "",
        recommendedPortion: sanitizeText(d.recommendedPortion) || "1 porción estándar",
        portions: d.portions != null ? Number(d.portions) : 1,
        protein: Number(d.protein) || 0,
        calories: Number(d.calories) || 0,
        carbs: Number(d.carbs) || 0,
        fats: Number(d.fats) || 0,
        ingredients: Array.isArray(d.ingredients)
          ? d.ingredients.map((ing: any) =>
              sanitizeText(typeof ing === "string" ? ing : `${ing.quantity || ""} ${ing.name || ""}`.trim())
            )
          : [],
        ingredientDetails: Array.isArray(d.ingredients)
          ? d.ingredients.map((ing: any) =>
              typeof ing === "object" && ing !== null
                ? {
                    ...ing,
                    name: sanitizeText(ing.name),
                    quantity: sanitizeText(ing.quantity),
                  }
                : ing
            )
          : [],
      }));

      if (dishes.length === 0) {
        toast.info("Naty no pudo generar platos con los ingredientes actuales. Agrega más alimentos a la dieta base.");
        return;
      }

      handleConfirmAiDishes(dishes, setMeals);
    } catch (err: any) {
      const errMsg = (err?.message || "").toLowerCase();
      const isQuotaLimit =
        err?.status === 403 ||
        errMsg.includes("límite") ||
        errMsg.includes("limite") ||
        errMsg.includes("cuota") ||
        errMsg.includes("plan") ||
        errMsg.includes("ai.calls.limit");

      if (isQuotaLimit) {
        setIsUpgradeModalOpen(true);
      } else {
        console.error("Error al generar platos con Naty IA:", err);
        toast.error(err?.message || "Error al conectar con Naty IA.");
      }
    } finally {
      setIsGeneratingAiDishes(false);
    }
  };

  const handleConfirmAiDishes = (validatedDishes: any[], setMeals?: React.Dispatch<React.SetStateAction<any[]>>) => {
    const newMealBlocks: any[] = validatedDishes.map((d: any) => {
      const sectionName = d.mealSection
        ? d.mealSection.charAt(0).toUpperCase() + d.mealSection.slice(1)
        : "Almuerzo";
      const sectionTimes: Record<string, string> = {
        Desayuno: "08:00",
        "Colación AM": "11:00",
        "Colacion am": "11:00",
        Almuerzo: "13:30",
        "Colación PM": "17:00",
        "Colacion pm": "17:00",
        Cena: "20:30",
      };
      const time = sectionTimes[sectionName] || "13:30";

      const ingText = Array.isArray(d.ingredients)
        ? d.ingredients.join("\n")
        : typeof d.ingredients === "string"
        ? d.ingredients
        : "";

      return {
        id: d.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        section: sectionName,
        time: time,
        name: d.title || "Plato sugerido por Naty",
        ingredients: ingText,
        ingredientDetails: Array.isArray(d.ingredientDetails) ? d.ingredientDetails : [],
        instructions: d.preparation || d.description || "",
        portion: d.recommendedPortion || "1 porción estándar",
        calories: String(d.calories || 350),
        protein: String(d.protein || 25),
        carbs: String(d.carbs || 40),
        fats: String(d.fats || 10),
      };
    });

    if (setMeals) {
      setMeals((prev: any[]) => [...prev, ...newMealBlocks]);
    }
    setIsAiValidationModalOpen(false);
    setPendingAiDishes([]);
    toast.success(`Se agregaron ${newMealBlocks.length} plato(s) generados por Naty IA a la pauta.`);
    return newMealBlocks;
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      const updates: Record<string, "removed"> = {};
      initialFoods
        .filter((f) => f.grupo === groupToDelete)
        .forEach((f) => {
          updates[f.producto] = "removed";
        });
      manualAdditions
        .filter((f) => f.grupo === groupToDelete)
        .forEach((f) => {
          updates[f.producto] = "removed";
        });
      setFoodStatus((prev) => ({ ...prev, ...updates }));
      setCustomGroups((prev) => prev.filter((g) => g !== groupToDelete));
      setDeletedBaseGroups((prev) => Array.from(new Set([...prev, groupToDelete])));
      toast.success(`Categoría ${groupToDelete} eliminada.`);
      setIsDeleteGroupConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const defaultBaseGroups = useMemo(() => {
    if (startEmpty) return [];
    const groupsSet = new Set<string>();
    initialFoods.forEach((food) => {
      if (food.grupo) groupsSet.add(food.grupo);
    });
    const standardCategories = [
      "Lácteos",
      "Huevos",
      "Carnes y Vísceras",
      "Pescados y Mariscos",
      "Cereales y Derivados",
      "Legumbres",
      "Verduras",
      "Frutas",
      "Aceites y Grasas",
      "Azúcares y Dulces",
      "Bebidas",
      "Varios",
    ];
    standardCategories.forEach((g) => groupsSet.add(g));
    return Array.from(groupsSet);
  }, [initialFoods]);

  const allGroupsToRender = useMemo(() => {
    const renderedGroups: Record<string, MarketPrice[]> = {};

    defaultBaseGroups.forEach((g) => {
      if (!deletedBaseGroups.includes(g)) {
        renderedGroups[g] = [];
      }
    });

    includedFoods.forEach((f) => {
      if (!deletedBaseGroups.includes(f.grupo)) {
        if (!renderedGroups[f.grupo]) renderedGroups[f.grupo] = [];
        renderedGroups[f.grupo].push(f);
      }
    });

    customGroups.forEach((g) => {
      if (!renderedGroups[g]) renderedGroups[g] = [];
    });

    return renderedGroups;
  }, [defaultBaseGroups, deletedBaseGroups, includedFoods, customGroups]);

  useEffect(() => {
    if (!isAddFoodModalOpen || !foodSearchQuery.trim()) {
      setSearchResultFoods([]);
      setIsSearchingFoods(false);
      return;
    }

    const fetchFoods = async () => {
      setIsSearchingFoods(true);
      try {
        const res = await fetchApi(
          `/foods?search=${foodSearchQuery}&limit=20`,);
        if (res.ok) {
          const data = await res.json();
          const normalizedTargetGroup = normalizeGroupName(
            activeGroupForAddition || "Varios",
          );
          const isCustomTargetGroup = customGroups.some(
            (group) => normalizeGroupName(group) === normalizedTargetGroup,
          );

          const filteredByGroup = isCustomTargetGroup
            ? data
            : data.filter((ing: any) => {
                const ingredientGroup = normalizeGroupName(
                  ing.category?.name || "Varios",
                );
                return ingredientGroup === normalizedTargetGroup;
              });

          setSearchResultFoods(
            filteredByGroup.map((ing: any) => ({
              id: ing.id,
              producto: ing.name,
              grupo: ing.category?.name || "Varios",
              unidad: ing.unit || "g",
              precioPromedio: ing.price || 0,
              calorias: ing.calories || 0,
              proteinas: ing.proteins || 0,
              carbohidratos: ing.carbs || 0,
              lipidos: ing.lipids || 0,
              tags: ing.tags?.map((t: any) => t.name) || [],
              isDraft: !!ing.isDraft,
            })),
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingFoods(false);
      }
    };

    const timeoutId = setTimeout(fetchFoods, 300);
    return () => clearTimeout(timeoutId);
  }, [
    isAddFoodModalOpen,
    foodSearchQuery,
    activeGroupForAddition,
    customGroups,
  ]);

  useEffect(() => {
    if (smartAddTab !== "search" || !smartSearchQuery.trim()) {
      setSmartSearchResults([]);
      setIsSearchingInSmart(false);
      return;
    }

    const fetchFoods = async () => {
      setIsSearchingInSmart(true);
      try {
        const res = await fetchApi(
          `/foods?search=${smartSearchQuery}&limit=20`,);
        if (res.ok) {
          const data = await res.json();
          setSmartSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingInSmart(false);
      }
    };

    const timeoutId = setTimeout(fetchFoods, 300);
    return () => clearTimeout(timeoutId);
  }, [smartAddTab, smartSearchQuery]);

  const createBaseFoodStatus = () => {
    const nextStatus: Record<string, "base" | "removed"> = {};
    initialFoods.forEach((food) => {
      nextStatus[food.producto] = startEmpty ? "removed" : "base";
    });
    return nextStatus;
  };

  const applyBaseFoods = () => {
    const nextStatus: Record<string, "base"> = {};
    initialFoods.forEach((food) => {
      nextStatus[food.producto] = "base";
    });
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });
    toast.success("Ingredientes base aplicados a la dieta.");
  };

  const clearDietDraftStorage = () => {
    const key = getUserDraftKey();
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    localStorage.removeItem("nutri_patient");

    sessionStorage.removeItem("nutri_diet_draft_decided");
    sessionStorage.removeItem("nutri_cart_draft_decided");
  };

  const resetDietState = () => {
    setDietName("");
    setDietTags([]);
    setPlanObjective("");
    setShowPlanObjectiveInPdf(false);
    setActiveConstraints([]);
    setMacroSettings(createDefaultMacroSettings());
    setFoodStatus(createBaseFoodStatus() as any);
    setManualAdditions([]);
    setCustomGroups([]);
    setCurrentStep(0);
    setMeals([]);
    setIncludeMealsSection(true);
    setIncludeExchangeGuideInPdf(true);
    setDietMealsTableData([
      { id: "meal-1", section: "Desayuno", mealText: "", time: "08:30", portion: "1 porción" },
      { id: "meal-2", section: "Colación AM", mealText: "", time: "11:00", portion: "1 porción" },
      { id: "meal-3", section: "Almuerzo", mealText: "", time: "13:30", portion: "1 porción" },
      { id: "meal-4", section: "Colación PM", mealText: "", time: "17:00", portion: "1 porción" },
      { id: "meal-5", section: "Cena", mealText: "", time: "20:30", portion: "1 porción" },
    ]);
    setDeletedBaseGroups([]);
    setCustomConstraints([]);
    setSelectedPatient(null);
    setVerificationResult(null);
    setIsVerificationModalOpen(false);
    setIsImportPatientModalOpen(false);
    setIsImportCreationModalOpen(false);
    setShowInfoModal(false);
    setShowSupplementsDrawer(false);
    setFoodSearchQuery("");
    setSearchResultFoods([]);
    setSmartSearchQuery("");
    setSmartSearchResults([]);
    setSelectedFoods(new Set());
    setPatientSearchQuery("");
    setDietSearchQuery("");
    setEditingCreationId(null);
    setIsResetConfirmOpen(false);
    setIsExportConfirmOpen(false);
  };

  const resetDiet = () => {
    if (isHydrating) return;
    clearDietDraftStorage();
    resetDietState();
    toast.success("Dieta reiniciada.");
  };

  const handlePatientLoad = () => {
    const patientData = {
      name: "Juan Pérez",
      age: 34,
      weight: 88,
      height: 1.82,
      targetProtein: 180,
      targetCarbs: 300,
      targetFats: 80,
      targetCalories: 2600,
      fitnessGoals: {
        weights: { enabled: true, minutes: 60, freq: 4 },
        cardio: { enabled: true, level: "moderado", minutes: 30, freq: 3 },
        sports: { enabled: false, type: "Fútbol", minutes: 90, freq: 1 },
        lowImpact: { enabled: true, type: "Caminata", minutes: 45, freq: 2 },
      },
    };

    setSelectedPatient(patientData as any);
    setMacroSettings((prev) => ({
      ...prev,
      referenceWeightKg: patientData.weight || prev.referenceWeightKg,
    }));
    localStorage.setItem("nutri_patient", JSON.stringify(patientData));
    window.dispatchEvent(new Event("patient-updated"));

    toast.success(
      "Perfil de Juan Pérez cargado. Los objetivos han sido actualizados.",
    );
  };

  const openAddModal = (groupName: string) => {
    setActiveGroupForAddition(groupName);
    setFoodSearchQuery("");
    setSearchResultFoods([]);
    setIsAddFoodModalOpen(true);
  };

  const handleAddFromSearch = (food: MarketPrice) => {
    if (!activeGroupForAddition) return;
    addFoodToGroup(food, activeGroupForAddition);
    setIsAddFoodModalOpen(false);
  };

  const addFoodToGroup = (
    food: MarketPrice,
    groupName: string,
    options?: { silent?: boolean },
  ) => {
    const nextStatus = { ...foodStatus, [food.producto]: "added" as const };
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });
    const alreadyInManual = manualAdditions.some(
      (ma) => ma.producto === food.producto && ma.grupo === groupName,
    );

    if (!alreadyInManual) {
      setManualAdditions((prev) => [
        ...prev,
        {
          ...food,
          grupo: groupName,
          id: `add-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        },
      ]);
    }
    if (!options?.silent) {
      toast.success(`${food.producto} añadido a ${groupName}`);
    }
  };

  const handleCreateGroupByName = (groupName: string) => {
    const name = groupName.trim();
    if (!name) return;
    const existing = Object.keys(allGroupsToRender).map((g) => g.toLowerCase());
    if (existing.includes(name.toLowerCase())) {
      toast.error(`La categoría "${name}" ya existe en el plan.`);
      return;
    }
    setCustomGroups((prev) => [...prev, name]);
    setDeletedBaseGroups((prev) => prev.filter((g) => g !== name));
    toast.success(`Categoría "${name}" agregada.`);
  };

  const handleCreateManualFood = async () => {
    setIsCreatingManualFood(true);
    try {
      const response = await fetchApi("/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: foodSearchQuery.trim(),
          brand: "Sin marca",
          category: activeGroupForAddition || "Varios",
          price: 0,
          unit: "g",
          amount: 100,
          calories: 0,
          proteins: 0,
          carbs: 0,
          lipids: 0,
          sugars: 0,
          fiber: 0,
          sodium: 0,
          tags: [],
          isPublic: false,
          isDraft: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "No se pudo crear el alimento borrador.",
        );
      }

      const createdIngredient = await response.json();
      const newItem = mapIngredientToMarketPrice(
        createdIngredient,
        activeGroupForAddition || "Varios",
      );

      setManualAdditions((prev) => [...prev, newItem]);
      setFoodStatus((prev) => ({
        ...prev,
        [newItem.producto]: "added" as const,
      }));
      toast.success(`"${newItem.producto}" creado como borrador.`);
      setIsAddFoodModalOpen(false);
      setFoodSearchQuery("");
      setSearchResultFoods([]);
    } catch (error: any) {
      console.error("Error creating draft ingredient", error);
      toast.error(
        error?.message || "No se pudo crear el alimento manual.",
      );
    } finally {
      setIsCreatingManualFood(false);
    }
  };

  const openDraftFoodEditor = (food: MarketPrice) => {
    setDraftFoodToEdit(food);
    setDraftFoodValues({
      amount: 100,
      unit: food.unidad || "g",
      calories: Number(food.calorias || 0),
      proteins: Number(food.proteinas || 0),
      carbs: Number(food.carbohidratos || 0),
      lipids: Number(food.lipidos || 0),
      azucares: Number(food.azucares || 0),
      fibra: Number(food.fibra || 0),
      sodio: Number(food.sodio || 0),
    });
    setIsDraftFoodEditorOpen(true);
  };

  const handleSaveDraftFood = async () => {
    if (!draftFoodToEdit?.id) return;

    setIsSavingDraftFood(true);
    try {
      const response = await fetchApi(`/foods/${draftFoodToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(draftFoodValues.amount || 0),
          unit: draftFoodValues.unit || "g",
          calories: Number(draftFoodValues.calories || 0),
          proteins: Number(draftFoodValues.proteins || 0),
          carbs: Number(draftFoodValues.carbs || 0),
          lipids: Number(draftFoodValues.lipids || 0),
          sugars: Number(draftFoodValues.azucares || 0),
          fiber: Number(draftFoodValues.fibra || 0),
          sodium: Number(draftFoodValues.sodio || 0),
          isDraft: false,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el alimento.");
      }

      const updatedIngredient = await response.json();
      const updatedFood = mapIngredientToMarketPrice(
        updatedIngredient,
        draftFoodToEdit.grupo,
      );

      setManualAdditions((prev) =>
        prev.map((food) =>
          food.id === draftFoodToEdit.id ? { ...food, ...updatedFood } : food,
        ),
      );
      setIsDraftFoodEditorOpen(false);
      setDraftFoodToEdit(null);
      toast.success("Alimento completado correctamente.");
    } catch (error: any) {
      console.error("Error updating draft ingredient", error);
      toast.error(
        error?.message ||
          "No se pudo guardar la información nutricional del alimento.",
      );
    } finally {
      setIsSavingDraftFood(false);
    }
  };

  const handleCreateGroup = () => {
    const name = newGroupNameInput.trim();
    if (!name) return toast.error("Nombre vacío.");
    if (Object.keys(allGroupsToRender).includes(name))
      return toast.error("Grupo duplicado.");
    setCustomGroups((prev) => [...prev, name]);
    setNewGroupNameInput("");
    setIsAddGroupModalOpen(false);
    toast.success(`Grupo "${name}" creado.`);
  };

  const showPreferenceChangeToasts = (
    title: string,
    items: string[],
    variant: "success" | "info" = "info",
  ) => {
    if (items.length === 0) return;

    const chunks: string[][] = [];
    for (let index = 0; index < items.length; index += 5) {
      chunks.push(items.slice(index, index + 5));
    }

    chunks.forEach((chunk, chunkIndex) => {
      const toastTitle =
        chunks.length > 1 ? `${title} (${chunkIndex + 1}/${chunks.length})` : title;

      toast[variant](toastTitle, {
        description: chunk.join(", "),
        duration: 5000,
      });
    });
  };

  const applyNutritionistPreferences = async () => {
    setIsApplyingPreferences(true);
    try {
      const normalizeName = (value: string) => value.toLowerCase().trim();
      const response = await fetchApi(`/foods?limit=1000`,);

      if (!response.ok) {
        toast.error("Error al cargar preferencias.");
        return;
      }

      const allFoods = await response.json();
      const favorites = allFoods.filter(
        (food: any) => food.preferences?.[0]?.isFavorite,
      );
      const notRecommended = allFoods
        .filter((food: any) => food.preferences?.[0]?.isNotRecommended)
        .map((food: any) => food.name);

      const currentFoodStatus = { ...foodStatus };
      const nextFoodStatus = { ...foodStatus };
      const nextManualAdditions = [...manualAdditions];

      const initialByName = new Map(
        initialFoods.map((food) => [normalizeName(food.producto), food]),
      );
      const manualByName = new Map(
        manualAdditions.map((food) => [normalizeName(food.producto), food]),
      );
      const existingNames = new Set([
        ...initialFoods.map((food) => normalizeName(food.producto)),
        ...manualAdditions.map((food) => normalizeName(food.producto)),
      ]);
      const notRecommendedSet = new Set(
        notRecommended.map((name: string) => normalizeName(name)),
      );

      const removedFoods: string[] = [];
      const addedFoods: string[] = [];
      const favoritedFoods: string[] = [];

      notRecommended.forEach((name: string) => {
        const normalizedName = normalizeName(name);
        const baseMatch = initialByName.get(normalizedName);
        const manualMatch = manualByName.get(normalizedName);
        const targetName = baseMatch?.producto || manualMatch?.producto;

        if (!targetName) return;

        if (nextFoodStatus[targetName] !== "removed") {
          nextFoodStatus[targetName] = "removed";
          removedFoods.push(targetName);
        }
      });

      favorites.forEach((favorite: any) => {
        const normalizedName = normalizeName(favorite.name);

        if (notRecommendedSet.has(normalizedName)) {
          return;
        }

        const baseMatch = initialByName.get(normalizedName);
        const manualMatch = manualByName.get(normalizedName);

        if (baseMatch) {
          if (currentFoodStatus[baseMatch.producto] !== "favorite") {
            favoritedFoods.push(baseMatch.producto);
          }
          nextFoodStatus[baseMatch.producto] = "favorite";
          return;
        }

        if (manualMatch) {
          if (currentFoodStatus[manualMatch.producto] !== "favorite") {
            favoritedFoods.push(manualMatch.producto);
          }
          nextFoodStatus[manualMatch.producto] = "favorite";
          return;
        }

        if (existingNames.has(normalizedName)) {
          return;
        }

        const newFavorite = {
          id: favorite.id,
          producto: favorite.name,
          grupo: favorite.category?.name || "Varios",
          calorias: favorite.calories || 0,
          proteinas: favorite.proteins || 0,
          carbohidratos: favorite.carbs || 0,
          lipidos: favorite.lipids || 0,
          unidad: favorite.unit || "g",
          precioPromedio: favorite.price || 0,
          tags: favorite.tags?.map((tag: any) => tag.name) || [],
        };

        nextManualAdditions.push(newFavorite);
        existingNames.add(normalizedName);
        nextFoodStatus[newFavorite.producto] = "favorite";
        addedFoods.push(newFavorite.producto);
      });

      setFoodStatus(nextFoodStatus);
      setManualAdditions(nextManualAdditions);
      saveDraft({
        foodStatus: nextFoodStatus,
        manualAdditions: nextManualAdditions,
      });

      const uniqueAddedFoods = Array.from(new Set(addedFoods));
      const uniqueRemovedFoods = Array.from(new Set(removedFoods));
      const uniqueFavoritedFoods = Array.from(
        new Set(
          favoritedFoods.filter(
            (foodName) => !uniqueAddedFoods.includes(foodName),
          ),
        ),
      );

      if (
        uniqueAddedFoods.length === 0 &&
        uniqueRemovedFoods.length === 0 &&
        uniqueFavoritedFoods.length === 0
      ) {
        toast.success("Preferencias aplicadas", {
          description: "No hubo cambios visibles en los ingredientes actuales.",
        });
      } else {
        toast.success("Preferencias aplicadas ⭐️", {
          description: `Agregados: ${uniqueAddedFoods.length} · Favoritos: ${uniqueFavoritedFoods.length} · Eliminados: ${uniqueRemovedFoods.length}`,
        });
        showPreferenceChangeToasts(
          "Ingredientes agregados",
          uniqueAddedFoods,
          "success",
        );
        showPreferenceChangeToasts(
          "Ingredientes marcados como favoritos",
          uniqueFavoritedFoods,
          "success",
        );
        showPreferenceChangeToasts(
          "Ingredientes eliminados",
          uniqueRemovedFoods,
          "info",
        );
      }
    } catch {
      toast.error("Error al cargar preferencias.");
    } finally {
      setIsApplyingPreferences(false);
    }
  };

  const fetchSmartAddData = async () => {
    setIsLoadingSmart(true);
    try {
      const [favoritesRes, myProductsRes, groupsRes] = await Promise.all([
        fetchApi(`/foods?tab=favorites&limit=1000`),
        fetchApi(`/foods?tab=mine&limit=1000`),
        fetchApi(`/ingredient-groups`),
      ]);

      if (favoritesRes.ok) {
        const favorites = await favoritesRes.json();
        setSmartFavorites(favorites);
      } else {
        setSmartFavorites([]);
      }

      if (myProductsRes.ok) {
        const myProducts = await myProductsRes.json();
        setSmartMyProducts(myProducts);
      } else {
        setSmartMyProducts([]);
      }

      if (groupsRes.ok) {
        const groups = await groupsRes.json();
        setSmartGroups(groups);
      } else {
        setSmartGroups([]);
      }
    } catch {
      toast.error("Error al cargar datos para adición inteligente");
    } finally {
      setIsLoadingSmart(false);
    }
  };

  const toggleSmartSelection = (id: string) => {
    setSelectedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroupSelection = (groupId: string) => {
    const group = smartGroups.find((g) => g.id === groupId);
    if (!group || !group.ingredients) return;

    const ingredientIds = group.ingredients
      .filter((rel: any) => rel.ingredient)
      .map((rel: any) => (rel.ingredient as any).id as string);

    setSelectedFoods((prev) => {
      const next = new Set(prev);
      const allSelected = ingredientIds.every((id: string) => next.has(id));

      if (allSelected) {
        ingredientIds.forEach((id: string) => next.delete(id));
      } else {
        ingredientIds.forEach((id: string) => next.add(id));
      }
      return next;
    });
  };

  const openSmartModal = () => {
    setIsSmartModalOpen(true);
    setSmartSearchQuery("");
    setSmartSearchResults([]);
    fetchSmartAddData();
  };

  const handleSmartAddAll = () => {
    const foodsToAdd: any[] = [];
    const selectedIds = Array.from(selectedFoods);

    selectedIds.forEach((id: string) => {
      let found = smartFavorites.find((f) => f.id === id);
      if (!found) {
        smartGroups.forEach((g) => {
          const groupFood = g.ingredients?.find(
              (rel: any) => rel.ingredient?.id === id,
          );
          if (groupFood) found = groupFood.ingredient;
        });
      }

      if (!found) {
        found = smartSearchResults.find((f) => f.id === id);
      }

      if (!found) {
        found = smartMyProducts.find((f) => f.id === id);
      }

      if (found) {
        foodsToAdd.push({
          producto: found.name,
          grupo: found.category?.name || "Varios",
          calorias: found.calories || 0,
          proteinas: found.proteins || 0,
          carbohidratos: found.carbs || 0,
          lipidos: found.lipids || 0,
          unidad: found.unit || "g",
          precioPromedio: found.price || 0,
          id: found.id || `smart-${Date.now()}-${Math.random()}`,
        });
      }
    });

    if (foodsToAdd.length === 0) {
      toast.error("No hay alimentos seleccionados");
      return;
    }

    const nextStatus = { ...foodStatus };
    foodsToAdd.forEach((f) => {
      nextStatus[f.producto] = "added";
    });
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });

    setManualAdditions((prev) => {
      const existingNames = new Set([
        ...initialFoods.map((f) => f.producto.toLowerCase().trim()),
        ...prev.map((ma) => ma.producto.toLowerCase().trim()),
      ]);

      const actuallyNew = foodsToAdd.filter(
        (f) => !existingNames.has(f.producto.toLowerCase().trim()),
      );
      return [...prev, ...actuallyNew];
    });

    const groupedSummary = Array.from(
      new Set(
        foodsToAdd
          .map((food) => food.grupo || "Varios")
          .filter(Boolean),
      ),
    );

    toast.success(`${foodsToAdd.length} alimentos añadidos a la dieta`, {
      description:
        groupedSummary.length > 0
          ? `Se ubicaron automáticamente en: ${groupedSummary.join(", ")}.`
          : "Se ubicaron automáticamente en sus secciones.",
    });
    setIsSmartModalOpen(false);
    setSelectedFoods(new Set());
  };

  return {
    dietName,
    setDietName,
    dietTags,
    setDietTags,
    planObjective,
    setPlanObjective,
    showPlanObjectiveInPdf,
    setShowPlanObjectiveInPdf,
    activeConstraints,
    setActiveConstraints,
    macroSettings,
    setMacroSettings,
    macroTargets,
    foodStatus,
    setFoodStatus,
    manualAdditions,
    setManualAdditions,
    showInfoModal,
    setShowInfoModal,
    showSupplementsDrawer,
    setShowSupplementsDrawer,
    selectedPatient,
    setSelectedPatient,
    customConstraints,
    setCustomConstraints,
    newConstraintLabel,
    setNewConstraintLabel,
    customGroups,
    setCustomGroups,
    isDeleteGroupConfirmOpen,
    setIsDeleteGroupConfirmOpen,
    groupToDelete,
    setGroupToDelete,
    isAddFoodModalOpen,
    setIsAddFoodModalOpen,
    activeGroupForAddition,
    setActiveGroupForAddition,
    foodSearchQuery,
    setFoodSearchQuery,
    isAddGroupModalOpen,
    setIsAddGroupModalOpen,
    newGroupNameInput,
    setNewGroupNameInput,
    searchResultFoods,
    setSearchResultFoods,
    isSearchingFoods,
    setIsSearchingFoods,
    isCreatingManualFood,
    setIsCreatingManualFood,
    isApplyingPreferences,
    setIsApplyingPreferences,
    isExportingPdf,
    setIsExportingPdf,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    isExportConfirmOpen,
    setIsExportConfirmOpen,
    isSaveCreationModalOpen,
    setIsSaveCreationModalOpen,
    creationDescription,
    setCreationDescription,
    isDraftFoodEditorOpen,
    setIsDraftFoodEditorOpen,
    draftFoodToEdit,
    setDraftFoodToEdit,
    draftFoodValues,
    setDraftFoodValues,
    isSavingDraftFood,
    setIsSavingDraftFood,
    isContinueDraftWarningOpen,
    setIsContinueDraftWarningOpen,

    // Smart Add State
    isSmartModalOpen,
    setIsSmartModalOpen,
    smartAddTab,
    setSmartAddTab,
    smartFavorites,
    setSmartFavorites,
    smartGroups,
    setSmartGroups,
    smartMyProducts,
    setSmartMyProducts,
    smartSearchQuery,
    setSmartSearchQuery,
    smartSearchResults,
    setSmartSearchResults,
    isSearchingInSmart,
    setIsSearchingInSmart,
    selectedFoods,
    setSelectedFoods,
    isLoadingSmart,
    setIsLoadingSmart,
    smartInfoFood,
    setSmartInfoFood,

    // Naty IA Dish Generation State
    isGeneratingAiDishes,
    setIsGeneratingAiDishes,
    pendingAiDishes,
    setPendingAiDishes,
    isAiValidationModalOpen,
    setIsAiValidationModalOpen,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,

    // Step 3 / Step 4 & Draft State
    currentStep,
    setCurrentStep,
    meals,
    setMeals,
    dietMealsTableData,
    setDietMealsTableData,
    includeMealsSection,
    setIncludeMealsSection,
    includeExchangeGuideInPdf,
    setIncludeExchangeGuideInPdf,
    includeCartSection,
    setIncludeCartSection,
    includeFoodTableSection,
    setIncludeFoodTableSection,
    includeResourcesSection,
    setIncludeResourcesSection,
    selectedResourceIds,
    setSelectedResourceIds,
    autoCartItems,
    cartItemOverrides,
    setCartItemOverride,
    removeCartItem,

    // Alimentos a evitar
    avoidFoods,
    addAvoidFood,
    removeAvoidFood,
    includeAvoidFoodsInPdf,
    setIncludeAvoidFoodsInPdf,

    // Introducción y despedida
    introMessage,
    updateIntroMessage,
    includeIntroInPdf,
    setIncludeIntroInPdf,
    closingMessage,
    updateClosingMessage,
    includeClosingInPdf,
    setIncludeClosingInPdf,

    handleQuickGenerateAiDishes,
    handleConfirmAiDishes,

    // Food Info Modal State
    isFoodInfoModalOpen,
    setIsFoodInfoModalOpen,
    selectedFoodForInfo,
    setSelectedFoodForInfo,

    // Import Creation Modal State
    isImportCreationModalOpen,
    setIsImportCreationModalOpen,
    isVerifyingRestrictions,
    setIsVerifyingRestrictions,
    verificationResult,
    setVerificationResult,
    isVerificationModalOpen,
    setIsVerificationModalOpen,
    isLoadingDiets,
    setIsLoadingDiets,
    availableTags,
    setAvailableTags,
    pendingTagCreation,
    setPendingTagCreation,
    dietSearchQuery,
    setDietSearchQuery,

    // Import Patient Modal State
    isImportPatientModalOpen,
    setIsImportPatientModalOpen,
    patients,
    setPatients,
    filteredPatients,
    isLoadingPatients,
    setIsLoadingPatients,
    patientsError,
    setPatientsError,
    patientSearchQuery,
    setPatientSearchQuery,
    currentProjectId,
    setCurrentProjectId,
    isProjectLoading,
    setIsProjectLoading,
    currentProjectName,
    setCurrentProjectName,
    currentProjectMode,
    setCurrentProjectMode,
    editingCreationId,
    setEditingCreationId,
    isHydrating,
    flowMode,

    isSidebarCollapsed,
    favoritesEnabled,
    availableClassificationTags,
    availableConstraintTags,
    selectedDefaultConstraintIds,
    includedFoods,
    draftFoodsPendingCompletion,
    allGroupsToRender,
    hasIngredientInteraction,

    // Actions
    fetchAvailableTags,
    createGlobalTag,
    buildDietCreationPayload,
    saveDraft,
    ensureProjectForWorkflow,
    applySelectedPatient,
    fetchPatients,
    handleSelectPatient,
    handleUnlinkPatient,
    handleImportCreation,
    toggleConstraint,
    removeFood,
    toggleFavorite,
    handleSave,
    handleSaveWithDescription,
    performExportPdf,
    handleExportPdf,
    handleVerifyRestrictions,
    continueToRecipes,
    handleContinue,
    confirmDeleteGroup,
    resetDiet,
    applyBaseFoods,
    applyNutritionistPreferences,
    handlePatientLoad,
    initialFoods: fullCatalogFoods,
    addFoodToGroup,
    handleCreateGroupByName,
    openAddModal,
    handleAddFromSearch,
    handleCreateManualFood,
    openDraftFoodEditor,
    handleSaveDraftFood,
    handleCreateGroup,
    openSmartModal,
    handleSmartAddAll,
    toggleSmartSelection,
    toggleGroupSelection,
  };
}
