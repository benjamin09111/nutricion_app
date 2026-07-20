import { cookies } from "next/headers";
import { Suspense } from "react";
import GruposHubClient from "./GruposHubClient";
import type { RecipeSummary } from "./GruposHubClient";
import { Ingredient } from "@/features/foods";
import { fetchApi } from "@/lib/api-base";

export const metadata = {
  title: "Grupos | NutriNet",
  description: "Gestiona tus grupos de ingredientes y recetas",
};

async function getIngredients(): Promise<Ingredient[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetchApi("/foods?tab=app&limit=100", {
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch ingredients:", res.status, res.statusText);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
}

async function getRecipes(): Promise<RecipeSummary[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetchApi("/recipes", {
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch recipes:", res.status, res.statusText);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

export default async function GruposPage() {
  const [ingredients, recipes] = await Promise.all([getIngredients(), getRecipes()]);

  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Cargando...</div>}>
      <GruposHubClient ingredients={ingredients} recipes={recipes} />
    </Suspense>
  );
}
