import { PlanSelector } from "@/components/memberships/PlanSelector";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

export const metadata = {
  title: "Elige tu plan | NutriNet",
  description: "Selecciona el plan adecuado antes de entrar al dashboard.",
};

export default function PlanPage() {
  return (
    <SubscriptionProvider>
      <PlanSelector />
    </SubscriptionProvider>
  );
}
