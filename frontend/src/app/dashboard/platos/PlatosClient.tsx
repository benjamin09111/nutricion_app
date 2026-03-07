"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Loader2,
  Globe,
  User,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Button } from "@/components/ui/Button";

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
  nutritionist?: { fullName?: string };
  metadata?: RecipeMetadata | null;
};

const MEAL_SECTIONS = [
  { value: "", label: "Sin sección" },
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "once", label: "Once" },
  { value: "cena", label: "Cena" },
  { value: "merienda", label: "Merienda" },
] as const;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export default function PlatosClient() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "community">("mine");

  const [filterTag, setFilterTag] = useState<string>("");
  const [filterMealSection, setFilterMealSection] = useState<string>("");

  const token = Cookies.get("auth_token") || "";

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${apiUrl}/recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = (await response.json()) as RecipeSummary[];
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching recipes", error);
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
    return recipes.filter((r) => {
      if (activeTab === "mine" && !r.isMine) return false;
      if (activeTab === "community" && r.isMine) return false;
      const meta = r.metadata;
      const tags = meta?.tags ?? [];
      const mealSection = meta?.mealSection ?? "";
      if (filterTag && !tags.includes(filterTag)) return false;
      if (filterMealSection && mealSection !== filterMealSection) return false;
      return true;
    });
  }, [recipes, activeTab, filterTag, filterMealSection]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => (r.metadata?.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [recipes]);

  const deleteDish = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/recipes/${id}`, {
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

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Button
            variant="default"
            onClick={() => router.push("/dashboard/platos/nuevo")}
            className="inline-flex items-center gap-2"
          >
            <ChefHat className="h-4 w-4" />
            Crear plato
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Filtrar por tag
              </span>
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 font-medium"
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
                Hora de comida
              </span>
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 font-medium"
                value={filterMealSection}
                onChange={(e) => setFilterMealSection(e.target.value)}
              >
                {MEAL_SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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
              const meta = recipe.metadata;
              const tags = meta?.tags ?? [];
              const mealSection = meta?.mealSection ?? "";

              return (
                <div
                  key={recipe.id}
                  className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3"
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
                    {recipe.isMine ? (
                      <Button
                        variant="ghost"
                        onClick={() => deleteDish(recipe.id)}
                        className="p-2 h-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
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

                  {fromCommunity && (
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Compartido por: {recipe.nutritionist?.fullName || "Comunidad"}
                    </p>
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
