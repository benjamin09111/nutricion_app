"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Check,
  Filter,
  FolderPlus,
  Layers,
  Plus,
  Search,
  UtensilsCrossed,
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

type GroupTab = "Mis grupos" | "Crear grupo";
type CreateViewTab = "alimentos" | "agregados";
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
  const raw = ingredient[nutrient as keyof IngredientWithMetrics];
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
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const createItemsPerPage = 6;

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(true);
  const [createViewTab, setCreateViewTab] = useState<CreateViewTab>("alimentos");

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupTags, setGroupTags] = useState<string[]>([]);

  const [confirmedIngredientIds, setConfirmedIngredientIds] = useState<Set<string>>(new Set());
  const [stagedIngredientIds, setStagedIngredientIds] = useState<Set<string>>(new Set());
  const [createSearchDraft, setCreateSearchDraft] = useState("");
  const [createCategoryDraft, setCreateCategoryDraft] = useState("ALL");
  const [createFilterDrafts, setCreateFilterDrafts] = useState<FilterDraft[]>([createFilterDraft()]);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("ALL");
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft[]>([]);
  const [createCurrentPage, setCreateCurrentPage] = useState(1);
  const [selectedCurrentPage, setSelectedCurrentPage] = useState(1);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  const isAnyModalOpen = isDeleteConfirmOpen;
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
    setCreateCurrentPage(1);
    setSelectedCurrentPage(1);
  }, [appliedSearch, appliedCategory, appliedFilters]);

  useEffect(() => {
    if (editingGroupId) {
      setIsGroupInfoOpen(false);
      setCreateViewTab("agregados");
      return;
    }
    setIsGroupInfoOpen(true);
    setCreateViewTab("alimentos");
  }, [editingGroupId]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    ingredients.forEach((ingredient) => {
      if (ingredient.category?.name) values.add(ingredient.category.name);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
  }, [ingredients]);

  const totalSelectedCount = confirmedIngredientIds.size + stagedIngredientIds.size;
  const stagedCount = stagedIngredientIds.size;

  const selectedIngredients = useMemo(
    () =>
      ingredients
        .filter((ingredient) => confirmedIngredientIds.has(ingredient.id))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [ingredients, confirmedIngredientIds],
  );

  const filteredIngredients = useMemo(() => {
    const search = normalizeText(appliedSearch);

    return ingredients
      .filter((ingredient) => !confirmedIngredientIds.has(ingredient.id))
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
  }, [ingredients, appliedCategory, appliedFilters, appliedSearch, confirmedIngredientIds]);

  const createTotalPages = Math.max(1, Math.ceil(filteredIngredients.length / createItemsPerPage));
  const paginatedCreateIngredients = filteredIngredients.slice(
    (createCurrentPage - 1) * createItemsPerPage,
    createCurrentPage * createItemsPerPage,
  );
  const selectedTotalPages = Math.max(1, Math.ceil(selectedIngredients.length / createItemsPerPage));
  const paginatedSelectedIngredients = selectedIngredients.slice(
    (selectedCurrentPage - 1) * createItemsPerPage,
    selectedCurrentPage * createItemsPerPage,
  );
  const activeCreateIngredients =
    createViewTab === "alimentos" ? paginatedCreateIngredients : paginatedSelectedIngredients;
  const activeCreateTotalPages =
    createViewTab === "alimentos" ? createTotalPages : selectedTotalPages;

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
        setEditingGroupId(groupDetails.id);
        setGroupName(groupDetails.name || "");
        setGroupDescription(groupDetails.description || "");
        setGroupTags((groupDetails.tags || []).map((tag: { name: string }) => tag.name));
        setConfirmedIngredientIds(
          new Set(
            (groupDetails.ingredients || [])
              .map((rel: GroupEntry) => rel.ingredient?.id)
              .filter(Boolean) as string[],
          ),
        );
        setStagedIngredientIds(new Set());
        clearCreateFilters();
        setCreateCurrentPage(1);
        setSelectedCurrentPage(1);
        setCreateViewTab("agregados");
        setIsGroupInfoOpen(false);
        setActiveTab("Crear grupo");
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

  const visibleGroups = groups;

  const clearCreateFilters = () => {
    setCreateSearchDraft("");
    setCreateCategoryDraft("ALL");
    setCreateFilterDrafts([createFilterDraft()]);
    setAppliedSearch("");
    setAppliedCategory("ALL");
    setAppliedFilters([]);
  };

  const handleResetCreate = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupTags([]);
    setConfirmedIngredientIds(new Set());
    setStagedIngredientIds(new Set());
    setSelectedGroup(null);
    setEditingGroupId(null);
    setIsGroupInfoOpen(true);
    setCreateViewTab("alimentos");
    clearCreateFilters();
  };

  const handleConfirmSelection = () => {
    if (stagedCount === 0) {
      toast.info("Todavía no hay alimentos seleccionados");
      return;
    }

    setConfirmedIngredientIds((prev) => new Set([...Array.from(prev), ...Array.from(stagedIngredientIds)]));
    setStagedIngredientIds(new Set());
    setCreateViewTab("agregados");
  };

  const applyCreateFilters = () => {
    setAppliedSearch(createSearchDraft.trim());
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
    const allIngredientIds = new Set([...Array.from(confirmedIngredientIds), ...Array.from(stagedIngredientIds)]);
    if (allIngredientIds.size === 0) {
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
      const payload = {
        name,
        description: groupDescription.trim() || undefined,
        tags: groupTags,
        type: "INGREDIENT",
        ingredients: Array.from(allIngredientIds).map((id) => ({ id })),
      };

      const response = await fetchApi(
        editingGroupId ? `/ingredient-groups/${editingGroupId}` : "/ingredient-groups",
        {
          method: editingGroupId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error al guardar el grupo");
      }

      const savedGroup = await response.json();
      const savedGroupId = savedGroup?.id || editingGroupId;
      toast.success(editingGroupId ? "Grupo actualizado correctamente" : "Grupo creado correctamente");

      await fetchGroups();

      if (savedGroupId) {
        await handleGroupClick(savedGroupId);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(editingGroupId ? "No se pudo actualizar el grupo" : "No se pudo crear el grupo");
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
                  if (label === "Mis grupos") {
                    setSelectedGroup(null);
                    setActiveTab(label);
                  } else {
                    handleResetCreate();
                    setActiveTab(label);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                  activeTab === label
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70"
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

      </div>

      {activeTab === "Mis grupos" ? (
        <div className="space-y-4">
          {isLoadingGroups ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FolderPlus size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Todavía no tienes grupos
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Puedes crear colecciones de ingredientes para reutilizarlas en dietas, entregables y flujos rápidos.
              </p>
              <Button
                onClick={() => setActiveTab("Crear grupo")}
                className="mt-5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold px-6 py-2.5 rounded-xl transition-all active:scale-95"
              >
                <FolderPlus size={16} className="mr-2" />
                Crear grupo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className="group cursor-pointer rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGroupClick(group.id);
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{group.name}</h3>
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
                        className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="relative z-20 overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setIsGroupInfoOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left rounded-t-3xl"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Información del grupo
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingGroupId
                      ? "Edita el grupo sin salir de esta vista."
                      : "Completa el nombre, descripción y tags del nuevo grupo."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      editingGroupId ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700",
                    )}
                  >
                    {editingGroupId ? "Editando" : "Nuevo"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-slate-400 transition-transform",
                      isGroupInfoOpen && "rotate-180",
                    )}
                  />
                </div>
              </button>

              {isGroupInfoOpen ? (
                <div className="border-t border-slate-100 px-5 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre del grupo *
                      </label>
                      <Input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Ej: Carbohidratos Complejos"
                        className="rounded-xl border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Descripción
                      </label>
                      <Input
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder="Ej: Legumbres y granos integrales"
                        className="rounded-xl border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tags
                    </label>
                    <TagInput
                      tags={groupTags}
                      setTags={setGroupTags}
                      placeholder="Agrega etiquetas..."
                      className="rounded-xl border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex gap-1.5">
                      <span className="font-semibold text-slate-500">Nombre:</span>
                      <span className="text-slate-700">{groupName || "Sin nombre"}</span>
                    </div>
                    {groupTags.length > 0 && (
                      <div className="flex gap-1.5">
                        <span className="font-semibold text-slate-500">Tags:</span>
                        <div className="flex gap-1">
                          {groupTags.map((tag) => (
                            <span key={tag} className="text-emerald-600">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCreateViewTab("alimentos")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      createViewTab === "alimentos"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <Search size={14} />
                    Alimentos
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateViewTab("agregados")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      createViewTab === "agregados"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <UtensilsCrossed size={14} />
                    Ya seleccionados ({confirmedIngredientIds.size})
                  </button>
                </div>

                {createViewTab === "alimentos" && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={createSearchDraft}
                      onChange={(e) => setCreateSearchDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyCreateFilters()}
                      placeholder="Buscar en el catálogo..."
                      className="h-9 w-48 rounded-xl border-slate-200 text-xs focus:ring-emerald-500 lg:w-64"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyCreateFilters}
                      className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Filter size={14} className="mr-2" />
                      Filtros
                    </Button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="w-10 px-4 py-4"></th>
                      <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Ingrediente
                      </th>
                      <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Categoría
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Calorías
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Proteínas
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Carbos
                      </th>
                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Grasas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeCreateIngredients.length > 0 ? (
                      activeCreateIngredients.map((ingredient) => {
                        const isStaged = stagedIngredientIds.has(ingredient.id);
                        const isConfirmed = confirmedIngredientIds.has(ingredient.id);
                        
                        const isSelected = createViewTab === "alimentos" ? isStaged : isConfirmed;

                        return (
                          <tr
                            key={ingredient.id}
                            onClick={() => {
                              if (createViewTab === "alimentos") {
                                setStagedIngredientIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(ingredient.id)) {
                                    next.delete(ingredient.id);
                                  } else {
                                    next.add(ingredient.id);
                                  }
                                  return next;
                                });
                              } else {
                                setConfirmedIngredientIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(ingredient.id);
                                  return next;
                                });
                              }
                            }}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50/70",
                            )}
                          >
                            <td className="px-4 py-4 align-top">
                              <div
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                  isSelected
                                    ? (createViewTab === "alimentos" ? "border-indigo-600 bg-indigo-600 text-white" : "border-red-600 bg-red-600 text-white")
                                    : "border-slate-300 bg-white",
                                )}
                              >
                                {isSelected && (createViewTab === "alimentos" ? <Check size={12} /> : <X size={12} />)}
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
                              {createViewTab === "alimentos" 
                                ? "No encontramos ingredientes con esos filtros." 
                                : "Aún no has agregado ingredientes a este grupo."}
                            </p>
                            <p className="text-sm text-slate-500">
                              {createViewTab === "alimentos" 
                                ? "Prueba otra categoría o ajusta el valor nutricional." 
                                : "Busca alimentos en la pestaña anterior y selecciónalos."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {activeCreateTotalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={createViewTab === "alimentos" ? createCurrentPage : selectedCurrentPage}
                  totalPages={activeCreateTotalPages}
                  onPageChange={createViewTab === "alimentos" ? setCreateCurrentPage : setSelectedCurrentPage}
                />
              </div>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[25vh] xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Alimentos
                  </p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">
                    {totalSelectedCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <UtensilsCrossed size={22} />
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Seleccionados para el grupo actual.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Atajos rápidos
              </p>
              <div className="mt-3 space-y-3">
                <Button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={stagedCount === 0}
                  className="w-full min-h-[52px] h-auto cursor-pointer border-indigo-100 bg-indigo-50 px-4 text-indigo-700 hover:bg-indigo-100 rounded-[1.25rem] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2 py-1.5 w-full">
                    <Plus size={18} className="shrink-0" />
                    <span className="font-semibold text-xs sm:text-[13px] leading-tight text-center whitespace-normal max-w-[200px]">
                      Confirmar {stagedCount} seleccionados
                    </span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={totalSelectedCount === 0 || !groupName.trim() || isCreateSubmitting}
                  className="w-full h-[52px] cursor-pointer bg-indigo-600 px-4 text-white hover:bg-indigo-700 shadow-sm rounded-[1.25rem] transition-all"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isCreateSubmitting ? (
                      <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Check size={18} className="shrink-0" />
                    )}
                    <span className="font-semibold text-sm">{editingGroupId ? "Guardar grupo" : "Crear grupo"}</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetCreate}
                  className="w-full h-[52px] cursor-pointer border-slate-200 px-4 text-slate-600 hover:bg-slate-50 rounded-[1.25rem] transition-all"
                >
                  <span className="font-semibold text-sm">Reiniciar</span>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
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
