import { cookies } from "next/headers";
import { Suspense } from "react";
import GruposClient from "./GruposClient";
import { Ingredient } from "@/features/foods";
import { fetchApi } from "@/lib/api-base";

export const metadata = {
  title: "Mis Grupos | NutriNet",
  description: "Gestiona tus grupos de ingredientes",
};

async function getIngredients(): Promise<Ingredient[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetchApi("/foods?tab=app&limit=5000", {
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

export default async function GruposPage() {
  const ingredients = await getIngredients();

  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Cargando...</div>}>
      <GruposClient initialIngredients={ingredients} />
    </Suspense>
  );
}
