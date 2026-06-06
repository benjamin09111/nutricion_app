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
  role: string | null;
  status: string | null;
  subscriptionEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  daysRemaining: number | null;
  requiresPlanSelection: boolean;
  entitlements: Record<string, boolean | number>;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    features: string[];
    entitlements?: Record<string, boolean | number>;
  } | null;
}

interface SubscriptionContextType extends MembershipState {
  refreshSubscription: () => Promise<void>;
  forceUpdatePlan: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
  isDeveloper: boolean;
  features: { canGenerateDiet: boolean; canExportPDF: boolean; patientLimit: number; hasBranding: boolean };
  can: (featureKey: string) => boolean;
  limit: (limitKey: string) => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [planName, setPlanName] = useState<string>("Plan Gratuito");
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [requiresPlanSelection, setRequiresPlanSelection] = useState(false);
  const [entitlements, setEntitlements] = useState<Record<string, boolean | number>>({});
  const [currentPlan, setCurrentPlan] = useState<MembershipState["currentPlan"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  const isDeveloper = role === "NUTRITIONIST_DEVELOPER";

  const computePlan = useCallback(
    (planData: MembershipState["currentPlan"], accPlan: string) => {
      const slug = (planData?.slug || accPlan || "").toLowerCase();

      if (slug.includes("trial")) return "trial";
      if (slug.includes("free")) return "free";
      if (
        slug.includes("pro") ||
        slug.includes("premium") ||
        slug.includes("starter") ||
        slug.includes("enterprise")
      ) {
        return "pro";
      }

      return planData ? "pro" : "free";
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
      setEntitlements(data.entitlements || {});
      setCurrentPlan(data.currentPlan);

      // Sync to localStorage for legacy consumers
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setRole(typeof user?.role === "string" ? user.role : null);
          user.plan = data.accountPlan || key;
          user.planName = data.currentPlan?.name || "Plan Gratuito";
          user.subscription = data.subscription;
          user.currentPlan = data.currentPlan;
          user.subscriptionEndsAt = data.subscription?.endDate || null;
          user.entitlements = data.entitlements || {};
          localStorage.setItem("user", JSON.stringify(user));
        } catch {}
      }
    } catch {
      // Fallback to localStorage
      setRequiresPlanSelection(true);
      setEntitlements({});
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setRole(typeof user?.role === "string" ? user.role : null);
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

  const can = useCallback(
    (featureKey: string) => {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const role = String(user?.role || "").toUpperCase();
          if (role === "ADMIN" || role === "ADMIN_MASTER" || role === "ADMIN_GENERAL") {
            return true;
          }
        } catch {}
      }

      if (featureKey === "membership.selected") {
        return !requiresPlanSelection;
      }

      if (featureKey === "canGenerateDiet") {
        return planFeatures.canGenerateDiet;
      }

      if (featureKey === "canExportPDF") {
        return planFeatures.canExportPDF;
      }

      if (featureKey === "patientLimit") {
        return planFeatures.patientLimit > 0;
      }

      if (featureKey === "hasBranding") {
        return planFeatures.hasBranding;
      }

      const value = entitlements[featureKey];
      return value === true || (typeof value === "number" && value > 0);
    },
    [entitlements, planFeatures, requiresPlanSelection],
  );

  const limit = useCallback(
    (limitKey: string) => {
      const value = entitlements[limitKey];
      if (typeof value === "number") {
        return value;
      }

      if (limitKey === "patientLimit") {
        return planFeatures.patientLimit;
      }

      return 0;
    },
    [entitlements, planFeatures.patientLimit],
  );

  // Load from localStorage immediately on mount, then refresh from backend
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setRole(typeof user?.role === "string" ? user.role : null);
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
    entitlements,
    currentPlan,
    role,
    refreshSubscription,
    forceUpdatePlan,
    isLoading,
    features: planFeatures,
    isDeveloper,
    can,
    limit,
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
