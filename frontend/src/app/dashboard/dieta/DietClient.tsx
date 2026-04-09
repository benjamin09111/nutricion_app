"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import {
  Search,
  Loader2,
  Filter,
  Star,
  Heart,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Info,
  BookOpen,
  Library,
  Pencil,
  Trash2,
  FolderPlus,
  GraduationCap,
  ArrowRight,
  X,
  Brain,
  CheckCircle2,
  Calendar,
  User,
  Tag as TagIcon,
  ListChecks,
  Check,
  UserPlus,
  RotateCcw,
  FileCode,
  Download,
} from "lucide-react";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { MarketPrice, FoodGroup } from "@/features/foods";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCLP } from "@/lib/utils/currency";
import Cookies from "js-cookie";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import {
  buildProjectAwarePath,
  createProject,
  fetchCreation,
  fetchProject,
  saveCreation,
  updateProject,
} from "@/lib/workflow";
import { fetchApi } from "@/lib/api-base";

interface DietClientProps {
  initialFoods: MarketPrice[];
}

interface RestrictionConflict {
  foodId: string;
  foodName: string;
  restriction: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

interface DietVerificationResult {
  ok: boolean;
  source: "openai" | "heuristic";
  checkedFoods: number;
  checkedRestrictions: number;
  conflicts: RestrictionConflict[];
  safeFoods: string[];
  summary: string;
}

interface DietPatient {
  id?: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  dietRestrictions?: string[];
  clinicalSummary?: string | null;
  customVariables?: unknown;
  fitnessGoals?: string | null;
  nutritionalFocus?: string | null;
  status?: string | null;
  tags?: string[];
  consultations?: any[];
  exams?: any[];
  [key: string]: unknown;
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (Array.isArray(parsedValue)) {
        return parsedValue
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch (_) { }

    return trimmedValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizePatient = (patient: any): DietPatient => ({
  ...patient,
  fullName: patient?.fullName || "Paciente sin nombre",
  dietRestrictions: normalizeStringArray(patient?.dietRestrictions),
  tags: normalizeStringArray(patient?.tags),
});

const extractPatients = (payload: any): DietPatient[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizePatient);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.map(normalizePatient);
  }

  return [];
};

const normalizeConstraintText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const DEFAULT_CONSTRAINT_ALIASES = new Map(
  DEFAULT_CONSTRAINTS.flatMap((constraint) => {
    const normalizedId = normalizeConstraintText(constraint.id);
    const aliases = [normalizedId];

    if (normalizedId === "sin gluten") aliases.push("gluten");
    if (normalizedId === "celiaco") aliases.push("celiaco", "celiaca");
    if (normalizedId === "diabetico") aliases.push("diabetico", "diabetica");
    if (normalizedId === "hipertension") aliases.push("hipertension");
    if (normalizedId === "vegetariano") aliases.push("vegetariano", "vegetariana");

    return aliases.map((alias) => [alias, constraint.id] as const);
  }),
);

const normalizeConstraintList = (constraints: string[]) =>
  Array.from(
    new Set(
      constraints
        .filter((constraint): constraint is string => typeof constraint === "string")
        .map((constraint) => constraint.trim())
        .filter(Boolean)
        .map((constraint) => {
          const normalized = normalizeConstraintText(constraint);
          return DEFAULT_CONSTRAINT_ALIASES.get(normalized) || constraint.trim();
        }),
    ),
  );

const normalizeGroupName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const mapIngredientToMarketPrice = (
  ingredient: any,
  overrideGroup?: string,
): MarketPrice => ({
  id: ingredient.id,
  producto: ingredient.name,
  grupo: overrideGroup || ingredient.category?.name || "Varios",
  unidad: ingredient.unit || "g",
  precioPromedio: ingredient.price || 0,
  calorias: ingredient.calories || 0,
  proteinas: ingredient.proteins || 0,
  carbohidratos: ingredient.carbs || 0,
  lipidos: ingredient.lipids || 0,
  azucares: ingredient.sugars || 0,
  fibra: ingredient.fiber || 0,
  sodio: ingredient.sodium || 0,
  tags: ingredient.tags?.map((tag: any) => tag.name) || [],
  isDraft: !!ingredient.isDraft,
});

const getUserDraftKey = () => {
  if (typeof window === "undefined") return "nutrisaas_diet_draft";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) return `nutrisaas_diet_draft_${user.id}`;
    }
  } catch (e) { }
  return "nutrisaas_diet_draft";
};

