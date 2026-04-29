"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChefHat,
  Download,
  Library,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { type ActionDockItem } from "@/components/ui/ActionDock";
import { fetchApi } from "@/lib/api-base";
import { fetchCreation, saveCreation } from "@/lib/workflow";
import { getAuthToken } from "@/lib/auth-token";

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
  dietRestrictions?: string[];
  likes?: string;
  tags?: string[];
  clinicalSummary?: string;
  weight?: number;
  height?: number;
  gender?: string;
  birthDate?: string;
  nutritionalFocus?: string;
  fitnessGoals?: string;
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

const DEFAULT_TITLE = "Receta rápida";
const DEFAULT_DIET_NAME = "Plan nutricional personalizado";
const DRAFT_KEY = "nutri_quick_recipes_draft";
const DISHES_PER_CATEGORY_PAGE = 3;
const WEEKLY_CORE_SECTIONS = ["Desayuno", "Almuerzo", "Once", "Cena"];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

const normalizeImportedDishes = (value: unknown): QuickDish[] => {
  if (!Array.isArray(value) || value.length === 0) return [createDish()];

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
            .filter((ing): ing is QuickIngredient => !!ing)
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
    .filter((dish): dish is QuickDish => !!dish);

  return mapped.length > 0 ? mapped : [createDish()];
};

