"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Check,
  Filter,
  FolderPlus,
  Layers,
  Plus,
  Search,
  Scale,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TagInput } from "@/components/ui/TagInput";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { toast } from "sonner";
import { Ingredient } from "@/features/foods";
import AddIngredientsToGroupModal from "../AddIngredientsToGroupModal";

type GroupTab = "Mis grupos" | "Crear grupo";
type GroupType = "INGREDIENT";

type NutrientKey =
  | "calories"
  | "proteins"
  | "carbs"
  | "lipids"
  | "sugars"
  | "fiber"
  | "sodium"
  | "cholesterol"
  | "potassium"
  | "vitaminA"
  | "vitaminC"
  | "calcium"
  | "iron";

type Comparator = "gte" | "lte";

interface IngredientWithMetrics extends Ingredient {
  cholesterol?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}

interface GroupEntry {
  ingredient?: IngredientWithMetrics;
  amount: number;
  unit: string;
  brandSuggestion?: string;
  entryId: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  type: GroupType;
  tags?: { id: string; name: string }[];
  ingredients?: GroupEntry[];
  _count?: { entries?: number; ingredients?: number };
}

interface FilterDraft {
  id: string;
  nutrient: NutrientKey;
  comparator: Comparator;
  value: string;
}

interface GruposClientProps {
  initialIngredients: Ingredient[];
}

const nutrientOptions: Array<{ value: NutrientKey; label: string; unit: string }> = [
  { value: "calories", label: "Calorías", unit: "kcal" },
  { value: "proteins", label: "Proteínas", unit: "g" },
  { value: "carbs", label: "Carbos", unit: "g" },
  { value: "lipids", label: "Grasas", unit: "g" },
  { value: "sugars", label: "Azúcares", unit: "g" },
  { value: "fiber", label: "Fibra", unit: "g" },
  { value: "sodium", label: "Sodio", unit: "mg" },
  { value: "cholesterol", label: "Colesterol", unit: "mg" },
  { value: "potassium", label: "Potasio", unit: "mg" },
  { value: "vitaminA", label: "Vitamina A", unit: "mcg" },
  { value: "vitaminC", label: "Vitamina C", unit: "mg" },
  { value: "calcium", label: "Calcio", unit: "mg" },
  { value: "iron", label: "Hierro", unit: "mg" },
];

const createFilterDraft = (): FilterDraft => ({
  id: `filter-${Math.random().toString(36).slice(2, 9)}`,
  nutrient: "calories",
  comparator: "gte",
  value: "",
});

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getNutrientValue = (ingredient: IngredientWithMetrics, nutrient: NutrientKey) => {
  const raw = (ingredient as any)[nutrient];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim()) return Number(raw);
  return 0;
};