export default function DietClient({ initialFoods }: DietClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");

  // -- State --
  const [dietName, setDietName] = useState("");
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [activeConstraints, setActiveConstraints] = useState<string[]>([]);
  const [foodStatus, setFoodStatus] = useState<
    Record<string, "base" | "favorite" | "removed" | "added">
  >({});
  const [manualAdditions, setManualAdditions] = useState<MarketPrice[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSupplementsDrawer, setShowSupplementsDrawer] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
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

  const favoritesEnabled = true; // Always enabled by request
  const selectedDefaultConstraintIds = new Set(
    activeConstraints
      .map((constraint) => {
        const normalizedConstraint = normalizeConstraintText(constraint);
        return (
          DEFAULT_CONSTRAINT_ALIASES.get(normalizedConstraint) ?? constraint
        );
      })
      .filter((constraint) =>
        DEFAULT_CONSTRAINTS.some((item) => item.id === constraint),
      ),
  );

  useEffect(() => {
    setCurrentProjectId(projectIdFromUrl);
    setIsProjectLoading(Boolean(projectIdFromUrl));
  }, [projectIdFromUrl]);

  const getAuthToken = () =>
    Cookies.get("auth_token") || localStorage.getItem("auth_token") || "";

  const hasTagInList = (list: string[], tagName: string) =>
    list.some((tag) => tag.trim().toLowerCase() === tagName.trim().toLowerCase());

  const findNewlyAddedTag = (previousTags: string[], nextTags: string[]) =>
    nextTags.find((tag) => !hasTagInList(previousTags, tag));

  const availableClassificationTags = useMemo(
    () => availableTags.filter((tag) => tag.startsWith("#")),
    [availableTags],
  );

  const availableConstraintTags = useMemo(
    () => availableTags.filter((tag) => !tag.startsWith("#")),
    [availableTags],
  );

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
    } catch (e) {
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

  const buildDietCreationPayload = (description?: string) => {
    const finalizedFoods = [...includedFoods];

    return {
      name: dietName,
      type: "DIET" as const,
      content: {
        dietName,
        dietTags,
        activeConstraints,
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
        ...(description?.trim()
          ? { description: description.trim() }
          : {}),
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
    const token = getAuthToken();
    if (!token) {
      throw new Error("No se encontró una sesión activa.");
    }

    const response = await fetchApi(`/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
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

    const restrictions = Array.isArray(normalizedPatient.dietRestrictions)
      ? normalizedPatient.dietRestrictions
      : [];
    const validRestrictions = normalizeConstraintList(restrictions);
    const newConstraints = Array.from(
      new Set([...activeConstraints, ...validRestrictions]),
    );

    setActiveConstraints(newConstraints);

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
      updatedAt: new Date().toISOString(),
    };

    if (!draft.diet) draft.diet = {};
    draft.diet.activeConstraints = newConstraints;

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
      const token = getAuthToken();
      if (!token) {
        throw new Error("No se encontró una sesión activa.");
      }

      const queryParams = new URLSearchParams({
        page: "1",
        limit: "1000",
        ...(search.trim() && { search: search.trim() }),
      });

      const response = await fetchApi(`/patients?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
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

    // Sync restrictions automatically
    const restrictions = Array.isArray(patient.dietRestrictions)
      ? patient.dietRestrictions
      : [];
    const validRestrictions = normalizeConstraintList(restrictions);
    const newConstraints = Array.from(
      new Set([...activeConstraints, ...validRestrictions]),
    );

    setActiveConstraints(newConstraints);

    // Sync metadata to global draft
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
      updatedAt: new Date().toISOString(),
    };

    if (!draft.diet) draft.diet = {};
    draft.diet.activeConstraints = newConstraints;

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
      } catch (_) { }
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

      // Handle DIET import (full restoration)
      if (type === "DIET") {
        setDietName(creation.name || "");
        setDietTags(creation.tags || []);
        setActiveConstraints(content.activeConstraints || []);
        setManualAdditions(content.manualAdditions || content.foods || []);
        setCustomGroups(content.customGroups || []);
        setCustomConstraints(content.customConstraints || []);

        // Update food status mapping
        if (content.foodStatus) {
          setFoodStatus((prev) => ({ ...prev, ...content.foodStatus }));
        }

        // Backward compatibility for old formats
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
      }
      // Handle Cart (SHOPPING_LIST) import into Diet
      else if (type === "SHOPPING_LIST") {
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
            isManual: true
          }));

          setManualAdditions(prev => [...prev, ...newAdditions]);

          // Add groups if they don't exist
          const uniqueGroups = Array.from(new Set(newAdditions.map((a: any) => a.grupo)));
          setCustomGroups(prev => Array.from(new Set([...prev, ...uniqueGroups])) as string[]);

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
          setSelectedPatient(hydratedPatient);
          localStorage.setItem("nutri_patient", JSON.stringify(hydratedPatient));
        });
      } catch (e) {
        console.error("Failed to parse stored patient", e);
      }
    }

    fetchAvailableTags();
  }, []);

  // Original load logic wrapper
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
      } catch (e) {
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
            setSelectedPatient(hydratedPatient);
            localStorage.setItem(
              "nutri_patient",
              JSON.stringify(hydratedPatient),
            );
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
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (!isImportPatientModalOpen) return;

    const timer = setTimeout(() => {
      void fetchPatients(patientSearchQuery);
    }, patientSearchQuery ? 250 : 0);

    return () => clearTimeout(timer);
  }, [isImportPatientModalOpen, patientSearchQuery]);

  // Alimentos incluidos
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

      // If it's a manual addition, it's always included (unless removed above)
      if (manualAdditions.some((ma) => ma.producto === food.producto)) {
        return true;
      }

      // Base foods or favorites (including those without status yet)
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

  // Totales
  // Totales removidos por no tener sentido sin porciones

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
        favoritesEnabled,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(currentDraftKey, JSON.stringify(draft));
    } catch (e) {
      console.error("Error saving draft", e);
    }
  };

  // Auto-save draft on critical changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveDraft();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [
    dietName,
    dietTags,
    activeConstraints,
    customGroups,
    customConstraints,
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

    // 1. UI Local & Feedback Inmediato
    if (!isCurrentlyFavorite) {
      toast.success(`${productName} guardado en favoritos ✨`);
    } else {
      toast.info(`${productName} eliminado de favoritos`);
    }

    const nextStatus: Record<
      string,
      "base" | "favorite" | "removed" | "added"
    > = { ...foodStatus, [productName]: newStatus };
    setFoodStatus(nextStatus);
    saveDraft({ foodStatus: nextStatus });

    // 2. Persistencia Backend (En segundo plano)
    const token = Cookies.get("auth_token");
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

  const hasIngredientInteraction =
    manualAdditions.length > 0 ||
    Object.values(foodStatus).some((status) => status !== "base");

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

    if (activeConstraints.length === 0) {
      toast.error("Primero agrega al menos una restricción.");
      return;
    }
    if (includedFoods.length === 0) {
      toast.error("No hay alimentos en la dieta para verificar.");
      return;
    }

    const validFoodIds = includedFoods
      .map((food) => food.id)
      .filter(
        (foodId) =>
          !!foodId &&
          !foodId.startsWith("base-") &&
          !foodId.startsWith("search-") &&
          !foodId.startsWith("manual-") &&
          !foodId.startsWith("override-"),
      );

    if (validFoodIds.length === 0) {
      toast.error(
        "Los alimentos actuales no tienen IDs válidos para validación automática.",
      );
      return;
    }

    setIsVerifyingRestrictions(true);
    const toastId = toast.loading("Verificando compatibilidad con restricciones...");
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/diet/verify-foods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restrictions: activeConstraints,
          foodIds: validFoodIds,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo validar restricciones con IA.");
      }

      const result = (await response.json()) as DietVerificationResult;
      setVerificationResult(result);
      setIsVerificationModalOpen(true);

      if (result.conflicts.length > 0) {
        toast.warning(`Se detectaron ${result.conflicts.length} posibles conflictos.`, {
          id: toastId,
        });
      } else {
        toast.success("No se detectaron conflictos con las restricciones.", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error verificando restricciones:", error);
      toast.error("Error al verificar restricciones. Intenta nuevamente.", {
        id: toastId,
      });
    } finally {
      setIsVerifyingRestrictions(false);
    }
  };

  const draftFoodsPendingCompletion = includedFoods.filter(
    (food) => !!food.isDraft,
  );

  const continueToRecipes = async () => {
    if (!dietName.trim()) {
      toast.error("Por favor, asigna un nombre a la dieta antes de continuar.");
      return;
    }
    // Mark cart session as decided so the draft modal doesn't appear when arriving via flow
    // Save includedFoods into the shared draft so Carrito can read it directly
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draft = storedDraft ? JSON.parse(storedDraft) : {};
    draft.diet = {
      ...(draft.diet || {}),
      name: dietName,
      tags: dietTags,
      activeConstraints,
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
      toast.success("Progreso guardado. Pasando a Recetas y Porciones...");
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
          const filteredByGroup = data.filter((ing: any) => {
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
  }, [isAddFoodModalOpen, foodSearchQuery, activeGroupForAddition]);

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

  const dietJson = useMemo(
    () => ({
      dietName,
      tags: dietTags,
      activeConstraints,
      foodStatus,
      manualAdditions,
      customGroups,
      customConstraints,
      favoritesEnabled,
      categories: allGroupsToRender,
      summary: Object.fromEntries(
        Object.entries(allGroupsToRender).map(([n, f]) => [n, f.length]),
      ),
    }),
    [
      dietName,
      dietTags,
      activeConstraints,
      foodStatus,
      manualAdditions,
      customGroups,
      customConstraints,
      favoritesEnabled,
      allGroupsToRender,
    ],
  );

  const printJson = () => {
    console.log("DIET DATA:", dietJson);
    toast.info("Datos impresos en consola.");
  };

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
      } catch (_) {
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

    setSelectedPatient(patientData);
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
    const nextStatus: Record<
      string,
      "base" | "favorite" | "removed" | "added"
    > = { ...foodStatus, [food.producto]: "added" as const };
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

    const token = Cookies.get("auth_token");
    if (!token) {
      toast.error("No se encontró una sesión activa.");
      return;
    }

    setIsSavingDraftFood(true);
    try {
      const response = await fetchApi(`/foods/${draftFoodToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    const token = Cookies.get("auth_token");
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

      const currentFoodStatus: Record<
        string,
        "base" | "favorite" | "removed" | "added"
      > = { ...foodStatus };
      const nextFoodStatus: Record<
        string,
        "base" | "favorite" | "removed" | "added"
      > = { ...foodStatus };
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
        toast.success("Preferencias aplicadas ✨", {
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

      return;

      // Agregamos limit=1000 para asegurar que traemos todos los alimentos configurados por el nutri
      const res = await fetchApi(`/foods?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const allFoods = await res.json();

        const favorites = allFoods.filter(
          (f: any) => f.preferences?.[0]?.isFavorite,
        );
        const notRec = allFoods
          .filter((f: any) => f.preferences?.[0]?.isNotRecommended)
          .map((f: any) => f.name);

        console.log("DEBUG - Preferencias cargadas:", {
          totalAlimentosRecibidos: allFoods.length,
          favoritosCount: favorites.length,
          noRecomendadosCount: notRec.length,
          nombresNoRecomendados: notRec,
        });

        const removedFoods: string[] = [];
        let addedFoods: string[] = [];

        setFoodStatus((prev) => {
          const next: Record<
            string,
            "base" | "favorite" | "removed" | "added"
          > = { ...prev };

          // Quitar no recomendados (con comparación insensible a mayúsculas)
          notRec.forEach((name: string) => {
            const nameLow = name.toLowerCase().trim();
            const baseMatch = initialFoods.find(
              (b) => b.producto.toLowerCase().trim() === nameLow,
            );
            const manualMatch = manualAdditions.find(
              (ma) => ma.producto.toLowerCase().trim() === nameLow,
            );

            if (baseMatch) {
              console.log(
                `DEBUG - Quitando de dieta base: ${baseMatch.producto} (coincide con no recomendado: ${name})`,
              );
              next[baseMatch.producto] = "removed";
              removedFoods.push(baseMatch.producto);
            } else if (manualMatch) {
              console.log(
                `DEBUG - Quitando de adiciones manuales: ${manualMatch.producto} (coincide con no recomendado: ${name})`,
              );
              next[manualMatch.producto] = "removed";
              removedFoods.push(manualMatch.producto);
            } else {
              console.log(
                `DEBUG - No recomendado "${name}" no se encontró en la dieta actual (ni base ni manual).`,
              );
            }
          });

          // Marcar favoritos existentes
          favorites.forEach((f: any) => {
            const favNameLow = f.name.toLowerCase().trim();
            const baseMatch = initialFoods.find(
              (b) => b.producto.toLowerCase().trim() === favNameLow,
            );
            if (baseMatch) {
              next[baseMatch.producto] = "favorite";
            } else {
              const manualMatch = manualAdditions.find(
                (ma) => ma.producto.toLowerCase().trim() === favNameLow,
              );
              if (manualMatch) next[manualMatch.producto] = "favorite";
            }
          });

          return next;
        });

        setManualAdditions((prev) => {
          // Normalizar nombres existentes para evitar duplicados por minúsculas/mayúsculas
          const existingNamesLower = new Set([
            ...initialFoods.map((f) => f.producto.toLowerCase().trim()),
            ...prev.map((ma) => ma.producto.toLowerCase().trim()),
          ]);

          const notRecNamesLower = new Set(
            notRec.map((n: string) => n.toLowerCase().trim()),
          );

          const newFavs = favorites
            .filter((f: any) => {
              const nameLow = f.name.toLowerCase().trim();
              // No añadir si ya existe o si es un alimento no recomendado
              return (
                !existingNamesLower.has(nameLow) &&
                !notRecNamesLower.has(nameLow)
              );
            })
            .map((f: any) => ({
              id: f.id,
              producto: f.name,
              grupo: f.category?.name || "Varios",
              calorias: f.calories || 0,
              proteinas: f.proteins || 0,
              carbohidratos: f.carbs || 0,
              lipidos: f.lipids || 0,
              unidad: f.unit || "g",
              precioPromedio: f.price || 0,
              tags: f.tags?.map((t: any) => t.name) || [],
            }));

          addedFoods = newFavs.map((f: any) => f.producto);

          // Mark newly-added favorites as "favorite" in foodStatus
          if (newFavs.length > 0) {
            setFoodStatus((prev) => {
              const next = { ...prev };
              newFavs.forEach((f: any) => { next[f.producto] = "favorite"; });
              return next;
            });
          }

          return [...prev, ...newFavs];
        });
        const uniqueRemovedFoods = Array.from(new Set(removedFoods));

        if (addedFoods.length === 0 && uniqueRemovedFoods.length === 0) {
          toast.success("Preferencias aplicadas", {
            description: "No hubo cambios visibles en los ingredientes actuales.",
          });
        } else {
          toast.success("Preferencias aplicadas ✨", {
            description: `Agregados: ${addedFoods.length} · Eliminados: ${uniqueRemovedFoods.length}`,
          });
          showPreferenceChangeToasts(
            "Ingredientes agregados",
            addedFoods,
            "success",
          );
          showPreferenceChangeToasts(
            "Ingredientes eliminados",
            uniqueRemovedFoods,
            "info",
          );
        }
      }
    } catch (e) {
      toast.error("Error al cargar preferencias.");
    } finally {
      setIsApplyingPreferences(false);
    }
  };

  const fetchSmartAddData = async () => {
    setIsLoadingSmart(true);
    const token = Cookies.get("auth_token");
    try {
      // Fetch All Foods for Favorites
      const foodsRes = await fetchApi(`/foods?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (foodsRes.ok) {
        const allFoods = await foodsRes.json();
        setSmartFavorites(
          allFoods.filter((f: any) => f.preferences?.[0]?.isFavorite),
        );
      }

      const myProductsRes = await fetchApi(`/foods?tab=mine&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (myProductsRes.ok) {
        const myProducts = await myProductsRes.json();
        setSmartMyProducts(myProducts);
      } else {
        setSmartMyProducts([]);
      }

      // Fetch Groups
      const groupsRes = await fetchApi(`/ingredient-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (groupsRes.ok) {
        const groups = await groupsRes.json();
        setSmartGroups(groups);
      }
    } catch (error) {
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
        // Unselect all in this group
        ingredientIds.forEach((id: string) => next.delete(id));
      } else {
        // Select all in this group
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

    const nextStatus: Record<
      string,
      "base" | "favorite" | "removed" | "added"
    > = { ...foodStatus };
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

  const actionDockItems: ActionDockItem[] = useMemo(
    () => [
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
          setPatientsError(null);
        },
      },
      {
        id: "sep-1",
        icon: Library,
        label: "",
        onClick: () => { },
        isSeparator: true,
      },
      {
        id: "verify-foods",
        icon: AlertCircle,
        label: "Validar Restricciones (Próximamente)",
        variant: "slate",
        onClick: handleVerifyRestrictions,
        disabled: true,
      },
      {
        id: "export-json",
        icon: FileCode,
        label: "Imprimir JSON",
        variant: "slate",
        onClick: printJson,
      },
      {
        id: "export-pdf",
        icon: isExportingPdf ? Download : Download,
        label: isExportingPdf ? "Generando PDF..." : "Exportar PDF",
        variant: "slate",
        onClick: handleExportPdf,
      },

      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar Todo",
        variant: "rose",
        onClick: () => setIsResetConfirmOpen(true),
      },
    ],
    [
      printJson,
      resetDiet,
      selectedPatient,
      handleExportPdf,
      isExportingPdf,
      isVerifyingRestrictions,
      handleVerifyRestrictions,
    ],
  );

  const filteredPatients = useMemo(() => {
    const normalizedQuery = patientSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return patients;

    return patients.filter((patient) => {
      const fullName = patient.fullName?.toLowerCase() || "";
      const email = patient.email?.toLowerCase() || "";
      const documentId = String(patient.documentId || "").toLowerCase();

      return (
        fullName.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        documentId.includes(normalizedQuery)
      );
    });
  }, [patientSearchQuery, patients]);

  return (
    <>
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDiet}
        title="¿Reiniciar dieta?"
        description="Se borrará todo el avance local de este módulo y volverás a empezar desde cero."
        confirmText="Sí, reiniciar"
        variant="destructive"
      />
      <ConfirmationModal
        isOpen={isExportConfirmOpen}
        onClose={() => setIsExportConfirmOpen(false)}
        onConfirm={() => {
          setIsExportConfirmOpen(false);
          void performExportPdf();
        }}
        title="¿Exportar PDF ahora?"
        description="Todavía no hiciste cambios en ingredientes. Si fue un clic accidental, puedes volver atrás antes de generar el PDF."
        confirmText="Sí, exportar"
      />
      <ConfirmationModal
        isOpen={isContinueDraftWarningOpen}
        onClose={() => setIsContinueDraftWarningOpen(false)}
        onConfirm={() => {
          setIsContinueDraftWarningOpen(false);
          void continueToRecipes();
        }}
        title="Hay alimentos con informaciÃ³n pendiente"
        description={`Todavía tienes ${draftFoodsPendingCompletion.length} alimento${draftFoodsPendingCompletion.length === 1 ? "" : "s"} creado${draftFoodsPendingCompletion.length === 1 ? "" : "s"} como borrador, sin sus características nutricionales completas. Si continúas ahora, los cálculos de la siguiente etapa pueden quedar imprecisos.`}
        confirmText="Continuar igual"
      />
      <ConfirmationModal
        isOpen={!!pendingTagCreation}
        onClose={() => setPendingTagCreation(null)}
        onConfirm={() => {
          if (pendingTagCreation) {
            void createGlobalTag(pendingTagCreation.name);
          }
          setPendingTagCreation(null);
        }}
        title="¿Crear también en Detalles?"
        description={
          pendingTagCreation
            ? pendingTagCreation.type === "classification"
              ? `El tag "${pendingTagCreation.name}" se agregó a esta dieta, pero todavía no existe en Detalles. ¿Quieres crearlo también como etiqueta de clasificación global?`
              : `La restricción "${pendingTagCreation.name}" se agregó a esta dieta, pero todavía no existe en Detalles. ¿Quieres crearla también como restricción global?`
            : ""
        }
        confirmText="Sí, crear en Detalles"
        cancelText="No, solo usar aquí"
      />
      <ModuleLayout
        title="Diseñador de Dieta General"
        description={
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              Aquí defines, de forma simple y general, los alimentos que consumirá tu paciente.
            </p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Tu objetivo es elegir los alimentos que consumirá tu paciente.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Hazlo de manera muy general, sin especificar aún cantidades exactas ni detalles finos.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Piensa primero en los alimentos que realmente consumirá en su día a día.</span>
              </div>
            </div>
          </div>
        }
        step={{
          number: 1,
          label: "Estrategia & Base",
          icon: GraduationCap,
          color: "text-emerald-600",
        }}
        rightNavItems={actionDockItems}
        footer={
          <ModuleFooter>
            <Button
              variant="outline"
              className="h-12 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black gap-2 transition-all active:scale-95 group"
              onClick={openSmartModal}
            >
              <div className="bg-indigo-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <Brain className="h-5 w-5" />
              </div>
              Añadir alimentos inteligente
            </Button>

            <div className="flex gap-3">
              <Button
                className="h-12 px-8 bg-slate-900"
                onClick={() => {
                  if (!dietName.trim()) {
                    toast.error("Por favor, asigna un nombre a la dieta.");
                    return;
                  }
                  setIsSaveCreationModalOpen(true);
                }}
              >
                Guardar Creación
              </Button>
              <Button
                className="h-12 px-8 bg-emerald-600"
                onClick={handleContinue}
              >
                Continuar <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={currentProjectName}
          patientName={selectedPatient?.fullName || null}
          mode={currentProjectMode}
          moduleLabel="Dieta"
        />
        {selectedPatient && (
          <div className="mb-6 animate-in slide-in-from-top duration-300">
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
                    {selectedPatient.fullName}
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

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Nombre de la Dieta <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ej: Protocolo Hipertrofia Avanzado"
                value={dietName}
                onChange={(e) => setDietName(e.target.value)}
                className="h-14 text-lg font-bold rounded-2xl border-slate-200 focus:border-emerald-500 bg-slate-50/80 shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Etiquetas de Clasificación
              </label>
              <TagInput
                value={dietTags}
                onChange={(newTags) => {
                  setDietTags(newTags);
                  const latest = findNewlyAddedTag(dietTags, newTags);
                  if (
                    latest &&
                    !hasTagInList(availableClassificationTags, latest)
                  ) {
                    setPendingTagCreation({
                      name: latest,
                      type: "classification",
                    });
                  }
                  saveDraft({ dietTags: newTags });
                }}
                placeholder="Añadir tags (Keto, Vegano...)"
                suggestions={availableClassificationTags}
                includeSystemSuggestions={false}
                className="min-h-[56px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                Restricciones Clínicas del Plan
              </label>
            </div>

            <div className="space-y-4">
              <TagInput
                value={activeConstraints}
                onChange={(newTags) => {
                  const normalizedTags = normalizeConstraintList(newTags);
                  setActiveConstraints(normalizedTags);
                  const latest = findNewlyAddedTag(
                    activeConstraints,
                    normalizedTags,
                  );
                  if (
                    latest &&
                    !hasTagInList(availableConstraintTags, latest) &&
                    !DEFAULT_CONSTRAINTS.some((constraint) => constraint.id === latest)
                  ) {
                    setPendingTagCreation({
                      name: latest,
                      type: "constraint",
                    });
                  }
                  saveDraft({ activeConstraints: normalizedTags });
                }}
                placeholder="Buscar o añadir restricción..."
                suggestions={availableConstraintTags}
                disableDelete={true}
              />

              <div className="flex flex-wrap gap-2">
                {DEFAULT_CONSTRAINTS.filter(
                  (constraint) =>
                    !selectedDefaultConstraintIds.has(constraint.id),
                ).map((constraint) => (
                  <button
                    key={constraint.id}
                    onClick={() => toggleConstraint(constraint.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2",
                      "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm",
                    )}
                  >
                    {constraint.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Dieta Base Generada
          </h2>
          <Button
            onClick={applyNutritionistPreferences}
            disabled={isApplyingPreferences}
            className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 border-none font-black text-sm rounded-xl gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            {isApplyingPreferences ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Filter className="h-5 w-5" />
            )}
            Añadir favoritos y quitar no recomendados
          </Button>
        </div>

        <div className="grid gap-6">
          {Object.entries(allGroupsToRender).map(([name, foods]) => (
            <div
              key={name}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 uppercase tracking-tight text-sm flex items-center gap-2">
                  {name}
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                    {foods.length}
                  </span>
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAddModal(name)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setGroupToDelete(name);
                      setIsDeleteGroupConfirmOpen(true);
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {foods.map((food, idx) => (
                  <div
                    key={`${food.producto}-${idx}`}
                    className="p-4 flex items-center justify-between group hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                        🍽️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">
                            {food.producto}
                          </p>
                          {food.isDraft && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
                              Borrador
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs text-slate-500 font-medium items-center flex-wrap">
                          <span className="text-orange-600 font-bold">
                            {food.calorias || 0} kcal
                          </span>
                          <span>•</span>
                          <span className="text-blue-600">
                            P: {food.proteinas || 0}g
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600">
                            C: {food.carbohidratos || 0}g
                          </span>
                          <span>•</span>
                          <span className="text-yellow-600">
                            L: {food.lipidos || 0}g
                          </span>
                          {food.azucares !== undefined && food.azucares > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">
                                Az: {food.azucares}g
                              </span>
                            </>
                          )}
                          {food.fibra !== undefined && food.fibra > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">
                                Fib: {food.fibra}g
                              </span>
                            </>
                          )}
                          {food.sodio !== undefined && food.sodio > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">
                                Na: {food.sodio}mg
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {food.isDraft && (
                        <button
                          onClick={() => openDraftFoodEditor(food)}
                          className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl cursor-pointer transition-colors"
                          title="Completar información nutricional"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedFoodForInfo(food);
                          setIsFoodInfoModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl cursor-pointer transition-colors"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => removeFood(food.producto)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => openAddModal(name)}
                  className="w-full p-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Añadir alimento a {name}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setIsAddGroupModalOpen(true)}
            className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Plus className="h-5 w-5 mx-auto mb-1" />
            Añadir nueva categoría personalizada
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteGroupConfirmOpen}
        onClose={() => setIsDeleteGroupConfirmOpen(false)}
        onConfirm={confirmDeleteGroup}
        title={`¿Eliminar grupo "${groupToDelete}"?`}
        description="Esto quitará los alimentos de esta vista."
      />

      <Modal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        title={`Añadir a "${activeGroupForAddition}"`}
      >
        <div className="space-y-4">
          <Input
            placeholder="Buscar..."
            value={foodSearchQuery}
            onChange={(e) => setFoodSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {isSearchingFoods ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400 font-medium">
                  Buscando alimentos...
                </p>
              </div>
            ) : searchResultFoods.length > 0 ? (
              searchResultFoods.map((f) => (
                <div
                  key={f.id}
                  className="w-full flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900">
                      {f.producto}
                    </p>
                    <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="text-orange-600 font-bold">
                        {f.calorias || 0} kcal
                      </span>
                      <span>•</span>
                      <span className="text-blue-600">
                        P: {f.proteinas || 0}g
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFoodForInfo(f);
                        setIsFoodInfoModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAddFromSearch(f)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : foodSearchQuery.trim() ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-400 mb-3">
                  No se encontraron resultados.
                </p>
                <Button
                  variant="outline"
                  className="text-emerald-600"
                  disabled={isCreatingManualFood}
                  onClick={async () => {
                    const token = Cookies.get("auth_token");
                    if (!token) {
                      toast.error("No se encontró una sesión activa.");
                      return;
                    }

                    setIsCreatingManualFood(true);
                    try {
                      const response = await fetchApi("/foods", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
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
                        const errorData = await response
                          .json()
                          .catch(() => ({}));
                        throw new Error(
                          errorData.message ||
                            "No se pudo crear el alimento borrador.",
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
                      toast.success(
                        `"${newItem.producto}" creado como borrador.`,
                      );
                      setIsAddFoodModalOpen(false);
                      setFoodSearchQuery("");
                      setSearchResultFoods([]);
                    } catch (error: any) {
                      console.error("Error creating draft ingredient", error);
                      toast.error(
                        error?.message ||
                          "No se pudo crear el alimento manual.",
                      );
                    } finally {
                      setIsCreatingManualFood(false);
                    }
                  }}
                >
                  {isCreatingManualFood
                    ? "Creando borrador..."
                    : `Crear "${foodSearchQuery}" como borrador`}
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Escribe para buscar alimentos...
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Adición Inteligente */}
      <Modal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        title="Selección Inteligente"
        className="sm:max-w-2xl"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setSmartAddTab("favorites")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                smartAddTab === "favorites"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  smartAddTab === "favorites" && "fill-current",
                )}
              />
              Favoritos
            </button>
            <button
              onClick={() => setSmartAddTab("groups")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                smartAddTab === "groups"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <FolderPlus className="h-4 w-4" />
              Mis Grupos
            </button>
            <button
              onClick={() => setSmartAddTab("myproducts")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                smartAddTab === "myproducts"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Plus className="h-4 w-4" />
              Mis Productos
            </button>
            <button
              onClick={() => setSmartAddTab("search")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                smartAddTab === "search"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>

          {smartAddTab === "search" && (
            <div className="px-1">
              <Input
                placeholder="Buscar en toda la base de datos..."
                value={smartSearchQuery}
                onChange={(e) => setSmartSearchQuery(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500"
                autoFocus
              />
            </div>
          )}

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto px-1 space-y-4">
            {isLoadingSmart ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-slate-400 font-bold text-sm">
                  Cargando tus secretos culinarios...
                </p>
              </div>
            ) : smartAddTab === "favorites" ? (
              smartFavorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {smartFavorites.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => toggleSmartSelection(f.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                        selectedFoods.has(f.id)
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-100 bg-white hover:border-indigo-200",
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm mb-1">
                          {f.name}
                        </p>
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">
                          {f.category?.name || "Varios"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFoodForInfo({
                              id: f.id,
                              producto: f.name,
                              grupo: f.category?.name || "Varios",
                              calorias: f.calories || 0,
                              proteinas: f.proteins || 0,
                              carbohidratos: f.carbs || 0,
                              lipidos: f.lipids || 0,
                              unidad: f.unit || "g",
                              precioPromedio: f.price || 0,
                              tags: f.tags?.map((t: any) => t.name) || [],
                              ...(f as any),
                            });
                            setIsFoodInfoModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedFoods.has(f.id)
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-200 group-hover:border-indigo-300",
                          )}
                        >
                          {selectedFoods.has(f.id) && (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Star className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No tienes alimentos favoritos marcados aún.
                  </p>
                </div>
              )
            ) : smartAddTab === "groups" ? (
              smartGroups.length > 0 ? (
                <div className="space-y-6">
                  {smartGroups.map((group) => {
                    const groupIngredientIds =
                      (group.ingredients as any[])?.map(
                        (rel: any) => (rel.ingredient as any)?.id as string,
                      ) || [];
                    const isAllSelected =
                      groupIngredientIds.length > 0 &&
                      groupIngredientIds.every((id) => selectedFoods.has(id));

                    return (
                      <div
                        key={group.id}
                        className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100"
                      >
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                              {group.name}
                            </h4>
                          </div>

                          <button
                            onClick={() => toggleGroupSelection(group.id)}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg transition-all border shadow-sm",
                              isAllSelected
                                ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                                : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700",
                            )}
                          >
                            {isAllSelected
                              ? "Quitar todo el grupo"
                              : "Seleccionar todo el grupo"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.ingredients?.map((rel: any) => (
                            <div
                              key={rel.ingredient?.id}
                              onClick={() =>
                                toggleSmartSelection(rel.ingredient?.id)
                              }
                              className={cn(
                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                selectedFoods.has(rel.ingredient?.id)
                                  ? "border-indigo-500 bg-indigo-50/50"
                                  : "border-slate-100 bg-white hover:border-indigo-200",
                              )}
                            >
                              <div className="flex-1">
                                <p className="font-black text-slate-800 text-sm mb-1">
                                  {rel.ingredient?.name}
                                </p>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {rel.amount || 100}{" "}
                                  {rel.ingredient?.unit || rel.unit || "g"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const ing = rel.ingredient;
                                    setSelectedFoodForInfo({
                                      id: ing?.id,
                                      producto: ing?.name || "Desconocido",
                                      grupo: ing?.category?.name || "Varios",
                                      calorias: ing?.calories || 0,
                                      proteinas: ing?.proteins || 0,
                                      carbohidratos: ing?.carbs || 0,
                                      lipidos: ing?.lipids || 0,
                                      unidad: ing?.unit || "g",
                                      precioPromedio: ing?.price || 0,
                                      tags:
                                        ing?.tags?.map((t: any) => t.name) ||
                                        [],
                                      ...(ing as any),
                                    });
                                    setIsFoodInfoModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                                <div
                                  className={cn(
                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedFoods.has(rel.ingredient?.id)
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "border-slate-200 group-hover:border-indigo-300",
                                  )}
                                >
                                  {selectedFoods.has(rel.ingredient?.id) ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4 text-slate-300" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <FolderPlus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No has creado grupos de ingredientes aún.
                  </p>
                </div>
              )
            ) : smartAddTab === "myproducts" ? (
              smartMyProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {smartMyProducts.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => toggleSmartSelection(f.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                        selectedFoods.has(f.id)
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-100 bg-white hover:border-indigo-200",
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm mb-1">
                          {f.name}
                        </p>
                        <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase">
                          Creado por ti
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFoodForInfo({
                              id: f.id,
                              producto: f.name,
                              grupo: f.category?.name || "Varios",
                              calorias: f.calories || 0,
                              proteinas: f.proteins || 0,
                              carbohidratos: f.carbs || 0,
                              lipidos: f.lipids || 0,
                              unidad: f.unit || "g",
                              precioPromedio: f.price || 0,
                              tags: f.tags?.map((t: any) => t.name) || [],
                              ...(f as any),
                            });
                            setIsFoodInfoModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedFoods.has(f.id)
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-200 group-hover:border-indigo-300",
                          )}
                        >
                          {selectedFoods.has(f.id) && (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Plus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No has creado productos personalizados aún.
                  </p>
                </div>
              )
            ) : smartAddTab === "search" ? (
              isSearchingInSmart ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-slate-400 font-bold text-sm">
                    Escaneando base de datos...
                  </p>
                </div>
              ) : smartSearchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {smartSearchResults.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => toggleSmartSelection(f.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                        selectedFoods.has(f.id)
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-100 bg-white hover:border-indigo-200",
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm mb-1">
                          {f.name}
                        </p>
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">
                          {f.category?.name || "Varios"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFoodForInfo({
                              id: f.id,
                              producto: f.name,
                              grupo: f.category?.name || "Varios",
                              calorias: f.calories || 0,
                              proteinas: f.proteins || 0,
                              carbohidratos: f.carbs || 0,
                              lipidos: f.lipids || 0,
                              unidad: f.unit || "g",
                              precioPromedio: f.price || 0,
                              tags: f.tags?.map((t: any) => t.name) || [],
                              ...(f as any),
                            });
                            setIsFoodInfoModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedFoods.has(f.id)
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-200 group-hover:border-indigo-300",
                          )}
                        >
                          {selectedFoods.has(f.id) && (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : smartSearchQuery.trim() ? (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No se encontraron productos para "{smartSearchQuery}"
                  </p>
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    Escribe algo para buscar en toda la base de datos...
                  </p>
                </div>
              )
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
            <div className="text-xs">
              <span className="text-slate-400 font-bold">Seleccionados: </span>
              <span className="text-indigo-600 font-black">
                {selectedFoods.size} alimentos
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="h-11 rounded-xl"
                onClick={() => setIsSmartModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2"
                onClick={handleSmartAddAll}
                disabled={selectedFoods.size === 0}
              >
                <CheckCircle2 className="h-5 w-5" />
                Añadir todo(s)
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Food Info Modal - Side Panel */}
      {isFoodInfoModalOpen && selectedFoodForInfo && (
        <div className="fixed inset-0 z-100 flex items-center justify-start">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsFoodInfoModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 z-10">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">
                    {selectedFoodForInfo.producto}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {selectedFoodForInfo.grupo}
                  </p>
                </div>
                <button
                  onClick={() => setIsFoodInfoModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Macronutrientes Principales */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Macronutrientes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="text-xs font-bold text-orange-600 mb-1">
                      Calorías
                    </p>
                    <p className="text-2xl font-black text-orange-700">
                      {selectedFoodForInfo.calorias || 0}
                    </p>
                    <p className="text-[10px] text-orange-500 font-medium">
                      kcal
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 mb-1">
                      Proteínas
                    </p>
                    <p className="text-2xl font-black text-blue-700">
                      {selectedFoodForInfo.proteinas || 0}
                    </p>
                    <p className="text-[10px] text-blue-500 font-medium">
                      gramos
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 mb-1">
                      Carbohidratos
                    </p>
                    <p className="text-2xl font-black text-emerald-700">
                      {selectedFoodForInfo.carbohidratos || 0}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-medium">
                      gramos
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-600 mb-1">
                      Lípidos
                    </p>
                    <p className="text-2xl font-black text-yellow-700">
                      {selectedFoodForInfo.lipidos || 0}
                    </p>
                    <p className="text-[10px] text-yellow-500 font-medium">
                      gramos
                    </p>
                  </div>
                </div>
              </div>

              {/* Micronutrientes y Otros */}
              {((selectedFoodForInfo as any).azucares > 0 ||
                (selectedFoodForInfo as any).fibra > 0 ||
                (selectedFoodForInfo as any).sodio > 0) && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Información Adicional
                    </h3>
                    <div className="space-y-2">
                      {(selectedFoodForInfo as any).azucares > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-bold text-slate-700">
                            Azúcares
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {(selectedFoodForInfo as any).azucares}g
                          </span>
                        </div>
                      )}
                      {(selectedFoodForInfo as any).fibra > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-bold text-slate-700">
                            Fibra
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {(selectedFoodForInfo as any).fibra}g
                          </span>
                        </div>
                      )}
                      {(selectedFoodForInfo as any).sodio > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-bold text-slate-700">
                            Sodio
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {(selectedFoodForInfo as any).sodio}mg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Porción */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Porción de Referencia
                </h3>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-600 mb-1">
                    Unidad
                  </p>
                  <p className="text-lg font-black text-indigo-900">
                    {selectedFoodForInfo.unidad || "g"}
                  </p>
                </div>
              </div>

              {/* Precio */}
              {selectedFoodForInfo.precioPromedio > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Precio Estimado
                  </h3>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-sm font-bold text-green-600 mb-1">
                      Precio Promedio
                    </p>
                    <p className="text-lg font-black text-green-900">
                      {formatCLP(selectedFoodForInfo.precioPromedio)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedFoodForInfo.tags &&
                selectedFoodForInfo.tags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Etiquetas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFoodForInfo.tags.map(
                        (tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200"
                          >
                            #{tag}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        title="Validación de Restricciones"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Resumen
            </p>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {verificationResult?.summary || "Sin resultado disponible."}
            </p>
            {verificationResult && (
              <p className="text-xs text-slate-500 mt-2">
                Motor: {verificationResult.source.toUpperCase()} | Alimentos:{" "}
                {verificationResult.checkedFoods} | Restricciones:{" "}
                {verificationResult.checkedRestrictions}
              </p>
            )}
          </div>

          {verificationResult?.conflicts?.length ? (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {verificationResult.conflicts.map((conflict, index) => (
                <div
                  key={`${conflict.foodId}-${conflict.restriction}-${index}`}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-rose-700">
                      {conflict.foodName}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded",
                        conflict.severity === "high"
                          ? "bg-rose-200 text-rose-700"
                          : conflict.severity === "medium"
                            ? "bg-amber-200 text-amber-700"
                            : "bg-blue-200 text-blue-700",
                      )}
                    >
                      {conflict.severity}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Restricción: {conflict.restriction}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{conflict.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <p className="text-sm font-black text-emerald-700">
                Todo OK: no se detectaron incompatibilidades directas.
              </p>
            </div>
          )}
        </div>
      </Modal>


      {/* Import Patient Modal */}
      <Modal
        isOpen={isImportPatientModalOpen}
        onClose={() => {
          setIsImportPatientModalOpen(false);
          setPatientSearchQuery("");
          setPatientsError(null);
        }}
        title="Vincular Paciente"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o Rut/ID..."
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
            {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => void handleSelectPatient(patient)}
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

            {!isLoadingPatients && patientsError && (
              <div className="py-12 text-center">
                <AlertCircle className="h-10 w-10 text-rose-300 mx-auto mb-3" />
                <p className="text-sm text-rose-500 font-bold">
                  No pudimos cargar tus pacientes.
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                  {patientsError}
                </p>
              </div>
            )}

            {!isLoadingPatients && !patientsError && filteredPatients.length === 0 && (
              <div className="py-12 text-center">
                <UserPlus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-bold">
                  {patientSearchQuery.trim()
                    ? "No encontramos pacientes con ese criterio."
                    : "No se encontraron pacientes registrados."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={handleImportCreation}
        defaultType="DIET"
      />

      {/* Create Group Modal */}
      <Modal
        isOpen={isAddGroupModalOpen}
        onClose={() => {
          setIsAddGroupModalOpen(false);
          setNewGroupNameInput("");
        }}
        title="Nueva Categoría"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Crea una categoría personalizada para organizar alimentos específicos en tu plan.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Nombre de la Categoría
            </label>
            <Input
              placeholder="Ej: Snacks, Bebidas, Suplementos..."
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateGroup(); }}
              autoFocus
              className="h-12 rounded-xl border-slate-200 focus:border-emerald-500"
            />
            {newGroupNameInput.trim() && Object.keys(allGroupsToRender).map(g => g.toLowerCase()).includes(newGroupNameInput.trim().toLowerCase()) && (
              <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Ya existe una categoría con ese nombre.
              </p>
            )}
          </div>

          {Object.keys(allGroupsToRender).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Categorías actuales
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(allGroupsToRender).map((g) => (
                  <span key={g} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-bold border border-slate-200">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-black"
              onClick={handleCreateGroup}
              disabled={
                !newGroupNameInput.trim() ||
                Object.keys(allGroupsToRender).map(g => g.toLowerCase()).includes(newGroupNameInput.trim().toLowerCase())
              }
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Crear Categoría
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-slate-200"
              onClick={() => {
                setIsAddGroupModalOpen(false);
                setNewGroupNameInput("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isDraftFoodEditorOpen}
        onClose={() => setIsDraftFoodEditorOpen(false)}
        title={`Completar "${draftFoodToEdit?.producto || "alimento"}"`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Completa la información nutricional base para que los cálculos de las siguientes etapas sean correctos.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Cantidad base
              </label>
              <Input
                type="number"
                value={draftFoodValues.amount}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Unidad
              </label>
              <Input
                value={draftFoodValues.unit}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Calorías
              </label>
              <Input
                type="number"
                value={draftFoodValues.calories}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    calories: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Proteínas
              </label>
              <Input
                type="number"
                value={draftFoodValues.proteins}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    proteins: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Carbohidratos
              </label>
              <Input
                type="number"
                value={draftFoodValues.carbs}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    carbs: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Lípidos
              </label>
              <Input
                type="number"
                value={draftFoodValues.lipids}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    lipids: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Azúcares
              </label>
              <Input
                type="number"
                value={draftFoodValues.azucares}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    azucares: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Fibra
              </label>
              <Input
                type="number"
                value={draftFoodValues.fibra}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    fibra: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Sodio
              </label>
              <Input
                type="number"
                value={draftFoodValues.sodio}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    sodio: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-slate-200"
              onClick={() => setIsDraftFoodEditorOpen(false)}
              disabled={isSavingDraftFood}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveDraftFood}
              disabled={isSavingDraftFood}
            >
              {isSavingDraftFood ? "Guardando..." : "Guardar información"}
            </Button>
          </div>
        </div>
      </Modal>
      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={handleSaveWithDescription}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title="Guardar dieta"
        subtitle="Añade una breve descripción para reconocer esta dieta dentro de Mis creaciones."
      />
    </ModuleLayout >
  </>
);
}

