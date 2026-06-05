"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { membershipService } from "@/features/memberships/services/membership.service";

export type SubscriptionPlan = "free" | "trial" | "pro";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

const PLAN_FEATURES = {
  free: { canGenerateDiet: false, canExportPDF: false, patientLimit: 1, hasBranding: false },
  trial: { canGenerateDiet: true, canExportPDF: true, patientLimit: 5, hasBranding: true },
  pro: { canGenerateDiet: true, canExportPDF: true, patientLimit: 999, hasBranding: true },
};

export interface MembershipState {
  plan: SubscriptionPlan;
  planName: string;
  status: string | null;
  subscriptionEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  daysRemaining: number | null;
  requiresPlanSelection: boolean;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    features: string[];
  } | null;
}

interface SubscriptionContextType extends MembershipState {
  refreshSubscription: () => Promise<void>;
  forceUpdatePlan: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
  features: { canGenerateDiet: boolean; canExportPDF: boolean; patientLimit: number; hasBranding: boolean };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

function planToFeatureKey(plan: SubscriptionPlan) {
  return {
    free: "free",
    trial: "trial",
    pro: "pro",
  }[plan] || "free";
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [planName, setPlanName] = useState<string>("Plan Gratuito");
  const [status, setStatus] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [requiresPlanSelection, setRequiresPlanSelection] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MembershipState["currentPlan"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  const computePlan = useCallback(
    (planData: MembershipState["currentPlan"], accPlan: string) => {
      if (!planData) {
        return accPlan?.toLowerCase() === "enterprise" ? "pro" : "free";
      }
      const slug = planData.slug.toLowerCase();
      if (slug.includes("free")) return "free";
      if (slug.includes("pro") || slug.includes("premium") || slug.includes("starter")) return "pro";
      return "free";
    },
    [],
  );

  const refreshSubscription = useCallback(async () => {
    try {
      const data = await membershipService.getStatus();
      const key = computePlan(data.currentPlan, data.accountPlan);
      setPlan(key as SubscriptionPlan);
      setPlanName(data.currentPlan?.name || "Plan Gratuito");
      setStatus(data.subscription?.status || null);
      setSubscriptionEndsAt(
        data.subscription?.endDate ? new Date(data.subscription.endDate) : null,
      );
      setCancelAtPeriodEnd(data.subscription?.cancelAtPeriodEnd || false);
      setDaysRemaining(data.subscription?.daysRemaining ?? null);
      setRequiresPlanSelection(data.requiresPlanSelection);
      setCurrentPlan(data.currentPlan);

      // Sync to localStorage for legacy consumers
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          user.plan = data.accountPlan || key;
          user.planName = data.currentPlan?.name || "Plan Gratuito";
          user.subscription = data.subscription;
          user.currentPlan = data.currentPlan;
          user.subscriptionEndsAt = data.subscription?.endDate || null;
          localStorage.setItem("user", JSON.stringify(user));
        } catch {}
      }
    } catch {
      // Fallback to localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.plan) {
            const backendPlan = user.plan.toLowerCase();
            setPlan(backendPlan === "enterprise" ? "pro" : backendPlan === "free" ? "free" : "pro");
          }
          if (user.planName) setPlanName(user.planName);
          if (user.subscription?.endDate) {
            setSubscriptionEndsAt(new Date(user.subscription.endDate));
          }
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, [computePlan]);

  // Load from localStorage immediately on mount, then refresh from backend
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.plan) {
          const backendPlan = user.plan.toLowerCase();
          if (backendPlan === "free") setPlan("free");
          else if (backendPlan === "pro" || backendPlan === "enterprise") setPlan("pro");
        }
        if (user.planName) setPlanName(user.planName);
        if (user.subscription?.endDate) {
          setSubscriptionEndsAt(new Date(user.subscription.endDate));
          const endDate = new Date(user.subscription.endDate);
          const days = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          setDaysRemaining(days > 0 ? days : null);
        }
        if (user.subscription?.cancelAtPeriodEnd) {
          setCancelAtPeriodEnd(true);
        }
      } catch {}
    }

    refreshSubscription();
  }, [refreshSubscription]);

  const forceUpdatePlan = (newPlan: SubscriptionPlan) => {
    setPlan(newPlan);
    toast.info(`[DEV] Plan cambiado a: ${newPlan.toUpperCase()}`);
  };

  const value = {
    plan,
    planName,
    status,
    subscriptionEndsAt,
    cancelAtPeriodEnd,
    daysRemaining,
    requiresPlanSelection,
    currentPlan,
    refreshSubscription,
    forceUpdatePlan,
    isLoading,
    features: PLAN_FEATURES[plan] || PLAN_FEATURES.free,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