export default function GruposClient({ initialIngredients }: GruposClientProps) {
  const [activeTab, setActiveTab] = useState<GroupTab>("Mis grupos");
  const [ingredients, setIngredients] = useState<IngredientWithMetrics[]>(initialIngredients as IngredientWithMetrics[]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [groupCurrentPage, setGroupCurrentPage] = useState(1);
  const groupItemsPerPage = 10;

  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupTags, setGroupTags] = useState<string[]>([]);

  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(new Set());
  const [createSearchDraft, setCreateSearchDraft] = useState("");
  const [createCategoryDraft, setCreateCategoryDraft] = useState("ALL");
  const [createFilterDrafts, setCreateFilterDrafts] = useState<FilterDraft[]>([createFilterDraft()]);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("ALL");
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft[]>([]);
  const [createCurrentPage, setCreateCurrentPage] = useState(1);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  const isAnyModalOpen = isAddIngredientModalOpen || isDeleteConfirmOpen;
  useScrollLock(isAnyModalOpen);

  const getToken = () => getAuthToken();

  useEffect(() => {
    setIngredients(initialIngredients as IngredientWithMetrics[]);
  }, [initialIngredients]);

  const fetchGroups = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoadingGroups(true);
    try {
      const res = await fetchApi("/ingredient-groups?type=INGREDIENT", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    setGroupCurrentPage(1);
  }, [selectedGroup?.id]);

  useEffect(() => {
    setCreateCurrentPage(1);
  }, [appliedSearch, appliedCategory, appliedFilters]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    ingredients.forEach((ingredient) => {
      if (ingredient.category?.name) values.add(ingredient.category.name);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [ingredients]);

  const selectedIngredientCount = selectedIngredientIds.size;

  const filteredIngredients = useMemo(() => {
    const search = normalizeText(appliedSearch);

    return ingredients
      .filter((ingredient) => {
        if (appliedCategory !== "ALL" && ingredient.category?.name !== appliedCategory) {
          return false;
        }

        if (!search) return true;

        const haystack = normalizeText(
          [
            ingredient.name,
            ingredient.brand?.name || "",
            ingredient.category?.name || "",
            ...(ingredient.tags?.map((tag) => tag.name) || []),
            ...((ingredient.preferences?.[0]?.tags || []).map((tag) => tag.name) || []),
          ]
            .filter(Boolean)
            .join(" "),
        );

        return haystack.includes(search);
      })
      .filter((ingredient) => {
        return appliedFilters.every((filter) => {
          const valueText = filter.value.trim();
          if (!valueText) return true;

          const target = Number(valueText);
          if (Number.isNaN(target)) return true;

          const currentValue = getNutrientValue(ingredient, filter.nutrient);
          return filter.comparator === "gte"
            ? currentValue >= target
            : currentValue <= target;
        });
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [ingredients, appliedCategory, appliedFilters, appliedSearch]);

  const createTotalPages = Math.max(1, Math.ceil(filteredIngredients.length / 20));
  const paginatedCreateIngredients = filteredIngredients.slice(
    (createCurrentPage - 1) * 20,
    createCurrentPage * 20,
  );

  const handleGroupClick = async (groupId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetchApi(`/ingredient-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const groupDetails = await res.json();
        setSelectedGroup(groupDetails);
      } else {
        toast.error("Error al cargar detalles del grupo");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      toast.error("Error al cargar detalles del grupo");
    }
  };

  const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToDelete(groupId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetchApi(`/ingredient-groups/${groupToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Grupo eliminado correctamente");
        setGroups((prev) => prev.filter((group) => group.id !== groupToDelete));
        if (selectedGroup?.id === groupToDelete) setSelectedGroup(null);
        setIsDeleteConfirmOpen(false);
        setGroupToDelete(null);
      } else {
        toast.error("Error al eliminar el grupo");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Error al eliminar el grupo");
    }
  };

  const handleRemoveEntry = async (groupId: string, ingredientId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetchApi(`/ingredient-groups/${groupId}/ingredients`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredientIds: [ingredientId] }),
      });

      if (res.ok) {
        toast.success("Ingrediente eliminado del grupo");
        if (selectedGroup && selectedGroup.id === groupId) {
          setSelectedGroup({
            ...selectedGroup,
            ingredients:
              selectedGroup.ingredients?.filter(
                (rel) => (rel.ingredient?.id || "") !== ingredientId,
              ) || [],
          });
        }
      } else {
        toast.error("Error al eliminar ingrediente");
      }
    } catch (error) {
      console.error("Error removing ingredient:", error);
      toast.error("Error al eliminar ingrediente");
    }
  };

  const handleItemsAdded = (ingredientIds: string[]) => {
    if (!selectedGroup) return;

    const existingIds = new Set(
      (selectedGroup.ingredients || [])
        .map((rel) => rel.ingredient?.id)
        .filter(Boolean) as string[],
    );

    const newEntries = ingredientIds
      .map((id) => ingredients.find((ingredient) => ingredient.id === id))
      .filter((ingredient): ingredient is IngredientWithMetrics => !!ingredient && !existingIds.has(ingredient.id))
      .map((ingredient) => ({
        ingredient,
        amount: ingredient.amount || 100,
        unit: ingredient.unit || "g",
        brandSuggestion: ingredient.brand?.name || undefined,
        entryId: `local-${ingredient.id}`,
      }));

    setSelectedGroup((prev) =>
      prev
        ? { ...prev, ingredients: [...(prev.ingredients || []), ...newEntries] }
        : prev,
    );
    fetchGroups();
  };

  const groupEntries = selectedGroup?.ingredients || [];
  const groupTotalPages = Math.max(1, Math.ceil(groupEntries.length / groupItemsPerPage));
  const paginatedGroupEntries = groupEntries.slice(
    (groupCurrentPage - 1) * groupItemsPerPage,
    groupCurrentPage * groupItemsPerPage,
  );

  const groupTotals = useMemo(() => {
    if (!selectedGroup || groupEntries.length === 0) return null;

    return groupEntries.reduce(
      (acc, rel) => {
        const ingredient = rel.ingredient;
        if (!ingredient) return acc;

        const ratio = rel.amount / (ingredient.amount || 100);
        return {
          calories: acc.calories + (ingredient.calories || 0) * ratio,
          proteins: acc.proteins + (ingredient.proteins || 0) * ratio,
          carbs: acc.carbs + (ingredient.carbs || 0) * ratio,
          lipids: acc.lipids + (ingredient.lipids || 0) * ratio,
          sugars: acc.sugars + (ingredient.sugars || 0) * ratio,
          fiber: acc.fiber + (ingredient.fiber || 0) * ratio,
          sodium: acc.sodium + (ingredient.sodium || 0) * ratio,
        };
      },
      { calories: 0, proteins: 0, carbs: 0, lipids: 0, sugars: 0, fiber: 0, sodium: 0 },
    );
  }, [groupEntries, selectedGroup]);

  const visibleGroups = groups;

  const clearCreateFilters = () => {
    setCreateSearchDraft("");
    setCreateCategoryDraft("ALL");
    setCreateFilterDrafts([createFilterDraft()]);
    setAppliedSearch("");
    setAppliedCategory("ALL");
    setAppliedFilters([]);
  };

  const applyCreateFilters = () => {
    setAppliedSearch(createSearchDraft.trim());
    setAppliedCategory(createCategoryDraft);
    setAppliedFilters(
      createFilterDrafts.filter((filter) => filter.value.trim() !== ""),
    );
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      toast.error("Escribe un nombre para el grupo");
      return;
    }
    if (selectedIngredientIds.size === 0) {
      toast.error("Selecciona al menos un ingrediente");
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("Sesión no válida");
      return;
    }

    setIsCreateSubmitting(true);
    try {
      const response = await fetchApi("/ingredient-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: groupDescription.trim() || undefined,
          tags: groupTags,
          type: "INGREDIENT",
          ingredients: Array.from(selectedIngredientIds).map((id) => ({ id })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error al crear el grupo");
      }

      const createdGroup = await response.json();
      toast.success("Grupo creado correctamente");

      setGroupName("");
      setGroupDescription("");
      setGroupTags([]);
      setSelectedIngredientIds(new Set());
      clearCreateFilters();
      setActiveTab("Mis grupos");
      await fetchGroups();
      await handleGroupClick(createdGroup.id);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("No se pudo crear el grupo");
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const groupTabs: Array<{ label: GroupTab; icon: React.ReactNode }> = [
    { label: "Mis grupos", icon: <Layers size={16} /> },
    { label: "Crear grupo", icon: <FolderPlus size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
            {groupTabs.map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setActiveTab(label);
                  if (label === "Mis grupos") {
                    setSelectedGroup(null);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                  activeTab === label
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/70"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          <p className="max-w-3xl text-sm text-slate-500">
            {activeTab === "Mis grupos"
              ? "Crea colecciones reutilizables de ingredientes para dietas, entregables y flujos rápidos."
              : "Selecciona ingredientes por categoría, busca por nombre y aplica filtros nutricionales antes de crear el grupo."}
          </p>
        </div>

        {activeTab === "Mis grupos" && selectedGroup && (
          <Button
            variant="outline"
            onClick={() => setSelectedGroup(null)}
            className="w-full justify-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 lg:w-auto"
          >
            <ChevronLeft size={16} />
            Volver
          </Button>
        )}
      </div>

      {activeTab === "Mis grupos" ? (
        selectedGroup ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <FolderPlus size={22} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      {selectedGroup.name}
                    </h2>
                    {selectedGroup.description && (
                      <p className="max-w-3xl text-sm leading-6 text-slate-500">
                        {selectedGroup.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedGroup.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => setIsAddIngredientModalOpen(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    Añadir ingredientes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-100 text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDeleteGroup(selectedGroup.id, e)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Eliminar grupo
                  </Button>
                </div>
              </div>

              {groupTotals && groupEntries.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Scale size={18} className="text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      Totales de la agrupación
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Calorías
                      </p>
                      <p className="mt-1 text-xl font-black text-orange-700">
                        {Math.round(groupTotals.calories)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Proteínas
                      </p>
                      <p className="mt-1 text-xl font-black text-blue-700">
                        {groupTotals.proteins.toFixed(1)}g
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                        Carbos
                      </p>
                      <p className="mt-1 text-xl font-black text-emerald-700">
                        {groupTotals.carbs.toFixed(1)}g
                      </p>
                    </div>
                    <div className="rounded-2xl border border-yellow-100 bg-yellow-50/70 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-600">
                        Grasas
                      </p>
                      <p className="mt-1 text-xl font-black text-yellow-700">
                        {groupTotals.lipids.toFixed(1)}g
                      </p>
                    </div>
                    {groupTotals.sugars > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Azúcares
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-700">
                          {groupTotals.sugars.toFixed(1)}g
                        </p>
                      </div>
                    )}
                    {groupTotals.fiber > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Fibra
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-700">
                          {groupTotals.fiber.toFixed(1)}g
                        </p>
                      </div>
                    )}
                    {groupTotals.sodium > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Sodio
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-700">
                          {Math.round(groupTotals.sodium)}mg
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-700">
                  {groupEntries.length} ingredientes en este grupo
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Ingrediente
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Categoría
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Cantidad
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedGroupEntries.length > 0 ? (
                      paginatedGroupEntries.map((relation) => {
                        const ingredient = relation.ingredient;
                        return (
                          <tr key={relation.entryId} className="transition-colors hover:bg-slate-50/70">
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-slate-900">
                                {ingredient?.name || "Ingrediente"}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {ingredient?.brand?.name || relation.brandSuggestion || "Sin marca"}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top text-sm text-slate-600">
                              {ingredient?.category?.name || "-"}
                            </td>
                            <td className="px-5 py-4 align-top text-right text-sm font-semibold text-slate-700">
                              {relation.amount} {relation.unit || ingredient?.unit || "g"}
                            </td>
                            <td className="px-5 py-4 align-top text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleRemoveEntry(selectedGroup.id, ingredient?.id || "")}
                              >
                                <X size={16} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                          Este grupo todavía no tiene ingredientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {groupTotalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={groupCurrentPage}
                  totalPages={groupTotalPages}
                  onPageChange={setGroupCurrentPage}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isLoadingGroups ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Layers size={26} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Aún no tienes grupos</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Puedes crear colecciones de ingredientes para reutilizarlas en dietas, entregables y flujos rápidos.
                </p>
                <Button
                  onClick={() => setActiveTab("Crear grupo")}
                  className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <FolderPlus size={16} className="mr-2" />
                  Crear grupo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupClick(group.id)}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                          <Layers size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{group.name}</h3>
                          <p className="text-xs font-medium text-slate-500">
                            {(group._count?.entries ?? group._count?.ingredients ?? 0)} ingredientes
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGroup(group.id, e)}
                        className="rounded-xl p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {group.description && (
                      <p className="mb-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {group.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {group.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nombre del grupo *
                  </label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ej: Desayunos altos en proteína"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Descripción
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Describe para qué reutilizarás este grupo..."
                    className="min-h-[92px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tags
                  </label>
                  <TagInput
                    value={groupTags}
                    onChange={setGroupTags}
                    placeholder="Escribe y presiona Enter..."
                    fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Ayudan a clasificar el grupo y a encontrarlo más rápido.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                  Selección actual
                </div>
                <div className="mt-3 text-4xl font-black tracking-tight text-emerald-700">
                  {selectedIngredientCount}
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900/75">
                  alimentos seleccionados para el grupo. Puedes cambiar filtros sin perder la selección.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedIngredientIds(new Set())}
                  className="mt-4 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                >
                  Limpiar selección
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_220px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Buscar ingrediente
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={createSearchDraft}
                      onChange={(e) => setCreateSearchDraft(e.target.value)}
                      placeholder="Nombre, marca, categoría o tag"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 focus:bg-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCreateFilters();
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Categoría
                  </label>
                  <select
                    value={createCategoryDraft}
                    onChange={(e) => setCreateCategoryDraft(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="ALL">Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearCreateFilters}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Limpiar
                </Button>
                <Button
                  type="button"
                  onClick={applyCreateFilters}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Buscar
                </Button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Filtros nutricionales
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setCreateFilterDrafts((prev) => [...prev, createFilterDraft()])
                  }
                  className="text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus size={14} className="mr-2" />
                  Añadir filtro
                </Button>
              </div>

              <div className="space-y-3">
                {createFilterDrafts.map((filter, index) => (
                  <div
                    key={filter.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[180px_120px_minmax(0,1fr)_44px]"
                  >
                    <select
                      value={filter.nutrient}
                      onChange={(e) =>
                        setCreateFilterDrafts((prev) =>
                          prev.map((item) =>
                            item.id === filter.id
                              ? { ...item, nutrient: e.target.value as NutrientKey }
                              : item,
                          ),
                        )
                      }
                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      {nutrientOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filter.comparator}
                      onChange={(e) =>
                        setCreateFilterDrafts((prev) =>
                          prev.map((item) =>
                            item.id === filter.id
                              ? { ...item, comparator: e.target.value as Comparator }
                              : item,
                          ),
                        )
                      }
                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="gte">Mayor o igual a</option>
                      <option value="lte">Menor o igual a</option>
                    </select>

                    <div className="relative">
                      <Input
                        type="number"
                        value={filter.value}
                        onChange={(e) =>
                          setCreateFilterDrafts((prev) =>
                            prev.map((item) =>
                              item.id === filter.id
                                ? { ...item, value: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="X"
                        className="h-11 rounded-xl border-slate-200 bg-white focus:bg-white"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {nutrientOptions.find((option) => option.value === filter.nutrient)?.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCreateFilterDrafts((prev) =>
                          prev.length === 1
                            ? [createFilterDraft()]
                            : prev.filter((item) => item.id !== filter.id),
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar filtro"
                    >
                      <X size={16} />
                    </button>

                    {index === 0 && (
                      <p className="md:col-span-4 text-xs text-slate-400">
                        Si dejas el valor vacío, el filtro se ignora. Presiona <span className="font-semibold">Buscar</span> para aplicarlo.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {filteredIngredients.length} ingredientes encontrados
                </p>
                <p className="text-xs text-slate-500">
                  La selección se mantiene aunque cambies de filtro o de categoría.
                </p>
              </div>
              <div className="text-sm font-semibold text-emerald-700">
                {selectedIngredientCount} seleccionados para el grupo
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="w-12 px-4 py-4" />
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Ingrediente
                    </th>
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Categoría
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Calorías
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Proteínas
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Carbos
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Grasas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedCreateIngredients.length > 0 ? (
                    paginatedCreateIngredients.map((ingredient) => {
                      const isSelected = selectedIngredientIds.has(ingredient.id);
                      return (
                        <tr
                          key={ingredient.id}
                          onClick={() =>
                            setSelectedIngredientIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(ingredient.id)) {
                                next.delete(ingredient.id);
                              } else {
                                next.add(ingredient.id);
                              }
                              return next;
                            })
                          }
                          className={cn(
                            "cursor-pointer transition-colors",
                            isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50/70",
                          )}
                        >
                          <td className="px-4 py-4 align-top">
                            <div className={cn(
                              "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white",
                            )}>
                              {isSelected && <Check size={12} />}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="font-semibold text-slate-900">
                              {ingredient.name}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {(ingredient.tags || []).slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                                >
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-slate-600">
                            {ingredient.category?.name || "-"}
                          </td>
                          <td className="px-4 py-4 align-top text-right text-sm font-semibold text-slate-700">
                            {Math.round(ingredient.calories || 0)}
                          </td>
                          <td className="px-4 py-4 align-top text-right text-sm font-semibold text-blue-700">
                            {Number(ingredient.proteins || 0).toFixed(1)}g
                          </td>
                          <td className="px-4 py-4 align-top text-right text-sm font-semibold text-emerald-700">
                            {Number(ingredient.carbs || 0).toFixed(1)}g
                          </td>
                          <td className="px-4 py-4 align-top text-right text-sm font-semibold text-yellow-700">
                            {Number(ingredient.lipids || 0).toFixed(1)}g
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="mx-auto max-w-md space-y-2">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Search size={20} />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            No encontramos ingredientes con esos filtros.
                          </p>
                          <p className="text-sm text-slate-500">
                            Prueba otra categoría o ajusta el valor nutricional.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-slate-500">
                {selectedIngredientCount} alimentos seleccionados para el grupo
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedIngredientIds(new Set())}
                  className="text-slate-600 hover:bg-slate-50"
                >
                  Vaciar selección
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={selectedIngredientCount === 0 || !groupName.trim() || isCreateSubmitting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isCreateSubmitting ? (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Plus size={16} className="mr-2" />
                  )}
                  Crear grupo
                </Button>
              </div>
            </div>
          </div>

          {createTotalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={createCurrentPage}
                totalPages={createTotalPages}
                onPageChange={setCreateCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      <AddIngredientsToGroupModal
        isOpen={isAddIngredientModalOpen}
        onClose={() => setIsAddIngredientModalOpen(false)}
        groupId={selectedGroup?.id || ""}
        groupName={selectedGroup?.name}
        allIngredients={ingredients}
        currentIngredientIds={(selectedGroup?.ingredients || [])
          .map((rel) => rel.ingredient?.id || "")
          .filter(Boolean)}
        onIngredientsAdded={handleItemsAdded}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={confirmDeleteGroup}
        title="Eliminar grupo"
        description="¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
}
