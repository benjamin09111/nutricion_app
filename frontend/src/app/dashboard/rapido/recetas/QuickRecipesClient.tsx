"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChefHat,
  RotateCcw,
  Save,
  Library,
  User,
  UserPlus,
  Loader2,
  X,
  Search,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { type ActionDockItem } from "@/components/ui/ActionDock";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import { fetchCreation, saveCreation } from "@/lib/workflow";
import { getAuthToken } from "@/lib/auth-token";
import Cookies from "js-cookie";

// -- Types --

type QuickIngredient = {
  id: string;
  name: string;
  quantity: string;
};

type QuickDish = {
  id: string;
  title: string;
  mealSection: string;
  description: string;
  preparation: string;
  recommendedPortion: string;
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
  weight?: number;
  height?: number;
  gender?: string;
  birthDate?: string;
  nutritionalFocus?: string;
};

type ImportedCreation = {
  id: string;
  name: string;
  type: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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

const createIngredient = (): QuickIngredient => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  quantity: "",
});

const createDish = (): QuickDish => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  mealSection: "Almuerzo",
  description: "",
  preparation: "",
  recommendedPortion: "",
  protein: "",
  calories: "",
  carbs: "",
  fats: "",
  ingredients: [createIngredient()],
});

const DRAFT_KEY = "nutri_quick_recipes_draft";

