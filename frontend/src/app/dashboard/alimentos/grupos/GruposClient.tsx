"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  Filter,
  FolderPlus,
  Eye,
  LayoutGrid,
  Layers,
  Pencil,
  Plus,
  Search,
  Lock,
  Table2,
  UtensilsCrossed,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
import { TagInput } from "@/components/ui/TagInput";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useSubscription } from "@/context/SubscriptionContext";
import { toast } from "sonner";
import { Ingredient } from "@/features/foods";
import CreateIngredientModal from "../CreateIngredientModal";
import CreateIngredientForm from "../CreateIngredientForm";
import IngredientDetailsModal from "../IngredientDetailsModal";

type GroupTab = "Mis grupos" | "Crear grupo";
type CreateViewTab = "alimentos" | "agregados";
type MyGroupsTab = "groups" | "mine" | "community";
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

type IngredientAssignmentDraft =
  | { mode: "none" }
  | { mode: "existing"; groupId: string }
  | { mode: "new"; groupName: string };

interface GruposClientProps {
  initialIngredients: Ingredient[];
  headerRight?: React.ReactNode;
  freemiumGroupCount?: number;
  onGroupCountChange?: (count: number) => void;
}

type IngredientSourceTab = "catalog" | "mine" | "community";
type SourceLoadingMeta = {
  loaded: boolean;
  loading: boolean;
  count: number;
};

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

const sameStringSet = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  const normalizedLeft = [...left].sort().join("|");
  const normalizedRight = [...right].sort().join("|");
  return normalizedLeft === normalizedRight;
};

const getNutrientValue = (ingredient: IngredientWithMetrics, nutrient: NutrientKey) => {
  const raw = ingredient[nutrient as keyof IngredientWithMetrics];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim()) return Number(raw);
  return 0;
};

