import { PlanSelector } from "@/components/memberships/PlanSelector";

export const metadata = {
  title: "Elige tu plan | NutriNet",
  description: "Selecciona el plan adecuado antes de entrar al dashboard.",
};

export default function PlanPage() {
  return <PlanSelector />;
}
