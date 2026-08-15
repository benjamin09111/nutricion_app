"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  X,
  ChefHat,
  Sliders,
  FileText,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MarketPrice } from "@/features/foods";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSubscription } from "@/context/SubscriptionContext";
import { FreemiumUpgradeModal } from "@/components/memberships/FreemiumUpgradeModal";

interface DietGenerateNatyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategories: string[];
  initialFoods: MarketPrice[];
  onApplyGeneratedFoods: (foodsByGroup: Record<string, MarketPrice[]>) => void;
}

const QUICK_INSTRUCTION_CHIPS = [
  { label: "🥑 Keto / Bajas en Carbos", text: "Pauta cetogénica baja en carbohidratos, alta en grasas saludables" },
  { label: "💪 Hiperproteica", text: "Pauta rica en proteínas para ganancia muscular" },
  { label: "🥗 Vegetariana", text: "Pauta 100% vegetariana libre de carnes de origen animal" },
  { label: "🥛 Sin Lactosa", text: "Pauta libre de lactosa y lácteos enteros" },
  { label: "❤️ Baja en Sodio", text: "Pauta cardioprotectora baja en sodio y alimentos procesados" },
];

function normalizeCategoryKey(name: string): string {
  if (!name) return "varios";
  const str = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (str.includes("lacteo") || str.includes("leche") || str.includes("queso") || str.includes("yogur") || str.includes("crema") || str.includes("manjar")) return "lacteos";
  if (str.includes("huevo")) return "huevos";
  if (str.includes("carne") || str.includes("viscera") || str.includes("vacuno") || str.includes("cerdo") || str.includes("porcino") || str.includes("pollo") || str.includes("pavo") || str.includes("ave")) return "carnes y visceras";
  if (str.includes("pescado") || str.includes("marisco") || str.includes("atun") || str.includes("salmon") || str.includes("merluza") || str.includes("camaron")) return "pescados y mariscos";
  if (str.includes("cereal") || str.includes("pan") || str.includes("arroz") || str.includes("pasta") || str.includes("fideo") || str.includes("harina") || str.includes("avena") || str.includes("trigo")) return "cereales y derivados";
  if (str.includes("legumbre") || str.includes("poroto") || str.includes("lenteja") || str.includes("garbanzo") || str.includes("arveja")) return "legumbres";
  if (str.includes("verdura") || str.includes("hortaliza") || str.includes("vegetal") || str.includes("ensalada")) return "verduras";
  if (str.includes("fruta")) return "frutas";
  if (str.includes("papa") || str.includes("tuberculo") || str.includes("camote")) return "papas";
  if (str.includes("aceite") || str.includes("grasa") || str.includes("mantequilla") || str.includes("margarina")) return "grasas y aceites";
  if (str.includes("azucar") || str.includes("miel") || str.includes("mermelada")) return "azucares y miel";
  if (str.includes("dulce") || str.includes("postre") || str.includes("chocolate") || str.includes("golosina")) return "alimentos dulces";
  if (str.includes("semilla") || str.includes("fruto seco") || str.includes("nuez") || str.includes("almendra") || str.includes("mani")) return "semillas y nueces";
  if (str.includes("jugo") || str.includes("nectar")) return "jugos y nectares";
  if (str.includes("bebida") || str.includes("refresco")) return "bebidas";
  if (str.includes("salsa") || str.includes("aderezo") || str.includes("mayonesa") || str.includes("ketchup") || str.includes("mostaza")) return "salsas";
  if (str.includes("especia") || str.includes("condimento") || str.includes("sal") || str.includes("pimienta")) return "especias";
  if (str.includes("endulzante") || str.includes("edulcorante") || str.includes("stevia") || str.includes("sucralosa")) return "endulzantes";
  if (str.includes("plato") || str.includes("preparado") || str.includes("comida")) return "platos preparados";
  return str;
}

