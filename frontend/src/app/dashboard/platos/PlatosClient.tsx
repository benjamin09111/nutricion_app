"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import {
  ChefHat,
  Loader2,
  Globe,
  User,
  Trash2,
  Pencil,
  Sparkles,
  Search,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import mealSectionsData from "@/content/meal-sections.json";
import { fetchApi } from "@/lib/api-base";

type RecipeMetadata = {
  tags?: string[];
  mealSection?: string;
  customIngredientNames?: string[];
};

type RecipeSummary = {
  id: string;
  name: string;
  description?: string;
  preparation?: string;
  portions: number;
  proteins: number;
  carbs: number;
  lipids: number;
  calories: number;
  isPublic: boolean;
  isMine?: boolean;
  isAdopted?: boolean;
  imageUrl?: string;
  nutritionist?: { fullName?: string };
  metadata?: RecipeMetadata | null;
  ingredients?: { isMain: boolean; ingredient: { name: string } }[];
};

const MEAL_SECTIONS = [
  { value: "", label: "Sin sección" },
  ...mealSectionsData,
] as const;

export default function PlatosClient() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "community">("mine");

  const [filterTag, setFilterTag] = useState<string>("");
  const [filterMealSection, setFilterMealSection] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const [searchIngredient, setSearchIngredient] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const token = Cookies.get("auth_token") || "";

  const fetchRecipes = async () => {
    try {
      const response = await fetchApi("/recipes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = (await response.json()) as RecipeSummary[];
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching recipes", error);
    }
  };

  const addToMyRecipes = async (id: string) => {
    try {
      const response = await fetchApi(`/recipes/${id}/library`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo agregar el plato.");
      }
      toast.success("Plato agregado a Mis platos.");
      await fetchRecipes();
    } catch (error) {
      console.error("Error adding recipe to library", error);
      toast.error("No se pudo agregar el plato a Mis platos.");
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchRecipes();
      setIsLoading(false);
    };
    if (token) load();
  }, [token]);

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((r) => {
      // "Mis Platos" shows only dishes created by the user
      if (activeTab === "mine" && !r.isMine && !r.isAdopted) return false;
      // "Comunidad" shows only public dishes (including those from the user)
      if (activeTab === "community" && !r.isPublic) return false;

      // Filter by name
      if (searchName && !r.name.toLowerCase().includes(searchName.toLowerCase()))
        return false;

      // Filter by ingredient
      if (searchIngredient) {
        const hasIngredient = r.ingredients?.some((i) =>
          i.ingredient.name
            .toLowerCase()
            .includes(searchIngredient.toLowerCase())
        );
        if (!hasIngredient) return false;
      }

      const meta = r.metadata;
      const tags = meta?.tags ?? [];
      const mealSection = meta?.mealSection ?? "";
      if (filterTag && !tags.includes(filterTag)) return false;
      if (filterMealSection && mealSection !== filterMealSection) return false;
      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "calories_asc") return a.calories - b.calories;
      if (sortBy === "calories_desc") return b.calories - a.calories;
      if (sortBy === "protein_asc") return a.proteins - b.proteins;
      if (sortBy === "protein_desc") return b.proteins - a.proteins;
      return 0; // default (newest handled by API order usually)
    });
  }, [
    recipes,
    activeTab,
    filterTag,
    filterMealSection,
    searchName,
    searchIngredient,
    sortBy,
  ]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => (r.metadata?.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [recipes]);

  const deleteDish = async (id: string) => {
    try {
      const response = await fetchApi(`/recipes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Plato eliminado.");
      fetchRecipes();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el plato.");
    }
  };

  return (
    <ModuleLayout
      title="Platos"
      description="Crea y reutiliza platos con aportes nutricionales y opción de compartir a comunidad."
      step={{
        number: 2,
        label: "Platos Reutilizables",
        icon: ChefHat,
        color: "text-emerald-600",
      }}
    >
      <div className="space-y-6 mt-8">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={cn(
              "px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
              activeTab === "mine"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Mis platos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("community")}
            className={cn(
              "px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
              activeTab === "community"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Platos de la comunidad
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              {activeTab === "mine" && (
                <Button
                  variant="default"
                  onClick={() => router.push("/dashboard/platos/nuevo")}
                  className="inline-flex items-center gap-2"
                >
                  <ChefHat className="h-4 w-4" />
                  Crear plato
                </Button>
              )}

            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg pr-3 bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-hidden group">
                <div className="h-9 px-3 bg-slate-50 border-r border-slate-200 flex items-center group-focus-within:bg-emerald-50 transition-colors">
                  <ArrowUpDown className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500" />
                </div>
                <select
                  className="bg-transparent h-9 text-xs font-bold text-slate-600 uppercase tracking-wider focus:outline-none cursor-pointer pr-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Más recientes</option>
                  <option value="calories_asc">Menores kcal</option>
                  <option value="calories_desc">Mayores kcal</option>
                  <option value="protein_asc">Menores prot.</option>
                  <option value="protein_desc">Mayores prot.</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tag
                </span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                >
                  <option value="">Todos</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hora
                </span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  value={filterMealSection}
                  onChange={(e) => setFilterMealSection(e.target.value)}
                >
                  <option value="">Todas</option>
                  {MEAL_SECTIONS.filter(s => s.value !== "").map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-9 bg-white border-slate-200 focus:bg-white h-11 transition-all"
              />
            </div>
            <div className="relative">
              <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtrar por ingrediente base..."
                value={searchIngredient}
                onChange={(e) => setSearchIngredient(e.target.value)}
                className="pl-9 bg-white border-slate-200 focus:bg-white h-11 transition-all"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => {
              const fromCommunity = !!recipe.isPublic && !!recipe.nutritionist;
              const canAddToLibrary = !!recipe.isPublic && !recipe.isMine && !recipe.isAdopted;
              const meta = recipe.metadata;
              const tags = meta?.tags ?? [];
              const mealSection = meta?.mealSection ?? "";

              return (
                <div
                  key={recipe.id}
                  onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                  className={cn(
                    "p-5 rounded-3xl border border-slate-200 bg-white space-y-3 cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group",
                    expandedId === recipe.id && "border-emerald-500 ring-4 ring-emerald-500/5 shadow-xl scale-[1.01]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {recipe.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">
                        {recipe.preparation
                          ? recipe.preparation.split("\n")[0]?.replace(/^\d+\.\s*/, "") || "Sin preparación"
                          : "Sin preparación"}
                      </p>
                    </div>
                    {(recipe.isMine || isAdmin) ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/platos/${recipe.id}/editar`);
                          }}
                          className="p-2 h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDish(recipe.id);
                          }}
                          className="p-2 h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-full transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    ) : canAddToLibrary ? (
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToMyRecipes(recipe.id);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      >
                        <Plus className="h-4 w-4" />
                        Añadir
                      </Button>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <ArrowUpDown className={cn("h-4 w-4 transition-transform duration-500", expandedId === recipe.id ? "rotate-180" : "")} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                      expandedId === recipe.id 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                        : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-600/20"
                    )}>
                      {expandedId === recipe.id ? "Ocultar información" : "Ver información completa"}
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner group-hover:shadow-md transition-shadow">
                    <img
                      src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"}
                      alt={recipe.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";
                      }}
                    />
                    {!recipe.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
                         <ChefHat className="h-10 w-10 text-slate-400 opacity-20" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {mealSection ? (
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        {MEAL_SECTIONS.find((s) => s.value === mealSection)?.label ?? mealSection}
                      </span>
                    ) : null}
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase"
                      >
                        {t}
                      </span>
                    ))}
                    {recipe.isPublic ? (
                      <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Comunidad
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Privado
                      </span>
                    )}
                  </div>

                  {recipe.ingredients && recipe.ingredients.some(i => i.isMain) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Base</span>
                      <p className="text-xs font-bold text-slate-700 line-clamp-1">
                        {recipe.ingredients
                          .filter(i => i.isMain)
                          .map(i => i.ingredient.name)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="font-black text-slate-700">{recipe.calories} kcal</p>
                        <p className="text-slate-500">Calorías/porción</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="font-black text-slate-700">{recipe.proteins} g</p>
                        <p className="text-slate-500">Proteínas/porción</p>
                      </div>
                    </div>

                  {recipe.isMine ? (
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                      Creado por mí
                    </p>
                  ) : recipe.isAdopted ? (
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                      Guardado en mi repertorio
                    </p>
                  ) : fromCommunity ? (
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Compartido por: {recipe.nutritionist?.fullName || "Comunidad"}
                    </p>
                  ) : null}

                  {/* Expanded Content */}
                  {expandedId === recipe.id && (
                    <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {recipe.description && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900 uppercase">Descripción</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{recipe.description}</p>
                        </div>
                      )}
                      
                      {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900 uppercase">Ingredientes</h4>
                          <ul className="grid grid-cols-1 gap-1">
                            {recipe.ingredients.map((i, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", i.isMain ? "bg-emerald-500" : "bg-slate-300")} />
                                <span>{i.ingredient.name}</span>
                                {i.isMain && <span className="text-[10px] font-bold text-emerald-600 uppercase">(Principal)</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recipe.preparation && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-slate-900 uppercase">Preparación</h4>
                          <div className="space-y-2">
                            {recipe.preparation.split("\n").filter(step => step.trim()).map((step, idx) => (
                              <div key={idx} className="flex gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <p className="text-sm text-slate-600 leading-snug pt-0.5">
                                  {step.replace(/^\d+\.\s*/, "").trim()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="p-2 rounded-lg bg-orange-50 border border-orange-100">
                          <p className="font-black text-orange-700">{recipe.carbs} g</p>
                          <p className="text-orange-600/70 text-[10px] font-bold uppercase">Carbohidratos</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                          <p className="font-black text-blue-700">{recipe.lipids} g</p>
                          <p className="text-blue-600/70 text-[10px] font-bold uppercase">Lípidos</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
