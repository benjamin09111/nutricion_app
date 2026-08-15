import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Info,
  Search,
  Check,
  X,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { MarketPrice } from "@/features/foods";
import { DietGenerateNatyModal } from "./DietGenerateNatyModal";

interface DietPlannerSectionProps {
  allGroupsToRender: Record<string, MarketPrice[]>;
  openAddModal: (groupName: string) => void;
  setGroupToDelete: (groupName: string) => void;
  setIsDeleteGroupConfirmOpen: (open: boolean) => void;
  openDraftFoodEditor: (food: MarketPrice) => void;
  setSelectedFoodForInfo: (food: MarketPrice) => void;
  setIsFoodInfoModalOpen: (open: boolean) => void;
  removeFood: (productName: string) => void;
  setIsAddGroupModalOpen: (open: boolean) => void;
  initialFoods?: MarketPrice[];
  addFoodToGroup?: (
    food: MarketPrice,
    groupName: string,
    options?: { silent?: boolean },
  ) => void;
  handleCreateGroupByName?: (groupName: string) => void;
}

export const STANDARD_SUGGESTED_CATEGORIES = [
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
  "Frutos Secos y Semillas",
  "Suplementos",
  "Snacks y Colaciones",
  "Comidas Preparadas",
  "Condimentos y Especias",
  "Varios / Otros",
];

function normalizeGroupName(name: string): string {
  if (!name) return "varios";
  const str = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (str.includes("lacteo") || str.includes("leche") || str.includes("queso") || str.includes("yogur") || str.includes("crema") || str.includes("manjar")) return "lacteos";
  if (str.includes("huevo")) return "huevos";
  if (str.includes("carne") || str.includes("viscera") || str.includes("vacuno") || str.includes("vacuna") || str.includes("cerdo") || str.includes("porcino") || str.includes("pollo") || str.includes("pavo") || str.includes("ave")) return "carnes y visceras";
  if (str.includes("pescado") || str.includes("marisco") || str.includes("atun") || str.includes("salmon") || str.includes("merluza") || str.includes("camaron")) return "pescados y mariscos";
  if (str.includes("cereal") || str.includes("pan") || str.includes("arroz") || str.includes("pasta") || str.includes("fideo") || str.includes("harina") || str.includes("avena") || str.includes("trigo")) return "cereales y derivados";
  if (str.includes("legumbre") || str.includes("poroto") || str.includes("lenteja") || str.includes("garbanzo") || str.includes("arveja")) return "legumbres";
  if (str.includes("verdura") || str.includes("hortaliza") || str.includes("vegetal") || str.includes("ensalada")) return "verduras";
  if (str.includes("fruta")) return "frutas";
  if (str.includes("aceite") || str.includes("grasa") || str.includes("mantequilla") || str.includes("margarina")) return "aceites y grasas";
  if (str.includes("azucar") || str.includes("dulce") || str.includes("miel") || str.includes("mermelada") || str.includes("chocolate")) return "azucares y dulces";
  if (str.includes("bebida") || str.includes("jugo") || str.includes("agua") || str.includes("infusion") || str.includes("te") || str.includes("cafe")) return "bebidas";
  if (str.includes("seco") || str.includes("semilla") || str.includes("nuez") || str.includes("almendra") || str.includes("mani") || str.includes("castana")) return "frutos secos y semillas";
  if (str.includes("suplemento") || str.includes("proteina") || str.includes("creatina") || str.includes("vitamina")) return "suplementos";
  if (str.includes("snack") || str.includes("colacion") || str.includes("galleta") || str.includes("barrita")) return "snacks y colaciones";
  return str;
}

