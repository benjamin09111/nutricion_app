"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import Cookies from "js-cookie";
import {
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  Users,
  Lock,
  TrendingUp,
  Trash2,
  Plus,
  Calculator,
  Zap,
  Scale,
  Calendar,
  DollarSign,
  Info,
  AlertTriangle,
  Loader2,
  Save,
  FileCode,
  RotateCcw,
  Library,
  User,
  UserPlus,
  BookOpen,
  Search,
  AlertCircle,
  FileUp,
  Download,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCLP } from "@/lib/utils/currency";
import { useAdmin } from "@/context/AdminContext";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { DraftRestoreModal } from "@/components/shared/DraftRestoreModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import {
  buildProjectAwarePath,
  fetchCreation,
  fetchProject,
  saveCreation,
  updateProject,
} from "@/lib/workflow";


interface CartItem {
  id: string;
  producto: string;
  grupo: string;
  cantidadMes: number; // en kg o unidades
  frecuenciaSemanal: number;
  porcionGramos: number;
  carbohidratosPor100g: number;
  grasasPor100g: number;
  caloriasPor100g: number;
  proteinaPor100g: number;
  sugarsPor100g: number;
  fiberPor100g: number;
  sodiumPor100g: number;
  cholesterolPor100g?: number;
  potassiumPor100g?: number;
  vitaminAPor100g?: number;
  vitaminCPor100g?: number;
  calciumPor100g?: number;
  ironPor100g?: number;
  precioPorUnidad: number;
  unidad: string;
}

export type ExtraTarget = {
  id: string;
  name: string;
  target: number;
  unit: string;
  key: "sugars" | "fiber" | "sodium" | "cholesterol" | "potassium" | "vitaminA" | "vitaminC" | "calcium" | "iron"
};

const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: "1",
    producto: "Pechuga de Pollo",
    grupo: "Carnes",
    cantidadMes: 3,
    frecuenciaSemanal: 4,
    porcionGramos: 150,
    caloriasPor100g: 165,
    proteinaPor100g: 31,
    carbohidratosPor100g: 0,
    grasasPor100g: 3.6,
    sugarsPor100g: 0,
    fiberPor100g: 0,
    sodiumPor100g: 74,
    precioPorUnidad: 5500,
    unidad: "kg",
  },
  {
    id: "2",
    producto: "Arroz Grado 1",
    grupo: "Cereales",
    cantidadMes: 2,
    frecuenciaSemanal: 5,
    porcionGramos: 100,
    caloriasPor100g: 130,
    proteinaPor100g: 2.7,
    carbohidratosPor100g: 28,
    grasasPor100g: 0.3,
    sugarsPor100g: 0.1,
    fiberPor100g: 0.4,
    sodiumPor100g: 1,
    precioPorUnidad: 1200,
    unidad: "kg",
  },
  {
    id: "3",
    producto: "Manzanas",
    grupo: "Frutas",
    cantidadMes: 4,
    frecuenciaSemanal: 7,
    porcionGramos: 120,
    caloriasPor100g: 52,
    proteinaPor100g: 0.3,
    carbohidratosPor100g: 14,
    grasasPor100g: 0.2,
    sugarsPor100g: 10,
    fiberPor100g: 2.4,
    sodiumPor100g: 1,
    precioPorUnidad: 1500,
    unidad: "kg",
  },
];

