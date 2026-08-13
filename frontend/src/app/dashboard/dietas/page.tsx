import DietasClient from "./DietasClient";
import { getDietBaseFoods } from "@/lib/data-reader";

export const metadata = {
  title: "Dietas | NutriNet",
  description: "Crea plantillas de dietas generales clasificadas por categorías y alimentos, calcula macronutrientes y expórtalas a JSON o PDF.",
};

export default function DietasPage() {
  const baseFoods = getDietBaseFoods();

  return (
    <div className="h-full">
      <DietasClient initialFoods={baseFoods} />
    </div>
  );
}
