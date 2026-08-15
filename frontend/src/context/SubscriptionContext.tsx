"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { membershipService } from "@/features/memberships/services/membership.service";
import { fetchApi } from "@/lib/api-base";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

export type SubscriptionPlan = "free" | "trial" | "pro";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
type Entitlements = Record<string, boolean | number>;

const getValidatedEntitlements = (value: unknown): Entitlements | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const entries = Object.entries(value);
  if (entries.length === 0 || entries.some(([, entry]) =>
    typeof entry !== "boolean" && !(typeof entry === "number" && Number.isFinite(entry)),
  )) {
    return null;
  }

  return Object.fromEntries(entries) as Entitlements;
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
  hasPendingTransfer: boolean;
  entitlements: Entitlements;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    key?: string;
    price: number;
    features: string[];
    entitlements?: Entitlements;
  } | null;
  usage?: {
    patientsActive: number;
    consultationsUsed: number;
    followupsPrivateActive: number;
    pdfUsed: number;
    aiUsed: number;
    calculatorUsed: number;
    foodGroupsUsed?: number;
    creationsUsed?: number;
    dietCreationsUsed?: number;
  };
  billing?: {
    nextPaymentAt: string | null;
    nextPaymentAmount: number;
    currency: string;
  };
}

interface SubscriptionContextType extends MembershipState {
  refreshSubscription: (opts?: { silent?: boolean }) => Promise<void>;
  forceUpdatePlan: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
  membershipError: string | null;
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
  const [hasPendingTransfer, setHasPendingTransfer] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements>({});
  const [currentPlan, setCurrentPlan] = useState<MembershipState["currentPlan"]>(null);
  const [usage, setUsage] = useState<MembershipState["usage"]>(undefined);
  const [billing, setBilling] = useState<MembershipState["billing"]>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [membershipError, setMembershipError] = useState<string | null>(null);
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
    if (!user) return false;

    const storedEntitlements = getValidatedEntitlements(user.currentPlan?.entitlements);
    if (storedEntitlements) setEntitlements(storedEntitlements);

    // El rol NO se toma del snapshot local (cookie manipulable); sólo llega
    // desde `/auth/me`. Aquí sólo se rehidratan datos de plan para la UI.
    if (user.plan || user.currentPlan?.key || user.currentPlan?.slug) {
      const backendPlan = String(user.currentPlan?.key || user.currentPlan?.slug || user.plan).toLowerCase();
      if (backendPlan === "free" || backendPlan === "freemium") setPlan("free");
      else setPlan("pro");
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

    return Boolean(storedEntitlements);
  }, []);

  const computePlan = useCallback(
    (planData: MembershipState["currentPlan"], accPlan: string) => {
      const slug = (planData?.key || planData?.slug || accPlan || "").toLowerCase();

      if (slug.includes("trial")) return "trial";
      if (slug.includes("free") || slug.includes("gratis") || slug.includes("freemium")) return "free";
      if (
        slug.includes("pro") ||
        slug.includes("premium") ||
        slug.includes("starter") ||
        slug.includes("enterprise") ||
        slug.includes("plus")
      ) {
        return "pro";
      }

      return planData ? "pro" : "free";
    },
    [],
  );

  const refreshSubscription = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setIsLoading(true);
    }
    setMembershipError(null);
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
      setHasPendingTransfer(data.hasPendingTransfer || false);
       const fetchedEntitlements =
         getValidatedEntitlements(data.entitlements) ??
         getValidatedEntitlements(data.currentPlan?.entitlements) ??
         {};
       setEntitlements(fetchedEntitlements);
      setCurrentPlan(data.currentPlan);
      setUsage(data.usage);
      setBilling(data.billing);

      try {
        const meResponse = await fetchApi("/auth/me");
        if (meResponse.ok) {
          const meData = await meResponse.json();
          const user = meData?.user || meData;
          setRole(typeof user?.role === "string" ? user.role : null);
          setCurrentUser(user);
        }
      } catch {}

      const user = getCurrentUser();
      if (user) {
        // Sin fallback de rol: si `/auth/me` no respondió, el rol queda nulo.
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
    } catch (error) {
      console.error("Error al obtener estado de suscripción:", error);
      const restoredStoredEntitlements = applyStoredUserSnapshot();
      if (!restoredStoredEntitlements) {
        setMembershipError("No se pudo verificar tu membresía. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyStoredUserSnapshot, computePlan]);

  useEffect(() => {
    const hasSnapshot = applyStoredUserSnapshot();
    if (hasSnapshot) {
      setIsLoading(false);
      void refreshSubscription({ silent: true });
    } else {
      void refreshSubscription({ silent: false });
    }
  }, [applyStoredUserSnapshot, refreshSubscription]);

  const forceUpdatePlan = useCallback((newPlan: SubscriptionPlan) => {
    setPlan(newPlan);
  }, []);

  const can = useCallback(
    (featureKey: string) => {
      if (isDeveloper) return true;
      return Boolean(entitlements[featureKey]);
    },
    [entitlements, isDeveloper],
  );

  const limit = useCallback(
    (limitKey: string) => {
      if (isDeveloper) return Number.POSITIVE_INFINITY;
      return getLimitValue(limitKey);
    },
    [getLimitValue, isDeveloper],
  );

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        planName,
        role,
        status,
        subscriptionEndsAt,
        cancelAtPeriodEnd,
        daysRemaining,
        requiresPlanSelection,
        hasPendingTransfer,
        entitlements,
        currentPlan,
        usage,
        billing,
        refreshSubscription,
        forceUpdatePlan,
        isLoading,
        membershipError,
        isDeveloper,
        features: planFeatures,
        can,
        limit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription debe ser usado dentro de SubscriptionProvider",
    );
  }
  return context;
}
