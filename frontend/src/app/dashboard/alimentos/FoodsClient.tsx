"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BadgeCheck,
  Plus,
  Layers,
  Lock,
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
import { useSubscription } from "@/context/SubscriptionContext";
import IngredientDetailsModal from "./IngredientDetailsModal";

interface FoodsClientProps {
  initialData: Ingredient[];
}

type FoodSourceTab = "catalog" | "mine" | "community";

export default function FoodsClient({ initialData }: FoodsClientProps) {
  const router = useRouter();
  const { can, isLoading: isSubscriptionLoading } = useSubscription();
  const foodSourcesLocked = !isSubscriptionLoading && !can("ingredients.create.access");

  const showFoodUpgrade = (customDescription?: string) => {
    window.dispatchEvent(
      new CustomEvent("show-freemium-upgrade", {
        detail: {
          description: customDescription || "Ver y gestionar alimentos propios o de la comunidad está disponible en los planes de pago.",
        },
      }),
    );
  };

  const handleTabClick = (sourceTab: FoodSourceTab) => {
    if (sourceTab === "catalog") {
      loadSourceTab("catalog");
      return;
    }

    if (sourceTab === "community") {
      toast.info("La pestaña Comunidad estará disponible próximamente en futuras versiones del MVP.");
      return;
    }

    if (isSubscriptionLoading || foodSourcesLocked) {
      showFoodUpgrade("Acceder a tus propios alimentos está disponible en los planes de pago.");
      return;
    }

    loadSourceTab(sourceTab);
  };

  const [data, setData] = useState<Ingredient[]>(initialData);
  const [catalogPool, setCatalogPool] = useState<Ingredient[]>(initialData);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [activeSourceTab, setActiveSourceTab] = useState<FoodSourceTab>("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedTag, setSelectedTag] = useState("Todos");
  const [selectedUnit, setSelectedUnit] = useState("Todas las unidades");
  const [selectedProfile, setSelectedProfile] = useState("Todos los tipos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const sourceCacheRef = useRef<Record<FoodSourceTab, Ingredient[]>>({
    catalog: initialData,
    mine: [],
    community: [],
  });
  const skipNextSearchFetchRef = useRef(true);
  const clearSourceSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAnyModalOpen = isDetailsModalOpen;
  useScrollLock(isAnyModalOpen);

  useEffect(() => {
    setData(initialData);
    setCatalogPool(initialData);
    sourceCacheRef.current.catalog = initialData;
  }, [initialData]);

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
      if (sourceTab !== "catalog" && (isSubscriptionLoading || foodSourcesLocked)) {
        showFoodUpgrade("Acceder a tus propios alimentos o la comunidad está disponible en los planes de pago.");
        return;
      }

      if (clearSourceSwitchTimerRef.current) {
        clearTimeout(clearSourceSwitchTimerRef.current);
        clearSourceSwitchTimerRef.current = null;
      }

      skipNextSearchFetchRef.current = true;
      setActiveSourceTab(sourceTab);
      setSearchTerm("");
      setSelectedCategory("Todos");
      setSelectedTag("Todos");
      setSelectedUnit("Todas las unidades");
      setSelectedProfile("Todos los tipos");
      setCurrentPage(1);

      const cachedItems = sourceCacheRef.current[sourceTab];
      if (cachedItems && cachedItems.length > 0) {
        setData(cachedItems);
        setCatalogPool(cachedItems);
        setIsLoadingIngredients(false);
        return;
      }

      setData([]);
      setCatalogPool([]);

      setIsLoadingIngredients(true);
      try {
        const queryParams = new URLSearchParams({
          tab: sourceTabToApiTab(sourceTab),
          limit: "100",
        });

        const response = await fetchApi(`/foods?${queryParams.toString()}`, {
          cache: "no-store",
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
      }
    },
    [sourceTabToApiTab, setSourceTabData, isSubscriptionLoading, foodSourcesLocked],
  );

  const fetchIngredients = useCallback(async (sourceTab: FoodSourceTab = activeSourceTab) => {
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
  }, [activeSourceTab, searchTerm, selectedCategory, selectedTag, sourceTabToApiTab]);

  useEffect(() => {
    if (skipNextSearchFetchRef.current) {
      skipNextSearchFetchRef.current = false;
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
  }, [searchTerm, selectedCategory, selectedTag, selectedUnit, selectedProfile]);

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

  const units = useMemo(() => {
    const unitSet = new Set<string>();
    catalogPool.forEach((item) => {
      if (item.unit) unitSet.add(item.unit);
    });
    return ["Todas las unidades", ...Array.from(unitSet).sort((a, b) => a.localeCompare(b, "es"))];
  }, [catalogPool]);

  const profileOptions = useMemo(
    () => [
      "Todos los tipos",
      "Alto en Proteínas",
      "Alto en Calorías",
      "Alto en Fibra",
      "Bajo en Calorías",
      "Bajo en Sodio",
    ],
    [],
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
    if (!units.includes(selectedUnit)) setSelectedUnit("Todas las unidades");
  }, [units, selectedUnit]);

  useEffect(() => {
    if (!allTags.includes(selectedTag)) setSelectedTag("Todos");
  }, [allTags, selectedTag]);

  const filteredIngredients = useMemo(() => {
    return data.filter((item) => {
      if (selectedUnit !== "Todas las unidades" && item.unit !== selectedUnit) {
        return false;
      }

      if (selectedProfile === "Alto en Proteínas" && (item.proteins ?? 0) < 10) {
        return false;
      }
      if (selectedProfile === "Alto en Calorías" && (item.calories ?? 0) < 250) {
        return false;
      }
      if (selectedProfile === "Alto en Fibra" && (item.fiber ?? 0) < 3) {
        return false;
      }
      if (selectedProfile === "Bajo en Calorías" && (item.calories ?? 0) > 50) {
        return false;
      }
      if (selectedProfile === "Bajo en Sodio" && (item.sodium ?? 0) > 140) {
        return false;
      }

      return true;
    });
  }, [data, selectedUnit, selectedProfile]);

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
    setSelectedUnit("Todas las unidades");
    setSelectedProfile("Todos los tipos");
    setCurrentPage(1);
    await loadSourceTab("mine");
  };

  const handleDetailsClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsDetailsModalOpen(true);
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
          <div className="mt-4 grid grid-cols-3 sm:flex w-full sm:w-auto rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 gap-1 text-center">
            {[
              { key: "catalog", label: "Catálogo NutriNet" },
              { key: "mine", label: "Mis alimentos" },
              { key: "community", label: "Comunidad" },
            ].map((tab) => {
              const isDisabledTab = tab.key === "community";
              const isLocked = tab.key === "mine" && (isSubscriptionLoading || foodSourcesLocked);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabClick(tab.key as FoodSourceTab)}
                  title={
                    isDisabledTab
                      ? "Próximamente en futuras versiones"
                      : isLocked
                        ? "Disponible en planes de pago"
                        : undefined
                  }
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all",
                    activeSourceTab === tab.key
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                    isDisabledTab && "opacity-60 cursor-not-allowed hover:bg-transparent text-slate-400",
                    isLocked && "opacity-80 hover:bg-amber-50/50 hover:text-amber-700",
                  )}
                >
                  <span>{tab.label}</span>
                  {isDisabledTab && (
                    <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                      Próximamente
                    </span>
                  )}
                  {isLocked && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                </button>
              );
            })}
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
            onClick={() => {
              if (foodSourcesLocked) {
                showFoodUpgrade();
                return;
              }
              router.push("/dashboard/alimentos/nuevo");
            }}
            className={cn(
              "h-10 flex-1 justify-center rounded-xl bg-indigo-600 gap-2 whitespace-nowrap font-semibold text-white shadow-sm hover:bg-indigo-700 lg:flex-none lg:px-5",
              foodSourcesLocked && "opacity-75",
            )}
          >
            {foodSourcesLocked ? <Lock size={18} /> : <Plus size={18} />}
            Nuevo Alimento
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre o marca..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs sm:text-sm font-medium text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
            triggerClassName="h-10 rounded-xl text-xs sm:text-sm"
          />

          <SearchableSelect
            options={units}
            value={selectedUnit}
            onChange={(value) => {
              setSelectedUnit(value);
              setCurrentPage(1);
            }}
            placeholder="Unidad de medida"
            className="w-full"
            triggerClassName="h-10 rounded-xl text-xs sm:text-sm"
          />

          <SearchableSelect
            options={profileOptions}
            value={selectedProfile}
            onChange={(value) => {
              setSelectedProfile(value);
              setCurrentPage(1);
            }}
            placeholder="Tipo / Perfil"
            className="w-full"
            triggerClassName="h-10 rounded-xl text-xs sm:text-sm"
          />

          {activeSourceTab !== "catalog" && (
            <SearchableSelect
              options={allTags}
              value={selectedTag}
              onChange={(value) => {
                setSelectedTag(value);
                setCurrentPage(1);
              }}
              placeholder="Tag"
              className="w-full"
              triggerClassName="h-10 rounded-xl text-xs sm:text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-1 sm:px-3">
        <p className="text-xs font-medium text-slate-500">
          <span className="font-semibold text-indigo-600">{filteredIngredients.length}</span> alimentos mostrados
        </p>
        {isLoadingIngredients && (
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-500" />
            Cargando
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 table-auto">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Alimento</th>
                  {activeSourceTab !== "catalog" && (
                    <th className="border-b border-slate-100 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Marca</th>
                  )}
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Categoría</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Unidad</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cals</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Prot</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Lip</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Carb</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sug</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Fib</th>
                  <th className="border-b border-slate-100 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Na</th>
                  {activeSourceTab !== "catalog" && (
                    <th className="border-b border-slate-100 px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">Tags</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingIngredients && data.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3.5 align-middle">
                        <div className="h-4 w-36 rounded-lg bg-slate-100" />
                      </td>
                      {activeSourceTab !== "catalog" && (
                        <td className="px-5 py-3.5 align-middle">
                          <div className="h-4 w-20 rounded-lg bg-slate-100" />
                        </td>
                      )}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="h-5 w-24 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-5 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-10 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      <td className="px-2 py-3.5 align-middle text-center">
                        <div className="mx-auto h-4 w-8 rounded-lg bg-slate-100" />
                      </td>
                      {activeSourceTab !== "catalog" && (
                        <td className="px-5 py-3.5 align-middle">
                          <div className="mx-auto h-4 w-16 rounded-lg bg-slate-100" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : paginatedIngredients.length > 0 ? (
                  paginatedIngredients.map((ingredient) => (
                    <tr
                      key={ingredient.id}
                      onClick={() => handleDetailsClick(ingredient)}
                      className="group cursor-pointer transition-colors hover:bg-indigo-50/40"
                    >
                      <td className="px-5 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {ingredient.name}
                          </span>
                          {ingredient.isDraft && (
                            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
                              Borrador
                            </span>
                          )}
                          {ingredient.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />}
                        </div>
                      </td>
                      {activeSourceTab !== "catalog" && (
                        <td className="px-5 py-3 align-middle text-sm text-slate-500">
                          {ingredient.brand?.name || "-"}
                        </td>
                      )}
                      <td className="px-5 py-3 align-middle text-sm text-slate-500">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {ingredient.category?.name || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle text-center text-sm text-slate-500">{ingredient.unit}</td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs font-medium text-slate-700">{ingredient.calories}</span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs font-semibold text-blue-600">{ingredient.proteins}g</span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs font-semibold text-red-600">{ingredient.lipids}g</span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs font-semibold text-emerald-600">{ingredient.carbs}g</span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs text-slate-500">{ingredient.sugars || 0}g</span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs text-slate-500">{ingredient.fiber || 0}g</span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="text-xs text-slate-500">{ingredient.sodium || 0}mg</span>
                      </td>
                      {activeSourceTab !== "catalog" && (
                        <td className="px-5 py-3 align-middle">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {(ingredient.preferences?.[0]?.tags || ingredient.tags || []).slice(0, 2).map((tag: any) => (
                              <span key={tag.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeSourceTab === "catalog" ? 10 : 12} className="py-16 text-center">
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

        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-3">
          {isLoadingIngredients && data.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="h-4 w-40 rounded-lg bg-slate-100" />
                <div className="h-3 w-24 rounded-lg bg-slate-100" />
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="h-10 rounded-xl bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))
          ) : paginatedIngredients.length > 0 ? (
            paginatedIngredients.map((ingredient) => (
              <div
                key={ingredient.id}
                onClick={() => handleDetailsClick(ingredient)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{ingredient.name}</h3>
                      {ingredient.isDraft && (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 ring-1 ring-amber-200">
                          Borrador
                        </span>
                      )}
                      {ingredient.verified && <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {activeSourceTab !== "catalog" && ingredient.brand?.name ? `${ingredient.brand.name} · ` : ""}
                      <span className="text-indigo-600 font-semibold">{ingredient.category?.name || "General"}</span>
                    </p>
                  </div>
                </div>

                {/* Nutrients Pills */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-semibold">
                  <div className="bg-slate-50 rounded-xl p-1.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Cals</p>
                    <p className="text-slate-800 font-bold">{ingredient.calories}</p>
                  </div>
                  <div className="bg-blue-50/60 rounded-xl p-1.5">
                    <p className="text-[9px] text-blue-500 font-bold uppercase">Prot</p>
                    <p className="text-blue-700 font-bold">{ingredient.proteins}g</p>
                  </div>
                  <div className="bg-red-50/60 rounded-xl p-1.5">
                    <p className="text-[9px] text-red-500 font-bold uppercase">Lip</p>
                    <p className="text-red-700 font-bold">{ingredient.lipids}g</p>
                  </div>
                  <div className="bg-emerald-50/60 rounded-xl p-1.5">
                    <p className="text-[9px] text-emerald-500 font-bold uppercase">Carb</p>
                    <p className="text-emerald-700 font-bold">{ingredient.carbs}g</p>
                  </div>
                </div>

                {/* Footer with tags */}
                {activeSourceTab !== "catalog" && (ingredient.preferences?.[0]?.tags || ingredient.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                    {(ingredient.preferences?.[0]?.tags || ingredient.tags || []).map((tag: any) => (
                      <span key={tag.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                  <Search className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No se encontraron alimentos</p>
              </div>
            </div>
          )}
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
    </div>
  );
}
