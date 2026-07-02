"use client";

import { useSubscription } from "@/context/SubscriptionContext";
import { OnboardingWizard } from "@/components/pagos/OnboardingWizard";
import { getCurrentUser } from "@/lib/current-user";

export function MembershipGate({ children }: { children: React.ReactNode }) {
  const { requiresPlanSelection, isLoading } = useSubscription();
  const user = getCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">
            Verificando tu membresía...
          </p>
        </div>
      </div>
    );
  }

  if (requiresPlanSelection) {
    return (
      <OnboardingWizard
        nutritionistEmail={user?.email || ""}
        nutritionistName={user?.nutritionist?.fullName}
      />
    );
  }

  return <>{children}</>;
}
