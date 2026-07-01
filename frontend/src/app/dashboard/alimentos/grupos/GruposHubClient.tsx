"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
        {(["Ingredientes", "Recetas"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
              activeTab === tab
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Ingredientes" ? (
        <GruposClient initialIngredients={ingredients} />
      ) : (
        <RecipeGroupsClient initialRecipes={recipes} />
      )}
    </div>
  );
}
