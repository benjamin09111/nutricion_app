"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BadgeCheck,
  Plus,
  Apple,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Ingredient,
  OFFICIAL_INGREDIENTS,
  normalizeSearchText,
} from "@/features/foods";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { fetchApi } from "@/lib/api-base";
import { getLocalCustomFoods } from "@/lib/demo-local-api";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import IngredientDetailsModal from "./IngredientDetailsModal";


interface FoodsClientProps {
  initialData: Ingredient[];
}

type FoodSourceTab = "catalog" | "created";

export default function FoodsClient({ initialData }: FoodsClientProps) {
  const router = useRouter();

  const initialCatalog = useMemo(() => {
    return initialData && initialData.length > 0 ? initialData : OFFICIAL_INGREDIENTS;
  }, [initialData]);

  const [data, setData] = useState<Ingredient[]>(initialCatalog);
  const [catalogPool, setCatalogPool] = useState<Ingredient[]>(initialCatalog);
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
    catalog: initialCatalog,
    created: [],
  });

  const isAnyModalOpen = isDetailsModalOpen;
  useScrollLock(isAnyModalOpen);

  useEffect(() => {
    const valid = initialData && initialData.length > 0 ? initialData : OFFICIAL_INGREDIENTS;
    setData(valid);
    setCatalogPool(valid);
    sourceCacheRef.current.catalog = valid;
  }, [initialData]);

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
      setActiveSourceTab(sourceTab);
      setSearchTerm("");
      setSelectedCategory("Todos");
      setSelectedTag("Todos");
      setSelectedUnit("Todas las unidades");
      setSelectedProfile("Todos los tipos");
      setCurrentPage(1);

      // 1. Catálogo Base (100% instantáneo desde ingredients.txt / catalog JSON en memoria)
      if (sourceTab === "catalog") {
        const catalogItems = OFFICIAL_INGREDIENTS;
        setCatalogPool(catalogItems);
        setData(catalogItems);
        setIsLoadingIngredients(false);
        return;
      }

      // 2. Alimentos creados (carga inmediata de alimentos locales/comunitarios)
      const localCustom = getLocalCustomFoods();
      setSourceTabData("created", localCustom);
      setIsLoadingIngredients(false);

      // Sincronizar en segundo plano con el backend sin bloquear la vista
      try {
        const response = await fetchApi("/foods?tab=community&limit=1000", {
          cache: "no-store",
        });

        if (response.ok) {
          const serverItems = await response.json();
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            const map = new Map<string, Ingredient>();
            localCustom.forEach((item: any) => map.set(item.id, item));
            serverItems.forEach((item: any) => map.set(item.id, item));
            const merged = Array.from(map.values());
            setSourceTabData("created", merged);
          }
        }
      } catch {
        // Modo local silencioso
      }
    },
    [],
  );

  const handleTabClick = (sourceTab: FoodSourceTab) => {
    loadSourceTab(sourceTab);
  };

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
    return catalogPool.filter((item) => {
      // 1. Búsqueda instantánea multi-término normalizada sin tildes ni mayúsculas
      if (searchTerm.trim()) {
        const normQuery = normalizeSearchText(searchTerm);
        const terms = normQuery.split(/\s+/).filter(Boolean);
        const normName = normalizeSearchText(item.name);
        const matchesAll = terms.every((term) => normName.includes(term));
        if (!matchesAll) return false;
      }

      // 2. Filtro de Categoría
      if (selectedCategory !== "Todos" && item.category?.name !== selectedCategory) {
        return false;
      }

      // 3. Filtro de Etiqueta
      if (selectedTag !== "Todos") {
        const hasTag =
          item.tags?.some((t) => t.name === selectedTag) ||
          item.preferences?.[0]?.tags?.some((t) => t.name === selectedTag);
        if (!hasTag) return false;
      }

      // 4. Filtro de Unidad
      if (selectedUnit !== "Todas las unidades" && item.unit !== selectedUnit) {
        return false;
      }

      // 5. Perfil Nutricional
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
  }, [catalogPool, searchTerm, selectedCategory, selectedTag, selectedUnit, selectedProfile]);


  const itemsPerPage = 20;
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
      sourceCacheRef.current.created = [
        { ...newIngredient, isMine: true, preferences: newIngredient.preferences || [] },
        ...sourceCacheRef.current.created.filter((item: Ingredient) => item.id !== newIngredient.id),
      ];
    }

    setSearchTerm("");
    setSelectedCategory("Todos");
    setSelectedTag("Todos");
    setSelectedUnit("Todas las unidades");
    setSelectedProfile("Todos los tipos");
    setCurrentPage(1);
    await loadSourceTab("created");
  };

  const handleDetailsClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsDetailsModalOpen(true);
  };

  const columns: Column<Ingredient>[] = [
    {
      header: "Alimento",
      render: (ingredient: Ingredient) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#7842D4] font-bold text-sm shrink-0">
            {ingredient.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 group-hover:text-[#7842D4] transition-colors truncate">
              {ingredient.name}
            </div>
            {activeSourceTab === "created" && (
              <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-200/90 px-2 py-0.2 text-[10px] font-bold text-[#7842D4] mt-0.5">
                Público
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Categoría",
      render: (ingredient: Ingredient) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {ingredient.category?.name || "General"}
        </span>
      ),
    },
    {
      header: "Unidad",
      className: "text-center",
      render: (ingredient: Ingredient) => (
        <span className="text-xs font-mono text-slate-600">
          {ingredient.unit || "g"}
        </span>
      ),
    },
    {
      header: "Cals",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs font-semibold text-slate-800">
          {ingredient.calories != null ? Math.round(Number(ingredient.calories)) : 0}
        </span>
      ),
    },
    {
      header: "Prot",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs font-semibold text-indigo-600">
          {ingredient.proteins != null ? Number(ingredient.proteins).toFixed(1) : "0"}g
        </span>
      ),
    },
    {
      header: "Lip",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs font-semibold text-rose-600">
          {ingredient.lipids != null ? Number(ingredient.lipids).toFixed(1) : "0"}g
        </span>
      ),
    },
    {
      header: "Carb",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs font-semibold text-amber-600">
          {ingredient.carbs != null ? Number(ingredient.carbs).toFixed(1) : "0"}g
        </span>
      ),
    },
    {
      header: "Sug",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs text-slate-500">
          {ingredient.sugars != null ? Number(ingredient.sugars).toFixed(1) : "0"}g
        </span>
      ),
    },
    {
      header: "Fib",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs text-slate-500">
          {ingredient.fiber != null ? Number(ingredient.fiber).toFixed(1) : "0"}g
        </span>
      ),
    },
    {
      header: "Na",
      className: "text-center font-mono",
      render: (ingredient: Ingredient) => (
        <span className="text-xs text-slate-500">
          {ingredient.sodium != null ? Math.round(Number(ingredient.sodium)) : 0}mg
        </span>
      ),
    },
  ];

  const totalCatalogCount = sourceCacheRef.current.catalog?.length || OFFICIAL_INGREDIENTS.length;
  const totalCreatedCount = sourceCacheRef.current.created?.length || getLocalCustomFoods().length;

  return (
    <ModuleLayout
      title="Catálogo de Ingredientes"
      description={
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
            <Apple className="w-4 h-4 text-[#86A83C]" />
            <span className="tracking-wider uppercase text-[10px] font-bold">Base de Datos Nutricional</span>
          </div>
          <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
            Gestiona los ingredientes base para tus pautas y recetas. Filtra rápidamente y consulta composición en tiempo real.
          </p>
        </div>
      }
      rightContent={
        <button
          type="button"
          onClick={() => router.push("/dashboard/alimentos/nuevo")}
          className="h-11 px-5 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-[0.99] cursor-pointer"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Nuevo Alimento</span>
        </button>
      }
      className="pb-16 relative"
    >
      <div className="space-y-6">
        {/* Barra de Indicadores — Idéntica a Pacientes y Consultas con 3 columnas */}
        <div className="relative overflow-hidden bg-white border border-[#E9E5E7] rounded-[18px] p-5 sm:p-6 min-h-[110px] shadow-2xs">
          <svg
            className="absolute left-0 top-0 h-full w-36 text-[#B0C76F] pointer-events-none select-none opacity-15"
            viewBox="0 0 120 100"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0 0 C 45 15, 65 55, 25 100 L 0 100 Z" />
            <path d="M0 20 C 35 35, 45 75, 10 100 L 0 100 Z" opacity="0.6" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#F0ECEE] relative z-10">
            {/* 1. Catálogo base */}
            <div className="flex items-center justify-between sm:px-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                  <Apple className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Catálogo base</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {totalCatalogCount}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F5DF] text-[#668E20] border border-[#DDE7B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-pulse" />
                <span>Oficiales</span>
              </span>
            </div>

            {/* 2. Alimentos creados */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7842D4]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Alimentos creados</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {totalCreatedCount}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-[#7842D4] border border-purple-200">
                Públicos
              </span>
            </div>

            {/* 3. Total disponibles */}
            <div className="flex items-center justify-between pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3ECFC] text-[#7842D4]">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#626573]">Total disponibles</p>
                  <h3 className="text-3xl font-semibold text-[#20212B] tracking-tight leading-none mt-1">
                    {totalCatalogCount + totalCreatedCount}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3ECFC] text-[#7842D4] border border-[#E4D5FA]">
                100% disponibles
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas Catálogo Base / Alimentos creados */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabClick("catalog")}
            className={cn(
              "px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
              activeSourceTab === "catalog"
                ? "bg-[#7842D4] text-white shadow-2xs"
                : "bg-white text-[#626573] border border-[#E9E5E7] hover:bg-slate-50"
            )}
          >
            <span>Catálogo Base</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                activeSourceTab === "catalog"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {totalCatalogCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("created")}
            className={cn(
              "px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2",
              activeSourceTab === "created"
                ? "bg-[#7842D4] text-white shadow-2xs"
                : "bg-white text-[#626573] border border-[#E9E5E7] hover:bg-slate-50"
            )}
          >
            <span>Alimentos creados</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                activeSourceTab === "created"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {totalCreatedCount}
            </span>
          </button>
        </div>

        {/* Buscador y Filtros — Una única fila horizontal uniforme de 44px */}
        <div className="space-y-2">
          <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#848792]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nombre o marca..."
                className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-3 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#7842D4]/15 focus:border-[#7842D4] transition-all shadow-2xs"
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
              triggerClassName="h-11 rounded-xl text-sm font-medium text-[#20212B] border-[#E9E5E7] shadow-2xs"
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
              triggerClassName="h-11 rounded-xl text-sm font-medium text-[#20212B] border-[#E9E5E7] shadow-2xs"
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
              triggerClassName="h-11 rounded-xl text-sm font-medium text-[#20212B] border-[#E9E5E7] shadow-2xs"
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
                triggerClassName="h-11 rounded-xl text-sm font-medium text-[#20212B] border-[#E9E5E7] shadow-2xs"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1 pb-1">
            <p className="text-xs font-semibold text-[#626573]">
              Mostrando <span className="font-bold text-[#7842D4]">{paginatedIngredients.length}</span> de{" "}
              <span className="font-bold text-[#20212B]">{filteredIngredients.length}</span> alimentos
              {totalPages > 1 && (
                <span className="text-[#848792] ml-1">
                  · Página <strong className="text-[#20212B] font-bold">{currentPage}</strong> de {totalPages}
                </span>
              )}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center self-end sm:self-auto shrink-0">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="py-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Vista Desktop con RecordsTable unificada */}
        <div className="hidden lg:block bg-white rounded-2xl border border-[#E9E5E7] shadow-2xs overflow-hidden">
          <RecordsTable
            columns={columns}
            data={paginatedIngredients}
            keyExtractor={(item) => item.id}
            isLoading={isLoadingIngredients && catalogPool.length === 0}
            loadingRows={8}
            loadingColumns={columns.length}
            onRowClick={handleDetailsClick}
            emptyState={
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 mb-2">
                  <Search className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600">No se encontraron alimentos</p>
                <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros de búsqueda</p>
              </div>
            }
            footer={
              totalPages > 1 ? (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8EBF0]">
                  <p className="text-xs text-[#626573]">
                    Página <strong className="font-semibold text-[#20212B]">{currentPage}</strong> de{" "}
                    <strong className="font-semibold text-[#20212B]">{totalPages}</strong>
                  </p>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="py-0"
                  />
                </div>
              ) : undefined
            }
          />
        </div>

        {/* Vista Móvil */}
        <div className="lg:hidden space-y-3">
          {isLoadingIngredients && catalogPool.length === 0 ? (
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
                className="bg-white p-4 rounded-2xl border border-[#E9E5E7] shadow-2xs space-y-3 cursor-pointer active:scale-[0.99] transition-all hover:border-[#7842D4]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-[#20212B] text-sm">{ingredient.name}</h3>
                      {activeSourceTab === "created" && (
                        <span className="rounded-full bg-purple-50 border border-purple-200/90 px-2 py-0.5 text-[10px] font-bold text-[#7842D4]">
                          Público
                        </span>
                      )}
                      {ingredient.isDraft && (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 ring-1 ring-amber-200">
                          Borrador
                        </span>
                      )}
                      {ingredient.verified && <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-[#626573] font-medium mt-0.5">
                      {activeSourceTab !== "catalog" && ingredient.brand?.name ? `${ingredient.brand.name} · ` : ""}
                      <span className="text-[#7842D4] font-semibold">{ingredient.category?.name || "General"}</span>
                    </p>
                  </div>
                </div>

                {/* Nutrientes Pills */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-semibold">
                  <div className="bg-slate-50 rounded-xl p-1.5">
                    <p className="text-[9px] text-[#848792] font-bold uppercase">Cals</p>
                    <p className="text-[#20212B] font-bold">{ingredient.calories}</p>
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
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-[#F0ECEE]">
                    {(ingredient.preferences?.[0]?.tags || ingredient.tags || []).map((tag: any) => (
                      <span key={tag.id} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-[#7842D4]">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-[#E9E5E7] text-center shadow-2xs">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                  <Search className="h-6 w-6 text-[#848792]" />
                </div>
                <p className="text-sm font-medium text-[#626573]">No se encontraron alimentos</p>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      </div>

      <IngredientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        ingredient={selectedIngredient}
      />
    </ModuleLayout>
  );
}
