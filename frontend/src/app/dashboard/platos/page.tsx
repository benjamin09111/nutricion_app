import { DishesClient } from "./DishesClient";

export const metadata = {
  title: "Platos y Recetas | NutriSaaS",
  description: "Gestiona tus platos y recetas personalizadas.",
};

export default function RecipesPage() {
  return <DishesClient />;
}
