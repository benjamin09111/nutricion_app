"use client";

import { OnboardingWizard } from "@/components/pagos/OnboardingWizard";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { getCurrentUser } from "@/lib/current-user";

export function PlanPageClient() {
  const user = getCurrentUser();
  const email = user?.email || "";
  const fullName = user?.nutritionist?.fullName || "";

  return (
    <SubscriptionProvider>
      <OnboardingWizard
        nutritionistEmail={email}
        nutritionistName={fullName}
      />
    </SubscriptionProvider>
  );
}
