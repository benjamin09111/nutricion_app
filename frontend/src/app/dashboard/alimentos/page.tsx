import { cookies } from "next/headers";
import { Suspense } from "react";
import FoodsClient from "./FoodsClient";
import { Ingredient, OFFICIAL_INGREDIENTS } from "@/features/foods";
import { fetchApi } from "@/lib/api-base";

async function getIngredients(): Promise<Ingredient[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;

  // En modo invitado o sin sesión activa, servir inmediatamente los 569 alimentos locales
  if (!token) {
    return OFFICIAL_INGREDIENTS;
  }

  try {
    const res = await fetchApi("/foods?tab=app&limit=1000", {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return OFFICIAL_INGREDIENTS;
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : OFFICIAL_INGREDIENTS;
  } catch (error) {
    console.error("Error fetching ingredients, falling back to local catalog:", error);
    return OFFICIAL_INGREDIENTS;
  }
}

export default async function FoodsPage() {
  const ingredients = await getIngredients();

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando ingredientes...</div>}>
        <FoodsClient initialData={ingredients} />
      </Suspense>
    </div>
  );
}
