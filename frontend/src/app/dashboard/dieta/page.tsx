import DietClient from "./DietClient";
import { getDietBaseFoods } from "@/lib/data-reader";

export const metadata = {
  title: "Generador de Dieta | NutriSaaS",
  description: "Crea dietas personalizadas basadas en patrones generales.",
};

export default function DietPage() {
  // Load initial "Social/Family Base" foods
  const baseFoods = getDietBaseFoods();

  return (
    <div className="h-full">
      <DietClient initialFoods={baseFoods} />
    </div>
  );
}