function findBestMatchingFoods(
  suggestedFoods: string[],
  categoryName: string,
  catalog: MarketPrice[]
): MarketPrice[] {
  const targetKey = normalizeCategoryKey(categoryName);

  // Foods strictly belonging to this category in catalog
  const categoryFoods = catalog.filter((f) => {
    const grpKey = normalizeCategoryKey(f.grupo);
    return grpKey === targetKey || grpKey.includes(targetKey) || targetKey.includes(grpKey);
  });

  const pool = categoryFoods.length > 0 ? categoryFoods : catalog;
  const matchedList: MarketPrice[] = [];
  const addedIds = new Set<string>();

  for (const suggested of suggestedFoods || []) {
    const normSuggested = suggested.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!normSuggested) continue;

    // 1. Direct or partial string match inside category pool
    const directMatch = pool.find((f) => {
      if (addedIds.has(f.id)) return false;
      const normProd = f.producto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      return normProd === normSuggested || normProd.includes(normSuggested) || normSuggested.includes(normProd);
    });

    if (directMatch) {
      matchedList.push(directMatch);
      addedIds.add(directMatch.id);
      continue;
    }

    // 2. Token overlap match inside category pool
    const tokens = normSuggested.split(/\s+/).filter((t) => t.length > 2);
    if (tokens.length > 0) {
      let bestItem: MarketPrice | null = null;
      let maxOverlap = 0;

      for (const item of pool) {
        if (addedIds.has(item.id)) continue;
        const normProd = item.producto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        let overlap = 0;
        for (const token of tokens) {
          if (normProd.includes(token)) overlap++;
        }
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestItem = item;
        }
      }

      if (bestItem && maxOverlap > 0) {
        matchedList.push(bestItem);
        addedIds.add(bestItem.id);
        continue;
      }
    }
  }

  // 3. Guaranteed Strict Category Fallback: Always pick up to 2 real foods belonging strictly to categoryFoods
  if (matchedList.length === 0) {
    const fallbackPool = categoryFoods.length > 0 ? categoryFoods : catalog;
    for (const item of fallbackPool.slice(0, 2)) {
      if (!addedIds.has(item.id)) {
        matchedList.push(item);
        addedIds.add(item.id);
      }
    }
  }

  return matchedList;
}

