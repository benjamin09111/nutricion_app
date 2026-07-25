import QuickRecipesClient from "./QuickRecipesClient";

export const metadata = {
  title: "Recetas Rápidas | NutriNet",
  description:
    "Módulo rápido para reunir alimentos e indicaciones y generar ideas de recetas en formato breve.",
};

export default function QuickRecipesPage() {
  return <QuickRecipesClient />;
}
