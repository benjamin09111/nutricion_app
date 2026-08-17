import { PlanPageClient } from "./PlanPageClient";

export const metadata = {
  title: "Elige tu plan | NutriNet",
  description: "Selecciona el plan adecuado antes de entrar al dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlanPage() {
  return <PlanPageClient />;
}
