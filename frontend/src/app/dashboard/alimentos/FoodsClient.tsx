"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Star,
  Ban,
  Info,
  Pencil,
  Tag,
  BadgeCheck,
  Scale,
  Plus,
  Check,
  X,
  Users,
  Share2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Ingredient } from "@/features/foods";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { useSearchParams, useRouter } from "next/navigation";
import CreateIngredientModal from "./CreateIngredientModal";
import IngredientDetailsModal from "./IngredientDetailsModal";
import { useScrollLock } from "@/hooks/useScrollLock";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import ManageTagsModal from "./ManageTagsModal";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";

type IngredientTab =
  | "Dieta base"
  | "Favoritos"
  | "No recomendados"
  | "Con tags"
  | "Borradores"
  | "Mis creaciones"
  | "Mis grupos";

interface FoodsClientProps {
  initialData: Ingredient[];
}

export default function FoodsClient({ initialData }: FoodsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as IngredientTab | null;

  const [data, setData] = useState<Ingredient[]>(initialData);
  const [catalogPool, setCatalogPool] = useState<Ingredient[]>(initialData);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [activeTab, setActiveTab] = useState<IngredientTab>(tabParam || "Dieta base");

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [baseTab, setBaseTab] = useState<"app" | "community">("app");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const [selectedTag, setSelectedTag] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [selectedIngredientForTags, setSelectedIngredientForTags] =
    useState<Ingredient | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null,
  );
  const [targetGroupIdForNewIngredient, setTargetGroupIdForNewIngredient] =
    useState<string | null>(null);

  const isAnyModalOpen =
    isCreateModalOpen ||
    isDetailsModalOpen ||
    isTagsModalOpen ||
    isDeleteConfirmOpen;
  useScrollLock(isAnyModalOpen);

  useEffect(() => {
    setData(initialData);
    setCatalogPool(initialData);
  }, [initialData]);

  const getToken = () => getAuthToken();

  const canEditIngredient = (ingredient: Ingredient | null | undefined) =>
    Boolean(ingredient?.isMine);

  const getBackendTab = useCallback(() => {
    switch (activeTab) {
      case "Favoritos":
        return "favorites";
      case "No recomendados":
        return "not_recommended";
      case "Con tags":
        return "tagged";
      case "Borradores":
        return "drafts";
      case "Mis creaciones":
        return "mine";
      case "Dieta base":
        return baseTab === "community" ? "community" : "app";
      default:
        return "all";
    }
  }, [activeTab, baseTab]);

  const fetchIngredients = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoadingIngredients(true);
    try {
      const queryParams = new URLSearchParams({
        tab: getBackendTab(),
        limit: "5000",
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        ...(selectedCategory !== "Todos" && { category: selectedCategory }),
        ...(selectedTag !== "Todos" && { tag: selectedTag }),
      });

      console.log("[FoodsClient.fetchIngredients] request", {
        activeTab,
        backendTab: getBackendTab(),
        selectedCategory,
        selectedTag,
        searchTerm,
        url: `/foods?${queryParams.toString()}`,
      });

      const res = await fetchApi(`/foods?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Error al cargar ingredientes");
      }

      const result = await res.json();
      console.log("[FoodsClient.fetchIngredients] response", {
        activeTab,
        backendTab: getBackendTab(),
        count: Array.isArray(result) ? result.length : 0,
        sample: Array.isArray(result)
          ? result.slice(0, 5).map((item) => ({
              id: item.id,
              name: item.name,
              isFavorite: item.preferences?.[0]?.isFavorite ?? false,
              isNotRecommended:
                item.preferences?.[0]?.isNotRecommended ?? false,
              tagCount: item.preferences?.[0]?.tags?.length ?? 0,
            }))
          : [],
      });
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast.error("No se pudo cargar el catálogo de ingredientes");
    } finally {
      setIsLoadingIngredients(false);
    }
  }, [activeTab, getBackendTab, searchTerm, selectedCategory, selectedTag]);

  const fetchCatalogPool = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetchApi("/foods?limit=5000", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Error al cargar catálogo base");
      }

      const result = await res.json();
      setCatalogPool(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching ingredient pool:", error);
    }
  }, []);


  useEffect(() => {
    fetchCatalogPool();
  }, [fetchCatalogPool]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIngredients();
    }, searchTerm.trim() ? 250 : 0);

    return () => clearTimeout(timer);
  }, [fetchIngredients, searchTerm]);

  const ingredientHasAnyTag = (ingredient: Ingredient) => {
    const preferenceTags = ingredient.preferences?.[0]?.tags || [];
    return (ingredient.tags?.length || 0) > 0 || preferenceTags.length > 0;
  };

  const filterOptionSource = useMemo(() => {
    if (activeTab === "Mis creaciones") {
      return data.filter((ingredient) => !!ingredient.isMine);
    }

    if (activeTab === "Con tags") {
      return data.filter((ingredient) => ingredientHasAnyTag(ingredient));
    }

    if (activeTab === "Borradores") {
      return data.filter((ingredient) => !!ingredient.isDraft);
    }

    return data;
  }, [data, activeTab]);

  const categories = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(
          filterOptionSource
            .filter((d) => d.category?.name)
            .map((d) => d.category.name),
        ),
      ),
    ],
    [filterOptionSource],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    filterOptionSource.forEach((d) => {
      d.tags?.forEach((t) => tags.add(t.name));
      d.preferences?.[0]?.tags?.forEach((t) => tags.add(t.name));
    });
    return ["Todos", ...Array.from(tags)];
  }, [filterOptionSource]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("Todos");
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!allTags.includes(selectedTag)) {
      setSelectedTag("Todos");
    }
  }, [allTags, selectedTag]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedTag, activeTab]);


  const filteredIngredients = useMemo(() => data, [data]);

  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const paginatedIngredients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIngredients.slice(start, start + itemsPerPage);
  }, [filteredIngredients, currentPage, itemsPerPage]);


  const tabs: IngredientTab[] = [
    "Dieta base",
    "Favoritos",
    "No recomendados",
    "Con tags",
    "Borradores",
    "Mis creaciones",
  ];

  const handleCreateIngredientSuccess = async (newIngredient?: any) => {
    if (newIngredient) {
      setCatalogPool((prev) => [
        {
          ...newIngredient,
          isMine: true,
          preferences: newIngredient.preferences || [],
        },
        ...prev.filter((ingredient) => ingredient.id !== newIngredient.id),
      ]);
    }
    await Promise.all([fetchIngredients(), fetchCatalogPool()]);

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

    console.log("[FoodsClient.handleTogglePreference] start", {
      activeTab,
      ingredientId,
      updates,
    });

    // Optimistic Update
    const previousData = [...data];
    setData((current) =>
      current.map((item) => {
        if (item.id === ingredientId) {
          const existingPref = item.preferences?.[0] || {
            isFavorite: false,
            isNotRecommended: false,
            tags: [],
          };
          return {
            ...item,
            preferences: [{ ...existingPref, ...updates }],
          };
        }
        return item;
      }),
    );

    try {
      const response = await fetchApi(
        `/foods/${ingredientId}/preferences`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Error desconocido" };
        }
        throw new Error(
          errorData.message || "Error al actualizar preferencias",
        );
      }

      const savedPreference = await response.json();
      console.log("[FoodsClient.handleTogglePreference] saved", {
        ingredientId,
        updates,
        savedPreference,
      });

      await Promise.all([fetchIngredients(), fetchCatalogPool()]);

      // Custom Toast Message
      let message = "Preferencia actualizada";
      if (updates.isFavorite) message = "Añadido a Favoritos ⭐";
      else if (updates.isNotRecommended)
        message = "Marcado como No Recomendado 🚫";
      else if (
        updates.isFavorite === false &&
        updates.isNotRecommended === false
      )
        message = "Preferencia eliminada";

      toast.success(message);
      await Promise.all([fetchIngredients(), fetchCatalogPool()]);
    } catch (error: any) {
      console.error("Toggle preference error:", error);
      setData(previousData); // Rollback
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
      data.find((ingredient) => ingredient.id === id) ||
      catalogPool.find((ingredient) => ingredient.id === id) ||
      null;

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

      // Optimistic Update
      setData((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...updatedFood } : item,
        ),
      );

      toast.success(
        ingredientToEdit?.isDraft
          ? "Borrador completado correctamente"
          : "Ingrediente actualizado",
      );
      setEditingId(null);
      setEditValues({});
      await Promise.all([fetchIngredients(), fetchCatalogPool()]);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("No se pudo actualizar el ingrediente");
    }
  };

  const handleShareToggle = async (ingredient: Ingredient) => {
    const token = getToken();
    if (!token) return;

    const newIsPublic = !ingredient.isPublic;

    try {
      const response = await fetchApi(`/foods/${ingredient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });

      if (!response.ok) throw new Error("Error al compartir");

      setData((current) =>
        current.map((item) =>
          item.id === ingredient.id ? { ...item, isPublic: newIsPublic } : item,
        ),
      );

      toast.success(
        newIsPublic
          ? "Ingrediente compartido con la comunidad 🌍"
          : "Ingrediente dejado de compartir",
      );
      await Promise.all([fetchIngredients(), fetchCatalogPool()]);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("No se pudo actualizar el estado de compartido");
    }
  };

  const handleInfoClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Main Tabs Switcher */}
          <div className="flex p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm overflow-x-auto max-w-full">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === "Mis grupos") {
                      router.push("/dashboard/alimentos/grupos");
                      return;
                    }
                    setActiveTab(tab);
                  }}
                  className={cn(
                    "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer",
                    activeTab === tab
                      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50",
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Sub-tabs for Dieta base */}
          {activeTab === "Dieta base" && (
            <div className="flex flex-col gap-2">
              <div className="flex max-w-full flex-wrap gap-2 p-1 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                <button
                  onClick={() => setBaseTab("app")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                    baseTab === "app"
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <BadgeCheck size={14} />
                  🏢 Oficiales App
                </button>
                <button
                  onClick={() => setBaseTab("community")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                    baseTab === "community"
                      ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <Users size={14} />
                  🌍 Comunidad Nutris
                </button>
              </div>
              {baseTab === "community" && (
                <p className="text-[10px] text-slate-500 italic px-2">
                  🌍 Explora ingredientes creados por otros nutris. Márcalos como favoritos ⭐ para agregarlos a tu propio catálogo.
                </p>
              )}
            </div>
          )}

          {/* Source Attribution */}
          {activeTab === "Dieta base" && baseTab === "app" && (
            <div className="flex max-w-full items-start gap-1.5 px-3 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <Info className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-medium text-emerald-700 break-words">
                Fuente: Tabla de Composición de Alimentos INTA (2018)
              </span>
            </div>
          )}
          {activeTab === "Borradores" && (
            <div className="flex max-w-full items-start gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg">
              <Info className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] font-medium text-amber-700 break-words">
                Estos ingredientes se crearon rápido desde Dieta y aún necesitan completar su información nutricional.
              </span>
            </div>
          )}
        </div>

        <div className="w-full lg:w-auto">
          <div className="flex w-full flex-wrap gap-2 lg:justify-end">
            <Button
              onClick={() => router.push("/dashboard/alimentos/grupos")}
              variant="outline"
              className="w-full justify-center border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2 sm:w-auto cursor-pointer"
            >
              <Layers size={18} />
              Mis Grupos
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-100 sm:w-auto cursor-pointer"
            >
              <Plus size={18} />
              Nuevo Ingrediente
            </Button>
          </div>
        </div>
      </div>

      <>
          {/* Filters Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex-1 min-w-[300px] space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">
                  Buscar Ingrediente
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search
                      className="h-5 w-5 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <Input
                    type="search"
                    placeholder="Nombre, marca..."
                    className="pl-10 h-11 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-w-xs w-full space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">
                  Categoría
                </label>
                <SearchableSelect
                  options={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Filtrar por Categoría..."
                  className="w-full"
                />
              </div>

              <div className="max-w-xs w-full space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">
                  Tag
                </label>
                <SearchableSelect
                  options={allTags}
                  value={selectedTag}
                  onChange={setSelectedTag}
                  placeholder="Filtrar por Tag..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mostrando{" "}
                <span className="text-emerald-600">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="text-emerald-600">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredIngredients.length,
                  )}
                </span>{" "}
                de{" "}
                <span className="text-slate-600">
                  {filteredIngredients.length}
                </span>{" "}
                ingredientes
              </p>
              {isLoadingIngredients && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-100 border-t-emerald-500 animate-spin" />
                  Actualizando
                </div>
              )}
            </div>
            <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 table-fixed md:table-auto">
                  <thead className="bg-slate-50/50 text-shadow-sm">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
                      >
                        Alimento
                      </th>
                      {!(activeTab === "Dieta base" && baseTab === "app") && (
                        <>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
                          >
                            Marca
                          </th>
                        </>
                      )}
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
                      >
                        Categoría
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic"
                      >
                        Unidad {(activeTab === "Dieta base" && baseTab === "app") && "(100)"}
                      </th>
                      {(activeTab === "Mis creaciones" ||
                        activeTab === "Borradores") && (
                        <>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Cals
                          </th>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Prot
                          </th>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Lip
                          </th>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Carb
                          </th>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Sug
                          </th>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Fib
                          </th>
                          <th className="px-3 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                            Na
                          </th>
                        </>
                      )}
                      {!(activeTab === "Dieta base" && baseTab === "app") && (
                        <th
                          scope="col"
                          className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
                        >
                          Tags
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedIngredients.map((ingredient) => (
                      <tr
                        key={ingredient.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          {editingId === ingredient.id &&
                          canEditIngredient(ingredient) ? (
                            <Input
                              value={editValues.name}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  name: e.target.value,
                                })
                              }
                              className="h-8 text-sm w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                {ingredient.name}
                              </span>
                              {ingredient.isDraft && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
                                  Borrador
                                </span>
                              )}
                              {ingredient.verified && (
                                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                          )}
                        </td>
                        {!(activeTab === "Dieta base" && baseTab === "app") && (
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {editingId === ingredient.id &&
                            canEditIngredient(ingredient) ? (
                              <Input
                                value={editValues.brand}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    brand: e.target.value,
                                  })
                                }
                                className="h-8 text-sm w-full"
                              />
                            ) : (
                              ingredient.brand?.name || "-"
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {ingredient.category?.name || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-500">
                          {ingredient.unit}
                        </td>
                        {(activeTab === "Mis creaciones" ||
                          activeTab === "Borradores") && (
                          <>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.calories}
                                  onChange={(e) => setEditValues({ ...editValues, calories: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-slate-600 font-medium">{ingredient.calories}</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.proteins}
                                  onChange={(e) => setEditValues({ ...editValues, proteins: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-blue-600 font-bold">{ingredient.proteins}g</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.lipids}
                                  onChange={(e) => setEditValues({ ...editValues, lipids: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-red-600 font-bold">{ingredient.lipids}g</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.carbs}
                                  onChange={(e) => setEditValues({ ...editValues, carbs: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-emerald-600 font-bold">{ingredient.carbs}g</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.sugars}
                                  onChange={(e) => setEditValues({ ...editValues, sugars: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-slate-500">{ingredient.sugars || 0}g</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.fiber}
                                  onChange={(e) => setEditValues({ ...editValues, fiber: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-slate-500">{ingredient.fiber || 0}g</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              {editingId === ingredient.id &&
                              canEditIngredient(ingredient) ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editValues.sodium}
                                  onChange={(e) => setEditValues({ ...editValues, sodium: Number(e.target.value) })}
                                  className="h-8 text-xs w-16 mx-auto"
                                />
                              ) : (
                                <span className="text-xs text-slate-500">{ingredient.sodium || 0}mg</span>
                              )}
                            </td>
                          </>
                        )}
                        {!(activeTab === "Dieta base" && baseTab === "app") && (
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {(
                                ingredient.preferences?.[0]?.tags ||
                                ingredient.tags ||
                                []
                              )
                                .slice(0, 2)
                                .map((tag: any) => (
                                  <span
                                    key={tag.id}
                                    className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded"
                                  >
                                    #{tag.name}
                                  </span>
                                ))}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {editingId === ingredient.id &&
                            canEditIngredient(ingredient) ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSaveEdit(ingredient.id)}
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Check size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleInfoClick(ingredient)}
                                  className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Info size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleManageTags(ingredient)}
                                  className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Tag size={16} />
                                </Button>
                                {canEditIngredient(ingredient) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleStartEdit(ingredient)}
                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Editar ingrediente"
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleTogglePreference(ingredient.id, {
                                      isFavorite:
                                        !ingredient.preferences?.[0]
                                          ?.isFavorite,
                                    })
                                  }
                                  className={cn(
                                    "h-8 w-8 transition-colors",
                                    ingredient.preferences?.[0]?.isFavorite
                                      ? "text-amber-400 hover:text-amber-500 hover:bg-amber-50"
                                      : "text-slate-400 hover:text-amber-400 hover:bg-amber-50",
                                  )}
                                >
                                  <Star
                                    size={16}
                                    fill={
                                      ingredient.preferences?.[0]?.isFavorite
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleTogglePreference(ingredient.id, {
                                      isNotRecommended:
                                        !ingredient.preferences?.[0]
                                          ?.isNotRecommended,
                                    })
                                  }
                                  className={cn(
                                    "h-8 w-8 transition-colors",
                                    ingredient.preferences?.[0]
                                      ?.isNotRecommended
                                      ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                                      : "text-slate-400 hover:text-red-500 hover:bg-red-50",
                                  )}
                                >
                                  <Ban size={16} />
                                </Button>
                                {activeTab === "Mis creaciones" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleShareToggle(ingredient)}
                                    className={cn(
                                      "h-8 w-8 transition-colors",
                                      ingredient.isPublic
                                        ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                                        : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50",
                                    )}
                                    title={
                                      ingredient.isPublic
                                        ? "Dejar de compartir"
                                        : "Compartir con la comunidad"
                                    }
                                  >
                                    <Share2 size={16} />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </>
      {/* Modals */}

      <CreateIngredientModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        onSuccess={handleCreateIngredientSuccess}
        availableTags={allTags.filter((t) => t !== "Todos")}
      />


      {/* Details Modal */}
      {selectedIngredient && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300 ${isDetailsModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {selectedIngredient.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedIngredient.brand?.name || "Sin marca"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Categoría
                  </p>
                  <p className="font-semibold text-slate-700">
                    {selectedIngredient.category?.name || "-"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Scale size={16} className="text-indigo-500" />
                  Información Nutricional (por porción)
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs font-medium text-orange-600 mb-1">
                      Calorías
                    </p>
                    <p className="text-lg font-black text-orange-700">
                      {selectedIngredient.calories}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 mb-1">
                      Proteínas
                    </p>
                    <p className="text-lg font-black text-blue-700">
                      {selectedIngredient.proteins}g
                    </p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 mb-1">
                      Carbos
                    </p>
                    <p className="text-lg font-black text-emerald-700">
                      {selectedIngredient.carbs}g
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <p className="text-xs font-medium text-yellow-600 mb-1">
                      Grasas
                    </p>
                    <p className="text-lg font-black text-yellow-700">
                      {selectedIngredient.lipids}g
                    </p>
                  </div>
                </div>
              </div>

              {selectedIngredient.tags &&
                selectedIngredient.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Etiquetas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedIngredient.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ManageTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        ingredient={selectedIngredientForTags}
        availableTags={allTags.filter((t) => t !== "Todos")}
        onSuccess={async () => {
          toast.success("Tags actualizados");
          await Promise.all([fetchIngredients(), fetchCatalogPool()]);
        }}
      />
    </div>
  );
}
