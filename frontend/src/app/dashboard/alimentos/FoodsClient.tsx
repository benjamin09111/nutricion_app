"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  Ban,
  Info,
  Pencil,
  Tag,
  BadgeCheck,
  Plus,
  Check,
  X,
  Share2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Ingredient } from "@/features/foods";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import CreateIngredientModal from "./CreateIngredientModal";
import ManageTagsModal from "./ManageTagsModal";
import IngredientDetailsModal from "./IngredientDetailsModal";

interface FoodsClientProps {
  initialData: Ingredient[];
}

type FoodSourceTab = "catalog" | "mine" | "community";

export default function FoodsClient({ initialData }: FoodsClientProps) {
  const router = useRouter();

  const [data, setData] = useState<Ingredient[]>(initialData);
  const [catalogPool, setCatalogPool] = useState<Ingredient[]>(initialData);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [activeSourceTab, setActiveSourceTab] = useState<FoodSourceTab>("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedTag, setSelectedTag] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredientForTags, setSelectedIngredientForTags] = useState<Ingredient | null>(null);

  const sourceCacheRef = useRef<Record<FoodSourceTab, Ingredient[]>>({
    catalog: initialData,
    mine: [],
    community: [],
  });
  const skipNextSearchFetchRef = useRef(false);
  const clearSourceSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAnyModalOpen = isCreateModalOpen || isDetailsModalOpen || isTagsModalOpen;
  useScrollLock(isAnyModalOpen);

  useEffect(() => {
    setData(initialData);
    setCatalogPool(initialData);
  }, [initialData]);

  const getToken = useCallback(() => getAuthToken(), []);
  const canEditIngredient = (ingredient: Ingredient | null | undefined) => Boolean(ingredient?.isMine);

  const sourceTabToApiTab = useCallback((sourceTab: FoodSourceTab) => {
    switch (sourceTab) {
      case "mine":
        return "mine";
      case "community":
        return "community";
      default:
        return "app";
    }
  }, []);

  const setSourceTabData = (sourceTab: FoodSourceTab, items: Ingredient[]) => {
    sourceCacheRef.current = {
      ...sourceCacheRef.current,
      [sourceTab]: items,
    };
    setData(items);
    setCatalogPool(items);
  };

  const loadSourceTab = useCallback(
    async (sourceTab: FoodSourceTab) => {
      if (clearSourceSwitchTimerRef.current) {
        clearTimeout(clearSourceSwitchTimerRef.current);
        clearSourceSwitchTimerRef.current = null;
      }

      skipNextSearchFetchRef.current = true;
      setActiveSourceTab(sourceTab);
      setEditingId(null);
      setEditValues({});
      setSearchTerm("");
      setSelectedCategory("Todos");
      setSelectedTag("Todos");
      setCurrentPage(1);

      const cachedItems = sourceCacheRef.current[sourceTab];
      if (cachedItems?.length > 0) {
        setData(cachedItems);
        setCatalogPool(cachedItems);
        clearSourceSwitchTimerRef.current = setTimeout(() => {
          skipNextSearchFetchRef.current = false;
        }, 0);
        return;
      }

      setData([]);
      setCatalogPool([]);

      const token = getToken();
      if (!token) {
        clearSourceSwitchTimerRef.current = setTimeout(() => {
          skipNextSearchFetchRef.current = false;
        }, 0);
        return;
      }

      setIsLoadingIngredients(true);
      try {
        const queryParams = new URLSearchParams({
          tab: sourceTabToApiTab(sourceTab),
          limit: "100",
        });

        const response = await fetchApi(`/foods?${queryParams.toString()}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Error al cargar ingredientes");
        }

        const result = await response.json();
        const nextItems = Array.isArray(result) ? result : [];
        setSourceTabData(sourceTab, nextItems);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
        toast.error("No se pudo cargar el catálogo de ingredientes");
      } finally {
        setIsLoadingIngredients(false);
        clearSourceSwitchTimerRef.current = setTimeout(() => {
          skipNextSearchFetchRef.current = false;
        }, 0);
      }
    },
    [getToken, sourceTabToApiTab, setSourceTabData, toast],
  );

  const fetchIngredients = useCallback(async (sourceTab: FoodSourceTab = activeSourceTab) => {
    const token = getToken();
    if (!token) return;

    setIsLoadingIngredients(true);
    try {
      const queryParams = new URLSearchParams({
        tab: sourceTabToApiTab(sourceTab),
        limit: "100",
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        ...(selectedCategory !== "Todos" && { category: selectedCategory }),
        ...(selectedTag !== "Todos" && { tag: selectedTag }),
      });

      const response = await fetchApi(`/foods?${queryParams.toString()}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Error al cargar ingredientes");
      }

      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast.error("No se pudo cargar el catálogo de ingredientes");
    } finally {
      setIsLoadingIngredients(false);
    }
  }, [activeSourceTab, searchTerm, selectedCategory, selectedTag, getToken, sourceTabToApiTab]);

  useEffect(() => {
    if (skipNextSearchFetchRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      fetchIngredients(activeSourceTab);
    }, searchTerm.trim() ? 250 : 0);

    return () => clearTimeout(timer);
  }, [fetchIngredients, activeSourceTab, searchTerm, selectedCategory, selectedTag]);

  useEffect(
    () => () => {
      if (clearSourceSwitchTimerRef.current) {
        clearTimeout(clearSourceSwitchTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSourceTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedTag]);

  const categories = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(
          catalogPool.filter((item) => item.category?.name).map((item) => item.category!.name),
        ),
      ),
    ],
    [catalogPool],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    catalogPool.forEach((item) => {
      item.tags?.forEach((tag) => tags.add(tag.name));
      item.preferences?.[0]?.tags?.forEach((tag) => tags.add(tag.name));
    });
    return ["Todos", ...Array.from(tags)];
  }, [catalogPool]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory("Todos");
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!allTags.includes(selectedTag)) setSelectedTag("Todos");
  }, [allTags, selectedTag]);

  const filteredIngredients = data;
  const itemsPerPage = 15;
  const totalPages = Math.max(1, Math.ceil(filteredIngredients.length / itemsPerPage));
  const paginatedIngredients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIngredients.slice(start, start + itemsPerPage);
  }, [filteredIngredients, currentPage]);

  const handleCreateIngredientSuccess = async (newIngredient?: Ingredient) => {
    if (newIngredient) {
      setCatalogPool((prev) => [
        { ...newIngredient, isMine: true, preferences: newIngredient.preferences || [] },
        ...prev.filter((item) => item.id !== newIngredient.id),
      ]);
      sourceCacheRef.current.mine = [
        { ...newIngredient, isMine: true, preferences: newIngredient.preferences || [] },
        ...sourceCacheRef.current.mine.filter((item) => item.id !== newIngredient.id),
      ];
    }

    setSearchTerm("");
    setSelectedCategory("Todos");
    setSelectedTag("Todos");
    setCurrentPage(1);
    await loadSourceTab("mine");
  };

  const handleDetailsClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsDetailsModalOpen(true);
  };

  const handleManageTags = (ingredient: Ingredient) => {
    setSelectedIngredientForTags(ingredient);
    setIsTagsModalOpen(true);
  };

  const handleTogglePreference = async (ingredientId: string, updates: any) => {
    const token = getToken();
    if (!token) return;

    const previousData = [...data];
    setData((current) =>
      current.map((item) => {
        if (item.id !== ingredientId) return item;

        const existingPref = item.preferences?.[0] || {
          isFavorite: false,
          isNotRecommended: false,
          tags: [],
        };

        return { ...item, preferences: [{ ...existingPref, ...updates }] };
      }),
    );

    try {
      const response = await fetchApi(`/foods/${ingredientId}/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Error desconocido" };
        }
        throw new Error(errorData.message || "Error al actualizar preferencias");
      }

      if (updates.isFavorite) toast.success("Añadido a Favoritos ⭐");
      else if (updates.isNotRecommended) toast.success("Marcado como No Recomendado 🚫");
      else if (updates.isFavorite === false && updates.isNotRecommended === false) toast.success("Preferencia eliminada");

      const patched = (current: Ingredient[]) =>
        current.map((item) =>
          item.id === ingredientId
            ? { ...item, preferences: [{ ...(item.preferences?.[0] || {}), ...updates }] }
            : item,
        );
      setCatalogPool(patched);
      sourceCacheRef.current[activeSourceTab] = patched(sourceCacheRef.current[activeSourceTab]);
      await fetchIngredients(activeSourceTab);
    } catch (error: any) {
      console.error("Toggle preference error:", error);
      setData(previousData);
      toast.error(error.message || "No se pudo actualizar la preferencia");
    }
  };

  const handleStartEdit = (ingredient: Ingredient) => {
    if (!canEditIngredient(ingredient)) {
      toast.error("Solo puedes editar ingredientes creados por ti.");
      return;
    }

    setEditingId(ingredient.id);
    setEditValues({
      name: ingredient.name,
      brand: ingredient.brand?.name || "",
      price: ingredient.price,
      amount: ingredient.amount,
      unit: ingredient.unit,
      calories: ingredient.calories,
      proteins: ingredient.proteins,
      carbs: ingredient.carbs,
      lipids: ingredient.lipids,
      sugars: ingredient.sugars || 0,
      fiber: ingredient.fiber || 0,
      sodium: ingredient.sodium || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (id: string) => {
    const token = getToken();
    if (!token) return;

    const ingredientToEdit =
      data.find((item) => item.id === id) || catalogPool.find((item) => item.id === id) || null;

    if (!canEditIngredient(ingredientToEdit)) {
      setEditingId(null);
      setEditValues({});
      toast.error("Solo puedes editar ingredientes creados por ti.");
      return;
    }

    const updatePayload = {
      ...editValues,
      ...(ingredientToEdit?.isDraft ? { isDraft: false } : {}),
    };

    try {
      const response = await fetchApi(`/foods/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      const updatedFood = await response.json();
      setData((current) => current.map((item) => (item.id === id ? { ...item, ...updatedFood } : item)));
      toast.success(ingredientToEdit?.isDraft ? "Borrador completado correctamente" : "Ingrediente actualizado");
      setEditingId(null);
      setEditValues({});
      const patched = (current: Ingredient[]) =>
        current.map((item) => (item.id === id ? { ...item, ...updatedFood } : item));
      setCatalogPool(patched);
      sourceCacheRef.current[activeSourceTab] = patched(sourceCacheRef.current[activeSourceTab]);
      await fetchIngredients(activeSourceTab);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("No se pudo actualizar el ingrediente");
    }
  };

  const handleShareToggle = async (ingredient: Ingredient) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetchApi(`/foods/${ingredient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic: !ingredient.isPublic }),
      });

      if (!response.ok) throw new Error("Error al compartir");

      setData((current) =>
        current.map((item) => (item.id === ingredient.id ? { ...item, isPublic: !ingredient.isPublic } : item)),
      );

      toast.success(ingredient.isPublic ? "Ingrediente dejado de compartir" : "Ingrediente compartido con la comunidad 🌍");
      const patched = (current: Ingredient[]) =>
        current.map((item) =>
          item.id === ingredient.id ? { ...item, isPublic: !ingredient.isPublic } : item,
        );
      setCatalogPool(patched);
      sourceCacheRef.current[activeSourceTab] = patched(sourceCacheRef.current[activeSourceTab]);
      await fetchIngredients(activeSourceTab);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("No se pudo actualizar el estado de compartido");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 id="foods-page-title" className="text-3xl font-semibold tracking-tight text-slate-900">
            Catálogo de Ingredientes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los ingredientes base para tus pautas y recetas.
          </p>
          <div className="mt-4 inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
            {[
              { key: "catalog", label: "Catálogo NutriNet" },
              { key: "mine", label: "Mis alimentos" },
              { key: "community", label: "Comunidad" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => loadSourceTab(tab.key as FoodSourceTab)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                  activeSourceTab === tab.key
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-row flex-nowrap gap-2 lg:w-auto lg:justify-end">
          <Button
            onClick={() => router.push("/dashboard/alimentos/grupos")}
            variant="outline"
            className="h-10 flex-1 justify-center rounded-xl border-indigo-100 bg-white gap-2 whitespace-nowrap font-semibold text-indigo-600 hover:bg-indigo-50 lg:flex-none lg:px-5"
          >
            <Layers size={18} />
            Grupos
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 flex-1 justify-center rounded-xl bg-indigo-600 gap-2 whitespace-nowrap font-semibold text-white shadow-sm hover:bg-indigo-700 lg:flex-none lg:px-5"
          >
            <Plus size={18} />
            Nuevo Alimento
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-300" aria-hidden="true" />
            </div>
            <Input
              type="search"
              placeholder="Buscar alimento o marca..."
              className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus-visible:border-indigo-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <SearchableSelect
            options={categories}
            value={selectedCategory}
            onChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}
            placeholder="Categoría"
            className="w-full"
            triggerClassName="h-10 rounded-xl"
          />

          <SearchableSelect
            options={allTags}
            value={selectedTag}
            onChange={(value) => {
              setSelectedTag(value);
              setCurrentPage(1);
            }}
            placeholder="Tag"
            className="w-full"
            triggerClassName="h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-1 sm:px-3">
        <p className="text-xs font-medium text-slate-500">
          <span className="font-semibold text-indigo-600">{filteredIngredients.length}</span> alimentos mostrados
        </p>
        {isLoadingIngredients && (
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-500" />
            Actualizando
          </div>
        )}
      </div>

      {isLoadingIngredients && (
        <div className="mx-2 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Cargando {activeSourceTab === "catalog" ? "catálogo" : activeSourceTab === "mine" ? "mis alimentos" : "comunidad"}...
        </div>
      )}

      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 table-auto">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Alimento</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Marca</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Categoría</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Unidad</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cals</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Prot</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Lip</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Carb</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sug</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Fib</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Na</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Tags</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedIngredients.length > 0 ? (
                  paginatedIngredients.map((ingredient) => (
                    <tr key={ingredient.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 align-middle">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="h-8 w-full text-sm"
                          />
                        ) : (
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-900">{ingredient.name}</span>
                            {ingredient.isDraft && (
                              <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
                                Borrador
                              </span>
                            )}
                            {ingredient.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 align-middle text-sm text-slate-500">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input
                            value={editValues.brand}
                            onChange={(e) => setEditValues({ ...editValues, brand: e.target.value })}
                            className="h-8 w-full text-sm"
                          />
                        ) : (
                          ingredient.brand?.name || "-"
                        )}
                      </td>
                      <td className="px-5 py-2.5 align-middle text-sm text-slate-500">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {ingredient.category?.name || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 align-middle text-center text-sm text-slate-500">{ingredient.unit}</td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.calories} onChange={(e) => setEditValues({ ...editValues, calories: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs font-medium text-slate-600">{ingredient.calories}</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.proteins} onChange={(e) => setEditValues({ ...editValues, proteins: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs font-semibold text-blue-600">{ingredient.proteins}g</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.lipids} onChange={(e) => setEditValues({ ...editValues, lipids: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs font-semibold text-red-600">{ingredient.lipids}g</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.carbs} onChange={(e) => setEditValues({ ...editValues, carbs: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600">{ingredient.carbs}g</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.sugars} onChange={(e) => setEditValues({ ...editValues, sugars: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs text-slate-500">{ingredient.sugars || 0}g</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.fiber} onChange={(e) => setEditValues({ ...editValues, fiber: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs text-slate-500">{ingredient.fiber || 0}g</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                          <Input type="number" step="0.1" value={editValues.sodium} onChange={(e) => setEditValues({ ...editValues, sodium: Number(e.target.value) })} className="mx-auto h-8 w-16 text-xs" />
                        ) : (
                          <span className="text-xs text-slate-500">{ingredient.sodium || 0}mg</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 align-middle">
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {(ingredient.preferences?.[0]?.tags || ingredient.tags || []).slice(0, 2).map((tag: any) => (
                            <span key={tag.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === ingredient.id && canEditIngredient(ingredient) ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(ingredient.id)} className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                                <Check size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700">
                                <X size={16} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleDetailsClick(ingredient)} className="h-8 w-8 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600">
                                <Info size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleManageTags(ingredient)} className="h-8 w-8 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600">
                                <Tag size={16} />
                              </Button>
                              {canEditIngredient(ingredient) && (
                                <Button variant="ghost" size="icon" onClick={() => handleStartEdit(ingredient)} className="h-8 w-8 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Editar ingrediente">
                                  <Pencil size={16} />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => handleTogglePreference(ingredient.id, { isFavorite: !ingredient.preferences?.[0]?.isFavorite })} className={cn("h-8 w-8 transition-colors", ingredient.preferences?.[0]?.isFavorite ? "text-amber-400 hover:bg-amber-50 hover:text-amber-500" : "text-slate-400 hover:bg-amber-50 hover:text-amber-400")}>
                                <Star size={16} fill={ingredient.preferences?.[0]?.isFavorite ? "currentColor" : "none"} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleTogglePreference(ingredient.id, { isNotRecommended: !ingredient.preferences?.[0]?.isNotRecommended })} className={cn("h-8 w-8 transition-colors", ingredient.preferences?.[0]?.isNotRecommended ? "text-red-500 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-red-50 hover:text-red-500")}>
                                <Ban size={16} />
                              </Button>
                              {ingredient.isMine && (
                                <Button variant="ghost" size="icon" onClick={() => handleShareToggle(ingredient)} className={cn("h-8 w-8 transition-colors", ingredient.isPublic ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-500")} title={ingredient.isPublic ? "Dejar de compartir" : "Compartir con la comunidad"}>
                                  <Share2 size={16} />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                          <Search className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No se encontraron alimentos</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-2">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      <IngredientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        ingredient={selectedIngredient}
      />

      <ManageTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        ingredient={selectedIngredientForTags}
        availableTags={allTags.filter((tag) => tag !== "Todos")}
          onSuccess={async () => {
            toast.success("Tags actualizados");
            await fetchIngredients(activeSourceTab);
          }}
        />

      <CreateIngredientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateIngredientSuccess}
        availableTags={allTags.filter((tag) => tag !== "Todos")}
      />
    </div>
  );
}
