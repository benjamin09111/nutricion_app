import { cookies } from "next/headers";
import { Suspense } from "react";
import FoodsClient from "./FoodsClient";
import { Ingredient } from "@/features/foods";
import { fetchApi } from "@/lib/api-base";

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

export default async function FoodsPage() {
  const ingredients = await getIngredients();

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between px-2">
        <div>
          <h2
            id="foods-page-title"
            className="text-3xl font-black tracking-tight text-slate-900"
          >
            Catálogo de Ingredientes
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Gestiona los ingredientes base para tus pautas y recetas.
          </p>
        </div>
        {/* Action button moved to Client Component */}
      </div>

      {/* Main Content: Filters + Table consolidated in Client Component */}
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando ingredientes...</div>}>
        <FoodsClient initialData={ingredients} />
      </Suspense>
    </div>
  );
}
