import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { MarketPrice } from "@/features/foods";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { fetchApi } from "@/lib/api-base";
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

interface UseDietStateProps {
  initialFoods: MarketPrice[];
}

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
      ? Math.max(0, Math.round(baseCalories * (1 - adjustmentValue / 100)))
      : Math.max(0, Math.round(baseCalories + adjustmentValue));
  const macroPercents = getMacroPctFromGrams(calories, protein, carbs, fats);

  return {
    calories,
    protein,
    carbs,
    fats,
    proteinPercent: macroPercents.proteinPercent,
    carbsPercent: macroPercents.carbsPercent,
    fatsPercent: macroPercents.fatsPercent,
    baseCalories,
    calorieAdjustment: Number(settings.calorieAdjustment) || 0,
    referenceWeightKg,
  };
};

export function useDietState({ initialFoods }: UseDietStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");

  // -- State --
  const [dietName, setDietName] = useState("");
  const [dietTags, setDietTags] = useState<string[]>([]);
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

  const { isSidebarCollapsed } = useDashboardShell();

  const favoritesEnabled = true;

  const getAuthToken = () =>
    Cookies.get("auth_token") || localStorage.getItem("auth_token") || "";

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
      const token = getAuthToken();
      const response = await fetchApi(`/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = getAuthToken();
      const response = await fetchApi(`/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      },
      metadata: {
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
          : {}),
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
    if (normalizedPatient.weight) {
      setMacroSettings((prev) => ({
        ...prev,
        referenceWeightKg: normalizedPatient.weight || prev.referenceWeightKg,
      }));
    }

    const restrictions = Array.isArray(normalizedPatient.dietRestrictions)
      ? normalizedPatient.dietRestrictions
      : [];
    const validRestrictions = normalizeConstraintList(restrictions);
    const newConstraints = Array.from(
      new Set([...activeConstraints, ...validRestrictions]),
    );

    setActiveConstraints(newConstraints);
    if (patient.weight) {
      setMacroSettings((prev) => ({
        ...prev,
        referenceWeightKg: patient.weight || prev.referenceWeightKg,
      }));
    }

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

    if (!draft.diet) draft.diet = {};
    draft.diet.activeConstraints = newConstraints;
    draft.diet.macroSettings = {
      ...macroSettings,
      referenceWeightKg:
        normalizedPatient.weight || macroSettings.referenceWeightKg,
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

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
    const newConstraints = Array.from(
      new Set([...activeConstraints, ...validRestrictions]),
    );

    setActiveConstraints(newConstraints);

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

    if (!draft.diet) draft.diet = {};
    draft.diet.activeConstraints = newConstraints;
    draft.diet.macroSettings = {
      ...macroSettings,
      referenceWeightKg: patient.weight || macroSettings.referenceWeightKg,
    };

    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

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

      if (type === "DIET") {
        setEditingCreationId(creation.id);
        setDietName(creation.name || "");
        setDietTags(creation.tags || []);
        setActiveConstraints(content.activeConstraints || []);
        setMacroSettings(content.macroSettings || createDefaultMacroSettings());
        setManualAdditions(content.manualAdditions || content.foods || []);
        setCustomGroups(content.customGroups || []);
        setCustomConstraints(content.customConstraints || []);

        if (content.foodStatus) {
          setFoodStatus((prev) => ({ ...prev, ...content.foodStatus }));
        }

        if (!content.foodStatus && content.categories) {
          const recoveredManual: any[] = [];
          const recoveredGroups: string[] = [];
          const recoveredStatus: Record<string, any> = {};

          Object.entries(content.categories).forEach(([groupName, foods]: [string, any]) => {
            recoveredGroups.push(groupName);
            if (Array.isArray(foods)) {
              foods.forEach((f) => {
                recoveredManual.push({ ...f, grupo: groupName });
                recoveredStatus[f.producto] = "added";
              });
            }
          });

          if (recoveredManual.length > 0) setManualAdditions(recoveredManual);
          if (recoveredGroups.length > 0) setCustomGroups(recoveredGroups);
          setFoodStatus((prev) => ({ ...prev, ...recoveredStatus }));
        }
        toast.success(`Dieta "${creation.name}" importada.`);
      } else if (type === "SHOPPING_LIST") {
        if (content.items && Array.isArray(content.items)) {
          const newAdditions = content.items.map((item: any) => ({
            id: item.id,
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
      statuses[f.producto] = "base";
    });

    if (projectIdFromUrl) {
      setFoodStatus(statuses);
      return;
    }

    const loadFromBackend = async (id: string, retries = 3) => {
      if (!id || id === "undefined" || id === "null") {
        localStorage.removeItem("currentDietEditId");
        return;
      }

      try {
        const token =
          Cookies.get("auth_token") || localStorage.getItem("auth_token");
        const response = await fetchApi(`/creations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const text = await response.text();
          if (!text) {
            console.warn(
              "La respuesta del servidor está vacía para el ID:",
              id,
            );
            localStorage.removeItem("currentDietEditId");
            return;
          }

          try {
            const data = JSON.parse(text);
            handleImportCreation(data);
          } catch (parseError) {
            console.error("Error parseando JSON de la creación:", parseError);
          }
        } else if (response.status === 404) {
          localStorage.removeItem("currentDietEditId");
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
        }
      } finally {
        if (retries === 0) localStorage.removeItem("currentDietEditId");
      }
    };

    const editId = localStorage.getItem("currentDietEditId");
    if (editId) {
      loadFromBackend(editId);
      return;
    }

    const savedDraft = sessionStorage.getItem(getUserDraftKey());
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setDietName(draft.dietName || "");
        setDietTags(draft.dietTags || []);
        setActiveConstraints(draft.activeConstraints || []);
        setMacroSettings(draft.macroSettings || createDefaultMacroSettings());
        setManualAdditions(draft.manualAdditions || []);
        setCustomGroups(draft.customGroups || []);
        setCustomConstraints(draft.customConstraints || []);
        setFoodStatus({ ...statuses, ...draft.foodStatus });
        return;
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
    setFoodStatus(statuses);
  }, [initialFoods, projectIdFromUrl]);

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

      if (!status || status === "base" || status === "favorite" || status === "added") {
        if (!status || status === "base") {
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
        }
        return true;
      }
      return false;
    });
  }, [initialFoods, manualAdditions, foodStatus, activeConstraints]);

  const saveDraft = (overrides: any = {}) => {
    try {
      const currentDraftKey = getUserDraftKey();
      const draft = {
        dietName:
          overrides.dietName !== undefined ? overrides.dietName : dietName,
        dietTags:
          overrides.dietTags !== undefined ? overrides.dietTags : dietTags,
        activeConstraints:
          overrides.activeConstraints !== undefined
            ? overrides.activeConstraints
            : activeConstraints,
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
        favoritesEnabled,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(currentDraftKey, JSON.stringify(draft));
    } catch (e) {
      console.error("Error saving draft", e);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveDraft();
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dietName,
    dietTags,
    activeConstraints,
    customGroups,
    customConstraints,
    macroSettings,
    manualAdditions,
    foodStatus,
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

    const token = getAuthToken();
    if (token) {
      try {
        let targetId = food.id;

        if (food.id && food.id.startsWith("base-")) {
          const res = await fetchApi(
            `/foods?search=${encodeURIComponent(productName)}&limit=1`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
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
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isFavorite: !isCurrentlyFavorite }),
          });
        }
      } catch (e) {
        console.error("Error toggling favorite", e);
      }
    }
  };

  const handleSave = async () => {
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
      fetchAvailableTags();
    } catch (error: any) {
      console.error("Error saving creation:", error);
      toast.error(
        error.message || "No se pudo guardar la creación en la base de datos.",
      );
    }
  };

  const handleSaveWithDescription = async () => {
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
    if (!includedFoods.length) {
      toast.error("No hay alimentos en la dieta para exportar.");
      return;
    }
    if (!dietName.trim()) {
      toast.error("Asigna un nombre a la dieta antes de exportar.");
      return;
    }
    setIsExportingPdf(true);
    const toastId = toast.loading("Generando PDF...");
    try {
      const { downloadDietPdf } = await import("@/features/pdf/pdfExport");
      await downloadDietPdf({
        dietName,
        dietTags,
        activeConstraints,
        patientName: selectedPatient?.fullName,
        foods: includedFoods.map((f) => ({
          producto: f.producto,
          grupo: f.grupo,
          unidad: f.unidad,
          calorias: f.calorias,
          proteinas: f.proteinas,
          lipidos: f.lipidos,
          carbohidratos: f.carbohidratos,
          precioPromedio: f.precioPromedio,
          status: (foodStatus[f.producto] as any) ?? "base",
        })),
      });
      toast.success("PDF exportado correctamente.", { id: toastId });
      setIsSaveCreationModalOpen(true);
    } catch (e) {
      console.error("Error generando PDF:", e);
      toast.error("Error al generar el PDF. Intenta de nuevo.", { id: toastId });
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
      toast.success(`Grupo ${groupToDelete} eliminado.`);
      setIsDeleteGroupConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const allGroupsToRender = useMemo(() => {
    const renderedGroups: Record<string, MarketPrice[]> = {};
    includedFoods.forEach((f) => {
      if (!renderedGroups[f.grupo]) renderedGroups[f.grupo] = [];
      renderedGroups[f.grupo].push(f);
    });
    customGroups.forEach((g) => {
      if (!renderedGroups[g]) renderedGroups[g] = [];
    });
    const finalGroups: Record<string, MarketPrice[]> = {};
    Object.entries(renderedGroups).forEach(([name, foods]) => {
      if (foods.length > 0 || customGroups.includes(name))
        finalGroups[name] = foods;
    });
    return finalGroups;
  }, [includedFoods, customGroups]);

  useEffect(() => {
    if (!isAddFoodModalOpen || !foodSearchQuery.trim()) {
      setSearchResultFoods([]);
      setIsSearchingFoods(false);
      return;
    }

    const fetchFoods = async () => {
      setIsSearchingFoods(true);
      const token = Cookies.get("auth_token");
      try {
        const res = await fetchApi(
          `/foods?search=${foodSearchQuery}&limit=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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
      const token = Cookies.get("auth_token");
      try {
        const res = await fetchApi(
          `/foods?search=${smartSearchQuery}&limit=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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
    const nextStatus: Record<string, "base"> = {};
    initialFoods.forEach((food) => {
      nextStatus[food.producto] = "base";
    });
    return nextStatus;
  };

  const clearDietDraftStorage = () => {
    sessionStorage.removeItem(getUserDraftKey());
    localStorage.removeItem("nutri_patient");

    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        delete draft.diet;
        delete draft.patientMeta;

        if (Object.keys(draft).length === 0) {
          localStorage.removeItem("nutri_active_draft");
        } else {
          localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        }
      } catch {
        localStorage.removeItem("nutri_active_draft");
      }
    }

    sessionStorage.removeItem("nutri_diet_draft_decided");
    sessionStorage.removeItem("nutri_cart_draft_decided");
  };

  const resetDietState = () => {
    setDietName("");
    setDietTags([]);
    setActiveConstraints([]);
    setMacroSettings(createDefaultMacroSettings());
    setFoodStatus(createBaseFoodStatus() as any);
    setManualAdditions([]);
    setCustomGroups([]);
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
    const nextStatus = { ...foodStatus, [food.producto]: "added" as const };
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });
    const isInInitial = initialFoods.some((f) => f.producto === food.producto);
    const alreadyInManual = manualAdditions.some(
      (ma) =>
        ma.producto === food.producto && ma.grupo === activeGroupForAddition,
    );

    if (!isInInitial && !alreadyInManual) {
      setManualAdditions((prev) => [
        ...prev,
        { ...food, grupo: activeGroupForAddition!, id: `search-${Date.now()}` },
      ]);
    } else if (isInInitial) {
      const baseFood = initialFoods.find((f) => f.producto === food.producto);
      if (baseFood && baseFood.grupo !== activeGroupForAddition) {
        setManualAdditions((prev) => [
          ...prev,
          {
            ...food,
            grupo: activeGroupForAddition!,
            id: `override-${Date.now()}`,
          },
        ]);
      }
    }
    toast.success(`${food.producto} añadido.`);
    setIsAddFoodModalOpen(false);
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
    const token = getAuthToken();
    try {
      const normalizeName = (value: string) => value.toLowerCase().trim();
      const response = await fetchApi(`/foods?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    const token = getAuthToken();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [favoritesRes, myProductsRes, groupsRes] = await Promise.all([
        fetchApi(`/foods?tab=favorites&limit=1000`, { headers }),
        fetchApi(`/foods?tab=mine&limit=1000`, { headers }),
        fetchApi(`/ingredient-groups`, { headers }),
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
    applyNutritionistPreferences,
    handlePatientLoad,
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
