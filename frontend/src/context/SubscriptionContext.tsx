"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { membershipService } from "@/features/memberships/services/membership.service";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

export type SubscriptionPlan = "free" | "trial" | "pro";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

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
    key?: string;
    price: number;
    features: string[];
    entitlements?: Record<string, boolean | number>;
  } | null;
  usage?: {
    patientsActive: number;
    consultationsMonthly: number;
    pdfMonthly: number;
    aiMonthly: number;
  };
  billing?: {
    nextPaymentAt: string | null;
    nextPaymentAmount: number;
    currency: string;
  };
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
  const [usage, setUsage] = useState<MembershipState["usage"]>(undefined);
  const [billing, setBilling] = useState<MembershipState["billing"]>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const isDeveloper = role === "NUTRITIONIST_DEVELOPER";

  const getLimitValue = useCallback(
    (limitKey: string) => {
      const value = entitlements[limitKey];
      if (typeof value === "number") return value < 0 ? Number.POSITIVE_INFINITY : value;
      return 0;
    },
    [entitlements],
  );

  const planFeatures = useMemo(
    () => ({
      canGenerateDiet: !requiresPlanSelection,
      canExportPDF: getLimitValue("pdf.monthly.limit") > 0,
      patientLimit: Number.isFinite(getLimitValue("patients.active.limit"))
        ? getLimitValue("patients.active.limit")
        : 999,
      hasBranding:
        (currentPlan?.key || currentPlan?.slug || "").toLowerCase() !== "free",
    }),
    [currentPlan?.key, currentPlan?.slug, getLimitValue, requiresPlanSelection],
  );

  const applyStoredUserSnapshot = useCallback(() => {
    const user = getCurrentUser();
    if (!user) return;

    setRole(typeof user?.role === "string" ? user.role : null);
    if (user.plan || user.currentPlan?.key || user.currentPlan?.slug) {
      const backendPlan = String(user.currentPlan?.key || user.currentPlan?.slug || user.plan).toLowerCase();
      if (backendPlan === "free") setPlan("free");
      else if (backendPlan === "pro" || backendPlan === "premium" || backendPlan === "enterprise" || backendPlan === "iniciante") setPlan("pro");
    }
    if (user.planName) setPlanName(user.planName);
    if (user.currentPlan) setCurrentPlan(user.currentPlan as MembershipState["currentPlan"]);
    if (user.usage) setUsage(user.usage as MembershipState["usage"]);
    if (user.billing) setBilling(user.billing as MembershipState["billing"]);
    if (user.subscription?.endDate) {
      setSubscriptionEndsAt(new Date(user.subscription.endDate));
      const endDate = new Date(user.subscription.endDate);
      const days = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(days > 0 ? days : null);
    }
    if (user.subscription?.cancelAtPeriodEnd) {
      setCancelAtPeriodEnd(true);
    }
    if (user.membershipSelected === true || user.requiresPlanSelection === false) {
      setRequiresPlanSelection(false);
    }
  }, []);

  const computePlan = useCallback(
    (planData: MembershipState["currentPlan"], accPlan: string) => {
      const slug = (planData?.key || planData?.slug || accPlan || "").toLowerCase();

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
    let resolvedRole: string | null = null;

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
      setUsage(data.usage);
      setBilling(data.billing);

      try {
        const token = getAuthToken();
        if (!token) return;

        const meResponse = await fetchApi("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          const user = meData?.user || meData;
          resolvedRole = typeof user?.role === "string" ? user.role : null;
          setRole(resolvedRole);
          setCurrentUser(user);
        }
      } catch {}

      const user = getCurrentUser();
      if (user) {
        if (resolvedRole === null) {
          setRole(typeof user?.role === "string" ? user.role : null);
        }
        user.plan = data.accountPlan || key;
        user.planName = data.currentPlan?.name || "Plan Gratuito";
        user.subscription = data.subscription;
        user.currentPlan = data.currentPlan;
        user.subscriptionEndsAt = data.subscription?.endDate || null;
        user.entitlements = data.entitlements || {};
        user.usage = data.usage || null;
        user.billing = data.billing || null;
        setCurrentUser(user);
      }
    } catch {
      // Fallback to localStorage
      setEntitlements({});
      setRequiresPlanSelection(true);
      applyStoredUserSnapshot();
    } finally {
      setIsLoading(false);
    }
  }, [applyStoredUserSnapshot, computePlan]);

  const can = useCallback(
    (featureKey: string) => {
      const user = getCurrentUser();
      if (user) {
        const role = String(user?.role || "").toUpperCase();
        if (
          role === "ADMIN" ||
          role === "ADMIN_MASTER" ||
          role === "ADMIN_GENERAL" ||
          role === "WORKER"
        ) {
          return true;
        }
      }

      if (featureKey === "membership.selected") {
        return !requiresPlanSelection;
      }

      if (featureKey === "clinical_calculator.access") {
        return currentPlan?.key !== "free";
      }

      if (featureKey === "food_groups.access") {
        return currentPlan?.key !== "free";
      }

      if (featureKey === "appointments.access") {
        return currentPlan?.key === "pro";
      }

      if (featureKey === "google_calendar.sync") {
        return currentPlan?.key === "pro";
      }

      if (featureKey === "ai.autofill.access") {
        return currentPlan?.key === "pro";
      }

      if (featureKey === "nutritionist_portal.access") {
        return currentPlan?.key === "pro";
      }

      if (featureKey === "sii_invoices.access") {
        return currentPlan?.key === "pro";
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
    [currentPlan, entitlements, planFeatures, requiresPlanSelection],
  );

  const limit = useCallback(
    (limitKey: string) => {
      const value = entitlements[limitKey];
      if (typeof value === "number") {
        return value < 0 ? Number.POSITIVE_INFINITY : value;
      }

      if (limitKey === "patientLimit") {
        return planFeatures.patientLimit;
      }

      return 0;
    },
    [entitlements, planFeatures.patientLimit],
  );

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.membershipSelected === true || user?.requiresPlanSelection === false) {
      setRequiresPlanSelection(false);
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
    usage,
    billing,
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