export default function GruposClient({
  initialIngredients,
  headerRight,
  freemiumGroupCount,
  onGroupCountChange,
}: GruposClientProps) {
  const [activeTab, setActiveTab] = useState<GroupTab>("Mis grupos");
  const [ingredients, setIngredients] = useState<IngredientWithMetrics[]>(initialIngredients as IngredientWithMetrics[]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isLoadingSelectedGroup, setIsLoadingSelectedGroup] = useState(false);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const createItemsPerPage = 6;

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(true);
  const [createViewTab, setCreateViewTab] = useState<CreateViewTab>("alimentos");
  const [myGroupsTab, setMyGroupsTab] = useState<MyGroupsTab>("groups");
  const [groupsDisplayMode, setGroupsDisplayMode] = useState<"cards" | "table">("cards");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedGroupData, setExpandedGroupData] = useState<Group | null>(null);
  const [expandedGroupLoading, setExpandedGroupLoading] = useState(false);
  const [isIngredientSourceLoading, setIsIngredientSourceLoading] = useState(false);
  const [ingredientSourceMeta, setIngredientSourceMeta] = useState<Record<IngredientSourceTab, SourceLoadingMeta>>({
    catalog: { loaded: true, loading: false, count: initialIngredients.length },
    mine: { loaded: false, loading: false, count: 0 },
    community: { loaded: false, loading: false, count: 0 },
  });
  const [selectedSourceGroup, setSelectedSourceGroup] = useState<IngredientSourceTab | null>(null);
  const [selectedSourceIngredients, setSelectedSourceIngredients] = useState<IngredientWithMetrics[]>([]);
  const [isSelectedSourceLoading, setIsSelectedSourceLoading] = useState(false);
  const [isCreateIngredientOpen, setIsCreateIngredientOpen] = useState(false);
  const [ingredientToAdd, setIngredientToAdd] = useState<IngredientWithMetrics | null>(null);
  const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false);
  const [selectedIngredientDetails, setSelectedIngredientDetails] = useState<IngredientWithMetrics | null>(null);
  const [isIngredientDetailsOpen, setIsIngredientDetailsOpen] = useState(false);
  const [sourceDisplayMode, setSourceDisplayMode] = useState<"cards" | "table">("cards");
  const [sourceViewMode, setSourceViewMode] = useState<"list" | "create">("list");
  const [sourceCurrentPage, setSourceCurrentPage] = useState(1);

  const sourceItemsPerPage = sourceDisplayMode === "table" ? 10 : 6;

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [createCurrentPage, setCreateCurrentPage] = useState(1);
  const [selectedCurrentPage, setSelectedCurrentPage] = useState(1);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [activeIngredientSource, setActiveIngredientSource] = useState<IngredientSourceTab>("catalog");
  const [allIngredients, setAllIngredients] = useState<IngredientWithMetrics[]>(initialIngredients as IngredientWithMetrics[]);

  const { currentPlan } = useSubscription();
  const didInitialIngredientFetchRef = useRef(false);
  const sourceCacheRef = useRef<Record<IngredientSourceTab, IngredientWithMetrics[]>>({
    catalog: initialIngredients as IngredientWithMetrics[],
    mine: [],
    community: [],
  });
  const ingredientSourceMetaRef = useRef(ingredientSourceMeta);
  const skipNextSourceFetchRef = useRef(false);

  useEffect(() => {
    ingredientSourceMetaRef.current = ingredientSourceMeta;
  }, [ingredientSourceMeta]);

  const isAnyModalOpen = isDeleteConfirmOpen;
  useScrollLock(isAnyModalOpen);

  const getToken = useCallback(() => getAuthToken(), []);
  const isFreemium = String(currentPlan?.key || currentPlan?.slug || "").toLowerCase() === "free";
  const freemiumGroupLimit = 2;
  const freemiumLimitReached = isFreemium && (freemiumGroupCount ?? groups.length) >= freemiumGroupLimit;

  const sourceTabToApiTab = useCallback((sourceTab: IngredientSourceTab) => {
    switch (sourceTab) {
      case "mine":
        return "mine";
      case "community":
        return "community";
      default:
        return "app";
    }
  }, []);

  useEffect(() => {
    const nextIngredients = initialIngredients as IngredientWithMetrics[];
    setIngredients(nextIngredients);
    setAllIngredients(nextIngredients);
    sourceCacheRef.current.catalog = nextIngredients;
    setIngredientSourceMeta((prev) => ({
      ...prev,
      catalog: { loaded: true, loading: false, count: nextIngredients.length },
    }));
  }, [initialIngredients]);

  const mergeIngredients = useCallback((items: IngredientWithMetrics[]) => {
    setAllIngredients((prev) => {
      const map = new Map(prev.map((item) => [item.id, item] as const));
      items.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    });
  }, []);

  const loadIngredientSourceTab = useCallback(
    async (sourceTab: IngredientSourceTab) => {
      skipNextSourceFetchRef.current = true;
      setActiveIngredientSource(sourceTab);
      setStagedIngredientIds(new Set());
      setCreateCurrentPage(1);
      setSelectedCurrentPage(1);

      const meta = ingredientSourceMetaRef.current[sourceTab];
      const cached = sourceCacheRef.current[sourceTab] || [];
      const hasCreateFilters =
        appliedSearch.trim().length > 0 || appliedCategory !== "ALL" || appliedFilters.length > 0;
      const shouldUpdateCount = !hasCreateFilters;

      if (meta.loaded && !hasCreateFilters) {
        setIngredients(cached);
        mergeIngredients(cached);
        return;
      }

      if (meta.loading) return;

      setIngredients([]);
      const token = getToken();
      if (!token) {
        skipNextSourceFetchRef.current = false;
        return;
      }

      setIsIngredientSourceLoading(true);
      setIngredientSourceMeta((prev) => ({
        ...prev,
        [sourceTab]: { ...prev[sourceTab], loading: true },
      }));

      try {
        const queryParams = new URLSearchParams({
          tab: sourceTabToApiTab(sourceTab),
          limit: "100",
          ...(appliedSearch.trim() && { search: appliedSearch.trim() }),
          ...(appliedCategory !== "ALL" && { category: appliedCategory }),
        });

        const res = await fetchApi(`/foods?${queryParams.toString()}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const nextIngredients = Array.isArray(data) ? (data as IngredientWithMetrics[]) : [];
        sourceCacheRef.current[sourceTab] = nextIngredients;
        setIngredients(nextIngredients);
        mergeIngredients(nextIngredients);
        setIngredientSourceMeta((prev) => ({
          ...prev,
          [sourceTab]: {
            loaded: true,
            loading: false,
            count: shouldUpdateCount ? nextIngredients.length : prev[sourceTab].count,
          },
        }));
      } catch (error) {
        console.error("Error loading ingredient source:", error);
      } finally {
        setIsIngredientSourceLoading(false);
        setIngredientSourceMeta((prev) => ({
          ...prev,
          [sourceTab]: {
            ...prev[sourceTab],
            loading: false,
            count: shouldUpdateCount
              ? sourceCacheRef.current[sourceTab]?.length ?? prev[sourceTab].count
              : prev[sourceTab].count,
          },
        }));
      }
    },
    [appliedCategory, appliedFilters.length, appliedSearch, getToken, mergeIngredients, sourceTabToApiTab],
  );

  const openPreviewSourceTab = useCallback(
    async (sourceTab: IngredientSourceTab) => {
      setSelectedSourceGroup(sourceTab);
      setSelectedSourceIngredients([]);
      setSourceCurrentPage(1);
      setIsSelectedSourceLoading(true);

      const meta = ingredientSourceMetaRef.current[sourceTab];

      if (meta.loading) {
        setIsSelectedSourceLoading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        setIsSelectedSourceLoading(false);
        return;
      }

      setIngredientSourceMeta((prev) => ({
        ...prev,
        [sourceTab]: { ...prev[sourceTab], loading: true },
      }));

      try {
        const res = await fetchApi(
          `/foods?tab=${sourceTabToApiTab(sourceTab)}&limit=100`,
          {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) return;

        const data = await res.json();
        const nextIngredients = Array.isArray(data) ? (data as IngredientWithMetrics[]) : [];
        sourceCacheRef.current[sourceTab] = nextIngredients;
        setSelectedSourceIngredients(nextIngredients);
        setIngredientSourceMeta((prev) => ({
          ...prev,
          [sourceTab]: { loaded: true, loading: false, count: nextIngredients.length },
        }));
      } catch (error) {
        console.error("Error loading preview source:", error);
      } finally {
        setIsSelectedSourceLoading(false);
        setIngredientSourceMeta((prev) => ({
          ...prev,
          [sourceTab]: {
            ...prev[sourceTab],
            loading: false,
            loaded: prev[sourceTab].loaded,
          },
        }));
      }
    },
    [getToken, sourceTabToApiTab],
  );

  useEffect(() => {
    setStagedIngredientIds(new Set());
    setCreateCurrentPage(1);
    setSourceCurrentPage(1);
  }, [activeIngredientSource]);

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
        onGroupCountChange?.(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [getToken, onGroupCountChange]);

  const fetchIngredients = useCallback(
    async (sourceTab: IngredientSourceTab = activeIngredientSource) => {
      const meta = ingredientSourceMetaRef.current[sourceTab];
      const cached = sourceCacheRef.current[sourceTab] || [];
      const hasCreateFilters =
        appliedSearch.trim().length > 0 || appliedCategory !== "ALL" || appliedFilters.length > 0;

      if (meta.loaded && !hasCreateFilters) {
        setIngredients(cached);
        mergeIngredients(cached);
        return;
      }

      if (meta.loading) return;

      const token = getToken();
      if (!token) return;

      setIsIngredientSourceLoading(true);
      setIngredientSourceMeta((prev) => ({
        ...prev,
        [sourceTab]: { ...prev[sourceTab], loading: true },
      }));

      try {
        const queryParams = new URLSearchParams({
          tab: sourceTabToApiTab(sourceTab),
          limit: "100",
          ...(appliedSearch.trim() && { search: appliedSearch.trim() }),
          ...(appliedCategory !== "ALL" && { category: appliedCategory }),
        });

        const res = await fetchApi(`/foods?${queryParams.toString()}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const nextIngredients = Array.isArray(data) ? (data as IngredientWithMetrics[]) : [];
        sourceCacheRef.current[sourceTab] = nextIngredients;
        setIngredients(nextIngredients);
        mergeIngredients(nextIngredients);
        setIngredientSourceMeta((prev) => ({
          ...prev,
          [sourceTab]: { loaded: true, loading: false, count: nextIngredients.length },
        }));
      } catch (error) {
        console.error("Error fetching source ingredients:", error);
      }
      finally {
        setIsIngredientSourceLoading(false);
        setIngredientSourceMeta((prev) => ({
          ...prev,
          [sourceTab]: {
            ...prev[sourceTab],
            loading: false,
            loaded: true,
            count: sourceCacheRef.current[sourceTab]?.length ?? prev[sourceTab].count,
          },
        }));
      }
    },
    [activeIngredientSource, appliedCategory, appliedFilters.length, appliedSearch, getToken, mergeIngredients, sourceTabToApiTab],
  );

  useEffect(() => {
    if (!didInitialIngredientFetchRef.current) {
      didInitialIngredientFetchRef.current = true;
      return;
    }

    if (skipNextSourceFetchRef.current) {
      skipNextSourceFetchRef.current = false;
      return;
    }

    fetchIngredients(activeIngredientSource);
  }, [activeIngredientSource, fetchIngredients]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    setCreateCurrentPage(1);
    setSelectedCurrentPage(1);
  }, [appliedSearch, appliedCategory, appliedFilters]);

  useEffect(() => {
    setSourceCurrentPage(1);
  }, [sourceDisplayMode, selectedSourceGroup]);

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
  const activeFiltersCount = appliedFilters.length + (appliedSearch ? 1 : 0) + (appliedCategory !== "ALL" ? 1 : 0);

  const selectedIngredients = useMemo(
    () =>
      allIngredients
        .filter((ingredient) => confirmedIngredientIds.has(ingredient.id))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [allIngredients, confirmedIngredientIds],
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
  const sourceTotalPages = Math.max(1, Math.ceil(selectedSourceIngredients.length / sourceItemsPerPage));
  const paginatedSourceIngredients = selectedSourceIngredients.slice(
    (sourceCurrentPage - 1) * sourceItemsPerPage,
    sourceCurrentPage * sourceItemsPerPage,
  );
  const activeCreateIngredients =
    createViewTab === "alimentos" ? paginatedCreateIngredients : paginatedSelectedIngredients;
  const activeCreateTotalPages =
    createViewTab === "alimentos" ? createTotalPages : selectedTotalPages;
  const selectedGroupIngredientIds = useMemo(
    () =>
      (selectedGroup?.ingredients || [])
        .map((entry) => entry.ingredient?.id)
        .filter(Boolean) as string[],
    [selectedGroup],
  );
  const hasGroupChanges = useMemo(() => {
    if (!editingGroupId || !selectedGroup) return true;

    const currentConfirmedIngredientIds = Array.from(
      new Set([...Array.from(confirmedIngredientIds), ...Array.from(stagedIngredientIds)]),
    );

    const currentName = groupName.trim();
    const currentDescription = groupDescription.trim();
    const originalName = (selectedGroup.name || "").trim();
    const originalDescription = (selectedGroup.description || "").trim();
    const currentTags = groupTags.map((tag) => tag.trim()).filter(Boolean);
    const originalTags = (selectedGroup.tags || []).map((tag) => tag.name.trim()).filter(Boolean);

    return (
      currentName !== originalName ||
      currentDescription !== originalDescription ||
      !sameStringSet(currentTags, originalTags) ||
      !sameStringSet(currentConfirmedIngredientIds, selectedGroupIngredientIds)
    );
  }, [
    confirmedIngredientIds,
    editingGroupId,
    groupDescription,
    groupName,
    groupTags,
    selectedGroup,
    selectedGroupIngredientIds,
    stagedIngredientIds,
  ]);

  const handleGroupClick = async (groupId: string) => {
    if (isFreemium) {
      toast.info("La edición de grupos estará disponible en próximas actualizaciones.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setPendingGroupId(groupId);
    setIsLoadingSelectedGroup(true);
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
    } finally {
      setIsLoadingSelectedGroup(false);
      setPendingGroupId(null);
    }
  };

  const toggleGroupExpand = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      setExpandedGroupData(null);
      return;
    }

    setExpandedGroupId(groupId);
    setExpandedGroupData(null);
    setExpandedGroupLoading(true);

    const token = getToken();
    if (!token) {
      setExpandedGroupLoading(false);
      return;
    }

    try {
      const res = await fetchApi(`/ingredient-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error("Error al cargar el grupo");
        setExpandedGroupId(null);
        return;
      }

      const groupDetails = (await res.json()) as Group;
      setExpandedGroupData(groupDetails);
    } catch (error) {
      console.error("Error fetching group view:", error);
      toast.error("Error al cargar el grupo");
      setExpandedGroupId(null);
    } finally {
      setExpandedGroupLoading(false);
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
    setCreateCurrentPage(1);
    setSelectedCurrentPage(1);
    setIsFiltersOpen(false);
  };

  const handleClearFilters = () => {
    clearCreateFilters();
  };

  const handleResetCreate = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupTags([]);
    setConfirmedIngredientIds(new Set());
    setStagedIngredientIds(new Set());
    setSelectedGroup(null);
    setEditingGroupId(null);
    setIsLoadingSelectedGroup(false);
    setPendingGroupId(null);
    void loadIngredientSourceTab("catalog");
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
    setAppliedCategory(createCategoryDraft);
    setAppliedFilters(
      createFilterDrafts.filter((filter) => filter.value.trim() !== ""),
    );
    setCreateCurrentPage(1);
  };

  const handleApplyFilters = () => {
    applyCreateFilters();
    setIsFiltersOpen(false);
  };

  const handleQuickSearchChange = (value: string) => {
    setCreateSearchDraft(value);
    setAppliedSearch(value);
    setCreateCurrentPage(1);
    setSelectedCurrentPage(1);
  };

  const updateFilterDraft = (draftId: string, patch: Partial<FilterDraft>) => {
    setCreateFilterDrafts((prev) =>
      prev.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              ...patch,
            }
          : draft,
      ),
    );
  };

  const addFilterDraft = () => {
    setCreateFilterDrafts((prev) => [...prev, createFilterDraft()]);
  };

  const removeFilterDraft = (draftId: string) => {
    setCreateFilterDrafts((prev) => {
      if (prev.length === 1) return [createFilterDraft()];
      return prev.filter((draft) => draft.id !== draftId);
    });
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      toast.error("Escribe un nombre para el grupo");
      return;
    }
    if (freemiumLimitReached && !editingGroupId) {
      toast.error("En FREEMIUM solo puedes crear 2 grupos. Elimina uno para crear otro.");
      return;
    }
    const allIngredientIds = new Set([...Array.from(confirmedIngredientIds), ...Array.from(stagedIngredientIds)]);
    if (allIngredientIds.size === 0) {
      toast.error("Selecciona al menos un ingrediente");
      return;
    }
    if (editingGroupId && !hasGroupChanges) {
      toast.info("No hay cambios para guardar");
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

  const openAddToGroupModal = (ingredient: IngredientWithMetrics) => {
    setIngredientToAdd(ingredient);
    setIsAddToGroupOpen(true);
  };

  const openIngredientDetails = (ingredient: IngredientWithMetrics) => {
    setSelectedIngredientDetails(ingredient);
    setIsIngredientDetailsOpen(true);
  };

  const addIngredientToGroup = async (groupId: string, ingredient: IngredientWithMetrics) => {

    const token = getToken();
    if (!token) {
      toast.error("Sesión no válida");
      return;
    }

    try {
      const res = await fetchApi(`/ingredient-groups/${groupId}/ingredients`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredientIds: [ingredient.id] }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "No se pudo agregar el alimento");
      }

      toast.success(`"${ingredient.name}" se agregó al grupo`);
      setIsAddToGroupOpen(false);
      setIngredientToAdd(null);
      await fetchGroups();
    } catch (error) {
      console.error("Error adding ingredient to group:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el alimento");
    }
  };

  const handleAddIngredientToGroup = async (groupId: string) => {
    const ingredient = ingredientToAdd;
    if (!ingredient) return;
    await addIngredientToGroup(groupId, ingredient);
  };

  const createGroupWithIngredient = async (groupName: string, ingredient: IngredientWithMetrics) => {
    const token = getToken();
    if (!token) {
      toast.error("Sesión no válida");
      return;
    }

    try {
      const res = await fetchApi("/ingredient-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          type: "INGREDIENT",
          ingredients: [{ id: ingredient.id }],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "No se pudo crear el grupo");
      }

      await fetchGroups();
    } catch (error) {
      console.error("Error creating quick group:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo crear el grupo");
    }
  };

  const handleCreateIngredientSuccess = async (
    newIngredient?: Ingredient,
    assignment?: IngredientAssignmentDraft,
  ) => {
    if (!newIngredient) return;

    const createdIngredient = { ...newIngredient, isMine: true } as IngredientWithMetrics;

    sourceCacheRef.current.mine = [
      createdIngredient,
      ...sourceCacheRef.current.mine.filter((item) => item.id !== createdIngredient.id),
    ];
    if (selectedSourceGroup === "mine") {
      setSelectedSourceIngredients(sourceCacheRef.current.mine);
    }

    if (createdIngredient.isPublic) {
      sourceCacheRef.current.community = [
        createdIngredient,
        ...sourceCacheRef.current.community.filter((item) => item.id !== createdIngredient.id),
      ];
      setIngredientSourceMeta((prev) => ({
        ...prev,
        community: { ...prev.community, loaded: false },
      }));
    }

    setIngredients((prev) => [
      createdIngredient,
      ...prev.filter((item) => item.id !== createdIngredient.id),
    ]);
    mergeIngredients([createdIngredient]);
    setIngredientSourceMeta((prev) => ({
      ...prev,
      mine: {
        ...prev.mine,
        count: sourceCacheRef.current.mine.length,
        loaded: true,
      },
    }));

    if (assignment?.mode === "existing") {
      await addIngredientToGroup(assignment.groupId, createdIngredient);
      return;
    }

    if (assignment?.mode === "new") {
      await createGroupWithIngredient(assignment.groupName, createdIngredient);
    }
  };

  const groupTabs: Array<{ label: GroupTab; icon: React.ReactNode }> = [
    { label: "Mis grupos", icon: <Layers size={16} /> },
    { label: "Crear grupo", icon: <FolderPlus size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
              {groupTabs.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (label === "Mis grupos") {
                      setSelectedGroup(null);
                      setMyGroupsTab("groups");
                      setSelectedSourceGroup(null);
                      setSelectedSourceIngredients([]);
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

            {isFreemium && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
                <Lock size={14} />
                FREEMIUM: máximo 2 grupos
              </div>
            )}
          </div>
          <p className="max-w-3xl text-sm text-slate-500">
            {activeTab === "Mis grupos"
              ? "Explora tus grupos creados o revisa tus alimentos y los de la comunidad para agregarlos rápido a un grupo."
              : "Selecciona ingredientes por categoría, busca por nombre y aplica filtros nutricionales antes de crear el grupo."}
          </p>
        </div>

        <div className="shrink-0">{headerRight}</div>
      </div>

      {activeTab === "Crear grupo" && freemiumLimitReached && !editingGroupId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Ya alcanzaste el límite de 2 grupos en FREEMIUM. Elimina uno para crear otro.
        </div>
      )}

      {activeTab === "Mis grupos" && (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
              {[
                { key: "groups", label: "Mis grupos creados", icon: <Layers size={16} /> },
                { key: "mine", label: "Mis alimentos creados", icon: <UtensilsCrossed size={16} /> },
                { key: "community", label: "Alimentos de la comunidad", icon: <UtensilsCrossed size={16} /> },
              ].map((tab) => {
                const isSelected = myGroupsTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      if (tab.key === "groups") {
                        setMyGroupsTab("groups");
                        setSelectedSourceGroup(null);
                        setSelectedSourceIngredients([]);
                        return;
                      }

                      setMyGroupsTab(tab.key as MyGroupsTab);
                      void openPreviewSourceTab(tab.key as IngredientSourceTab);
                    }}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                      isSelected
                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end px-2 py-1">
              {myGroupsTab === "groups" ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <button
                    type="button"
                    aria-label="Ver grupos en tarjetas"
                    title="Tarjetas"
                    onClick={() => setGroupsDisplayMode("cards")}
                    className={cn(
                      "transition-colors",
                      groupsDisplayMode === "cards" ? "text-indigo-700" : "text-slate-400 hover:text-slate-700",
                    )}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Ver grupos en tabla"
                    title="Tabla"
                    onClick={() => setGroupsDisplayMode("table")}
                    className={cn(
                      "transition-colors",
                      groupsDisplayMode === "table" ? "text-indigo-700" : "text-slate-400 hover:text-slate-700",
                    )}
                  >
                    <Table2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500">
                  <button
                    type="button"
                    title="Tarjetas"
                    aria-label="Ver alimentos en tarjetas"
                    onClick={() => setSourceDisplayMode("cards")}
                    className={cn(
                      "transition-colors",
                      sourceDisplayMode === "cards" ? "text-indigo-700" : "text-slate-400 hover:text-slate-700",
                    )}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    title="Tabla"
                    aria-label="Ver alimentos en tabla"
                    onClick={() => setSourceDisplayMode("table")}
                    className={cn(
                      "transition-colors",
                      sourceDisplayMode === "table" ? "text-indigo-700" : "text-slate-400 hover:text-slate-700",
                    )}
                  >
                    <Table2 size={16} />
                  </button>
                </div>
              )}
            </div>

          </div>

          {myGroupsTab === "groups" ? (
            <div className="space-y-4">
              {isLoadingGroups ? (
                groupsDisplayMode === "cards" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-sm text-slate-500">
                    Cargando grupos...
                  </div>
                )
              ) : visibleGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <FolderPlus size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Todavía no tienes grupos</h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    Puedes crear colecciones de ingredientes para reutilizarlas en dietas, entregables y flujos rápidos.
                  </p>
                  <Button
                    onClick={() => setActiveTab("Crear grupo")}
                    className="mt-5 rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95"
                  >
                    <FolderPlus size={16} className="mr-2" />
                    Crear grupo
                  </Button>
                </div>
              ) : groupsDisplayMode === "cards" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleGroups.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        "group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
                        isLoadingSelectedGroup && pendingGroupId === group.id && "ring-2 ring-indigo-200 bg-indigo-50/40",
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{group.name}</h3>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {(group._count?.entries ?? group._count?.ingredients ?? 0)} alimentos
                          </p>
                          {isLoadingSelectedGroup && pendingGroupId === group.id && (
                            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                              Cargando
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title={expandedGroupId === group.id ? "Ocultar" : "Ver"}
                            aria-label={expandedGroupId === group.id ? `Ocultar ${group.name}` : `Ver ${group.name}`}
                            onClick={() => void toggleGroupExpand(group.id)}
                            className={cn(
                              "rounded-xl p-2 transition-all",
                              expandedGroupId === group.id
                                ? "text-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                            )}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            title="Editar"
                            aria-label={`Editar ${group.name}`}
                            onClick={() => void handleGroupClick(group.id)}
                            className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Eliminar"
                            aria-label={`Eliminar ${group.name}`}
                            onClick={(e) => handleDeleteGroup(group.id, e)}
                            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

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

                      {expandedGroupId === group.id && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          {expandedGroupLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                            </div>
                          ) : expandedGroupData ? (
                            <div className="space-y-4">
                              {expandedGroupData.description && (
                                <p className="text-xs leading-5 text-slate-500">{expandedGroupData.description}</p>
                              )}
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {(expandedGroupData.ingredients || []).map((entry) => {
                                  const ingredient = entry.ingredient;
                                  if (!ingredient) return null;
                                  const origin = ingredient.isMine || !ingredient.isPublic ? "Creado por mí" : "Comunidad";
                                  return (
                                    <div
                                      key={entry.entryId}
                                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-semibold text-slate-900 truncate">{ingredient.name}</p>
                                        <span
                                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                                            origin === "Creado por mí"
                                              ? "bg-emerald-50 text-emerald-700"
                                              : "bg-slate-200 text-slate-600"
                                          }`}
                                        >
                                          {origin}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-[10px] text-slate-400">
                                        {ingredient.category?.name || "General"}
                                        {ingredient.brand?.name ? ` · ${ingredient.brand.name}` : ""}
                                      </p>
                                      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                                        <div className="rounded-lg bg-white px-2 py-1.5 text-center">
                                          <span className="block font-semibold text-slate-700">{entry.amount} {entry.unit}</span>
                                          <span className="text-slate-400">Cant.</span>
                                        </div>
                                        <div className="rounded-lg bg-white px-2 py-1.5 text-center">
                                          <span className="block font-semibold text-amber-700">{Math.round(ingredient.calories || 0)}</span>
                                          <span className="text-slate-400">kcal</span>
                                        </div>
                                        <div className="rounded-lg bg-white px-2 py-1.5 text-center">
                                          <span className="block font-semibold text-blue-700">{Number(ingredient.proteins || 0).toFixed(1)}</span>
                                          <span className="text-slate-400">prot</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {(expandedGroupData.ingredients || []).length === 0 && (
                                <p className="py-4 text-center text-xs text-slate-400">
                                  Este grupo todavía no tiene alimentos.
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="py-4 text-center text-xs text-slate-400">
                              No se pudo cargar el grupo.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Grupo</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Alimentos</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Tags</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {visibleGroups.map((group) => (
                        <React.Fragment key={group.id}>
                        <tr className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-4 align-top">
                            <div className="font-semibold text-slate-900">{group.name}</div>
                            {group.description && <p className="mt-1 text-xs text-slate-500">{group.description}</p>}
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-slate-600">
                            {(group._count?.entries ?? group._count?.ingredients ?? 0)} alimentos
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {group.tags?.map((tag) => (
                                <span key={tag.id} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                title="Ver"
                                aria-label={`Ver ${group.name}`}
                                onClick={() => void toggleGroupExpand(group.id)}
                                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                title="Editar"
                                aria-label={`Editar ${group.name}`}
                                onClick={() => void handleGroupClick(group.id)}
                                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                title="Eliminar"
                                aria-label={`Eliminar ${group.name}`}
                                onClick={(e) => handleDeleteGroup(group.id, e)}
                                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                              >
                              <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedGroupId === group.id && (
                          <tr key={`${group.id}-expand`}>
                            <td colSpan={4} className="bg-slate-50/50 px-6 py-4">
                              {expandedGroupLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                                </div>
                              ) : expandedGroupData ? (
                                <div className="space-y-4">
                                  {expandedGroupData.description && (
                                    <p className="text-xs leading-5 text-slate-500">{expandedGroupData.description}</p>
                                  )}
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {(expandedGroupData.ingredients || []).map((entry) => {
                                      const ingredient = entry.ingredient;
                                      if (!ingredient) return null;
                                      const origin = ingredient.isMine || !ingredient.isPublic ? "Creado por mí" : "Comunidad";
                                      return (
                                        <div
                                          key={entry.entryId}
                                          className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold text-slate-900 truncate">{ingredient.name}</p>
                                            <span
                                              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                                                origin === "Creado por mí"
                                                  ? "bg-emerald-50 text-emerald-700"
                                                  : "bg-slate-200 text-slate-600"
                                              }`}
                                            >
                                              {origin}
                                            </span>
                                          </div>
                                          <p className="mt-1 text-[10px] text-slate-400">
                                            {ingredient.category?.name || "General"}
                                            {ingredient.brand?.name ? ` · ${ingredient.brand.name}` : ""}
                                          </p>
                                          <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                                            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                                              <span className="block font-semibold text-slate-700">{entry.amount} {entry.unit}</span>
                                              <span className="text-slate-400">Cant.</span>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                                              <span className="block font-semibold text-amber-700">{Math.round(ingredient.calories || 0)}</span>
                                              <span className="text-slate-400">kcal</span>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                                              <span className="block font-semibold text-blue-700">{Number(ingredient.proteins || 0).toFixed(1)}</span>
                                              <span className="text-slate-400">prot</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {(expandedGroupData.ingredients || []).length === 0 && (
                                    <p className="py-4 text-center text-xs text-slate-400">
                                      Este grupo todavía no tiene alimentos.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="py-4 text-center text-xs text-slate-400">
                                  No se pudo cargar el grupo.
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : myGroupsTab === "mine" && sourceViewMode === "create" ? (
            <CreateIngredientForm
              onCancel={() => setSourceViewMode("list")}
              onSuccess={(ingredient, assignment) => {
                handleCreateIngredientSuccess(ingredient, assignment);
                setSourceViewMode("list");
              }}
              availableTags={[]}
              availableGroups={groups.map((group) => ({ id: group.id, name: group.name }))}
              enableGroupAssignment
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {myGroupsTab === "mine" ? "Mis alimentos creados" : "Alimentos de la comunidad"}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {selectedSourceIngredients.length} alimentos
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {myGroupsTab === "mine"
                        ? "Crea un alimento nuevo, mira sus detalles o agrégalo a un grupo desde aquí."
                        : "Explora alimentos públicos y agrégalos a tus grupos cuando te sirvan."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    {myGroupsTab === "mine" && (
                      <Button
                        type="button"
                        onClick={() => setSourceViewMode("create")}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        <Plus size={14} className="mr-2" />
                        Nuevo alimento
                      </Button>
                    )}
                  </div>
                </div>

                {isSelectedSourceLoading && (
                  <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 shadow-sm">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    Cargando alimentos de esta fuente...
                  </div>
                )}
              </div>

              {isSelectedSourceLoading ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">Cargando alimentos...</p>
                  <p className="mt-2 text-sm text-slate-500">Un momento, estamos trayendo la información.</p>
                </div>
              ) : selectedSourceIngredients.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">No hay alimentos en esta sección todavía.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {myGroupsTab === "mine"
                      ? "Crea tu primer alimento para empezar a reutilizarlo."
                      : "Cuando haya alimentos públicos aparecerán aquí."}
                  </p>
                </div>
              ) : sourceDisplayMode === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedSourceIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">{ingredient.name}</p>
                            {ingredient.isPublic && (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                COMUNIDAD
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {ingredient.category?.name || "General"}
                            {ingredient.brand?.name ? ` · ${ingredient.brand.name}` : ""}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                          <UtensilsCrossed size={18} />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Calorías</p>
                          <p className="mt-1 font-semibold text-slate-900">{Math.round(ingredient.calories || 0)} kcal</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proteínas</p>
                          <p className="mt-1 font-semibold text-slate-900">{Number(ingredient.proteins || 0).toFixed(1)} g</p>
                        </div>
                      </div>

                      <div className="mt-3 flex min-h-[22px] flex-wrap gap-1.5">
                        {(ingredient.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag.id} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            #{tag.name}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          type="button"
                          onClick={() => openAddToGroupModal(ingredient)}
                          className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <Plus size={14} className="mr-2" />
                          Agregar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openIngredientDetails(ingredient)}
                          className="rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <Eye size={14} className="mr-2" />
                          Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Alimento</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Categoría</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Calorías</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Proteínas</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedSourceIngredients.map((ingredient) => (
                        <tr key={ingredient.id} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <UtensilsCrossed size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-900">{ingredient.name}</p>
                                  {ingredient.isPublic && (
                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                      COMUNIDAD
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {(ingredient.tags || []).slice(0, 2).map((tag) => (
                                    <span key={tag.id} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                      #{tag.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-slate-600">{ingredient.category?.name || "-"}</td>
                          <td className="px-4 py-4 align-top text-right text-sm font-semibold text-slate-700">{Math.round(ingredient.calories || 0)} kcal</td>
                          <td className="px-4 py-4 align-top text-right text-sm font-semibold text-blue-700">{Number(ingredient.proteins || 0).toFixed(1)} g</td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => openIngredientDetails(ingredient)}
                                className="rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Eye size={14} className="mr-2" />
                                Ver
                              </Button>
                              <Button
                                type="button"
                                onClick={() => openAddToGroupModal(ingredient)}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                <Plus size={14} className="mr-2" />
                                Agregar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sourceTotalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination currentPage={sourceCurrentPage} totalPages={sourceTotalPages} onPageChange={setSourceCurrentPage} />
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {activeTab === "Crear grupo" && (
        <div className="space-y-6">
          <div className="relative z-20 overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 rounded-t-3xl px-5 py-4 text-left"
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
                  {isLoadingSelectedGroup ? "Cargando" : editingGroupId ? "Editando" : "Nuevo"}
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
                      className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
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
                      className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tags
                  </label>
                  <TagInput
                    value={groupTags}
                    onChange={setGroupTags}
                    placeholder="Agrega etiquetas..."
                    className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
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

          <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {isLoadingSelectedGroup && (
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-medium text-indigo-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                  Cargando grupo{selectedGroup?.name ? `: ${selectedGroup.name}` : "..."}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setCreateViewTab("alimentos")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      createViewTab === "alimentos"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <Search size={14} />
                    Ingredientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateViewTab("agregados")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      createViewTab === "agregados"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <UtensilsCrossed size={14} />
                    <span>Seleccionados</span>
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 shadow-sm">
                      {totalSelectedCount}
                    </span>
                  </button>
                </div>

                {createViewTab === "alimentos" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { key: "catalog", label: "Catálogo NutriNet" },
                        { key: "mine", label: "Mis alimentos" },
                        { key: "community", label: "Comunidad" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => void loadIngredientSourceTab(tab.key as IngredientSourceTab)}
                          className={cn(
                            "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                            activeIngredientSource === tab.key
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="max-w-xl">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Buscar rápido
                      </label>
                      <Input
                        value={createSearchDraft}
                        onChange={(e) => handleQuickSearchChange(e.target.value)}
                        placeholder="Buscar por nombre, marca o tag..."
                        className="h-10 rounded-xl border-slate-200 text-sm focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {isIngredientSourceLoading && createViewTab === "alimentos" && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 shadow-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                  Cargando alimentos de esta fuente...
                </div>
              )}

              {createViewTab === "alimentos" ? (
                isIngredientSourceLoading ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Cargando alimentos...</p>
                    <p className="mt-2 text-sm text-slate-500">Un momento, estamos trayendo la información.</p>
                  </div>
                ) : activeCreateIngredients.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">No hay alimentos para mostrar.</p>
                    <p className="mt-2 text-sm text-slate-500">Prueba otra fuente o ajusta los filtros.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                          <th className="w-10 px-4 py-3" />
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ingrediente</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Categoría</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Calorías</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Proteínas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {activeCreateIngredients.map((ingredient) => {
                          const isStaged = stagedIngredientIds.has(ingredient.id);
                          const isConfirmed = confirmedIngredientIds.has(ingredient.id);
                          const isSelected = isStaged;

                          return (
                            <tr
                              key={ingredient.id}
                              onClick={() => {
                                setStagedIngredientIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(ingredient.id)) next.delete(ingredient.id);
                                  else next.add(ingredient.id);
                                  return next;
                                });
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
                                    isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white",
                                  )}
                                >
                                  {isSelected && <Check size={12} />}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="font-semibold text-slate-900">{ingredient.name}</div>
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
                              <td className="px-4 py-4 align-top text-sm text-slate-600">{ingredient.category?.name || "-"}</td>
                              <td className="px-4 py-4 align-top text-right text-sm font-semibold text-slate-700">
                                {Math.round(ingredient.calories || 0)}
                              </td>
                              <td className="px-4 py-4 align-top text-right text-sm font-semibold text-blue-700">
                                {Number(ingredient.proteins || 0).toFixed(1)}g
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : selectedIngredients.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">No tienes alimentos confirmados en este grupo.</p>
                  <p className="mt-2 text-sm text-slate-500">Vuelve a la pestaña de ingredientes para agregar alimentos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                        <th className="w-10 px-4 py-3" />
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ingrediente</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Categoría</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Calorías</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Proteínas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeCreateIngredients.map((ingredient) => {
                        const isSelected = confirmedIngredientIds.has(ingredient.id);

                        return (
                          <tr
                            key={ingredient.id}
                            onClick={() => {
                              setConfirmedIngredientIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(ingredient.id)) next.delete(ingredient.id);
                                else next.add(ingredient.id);
                                return next;
                              });
                            }}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected ? "bg-red-50/70" : "hover:bg-slate-50/70",
                            )}
                          >
                            <td className="px-4 py-4 align-top">
                              <div
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                  isSelected ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white",
                                )}
                              >
                                {isSelected && <X size={12} />}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="font-semibold text-slate-900">{ingredient.name}</div>
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
                            <td className="px-4 py-4 align-top text-sm text-slate-600">{ingredient.category?.name || "-"}</td>
                            <td className="px-4 py-4 align-top text-right text-sm font-semibold text-slate-700">{Math.round(ingredient.calories || 0)}</td>
                            <td className="px-4 py-4 align-top text-right text-sm font-semibold text-blue-700">{Number(ingredient.proteins || 0).toFixed(1)}g</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

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

          </div>

          <aside className="space-y-4 xl:sticky xl:top-[25vh] xl:self-start">
            {createViewTab === "alimentos" && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Filtros</p>
                    <p className="mt-1 text-sm text-slate-500">Ajusta reglas y categoría desde aquí.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFiltersOpen((prev) => !prev)}
                    className="rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Filter size={14} className="mr-2" />
                    {isFiltersOpen ? "Ocultar" : `Mostrar${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}`}
                  </Button>
                </div>

                {isFiltersOpen && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Categoría</label>
                        <select
                          value={createCategoryDraft}
                          onChange={(e) => setCreateCategoryDraft(e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="ALL">Todas las categorías</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reglas</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                            {createFilterDrafts.length}
                          </span>
                        </div>

                        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                          {createFilterDrafts.map((draft, index) => {
                            const nutrient = nutrientOptions.find((option) => option.value === draft.nutrient);

                            return (
                              <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Regla {index + 1}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => removeFilterDraft(draft.id)}
                                    className="h-8 rounded-xl px-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>

                                <div className="grid gap-2">
                                  <select
                                    value={draft.nutrient}
                                    onChange={(e) => updateFilterDraft(draft.id, { nutrient: e.target.value as NutrientKey })}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                  >
                                    {nutrientOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={draft.comparator}
                                      onChange={(e) => updateFilterDraft(draft.id, { comparator: e.target.value as Comparator })}
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                      <option value="gte">Mayor o igual</option>
                                      <option value="lte">Menor o igual</option>
                                    </select>

                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      value={draft.value}
                                      onChange={(e) => updateFilterDraft(draft.id, { value: e.target.value })}
                                      placeholder={nutrient ? nutrient.unit : "Valor"}
                                      className="h-10 rounded-xl border-slate-200 text-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addFilterDraft}
                            className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-white"
                          >
                            <Plus size={14} className="mr-2" />
                            Agregar regla
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClearFilters}
                            className="w-full rounded-xl text-slate-500 hover:bg-white hover:text-slate-700"
                          >
                            Limpiar
                          </Button>

                          <Button
                            type="button"
                            onClick={handleApplyFilters}
                            className="w-full rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700 sm:col-span-2"
                          >
                            Aplicar filtros
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Atajos rápidos
              </p>
              <div className="mt-3 space-y-3">
                <Button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={stagedCount === 0}
                  className="w-full min-h-[52px] h-auto cursor-pointer rounded-xl border-indigo-100 bg-indigo-50 px-4 text-indigo-700 shadow-sm transition-all hover:bg-indigo-100"
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
                  disabled={
                    totalSelectedCount === 0 ||
                    !groupName.trim() ||
                    isCreateSubmitting ||
                    freemiumLimitReached ||
                    (editingGroupId ? !hasGroupChanges : false)
                  }
                  className="w-full h-[52px] cursor-pointer rounded-xl bg-indigo-600 px-4 text-white shadow-sm transition-all hover:bg-indigo-700"
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
                  className="w-full h-[52px] cursor-pointer rounded-xl border-slate-200 px-4 text-slate-600 transition-all hover:bg-slate-50"
                >
                  <span className="font-semibold text-sm">Reiniciar</span>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      )}
      <Modal
        isOpen={isAddToGroupOpen}
        onClose={() => {
          setIsAddToGroupOpen(false);
          setIngredientToAdd(null);
        }}
        title={ingredientToAdd ? `Agregar ${ingredientToAdd.name}` : "Agregar a grupo"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-500">
            Elige uno de tus grupos para guardar este alimento y reutilizarlo más tarde.
          </p>

          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">Todavía no tienes grupos propios.</p>
              <p className="mt-1 text-sm text-slate-500">Crea uno primero para guardar alimentos reutilizables.</p>
              <Button
                type="button"
                onClick={() => {
                  setIsAddToGroupOpen(false);
                  setIngredientToAdd(null);
                  setActiveTab("Crear grupo");
                }}
                className="mt-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Crear grupo
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => void handleAddIngredientToGroup(group.id)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(group._count?.entries ?? group._count?.ingredients ?? 0)} alimentos
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Agregar
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
      <IngredientDetailsModal
        isOpen={isIngredientDetailsOpen}
        onClose={() => {
          setIsIngredientDetailsOpen(false);
          setSelectedIngredientDetails(null);
        }}
        ingredient={selectedIngredientDetails}
      />
      <CreateIngredientModal
        isOpen={isCreateIngredientOpen}
        onClose={() => setIsCreateIngredientOpen(false)}
        onSuccess={handleCreateIngredientSuccess}
        availableTags={[]}
        availableGroups={groups.map((group) => ({ id: group.id, name: group.name }))}
        enableGroupAssignment
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

