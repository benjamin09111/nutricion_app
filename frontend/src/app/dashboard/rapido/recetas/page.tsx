import QuickRecipesClient from "./QuickRecipesClient";

export const metadata = {
  title: "Recetas Rápidas | NutriSaaS",
  description:
    "Módulo rápido para reunir alimentos e indicaciones y generar ideas de recetas en formato breve.",
};

export default function QuickRecipesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <QuickRecipesClient />
    </div>
  );
}