export const DietPlannerSection: React.FC<DietPlannerSectionProps> = ({
  allGroupsToRender,
  openAddModal,
  setGroupToDelete,
  setIsDeleteGroupConfirmOpen,
  openDraftFoodEditor,
  setSelectedFoodForInfo,
  setIsFoodInfoModalOpen,
  removeFood,
  setIsAddGroupModalOpen,
  initialFoods = [],
  addFoodToGroup,
  handleCreateGroupByName,
}) => {
  const groups = Object.entries(allGroupsToRender);
  const [openGroups, setOpenGroups] = useState<string[] | null>(null);
  
  // Inline category creation state
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [inlineCategoryInput, setInlineCategoryInput] = useState("");
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);

  // Naty AI modal state
  const [isGenerateNatyModalOpen, setIsGenerateNatyModalOpen] = useState(false);

  // Inline food searcher state per category group
  const [activeInlineFoodGroup, setActiveInlineFoodGroup] = useState<string | null>(null);
  const [inlineFoodQueries, setInlineFoodQueries] = useState<Record<string, string>>({});

  const totalSelectedFoods = useMemo(
    () => Object.values(allGroupsToRender).reduce((acc, foods) => acc + foods.length, 0),
    [allGroupsToRender]
  );

  const handleApplyGeneratedFoods = (foodsByGroup: Record<string, MarketPrice[]>) => {
    if (!addFoodToGroup) return;
    for (const [groupName, foods] of Object.entries(foodsByGroup)) {
      for (const food of foods) {
        addFoodToGroup(food, groupName, { silent: true });
      }
    }
  };

  const firstLacteosIndex = groups.findIndex(([name]) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().includes("lacteos"),
  );

  const activeGroupNamesLower = useMemo(
    () => Object.keys(allGroupsToRender).map((g) => g.toLowerCase()),
    [allGroupsToRender]
  );

  const categoryCatalogMap = useMemo(() => {
    const map = new Map<string, MarketPrice[]>();
    for (const food of initialFoods) {
      const groupNorm = normalizeGroupName(food.grupo);
      const existing = map.get(groupNorm);
      if (existing) {
        existing.push(food);
      } else {
        map.set(groupNorm, [food]);
      }
    }
    return map;
  }, [initialFoods]);

  // Sorted suggested categories: Unused first, used last
  const sortedInlineCategories = useMemo(() => {
    const q = inlineCategoryInput.trim().toLowerCase();
    return [...STANDARD_SUGGESTED_CATEGORIES]
      .filter((cat) => cat.toLowerCase().includes(q))
      .sort((a, b) => {
        const aUsed = activeGroupNamesLower.includes(a.toLowerCase());
        const bUsed = activeGroupNamesLower.includes(b.toLowerCase());
        if (aUsed === bUsed) return 0;
        return aUsed ? 1 : -1;
      });
  }, [inlineCategoryInput, activeGroupNamesLower]);

  const handleAddCategorySubmit = (nameToAdd?: string) => {
    const catName = (nameToAdd || inlineCategoryInput).trim();
    if (!catName) return;
    if (handleCreateGroupByName) {
      handleCreateGroupByName(catName);
    } else {
      setIsAddGroupModalOpen(true);
    }
    setInlineCategoryInput("");
    setIsAddingCategoryInline(false);

    // Automatically expand the new category accordion
    setOpenGroups((prev) => Array.from(new Set([...(prev || []), catName])));

    // Highlight new category for 2 seconds
    setHighlightedGroup(catName);
    setTimeout(() => {
      setHighlightedGroup(null);
    }, 2000);

    // Smooth scroll down to the newly created category
    setTimeout(() => {
      const elementId = `category-group-${catName.toLowerCase().replace(/\s+/g, "-")}`;
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  const handleToggleInlineAddFood = (groupName: string) => {
    if (activeInlineFoodGroup === groupName) {
      setActiveInlineFoodGroup(null);
    } else {
      setActiveInlineFoodGroup(groupName);
      // Ensure category accordion is open when clicking add food
      setOpenGroups((prev) => Array.from(new Set([...(prev || []), groupName])));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Category Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Dieta Base Generada
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Las categorías que no contengan alimentos añadidos se omitirán automáticamente en la pauta final entregada al paciente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Generar Dieta Base con Naty Button */}
          <div
            title={
              totalSelectedFoods > 0
                ? "Elimina cualquier alimento agregado para utilizar"
                : undefined
            }
          >
            <Button
              type="button"
              disabled={totalSelectedFoods > 0}
              onClick={() => setIsGenerateNatyModalOpen(true)}
              className={cn(
                "h-10 px-4 font-black text-xs sm:text-sm rounded-xl gap-2 transition-all cursor-pointer border-none shadow-sm",
                totalSelectedFoods > 0
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75 shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95"
              )}
            >
              <Sparkles className="h-4 w-4 text-emerald-200 fill-emerald-100" />
              Generar dieta base con Naty
            </Button>
          </div>

          {/* Nueva Categoría Button */}
          <Button
            onClick={() => setIsAddingCategoryInline((prev) => !prev)}
            className="h-10 px-5 bg-slate-900 text-white hover:bg-slate-800 border-none font-black text-xs sm:text-sm rounded-xl gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200 w-full sm:w-auto justify-center cursor-pointer shrink-0"
          >
            {isAddingCategoryInline ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isAddingCategoryInline ? "Cerrar" : "Nueva categoría"}
          </Button>
        </div>
      </div>

      {/* Category Creation Box / Mobile Modal */}
      {isAddingCategoryInline && (
        <>
          {/* Desktop Inline Panel */}
          <div className="hidden sm:block p-5 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <FolderPlus className="h-4 w-4 text-emerald-600" />
                Agregar Nueva Categoría al Plan
              </h3>
              <button
                onClick={() => setIsAddingCategoryInline(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Escribe el nombre de tu categoría y presiona Enter..."
                  value={inlineCategoryInput}
                  onChange={(e) => setInlineCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategorySubmit();
                  }}
                  autoFocus
                  className="h-11 pl-10 rounded-xl border-slate-200 bg-white font-semibold text-slate-900"
                />
              </div>
              <Button
                onClick={() => handleAddCategorySubmit()}
                disabled={!inlineCategoryInput.trim()}
                className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Agregar Categoría
              </Button>
            </div>

            {/* Quick Suggested Category Pills (Unused First) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Sugerencias Rápidas (No usadas primero)
              </span>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {sortedInlineCategories.map((category) => {
                  const isAlreadyAdded = activeGroupNamesLower.includes(category.toLowerCase());
                  return (
                    <button
                      key={category}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddCategorySubmit(category)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
                        isAlreadyAdded
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/60"
                      )}
                    >
                      <span>{category}</span>
                      {isAlreadyAdded && (
                        <span className="text-[9px] font-semibold opacity-75">(Activa)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile Full-Screen Modal Overlay */}
          <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 sm:hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Nueva Categoría</h3>
              </div>
              <button
                onClick={() => setIsAddingCategoryInline(false)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Nombre de Categoría
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Escribe el nombre de tu categoría y presiona Enter..."
                  value={inlineCategoryInput}
                  onChange={(e) => setInlineCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategorySubmit();
                  }}
                  autoFocus
                  className="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2 border-t border-slate-100">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Sugerencias Disponibles (No usadas primero)
              </span>
              <div className="flex flex-wrap gap-2">
                {sortedInlineCategories.map((category) => {
                  const isAlreadyAdded = activeGroupNamesLower.includes(category.toLowerCase());
                  return (
                    <button
                      key={category}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddCategorySubmit(category)}
                      className={cn(
                        "px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
                        isAlreadyAdded
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                          : "bg-white text-slate-800 border-slate-200 hover:border-emerald-500 active:bg-emerald-50"
                      )}
                    >
                      <span>{category}</span>
                      {isAlreadyAdded && (
                        <span className="text-[9px] font-semibold opacity-75">(Activa)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Button
                onClick={() => handleAddCategorySubmit()}
                disabled={!inlineCategoryInput.trim()}
                className="flex-1 h-12 bg-emerald-600 text-white font-bold rounded-xl text-sm cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Categoría
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Category Accordion List */}
      <div className="grid gap-6">
        {groups.map(([name, foods], groupIndex) => {
          const isInlineSearchOpen = activeInlineFoodGroup === name;
          const currentQuery = (inlineFoodQueries[name] || "").trim().toLowerCase();
          const categoryNorm = normalizeGroupName(name);

          // Foods from catalog belonging strictly to this category (O(1) Map lookup)
          const categoryCatalogFoods = categoryCatalogMap.get(categoryNorm) || [];

          // Display foods logic:
          // If query typed, first filter categoryCatalogFoods. If matching items found, display them.
          // If 0 matches in category OR if custom category, search across ALL initialFoods so user can pick ANY food in platform DB.
          let displayFoods: typeof initialFoods = [];
          if (!currentQuery) {
            displayFoods = categoryCatalogFoods.length > 0 ? categoryCatalogFoods : initialFoods;
          } else {
            const categoryMatches = categoryCatalogFoods.filter((f) =>
              f.producto.toLowerCase().includes(currentQuery)
            );
            displayFoods =
              categoryMatches.length > 0
                ? categoryMatches
                : initialFoods.filter((f) =>
                    f.producto.toLowerCase().includes(currentQuery)
                  );
          }

          const isHighlighted = highlightedGroup?.toLowerCase() === name.toLowerCase();

          return (
            <details
              key={name}
              id={`category-group-${name.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "group bg-white rounded-2xl border overflow-hidden transition-all duration-500",
                isHighlighted
                  ? "border-emerald-500 ring-4 ring-emerald-500/50 shadow-xl shadow-emerald-500/20 bg-emerald-50/20"
                  : "border-slate-200 shadow-sm"
              )}
              open={openGroups ? openGroups.includes(name) : (groupIndex === firstLacteosIndex || isHighlighted)}
              onToggle={(event) => {
                const isOpen = event.currentTarget.open;
                setOpenGroups((current) => {
                  const next = new Set(
                    current ||
                      groups
                        .filter((_, index) => index === firstLacteosIndex)
                        .map(([groupName]) => groupName),
                  );
                  if (isOpen) next.add(name);
                  else next.delete(name);
                  return Array.from(next);
                });
              }}
            >
              <summary className="list-none cursor-pointer select-none bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 text-emerald-600 transition-transform group-open:rotate-180" />
                  <h3 className="font-bold text-slate-700 uppercase tracking-tight text-sm flex items-center gap-2">
                    {name}
                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                      {foods.length}
                    </span>
                  </h3>
                  <span className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 group-open:inline">
                    Ocultar alimentos
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 group-open:hidden">
                    Ver alimentos
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleToggleInlineAddFood(name);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 text-xs font-bold px-2.5",
                      isInlineSearchOpen
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-emerald-600 hover:bg-emerald-50"
                    )}
                    title={`Añadir alimento a ${name}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Añadir</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setGroupToDelete(name);
                      setIsDeleteGroupConfirmOpen(true);
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg cursor-pointer"
                    title={`Eliminar categoría ${name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </summary>

              <div className="divide-y divide-slate-100">
                {/* Food Searcher: Desktop Inline vs Mobile Full-Screen Modal */}
                {isInlineSearchOpen && (
                  <>
                    {/* Desktop Inline Panel */}
                    <div className="hidden sm:block p-4 bg-emerald-50/20 border-b border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder={`Buscar o seleccionar alimentos para ${name}...`}
                            value={inlineFoodQueries[name] || ""}
                            onChange={(e) =>
                              setInlineFoodQueries((prev) => ({
                                ...prev,
                                [name]: e.target.value,
                              }))
                            }
                            autoFocus
                            className="h-10 pl-10 bg-white border-slate-200 rounded-xl font-medium text-xs sm:text-sm focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveInlineFoodGroup(null)}
                          className="h-10 px-4 text-emerald-700 bg-white hover:bg-emerald-50 border-emerald-300 font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          Listo
                        </Button>
                      </div>

                      {/* Catalog Foods List Scoped to Category */}
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {displayFoods.length === 0 ? (
                          <div className="py-4 text-center text-xs font-semibold text-slate-400">
                            No se encontraron alimentos en la despensa para "{name}".
                          </div>
                        ) : (
                          displayFoods.map((foodItem) => {
                            const isAlreadyInCat = foods.some(
                              (f) => f.producto.toLowerCase() === foodItem.producto.toLowerCase()
                            );

                            return (
                              <div
                                key={foodItem.producto}
                                className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200/90 rounded-xl hover:border-emerald-400 hover:shadow-2xs transition-all text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 truncate">
                                    {foodItem.producto}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium flex gap-2 flex-wrap">
                                    <span className="text-orange-600 font-bold">
                                      {foodItem.calorias || 0} kcal
                                    </span>
                                    <span>· P: {foodItem.proteinas || 0}g</span>
                                    <span>· C: {foodItem.carbohidratos || 0}g</span>
                                    <span>· L: {foodItem.lipidos || 0}g</span>
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  disabled={isAlreadyInCat}
                                  onClick={() => {
                                    if (addFoodToGroup) {
                                      addFoodToGroup(foodItem, name);
                                    } else {
                                      openAddModal(name);
                                    }
                                  }}
                                  className={cn(
                                    "h-8 px-3 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer",
                                    isAlreadyInCat
                                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                  )}
                                >
                                  {isAlreadyInCat ? (
                                    <span className="flex items-center gap-1">
                                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Agregado
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Plus className="h-3.5 w-3.5" /> Añadir
                                    </span>
                                  )}
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Mobile Full-Screen Modal View */}
                    <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 sm:hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base uppercase tracking-wide">
                            Añadir a {name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {foods.length} alimentos actualmente en esta categoría
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveInlineFoodGroup(null)}
                          className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="py-3">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Buscar alimentos..."
                            value={inlineFoodQueries[name] || ""}
                            onChange={(e) =>
                              setInlineFoodQueries((prev) => ({
                                ...prev,
                                [name]: e.target.value,
                              }))
                            }
                            autoFocus
                            className="h-12 pl-10 bg-slate-50 border-slate-200 rounded-xl font-medium text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 py-2">
                        {displayFoods.length === 0 ? (
                          <div className="py-8 text-center text-xs font-semibold text-slate-400">
                            No se encontraron alimentos en la despensa para "{name}".
                          </div>
                        ) : (
                          displayFoods.map((foodItem) => {
                            const isAlreadyInCat = foods.some(
                              (f) => f.producto.toLowerCase() === foodItem.producto.toLowerCase()
                            );

                            return (
                              <div
                                key={foodItem.producto}
                                className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 truncate text-sm">
                                    {foodItem.producto}
                                  </p>
                                  <p className="text-xs text-slate-500 font-medium flex gap-1.5 flex-wrap">
                                    <span className="text-orange-600 font-bold">
                                      {foodItem.calorias || 0} kcal
                                    </span>
                                    <span>· P: {foodItem.proteinas || 0}g</span>
                                    <span>· C: {foodItem.carbohidratos || 0}g</span>
                                    <span>· L: {foodItem.lipidos || 0}g</span>
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  disabled={isAlreadyInCat}
                                  onClick={() => {
                                    if (addFoodToGroup) {
                                      addFoodToGroup(foodItem, name);
                                    } else {
                                      openAddModal(name);
                                    }
                                  }}
                                  className={cn(
                                    "h-9 px-3.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer",
                                    isAlreadyInCat
                                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      : "bg-emerald-600 text-white"
                                  )}
                                >
                                  {isAlreadyInCat ? "Agregado" : "Añadir"}
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <Button
                          type="button"
                          onClick={() => setActiveInlineFoodGroup(null)}
                          className="w-full h-12 bg-emerald-600 text-white font-bold rounded-xl text-sm"
                        >
                          Listo ({foods.length} en categoría)
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Active Foods in Category */}
                {foods.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 font-semibold italic">
                    No hay alimentos en la categoría {name}. Haz clic en "Añadir alimento" abajo para agregarlos.
                  </div>
                ) : (
                  foods.map((food, idx) => (
                    <div
                      key={`${food.producto}-${idx}`}
                      className="p-4 flex flex-row items-center justify-between gap-4 group hover:bg-emerald-50/10 transition-all border-b border-slate-50 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-slate-900 text-sm truncate">
                            {food.producto}
                          </p>
                          {food.isDraft && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200 shrink-0">
                              Borrador
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-[11px] text-slate-500 font-medium items-center flex-wrap">
                          <span className="text-orange-600 font-bold">
                            {food.calorias || 0} kcal
                          </span>
                          <span>·</span>
                          <span className="text-blue-600">
                            P: {food.proteinas || 0}g
                          </span>
                          <span>·</span>
                          <span className="text-emerald-600">
                            C: {food.carbohidratos || 0}g
                          </span>
                          <span>·</span>
                          <span className="text-yellow-600">
                            L: {food.lipidos || 0}g
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {food.isDraft && (
                          <button
                            onClick={() => openDraftFoodEditor(food)}
                            className="flex items-center justify-center h-8 w-8 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-all"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-lg cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest leading-none border border-slate-200/50"
                          title="Ver Detalles"
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Detalles</span>
                        </button>
                        <button
                          onClick={() => removeFood(food.producto)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-lg cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest leading-none border border-rose-200/30"
                          title="Quitar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Quitar</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Bottom Add Food Button inside Category Accordion */}
                {!isInlineSearchOpen && (
                  <button
                    onClick={() => handleToggleInlineAddFood(name)}
                    className="w-full p-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir alimento a {name}
                  </button>
                )}
              </div>
            </details>
          );
        })}

        {/* Bottom Inline Category Addition Button */}
        {!isAddingCategoryInline && (
          <button
            onClick={() => setIsAddingCategoryInline(true)}
            className="w-full py-5 border-2 border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="h-5 w-5" />
            Añadir nueva categoría personalizada
          </button>
        )}
      </div>

      {/* Naty AI Base Generation Modal */}
      <DietGenerateNatyModal
        isOpen={isGenerateNatyModalOpen}
        onClose={() => setIsGenerateNatyModalOpen(false)}
        activeCategories={Object.keys(allGroupsToRender)}
        initialFoods={initialFoods}
        onApplyGeneratedFoods={handleApplyGeneratedFoods}
      />
    </div>
  );
};