export const DietGenerateNatyModal: React.FC<DietGenerateNatyModalProps> = ({
  isOpen,
  onClose,
  activeCategories,
  initialFoods,
  onApplyGeneratedFoods,
}) => {
  const { usage, currentPlan, isDeveloper, refreshSubscription } = useSubscription();
  const [mode, setMode] = useState<"existing" | "custom">("existing");
  const [selectedCustomCategories, setSelectedCustomCategories] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [maxFoodsPerCategory, setMaxFoodsPerCategory] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Dynamically extract all authentic category names from initialFoods database catalog
  const platformCategories = useMemo(() => {
    return Array.from(new Set(initialFoods.map((f) => f.grupo).filter(Boolean)));
  }, [initialFoods]);

  // Pre-select active categories or platform categories when modal opens
  useEffect(() => {
    if (selectedCustomCategories.length === 0 && platformCategories.length > 0) {
      setSelectedCustomCategories(
        activeCategories.length > 0 ? activeCategories : platformCategories.slice(0, 6)
      );
    }
  }, [activeCategories, platformCategories, selectedCustomCategories.length]);

  if (!isOpen) return null;

  const targetCategoryList =
    mode === "existing" && activeCategories.length > 0
      ? activeCategories
      : selectedCustomCategories;

  const toggleCategorySelection = (cat: string) => {
    setSelectedCustomCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const selectAllCategories = () => {
    setSelectedCustomCategories([...platformCategories]);
  };

  const deselectAllCategories = () => {
    setSelectedCustomCategories([]);
  };

  const handleChipClick = (chipText: string) => {
    setInstructions((prev) => (prev ? `${prev}. ${chipText}` : chipText));
  };

  const handleGenerate = async () => {
    if (targetCategoryList.length === 0) {
      toast.error("Por favor selecciona al menos una categoría para continuar.");
      return;
    }

    // Freemium Quota Check
    const isFreemium =
      !isDeveloper &&
      (currentPlan?.key || currentPlan?.slug || "free").toLowerCase().includes("free");
    const aiLimit =
      currentPlan?.entitlements?.["ai.calls.limit"] ??
      currentPlan?.entitlements?.["ai.operations.total.limit"] ??
      4;
    const currentAiUsage = usage?.aiUsed ?? 0;

    if (isFreemium && typeof aiLimit === "number" && currentAiUsage >= aiLimit) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      console.log("[Naty AI] Enviando solicitud para categorías:", targetCategoryList);

      const response = await api.post("/diet/generate-base", {
        instructions: instructions.trim(),
        categories: targetCategoryList,
        maxFoodsPerCategory,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson?.message || `El servidor respondió con código HTTP ${response.status}`
        );
      }

      const responseData = (await response.json()) as {
        ok: boolean;
        categories?: Array<{ category: string; suggestedFoods: string[] }>;
      };

      console.log("==================== [NATY FRONTEND MATCHING DIAGNOSTIC] ====================");
      console.log(`[Naty AI] Categorías Solicitadas (${targetCategoryList.length}):`, targetCategoryList);
      console.log(`[Naty AI] Categorías devueltas por Backend (${responseData.categories.length}):`, responseData.categories);

      // Guarantee matching for EVERY requested category in targetCategoryList
      const resultFoodsByGroup: Record<string, MarketPrice[]> = {};

      for (const targetCat of targetCategoryList) {
        const targetKey = normalizeCategoryKey(targetCat);

        // Find matching category object in Naty's response
        const groupObj = (responseData.categories || []).find((g) => {
          const gKey = normalizeCategoryKey(g.category || "");
          return gKey === targetKey || gKey.includes(targetKey) || targetKey.includes(gKey);
        });

        const suggestedFoods = groupObj?.suggestedFoods || [];
        const matchedFoods = findBestMatchingFoods(suggestedFoods, targetCat, initialFoods);

        console.log(`🔹 [Categoría: "${targetCat}"] (Canónico: "${targetKey}"):`, {
          encontradoEnNaty: !!groupObj,
          sugeridosPorNaty: suggestedFoods,
          alimentosEmparejados: matchedFoods.map((f) => `${f.producto} (${f.grupo})`),
          totalFinales: matchedFoods.length,
        });

        if (matchedFoods.length > 0) {
          resultFoodsByGroup[targetCat] = matchedFoods;
        }
      }

      console.log("[Naty AI] Alimentos finales listos para aplicar a la pauta:", resultFoodsByGroup);
      console.log("==========================================================================");

      // Dispatch membership usage update to sync header badge
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("membership-usage-updated"));
        void refreshSubscription({ silent: true });
      }

      onApplyGeneratedFoods(resultFoodsByGroup);
      onClose();

      toast.info(
        "¡Dieta base generada por Naty! Recuerda revisar e inspeccionar los ingredientes por si requieres hacer ajustes para tu paciente.",
        { duration: 8000 }
      );
    } catch (err: any) {
      console.error("Error generando dieta base con Naty:", err);
      const errMsg = (err?.message || "").toLowerCase();
      if (
        err?.status === 403 ||
        errMsg.includes("límite") ||
        errMsg.includes("cuota") ||
        errMsg.includes("plan")
      ) {
        setIsUpgradeModalOpen(true);
      } else {
        toast.error(
          err?.message || "No se pudo generar la dieta con Naty. Por favor intenta nuevamente."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden space-y-0"
        >
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Sparkles className="h-5 w-5 fill-white text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Generar Dieta Base con Naty
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Instruye a Naty para seleccionar y combinar los mejores alimentos de tu catálogo.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-5 my-4">
              <div className="relative">
                <div className="p-5 bg-emerald-100 text-emerald-600 rounded-2xl border border-emerald-300 shadow-xl animate-pulse">
                  <ChefHat className="h-12 w-12 text-emerald-600 animate-bounce" />
                </div>
                <Sparkles className="h-6 w-6 text-emerald-500 fill-emerald-200 absolute -top-2 -right-2 animate-spin" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-black text-slate-800 text-base">
                  Naty está estructurando tu pauta alimentaria...
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Seleccionando la combinación ideal de alimentos desde la base de datos oficial.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
              {/* Left Column: Mode & Category Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-600" />
                    Modo de Selección de Categorías
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("existing")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === "existing"
                          ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800">
                        Rellenar categorías activas ({activeCategories.length})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Usa únicamente las categorías desplegadas en tu pauta.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("custom")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === "custom"
                          ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800">
                        Seleccionar qué categorías llenar ({selectedCustomCategories.length})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Elige manualmente las categorías a completar.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Category Selector Box when Mode === 'custom' */}
                {mode === "custom" && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        Categorías ({selectedCustomCategories.length} de {platformCategories.length})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllCategories}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          Marcar todas
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={deselectAllCategories}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Desmarcar todas
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {platformCategories.map((cat) => {
                        const isSelected = selectedCustomCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategorySelection(cat)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span>{cat}</span>
                            {isSelected && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Options & Prompt Instructions */}
              <div className="space-y-4">
                {/* Max Foods Per Category Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                      Máximo de alimentos por categoría
                    </span>
                    <span className="text-emerald-600 font-bold">{maxFoodsPerCategory} alimentos</span>
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxFoodsPerCategory(num)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          maxFoodsPerCategory === num
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        {num} alimentos
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Instructions */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    Instrucciones especiales para Naty
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Ej: Pauta normocalórica para deportista, libre de gluten, rica en proteínas y sin lácteos..."
                    rows={4}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                  />

                  {/* Quick Prompt Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_INSTRUCTION_CHIPS.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleChipClick(chip.text)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {!isLoading && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 px-5 border-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-emerald-200 fill-emerald-100" />
                Generar Base con Naty
              </Button>
            </div>
          )}
        </div>
      </div>

      <FreemiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        description="Has alcanzado el límite de uso de Naty (consultas de la plataforma) de tu plan actual. ¡Actualiza tu plan para disfrutar de acceso ilimitado y agilizar tus consultas!"
      />
    </>
  );
};