export default function QuickRecipesClient() {
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [dietName, setDietName] = useState(DEFAULT_DIET_NAME);
  const [nutritionistNotes, setNutritionistNotes] = useState("");
  const [allowedFoodsMainText, setAllowedFoodsMainText] = useState("");
  const [restrictedFoodsText, setRestrictedFoodsText] = useState("");
  const [specialConsiderations, setSpecialConsiderations] = useState("");
  const [finalPdfNotes, setFinalPdfNotes] = useState("");
  const [dishes, setDishes] = useState<QuickDish[]>([createDish()]);
  const [mealGenerationTargets, setMealGenerationTargets] = useState<MealGenerationTarget[]>(
    createDefaultGenerationTargets(),
  );
  const [activeMealSectionFilter, setActiveMealSectionFilter] = useState("Todos");
  const [categoryPageMap, setCategoryPageMap] = useState<Record<string, number>>({});
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);

  const isExportDisabled = useMemo(() => {
    const hasPatient = !!selectedPatient;
    const hasAtLeastOneDish = dishes.some(d => d.title.trim().length > 0);
    return !hasPatient || !hasAtLeastOneDish;
  }, [selectedPatient, dishes]);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");

  const [patients, setPatients] = useState<QuickPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return;
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
      setAllowedFoodsMainText(toTextAreaValue(parsed.allowedFoodsMain));
      setRestrictedFoodsText(toTextAreaValue(parsed.restrictedFoods));
      setSpecialConsiderations(
        typeof parsed.specialConsiderations === "string"
          ? parsed.specialConsiderations
          : "",
      );
      setFinalPdfNotes(
        typeof parsed.finalPdfNotes === "string" ? parsed.finalPdfNotes : "",
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
    } catch (error) {
      console.error("Error loading quick recipes draft", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title,
        dietName,
        nutritionistNotes,
        allowedFoodsMain: parseLines(allowedFoodsMainText),
        restrictedFoods: parseLines(restrictedFoodsText),
        specialConsiderations,
        finalPdfNotes,
        dishes,
        mealGenerationTargets,
        activeMealSectionFilter,
        categoryPageMap,
        selectedPatient,
      }),
    );
  }, [
    title,
    dietName,
    nutritionistNotes,
    allowedFoodsMainText,
    restrictedFoodsText,
    specialConsiderations,
    finalPdfNotes,
    dishes,
    mealGenerationTargets,
    activeMealSectionFilter,
    categoryPageMap,
    selectedPatient,
  ]);

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
        setAllowedFoodsMainText(toTextAreaValue(content.allowedFoodsMain));
        setRestrictedFoodsText(toTextAreaValue(content.restrictedFoods));
        setSpecialConsiderations(
          typeof content.specialConsiderations === "string"
            ? content.specialConsiderations
            : "",
        );
        setFinalPdfNotes(
          typeof content.finalPdfNotes === "string" ? content.finalPdfNotes : "",
        );
        setDishes(normalizeImportedDishes(content.dishes));
        setMealGenerationTargets(
          Array.isArray(content.mealGenerationTargets)
            ? (content.mealGenerationTargets as MealGenerationTarget[])
            : createDefaultGenerationTargets(),
        );

        if (creation.metadata?.patientName) {
          setSelectedPatient({
            id: creation.metadata.patientId as string | undefined,
            fullName: creation.metadata.patientName as string,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar la receta rápida.");
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
      const response = await fetchApi("/patients", {
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

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    return patients.filter((patient) =>
      (patient.fullName || "").toLowerCase().includes(patientSearch.toLowerCase()),
    );
  }, [patients, patientSearch]);

  const handleSelectPatient = (patient: QuickPatient) => {
    setSelectedPatient(patient);
    setIsPatientModalOpen(false);
    toast.success(
      `Paciente "${patient.fullName}" vinculado. La IA considerará restricciones y características del paciente (edad, sexo, objetivos y contexto clínico).`,
    );
  };

  const addDish = () => setDishes((prev) => [...prev, createDish()]);

  const removeDish = (dishId: string) => {
    if (dishes.length === 1) {
      toast.error("Debes tener al menos un plato.");
      return;
    }
    setDishes((prev) => prev.filter((dish) => dish.id !== dishId));
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
    if (creation.type !== "RECIPE" && creation.type !== "DIET") {
      toast.error("Solo puedes importar recetas o dietas en este modulo.");
      return;
    }
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
    const dietFoodsText =
      toTextAreaValue(content.allowedFoodsMain) ||
      toTextAreaValue(content.includedFoods) ||
      toTextAreaValue(content.foods) ||
      toTextAreaValueFromFoods(content.includedFoods) ||
      toTextAreaValueFromFoods(content.foods);
    setAllowedFoodsMainText(dietFoodsText);
    setRestrictedFoodsText(
      toTextAreaValue(content.restrictedFoods) ||
        toTextAreaValue(content.activeConstraints) ||
        toTextAreaValue(content.customConstraints),
    );
    setSpecialConsiderations(
      typeof content.specialConsiderations === "string" ? content.specialConsiderations : "",
    );
    setFinalPdfNotes(
      typeof content.finalPdfNotes === "string" ? content.finalPdfNotes : "",
    );
    setDishes(normalizeImportedDishes(content.dishes));
    setMealGenerationTargets(
      Array.isArray(content.mealGenerationTargets)
        ? (content.mealGenerationTargets as MealGenerationTarget[])
        : createDefaultGenerationTargets(),
    );

    const patientName =
      typeof creation.metadata?.patientName === "string" ? creation.metadata.patientName : null;
    const patientId =
      typeof creation.metadata?.patientId === "string" ? creation.metadata.patientId : undefined;
    setSelectedPatient(patientName ? { id: patientId, fullName: patientName } : null);
    setIsImportCreationModalOpen(false);
    toast.success(
      creation.type === "DIET"
        ? "Dieta importada al borrador actual para crear platos."
        : "Receta importada al borrador actual.",
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
          count: Number.isFinite(nextCount) ? Math.max(1, Math.min(14, nextCount)) : 1,
        };
      }),
    );
  };

  const generateWithAi = async (mode: "single" | "weekly") => {
    if (mode === "single") {
      setIsGenerating(true);
    } else {
      setIsGeneratingWeekly(true);
    }

    try {
      const token = getAuthToken();

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

      const selectedTargets = effectiveTargets
        .filter((target) => target.enabled)
        .map((target) => ({
          mealSection: target.mealSection,
          count: Math.max(1, Math.min(14, target.count || 1)),
        }));

      if (selectedTargets.length === 0) {
        toast.error("Selecciona al menos una categoria para generar platos.");
        return;
      }

      const desiredDishCount = selectedTargets.reduce((sum, target) => sum + target.count, 0);
      const aiInstruction =
        mode === "weekly"
          ? "Generar plan semanal. Ser creativo para que no se aburran."
          : "Ser creativo para que no se aburran.";

      const response = await fetchApi("/recipes/quick-ai-fill", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: {
            dietName: dietName.trim() || DEFAULT_DIET_NAME,
            notes: [nutritionistNotes.trim(), aiInstruction].filter(Boolean).join(" | "),
            allowedFoodsMain: parseLines(allowedFoodsMainText),
            restrictedFoods: Array.from(
              new Set([...userRestricted, ...patientRestrictions, ...patientHealthTags]),
            ),
            specialConsiderations: specialConsiderations.trim(),
            desiredDishCount: Math.max(2, Math.min(60, desiredDishCount)),
            mealSectionTargets: selectedTargets,
            generationMode: mode,
            existingDishes: dishes
              .filter((dish) => dish.title.trim())
              .map((dish) => ({ title: dish.title.trim(), mealSection: dish.mealSection })),
            patient: selectedPatient
              ? {
                  fullName: selectedPatient.fullName,
                  restrictions: patientRestrictions,
                  likes: selectedPatient.likes || "",
                  healthTags: patientHealthTags,
                  clinicalSummary: selectedPatient.clinicalSummary || "",
                  nutritionalFocus: selectedPatient.nutritionalFocus || "",
                  fitnessGoals: selectedPatient.fitnessGoals || "",
                  weight: selectedPatient.weight,
                  height: selectedPatient.height,
                  gender: selectedPatient.gender,
                  birthDate: selectedPatient.birthDate,
                }
              : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo generar con IA.");
      }

      const data = await response.json();
      const aiDishes = Array.isArray(data?.dishes) ? (data.dishes as QuickAiDishResponse[]) : [];
      if (aiDishes.length === 0) {
        throw new Error("La IA no devolvio platos.");
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
        recommendedPortion: dish.recommendedPortion || "",
        portions: dish.portions != null ? String(dish.portions) : "1",
        protein: String(dish.protein ?? ""),
        calories: String(dish.calories ?? ""),
        carbs: String(dish.carbs ?? ""),
        fats: String(dish.fats ?? ""),
        ingredients,
      };
      });

      setDishes(mapped);
      if (mode === "weekly") {
        setMealGenerationTargets(effectiveTargets);
      }
      setCategoryPageMap({});
      setActiveMealSectionFilter("Todos");
      toast.success(
        mode === "weekly"
          ? "Plan semanal generado con IA segun categorias."
          : "Platos generados correctamente con IA.",
      );
    } catch (error) {
      console.error("Quick AI generation error", error);
      toast.error("No se pudo generar con IA. Revisa la conexión o la configuración de la IA.");
      
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
    allowedFoodsMain: parseLines(allowedFoodsMainText),
    restrictedFoods: parseLines(restrictedFoodsText),
    specialConsiderations,
    finalPdfNotes,
    dishes,
    mealGenerationTargets,
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
          metadata: {
            source: "rapido",
            quickCreationId: savedCreationId || null,
            mealSection: dish.mealSection || null,
            ingredients: Array.isArray(dish.ingredients)
              ? dish.ingredients.map((ingredient) => ingredient.name.trim()).filter(Boolean)
              : [],
          },
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
    if (!title.trim()) {
      toast.error("Por favor ingresa un título antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
      const savedCreation = await saveCreation({
        name: title.trim(),
        type: "RECIPE",
        content: buildContent(),
        metadata: {
          ...(creationDescription.trim() ? { description: creationDescription.trim() } : {}),
          ...(selectedPatient
            ? { patientId: selectedPatient.id, patientName: selectedPatient.fullName }
            : {}),
          dishCount: dishes.length,
          source: "rapido",
        },
        tags: ["rapido", "receta"],
      });

      const savedDishCount = await persistGeneratedDishesToProfile(savedCreation.id);
      toast.success(
        savedDishCount > 0
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
    setTitle(DEFAULT_TITLE);
    setDietName(DEFAULT_DIET_NAME);
    setNutritionistNotes("");
    setAllowedFoodsMainText("");
    setRestrictedFoodsText("");
    setSpecialConsiderations("");
    setFinalPdfNotes("");
    setDishes([createDish()]);
    setMealGenerationTargets(createDefaultGenerationTargets());
    setActiveMealSectionFilter("Todos");
    setCategoryPageMap({});
    setSelectedPatient(null);
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Borrador reiniciado.");
  };

  const buildPdfData = () => ({
    title: title.trim() || DEFAULT_TITLE,
    dietName: dietName.trim() || DEFAULT_DIET_NAME,
    patientName: selectedPatient?.fullName || null,
    nutritionistNotes: nutritionistNotes.trim() || undefined,
    allowedFoodsMain: parseLines(allowedFoodsMainText),
    restrictedFoods: parseLines(restrictedFoodsText),
    specialConsiderations: specialConsiderations.trim() || undefined,
    finalNotes: finalPdfNotes.trim() || undefined,
    dishes: dishes.map((dish) => ({
      title: dish.title,
      mealSection: dish.mealSection,
      description: dish.description,
      preparation: dish.preparation,
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
    setIsExportingPdf(true);
    try {
      const { downloadQuickRecipesPdf } = await import(
        "@/features/pdf/quickRecipesPdfExport"
      );
      await downloadQuickRecipesPdf(buildPdfData());
      toast.success("PDF de recetas descargado correctamente.");
    } catch (error) {
      console.error("PDF export error", error);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const actionDockItems: ActionDockItem[] = [
    {
      id: "patient",
      icon: selectedPatient ? User : UserPlus,
      label: selectedPatient ? `Paciente: ${selectedPatient.fullName}` : "Importar paciente",
      variant: "emerald",
      onClick: openPatientModal,
    },
    {
      id: "export-pdf",
      icon: Download,
      label: isExportingPdf ? "Exportando..." : "Exportar PDF",
      variant: "slate",
      onClick: handleExportPdf,
      disabled: isExportingPdf || isExportDisabled,
    },
    {
      id: "save",
      icon: Save,
      label: "Guardar creación",
      variant: "slate",
      onClick: () => {
        if (!title.trim()) {
          toast.error("Por favor ingresa un título antes de guardar.");
          return;
        }
        setIsSaveCreationModalOpen(true);
      },
    },
    {
      id: "import",
      icon: Library,
      label: "Importar creación",
      variant: "slate",
      onClick: () => setIsImportCreationModalOpen(true),
    },
    {
      id: "reset",
      icon: RotateCcw,
      label: "Reiniciar",
      variant: "rose",
      onClick: handleReset,
    },
  ];

  const mealSectionTabs = useMemo(() => {
    const ordered = MEAL_SECTIONS.filter((section) =>
      dishes.some((dish) => normalizeMealSectionKey(dish.mealSection) === normalizeMealSectionKey(section)),
    );
    const custom = Array.from(
      new Set(
        dishes
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
  }, [dishes]);

  const filteredDishesByCategory = useMemo(() => {
    if (activeMealSectionFilter === "Todos") return dishes;
    return dishes.filter(
      (dish) =>
        normalizeMealSectionKey(dish.mealSection) ===
        normalizeMealSectionKey(activeMealSectionFilter),
    );
  }, [activeMealSectionFilter, dishes]);

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
    .reduce((sum, target) => sum + Math.max(1, target.count || 1), 0);

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

  return (
    <>
      <ModuleLayout
        title="Rápido"
        description="Genera recetas rápidas reutilizando contexto clínico, restricciones y preferencias."
        step={{ number: "Express", label: "Receta rápida", icon: ChefHat, color: "text-amber-600" }}
        rightNavItems={actionDockItems}
        className="max-w-5xl"
        footer={
          <ModuleFooter>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Modo Express · Recetas reutilizables
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {isExportDisabled && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Faltan datos fundamentales (Paciente + Platos)</span>
                </div>
              )}
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-slate-200"
                onClick={() => setIsSaveCreationModalOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button
                className="h-11 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExportingPdf ? "Generando..." : "Descargar PDF"}
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Título de la creación
                </label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej: Plantilla express para paciente"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nombre de la dieta (PDF)
                </label>
                <Input
                  value={dietName}
                  onChange={(event) => setDietName(event.target.value)}
                  placeholder="Ej: Plan antiinflamatorio semanal"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
                  maxLength={120}
                />
              </div>
            </div>
            {!selectedPatient ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Puedes vincular paciente para incluir restricciones y características del
                  paciente (edad, sexo, peso/talla, objetivos y contexto clínico) en la
                  generación IA.
                </span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700">
                <User className="h-4 w-4" />
                {selectedPatient.fullName}
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="ml-1 text-indigo-400 hover:text-indigo-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Alimentos permitidos principales
                </label>
                <Textarea
                  value={allowedFoodsMainText}
                  onChange={(event) => setAllowedFoodsMainText(event.target.value)}
                  placeholder="Ej: pollo, huevo, yogurt griego, avena (uno por línea o separados por coma)"
                  className="min-h-[96px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Restricciones de alimentos
                </label>
                <Textarea
                  value={restrictedFoodsText}
                  onChange={(event) => setRestrictedFoodsText(event.target.value)}
                  placeholder="Ej: mariscos, frituras, lactosa (si hay paciente, se suman sus restricciones)"
                  className="min-h-[96px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Consideraciones especiales
              </label>
              <Textarea
                value={specialConsiderations}
                onChange={(event) => setSpecialConsiderations(event.target.value)}
                placeholder="Ej: máximo 20 min por preparación, usar ingredientes de bajo costo..."
                className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                maxLength={700}
              />
            </div>
            <p className="text-xs text-slate-500">
              Las instrucciones de arriba se usan directamente para generar con IA.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Notas del nutricionista (contexto IA)
            </label>
            <Textarea
              value={nutritionistNotes}
              onChange={(event) => setNutritionistNotes(event.target.value)}
              placeholder="Ej: enfocar en saciedad, preparaciones simples y adherencia alta."
              className="min-h-[84px] rounded-xl border-slate-200 bg-slate-50 text-sm"
              maxLength={700}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Notas finales para el PDF
            </label>
            <Textarea
              value={finalPdfNotes}
              onChange={(event) => setFinalPdfNotes(event.target.value)}
              placeholder="Ej: Recuerda hidratarte, prioriza consistencia y avisa cualquier molestia digestiva."
              className="min-h-[84px] rounded-xl border-slate-200 bg-slate-50 text-sm"
              maxLength={900}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-700">
                  Generar con IA segun instrucciones
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
                      {target.mealSection}
                    </span>
                    <Input
                      type="number"
                      min="1"
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => generateWithAi("single")}
                  disabled={isGenerating || isGeneratingWeekly}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generando..." : "Generar platos IA"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  onClick={() => generateWithAi("weekly")}
                  disabled={isGenerating || isGeneratingWeekly}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingWeekly ? "Generando..." : "Generar plan semanal IA"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mealSectionTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveMealSectionFilter(tab)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                    activeMealSectionFilter === tab
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
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
                  Pagina {Math.min(currentCategoryPage, totalCategoryPages)} de {totalCategoryPages}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDish}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Agregar plato
                </Button>
              </div>
            </div>

            {pagedDishes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No hay platos en esta categoria.
              </div>
            ) : (
              pagedDishes.map((dish, index) => (
              <div
                key={dish.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Plato{" "}
                    {(Math.min(currentCategoryPage, totalCategoryPages) - 1) *
                      DISHES_PER_CATEGORY_PAGE +
                      index +
                      1}
                  </span>
                  <button
                    onClick={() => removeDish(dish.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Nombre del plato
                      </label>
                      <Input
                        value={dish.title}
                        onChange={(event) => updateDish(dish.id, "title", event.target.value)}
                        placeholder="Ej: Bowl de quinoa con pollo"
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tiempo de comida
                      </label>
                      <select
                        value={dish.mealSection}
                        onChange={(event) =>
                          updateDish(dish.id, "mealSection", event.target.value)
                        }
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      >
                        {MEAL_SECTIONS.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Descripción
                    </label>
                    <Textarea
                      value={dish.description}
                      onChange={(event) =>
                        updateDish(dish.id, "description", event.target.value)
                      }
                      className="min-h-[64px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                      maxLength={400}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Preparación
                    </label>
                    <Textarea
                      value={dish.preparation}
                      onChange={(event) =>
                        updateDish(dish.id, "preparation", event.target.value)
                      }
                      className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50 text-sm"
                      maxLength={800}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Porción
                      </label>
                      <Input
                        value={dish.recommendedPortion}
                        onChange={(event) =>
                          updateDish(dish.id, "recommendedPortion", event.target.value)
                        }
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Rinde
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={dish.portions}
                        onChange={(event) =>
                          updateDish(dish.id, "portions", event.target.value)
                        }
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                      />
                    </div>
                    {(["calories", "protein", "carbs", "fats"] as const).map((macro) => (
                      <div key={macro}>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {macro === "calories"
                            ? "Kcal"
                            : macro === "protein"
                              ? "Prot. (g)"
                              : macro === "carbs"
                                ? "HC (g)"
                                : "Grasas (g)"}
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={dish[macro]}
                          onChange={(event) => updateDish(dish.id, macro, event.target.value)}
                          className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Ingredientes
                      </label>
                      <button
                        onClick={() => addIngredient(dish.id)}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <Plus className="h-3 w-3" />
                        Agregar
                      </button>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {dish.ingredients.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center gap-2">
                          <Input
                            value={ingredient.name}
                            onChange={(event) =>
                              updateIngredient(
                                dish.id,
                                ingredient.id,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Ingrediente"
                            className="h-9 flex-1 rounded-xl border-slate-200 bg-slate-50 text-sm"
                          />
                          <Input
                            value={ingredient.quantity}
                            onChange={(event) =>
                              updateIngredient(
                                dish.id,
                                ingredient.id,
                                "quantity",
                                event.target.value,
                              )
                            }
                            placeholder="Cantidad"
                            className="h-9 w-28 rounded-xl border-slate-200 bg-slate-50 text-sm"
                          />
                          <Input
                            value={ingredient.amount || ""}
                            onChange={(event) =>
                              updateIngredient(
                                dish.id,
                                ingredient.id,
                                "amount",
                                event.target.value,
                              )
                            }
                            placeholder="Monto"
                            className="h-9 w-24 rounded-xl border-slate-200 bg-slate-50 text-sm"
                          />
                          <Input
                            value={ingredient.unit || ""}
                            onChange={(event) =>
                              updateIngredient(
                                dish.id,
                                ingredient.id,
                                "unit",
                                event.target.value,
                              )
                            }
                            placeholder="Unidad"
                            className="h-9 w-20 rounded-xl border-slate-200 bg-slate-50 text-sm"
                          />
                          <button
                            onClick={() => removeIngredient(dish.id, ingredient.id)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </ModuleLayout>

      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Importar paciente">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Al importar un paciente, la IA considera restricciones y características personales
            como edad, sexo, peso/talla, objetivos y resumen clínico.
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Buscar paciente..."
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10"
            />
          </div>
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {isLoadingPatients ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No se encontraron pacientes.</p>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id || patient.fullName}
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <p className="truncate text-sm font-bold text-slate-800">{patient.fullName}</p>
                  {patient.email ? (
                    <p className="truncate text-xs text-slate-400">{patient.email}</p>
                  ) : null}
                </button>
              ))
            )}
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
        allowedTypes={["DIET", "RECIPE"]}
      />

    </>
  );
}





