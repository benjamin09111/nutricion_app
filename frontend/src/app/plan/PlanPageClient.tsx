"use client";

import { PlanSelector } from "@/components/memberships/PlanSelector";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

export function PlanPageClient() {
  return (
    <SubscriptionProvider>
      <PlanSelector />
    </SubscriptionProvider>
  );
}