export default function CartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const { role } = useAdmin();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [cartTargets, setCartTargets] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    timeframe: "dia" as "dia" | "semana" | "mes",
    extras: [] as ExtraTarget[]
  });
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  const [selectedMarket] = useState("Lider/Jumbo (Chile)");
  const [timeView, setTimeView] = useState<"dia" | "semana" | "mes">("semana");
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [searchResultFoods, setSearchResultFoods] = useState<any[]>([]);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [proteinSupplement, setProteinSupplement] = useState({
    enabled: false,
    gramsPerDay: 0,
  });

  // -- Import Patient Modal State --
  const [isImportPatientModalOpen, setIsImportPatientModalOpen] =
    useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  // -- Draft Restore Modal --
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftMeta, setDraftMeta] = useState<{ label: string; date?: string }>({ label: "" });

  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [cartSourceLabel, setCartSourceLabel] = useState("Recetas y porciones no asignadas");
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [hasRecipeSource, setHasRecipeSource] = useState(false);

  // -- Equivalent Selector State --
  const [isEquivalentModalOpen, setIsEquivalentModalOpen] = useState(false);
  const [selectedItemForEquivalent, setSelectedItemForEquivalent] = useState<CartItem | null>(null);
  const [equivalentSearchQuery, setEquivalentSearchQuery] = useState("");
  const [equivalentResults, setEquivalentResults] = useState<any[]>([]);
  const [isSearchingEquivalents, setIsSearchingEquivalents] = useState(false);
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

  const hasAssignedRecipes = (recipesContent: any) => {
    if (!recipesContent) return false;

    if (Array.isArray(recipesContent.ingredientHints) && recipesContent.ingredientHints.length > 0) {
      return true;
    }

    const weekSlots = recipesContent.weekSlots;
    if (!weekSlots || typeof weekSlots !== "object") return false;

    return Object.values(weekSlots).some((slots) =>
      Array.isArray(slots) && slots.some((slot: any) => Boolean(slot?.recipe)),
    );
  };

  const syncRecipeDependency = (draft: any) => {
    const enabled = hasAssignedRecipes(draft?.recipes);
    setHasRecipeSource(enabled);
    setCartSourceLabel(
      enabled
        ? "Generado desde Recetas y porciones"
        : "Recetas y porciones no asignadas",
    );
    return enabled;
  };

  const normalizeProteinSupplement = (value: any) => ({
    enabled: Boolean(value?.enabled),
    gramsPerDay: Math.max(0, Math.round(Number(value?.gramsPerDay) || 0)),
  });

  const getPatientTargetsFromCustomVariables = (patient: any) => {
    const vars = Array.isArray(patient?.customVariables) ? patient.customVariables : [];
    const read = (key: string) => Number(vars.find((item: any) => item.key === key)?.value);
    const calories = read("targetCalories");
    const protein = read("targetProtein");
    const carbs = read("targetCarbs");
    const fats = read("targetFats");
    if ([calories, protein, carbs, fats].some((value) => !Number.isFinite(value) || value <= 0)) {
      return null;
    }
    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    };
  };

  const getPatientActivityLevel = (patient: any) => {
    const vars = Array.isArray(patient?.customVariables) ? patient.customVariables : [];
    const raw = String(vars.find((item: any) => item.key === "activityLevel")?.value || "").toLowerCase();
    if (raw === "deportista") return "deportista";
    if (raw === "sedentario") return "sedentario";
    return undefined;
  };

  // -- Persistence: Draft Load/Save --
  useEffect(() => {
    if (projectIdFromUrl) {
      return;
    }

    const storedDraft = localStorage.getItem("nutri_active_draft");
    const alreadyDecided = sessionStorage.getItem("nutri_cart_draft_decided");
    if (!alreadyDecided && storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        const canUseRecipes = syncRecipeDependency(draft);
        setProteinSupplement(normalizeProteinSupplement(draft?.recipes?.proteinSupplement));
        if (draft.cart && draft.cart.items && draft.cart.items.length > 0) {
          setDraftMeta({
            label: `Carrito: ${draft.cart.items.length} alimento(s)`,
            date: draft.cart.updatedAt,
          });
          setShowDraftModal(true);
          // Load patient anyway
          const storedPatient = localStorage.getItem("nutri_patient");
          if (storedPatient) {
            try { setSelectedPatient(JSON.parse(storedPatient)); } catch (_) { }
          }
          return;
        }
        // No named cart draft — only hydrate automatically when recipes are already assigned
        const includedFoods = canUseRecipes
          ? draft.diet?.includedFoods ||
            (() => {
              try {
                const legacy = localStorage.getItem("currentDietStep");
                return legacy ? JSON.parse(legacy).includedFoods : null;
              } catch {
                return null;
              }
            })()
          : null;

        if (includedFoods && Array.isArray(includedFoods) && includedFoods.length > 0) {
          const recipeHints: Array<{ name: string; weeklyHits: number }> =
            draft.recipes?.ingredientHints || [];
          if (recipeHints.length === 0) {
            return;
          }
          setCartSourceLabel("Generado desde Recetas y porciones");

          const hintForFood = (foodName: string) => {
            const normalized = foodName.toLowerCase().trim();
            const match = recipeHints.find((hint) =>
              normalized.includes(hint.name) || hint.name.includes(normalized),
            );
            return match?.weeklyHits || 3;
          };

          const cartItems: CartItem[] = includedFoods.map((f: any) => ({
            id: f.id || `food-${Math.random()}`,
            producto: f.producto,
            grupo: f.grupo,
            cantidadMes: 0,
            frecuenciaSemanal: hintForFood(f.producto),
            porcionGramos: 100,
            carbohidratosPor100g: f.carbohydrates || f.carbs || 0,
            grasasPor100g: f.lipids || f.lipidos || 0,
            caloriasPor100g: f.calories || f.calorias || 0,
            proteinaPor100g: f.proteins || f.proteinas || 0,
            sugarsPor100g: f.sugars || 0,
            fiberPor100g: f.fiber || 0,
            sodiumPor100g: f.sodium || 0,
            cholesterolPor100g: f.cholesterol || 0,
            potassiumPor100g: f.potassium || 0,
            vitaminAPor100g: f.vitaminA || 0,
            vitaminCPor100g: f.vitaminC || 0,
            calciumPor100g: f.calcium || 0,
            ironPor100g: f.iron || 0,
            precioPorUnidad: f.price || f.precioPromedio || 1000,
            unidad: f.unidad || f.unit || "kg",
          }));
          setItems(cartItems.map((item) => ({
            ...item,
            cantidadMes: Number(((item.porcionGramos * item.frecuenciaSemanal * 4) / 1000).toFixed(2)),
          })));
          toast.success("Carrito generado usando Recetas y porciones.");
        }
      } catch (e) {
        console.error("Error loading cart draft", e);
      }
    }

    const storedPatient = localStorage.getItem("nutri_patient");
    if (storedPatient) {
      try {
        const parsed = JSON.parse(storedPatient);
        setSelectedPatient(parsed);
        if (parsed.customVariables && Array.isArray(parsed.customVariables)) {
          const cvs = parsed.customVariables;
          const getVal = (key: string) => Number(cvs.find((c: any) => c.key === key)?.value);
          const hasVal = (key: string) => cvs.some((c: any) => c.key === key);

          const presetKeys = ["targetCalories", "targetProtein", "targetCarbs", "targetFats", "targetTimeframe"];
          const rawExtras = cvs.filter((c: any) => !presetKeys.includes(c.key) && c.key.startsWith("target_"));

          setCartTargets({
            calories: hasVal("targetCalories") ? getVal("targetCalories") : 0,
            protein: hasVal("targetProtein") ? getVal("targetProtein") : 0,
            carbs: hasVal("targetCarbs") ? getVal("targetCarbs") : 0,
            fats: hasVal("targetFats") ? getVal("targetFats") : 0,
            timeframe: cvs.find((c: any) => c.key === "targetTimeframe")?.value || "dia",
            extras: rawExtras.map((e: any) => ({
              id: e.key,
              name: e.label,
              target: Number(e.value),
              unit: e.unit || "g",
              key: e.key.replace("target_", "") as any
            }))
          });
        }
      } catch (e) {
        console.error("Failed to parse stored patient", e);
      }
    }
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

        if (project.activeCartCreationId) {
          const creation = await fetchCreation(project.activeCartCreationId);
          if (creation?.content?.items) {
            setItems(creation.content.items);
          }
          if (creation?.content?.targets) {
            setCartTargets(creation.content.targets);
          }
          setProteinSupplement(normalizeProteinSupplement(creation?.content?.proteinSupplement));
          if (creation?.content?.selectedMarket) {
            setCartSourceLabel(`Proyecto: ${project.name}`);
          }
          return;
        }

        const [dietCreation, recipeCreation] = await Promise.all([
          project.activeDietCreationId
            ? fetchCreation(project.activeDietCreationId)
            : Promise.resolve(null),
          project.activeRecipeCreationId
            ? fetchCreation(project.activeRecipeCreationId)
            : Promise.resolve(null),
        ]);

        const nextDraft = {
          ...(JSON.parse(localStorage.getItem("nutri_active_draft") || "{}")),
          ...(dietCreation?.content ? { diet: dietCreation.content } : {}),
          ...(recipeCreation?.content ? { recipes: recipeCreation.content } : {}),
        };
        setProteinSupplement(normalizeProteinSupplement(recipeCreation?.content?.proteinSupplement));
        localStorage.setItem("nutri_active_draft", JSON.stringify(nextDraft));

        if (syncRecipeDependency(nextDraft) && dietCreation?.content && recipeCreation?.content) {
          handleImportCreation(recipeCreation);
          setCartSourceLabel(`Generado desde Recetas del proyecto ${project.name}`);
        }
      } catch (error) {
        console.error("Error loading project cart context", error);
        toast.error("No se pudo cargar el proyecto en Carrito.");
      }
    };

    loadProjectContext();
  }, [projectIdFromUrl]);

  // Auto-save to draft on changes — only update cart key, preserve diet/recipes
  useEffect(() => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draft = storedDraft ? JSON.parse(storedDraft) : {};
    draft.cart = {
      ...draft.cart,
      items,
      selectedMarket,
      targets: cartTargets,
      proteinSupplement,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
    syncRecipeDependency(draft);
  }, [items, selectedMarket, cartTargets, proteinSupplement]);

  // Totals logic
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    let sugars = 0;
    let fiber = 0;
    let sodium = 0;
    let cholesterol = 0;
    let potassium = 0;
    let vitaminA = 0;
    let vitaminC = 0;
    let calcium = 0;
    let iron = 0;

    items.forEach((item) => {
      const gramosDia = (item.porcionGramos * item.frecuenciaSemanal) / 7;

      calories += (gramosDia * (item.caloriasPor100g || 0)) / 100;
      protein += (gramosDia * (item.proteinaPor100g || 0)) / 100;
      carbs += (gramosDia * (item.carbohidratosPor100g || 0)) / 100;
      fats += (gramosDia * (item.grasasPor100g || 0)) / 100;
      sugars += (gramosDia * (item.sugarsPor100g || 0)) / 100;
      fiber += (gramosDia * (item.fiberPor100g || 0)) / 100;
      sodium += (gramosDia * (item.sodiumPor100g || 0)) / 100;

      // Otros y Vitaminas
      cholesterol += (gramosDia * (item.cholesterolPor100g || 0)) / 100;
      potassium += (gramosDia * (item.potassiumPor100g || 0)) / 100;
      vitaminA += (gramosDia * (item.vitaminAPor100g || 0)) / 100;
      vitaminC += (gramosDia * (item.vitaminCPor100g || 0)) / 100;
      calcium += (gramosDia * (item.calciumPor100g || 0)) / 100;
      iron += (gramosDia * (item.ironPor100g || 0)) / 100;
    });

    const scale = (val: number) => {
      const result = val * (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30); // Using 30 for standard business month
      return Number(result.toFixed(1)); // Keep 1 decimal for internal calculation
    };

    const supplementProtein = proteinSupplement.enabled
      ? proteinSupplement.gramsPerDay * (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30)
      : 0;

    return {
      calories: Math.round(scale(calories)), // Calories usually rounded
      protein: Number((scale(protein) + supplementProtein).toFixed(1)),
      carbs: scale(carbs),
      fats: scale(fats),
      sugars: scale(sugars),
      fiber: scale(fiber),
      sodium: scale(sodium),
      cholesterol: scale(cholesterol),
      potassium: scale(potassium),
      vitaminA: scale(vitaminA),
      vitaminC: scale(vitaminC),
      calcium: scale(calcium),
      iron: scale(iron),
    };
  }, [items, proteinSupplement, timeView]);

  const calculateExchangePortions = (item: CartItem) => {
    const {
      carbohidratosPor100g,
      proteinaPor100g,
      grasasPor100g,
      porcionGramos,
      grupo,
    } = item;
    const totalCarbs = (carbohidratosPor100g * porcionGramos) / 100;
    const totalProt = (proteinaPor100g * porcionGramos) / 100;
    const totalFat = (grasasPor100g * porcionGramos) / 100;

    const g = grupo.toLowerCase();

    // Estándar UDD/INTA Chile (Basado en el aporte predominante)
    if (
      g.includes("cereal") ||
      g.includes("pan") ||
      g.includes("legumbre") ||
      g.includes("tubérculo")
    ) {
      return { val: (totalCarbs / 30).toFixed(1), label: "Porc." }; // 30g CHO
    }
    if (g.includes("fruta")) {
      return { val: (totalCarbs / 15).toFixed(1), label: "Porc." }; // 15g CHO
    }
    if (g.includes("verdura")) {
      const factor = g.includes("libre") ? 2.5 : 5;
      return { val: (totalCarbs / factor).toFixed(1), label: "Porc." }; // 5g o 2.5g CHO
    }
    if (
      g.includes("carne") ||
      g.includes("huevo") ||
      g.includes("pescado") ||
      g.includes("proteína")
    ) {
      return { val: (totalProt / 11).toFixed(1), label: "Porc." }; // 11g PRO
    }
    if (g.includes("lácteo") || g.includes("leche") || g.includes("yogur")) {
      return { val: (totalProt / 8).toFixed(1), label: "Porc." }; // Promedio PRO para lácteos
    }
    if (
      g.includes("grasa") ||
      g.includes("aceite") ||
      g.includes("frutos secos")
    ) {
      return { val: (totalFat / 20).toFixed(1), label: "Porc." }; // 20g Lípidos (Bloque UDD)
    }
    if (g.includes("azúcar") || g.includes("miel") || g.includes("mermelada")) {
      return { val: (totalCarbs / 5).toFixed(1), label: "Porc." }; // 5g CHO
    }

    // Fallback dinámico si no hay grupo claro
    if (totalCarbs > totalProt && totalCarbs > totalFat)
      return { val: (totalCarbs / 30).toFixed(1), label: "Porc." };
    if (totalProt > totalCarbs && totalProt > totalFat)
      return { val: (totalProt / 11).toFixed(1), label: "Porc." };
    return { val: (totalFat / 20).toFixed(1), label: "Porc." };
  };

  const groupedItems = useMemo(() => {
    const groups: Record<
      string,
      (CartItem & { exchange: { val: string; label: string } })[]
    > = {};
    items.forEach((item) => {
      if (!groups[item.grupo]) groups[item.grupo] = [];
      groups[item.grupo].push({
        ...item,
        exchange: calculateExchangePortions(item),
      });
    });
    return groups;
  }, [items]);

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cantidadMes: numValue } : item,
      ),
    );
  };

  const handleFrequencyChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newFreq = numValue;
          const newQty = Number(
            ((item.porcionGramos * newFreq * 4) / 1000).toFixed(2),
          );
          return { ...item, frecuenciaSemanal: newFreq, cantidadMes: newQty };
        }
        return item;
      }),
    );
  };

  const handlePortionChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newPortion = numValue;
          const newQty = Number(
            ((newPortion * item.frecuenciaSemanal * 4) / 1000).toFixed(2),
          );
          return { ...item, porcionGramos: newPortion, cantidadMes: newQty };
        }
        return item;
      }),
    );
  };

  const safeDiv = (val: number, fallback: number) => val > 0 ? val : fallback;

  const handleExchangePortionChange = (item: CartItem, value: string) => {
    const targetPortions = parseFloat(value);
    // Allow empty during typing
    if (isNaN(targetPortions)) return;

    const {
      carbohidratosPor100g = 0,
      proteinaPor100g = 0,
      grasasPor100g = 0,
      grupo,
    } = item;
    const g = (grupo || "").toLowerCase();

    let newGrams = 0;

    if (g.includes("cereal") || g.includes("pan") || g.includes("legumbre") || g.includes("tubérculo")) {
      newGrams = (targetPortions * 30 * 100) / safeDiv(carbohidratosPor100g, 1);
    } else if (g.includes("fruta")) {
      newGrams = (targetPortions * 15 * 100) / safeDiv(carbohidratosPor100g, 1);
    } else if (g.includes("verdura")) {
      const factor = g.includes("libre") ? 2.5 : 5;
      newGrams = (targetPortions * factor * 100) / safeDiv(carbohidratosPor100g, 1);
    } else if (g.includes("carne") || g.includes("huevo") || g.includes("pescado") || g.includes("proteína")) {
      newGrams = (targetPortions * 11 * 100) / safeDiv(proteinaPor100g, 1);
    } else if (g.includes("lácteo") || g.includes("leche") || g.includes("yogur")) {
      newGrams = (targetPortions * 8 * 100) / safeDiv(proteinaPor100g, 1);
    } else if (g.includes("grasa") || g.includes("aceite") || g.includes("frutos secos")) {
      newGrams = (targetPortions * 20 * 100) / safeDiv(grasasPor100g, 1);
    } else if (g.includes("azúcar") || g.includes("miel") || g.includes("mermelada")) {
      newGrams = (targetPortions * 5 * 100) / safeDiv(carbohidratosPor100g, 1);
    } else {
      if (carbohidratosPor100g > proteinaPor100g && carbohidratosPor100g > grasasPor100g) {
        newGrams = (targetPortions * 30 * 100) / safeDiv(carbohidratosPor100g, 1);
      } else if (proteinaPor100g > carbohidratosPor100g && proteinaPor100g > grasasPor100g) {
        newGrams = (targetPortions * 11 * 100) / safeDiv(proteinaPor100g, 1);
      } else {
        newGrams = (targetPortions * 20 * 100) / safeDiv(grasasPor100g, 1);
      }
    }

    newGrams = Math.round(newGrams);

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const newQty = Number(
            ((newGrams * i.frecuenciaSemanal * 4) / 1000).toFixed(2),
          );
          return { ...i, porcionGramos: newGrams, cantidadMes: newQty };
        }
        return i;
      }),
    );
  };

  const handleSwapFood = (oldItemId: string, newFood: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === oldItemId) {
          // Calculate new grams based on old exchange portions to maintain the target
          const oldExchangeVal = parseFloat(calculateExchangePortions(item).val);

          const carbs = newFood.carbohydrates || newFood.carbs || 0;
          const prot = newFood.proteins || newFood.proteinas || 0;
          const fat = newFood.lipids || newFood.lipidos || 0;
          const g = (newFood.grupo || "").toLowerCase();

          let newGrams = 0;
          if (g.includes("cereal") || g.includes("pan") || g.includes("legumbre") || g.includes("tubérculo")) {
            newGrams = (oldExchangeVal * 30 * 100) / safeDiv(carbs, 1);
          } else if (g.includes("fruta")) {
            newGrams = (oldExchangeVal * 15 * 100) / safeDiv(carbs, 1);
          } else if (g.includes("verdura")) {
            const factor = g.includes("libre") ? 2.5 : 5;
            newGrams = (oldExchangeVal * factor * 100) / safeDiv(carbs, 1);
          } else if (g.includes("carne") || g.includes("huevo") || g.includes("pescado") || g.includes("proteína")) {
            newGrams = (oldExchangeVal * 11 * 100) / safeDiv(prot, 1);
          } else if (g.includes("lácteo") || g.includes("leche") || g.includes("yogur")) {
            newGrams = (oldExchangeVal * 8 * 100) / safeDiv(prot, 1);
          } else if (g.includes("grasa") || g.includes("aceite") || g.includes("frutos secos")) {
            newGrams = (oldExchangeVal * 20 * 100) / safeDiv(fat, 1);
          } else if (g.includes("azúcar") || g.includes("miel") || g.includes("mermelada")) {
            newGrams = (oldExchangeVal * 5 * 100) / safeDiv(carbs, 1);
          } else {
            newGrams = (oldExchangeVal * 30 * 100) / safeDiv(carbs, 1);
          }

          newGrams = Math.round(newGrams);
          const newQty = Number(((newGrams * item.frecuenciaSemanal * 4) / 1000).toFixed(2));

          return {
            ...item,
            producto: newFood.producto,
            carbohidratosPor100g: carbs,
            proteinaPor100g: prot,
            grasasPor100g: fat,
            caloriasPor100g: newFood.calories || newFood.calorias || 0,
            precioPorUnidad: newFood.price || newFood.precioPromedio || 1000,
            porcionGramos: newGrams,
            cantidadMes: newQty,
          };
        }
        return item;
      }),
    );
    setIsEquivalentModalOpen(false);
    toast.success("Alimento intercambiado manteniendo porciones");
  };

  const searchEquivalents = async (query: string, group: string) => {
    if (!query && !group) return;
    setIsSearchingEquivalents(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/foods/search?q=${encodeURIComponent(query)}&group=${encodeURIComponent(group)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEquivalentResults(data);
      }
    } catch (e) {
      console.error("Error searching equivalents", e);
    } finally {
      setIsSearchingEquivalents(false);
    }
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

    // Update cart targets in real time
    if (patient.customVariables && Array.isArray(patient.customVariables)) {
      const cvs = patient.customVariables;
      const getVal = (key: string) => Number(cvs.find((c: any) => c.key === key)?.value);
      const hasVal = (key: string) => cvs.some((c: any) => c.key === key);

      const presetKeys = ["targetCalories", "targetProtein", "targetCarbs", "targetFats", "targetTimeframe"];
      const rawExtras = cvs.filter((c: any) => !presetKeys.includes(c.key) && c.key.startsWith("target_"));

      setCartTargets({
        calories: hasVal("targetCalories") ? getVal("targetCalories") : 0,
        protein: hasVal("targetProtein") ? getVal("targetProtein") : 0,
        carbs: hasVal("targetCarbs") ? getVal("targetCarbs") : 0,
        fats: hasVal("targetFats") ? getVal("targetFats") : 0,
        timeframe: cvs.find((c: any) => c.key === "targetTimeframe")?.value || "dia",
        extras: rawExtras.map((e: any) => ({
          id: e.key,
          name: e.label,
          target: Number(e.value),
          unit: e.unit || "g",
          key: e.key.replace("target_", "") as any
        }))
      });
    }

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
      activityLevel: getPatientActivityLevel(patient),
      nutritionGoals: getPatientTargetsFromCustomVariables(patient),
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
    toast.info("Paciente desvinculado de esta sesión");
  };

  const removeItem = (id: string) => {
    const itemToRemove = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.info(`${itemToRemove?.producto} eliminado del carrito.`);
  };

  const handleAddFoodFromSearch = (food: any) => {
    const newItem: CartItem = {
      id: `manual-${Date.now()}`,
      producto: food.name || food.producto,
      grupo: food.category?.name || food.grupo || "Varios",
      cantidadMes: 0,
      frecuenciaSemanal: 1,
      porcionGramos: 100,
      carbohidratosPor100g: food.carbs || 0,
      grasasPor100g: food.lipids || 0,
      caloriasPor100g: food.calories || 0,
      proteinaPor100g: food.proteins || 0,
      sugarsPor100g: food.sugars || 0,
      fiberPor100g: food.fiber || 0,
      sodiumPor100g: food.sodium || 0,
      cholesterolPor100g: food.cholesterol || 0,
      potassiumPor100g: food.potassium || 0,
      vitaminAPor100g: food.vitaminA || 0,
      vitaminCPor100g: food.vitaminC || 0,
      calciumPor100g: food.calcium || 0,
      ironPor100g: food.iron || 0,
      precioPorUnidad: food.price || 0,
      unidad: food.unit || "kg",
    };

    // Calculate monthly quantity
    newItem.cantidadMes = Number(
      ((newItem.porcionGramos * newItem.frecuenciaSemanal * 4) / 1000).toFixed(
        2,
      ),
    );

    setItems((prev) => [...prev, newItem]);
    setIsAddFoodModalOpen(false);
    setFoodSearchQuery("");
    toast.success(`${newItem.producto} añadido al carrito.`);
  };

  // Search effect (reused from DietClient)
  useEffect(() => {
    if (!isAddFoodModalOpen || !foodSearchQuery.trim()) {
      setSearchResultFoods([]);
      setIsSearchingFoods(false);
      return;
    }

    const fetchFoods = async (retries = 2) => {
      setIsSearchingFoods(true);
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      try {
        const res = await fetchApi(
          `/foods?search=${foodSearchQuery}&limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResultFoods(data);
        }
      } catch (e) {
        if (retries > 0) {
          setTimeout(() => fetchFoods(retries - 1), 1000);
        } else {
          console.warn("Error buscando alimentos (backend no disponible)");
        }
      } finally {
        setIsSearchingFoods(false);
      }
    };

    const timeoutId = setTimeout(fetchFoods, 300);
    return () => clearTimeout(timeoutId);
  }, [isAddFoodModalOpen, foodSearchQuery]);

  const saveCartToStorage = (updatedItems?: CartItem[]) => {
    const storedDraft = localStorage.getItem("nutri_active_draft");
    const draft = storedDraft ? JSON.parse(storedDraft) : {};
    draft.cart = {
      ...draft.cart,
      items: updatedItems || items,
      totals,
      targets: cartTargets,
      proteinSupplement,
      selectedPatient,
      selectedMarket,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
  };

  const buildCartCreationPayload = (
    updatedItems?: CartItem[],
    description?: string,
  ) => {
    const nextItems = updatedItems || items;
    return {
      name:
        selectedPatient?.fullName
          ? `Carrito ${selectedPatient.fullName}`
          : `Carrito ${new Date().toLocaleDateString("es-CL")}`,
      type: "SHOPPING_LIST" as const,
      content: {
        items: nextItems,
        totals,
        targets: cartTargets,
        proteinSupplement,
        selectedPatient,
        selectedMarket,
        sourceLabel: cartSourceLabel,
        updatedAt: new Date().toISOString(),
      },
      metadata: {
        ...(description?.trim()
          ? { description: description.trim() }
          : {}),
        itemCount: nextItems.length,
        totalCalories: totals.calories,
        ...(selectedPatient
          ? {
              patientId: selectedPatient.id,
              patientName: selectedPatient.fullName,
            }
          : {}),
      },
      tags: [],
    };
  };

  const persistCartCreation = async (
    updatedItems?: CartItem[],
    description?: string,
  ) => {
    const savedCreation = await saveCreation(
      buildCartCreationPayload(updatedItems, description),
    );

    if (currentProjectId) {
      await updateProject(currentProjectId, {
        activeCartCreationId: savedCreation.id,
        patientId: selectedPatient?.id,
        metadata: {
          sourceModule: "cart",
          lastCartSource: cartSourceLabel,
        },
      });
    }

    return savedCreation;
  };

  const handleFinalize = async () => {
    if (!hasRecipeSource) {
      toast.error("Faltan Recetas y porciones", {
        description: "Importa o completa Recetas y porciones antes de usar Carrito.",
      });
      return;
    }

    saveCartToStorage();
    try {
      await persistCartCreation();
      sessionStorage.setItem("nutri_deliverable_draft_decided", "keep");
      toast.success("Carrito finalizado. Pasando al Entregable...");
      setTimeout(
        () =>
          router.push(
            buildProjectAwarePath("/dashboard/entregable", currentProjectId),
          ),
        1000,
      );
    } catch (error: any) {
      console.error("Error finalizing cart", error);
      toast.error(error?.message || "No se pudo guardar el carrito.");
    }
  };

  const printJson = () => {
    console.group("📊 CART / CARRO DATA");
    console.log("Items en Carrito:", items);
    console.log("Totales Calculados:", totals);
    if (selectedPatient) console.log("Paciente Vinculado:", selectedPatient);
    console.groupEnd();
    toast.info("JSON del carrito impreso en consola.");
  };

  const clearCart = () => {
    setItems([]);
    setCartSourceLabel("Recetas y porciones no asignadas");
    // Clear cart from global draft
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        delete draft.cart;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
      } catch (_) { }
    }
    localStorage.removeItem("currentCartStep");
    toast.info("Carrito vaciado.");
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
          fetchPatients();
        },
      },
      {
        id: "export-json",
        icon: FileCode,
        label: "Imprimir JSON",
        variant: "slate",
        onClick: printJson,
        disabled: !hasRecipeSource,
      },
      {
        id: "export-pdf",
        icon: Download,
        label: "Exportar PDF",
        variant: "slate",
        onClick: () => toast.info("PDF del carrito disponible en la etapa Entregable."),
        disabled: !hasRecipeSource,
      },
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar Todo",
        variant: "rose",
        onClick: clearCart,
        disabled: !hasRecipeSource,
      },
    ],
    [printJson, clearCart, selectedPatient, items, totals, cartTargets, currentProjectId, cartSourceLabel, hasRecipeSource],
  );

  const handleKeepDraft = () => {
    sessionStorage.setItem("nutri_cart_draft_decided", "keep");
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        if (draft.cart?.items) setItems(draft.cart.items);
      } catch (_) { }
    }
    setShowDraftModal(false);
  };

  const handleDiscardDraft = () => {
    sessionStorage.setItem("nutri_cart_draft_decided", "discard");
    const storedDraft = localStorage.getItem("nutri_active_draft");
    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        delete draft.cart;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
      } catch (_) { }
    }
    setItems([]);
    setShowDraftModal(false);
  };

  const handleImportCreation = (creation: any) => {
    try {
      const { type, content } = creation;
      const storedDraft = localStorage.getItem("nutri_active_draft");
      const draft = storedDraft ? JSON.parse(storedDraft) : {};

      if (type === "RECIPE") {
        draft.recipes = content;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));

        if (!syncRecipeDependency(draft)) {
          toast.error("La planificación importada no tiene platos asignados.");
          return;
        }

        const dietContent = draft.diet || {};
        const includedFoods =
          dietContent.foods || dietContent.includedFoods || dietContent.manualAdditions || [];

        if (!Array.isArray(includedFoods) || includedFoods.length === 0) {
          toast.error("Falta la dieta base", {
            description: "Para construir el carrito desde Recetas y porciones también necesitamos la dieta importada.",
          });
          return;
        }

        const recipeHints: Array<{ name: string; weeklyHits: number }> =
          content.ingredientHints || [];

        const hintForFood = (foodName: string) => {
          const normalized = foodName.toLowerCase().trim();
          const match = recipeHints.find((hint) =>
            normalized.includes(hint.name) || hint.name.includes(normalized),
          );
          return match?.weeklyHits || 3;
        };

        const cartItems: CartItem[] = includedFoods.map((f: any) => {
          const groupName =
            f.grupo ||
            f.group ||
            (typeof f.category === "string" ? f.category : f.category?.name) ||
            "Varios";

          return {
            id: f.id || `food-${Date.now()}-${Math.random()}`,
            producto: f.producto || f.name || "Alimento sin nombre",
            grupo: groupName,
            cantidadMes: 0,
            frecuenciaSemanal: hintForFood(f.producto || f.name || ""),
            porcionGramos: 100,
            carbohidratosPor100g: f.carbohidratos || f.carbohydrates || f.carbs || 0,
            grasasPor100g: f.lipidos || f.lipids || f.grasas || 0,
            caloriasPor100g: f.calorias || f.calories || 0,
            proteinaPor100g: f.proteinas || f.proteins || 0,
            sugarsPor100g: f.azucares || f.sugars || 0,
            fiberPor100g: f.fibra || f.fiber || 0,
            sodiumPor100g: f.sodio || f.sodium || 0,
            cholesterolPor100g: f.colesterol || f.cholesterol || 0,
            potassiumPor100g: f.potasio || f.potassium || 0,
            vitaminAPor100g: f.vitaminaA || f.vitaminA || 0,
            vitaminCPor100g: f.vitaminaC || f.vitaminC || 0,
            calciumPor100g: f.calcio || f.calcium || 0,
            ironPor100g: f.hierro || f.iron || 0,
            precioPorUnidad: f.precioPromedio || f.price || 0,
            unidad: f.unidad || f.unit || "kg",
          };
        });

        setItems(
          cartItems.map((item) => ({
            ...item,
            cantidadMes: Number(
              ((item.porcionGramos * item.frecuenciaSemanal * 4) / 1000).toFixed(2),
            ),
          })),
        );

        if (content.targets) {
          const t = content.targets;
          setCartTargets((prev) => ({
            ...prev,
            calories: t.calories || prev.calories,
            protein: t.protein || prev.protein,
            carbs: t.carbs || prev.carbs,
            fats: t.fats || prev.fats,
          }));
        }
        setProteinSupplement(normalizeProteinSupplement(content.proteinSupplement));

        setCartSourceLabel(`Generado desde Recetas y porciones: ${creation.name}`);
        toast.success(`Recetas "${creation.name}" importadas al carrito.`);
        return;
      }

      // If importing a DIET, we take the includedFoods
      if (type === "DIET") {
        draft.diet = content;
        localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
        syncRecipeDependency(draft);
        toast.info("Dieta importada", {
          description: "Ahora importa Recetas y porciones para habilitar el carrito.",
        });
        return;

      }
      // If importing a SHOPPING_LIST (CART), we take the items directly
      else if (type === "SHOPPING_LIST") {
        if (content.items && Array.isArray(content.items)) {
          setItems(content.items);
          if (content.targets) setCartTargets(content.targets);
          setProteinSupplement(normalizeProteinSupplement(content.proteinSupplement));
          setHasRecipeSource(true);
          setCartSourceLabel(`Carrito importado: ${creation.name}`);
          toast.success(`Carrito "${creation.name}" importado.`);
        } else {
          toast.error("El carrito importado no tiene el formato correcto.");
        }
      }
      // If importing dynamic targets from RECIPE
      else if (type === "RECIPE") {
        if (content.targets) {
          const t = content.targets;
          setCartTargets(prev => ({
            ...prev,
            calories: t.calories || prev.calories,
            protein: t.protein || prev.protein,
            carbs: t.carbs || prev.carbs,
            fats: t.fats || prev.fats,
          }));
          toast.success(`Metas sincronizadas desde Recetas: "${creation.name}"`);
        } else {
          toast.info(`La receta "${creation.name}" se importó, pero no tenía metas nutricionales.`);
        }
      }
    } catch (e) {
      console.error("Error importing creation", e);
      toast.error("Ocurrió un error al importar la creación.");
    }
  };

  return (
    <>
      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={handleImportCreation}
        defaultType="RECIPE"
      />

      <Modal
        isOpen={isEquivalentModalOpen}
        onClose={() => setIsEquivalentModalOpen(false)}
        title="Intercambio de Equivalentes"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Original</p>
            <p className="text-sm font-bold text-slate-700">{selectedItemForEquivalent?.producto}</p>
            <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">{selectedItemForEquivalent?.grupo}</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Buscar en ${selectedItemForEquivalent?.grupo}...`}
              value={equivalentSearchQuery}
              onChange={(e) => {
                setEquivalentSearchQuery(e.target.value);
                searchEquivalents(e.target.value, selectedItemForEquivalent?.grupo || "");
              }}
              className="pl-11 h-12 rounded-xl border-slate-200 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {isSearchingEquivalents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              equivalentResults.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleSwapFood(selectedItemForEquivalent!.id, food)}
                  className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{food.producto}</p>
                    <div className="flex gap-2 text-[10px] text-slate-500 font-bold uppercase mt-1">
                      <span>{food.calories || food.calorias} kcal</span>
                      <span>•</span>
                      <span>P: {food.proteins || food.proteinas}g</span>
                      <span>•</span>
                      <span>C: {food.carbohydrates || food.carbs}g</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
            {!isSearchingEquivalents && equivalentResults.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400 font-bold">No se encontraron equivalentes.</p>
            )}
          </div>
        </div>
      </Modal>
      <DraftRestoreModal
        isOpen={showDraftModal}
        moduleName="Carrito"
        draftLabel={draftMeta.label}
        draftDate={draftMeta.date}
        onKeep={handleKeepDraft}
        onDiscard={handleDiscardDraft}
      />

      <ModuleLayout
        title="Carrito Inteligente"
        description="Genera automáticamente la lista de compra desde Dieta y Recetas."
        step={{
          number: 2,
          label: "Cantidades & Compras",
          icon: ShoppingCart,
          color: "text-indigo-600",
        }}
        rightNavItems={actionDockItems}
        footer={
          <ModuleFooter>
            <div className="flex items-center gap-8">
              {/* Time View Selector in Footer */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                {(["dia", "semana", "mes"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setTimeView(view)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      timeView === view
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {view === "dia" ? "D" : view === "semana" ? "S" : "M"}
                  </button>
                ))}
              </div>

              {/* Nutritional Summary */}
              <div className="flex items-center gap-6">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Proteínas Totales
                  </p>
                  <p className="text-xl font-black text-emerald-600 flex items-baseline gap-1">
                    {totals.protein}
                    <span className="text-[10px] text-slate-400 uppercase">
                      g
                    </span>
                    <span className="text-[9px] text-slate-300 font-medium lowercase ml-1">
                      /{" "}
                      {timeView === "dia"
                        ? "día"
                        : timeView === "semana"
                          ? "semana"
                          : "mes"}
                    </span>
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Calorías Totales
                  </p>
                  <p className="text-xl font-black text-amber-600 flex items-baseline gap-1">
                    {totals.calories}
                    <span className="text-[10px] text-slate-400 uppercase">
                      kcal
                    </span>
                    <span className="text-[9px] text-slate-300 font-medium lowercase ml-1">
                      /{" "}
                      {timeView === "dia"
                        ? "día"
                        : timeView === "semana"
                          ? "semana"
                          : "mes"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                className="h-12 px-8 bg-slate-900"
                disabled={!hasRecipeSource}
                onClick={() => setIsSaveCreationModalOpen(true)}
              >
                Guardar Creación
              </Button>
              <Button
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95"
                disabled={!hasRecipeSource}
                onClick={handleFinalize}
              >
                Continuar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={currentProjectName}
          patientName={selectedPatient?.fullName || null}
          mode={currentProjectMode}
          moduleLabel="Carrito"
        />
        {!hasRecipeSource ? (
          <div className="mb-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
                  Recetas requeridas
                </p>
                <p className="text-sm font-medium text-amber-900">
                  Carrito depende de Recetas y porciones. Importa esa planificación antes de generar o editar la lista de compras.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsImportCreationModalOpen(true)}
                  className="rounded-2xl border-amber-200 bg-white font-bold text-amber-900"
                >
                  <Library className="mr-2 h-4 w-4" />
                  Importar recetas
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      buildProjectAwarePath("/dashboard/recetas", currentProjectId),
                    )
                  }
                  className="rounded-2xl border-amber-200 bg-white font-bold text-amber-900"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Ir a Recetas
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <div className={cn(!hasRecipeSource && "pointer-events-none opacity-55 select-none")}>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
              {cartSourceLabel}
            </span>
          </div>
          {proteinSupplement.enabled ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Suplemento activo: +{proteinSupplement.gramsPerDay}g proteína/día
              </span>
            </div>
          ) : null}
        </div>

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

        {/* Nutritional Targets Pane */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 mb-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              Metas Nutricionales
            </h3>
            {isEditingTargets ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-8 text-xs font-bold text-slate-500" onClick={() => setIsEditingTargets(false)}>Cerrar</Button>
                <Button className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                  setIsEditingTargets(false);
                  // Optionally save targets back to patient if needed
                  toast.success("Metas actualizadas para esta sesión de Carrito");
                }}>Guardar</Button>
              </div>
            ) : (
              <Button variant="ghost" className="h-8 text-[10px] uppercase font-black tracking-widest text-emerald-600 hover:bg-emerald-50" onClick={() => setIsEditingTargets(true)}>
                Ajustar Metas
              </Button>
            )}
          </div>

          {isEditingTargets ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Calorías (kcal)</label>
                  <Input type="number" value={cartTargets.calories} onChange={e => setCartTargets(p => ({ ...p, calories: Number(e.target.value) }))} className="font-black text-amber-600 border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Proteína (g)</label>
                  <Input type="number" value={cartTargets.protein} onChange={e => setCartTargets(p => ({ ...p, protein: Number(e.target.value) }))} className="font-black text-emerald-600 border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Carbohidratos (g)</label>
                  <Input type="number" value={cartTargets.carbs} onChange={e => setCartTargets(p => ({ ...p, carbs: Number(e.target.value) }))} className="font-black text-blue-600 border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Grasas (g)</label>
                  <Input type="number" value={cartTargets.fats} onChange={e => setCartTargets(p => ({ ...p, fats: Number(e.target.value) }))} className="font-black text-purple-600 border-slate-200" />
                </div>
                <div className="space-y-1 col-span-2 md:col-span-4">
                  <label className="text-[10px] font-black uppercase text-slate-400">Temporalidad Original de estas Metas</label>
                  <select
                    value={cartTargets.timeframe}
                    onChange={e => setCartTargets(p => ({ ...p, timeframe: e.target.value as any }))}
                    className="w-full h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 px-3"
                  >
                    <option value="dia">Diario (Meta / Día)</option>
                    <option value="semana">Semanal (Meta / Semana)</option>
                    <option value="mes">Mensual (Meta / Mes)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black uppercase text-slate-400">Metas Adicionales</label>
                  <Button variant="outline" className="h-7 text-[10px] uppercase font-black" onClick={() => {
                    const newId = Date.now().toString();
                    setCartTargets(p => ({ ...p, extras: [...p.extras, { id: newId, name: "Nueva Meta", target: 0, unit: "g", key: "sugars" }] }));
                  }}>
                    <Plus className="w-3 h-3 mr-1" /> Añadir
                  </Button>
                </div>
                <div className="space-y-3">
                  {cartTargets.extras.map((extra, idx) => (
                    <div key={extra.id} className="flex items-center gap-3">
                      <Input value={extra.name} onChange={e => {
                        const next = [...cartTargets.extras];
                        next[idx].name = e.target.value;
                        setCartTargets(p => ({ ...p, extras: next }));
                      }} placeholder="Nombre (Ej: Fibra)" className="w-1/3 text-xs font-bold border-slate-200" />
                      <select value={extra.key} onChange={e => {
                        const next = [...cartTargets.extras];
                        next[idx].key = e.target.value as any;
                        setCartTargets(p => ({ ...p, extras: next }));
                      }} className="w-1/4 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 px-3">
                        <option value="sugars">Azúcares</option>
                        <option value="fiber">Fibra</option>
                        <option value="sodium">Sodio</option>
                        <option value="cholesterol">Colesterol</option>
                        <option value="potassium">Potasio</option>
                        <option value="vitaminA">Vitamina A</option>
                        <option value="vitaminC">Vitamina C</option>
                        <option value="calcium">Calcio</option>
                        <option value="iron">Hierro</option>
                      </select>
                      <Input type="number" value={extra.target} onChange={e => {
                        const next = [...cartTargets.extras];
                        next[idx].target = Number(e.target.value);
                        setCartTargets(p => ({ ...p, extras: next }));
                      }} className="w-24 text-center font-black" />
                      <Input value={extra.unit} onChange={e => {
                        const next = [...cartTargets.extras];
                        next[idx].unit = e.target.value;
                        setCartTargets(p => ({ ...p, extras: next }));
                      }} placeholder="Und (g)" className="w-16 text-center text-xs font-bold" />
                      <Button variant="ghost" className="text-rose-500 hover:bg-rose-50 p-2 h-auto" onClick={() => {
                        const next = [...cartTargets.extras].filter((_, i) => i !== idx);
                        setCartTargets(p => ({ ...p, extras: next }));
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {cartTargets.extras.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium italic">No hay metas adicionales. Añade una para trackear azúcares, sodio, fibra, etc.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div className="space-y-1 border-r border-slate-100 pr-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Ver Datos</p>
                <select
                  value={timeView}
                  onChange={e => setTimeView(e.target.value as any)}
                  className="bg-transparent border-none text-slate-700 font-black focus:ring-0 p-0 hover:bg-slate-50 rounded"
                >
                  <option value="dia">Diario</option>
                  <option value="semana">Semanal</option>
                  <option value="mes">Mensual</option>
                </select>
              </div>

              {[
                { label: "Calorías", target: cartTargets.calories, val: totals.calories, unit: "kcal", color: "text-amber-500", rawKey: 'calories' },
                { label: "Proteínas", target: cartTargets.protein, val: totals.protein, unit: "g", color: "text-emerald-500", rawKey: 'protein' },
                { label: "Carbos", target: cartTargets.carbs, val: totals.carbs, unit: "g", color: "text-blue-500", rawKey: 'carbs' },
                { label: "Grasas", target: cartTargets.fats, val: totals.fats, unit: "g", color: "text-purple-500", rawKey: 'fats' },
                ...cartTargets.extras.map(e => ({
                  label: e.name,
                  target: e.target,
                  val: totals[e.key as keyof typeof totals] || 0,
                  unit: e.unit,
                  color: "text-indigo-500",
                  rawKey: e.key
                }))
              ].map((stat, idx) => {
                // Normalize target based on TimeView. If Cart is viewing "semana" but Target is "dia", target * 7.
                const factor = cartTargets.timeframe === "dia"
                  ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30)
                  : cartTargets.timeframe === "semana"
                    ? (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)
                    : (timeView === "dia" ? 1 / 30 : timeView === "semana" ? 7 / 30 : 1);
                const normalizedTarget = stat.target * factor;
                const progress = normalizedTarget > 0 ? (stat.val / normalizedTarget) * 100 : 0;
                const isOver = progress > 105;

                return (
                  <div key={idx} className="space-y-1.5 min-w-[100px]">
                    <div className="flex justify-between items-end gap-2">
                      <p className="text-[10px] font-black uppercase text-slate-500 truncate" title={stat.label}>{stat.label}</p>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                        {stat.rawKey === 'calories' ? Math.round(stat.val) : stat.val} {normalizedTarget > 0 ? `/ ${Math.round(normalizedTarget)}${stat.unit}` : stat.unit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500", isOver ? "bg-rose-500" : stat.color.replace('text-', 'bg-'))}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-bold group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Volver a Dieta Base
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Time view selector moved to footer for standard layout */}
          </div>
        </div>

        {/* Exchange Portions Guide Banner */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-4 flex gap-4 items-start shadow-sm mb-6">
          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-1">
              Calculadora de Intercambios (Estándar UDD/INTA Chile)
            </h4>
            <p className="text-xs text-indigo-700/80 font-medium leading-relaxed mb-1">
              Traduce automáticamente los gramos a "Porciones de Intercambio".
              Este cálculo es específico para el estándar chileno de la pirámide
              alimentaria.
            </p>
            <p className="text-[10px] text-indigo-600/60 font-medium leading-relaxed mb-4">
              <strong>Lógica UDD:</strong> Cereales y Pan (30g CHO) • Carnes y
              Proteínas (11g PRO) • Frutas (15g CHO) • Verduras (5g CHO) • Grasas
              (20g LIP).
            </p>
            <div className="flex flex-wrap items-center gap-4 border-t border-indigo-100 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-black text-slate-600 uppercase">
                  🟡 Cereales/Pan (~30g CHO)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-600 uppercase">
                  🟢 Proteínas (~11g PRO)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black text-slate-600 uppercase">
                  🔴 Grasas/Aceites (~20g LIP)
                </span>
              </div>

              <div className="ml-auto">
                <button
                  onClick={() => setIsReferenceOpen(true)}
                  className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-800 transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  Ver manual de referencia UDD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Shopping List / Quantification Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Alimento
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Compra Mes
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">
                    Frecuencia / Pauta
                    <p className="font-medium text-[8px] text-slate-400 normal-case tracking-normal mt-0.5">Calculados mediante UDD</p>
                  </th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                  <Fragment key={groupName}>
                    <tr className="bg-slate-50/80">
                      <td colSpan={4} className="px-6 py-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-indigo-400" />
                          {groupName}
                          <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 lowercase tracking-normal font-bold">
                            {groupItems.length} items
                          </span>
                        </h4>
                      </td>
                    </tr>
                    {groupItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shadow-sm border border-slate-200/50 capitalize">
                              {item.producto.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-none mb-1 flex items-center gap-2">
                                {item.producto}
                                <button
                                  onClick={() => {
                                    setSelectedItemForEquivalent(item);
                                    setEquivalentSearchQuery("");
                                    setEquivalentResults([]);
                                    setIsEquivalentModalOpen(true);
                                    searchEquivalents("", item.grupo);
                                  }}
                                  className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                  title="Intercambiar por equivalente"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              </p>
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                {item.grupo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="relative w-28">
                              <Input
                                type="text"
                                value={
                                  item.unidad === 'kg' && item.cantidadMes < 1
                                    ? Math.round(item.cantidadMes * 1000)
                                    : item.cantidadMes
                                }
                                readOnly
                                className="h-10 pr-10 text-center font-black text-slate-700 border-slate-200 rounded-xl bg-slate-50/50"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none uppercase">
                                {item.unidad === 'kg' && item.cantidadMes < 1 ? 'g' : item.unidad}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-4">
                            <div className="flex flex-col items-center gap-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">
                                Freq. Semanal
                              </label>
                              <div className="flex items-center gap-1 bg-emerald-50 rounded-xl px-2 border border-emerald-100">
                                <Input
                                  type="number"
                                  value={item.frecuenciaSemanal}
                                  onChange={(e) =>
                                    handleFrequencyChange(item.id, e.target.value)
                                  }
                                  className="h-8 w-12 p-0 text-center bg-transparent border-none font-black text-emerald-700 text-xs focus-visible:ring-0"
                                />
                                <span className="text-[10px] font-black text-emerald-600">
                                  x
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">
                                Porción (g)
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-blue-50 rounded-xl px-2 border border-blue-100">
                                  <Input
                                    type="number"
                                    value={item.porcionGramos}
                                    onChange={(e) =>
                                      handlePortionChange(item.id, e.target.value)
                                    }
                                    className="h-8 w-14 p-0 text-center bg-transparent border-none font-black text-blue-700 text-xs focus-visible:ring-0"
                                  />
                                </div>
                                <div
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-lg border text-[9px] font-black flex items-center gap-1 min-w-[65px] justify-center shadow-sm",
                                    item.grupo.toLowerCase().includes("cereal") ||
                                      item.grupo
                                        .toLowerCase()
                                        .includes("fruta") ||
                                      item.grupo.toLowerCase().includes("verdura")
                                      ? "bg-amber-50 text-amber-700 border-amber-100"
                                      : item.grupo
                                        .toLowerCase()
                                        .includes("carne") ||
                                        item.grupo
                                          .toLowerCase()
                                          .includes("huevo") ||
                                        item.grupo
                                          .toLowerCase()
                                          .includes("pescado")
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : item.grupo
                                          .toLowerCase()
                                          .includes("grasa") ||
                                          item.grupo
                                            .toLowerCase()
                                            .includes("aceite") ||
                                          item.grupo
                                            .toLowerCase()
                                            .includes("frutos secos")
                                          ? "bg-rose-50 text-rose-700 border-rose-100"
                                          : "bg-indigo-50 text-indigo-700 border-indigo-100",
                                  )}
                                >
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={item.exchange.val}
                                    onChange={(e) => handleExchangePortionChange(item, e.target.value)}
                                    className="h-6 w-10 p-0 text-center bg-transparent border-none shadow-none text-[10px] font-black focus-visible:ring-0"
                                  />
                                  <span className="opacity-50 text-[8px] uppercase tracking-tighter ml-1">
                                    {item.exchange.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setIsAddFoodModalOpen(true)}
              className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Agregar alimento adicional al carrito
            </button>
          </div>
        </div>

        {/* Smart Optimization Bar / Comparison */}
        <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <Calculator className="h-40 w-40 rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="bg-amber-400 p-1.5 rounded-lg">
                  <Zap className="h-4 w-4 text-amber-900 fill-current" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Optimizador Inteligente
                </span>
              </div>
              <h2 className="text-2xl font-black leading-tight">
                ¿Falta proteína en el plan?
              </h2>
              <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                Detectamos que para el perfil de{" "}
                <strong>{selectedPatient?.name || "Nuevo Paciente"}</strong>, aún
                faltan cubrir cerca de 45g de proteína diaria. Tienes dos opciones
                de costo-beneficio:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-all cursor-pointer group"
                >
                  <p className="text-[10px] font-black text-emerald-300 uppercase mb-2">
                    Opción Natural
                  </p>
                  <p className="font-bold text-sm mb-1">+500g Pollo / semana</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      $4.500 CLP (Est)
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div
                  className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-2xl hover:bg-amber-500/20 transition-all cursor-pointer group relative"
                >
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">
                    RECOMENDADO
                  </div>
                  <p className="text-[10px] font-black text-amber-400 uppercase mb-2">
                    Opción Suplemento
                  </p>
                  <p className="font-bold text-sm mb-1">+1 Scoop Whey / día</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      $2.800 CLP (Est)
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 text-slate-900 w-full md:w-80 shadow-2xl flex flex-col items-center gap-6">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Resumen Nutricional ({timeView})
                </p>
                <h3 className="text-3xl font-black text-emerald-600">
                  {totals.calories}
                  <span className="text-sm text-slate-400 font-bold ml-1">
                    kcal
                  </span>
                </h3>
              </div>

              <div className="w-full space-y-4">
                {/* Calories */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Calorías</span>
                    <span>
                      {totals.calories}kcal /{" "}
                      {Math.round(cartTargets.calories * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))}kcal
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 bg-amber-500",
                      )}
                      style={{
                        width: `${Math.min(100, (totals.calories / Math.max(1, cartTargets.calories * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Protein */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Proteína</span>
                    <span>
                      {totals.protein}g /{" "}
                      {Math.round(cartTargets.protein * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))}g
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 bg-emerald-500",
                      )}
                      style={{
                        width: `${Math.min(100, (totals.protein / Math.max(1, cartTargets.protein * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Carbohidratos</span>
                    <span>
                      {totals.carbs}g /{" "}
                      {Math.round(cartTargets.carbs * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))}g
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 bg-blue-500",
                      )}
                      style={{
                        width: `${Math.min(100, (totals.carbs / Math.max(1, cartTargets.carbs * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Fats */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Grasas</span>
                    <span>
                      {totals.fats}g /{" "}
                      {Math.round(cartTargets.fats * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))}g
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 bg-purple-500",
                      )}
                      style={{
                        width: `${Math.min(100, (totals.fats / Math.max(1, cartTargets.fats * (cartTargets.timeframe === "dia" ? (timeView === "dia" ? 1 : timeView === "semana" ? 7 : 30) : (timeView === "dia" ? 1 / 7 : timeView === "semana" ? 1 : 30 / 7)))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                onClick={handleFinalize} // Stage 3!
              >
                Finalizar Carrito
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Reference Modal - UDD Standards */}
        <Modal
          isOpen={isReferenceOpen}
          onClose={() => setIsReferenceOpen(false)}
          title="Manual de Porciones de Intercambio (UDD)"
          className="max-w-2xl"
        >
          <div className="max-h-[70vh] overflow-y-auto space-y-6 text-slate-600 pr-2 custom-scrollbar">
            <section>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                1. Panes, Cereales, Tubérculos y Leguminosas
              </h4>
              <p className="text-[10px] mb-2 font-bold text-slate-400">
                Aporte: 140 Kcal, 30g CHO, 3g PRO, 1g LIP.
              </p>
              <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <li>
                  • <b>Pan Marraqueta/Hallulla:</b> 50g (1/2 unidad)
                </li>
                <li>
                  • <b>Arroz/Pastas cocidos:</b> 100-110g (3/4 a 1 taza)
                </li>
                <li>
                  • <b>Avena:</b> 6 cucharadas
                </li>
                <li>
                  • <b>Papa:</b> 150g (1 unidad)
                </li>
                <li>
                  • <b>Legumbres frescas (Habas/Arvejas):</b> 150-180g (1 taza)
                </li>
              </ul>
            </section>

            <section>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                2. Carnes y Proteínas
              </h4>
              <p className="text-[10px] mb-2 font-bold text-slate-400">
                Aporte Bajo en Grasa: 65 Kcal, 11g PRO, 2g LIP.
              </p>
              <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <li>
                  • <b>Vacuno/Pollo/Pavo/Cerdo magro:</b> 50g (6x6x1 cm)
                </li>
                <li>
                  • <b>Pescados blancos:</b> 80g
                </li>
                <li>
                  • <b>Huevo:</b> 1 unidad entera o 3 claras (100g)
                </li>
              </ul>
            </section>

            <section>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                3. Frutas
              </h4>
              <p className="text-[10px] mb-2 font-bold text-slate-400">
                Aporte: 65 Kcal, 15g CHO, 1g PRO.
              </p>
              <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <li>
                  • <b>Manzana/Pera:</b> 1 unidad chica
                </li>
                <li>
                  • <b>Plátano:</b> 1/2 unidad
                </li>
                <li>
                  • <b>Arándanos/Frutillas:</b> 1/2 a 1 taza
                </li>
              </ul>
            </section>

            <section>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                4. Aceites y Alimentos Ricos en Lípidos
              </h4>
              <p className="text-[10px] mb-2 font-bold text-slate-400">
                Aporte (Bloque UDD): 180 Kcal, 20g LIP.
              </p>
              <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <li>
                  • <b>Aceites:</b> 20ml (4 cucharaditas)
                </li>
                <li>
                  • <b>Palta:</b> 90g (3 cucharadas)
                </li>
                <li>
                  • <b>Nueces/Almendras:</b> 25-30g (5-26 unidades)
                </li>
              </ul>
            </section>

            <section>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                5. Lácteos Descremados
              </h4>
              <p className="text-[10px] mb-2 font-bold text-slate-400">
                Aporte: 70 Kcal, 9g CHO, 8g PRO.
              </p>
              <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <li>
                  • <b>Leche líquida:</b> 1 taza
                </li>
                <li>
                  • <b>Leche en polvo:</b> 2 cucharadas colmadas
                </li>
                <li>
                  • <b>Yogurt descremado:</b> 1 unidad
                </li>
              </ul>
            </section>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-[10px] text-indigo-700 font-bold leading-tight italic">
                * Información extraída de la Tabla de Composición de Alimentos
                UDD. El sistema utiliza estos valores para normalizar las
                porciones clínicas.
              </p>
            </div>
          </div>
        </Modal>

        {/* Add Food Modal */}
        <Modal
          isOpen={isAddFoodModalOpen}
          onClose={() => setIsAddFoodModalOpen(false)}
          title="Importar Alimentos"
          className="max-w-md"
        >
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar en la base de datos..."
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {isSearchingFoods ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  <p className="text-xs text-slate-400 font-bold">Buscando...</p>
                </div>
              ) : searchResultFoods.length > 0 ? (
                searchResultFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleAddFoodFromSearch(food)}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-tight">
                          {food.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          {food.category?.name || "Varios"}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                    </div>
                  </div>
                ))
              ) : foodSearchQuery.trim() ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">
                    No se encontraron resultados.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium italic">
                    Escribe para buscar alimentos...
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>

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
        </Modal>
        </div>
        <SaveCreationModal
          isOpen={isSaveCreationModalOpen}
          onClose={() => setIsSaveCreationModalOpen(false)}
          onConfirm={async () => {
            saveCartToStorage();
            try {
              await persistCartCreation(undefined, creationDescription);
              toast.success("Carrito guardado en Mis Creaciones.");
              setIsSaveCreationModalOpen(false);
              setCreationDescription("");
            } catch (error: any) {
              toast.error(error?.message || "No se pudo guardar el carrito.");
            }
          }}
          description={creationDescription}
          onDescriptionChange={setCreationDescription}
          title="Guardar carrito"
          subtitle="Añade una breve descripción para identificar este carrito después."
        />
      </ModuleLayout>
    </>
  );
}
