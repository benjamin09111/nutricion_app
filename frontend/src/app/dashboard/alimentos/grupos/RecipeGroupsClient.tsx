"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Check,
  FolderPlus,
  Layers,
  Plus,
  Search,
  UtensilsCrossed,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TagInput } from "@/components/ui/TagInput";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FeatureGate } from "@/components/memberships/FeatureGate";
import type { RecipeSummary } from "./GruposHubClient";

type GroupTab = "Mis grupos" | "Crear grupo";
type CreateViewTab = "recetas" | "agregadas";

type RecipeGroupEntry = {
  recipe?: RecipeSummary;
  entryId: string;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  type: "RECIPE";
  tags?: { id: string; name: string }[];
  ingredients?: RecipeGroupEntry[];
  _count?: { entries?: number };
};

interface RecipeGroupsClientProps {
  initialRecipes: RecipeSummary[];
}

const MEAL_SECTIONS = ["Desayuno", "Almuerzo", "Cena", "Once", "Snack"];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function RecipeGroupsClient({ initialRecipes }: RecipeGroupsClientProps) {
  const [activeTab, setActiveTab] = useState<GroupTab>("Mis grupos");
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const createItemsPerPage = 8;

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(true);
  const [createViewTab, setCreateViewTab] = useState<CreateViewTab>("recetas");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupTags, setGroupTags] = useState<string[]>([]);
  const [confirmedRecipeIds, setConfirmedRecipeIds] = useState<Set<string>>(new Set());
  const [stagedRecipeIds, setStagedRecipeIds] = useState<Set<string>>(new Set());
  const [createSearchDraft, setCreateSearchDraft] = useState("");
  const [createSectionDraft, setCreateSectionDraft] = useState("ALL");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSection, setAppliedSection] = useState("ALL");
  const [createCurrentPage, setCreateCurrentPage] = useState(1);
  const [selectedCurrentPage, setSelectedCurrentPage] = useState(1);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  useScrollLock(isDeleteConfirmOpen);

  const getToken = () => getAuthToken();

  useEffect(() => {
    setRecipes(initialRecipes);
  }, [initialRecipes]);

  const fetchGroups = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoadingGroups(true);
    try {
      const res = await fetchApi("/ingredient-groups?type=RECIPE", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching recipe groups:", error);
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
  }, [appliedSearch, appliedSection]);

  useEffect(() => {
    if (editingGroupId) {
      setIsGroupInfoOpen(false);
      setCreateViewTab("agregadas");
      return;
    }
    setIsGroupInfoOpen(true);
    setCreateViewTab("recetas");
  }, [editingGroupId]);

  const selectedRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) => confirmedRecipeIds.has(recipe.id))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [recipes, confirmedRecipeIds],
  );

  const filteredRecipes = useMemo(() => {
    const search = normalizeText(appliedSearch);
    return recipes
      .filter((recipe) => !confirmedRecipeIds.has(recipe.id))
      .filter((recipe) => {
        if (appliedSection !== "ALL" && recipe.metadata?.mealSection !== appliedSection) {
          return false;
        }

        if (!search) return true;

        const haystack = normalizeText(
          [
            recipe.name,
            recipe.description || "",
            ...(recipe.ingredients?.map((item) => item.ingredient.name) || []),
            ...(recipe.metadata?.tags || []),
          ]
            .filter(Boolean)
            .join(" "),
        );

        return haystack.includes(search);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [recipes, appliedSearch, appliedSection, confirmedRecipeIds]);

  const createTotalPages = Math.max(1, Math.ceil(filteredRecipes.length / createItemsPerPage));
  const paginatedCreateRecipes = filteredRecipes.slice(
    (createCurrentPage - 1) * createItemsPerPage,
    createCurrentPage * createItemsPerPage,
  );
  const selectedTotalPages = Math.max(1, Math.ceil(selectedRecipes.length / createItemsPerPage));
  const paginatedSelectedRecipes = selectedRecipes.slice(
    (selectedCurrentPage - 1) * createItemsPerPage,
    selectedCurrentPage * createItemsPerPage,
  );
  const activeCreateRecipes =
    createViewTab === "recetas" ? paginatedCreateRecipes : paginatedSelectedRecipes;
  const activeCreateTotalPages =
    createViewTab === "recetas" ? createTotalPages : selectedTotalPages;

  const handleGroupClick = async (groupId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetchApi(`/ingredient-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error("Error al cargar detalles del grupo");
        return;
      }

      const groupDetails = await res.json();
      setSelectedGroup(groupDetails);
      setEditingGroupId(groupDetails.id);
      setGroupName(groupDetails.name || "");
      setGroupDescription(groupDetails.description || "");
      setGroupTags((groupDetails.tags || []).map((tag: { name: string }) => tag.name));
      setConfirmedRecipeIds(
        new Set(
          (groupDetails.ingredients || [])
            .map((rel: RecipeGroupEntry) => rel.recipe?.id)
            .filter(Boolean) as string[],
        ),
      );
      setStagedRecipeIds(new Set());
      setCreateSearchDraft("");
      setCreateSectionDraft("ALL");
      setAppliedSearch("");
      setAppliedSection("ALL");
      setCreateCurrentPage(1);
      setSelectedCurrentPage(1);
      setCreateViewTab("agregadas");
      setIsGroupInfoOpen(false);
      setActiveTab("Crear grupo");
    } catch (error) {
      console.error("Error fetching recipe group details:", error);
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

      if (!res.ok) {
        toast.error("Error al eliminar el grupo");
        return;
      }

      toast.success("Grupo eliminado correctamente");
      setGroups((prev) => prev.filter((group) => group.id !== groupToDelete));
      if (selectedGroup?.id === groupToDelete) setSelectedGroup(null);
      setIsDeleteConfirmOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error("Error deleting recipe group:", error);
      toast.error("Error al eliminar el grupo");
    }
  };

  const handleResetCreate = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupTags([]);
    setConfirmedRecipeIds(new Set());
    setStagedRecipeIds(new Set());
    setSelectedGroup(null);
    setEditingGroupId(null);
    setIsGroupInfoOpen(true);
    setCreateViewTab("recetas");
    setCreateSearchDraft("");
    setCreateSectionDraft("ALL");
    setAppliedSearch("");
    setAppliedSection("ALL");
  };

  const handleConfirmSelection = () => {
    if (stagedRecipeIds.size === 0) {
      toast.info("Todavía no hay platos seleccionados");
      return;
    }

    setConfirmedRecipeIds((prev) => new Set([...Array.from(prev), ...Array.from(stagedRecipeIds)]));
    setStagedRecipeIds(new Set());
    setCreateViewTab("agregadas");
  };

  const applyCreateFilters = () => {
    setAppliedSearch(createSearchDraft.trim());
    setAppliedSection(createSectionDraft);
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      toast.error("Escribe un nombre para el grupo");
      return;
    }

    const allRecipeIds = new Set([...Array.from(confirmedRecipeIds), ...Array.from(stagedRecipeIds)]);
    if (allRecipeIds.size === 0) {
      toast.error("Selecciona al menos un plato");
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
        type: "RECIPE",
        recipeIds: Array.from(allRecipeIds),
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
      console.error("Error saving recipe group:", error);
      toast.error(editingGroupId ? "No se pudo actualizar el grupo" : "No se pudo crear el grupo");
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const groupTabs: Array<{ label: GroupTab; icon: React.ReactNode }> = [
    { label: "Mis grupos", icon: <Layers size={16} /> },
    { label: "Crear grupo", icon: <FolderPlus size={16} /> },
  ];

  const selectedCount = confirmedRecipeIds.size + stagedRecipeIds.size;

  return (
    <FeatureGate feature="food_groups.access" message="Disponible solo en Pro.">
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
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
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
                ? "Crea colecciones reutilizables de platos para dietas, entregables y flujos rápidos."
                : "Busca platos, selecciónalos y agrúpalos para reutilizarlos en otros flujos."}
            </p>
          </div>
        </div>

        {activeTab === "Mis grupos" ? (
          <div className="space-y-4">
            {isLoadingGroups ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="h-44 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FolderPlus size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Todavía no tienes grupos de platos</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Puedes crear colecciones de platos para reutilizarlas en dietas, entregables y flujos rápidos.
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
                {groups.map((group) => (
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
                          <UtensilsCrossed size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{group.name}</h3>
                          <p className="text-xs font-medium text-slate-500">
                            {(group._count?.entries ?? 0)} platos
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

                    {group.description && <p className="mb-3 line-clamp-2 text-sm leading-6 text-slate-500">{group.description}</p>}

                    <div className="flex flex-wrap gap-1.5">
                      {group.tags?.map((tag) => (
                        <span key={tag.id} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
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
                  className="flex w-full items-center justify-between gap-4 rounded-t-3xl px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Información del grupo</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {editingGroupId ? "Edita el grupo sin salir de esta vista." : "Completa el nombre, descripción y tags del nuevo grupo."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide", editingGroupId ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700")}>{editingGroupId ? "Editando" : "Nuevo"}</span>
                    <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isGroupInfoOpen && "rotate-180")} />
                  </div>
                </button>

                {isGroupInfoOpen ? (
                  <div className="border-t border-slate-100 px-5 py-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre del grupo *</label>
                        <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ej: Menús de alto volumen" className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción</label>
                        <Input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Ej: Platos para usar en desayunos rápidos" className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Tags</label>
                      <TagInput value={groupTags} onChange={setGroupTags} placeholder="Agrega etiquetas..." className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" />
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

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                    <button type="button" onClick={() => setCreateViewTab("recetas")} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer", createViewTab === "recetas" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      <Search size={14} />
                      Platos
                    </button>
                    <button type="button" onClick={() => setCreateViewTab("agregadas")} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer", createViewTab === "agregadas" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      <UtensilsCrossed size={14} />
                      Ya seleccionados ({selectedCount})
                    </button>
                  </div>

                  {createViewTab === "recetas" && (
                    <div className="flex items-center gap-2">
                      <Input value={createSearchDraft} onChange={(e) => setCreateSearchDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyCreateFilters()} placeholder="Buscar plato..." className="h-9 w-48 rounded-xl border-slate-200 text-xs focus:border-indigo-500 focus:ring-indigo-500/20 lg:w-64" />
                      <select value={createSectionDraft} onChange={(e) => setCreateSectionDraft(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                        <option value="ALL">Todas las secciones</option>
                        {MEAL_SECTIONS.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                      <Button variant="outline" size="sm" onClick={applyCreateFilters} className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Search size={14} className="mr-2" />
                        Filtros
                      </Button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="w-10 px-4 py-4" />
                        <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Plato</th>
                        <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Sección</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Calorías</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Proteínas</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Carbos</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Grasas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeCreateRecipes.length > 0 ? (
                        activeCreateRecipes.map((recipe) => {
                          const isStaged = stagedRecipeIds.has(recipe.id);
                          const isConfirmed = confirmedRecipeIds.has(recipe.id);
                          const isSelected = createViewTab === "recetas" ? isStaged : isConfirmed;

                          return (
                            <tr
                              key={recipe.id}
                              onClick={() => {
                                if (createViewTab === "recetas") {
                                  setStagedRecipeIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(recipe.id)) next.delete(recipe.id);
                                    else next.add(recipe.id);
                                    return next;
                                  });
                                } else {
                                  setConfirmedRecipeIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(recipe.id);
                                    return next;
                                  });
                                }
                              }}
                              className={cn("cursor-pointer transition-colors", isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50/70")}
                            >
                              <td className="px-4 py-4 align-top">
                                <div className={cn("flex h-5 w-5 items-center justify-center rounded border transition-colors", isSelected ? (createViewTab === "recetas" ? "border-indigo-600 bg-indigo-600 text-white" : "border-red-600 bg-red-600 text-white") : "border-slate-300 bg-white")}>
                                  {isSelected && (createViewTab === "recetas" ? <Check size={12} /> : <X size={12} />)}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="font-semibold text-slate-900">{recipe.name}</div>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {(recipe.metadata?.tags || []).slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">#{tag}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top text-sm text-slate-600">{recipe.metadata?.mealSection || "-"}</td>
                              <td className="px-4 py-4 align-top text-right text-sm font-semibold text-slate-700">{Math.round(recipe.calories || 0)}</td>
                              <td className="px-4 py-4 align-top text-right text-sm font-semibold text-blue-700">{Number(recipe.proteins || 0).toFixed(1)}g</td>
                              <td className="px-4 py-4 align-top text-right text-sm font-semibold text-emerald-700">{Number(recipe.carbs || 0).toFixed(1)}g</td>
                              <td className="px-4 py-4 align-top text-right text-sm font-semibold text-yellow-700">{Number(recipe.lipids || 0).toFixed(1)}g</td>
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
                                {createViewTab === "recetas" ? "No encontramos platos con esos filtros." : "Aún no has agregado platos a este grupo."}
                              </p>
                              <p className="text-sm text-slate-500">
                                {createViewTab === "recetas" ? "Prueba otra sección o cambia el texto de búsqueda." : "Busca platos en la pestaña anterior y selecciónalos."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {activeCreateTotalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination currentPage={createViewTab === "recetas" ? createCurrentPage : selectedCurrentPage} totalPages={activeCreateTotalPages} onPageChange={createViewTab === "recetas" ? setCreateCurrentPage : setSelectedCurrentPage} />
                  </div>
                )}
              </div>

              <aside className="space-y-4 xl:sticky xl:top-[25vh] xl:self-start">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Platos</p>
                      <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">{selectedCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <UtensilsCrossed size={22} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Seleccionados para el grupo actual.</p>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Atajos rápidos</p>
                  <div className="mt-3 space-y-3">
                    <Button type="button" onClick={handleConfirmSelection} disabled={stagedRecipeIds.size === 0} className="w-full min-h-[52px] h-auto cursor-pointer border-indigo-100 bg-indigo-50 px-4 text-indigo-700 hover:bg-indigo-100 rounded-[1.25rem] transition-all shadow-sm">
                      <div className="flex w-full items-center justify-center gap-2 py-1.5">
                        <Plus size={18} className="shrink-0" />
                        <span className="max-w-[200px] whitespace-normal text-center text-xs font-semibold leading-tight sm:text-[13px]">
                          Confirmar {stagedRecipeIds.size} seleccionados
                        </span>
                      </div>
                    </Button>
                    <Button type="button" onClick={handleCreateGroup} disabled={selectedCount === 0 || !groupName.trim() || isCreateSubmitting} className="w-full h-[52px] cursor-pointer rounded-[1.25rem] bg-indigo-600 px-4 text-white shadow-sm transition-all hover:bg-indigo-700">
                      <div className="flex items-center justify-center gap-2">
                        {isCreateSubmitting ? (
                          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <Check size={18} className="shrink-0" />
                        )}
                        <span className="text-sm font-semibold">{editingGroupId ? "Guardar grupo" : "Crear grupo"}</span>
                      </div>
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetCreate} className="w-full h-[52px] cursor-pointer rounded-[1.25rem] border-slate-200 px-4 text-slate-600 transition-all hover:bg-slate-50">
                      <span className="text-sm font-semibold">Reiniciar</span>
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
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
    </FeatureGate>
  );
}