export default function QuickRecipesClient() {
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");

  // -- State --
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [nutritionistNotes, setNutritionistNotes] = useState("");
  const [dishes, setDishes] = useState<QuickDish[]>([createDish()]);
  const [selectedPatient, setSelectedPatient] = useState<QuickPatient | null>(null);

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");

  // Patient fetch
  const [patients, setPatients] = useState<QuickPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  // AI generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // -- Draft Persistence --
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || DEFAULT_TITLE);
        setNutritionistNotes(parsed.nutritionistNotes || "");
        setDishes(Array.isArray(parsed.dishes) && parsed.dishes.length > 0 ? parsed.dishes : [createDish()]);
        setSelectedPatient(parsed.selectedPatient || null);
      } catch (e) {
        console.error("Error loading quick recipes draft", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title, nutritionistNotes, dishes, selectedPatient }),
    );
  }, [title, nutritionistNotes, dishes, selectedPatient]);

  // -- Load from Creation ID --
  useEffect(() => {
    if (!creationId) return;
    const loadCreation = async () => {
      try {
        const creation = await fetchCreation(creationId);
        const content = (creation.content || {}) as any;
        setTitle(content.title || creation.name || DEFAULT_TITLE);
        setNutritionistNotes(content.nutritionistNotes || "");
        setDishes(Array.isArray(content.dishes) && content.dishes.length > 0 ? content.dishes : [createDish()]);
        if (creation.metadata?.patientName) {
          setSelectedPatient({
            id: creation.metadata?.patientId as string | undefined,
            fullName: creation.metadata.patientName as string,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar la receta rápida.");
      }
    };
    loadCreation();
  }, [creationId]);

  // -- Patient --
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
        setPatients(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching patients", e);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    return patients.filter((p) =>
      (p.fullName || "").toLowerCase().includes(patientSearch.toLowerCase()),
    );
  }, [patients, patientSearch]);

  const handleSelectPatient = (patient: QuickPatient) => {
    setSelectedPatient(patient);
    setIsPatientModalOpen(false);
    toast.success(`Paciente "${patient.fullName}" vinculado. Sus características se incluirán en la generación IA.`);
  };

  // -- Dishes CRUD --
  const addDish = () => setDishes((prev) => [...prev, createDish()]);

  const removeDish = (dishId: string) => {
    if (dishes.length === 1) {
      toast.error("Debes tener al menos un plato.");
      return;
    }
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
  };

  const updateDish = (dishId: string, field: keyof QuickDish, value: string) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, [field]: value } : d)),
    );
  };

  const addIngredient = (dishId: string) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId
          ? { ...d, ingredients: [...d.ingredients, createIngredient()] }
          : d,
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
      prev.map((d) =>
        d.id === dishId
          ? {
              ...d,
              ingredients: d.ingredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, [field]: value } : ing,
              ),
            }
          : d,
      ),
    );
  };

  const removeIngredient = (dishId: string, ingredientId: string) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId
          ? {
              ...d,
              ingredients:
                d.ingredients.length === 1
                  ? d.ingredients
                  : d.ingredients.filter((ing) => ing.id !== ingredientId),
            }
          : d,
      ),
    );
  };

  // -- AI Generate --
  const handleAiGenerate = async () => {
    setIsGenerating(true);
    setShowAiModal(false);
    try {
      const token = getAuthToken();
      const patientContext = selectedPatient
        ? {
            fullName: selectedPatient.fullName,
            restrictions: selectedPatient.dietRestrictions || [],
            weight: selectedPatient.weight,
            height: selectedPatient.height,
            gender: selectedPatient.gender,
            birthDate: selectedPatient.birthDate,
            nutritionalFocus: selectedPatient.nutritionalFocus,
          }
        : null;

      const response = await fetchApi("/ai/quick-recipes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: aiNotes || nutritionistNotes,
          patient: patientContext,
          existingDishes: dishes.map((d) => ({ title: d.title, mealSection: d.mealSection })),
        }),
      });

      if (!response.ok) {
        throw new Error("Error generando recetas con IA");
      }

      const data = await response.json();
      if (Array.isArray(data.dishes) && data.dishes.length > 0) {
        const mapped: QuickDish[] = data.dishes.map((d: any) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: d.title || "",
          mealSection: d.mealSection || "Almuerzo",
          description: d.description || "",
          preparation: d.preparation || "",
          recommendedPortion: d.recommendedPortion || "",
          protein: String(d.protein || ""),
          calories: String(d.calories || ""),
          carbs: String(d.carbs || ""),
          fats: String(d.fats || ""),
          ingredients: Array.isArray(d.ingredients)
            ? d.ingredients.map((ing: any) => ({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: typeof ing === "string" ? ing : ing.name || "",
                quantity: typeof ing === "string" ? "" : ing.quantity || "",
              }))
            : [createIngredient()],
        }));
        setDishes(mapped);
        toast.success("Platos generados por IA correctamente.");
      }
    } catch (error) {
      console.error("AI generation error", error);
      toast.error("No se pudo generar con IA. Revisa tu conexión o intenta más tarde.");
    } finally {
      setIsGenerating(false);
    }
  };

  // -- Save --
  const buildContent = () => ({
    title,
    nutritionistNotes,
    dishes,
    updatedAt: new Date().toISOString(),
  });

  const handleSaveToCreations = async () => {
    if (!title.trim()) {
      toast.error("Por favor ingresa un título antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
      await saveCreation({
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
      toast.success("Receta rápida guardada en creaciones.");
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la receta.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // -- Import Creation --
  const applyImportedCreation = (creation: ImportedCreation) => {
    if (creation.type !== "RECIPE") {
      toast.error("Solo puedes importar recetas en este módulo.");
      return;
    }
    const content = (creation.content || {}) as any;
    setTitle(typeof content.title === "string" && content.title.trim() ? content.title : creation.name || DEFAULT_TITLE);
    setNutritionistNotes(content.nutritionistNotes || "");
    setDishes(Array.isArray(content.dishes) && content.dishes.length > 0 ? content.dishes : [createDish()]);
    const patientName = typeof creation.metadata?.patientName === "string" ? creation.metadata.patientName : null;
    const patientId = typeof creation.metadata?.patientId === "string" ? creation.metadata.patientId : undefined;
    setSelectedPatient(patientName ? { id: patientId, fullName: patientName } : null);
    setIsImportCreationModalOpen(false);
    toast.success("Receta importada al borrador actual.");
  };

  // -- Reset --
  const handleReset = () => {
    setTitle(DEFAULT_TITLE);
    setNutritionistNotes("");
    setDishes([createDish()]);
    setSelectedPatient(null);
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Borrador reiniciado.");
  };

  // -- PDF Export --
  const buildPdfData = () => ({
    title: title.trim() || DEFAULT_TITLE,
    patientName: selectedPatient?.fullName || null,
    nutritionistNotes: nutritionistNotes.trim() || undefined,
    dishes: dishes.map((d) => ({
      title: d.title,
      mealSection: d.mealSection,
      description: d.description,
      preparation: d.preparation,
      recommendedPortion: d.recommendedPortion,
      protein: d.protein,
      calories: d.calories,
      carbs: d.carbs,
      fats: d.fats,
      ingredients: d.ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({ name: ing.name, quantity: ing.quantity })),
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

  // -- Action Dock --
  const actionDockItems: ActionDockItem[] = [
    {
      id: "patient",
      icon: selectedPatient ? User : UserPlus,
      label: selectedPatient ? `Paciente: ${selectedPatient.fullName}` : "Importar paciente",
      variant: "emerald",
      onClick: openPatientModal,
    },
    {
      id: "ai",
      icon: Sparkles,
      label: isGenerating ? "Generando..." : "Generar con IA",
      variant: "indigo",
      onClick: () => setShowAiModal(true),
    },
    {
      id: "export-pdf",
      icon: Download,
      label: isExportingPdf ? "Exportando..." : "Exportar PDF",
      variant: "slate",
      onClick: handleExportPdf,
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

  return (
    <>
      <ModuleLayout
        title="Rápido"
        description="Crea platos y recetas rápidamente. Guárdalos como plantillas reutilizables para tus pacientes."
        step={{ number: "Express", label: "Receta rápida", icon: ChefHat, color: "text-amber-600" }}
        rightNavItems={actionDockItems}
        className="max-w-5xl"
        footer={
          <ModuleFooter>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Modo Express · Recetas reutilizables
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-slate-200"
                onClick={() => {
                  if (!title.trim()) {
                    toast.error("Por favor ingresa un tÃ­tulo antes de guardar.");
                    return;
                  }
                  setIsSaveCreationModalOpen(true);
                }}
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
          {/* Title + Patient Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Title Input */}
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Título de la receta
                </label>
                <Input
                  id="quick-recipe-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Plan de platos para primer mes"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white font-semibold text-slate-800"
                  maxLength={120}
                />
              </div>

              {/* Patient Badge */}
              {selectedPatient && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold shrink-0">
                  <User className="w-4 h-4" />
                  {selectedPatient.fullName}
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="ml-1 text-indigo-400 hover:text-indigo-700 cursor-pointer"
                    title="Quitar paciente"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Patient context tip */}
            {!selectedPatient && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Puedes importar un paciente para que la IA adapte los platos según sus restricciones, objetivos y características personales. Es opcional.
                </span>
              </div>
            )}
          </div>

          {/* Nutritionist Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Notas del nutricionista (contexto para la IA)
            </label>
            <Textarea
              value={nutritionistNotes}
              onChange={(e) => setNutritionistNotes(e.target.value)}
              placeholder="Ej: Paciente vegetariana, evitar gluten, foco en proteínas, preferencia por preparaciones rápidas..."
              className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
              maxLength={600}
            />
            <div className="flex justify-end">
              <span className="text-xs text-slate-400">{nutritionistNotes.trim().length}/600</span>
            </div>
          </div>

          {/* Dishes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-500" />
                Platos ({dishes.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={addDish}
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Agregar plato
              </Button>
            </div>

            {dishes.map((dish, dishIndex) => (
              <div
                key={dish.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Dish Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Plato {dishIndex + 1}
                  </span>
                  <button
                    onClick={() => removeDish(dish.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Eliminar plato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Title + Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Nombre del plato
                      </label>
                      <Input
                        value={dish.title}
                        onChange={(e) => updateDish(dish.id, "title", e.target.value)}
                        placeholder="Ej: Bowl de quinoa con pollo"
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Tiempo de comida
                      </label>
                      <select
                        value={dish.mealSection}
                        onChange={(e) => updateDish(dish.id, "mealSection", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer appearance-none"
                      >
                        {MEAL_SECTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                      Descripción
                    </label>
                    <Textarea
                      value={dish.description}
                      onChange={(e) => updateDish(dish.id, "description", e.target.value)}
                      placeholder="Descripción breve del plato..."
                      className="min-h-[64px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                      maxLength={400}
                    />
                  </div>

                  {/* Preparation */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                      Preparación
                    </label>
                    <Textarea
                      value={dish.preparation}
                      onChange={(e) => updateDish(dish.id, "preparation", e.target.value)}
                      placeholder="Pasos de preparación..."
                      className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                      maxLength={800}
                    />
                  </div>

                  {/* Portion + Macros */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Porción
                      </label>
                      <Input
                        value={dish.recommendedPortion}
                        onChange={(e) => updateDish(dish.id, "recommendedPortion", e.target.value)}
                        placeholder="Ej: 1 taza"
                        className="h-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                      />
                    </div>
                    {(["calories", "protein", "carbs", "fats"] as const).map((macro) => (
                      <div key={macro}>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                          {macro === "calories" ? "Kcal" : macro === "protein" ? "Prot. (g)" : macro === "carbs" ? "HC (g)" : "Grasas (g)"}
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={dish[macro]}
                          onChange={(e) => updateDish(dish.id, macro, e.target.value)}
                          placeholder="0"
                          className="h-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Ingredientes
                      </label>
                      <button
                        onClick={() => addIngredient(dish.id)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {dish.ingredients.map((ing) => (
                        <div key={ing.id} className="flex gap-2 items-center">
                          <Input
                            value={ing.name}
                            onChange={(e) => updateIngredient(dish.id, ing.id, "name", e.target.value)}
                            placeholder="Ingrediente"
                            className="h-9 flex-1 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                          />
                          <Input
                            value={ing.quantity}
                            onChange={(e) => updateIngredient(dish.id, ing.id, "quantity", e.target.value)}
                            placeholder="Cantidad"
                            className="h-9 w-28 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                          />
                          <button
                            onClick={() => removeIngredient(dish.id, ing.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add dish CTA */}
            <button
              onClick={addDish}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 flex items-center justify-center gap-2 text-slate-400 hover:text-amber-600 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">Agregar otro plato</span>
            </button>
          </div>
        </div>
      </ModuleLayout>

      {/* Patient Modal */}
      <Modal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        title="Importar paciente"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Al importar un paciente, sus restricciones y características se incluirán en el contexto de la IA para generar platos personalizados.
            <span className="block mt-1 text-slate-400 text-xs">Este campo es opcional. Puedes crear recetas generales sin paciente.</span>
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {isLoadingPatients ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No se encontraron pacientes.</p>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id || patient.fullName}
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{patient.fullName}</p>
                    {patient.email && (
                      <p className="text-xs text-slate-400 truncate">{patient.email}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedPatient && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                Paciente actual: <strong>{selectedPatient.fullName}</strong>
              </span>
              <button
                onClick={() => { setSelectedPatient(null); setIsPatientModalOpen(false); }}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                Quitar paciente
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600"
              onClick={() => setIsPatientModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Modal */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Generar platos con IA"
      >
        <div className="space-y-4">
          {selectedPatient && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold">
              <User className="w-4 h-4" />
              Paciente vinculado: {selectedPatient.fullName}
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Instrucciones adicionales para la IA
            </label>
            <Textarea
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="Ej: Crear 3 platos variados, alta proteína, preparación máx 20 min, sin fritos..."
              className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
              maxLength={400}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600"
              onClick={() => setShowAiModal(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleAiGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generar platos</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Creation Modal */}
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

      {/* Import Creation Modal */}
      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={applyImportedCreation}
        allowedTypes={["RECIPE"]}
      />
    </>
  );
}
