"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import GruposClient from "./GruposClient";
import RecipeGroupsClient from "./RecipeGroupsClient";
import type { Ingredient } from "@/features/foods";

type HubTab = "Ingredientes" | "Recetas";

export type RecipeSummary = {
  id: string;
  name: string;
  description?: string;
  portions: number;
  proteins: number;
  carbs: number;
  lipids: number;
  calories: number;
  metadata?: {
    mealSection?: string;
    tags?: string[];
  } | null;
  ingredients?: { ingredient: { name: string } }[];
};

interface GruposHubClientProps {
  ingredients: Ingredient[];
  recipes: RecipeSummary[];
}

export default function GruposHubClient({ ingredients, recipes }: GruposHubClientProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("Ingredientes");
  const [ingredientGroupsCount, setIngredientGroupsCount] = useState(0);
  const [recipeGroupsCount, setRecipeGroupsCount] = useState(0);

  useEffect(() => {
    const loadCounts = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const [ingredientRes, recipeRes] = await Promise.all([
          fetchApi("/ingredient-groups?type=INGREDIENT", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchApi("/ingredient-groups?type=RECIPE", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (ingredientRes.ok) {
          const ingredientData = await ingredientRes.json();
          setIngredientGroupsCount(Array.isArray(ingredientData) ? ingredientData.length : 0);
        }

        if (recipeRes.ok) {
          const recipeData = await recipeRes.json();
          setRecipeGroupsCount(Array.isArray(recipeData) ? recipeData.length : 0);
        }
      } catch (error) {
        console.error("Error loading group counts:", error);
      }
    };

    loadCounts();
  }, []);

  const totalGroupsCount = ingredientGroupsCount + recipeGroupsCount;

  const hubTabs = (
    <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
      {(["Ingredientes", "Recetas"] as const).map((tab) => {
        const locked = tab === "Recetas";

        return (
          <button
            key={tab}
            type="button"
            title={locked ? "Disponible en próximas actualizaciones" : undefined}
            onClick={() => {
              if (locked) return;
              setActiveTab(tab);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              activeTab === tab
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70"
                : locked
                  ? "cursor-not-allowed text-slate-400 opacity-80"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
          >
            {tab}
            {locked && <Lock size={14} />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {activeTab === "Ingredientes" ? (
        <GruposClient
          initialIngredients={ingredients}
          headerRight={hubTabs}
          freemiumGroupCount={totalGroupsCount}
          onGroupCountChange={setIngredientGroupsCount}
        />
      ) : (
        <RecipeGroupsClient
          initialRecipes={recipes}
          headerRight={hubTabs}
          freemiumGroupCount={totalGroupsCount}
          onGroupCountChange={setRecipeGroupsCount}
        />
      )}
    </div>
  );
}
